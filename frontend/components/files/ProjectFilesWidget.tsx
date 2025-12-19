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
import { validateFile } from '@/lib/utils/fileUpload'

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

interface ProjectFilesWidgetProps {
  projectId: string
  canUpload?: boolean
}

export function ProjectFilesWidget({ projectId, canUpload = true }: ProjectFilesWidgetProps) {
  const { user } = useAuthStore()
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)
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

    // Validate all files before upload
    const invalidFiles: string[] = []
    selectedFiles.forEach(file => {
      const validation = validateFile(file)
      if (!validation.valid) {
        invalidFiles.push(`${file.name}: ${validation.error}`)
      }
    })

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files:\n${invalidFiles.join('\n')}`)
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
      setShowUploadModal(false)
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
      const response = await filesApi.downloadFile(file.id)
      const { downloadUrl, fileName } = response

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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />
    } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="w-4 h-4 text-red-500" />
    } else {
      return <FileIcon className="w-4 h-4 text-gray-500" />
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Project Files</h3>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Project Files</h3>
          {canUpload && (
            <Button
              onClick={() => setShowUploadModal(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="text-center py-6">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadFile(file)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {file.uploadedBy.id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {files.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAllModal(true)}
              >
                View All ({files.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFiles([])
                  }}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer mb-4"
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.txt,image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFiles(Array.from(e.target.files))
                    }
                  }}
                  className="hidden"
                  disabled={uploading}
                />
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <p className="text-gray-700 mb-1">
                  Click to browse or drag and drop files here
                </p>
                <p className="text-xs text-gray-500">
                  Maximum 10 files, 10MB each • PDF, DOC, DOCX, Images
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
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
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFiles([])
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
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
          </div>
        </div>
      )}

      {/* View All Modal */}
      {showAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Files ({files.length})</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(file.mimeType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
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
                      {file.uploadedBy.id === user?.id && (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
