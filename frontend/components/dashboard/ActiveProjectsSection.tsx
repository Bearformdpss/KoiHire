'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { HorizontalScrollCarousel } from '@/components/ui/HorizontalScrollCarousel'
import { Briefcase, Users, Clock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Project {
  id: string
  title: string
  description: string
  minBudget: number
  maxBudget: number
  timeline: string
  status: string
  createdAt: string
  _count: {
    applications: number
  }
}

interface ActiveProjectsSectionProps {
  projects: Project[]
}

export function ActiveProjectsSection({ projects }: ActiveProjectsSectionProps) {
  const router = useRouter()

  if (projects.length === 0) {
    return null // Don't show section if no projects
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-koi-orange/10 text-koi-navy border-koi-orange/20'
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'just now'
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  return (
    <div className="mb-8">
      <HorizontalScrollCarousel
        title="Your Active Projects"
        viewAllText="View All Projects"
        onViewAll={() => router.push('/my-projects')}
      >
        {projects.slice(0, 6).map((project) => (
          <div
            key={project.id}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="flex-shrink-0 w-[320px] bg-white rounded-lg border border-gray-200 p-5 cursor-pointer hover:shadow-lg transition-shadow"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400">{getTimeAgo(project.createdAt)}</span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 h-14">
              {project.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
              {project.description}
            </p>

            {/* Project Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-semibold text-green-600">
                  ${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{project.timeline}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{project._count.applications} bids</span>
                </div>
              </div>
            </div>

            {/* View Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/projects/${project.id}`)
              }}
            >
              <Eye className="w-3 h-3 mr-2" />
              View Project
            </Button>
          </div>
        ))}
      </HorizontalScrollCarousel>
    </div>
  )
}
