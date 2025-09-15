"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Car, FileText, BarChart } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  fuelType: string
  color: string
  engineSize: string
  motExpiryDate?: string
  userId: string
}

interface MotHistoryItem {
  testNumber: string
  testDate: string
  expiryDate: string
  testResult: string
  odometerValue: number
  odometerUnit: string
  motTestNumber: string
  rfrAndComments: Array<{
    type: string
    text: string
    dangerous: boolean
  }>
}
export default function VehicleDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  // Corrigindo o uso do hook use() com tipagem adequada
  const vehicleId = use(params as any).id
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [motHistory, setMotHistory] = useState<MotHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  
  // Form state
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: 0,
    fuelType: '',
    color: '',
    engineSize: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/signin')
      return
    }

    fetchVehicle(vehicleId)
  }, [session, status, router, vehicleId])

  const fetchVehicle = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle')
      }
      const data = await response.json()
      setVehicle(data)
      setFormData({
        make: data.make,
        model: data.model,
        year: data.year,
        fuelType: data.fuelType,
        color: data.color || '',
        engineSize: data.engineSize || ''
      })
    } catch (error) {
      setError('Failed to load vehicle details')
      console.error('Error fetching vehicle:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMotHistory = async () => {
    if (!vehicle) return
    
    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/mot-history`)
      if (!response.ok) {
        throw new Error('Failed to fetch MOT history')
      }
      const data = await response.json()
      setMotHistory(data.history || [])
    } catch (error) {
      console.error('Error fetching MOT history:', error)
      setError('Failed to load MOT history')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) || 0 : value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedVehicle = await response.json()
        setVehicle(updatedVehicle)
        setIsEditing(false)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update vehicle')
      }
    } catch (error) {
      console.error('Error updating vehicle:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'history' || value === 'chart') {
      fetchMotHistory()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando detalhes do veículo...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2" 
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-red-800 mb-2">Veículo Não Encontrado</h3>
          <p className="text-red-700 mb-4">{error || 'O veículo que você está procurando não existe ou você não tem permissão para visualizá-lo.'}</p>
          <Button onClick={() => router.push('/dashboard')}>Ver Todos os Veículos</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2" 
        onClick={() => router.push('/dashboard')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </Button>

      <Card className="shadow-lg border-t-4 border-t-green-500 mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{vehicle.registration}</CardTitle>
              <CardDescription>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Histórico MOT
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Gráfico MOT
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Marca</Label>
                    <Input
                      id="make"
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-slate-50' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-slate-50' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-slate-50' : ''}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Tipo de Combustível</Label>
                    <Input
                      id="fuelType"
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-slate-50' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-slate-50' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="engineSize">Cilindrada</Label>
                    <Input
                      id="engineSize"
                      name="engineSize"
                      value={formData.engineSize}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-slate-50' : ''}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-blue-800">Próximo MOT</h3>
                    <p className="text-blue-700">
                      {vehicle.motExpiryDate 
                        ? formatDate(new Date(vehicle.motExpiryDate))
                        : 'Não disponível'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push(`/search?vehicle=${vehicle.id}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Agendar MOT
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : motHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Nenhum histórico de MOT encontrado para este veículo.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {motHistory.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium text-lg">
                            MOT #{item.testNumber}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Data: {formatDate(new Date(item.testDate))}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${item.testResult === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.testResult === 'PASS' ? 'Aprovado' : 'Reprovado'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-slate-600">Validade:</p>
                          <p className="font-medium">{formatDate(new Date(item.expiryDate))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Odômetro:</p>
                          <p className="font-medium">{item.odometerValue} {item.odometerUnit}</p>
                        </div>
                      </div>
                      
                      {item.rfrAndComments && item.rfrAndComments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Observações e Problemas:</h4>
                          <ul className="space-y-2">
                            {item.rfrAndComments.map((comment, idx) => (
                              <li 
                                key={idx} 
                                className={`text-sm p-2 rounded-md ${comment.dangerous ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'}`}
                              >
                                <span className="font-medium">{comment.type}:</span> {comment.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : motHistory.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Nenhum histórico de MOT encontrado para visualização em gráfico.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium mb-6">Histórico de Quilometragem</h3>
                  <div className="h-64 relative">
                    {/* Aqui seria implementado um gráfico com biblioteca como Chart.js ou Recharts */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-slate-600">Gráfico de histórico de quilometragem seria exibido aqui.</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-8 mb-6">Resultados dos Testes</h3>
                  <div className="h-64 relative">
                    {/* Aqui seria implementado um gráfico com biblioteca como Chart.js ou Recharts */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-slate-600">Gráfico de resultados dos testes seria exibido aqui.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}