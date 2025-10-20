'use client'

import React from 'react'
import { Plus, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'

interface QuickActionBarProps {
  onCreateProject: () => void
}

export function QuickActionBar({ onCreateProject }: QuickActionBarProps) {
  const router = useRouter()
  const { unreadCount } = useUnreadMessages()

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Button
        onClick={onCreateProject}
        className="bg-koi-orange hover:bg-koi-orange/90 text-white font-medium px-6"
        size="lg"
      >
        <Plus className="w-4 h-4 mr-2" />
        Post New Project
      </Button>

      <Button
        onClick={() => router.push('/messages')}
        variant="outline"
        size="lg"
        className="font-medium relative"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Messages
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </div>
  )
}
