'use client'

import React from 'react'
import { ProfileCard } from './ProfileCard'
import { LevelProgressCard } from './LevelProgressCard'
import { ThisMonthCard } from './ThisMonthCard'
import { AvailabilityToggle } from './AvailabilityToggle'

export function FreelancerSidebar() {
  return (
    <aside className="w-[280px] fixed left-0 top-16 bottom-0 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 space-y-4 hidden lg:block">
      <ProfileCard />
      <LevelProgressCard />
      <ThisMonthCard />
      <AvailabilityToggle />
    </aside>
  )
}
