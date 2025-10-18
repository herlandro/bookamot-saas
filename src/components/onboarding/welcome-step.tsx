'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Car, MapPin, Calendar, CheckCircle, ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface WelcomeStepProps {
  onNext: () => void
}

/**
 * Welcome Step Component
 * First step in the onboarding flow - introduces the user to the process
 */
export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { data: session } = useSession()
  const userName = session?.user?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-6">
      {/* Hero Icon */}
      <div className="mb-4 relative">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Welcome Message */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        Welcome to BookaMOT, {userName}! 👋
      </h1>

      <p className="text-base text-muted-foreground mb-5 max-w-2xl">
        Need an MOT inspection? Let's get you sorted in just a few simple steps.
      </p>

      {/* What We'll Do */}
      <div className="w-full max-w-md mb-5">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Here's what we'll do together:
        </h2>

        <div className="space-y-2 text-left">
          {/* Step 1 */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Car className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">Add your vehicle</h3>
              <p className="text-xs text-muted-foreground">
                Quick registration lookup - we'll fill in the details for you
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">Find nearby garages</h3>
              <p className="text-xs text-muted-foreground">
                We'll locate MOT centres close to you
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">Book your MOT</h3>
              <p className="text-xs text-muted-foreground">
                Choose a time that works for you and you're done!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Estimate */}
      <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          ⏱️ This will take about <strong>2-3 minutes</strong> to complete
        </p>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onNext}
        size="lg"
        className="w-full max-w-md h-11 text-base font-semibold group"
      >
        Let's Get Started
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Skip Option */}
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
      >
        I'll do this later
      </button>
    </div>
  )
}

