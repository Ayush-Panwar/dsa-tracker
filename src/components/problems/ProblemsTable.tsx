"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

type Problem = {
  id: string
  title: string
  platform: string
  difficulty: string
  status: string
  tags: Tag[]
  url?: string
  updatedAt: string
}

type Tag = {
  id: string
  name: string
  color: string
}

type SortField = 'title' | 'platform' | 'difficulty' | 'status' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

interface ProblemsTableProps {
  initialProblems: Problem[]
}

const ProblemsTable: React.FC<ProblemsTableProps> = ({ initialProblems }) => {
  const router = useRouter()
  const [problems, setProblems] = useState<Problem[]>(initialProblems)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Get unique values for filters
  const platforms = Array.from(new Set(initialProblems.map(p => p.platform)))
  const difficulties = ['Easy', 'Medium', 'Hard']
  const statuses = ['Todo', 'Attempted', 'Solved']
  const tags = Array.from(
    new Set(
      initialProblems
        .flatMap(p => p.tags)
        .map(tag => tag.name)
    )
  )

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...initialProblems]

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.platform.toLowerCase().includes(term) ||
        p.tags.some(tag => tag.name.toLowerCase().includes(term))
      )
    }

    // Apply filters
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }
    if (difficultyFilter) {
      filtered = filtered.filter(p => p.difficulty === difficultyFilter)
    }
    if (platformFilter) {
      filtered = filtered.filter(p => p.platform === platformFilter)
    }
    if (tagFilter) {
      filtered = filtered.filter(p => 
        p.tags.some(tag => tag.name === tagFilter)
      )
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: string | number = a[sortField] as string;
      let bValue: string | number = b[sortField] as string;

      // Handle special cases
      if (sortField === 'difficulty') {
        const difficultyOrder = { 'Easy': 0, 'Medium': 1, 'Hard': 2 }
        aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0
        bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0
      }

      if (sortField === 'status') {
        const statusOrder = { 'Todo': 0, 'Attempted': 1, 'Solved': 2 }
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 0
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setProblems(filtered)
  }, [
    initialProblems,
    searchTerm,
    statusFilter,
    difficultyFilter,
    platformFilter, 
    tagFilter,
    sortField,
    sortDirection
  ])

  // Difficulty badge styling
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return <Badge className="bg-green-500">Easy</Badge>
      case 'Medium':
        return <Badge className="bg-yellow-500">Medium</Badge>
      case 'Hard':
        return <Badge className="bg-red-500">Hard</Badge>
      default:
        return <Badge>{difficulty}</Badge>
    }
  }
  
  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Todo':
        return <Badge variant="outline">Todo</Badge>
      case 'Attempted':
        return <Badge className="bg-orange-500">Attempted</Badge>
      case 'Solved':
        return <Badge className="bg-green-600">Solved</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Difficulties</SelectItem>
              {difficulties.map(difficulty => (
                <SelectItem key={difficulty} value={difficulty}>
                  {difficulty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Platforms</SelectItem>
              {platforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tags</SelectItem>
              {tags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => {
            setSearchTerm('')
            setStatusFilter('')
            setDifficultyFilter('')
            setPlatformFilter('')
            setTagFilter('')
          }}>
            <Filter className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Problem {renderSortIcon('title')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('platform')}
              >
                <div className="flex items-center">
                  Platform {renderSortIcon('platform')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('difficulty')}
              >
                <div className="flex items-center">
                  Difficulty {renderSortIcon('difficulty')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No problems found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              problems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>
                    <div className="font-medium">
                      {problem.title}
                    </div>
                  </TableCell>
                  <TableCell>{problem.platform}</TableCell>
                  <TableCell>{getDifficultyBadge(problem.difficulty)}</TableCell>
                  <TableCell>{getStatusBadge(problem.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          className="whitespace-nowrap"
                          style={{ backgroundColor: tag.color || '#888888' }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {problem.tags.length > 3 && (
                        <Badge variant="outline">
                          +{problem.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/problems/${problem.id}`)}
                      >
                        View
                      </Button>
                      {problem.url && (
                        <Link href={problem.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProblemsTable 