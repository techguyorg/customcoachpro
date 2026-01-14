import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute, transformRows } from '../db';
import { authenticate, AuthenticatedRequest, requireCoach } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { sendEmail, generateCheckinReceivedEmail, generateCheckinReviewedEmail, EmailOptions } from '../services/email';

const router = Router();

// ==================== Client Check-ins ====================

// Get all check-ins for current user (legacy endpoint)
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const checkins = await queryAll<Record<string, unknown>>(
    'SELECT * FROM client_checkins WHERE client_id = @clientId ORDER BY checkin_date DESC',
    { clientId: req.user!.id }
  );
  res.json(checkins);
}));

// Get my check-ins (as client)
router.get('/my', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, limit = 50 } = req.query;

  let whereClause = 'WHERE client_id = @clientId';
  const params: Record<string, unknown> = { clientId: req.user!.id };

  if (status) {
    whereClause += ' AND status = @status';
    params.status = status;
  }

  const checkins = await queryAll<Record<string, unknown>>(
    `SELECT TOP ${parseInt(limit as string)} 
            cc.*, p.full_name as coach_name
     FROM client_checkins cc
     LEFT JOIN profiles p ON cc.reviewed_by = p.user_id
     ${whereClause}
     ORDER BY cc.checkin_date DESC`,
    params
  );

  transformRows(checkins, ['photo_ids']);
  res.json(checkins);
}));

// Get check-ins for coach's clients
router.get('/coach', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { client_id, status, limit = 100 } = req.query;

  let whereClause = `WHERE ccr.coach_id = @coachId AND ccr.status = 'active'`;
  const params: Record<string, unknown> = { coachId: req.user!.id };

  if (client_id) {
    whereClause += ' AND cc.client_id = @clientId';
    params.clientId = client_id;
  }
  if (status) {
    whereClause += ' AND cc.status = @status';
    params.status = status;
  }

  const checkins = await queryAll<Record<string, unknown>>(
    `SELECT TOP ${parseInt(limit as string)}
            cc.*, p.full_name as client_name, p.avatar_url as client_avatar
     FROM client_checkins cc
     JOIN coach_client_relationships ccr ON cc.client_id = ccr.client_id
     JOIN profiles p ON cc.client_id = p.user_id
     ${whereClause}
     ORDER BY cc.created_at DESC`,
    params
  );

  transformRows(checkins, ['photo_ids']);
  res.json(checkins);
}));

// Get single check-in by ID
router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const checkin = await queryOne<{ 
    client_id: string; 
    photo_ids?: string;
    [key: string]: unknown;
  }>(
    `SELECT cc.*, p.full_name as client_name, p2.full_name as reviewer_name,
            cm.weight_kg, cm.body_fat_pct, cm.waist_cm
     FROM client_checkins cc
     JOIN profiles p ON cc.client_id = p.user_id
     LEFT JOIN profiles p2 ON cc.reviewed_by = p2.user_id
     LEFT JOIN client_measurements cm ON cc.measurement_id = cm.id
     WHERE cc.id = @id`,
    { id }
  );

  if (!checkin) {
    throw NotFoundError('Check-in');
  }

  // Check access - client can see own, coach can see their clients'
  const isOwn = checkin.client_id === req.user!.id;
  let isCoachOfClient = false;

  if (!isOwn && req.user!.roles.includes('coach')) {
    const relationship = await queryOne(
      `SELECT id FROM coach_client_relationships 
       WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
      { coachId: req.user!.id, clientId: checkin.client_id }
    );
    isCoachOfClient = !!relationship;
  }

  if (!isOwn && !isCoachOfClient && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You do not have access to this check-in');
  }

  if (checkin.photo_ids) {
    try {
      (checkin as Record<string, unknown>).photo_ids = JSON.parse(checkin.photo_ids as string);
    } catch {
      (checkin as Record<string, unknown>).photo_ids = [];
    }
  }

  res.json(checkin);
}));

// Create new check-in (submit)
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    diet_adherence,
    workout_adherence,
    energy_level,
    sleep_quality,
    mood_rating,
    stress_level,
    general_notes,
    diet_notes,
    workout_notes,
    wins,
    challenges,
    photo_ids,
    measurement_id,
    period_start,
    period_end,
  } = req.body;

  const id = uuidv4();

  // Get client's coach if any
  const clientProfile = await queryOne<{ coach_id: string }>(
    'SELECT coach_id FROM client_profiles WHERE user_id = @userId',
    { userId: req.user!.id }
  );

  await execute(
    `INSERT INTO client_checkins (
       id, client_id, coach_id, diet_adherence, workout_adherence, 
       energy_level, sleep_quality, mood_rating, stress_level, 
       general_notes, diet_notes, workout_notes, wins, challenges,
       photo_ids, measurement_id, period_start, period_end,
       status, submitted_at
     ) VALUES (
       @id, @clientId, @coachId, @dietAdherence, @workoutAdherence,
       @energyLevel, @sleepQuality, @moodRating, @stressLevel,
       @generalNotes, @dietNotes, @workoutNotes, @wins, @challenges,
       @photoIds, @measurementId, @periodStart, @periodEnd,
       'submitted', GETUTCDATE()
     )`,
    {
      id,
      clientId: req.user!.id,
      coachId: clientProfile?.coach_id,
      dietAdherence: diet_adherence,
      workoutAdherence: workout_adherence,
      energyLevel: energy_level,
      sleepQuality: sleep_quality,
      moodRating: mood_rating,
      stressLevel: stress_level,
      generalNotes: general_notes,
      dietNotes: diet_notes,
      workoutNotes: workout_notes,
      wins,
      challenges,
      photoIds: photo_ids ? JSON.stringify(photo_ids) : null,
      measurementId: measurement_id,
      periodStart: period_start,
      periodEnd: period_end,
    }
  );

  // Notify coach if exists
  if (clientProfile?.coach_id) {
    await execute(
      `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id)
       VALUES (@id, @userId, 'checkin_submitted', 'New Check-in', @message, 'checkin', @refId)`,
      {
        id: uuidv4(),
        userId: clientProfile.coach_id,
        message: `${req.user!.fullName || 'A client'} has submitted a check-in`,
        refId: id,
      }
    );

    // Send email if coach has email notifications enabled
    const coachProfile = await queryOne<{ email: string; email_checkin_received: boolean }>(
      `SELECT p.email, cp.email_checkin_received 
       FROM profiles p
       LEFT JOIN coach_profiles cp ON p.user_id = cp.user_id
       WHERE p.user_id = @coachId`,
      { coachId: clientProfile.coach_id }
    );

    if (coachProfile?.email_checkin_received !== false) {
      await sendEmail(generateCheckinReceivedEmail(
        coachProfile!.email,
        req.user!.fullName || 'A client'
      ));
    }
  }

  res.status(201).json({ id, message: 'Check-in submitted' });
}));

// Save check-in as draft
router.post('/draft', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    diet_adherence,
    workout_adherence,
    energy_level,
    sleep_quality,
    mood_rating,
    stress_level,
    general_notes,
    diet_notes,
    workout_notes,
    wins,
    challenges,
    photo_ids,
    period_start,
    period_end,
  } = req.body;

  const id = uuidv4();

  // Get client's coach if any
  const clientProfile = await queryOne<{ coach_id: string }>(
    'SELECT coach_id FROM client_profiles WHERE user_id = @userId',
    { userId: req.user!.id }
  );

  await execute(
    `INSERT INTO client_checkins (
       id, client_id, coach_id, diet_adherence, workout_adherence, 
       energy_level, sleep_quality, mood_rating, stress_level, 
       general_notes, diet_notes, workout_notes, wins, challenges,
       photo_ids, period_start, period_end, status
     ) VALUES (
       @id, @clientId, @coachId, @dietAdherence, @workoutAdherence,
       @energyLevel, @sleepQuality, @moodRating, @stressLevel,
       @generalNotes, @dietNotes, @workoutNotes, @wins, @challenges,
       @photoIds, @periodStart, @periodEnd, 'draft'
     )`,
    {
      id,
      clientId: req.user!.id,
      coachId: clientProfile?.coach_id,
      dietAdherence: diet_adherence,
      workoutAdherence: workout_adherence,
      energyLevel: energy_level,
      sleepQuality: sleep_quality,
      moodRating: mood_rating,
      stressLevel: stress_level,
      generalNotes: general_notes,
      dietNotes: diet_notes,
      workoutNotes: workout_notes,
      wins,
      challenges,
      photoIds: photo_ids ? JSON.stringify(photo_ids) : null,
      periodStart: period_start,
      periodEnd: period_end,
    }
  );

  res.status(201).json({ id, message: 'Draft saved' });
}));

// Update draft check-in
router.put('/:id/draft', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    diet_adherence,
    workout_adherence,
    energy_level,
    sleep_quality,
    mood_rating,
    stress_level,
    general_notes,
    diet_notes,
    workout_notes,
    wins,
    challenges,
    photo_ids,
    period_start,
    period_end,
    submit,
  } = req.body;

  const existing = await queryOne<{ client_id: string; status: string }>(
    'SELECT client_id, status FROM client_checkins WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Check-in');
  }

  if (existing.client_id !== req.user!.id) {
    throw ForbiddenError('You can only edit your own check-ins');
  }

  if (existing.status !== 'draft') {
    throw BadRequestError('Can only update draft check-ins');
  }

  const newStatus = submit ? 'submitted' : 'draft';

  await execute(
    `UPDATE client_checkins SET
       diet_adherence = COALESCE(@dietAdherence, diet_adherence),
       workout_adherence = COALESCE(@workoutAdherence, workout_adherence),
       energy_level = COALESCE(@energyLevel, energy_level),
       sleep_quality = COALESCE(@sleepQuality, sleep_quality),
       mood_rating = COALESCE(@moodRating, mood_rating),
       stress_level = COALESCE(@stressLevel, stress_level),
       general_notes = COALESCE(@generalNotes, general_notes),
       diet_notes = COALESCE(@dietNotes, diet_notes),
       workout_notes = COALESCE(@workoutNotes, workout_notes),
       wins = COALESCE(@wins, wins),
       challenges = COALESCE(@challenges, challenges),
       photo_ids = COALESCE(@photoIds, photo_ids),
       period_start = COALESCE(@periodStart, period_start),
       period_end = COALESCE(@periodEnd, period_end),
       status = @status,
       submitted_at = ${submit ? 'GETUTCDATE()' : 'submitted_at'},
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      dietAdherence: diet_adherence,
      workoutAdherence: workout_adherence,
      energyLevel: energy_level,
      sleepQuality: sleep_quality,
      moodRating: mood_rating,
      stressLevel: stress_level,
      generalNotes: general_notes,
      dietNotes: diet_notes,
      workoutNotes: workout_notes,
      wins,
      challenges,
      photoIds: photo_ids ? JSON.stringify(photo_ids) : null,
      periodStart: period_start,
      periodEnd: period_end,
      status: newStatus,
    }
  );

  res.json({ message: submit ? 'Check-in submitted' : 'Draft updated' });
}));

// ==================== Coach Review ====================

// Review check-in (as coach)
router.post('/:id/review', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { coach_feedback, coach_rating, next_checkin_date } = req.body;

  const checkin = await queryOne<{ client_id: string; coach_id: string; status: string }>(
    'SELECT client_id, coach_id, status FROM client_checkins WHERE id = @id',
    { id }
  );

  if (!checkin) {
    throw NotFoundError('Check-in');
  }

  // Verify coach-client relationship
  const relationship = await queryOne(
    `SELECT id FROM coach_client_relationships 
     WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
    { coachId: req.user!.id, clientId: checkin.client_id }
  );

  if (!relationship) {
    throw ForbiddenError('You are not coaching this client');
  }

  if (checkin.status !== 'submitted') {
    throw BadRequestError('Can only review submitted check-ins');
  }

  await execute(
    `UPDATE client_checkins SET
       coach_feedback = @feedback,
       coach_rating = @rating,
       next_checkin_date = @nextDate,
       status = 'reviewed',
       reviewed_at = GETUTCDATE(),
       reviewed_by = @reviewedBy,
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      feedback: coach_feedback,
      rating: coach_rating,
      nextDate: next_checkin_date,
      reviewedBy: req.user!.id,
    }
  );

  // Notify client
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id)
     VALUES (@id, @userId, 'checkin_reviewed', 'Check-in Reviewed', 'Your coach has reviewed your check-in', 'checkin', @refId)`,
    { id: uuidv4(), userId: checkin.client_id, refId: id }
  );

  // Send email if client has email notifications enabled
  const clientProfile = await queryOne<{ email: string; email_checkin_reviewed: boolean }>(
    `SELECT p.email, cp.email_checkin_reviewed 
     FROM profiles p
     LEFT JOIN client_profiles cp ON p.user_id = cp.user_id
     WHERE p.user_id = @clientId`,
    { clientId: checkin.client_id }
  );

  if (clientProfile?.email_checkin_reviewed !== false) {
    const coachProfile = await queryOne<{ full_name: string }>('SELECT full_name FROM profiles WHERE user_id = @userId', { userId: req.user!.id });
    await sendEmail(generateCheckinReviewedEmail(
      clientProfile!.email,
      coachProfile?.full_name || 'Your Coach',
      coach_feedback
    ));
  }

  res.json({ message: 'Check-in reviewed' });
}));

// ==================== Templates ====================

// Get check-in templates
router.get('/templates', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isCoach = req.user!.roles.includes('coach');

  let whereClause = 'WHERE 1=1';
  const params: Record<string, unknown> = {};

  if (isCoach) {
    // Coach sees their own templates
    whereClause += ' AND coach_id = @userId';
    params.userId = req.user!.id;
  } else {
    // Client sees templates assigned to them or their coach's templates
    const clientProfile = await queryOne<{ coach_id: string }>(
      'SELECT coach_id FROM client_profiles WHERE user_id = @userId',
      { userId: req.user!.id }
    );

    if (clientProfile?.coach_id) {
      whereClause += ' AND (coach_id = @coachId AND (client_id IS NULL OR client_id = @userId))';
      params.coachId = clientProfile.coach_id;
      params.userId = req.user!.id;
    } else {
      // No coach, return empty
      res.json([]);
      return;
    }
  }

  const templates = await queryAll<Record<string, unknown>>(
    `SELECT * FROM checkin_templates ${whereClause} AND is_active = 1 ORDER BY name`,
    params
  );

  transformRows(templates, ['required_fields']);
  res.json(templates);
}));

// Create check-in template (coach only)
router.post('/templates', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, required_fields, frequency_days, client_id } = req.body;

  if (!name) {
    throw BadRequestError('Name is required');
  }

  const id = uuidv4();
  await execute(
    `INSERT INTO checkin_templates (id, coach_id, client_id, name, description, required_fields, frequency_days)
     VALUES (@id, @coachId, @clientId, @name, @description, @requiredFields, @frequencyDays)`,
    {
      id,
      coachId: req.user!.id,
      clientId: client_id,
      name,
      description,
      requiredFields: JSON.stringify(required_fields || []),
      frequencyDays: frequency_days || 7,
    }
  );

  const template = await queryOne('SELECT * FROM checkin_templates WHERE id = @id', { id });
  res.status(201).json(template);
}));

// Get my assigned template (as client)
router.get('/my-template', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientProfile = await queryOne<{ coach_id: string }>(
    'SELECT coach_id FROM client_profiles WHERE user_id = @userId',
    { userId: req.user!.id }
  );

  if (!clientProfile?.coach_id) {
    res.json(null);
    return;
  }

  // First try to find client-specific template
  let template = await queryOne<Record<string, unknown>>(
    `SELECT * FROM checkin_templates 
     WHERE coach_id = @coachId AND client_id = @clientId AND is_active = 1`,
    { coachId: clientProfile.coach_id, clientId: req.user!.id }
  );

  // If not found, use coach's default template
  if (!template) {
    template = await queryOne<Record<string, unknown>>(
      `SELECT * FROM checkin_templates 
       WHERE coach_id = @coachId AND client_id IS NULL AND is_active = 1`,
      { coachId: clientProfile.coach_id }
    );
  }

  if (template) {
    transformRows([template], ['required_fields']);
  }

  res.json(template);
}));

export default router;
