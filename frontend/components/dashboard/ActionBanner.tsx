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
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/actions`;
      console.log('[ActionBanner] Fetching from URL:', apiUrl);
      console.log('[ActionBanner] Environment check:', {
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
        hasToken: !!localStorage.getItem('accessToken')
      });

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('[ActionBanner] Response status:', response.status);
      console.log('[ActionBanner] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[ActionBanner] Actions data:', data);
        console.log('[ActionBanner] Total count:', data.totalCount);
        setActionCount(data.totalCount);
      } else {
        const errorText = await response.text();
        console.error('[ActionBanner] Response not ok. Status:', response.status, 'Error:', errorText);
        setActionCount(0);
      }
    } catch (error) {
      console.error('[ActionBanner] Error fetching action count:', error);
      setActionCount(0);
    } finally {
      setLoading(false);
      console.log('[ActionBanner] Final actionCount:', actionCount);
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
