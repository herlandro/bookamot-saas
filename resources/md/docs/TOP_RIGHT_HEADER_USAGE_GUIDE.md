# Top-Right Header - Usage Guide

## Quick Start

The top-right header is automatically included in all pages using `MainLayout` or `GarageLayout`.

### For Developers

#### Using in a Layout

```tsx
import { TopRightHeader } from '@/components/ui/top-right-header'

export function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-end p-4">
        <TopRightHeader />
      </div>
      {children}
    </div>
  )
}
```

#### Using Individual Components

```tsx
import { AvatarDropdown } from '@/components/ui/avatar-dropdown'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageSelector } from '@/components/ui/language-selector'

export function CustomHeader() {
  return (
    <div className="flex gap-3">
      <LanguageSelector />
      <ThemeToggle />
      <AvatarDropdown />
    </div>
  )
}
```

---

## Component APIs

### TopRightHeader

**Props:**
```typescript
interface TopRightHeaderProps {
  className?: string
}
```

**Example:**
```tsx
<TopRightHeader className="px-4 py-2" />
```

**Features:**
- Automatically hides if user not authenticated
- Responsive gap (8px mobile, 12px desktop)
- Combines all three components

---

### AvatarDropdown

**Props:**
```typescript
interface AvatarDropdownProps {
  className?: string
}
```

**Example:**
```tsx
<AvatarDropdown className="ml-4" />
```

**Features:**
- Displays user initials
- Dropdown menu with Profile, Settings, Logout
- Integrates with NextAuth
- Responsive design

**Menu Items:**
- Profile → `/profile`
- Settings → `/settings`
- Logout → Signs out and redirects to `/signin`

---

### ThemeToggle

**Props:**
```typescript
interface ThemeToggleProps {
  // No props - uses next-themes context
}
```

**Example:**
```tsx
<ThemeToggle />
```

**Features:**
- Toggles between light and dark mode
- Uses next-themes
- Persists to localStorage
- Smooth animations

**Themes:**
- `light` - Light mode
- `dark` - Dark mode
- `system` - System preference (default)

---

### LanguageSelector

**Props:**
```typescript
interface LanguageSelectorProps {
  className?: string
}
```

**Example:**
```tsx
<LanguageSelector className="mr-2" />
```

**Features:**
- Dropdown with language options
- Persists to localStorage
- Detects browser language
- Dispatches custom event

**Supported Languages:**
- `en` - English (🇬🇧)
- `pt` - Português (🇵🇹)

**Custom Event:**
```typescript
window.addEventListener('languageChange', (e: CustomEvent) => {
  const language = e.detail.language // 'en' or 'pt'
  console.log('Language changed to:', language)
})
```

---

## Styling & Customization

### Tailwind Classes

All components use Tailwind CSS classes. Customize by modifying:

1. **Component Files:**
   - `src/components/ui/avatar-dropdown.tsx`
   - `src/components/ui/language-selector.tsx`
   - `src/components/ui/theme-toggle.tsx`
   - `src/components/ui/top-right-header.tsx`

2. **Global Styles:**
   - `src/app/globals.css` - Color variables

### Color Variables

```css
/* Light Mode */
--primary: #3b82f6
--background: #ffffff
--foreground: #1f2937
--border: #e5e7eb
--muted: #f3f4f6

/* Dark Mode */
--primary: #60a5fa
--background: #111827
--foreground: #f9fafb
--border: #374151
--muted: #1f2937
```

### Custom Styling Example

```tsx
<TopRightHeader className="bg-muted p-2 rounded-lg" />
```

---

## Integration Examples

### With Custom Header

```tsx
import { TopRightHeader } from '@/components/ui/top-right-header'

export function CustomHeader() {
  return (
    <header className="bg-background border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">My App</h1>
        <TopRightHeader />
      </div>
    </header>
  )
}
```

### With Navigation

```tsx
import { TopRightHeader } from '@/components/ui/top-right-header'

export function HeaderWithNav() {
  return (
    <div className="flex items-center justify-between">
      <nav className="flex gap-4">
        <a href="/dashboard">Dashboard</a>
        <a href="/bookings">Bookings</a>
      </nav>
      <TopRightHeader />
    </div>
  )
}
```

---

## Handling Language Changes

### Listen for Language Changes

```typescript
useEffect(() => {
  const handleLanguageChange = (e: Event) => {
    const customEvent = e as CustomEvent
    const language = customEvent.detail.language
    
    // Update your app state
    console.log('Language changed to:', language)
    
    // Fetch new translations
    // Update date-fns locale
    // etc.
  }

  window.addEventListener('languageChange', handleLanguageChange)
  
  return () => {
    window.removeEventListener('languageChange', handleLanguageChange)
  }
}, [])
```

### Get Current Language

```typescript
const currentLanguage = localStorage.getItem('language') || 'en'
```

---

## Handling Theme Changes

### Listen for Theme Changes

```typescript
import { useTheme } from 'next-themes'

export function MyComponent() {
  const { theme } = useTheme()
  
  useEffect(() => {
    console.log('Current theme:', theme)
  }, [theme])
  
  return <div>Theme: {theme}</div>
}
```

### Set Theme Programmatically

```typescript
import { useTheme } from 'next-themes'

export function MyComponent() {
  const { setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Set Dark Mode
    </button>
  )
}
```

---

## Troubleshooting

### Header Not Showing

**Issue:** TopRightHeader not visible

**Solutions:**
1. Check if user is authenticated: `useSession()`
2. Verify SessionProvider is in layout
3. Check browser console for errors

### Dropdown Not Opening

**Issue:** Dropdown menu doesn't open

**Solutions:**
1. Check z-index conflicts
2. Verify click handler is working
3. Check for event propagation issues

### Language Not Persisting

**Issue:** Language selection resets on page reload

**Solutions:**
1. Check localStorage is enabled
2. Verify browser privacy settings
3. Check for localStorage quota issues

### Theme Not Changing

**Issue:** Theme toggle doesn't work

**Solutions:**
1. Verify ThemeProvider is in layout
2. Check next-themes configuration
3. Verify CSS variables are defined

---

## Performance Tips

1. **Lazy Load Dropdowns:** Dropdowns render on demand
2. **Memoization:** Components are optimized
3. **Event Delegation:** Uses single backdrop for all dropdowns
4. **CSS Transitions:** Hardware-accelerated animations

---

## Accessibility Checklist

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support (aria-label, title)
- ✅ Focus management
- ✅ Color contrast (WCAG AA)
- ✅ Semantic HTML
- ✅ ARIA roles

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | Latest  | ✅ Full support |
| Firefox | Latest  | ✅ Full support |
| Safari  | Latest  | ✅ Full support |
| Edge    | Latest  | ✅ Full support |
| Mobile  | Latest  | ✅ Full support |

---

## Related Documentation

- [TOP_RIGHT_HEADER_IMPLEMENTATION.md](TOP_RIGHT_HEADER_IMPLEMENTATION.md) - Technical details
- [TOP_RIGHT_HEADER_VISUAL_GUIDE.md](TOP_RIGHT_HEADER_VISUAL_GUIDE.md) - Visual reference
- [design-guidelines.md](design-guidelines.md) - Design system

---

**Version:** 1.0
**Last Updated:** Outubro 21, 2025

