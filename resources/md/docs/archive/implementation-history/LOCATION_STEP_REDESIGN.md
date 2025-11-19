# Location Step Redesign - Side-by-Side Layout

## Overview

The location step in the onboarding flow has been redesigned with a cleaner, more intuitive side-by-side interface that allows users to either enter a postcode OR use their current location via GPS.

## Changes Made

### File Modified
- `src/components/onboarding/location-step.tsx`

### Design Changes

#### Before (Old Design)
- Two separate card sections stacked vertically
- "Use my current location" button in first card
- "OR" divider
- "Enter your postcode" form in second card
- Each option had its own submit button

#### After (New Design)
- Single unified card with side-by-side layout
- **Left side:** Postcode input field
- **Right side:** "Use my current location" checkbox
- Single "Search" button at the bottom
- Mutually exclusive options (selecting one disables the other)
- Responsive: stacks vertically on mobile devices

---

## Features

### 1. Side-by-Side Layout

**Desktop (≥1024px):**
```
┌─────────────────────────────────────────────────────┐
│  Enter your postcode    │    Or use GPS             │
│  ┌──────────────────┐   │  ☐ Use my current location│
│  │ SW1A 1AA         │   │                           │
│  └──────────────────┘   │                           │
│  Type in your postcode  │  Automatically find...    │
└─────────────────────────────────────────────────────┘
```

**Mobile (<1024px):**
```
┌─────────────────────────┐
│  Enter your postcode    │
│  ┌──────────────────┐   │
│  │ SW1A 1AA         │   │
│  └──────────────────┘   │
│  Type in your postcode  │
├─────────────────────────┤
│  Or use GPS             │
│  ☐ Use my current loc.  │
│  Automatically find...  │
└─────────────────────────┘
```

### 2. Mutually Exclusive Options

**When user types in postcode:**
- Checkbox automatically unchecks
- User can continue typing

**When user checks "Use my current location":**
- Postcode input is cleared
- Postcode input is disabled (grayed out)
- User cannot type in postcode field

### 3. Visual Feedback

**Icons:**
- 📍 MapPin icon for postcode input
- 🧭 Navigation icon for GPS location
- ⚠️ AlertCircle icon for errors
- ⏳ Loader2 icon for loading state

**States:**
- **Default:** Both options enabled
- **Typing postcode:** Checkbox unchecked, input active
- **Checkbox selected:** Input disabled and grayed out
- **Loading location:** Both options disabled, spinner shown
- **Error:** Red error message displayed

### 4. Single Submit Button

**Button text changes based on selection:**
- Postcode entered: "Search"
- Location checkbox: "Search Nearby"
- Loading: "Getting Location..."

**Button is disabled when:**
- No postcode entered AND checkbox not selected
- Currently loading location

---

## Component Structure

### State Management

```typescript
const [postcode, setPostcode] = useState('')
const [error, setError] = useState('')
const [loadingLocation, setLoadingLocation] = useState(false)
const [useCurrentLocation, setUseCurrentLocation] = useState(false)
```

### Key Functions

#### `handleLocationCheckboxChange(checked: boolean)`
- Updates checkbox state
- Clears postcode when checked
- Clears any errors

#### `handlePostcodeChange(value: string)`
- Updates postcode value (uppercase)
- Unchecks location checkbox if typing
- Clears any errors

#### `handleSubmit(e: React.FormEvent)`
- Handles form submission
- If checkbox selected: requests geolocation
- If postcode entered: validates and submits postcode
- Shows appropriate errors

---

## User Experience Flow

### Scenario 1: User Enters Postcode

1. User types "SW1A 1AA" in postcode field
2. Checkbox automatically unchecks (if it was checked)
3. User clicks "Search" button
4. Postcode is validated
5. If valid: proceeds to next step
6. If invalid: shows error message

### Scenario 2: User Uses Current Location

1. User checks "Use my current location" checkbox
2. Postcode field is cleared and disabled
3. User clicks "Search Nearby" button
4. Browser requests location permission
5. If granted: gets coordinates and proceeds
6. If denied: shows error, unchecks checkbox, enables postcode input

### Scenario 3: User Changes Mind

**From postcode to location:**
1. User types postcode
2. User checks location checkbox
3. Postcode is cleared
4. Input is disabled

**From location to postcode:**
1. User checks location checkbox
2. User starts typing in postcode field
3. Checkbox automatically unchecks
4. Input is enabled

---

## Validation

### Postcode Validation

**Regex:** `/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i`

**Valid examples:**
- `SW1A 1AA`
- `M1 1AE`
- `B33 8TH`
- `CR2 6XH`
- `DN55 1PT`

**Invalid examples:**
- `123456` (no letters)
- `ABCD` (no numbers)
- `SW1A` (incomplete)

### Geolocation Validation

**Checks:**
- Browser supports geolocation API
- User grants permission
- Location acquired within 10 seconds
- Coordinates are valid

**Error handling:**
- Browser not supported: "Geolocation is not supported by your browser"
- Permission denied: "Unable to get your location. Please enter your postcode instead."
- Timeout: Same as permission denied

---

## Styling

### Layout Classes

**Container:**
- `max-w-3xl` - Wider container for side-by-side layout
- `mx-auto` - Centered
- `px-4 py-6` - Padding

**Grid:**
- `grid grid-cols-1 lg:grid-cols-2` - 1 column mobile, 2 columns desktop
- `gap-6` - Spacing between columns

**Input:**
- `h-14` - Taller input for better touch targets
- `text-lg` - Larger text for readability
- `opacity-50` - Disabled state

**Checkbox Container:**
- `h-14` - Same height as input for alignment
- `border-2` - Prominent border
- `hover:border-primary/50` - Hover effect

### Responsive Breakpoints

- **Mobile:** `< 1024px` - Stacked layout
- **Desktop:** `≥ 1024px` - Side-by-side layout

### Dark Mode Support

All colors use Tailwind's dark mode variants:
- `bg-card` - Card background
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `border-border` - Borders
- `bg-red-50 dark:bg-red-950/20` - Error background
- `bg-blue-50 dark:bg-blue-950/20` - Info background

---

## Accessibility

### Keyboard Navigation

- ✅ Tab through all interactive elements
- ✅ Enter to submit form
- ✅ Space to toggle checkbox
- ✅ Focus visible on all elements

### Screen Readers

- ✅ Labels associated with inputs
- ✅ Error messages announced
- ✅ Loading state announced
- ✅ Checkbox state announced

### ARIA Attributes

- `htmlFor` on labels
- `id` on inputs
- `disabled` state properly set
- `aria-label` on icons (implicit via Lucide)

---

## Testing Checklist

### Functional Tests

- [ ] Can enter postcode and submit
- [ ] Can check location checkbox and submit
- [ ] Postcode clears when checkbox is checked
- [ ] Checkbox unchecks when typing postcode
- [ ] Validation works for invalid postcodes
- [ ] Geolocation permission request works
- [ ] Error shows when location denied
- [ ] Loading state shows during geolocation
- [ ] Submit button disabled when no input
- [ ] Back button works

### Visual Tests

- [ ] Layout is side-by-side on desktop
- [ ] Layout stacks on mobile
- [ ] Icons display correctly
- [ ] Colors match design system
- [ ] Dark mode works
- [ ] Hover states work
- [ ] Disabled states are visible
- [ ] Error messages are readable

### Responsive Tests

- [ ] Works on mobile (< 640px)
- [ ] Works on tablet (640px - 1024px)
- [ ] Works on desktop (> 1024px)
- [ ] Touch targets are large enough (44px minimum)

---

## Code Example

### Basic Usage

```tsx
import { LocationStep } from '@/components/onboarding/location-step'

function OnboardingFlow() {
  const handleLocationNext = (locationData) => {
    console.log('Location data:', locationData)
    // locationData can be:
    // { postcode: 'SW1A 1AA' } OR
    // { lat: 51.5074, lng: -0.1278 }
  }

  const handleBack = () => {
    console.log('Going back')
  }

  return (
    <LocationStep
      onNext={handleLocationNext}
      onBack={handleBack}
    />
  )
}
```

### Data Structure

**Postcode submission:**
```typescript
{
  postcode: 'SW1A 1AA'
}
```

**GPS location submission:**
```typescript
{
  lat: 51.5074,
  lng: -0.1278
}
```

---

## Future Enhancements

### Potential Improvements

1. **Autocomplete for postcodes**
   - Integrate with postcode API
   - Show suggestions as user types

2. **Show current location on map**
   - Display small map preview
   - Show approximate area

3. **Remember last used method**
   - Save preference in localStorage
   - Pre-select on next visit

4. **Distance radius selector**
   - Allow user to specify search radius
   - Default: 10 miles

5. **Location accuracy indicator**
   - Show GPS accuracy
   - Warn if accuracy is low

---

## Browser Compatibility

### Geolocation API Support

- ✅ Chrome 5+
- ✅ Firefox 3.5+
- ✅ Safari 5+
- ✅ Edge 12+
- ✅ iOS Safari 3.2+
- ✅ Android Browser 2.1+

### Fallback

If geolocation is not supported:
- Error message shown
- Postcode input remains available
- User can still complete flow

---

## Summary

### Key Improvements

1. ✅ **Cleaner layout** - Side-by-side design is more modern
2. ✅ **Better UX** - Mutually exclusive options prevent confusion
3. ✅ **Single action** - One submit button instead of two
4. ✅ **Visual clarity** - Icons and labels make options clear
5. ✅ **Mobile friendly** - Responsive design works on all devices
6. ✅ **Accessible** - Keyboard navigation and screen reader support

### Files Changed

- ✅ `src/components/onboarding/location-step.tsx` - Complete redesign

### Status

✅ **COMPLETE** - Ready for testing and deployment

---

**Test the new design at:** http://localhost:3000/onboarding (Step 3)

