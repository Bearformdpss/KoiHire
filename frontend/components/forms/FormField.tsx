import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  registration?: UseFormRegisterReturn;
  error?: string;
  helperText?: string;
}

export function FormField({
  label,
  registration,
  error,
  helperText,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label 
        htmlFor={props.id} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Input
        {...props}
        {...registration}
        className={cn(
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      
      {error && (
        <FormError 
          message={error} 
        />
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}