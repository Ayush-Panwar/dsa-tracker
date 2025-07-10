import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ensureDbUser } from '@/utils/user'
import ProblemForm from '@/components/problems/problem-form'

export default async function AddProblemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Ensure user exists in database
  const dbUser = await ensureDbUser(user.id, {
    name: user.user_metadata?.name,
    email: user.email
  })
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/problems">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Add New Problem</h1>
        
        <div className="max-w-3xl">
          <ProblemForm userId={dbUser.id} />
        </div>
      </div>
    </div>
  )
} 
 
 
 