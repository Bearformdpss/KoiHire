import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { NetworkStatusProvider } from '@/components/providers/NetworkStatusProvider'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KoiHire - Freelance Marketplace',
  description: 'Where talent flows upstream. Connect with skilled freelancers and find quality projects on KoiHire.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <NetworkStatusProvider>
            <AuthProvider>
              <Header />
              <main>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
              <Footer />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#10B981',
                      color: '#fff',
                    },
                  },
                  error: {
                    style: {
                      background: '#EF4444',
                      color: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </NetworkStatusProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}