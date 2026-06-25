import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImage(
  filePath: string,
  folder: string = 'portfolio'
): Promise<{ url: string; public_id: string }> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary is not configured');
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return { url: result.secure_url, public_id: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!env.CLOUDINARY_CLOUD_NAME) return;
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
