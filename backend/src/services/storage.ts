import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
} from '@azure/storage-blob';
import { config } from '../config';

let containerClient: ContainerClient | null = null;

/**
 * Initialize storage client
 */
function getContainerClient(): ContainerClient {
  if (containerClient) {
    return containerClient;
  }

  if (!config.storage.connectionString) {
    throw new Error('Azure Storage connection string not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    config.storage.connectionString
  );
  containerClient = blobServiceClient.getContainerClient(config.storage.containerName);
  
  console.log(
    'AZURE_STORAGE_CONNECTION_STRING:',
    config.storage.connectionString
  );

  return containerClient;
}

/**
 * Upload a file to Azure Blob Storage
 */
export async function uploadFile(
  blobName: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const container = getContainerClient();

  // Ensure container exists
  await container.createIfNotExists({ access: 'blob' });

  const blockBlobClient = container.getBlockBlobClient(blobName);

  await blockBlobClient.upload(data, data.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}

/**
 * Delete a file from Azure Blob Storage
 */
export async function deleteFile(blobName: string): Promise<void> {
  const container = getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists();
}

/**
 * Generate a SAS URL for secure access
 */
export async function generateSasUrl(
  blobName: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const container = getContainerClient();
  const blobClient = container.getBlobClient(blobName);

  // Check if blob exists
  const exists = await blobClient.exists();
  if (!exists) {
    throw new Error('File not found');
  }

  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

  const sasUrl = await blobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse('r'),
    startsOn,
    expiresOn,
  });

  return sasUrl;
}

/**
 * Generate a unique blob name for a user upload
 */
export function generateBlobName(userId: string, fileName: string, folder?: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const basePath = folder ? `${userId}/${folder}` : userId;
  return `${basePath}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Get the public URL for a blob (for public containers)
 */
export function getPublicUrl(blobName: string): string {
  return `https://${config.storage.accountName}.blob.core.windows.net/${config.storage.containerName}/${blobName}`;
}

/**
 * List files in Azure Blob Storage with optional prefix
 */
export async function listFiles(prefix: string): Promise<{ name: string; url: string }[]> {
  const container = getContainerClient();
  const files: { name: string; url: string }[] = [];

  for await (const blob of container.listBlobsFlat({ prefix })) {
    files.push({
      name: blob.name,
      url: `https://${config.storage.accountName}.blob.core.windows.net/${config.storage.containerName}/${blob.name}`,
    });
  }

  return files;
}
