import { Suspense } from 'react';
import { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';
import { GuestOnly } from '@/components/auth/ProtectedRoute';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Reset Password - KoiHire',
  description: 'Reset your KoiHire account password',
};

function ResetPasswordFormWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

export default function ResetPasswordPage() {
  return (
    <GuestOnly>
      <ResetPasswordFormWrapper />
    </GuestOnly>
  );
}
