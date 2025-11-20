import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'
import {
  uploadServiceOrderFileToS3,
  getServiceOrderFileDownloadUrl,
  deleteServiceOrderFileFromS3
} from '../utils/s3ServiceOrderFiles'

const prisma = new PrismaClient()

const router = Router()

// Configure multer for memory storage (files uploaded to S3, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|pdf|doc|docx|txt|zip|rar/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'))
    }
  }
})

// Upload files to service order
router.post('/:orderId/files', authMiddleware, upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user!.id
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      })
    }

    // Verify order exists and user has access
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if user is client or freelancer on this order
    const isClient = order.clientId === userId
    const isFreelancer = order.freelancerId === userId

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this order'
      })
    }

    // Upload files to S3
    const s3UploadPromises = files.map(file =>
      uploadServiceOrderFileToS3(file, { orderId, userId })
    )
    const s3Urls = await Promise.all(s3UploadPromises)

    // Create database records for uploaded files
    const uploadedFiles = await Promise.all(
      files.map((file, index) =>
        prisma.serviceOrderFile.create({
          data: {
            orderId,
            fileName: path.basename(s3Urls[index]), // Extract filename from S3 URL
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            filePath: s3Urls[index], // Store S3 URL
            uploadedById: userId
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        })
      )
    )

    res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      data: { files: uploadedFiles }
    })
  } catch (error: any) {
    console.error('File upload error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload files'
    })
  }
})

// Get all files for a service order
router.get('/:orderId/files', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user!.id

    // Verify order exists and user has access
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if user is client or freelancer on this order
    const isClient = order.clientId === userId
    const isFreelancer = order.freelancerId === userId

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this order'
      })
    }

    const files = await prisma.serviceOrderFile.findMany({
      where: { orderId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: { files }
    })
  } catch (error: any) {
    console.error('Get files error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files'
    })
  }
})

// Download a file (returns signed S3 URL)
router.get('/download/:fileId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { fileId } = req.params
    const userId = req.user!.id

    const file = await prisma.serviceOrderFile.findUnique({
      where: { id: fileId },
      include: {
        order: true
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Check if user has access to the order
    const isClient = file.order.clientId === userId
    const isFreelancer = file.order.freelancerId === userId

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this file'
      })
    }

    // Generate signed S3 URL (expires in 1 hour)
    const signedUrl = await getServiceOrderFileDownloadUrl(file.filePath)

    // Return signed URL to frontend
    res.json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        fileName: file.originalName
      }
    })
  } catch (error: any) {
    console.error('File download error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL'
    })
  }
})

// Delete a file
router.delete('/:fileId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { fileId } = req.params
    const userId = req.user!.id

    const file = await prisma.serviceOrderFile.findUnique({
      where: { id: fileId },
      include: {
        order: true
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Only the uploader or order client can delete files
    const isUploader = file.uploadedById === userId
    const isClient = file.order.clientId === userId

    if (!isUploader && !isClient) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this file'
      })
    }

    // Delete file from S3
    await deleteServiceOrderFileFromS3(file.filePath)

    // Delete database record
    await prisma.serviceOrderFile.delete({
      where: { id: fileId }
    })

    res.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error: any) {
    console.error('File delete error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    })
  }
})

export default router
