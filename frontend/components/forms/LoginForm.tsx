'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { PasswordField } from '@/components/forms/PasswordField';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { loginSchema, type LoginFormData } from '@/lib/validation/auth-schemas';
import { useAuthStore } from '@/lib/store/authStore';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Login successful! Welcome back.');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('email', { message: 'Invalid email or password' });
        setError('password', { message: 'Invalid email or password' });
        toast.error('Invalid email or password');
      } else if (error.response?.status === 429) {
        toast.error('Too many login attempts. Please try again later.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to KoiHire
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link 
              href="/register" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormField
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              registration={register('email')}
              error={errors.email?.message}
            />
            
            <PasswordField
              id="password"
              label="Password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              registration={register('password')}
              error={errors.password?.message}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link 
                href="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>

          {/* Demo accounts section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800 mb-3 font-medium">Demo accounts:</div>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-white rounded border border-blue-100">
                <div className="font-medium text-blue-900">Client Account</div>
                <div className="text-blue-700">john.client@example.com / password123</div>
              </div>
              <div className="p-3 bg-white rounded border border-blue-100">
                <div className="font-medium text-blue-900">Freelancer Account</div>
                <div className="text-blue-700">mike.dev@example.com / password123</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}