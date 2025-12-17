'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { actionsApi } from '@/lib/api/actions';

export function ActionBanner() {
  const [actionCount, setActionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActionCount();
  }, []);

  const fetchActionCount = async () => {
    try {
      // Use secure cookie-based authentication via actionsApi
      const data = await actionsApi.getActions();
      console.log('[ActionBanner] Actions data:', data);
      console.log('[ActionBanner] Total count:', data.totalCount);
      setActionCount(data.totalCount);
    } catch (error) {
      console.error('[ActionBanner] Error fetching action count:', error);
      setActionCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if loading or no actions (per requirement)
  if (loading || actionCount === null || actionCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-koi rounded-lg p-4 mb-6 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-[#1E293B]" />
          <span className="text-[#1E293B] font-semibold text-lg">
            You have {actionCount} {actionCount === 1 ? 'item' : 'items'} requiring your attention
          </span>
        </div>
        <Link href="/dashboard/actions">
          <button className="bg-white text-koi-orange font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
            View Actions
            <span>→</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
