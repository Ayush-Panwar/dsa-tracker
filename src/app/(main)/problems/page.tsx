import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import ProblemsTable from '@/components/problems/problems-table'
import { Suspense } from 'react'

export const metadata = {
  title: "Problems | DSA Tracker",
  description: "Manage your DSA problems collection.",
}

export default function ProblemsPage() {
  return (
    <div className="container mx-auto py-4 px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Problems</h1>
        <Button asChild>
          <Link href="/problems/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Problem
          </Link>
        </Button>
      </div>
      
      <Suspense fallback={<div>Loading problems table...</div>}>
        <ProblemsTable />
      </Suspense>
    </div>
  )
} 