import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.projectId
    const uploadPath = path.join(__dirname, '../../uploads/projects', projectId)

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
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
      // Clean up uploaded files
      files.forEach(file => fs.unlinkSync(file.path))
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Check if user is client or assigned freelancer
    const isClient = project.clientId === userId
    const isFreelancer = project.freelancerId === userId || project.applications.length > 0

    if (!isClient && !isFreelancer) {
      // Clean up uploaded files
      files.forEach(file => fs.unlinkSync(file.path))
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      })
    }

    // Create database records for uploaded files
    const uploadedFiles = await Promise.all(
      files.map(file =>
        prisma.projectFile.create({
          data: {
            projectId,
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            filePath: file.path,
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

// Download a file
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

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      })
    }

    // Send file
    res.download(file.filePath, file.originalName)
  } catch (error: any) {
    console.error('File download error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
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

    // Delete file from disk
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath)
    }

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
