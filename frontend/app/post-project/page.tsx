'use client'

import { ClientOnly } from '@/components/auth/RoleProtection'
import PostProjectForm from '@/components/projects/PostProjectForm'

export default function PostProjectPage() {
  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <PostProjectForm />
        </div>
      </div>
    </ClientOnly>
  )
}