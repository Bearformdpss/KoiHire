'use client'

import React from 'react'
import { Briefcase, Search, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GuidanceCardsProps {
  onPostProject: () => void
}

export function GuidanceCards({ onPostProject }: GuidanceCardsProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Post a Project Card */}
      <button
        onClick={onPostProject}
        className="flex items-center justify-between p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-koi-orange hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-koi-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-koi-orange" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Post a Project
            </h3>
            <p className="text-sm text-gray-600">
              Get tailored offers for your needs. Freelancers bid on your project.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-koi-orange transition-colors flex-shrink-0 ml-4" />
      </button>

      {/* Browse Services Card */}
      <button
        onClick={() => router.push('/services')}
        className="flex items-center justify-between p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-koi-teal hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-koi-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Search className="w-6 h-6 text-koi-teal" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Browse Freelancer Services
            </h3>
            <p className="text-sm text-gray-600">
              Explore pre-packaged services with fixed prices and delivery times.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-koi-teal transition-colors flex-shrink-0 ml-4" />
      </button>
    </div>
  )
}
