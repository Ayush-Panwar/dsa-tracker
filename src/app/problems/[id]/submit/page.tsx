"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Plus, X } from 'lucide-react'

interface Problem {
  id: string
  title: string
  platform: string
  difficulty: string
}

interface SubmissionError {
  errorType: string
  errorMessage: string
  testCase?: string
}

export default function SubmitProblemPage() {
  const router = useRouter()
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  
  // Form fields
  const [language, setLanguage] = useState('JavaScript')
  const [status, setStatus] = useState('Accepted')
  const [code, setCode] = useState('')
  const [runtime, setRuntime] = useState('')
  const [memory, setMemory] = useState('')
  const [errors, setErrors] = useState<SubmissionError[]>([])
  const [newErrorType, setNewErrorType] = useState('')
  const [newErrorMessage, setNewErrorMessage] = useState('')
  const [newTestCase, setNewTestCase] = useState('')
  
  // Language options
  const languages = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'Go',
    'Rust',
    'PHP',
    'Ruby',
    'Swift',
    'Kotlin'
  ]
  
  // Status options
  const statuses = [
    'Accepted',
    'Wrong Answer',
    'Time Limit Exceeded',
    'Memory Limit Exceeded',
    'Runtime Error',
    'Compilation Error'
  ]
  
  // Fetch problem data
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(`/api/problems/${id}`)
        
        if (!res.ok) {
          throw new Error('Problem not found')
        }
        
        const data = await res.json()
        setProblem(data)
      } catch (error) {
        setFormError('Failed to load problem data')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProblem()
  }, [id])
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code) {
      setFormError('Code is required')
      return
    }
    
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      const response = await fetch(`/api/problems/${id}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          status,
          code,
          runtime: runtime || undefined,
          memory: memory || undefined,
          errors: errors.length > 0 ? errors : undefined,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit solution')
      }
      
      router.push(`/problems/${id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Add a new error
  const addError = () => {
    if (!newErrorType || !newErrorMessage) return
    
    setErrors([
      ...errors,
      {
        errorType: newErrorType,
        errorMessage: newErrorMessage,
        testCase: newTestCase || undefined,
      },
    ])
    
    setNewErrorType('')
    setNewErrorMessage('')
    setNewTestCase('')
  }
  
  // Remove an error
  const removeError = (index: number) => {
    setErrors(errors.filter((_, i) => i !== index))
  }
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  if (!problem) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">Problem not found</p>
          <Button asChild>
            <Link href="/problems">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Problems
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-2">
          <Link href={`/problems/${id}`}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">Submit Solution</h1>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{problem.title}</h2>
        <div className="flex gap-2 mt-1 text-muted-foreground">
          <span>{problem.platform}</span>
          <span>•</span>
          <span>{problem.difficulty}</span>
        </div>
      </div>
      
      {formError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Solution Details</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Enter your solution code and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your solution code here..."
                className="font-mono min-h-[300px] dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="runtime">Runtime</Label>
                <Input
                  id="runtime"
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  placeholder="e.g. 120ms"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="memory">Memory</Label>
                <Input
                  id="memory"
                  value={memory}
                  onChange={(e) => setMemory(e.target.value)}
                  placeholder="e.g. 14.2MB"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {status !== 'Accepted' && (
          <Card className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Errors</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Add details about errors encountered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {errors.map((error, index) => (
                  <div key={index} className="p-3 bg-muted dark:bg-gray-700 rounded-md relative">
                    <button
                      type="button"
                      onClick={() => removeError(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Error Type</p>
                        <p>{error.errorType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Error Message</p>
                        <p>{error.errorMessage}</p>
                      </div>
                    </div>
                    {error.testCase && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Test Case</p>
                        <p className="font-mono text-sm">{error.testCase}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium mb-3">Add Error</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="errorType">Error Type</Label>
                    <Input
                      id="errorType"
                      value={newErrorType}
                      onChange={(e) => setNewErrorType(e.target.value)}
                      placeholder="e.g. TypeError, IndexOutOfBounds"
                      className="dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="errorMessage">Error Message</Label>
                    <Input
                      id="errorMessage"
                      value={newErrorMessage}
                      onChange={(e) => setNewErrorMessage(e.target.value)}
                      placeholder="e.g. Cannot read property of undefined"
                      className="dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <Label htmlFor="testCase">Test Case (Optional)</Label>
                  <Input
                    id="testCase"
                    value={newTestCase}
                    onChange={(e) => setNewTestCase(e.target.value)}
                    placeholder="e.g. Input: [1,2,3], Output: 6"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addError}
                  disabled={!newErrorType || !newErrorMessage}
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Error
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/problems/${id}`)}
            className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="dark:hover:bg-primary/90">
            {isSubmitting ? 'Submitting...' : 'Submit Solution'}
          </Button>
        </div>
      </form>
    </div>
  )
} 