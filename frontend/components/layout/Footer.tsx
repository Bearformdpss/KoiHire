'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Footer() {
  const pathname = usePathname()

  // Check if we're on a page with a sidebar (dashboard for freelancers)
  const hasSidebar = pathname === '/dashboard'

  return (
    <footer className="bg-gray-900 text-white">
      <div className={`container mx-auto px-4 py-12 ${hasSidebar ? 'lg:ml-[280px]' : ''}`}>
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">KoiHire</h3>
            <p className="text-gray-400">
              Where talent flows upstream. Connect with skilled freelancers or find your next opportunity.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Clients</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/post-project" className="hover:text-white">Post a Project</Link></li>
              <li><Link href="/marketplace" className="hover:text-white">Browse Services</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Freelancers</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/projects" className="hover:text-white">Browse Projects</Link></li>
              <li><Link href="/success-tips" className="hover:text-white">Success Tips</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 KoiHire. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}