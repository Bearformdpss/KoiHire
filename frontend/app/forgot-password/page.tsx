import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';
import { GuestOnly } from '@/components/auth/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Forgot Password - KoiHire',
  description: 'Reset your KoiHire account password',
};

export default function ForgotPasswordPage() {
  return (
    <GuestOnly>
      <ForgotPasswordForm />
    </GuestOnly>
  );
}
