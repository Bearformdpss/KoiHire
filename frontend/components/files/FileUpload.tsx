'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  X, 
  File as FileIcon, 
  Image, 
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number // in MB
  maxFiles?: number
  disabled?: boolean
}

export function FileUpload({ 
  onFileSelect, 
  acceptedFileTypes = [],
  maxFileSize = 10,
  maxFiles = 5,
  disabled = false
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    const errors: string[] = []

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      errors.push(`${file.name} is too large (max ${maxFileSize}MB)`)
    }

    // Check file type if specified
    if (acceptedFileTypes.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type
      
      if (!acceptedFileTypes.some(type => 
        type.includes('*') ? mimeType.startsWith(type.replace('*', '')) :
        type === fileExtension || type === mimeType
      )) {
        errors.push(`${file.name} type not allowed`)
      }
    }

    if (errors.length > 0) {
      setErrors(prev => [...prev, ...errors])
      return false
    }

    return true
  }

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    setErrors([])

    // Check total file count
    if (selectedFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate each file
    fileArray.forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles]
      setSelectedFiles(newFiles)
      onFileSelect(newFiles)
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !disabled) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFileSelect(newFiles)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText className="w-4 h-4" />
    } else {
      return <FileIcon className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className={`w-8 h-8 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
          <div>
            <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              Drag and drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={`font-medium ${
                  disabled ? 'text-gray-400' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                browse
              </button>
            </p>
            <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Maximum {maxFiles} files, {maxFileSize}MB each
              {acceptedFileTypes.length > 0 && (
                <span> • {acceptedFileTypes.join(', ')}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
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
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}