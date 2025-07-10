"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Plus, X } from 'lucide-react'

interface Tag {
  name: string
  color: string
}

export default function NewProblemPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('LeetCode')
  const [difficulty, setDifficulty] = useState('Medium')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#888888')
  
  // Platform options
  const platforms = [
    'LeetCode',
    'HackerRank',
    'CodeForces',
    'GeeksforGeeks',
    'AtCoder',
    'Other'
  ]
  
  // Difficulty options
  const difficulties = ['Easy', 'Medium', 'Hard']
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title) {
      setFormError('Title is required')
      return
    }
    
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          platform,
          difficulty,
          url,
          description,
          notes,
          tags,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create problem')
      }
      
      const problem = await response.json()
      router.push(`/problems/${problem.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Add a new tag
  const addTag = () => {
    if (!newTagName.trim()) return
    
    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      return
    }
    
    setTags([...tags, { name: newTagName, color: newTagColor }])
    setNewTagName('')
    setNewTagColor('#888888')
  }
  
  // Remove a tag
  const removeTag = (tagName: string) => {
    setTags(tags.filter(tag => tag.name !== tagName))
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-2">
          <Link href="/problems">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add New Problem</h1>
      </div>
      
      {formError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Problem Details</CardTitle>
            <CardDescription>
              Enter the basic information about the problem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Two Sum"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">Problem URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://leetcode.com/problems/two-sum/"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Description & Notes</CardTitle>
            <CardDescription>
              Add a description of the problem and your notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Problem Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter the problem description here..."
                className="min-h-[150px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes, approach, or thoughts here..."
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to categorize this problem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <Badge
                  key={tag.name}
                  style={{ backgroundColor: tag.color }}
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.name)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags added yet</p>
              )}
            </div>
            
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="newTag">New Tag</Label>
                <Input
                  id="newTag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Array, Dynamic Programming"
                />
              </div>
              
              <div className="w-24">
                <Label htmlFor="tagColor">Color</Label>
                <Input
                  id="tagColor"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-10"
                />
              </div>
              
              <Button
                type="button"
                onClick={addTag}
                disabled={!newTagName.trim()}
                className="mb-0.5"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/problems')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Problem'}
          </Button>
        </div>
      </form>
    </div>
  )
} 