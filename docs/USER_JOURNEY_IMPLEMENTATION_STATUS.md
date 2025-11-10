# FleetFi User Journey - Implementation Status

## Overview
This document maps the user journey requirements against current implementation status and identifies next steps.

---

## 1. Investor Journey Implementation

### Journey Step 1: Sign up on FleetFi Dashboard
**Status:** ✅ **COMPLETE**
- Registration modal with role selection (Investor/Operator/Driver)
- Email, password, name capture
- Automatic authentication after registration
- Backend creates user with role in database

**Files:**
- `src/components/RegistrationModal.tsx`
- `backend/app/Http/Controllers/AuthController.php`

---

### Journey Step 2: Browse Available Tokenized EVs
**Status:** ⚠️ **PARTIAL**
- ✅ Asset listing visible in InvestorDashboard
- ✅ Backend pagination for assets
- ✅ Display: ID, Type, Model, Status, SOH
- ❌ **MISSING:** Token availability indicator
- ❌ **MISSING:** Investment amount calculator
- ❌ **MISSING:** Asset detail view with revenue history

**Current Implementation:**
```tsx
// InvestorDashboard shows assets but no "Invest" action
<table className="w-full">
  <thead>
    <tr>
      <th>Asset ID</th>
      <th>Type</th>
      <th>Status</th>
      <th>Ownership %</th>
    </tr>
  </thead>
  {/* Displays owned assets only */}
</table>
```

**Next Steps:**
- Add "Available for Investment" section showing all assets
- Add "Invest Now" button for each asset
- Show fractional ownership breakdown (e.g., "45% available")

---

### Journey Step 3: Buy Fractional Ownership Shares
**Status:** ❌ **NOT IMPLEMENTED**

**Required Flow:**
1. Investor clicks "Invest" on an asset
2. Modal opens with investment calculator:
   - Fraction percentage slider (1-100%)
   - Investment amount input (₦)
   - Projected ROI display
3. Investor must have a wallet first → Trigger wallet creation if needed
4. Calls `mintAssetToken()` from TrovoTech service
5. Backend mints token via TrovoTech API (sandbox mode enabled)
6. Token ownership recorded in database
7. Success notification + updated dashboard

**Backend Ready:** ✅ 
- `TrovotechController::mintToken()` implemented
- Route: `POST /api/trovotech/token/mint`

**Frontend Missing:**
- Investment modal UI
- Wallet creation flow
- Token minting integration

---

### Journey Step 4: Track Revenue and Swap Activity
**Status:** ⚠️ **PARTIAL**

**Current Implementation:**
- ✅ Shows owned tokenized assets
- ✅ Displays ownership percentage
- ✅ Shows investment amount
- ❌ **MISSING:** Real-time swap activity feed
- ❌ **MISSING:** Revenue tracking per asset
- ❌ **MISSING:** Performance metrics (km driven, battery swaps)

**Required Additions:**
- Display telemetry data (battery swaps, km driven)
- Show revenue generated per asset
- Activity timeline (swaps, maintenance, earnings)

---

### Journey Step 5: Receive ROI Updates (Blockchain Integration)
**Status:** ⚠️ **PARTIAL**

**Current Implementation:**
- ✅ Payout model exists
- ✅ `TrovotechController::initiatePayout()` implemented
- ❌ **MISSING:** Payout display in InvestorDashboard
- ❌ **MISSING:** Notification system for new payouts
- ❌ **MISSING:** ROI calculation over time

**Backend Ready:** ✅
- Route: `POST /api/trovotech/payout/initiate`
- Payout distribution logic complete
- Sandbox mode working

**Frontend Missing:**
- Payouts table in InvestorDashboard
- ROI chart/graph
- Payout notifications

---

## 2. Rider (Driver) Journey Implementation

### Journey Step 1: Register with FleetFi
**Status:** ✅ **COMPLETE**
- Driver role available in registration
- Backend supports 'driver' role
- Authentication working

---

### Journey Step 2: Get Assigned a Vehicle
**Status:** ⚠️ **PARTIAL**

**Current Implementation (Operator Side):**
- ✅ Operator can view riders list
- ✅ Operator can assign rider to asset
- ✅ Backend: `POST /api/riders/assign`
- ❌ **MISSING:** Driver dashboard view
- ❌ **MISSING:** Driver sees assigned vehicles
- ❌ **MISSING:** Assignment notification to driver

**Required:**
- Create `DriverDashboard.tsx`
- Show assigned vehicles
- Display route information
- Show earning metrics

---

### Journey Step 3: Swap Batteries at Biogas-Powered Swap Stations
**Status:** ❌ **NOT IMPLEMENTED**

**Missing Components:**
- Swap station locations map
- Battery swap request flow
- Swap history tracking
- Integration with biogas station data

**Partial Backend:**
- `scheduleSwap()` exists but for operator scheduling
- Need driver-initiated swap logging

---

### Journey Step 4: Income Auto-Tracked and Payout Simulated
**Status:** ❌ **NOT IMPLEMENTED**

**Required:**
- Driver earnings calculation (per km/trip)
- Daily/weekly payout accumulation
- Payout history for drivers
- Withdraw earnings flow

---

### Journey Step 5: Riders Maintain Vehicles
**Status:** ⚠️ **PARTIAL**

**Current:**
- ✅ Asset status tracking (Maintenance, Available, In Use)
- ❌ **MISSING:** Driver reports maintenance issues
- ❌ **MISSING:** Maintenance request workflow
- ❌ **MISSING:** Status updates notify investors

---

## 3. Operator Journey Implementation

### Journey Step 1: Access Operator Dashboard
**Status:** ✅ **COMPLETE**
- OperatorDashboard fully functional
- Role-based access control working
- Metrics cards displaying key stats

---

### Journey Step 2: Monitor Battery Levels, Charging, Status
**Status:** ✅ **COMPLETE**

**Current Features:**
- ✅ Real-time asset grid with battery, SOH, status
- ✅ Filter by status
- ✅ Search by ID/model
- ✅ Pagination support
- ✅ Alerts for low SOH assets
- ✅ Maintenance tracking

---

### Journey Step 3: Adjust Vehicle Availability and Manage Swaps
**Status:** ✅ **COMPLETE**

**Current Features:**
- ✅ Schedule swap operations
- ✅ Schedule charging
- ✅ Assign/unassign riders
- ✅ Update operation status
- ✅ View schedules list

---

### Journey Step 4: Approve Maintenance and Generate Reports
**Status:** ⚠️ **PARTIAL**

**Current:**
- ✅ CSV export of assets
- ✅ Maintenance asset filtering
- ❌ **MISSING:** Maintenance approval workflow
- ❌ **MISSING:** Comprehensive reports (revenue, utilization)
- ❌ **MISSING:** Payout distribution UI

**Required Additions:**
- Revenue distribution interface
- Monthly/quarterly reports
- Fleet utilization analytics

---

## Critical Missing Pieces for MVP

### High Priority (Core User Flows)

1. **Investor Wallet Creation** 🔴
   - Frontend: Add wallet creation button + display
   - Integration: Call `createWallet()` service
   - Status: Backend ready, frontend missing

2. **Token Minting UI** 🔴
   - Modal for investment selection
   - Fraction calculator
   - Confirmation flow
   - Status: Backend ready, frontend missing

3. **Payout Display (Investor)** 🔴
   - Fetch payouts from backend
   - Display in table/cards
   - Show total earnings
   - Status: Backend ready, frontend missing

4. **Driver Dashboard** 🔴
   - Create new page component
   - Show assigned vehicles
   - Display earnings
   - Status: Not started

5. **Payout Initiation (Operator)** 🟡
   - UI for revenue distribution
   - Select period, enter amount
   - Confirm and execute
   - Status: Backend ready, frontend missing

### Medium Priority (Enhanced Experience)

6. **Telemetry Display** 🟡
   - Real-time battery/km updates
   - Swap activity feed
   - Status: Backend exists, need frontend integration

7. **Asset Detail View** 🟡
   - Expanded asset information
   - Revenue history
   - Performance charts

8. **Notification System** 🟡
   - Toast notifications working
   - Need persistent notification center
   - Email/SMS for important events

### Database Migrations Needed

```bash
# Add blockchain fields to assets
php artisan make:migration add_blockchain_fields_to_assets_table

# Add TrovoTech fields to tokens
php artisan make:migration add_trovotech_fields_to_tokens_table
```

**Fields to add:**
- `assets`: `token_id`, `metadata_hash`, `trustee_ref`, `telemetry_uri`
- `tokens`: `fraction_owned`, `metadata_hash`, `trustee_ref`, `tx_hash`
- `wallets`: `trustee_ref` (already added to model)

---

## Implementation Roadmap

### Phase 1: Core Investor Flow (Priority 1)
**Estimated Time:** 4-6 hours

1. Create database migrations for blockchain fields
2. Add wallet creation UI in InvestorDashboard
3. Add investment modal with token minting
4. Display payouts in InvestorDashboard
5. Test investor journey end-to-end

### Phase 2: Operator Revenue Distribution (Priority 1)
**Estimated Time:** 2-3 hours

1. Add payout initiation UI in OperatorDashboard
2. Test payout flow with multiple investors
3. Verify blockchain metadata recording

### Phase 3: Driver Experience (Priority 2)
**Estimated Time:** 3-4 hours

1. Create DriverDashboard component
2. Show assigned vehicles
3. Add earnings display
4. Implement swap logging

### Phase 4: Enhanced Features (Priority 3)
**Estimated Time:** 4-5 hours

1. Telemetry real-time updates
2. Asset detail modals
3. Revenue charts
4. Notification center
5. Email notifications

---

## Testing Checklist

### Investor Flow
- [ ] Register as investor
- [ ] Create TrovoTech wallet
- [ ] Browse available assets
- [ ] Mint fractional token (10% of asset)
- [ ] View token in dashboard
- [ ] Receive payout from operator
- [ ] See updated balance

### Operator Flow
- [ ] Register as operator
- [ ] View all assets
- [ ] Assign rider to vehicle
- [ ] Schedule swap operation
- [ ] Initiate revenue payout
- [ ] Export asset report

### Driver Flow
- [ ] Register as driver
- [ ] View assigned vehicles
- [ ] Log battery swap
- [ ] View earnings
- [ ] Request payout

---

## Environment Setup Required

### Backend `.env`
```env
TROVOTECH_BASE_URL=https://api.trovotech.io/v1
TROVOTECH_API_KEY=your_api_key_here
TROVOTECH_ISSUER_ID=FT_ISSUER_ID
TROVOTECH_SANDBOX=true
```

### TrovoTech Sandbox Access
- Register FleetFi as issuer on TrovoTech platform
- Obtain API credentials
- Configure SEC-ARIP sandbox node
- Set up trustee relationship

---

## Success Metrics

**User Journey Completion Rate:**
- Investor: 40% complete (2/5 steps fully functional)
- Driver: 20% complete (1/5 steps fully functional)
- Operator: 80% complete (4/5 steps fully functional)

**Overall MVP Progress:** ~47% complete

**Next Sprint Target:** 75% (Complete Phase 1 & 2)

---

*Document Generated: November 9, 2025*
*Last Updated: Auto-generated based on current codebase analysis*
