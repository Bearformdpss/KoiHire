'use client'

import { useRouter } from 'next/navigation'
import { DollarSign, Users, Clock } from 'lucide-react'
import { RecommendedProject } from '@/lib/api/recommendations'
import { formatDistanceToNow } from 'date-fns'

interface ProjectOpportunityCardProps {
  project: RecommendedProject
}

export function ProjectOpportunityCard({ project }: ProjectOpportunityCardProps) {
  const router = useRouter()

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatBudget = (min: number, max: number) => {
    return `$${min} - $${max}`
  }

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return 'Recently posted'
    }
  }

  const handleClick = () => {
    router.push(`/projects/${project.id}`)
  }

  const clientFullName = `${project.client.firstName} ${project.client.lastName}`

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer overflow-hidden"
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Client Info */}
        <div className="flex items-center gap-2 mb-3">
          {project.client.avatar ? (
            <img
              src={project.client.avatar}
              alt={clientFullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full ${getAvatarColor(
                clientFullName
              )} flex items-center justify-center text-white text-xs font-bold`}
            >
              {getInitials(project.client.firstName, project.client.lastName)}
            </div>
          )}
          <span className="text-sm text-gray-600 font-medium">{clientFullName}</span>
        </div>

        {/* Project Title */}
        <h4 className="text-base font-semibold text-[#1E293B] mb-2">
          {project.title}
        </h4>

        {/* Project Description */}
        <p className="text-sm text-gray-600 mb-2">
          {project.description.length > 75
            ? `${project.description.substring(0, 75)}...`
            : project.description}
        </p>

        {/* Category Badge */}
        <div className="mb-3">
          <span className="inline-block px-2 py-1 bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-medium rounded">
            {project.category.name}
          </span>
        </div>

        {/* Metadata */}
        <div className="space-y-1">
          {/* Budget */}
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{formatBudget(project.minBudget, project.maxBudget)}</span>
          </div>

          {/* Applicants */}
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {project.applicationsCount === 0
                ? 'Be the first to apply'
                : `${project.applicationsCount} ${
                    project.applicationsCount === 1 ? 'applicant' : 'applicants'
                  }`}
            </span>
          </div>

          {/* Posted Time */}
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{getTimeAgo(project.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
