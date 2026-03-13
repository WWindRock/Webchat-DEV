'use client'

import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const [isRetrying, setIsRetrying] = useState(false)

  const error = searchParams.get('error')
  const errorMessage: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    OAuthSignin: 'Error in constructing the authorization URL.',
    OAuthCallback: 'Error in handling the OAuth callback.',
    OAuthCreateAccount: 'Could not create OAuth account.',
    EmailCreateAccount: 'Could not create email account.',
    Callback: 'Error in the OAuth callback handler.',
  }
  
  const message = error ? errorMessage[error] || 'An unexpected error occurred.' : 'An unexpected error occurred.'

  useEffect(() => {
    if (error === 'Verification') {
      setIsRetrying(true)
      const timer = setTimeout(() => {
        window.location.href = '/auth/signin'
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="max-w-md w-full px-4">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-xl font-semibold mb-2">Authentication Error</h1>
          <p className="text-muted-foreground mb-6">{message}</p>

          {isRetrying ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to sign in...</span>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
