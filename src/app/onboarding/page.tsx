'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { WelcomeStep } from '@/components/onboarding/welcome-step'
import { VehicleStep } from '@/components/onboarding/vehicle-step'
import { LocationStep } from '@/components/onboarding/location-step'
import { SearchStep } from '@/components/onboarding/search-step'
import { Loader2 } from 'lucide-react'
import gsap from 'gsap'

/**
 * Onboarding Page
 * Guides new users through the process of adding a vehicle and finding MOT centres
 * 
 * Flow:
 * 1. Welcome - Introduction to the process
 * 2. Vehicle - Add vehicle details
 * 3. Location - Get user location or postcode
 * 4. Search - Set preferences and search for garages
 */
export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [vehicleData, setVehicleData] = useState<any>(null)
  const [locationData, setLocationData] = useState<any>(null)
  const cardContentRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(currentStep)

  // Define onboarding steps
  const steps = [
    {
      id: 1,
      title: 'Welcome',
      description: 'Get started',
      component: WelcomeStep
    },
    {
      id: 2,
      title: 'Your Vehicle',
      description: 'Add vehicle details',
      component: VehicleStep
    },
    {
      id: 3,
      title: 'Location',
      description: 'Find nearby garages',
      component: LocationStep
    },
    {
      id: 4,
      title: 'Search',
      description: 'Book your MOT',
      component: SearchStep
    }
  ]

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/signin?callbackUrl=/onboarding')
      return
    }

    // Redirect garage owners to their dashboard
    if (session?.user?.role === 'GARAGE_OWNER') {
      router.push('/')
      return
    }
  }, [status, session, router])

  // Animate step transitions
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !cardContentRef.current) {
      return
    }

    // Only animate if step actually changed
    if (prevStepRef.current !== currentStep) {
      const isForward = currentStep > prevStepRef.current

      // Animate out and in
      gsap.fromTo(
        cardContentRef.current,
        {
          opacity: 0,
          x: isForward ? 50 : -50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out',
        }
      )

      prevStepRef.current = currentStep
    }
  }, [currentStep])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null
  }

  // Step navigation handlers
  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleVehicleNext = (vehicle: any) => {
    setVehicleData(vehicle)
    handleNext()
  }

  const handleLocationNext = (location: any) => {
    setLocationData(location)
    handleNext()
  }

  // Get current step component
  const CurrentStepComponent = steps[currentStep - 1].component

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={steps.length}
          steps={steps}
        />

        {/* Step Content */}
        <div className="mt-8">
          <Card className="max-w-4xl mx-auto shadow-xl border-border">
            <CardContent ref={cardContentRef} className="p-0">
              {/* Render current step */}
              {currentStep === 1 && (
                <WelcomeStep onNext={handleNext} />
              )}

              {currentStep === 2 && (
                <VehicleStep
                  onNext={handleVehicleNext}
                  onBack={handleBack}
                />
              )}

              {currentStep === 3 && (
                <LocationStep
                  onNext={handleLocationNext}
                  onBack={handleBack}
                />
              )}

              {currentStep === 4 && locationData && (
                <SearchStep
                  locationData={locationData}
                  onBack={handleBack}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="max-w-4xl mx-auto mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@bookamot.com" className="text-primary hover:underline">
              support@bookamot.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

