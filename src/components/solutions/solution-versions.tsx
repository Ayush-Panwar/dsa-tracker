"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Code, History, GitBranch } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SolutionVersion {
  id: string
  code: string
  language: string
  versionNumber: number
  changelog: string
  submissionId: string
  createdAt: string
}

interface SolutionVersionsProps {
  submissionId: string
}

export function SolutionVersions({ submissionId }: SolutionVersionsProps) {
  const [versions, setVersions] = useState<SolutionVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/solutions/versions?submissionId=${submissionId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch solution versions")
      }
      
      const data = await response.json()
      setVersions(data.versions || [])
      
      // Select the latest version by default
      if (data.versions && data.versions.length > 0) {
        setSelectedVersion(data.versions[0].id)
      }
    } catch (error) {
      console.error("Error fetching solution versions:", error)
      toast({
        title: "Error",
        description: "Failed to load solution versions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [submissionId, toast])

  useEffect(() => {
    if (submissionId) {
      fetchVersions()
    }
  }, [submissionId, fetchVersions])

  const getSelectedVersion = () => {
    return versions.find(v => v.id === selectedVersion) || null
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return "Unknown date"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Solution History
        </CardTitle>
        <CardDescription>
          View and compare different versions of your solution
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : versions.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {versions.map((version) => (
                <Button
                  key={version.id}
                  variant={selectedVersion === version.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVersion(version.id)}
                  className="flex items-center gap-2"
                >
                  <GitBranch className="h-4 w-4" />
                  v{version.versionNumber}
                </Button>
              ))}
            </div>
            
            {getSelectedVersion() && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getSelectedVersion()?.language}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(getSelectedVersion()?.createdAt || "")}</span>
                  </div>
                </div>
                
                {getSelectedVersion()?.changelog && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium mb-1">Changelog:</p>
                    <p className="text-muted-foreground">{getSelectedVersion()?.changelog}</p>
                  </div>
                )}
                
                <div className="relative">
                  <pre className="p-4 rounded-md bg-muted overflow-x-auto text-sm">
                    <code>{getSelectedVersion()?.code}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No solution versions found for this submission.
          </div>
        )}
      </CardContent>
      {versions.length > 1 && (
        <CardFooter className="flex justify-end">
          <Button variant="outline" size="sm">
            Compare Versions
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 
 
 
 