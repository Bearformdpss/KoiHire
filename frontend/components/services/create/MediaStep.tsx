'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { SingleImageUpload } from '@/components/ui/SingleImageUpload'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Upload, Image, Video, X, ExternalLink } from 'lucide-react'
import { CreateServiceData } from '@/lib/api/services'

interface MediaStepProps {
  formData: CreateServiceData
  updateFormData: (updates: Partial<CreateServiceData>) => void
}

export default function MediaStep({
  formData,
  updateFormData
}: MediaStepProps) {
  const [videoUrlInput, setVideoUrlInput] = useState(formData.videoUrl || '')

  const handleCoverImageUpload = (imageUrl: string) => {
    updateFormData({ coverImage: imageUrl })
  }

  const handleGalleryImagesUpload = (imageUrls: string[]) => {
    updateFormData({ galleryImages: imageUrls })
  }

  const handleVideoUrlSave = () => {
    updateFormData({ videoUrl: videoUrlInput.trim() })
  }

  const removeVideoUrl = () => {
    setVideoUrlInput('')
    updateFormData({ videoUrl: '' })
  }

  const isValidVideoUrl = (url: string): boolean => {
    if (!url) return true // Empty URL is valid
    try {
      const urlObj = new URL(url)
      // Check for common video platforms
      const validDomains = [
        'youtube.com', 'youtu.be', 'vimeo.com', 'wistia.com',
        'loom.com', 'drive.google.com', 'dropbox.com'
      ]
      return validDomains.some(domain => urlObj.hostname.includes(domain))
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Service Gallery & Media</h2>
        <p className="text-gray-600">
          Add images and videos to showcase your work and attract clients
        </p>
      </div>

      {/* Cover Image */}
      <div>
        <Label>Cover Image</Label>
        <p className="text-sm text-gray-600 mb-3">
          This will be the main image displayed in search results (recommended: 1200x800px)
        </p>

        <Card className="border-dashed border-2 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <SingleImageUpload
                value={formData.coverImage}
                onChange={handleCoverImageUpload}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gallery Images */}
      <div>
        <Label>Gallery Images</Label>
        <p className="text-sm text-gray-600 mb-3">
          Upload additional images to showcase your work (maximum 10 images)
        </p>

        <Card className="border-dashed border-2 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <ImageUpload
              value={formData.galleryImages || []}
              onChange={handleGalleryImagesUpload}
              maxImages={10}
            />
          </CardContent>
        </Card>
      </div>

      {/* Video URL */}
      <div>
        <Label htmlFor="videoUrl">Video URL (Optional)</Label>
        <p className="text-sm text-gray-600 mb-3">
          Add a video to explain your service or show your work process
        </p>

        {formData.videoUrl ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Video className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-900">Video Added</p>
                    <p className="text-sm text-green-700 truncate max-w-md">
                      {formData.videoUrl}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.videoUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeVideoUrl}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                id="videoUrl"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                className={videoUrlInput && !isValidVideoUrl(videoUrlInput) ? 'border-red-300' : ''}
              />
              <Button
                onClick={handleVideoUrlSave}
                disabled={!videoUrlInput.trim() || !isValidVideoUrl(videoUrlInput)}
              >
                Add Video
              </Button>
            </div>

            {videoUrlInput && !isValidVideoUrl(videoUrlInput) && (
              <p className="text-sm text-red-600">
                Please enter a valid video URL from YouTube, Vimeo, or other supported platforms
              </p>
            )}

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Supported platforms:</p>
              <p>YouTube, Vimeo, Loom, Google Drive, Dropbox</p>
            </div>
          </div>
        )}
      </div>

      {/* Media Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📸 Media Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images that showcase your best work</li>
          <li>• Cover image should be eye-catching and represent your service well</li>
          <li>• Gallery images can show before/after, process shots, or variations</li>
          <li>• Videos can significantly increase conversion rates</li>
          <li>• Keep videos short (30-90 seconds) and focus on key benefits</li>
          <li>• Make sure all images are your original work or properly licensed</li>
        </ul>
      </div>

      {/* Current Media Summary */}
      {(formData.coverImage || formData.galleryImages?.length || formData.videoUrl) && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Media Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cover Image:</span>
                <span className={formData.coverImage ? 'text-green-600' : 'text-gray-500'}>
                  {formData.coverImage ? '✓ Added' : 'Not added'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gallery Images:</span>
                <span className={(formData.galleryImages?.length || 0) > 0 ? 'text-green-600' : 'text-gray-500'}>
                  {formData.galleryImages?.length || 0} images
                </span>
              </div>
              <div className="flex justify-between">
                <span>Video:</span>
                <span className={formData.videoUrl ? 'text-green-600' : 'text-gray-500'}>
                  {formData.videoUrl ? '✓ Added' : 'Not added'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}