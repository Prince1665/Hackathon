# Smart E-Waste Management System - Design System

## 🎨 Unified Design System

This document outlines the consistent design patterns used throughout the Smart E-Waste Management System to ensure a cohesive user experience across all pages.

## 🌈 Color Palette

### Primary Colors
- **Primary Green**: `#3e5f44` - Main text, headings, primary actions
- **Secondary Green**: `#9ac37e` - Accents, highlights, success states
- **Light Green**: `#9ac37e/5` to `#9ac37e/30` - Backgrounds, borders, subtle highlights

### Usage Guidelines
- Use `text-[#3e5f44]` for main headings and important text
- Use `text-[#3e5f44]/70` for secondary text and descriptions
- Use `text-[#3e5f44]/60` for muted text and labels
- Use `bg-[#9ac37e]` for primary buttons and active states
- Use `border-[#9ac37e]/20` for card borders
- Use `bg-gradient-to-b from-[#9ac37e]/5 to-transparent` for page backgrounds

## 🏗️ Layout Structure

### Page Layout Pattern
```tsx
<main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
  <AppNav />
  <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 max-w-7xl">
    {/* Page content */}
  </section>
</main>
```

### Page Headers
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-[#3e5f44] mb-2">Page Title</h1>
  <p className="text-[#3e5f44]/70">Page description</p>
</div>
```

## 🃏 Card Components

### Standard Card
```tsx
<Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
  <CardHeader>
    <CardTitle className="text-[#3e5f44] text-lg sm:text-xl font-bold">Card Title</CardTitle>
    <CardDescription className="text-[#3e5f44]/70">Card description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

### Metric Cards (for dashboards)
```tsx
<div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
  <div className="text-xs text-[#3e5f44]/70 font-medium">Metric Label</div>
  <div className="text-2xl font-bold text-[#3e5f44]">Metric Value</div>
  <div className="text-xs text-[#3e5f44]/60">Additional info</div>
</div>
```

## 📑 Tab Components

### Standard Tabs
```tsx
<Tabs defaultValue="tab1" className="space-y-6">
  <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto bg-[#9ac37e]/10 border-2 border-[#3e5f44] rounded-none">
    <TabsTrigger value="tab1" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Tab 3</TabsTrigger>
  </TabsList>
  
  <TabsContent value="tab1" className="space-y-4">
    {/* Tab content */}
  </TabsContent>
</Tabs>
```

## 🔘 Button Components

### Primary Button
```tsx
<Button className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white">
  Primary Action
</Button>
```

### Secondary Button
```tsx
<Button variant="outline" className="border-[#9ac37e] text-[#3e5f44] hover:bg-[#9ac37e]/10">
  Secondary Action
</Button>
```

## 🏷️ Badge Components

### Status Badges
```tsx
<Badge className="bg-[#9ac37e] text-white hover:bg-[#8bb56f]">Active</Badge>
<Badge variant="secondary">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
```

## 📝 Form Components

### Input Fields
- Use standard shadcn/ui Input components
- Labels should use `text-[#3e5f44]`
- Error messages should use `text-red-600`

### Form Layout
```tsx
<div className="grid gap-4">
  <div className="grid gap-2">
    <Label htmlFor="field" className="text-[#3e5f44]">Field Label</Label>
    <Input id="field" placeholder="Placeholder text" />
  </div>
</div>
```

## 🚨 Alert Components

### Information Highlights
```tsx
<div className="bg-gradient-to-r from-[#9ac37e]/10 to-transparent border border-[#9ac37e]/30 rounded-lg p-4">
  <h4 className="font-semibold text-[#3e5f44] mb-2">Information Title</h4>
  <p className="text-[#3e5f44]/80">Information content</p>
</div>
```

## 📱 Responsive Design

### Breakpoints
- Use `sm:` for small screens (640px+)
- Use `md:` for medium screens (768px+)
- Use `lg:` for large screens (1024px+)

### Grid Patterns
- Cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Metrics: `grid grid-cols-1 md:grid-cols-4 gap-4`
- Forms: `grid grid-cols-1 sm:grid-cols-2 gap-4`

## 🎯 Consistency Checklist

When creating or updating pages, ensure:

- [ ] Uses the standard page layout structure
- [ ] Includes AppNav component
- [ ] Uses consistent color palette
- [ ] Cards have proper border and shadow styling
- [ ] Tabs follow the standard pattern
- [ ] Buttons use consistent styling
- [ ] Text hierarchy follows the color guidelines
- [ ] Responsive design is implemented
- [ ] Hover effects are consistent
- [ ] Loading states match the design system

## 🔄 Implementation Status

### ✅ Updated Pages
- Vendor Auctions (`/vendor/auctions`)
- Admin Auctions (`/admin/auctions`) - Partially updated

### 🔄 Pages to Update
- Admin Dashboard (`/admin`)
- Vendor Dashboard (`/vendor/scan`)
- User Pages
- Login/Signup Pages

This design system ensures a professional, cohesive user experience across all pages of the Smart E-Waste Management System.
