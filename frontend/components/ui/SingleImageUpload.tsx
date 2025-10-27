'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5003'


interface SingleImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
  endpoint?: 'portfolio-thumbnail' | 'portfolio-thumbnail-s3' | 'service-cover' | 'avatar-s3' // Default: portfolio-thumbnail
  fieldName?: string // Default varies by endpoint
}

export function SingleImageUpload({
  value,
  onChange,
  className = '',
  endpoint = 'portfolio-thumbnail',
  fieldName
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine field name and response key based on endpoint
  const getFieldName = () => {
    if (fieldName) return fieldName
    if (endpoint === 'service-cover') return 'image'
    if (endpoint === 'avatar-s3') return 'avatar'
    return 'thumbnail' // portfolio-thumbnail, portfolio-thumbnail-s3
  }

  const getResponseKey = () => {
    if (endpoint === 'service-cover') return 'coverImage'
    if (endpoint === 'avatar-s3') return 'avatar'
    return 'thumbnail' // portfolio-thumbnail, portfolio-thumbnail-s3
  }

  // Check if this endpoint uses S3 (returns absolute URLs)
  const isS3Endpoint = () => {
    return endpoint === 'service-cover' ||
           endpoint === 'avatar-s3' ||
           endpoint === 'portfolio-thumbnail-s3'
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append(getFieldName(), file)

      const response = await api.post(`/upload/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        // For S3 uploads, the URL is already absolute
        // For local uploads, prepend API_BASE_URL
        const uploadedUrl = isS3Endpoint()
          ? response.data[getResponseKey()]
          : `${API_BASE_URL}${response.data[getResponseKey()]}`
        
        // Clean up object URL
        URL.revokeObjectURL(objectUrl)
        
        // Update with server URL
        setPreview(uploadedUrl)
        onChange(uploadedUrl)
        
        toast.success('Thumbnail uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload thumbnail')
      
      // Clean up on error
      URL.revokeObjectURL(objectUrl)
      setPreview(value || null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    onChange('')
  }

  return (
    <div className={className}>
      <div className="w-full max-w-xs">
        {preview ? (
          <div className="relative aspect-video group">
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-300">
              {preview.startsWith('blob:') ? (
                // For local previews, use img tag to avoid Next.js optimization issues
                <img
                  src={preview}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                // For uploaded images, use Next.js Image component
                <Image
                  src={preview}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              )}
              
              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              
              {/* Remove button */}
              {!uploading && (
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Upload Thumbnail</span>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Info text */}
      <p className="text-xs text-gray-500 mt-2">
        Upload a thumbnail image. Max file size: 5MB.
      </p>
    </div>
  )
}