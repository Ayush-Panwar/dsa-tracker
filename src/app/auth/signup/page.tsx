import AuthUI from '@/components/auth/auth-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">DSA Tracker</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthUI view="sign_up" />
        </CardContent>
      </Card>
    </div>
  )
} 
 
 
 