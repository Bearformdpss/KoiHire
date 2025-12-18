import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'
import {
  uploadProjectFileToS3,
  getProjectFileDownloadUrl,
  deleteProjectFileFromS3
} from '../utils/s3ProjectFiles'
import { createProjectEvent, PROJECT_EVENT_TYPES } from '../services/eventService'
import { validateFile } from '../utils/fileValidation'

const prisma = new PrismaClient()

const router = Router()

// Configure multer for memory storage (files uploaded to S3, not disk)
// Basic validation here; comprehensive validation happens after upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Basic file size check from headers
    const fileSize = parseInt(req.headers['content-length'] || '0');
    if (fileSize > 10 * 1024 * 1024) {
      return cb(new Error('File too large'));
    }
    // Allow all files through - comprehensive validation happens after upload
    cb(null, true);
  }
})

// Upload files to project
router.post('/:projectId/files', authMiddleware, upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params
    const userId = req.user!.id
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      })
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: {
          where: {
            freelancerId: userId,
            status: 'ACCEPTED'
          }
        }
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Check if user is client or assigned freelancer
    const isClient = project.clientId === userId
    const isFreelancer = project.freelancerId === userId || project.applications.length > 0

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      })
    }

    // Validate each file with magic byte verification
    const validationResults = await Promise.all(
      files.map(file => validateFile(file.buffer, file.originalname))
    )

    // Check for validation errors
    const errors = validationResults.filter(r => !r.isValid)
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: errors.map(e => e.error)
      })
    }

    // Upload validated files to S3
    const s3UploadPromises = files.map((file, index) => {
      const validation = validationResults[index]
      // Create a new file object with validated MIME type
      return uploadProjectFileToS3(
        {
          ...file,
          mimetype: validation.detectedMimeType! // Use detected MIME type from magic bytes
        },
        { projectId, userId }
      )
    })
    const s3Urls = await Promise.all(s3UploadPromises)

    // Create database records for uploaded files
    const uploadedFiles = await Promise.all(
      files.map((file, index) => {
        const validation = validationResults[index]
        return prisma.projectFile.create({
          data: {
            projectId,
            fileName: path.basename(s3Urls[index]), // Extract filename from S3 URL
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: validation.detectedMimeType!, // Use validated MIME type
            filePath: s3Urls[index], // Store S3 URL instead of local path
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
      })
    )

    // Get uploader info for event
    const uploader = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    })

    // Create timeline event for file upload
    if (uploader) {
      await createProjectEvent({
        projectId,
        eventType: PROJECT_EVENT_TYPES.FILE_UPLOADED,
        actorId: userId,
        actorName: `${uploader.firstName} ${uploader.lastName}`,
        metadata: {
          files: uploadedFiles.map(f => ({
            id: f.id,
            fileName: f.originalName,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            filePath: f.filePath
          }))
        }
      })
    }

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

// Get all files for a project
router.get('/:projectId/files', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params
    const userId = req.user!.id

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: {
          where: {
            freelancerId: userId,
            status: 'ACCEPTED'
          }
        }
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Check if user is client or assigned freelancer
    const isClient = project.clientId === userId
    const isFreelancer = project.freelancerId === userId || project.applications.length > 0

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      })
    }

    const files = await prisma.projectFile.findMany({
      where: { projectId },
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

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: {
            applications: {
              where: {
                freelancerId: userId,
                status: 'ACCEPTED'
              }
            }
          }
        }
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Check if user has access to the project
    const isClient = file.project.clientId === userId
    const isFreelancer = file.project.freelancerId === userId || file.project.applications.length > 0

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this file'
      })
    }

    // Generate signed S3 URL (expires in 1 hour)
    const signedUrl = await getProjectFileDownloadUrl(file.filePath)

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

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
      include: {
        project: true
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Only the uploader or project client can delete files
    const isUploader = file.uploadedById === userId
    const isClient = file.project.clientId === userId

    if (!isUploader && !isClient) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this file'
      })
    }

    // Delete file from S3
    await deleteProjectFileFromS3(file.filePath)

    // Delete database record
    await prisma.projectFile.delete({
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
