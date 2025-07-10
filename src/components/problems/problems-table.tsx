"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Search, X, ExternalLink } from 'lucide-react'

// Types for our data
interface Tag {
  id: string
  name: string
  color: string
  userId: string
}

interface Problem {
  id: string
  title: string
  platform: string
  difficulty: string
  status: string
  url?: string
  tags: Tag[]
  updatedAt: string
  latestSubmission?: string | null
}

// Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

export default function ProblemsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State for the problems data
  const [problems, setProblems] = useState<Problem[]>([])
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  
  // Add state for submission date filter
  const [submissionDateFilter, setSubmissionDateFilter] = useState<string>('all')

  // Add submission date filter options
  const submissionDateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'none', label: 'No Submissions' }
  ]

  // Helper function to check if a date is within a specific range
  const isDateInRange = (dateStr: string | null | undefined, range: string): boolean => {
    if (!dateStr) return range === 'none'
    
    const date = new Date(dateStr)
    const now = new Date()
    
    if (range === 'today') {
      return date.toDateString() === now.toDateString()
    }
    
    if (range === 'yesterday') {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return date.toDateString() === yesterday.toDateString()
    }
    
    if (range === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date >= weekAgo
    }
    
    if (range === 'month') {
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return date >= monthAgo
    }
    
    if (range === 'none') {
      return false
    }
    
    return true // 'all'
  }
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  
  // Load initial filters from URL
  useEffect(() => {
    const query = searchParams.get('q') || ''
    const difficulty = searchParams.get('difficulty') || 'all'
    const status = searchParams.get('status') || 'all'
    const platform = searchParams.get('platform') || 'all'
    const submissionDate = searchParams.get('submissionDate') || 'all'
    const tags = searchParams.get('tags')?.split(',') || []
    const page = parseInt(searchParams.get('page') || '1')
    
    setSearchQuery(query)
    setDifficultyFilter(difficulty)
    setStatusFilter(status)
    setPlatformFilter(platform)
    setSubmissionDateFilter(submissionDate)
    setSelectedTags(tags)
    setCurrentPage(page)
  }, [searchParams])
  
  // Fetch problems
  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true)
        const res = await fetch('/api/problems')
        
        if (!res.ok) {
          throw new Error('Failed to fetch problems')
        }
        
        const data = await res.json()
        setProblems(data)
      } catch (err) {
        console.error('Error fetching problems:', err)
        setError(err instanceof Error ? err.message : 'Failed to load problems')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProblems()
  }, [])
  
  // Apply filters when problems or filter values change
  useEffect(() => {
    let results = [...problems]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(problem => 
        problem.title.toLowerCase().includes(query) ||
        problem.platform.toLowerCase().includes(query) ||
        // Also search in tags
        problem.tags.some(tag => tag.name.toLowerCase().includes(query))
      )
    }
    
    // Apply difficulty filter
    if (difficultyFilter && difficultyFilter !== 'all') {
      results = results.filter(problem => problem.difficulty === difficultyFilter)
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      results = results.filter(problem => problem.status === statusFilter)
    }
    
    // Apply platform filter
    if (platformFilter && platformFilter !== 'all') {
      results = results.filter(problem => problem.platform === platformFilter)
    }
    
    // Apply submission date filter
    if (submissionDateFilter && submissionDateFilter !== 'all') {
      results = results.filter(problem => 
        isDateInRange(problem.latestSubmission, submissionDateFilter)
      )
    }
    
    // Apply tag filters
    if (selectedTags.length > 0) {
      results = results.filter(problem => 
        selectedTags.every(tagId => 
          problem.tags.some(tag => tag.id === tagId)
        )
      )
    }
    
    // Sort by latest submission date by default
    results.sort((a, b) => {
      // Handle null values for latestSubmission
      if (!a.latestSubmission && !b.latestSubmission) return 0
      if (!a.latestSubmission) return 1 // null values at the end
      if (!b.latestSubmission) return -1
      
      const dateA = new Date(a.latestSubmission).getTime()
      const dateB = new Date(b.latestSubmission).getTime()
      return dateB - dateA // descending order (newest first)
    })
    
    setFilteredProblems(results)
    setTotalPages(Math.ceil(results.length / itemsPerPage))
    
    // Reset to first page if filters change and we're not on the first page
    if (currentPage !== 1 && results.length <= (currentPage - 1) * itemsPerPage) {
      setCurrentPage(1)
    }
  }, [problems, searchQuery, difficultyFilter, statusFilter, platformFilter, selectedTags, submissionDateFilter, currentPage])
  
  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('q', searchQuery)
    if (difficultyFilter) params.set('difficulty', difficultyFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (platformFilter) params.set('platform', platformFilter)
    if (submissionDateFilter !== 'all') params.set('submissionDate', submissionDateFilter)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    if (currentPage > 1) params.set('page', currentPage.toString())
    
    const newUrl = `/problems${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newUrl, { scroll: false })
  }, [searchQuery, difficultyFilter, statusFilter, platformFilter, submissionDateFilter, selectedTags, currentPage, router])
  
  // Get all unique platforms, tags, etc. for filter options
  const platforms = [...new Set(problems.map(p => p.platform))]
  const difficulties = ['Easy', 'Medium', 'Hard']
  const statuses = ['Todo', 'Attempted', 'Solved']
  const tags = problems.reduce<Tag[]>((acc, problem) => {
    problem.tags.forEach(tag => {
      if (!acc.some(t => t.id === tag.id)) {
        acc.push(tag)
      }
    })
    return acc
  }, [])
  
  // Get paginated subset of problems
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setDifficultyFilter('all')
    setStatusFilter('all')
    setPlatformFilter('all')
    setSubmissionDateFilter('all')
    setSelectedTags([])
    setCurrentPage(1)
  }
  
  // Handle removing a tag from selected tags
  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId))
  }
  
  // Add a utility function to check if a date is recent (within the last 24 hours)
  const isRecent = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < 24;
  };

  // Add a utility function to format the date in a nice way
  const formatSubmissionDate = (dateStr: string): { date: string, time: string } => {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if the date is today or yesterday
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    return {
      date: isToday ? 'Today' : 
            isYesterday ? 'Yesterday' : 
            date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
      time: date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // Render error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Render empty state
  if (problems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold mb-2">No problems found</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your DSA practice by adding your first problem.
            </p>
            <Button asChild>
              <Link href="/problems/new">Add Your First Problem</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Render "no results" when filters return empty
  if (filteredProblems.length === 0) {
    return (
      <>
        {/* Filters UI */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by title, platform, or tag..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Tag filter dropdown */}
            <div className="relative w-[150px]">
              <Select 
                onValueChange={(tagId) => {
                  if (tagId !== "all") {
                    setSelectedTags(prev => 
                      prev.includes(tagId) ? prev : [...prev, tagId]
                    )
                    setTagSearchQuery('')
                  }
                }}
                value="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      id="tag-search"
                      placeholder="Search tags..."
                      className="mb-2"
                      value={tagSearchQuery}
                      onChange={(e) => {
                        setTagSearchQuery(e.target.value)
                      }}
                    />
                  </div>
                  <SelectItem value="all">Select Tag</SelectItem>
                  {tags
                    .filter(tag => !selectedTags.includes(tag.id))
                    .filter(tag => tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                    .map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={resetFilters} 
              title="Reset filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tagId => {
                const tag = tags.find(t => t.id === tagId)
                if (!tag) return null
                return (
                  <Badge 
                    key={tag.id} 
                    className="text-xs font-medium px-2.5 py-0.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ 
                      backgroundColor: `${tag.color}15`, 
                      color: tag.color,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `${tag.color}30`,
                    }}
                    onClick={() => removeTag(tag.id)}
                  >
                    {tag.name}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h3 className="text-lg font-semibold mb-2">No problems match your filters</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or clear filters.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }
  
  // Main table view
  return (
    <>
      {/* Filters UI */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title, platform, or tag..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              {difficulties.map((difficulty) => (
                <SelectItem key={difficulty} value={difficulty}>
                  {difficulty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={submissionDateFilter} onValueChange={setSubmissionDateFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Submission Date" />
            </SelectTrigger>
            <SelectContent>
              {submissionDateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Tag filter dropdown */}
          <div className="relative w-[150px]">
            <Select 
              onValueChange={(tagId) => {
                if (tagId !== "all") {
                  setSelectedTags(prev => 
                    prev.includes(tagId) ? prev : [...prev, tagId]
                  )
                  setTagSearchQuery('')
                }
              }}
              value="all"
            >
              <SelectTrigger>
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    id="tag-search-main"
                    placeholder="Search tags..."
                    className="mb-2"
                    value={tagSearchQuery}
                    onChange={(e) => {
                      setTagSearchQuery(e.target.value)
                    }}
                  />
                </div>
                <SelectItem value="all">Select Tag</SelectItem>
                {tags
                  .filter(tag => !selectedTags.includes(tag.id))
                  .filter(tag => tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                  .map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={resetFilters} 
            title="Reset filters"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tagId => {
              const tag = tags.find(t => t.id === tagId)
              if (!tag) return null
              return (
                <Badge 
                  key={tag.id} 
                  className="text-xs font-medium px-2.5 py-0.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ 
                    backgroundColor: `${tag.color}15`, 
                    color: tag.color,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${tag.color}30`,
                  }}
                  onClick={() => removeTag(tag.id)}
                >
                  {tag.name}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Problems table */}
      <div className="rounded-md border border-gray-200 shadow-sm overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[30%] font-semibold text-gray-700">Problem</TableHead>
              <TableHead className="w-[12%] font-semibold text-gray-700">Platform</TableHead>
              <TableHead className="w-[12%] font-semibold text-gray-700">Difficulty</TableHead>
              <TableHead className="w-[12%] font-semibold text-gray-700">Status</TableHead>
              <TableHead 
                className="w-[18%] font-semibold text-gray-700"
              >
                <div className="flex items-center">
                  <span>Last Submission</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="ml-1 h-3.5 w-3.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="max-w-xs">Date and time of your most recent submission. Green indicator shows submissions within the last 24 hours.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="w-[16%] text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProblems.map((problem) => (
              <TableRow 
                key={problem.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-muted transition-colors"
                onClick={() => router.push(`/problems/${problem.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{problem.title}</span>
                    {problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {problem.tags.slice(0, 3).map(tag => {
                          const isSelected = selectedTags.includes(tag.id);
                          return (
                            <Badge 
                              key={tag.id} 
                              variant={isSelected ? "default" : "outline"}
                              className="text-xs py-0 h-5 rounded-md"
                              style={{ 
                                borderColor: isSelected ? 'transparent' : `${tag.color}50`,
                                color: isSelected ? 'white' : tag.color,
                                backgroundColor: isSelected ? tag.color : 'rgba(255, 255, 255, 0.8)',
                                boxShadow: isSelected ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelected) {
                                  setSelectedTags(prev => [...prev, tag.id]);
                                }
                              }}
                            >
                              {tag.name}
                            </Badge>
                          );
                        })}
                        {problem.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs py-0 h-5">
                            +{problem.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {problem.platform}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  {problem.latestSubmission ? (
                    <div className="flex items-center">
                      {isRecent(problem.latestSubmission) && (
                        <div className="mr-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Recent submission"></div>
                      )}
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          formatSubmissionDate(problem.latestSubmission).date === 'Today' ? 'text-green-600' : 
                          formatSubmissionDate(problem.latestSubmission).date === 'Yesterday' ? 'text-blue-600' : 
                          'text-gray-700'
                        }`}>
                          {formatSubmissionDate(problem.latestSubmission).date}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatSubmissionDate(problem.latestSubmission).time}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No submissions</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {problem.url && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-gray-200 hover:bg-gray-50 hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(problem.url, '_blank', 'noopener,noreferrer')
                        }}
                        title="Open problem"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-primary hover:bg-primary/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/problems/${problem.id}`)
                      }}
                    >
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProblems.length)} of {filteredProblems.length} problems
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
} 