"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Check, Copy, Loader2, PlusCircle, RefreshCw, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme-provider'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface UserPreferences {
  theme: string
  codeEditorTheme: string
  notifications: boolean
  dailyGoal: number
}

interface ExtensionToken {
  id: string
  name: string
  lastUsed: string | Date | null
  createdAt: string | Date
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { setTheme } = useTheme()
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    codeEditorTheme: 'default',
    notifications: true,
    dailyGoal: 1
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  
  // Extension token states
  const [tokens, setTokens] = useState<ExtensionToken[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [newToken, setNewToken] = useState<{token: string, id: string} | null>(null)
  const [tokenName, setTokenName] = useState('')
  const [creatingToken, setCreatingToken] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  
  // Fetch user preferences and profile data
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        
        // Set profile data
        setEmail(user.email || '')
        setUserName(user.user_metadata?.name || '')
        
        // Fetch preferences
        const res = await fetch('/api/user/preferences')
        
        if (!res.ok) {
          throw new Error('Failed to fetch preferences')
        }
        
        const data = await res.json()
        setPreferences(data)
        
        // Sync theme with the stored preference
        if (data.theme) {
          setTheme(data.theme as 'light' | 'dark' | 'system')
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load user settings')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [router, supabase, setTheme])
  
  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true)
      
      // Update theme in theme provider
      setTheme(preferences.theme as 'light' | 'dark' | 'system')
      
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })
      
      if (!res.ok) {
        throw new Error('Failed to save preferences')
      }
      
      toast.success("Settings saved", {
        description: "Your preferences have been updated successfully."
      });
    } catch (err) {
      console.error('Error saving preferences:', err)
      toast.error("Error saving settings", {
        description: "There was a problem saving your preferences. Please try again."
      });
    } finally {
      setSaving(false)
    }
  }
  
  // Update profile
  const updateProfile = async () => {
    try {
      setSaving(true)
      
      // Update Supabase profile
      const { error } = await supabase.auth.updateUser({
        data: { name: userName }
      })
      
      if (error) throw error
      
      toast.success("Profile updated", {
        description: "Your profile information has been updated successfully."
      });
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error("Error updating profile", {
        description: "There was a problem updating your profile. Please try again."
      });
    } finally {
      setSaving(false)
    }
  }
  
  // Fetch extension tokens
  const fetchTokens = async () => {
    try {
      setLoadingTokens(true)
      const res = await fetch('/api/extension/auth')
      
      if (!res.ok) {
        throw new Error('Failed to fetch tokens')
      }
      
      const data = await res.json()
      setTokens(data)
    } catch (err) {
      console.error('Error fetching tokens:', err)
    } finally {
      setLoadingTokens(false)
    }
  }
  
  // Generate new token
  const generateToken = async () => {
    try {
      setCreatingToken(true)
      
      const res = await fetch('/api/extension/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: tokenName || `Device ${new Date().toLocaleDateString()}` })
      })
      
      if (!res.ok) {
        throw new Error('Failed to generate token')
      }
      
      const data = await res.json()
      setNewToken(data)
      setTokenName('')
      fetchTokens() // Refresh token list
      
    } catch (err) {
      console.error('Error generating token:', err)
      toast.error("Failed to generate token", {
        description: "There was a problem creating your extension token."
      })
    } finally {
      setCreatingToken(false)
    }
  }
  
  // Copy token to clipboard
  const copyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken.token)
      toast.success("Token copied", {
        description: "The token has been copied to your clipboard."
      })
    }
  }
  
  // Revoke token
  const revokeToken = async (id: string) => {
    try {
      setRevokingId(id)
      
      const res = await fetch(`/api/extension/auth/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        throw new Error('Failed to revoke token')
      }
      
      fetchTokens() // Refresh token list
      toast.success("Token revoked", {
        description: "The extension token has been successfully revoked."
      })
      
    } catch (err) {
      console.error('Error revoking token:', err)
      toast.error("Failed to revoke token", {
        description: "There was a problem revoking your extension token."
      })
    } finally {
      setRevokingId(null)
    }
  }
  
  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    return date.toLocaleString()
  }
  
  // Fetch tokens when switching to extension tab
  useEffect(() => {
    // Get the active tab from URL hash if available
    const hash = window.location.hash
    if (hash === '#extension') {
      fetchTokens()
    }
  }, [])
  
  // Render dialog inside the component
  const renderTokenDialog = () => {
    return (
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Extension Token</DialogTitle>
            <DialogDescription>
              Create a new token to connect the browser extension to your account
            </DialogDescription>
          </DialogHeader>
          
          {newToken ? (
            <div className="space-y-4 py-2">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="token">Your Token (copy this now, it won&apos;t be shown again)</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="token"
                    value={newToken.token}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button size="icon" onClick={copyToken} type="button">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this token in the browser extension to connect it to your account
                </p>
              </div>
              
              <DialogFooter className="sm:justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setNewToken(null)
                    setTokenDialogOpen(false)
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="tokenName">Device Name (optional)</Label>
                <Input 
                  id="tokenName"
                  placeholder="e.g., Chrome on Windows"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This helps you identify which device the extension is connected to
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => setTokenDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={generateToken}
                  disabled={creatingToken}
                >
                  {creatingToken ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Token</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Settings</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* Render token dialog */}
      {renderTokenDialog()}
      
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="extension">Extension</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled placeholder="Your email address" />
                <p className="text-xs text-muted-foreground">
                  Your email cannot be changed. Contact support if you need to update it.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="Your name" 
                />
              </div>
              
              <Button onClick={updateProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  value={preferences.theme} 
                  onValueChange={(value) => setPreferences({...preferences, theme: value})}
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code-theme">Code Editor Theme</Label>
                <Select 
                  value={preferences.codeEditorTheme} 
                  onValueChange={(value) => setPreferences({...preferences, codeEditorTheme: value})}
                >
                  <SelectTrigger id="code-theme">
                    <SelectValue placeholder="Select code theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="monokai">Monokai</SelectItem>
                    <SelectItem value="dracula">Dracula</SelectItem>
                    <SelectItem value="solarized">Solarized</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the theme for code editors when viewing or submitting code.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="daily-goal">Daily Goal</Label>
                <Input 
                  id="daily-goal" 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={preferences.dailyGoal} 
                  onChange={(e) => setPreferences({
                    ...preferences, 
                    dailyGoal: parseInt(e.target.value) || 1
                  })} 
                />
                <p className="text-xs text-muted-foreground">
                  Number of problems you aim to solve daily (1-10).
                </p>
              </div>
              
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notifications" className="flex flex-col space-y-1">
                  <span>Enable Notifications</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive notifications for streak reminders, achievements, etc.
                  </span>
                </Label>
                <Switch 
                  id="notifications" 
                  checked={preferences.notifications} 
                  onCheckedChange={(checked: boolean) => 
                    setPreferences({...preferences, notifications: checked})
                  } 
                />
              </div>
              
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="extension">
          <Card>
            <CardHeader>
              <CardTitle>Extension Settings</CardTitle>
              <CardDescription>
                Manage browser extension connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Extension Tokens</h3>
                <div className="rounded-md border">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Extension tokens are used to securely connect the browser extension with your account.
                      Each device or browser needs its own token.
                    </p>
                  </div>
                  <div className="border-t">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Generate New Token</h4>
                        <p className="text-sm text-muted-foreground">Create a new token for use with the browser extension</p>
                      </div>
                      <Button 
                        onClick={() => setTokenDialogOpen(true)}
                        disabled={creatingToken}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Generate Token
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h4 className="font-medium">Active Tokens</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchTokens}
                      disabled={loadingTokens}
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingTokens ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {loadingTokens ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : tokens.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-muted-foreground">No active tokens found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Generate a token to connect the browser extension
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {tokens.map(token => (
                        <div key={token.id} className="p-4 flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{token.name}</h5>
                            <p className="text-xs text-muted-foreground">
                              Created: {formatDate(token.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last used: {formatDate(token.lastUsed)}
                            </p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => revokeToken(token.id)}
                            disabled={revokingId === token.id}
                          >
                            {revokingId === token.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ShieldAlert className="mr-1 h-4 w-4" />
                                Revoke
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
 
 
 