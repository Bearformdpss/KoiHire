import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

interface UploadServiceOrderFileOptions {
  orderId: string;
  userId: string;
}

/**
 * Upload a service order file to S3 (no image processing, raw upload)
 * Stores in: service-order-files/{orderId}/{uuid}.{ext}
 */
export async function uploadServiceOrderFileToS3(
  file: Express.Multer.File,
  options: UploadServiceOrderFileOptions
): Promise<string> {
  try {
    const { orderId, userId } = options;

    // Generate unique filename
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `service-order-files/${orderId}/${uuidv4()}${fileExtension}`;

    // Upload to S3 (no processing - upload raw file)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Private ACL - files not publicly accessible
      ACL: 'private',
      // Force download instead of inline display (prevents script execution)
      ContentDisposition: 'attachment',
      // Server-side encryption
      ServerSideEncryption: 'AES256',
      Metadata: {
        uploadedBy: userId,
        originalName: file.originalname,
      },
    });

    await s3Client.send(command);

    // Return S3 URL (will be stored in database)
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

    return url;
  } catch (error) {
    console.error('S3 service order file upload error:', error);
    throw new Error('Failed to upload service order file to S3');
  }
}

/**
 * Upload multiple service order files to S3
 */
export async function uploadMultipleServiceOrderFilesToS3(
  files: Express.Multer.File[],
  options: UploadServiceOrderFileOptions
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadServiceOrderFileToS3(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple S3 service order file upload error:', error);
    throw new Error('Failed to upload service order files to S3');
  }
}

/**
 * Generate a signed URL for downloading a service order file
 * URL expires in 1 hour
 */
export async function getServiceOrderFileDownloadUrl(fileUrl: string): Promise<string> {
  try {
    // Extract key from URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/service-order-files/orderId/filename.pdf
    const urlParts = fileUrl.split('.amazonaws.com/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid S3 URL format');
    }

    const key = urlParts[1];

    // Generate signed URL with 1 hour expiration
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour in seconds
    });

    return signedUrl;
  } catch (error) {
    console.error('S3 signed URL generation error:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Delete a service order file from S3 by URL
 */
export async function deleteServiceOrderFileFromS3(fileUrl: string): Promise<void> {
  try {
    // Extract key from URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/service-order-files/orderId/filename.pdf
    const urlParts = fileUrl.split('.amazonaws.com/');
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
    console.error('S3 service order file delete error:', error);
    throw new Error('Failed to delete service order file from S3');
  }
}

/**
 * Delete multiple service order files from S3
 */
export async function deleteMultipleServiceOrderFilesFromS3(fileUrls: string[]): Promise<void> {
  try {
    const deletePromises = fileUrls.map(url => deleteServiceOrderFileFromS3(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Multiple S3 service order file delete error:', error);
    throw new Error('Failed to delete service order files from S3');
  }
}
