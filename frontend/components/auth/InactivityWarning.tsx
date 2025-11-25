'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InactivityWarningProps {
  isOpen: boolean;
  timeRemaining: number; // milliseconds
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export function InactivityWarning({
  isOpen,
  timeRemaining: initialTimeRemaining,
  onStayLoggedIn,
  onLogout,
}: InactivityWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);

  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
  }, [initialTimeRemaining]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  if (!isOpen) {
    return null;
  }

  const seconds = Math.ceil(timeRemaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        {/* Modal */}
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          {/* Icon and Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Session Timeout Warning
              </h2>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Your session is about to expire due to inactivity. You will be automatically logged out in:
            </p>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg py-4 px-6">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-mono font-bold text-yellow-700">
                {minutes}:{remainingSeconds.toString().padStart(2, '0')}
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              Click "Stay Logged In" to continue your session, or "Logout" to end your session now.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onStayLoggedIn}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Stay Logged In
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
