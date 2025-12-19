'use client'

import { useEffect, useState } from 'react'
import { Clock, User, DollarSign, FileText, CheckCircle, XCircle, Upload, AlertCircle, Package } from 'lucide-react'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface ServiceEvent {
  id: string
  serviceOrderId: string
  eventType: string
  actorId: string | null
  actorName: string
  metadata: any
  createdAt: string
}

interface ServiceOrderTimelineProps {
  orderId: string
}

const EVENT_CONFIG: Record<string, { icon: any; color: string; title: string }> = {
  ORDER_CONFIRMED: {
    icon: User,
    color: 'bg-blue-500',
    title: 'Order Confirmed'
  },
  PAYMENT_RECEIVED: {
    icon: DollarSign,
    color: 'bg-green-500',
    title: 'Payment Secured'
  },
  FILE_UPLOADED: {
    icon: Upload,
    color: 'bg-purple-500',
    title: 'Files Uploaded'
  },
  DELIVERY_MADE: {
    icon: FileText,
    color: 'bg-indigo-500',
    title: 'Work Delivered'
  },
  REVISION_REQUESTED: {
    icon: AlertCircle,
    color: 'bg-orange-500',
    title: 'Revision Requested'
  },
  ORDER_COMPLETED: {
    icon: CheckCircle,
    color: 'bg-green-500',
    title: 'Order Completed'
  },
  PAYMENT_RELEASED: {
    icon: DollarSign,
    color: 'bg-emerald-500',
    title: 'Payment Released'
  }
}

export default function ServiceOrderTimeline({ orderId }: ServiceOrderTimelineProps) {
  const [events, setEvents] = useState<ServiceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [orderId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/service-orders/${orderId}/events`)
      setEvents(response.data.data.events)
    } catch (err: any) {
      console.error('Error fetching timeline:', err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch timeline events')
    } finally {
      setLoading(false)
    }
  }

  const renderEventDetails = (event: ServiceEvent) => {
    const metadata = event.metadata || {}

    switch (event.eventType) {
      case 'ORDER_CONFIRMED':
        return (
          <div className="text-sm text-gray-600 mt-1">
            <p>Order accepted and work has begun</p>
            <p className="text-xs text-gray-500">Total: ${metadata.totalAmount}</p>
          </div>
        )

      case 'PAYMENT_RECEIVED':
        return (
          <div className="text-sm text-gray-600 mt-1">
            <p>${metadata.amount} secured in escrow</p>
            <p className="text-xs text-gray-500">Paid by {metadata.paidByName}</p>
          </div>
        )

      case 'FILE_UPLOADED':
        return (
          <div className="text-sm text-gray-600 mt-1">
            <p>{metadata.files?.length || 0} file(s) uploaded</p>
            {metadata.files && metadata.files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {metadata.files.map((file: any, idx: number) => (
                  <li key={idx} className="text-xs text-gray-500">
                    • {file.fileName} ({(file.fileSize / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            )}
          </div>
        )

      case 'DELIVERY_MADE':
        return (
          <div className="text-sm text-gray-600 mt-1">
            <p className="font-medium">{metadata.deliveryTitle || 'Work submitted'}</p>
            {metadata.deliveryDescription && (
              <p className="text-xs text-gray-500 mt-1">{metadata.deliveryDescription}</p>
            )}
            {metadata.filesCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">{metadata.filesCount} file(s) included</p>
            )}
          </div>
        )

      case 'REVISION_REQUESTED':
        return (
          <div className="text-sm text-gray-600 mt-1">
            <p className="italic">&quot;{metadata.revisionNote}&quot;</p>
            <p className="text-xs text-gray-500 mt-1">
              Revision {metadata.revisionNumber} • {metadata.revisionsRemaining} remaining
            </p>
          </div>
        )

      case 'ORDER_COMPLETED':
        return (
          <div className="text-sm text-gray-600 mt-1">
            <p>Order approved by client</p>
          </div>
        )

      case 'PAYMENT_RELEASED':
        return (
          <div className="text-sm text-gray-600 mt-1">
            <p>Payment released to <span className="font-medium">{metadata.releasedToName}</span></p>
            <p className="text-xs text-gray-500">Amount: ${metadata.amount}</p>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
        <p className="text-red-600">Failed to load timeline: {error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
        <p className="text-gray-500">No events yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Order Timeline</h3>

      <div className="space-y-6">
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.eventType] || {
            icon: Clock,
            color: 'bg-gray-500',
            title: event.eventType
          }
          const Icon = config.icon

          return (
            <div key={event.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`${config.color} rounded-full p-2 text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
                {index < events.length - 1 && (
                  <div className="w-0.5 bg-gray-200 flex-1 mt-2" style={{ minHeight: '40px' }}></div>
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{config.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.actorName} • {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                {renderEventDetails(event)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
