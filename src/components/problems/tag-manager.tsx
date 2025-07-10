"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Tag {
  id: string
  name: string
  color: string | null
  userId: string
  createdAt: Date
}

interface TagManagerProps {
  problemId: string
  initialTags: Tag[]
}

export default function TagManager({ problemId, initialTags }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#888888')
  const [loading, setLoading] = useState(false)

  // Fetch all available tags for the user
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/user/tags')
        if (response.ok) {
          const fetchedTags = await response.json()
          // Filter out tags that are already assigned to this problem
          const availableTags = fetchedTags.filter(
            (tag: Tag) => !tags.some(t => t.id === tag.id)
          )
          setAllTags(availableTags)
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }

    fetchTags()
  }, [tags])

  // Add a new tag
  const handleAddNewTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      // First create the tag if it doesn't exist
      const createResponse = await fetch('/api/user/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create tag')
      }

      const newTag = await createResponse.json()

      // Then associate it with the problem
      const assignResponse = await fetch(`/api/problems/${problemId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagId: newTag.id,
        }),
      })

      if (!assignResponse.ok) {
        throw new Error('Failed to assign tag to problem')
      }

      // Update the UI
      setTags([...tags, newTag])
      setNewTagName('')
      setNewTagColor('#888888')
      setIsAddingTag(false)
      
      toast.success(`Added tag "${newTag.name}" to this problem`)
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error("Failed to add tag. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Add an existing tag to the problem
  const handleAddExistingTag = async (tag: Tag) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/problems/${problemId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagId: tag.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign tag to problem')
      }

      // Update the UI
      setTags([...tags, tag])
      // Remove from available tags
      setAllTags(allTags.filter(t => t.id !== tag.id))
      
      toast.success(`Added tag "${tag.name}" to this problem`)
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error("Failed to add tag. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Remove a tag from the problem
  const handleRemoveTag = async (tagId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/problems/${problemId}/tags/${tagId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove tag from problem')
      }

      // Update the UI
      const removedTag = tags.find(t => t.id === tagId)
      setTags(tags.filter(t => t.id !== tagId))
      
      // Add back to available tags if it exists
      if (removedTag) {
        setAllTags([...allTags, removedTag])
      }
      
      toast.success("Tag removed from problem")
    } catch (error) {
      console.error('Error removing tag:', error)
      toast.error("Failed to remove tag. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            className="flex items-center gap-1 px-3 py-1"
            style={{ backgroundColor: tag.color || '#888888', color: '#fff' }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:bg-black/20 rounded-full p-1"
              disabled={loading}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground">No tags added yet</p>
        )}
      </div>

      {isAddingTag ? (
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Tag name" 
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)} 
            className="flex-1"
            disabled={loading}
          />
          <Input 
            type="color" 
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)} 
            className="w-16 p-1 h-10"
            disabled={loading}
          />
          <Button 
            type="button"
            onClick={handleAddNewTag}
            variant="secondary"
            disabled={loading || !newTagName.trim()}
          >
            Add
          </Button>
          <Button 
            type="button"
            onClick={() => setIsAddingTag(false)}
            variant="outline"
            size="icon"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setIsAddingTag(true)}
          className="mb-4"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-1" /> Create New Tag
        </Button>
      )}

      {allTags.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">Available Tags</div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline"
                style={{ 
                  borderColor: tag.color || '#888888', 
                  color: tag.color || '#888888' 
                }}
                className="cursor-pointer hover:bg-secondary"
                onClick={() => handleAddExistingTag(tag)}
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 