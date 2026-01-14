import { Router, Response } from 'express';
import { queryOne, queryAll, execute } from '../db';
import { authenticate, AuthenticatedRequest, optionalAuth } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Blog permissions check
async function checkBlogPermission(userId: string, permission: 'write' | 'manage'): Promise<boolean> {
  // Super admins always have access
  const roles = await queryAll<{ role: string }>(
    'SELECT role FROM user_roles WHERE user_id = @userId',
    { userId }
  );
  if (roles.some(r => r.role === 'super_admin')) return true;

  // Check specific blog permissions
  const perm = await queryOne<{ id: string }>(
    `SELECT id FROM blog_permissions WHERE user_id = @userId AND permission IN (@permission, 'manage')`,
    { userId, permission }
  );
  return !!perm;
}

// ============ Public Endpoints ============

/**
 * @swagger
 * /api/blog/posts:
 *   get:
 *     tags: [Blog]
 *     summary: Get published blog posts
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *       - name: category
 *         in: query
 *         schema: { type: string }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of blog posts }
 */
router.get('/posts', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { search, category, page = '1', limit = '10' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
  const offset = (pageNum - 1) * limitNum;

  let whereClause = 'WHERE bp.status = \'published\'';
  const params: any = { limit: limitNum, offset };

  if (search) {
    whereClause += ' AND (bp.title LIKE @search OR bp.excerpt LIKE @search)';
    params.search = `%${search}%`;
  }

  if (category) {
    whereClause += ' AND bp.category = @category';
    params.category = category;
  }

  const posts = await queryAll<any>(
    `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.cover_image_url, bp.category, bp.published_at, bp.read_time_minutes,
            p.full_name as author_name, p.avatar_url as author_avatar
     FROM blog_posts bp
     LEFT JOIN profiles p ON bp.author_id = p.user_id
     ${whereClause}
     ORDER BY bp.published_at DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params
  );

  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM blog_posts bp ${whereClause}`,
    params
  );

  res.json({
    posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limitNum)
    }
  });
}));

/**
 * @swagger
 * /api/blog/posts/{slug}:
 *   get:
 *     tags: [Blog]
 *     summary: Get a single blog post by slug
 */
router.get('/posts/:slug', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { slug } = req.params;

  const post = await queryOne<any>(
    `SELECT bp.*, p.full_name as author_name, p.avatar_url as author_avatar, p.bio as author_bio
     FROM blog_posts bp
     LEFT JOIN profiles p ON bp.author_id = p.user_id
     WHERE bp.slug = @slug AND (bp.status = 'published' OR bp.author_id = @userId)`,
    { slug, userId: req.user?.id || '' }
  );

  if (!post) {
    throw NotFoundError('Blog post not found');
  }

  // Increment view count
  await execute('UPDATE blog_posts SET view_count = ISNULL(view_count, 0) + 1 WHERE id = @id', { id: post.id });

  res.json(post);
}));

/**
 * @swagger
 * /api/blog/categories:
 *   get:
 *     tags: [Blog]
 *     summary: Get blog categories with post counts
 */
router.get('/categories', asyncHandler(async (req, res: Response) => {
  const categories = await queryAll<{ category: string; count: number }>(
    `SELECT category, COUNT(*) as count 
     FROM blog_posts 
     WHERE status = 'published' AND category IS NOT NULL
     GROUP BY category 
     ORDER BY count DESC`
  );
  res.json(categories);
}));

// ============ Protected Endpoints (Writers/Managers) ============

/**
 * @swagger
 * /api/blog/my-posts:
 *   get:
 *     tags: [Blog]
 *     summary: Get posts authored by current user
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my-posts', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const hasAccess = await checkBlogPermission(req.user!.id, 'write');
  if (!hasAccess) {
    throw ForbiddenError('Blog write permission required');
  }

  const posts = await queryAll<any>(
    `SELECT id, title, slug, status, category, created_at, updated_at, published_at, view_count
     FROM blog_posts
     WHERE author_id = @userId
     ORDER BY updated_at DESC`,
    { userId: req.user!.id }
  );

  res.json(posts);
}));

/**
 * @swagger
 * /api/blog/posts:
 *   post:
 *     tags: [Blog]
 *     summary: Create a new blog post
 *     security: [{ bearerAuth: [] }]
 */
router.post('/posts', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const hasAccess = await checkBlogPermission(req.user!.id, 'write');
  if (!hasAccess) {
    throw ForbiddenError('Blog write permission required');
  }

  const { title, content, excerpt, category, cover_image_url, status = 'draft' } = req.body;

  if (!title || !content) {
    throw BadRequestError('Title and content are required');
  }

  // Generate slug
  let slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);

  // Check for duplicate slug
  const existing = await queryOne<{ id: string }>('SELECT id FROM blog_posts WHERE slug = @slug', { slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Estimate read time (average 200 words per minute)
  const wordCount = content.split(/\s+/).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const postId = uuidv4();
  const publishedAt = status === 'published' ? new Date() : null;

  await execute(
    `INSERT INTO blog_posts (id, title, slug, content, excerpt, category, cover_image_url, author_id, status, read_time_minutes, published_at)
     VALUES (@id, @title, @slug, @content, @excerpt, @category, @coverImageUrl, @authorId, @status, @readTime, @publishedAt)`,
    {
      id: postId,
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200),
      category: category || null,
      coverImageUrl: cover_image_url || null,
      authorId: req.user!.id,
      status,
      readTime: readTimeMinutes,
      publishedAt
    }
  );

  res.status(201).json({ id: postId, slug });
}));

/**
 * @swagger
 * /api/blog/posts/{id}:
 *   put:
 *     tags: [Blog]
 *     summary: Update a blog post
 *     security: [{ bearerAuth: [] }]
 */
router.put('/posts/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, excerpt, category, cover_image_url, status } = req.body;

  const post = await queryOne<{ author_id: string; status: string; published_at: Date | null }>(
    'SELECT author_id, status, published_at FROM blog_posts WHERE id = @id',
    { id }
  );

  if (!post) {
    throw NotFoundError('Blog post not found');
  }

  // Check permission - author can edit their own, managers can edit any
  const isAuthor = post.author_id === req.user!.id;
  const isManager = await checkBlogPermission(req.user!.id, 'manage');
  
  if (!isAuthor && !isManager) {
    throw ForbiddenError('You do not have permission to edit this post');
  }

  // Calculate read time if content changed
  let readTimeMinutes = undefined;
  if (content) {
    const wordCount = content.split(/\s+/).length;
    readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  }

  // Set published_at if publishing for first time
  let publishedAt = post.published_at;
  if (status === 'published' && !post.published_at) {
    publishedAt = new Date();
  }

  await execute(
    `UPDATE blog_posts 
     SET title = COALESCE(@title, title),
         content = COALESCE(@content, content),
         excerpt = COALESCE(@excerpt, excerpt),
         category = COALESCE(@category, category),
         cover_image_url = COALESCE(@coverImageUrl, cover_image_url),
         status = COALESCE(@status, status),
         read_time_minutes = COALESCE(@readTime, read_time_minutes),
         published_at = @publishedAt,
         updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      title: title || null,
      content: content || null,
      excerpt: excerpt || null,
      category: category || null,
      coverImageUrl: cover_image_url || null,
      status: status || null,
      readTime: readTimeMinutes || null,
      publishedAt
    }
  );

  res.json({ message: 'Post updated successfully' });
}));

/**
 * @swagger
 * /api/blog/posts/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Delete a blog post
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/posts/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const post = await queryOne<{ author_id: string }>('SELECT author_id FROM blog_posts WHERE id = @id', { id });

  if (!post) {
    throw NotFoundError('Blog post not found');
  }

  const isAuthor = post.author_id === req.user!.id;
  const isManager = await checkBlogPermission(req.user!.id, 'manage');

  if (!isAuthor && !isManager) {
    throw ForbiddenError('You do not have permission to delete this post');
  }

  await execute('DELETE FROM blog_posts WHERE id = @id', { id });

  res.json({ message: 'Post deleted successfully' });
}));

// ============ Manager-only Endpoints ============

/**
 * @swagger
 * /api/blog/permissions:
 *   get:
 *     tags: [Blog]
 *     summary: Get all blog permissions (manager only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/permissions', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isManager = await checkBlogPermission(req.user!.id, 'manage');
  if (!isManager) {
    throw ForbiddenError('Blog manage permission required');
  }

  const permissions = await queryAll<any>(
    `SELECT bp.id, bp.user_id, bp.permission, bp.granted_by, bp.created_at,
            p.full_name, p.email
     FROM blog_permissions bp
     JOIN profiles p ON bp.user_id = p.user_id
     ORDER BY bp.created_at DESC`
  );

  res.json(permissions);
}));

/**
 * @swagger
 * /api/blog/permissions:
 *   post:
 *     tags: [Blog]
 *     summary: Grant blog permission to a user
 *     security: [{ bearerAuth: [] }]
 */
router.post('/permissions', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isManager = await checkBlogPermission(req.user!.id, 'manage');
  if (!isManager) {
    throw ForbiddenError('Blog manage permission required');
  }

  const { user_id, permission } = req.body;

  if (!user_id || !['write', 'manage'].includes(permission)) {
    throw BadRequestError('Valid user_id and permission (write/manage) required');
  }

  // Check user exists
  const user = await queryOne<{ user_id: string }>('SELECT user_id FROM profiles WHERE user_id = @userId', { userId: user_id });
  if (!user) {
    throw NotFoundError('User not found');
  }

  // Check if already has this permission
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM blog_permissions WHERE user_id = @userId AND permission = @permission',
    { userId: user_id, permission }
  );
  if (existing) {
    throw BadRequestError('User already has this permission');
  }

  await execute(
    `INSERT INTO blog_permissions (id, user_id, permission, granted_by)
     VALUES (@id, @userId, @permission, @grantedBy)`,
    { id: uuidv4(), userId: user_id, permission, grantedBy: req.user!.id }
  );

  res.status(201).json({ message: 'Permission granted successfully' });
}));

/**
 * @swagger
 * /api/blog/permissions/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Revoke blog permission
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/permissions/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isManager = await checkBlogPermission(req.user!.id, 'manage');
  if (!isManager) {
    throw ForbiddenError('Blog manage permission required');
  }

  const { id } = req.params;
  await execute('DELETE FROM blog_permissions WHERE id = @id', { id });

  res.json({ message: 'Permission revoked successfully' });
}));

/**
 * @swagger
 * /api/blog/all-posts:
 *   get:
 *     tags: [Blog]
 *     summary: Get all blog posts including drafts (manager only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/all-posts', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isManager = await checkBlogPermission(req.user!.id, 'manage');
  if (!isManager) {
    throw ForbiddenError('Blog manage permission required');
  }

  const posts = await queryAll<any>(
    `SELECT bp.id, bp.title, bp.slug, bp.status, bp.category, bp.created_at, bp.updated_at, bp.published_at, bp.view_count,
            p.full_name as author_name
     FROM blog_posts bp
     LEFT JOIN profiles p ON bp.author_id = p.user_id
     ORDER BY bp.updated_at DESC`
  );

  res.json(posts);
}));

export default router;