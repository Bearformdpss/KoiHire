/**
 * File Upload Utilities
 * Handles file uploads, validation, and preview generation
 */

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  preview?: string // For images
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Allowed: images, PDFs, documents, spreadsheets, text files'
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if file is an image
 */
export function isImage(file: File | string): boolean {
  if (typeof file === 'string') {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  }
  return file.type.startsWith('image/')
}

/**
 * Generate image preview URL
 */
export function generatePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'pdf':
      return '📄'
    case 'doc':
    case 'docx':
      return '📝'
    case 'xls':
    case 'xlsx':
      return '📊'
    case 'txt':
    case 'csv':
      return '📃'
    case 'zip':
    case 'rar':
      return '📦'
    default:
      return '📎'
  }
}
