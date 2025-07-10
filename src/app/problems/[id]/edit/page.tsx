import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ensureDbUser } from '@/utils/user'
import { prisma } from '@/lib/prisma'
import ProblemForm from '@/components/problems/problem-form'

interface Tag {
  id: string
  name: string
  color: string | null
  userId: string
  createdAt: Date
}

interface ProblemTag {
  tag: Tag
}

// We use this type definition in the getProblemData return value
type ProblemData = {
  id: string
  title: string
  platform: string
  difficulty: string
  status: string
  url: string | null
  description: string | null
  notes: string | null
  tags: Tag[]
}

async function getProblemData(id: string, userId: string): Promise<ProblemData | null> {
  try {
    const problem = await prisma.problem.findUnique({
      where: {
        id,
        userId
      },
      include: {
        problemTags: {
          include: {
            tag: true
          }
        }
      }
    })
    
    if (!problem) {
      return null
    }
    
    // Transform problem data to include tags directly
    return {
      ...problem,
      tags: problem.problemTags.map((pt: ProblemTag) => pt.tag)
    }
  } catch (error) {
    console.error('Error fetching problem:', error)
    return null
  }
}

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  
  const problem = await getProblemData(id, dbUser.id)
  
  if (!problem) {
    notFound()
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/problems/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Problem
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Edit Problem</h1>
        
        <div className="max-w-3xl">
          <ProblemForm
            userId={dbUser.id}
            problem={{
              ...problem,
              tags: problem.tags.map(tag => ({
                id: tag.id,
                name: tag.name,
                color: tag.color || '#888888'
              }))
            }}
          />
        </div>
      </div>
    </div>
  )
} 
 
 
 