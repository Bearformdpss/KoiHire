'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  DollarSign,
  FolderKanban,
  Users,
  ShoppingBag,
  Shield,
  Banknote,
  Package,
  ClipboardList
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Payouts', href: '/admin/payouts', icon: Banknote },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { name: 'Services', href: '/admin/services', icon: Package },
  { name: 'Service Orders', href: '/admin/service-orders', icon: ShoppingBag },
  { name: 'Users', href: '/admin/users', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-gray-800">
        <Shield className="w-8 h-8 text-blue-500 mr-3" />
        <span className="text-white text-xl font-bold">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          ← Back to Site
        </Link>
      </div>
    </div>
  )
}
