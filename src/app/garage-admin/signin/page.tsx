'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, signOut } from 'next-auth/react'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function GarageSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      const sessionResponse = await fetch('/api/auth/session')
      const session = await sessionResponse.json()

      if (session?.user?.role !== 'GARAGE_OWNER') {
        setError('This account is not a garage owner. Please use the customer portal.')
        await signOut({ redirect: false })
        return
      }

      // Check if garage is approved
      const garageResponse = await fetch('/api/garage-admin/status')
      const garageData = await garageResponse.json()

      if (garageData.error) {
        setError('Could not verify garage status. Please try again.')
        await signOut({ redirect: false })
        return
      }

      if (!garageData.emailVerified) {
        setError('Please verify your email before signing in. Check your inbox for the verification code.')
        await signOut({ redirect: false })
        return
      }

      if (garageData.approvalStatus === 'PENDING') {
        setError('Your garage registration is pending approval. You will receive an email when approved.')
        await signOut({ redirect: false })
        return
      }

      if (garageData.approvalStatus === 'INFO_REQUESTED') {
        setError('We requested additional information. Please check your email and respond to continue.')
        await signOut({ redirect: false })
        return
      }

      if (garageData.approvalStatus === 'REJECTED') {
        setError('Your garage registration was not approved. Please contact support for more information.')
        await signOut({ redirect: false })
        return
      }

      if (!garageData.isActive) {
        setError('Your garage account is currently inactive. Please contact support.')
        await signOut({ redirect: false })
        return
      }

      router.push('/garage-admin/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-foreground">
            Sign in to your garage account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link href="/garage-admin/signup" className="font-medium text-primary hover:text-primary/90">
              create a garage account
            </Link>
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Not a garage owner?{' '}
            <Link href="/signin" className="text-primary hover:text-primary/90">
              Go to customer sign in
            </Link>
          </p>
        </div>
        <div className="bg-card py-8 px-6 shadow-xl rounded-lg border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/90">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

