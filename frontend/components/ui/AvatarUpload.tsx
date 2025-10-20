'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface AvatarUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarUpload({ 
  value, 
  onChange, 
  className = '',
  size = 'md'
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
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
      formData.append('avatar', file)

      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const uploadedUrl = `http://localhost:5003${response.data.avatar}`
        
        // Clean up object URL
        URL.revokeObjectURL(objectUrl)
        
        // Update with server URL
        setPreview(uploadedUrl)
        onChange(uploadedUrl)
        
        toast.success('Avatar uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload avatar')
      
      // Clean up on error
      URL.revokeObjectURL(objectUrl)
      setPreview(value || null)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    onChange('')
  }

  return (
    <div className={className}>
      <div className="flex items-center space-x-4">
        {/* Avatar Display */}
        <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300 group`}>
          {preview ? (
            <>
              {preview.startsWith('blob:') ? (
                // For local previews, use img tag to avoid Next.js optimization issues
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                // For uploaded images, use Next.js Image component
                <Image
                  src={preview}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                  sizes={size === 'sm' ? '64px' : size === 'md' ? '96px' : '128px'}
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
                  onClick={removeAvatar}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className={`${size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'} text-gray-400`} />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2 inline" />
                {preview ? 'Change Avatar' : 'Upload Avatar'}
              </>
            )}
          </button>
          
          {preview && !uploading && (
            <button
              type="button"
              onClick={removeAvatar}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Remove
            </button>
          )}
        </div>
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
        Upload an avatar image. Max file size: 5MB. Recommended size: 400x400px.
      </p>
    </div>
  )
}