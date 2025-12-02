'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Package, User, Calendar, DollarSign, Edit2, Save, X } from 'lucide-react'
import { WorkItem } from '@/lib/api/freelancer-work'

interface ActiveWorkCardProps {
  item: WorkItem
  onNoteUpdate: (itemId: string, note: string) => Promise<void>
  onNoteDelete: (itemId: string) => Promise<void>
}

export default function ActiveWorkCard({ item, onNoteUpdate, onNoteDelete }: ActiveWorkCardProps) {
  const router = useRouter()
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(item.note || '')
  const [isSaving, setIsSaving] = useState(false)

  const borderColor = item.type === 'PROJECT' ? 'border-blue-500' : 'border-orange-500'
  const typeColor = item.type === 'PROJECT' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('progress')) return 'bg-blue-500 text-white border-blue-600'
    if (statusLower.includes('delivered') || statusLower.includes('review')) return 'bg-purple-500 text-white border-purple-600'
    if (statusLower.includes('completed')) return 'bg-green-500 text-white border-green-600'
    if (statusLower.includes('pending')) return 'bg-yellow-500 text-white border-yellow-600'
    if (statusLower.includes('accepted')) return 'bg-cyan-500 text-white border-cyan-600'
    if (statusLower.includes('revision')) return 'bg-orange-500 text-white border-orange-600'
    if (statusLower.includes('paused')) return 'bg-gray-500 text-white border-gray-600'
    if (statusLower.includes('disputed')) return 'bg-red-500 text-white border-red-600'
    return 'bg-gray-500 text-white border-gray-600'
  }

  const formatDeliveryDate = (deadline: string | null) => {
    if (!deadline) return null
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${diffDays} days`
    }
  }

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      // If note is empty, delete it
      await handleDeleteNote()
      return
    }

    setIsSaving(true)
    try {
      await onNoteUpdate(item.id, noteText.trim())
      setIsEditingNote(false)
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async () => {
    setIsSaving(true)
    try {
      await onNoteDelete(item.id)
      setNoteText('')
      setIsEditingNote(false)
    } catch (error) {
      console.error('Failed to delete note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNoteText(item.note || '')
    setIsEditingNote(false)
  }

  return (
    <Card className={`border-2 ${borderColor} hover:shadow-lg transition-all duration-200 h-full flex flex-col`}>
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {item.type === 'PROJECT' ? (
              <Briefcase className="w-4 h-4 text-blue-600" />
            ) : (
              <Package className="w-4 h-4 text-orange-600" />
            )}
            <Badge className={`${typeColor} text-xs font-medium border`}>
              {item.type}
            </Badge>
          </div>
          <Badge className={`${getStatusColor(item.status)} text-xs font-medium border`}>
            {item.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
          {item.description}
        </p>

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4 text-gray-400" />
            <span>{item.client.firstName} {item.client.lastName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-koi-orange">
              ${item.amount.toLocaleString()}
            </span>
          </div>
          {item.deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{formatDeliveryDate(item.deadline)}</span>
            </div>
          )}
        </div>

        {/* Note Section */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          {isEditingNote ? (
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes to help you stay on track"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-koi-orange/20 focus:border-koi-orange resize-none"
                rows={3}
                disabled={isSaving}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="flex-1 bg-koi-orange hover:bg-koi-orange/90 text-white"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {item.note ? (
                <div
                  onClick={() => setIsEditingNote(true)}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-3 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.note}</p>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Add notes to help you stay on track
                </button>
              )}
            </div>
          )}
        </div>

        {/* View Details Button */}
        <Button
          onClick={() => router.push(item.detailsUrl)}
          className="w-full mt-3 bg-[#1E293B] hover:bg-[#0F172A] text-white font-semibold shadow-md"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}
