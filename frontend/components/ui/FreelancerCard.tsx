'use client'

import React from 'react'
import { Star, MapPin, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FreelancerCardProps {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  rating?: number
  location?: string
  totalEarnings?: number
  skills?: Array<{ skill: { name: string } }>
}

export function FreelancerCard({
  id,
  username,
  firstName,
  lastName,
  avatar,
  bio,
  rating,
  location,
  totalEarnings,
  skills = []
}: FreelancerCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/profile/${username}`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex-shrink-0 w-[260px] bg-white rounded-lg border border-gray-200 p-5 cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* Avatar and Name */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-3 flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={`${firstName} ${lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-koi-teal to-koi-orange flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {firstName[0]}{lastName[0]}
              </span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900">
          {firstName} {lastName}
        </h3>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Rating */}
      {rating && rating > 0 ? (
        <div className="flex items-center justify-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-gray-900">
            {rating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">rating</span>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-400 mb-3">
          New freelancer
        </div>
      )}

      {/* Bio */}
      {bio && (
        <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2 h-10">
          {bio}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mb-4">
          {skills.slice(0, 3).map((skillItem, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-koi-teal/10 text-koi-navy text-xs rounded"
            >
              {skillItem.skill.name}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* View Profile Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleClick()
        }}
        className="w-full py-2 bg-koi-orange text-white rounded-lg font-medium text-sm hover:bg-koi-orange/90 transition-colors"
      >
        View Profile
      </button>
    </div>
  )
}
