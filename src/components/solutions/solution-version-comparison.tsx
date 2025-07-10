"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { diffLines, Change } from 'diff';

interface SolutionVersion {
  id: string;
  code: string;
  language: string;
  createdAt: string;
  versionNumber: number;
  problemId: string;
  userId: string;
}

interface SolutionVersionComparisonProps {
  problemId: string;
  versions?: SolutionVersion[];
}

export function SolutionVersionComparison({ problemId, versions = [] }: SolutionVersionComparisonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [allVersions, setAllVersions] = useState<SolutionVersion[]>(versions);
  const [leftVersionId, setLeftVersionId] = useState<string>("");
  const [rightVersionId, setRightVersionId] = useState<string>("");
  const [diffResult, setDiffResult] = useState<Change[]>([]);

  const computeDiff = useCallback((leftCode: string, rightCode: string) => {
    const differences = diffLines(leftCode, rightCode);
    setDiffResult(differences);
  }, []);

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/solutions/versions?problemId=${problemId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch solution versions");
      }
      
      const data = await response.json();
      setAllVersions(data.versions);
      
      // Set default selections
      if (data.versions.length >= 2) {
        setLeftVersionId(data.versions[data.versions.length - 2].id);
        setRightVersionId(data.versions[data.versions.length - 1].id);
        computeDiff(
          data.versions[data.versions.length - 2].code, 
          data.versions[data.versions.length - 1].code
        );
      }
    } catch (error) {
      console.error("Error fetching solution versions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [problemId, computeDiff]);

  // Fetch versions if not provided
  useEffect(() => {
    if (versions.length === 0) {
      fetchVersions();
    } else {
      // Set default selections if versions are provided
      if (versions.length >= 2) {
        setLeftVersionId(versions[versions.length - 2].id);
        setRightVersionId(versions[versions.length - 1].id);
        computeDiff(versions[versions.length - 2].code, versions[versions.length - 1].code);
      }
    }
  }, [versions, fetchVersions, computeDiff]);

  // Compute diff when selections change
  useEffect(() => {
    if (leftVersionId && rightVersionId) {
      const leftVersion = allVersions.find(v => v.id === leftVersionId);
      const rightVersion = allVersions.find(v => v.id === rightVersionId);
      
      if (leftVersion && rightVersion) {
        computeDiff(leftVersion.code, rightVersion.code);
      }
    }
  }, [leftVersionId, rightVersionId, allVersions, computeDiff]);

  function swapVersions() {
    const temp = leftVersionId;
    setLeftVersionId(rightVersionId);
    setRightVersionId(temp);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (allVersions.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <p className="text-muted-foreground">
            {allVersions.length === 0 
              ? "No solution versions available for comparison." 
              : "At least two versions are needed for comparison."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const leftVersion = allVersions.find(v => v.id === leftVersionId);
  const rightVersion = allVersions.find(v => v.id === rightVersionId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Solution Version Comparison</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full md:w-2/5">
              <label className="text-sm font-medium mb-1 block">Version 1 (Before)</label>
              <Select value={leftVersionId} onValueChange={setLeftVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {allVersions.map((version) => (
                    <SelectItem key={`left-${version.id}`} value={version.id}>
                      Version {version.versionNumber} ({formatDate(version.createdAt)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={swapVersions}
              className="hidden md:flex"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </Button>

            <div className="w-full md:w-2/5">
              <label className="text-sm font-medium mb-1 block">Version 2 (After)</label>
              <Select value={rightVersionId} onValueChange={setRightVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {allVersions.map((version) => (
                    <SelectItem key={`right-${version.id}`} value={version.id}>
                      Version {version.versionNumber} ({formatDate(version.createdAt)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {leftVersion && rightVersion ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm">Version {leftVersion.versionNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-muted p-4 rounded-b-md max-h-96 overflow-auto">
                      <SyntaxHighlighter 
                        code={leftVersion.code} 
                        language={leftVersion.language} 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm">Version {rightVersion.versionNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-muted p-4 rounded-b-md max-h-96 overflow-auto">
                      <SyntaxHighlighter 
                        code={rightVersion.code} 
                        language={rightVersion.language} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm">Differences</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-muted p-4 rounded-b-md max-h-96 overflow-auto">
                    <div className="font-mono text-sm whitespace-pre-wrap">
                      {diffResult.map((part, index) => (
                        <div 
                          key={index} 
                          className={`${
                            part.added 
                              ? "bg-green-100 dark:bg-green-900/30" 
                              : part.removed 
                                ? "bg-red-100 dark:bg-red-900/30" 
                                : ""
                          }`}
                        >
                          <span className="select-none mr-2">
                            {part.added ? '+' : part.removed ? '-' : ' '}
                          </span>
                          {part.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Select two versions to compare
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
 
 
 