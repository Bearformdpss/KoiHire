'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Search, Briefcase, FileText } from 'lucide-react'

export function QuickActionsCard() {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>

      <div className="space-y-2">
        <Button
          onClick={() => router.push('/freelancer/services/create')}
          className="w-full justify-start bg-gradient-to-r from-koi-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Service
        </Button>

        <Button
          onClick={() => router.push('/marketplace')}
          variant="outline"
          className="w-full justify-start"
          size="sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Browse Projects
        </Button>

        <Button
          onClick={() => router.push('/freelancer/services')}
          variant="outline"
          className="w-full justify-start"
          size="sm"
        >
          <Briefcase className="w-4 h-4 mr-2" />
          My Services
        </Button>

        <Button
          onClick={() => router.push('/freelancer/orders')}
          variant="outline"
          className="w-full justify-start"
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          My Orders
        </Button>
      </div>
    </div>
  )
}
