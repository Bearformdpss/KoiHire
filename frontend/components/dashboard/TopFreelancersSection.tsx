'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HorizontalScrollCarousel } from '@/components/ui/HorizontalScrollCarousel'
import { FreelancerCard } from '@/components/ui/FreelancerCard'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Freelancer {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  rating?: number
  location?: string
  totalEarnings?: number
  skills: Array<{ skill: { name: string } }>
}

export function TopFreelancersSection() {
  const router = useRouter()
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFreelancers()
  }, [])

  const fetchFreelancers = async () => {
    try {
      // Fetch freelancers with highest ratings
      const response = await axios.get(`${API_URL}/users/public?role=FREELANCER&limit=10&sortBy=rating`)

      if (response.data?.success && response.data?.data?.users) {
        setFreelancers(response.data.data.users)
      }
    } catch (error) {
      console.error('Failed to fetch freelancers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-8 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-koi-teal mr-2" />
        <span className="text-gray-600">Loading freelancers...</span>
      </div>
    )
  }

  if (freelancers.length === 0) {
    return null // Don't show section if no freelancers
  }

  return (
    <div className="mb-8">
      <HorizontalScrollCarousel
        title="Top Rated Freelancers"
        viewAllText="View All Freelancers"
        onViewAll={() => router.push('/services')}
      >
        {freelancers.map((freelancer) => (
          <FreelancerCard
            key={freelancer.id}
            id={freelancer.id}
            username={freelancer.username}
            firstName={freelancer.firstName}
            lastName={freelancer.lastName}
            avatar={freelancer.avatar}
            bio={freelancer.bio}
            rating={freelancer.rating}
            location={freelancer.location}
            skills={freelancer.skills || []}
          />
        ))}
      </HorizontalScrollCarousel>
    </div>
  )
}
