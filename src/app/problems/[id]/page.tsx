import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, ArrowLeft, Calendar } from 'lucide-react'
import { ensureDbUser } from '@/utils/user'
import { prisma } from '@/lib/prisma'
import CodeViewer from '@/components/problems/code-viewer'
import SubmissionForm from '@/components/problems/submission-form'
import DescriptionViewer from '@/components/problems/description-viewer'
import TagManager from '@/components/problems/tag-manager'
import { type JsonValue } from '@prisma/client/runtime/library'

interface Tag {
  id: string
  name: string
  color: string | null
  userId: string
  createdAt: Date
}

interface ProblemTag {
  tag: Tag
  problemId: string
  tagId: string
  assignedAt: Date
}

interface SubmissionError {
  id: string
  errorMessage: string
  errorType: string
  testCase?: string | null
  // Add all fields returned from the database
  createdAt: Date
  aiAnalysis: JsonValue
  errorSubtype: string | null
  lineNumber: number | null
  columnNumber: number | null
  snippetContext: string | null
  suggestedFix: string | null
  submissionId: string
}

interface Submission {
  id: string
  language: string
  status: string
  code: string
  runtime?: string | null
  memory?: string | null
  submittedAt: Date | string
  errors: SubmissionError[]
}

// Temporary components until we create the full ones
function SubmissionsList({ submissions }: { submissions: Submission[] }) {
  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-gray-800 dark:text-gray-100">Submission History</CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No submissions yet</p>
        ) : (
          <div className="space-y-6">
            {submissions.map(submission => (
              <div key={submission.id} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <Badge 
                        className="text-xs font-medium px-2.5 py-0.5 rounded"
                        style={{
                          backgroundColor: submission.status === 'Accepted' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(124, 58, 237, 0.15)',
                          color: submission.status === 'Accepted' ? '#15803d' : '#7c3aed',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: submission.status === 'Accepted' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(124, 58, 237, 0.3)'
                        }}
                      >
                        {submission.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{submission.language}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    {submission.runtime && (
                      <div className="text-muted-foreground">Runtime: {submission.runtime}</div>
                    )}
                    {submission.memory && (
                      <div className="text-muted-foreground">Memory: {submission.memory}</div>
                    )}
                  </div>
                </div>
                
                <div className="p-0">
                  <CodeViewer 
                    code={submission.code} 
                    language={submission.language.toLowerCase()} 
                    title={`${submission.language} Solution`}
                  />
                </div>
                
                {submission.errors && submission.errors.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-destructive/10">
                    <h4 className="font-medium text-sm mb-2">Errors</h4>
                    {submission.errors.map((error, index) => (
                      <div key={index} className="text-sm text-destructive mb-1">
                        <div className="font-medium">{error.errorType}</div>
                        <div className="text-xs">{error.errorMessage}</div>
                        {error.testCase && (
                          <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                            {error.testCase}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function getProblemData(id: string, userId: string) {
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
        },
        submissions: {
          orderBy: {
            submittedAt: 'desc'
          },
          include: {
            errors: true
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

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  
  const problem = await getProblemData((await params).id, dbUser.id)
  
  if (!problem) {
    notFound()
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-colors">
          <Link href="/problems">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">{problem.title}</h1>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {problem.platform}
              </span>
              <Badge 
                className="text-xs font-medium px-2.5 py-0.5 rounded"
                style={{
                  backgroundColor: 
                    problem.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.15)' :
                    problem.difficulty === 'Medium' ? 'rgba(202, 138, 4, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                  color: 
                    problem.difficulty === 'Easy' ? '#16a34a' :
                    problem.difficulty === 'Medium' ? '#b45309' : '#dc2626',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 
                    problem.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.3)' :
                    problem.difficulty === 'Medium' ? 'rgba(202, 138, 4, 0.3)' : 'rgba(220, 38, 38, 0.3)'
                }}
              >
                {problem.difficulty}
              </Badge>
              <Badge 
                className="text-xs font-medium px-2.5 py-0.5 rounded"
                style={{
                  backgroundColor: 
                    problem.status === 'Solved' ? 'rgba(22, 163, 74, 0.15)' :
                    problem.status === 'Attempted' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(203, 213, 225, 0.3)',
                  color: 
                    problem.status === 'Solved' ? '#15803d' :
                    problem.status === 'Attempted' ? '#7c3aed' : '#64748b',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 
                    problem.status === 'Solved' ? 'rgba(22, 163, 74, 0.3)' :
                    problem.status === 'Attempted' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(203, 213, 225, 0.5)'
                }}
              >
                {problem.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {problem.tags.map((tag: Tag) => (
                <Badge 
                  key={tag.id} 
                  variant="outline"
                  className="text-xs py-0 h-5 rounded-md dark:bg-gray-700"
                  style={{ 
                    borderColor: `${tag.color || '#888888'}50`,
                    color: tag.color || '#888888',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Updated {new Date(problem.updatedAt).toLocaleString()}</span>
            </div>
            {problem.url && (
              <Button 
                className="bg-primary hover:bg-primary/90 transition-colors"
                asChild
              >
                <a href={problem.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Problem
                </a>
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-gray-50 dark:bg-gray-800 p-1">
            <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all">Details</TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all">
              Submissions ({problem.submissions.length})
            </TabsTrigger>
            <TabsTrigger value="add-submission" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all">Add Submission</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-gray-800 dark:text-gray-100">Problem Description</CardTitle>
              </CardHeader>
              <CardContent>
                {problem.description ? (
                  <DescriptionViewer description={problem.description} />
                ) : (
                  <p className="text-muted-foreground">No description available.</p>
                )}
              </CardContent>
            </Card>
            
            {problem.tags && problem.tags.length > 0 ? (
              <Card className="mt-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-gray-800 dark:text-gray-100">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <TagManager problemId={problem.id} initialTags={problem.tags} />
                </CardContent>
              </Card>
            ) : (
              <Card className="mt-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-gray-800 dark:text-gray-100">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <TagManager problemId={problem.id} initialTags={[]} />
                </CardContent>
              </Card>
            )}
            
            {problem.notes && (
              <Card className="mt-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-gray-800 dark:text-gray-100">My Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap">{problem.notes}</div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="submissions" className="mt-6">
            <SubmissionsList submissions={problem.submissions} />
          </TabsContent>
          
          <TabsContent value="add-submission" className="mt-6">
            <SubmissionForm problemId={problem.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 