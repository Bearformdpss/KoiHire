'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface FilterChip {
  key: string
  label: string
  value: string
}

interface FilterChipsProps {
  filters: FilterChip[]
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center gap-2 mb-4"
      role="region"
      aria-label="Active filters"
    >
      <span className="text-sm text-gray-600 font-medium">Active filters:</span>

      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="px-3 py-1.5 text-sm flex items-center gap-2 transition-all hover:bg-gray-300"
        >
          <span>{filter.label}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="hover:bg-gray-400 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.length >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          Clear all filters
        </Button>
      )}
    </div>
  )
}
