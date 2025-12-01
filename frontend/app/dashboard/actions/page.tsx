'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Action {
  id: string;
  type: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  title: string;
  message: string;
  link: string;
  metadata: {
    count?: number;
    dueDate?: string;
    clientName?: string;
    freelancerName?: string;
    orderNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ActionsResponse {
  totalCount: number;
  actions: Action[];
}

export default function ActionsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [actions, setActions] = useState<ActionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch actions');
      }

      const data = await response.json();
      setActions(data);
    } catch (err) {
      console.error('Error fetching actions:', err);
      setError('Failed to load actions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Group actions by priority
  const urgentActions = actions?.actions.filter(a => a.priority === 'URGENT') || [];
  const highActions = actions?.actions.filter(a => a.priority === 'HIGH') || [];
  const normalActions = actions?.actions.filter(a => a.priority === 'NORMAL') || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-koi-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading your actions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchActions}
              className="bg-koi-orange hover:bg-koi-orange-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Action Center</h1>
          <p className="text-gray-600">
            {actions?.totalCount === 0
              ? 'You have no pending actions at this time'
              : `${actions?.totalCount} ${actions?.totalCount === 1 ? 'item needs' : 'items need'} your attention`}
          </p>
        </div>

        {/* Empty State */}
        {actions?.totalCount === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">You have no pending actions at this time.</p>
          </div>
        )}

        {/* Actions List */}
        {actions && actions.totalCount > 0 && (
          <div className="space-y-8">
            {/* URGENT Actions */}
            {urgentActions.length > 0 && (
              <PrioritySection
                title="URGENT - Immediate Action Required"
                actions={urgentActions}
                priorityColor="red"
              />
            )}

            {/* HIGH Priority Actions */}
            {highActions.length > 0 && (
              <PrioritySection
                title="HIGH PRIORITY - Action Needed Soon"
                actions={highActions}
                priorityColor="orange"
              />
            )}

            {/* NORMAL Priority Actions */}
            {normalActions.length > 0 && (
              <PrioritySection
                title="PENDING"
                actions={normalActions}
                priorityColor="blue"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PrioritySectionProps {
  title: string;
  actions: Action[];
  priorityColor: 'red' | 'orange' | 'blue';
}

function PrioritySection({ title, actions, priorityColor }: PrioritySectionProps) {
  const bgColor = priorityColor === 'red' ? 'bg-red-50' : priorityColor === 'orange' ? 'bg-orange-50' : 'bg-blue-50';
  const borderColor = priorityColor === 'red' ? 'border-red-300' : priorityColor === 'orange' ? 'border-orange-300' : 'border-blue-300';
  const textColor = priorityColor === 'red' ? 'text-red-700' : priorityColor === 'orange' ? 'text-orange-700' : 'text-blue-700';
  const badgeColor = priorityColor === 'red' ? 'bg-red-100 text-red-700' : priorityColor === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
  const accentColor = priorityColor === 'red' ? 'border-l-red-500' : priorityColor === 'orange' ? 'border-l-orange-500' : 'border-l-blue-500';

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-3 h-3 rounded-full ${priorityColor === 'red' ? 'bg-red-500' : priorityColor === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
        <h2 className={`text-xl font-bold ${textColor}`}>
          {title}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
          {actions.length}
        </span>
      </div>
      <div className="space-y-4">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} bgColor={bgColor} borderColor={borderColor} textColor={textColor} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
}

interface ActionCardProps {
  action: Action;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}

function ActionCard({ action, bgColor, borderColor, textColor, accentColor }: ActionCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(action.link);
  };

  return (
    <div
      className={`${bgColor} bg-white border-l-4 ${accentColor} border ${borderColor} rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-xl mb-2 ${textColor} group-hover:underline transition-all`}>
            {action.title}
          </h3>
          <p className="text-gray-700 text-base mb-4 leading-relaxed">{action.message}</p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3">
            {action.metadata.orderNumber && (
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                <span className="mr-1.5">📋</span> Order #{action.metadata.orderNumber}
              </span>
            )}
            {action.metadata.clientName && (
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                <span className="mr-1.5">👤</span> {action.metadata.clientName}
              </span>
            )}
            {action.metadata.freelancerName && (
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                <span className="mr-1.5">💼</span> {action.metadata.freelancerName}
              </span>
            )}
            {action.metadata.dueDate && (
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                <span className="mr-1.5">📅</span> Due {new Date(action.metadata.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleClick}
          className={`flex-shrink-0 ${textColor} hover:bg-current hover:text-white font-semibold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 group-hover:scale-105`}
        >
          View Details
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
}
