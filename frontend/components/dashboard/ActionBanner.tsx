'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export function ActionBanner() {
  const [actionCount, setActionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActionCount();
  }, []);

  const fetchActionCount = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/actions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setActionCount(data.totalCount);
      } else {
        setActionCount(0);
      }
    } catch (error) {
      console.error('Error fetching action count:', error);
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
          <AlertCircle className="h-6 w-6 text-white" />
          <span className="text-white font-semibold text-lg">
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
