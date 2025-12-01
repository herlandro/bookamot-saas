'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MainLayout } from '@/components/layout/main-layout'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  createdAt: string
}

export default function EditProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const data = await response.json()
      setUserProfile(data)
      setName(data.name || '')
      setPhone(data.phone || '')
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
      router.push('/signin')
      return
    }

    fetchUserProfile(session.user.id)
  }, [session?.user?.id, status, router])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Update session with new name
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          phone,
        },
      })

      alert('Profile updated successfully!')
      router.push('/profile')
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Error updating profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
          <Card className="border border-border">
            <CardHeader>
              <div className="h-8 w-1/3 mb-2 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded"></div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
          <Card className="border border-border">
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
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

        <Card className="w-full shadow-xl rounded-lg border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <Input
                  value={session?.user?.role === 'CUSTOMER' ? 'Customer' :
                         session?.user?.role === 'GARAGE_OWNER' ? 'Garage Owner' :
                         session?.user?.role || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Account type cannot be changed</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
}