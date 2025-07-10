"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SubmissionFormProps {
  problemId: string
}

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c++', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' }
]

const STATUS_OPTIONS = [
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Attempted', label: 'Attempted' },
  { value: 'Wrong Answer', label: 'Wrong Answer' },
  { value: 'Time Limit Exceeded', label: 'Time Limit Exceeded' },
  { value: 'Runtime Error', label: 'Runtime Error' }
]

export default function SubmissionForm({ problemId }: SubmissionFormProps) {
  const router = useRouter()
  const [language, setLanguage] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<{
    language?: string
    status?: string
    code?: string
  }>({})

  const validateForm = () => {
    const newErrors: {
      language?: string
      status?: string
      code?: string
    } = {}
    
    if (!language) {
      newErrors.language = 'Language is required'
    }
    
    if (!status) {
      newErrors.status = 'Status is required'
    }
    
    if (!code || code.trim().length < 10) {
      newErrors.code = 'Code is required and should be at least 10 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSubmitting(true)
    
    try {
      const response = await fetch(`/api/problems/${problemId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language,
          status,
          code
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit')
      }
      
      toast.success('Submission added successfully', {
        description: 'Your submission has been recorded.'
      })
      
      // Clear form and refresh data
      setLanguage('')
      setStatus('')
      setCode('')
      router.refresh()
      
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error('Failed to add submission', {
        description: 'There was a problem adding your submission. Please try again.'
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Add New Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={language} 
                onValueChange={setLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-sm text-destructive">{errors.language}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={setStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <textarea 
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Paste your code here..."
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Add Submission'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
} 
 
 
 