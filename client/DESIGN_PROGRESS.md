# CivicAI Design Overhaul Progress

## Phase 2/3: Warm Editorial Glass

- [ ] **Step 1: Foundation (Tokens, Fonts, Background)**
  - [ ] Define CSS variables in `index.css` (@theme)
  - [ ] Import "Inter" and "Instrument Serif"
  - [ ] Build luminous warm light-flare background with slow drift
  - [ ] Write and run automated contrast check script for token pairs

- [ ] **Step 2: Core Components & Motion**
  - [ ] Create `src/lib/motion.ts` (spring defaults, page transitions, staggers)
  - [ ] Rebuild `GlassCard` (shadows, inset highlights)
  - [ ] Rebuild `Button` (accent, glass, ghost, lift/scale animations)
  - [ ] Rebuild `Input`, `Badge` (semantic colors)

- [ ] **Step 3: Layouts & Navigation**
  - [ ] `PublicLayout`: Floating pill navbar (shrinks on scroll), Footer
  - [ ] `DashboardLayout`: Glass sidebar, active pill, mobile bottom bar

- [ ] **Step 4: Home Page (10 Sections)**
  - [ ] 1. Hero (serif italic, product preview)
  - [ ] 2. Trust Strip (live stats)
  - [ ] 3. The Problem
  - [ ] 4. How It Works (sticky scroll)
  - [ ] 5. Inside the Platform (role switcher)
  - [ ] 6. AI Features Bento Grid
  - [ ] 7. Recently Resolved Carousel
  - [ ] 8. Live City Map
  - [ ] 9. Impact (SDG)
  - [ ] 10. FAQ & CTA

- [ ] **Step 5: Other Public Pages & Auth**
  - [ ] Split layout Login/Register with demo buttons
  - [ ] Transparency, Track, About, 404

- [ ] **Step 6: Dashboard Refinements**
  - [ ] Clean up per-role navigation (no dead links)
  - [ ] Citizen Overview Layout
  - [ ] Officer, Worker, Admin layouts

- [ ] **Step 7: Polish & Review**
  - [ ] Dark mode contrast pass
  - [ ] Responsive audit (375, 768, 1440)
