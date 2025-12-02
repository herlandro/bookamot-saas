'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, Clock, Search, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface SearchStepProps {
  locationData: { postcode?: string; lat?: number; lng?: number }
  onBack: () => void
}

/**
 * Search Step Component
 * Final step in onboarding - allows user to set search preferences and redirects to search page
 */
export function SearchStep({ locationData, onBack }: SearchStepProps) {
  const router = useRouter()
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>('')
  const [searching, setSearching] = useState(false)

  // Common time slots for MOT appointments (hourly only)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ]

  const handleSearch = () => {
    setSearching(true)

    // Build search parameters for /search page
    const params = new URLSearchParams()

    if (locationData.postcode) {
      params.append('location', locationData.postcode)
    }
    if (date) {
      params.append('date', format(date, 'yyyy-MM-dd'))
    }
    if (time) {
      params.append('time', time)
    }

    // Redirect to search page
    router.push(`/search?${params.toString()}`)
  }

  const handleQuickSearch = () => {
    setSearching(true)

    // Quick search without date/time preferences
    const params = new URLSearchParams()

    if (locationData.postcode) {
      params.append('location', locationData.postcode)
    }

    // Redirect to search page
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Perfect! When do you need your MOT?
        </h2>
        <p className="text-muted-foreground">
          Choose a preferred date and time, or search all available slots
        </p>
      </div>

      {/* Search Options */}
      <div className="space-y-6">
        {/* Quick Search Option */}
        <div className="p-6 border-2 border-primary bg-primary/5 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Search className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Show me all available slots
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse all available MOT appointments and choose what works best for you
              </p>
              <Button
                onClick={handleQuickSearch}
                disabled={searching}
                size="lg"
                className="w-full md:w-auto group"
              >
                {searching ? (
                  'Searching...'
                ) : (
                  <>
                    Search All Garages
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground">
              or set preferences
            </span>
          </div>
        </div>

        {/* Detailed Search */}
        <div className="p-6 border-2 border-border rounded-lg space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            Search with specific date and time
          </h3>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-medium">
              Preferred Date (Optional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-12',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selector */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              Preferred Time (Optional)
            </Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={time === slot ? 'default' : 'outline'}
                  className="h-10"
                  onClick={() => setTime(time === slot ? '' : slot)}
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {slot}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={searching}
            size="lg"
            className="w-full group"
          >
            {searching ? (
              'Searching...'
            ) : (
              <>
                Search with Preferences
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>

        {/* Location Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Searching near:</strong>{' '}
            {locationData.postcode || 'Your current location'}
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={searching}
          className="w-full md:w-auto"
        >
          Back
        </Button>
      </div>
    </div>
  )
}

