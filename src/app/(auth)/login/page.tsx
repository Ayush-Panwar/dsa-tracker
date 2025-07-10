import { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login | DSA Tracker",
  description: "Login to your DSA Tracker account",
}

export default function LoginPage() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold">Login</CardTitle>
        <CardDescription>Enter your email and password to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </div>
        <div className="text-center">
          <Button variant="link" asChild className="px-0">
            <Link href="/forgot-password">Forgot password?</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 