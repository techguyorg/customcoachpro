import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute, transformRows, transformRow } from '../db';
import { authenticate, AuthenticatedRequest, requireCoach } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { sendEmail, generatePlanAssignedEmail, EmailOptions } from '../services/email';

const router = Router();

// ==================== Settings ====================

// Get coach settings/profile
router.get('/settings', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await queryOne<Record<string, unknown>>(
    `SELECT cp.*, p.full_name, p.email, p.avatar_url, p.bio, p.phone
     FROM coach_profiles cp
     LEFT JOIN profiles p ON cp.user_id = p.user_id
     WHERE cp.user_id = @userId`,
    { userId: req.user!.id }
  );

  if (!data) {
    // Return empty structure if no profile exists
    return res.json({
      profile: { full_name: '', bio: '', phone: '', avatar_url: '' },
      coachProfile: {}
    });
  }

  // Use arrayFields parameter to ensure these are always arrays
  transformRow(data, [], ['specializations', 'certifications']);

  // Return in nested format expected by frontend
  res.json({
    profile: {
      full_name: data.full_name || '',
      bio: data.bio || '',
      phone: data.phone || '',
      avatar_url: data.avatar_url || '',
    },
    coachProfile: {
      specializations: data.specializations || [],
      certifications: data.certifications || [],
      experience_years: data.experience_years || 0,
      hourly_rate: data.hourly_rate,
      currency: data.currency || 'USD',
      max_clients: data.max_clients || 50,
      is_accepting_clients: data.is_accepting_clients ?? true,
      email_checkin_received: data.email_checkin_received ?? true,
      email_plan_assigned: data.email_plan_assigned ?? true,
    }
  });
}));

// Update coach settings/profile
router.put('/settings', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Support both nested (frontend) and flat (legacy) request formats
  const profile = req.body.profile || {};
  const coachProfile = req.body.coachProfile || req.body;

  const {
    specializations,
    certifications,
    experience_years,
    hourly_rate,
    currency,
    max_clients,
    is_accepting_clients,
    email_checkin_received,
    email_plan_assigned,
  } = coachProfile;

  const { full_name, bio, phone, avatar_url } = profile;

  // Convert arrays to JSON strings - always serialize even if empty array
  const specializationsJson = Array.isArray(specializations) ? JSON.stringify(specializations) : null;
  const certificationsJson = Array.isArray(certifications) ? JSON.stringify(certifications) : null;

  // Upsert coach_profiles using MERGE
  // Use direct assignment for arrays (not COALESCE) to allow saving empty arrays
  await execute(
    `MERGE coach_profiles AS target
     USING (SELECT @userId AS user_id) AS source
     ON target.user_id = source.user_id
     WHEN MATCHED THEN
       UPDATE SET
         specializations = CASE WHEN @hasSpecs = 1 THEN @specializations ELSE target.specializations END,
         certifications = CASE WHEN @hasCerts = 1 THEN @certifications ELSE target.certifications END,
         experience_years = COALESCE(@experienceYears, target.experience_years),
         hourly_rate = COALESCE(@hourlyRate, target.hourly_rate),
         currency = COALESCE(@currency, target.currency),
         max_clients = COALESCE(@maxClients, target.max_clients),
         is_accepting_clients = COALESCE(@isAccepting, target.is_accepting_clients),
         email_checkin_received = COALESCE(@emailCheckin, target.email_checkin_received),
         email_plan_assigned = COALESCE(@emailPlan, target.email_plan_assigned),
         updated_at = GETUTCDATE()
     WHEN NOT MATCHED THEN
       INSERT (id, user_id, specializations, certifications, experience_years, hourly_rate, currency, max_clients, is_accepting_clients, email_checkin_received, email_plan_assigned, created_at, updated_at)
       VALUES (NEWID(), @userId, @specializations, @certifications, @experienceYears, @hourlyRate, COALESCE(@currency, 'USD'), COALESCE(@maxClients, 50), COALESCE(@isAccepting, 1), COALESCE(@emailCheckin, 1), COALESCE(@emailPlan, 1), GETUTCDATE(), GETUTCDATE());`,
    {
      userId: req.user!.id,
      specializations: specializationsJson,
      certifications: certificationsJson,
      hasSpecs: specializations !== undefined ? 1 : 0,
      hasCerts: certifications !== undefined ? 1 : 0,
      experienceYears: experience_years ?? null,
      hourlyRate: hourly_rate ?? null,
      currency: currency ?? null,
      maxClients: max_clients ?? null,
      isAccepting: is_accepting_clients ?? null,
      emailCheckin: email_checkin_received ?? null,
      emailPlan: email_plan_assigned ?? null,
    }
  );

  // Upsert profiles table with full_name, bio, phone, avatar_url
  // (Some users may not yet have a profiles row; UPDATE would silently affect 0 rows.)
  if (full_name !== undefined || bio !== undefined || phone !== undefined || avatar_url !== undefined) {
    await execute(
      `MERGE profiles AS target
       USING (SELECT @userId AS user_id) AS source
       ON target.user_id = source.user_id
       WHEN MATCHED THEN
         UPDATE SET
           full_name = CASE WHEN @fullNameProvided = 1 THEN @fullName ELSE target.full_name END,
           bio = CASE WHEN @bioProvided = 1 THEN @bio ELSE target.bio END,
           phone = CASE WHEN @phoneProvided = 1 THEN @phone ELSE target.phone END,
           avatar_url = CASE WHEN @avatarUrlProvided = 1 THEN @avatarUrl ELSE target.avatar_url END,
           updated_at = GETUTCDATE()
       WHEN NOT MATCHED THEN
         INSERT (id, user_id, full_name, email, avatar_url, bio, phone, created_at, updated_at)
         VALUES (NEWID(), @userId, COALESCE(@fullName, ''), '', @avatarUrl, @bio, @phone, GETUTCDATE(), GETUTCDATE());`,
      {
        userId: req.user!.id,
        fullName: full_name ?? null,
        bio: bio ?? null,
        phone: phone ?? null,
        avatarUrl: avatar_url ?? null,
        fullNameProvided: full_name !== undefined ? 1 : 0,
        bioProvided: bio !== undefined ? 1 : 0,
        phoneProvided: phone !== undefined ? 1 : 0,
        avatarUrlProvided: avatar_url !== undefined ? 1 : 0,
      }
    );
  }

  res.json({ message: 'Settings updated' });
}));

// ==================== Clients ====================

// Get all clients for coach
router.get('/clients', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clients = await queryAll<Record<string, unknown>>(
    `SELECT ccr.id as relationship_id, ccr.status, ccr.started_at, ccr.notes,
            p.user_id as client_id, p.full_name, p.email, p.avatar_url, p.bio, p.phone,
            p.date_of_birth, p.gender,
            cp.fitness_level, cp.current_weight_kg, cp.target_weight_kg, cp.height_cm,
            cp.fitness_goals, cp.dietary_restrictions, cp.medical_conditions,
            cp.subscription_status
     FROM coach_client_relationships ccr
     JOIN profiles p ON ccr.client_id = p.user_id
     LEFT JOIN client_profiles cp ON ccr.client_id = cp.user_id
     WHERE ccr.coach_id = @coachId AND ccr.status = 'active'
     ORDER BY p.full_name`,
    { coachId: req.user!.id }
  );

  // Reshape to nested format expected by frontend
  const reshaped = clients.map(c => {
    // Parse JSON fields before reshaping
    const fitnessGoals = c.fitness_goals ? 
      (typeof c.fitness_goals === 'string' ? 
        (() => { try { return JSON.parse(c.fitness_goals as string); } catch { return []; } })() 
        : c.fitness_goals) 
      : [];
    const dietaryRestrictions = c.dietary_restrictions ? 
      (typeof c.dietary_restrictions === 'string' ? 
        (() => { try { return JSON.parse(c.dietary_restrictions as string); } catch { return []; } })() 
        : c.dietary_restrictions) 
      : [];

    return {
      id: c.relationship_id,
      client_id: c.client_id,
      status: c.status,
      started_at: c.started_at,
      notes: c.notes,
      profile: {
        full_name: c.full_name,
        email: c.email,
        avatar_url: c.avatar_url,
        bio: c.bio,
        phone: c.phone,
        date_of_birth: c.date_of_birth,
        gender: c.gender,
      },
      client_profile: {
        height_cm: c.height_cm,
        current_weight_kg: c.current_weight_kg,
        target_weight_kg: c.target_weight_kg,
        fitness_level: c.fitness_level,
        fitness_goals: Array.isArray(fitnessGoals) ? fitnessGoals : [],
        dietary_restrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
        medical_conditions: c.medical_conditions,
        subscription_status: c.subscription_status,
      }
    };
  });
  
  res.json(reshaped);
}));

// Get single client detail
router.get('/clients/:clientId', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;

  // Verify coach-client relationship
  const relationship = await queryOne(
    `SELECT id FROM coach_client_relationships 
     WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
    { coachId: req.user!.id, clientId }
  );

  if (!relationship) {
    throw ForbiddenError('You are not coaching this client');
  }

  const client = await queryOne<Record<string, unknown>>(
    `SELECT p.user_id as client_id, p.full_name, p.email, p.avatar_url, p.bio, p.phone,
            p.date_of_birth, p.gender,
            cp.fitness_level, cp.current_weight_kg, cp.target_weight_kg, cp.height_cm,
            cp.fitness_goals, cp.dietary_restrictions, cp.medical_conditions
     FROM profiles p
     LEFT JOIN client_profiles cp ON p.user_id = cp.user_id
     WHERE p.user_id = @clientId`,
    { clientId }
  );

  if (client) {
    transformRow(client, ['fitness_goals', 'dietary_restrictions']);
  }

  res.json(client);
}));

// ==================== Analytics ====================

// Get coach analytics
router.get('/analytics', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const totalClients = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM coach_client_relationships WHERE coach_id = @coachId AND status = @status',
    { coachId: req.user!.id, status: 'active' }
  );

  const pendingCheckins = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM client_checkins cc 
     JOIN coach_client_relationships ccr ON cc.client_id = ccr.client_id 
     WHERE ccr.coach_id = @coachId AND cc.status = 'submitted'`,
    { coachId: req.user!.id }
  );

  const pendingRequests = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM coaching_requests WHERE coach_id = @coachId AND status = @status',
    { coachId: req.user!.id, status: 'pending' }
  );

  const activeAssignments = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM plan_assignments 
     WHERE coach_id = @coachId AND status = 'active'`,
    { coachId: req.user!.id }
  );

  const recentCheckins = await queryAll(
    `SELECT TOP 5 cc.id, cc.checkin_date, cc.status, p.full_name as client_name
     FROM client_checkins cc
     JOIN coach_client_relationships ccr ON cc.client_id = ccr.client_id
     JOIN profiles p ON cc.client_id = p.user_id
     WHERE ccr.coach_id = @coachId
     ORDER BY cc.created_at DESC`,
    { coachId: req.user!.id }
  );

  res.json({
    totalClients: totalClients?.count || 0,
    pendingCheckins: pendingCheckins?.count || 0,
    pendingRequests: pendingRequests?.count || 0,
    activeAssignments: activeAssignments?.count || 0,
    recentCheckins,
  });
}));

// ==================== Marketplace ====================

// Get coaches for marketplace (public)
router.get('/marketplace', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { specialization, min_rate, max_rate, search } = req.query;

  let whereClause = 'WHERE cp.is_accepting_clients = 1';
  const params: Record<string, unknown> = {};

  if (search) {
    whereClause += ' AND (p.full_name LIKE @search OR p.bio LIKE @search)';
    params.search = `%${search}%`;
  }
  if (min_rate) {
    whereClause += ' AND cp.hourly_rate >= @minRate';
    params.minRate = parseFloat(min_rate as string);
  }
  if (max_rate) {
    whereClause += ' AND cp.hourly_rate <= @maxRate';
    params.maxRate = parseFloat(max_rate as string);
  }

  const coaches = await queryAll<Record<string, unknown>>(
    `SELECT cp.user_id, cp.specializations, cp.certifications, cp.experience_years,
            cp.hourly_rate, cp.currency, cp.rating, cp.total_reviews, cp.is_accepting_clients,
            p.full_name, p.avatar_url, p.bio
     FROM coach_profiles cp
     JOIN profiles p ON cp.user_id = p.user_id
     ${whereClause}
     ORDER BY cp.rating DESC, cp.total_reviews DESC`,
    params
  );

  // Transform JSON fields to arrays - ensure they are always arrays
  transformRows(coaches, ['specializations', 'certifications']);
  
  // Reshape data to include profile object that frontend expects
  const reshapedCoaches = coaches.map(c => ({
    user_id: c.user_id,
    specializations: Array.isArray(c.specializations) ? c.specializations : [],
    certifications: Array.isArray(c.certifications) ? c.certifications : [],
    experience_years: c.experience_years,
    hourly_rate: c.hourly_rate,
    currency: c.currency,
    rating: c.rating,
    total_reviews: c.total_reviews,
    is_accepting_clients: c.is_accepting_clients,
    profile: {
      full_name: c.full_name,
      avatar_url: c.avatar_url,
      bio: c.bio,
    },
  }));

  // Filter by specialization after parsing (since it's stored as JSON)
  let filteredCoaches = reshapedCoaches;
  if (specialization) {
    filteredCoaches = reshapedCoaches.filter((c) => {
      return c.specializations && c.specializations.includes(specialization as string);
    });
  }

  res.json(filteredCoaches);
}));

// Get unique specializations
router.get('/specializations', asyncHandler(async (_req, res: Response) => {
  const coaches = await queryAll<Record<string, unknown>>(
    `SELECT DISTINCT specializations FROM coach_profiles WHERE specializations IS NOT NULL`
  );

  const allSpecs = new Set<string>();
  coaches.forEach((c) => {
    const specs = JSON.parse((c.specializations as string) || '[]');
    specs.forEach((s: string) => allSpecs.add(s));
  });

  res.json(Array.from(allSpecs).sort());
}));

// ==================== Coaching Requests ====================

// Get requests for coach (as receiver)
router.get('/requests', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;

  let whereClause = 'WHERE cr.coach_id = @coachId';
  const params: Record<string, unknown> = { coachId: req.user!.id };

  if (status) {
    whereClause += ' AND cr.status = @status';
    params.status = status;
  }

  const requests = await queryAll<Record<string, unknown>>(
    `SELECT cr.*, p.full_name as client_name, p.email as client_email, p.avatar_url as client_avatar,
            cp.fitness_level, cp.fitness_goals
     FROM coaching_requests cr
     JOIN profiles p ON cr.client_id = p.user_id
     LEFT JOIN client_profiles cp ON cr.client_id = cp.user_id
     ${whereClause}
     ORDER BY cr.created_at DESC`,
    params
  );

  transformRows(requests, ['fitness_goals']);
  res.json(requests);
}));

// Get my sent requests (as client)
router.get('/requests/my', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const requests = await queryAll<Record<string, unknown>>(
    `SELECT cr.*, p.full_name as coach_name, p.avatar_url as coach_avatar,
            cp.specializations, cp.hourly_rate, cp.currency
     FROM coaching_requests cr
     JOIN profiles p ON cr.coach_id = p.user_id
     LEFT JOIN coach_profiles cp ON cr.coach_id = cp.user_id
     WHERE cr.client_id = @clientId
     ORDER BY cr.created_at DESC`,
    { clientId: req.user!.id }
  );

  transformRows(requests, ['specializations']);
  res.json(requests);
}));

// Send coaching request (as client)
router.post('/requests', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Support both snake_case (coach_id) and camelCase (coachId) from frontend
  const coach_id = req.body.coach_id || req.body.coachId;
  const { message } = req.body;

  if (!coach_id) {
    throw BadRequestError('Coach ID is required');
  }

  // Check if already has pending request
  const existing = await queryOne(
    `SELECT id FROM coaching_requests 
     WHERE client_id = @clientId AND coach_id = @coachId AND status = 'pending'`,
    { clientId: req.user!.id, coachId: coach_id }
  );

  if (existing) {
    throw BadRequestError('You already have a pending request to this coach');
  }

  // Check if already has active relationship
  const activeRelationship = await queryOne(
    `SELECT id FROM coach_client_relationships 
     WHERE client_id = @clientId AND coach_id = @coachId AND status = 'active'`,
    { clientId: req.user!.id, coachId: coach_id }
  );

  if (activeRelationship) {
    throw BadRequestError('You are already being coached by this coach');
  }

  const id = uuidv4();
  await execute(
    `INSERT INTO coaching_requests (id, client_id, coach_id, message, status)
     VALUES (@id, @clientId, @coachId, @message, 'pending')`,
    { id, clientId: req.user!.id, coachId: coach_id, message }
  );

  // Create notification for coach
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id)
     VALUES (@id, @userId, 'coaching_request', 'New Coaching Request', 
             'You have a new coaching request', 'coaching_request', @refId)`,
    { id: uuidv4(), userId: coach_id, refId: id }
  );

  res.status(201).json({ id, message: 'Request sent' });
}));

// Respond to coaching request (accept/decline)
router.post('/requests/:id/respond', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, response_message } = req.body;

  if (!action || !['accept', 'decline'].includes(action)) {
    throw BadRequestError('Action must be accept or decline');
  }

  const request = await queryOne<{ client_id: string; coach_id: string; status: string }>(
    'SELECT client_id, coach_id, status FROM coaching_requests WHERE id = @id',
    { id }
  );

  if (!request) {
    throw NotFoundError('Coaching request');
  }

  if (request.coach_id !== req.user!.id) {
    throw ForbiddenError('You can only respond to your own requests');
  }

  if (request.status !== 'pending') {
    throw BadRequestError('This request has already been processed');
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined';

  await execute(
    `UPDATE coaching_requests 
     SET status = @status, coach_response = @response, responded_at = GETUTCDATE(), updated_at = GETUTCDATE()
     WHERE id = @id`,
    { id, status: newStatus, response: response_message }
  );

  // If accepted, create coach-client relationship
  if (action === 'accept') {
    await execute(
      `INSERT INTO coach_client_relationships (id, coach_id, client_id, status, started_at)
       VALUES (@id, @coachId, @clientId, 'active', GETUTCDATE())`,
      { id: uuidv4(), coachId: req.user!.id, clientId: request.client_id }
    );

    // Update client_profiles with coach_id
    await execute(
      `UPDATE client_profiles SET coach_id = @coachId, updated_at = GETUTCDATE() WHERE user_id = @clientId`,
      { coachId: req.user!.id, clientId: request.client_id }
    );
  }

  // Notify client
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id)
     VALUES (@id, @userId, 'coaching_request_response', @title, @message, 'coaching_request', @refId)`,
    {
      id: uuidv4(),
      userId: request.client_id,
      title: action === 'accept' ? 'Request Accepted!' : 'Request Declined',
      message: action === 'accept' ? 'Your coaching request has been accepted' : 'Your coaching request has been declined',
      refId: id,
    }
  );

  res.json({ message: `Request ${newStatus}` });
}));

// Cancel coaching request (as client)
router.put('/requests/:id/cancel', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const request = await queryOne<{ client_id: string; status: string }>(
    'SELECT client_id, status FROM coaching_requests WHERE id = @id',
    { id }
  );

  if (!request) {
    throw NotFoundError('Coaching request');
  }

  if (request.client_id !== req.user!.id) {
    throw ForbiddenError('You can only cancel your own requests');
  }

  if (request.status !== 'pending') {
    throw BadRequestError('Can only cancel pending requests');
  }

  await execute(
    `UPDATE coaching_requests SET status = 'cancelled', updated_at = GETUTCDATE() WHERE id = @id`,
    { id }
  );

  res.json({ message: 'Request cancelled' });
}));

// ==================== Notes ====================

// Get all notes for coach
router.get('/notes', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { client_id, note_type } = req.query;

  let whereClause = 'WHERE coach_id = @coachId';
  const params: Record<string, unknown> = { coachId: req.user!.id };

  if (client_id) {
    whereClause += ' AND client_id = @clientId';
    params.clientId = client_id;
  }
  if (note_type) {
    whereClause += ' AND note_type = @noteType';
    params.noteType = note_type;
  }

  const notes = await queryAll<Record<string, unknown>>(
    `SELECT n.*, p.full_name as client_name
     FROM coach_client_notes n
     JOIN profiles p ON n.client_id = p.user_id
     ${whereClause}
     ORDER BY n.is_pinned DESC, n.created_at DESC`,
    params
  );

  transformRows(notes, ['tags']);
  res.json(notes);
}));

// Get notes for specific client
router.get('/clients/:clientId/notes', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;

  const notes = await queryAll<Record<string, unknown>>(
    `SELECT * FROM coach_client_notes 
     WHERE coach_id = @coachId AND client_id = @clientId
     ORDER BY is_pinned DESC, created_at DESC`,
    { coachId: req.user!.id, clientId }
  );

  transformRows(notes, ['tags']);
  res.json(notes);
}));

// Create note
router.post('/notes', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { client_id, title, content, note_type = 'general', tags, priority, reference_date, is_pinned } = req.body;

  if (!client_id || !content) {
    throw BadRequestError('Client ID and content are required');
  }

  // Verify relationship
  const relationship = await queryOne(
    `SELECT id FROM coach_client_relationships 
     WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
    { coachId: req.user!.id, clientId: client_id }
  );

  if (!relationship) {
    throw ForbiddenError('You are not coaching this client');
  }

  const id = uuidv4();
  await execute(
    `INSERT INTO coach_client_notes (id, coach_id, client_id, title, content, note_type, tags, priority, reference_date, is_pinned)
     VALUES (@id, @coachId, @clientId, @title, @content, @noteType, @tags, @priority, @referenceDate, @isPinned)`,
    {
      id,
      coachId: req.user!.id,
      clientId: client_id,
      title,
      content,
      noteType: note_type,
      tags: tags ? JSON.stringify(tags) : null,
      priority,
      referenceDate: reference_date,
      isPinned: is_pinned ? 1 : 0,
    }
  );

  const note = await queryOne('SELECT * FROM coach_client_notes WHERE id = @id', { id });
  res.status(201).json(note);
}));

// Update note
router.put('/notes/:id', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, note_type, tags, priority, reference_date, is_pinned } = req.body;

  const existing = await queryOne<{ coach_id: string }>(
    'SELECT coach_id FROM coach_client_notes WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Note');
  }

  if (existing.coach_id !== req.user!.id) {
    throw ForbiddenError('You can only edit your own notes');
  }

  await execute(
    `UPDATE coach_client_notes SET
       title = COALESCE(@title, title),
       content = COALESCE(@content, content),
       note_type = COALESCE(@noteType, note_type),
       tags = COALESCE(@tags, tags),
       priority = COALESCE(@priority, priority),
       reference_date = COALESCE(@referenceDate, reference_date),
       is_pinned = COALESCE(@isPinned, is_pinned),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      title,
      content,
      noteType: note_type,
      tags: tags ? JSON.stringify(tags) : null,
      priority,
      referenceDate: reference_date,
      isPinned: is_pinned !== undefined ? (is_pinned ? 1 : 0) : null,
    }
  );

  const note = await queryOne('SELECT * FROM coach_client_notes WHERE id = @id', { id });
  res.json(note);
}));

// Delete note
router.delete('/notes/:id', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ coach_id: string }>(
    'SELECT coach_id FROM coach_client_notes WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Note');
  }

  if (existing.coach_id !== req.user!.id) {
    throw ForbiddenError('You can only delete your own notes');
  }

  await execute('DELETE FROM coach_client_notes WHERE id = @id', { id });
  res.json({ message: 'Note deleted' });
}));

// ==================== Invite Client ====================

router.post('/invite', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, message } = req.body;

  if (!email) {
    throw BadRequestError('Email is required');
  }

  // Check if user exists
  const existingUser = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM profiles WHERE LOWER(email) = LOWER(@email)',
    { email }
  );

  if (existingUser) {
    // Check if already coaching or has pending request
    const existingRelation = await queryOne(
      `SELECT id FROM coach_client_relationships 
       WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
      { coachId: req.user!.id, clientId: existingUser.user_id }
    );

    if (existingRelation) {
      throw BadRequestError('This user is already your client');
    }

    // Create invitation notification
    await execute(
      `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id, data)
       VALUES (@id, @userId, 'coach_invitation', 'Coach Invitation', @message, 'coach', @coachId, @data)`,
      {
        id: uuidv4(),
        userId: existingUser.user_id,
        message: `You have been invited to be coached by ${req.user!.fullName || 'a coach'}`,
        coachId: req.user!.id,
        data: JSON.stringify({ coach_id: req.user!.id, invitation_message: message }),
      }
    );
  }

  // Send invitation email
  const coachProfile = await queryOne<{ full_name: string }>(
    'SELECT full_name FROM profiles WHERE user_id = @userId',
    { userId: req.user!.id }
  );

  await sendEmail({
    to: email,
    subject: `Coaching Invitation from ${coachProfile?.full_name || 'a coach'}`,
    html: `
      <h2>You've been invited!</h2>
      <p>${coachProfile?.full_name || 'A coach'} has invited you to join them on CustomCoachPro.</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <p>Click <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/signup">here</a> to sign up and get started!</p>
    `,
  });

  res.json({ message: 'Invitation sent' });
}));

// ==================== Assignments ====================

// Get all assignments (coach's clients)
router.get('/assignments', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { client_id, plan_type, status } = req.query;

  let whereClause = 'WHERE pa.coach_id = @coachId';
  const params: Record<string, unknown> = { coachId: req.user!.id };

  if (client_id) {
    whereClause += ' AND pa.client_id = @clientId';
    params.clientId = client_id;
  }
  if (plan_type) {
    whereClause += ' AND pa.plan_type = @planType';
    params.planType = plan_type;
  }
  if (status) {
    whereClause += ' AND pa.status = @status';
    params.status = status;
  }

  const assignments = await queryAll(
    `SELECT pa.*, 
            p.full_name as client_name,
            wt.name as workout_plan_name,
            dp.name as diet_plan_name
     FROM plan_assignments pa
     JOIN profiles p ON pa.client_id = p.user_id
     LEFT JOIN workout_templates wt ON pa.workout_template_id = wt.id
     LEFT JOIN diet_plans dp ON pa.diet_plan_id = dp.id
     ${whereClause}
     ORDER BY pa.created_at DESC`,
    params
  );

  res.json(assignments);
}));

// Create assignment
router.post('/assignments', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    client_id,
    plan_type,
    workout_template_id,
    diet_plan_id,
    start_date,
    end_date,
    coach_notes,
  } = req.body;

  if (!client_id || !plan_type) {
    throw BadRequestError('Client ID and plan type are required');
  }

  if (plan_type === 'workout' && !workout_template_id) {
    throw BadRequestError('Workout template ID is required for workout plans');
  }

  if (plan_type === 'diet' && !diet_plan_id) {
    throw BadRequestError('Diet plan ID is required for diet plans');
  }

  // Verify relationship
  const relationship = await queryOne(
    `SELECT id FROM coach_client_relationships 
     WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
    { coachId: req.user!.id, clientId: client_id }
  );

  if (!relationship) {
    throw ForbiddenError('You are not coaching this client');
  }

  // Deactivate previous active assignment of same type
  await execute(
    `UPDATE plan_assignments SET status = 'completed', updated_at = GETUTCDATE()
     WHERE client_id = @clientId AND coach_id = @coachId AND plan_type = @planType AND status = 'active'`,
    { clientId: client_id, coachId: req.user!.id, planType: plan_type }
  );

  const id = uuidv4();
  await execute(
    `INSERT INTO plan_assignments (id, coach_id, client_id, plan_type, workout_template_id, diet_plan_id, start_date, end_date, coach_notes, status)
     VALUES (@id, @coachId, @clientId, @planType, @workoutId, @dietId, @startDate, @endDate, @notes, 'active')`,
    {
      id,
      coachId: req.user!.id,
      clientId: client_id,
      planType: plan_type,
      workoutId: workout_template_id,
      dietId: diet_plan_id,
      startDate: start_date || new Date().toISOString().split('T')[0],
      endDate: end_date,
      notes: coach_notes,
    }
  );

  // Get plan name for notification
  let planName = 'a new plan';
  if (workout_template_id) {
    const wt = await queryOne<{ name: string }>('SELECT name FROM workout_templates WHERE id = @id', { id: workout_template_id });
    planName = wt?.name || planName;
  } else if (diet_plan_id) {
    const dp = await queryOne<{ name: string }>('SELECT name FROM diet_plans WHERE id = @id', { id: diet_plan_id });
    planName = dp?.name || planName;
  }

  // Notify client
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id)
     VALUES (@id, @userId, 'plan_assigned', 'New Plan Assigned', @message, 'plan_assignment', @refId)`,
    {
      id: uuidv4(),
      userId: client_id,
      message: `Your coach has assigned you ${planName}`,
      refId: id,
    }
  );

  // Send email if client has email notifications enabled
  const clientProfile = await queryOne<{ email: string; email_plan_assigned: boolean }>(
    `SELECT p.email, cp.email_plan_assigned 
     FROM profiles p
     LEFT JOIN client_profiles cp ON p.user_id = cp.user_id
     WHERE p.user_id = @clientId`,
    { clientId: client_id }
  );

  if (clientProfile?.email_plan_assigned !== false) {
    const coachProfile = await queryOne<{ full_name: string }>('SELECT full_name FROM profiles WHERE user_id = @userId', { userId: req.user!.id });
    await sendEmail(generatePlanAssignedEmail(clientProfile!.email, coachProfile?.full_name || 'Your Coach', planName, plan_type));
  }

  const assignment = await queryOne('SELECT * FROM plan_assignments WHERE id = @id', { id });
  res.status(201).json(assignment);
}));

// Update assignment
router.put('/assignments/:id', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { end_date, coach_notes, status } = req.body;

  const existing = await queryOne<{ coach_id: string }>(
    'SELECT coach_id FROM plan_assignments WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Assignment');
  }

  if (existing.coach_id !== req.user!.id) {
    throw ForbiddenError('You can only update your own assignments');
  }

  await execute(
    `UPDATE plan_assignments SET
       end_date = COALESCE(@endDate, end_date),
       coach_notes = COALESCE(@notes, coach_notes),
       status = COALESCE(@status, status),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    { id, endDate: end_date, notes: coach_notes, status }
  );

  const assignment = await queryOne('SELECT * FROM plan_assignments WHERE id = @id', { id });
  res.json(assignment);
}));

// Get client's workout logs (for coach)
router.get('/clients/:clientId/workout-logs', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;
  const { limit = 20 } = req.query;

  // Verify relationship
  const relationship = await queryOne(
    `SELECT id FROM coach_client_relationships 
     WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
    { coachId: req.user!.id, clientId }
  );

  if (!relationship) {
    throw ForbiddenError('You are not coaching this client');
  }

  const logs = await queryAll(
    `SELECT TOP ${parseInt(limit as string)} 
            wl.*, wt.name as template_name
     FROM workout_logs wl
     LEFT JOIN workout_templates wt ON wl.template_id = wt.id
     WHERE wl.client_id = @clientId
     ORDER BY wl.workout_date DESC`,
    { clientId }
  );

  res.json(logs);
}));

// Get client's workout stats (for coach)
router.get('/clients/:clientId/workout-stats', authenticate, requireCoach, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;
  const { days = 30 } = req.query;

  // Verify relationship
  const relationship = await queryOne(
    `SELECT id FROM coach_client_relationships 
     WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
    { coachId: req.user!.id, clientId }
  );

  if (!relationship) {
    throw ForbiddenError('You are not coaching this client');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string));

  const totalWorkouts = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_logs 
     WHERE client_id = @clientId AND status = 'completed' AND workout_date >= @startDate`,
    { clientId, startDate: startDate.toISOString() }
  );

  const avgDuration = await queryOne<{ avg: number }>(
    `SELECT AVG(duration_minutes) as avg FROM workout_logs 
     WHERE client_id = @clientId AND status = 'completed' AND workout_date >= @startDate`,
    { clientId, startDate: startDate.toISOString() }
  );

  const avgEffort = await queryOne<{ avg: number }>(
    `SELECT AVG(perceived_effort) as avg FROM workout_logs 
     WHERE client_id = @clientId AND perceived_effort IS NOT NULL AND workout_date >= @startDate`,
    { clientId, startDate: startDate.toISOString() }
  );

  res.json({
    totalWorkouts: totalWorkouts?.count || 0,
    avgDuration: Math.round(avgDuration?.avg || 0),
    avgEffort: Math.round((avgEffort?.avg || 0) * 10) / 10,
  });
}));

export default router;
