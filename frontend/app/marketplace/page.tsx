'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Search, Filter, ChevronDown, Star, MapPin, Clock, Loader2 } from 'lucide-react'
import { FreelancerOnly } from '@/components/auth/RoleProtection'
import { projectsApi } from '@/lib/api/projects'
import { categoriesApi } from '@/lib/api/categories'
import BidSubmissionModal from '@/components/projects/BidSubmissionModal'
import { AdvancedSearch, SearchFilters } from '@/components/search/AdvancedSearch'
import { SavedSearches } from '@/components/search/SavedSearches'
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
  }
  _count: {
    applications: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function MarketplacePage() {
  const router = useRouter()
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: '',
    category: 'all',
    minBudget: null,
    maxBudget: null,
    skills: [],
    location: '',
    clientRating: null,
    sortBy: 'newest',
    projectLength: 'any',
    experience: 'any',
    remote: null
  })
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showBidModal, setShowBidModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalProjects, setTotalProjects] = useState(0)
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [spotlightProjects, setSpotlightProjects] = useState<Project[]>([])
  const [loadingSpotlight, setLoadingSpotlight] = useState(true)
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0)


  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchProjects(true)
  }, [searchFilters])

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

  const fetchInitialData = async () => {
    try {
      const [categoriesResponse] = await Promise.all([
        categoriesApi.getCategories(),
        fetchSpotlightProjects(),
        fetchFeaturedProjects()
      ])

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories)
      }

      await fetchProjects(true)
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      toast.error('Failed to load marketplace data')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpotlightProjects = async () => {
    try {
      setLoadingSpotlight(true)
      // Fetch SPOTLIGHT tier projects - highest paying tier
      const response = await projectsApi.getProjects({
        featured: true,
        featuredLevel: 'SPOTLIGHT',
        limit: 10,
        sortBy: 'featured_priority'
      })
      
      if (response.success && response.data) {
        setSpotlightProjects(response.data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch spotlight projects:', error)
    } finally {
      setLoadingSpotlight(false)
    }
  }

  const fetchFeaturedProjects = async () => {
    try {
      setLoadingFeatured(true)
      // Fetch PREMIUM tier projects (not SPOTLIGHT) - these show in the premium section
      const response = await projectsApi.getProjects({
        featured: true,
        featuredLevel: 'PREMIUM',
        limit: 4, // Get 4 to show 2 at a time in rotation
        sortBy: 'featured_priority'
      })
      
      if (response.success && response.data) {
        setFeaturedProjects(response.data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch featured projects:', error)
      // Don't show error toast for featured projects - just hide the section
    } finally {
      setLoadingFeatured(false)
    }
  }

  const fetchProjects = async (reset = false) => {
    if (!loading && !reset) {
      setRefreshing(true)
    }
    
    const pageToFetch = reset ? 1 : currentPage
    const params: any = {
      page: pageToFetch,
      limit: 20,
      sortBy: searchFilters.sortBy
    }

    // Map search filters to API parameters
    if (searchFilters.search) {
      params.search = searchFilters.search
    }

    if (searchFilters.category !== 'all') {
      const category = categories.find(c => c.slug === searchFilters.category)
      if (category) {
        params.category = category.id
      }
    }

    if (searchFilters.minBudget) {
      params.minBudget = searchFilters.minBudget
    }

    if (searchFilters.maxBudget) {
      params.maxBudget = searchFilters.maxBudget
    }

    if (searchFilters.location) {
      params.location = searchFilters.location
    }

    if (searchFilters.clientRating) {
      params.clientRating = searchFilters.clientRating
    }

    if (searchFilters.projectLength !== 'any') {
      params.projectLength = searchFilters.projectLength
    }

    if (searchFilters.experience !== 'any') {
      params.experience = searchFilters.experience
    }

    if (searchFilters.remote !== null) {
      params.remote = searchFilters.remote
    }

    const response = await projectsApi.getProjects(params)
    
    if (response.success && response.data) {
      if (reset) {
        setProjects(response.data.projects || [])
        setCurrentPage(2)
      } else {
        setProjects(prev => [...prev, ...(response.data.projects || [])])
        setCurrentPage(prev => prev + 1)
      }
      
      if (response.data.pagination) {
        setTotalProjects(response.data.pagination.total)
        setHasMore(pageToFetch < response.data.pagination.totalPages)
      } else {
        setHasMore((response.data.projects || []).length === 20)
      }
    } else if (response.error) {
      console.error('API Error:', response.error)
      toast.error(response.message || 'Failed to load projects')
    }
    
    setRefreshing(false)
  }

  const handleApplyToProject = (project: Project) => {
    setSelectedProject(project)
    setShowBidModal(true)
  }

  const handleBidSuccess = () => {
    toast.success('Application submitted successfully!')
    fetchProjects(true) // Refresh projects to update application count
  }

  const handleLoadMore = () => {
    if (!refreshing && hasMore) {
      fetchProjects(false)
    }
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

  if (loading) {
    return (
      <FreelancerOnly>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading marketplace...</p>
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Marketplace</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing projects and connect with clients
            </p>
          </div>

          {/* SPOTLIGHT Hero Banner - Highest Tier Promotion */}
          {(!loadingSpotlight && spotlightProjects.length > 0) && (
            <div className="mb-12">
              <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-2xl overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                
                {/* Spotlight Project Display - Fixed Height Container */}
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

          {/* Featured Projects Section - Premium/Paid Promotion */}
          {(!loadingFeatured && featuredProjects.length > 0) && (
            <div className="mb-12">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">⭐ Featured Projects</h2>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    Premium
                  </span>
                </div>
                <p className="text-gray-600 mb-6">
                  High-priority projects from verified clients - these clients have invested in premium visibility
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredProjects.slice(0, 2).map((project) => (
                    <div key={project.id} className="bg-white rounded-lg p-4 shadow-sm border border-amber-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{project.title}</h3>
                          <p className="text-green-600 font-medium mb-2">
                            ${project.minBudget} - ${project.maxBudget}
                          </p>
                          <span className="text-sm text-gray-500">{project.category.name}</span>
                        </div>
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium ml-2">
                          Featured
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {project._count.applications} bids • {getTimeAgo(project.createdAt)}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => handleApplyToProject(project)}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/marketplace/featured')}
                  >
                    View All Featured Projects
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Saved Searches */}
          <SavedSearches 
            currentFilters={searchFilters}
            onLoadSearch={setSearchFilters}
            onSearch={() => fetchProjects(true)}
          />

          {/* Advanced Search */}
          <AdvancedSearch
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
            categories={categories}
            onSearch={() => fetchProjects(true)}
            isLoading={refreshing}
          />

          {/* Projects Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Available Projects</h2>
              <p className="text-gray-600">
                {totalProjects > 0 ? `${projects.length} of ${totalProjects} projects` : `${projects.length} projects found`}
              </p>
            </div>

            {refreshing && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading projects...</span>
              </div>
            )}

            {projects.map((project) => (
              <div key={project.id} className="bg-[#1a2332] rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Open
                      </span>
                    </div>
                    <p className="text-gray-300 mb-4 leading-relaxed">{project.description}</p>

                    {/* Project Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Budget</p>
                        <p className="font-semibold text-green-400">${project.minBudget} - ${project.maxBudget}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Applications</p>
                        <p className="font-semibold">{project._count.applications} bids</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Posted</p>
                        <p className="font-semibold">{getTimeAgo(project.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Timeline</p>
                        <p className="font-semibold">{project.timeline}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Client Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{project.client.rating || 'N/A'}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleApplyToProject(project)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
                
                {/* Client Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-600">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {project.client.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{project.client.username}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>Remote</span>
                      <Clock className="w-3 h-3" />
                      <span>{project.category.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {projects.length === 0 && !refreshing && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-6">
                  {searchFilters.search || searchFilters.category !== 'all' || searchFilters.minBudget || searchFilters.maxBudget
                    ? "Try adjusting your search criteria or filters."
                    : "No projects are currently available. Check back later!"
                  }
                </p>
                {(searchFilters.search || searchFilters.category !== 'all' || searchFilters.minBudget || searchFilters.maxBudget) && (
                  <Button 
                    onClick={() => {
                      setSearchFilters({
                        search: '',
                        category: 'all',
                        minBudget: null,
                        maxBudget: null,
                        skills: [],
                        location: '',
                        clientRating: null,
                        sortBy: 'newest',
                        projectLength: 'any',
                        experience: 'any',
                        remote: null
                      })
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Load More */}
          {projects.length > 0 && hasMore && (
            <div className="text-center mt-8">
              <Button 
                onClick={handleLoadMore}
                disabled={refreshing}
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  'Load More Projects'
                )}
              </Button>
            </div>
          )}

          {projects.length > 0 && !hasMore && (
            <div className="text-center mt-8">
              <p className="text-gray-600">All projects loaded</p>
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