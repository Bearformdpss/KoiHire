'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Upload, FileText, Image as ImageIcon, File, Loader2 } from 'lucide-react'
import { uploadApi, FileMetadata } from '@/lib/api/upload'
import toast from 'react-hot-toast'

interface SubmitWorkModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; description: string; files: FileMetadata[] }) => Promise<void>
  orderTitle: string
}

export function SubmitWorkModal({ isOpen, onClose, onSubmit, orderTitle }: SubmitWorkModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return []

    setUploading(true)
    try {
      // Use secure cookie-based authentication via uploadApi
      const response = await uploadApi.uploadDeliverables(selectedFiles)

      if (response?.success && response.data?.files) {
        const filesMetadata = response.data.files
        setUploadedFiles(filesMetadata)
        toast.success(`${selectedFiles.length} file(s) uploaded successfully`)
        return filesMetadata
      } else {
        toast.error('Failed to upload files')
        return []
      }
    } catch (error: any) {
      console.error('File upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload files')
      return []
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a delivery title')
      return
    }

    setSubmitting(true)
    try {
      // Upload files first if any
      let files = uploadedFiles
      if (selectedFiles.length > 0 && uploadedFiles.length === 0) {
        files = await handleUploadFiles()
      }

      // Submit the deliverable
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        files
      })

      // Reset form
      setTitle('')
      setDescription('')
      setSelectedFiles([])
      setUploadedFiles([])
      onClose()
    } catch (error) {
      console.error('Submit work error:', error)
      // Error handling is done in parent component
    } finally {
      setSubmitting(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-600" />
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-600" />
    } else {
      return <File className="w-5 h-5 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Submit Work</h2>
            <p className="text-sm text-gray-600 mt-1">{orderTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Title <span className="text-red-600">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Final website design, Logo variations, etc."
              className="w-full"
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your delivery, explain any decisions, or add usage instructions..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={submitting}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload images, documents, or any files related to your delivery. Maximum 10 files.
            </p>

            {/* Upload Button */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                disabled={submitting || selectedFiles.length >= 10}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Click to upload files
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF, DOC, ZIP up to 10MB each
                </span>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Selected Files ({selectedFiles.length})
                </p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-700 p-1"
                      disabled={submitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Make sure your delivery meets all the requirements specified by the client.
              Include all necessary files and clear instructions if needed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting || uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting || uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploading ? 'Uploading files...' : 'Submitting...'}
              </>
            ) : (
              'Submit Delivery'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
