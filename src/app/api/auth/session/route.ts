import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase session error:', error)
      return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
    }
    
    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    console.error('Session API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
 
 
 