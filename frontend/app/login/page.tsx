import { LoginForm } from '@/components/forms/LoginForm';
import { GuestOnly } from '@/components/auth/ProtectedRoute';

export default function LoginPage() {
  return (
    <GuestOnly>
      <LoginForm />
    </GuestOnly>
  );
}