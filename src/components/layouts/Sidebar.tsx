import Link from 'next/link';
import React from 'react';
import { BarChart } from 'lucide-react';

// This is a component that defines navigation items for the sidebar
// Export the navigation item for use in the main sidebar component
export const analysisMenuItem = {
  key: 'analysis',
  icon: <BarChart className="h-4 w-4" />,
  label: <Link href="/dashboard/analysis">Analysis</Link>,
};

// Example usage of the sidebar component
export default function Sidebar() {
  return null; // Placeholder implementation
} 
 
 
 