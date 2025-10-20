import { api } from '../api'

export interface Portfolio {
  id: string
  userId: string
  title: string
  description: string
  category: PortfolioCategory
  thumbnail?: string
  images: string[]
  liveUrl?: string
  codeUrl?: string
  technologies: string[]
  duration?: string
  clientName?: string
  views: number
  isPublic: boolean
  completedAt: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    rating?: number
    totalEarnings?: number
    isVerified?: boolean
  }
}

export enum PortfolioCategory {
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  UI_UX_DESIGN = 'UI_UX_DESIGN',
  GRAPHIC_DESIGN = 'GRAPHIC_DESIGN',
  LOGO_DESIGN = 'LOGO_DESIGN',
  CONTENT_WRITING = 'CONTENT_WRITING',
  DIGITAL_MARKETING = 'DIGITAL_MARKETING',
  VIDEO_EDITING = 'VIDEO_EDITING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  CONSULTING = 'CONSULTING',
  OTHER = 'OTHER'
}

export interface CreatePortfolioData {
  title: string
  description: string
  category?: PortfolioCategory
  thumbnail?: string
  images?: string[]
  liveUrl?: string
  codeUrl?: string
  technologies?: string[]
  duration?: string
  clientName?: string
  completedAt: string
  isPublic?: boolean
}

export interface UpdatePortfolioData extends Partial<CreatePortfolioData> {}

export interface GetPortfoliosParams {
  userId?: string
  category?: PortfolioCategory | 'ALL'
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedPortfoliosResponse {
  success: boolean
  portfolios: Portfolio[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SinglePortfolioResponse {
  success: boolean
  portfolio: Portfolio
}

export interface PortfolioResponse {
  success: boolean
  portfolio: Portfolio
}

export const portfoliosApi = {
  // Get portfolios with filtering and pagination
  getPortfolios: async (params: GetPortfoliosParams = {}): Promise<PaginatedPortfoliosResponse> => {
    const searchParams = new URLSearchParams()
    
    if (params.userId) searchParams.set('userId', params.userId)
    if (params.category) searchParams.set('category', params.category)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)

    const response = await api.get(`/portfolios?${searchParams.toString()}`)
    return response.data
  },

  // Get single portfolio by ID
  getPortfolioById: async (id: string): Promise<SinglePortfolioResponse> => {
    const response = await api.get(`/portfolios/${id}`)
    return response.data
  },

  // Create new portfolio
  createPortfolio: async (data: CreatePortfolioData): Promise<PortfolioResponse> => {
    const response = await api.post('/portfolios', data)
    return response.data
  },

  // Update portfolio
  updatePortfolio: async (id: string, data: UpdatePortfolioData): Promise<PortfolioResponse> => {
    const response = await api.put(`/portfolios/${id}`, data)
    return response.data
  },

  // Delete portfolio
  deletePortfolio: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portfolios/${id}`)
    return response.data
  },

  // Get user's portfolios (helper method)
  getUserPortfolios: async (userId: string, page = 1, limit = 12): Promise<PaginatedPortfoliosResponse> => {
    return portfoliosApi.getPortfolios({ userId, page, limit })
  },

  // Search portfolios (helper method)
  searchPortfolios: async (search: string, category?: PortfolioCategory, page = 1): Promise<PaginatedPortfoliosResponse> => {
    return portfoliosApi.getPortfolios({ search, category, page })
  }
}

// Helper function to format portfolio category for display
export const formatPortfolioCategory = (category: PortfolioCategory): string => {
  const categoryLabels: Record<PortfolioCategory, string> = {
    WEB_DEVELOPMENT: 'Web Development',
    MOBILE_DEVELOPMENT: 'Mobile Development',
    UI_UX_DESIGN: 'UI/UX Design',
    GRAPHIC_DESIGN: 'Graphic Design',
    LOGO_DESIGN: 'Logo Design',
    CONTENT_WRITING: 'Content Writing',
    DIGITAL_MARKETING: 'Digital Marketing',
    VIDEO_EDITING: 'Video Editing',
    PHOTOGRAPHY: 'Photography',
    CONSULTING: 'Consulting',
    OTHER: 'Other'
  }
  return categoryLabels[category] || category
}

// Helper function to get category color
export const getCategoryColor = (category: PortfolioCategory): string => {
  const colors: Record<PortfolioCategory, string> = {
    WEB_DEVELOPMENT: 'bg-blue-100 text-blue-800',
    MOBILE_DEVELOPMENT: 'bg-green-100 text-green-800',
    UI_UX_DESIGN: 'bg-purple-100 text-purple-800',
    GRAPHIC_DESIGN: 'bg-pink-100 text-pink-800',
    LOGO_DESIGN: 'bg-red-100 text-red-800',
    CONTENT_WRITING: 'bg-yellow-100 text-yellow-800',
    DIGITAL_MARKETING: 'bg-orange-100 text-orange-800',
    VIDEO_EDITING: 'bg-indigo-100 text-indigo-800',
    PHOTOGRAPHY: 'bg-teal-100 text-teal-800',
    CONSULTING: 'bg-gray-100 text-gray-800',
    OTHER: 'bg-slate-100 text-slate-800'
  }
  return colors[category] || colors.OTHER
}