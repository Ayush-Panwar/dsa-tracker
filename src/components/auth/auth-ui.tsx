'use client'

import { createBrowserClient } from '@/utils/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthUI({ 
  view = 'sign_in',
  redirectTo = '/dashboard'
}: { 
  view?: 'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password'
  redirectTo?: string
}) {
  const { resolvedTheme } = useTheme()
  const [supabase] = useState(() => createBrowserClient())
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Only render on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    // Listen for sign in events
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(redirectTo)
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [redirectTo, router, supabase])

  if (!mounted) return null

  const theme = resolvedTheme === 'dark' ? 'dark' : 'default'

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <Auth
        supabaseClient={supabase}
        view={view}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#0369a1', // blue-700
                brandAccent: '#0284c7', // blue-600
              },
            },
          },
          style: {
            button: {
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            },
            input: {
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            },
          },
        }}
        theme={theme}
        providers={['github', 'google']}
        redirectTo={`${window.location.origin}/auth/callback`}
        onlyThirdPartyProviders={false}
        magicLink={true}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Password',
              button_label: 'Sign In',
              loading_button_label: 'Signing In...',
              social_provider_text: 'Sign in with {{provider}}',
              link_text: "Don't have an account? Sign up",
            },
            sign_up: {
              email_label: 'Email',
              password_label: 'Create a Password',
              button_label: 'Sign Up',
              loading_button_label: 'Signing Up...',
              social_provider_text: 'Sign up with {{provider}}',
              link_text: 'Already have an account? Sign in',
            },
          }
        }}
      />
    </div>
  )
} 