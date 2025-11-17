'use client'

import { useRouter } from 'next/navigation'
import { Package, Search } from 'lucide-react'

interface HeroSectionProps {
  firstName?: string
}

export function HeroSection({ firstName }: HeroSectionProps) {
  const router = useRouter()

  const handleCreateService = () => {
    router.push('/freelancer/services/create')
  }

  const handleBrowseProjects = () => {
    router.push('/projects')
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-8 mb-8 shadow-lg"
      style={{
        background: 'linear-gradient(to bottom right, #E76F51, #F4A261)'
      }}
    >
      <h1
        className="text-3xl md:text-4xl font-bold mb-3"
        style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
      >
        Ready to grow your freelance business{firstName ? `, ${firstName}` : ''}?
      </h1>
      <p
        className="mb-6 text-lg font-medium"
        style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
      >
        Create services or find projects that match your skills
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Service Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer">
          <div className="flex flex-col items-start">
            <div className="w-12 h-12 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-2">
              Create a Service
            </h3>
            <p className="text-sm text-gray-600 mb-4 flex-grow">
              Build your portfolio with fixed-price packages
            </p>
            <button
              onClick={handleCreateService}
              className="bg-[#FF6B35] hover:bg-[#E55A2A] text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              Get Started
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Browse Projects Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer">
          <div className="flex flex-col items-start">
            <div className="w-12 h-12 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-2">
              Browse Projects
            </h3>
            <p className="text-sm text-gray-600 mb-4 flex-grow">
              Find opportunities that match your skills
            </p>
            <button
              onClick={handleBrowseProjects}
              className="bg-[#FF6B35] hover:bg-[#E55A2A] text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              Explore
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
