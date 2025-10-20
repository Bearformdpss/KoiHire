'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { ProjectFiles } from '@/components/files/ProjectFiles'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  status: string
  clientId: string
  freelancerId?: string
  client: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  freelancer?: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
}

export default function ProjectFilesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const projectId = params.id as string

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await projectsApi.getProject(projectId)
      const proj = response.data?.project || response.project

      if (response.success && proj) {
        setProject(proj)
      } else {
        toast.error('Project not found')
        router.push('/marketplace')
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project details')
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const canUploadFiles = project && (
    user?.id === project.clientId || 
    user?.id === project.freelancerId
  )

  if (loading) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </AuthRequired>
    )
  }

  if (!project) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Project</span>
              <span>•</span>
              <span className="font-medium text-gray-900">{project.title}</span>
              <span>•</span>
              <span>Files</span>
            </div>
          </div>

          {/* Project Files Component */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <ProjectFiles
                projectId={projectId}
                projectTitle={project.title}
                canUpload={canUploadFiles || false}
              />
            </div>
          </div>

          {/* Project Participants Info */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Participants</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Client */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Client</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {project.client.firstName.charAt(0)}{project.client.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {project.client.firstName} {project.client.lastName}
                    </p>
                    <p className="text-sm text-gray-600">@{project.client.username}</p>
                  </div>
                </div>
              </div>

              {/* Freelancer */}
              {project.freelancer ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Freelancer</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">
                        {project.freelancer.firstName.charAt(0)}{project.freelancer.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {project.freelancer.firstName} {project.freelancer.lastName}
                      </p>
                      <p className="text-sm text-gray-600">@{project.freelancer.username}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Freelancer</h4>
                  <p className="text-sm text-gray-600">Not yet assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthRequired>
  )
}