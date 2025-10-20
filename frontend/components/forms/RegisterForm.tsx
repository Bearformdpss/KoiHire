'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { PasswordField } from '@/components/forms/PasswordField';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { registerSchema, type RegisterFormData } from '@/lib/validation/auth-schemas';
import { useAuthStore } from '@/lib/store/authStore';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, isLoading } = useAuthStore();
  const [pendingContact, setPendingContact] = useState<any>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Check for contact intent on component mount
  useEffect(() => {
    const intent = searchParams?.get('intent');
    if (intent === 'contact' && typeof window !== 'undefined') {
      const storedContact = localStorage.getItem('pendingContact');
      if (storedContact) {
        try {
          const contactData = JSON.parse(storedContact);
          setPendingContact(contactData);
        } catch (error) {
          console.error('Error parsing pending contact:', error);
        }
      }
    }
  }, [searchParams]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...registrationData } = data;
      
      await registerUser(registrationData);
      toast.success('Registration successful! Welcome to KoiHire.');
      
      // Handle pending contact after successful registration
      if (pendingContact) {
        // Clear pending contact from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingContact');
        }
        
        // Redirect to messages with contact parameters
        toast.success(`Connecting you with ${pendingContact.freelancerName}...`);
        router.push(`/messages?contact=${pendingContact.freelancerId}&portfolio=${pendingContact.portfolioId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Registration failed';
        
        if (errorMessage.includes('email')) {
          setError('email', { message: 'This email is already registered' });
        } else if (errorMessage.includes('username')) {
          setError('username', { message: 'This username is already taken' });
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your KoiHire account
          </h2>
          {pendingContact && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    After registration, you'll be connected with <strong>{pendingContact.freelancerName}</strong> about their "{pendingContact.portfolioTitle}" portfolio.
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                I want to join as <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    value="CLIENT"
                    {...register('role')}
                    className="sr-only"
                  />
                  <div className={`
                    cursor-pointer rounded-lg border-2 p-4 text-center transition-all
                    ${watch('role') === 'CLIENT' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}>
                    <div className="font-medium">Client</div>
                    <div className="text-xs text-gray-500 mt-1">
                      I need work done
                    </div>
                  </div>
                </label>
                
                <label className="relative">
                  <input
                    type="radio"
                    value="FREELANCER"
                    {...register('role')}
                    className="sr-only"
                  />
                  <div className={`
                    cursor-pointer rounded-lg border-2 p-4 text-center transition-all
                    ${watch('role') === 'FREELANCER' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}>
                    <div className="font-medium">Freelancer</div>
                    <div className="text-xs text-gray-500 mt-1">
                      I want to work
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="firstName"
                label="First name"
                type="text"
                autoComplete="given-name"
                required
                placeholder="John"
                registration={register('firstName')}
                error={errors.firstName?.message}
              />
              
              <FormField
                id="lastName"
                label="Last name"
                type="text"
                autoComplete="family-name"
                required
                placeholder="Doe"
                registration={register('lastName')}
                error={errors.lastName?.message}
              />
            </div>
            
            <FormField
              id="username"
              label="Username"
              type="text"
              autoComplete="username"
              required
              placeholder="johndoe"
              registration={register('username')}
              error={errors.username?.message}
              helperText="This will be your unique identifier on KoiHire"
            />
            
            <FormField
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              placeholder="john@example.com"
              registration={register('email')}
              error={errors.email?.message}
            />
            
            <PasswordField
              id="password"
              label="Password"
              autoComplete="new-password"
              required
              placeholder="Create a strong password"
              registration={register('password')}
              error={errors.password?.message}
              helperText="Must contain at least 8 characters with uppercase, lowercase, and number"
              showStrengthIndicator
            />
            
            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
              required
              placeholder="Confirm your password"
              registration={register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
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
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}