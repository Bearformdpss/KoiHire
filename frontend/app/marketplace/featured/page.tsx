'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star, MapPin, Clock, Loader2 } from 'lucide-react'
import { FreelancerOnly } from '@/components/auth/RoleProtection'
import { projectsApi } from '@/lib/api/projects'
import BidSubmissionModal from '@/components/projects/BidSubmissionModal'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  description: string
  minBudget: number
  maxBudget: number
  timeline: string
  createdAt: string
  client: {
    id: string
    username: string
    rating: number
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

export default function FeaturedProjectsPage() {
  const router = useRouter()
  const [spotlightProjects, setSpotlightProjects] = useState<Project[]>([])
  const [premiumProjects, setPremiumProjects] = useState<Project[]>([])
  const [loadingSpotlight, setLoadingSpotlight] = useState(true)
  const [loadingPremium, setLoadingPremium] = useState(true)
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showBidModal, setShowBidModal] = useState(false)

  useEffect(() => {
    fetchFeaturedProjects()
  }, [])

  // Spotlight carousel rotation - 10 seconds per project
  useEffect(() => {
    if (spotlightProjects.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSpotlightIndex(prev => 
        prev >= spotlightProjects.length - 1 ? 0 : prev + 1
      )
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [spotlightProjects.length])

  const fetchFeaturedProjects = async () => {
    try {
      // Fetch SPOTLIGHT projects
      const spotlightResponse = await projectsApi.getProjects({
        featured: true,
        featuredLevel: 'SPOTLIGHT',
        limit: 10,
        sortBy: 'featured_priority'
      })
      
      if (spotlightResponse.success && spotlightResponse.data) {
        setSpotlightProjects(spotlightResponse.data.projects || [])
      }

      // Fetch PREMIUM projects
      const premiumResponse = await projectsApi.getProjects({
        featured: true,
        featuredLevel: 'PREMIUM',
        limit: 20,
        sortBy: 'featured_priority'
      })
      
      if (premiumResponse.success && premiumResponse.data) {
        setPremiumProjects(premiumResponse.data.projects || [])
      }

    } catch (error) {
      console.error('Failed to fetch featured projects:', error)
      toast.error('Failed to load featured projects')
    } finally {
      setLoadingSpotlight(false)
      setLoadingPremium(false)
    }
  }

  const handleApplyToProject = (project: Project) => {
    setSelectedProject(project)
    setShowBidModal(true)
  }

  const handleBidSuccess = () => {
    toast.success('Application submitted successfully!')
    fetchFeaturedProjects()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  }

  if (loadingSpotlight && loadingPremium) {
    return (
      <FreelancerOnly>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading featured projects...</p>
          </div>
        </div>
      </FreelancerOnly>
    )
  }

  return (
    <FreelancerOnly>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/marketplace')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Featured Projects</h1>
              <p className="text-xl text-gray-600">
                Premium projects from verified clients who invested in maximum visibility
              </p>
            </div>
          </div>

          {/* SPOTLIGHT Hero Section */}
          {(!loadingSpotlight && spotlightProjects.length > 0) && (
            <div className="mb-12">
              <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-2xl overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                
                <div className="relative px-6 py-8 text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">⭐ SPOTLIGHT Projects</h2>
                  <p className="text-purple-200 mb-6">Highest-tier premium projects with maximum visibility</p>
                </div>
                
                {/* Spotlight Carousel */}
                <div className="relative h-[360px] overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${currentSpotlightIndex * 100}%)` }}
                  >
                    {spotlightProjects.map((project, index) => (
                      <div
                        key={project.id}
                        className="w-full flex-shrink-0 px-6 py-6 flex items-center"
                      >
                      <div className="w-full max-w-5xl mx-auto">
                          {/* Header */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-xs">
                              ⭐ SPOTLIGHT PROJECT
                            </div>
                            <div className="bg-white/20 backdrop-blur text-white px-2 py-1 rounded-full text-xs">
                              Premium Tier
                            </div>
                          </div>

                          {/* Project Content */}
                          <div className="grid md:grid-cols-3 gap-6 items-center">
                            {/* Project Details */}
                            <div className="md:col-span-2 text-white">
                              <h2 className="text-xl md:text-2xl font-bold mb-3 leading-tight line-clamp-2">
                                {project.title}
                              </h2>
                              <p className="text-sm md:text-base text-purple-100 mb-4 leading-relaxed line-clamp-2">
                                {project.description}
                              </p>
                              
                              {/* Project Meta */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div>
                                  <div className="text-purple-200 text-xs">Budget</div>
                                  <div className="text-lg font-bold text-yellow-400">
                                    ${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-purple-200 text-xs">Category</div>
                                  <div className="text-white font-semibold text-sm">{project.category.name}</div>
                                </div>
                                <div>
                                  <div className="text-purple-200 text-xs">Applications</div>
                                  <div className="text-white font-semibold text-sm">{project._count.applications} bids</div>
                                </div>
                                <div>
                                  <div className="text-purple-200 text-xs">Posted</div>
                                  <div className="text-white font-semibold text-sm">{getTimeAgo(project.createdAt)}</div>
                                </div>
                              </div>

                              {/* Skills */}
                              <div className="flex flex-wrap gap-2">
                                {project.skills.slice(0, 4).map((skill) => (
                                  <span
                                    key={skill.skill.id}
                                    className="px-2 py-1 bg-white/20 backdrop-blur text-white text-xs rounded-full"
                                  >
                                    {skill.skill.name}
                                  </span>
                                ))}
                                {project.skills.length > 4 && (
                                  <span className="px-2 py-1 bg-white/10 text-purple-200 text-xs rounded-full">
                                    +{project.skills.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* CTA Section */}
                            <div className="text-center">
                              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                                <div className="text-white mb-3">
                                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-lg">⭐</span>
                                  </div>
                                  <h3 className="font-bold text-sm">Premium Client</h3>
                                  <p className="text-purple-200 text-xs">Verified & Featured</p>
                                </div>
                                
                                <Button
                                  onClick={() => handleApplyToProject(project)}
                                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 text-sm"
                                >
                                  Apply to SPOTLIGHT
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Carousel Controls */}
                  <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
                    {spotlightProjects.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSpotlightIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentSpotlightIndex
                            ? 'bg-yellow-400 scale-110'
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Premium Projects Section */}
          {(!loadingPremium && premiumProjects.length > 0) && (
            <div className="mb-12">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">💎 Premium Featured Projects</h2>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    Premium Tier
                  </span>
                </div>
                <p className="text-gray-600 mb-6">
                  All premium featured projects from verified clients who invested in enhanced visibility
                </p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {premiumProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg p-4 shadow-sm border border-amber-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{project.title}</h3>
                          <p className="text-green-600 font-medium mb-2">
                            ${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}
                          </p>
                          <span className="text-sm text-gray-500">{project.category.name}</span>
                        </div>
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium ml-2">
                          Featured
                        </span>
                      </div>
                      
                      {/* Skills */}
                      {project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill.skill.id}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {skill.skill.name}
                            </span>
                          ))}
                          {project.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded">
                              +{project.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{project.client.rating || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-xs">
                          {project._count.applications} bids • {getTimeAgo(project.createdAt)}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => handleApplyToProject(project)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!loadingSpotlight && !loadingPremium && spotlightProjects.length === 0 && premiumProjects.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No featured projects available</h3>
              <p className="text-gray-600 mb-6">
                Check back later for premium projects from verified clients.
              </p>
              <Button
                onClick={() => router.push('/marketplace')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse All Projects
              </Button>
            </div>
          )}
        </div>

        {/* Bid Submission Modal */}
        {selectedProject && (
          <BidSubmissionModal
            project={selectedProject}
            isOpen={showBidModal}
            onClose={() => {
              setShowBidModal(false)
              setSelectedProject(null)
            }}
            onSuccess={handleBidSuccess}
          />
        )}
      </div>
    </FreelancerOnly>
  )
}