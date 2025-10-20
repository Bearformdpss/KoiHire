import { RegisterForm } from '@/components/forms/RegisterForm';
import { GuestOnly } from '@/components/auth/ProtectedRoute';

export default function RegisterPage() {
  return (
    <GuestOnly>
      <RegisterForm />
    </GuestOnly>
  );
}