# Onboarding Flow - Component Tree

## Component Hierarchy

```
src/app/onboarding/page.tsx (Main Page)
│
├── ProgressIndicator
│   ├── Mobile View
│   │   ├── Step Counter (e.g., "Step 2 of 4")
│   │   ├── Progress Bar
│   │   └── Current Step Title
│   │
│   └── Desktop View
│       ├── Step 1 Circle + Label
│       ├── Connector Line
│       ├── Step 2 Circle + Label
│       ├── Connector Line
│       ├── Step 3 Circle + Label
│       ├── Connector Line
│       └── Step 4 Circle + Label
│
├── Card (Shadcn UI)
│   └── CardContent
│       │
│       ├── [Step 1] WelcomeStep
│       │   ├── Hero Icon (Car with Checkmark)
│       │   ├── Welcome Heading
│       │   ├── Description
│       │   ├── Process Overview
│       │   │   ├── Step Preview 1 (Vehicle)
│       │   │   ├── Step Preview 2 (Location)
│       │   │   └── Step Preview 3 (Search)
│       │   ├── Time Estimate Badge
│       │   ├── CTA Button "Let's Get Started"
│       │   └── Skip Link "I'll do this later"
│       │
│       ├── [Step 2] VehicleStep
│       │   ├── Header
│       │   │   ├── Icon (Car)
│       │   │   ├── Title
│       │   │   └── Description
│       │   ├── Form
│       │   │   ├── Registration Input
│       │   │   │   ├── Input Field
│       │   │   │   ├── Loading Spinner (conditional)
│       │   │   │   └── Success Checkmark (conditional)
│       │   │   ├── Make Input
│       │   │   ├── Model Input
│       │   │   ├── Year Select
│       │   │   ├── Fuel Type Select
│       │   │   └── Action Buttons
│       │   │       ├── Back Button
│       │   │       └── Continue Button
│       │   └── Error Messages (conditional)
│       │
│       ├── [Step 3] LocationStep
│       │   ├── Header
│       │   │   ├── Icon (MapPin)
│       │   │   ├── Title
│       │   │   └── Description
│       │   ├── Location Options
│       │   │   ├── Option 1: GPS Location
│       │   │   │   ├── Icon (Navigation)
│       │   │   │   ├── Title
│       │   │   │   ├── Description
│       │   │   │   └── "Use My Location" Button
│       │   │   ├── Divider ("or")
│       │   │   └── Option 2: Postcode Entry
│       │   │       ├── Icon (MapPin)
│       │   │       ├── Title
│       │   │       ├── Description
│       │   │       ├── Postcode Input
│       │   │       └── "Search by Postcode" Button
│       │   ├── Error Message (conditional)
│       │   ├── Privacy Notice
│       │   └── Back Button
│       │
│       └── [Step 4] SearchStep
│           ├── Header
│           │   ├── Icon (Search)
│           │   ├── Title
│           │   └── Description
│           ├── Search Options
│           │   ├── Quick Search (Recommended)
│           │   │   ├── Icon (Search)
│           │   │   ├── Title
│           │   │   ├── Description
│           │   │   └── "Search All Garages" Button
│           │   ├── Divider ("or set preferences")
│           │   └── Detailed Search
│           │       ├── Date Picker
│           │       │   ├── Popover Trigger
│           │       │   └── Calendar Component
│           │       ├── Time Slot Selector
│           │       │   └── Grid of Time Buttons
│           │       └── "Search with Preferences" Button
│           ├── Location Summary
│           └── Back Button
│
└── Help Text (Support contact)
```

## Component Dependencies

### External Libraries
```
next/navigation
├── useRouter
└── useSearchParams

next-auth/react
└── useSession

lucide-react
├── Car
├── MapPin
├── Navigation
├── Calendar
├── Clock
├── Search
├── CheckCircle
├── AlertCircle
├── Loader2
├── ArrowRight
└── Check

date-fns
└── format

@/components/ui (Shadcn UI)
├── Button
├── Card
├── CardContent
├── Input
├── Label
├── Select
├── Calendar
└── Popover

@/lib
├── utils (cn)
└── validations (createVehicleSchema)

zod
└── z (validation)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    OnboardingPage                           │
│                                                             │
│  State:                                                     │
│  - currentStep: number                                      │
│  - vehicleData: object | null                               │
│  - locationData: object | null                              │
│                                                             │
│  Methods:                                                   │
│  - handleNext()                                             │
│  - handleBack()                                             │
│  - handleVehicleNext(vehicle)                               │
│  - handleLocationNext(location)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────┴───────────────────┐
        │                                       │
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│  WelcomeStep     │                  │  VehicleStep     │
│                  │                  │                  │
│  Props:          │                  │  Props:          │
│  - onNext()      │                  │  - onNext(data)  │
│                  │                  │  - onBack()      │
│  Actions:        │                  │                  │
│  - Click Start   │                  │  Actions:        │
│  - Click Skip    │                  │  - Submit form   │
└──────────────────┘                  │  - API call      │
                                      │  - Pass data up  │
                                      └──────────────────┘
                                                │
                                                ↓
                                      ┌──────────────────┐
                                      │  LocationStep    │
                                      │                  │
                                      │  Props:          │
                                      │  - onNext(data)  │
                                      │  - onBack()      │
                                      │                  │
                                      │  Actions:        │
                                      │  - Get GPS       │
                                      │  - Enter postcode│
                                      │  - Pass data up  │
                                      └──────────────────┘
                                                │
                                                ↓
                                      ┌──────────────────┐
                                      │  SearchStep      │
                                      │                  │
                                      │  Props:          │
                                      │  - locationData  │
                                      │  - onBack()      │
                                      │                  │
                                      │  Actions:        │
                                      │  - Quick search  │
                                      │  - Detailed      │
                                      │  - Redirect      │
                                      └──────────────────┘
```

## State Management

### Parent State (OnboardingPage)
```typescript
{
  currentStep: 1 | 2 | 3 | 4,
  vehicleData: {
    id: string,
    registration: string,
    make: string,
    model: string,
    year: number,
    fuelType: string,
    // ... other fields
  } | null,
  locationData: {
    postcode?: string,
    lat?: number,
    lng?: number
  } | null
}
```

### Child State Examples

**VehicleStep:**
```typescript
{
  formData: {
    registration: string,
    make: string,
    model: string,
    year: number,
    fuelType: string,
    color: string,
    engineSize: string
  },
  errors: Record<string, string>,
  loading: boolean,
  validatingReg: boolean,
  lookupSuccess: boolean
}
```

**LocationStep:**
```typescript
{
  postcode: string,
  error: string,
  loadingLocation: boolean,
  locationMethod: 'none' | 'gps' | 'postcode'
}
```

**SearchStep:**
```typescript
{
  date: Date | undefined,
  time: string,
  searching: boolean
}
```

## Event Flow

### Step 1 → Step 2
```
User clicks "Let's Get Started"
    ↓
WelcomeStep.onNext() called
    ↓
OnboardingPage.handleNext() executed
    ↓
currentStep updated: 1 → 2
    ↓
VehicleStep rendered
```

### Step 2 → Step 3
```
User submits vehicle form
    ↓
VehicleStep validates form
    ↓
API call: POST /api/vehicles
    ↓
Response received with vehicle data
    ↓
VehicleStep.onNext(vehicleData) called
    ↓
OnboardingPage.handleVehicleNext(vehicleData) executed
    ↓
vehicleData state updated
    ↓
currentStep updated: 2 → 3
    ↓
LocationStep rendered
```

### Step 3 → Step 4
```
User selects location method
    ↓
GPS: navigator.geolocation.getCurrentPosition()
OR
Postcode: User enters and validates
    ↓
LocationStep.onNext(locationData) called
    ↓
OnboardingPage.handleLocationNext(locationData) executed
    ↓
locationData state updated
    ↓
currentStep updated: 3 → 4
    ↓
SearchStep rendered with locationData prop
```

### Step 4 → Search Results
```
User clicks search button
    ↓
SearchStep builds URL parameters
    ↓
router.push('/search-results?params')
    ↓
User redirected to search results page
```

## Styling Architecture

### Tailwind Classes Used

**Layout:**
- `flex`, `flex-col`, `flex-row`
- `grid`, `grid-cols-*`
- `max-w-*`, `w-full`
- `px-*`, `py-*`, `gap-*`

**Responsive:**
- `md:*` - Desktop breakpoint
- `lg:*` - Large desktop

**Colors:**
- `bg-primary`, `text-primary`
- `bg-muted`, `text-muted-foreground`
- `bg-background`, `text-foreground`
- `border-border`

**Interactive:**
- `hover:*`
- `disabled:*`
- `transition-*`
- `animate-*`

**Custom Components:**
- Uses Shadcn UI base styles
- Extends with Tailwind utilities
- Maintains design system consistency

## File Size Analysis

```
Component                    Lines    Size (KB)
─────────────────────────────────────────────
progress-indicator.tsx       107      ~3.5
welcome-step.tsx             113      ~4.0
vehicle-step.tsx             300      ~11.0
location-step.tsx            200      ~7.5
search-step.tsx              230      ~8.5
page.tsx                     160      ~5.5
─────────────────────────────────────────────
Total                        1,110    ~40.0
```

## Performance Considerations

1. **Code Splitting**
   - Each step is a separate component
   - Only current step is rendered
   - Reduces initial bundle size

2. **Lazy Loading**
   - Components loaded on demand
   - Images optimized with Next.js Image

3. **State Management**
   - Minimal state in parent
   - Local state in children
   - No unnecessary re-renders

4. **API Calls**
   - Only when needed
   - Proper loading states
   - Error handling

5. **Animations**
   - CSS transitions (performant)
   - No heavy JavaScript animations
   - Smooth 60fps transitions

