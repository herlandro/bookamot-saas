# Onboarding Flow Documentation

## Overview

The onboarding flow is a guided, conversational experience that helps new users get started with BookaMOT. It walks them through adding a vehicle and finding nearby MOT centres in a friendly, step-by-step manner.

## When Onboarding is Triggered

The onboarding flow is automatically triggered when:
1. User logs in for the first time
2. User has **no vehicles** registered
3. User has **no bookings** made

**Entry Points:**
- `/dashboard` - Automatically redirects to `/onboarding` if conditions are met
- Direct navigation to `/onboarding` (requires authentication)

## Flow Structure

```
┌─────────────────────────────────────────┐
│ Step 1: Welcome                         │
│ - Introduction to the process           │
│ - What to expect                        │
│ - Time estimate (2-3 minutes)           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Step 2: Vehicle Registration            │
│ - Enter registration number             │
│ - Auto-lookup vehicle details           │
│ - Manual entry fallback                 │
│ - Creates vehicle in database           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Step 3: Location                        │
│ - Option 1: Use current location (GPS)  │
│ - Option 2: Enter postcode manually     │
│ - Privacy notice                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Step 4: Search Preferences              │
│ - Quick search (all slots)              │
│ - OR set date/time preferences          │
│ - Redirects to /search-results          │
└─────────────────────────────────────────┘
```

## Components

### 1. Progress Indicator (`src/components/onboarding/progress-indicator.tsx`)

**Purpose:** Visual progress tracking

**Features:**
- Mobile: Simple progress bar with percentage
- Desktop: Detailed step indicator with descriptions
- Shows completed, current, and upcoming steps
- Smooth transitions between steps

**Props:**
```typescript
{
  currentStep: number        // Current step (1-4)
  totalSteps: number         // Total number of steps (4)
  steps: Array<{
    id: number
    title: string
    description: string
  }>
}
```

### 2. Welcome Step (`src/components/onboarding/welcome-step.tsx`)

**Purpose:** Introduce the onboarding process

**Features:**
- Personalized greeting using user's first name
- Overview of what will happen
- Time estimate
- Visual icons for each step
- "Skip for now" option

**User Actions:**
- Click "Let's Get Started" → Go to Step 2
- Click "I'll do this later" → Go to dashboard

### 3. Vehicle Step (`src/components/onboarding/vehicle-step.tsx`)

**Purpose:** Collect vehicle information

**Features:**
- Registration number input with auto-lookup
- Automatic vehicle details population via DVLA API
- Manual entry fallback
- Real-time validation
- Visual feedback (loading, success, error states)

**API Integration:**
- `GET /api/vehicles/lookup?registration={reg}` - Lookup vehicle details
- `POST /api/vehicles` - Create vehicle record

**Validation:**
- Uses Zod schema from `@/lib/validations`
- Required fields: registration, make, model, year, fuelType
- Optional fields: color, engineSize

**User Actions:**
- Enter registration → Auto-fills details
- Click "Continue" → Creates vehicle and goes to Step 3
- Click "Back" → Returns to Step 1

### 4. Location Step (`src/components/onboarding/location-step.tsx`)

**Purpose:** Get user's location for garage search

**Features:**
- Two location methods:
  1. **GPS Location** - Uses browser Geolocation API
  2. **Manual Postcode** - User enters UK postcode
- Privacy notice about location usage
- Postcode validation (UK format)
- Error handling for denied permissions

**Location Methods:**

**GPS:**
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    // Success: lat, lng
  },
  (error) => {
    // Error: show postcode fallback
  }
)
```

**Postcode:**
- Validates UK postcode format: `^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$`
- Converts to uppercase
- Example: SW1A 1AA

**User Actions:**
- Click "Use My Location" → Request GPS permission → Go to Step 4
- Enter postcode + "Search by Postcode" → Go to Step 4
- Click "Back" → Returns to Step 2

### 5. Search Step (`src/components/onboarding/search-step.tsx`)

**Purpose:** Set search preferences and find garages

**Features:**
- **Quick Search** - Show all available slots (recommended)
- **Detailed Search** - Set specific date and time preferences
- Date picker (future dates only)
- Time slot selector (09:00 - 17:00)
- Location summary display

**Search Options:**

**Quick Search:**
- No date/time filtering
- Shows all available garages
- Fastest option
- Redirects to: `/search-results?postcode={pc}&quick=true`

**Detailed Search:**
- Optional date selection
- Optional time slot selection
- Filtered results
- Redirects to: `/search-results?postcode={pc}&date={date}&time={time}`

**User Actions:**
- Click "Search All Garages" → Redirect to search results
- Select date/time + "Search with Preferences" → Redirect to search results
- Click "Back" → Returns to Step 3

## Page Implementation (`src/app/onboarding/page.tsx`)

**Authentication:**
- Requires authenticated user
- Redirects unauthenticated users to `/signin?callbackUrl=/onboarding`
- Redirects garage owners to `/garage-admin`

**State Management:**
```typescript
const [currentStep, setCurrentStep] = useState(1)
const [vehicleData, setVehicleData] = useState(null)
const [locationData, setLocationData] = useState(null)
```

**Navigation:**
- `handleNext()` - Advance to next step
- `handleBack()` - Return to previous step
- `handleVehicleNext(vehicle)` - Save vehicle data and advance
- `handleLocationNext(location)` - Save location data and advance

## Dashboard Integration

**File:** `src/app/dashboard/page.tsx`

**Logic:**
```typescript
const fetchDashboardData = async () => {
  // Fetch vehicles and bookings
  const hasNoVehicles = vehicles.length === 0
  const hasNoBookings = bookings.length === 0
  
  // Redirect new users to onboarding
  if (hasNoVehicles && hasNoBookings) {
    router.push('/onboarding')
    return
  }
  
  // Continue with normal dashboard
}
```

## User Experience Highlights

### 1. Conversational Tone
- Friendly, welcoming language
- Personal pronouns ("your vehicle", "let's find")
- Encouraging messages

### 2. Progressive Disclosure
- One task at a time
- Clear next steps
- No overwhelming forms

### 3. Visual Feedback
- Loading states during API calls
- Success indicators (checkmarks)
- Error messages with helpful guidance
- Progress visualization

### 4. Flexibility
- Multiple options at each step
- Skip option available
- Back navigation enabled
- No forced path

### 5. Mobile-First Design
- Responsive layouts
- Touch-friendly buttons
- Simplified mobile progress indicator
- Optimized form inputs

## Error Handling

### Vehicle Lookup Failure
- Shows manual entry form
- User can fill details themselves
- No blocking error

### Geolocation Denied
- Automatically shows postcode option
- Clear error message
- No data loss

### API Errors
- User-friendly error messages
- Retry options
- Fallback to manual entry

## Privacy & Security

### Location Data
- Only used for garage search
- Not stored permanently
- Clear privacy notice
- User consent required

### Vehicle Data
- Stored securely in database
- Associated with user account
- Can be edited later in dashboard

## Testing Recommendations

### Manual Testing
1. **New User Flow**
   - Create new account
   - Verify automatic redirect to onboarding
   - Complete all steps
   - Verify redirect to search results

2. **GPS Location**
   - Test with location permission granted
   - Test with location permission denied
   - Verify fallback to postcode

3. **Vehicle Lookup**
   - Test with valid UK registration
   - Test with invalid registration
   - Verify manual entry works

4. **Navigation**
   - Test back button on each step
   - Test skip option
   - Verify state preservation

### Edge Cases
- User closes browser mid-onboarding
- User denies all permissions
- API timeouts
- Invalid postcode formats
- Network errors

## Future Enhancements

1. **Progress Persistence**
   - Save progress in localStorage
   - Resume from last step

2. **Analytics**
   - Track completion rate
   - Identify drop-off points
   - A/B test messaging

3. **Personalization**
   - Remember location preference
   - Suggest nearby garages
   - Pre-fill based on vehicle type

4. **Gamification**
   - Completion badges
   - Progress animations
   - Celebration on completion

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- ARIA labels on interactive elements
- High contrast mode compatible
- Focus indicators visible

