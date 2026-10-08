# CivicAI Fixes and Features Progress

## 1. Contrast and Theme Bug
- [ ] Define SEMANTIC tokens that flip per theme
- [ ] Default theme LIGHT, persist choice, add `data-theme` on `<html>`, inline script to prevent flash
- [ ] Hero overlay for guaranteed contrast
- [ ] Text on glass meets AA contrast
- [ ] Playwright contrast check script (`npm run test:contrast`)
- [ ] Hero preview uses real data

## 2. Real, Separate Pages
- [ ] Every nav item is a distinct route
- [ ] Scroll to top, animated transitions
- [ ] Update public nav, build `/how-it-works`, `/about`
- [ ] Dashboards: distinct routes for sidebar items
- [ ] Redirect logic (`?next=<path>`)

## 3. Login Fix
- [ ] Fix backend auth if needed (CORS, cookies)
- [ ] Client axios interceptors (withCredentials, refresh loops)
- [ ] Remove spoofing, prefill demo accounts
- [ ] App bootstrap (`/auth/me`)
- [ ] UX: field-errors, loading state
- [ ] Playwright e2e login test

## 4. Location System
- [ ] `LocationProvider` (Zustand + localStorage)
- [ ] Location UI pill + Map/search popover
- [ ] Backend geo-filter params
- [ ] Additional seed data (Delhi, Mumbai, etc.)
- [ ] Components react instantly to location changes

## 5. Issue Map Page
- [ ] Leaflet map, clustering, severity colors
- [ ] Layers toggle
- [ ] Left glass panel with filters
- [ ] Detail drawer + "Me too"
- [ ] Long-press to drop pin & report
- [ ] Backend `/api/public/map/complaints` endpoint
- [ ] Track page integration
