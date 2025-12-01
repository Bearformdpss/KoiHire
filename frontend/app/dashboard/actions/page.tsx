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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/actions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
  const borderColor = priorityColor === 'red' ? 'border-red-200' : priorityColor === 'orange' ? 'border-orange-200' : 'border-blue-200';
  const textColor = priorityColor === 'red' ? 'text-red-800' : priorityColor === 'orange' ? 'text-orange-800' : 'text-blue-800';
  const indicator = priorityColor === 'red' ? '🔴' : priorityColor === 'orange' ? '🟠' : '🔵';

  return (
    <div>
      <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textColor}`}>
        <span>{indicator}</span>
        {title}
      </h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} bgColor={bgColor} borderColor={borderColor} textColor={textColor} />
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
}

function ActionCard({ action, bgColor, borderColor, textColor }: ActionCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(action.link);
  };

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-1 ${textColor}`}>
            {action.title}
          </h3>
          <p className="text-gray-700 mb-2">{action.message}</p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            {action.metadata.orderNumber && (
              <span>Order #{action.metadata.orderNumber}</span>
            )}
            {action.metadata.clientName && (
              <span>Client: {action.metadata.clientName}</span>
            )}
            {action.metadata.freelancerName && (
              <span>Freelancer: {action.metadata.freelancerName}</span>
            )}
            {action.metadata.dueDate && (
              <span>Due: {new Date(action.metadata.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <button
          onClick={handleClick}
          className={`ml-4 ${textColor} hover:underline font-medium flex items-center gap-1 flex-shrink-0`}
        >
          View Details
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
