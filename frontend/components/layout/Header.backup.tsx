'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings, Bell, Wallet, Star, MessageCircle, Briefcase, Search, Menu, X, ShoppingBag } from 'lucide-react'
import { NotificationButton } from '@/components/notifications/NotificationButton'
import toast from 'react-hot-toast'

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useUnreadMessages();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  return (
    <header className="bg-rowflow-dark py-4 sticky top-0 z-50">
      <div className="container mx-auto px-5">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-white text-xl font-bold">
            <div className="w-8 h-8 gradient-rowflow rounded-lg flex items-center justify-center text-white font-bold">
              R
            </div>
            RowFlow
          </Link>
          
          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-6 list-none">
            {!isAuthenticated ? (
              <>
                <li>
                  <Link href="/how-it-works" className="text-rowflow-muted hover:text-white transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="/for-freelancers" className="text-rowflow-muted hover:text-white transition-colors">
                    For Freelancers
                  </Link>
                </li>
                <li>
                  <Link href="/for-clients" className="text-rowflow-muted hover:text-white transition-colors">
                    For Clients
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/dashboard" className="text-rowflow-muted hover:text-white transition-colors flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href={user?.role === 'CLIENT' ? '/dashboard?tab=projects' : '/marketplace'}
                    className="text-rowflow-muted hover:text-white transition-colors flex items-center"
                  >
                    <Search className="w-4 h-4 mr-1" />
                    {user?.role === 'CLIENT' ? 'My Projects' : 'Browse Projects'}
                  </Link>
                </li>
                {user?.role === 'FREELANCER' && (
                  <li>
                    <Link href="/freelancer/services" className="text-rowflow-muted hover:text-white transition-colors flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      My Services
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/services" className="text-rowflow-muted hover:text-white transition-colors flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/messages" className="text-rowflow-muted hover:text-white transition-colors flex items-center relative">
                    <div className="relative mr-1">
                      <MessageCircle className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px]">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    Messages
                  </Link>
                </li>
                <li>
                  <Link href="/wallet" className="text-rowflow-muted hover:text-white transition-colors flex items-center">
                    <Wallet className="w-4 h-4 mr-1" />
                    Wallet
                  </Link>
                </li>
                {user?.role === 'FREELANCER' && (
                  <li>
                    <Link href="/reviews" className="text-rowflow-muted hover:text-white transition-colors flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Reviews
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-gray-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="btn-rowflow-outline">
                  Sign In
                </Link>
                <Link href="/register" className="btn-rowflow-primary">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {/* Notifications */}
                  <NotificationButton />
                  
                  {/* User Menu */}
                  <div className="flex items-center gap-2">
                    <div className="text-white text-sm">
                      Welcome, {user?.firstName}!
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-gray-200"
                      onClick={() => router.push(`/profile/${user?.username}`)}
                      title="View Profile"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-gray-200"
                      onClick={() => router.push('/settings')}
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-gray-200"
                      onClick={handleLogout}
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-rowflow-dark">
            <div className="px-4 py-4 space-y-4">
              {!isAuthenticated ? (
                <>
                  <Link 
                    href="/how-it-works" 
                    className="block text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How it Works
                  </Link>
                  <Link 
                    href="/for-freelancers" 
                    className="block text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    For Freelancers
                  </Link>
                  <Link 
                    href="/for-clients" 
                    className="block text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    For Clients
                  </Link>
                  <hr className="border-gray-700 my-4" />
                  <Link 
                    href="/login" 
                    className="block text-center bg-transparent border border-white text-white py-2 px-4 rounded hover:bg-white hover:text-rowflow-dark transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/register" 
                    className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded hover:opacity-90 transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 pb-4 border-b border-gray-700">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-gray-400 text-sm">@{user?.username}</div>
                    </div>
                  </div>
                  
                  <Link 
                    href="/dashboard" 
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    href={user?.role === 'CLIENT' ? '/dashboard?tab=projects' : '/marketplace'}
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {user?.role === 'CLIENT' ? 'My Projects' : 'Browse Projects'}
                  </Link>
                  {user?.role === 'FREELANCER' && (
                    <Link
                      href="/freelancer/services"
                      className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      My Services
                    </Link>
                  )}
                  <Link
                    href="/services"
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Services
                  </Link>
                  <Link 
                    href="/messages" 
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2 relative"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="relative mr-2">
                      <MessageCircle className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px]">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    Messages
                  </Link>
                  <Link 
                    href="/wallet" 
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </Link>
                  {user?.role === 'FREELANCER' && (
                    <Link 
                      href="/reviews" 
                      className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Reviews
                    </Link>
                  )}
                  <div className="flex items-center py-2">
                    <Bell className="w-4 h-4 mr-2 text-rowflow-muted" />
                    <span className="text-rowflow-muted">Notifications</span>
                    <div className="ml-auto">
                      <NotificationButton />
                    </div>
                  </div>
                  
                  <hr className="border-gray-700 my-4" />
                  
                  <Link 
                    href={`/profile/${user?.username}`} 
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Link>
                  <Link 
                    href="/settings" 
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center text-rowflow-muted hover:text-white transition-colors py-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}