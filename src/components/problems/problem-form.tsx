"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tag, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Define schema for form validation
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  platform: z.string().min(1, 'Platform is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  status: z.enum(['Todo', 'Attempted', 'Solved']),
  description: z.string().optional(),
  notes: z.string().optional(),
})

type ProblemFormValues = z.infer<typeof problemSchema>

interface TagType {
  id: string
  name: string
  color: string
}

interface ProblemFormProps {
  userId: string
  problem?: {
    id: string
    title: string
    url?: string | null
    platform: string
    difficulty: string
    status: string
    description?: string | null
    notes?: string | null
    tags: TagType[]
  }
}

export default function ProblemForm({ userId, problem }: ProblemFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState<TagType[]>([])
  const [selectedTags, setSelectedTags] = useState<TagType[]>(problem?.tags || [])
  const [newTagName, setNewTagName] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagColor, setNewTagColor] = useState('#3b82f6') // Default blue color
  
  // Initialize form with default values or existing problem data
  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: problem?.title || '',
      url: problem?.url || '',
      platform: problem?.platform || 'LeetCode',
      difficulty: (problem?.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      status: (problem?.status as 'Todo' | 'Attempted' | 'Solved') || 'Todo',
      description: problem?.description || '',
      notes: problem?.notes || '',
    },
  })
  
  // Fetch user's tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/user/tags')
        if (!response.ok) {
          throw new Error('Failed to fetch tags')
        }
        const data = await response.json()
        setTags(data)
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    
    fetchTags()
  }, [])
  
  // Handle form submission
  const onSubmit = async (values: ProblemFormValues) => {
    setIsSubmitting(true)
    
    try {
      // Prepare the data with selected tags
      const data = {
        ...values,
        tagIds: selectedTags.map(tag => tag.id),
        userId
      }
      
      // Determine if we're creating or updating
      const url = problem 
        ? `/api/problems/${problem.id}` 
        : '/api/problems'
      
      const method = problem ? 'PUT' : 'POST'
      
      // Send the request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save problem')
      }
      
      const result = await response.json()
      
      // Redirect to the problem details page
      router.push(`/problems/${result.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error saving problem:', error)
      alert('Failed to save problem. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle adding a new tag
  const handleAddTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const response = await fetch('/api/user/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create tag')
      }
      
      const newTag = await response.json()
      
      // Add to tags list and selected tags
      setTags(prevTags => [...prevTags, newTag])
      setSelectedTags(prevTags => [...prevTags, newTag])
      
      // Reset form
      setNewTagName('')
      setIsAddingTag(false)
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag. Please try again.')
    }
  }
  
  // Handle selecting a tag
  const handleSelectTag = (tag: TagType) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Two Sum" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://leetcode.com/problems/two-sum/" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="LeetCode" 
                        {...field} 
                        list="platform-suggestions"
                      />
                    </FormControl>
                    <datalist id="platform-suggestions">
                      <option value="LeetCode" />
                      <option value="HackerRank" />
                      <option value="CodeForces" />
                      <option value="AlgoExpert" />
                      <option value="InterviewBit" />
                      <option value="GeeksForGeeks" />
                      <option value="CodeSignal" />
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Todo">Todo</SelectItem>
                        <SelectItem value="Attempted">Attempted</SelectItem>
                        <SelectItem value="Solved">Solved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel className="text-left">Tags</FormLabel>
                {!isAddingTag && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddingTag(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Tag
                  </Button>
                )}
              </div>
              
              {isAddingTag && (
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder="Tag name" 
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)} 
                    className="flex-1"
                  />
                  <Input 
                    type="color" 
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)} 
                    className="w-16 p-1 h-10"
                  />
                  <Button 
                    type="button"
                    onClick={handleAddTag}
                    variant="secondary"
                  >
                    Add
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    variant="outline"
                    size="icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant="outline"
                    style={{ 
                      borderColor: tag.color, 
                      color: tag.color,
                      backgroundColor: `${tag.color}10`
                    }}
                    className="cursor-pointer"
                    onClick={() => handleSelectTag(tag)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
              
              {tags.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Available Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {tags
                      .filter(tag => !selectedTags.some(t => t.id === tag.id))
                      .map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant="outline"
                          style={{ 
                            borderColor: tag.color, 
                            color: tag.color 
                          }}
                          className={cn(
                            "cursor-pointer hover:bg-secondary",
                          )}
                          onClick={() => handleSelectTag(tag)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter problem description..." 
                      {...field} 
                      className="min-h-[120px]"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add your notes, approach, algorithm used..." 
                      {...field} 
                      className="min-h-[120px]"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : problem ? 'Update Problem' : 'Add Problem'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 
 
 
 