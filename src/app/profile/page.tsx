'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Calendar, Shield, Building } from 'lucide-react'
import { getUserById } from '@/lib/db/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui'
import { MainLayout } from '@/components/layout/main-layout'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  createdAt: string
  garage?: {
    id: string
    name: string
    address: string
    phone: string
    isActive: boolean
    dvlaApproved: boolean
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.push('/signin')
      return
    }

    fetchUserProfile()
  }, [session, status, router])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${session?.user?.id}`, {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Perfil do Usuário</h1>
        <Card className="border border-border">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
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
        <h1 className="text-3xl font-bold mb-8">Perfil do Usuário</h1>
        <Card className="border border-border">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchUserProfile}>Tentar Novamente</Button>
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
      <h1 className="text-3xl font-bold mb-8">Perfil do Usuário</h1>
      
      <Card className="mb-8 border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Seus dados pessoais e informações de conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Nome</p>
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
              <p className="text-sm font-medium text-muted-foreground mb-1">Telefone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">{userProfile?.phone || 'Não informado'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Tipo de Conta</p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">
                  {session?.user?.role === 'CUSTOMER' ? 'Cliente' : 
                   session?.user?.role === 'GARAGE_OWNER' ? 'Proprietário de Oficina' : 
                   session?.user?.role}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Membro desde</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">{userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={fetchUserProfile} variant="outline">
            Atualizar Dados
          </Button>
          <Button onClick={() => router.push('/profile/edit')}>
            Editar Perfil
          </Button>
        </CardFooter>
      </Card>
      
      {userProfile?.garage && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Oficina
            </CardTitle>
            <CardDescription>
              Detalhes da sua oficina registrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nome da Oficina</p>
                <p className="text-lg font-medium">{userProfile.garage.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Endereço</p>
                <p className="text-lg">{userProfile.garage.address}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Telefone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg">{userProfile.garage.phone || 'Não informado'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${userProfile.garage.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <p className="text-lg">{userProfile.garage.isActive ? 'Ativa' : 'Inativa'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Aprovação DVLA</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${userProfile.garage.dvlaApproved ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <p className="text-lg">{userProfile.garage.dvlaApproved ? 'Aprovada' : 'Pendente'}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/garage-admin/settings')} className="ml-auto">
              Gerenciar Oficina
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
    </MainLayout>
  )
}