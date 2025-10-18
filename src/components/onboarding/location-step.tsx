'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Navigation, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import gsap from 'gsap'

interface LocationStepProps {
  onNext: (locationData: { postcode?: string; lat?: number; lng?: number }) => void
  onBack: () => void
}

/**
 * Location Step Component
 * Third step in onboarding - gets user's location for garage search
 * Redesigned with side-by-side layout: postcode input on left, location checkbox on right
 */
export function LocationStep({ onNext, onBack }: LocationStepProps) {
  const [postcode, setPostcode] = useState('')
  const [error, setError] = useState('')
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  const mapPinContainerRef = useRef<HTMLDivElement>(null)
  const mapPinIconRef = useRef<SVGSVGElement>(null)
  const pulseRingRef = useRef<HTMLDivElement>(null)

  // Handle checkbox toggle for current location
  const handleLocationCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setUseCurrentLocation(checked)
    setError('')

    // Clear postcode when using current location
    if (checked) {
      setPostcode('')
    }
  }

  // Handle postcode input change
  const handlePostcodeChange = (value: string) => {
    setPostcode(value.toUpperCase())
    setError('')

    // Uncheck location checkbox when typing postcode
    if (value.trim() && useCurrentLocation) {
      setUseCurrentLocation(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If using current location
    if (useCurrentLocation) {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser')
        return
      }

      setLoadingLocation(true)
      setError('')

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingLocation(false)
          onNext({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          setLoadingLocation(false)
          setUseCurrentLocation(false)
          setError('Unable to get your location. Please enter your postcode instead.')
          console.error('Geolocation error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
      return
    }

    // If using postcode
    if (!postcode.trim()) {
      setError('Please enter a postcode or use your current location')
      return
    }

    // Basic UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i
    if (!postcodeRegex.test(postcode.trim())) {
      setError('Please enter a valid UK postcode (e.g., SW1A 1AA)')
      return
    }

    setError('')
    onNext({ postcode: postcode.trim().toUpperCase() })
  }

  // Map pin drop animation with pulsing effect
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !mapPinContainerRef.current || !mapPinIconRef.current || !pulseRingRef.current) {
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Pin drops from above
      tl.from(mapPinIconRef.current, {
        y: -60,
        opacity: 0,
        duration: 0.6,
        ease: 'bounce.out',
      })
      // Slight rotation on landing
      .to(mapPinIconRef.current, {
        rotation: 5,
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(mapPinIconRef.current, {
        rotation: -5,
        duration: 0.15,
        ease: 'power2.inOut',
      })
      .to(mapPinIconRef.current, {
        rotation: 0,
        duration: 0.15,
        ease: 'power2.out',
      })

      // Continuous pulsing ring effect
      gsap.to(pulseRingRef.current, {
        scale: 1.5,
        opacity: 0,
        duration: 2,
        ease: 'power1.out',
        repeat: -1,
        repeatDelay: 0.5,
      })

      // Subtle floating animation for the pin
      gsap.to(mapPinIconRef.current, {
        y: -4,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1,
      })
    }, mapPinContainerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div ref={mapPinContainerRef} className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {/* Pulsing ring effect */}
          <div
            ref={pulseRingRef}
            className="absolute inset-0 rounded-full bg-primary/30"
            style={{ transformOrigin: 'center' }}
          />
          <MapPin ref={mapPinIconRef} className="w-8 h-8 text-primary relative z-10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Great! Now let's find MOT centres near you
        </h2>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Side-by-side Layout: Postcode Input + Location Checkbox */}
        <div className="p-6 border-2 border-border rounded-lg bg-card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Postcode Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <Label htmlFor="postcode" className="text-base font-semibold">
                  Enter your postcode
                </Label>
              </div>
              <Input
                id="postcode"
                placeholder="e.g., SW1A 1AA"
                value={postcode}
                onChange={(e) => handlePostcodeChange(e.target.value)}
                disabled={useCurrentLocation || loadingLocation}
                className={`text-lg h-14 ${useCurrentLocation ? 'opacity-50' : ''}`}
                maxLength={8}
              />
            </div>

            {/* Right Side: Use Current Location Checkbox */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">
                  Or use GPS
                </Label>
              </div>
              <div className="flex items-center space-x-3 h-14 px-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors bg-background">
                <Checkbox
                  id="use-location"
                  checked={useCurrentLocation}
                  onChange={handleLocationCheckboxChange}
                  disabled={loadingLocation}
                  className="h-5 w-5"
                />
                <Label
                  htmlFor="use-location"
                  className="text-base font-medium cursor-pointer flex items-center gap-2 flex-1"
                >
                  <Navigation className="w-4 h-4 text-primary" />
                  Use my current location
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Privacy note:</strong> We only use your location to find nearby garages.
            We don't store or share your location data.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Back
          </Button>

          <Button
            type="submit"
            disabled={loadingLocation || (!postcode.trim() && !useCurrentLocation)}
            className="w-full sm:w-auto group order-1 sm:order-2"
            size="lg"
          >
            {loadingLocation ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                {useCurrentLocation ? 'Search Nearby' : 'Search'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

