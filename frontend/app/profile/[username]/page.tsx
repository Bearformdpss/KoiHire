'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { 
  User, 
  MapPin, 
  Globe, 
  Star, 
  Calendar, 
  Award,
  Briefcase,
  MessageCircle,
  Share2,
  Edit,
  Loader2,
  ExternalLink,
  Phone,
  Mail,
  Download,
  Eye,
  ChevronRight,
  Heart,
  ThumbsUp
} from 'lucide-react'
import { usersApi } from '@/lib/api/users'
import { useAuthStore } from '@/lib/store/authStore'
import { ReviewDisplay } from '@/components/reviews/ReviewDisplay'
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid'
import { PortfolioForm } from '@/components/portfolio/PortfolioForm'
import { Portfolio } from '@/lib/api/portfolios'
import { servicesApi, Service } from '@/lib/api/services'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  role: 'CLIENT' | 'FREELANCER'
  rating?: number
  totalEarnings?: number
  totalSpent?: number
  isVerified: boolean
  createdAt: string
  skills: Array<{
    skill: {
      id: string
      name: string
      category: {
        id: string
        name: string
      }
    }
    level: string
    yearsExp?: number
  }>
  freelancerReviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    reviewer: {
      username: string
      avatar?: string
    }
    project: {
      title: string
    }
  }>
  freelancerServiceReviews?: Array<{
    id: string
    rating: number
    comment?: string
    communication?: number
    quality?: number
    delivery?: number
    value?: number
    createdAt: string
    client: {
      username: string
      avatar?: string
      firstName: string
      lastName: string
    }
    service: {
      title: string
    }
    order: {
      orderNumber: string
    }
  }>
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews' | 'services'>('overview')
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [portfolioKey, setPortfolioKey] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(false)

  const username = params.username as string
  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    if (username) {
      fetchUserProfile()
    }
  }, [username])

  useEffect(() => {
    if (activeTab === 'services' && profile) {
      fetchUserServices()
    }
  }, [activeTab, profile])

  const fetchUserProfile = async () => {
    try {
      // For both own profile and other profiles, fetch from API to get complete data including reviews
      const response = await usersApi.getUserByUsername(username)
      if (response.success) {
        setProfile(response.user)
      } else if (isOwnProfile && currentUser) {
        // Fallback to user store data only if API fails for own profile
        setProfile({
          id: currentUser.id,
          username: currentUser.username,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          avatar: currentUser.avatar,
          bio: '', 
          location: '', 
          website: '',  
          phone: '',
          role: currentUser.role,
          rating: currentUser.rating,
          totalEarnings: currentUser.totalEarnings,
          totalSpent: currentUser.totalSpent,
          isVerified: currentUser.isVerified,
          createdAt: new Date().toISOString(),
          skills: [],
          freelancerReviews: [],
        })
      } else {
        throw new Error('Failed to load user profile')
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserServices = async () => {
    if (!profile) return

    try {
      setLoadingServices(true)
      const response = await servicesApi.getUserServices(profile.id, {
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc'
      })

      if (response.data?.success && response.data.data) {
        setServices(response.data.data.services || [])
      }
    } catch (error) {
      console.error('Failed to fetch user services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoadingServices(false)
    }
  }

  const handlePortfolioSuccess = (portfolio: Portfolio) => {
    // Refresh the portfolio grid by updating the key
    setPortfolioKey(prev => prev + 1)
    setEditingPortfolio(null)
  }

  const handleAddPortfolio = () => {
    setEditingPortfolio(null)
    setShowPortfolioForm(true)
  }

  const handleSendMessage = () => {
    // Navigate to messages page with parameters to create/find conversation
    if (profile) {
      router.push(`/messages?user=${profile.id}&project=`)
    }
  }

  const handleShareProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${profile?.username}`
      
      // Try to use the Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.firstName} ${profile?.lastName} - RowFlow Profile`,
          text: `Check out ${profile?.firstName}'s profile on RowFlow`,
          url: profileUrl
        })
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(profileUrl)
        toast.success('Profile link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing profile:', error)
      toast.error('Failed to share profile')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSkillLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-blue-100 text-blue-800'
      case 'beginner':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </AuthRequired>
    )
  }

  if (!profile) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
            <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-600" />
                  )}
                </div>
                {profile.isVerified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-koi-teal rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-koi-navy">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.role === 'FREELANCER'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-koi-teal/10 text-koi-teal'
                  }`}>
                    {profile.role === 'FREELANCER' ? 'Freelancer' : 'Client'}
                  </span>
                </div>

                <p className="text-gray-600 text-lg mb-4">@{profile.username}</p>

                {profile.bio && (
                  <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-koi-teal hover:text-koi-orange transition-colors"
                      >
                        Website
                        <ExternalLink className="w-3 h-3 ml-1 inline" />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Joined {formatDate(profile.createdAt)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 mt-6">
                  {profile.rating && (
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-koi-gold fill-current mr-1" />
                      <span className="font-semibold text-koi-navy">{profile.rating.toFixed(1)}</span>
                      <span className="text-gray-600 ml-1">({(profile.freelancerReviews.length + (profile.freelancerServiceReviews?.length || 0))} reviews)</span>
                    </div>
                  )}
                  {profile.role === 'FREELANCER' && profile.totalEarnings && (
                    <div className="text-sm">
                      <span className="font-semibold text-koi-teal">
                        ${profile.totalEarnings.toLocaleString()}
                      </span>
                      <span className="text-gray-600 ml-1">earned</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                {isOwnProfile ? (
                  <Button onClick={() => router.push('/settings')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSendMessage}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" onClick={handleShareProfile}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-koi-orange border-b-2 border-koi-orange'
                  : 'text-gray-600 hover:text-koi-navy'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'portfolio'
                  ? 'text-koi-orange border-b-2 border-koi-orange'
                  : 'text-gray-600 hover:text-koi-navy'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-koi-orange border-b-2 border-koi-orange'
                  : 'text-gray-600 hover:text-koi-navy'
              }`}
            >
              Reviews ({profile.freelancerReviews.length + (profile.freelancerServiceReviews?.length || 0)})
            </button>
            {profile.role === 'FREELANCER' && (
              <button
                onClick={() => setActiveTab('services')}
                className={`pb-2 font-medium transition-colors ${
                  activeTab === 'services'
                    ? 'text-koi-orange border-b-2 border-koi-orange'
                    : 'text-gray-600 hover:text-koi-navy'
                }`}
              >
                My Services
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Skills */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-koi-navy mb-4">Skills</h2>
                {profile.skills.length > 0 ? (
                  <div className="space-y-3">
                    {profile.skills.map((skill, index) => (
                      <div key={`${skill.skill.id}-${index}`} className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-koi-navy">{skill.skill.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({skill.skill.category.name})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(skill.level)}`}>
                            {skill.level}
                          </span>
                          {skill.yearsExp && (
                            <span className="text-xs text-gray-500">
                              {skill.yearsExp}y exp
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No skills added yet.</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-koi-navy mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-koi-teal mr-3" />
                    <span className="text-gray-600">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-koi-teal mr-3" />
                      <span className="text-gray-600">{profile.phone}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 text-koi-teal mr-3" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-koi-teal hover:text-koi-orange transition-colors"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              <PortfolioGrid
                key={portfolioKey}
                userId={profile?.id}
                showUserFilter={false}
                showAddButton={isOwnProfile}
                onAddPortfolio={handleAddPortfolio}
              />
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <ReviewDisplay
                userId={profile.id}
                showStats={true}
                profileReviews={[
                  // Project reviews
                  ...profile.freelancerReviews.map(review => ({
                    ...review,
                    communication: (review as any).communication || review.rating,
                    quality: (review as any).quality || review.rating,
                    timeliness: (review as any).timeliness || review.rating,
                    professionalism: (review as any).professionalism || review.rating,
                    helpful: 0,
                    isHelpful: false
                  })),
                  // Service reviews (convert to match expected format)
                  ...(profile.freelancerServiceReviews || []).map(review => ({
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment || '',
                    communication: review.communication || review.rating,
                    quality: review.quality || review.rating,
                    timeliness: review.delivery || review.rating,
                    professionalism: review.value || review.rating,
                    createdAt: review.createdAt,
                    reviewer: {
                      username: review.client.username,
                      avatar: review.client.avatar
                    },
                    project: {
                      title: `Service: ${review.service.title}`
                    },
                    helpful: 0,
                    isHelpful: false
                  }))
                ]}
              />
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              {loadingServices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mr-3" />
                  <span className="text-gray-600">Loading services...</span>
                </div>
              ) : services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <Link
                      key={service.id}
                      href={`/services/${service.id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-koi-orange transition-all"
                    >
                      {/* Service Image */}
                      <div className="relative h-48 bg-gray-200">
                        {service.coverImage ? (
                          <img
                            src={service.coverImage}
                            alt={service.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        {service.isFeatured && (
                          <div className="absolute top-2 right-2 bg-koi-orange text-white px-2 py-1 rounded text-xs font-semibold">
                            Featured
                          </div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-koi-navy mb-2 line-clamp-2">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {service.shortDescription || service.description}
                        </p>

                        {/* Category */}
                        <div className="text-xs text-koi-teal mb-3">
                          {service.category.name}
                        </div>

                        {/* Rating and Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {service.rating ? (
                              <>
                                <Star className="w-4 h-4 text-koi-gold fill-current mr-1" />
                                <span className="text-sm font-medium text-koi-navy">
                                  {service.rating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  ({service._count.reviews})
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">No reviews yet</span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-koi-teal">
                            From ${service.basePrice}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {service.views} views
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {service._count.serviceOrders} orders
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No services yet
                  </h3>
                  <p className="text-gray-600">
                    {isOwnProfile
                      ? "You haven't created any services yet. Start offering your services to clients!"
                      : "This freelancer hasn't created any services yet."}
                  </p>
                  {isOwnProfile && (
                    <Button
                      onClick={() => router.push('/freelancer/services/create')}
                      className="mt-4"
                    >
                      Create Your First Service
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portfolio Form Dialog */}
        <PortfolioForm
          open={showPortfolioForm}
          onOpenChange={setShowPortfolioForm}
          portfolio={editingPortfolio}
          onSuccess={handlePortfolioSuccess}
        />
      </div>
    </AuthRequired>
  )
}