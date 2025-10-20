'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { projectsApi } from '@/lib/api/projects'
import { Loader2, DollarSign, Clock, Target, Sparkles } from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  minBudget: number
  maxBudget: number
  timeline: string
  status: string
  createdAt: string
  client: {
    id: string
    username: string
    firstName: string
    lastName: string
    rating: number | null
    avatar: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  }
  skills: Array<{
    skill: {
      id: string
      name: string
    }
  }>
  _count: {
    applications: number
  }
}

export function SkillMatchedProjects() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatchedProjects()
  }, [])

  const fetchMatchedProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectsApi.getMatchedProjects(5)

      if (response.success && response.data) {
        setProjects(response.data.projects || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch matched projects:', err)
      setError(err.message || 'Failed to load matched projects')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleViewAll = () => {
    router.push('/projects')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-koi-orange" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matched Projects</h3>
          <p className="text-sm text-gray-600 mb-4">
            We couldn't find any projects matching your skills right now.
          </p>
          <button
            onClick={handleViewAll}
            className="text-koi-orange hover:text-koi-orange/80 font-medium text-sm"
          >
            Browse All Projects →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-koi-orange" />
          <h2 className="text-lg font-bold text-gray-900">Projects For You</h2>
        </div>
        <button
          onClick={handleViewAll}
          className="text-sm text-koi-orange hover:text-koi-orange/80 font-medium"
        >
          View All
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        These projects match your skills and expertise
      </p>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className="p-4 border border-gray-200 rounded-lg hover:border-koi-orange hover:shadow-sm transition-all cursor-pointer"
          >
            {/* Project Title */}
            <h3 className="font-semibold text-gray-900 mb-2 hover:text-koi-orange transition-colors">
              {project.title}
            </h3>

            {/* Project Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {project.description}
            </p>

            {/* Project Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  ${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{project.timeline}</span>
              </div>
              <div className="text-xs text-gray-500">
                {project._count.applications} {project._count.applications === 1 ? 'applicant' : 'applicants'}
              </div>
            </div>

            {/* Skills */}
            {project.skills && project.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.skills.slice(0, 4).map((skillItem) => (
                  <span
                    key={skillItem.skill.id}
                    className="px-2 py-1 bg-koi-orange/10 text-koi-orange text-xs font-medium rounded"
                  >
                    {skillItem.skill.name}
                  </span>
                ))}
                {project.skills.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    +{project.skills.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
