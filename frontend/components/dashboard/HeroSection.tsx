'use client'

import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function HeroSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div
      className="rounded-2xl p-8 md:p-10 mb-8 shadow-lg"
      style={{
        background: 'linear-gradient(to bottom right, #E76F51, #F4A261)'
      }}
    >
      <div className="max-w-2xl">
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        >
          What service do you need today?
        </h1>
        <p
          className="mb-6 text-lg font-medium"
          style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          Browse talented freelancers or post your project and let them come to you
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for services... (e.g. logo design, web development)"
            className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-koi-orange focus:outline-none text-lg shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
    </div>
  )
}
