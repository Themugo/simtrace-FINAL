# Bundle Analysis Report

**Date:** May 30, 2026
**Build:** Production Next.js 15.5.18

---

## Current Bundle Sizes

### Shared JavaScript (First Load JS)
- **Total Shared:** 104 kB
  - chunks/1255-abc23a24f28db767.js: 46.9 kB
  - chunks/4bd1b696-b3885adcb8c7dd24.js: 54.4 kB
  - other shared chunks: 2.93 kB

### Page-Specific First Load JS

| Route | Size | First Load JS | Type |
|-------|------|---------------|------|
| / | 6.43 kB | 114 kB | Static |
| /dashboard | 7.84 kB | 116 kB | Static |
| /devices/[id] | 6.85 kB | 127 kB | Dynamic |
| /advertise | 6.3 kB | 127 kB | Static |
| /alerts | 5.05 kB | 126 kB | Static |
| /imei | 6.64 kB | 124 kB | Static |
| /my-campaigns | 4.57 kB | 125 kB | Static |
| /profile | 5.47 kB | 123 kB | Static |
| /remote-lock | 4.9 kB | 122 kB | Static |
| /evidence | 4.88 kB | 122 kB | Static |
| /ai-assistant | 5.44 kB | 110 kB | Static |
| /pricing | 5.72 kB | 110 kB | Static |
| /telecom-portal | 5.52 kB | 110 kB | Static |
| /login | 4.06 kB | 112 kB | Static |
| /register | 4.84 kB | 113 kB | Static |
| /report | 4.14 kB | 112 kB | Static |
| /reports | 3.71 kB | 111 kB | Static |
| /admin/ads | 4.8 kB | 109 kB | Static |
| /admin/devices | 3.54 kB | 108 kB | Static |
| /admin/revenue | 3.95 kB | 112 kB | Static |
| /admin/users | 3.28 kB | 108 kB | Static |
| /community | 4.03 kB | 108 kB | Static |
| /cross-border | 3.68 kB | 108 kB | Static |
| /blockchain-ledger | 3.12 kB | 107 kB | Static |
| /device-dna | 3.22 kB | 107 kB | Static |
| /financial-dashboard | 2.94 kB | 107 kB | Static |
| /insurance | 3.06 kB | 107 kB | Static |
| /law-enforcement | 4.47 kB | 109 kB | Static |
| /recovery-network | 3.31 kB | 108 kB | Static |
| /status | 3.58 kB | 108 kB | Static |
| /forgot-password | 2.52 kB | 110 kB | Static |
| /reset-password | 4.01 kB | 112 kB | Static |

---

## Analysis

### Strengths
- ✅ Most pages are under 130 kB First Load JS
- ✅ Shared chunks are reasonably sized (46.9 kB and 54.4 kB)
- ✅ Only 1 dynamic route (/devices/[id])
- ✅ All other routes are statically pre-rendered

### Areas for Improvement
1. **Leaflet/React-Leaflet:** These are heavy libraries used in LiveMap component
   - Currently loaded on pages that may not need the map
   - Should be lazy-loaded only when needed

2. **Socket.IO Client:** Used for real-time updates
   - Should be loaded only on pages that need real-time features
   - Currently likely loaded globally

3. **Stripe SDK:** Used for payments
   - Should be loaded only on pricing/payment pages
   - Currently may be loaded globally

4. **Large Shared Chunks:** The 54.4 kB chunk suggests some heavy dependencies are shared across many pages

---

## Optimization Recommendations

### 1. Lazy Load Heavy Components
- **LiveMap:** Already using dynamic imports, but can be optimized further
- **Stripe Elements:** Load only on pricing/payment pages
- **Socket.IO Client:** Load only on dashboard, devices, and alerts pages

### 2. Code Splitting
- Split admin routes into separate chunk
- Split map-related code into separate chunk
- Split payment-related code into separate chunk

### 3. Tree Shaking
- Ensure unused exports from libraries are removed
- Review dependencies for unused code

### 4. Bundle Analysis Tools
- Install @next/bundle-analyzer for detailed analysis
- Identify largest dependencies in each chunk

---

## Next Steps

1. ✅ Build successful - baseline established
2. ⏳ Implement lazy loading for heavy components
3. ⏳ Add route-based code splitting
4. ⏳ Optimize shared chunks
5. ⏳ Re-analyze after optimizations
