import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'koihire-service-images';

interface UploadOptions {
  userId: string;
  folder: string; // e.g., 'services', 'avatars', 'portfolios'
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Upload an image file to S3 with optimization
 */
export async function uploadImageToS3(
  file: Express.Multer.File,
  options: UploadOptions
): Promise<string> {
  try {
    const { userId, folder, maxWidth = 1920, maxHeight = 1080, quality = 85 } = options;

    // Generate unique filename
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `${folder}/${userId}/${uuidv4()}${fileExtension}`;

    // Process image with Sharp (resize and optimize)
    let processedBuffer: Buffer;

    if (fileExtension === '.svg') {
      // Don't process SVG files, upload as-is
      processedBuffer = file.buffer;
    } else {
      processedBuffer = await sharp(file.buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    // Determine content type
    const contentType = fileExtension === '.svg'
      ? 'image/svg+xml'
      : file.mimetype || 'image/jpeg';

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: processedBuffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // Cache for 1 year
    });

    await s3Client.send(command);

    // Return public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

    return url;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload image to S3');
  }
}

/**
 * Upload multiple images to S3
 */
export async function uploadMultipleImagesToS3(
  files: Express.Multer.File[],
  options: UploadOptions
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadImageToS3(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple S3 upload error:', error);
    throw new Error('Failed to upload images to S3');
  }
}

/**
 * Delete an image from S3 by URL
 */
export async function deleteImageFromS3(imageUrl: string): Promise<void> {
  try {
    // Extract key from URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/folder/userId/filename.jpg
    const urlParts = imageUrl.split('.amazonaws.com/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid S3 URL format');
    }

    const key = urlParts[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete image from S3');
  }
}

/**
 * Delete multiple images from S3
 */
export async function deleteMultipleImagesFromS3(imageUrls: string[]): Promise<void> {
  try {
    const deletePromises = imageUrls.map(url => deleteImageFromS3(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Multiple S3 delete error:', error);
    throw new Error('Failed to delete images from S3');
  }
}
