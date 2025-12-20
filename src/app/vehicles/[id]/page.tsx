"use client"

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { ArrowLeft, Car, Calendar, ChevronDown, ChevronRight, TrendingUp, Fuel, Palette, Wrench } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  fuelType: string
  color?: string
  engineSize?: number
  vin?: string
}

interface MOTRecord {
  id: string
  testDate: string
  expiryDate: string
  result: 'PASS' | 'FAIL' | 'ADVISORY'
  mileage: number
  testNumber: string
  defects: {
    dangerous: number
    major: number
    minor: number
    advisory: number
  }
  details: string[]
}

interface MileageData {
  year: number
  mileage: number
  date: string
}
export default function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = session?.user?.id

  // Handle both Promise and direct params
  const [vehicleId, setVehicleId] = useState<string | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      if (params && typeof params === 'object') {
        if ('then' in params) {
          // It's a Promise
          const resolved = await params
          setVehicleId(resolved.id)
        } else {
          // It's already resolved
          setVehicleId((params as any).id)
        }
      }
    }
    resolveParams()
  }, [params])

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [motHistory, setMotHistory] = useState<MOTRecord[]>([])
  const [mileageData, setMileageData] = useState<MileageData[]>([])
  const [loading, setLoading] = useState(true)
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const [motError, setMotError] = useState<string | null>(null)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (status === 'loading' || !vehicleId) return
    if (!userId) {
      router.push('/signin')
      return
    }
    fetchVehicleData()
  }, [userId, status, vehicleId, router])

  const fetchVehicleData = async () => {
    try {
      setLoading(true)

      // Fetch vehicle details (includes motTests)
      const vehicleResponse = await fetch(`/api/vehicles/${vehicleId}`)
      if (vehicleResponse.ok) {
        const vehicleData = await vehicleResponse.json()
        if (vehicleData && vehicleData.id && vehicleData.registration) {
          setVehicle(vehicleData)
          setVehicleError(null)

          const motData = Array.isArray(vehicleData.motTests) ? vehicleData.motTests : []
          const validRecords = motData.filter((r: any) => r && r.testDate && typeof r.mileage === 'number')
          setMotHistory(validRecords)
          setMotError(vehicleData.motError || null)

          const mileageMap = new Map<number, MileageData>()
          validRecords.forEach((record: MOTRecord) => {
            const year = new Date(record.testDate).getFullYear()
            const existingRecord = mileageMap.get(year)
            if (!existingRecord || new Date(record.testDate) > new Date(existingRecord.date)) {
              mileageMap.set(year, {
                year,
                mileage: record.mileage,
                date: record.testDate
              })
            }
          })

          const mileageChartData = Array.from(mileageMap.values()).sort((a, b) => a.year - b.year)
          setMileageData(mileageChartData)
        } else {
          setVehicleError('Unexpected vehicle response format')
          setMotHistory([])
          setMileageData([])
        }
      } else {
        const err = await safeJson(vehicleResponse)
        setVehicleError(err?.error || 'Failed to load vehicle')
        setMotHistory([])
        setMileageData([])
      }
    } catch (error) {
      setVehicleError('Failed to load vehicle data')
      setMotError('Failed to load MOT history')
    } finally {
      setLoading(false)
    }
  }

  const safeJson = async (res: Response) => {
    try { return await res.json() } catch { return null }
  }

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(year)) {
      newExpanded.delete(year)
    } else {
      newExpanded.add(year)
    }
    setExpandedYears(newExpanded)
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'PASS':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pass</Badge>
      case 'FAIL':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Fail</Badge>
      case 'ADVISORY':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Advisory</Badge>
      default:
        return <Badge variant="secondary">{result}</Badge>
    }
  }

  const groupMotByYear = (motRecords: MOTRecord[]) => {
    const grouped = motRecords.reduce((acc, record) => {
      const year = new Date(record.testDate).getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(record)
      return acc
    }, {} as Record<number, MOTRecord[]>)

    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, records]) => ({
        year: parseInt(year),
        records: records.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
      }))
  }

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading vehicle details...</p>
        </div>
      </MainLayout>
    )
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Vehicle not found</p>
        </div>
      </MainLayout>
    )
  }

  const groupedMotHistory = groupMotByYear(motHistory)

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-end">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-xl rounded-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Registration</h3>
                    <p className="mt-1 font-bold text-lg">{vehicle.registration}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Make
                    </h3>
                    <p className="mt-1 font-medium">{vehicle.make}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Model</h3>
                    <p className="mt-1 font-medium">{vehicle.model}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Year
                    </h3>
                    <p className="mt-1 font-medium">{vehicle.year}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      Fuel Type
                    </h3>
                    <p className="mt-1 font-medium">{vehicle.fuelType}</p>
                  </div>

                  {vehicle.color && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color
                      </h3>
                      <p className="mt-1 font-medium">{vehicle.color}</p>
                    </div>
                  )}

                  {vehicle.engineSize && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Engine Size (L)
                      </h3>
                      <p className="mt-1 font-medium">{vehicle.engineSize}L</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MOT History and Mileage Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mileage Chart */}
              {mileageData.length > 0 ? (
                <Card className="shadow-xl rounded-lg border border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Mileage Over Time
                    </CardTitle>
                    <CardDescription>
                      Chart showing mileage evolution over the years
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mileageData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="year"
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Mileage', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                            formatter={(value: any) => [`${value} km`, 'Mileage']}
                            labelFormatter={(label: any) => `Year: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="mileage"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-xl rounded-lg border border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Mileage Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {motError || 'No mileage data available'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* MOT History */}
              <Card className="shadow-xl rounded-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    MOT History
                  </CardTitle>
                  <CardDescription>
                    Complete MOT inspection history organised by year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {motHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {motError || 'No MOT history found'}
                    </p>
                  ) : groupedMotHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Error processing MOT history
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {groupedMotHistory.map(({ year, records }) => (
                        <Collapsible key={year}>
                          <CollapsibleTrigger
                            className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => toggleYear(year)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedYears.has(year) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="font-semibold">{year}</span>
                              <Badge variant="secondary">{records.length} teste(s)</Badge>
                            </div>
                            <div className="flex gap-2">
                              {records.map((record, index) => (
                                <div key={index} className="text-xs">
                                  {getResultBadge(record.result)}
                                </div>
                              ))}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="space-y-3 pl-7">
                              {records.map((record) => (
                                <div key={record.id} className="border border-border rounded-lg p-4 bg-card">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-medium">
                                        Test: {new Date(record.testDate).toLocaleDateString('en-GB')}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Number: {record.testNumber}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Mileage: {record.mileage.toLocaleString()} km
                                      </p>
                                    </div>
                                    {getResultBadge(record.result)}
                                  </div>

                                  {(record.defects.dangerous > 0 || record.defects.major > 0 ||
                                    record.defects.minor > 0 || record.defects.advisory > 0) && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                      {record.defects.dangerous > 0 && (
                                        <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                                          <p className="text-xs text-red-600 font-medium">Dangerous</p>
                                          <p className="text-lg font-bold text-red-700">{record.defects.dangerous}</p>
                                        </div>
                                      )}
                                      {record.defects.major > 0 && (
                                        <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
                                          <p className="text-xs text-orange-600 font-medium">Major</p>
                                          <p className="text-lg font-bold text-orange-700">{record.defects.major}</p>
                                        </div>
                                      )}
                                      {record.defects.minor > 0 && (
                                        <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
                                          <p className="text-xs text-yellow-600 font-medium">Minor</p>
                                          <p className="text-lg font-bold text-yellow-700">{record.defects.minor}</p>
                                        </div>
                                      )}
                                      {record.defects.advisory > 0 && (
                                        <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                                          <p className="text-xs text-blue-600 font-medium">Advisory</p>
                                          <p className="text-lg font-bold text-blue-700">{record.defects.advisory}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {record.details.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Details:</h4>
                                      <ul className="text-sm text-muted-foreground space-y-1">
                                        {record.details.map((detail, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                                            {detail}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
