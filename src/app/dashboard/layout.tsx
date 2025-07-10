'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { createBrowserClient } from '@utils/supabase/client'
import { 
  LayoutDashboard, 
  ListChecks, 
  Settings, 
  Code2, 
  Menu, 
  X,
  LogOut,
  User as UserIcon
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  
  useEffect(() => {
    const supabase = createBrowserClient()
    
    // Get user data
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get display name from metadata or email
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        setUserName(displayName)
      }
    }
    
    getUser()
  }, [])
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Problems', href: '/problems', icon: ListChecks },
    { name: 'Extension', href: '/dashboard/extension', icon: Code2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]
  
  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Sidebar for desktop */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
          } w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center">
              {isSidebarOpen ? (
                <span className="text-xl font-semibold dark:text-white">DSA Tracker</span>
              ) : (
                <span className="hidden md:block text-xl font-semibold dark:text-white">DSA</span>
              )}
            </Link>
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white md:block hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <item.icon 
                      className={`${
                        isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      } mr-4 h-6 w-6 flex-shrink-0`} 
                      aria-hidden="true" 
                    />
                    {isSidebarOpen && <span className="md:block">{item.name}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="p-4 border-t dark:border-gray-700">
            <div 
              className="flex items-center cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white rounded-md px-2 py-2"
              onClick={handleSignOut}
            >
              <LogOut className="mr-4 h-6 w-6 text-gray-500 dark:text-gray-400" />
              {isSidebarOpen && <span className="md:block">Sign Out</span>}
            </div>
          </div>
        </aside>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-gray-900 bg-opacity-75" onClick={toggleMobileMenu}>
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-gray-800 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
                <Link href="/dashboard" className="text-xl font-semibold dark:text-white">
                  DSA Tracker
                </Link>
                <button 
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
                <nav className="flex-1 px-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isActive
                            ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                      >
                        <item.icon 
                          className={`${
                            isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                          } mr-4 h-6 w-6 flex-shrink-0`} 
                          aria-hidden="true" 
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>
              <div className="p-4 border-t dark:border-gray-700">
                <div 
                  className="flex items-center cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white rounded-md px-2 py-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-4 h-6 w-6 text-gray-500 dark:text-gray-400" />
                  Sign Out
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className={`flex flex-col flex-1 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'} transition-all duration-300 ease-in-out`}>
          {/* Header */}
          <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-20">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <div className="flex items-center md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <Menu className="size-6" />
                </button>
              </div>
              
              <div className="flex-1 md:flex-initial"></div>
              
              <div className="flex items-center">
                <ThemeToggle />
                <div className="ml-4 flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full p-1">
                      <UserIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="hidden md:inline-block font-medium text-gray-900 dark:text-white">
                      {userName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Content */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
} 