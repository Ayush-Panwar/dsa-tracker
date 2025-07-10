"use client"

import React from 'react'

interface DescriptionViewerProps {
  description: string | number | boolean | Record<string, unknown>[] | Record<string, unknown> | undefined | null
}

export default function DescriptionViewer({ description }: DescriptionViewerProps) {
  // Convert to string if it's not already
  const descriptionStr = typeof description === 'string' 
    ? description 
    : JSON.stringify(description)

  // Check if the description is already HTML content
  const isHtml = descriptionStr.trim().startsWith('<') && descriptionStr.includes('</p>')

  if (!isHtml) {
    // If it's plain text, just return it with whitespace preserved
    return <div className="whitespace-pre-wrap">{descriptionStr}</div>
  }

  // If it's HTML, render it safely
  return (
    <div 
      className="leetcode-description prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: descriptionStr }}
    />
  )
} 