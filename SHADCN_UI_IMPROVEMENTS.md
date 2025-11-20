# ShadCN UI Improvement Opportunities

Based on your codebase analysis, here are the key areas where ShadCN UI components can improve consistency, accessibility, and maintainability:

## 🔴 High Priority Improvements

### 1. **Modals/Dialogs** → Use `Dialog`
**Current Issues:**
- Manual body scroll locking
- Manual escape key handling
- Inconsistent styling
- Accessibility concerns

**Files to Update:**
- `frontend/app/components/RSVPModal.tsx` - Replace custom modal with `Dialog`
- `frontend/app/components/SessionManager.tsx` - Replace custom dialog with `Dialog`
- `frontend/app/admin/page.tsx` (lines 730-743) - Replace custom modal with `Dialog`

**Benefits:**
- Built-in accessibility (ARIA attributes, focus management)
- Consistent behavior across all modals
- Less code to maintain

---

### 2. **Buttons** → Use `Button`
**Current Issues:**
- Inconsistent button styles throughout
- Manual disabled states
- Variant management scattered

**Files to Update:**
- All pages with custom button classes (shop, events, admin, etc.)
- Replace patterns like:
  ```tsx
  className="bg-crimson text-white px-6 py-3 rounded-lg font-semibold hover:bg-crimson/90"
  ```
  With:
  ```tsx
  <Button variant="default" className="bg-crimson hover:bg-crimson/90">
  ```

**Benefits:**
- Consistent button variants (default, destructive, outline, ghost, link)
- Built-in disabled states
- Better TypeScript support

---

### 3. **Toasts/Notifications** → Use `Toast` (via `sonner` or `@radix-ui/react-toast`)
**Current Issues:**
- Using `alert()` for user feedback (RSVPModal line 54, admin page line 98)
- No persistent notifications
- Poor UX for success/error messages

**Files to Update:**
- `frontend/app/components/RSVPModal.tsx` - Replace `alert()` with toast
- `frontend/app/admin/page.tsx` - Replace `alert()` with toast
- All form submissions should use toast notifications

**Benefits:**
- Non-blocking notifications
- Better UX
- Stackable toasts
- Auto-dismiss

---

### 4. **Form Inputs** → Use `Input`, `Label`, `Textarea`
**Current Issues:**
- Inconsistent input styling
- Manual label associations
- Repeated focus ring patterns

**Files to Update:**
- `frontend/app/components/RSVPModal.tsx` - Form inputs
- `frontend/app/apply/page.tsx` - All form fields
- `frontend/app/register/page.tsx` - All form fields
- `frontend/app/steward-setup/page.tsx` - Form inputs
- `frontend/app/login/page.tsx` - Form inputs

**Benefits:**
- Consistent styling
- Better accessibility
- Built-in error states

---

### 5. **Select/Dropdown** → Use `Select` or `Combobox`
**Current Issues:**
- Custom `SearchableSelect` component (182 lines)
- Could be replaced with ShadCN `Combobox` or `Command` component
- More maintainable and accessible

**Files to Update:**
- `frontend/app/components/SearchableSelect.tsx` - Consider replacing with `Combobox`
- All usages of `SearchableSelect` throughout the app

**Benefits:**
- Better keyboard navigation
- Built-in search functionality
- More accessible
- Less custom code

---

## 🟡 Medium Priority Improvements

### 6. **Tabs** → Use `Tabs`
**Current Issues:**
- Custom tab implementation in admin dashboard
- Manual active state management

**Files to Update:**
- `frontend/app/admin/page.tsx` (line 29) - Replace custom tabs with `Tabs`

**Benefits:**
- Built-in keyboard navigation
- Better accessibility
- Consistent styling

---

### 7. **Tooltips** → Use `Tooltip`
**Current Issues:**
- Custom tooltip implementation in `VerificationStatusBadge.tsx`
- Manual positioning and show/hide logic

**Files to Update:**
- `frontend/app/components/VerificationStatusBadge.tsx` (lines 96-106)

**Benefits:**
- Better positioning
- Accessibility built-in
- Less code

---

### 8. **Cards** → Use `Card`
**Current Issues:**
- Custom card implementations throughout
- Inconsistent padding/spacing

**Files to Update:**
- Product cards
- Event cards
- Profile cards
- Admin dashboard cards

**Benefits:**
- Consistent card styling
- Built-in variants (header, content, footer)

---

### 9. **Badges** → Use `Badge`
**Current Issues:**
- Custom badge implementations
- `VerificationBadge`, `VerificationStatusBadge` could use `Badge` as base

**Files to Update:**
- `frontend/app/components/VerificationBadge.tsx`
- `frontend/app/components/VerificationStatusBadge.tsx`

**Benefits:**
- Consistent badge styling
- Built-in variants

---

### 10. **Skeleton/Loading** → Use `Skeleton`
**Current Issues:**
- Custom `Skeleton` component exists
- Could be replaced with ShadCN `Skeleton` for consistency

**Files to Update:**
- `frontend/app/components/Skeleton.tsx` - Consider using ShadCN version

**Benefits:**
- Consistent loading states
- Better animations

---

## 🟢 Low Priority Improvements

### 11. **Popover** → Use `Popover`
**Potential Use Cases:**
- User menu dropdown in Header
- Filter options
- Action menus

---

### 12. **Alert** → Use `Alert`
**Current Issues:**
- Custom alert implementations for errors/warnings
- Inconsistent styling

**Files to Update:**
- Error messages in forms
- Warning messages (steward-setup, apply pages)

**Benefits:**
- Consistent alert styling
- Built-in variants (default, destructive, warning)

---

### 13. **Separator** → Use `Separator`
**Current Issues:**
- Using `<div className="border-t">` for dividers
- Inconsistent spacing

**Benefits:**
- Consistent separator styling
- Better semantic HTML

---

### 14. **Sheet** → Use `Sheet` (for mobile menus)
**Potential Use Cases:**
- Mobile navigation menu
- Mobile filters
- Side panels

---

## 📋 Implementation Priority

1. **Start with Toasts** - Quick win, improves UX immediately
2. **Replace RSVPModal** - Already using Dialog pattern, easy migration
3. **Standardize Buttons** - High impact, used everywhere
4. **Form Inputs** - Improves consistency across all forms
5. **SessionManager Dialog** - Replace custom dialog
6. **Admin Modal** - Replace custom modal
7. **Tabs in Admin** - Better UX for admin dashboard
8. **Tooltips** - Better accessibility
9. **Cards** - Consistency improvement
10. **Badges** - Consistency improvement

---

## 🚀 Quick Wins

### Install Additional ShadCN Components:
```bash
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add tabs
npx shadcn@latest add tooltip
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add combobox
npx shadcn@latest add sheet
```

---

## 💡 Notes

- Your `SearchableSelect` is actually quite good - consider keeping it if it has features ShadCN Combobox doesn't
- Some custom components (like `RoleDiamondBadge`) are brand-specific and should stay custom
- Focus on components that improve accessibility and reduce code duplication
- Test thoroughly after each migration to ensure styling matches your design system





