'use client'

import React, { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import gsap from 'gsap'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: {
    id: number
    title: string
    description: string
  }[]
}

/**
 * Progress Indicator Component
 * Displays a visual progress bar showing the current step in the onboarding flow
 */
export function ProgressIndicator({ currentStep, totalSteps, steps }: ProgressIndicatorProps) {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(currentStep)

  // Animate progress bar when step changes
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !progressBarRef.current) {
      return
    }

    // Only animate if step actually changed
    if (prevStepRef.current !== currentStep) {
      const targetWidth = (currentStep / totalSteps) * 100

      gsap.to(progressBarRef.current, {
        width: `${targetWidth}%`,
        duration: 0.6,
        ease: 'power2.out',
      })

      prevStepRef.current = currentStep
    }
  }, [currentStep, totalSteps])

  return (
    <div className="w-full py-6 px-4 md:px-8">
      {/* Mobile: Simple progress bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            ref={progressBarRef}
            className="bg-primary h-2 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-foreground font-medium">
          {steps[currentStep - 1]?.title}
        </p>
      </div>

      {/* Desktop: Detailed step indicator */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isUpcoming = stepNumber > currentStep

            return (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
                      isCompleted && 'bg-primary text-primary-foreground',
                      isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      isUpcoming && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-sm font-medium transition-colors',
                        (isCompleted || isCurrent) && 'text-foreground',
                        isUpcoming && 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 mb-12">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        stepNumber < currentStep ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

