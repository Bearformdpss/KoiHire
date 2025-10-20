import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userId-originalname
    const userId = (req as AuthRequest).user?.id || 'anonymous'
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${timestamp}-${userId}-${name}${ext}`)
  }
})

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const deliverableFileFilter = (req: any, file: any, cb: any) => {
  // Accept images, documents, and archives
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed!'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
})

const deliverableUpload = multer({
  storage,
  fileFilter: deliverableFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for deliverables
  }
})

// POST /api/upload/portfolio-images - Upload portfolio images
router.post('/portfolio-images', authMiddleware, upload.array('images', 10), async (req: AuthRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      })
    }

    const files = req.files as Express.Multer.File[]
    const imageUrls = files.map(file => `/uploads/${file.filename}`)

    res.json({
      success: true,
      images: imageUrls,
      message: `Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`
    })
  } catch (error) {
    console.error('Error uploading images:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    })
  }
})

// POST /api/upload/portfolio-thumbnail - Upload single thumbnail
router.post('/portfolio-thumbnail', authMiddleware, upload.single('thumbnail'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No thumbnail uploaded'
      })
    }

    const thumbnailUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      thumbnail: thumbnailUrl,
      message: 'Thumbnail uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading thumbnail:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload thumbnail'
    })
  }
})

// POST /api/upload/avatar - Upload single avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar uploaded'
      })
    }

    const avatarUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      avatar: avatarUrl,
      message: 'Avatar uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    })
  }
})

// POST /api/upload/deliverables - Upload deliverable files (images, docs, etc.)
router.post('/deliverables', authMiddleware, deliverableUpload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      })
    }

    const files = req.files as Express.Multer.File[]
    const fileUrls = files.map(file => `/uploads/${file.filename}`)

    res.json({
      success: true,
      data: {
        fileUrls
      },
      message: `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`
    })
  } catch (error) {
    console.error('Error uploading deliverable files:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    })
  }
})

// DELETE /api/upload/:filename - Delete uploaded file
router.delete('/:filename', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(uploadsDir, filename)

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      })
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Check if user owns the file (filename should contain userId)
    const userId = req.user!.id
    if (!filename.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      })
    }

    // Delete the file
    fs.unlinkSync(filePath)

    res.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    })
  }
})

export default router