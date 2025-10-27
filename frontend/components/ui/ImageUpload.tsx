'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from './button'
import Image from 'next/image'
import { api } from '@/lib/api'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5003'

import toast from 'react-hot-toast'

interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  className?: string
  endpoint?: 'portfolio-images' | 'portfolio-images-s3' | 'service-gallery' // Default: portfolio-images
  fieldName?: string // Default: 'images' for all
}

interface ImageUploadState {
  previews: Array<{
    url: string
    file?: File
    uploaded: boolean
    uploading: boolean
  }>
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  className = '',
  endpoint = 'portfolio-images',
  fieldName = 'images'
}: ImageUploadProps) {
  const [state, setState] = useState<ImageUploadState>({
    previews: value.map(url => ({ url, uploaded: true, uploading: false }))
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine response key based on endpoint
  const getResponseKey = () => {
    return endpoint === 'service-gallery' ? 'galleryImages' : 'images'
  }

  // Check if this endpoint uses S3 (returns absolute URLs)
  const isS3Endpoint = () => {
    return endpoint === 'service-gallery' || endpoint === 'portfolio-images-s3'
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - state.previews.length

    if (fileArray.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}`)
      return
    }

    // Add files to previews with local URLs
    const newPreviews = fileArray.map(file => ({
      url: URL.createObjectURL(file),
      file,
      uploaded: false,
      uploading: false
    }))

    setState(prev => ({
      previews: [...prev.previews, ...newPreviews]
    }))

    // Start uploading files
    uploadFiles(fileArray)
  }

  const uploadFiles = async (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append(fieldName, file)
    })

    try {
      // Mark files as uploading
      setState(prev => ({
        previews: prev.previews.map(preview =>
          files.some(f => preview.file === f)
            ? { ...preview, uploading: true }
            : preview
        )
      }))

      const response = await api.post(`/upload/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const uploadedUrls = response.data[getResponseKey()]

        // Update previews with server URLs
        setState(prev => {
          const updatedPreviews = prev.previews.map(preview => {
            if (preview.file && files.includes(preview.file)) {
              // Find corresponding uploaded URL
              const index = files.indexOf(preview.file)
              // For S3 uploads, URLs are already absolute
              // For local uploads, prepend API_BASE_URL
              const fullUrl = isS3Endpoint()
                ? uploadedUrls[index]
                : `${API_BASE_URL}${uploadedUrls[index]}`
              return {
                url: fullUrl,
                uploaded: true,
                uploading: false
              }
            }
            return preview
          })

          // Clean up object URLs
          prev.previews.forEach(preview => {
            if (preview.file && files.includes(preview.file)) {
              URL.revokeObjectURL(preview.url)
            }
          })

          return { previews: updatedPreviews }
        })

        // Update parent component with new URLs
        const allUrls = [
          ...state.previews.filter(p => p.uploaded && !files.some(f => p.file === f)).map(p => p.url),
          ...uploadedUrls.map((url: string) =>
            isS3Endpoint() ? url : `${API_BASE_URL}${url}`
          )
        ]
        onChange(allUrls)

        toast.success(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images')
      
      // Remove failed uploads
      setState(prev => ({
        previews: prev.previews.filter(preview => 
          !files.some(f => preview.file === f)
        )
      }))
    }
  }

  const removeImage = (index: number) => {
    setState(prev => {
      const preview = prev.previews[index]
      
      // Clean up object URL if it's a local preview
      if (preview.file) {
        URL.revokeObjectURL(preview.url)
      }
      
      const newPreviews = prev.previews.filter((_, i) => i !== index)
      return { previews: newPreviews }
    })

    // Update parent component
    const newUrls = state.previews
      .filter((_, i) => i !== index)
      .filter(p => p.uploaded)
      .map(p => p.url)
    onChange(newUrls)
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {state.previews.map((preview, index) => (
          <div key={index} className="relative aspect-square group">
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
              {preview.file && !preview.uploaded ? (
                // For local previews, use img tag to avoid Next.js optimization issues
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                // For uploaded images, use Next.js Image component
                <Image
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              )}
              
              {/* Upload overlay */}
              {preview.uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              
              {/* Remove button */}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
              
              {/* Upload status indicator */}
              {!preview.uploaded && !preview.uploading && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                  Pending
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add new image button */}
        {state.previews.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Add Image</span>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Info text */}
      <p className="text-xs text-gray-500 mt-2">
        Upload up to {maxImages} images. Max file size: 5MB per image.
      </p>
    </div>
  )
}