'use client'

import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Car, CheckCircle, ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import gsap from 'gsap'

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

  // Refs for animation targets
  const containerRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)

  // GSAP animations on mount
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      // Skip animations if user prefers reduced motion
      return
    }

    const ctx = gsap.context(() => {
      // Create animation timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Animate elements in sequence
      tl.from(iconRef.current, {
        scale: 0,
        rotation: -180,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
      })
      .from(titleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.5,
      }, '-=0.3')
      .from(subtitleRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.5,
      }, '-=0.3')
      .from(buttonRef.current, {
        y: 20,
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
      }, '-=0.2')
      .from(skipRef.current, {
        opacity: 0,
        duration: 0.3,
      }, '-=0.2')
    }, containerRef)

    // Cleanup
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center text-center px-4 py-6">
      {/* Hero Icon */}
      <div ref={iconRef} className="mb-4 relative">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Welcome Message */}
      <h1 ref={titleRef} className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        Welcome to BookaMOT, {userName}! 👋
      </h1>

      <p ref={subtitleRef} className="text-base text-muted-foreground mb-8 max-w-2xl">
        Need an MOT inspection? Let's get you sorted in just a few simple steps.
      </p>

      {/* CTA Button */}
      <Button
        ref={buttonRef}
        onClick={onNext}
        size="lg"
        className="w-full max-w-md h-11 text-base font-semibold group"
      >
        Let's Get Started
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Skip Option */}
      <button
        ref={skipRef}
        onClick={() => window.location.href = '/dashboard'}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
      >
        I'll do this later
      </button>
    </div>
  )
}

