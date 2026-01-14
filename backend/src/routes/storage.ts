import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { uploadFile, generateSasUrl, generateBlobName, deleteFile, listFiles } from '../services/storage';
import { queryOne, execute } from '../db';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Upload file
router.post('/upload', authenticate, upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) throw BadRequestError('No file provided');
  
  const blobName = generateBlobName(req.user!.id, req.file.originalname, req.body.folder);
  const url = await uploadFile(blobName, req.file.buffer, req.file.mimetype);
  
  res.json({ url, blobName });
}));

// Upload base64 encoded file
router.post('/upload-base64', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, filename, folder, contentType } = req.body;

  if (!data || !filename) {
    throw BadRequestError('Data and filename are required');
  }

  // Remove data URL prefix if present
  const base64Data = data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const blobName = generateBlobName(req.user!.id, filename, folder);
  const mimeType = contentType || 'application/octet-stream';
  const url = await uploadFile(blobName, buffer, mimeType);

  res.json({ url, blobName });
}));

// Upload progress photo with metadata
router.post('/progress-photo', authenticate, upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) throw BadRequestError('No file provided');

  const { pose_type = 'front', notes, is_private = true, recorded_at } = req.body;

  // Upload to blob storage
  const blobName = generateBlobName(req.user!.id, req.file.originalname, 'progress-photos');
  const photoUrl = await uploadFile(blobName, req.file.buffer, req.file.mimetype);

  // Save to database
  const id = uuidv4();
  await execute(
    `INSERT INTO progress_photos (id, client_id, photo_url, pose_type, notes, is_private, recorded_at)
     VALUES (@id, @clientId, @photoUrl, @poseType, @notes, @isPrivate, @recordedAt)`,
    {
      id,
      clientId: req.user!.id,
      photoUrl,
      poseType: pose_type,
      notes,
      isPrivate: is_private ? 1 : 0,
      recordedAt: recorded_at || new Date().toISOString(),
    }
  );

  const photo = await queryOne('SELECT * FROM progress_photos WHERE id = @id', { id });
  res.status(201).json(photo);
}));

// Generate SAS URL (GET - legacy)
router.get('/sas-url', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { blobName } = req.query;
  if (!blobName) throw BadRequestError('blobName is required');
  
  const sasUrl = await generateSasUrl(blobName as string);
  res.json({ sasUrl });
}));

// Generate SAS URL (POST - frontend uses this)
router.post('/sas-url', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { blobName, expiresInMinutes = 60 } = req.body;
  if (!blobName) throw BadRequestError('blobName is required');
  
  const sasUrl = await generateSasUrl(blobName, parseInt(expiresInMinutes as string));
  res.json({ sasUrl });
}));

// List files in a folder
router.get('/list', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { folder, prefix } = req.query;

  // Construct prefix - always include user's ID for security
  let searchPrefix = req.user!.id;
  if (folder) {
    searchPrefix += `/${folder}`;
  }
  if (prefix) {
    searchPrefix += `/${prefix}`;
  }

  const files = await listFiles(searchPrefix);
  res.json(files);
}));

// Delete file
router.delete('/files', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { blobName } = req.body;

  if (!blobName) {
    throw BadRequestError('blobName is required');
  }

  // Security check - ensure blob belongs to user
  if (!blobName.startsWith(req.user!.id)) {
    throw BadRequestError('You can only delete your own files');
  }

  await deleteFile(blobName);
  res.json({ message: 'File deleted' });
}));

// Delete progress photo
router.delete('/progress-photo/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const photo = await queryOne<{ client_id: string; photo_url: string }>(
    'SELECT client_id, photo_url FROM progress_photos WHERE id = @id',
    { id }
  );

  if (!photo) {
    throw NotFoundError('Photo');
  }

  if (photo.client_id !== req.user!.id) {
    throw BadRequestError('You can only delete your own photos');
  }

  // Extract blob name from URL and delete from storage
  try {
    const url = new URL(photo.photo_url);
    const blobName = url.pathname.split('/').slice(2).join('/'); // Remove container name
    await deleteFile(blobName);
  } catch (e) {
    console.warn('Failed to delete blob:', e);
  }

  // Delete from database
  await execute('DELETE FROM progress_photos WHERE id = @id', { id });

  res.json({ message: 'Photo deleted' });
}));

export default router;
