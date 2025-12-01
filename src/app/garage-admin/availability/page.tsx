'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Calendar, Clock, CalendarDays, ChevronLeft, ChevronRight,
  ArrowLeft, Loader2, Check, X, AlertCircle, Lock, Unlock
} from 'lucide-react'
import { GarageLayout } from '@/components/layout/garage-layout'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


interface GarageSchedule {
  id: string
  dayOfWeek: number
  isOpen: boolean
  openTime: string
  closeTime: string
  slotDuration: number
}

interface BlockedDate {
  date: string
  reason?: string
}

interface UKHoliday {
  title: string
  date: string
  notes: string
}

interface HolidayOverride {
  date: string
  isAvailable: boolean
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function AvailabilityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedules, setSchedules] = useState<GarageSchedule[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [holidays, setHolidays] = useState<UKHoliday[]>([])
  const [holidayOverrides, setHolidayOverrides] = useState<HolidayOverride[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: string; data: any } | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/signin')
      return
    }
    if (session.user.role !== 'GARAGE_OWNER') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch availability data
      const [availRes, holidaysRes, blockedRes] = await Promise.all([
        fetch('/api/garage-admin/availability'),
        fetch(`/api/uk-holidays?year=${currentMonth.getFullYear()}`),
        fetch('/api/garage-admin/blocked-dates')
      ])

      if (availRes.ok) {
        const data = await availRes.json()
        setSchedules(data.schedules || [])
      }

      if (holidaysRes.ok) {
        const data = await holidaysRes.json()
        setHolidays(data.holidays || [])
      }

      if (blockedRes.ok) {
        const data = await blockedRes.json()
        setBlockedDates(data.blockedDates || [])
        setHolidayOverrides(data.holidayOverrides || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setErrorMessage('Failed to load availability data')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const showError = (message: string) => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(''), 5000)
  }

  const updateSchedule = async (dayOfWeek: number, updates: Partial<GarageSchedule>) => {
    setSaving(true)
    try {
      const currentSchedule = schedules.find(s => s.dayOfWeek === dayOfWeek)
      const response = await fetch('/api/garage-admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          type: 'schedule',
          data: {
            dayOfWeek,
            isOpen: updates.isOpen ?? currentSchedule?.isOpen ?? true,
            openTime: updates.openTime ?? currentSchedule?.openTime ?? '09:00',
            closeTime: updates.closeTime ?? currentSchedule?.closeTime ?? '17:30',
            slotDuration: updates.slotDuration ?? currentSchedule?.slotDuration ?? 60,
          }
        })
      })
      if (response.ok) {
        await fetchData()
        showSuccess('Schedule updated successfully')
      } else {
        showError('Failed to update schedule')
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      showError('Failed to update schedule')
    } finally {
      setSaving(false)
    }
  }

  const blockDates = async (dates: string[], action: 'block' | 'unblock', reason?: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/garage-admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          type: 'dateRange',
          data: {
            startDate: dates[0],
            endDate: dates[dates.length - 1],
            reason: reason || `${action === 'block' ? 'Blocked' : 'Unblocked'} via calendar`
          }
        })
      })
      if (response.ok) {
        await fetchData()
        setSelectedDates([])
        showSuccess(`Successfully ${action}ed ${dates.length} day(s)`)
      } else {
        showError(`Failed to ${action} dates`)
      }
    } catch (error) {
      console.error('Error:', error)
      showError(`Failed to ${action} dates`)
    } finally {
      setSaving(false)
    }
  }

  const toggleHolidayOverride = async (date: string, makeAvailable: boolean) => {
    setSaving(true)
    try {
      const response = await fetch('/api/garage-admin/holiday-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, isAvailable: makeAvailable })
      })
      if (response.ok) {
        await fetchData()
        showSuccess(makeAvailable ? 'Holiday marked as available' : 'Holiday will be closed')
      } else {
        showError('Failed to update holiday')
      }
    } catch (error) {
      showError('Failed to update holiday')
    } finally {
      setSaving(false)
    }
  }

  const handleDateClick = (dateStr: string) => {
    if (isSelecting) {
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(selectedDates.filter(d => d !== dateStr))
      } else {
        setSelectedDates([...selectedDates, dateStr].sort())
      }
    } else {
      setSelectedDates([dateStr])
    }
  }

  const handleConfirmAction = () => {
    if (confirmAction) {
      if (confirmAction.type === 'block') {
        blockDates(confirmAction.data.dates, 'block', confirmAction.data.reason)
      } else if (confirmAction.type === 'unblock') {
        blockDates(confirmAction.data.dates, 'unblock')
      }
    }
    setShowConfirmDialog(false)
    setConfirmAction(null)
  }

  // Generate calendar days for current month
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Add padding days from previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // Add padding days for next month
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }, [currentMonth])

  const isDateBlocked = (dateStr: string) => {
    return blockedDates.some(b => b.date === dateStr)
  }

  const isHoliday = (dateStr: string) => {
    return holidays.some(h => h.date === dateStr)
  }

  const getHoliday = (dateStr: string) => {
    return holidays.find(h => h.date === dateStr)
  }

  const isHolidayOverridden = (dateStr: string) => {
    return holidayOverrides.some(o => o.date === dateStr && o.isAvailable)
  }

  const isWeekend = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6
  }

  const isDayClosed = (date: Date) => {
    const schedule = schedules.find(s => s.dayOfWeek === date.getDay())
    return schedule ? !schedule.isOpen : true
  }

  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1))
  }

  if (status === 'loading' || loading) {
    return (
      <GarageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </GarageLayout>
    )
  }

  const calendarDays = generateCalendarDays()

  return (
    <GarageLayout>
      <div className="p-6 space-y-6">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Check className="h-4 w-4" />
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/garage-admin/calendar')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarDays className="h-6 w-6" />
                  Availability Management
                </h1>
                <p className="text-muted-foreground">Manage your garage opening hours and blocked dates</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={isSelecting ? "default" : "outline"}
              size="sm"
              onClick={() => setIsSelecting(!isSelecting)}
            >
              {isSelecting ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Multi-Select: ON
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Enable Multi-Select
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const monthDays = calendarDays
                  .filter(d => d.isCurrentMonth && new Date(d.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                  .map(d => formatDateStr(d.date))
                setSelectedDates(monthDays)
              }}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Select Entire Month
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const startOfWeek = new Date(today)
                startOfWeek.setDate(today.getDate() - today.getDay() + 1)
                const weekDays: string[] = []
                for (let i = 0; i < 7; i++) {
                  const day = new Date(startOfWeek)
                  day.setDate(startOfWeek.getDate() + i)
                  if (day >= new Date(new Date().setHours(0, 0, 0, 0))) {
                    weekDays.push(formatDateStr(day))
                  }
                }
                setSelectedDates(weekDays)
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Select Current Week
            </Button>

            {selectedDates.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDates([])}
              >
                <X className="h-4 w-4 mr-2" />
                Clear ({selectedDates.length})
              </Button>
            )}
          </div>

          {/* Calendar, Opening Hours, and Holidays Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Calendar Card */}
            <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                  {/* Calendar Grid */}
                  <div className="w-full">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map(({ date, isCurrentMonth }, index) => {
                        const dateStr = formatDateStr(date)
                        const blocked = isDateBlocked(dateStr)
                        const holiday = getHoliday(dateStr)
                        const overridden = isHolidayOverridden(dateStr)
                        const closed = isDayClosed(date)
                        const weekend = isWeekend(date)
                        const selected = selectedDates.includes(dateStr)
                        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                        const tooltipText = holiday
                          ? `${holiday.title} - ${overridden ? 'Open (Override)' : 'Closed'}`
                          : blocked
                            ? 'Blocked'
                            : closed
                              ? `Closed (${dayNamesFull[date.getDay()]})`
                              : 'Available'

                        return (
                          <button
                            key={index}
                            title={tooltipText}
                            onClick={() => !isPast && isCurrentMonth && handleDateClick(dateStr)}
                            disabled={isPast || !isCurrentMonth}
                            className={cn(
                              "relative h-10 w-full rounded-md text-sm transition-all border",
                              "hover:ring-2 hover:ring-primary hover:ring-offset-1",
                              "focus:outline-none focus:ring-2 focus:ring-primary",
                              !isCurrentMonth && "opacity-30",
                              isPast && "opacity-50 cursor-not-allowed",
                              selected && "ring-2 ring-primary ring-offset-2 bg-primary/20",
                              blocked && !holiday && "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
                              holiday && !overridden && "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
                              holiday && overridden && "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
                              closed && !blocked && !holiday && "bg-muted border-muted",
                              weekend && !blocked && !holiday && !closed && "bg-muted/50 border-muted",
                              !blocked && !holiday && !closed && !weekend && "bg-background hover:bg-muted/50 border-border"
                            )}
                          >
                            <span className={cn(
                              "font-medium",
                              holiday && "text-purple-700 dark:text-purple-300",
                              blocked && !holiday && "text-red-700 dark:text-red-300"
                            )}>
                              {date.getDate()}
                            </span>
                            {blocked && !holiday && (
                              <Lock className="absolute bottom-0.5 right-0.5 h-3 w-3 text-red-500" />
                            )}
                            {holiday && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-b" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selection Actions */}
                  {selectedDates.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedDates.length} date(s) selected</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDates.length === 1
                            ? selectedDates[0]
                            : `${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]}`
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setConfirmAction({ type: 'block', data: { dates: selectedDates } })
                            setShowConfirmDialog(true)
                          }}
                          disabled={saving}
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Block
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setConfirmAction({ type: 'unblock', data: { dates: selectedDates } })
                            setShowConfirmDialog(true)
                          }}
                          disabled={saving}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Unblock
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedDates([])}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Unified Legend */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-background border" />
                        <span className="text-muted-foreground">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
                        <span className="text-muted-foreground">Blocked</span>
                        <span className="font-medium">
                          ({blockedDates.filter(b => b.date.startsWith(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`)).length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700" />
                        <span className="text-muted-foreground">UK Holiday</span>
                        <span className="font-medium">
                          ({holidays.filter(h => h.date.startsWith(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`)).length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-muted border border-muted-foreground/20" />
                        <span className="text-muted-foreground">Closed Day</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      Open Days: <span className="font-medium text-foreground">{schedules.filter(s => s.isOpen).length}/7</span>
                    </div>
                  </div>
                </CardContent>
            </Card>

            {/* Opening Hours Card - Middle Column */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Opening Hours
                </CardTitle>
                <CardDescription>
                  Set your garage&apos;s operating hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayNamesFull.map((day, index) => {
                    const schedule = schedules.find(s => s.dayOfWeek === index)
                    return (
                      <div key={day} className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={schedule?.isOpen ?? false}
                          onChange={(e) => updateSchedule(index, { isOpen: e.target.checked })}
                          disabled={saving}
                          className="h-4 w-4 rounded border-input bg-background text-primary accent-primary shrink-0"
                        />
                        <div className="w-24 shrink-0">
                          <span className="font-medium text-sm">{day}</span>
                        </div>
                        {schedule?.isOpen ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={schedule?.openTime || '09:00'}
                              onChange={(e) => updateSchedule(index, { openTime: e.target.value })}
                              className="flex-1 h-8 text-sm bg-muted"
                              disabled={saving}
                            />
                            <span className="text-sm text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={schedule?.closeTime || '17:30'}
                              onChange={(e) => updateSchedule(index, { closeTime: e.target.value })}
                              className="flex-1 h-8 text-sm bg-muted"
                              disabled={saving}
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Closed</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* UK Bank Holidays - Right Column */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  UK Bank Holidays {currentMonth.getFullYear()}
                </CardTitle>
                <CardDescription>
                  Toggle to stay open on holidays
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                {holidays.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No holidays found for {currentMonth.getFullYear()}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {holidays.map((holiday) => {
                      const overridden = isHolidayOverridden(holiday.date)
                      const isPast = new Date(holiday.date) < new Date(new Date().setHours(0, 0, 0, 0))
                      const holidayDate = new Date(holiday.date)

                      return (
                        <div
                          key={holiday.date}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg border",
                            isPast && "opacity-50",
                            overridden
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                              : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={overridden}
                            onChange={(e) => toggleHolidayOverride(holiday.date, e.target.checked)}
                            disabled={saving || isPast}
                            className="h-4 w-4 rounded border-input bg-background text-primary accent-primary shrink-0 cursor-pointer"
                          />
                          <div className={cn(
                            "w-10 h-10 rounded flex flex-col items-center justify-center text-xs font-medium shrink-0",
                            overridden
                              ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                              : "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                          )}>
                            <span className="text-sm font-bold">{holidayDate.getDate()}</span>
                            <span className="uppercase text-[8px]">
                              {holidayDate.toLocaleDateString('en-GB', { month: 'short' })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{holiday.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {holidayDate.toLocaleDateString('en-GB', { weekday: 'short' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Confirmation Dialog */}
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {confirmAction?.type === 'block' ? 'Block Selected Dates?' : 'Unblock Selected Dates?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmAction?.type === 'block'
                    ? `This will block all time slots for ${confirmAction?.data?.dates?.length} selected date(s). Customers won't be able to book during this period.`
                    : `This will unblock all time slots for ${confirmAction?.data?.dates?.length} selected date(s). Customers will be able to book during this period.`
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAction}>
                  {confirmAction?.type === 'block' ? 'Block Dates' : 'Unblock Dates'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
    </GarageLayout>
  )
}
