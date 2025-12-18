import { fileTypeFromBuffer } from 'file-type';
import sanitize from 'sanitize-filename';
import sharp from 'sharp';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
  detectedMimeType?: string;
  safeExtension?: string;
}

// Allowed file types (MIME type → extensions)
// SVG, ZIP, and RAR removed for security (XSS and zip bomb risks)
const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'application/pdf': ['pdf'],
  'text/plain': ['txt'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_PIXELS = 25000000; // 25 megapixels (5000x5000)
const MAX_IMAGE_DIMENSION = 20000; // Max width or height in pixels
const MIN_FILE_SIZE = 1; // Minimum 1 byte (reject empty files)
const MIN_PDF_SIZE = 100; // PDFs must be at least 100 bytes

/**
 * Comprehensive file validation with magic byte verification
 * Validates file type, size, content, and sanitizes filename
 */
export async function validateFile(
  buffer: Buffer,
  originalFilename: string
): Promise<FileValidationResult> {

  // 1. Size validation
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    };
  }

  if (buffer.length < MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: 'File is empty or corrupted'
    };
  }

  // 2. Filename sanitization (prevent path traversal)
  let safeName = sanitize(originalFilename);
  if (!safeName || safeName === '') {
    safeName = 'unnamed_file';
  }

  // Remove any remaining path separators and dangerous characters
  safeName = safeName.replace(/[\/\\]/g, '_');

  // 3. Magic byte validation (detect actual file type from content)
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType) {
    return {
      isValid: false,
      error: 'Could not determine file type. File may be corrupted or unsupported.'
    };
  }

  // 4. Check if detected type is in allowed list
  if (!ALLOWED_TYPES[fileType.mime]) {
    return {
      isValid: false,
      error: `File type '${fileType.mime}' is not allowed. Allowed types: images (JPEG, PNG, GIF), PDF, Word documents, and text files.`
    };
  }

  // 5. Extension validation (must match detected type)
  const ext = fileType.ext;
  const allowedExtensions = ALLOWED_TYPES[fileType.mime];

  if (!allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `File validation failed. Detected type '${fileType.mime}' does not match expected extensions.`
    };
  }

  // 6. Type-specific content validation
  try {
    if (fileType.mime.startsWith('image/')) {
      await validateImage(buffer, fileType.mime);
    } else if (fileType.mime === 'application/pdf') {
      await validatePDF(buffer);
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'File content validation failed'
    };
  }

  // 7. All validations passed
  return {
    isValid: true,
    sanitizedFilename: safeName,
    detectedMimeType: fileType.mime,
    safeExtension: ext
  };
}

/**
 * Validate image files using Sharp
 * Checks for malformed images, decompression bombs, and excessive dimensions
 */
async function validateImage(buffer: Buffer, mimeType: string): Promise<void> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Check image has valid dimensions
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: missing dimensions');
    }

    // Check for excessively large dimensions (potential decompression bomb)
    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      throw new Error(`Image dimensions too large. Maximum ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} pixels.`);
    }

    // Check total pixel count (prevent decompression bombs)
    const pixels = metadata.width * metadata.height;
    if (pixels > MAX_IMAGE_PIXELS) {
      throw new Error(`Image too large: ${pixels} pixels exceeds ${MAX_IMAGE_PIXELS} pixel limit (${Math.round(MAX_IMAGE_PIXELS / 1000000)}MP)`);
    }

    // Verify image can be processed (catches corrupted/malicious images)
    // This will throw if the image is malformed
    await image.toFormat('jpeg').toBuffer();

  } catch (error: any) {
    // If Sharp throws an error, the image is likely corrupted or malicious
    if (error.message.includes('VipsJpeg') || error.message.includes('Input buffer')) {
      throw new Error('Image file is corrupted or invalid');
    }
    throw new Error(`Image validation failed: ${error.message}`);
  }
}

/**
 * Validate PDF files
 * Checks PDF header and basic structure
 */
async function validatePDF(buffer: Buffer): Promise<void> {
  // Check minimum PDF size
  if (buffer.length < MIN_PDF_SIZE) {
    throw new Error('PDF file too small to be valid');
  }

  // Verify PDF header (all PDFs must start with %PDF-)
  const pdfHeader = buffer.slice(0, 5).toString('utf-8');
  if (!pdfHeader.startsWith('%PDF-')) {
    throw new Error('Invalid PDF: missing PDF header');
  }

  // Verify PDF version is reasonable (1.0 through 2.0)
  const versionChar = buffer.slice(5, 8).toString('utf-8');
  const version = parseFloat(versionChar);
  if (isNaN(version) || version < 1.0 || version > 2.0) {
    throw new Error('Invalid PDF: unsupported PDF version');
  }

  // Optional: Check for PDF EOF marker at the end
  // Most PDFs end with %%EOF, but this is not strictly required
  const lastBytes = buffer.slice(-10).toString('utf-8');
  if (!lastBytes.includes('%%EOF')) {
    // Log warning but don't reject - some valid PDFs don't have this
    console.warn('PDF validation warning: missing %%EOF marker');
  }
}

/**
 * Validate multiple files in parallel
 * Returns array of validation results in the same order as input files
 */
export async function validateMultipleFiles(
  files: Array<{ buffer: Buffer; originalname: string }>
): Promise<FileValidationResult[]> {
  const validationPromises = files.map(file =>
    validateFile(file.buffer, file.originalname)
  );

  return await Promise.all(validationPromises);
}
