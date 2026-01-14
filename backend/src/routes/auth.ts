import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { queryOne, queryAll, execute, query } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError, UnauthorizedError } from '../middleware/errorHandler';
import { sendEmail } from '../services/email';
import { emailVerificationEmail, passwordResetEmail } from '../services/email-templates';

const router = Router();

// Helper functions
function generateToken(userId: string, email: string, expiresIn: string): string {
  return jwt.sign({ userId, email }, config.jwt.secret, { expiresIn } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return uuidv4() + '-' + uuidv4();
}

async function createAuthTokens(userId: string, email: string) {
  const accessToken = generateToken(userId, email, config.jwt.accessTokenExpiry);
  const refreshToken = generateRefreshToken();
  
  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await execute(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at) 
     VALUES (@id, @userId, @token, @expiresAt)`,
    { id: uuidv4(), userId, token: refreshToken, expiresAt }
  );
  
  return { accessToken, refreshToken };
}

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               fullName: { type: string }
 *               role: { type: string, enum: [client, coach] }
 *     responses:
 *       201: { description: User created successfully }
 *       400: { description: Validation error }
 *       409: { description: Email already exists }
 */
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, role = 'client' } = req.body;

  if (!email || !password || !fullName) {
    throw BadRequestError('Email, password, and full name are required');
  }

  if (password.length < 8) {
    throw BadRequestError('Password must be at least 8 characters');
  }

  if (!['client', 'coach'].includes(role)) {
    throw BadRequestError('Role must be either client or coach');
  }

  // Check if user exists
  const existingUser = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = @email',
    { email: email.toLowerCase() }
  );

  if (existingUser) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  // Generate verification token
  const verificationToken = uuidv4();
  const verificationExpires = new Date();
  verificationExpires.setHours(verificationExpires.getHours() + 24);

  // Create user (full_name is stored in profiles table, not users)
  const userId = uuidv4();
  await execute(
    `INSERT INTO users (id, email, password_hash, email_verification_token, email_verification_expires, is_active)
     VALUES (@id, @email, @passwordHash, @verificationToken, @verificationExpires, 1)`,
    { id: userId, email: email.toLowerCase(), passwordHash, verificationToken, verificationExpires }
  );

  // Create profile
  await execute(
    `INSERT INTO profiles (id, user_id, email, full_name)
     VALUES (@id, @userId, @email, @fullName)`,
    { id: uuidv4(), userId, email: email.toLowerCase(), fullName }
  );

  // Assign role
  await execute(
    'INSERT INTO user_roles (id, user_id, role) VALUES (@id, @userId, @role)',
    { id: uuidv4(), userId, role }
  );

  // Create role-specific profile
  if (role === 'coach') {
    await execute(
      'INSERT INTO coach_profiles (id, user_id) VALUES (@id, @userId)',
      { id: uuidv4(), userId }
    );
  } else {
    await execute(
      'INSERT INTO client_profiles (id, user_id) VALUES (@id, @userId)',
      { id: uuidv4(), userId }
    );
  }

  // Send verification email
  const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${verificationToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify your CustomCoachPro account',
    html: emailVerificationEmail(fullName, verificationUrl),
  });

  // Generate auth tokens
  const tokens = await createAuthTokens(userId, email.toLowerCase());

  // Get roles
  const roles = await queryAll<{ role: string }>(
    'SELECT role FROM user_roles WHERE user_id = @userId',
    { userId }
  );

  res.status(201).json({
    user: {
      id: userId,
      email: email.toLowerCase(),
      fullName,
      roles: roles.map(r => r.role),
      emailVerified: false,
    },
    ...tokens,
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw BadRequestError('Email and password are required');
  }

  // Get user
  const user = await queryOne<{
    id: string;
    email: string;
    password_hash: string;
    is_active: boolean;
    email_verified: boolean;
  }>(
    'SELECT id, email, password_hash, is_active, email_verified FROM users WHERE email = @email',
    { email: email.toLowerCase() }
  );

  if (!user) {
    throw UnauthorizedError('Invalid email or password');
  }

  if (!user.is_active) {
    throw UnauthorizedError('Account is disabled');
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw UnauthorizedError('Invalid email or password');
  }

  // Get profile
  const profile = await queryOne<{ full_name: string; avatar_url: string }>(
    'SELECT full_name, avatar_url FROM profiles WHERE user_id = @userId',
    { userId: user.id }
  );

  // Get roles
  const roles = await queryAll<{ role: string }>(
    'SELECT role FROM user_roles WHERE user_id = @userId',
    { userId: user.id }
  );

  // Generate tokens
  const tokens = await createAuthTokens(user.id, user.email);

  // Update last login
  await execute(
    'UPDATE users SET last_login_at = GETUTCDATE(), login_count = ISNULL(login_count, 0) + 1 WHERE id = @id',
    { id: user.id }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name,
      avatarUrl: profile?.avatar_url,
      roles: roles.map(r => r.role),
      emailVerified: user.email_verified,
    },
    ...tokens,
  });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user info
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User info }
 *       401: { description: Unauthorized }
 */
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await queryOne<{
    id: string;
    email: string;
    email_verified: boolean;
  }>(
    'SELECT id, email, email_verified FROM users WHERE id = @userId',
    { userId: req.user!.id }
  );

  if (!user) {
    throw UnauthorizedError('User not found');
  }

  const profile = await queryOne<{ full_name: string; avatar_url: string; bio: string }>(
    'SELECT full_name, avatar_url, bio FROM profiles WHERE user_id = @userId',
    { userId: user.id }
  );

  res.json({
    id: user.id,
    email: user.email,
    fullName: profile?.full_name,
    avatarUrl: profile?.avatar_url,
    bio: profile?.bio,
    roles: req.user!.roles,
    emailVerified: user.email_verified,
  });
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New tokens }
 *       401: { description: Invalid refresh token }
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw BadRequestError('Refresh token is required');
  }

  // Find valid refresh token
  const tokenRecord = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM refresh_tokens 
     WHERE token = @token AND expires_at > GETUTCDATE() AND revoked_at IS NULL`,
    { token: refreshToken }
  );

  if (!tokenRecord) {
    throw UnauthorizedError('Invalid or expired refresh token');
  }

  // Get user
  const user = await queryOne<{ id: string; email: string; is_active: boolean }>(
    'SELECT id, email, is_active FROM users WHERE id = @userId',
    { userId: tokenRecord.user_id }
  );

  if (!user || !user.is_active) {
    throw UnauthorizedError('User not found or disabled');
  }

  // Revoke old refresh token
  await execute(
    'UPDATE refresh_tokens SET revoked_at = GETUTCDATE() WHERE token = @token',
    { token: refreshToken }
  );

  // Generate new tokens
  const tokens = await createAuthTokens(user.id, user.email);

  res.json(tokens);
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *               allDevices: { type: boolean }
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken, allDevices } = req.body;

  // Try to get user from access token
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = jwt.verify(token, config.jwt.secret) as { userId: string };
      userId = payload.userId;
    } catch {
      // Ignore - user might be logging out with expired token
    }
  }

  if (allDevices && userId) {
    // Revoke all refresh tokens for user
    await execute(
      'UPDATE refresh_tokens SET revoked_at = GETUTCDATE() WHERE user_id = @userId AND revoked_at IS NULL',
      { userId }
    );
  } else if (refreshToken) {
    // Revoke specific refresh token
    await execute(
      'UPDATE refresh_tokens SET revoked_at = GETUTCDATE() WHERE token = @token',
      { token: refreshToken }
    );
  }

  res.json({ message: 'Logged out successfully' });
}));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset email sent (if account exists) }
 */
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw BadRequestError('Email is required');
  }

  // Find user
  const user = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = @email AND is_active = 1',
    { email: email.toLowerCase() }
  );

  // Always return success to prevent email enumeration
  if (user) {
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await execute(
      `UPDATE users SET password_reset_token = @token, password_reset_expires = @expires 
       WHERE id = @id`,
      { token: resetToken, expires: resetExpires, id: user.id }
    );

    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Reset your CustomCoachPro password',
      html: passwordResetEmail(resetUrl),
    });
  }

  res.json({ message: 'If an account exists with this email, a reset link has been sent' });
}));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired token }
 */
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw BadRequestError('Token and password are required');
  }

  if (password.length < 8) {
    throw BadRequestError('Password must be at least 8 characters');
  }

  // Find user with valid reset token
  const user = await queryOne<{ id: string }>(
    `SELECT id FROM users 
     WHERE password_reset_token = @token AND password_reset_expires > GETUTCDATE()`,
    { token }
  );

  if (!user) {
    throw BadRequestError('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  // Update password and clear reset token
  await execute(
    `UPDATE users SET password_hash = @hash, password_reset_token = NULL, password_reset_expires = NULL 
     WHERE id = @id`,
    { hash: passwordHash, id: user.id }
  );

  // Revoke all refresh tokens for security
  await execute(
    'UPDATE refresh_tokens SET revoked_at = GETUTCDATE() WHERE user_id = @userId AND revoked_at IS NULL',
    { userId: user.id }
  );

  res.json({ message: 'Password reset successfully' });
}));

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: Email verified }
 *       400: { description: Invalid or expired token }
 */
router.post('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw BadRequestError('Token is required');
  }

  const user = await queryOne<{ id: string; email_verified: boolean }>(
    `SELECT id, email_verified FROM users 
     WHERE email_verification_token = @token AND email_verification_expires > GETUTCDATE()`,
    { token }
  );

  if (!user) {
    throw BadRequestError('Invalid or expired verification token');
  }

  if (user.email_verified) {
    res.json({ message: 'Email already verified' });
    return;
  }

  await execute(
    `UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL 
     WHERE id = @id`,
    { id: user.id }
  );

  res.json({ message: 'Email verified successfully' });
}));

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Verification email sent }
 */
router.post('/resend-verification', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await queryOne<{ id: string; email: string; email_verified: boolean }>(
    'SELECT id, email, email_verified FROM users WHERE id = @userId',
    { userId: req.user!.id }
  );

  if (!user) {
    throw UnauthorizedError('User not found');
  }

  if (user.email_verified) {
    res.json({ message: 'Email already verified' });
    return;
  }

  const profile = await queryOne<{ full_name: string }>(
    'SELECT full_name FROM profiles WHERE user_id = @userId',
    { userId: user.id }
  );

  const verificationToken = uuidv4();
  const verificationExpires = new Date();
  verificationExpires.setHours(verificationExpires.getHours() + 24);

  await execute(
    `UPDATE users SET email_verification_token = @token, email_verification_expires = @expires 
     WHERE id = @id`,
    { token: verificationToken, expires: verificationExpires, id: user.id }
  );

  const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your CustomCoachPro account',
    html: emailVerificationEmail(profile?.full_name || 'there', verificationUrl),
  });

  res.json({ message: 'Verification email sent' });
}));

export default router;
