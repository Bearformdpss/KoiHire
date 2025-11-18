'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings, Bell, Star, MessageCircle, Briefcase, Search, Menu, X, ShoppingBag, ChevronDown, Package } from 'lucide-react'
import { NotificationButton } from '@/components/notifications/NotificationButton'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import toast from 'react-hot-toast'

// Navigation configuration function
const getNavigationItems = (role: 'FREELANCER' | 'CLIENT', unreadCount: number) => {
  const baseItems = [
    // Dashboard for both Freelancers and Clients
    {
      label: 'Dashboard',
      href: '/dashboard',
      type: 'link' as const,
      icon: Briefcase
    },
    {
      label: 'Work',
      type: 'dropdown' as const,
      icon: Search,
      items: role === 'FREELANCER' ? [
        { label: 'Browse Projects', href: '/marketplace', icon: Search },
        { label: 'My Services', href: '/freelancer/services', icon: Briefcase }
      ] : [
        { label: 'Browse Services', href: '/services', icon: ShoppingBag },
        { label: 'My Projects', href: '/my-projects', icon: Briefcase },
        { label: 'My Orders', href: '/client/orders', icon: Package }
      ]
    },
    {
      label: 'Messages',
      href: '/messages',
      type: 'link' as const,
      icon: MessageCircle,
      badge: unreadCount > 0 ? unreadCount : undefined
    }
  ]

  return baseItems
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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

  // Determine logo home link based on authentication and role
  const logoHomeLink = isAuthenticated ? '/dashboard' : '/'

  return (
    <header className="bg-rowflow-dark py-4 sticky top-0 z-50">
      <div className="container mx-auto px-5">
        <nav className="flex items-center justify-between">
          <Link href={logoHomeLink} className="flex items-center gap-3">
            <Image
              src="/koihire-fish.png"
              alt="KoiHire Logo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="text-2xl font-bold">
              <span className="gradient-koi-text">Koi</span>
              <span className="text-white">Hire</span>
            </span>
          </Link>
          
          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-6 list-none" role="navigation" aria-label="Main navigation">
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
                {user && getNavigationItems(user.role, unreadCount).map((item) => (
                  item.type === 'dropdown' ? (
                    <li key={item.label}>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-rowflow-muted hover:text-white hover:bg-gray-800 transition-colors outline-none"
                          aria-label="Work menu"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                          <ChevronDown className="w-4 h-4" />
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="min-w-[220px] bg-rowflow-dark rounded-md shadow-lg border border-gray-700 p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-200"
                            sideOffset={5}
                          >
                            {item.items?.map((subItem) => (
                              <DropdownMenu.Item key={subItem.href} asChild>
                                <Link
                                  href={subItem.href}
                                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors outline-none ${
                                    pathname === subItem.href
                                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium'
                                      : 'text-rowflow-muted hover:bg-gray-800 hover:text-white'
                                  }`}
                                >
                                  <subItem.icon className="w-4 h-4" />
                                  {subItem.label}
                                </Link>
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </li>
                  ) : (
                    <li key={item.href}>
                      <Link
                        href={item.href!}
                        className={`relative flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? 'text-white bg-gray-800'
                            : 'text-rowflow-muted hover:text-white hover:bg-gray-800'
                        }`}
                        aria-label={item.badge ? `${item.label} (${item.badge} unread)` : item.label}
                        aria-current={pathname === item.href ? 'page' : undefined}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full" aria-hidden="true">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                ))}
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
                  
                  {user && getNavigationItems(user.role, unreadCount).map((item) => (
                    item.type === 'dropdown' ? (
                      <div key={item.label} className="space-y-1">
                        <div className="px-3 py-2 text-sm font-medium text-white flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </div>
                        {item.items?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2 pl-6 pr-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === subItem.href
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium'
                                : 'text-rowflow-muted hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <subItem.icon className="w-4 h-4" />
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href!}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                          pathname === item.href
                            ? 'bg-gray-800 text-white font-medium'
                            : 'text-rowflow-muted hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <div className="relative">
                          <item.icon className="w-4 h-4" />
                          {item.badge && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px]">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </div>
                        <span>{item.label}</span>
                      </Link>
                    )
                  ))}
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