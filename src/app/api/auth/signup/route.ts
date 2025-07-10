import { createClient } from '../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${requestUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signup?error=${encodeURIComponent(
        error.message
      )}`,
      {
        status: 303,
      }
    )
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/auth/login?message=${encodeURIComponent(
      'Check your email to confirm your account'
    )}`,
    {
      status: 303,
    }
  )
} 