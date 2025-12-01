'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui'
import { AdminLayout } from '@/components/layout/admin-layout'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  createdAt: string
}

export default function AdminProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const data = await response.json()
      setUserProfile(data)
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError('Failed to load user profile. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.push('/admin/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchUserProfile(session.user.id)
  }, [session?.user?.id, session?.user?.role, status, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="shadow-xl rounded-lg border border-border">
              <CardHeader>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="shadow-xl rounded-lg border border-border">
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => session?.user?.id && fetchUserProfile(session.user.id)}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your admin account settings</p>
          </div>

          <Card className="shadow-xl rounded-lg border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your personal data and account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                  <p className="text-lg font-medium">{userProfile?.name || session?.user?.name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">{session?.user?.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">{userProfile?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Account Type</p>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    <span className="px-2 py-1 text-sm font-medium bg-red-600 text-white rounded">
                      Administrator
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Member since</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">{userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                variant="destructive"
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

