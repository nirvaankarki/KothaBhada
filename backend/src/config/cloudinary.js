import { v2 as cloudinary } from 'cloudinary';

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();

const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

function ensureCloudinaryConfigured() {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }
}

export function isCloudinaryConfigured() {
  return cloudinaryConfigured;
}

export async function uploadDataUriToCloudinary(
  dataUri,
  { folder = 'kothabhada/uploads', resourceType = 'image' } = {}
) {
  ensureCloudinaryConfigured();

  const uploadResult = await cloudinary.uploader.upload(String(dataUri), {
    folder,
    resource_type: resourceType,
  });

  return uploadResult.secure_url;
}

export function uploadBufferToCloudinary(
  fileBuffer,
  { folder = 'kothabhada/uploads', resourceType = 'raw', publicId, format } = {}
) {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        format,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result?.secure_url || '');
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function uploadLargeFileToCloudinary(
  filePath,
  {
    folder = 'kothabhada/uploads',
    resourceType = 'raw',
    publicId,
    chunkSize = 20 * 1024 * 1024,
    timeoutMs = 4 * 60 * 1000,
  } = {}
) {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    let settled = false;

    const finalizeResolve = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      resolve(value);
    };

    const finalizeReject = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      reject(error);
    };

    const timeoutHandle = setTimeout(() => {
      finalizeReject(new Error(`Cloudinary upload timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    cloudinary.uploader.upload_large(
      String(filePath),
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        chunk_size: chunkSize,
      },
      (error, result) => {
        if (error) {
          finalizeReject(error);
          return;
        }

        const resolvedUrl = String(result?.secure_url || result?.url || '').trim();
        const isFinalChunkResponse = result?.done !== false;

        if (resolvedUrl) {
          finalizeResolve(resolvedUrl);
          return;
        }

        if (isFinalChunkResponse) {
          finalizeReject(new Error('Cloudinary completed upload but did not return a file URL.'));
        }
      }
    );
  });
}