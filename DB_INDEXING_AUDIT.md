# Database Indexing Audit Report

**Date:** May 30, 2026
**Database:** MongoDB Atlas (simtrace)
**Audit Scope:** All collections and indexes

---

## Current Indexes Analysis

### ✅ Well-Optimized Collections

#### 1. User Collection
**Current Indexes:**
- `email` (unique) - Essential for authentication
- `apiKey` (sparse) - Good for API key lookups

**Assessment:** ✅ Well-indexed for common queries

---

#### 2. Device Collection
**Current Indexes:**
- `imei` (unique, required) - Essential for device identification
- `deviceKey` (sparse) - Good for device authentication
- `{ owner: 1, status: 1 }` - Excellent for user device list with status filter
- `{ status: 1 }` - Good for admin queries by status

**Assessment:** ✅ Well-indexed for all common use cases

---

#### 3. Ping Collection (Location History)
**Current Indexes:**
- `imei` (required) - Essential for device lookups
- `ts` - Good for time-based queries
- `{ imei: 1, ts: -1 }` - Excellent for device history queries (most recent first)
- `{ imei: 1, simIccid: 1 }` - Excellent for SIM swap detection

**Assessment:** ✅ Well-indexed for location tracking and fraud detection

---

#### 4. Alert Collection
**Current Indexes:**
- `imei` (required) - Essential for device-specific alerts
- `ts` - Good for time-based queries
- `{ imei: 1, ts: -1 }` - Excellent for device alert history
- `{ read: 1, ts: -1 }` - Excellent for dashboard unread count

**Assessment:** ✅ Well-indexed for alert management

---

#### 5. AdEvent Collection
**Current Indexes:**
- `{ ad: 1, ts: -1 }` - Excellent for ad analytics

**Assessment:** ✅ Well-indexed for ad performance tracking

---

#### 6. PasswordReset Collection
**Current Indexes:**
- `token` (unique) - Essential for token lookups
- `{ expiresAt: 1 }` with TTL - Excellent for automatic cleanup

**Assessment:** ✅ Well-indexed with proper TTL

---

### ⚠️ Collections Needing Index Optimization

#### 7. TheftReport Collection
**Current Indexes:**
- `imei` (required) - ✅ Good

**Missing Indexes:**
- ❌ `reportedBy` - Needed for user's theft reports
- ❌ `status` - Needed for filtering by report status
- ❌ `createdAt` - Needed for sorting/recent reports
- ❌ `{ reportedBy: 1, status: 1 }` - Compound index for user reports by status

**Recommendation:** Add indexes for user report queries and status filtering

---

#### 8. Payment Collection
**Current Indexes:**
- None defined

**Missing Indexes:**
- ❌ `user` - Essential for user payment history
- ❌ `status` - Needed for filtering by payment status
- ❌ `createdAt` - Needed for chronological queries
- ❌ `reference` - Needed for payment lookups (M-Pesa/Stripe)
- ❌ `{ user: 1, createdAt: -1 }` - Compound index for user payment history

**Recommendation:** Add indexes for payment tracking and reconciliation

---

#### 9. Ad Collection
**Current Indexes:**
- None defined

**Missing Indexes:**
- ❌ `advertiser` - Needed for advertiser's ad management
- ❌ `status` - Essential for ad serving (only active ads)
- ❌ `placement` - Needed for ad placement queries
- ❌ `targetRoles` - Needed for role-based targeting
- ❌ `targetPlans` - Needed for plan-based targeting
- ❌ `{ status: 1, placement: 1 }` - Compound index for ad serving
- ❌ `{ advertiser: 1, status: 1 }` - Compound index for advertiser management

**Recommendation:** Add indexes for ad serving and management

---

#### 10. Partner Collection
**Current Indexes:**
- `apiKey` (unique, required) - ✅ Excellent for authentication

**Missing Indexes:**
- ❌ `user` - Needed for user-partner relationship
- ❌ `status` - Needed for filtering active partners
- ❌ `orgType` - Needed for partner type queries
- ❌ `{ status: 1, orgType: 1 }` - Compound index for partner filtering

**Recommendation:** Add indexes for partner management

---

#### 11. Plan Collection
**Current Indexes:**
- `id` (unique) - ✅ Good for plan lookups

**Assessment:** ✅ Adequate (small collection, rarely queried directly)

---

#### 12. Subscription Collection
**Current Indexes:**
- `user` (unique) - ✅ Excellent for user subscription lookups

**Missing Indexes:**
- ❌ `status` - Needed for subscription status filtering
- ❌ `currentPeriodEnd` - Needed for subscription expiry queries
- ❌ `{ status: 1, currentPeriodEnd: 1 }` - Compound index for expiry monitoring

**Recommendation:** Add indexes for subscription management

---

## Recommended Index Additions

### High Priority (Performance Critical)

```javascript
// Payment Collection
paymentSchema.index({ user: 1, createdAt: -1 });  // User payment history
paymentSchema.index({ status: 1 });                // Payment status filtering
paymentSchema.index({ reference: 1 });              // Payment reference lookups

// Ad Collection
adSchema.index({ status: 1, placement: 1 });       // Ad serving
adSchema.index({ advertiser: 1, status: 1 });      // Advertiser management

// TheftReport Collection
theftReportSchema.index({ reportedBy: 1, createdAt: -1 });  // User reports
theftReportSchema.index({ status: 1 });                     // Status filtering
```

### Medium Priority (Performance Improvement)

```javascript
// Subscription Collection
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });  // Expiry monitoring

// Partner Collection
partnerSchema.index({ status: 1, orgType: 1 });  // Partner filtering

// TheftReport Collection
theftReportSchema.index({ createdAt: -1 });  // Recent reports

// Ad Collection
adSchema.index({ targetRoles: 1 });  // Role targeting
adSchema.index({ targetPlans: 1 });  // Plan targeting
```

### Low Priority (Nice to Have)

```javascript
// Ad Collection
adSchema.index({ createdAt: -1 });  // Recent ads

// Payment Collection
paymentSchema.index({ createdAt: -1 });  // Recent payments
paymentSchema.index({ type: 1 });         // Payment type filtering
```

---

## Index Size Estimation

Assuming 10,000 devices, 100,000 pings per month, 1,000 users:

| Collection | Estimated Documents | Current Indexes | Recommended Additions |
|------------|---------------------|-----------------|----------------------|
| User | 1,000 | 2 | 0 |
| Device | 10,000 | 4 | 0 |
| Ping | 1,200,000/year | 4 | 0 |
| TheftReport | 500 | 1 | 3 |
| Alert | 50,000 | 4 | 0 |
| Payment | 5,000 | 0 | 3 |
| Ad | 100 | 0 | 5 |
| Partner | 50 | 1 | 2 |
| Subscription | 1,000 | 1 | 1 |

**Total Index Storage Impact:** ~5-10% increase in storage (acceptable for performance gains)

---

## Implementation Plan

### Phase 1: High Priority (Immediate)
1. Add Payment collection indexes
2. Add Ad collection indexes for serving
3. Add TheftReport collection indexes

### Phase 2: Medium Priority (Next Sprint)
1. Add Subscription collection indexes
2. Add Partner collection indexes
3. Add remaining Ad collection indexes

### Phase 3: Low Priority (Future)
1. Add nice-to-have indexes
2. Monitor index usage
3. Remove unused indexes

---

## Monitoring Recommendations

1. **Query Performance:** Monitor slow query logs in MongoDB Atlas
2. **Index Usage:** Use `$indexStats` to monitor index usage
3. **Index Size:** Monitor index storage growth
4. **Query Plans:** Use `explain()` on slow queries to verify index usage

---

## Conclusion

**Current State:** 6/12 collections (50%) are well-indexed

**After High Priority Fixes:** 9/12 collections (75%) will be well-indexed

**After All Fixes:** 12/12 collections (100%) will be well-indexed

**Performance Impact:** Significant improvement expected for:
- Payment history queries (10-100x faster)
- Ad serving (5-50x faster)
- User report queries (10-50x faster)
- Subscription management (5-20x faster)

**Storage Impact:** ~5-10% increase in storage (acceptable trade-off)

**Recommendation:** Implement Phase 1 indexes immediately for critical performance improvements.
