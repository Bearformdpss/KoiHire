'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Clock, 
  Plus, 
  Search,
  MessageCircle,
  Loader2,
  Edit,
  Eye,
  Star,
  Crown,
  TrendingUp,
  Calendar,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Archive,
  Copy,
  Settings,
  BarChart3,
  X
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/authStore';
import { usersApi } from '@/lib/api/users';
import { projectsApi } from '@/lib/api/projects';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import PostProjectForm from '@/components/projects/PostProjectFormNew';

interface DashboardStats {
  activeProjects: number;
  totalSpent: number;
  freelancersHired: number;
  avgProjectTime: number;
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    freelancer?: {
      username: string;
    };
  }>;
}

interface Project {
  id: string;
  title: string;
  description: string;
  minBudget: number;
  maxBudget: number;
  timeline: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  skills: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    applications: number;
  };
  freelancer?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    rating: number;
  };
  isFeatured: boolean;
  featuredLevel: 'NONE' | 'BASIC' | 'PREMIUM' | 'SPOTLIGHT';
  featuredUntil?: string;
  featuredPrice?: number;
}

export function ClientDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectFilter, setProjectFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'projects') {
      setActiveTab('projects');
    }
  }, [searchParams]);

  useEffect(() => {
    // Always fetch projects as they're needed for both overview (Recent Projects) and projects tab
    fetchMyProjects();
  }, [activeTab, projectFilter, searchQuery]);

  const fetchDashboardStats = async () => {
    try {
      const response = await usersApi.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Check if it's a 401 (authentication error)
      if (error.response?.status === 401) {
        toast.error('Please log in again to continue');
        // Could redirect to login here if needed
      } else {
        toast.error('Failed to load dashboard data');
      }
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProjects = async () => {
    try {
      console.log('🚀 [ClientDashboard] Starting fetchMyProjects...');
      console.log('🔍 [ClientDashboard] Project filter:', projectFilter);
      console.log('🔍 [ClientDashboard] Search query:', searchQuery);
      
      setLoadingProjects(true);
      const response = await projectsApi.getMyProjects({
        status: projectFilter === 'ALL' ? undefined : projectFilter,
        search: searchQuery || undefined
      });
      
      console.log('📡 [ClientDashboard] Raw API response:', response);
      
      if (response.success && response.data) {
        console.log('✅ [ClientDashboard] Response successful, data:', response.data);
        console.log('📊 [ClientDashboard] Data structure:', response.data.data);
        console.log('📊 [ClientDashboard] Projects array:', response.data.data?.projects);
        console.log('📊 [ClientDashboard] Projects length:', response.data.data?.projects?.length || 0);
        setProjects(response.data.data?.projects || []);
      } else {
        console.log('❌ [ClientDashboard] Response failed or no data');
        console.log('📊 [ClientDashboard] Response success:', response.success);
        console.log('📊 [ClientDashboard] Response data:', response.data);
        setProjects([]);
      }
    } catch (error) {
      console.error('💥 [ClientDashboard] Failed to fetch projects:', error);
      console.error('💥 [ClientDashboard] Error response:', error.response);
      console.error('💥 [ClientDashboard] Error status:', error.response?.status);
      // Check if it's a 401 (authentication error)
      if (error.response?.status === 401) {
        toast.error('Please log in again to continue');
      } else {
        toast.error('Failed to load your projects');
      }
      setProjects([]);
    } finally {
      console.log('🏁 [ClientDashboard] fetchMyProjects completed');
      setLoadingProjects(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <PlayCircle className="w-4 h-4 text-koi-orange" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
        return <PauseCircle className="w-4 h-4 text-red-500" />;
      case 'DISPUTED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <PlayCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-koi-orange/10 text-koi-navy';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeaturedBadge = (featuredLevel: string) => {
    switch (featuredLevel) {
      case 'BASIC':
        return <span className="bg-koi-orange/10 text-koi-navy px-2 py-1 rounded text-xs font-medium">Featured</span>;
      case 'PREMIUM':
        return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">💎 Premium</span>;
      case 'SPOTLIGHT':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">⭐ SPOTLIGHT</span>;
      default:
        return null;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    toast.success('Project created successfully!');
    // Refresh projects if we're on the projects tab
    if (activeTab === 'projects') {
      fetchMyProjects();
    } else {
      // Switch to projects tab to show the new project
      setActiveTab('projects');
    }
    // Refresh dashboard stats
    fetchDashboardStats();
  };

  const handleViewProject = (projectId: string) => {
    console.log('🔗 [ClientDashboard] handleViewProject called with:', projectId);
    if (!projectId) {
      console.error('❌ [ClientDashboard] Project ID is undefined!');
      toast.error('Unable to open project - invalid project ID');
      return;
    }
    router.push(`/projects/${projectId}`);
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
  };

  const handlePromoteProject = (project: Project) => {
    router.push(`/projects/${project.id}/promote`);
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = projectFilter === 'ALL' || project.status === projectFilter;
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span className="text-lg text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your projects and grow your business with top freelancers.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-koi-orange text-koi-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-koi-orange text-koi-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  My Projects
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Active Projects"
                value={stats?.activeProjects || 0}
                icon={Briefcase}
              />
              <StatsCard
                title="Total Spent"
                value={`$${stats?.totalSpent || 0}`}
                icon={DollarSign}
              />
              <StatsCard
                title="Freelancers Hired"
                value={stats?.freelancersHired || 0}
                icon={Users}
              />
              <StatsCard
                title="Avg. Project Time"
                value={`${stats?.avgProjectTime || 0} days`}
                icon={Clock}
                description="Average completion time"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleCreateProject} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Post New Project
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setActiveTab('projects')}
                >
                  <Briefcase className="h-4 w-4" />
                  My Projects
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => router.push('/messages')}
                >
                  <MessageCircle className="h-4 w-4" />
                  Messages
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Projects</h2>
                <div className="space-y-4">
                  {(() => {
                    console.log('🎨 [ClientDashboard] Rendering Recent Projects section');
                    console.log('🎨 [ClientDashboard] Current projects state:', projects);
                    console.log('🎨 [ClientDashboard] Projects length:', projects.length);
                    return null;
                  })()}
                  {projects.length > 0 ? (
                    // Show most recent 3 projects
                    projects.slice(0, 3).map((project) => (
                      <div 
                        key={project.id} 
                        className="border-l-4 border-koi-orange pl-4 hover:bg-gray-50 p-3 rounded-r-lg transition-colors cursor-pointer"
                        onClick={() => handleViewProject(project.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{project.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-green-600 font-medium">
                                ${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}
                              </span>
                              <span className="text-sm text-gray-500">{project.timeline}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusIcon(project.status)}
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              <span className="text-xs text-gray-400">
                                • {getTimeAgo(project.createdAt)}
                              </span>
                              {project._count?.applications > 0 && (
                                <span className="text-xs text-koi-orange">
                                  • {project._count.applications} application{project._count.applications !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {project.isFeatured && (
                              <div className="mt-2">
                                {getFeaturedBadge(project.featuredLevel)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-4">No projects yet</p>
                      <Button onClick={handleCreateProject} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Post Your First Project
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* My Projects Tab */
          <div className="space-y-6">
            {/* Project Management Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">My Projects</h2>
                  <p className="text-gray-600">Manage and track all your projects in one place</p>
                </div>
                <Button onClick={handleCreateProject} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Project
                </Button>
              </div>

              {/* Filters and Search */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-koi-orange focus:border-transparent"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value as any)}
                  >
                    <option value="ALL">All Projects</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Projects List */}
            {loadingProjects ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-gray-600">Loading your projects...</span>
                </div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  console.log('🎨 [ClientDashboard] Rendering My Projects tab');
                  console.log('🎨 [ClientDashboard] Projects state:', projects);
                  console.log('🎨 [ClientDashboard] Filtered projects:', filteredProjects);
                  console.log('🎨 [ClientDashboard] Filtered projects length:', filteredProjects.length);
                  return null;
                })()}
                {filteredProjects.map((project) => (
                  <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(project.status)}
                          <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                          {getFeaturedBadge(project.featuredLevel)}
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{project.timeline}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{project._count.applications} applications</span>
                          </div>
                          <span>Created {getTimeAgo(project.createdAt)}</span>
                        </div>

                        {project.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill.skill.id}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {skill.skill.name}
                              </span>
                            ))}
                            {project.skills.length > 4 && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded">
                                +{project.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {project.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProject(project.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {project.featuredLevel === 'NONE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromoteProject(project)}
                            className="text-koi-orange border-koi-orange/40 hover:bg-koi-orange/5"
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {projectFilter === 'ALL' ? 'No projects yet' : `No ${projectFilter.toLowerCase().replace('_', ' ')} projects`}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {projectFilter === 'ALL' 
                      ? 'Start by creating your first project and connect with talented freelancers.'
                      : `You don't have any ${projectFilter.toLowerCase().replace('_', ' ')} projects at the moment.`
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleCreateProject} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Project
                    </Button>
                    {projectFilter !== 'ALL' && (
                      <Button variant="outline" onClick={() => setProjectFilter('ALL')}>
                        View All Projects
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Creation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <PostProjectForm
                  onClose={() => setShowCreateModal(false)}
                  onSuccess={handleProjectCreated}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}