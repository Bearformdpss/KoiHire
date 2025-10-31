'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Download,
  Trash2,
  Upload,
  Folder,
  File as FileIcon,
  Image,
  FileText,
  Loader2,
  Plus,
  X
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'
import { filesApi } from '@/services/files.api'

interface ProjectFile {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  createdAt: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

interface ProjectFilesProps {
  projectId: string
  projectTitle: string
  canUpload?: boolean
}

export function ProjectFiles({ projectId, projectTitle, canUpload = false }: ProjectFilesProps) {
  const { user } = useAuthStore()
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProjectFiles()
  }, [projectId])

  const fetchProjectFiles = async () => {
    try {
      const response = await filesApi.getFiles(projectId)
      setFiles(response.data?.files || [])
    } catch (error) {
      console.error('Failed to fetch project files:', error)
      toast.error('Failed to load project files')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      const response = await filesApi.uploadFiles(projectId, formData)
      setFiles(prev => [...prev, ...(response.data?.files || [])])

      toast.success(`${selectedFiles.length} file(s) uploaded successfully`)
      setSelectedFiles([])
      setShowUpload(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error: any) {
      console.error('Failed to upload files:', error)
      toast.error(error.response?.data?.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      await filesApi.deleteFile(fileId)
      setFiles(prev => prev.filter(file => file.id !== fileId))
      toast.success('File deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      toast.error(error.response?.data?.message || 'Failed to delete file')
    }
  }

  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      // Backend returns signed S3 URL
      const response = await filesApi.downloadFile(file.id)
      const { downloadUrl, fileName } = response

      // Open signed URL in new tab to trigger download
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = downloadUrl
      a.download = fileName || file.originalName
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success('File download started')
    } catch (error: any) {
      console.error('Failed to download file:', error)
      toast.error(error.response?.data?.message || 'Failed to download file')
    }
  }

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />
    } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-red-500" />
    } else {
      return <FileIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading project files...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-koi-navy">Project Files</h2>
          <p className="text-gray-600 mt-1">{projectTitle}</p>
        </div>
        {canUpload && (
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-koi-orange hover:bg-koi-orange/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        )}
      </div>

      {/* Upload Section */}
      {showUpload && canUpload && (
        <div className="bg-koi-teal/5 border border-koi-teal/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-koi-navy mb-4">Upload Files</h3>

          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-koi-teal transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.svg,image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFiles(Array.from(e.target.files))
                }
              }}
              className="hidden"
              disabled={uploading}
            />

            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-koi-teal" />
              <div>
                <p className="text-sm text-gray-700">
                  Drag and drop files here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="font-medium text-koi-teal hover:text-koi-orange"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 5 files, 10MB each • PDF, DOC, DOCX, Images
                </p>
              </div>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-koi-navy">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <FileIcon className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFiles = selectedFiles.filter((_, i) => i !== index)
                        setSelectedFiles(newFiles)
                      }}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([])
                    setShowUpload(false)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="bg-koi-orange hover:bg-koi-orange/90"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} File(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-koi-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="w-8 h-8 text-koi-teal" />
          </div>
          <h3 className="text-lg font-medium text-koi-navy mb-2">No files uploaded yet</h3>
          <p className="text-gray-600 mb-6">
            Project files and documents will appear here once uploaded.
          </p>
          {canUpload && (
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-koi-orange hover:bg-koi-orange/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload First File
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-koi-navy/5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-koi-navy">
              Files ({files.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div key={file.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {getFileIcon(file.mimeType, file.fileName)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.originalName}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>•</span>
                        <span>
                          Uploaded by {file.uploadedBy.firstName} {file.uploadedBy.lastName}
                        </span>
                        <span>•</span>
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    {(canUpload || file.uploadedBy.id === user?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}