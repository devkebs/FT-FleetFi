# Investment Wizard - Testing Guide

**Date:** November 15, 2025  
**Component:** Investment Wizard with Asset Browser  
**Status:** ✅ Implementation Complete

---

## 🎯 Overview

The Investment Wizard is now fully implemented and integrated into the FleetFi Investor Dashboard. This comprehensive flow allows investors to:

1. Browse available tokenized assets
2. Select an asset for investment
3. Configure investment amount and ownership percentage
4. Review investment details
5. Confirm and complete token minting via Trovotech API

---

## 🚀 New Features Added

### 1. Asset Browser Modal (`AssetBrowserModal.tsx`)
**Purpose:** Advanced asset discovery and filtering

**Features:**
- ✅ Search by model or ID
- ✅ Filter by asset type (EV, Battery, etc.)
- ✅ Sort by health, activity, or ID
- ✅ Real-time ownership availability display
- ✅ Daily revenue estimates
- ✅ Visual progress bars for available ownership
- ✅ Responsive grid layout

**User Flow:**
```
Dashboard → "Browse Assets" Button → Asset Browser Modal → Select Asset → Investment Wizard
```

### 2. Enhanced Dashboard Integration
**New UI Elements:**
- **Browse Assets Button**: Top-right header (when wallet exists)
- **Quick Invest CTA Card**: Prominent green gradient card below onboarding widget
- **Available Assets Grid**: Shows 6 assets with "Invest Now" buttons

### 3. Investment Wizard (Enhanced)
**5-Step Process:**

**Step 1: Select Investment**
- Ownership percentage slider (1-100%)
- Investment amount input (minimum ₦100)
- Real-time ROI calculation
- Estimated monthly revenue display
- Asset details card (ID, type, status, SOH)

**Step 2: Review Details**
- Investment amount summary
- Ownership percentage confirmation
- Expected returns (monthly & annual)
- Wallet information display
- Current balance check

**Step 3: Confirm**
- Final confirmation screen
- Terms and conditions checkboxes
- Warning about transaction irreversibility
- Risk acknowledgment

**Step 4: Processing**
- Animated spinner
- "Minting token on blockchain" message
- Progress bar animation
- Calls `mintAssetToken()` API

**Step 5: Success**
- Success animation with trophy icon
- Investment summary card
- Next steps information
- Email notification confirmation

---

## 🧪 Testing Instructions

### Prerequisites
1. **Servers Running:**
   ```bash
   Backend: http://127.0.0.1:8000
   Frontend: http://localhost:3000
   ```

2. **Test Account:**
   ```
   Email: john.investor@example.com
   Password: investor123
   ```

3. **Requirements:**
   - User must have wallet created
   - KYC status must be "verified"
   - Available assets must exist in database

---

## 📝 Test Cases

### Test Case 1: Browse Assets via Modal
**Steps:**
1. Login as investor
2. Ensure wallet exists (create if needed)
3. Click "Browse Assets" button in header
4. **Verify:** Modal opens with all available assets
5. **Test Search:** Type "EV" in search box
6. **Verify:** Only EV assets displayed
7. **Test Filter:** Select asset type from dropdown
8. **Verify:** Assets filtered correctly
9. **Test Sort:** Change sort order
10. **Verify:** Assets reordered

**Expected Result:**
- ✅ Modal displays all assets with images, metrics, ownership bars
- ✅ Search filters in real-time
- ✅ Filters work correctly
- ✅ Sorting changes order
- ✅ "Invest Now" buttons enabled for available assets
- ✅ "Fully Allocated" shown for 0% availability

---

### Test Case 2: Complete Investment Flow
**Steps:**
1. Login as investor with verified KYC
2. Click "Browse Assets" or scroll to "Available for Investment"
3. Click "Invest Now" on any asset
4. **Verify:** Investment Wizard opens (Step 1)

**Step 1 - Select:**
5. Move ownership slider to 25%
6. **Verify:** Estimated monthly return updates
7. Enter investment amount: ₦50,000
8. **Verify:** Annual ROI percentage displays
9. Click "Continue"

**Step 2 - Review:**
10. **Verify:** Investment amount shows ₦50,000
11. **Verify:** Ownership shows 25%
12. **Verify:** Expected returns calculated
13. **Verify:** Wallet address displayed
14. Click "Continue"

**Step 3 - Confirm:**
15. **Verify:** Final summary displayed
16. Check both agreement checkboxes
17. Click "Confirm Investment"

**Step 4 - Processing:**
18. **Verify:** Spinner animation shows
19. **Verify:** "Processing..." message displays
20. **Wait:** API call completes

**Step 5 - Success:**
21. **Verify:** Success screen with trophy icon
22. **Verify:** Investment summary correct
23. **Verify:** "Back to Dashboard" button shows
24. Click "Back to Dashboard"
25. **Verify:** Modal closes
26. **Verify:** New token appears in "My Tokenized Assets"
27. **Verify:** Dashboard metrics updated

**Expected Result:**
- ✅ Smooth wizard progression through all steps
- ✅ Token minted successfully via API
- ✅ Dashboard refreshes with new investment
- ✅ Success toast notification appears

---

### Test Case 3: Validation & Error Handling
**Test 3.1: Minimum Investment**
1. Open Investment Wizard
2. Enter ₦50 (below minimum)
3. Click "Continue"
4. **Verify:** Error message "Minimum investment amount is ₦100"

**Test 3.2: No Wallet**
1. Logout and login as user without wallet
2. Try to click "Invest Now"
3. **Verify:** Warning toast "Please create a wallet first"

**Test 3.3: KYC Not Verified**
1. Login as user with pending KYC
2. **Verify:** "Invest Now" buttons show "KYC Needed"
3. Click button
4. **Verify:** Warning toast about KYC requirement

**Test 3.4: Fully Allocated Asset**
1. Find asset with 0% ownership remaining
2. **Verify:** Button shows "Fully Allocated" and is disabled
3. **Verify:** Cannot open Investment Wizard

**Test 3.5: API Failure**
1. Stop backend server
2. Complete investment wizard
3. **Verify:** Error message displayed
4. **Verify:** Wizard remains on "Confirm" step
5. **Verify:** Can retry after fixing

---

### Test Case 4: Quick Invest CTA
**Steps:**
1. Login with verified account and wallet
2. Scroll to green gradient "Start Investing Today" card
3. **Verify:** Shows count of available assets
4. Click "Browse X Assets" button
5. **Verify:** Asset Browser Modal opens
6. Select an asset
7. **Verify:** Modal closes and Investment Wizard opens

---

### Test Case 5: Multiple Investments
**Steps:**
1. Complete Test Case 2 for Asset #1
2. Return to dashboard
3. Click "Browse Assets" again
4. Select different asset
5. Complete investment wizard
6. **Verify:** Second token appears in portfolio
7. **Verify:** Total investment metric increased
8. **Verify:** Both transactions in Transaction History

---

## 🔍 What to Verify

### UI/UX Checks
- [ ] All modals open/close smoothly
- [ ] Progress indicators work correctly
- [ ] Buttons have hover effects
- [ ] Forms validate before submission
- [ ] Success animations play
- [ ] Error messages are clear
- [ ] Mobile responsive design works

### Functionality Checks
- [ ] Asset search works in real-time
- [ ] Filters apply correctly
- [ ] Investment calculations accurate
- [ ] API integration works
- [ ] Token minting completes
- [ ] Dashboard updates after investment
- [ ] Transaction history shows new entries
- [ ] Notifications update

### Data Integrity Checks
- [ ] Token ownership recorded correctly
- [ ] Investment amount saved
- [ ] Wallet balance changes (if applicable)
- [ ] Asset ownership percentage decreases
- [ ] Metrics recalculate accurately

---

## 🐛 Known Limitations

1. **Mock Revenue Data**: Estimated returns use simplified calculations
   - Solution: Enhance with real historical performance data

2. **Sandbox Mode**: Using Trovotech sandbox API
   - Solution: Switch to production API key when ready

3. **No Payment Integration**: Assumes wallet has sufficient funds
   - Solution: Add payment gateway for fiat deposits

4. **Single Currency**: Only supports NGN (₦)
   - Solution: Add multi-currency support

---

## 📊 Success Metrics

### After Implementation, Verify:
- ✅ Investment completion rate > 80%
- ✅ Average wizard completion time < 2 minutes
- ✅ Error rate < 5%
- ✅ User can browse and invest without confusion
- ✅ All calculations are accurate
- ✅ Blockchain transactions succeed

---

## 🎥 Demo Flow

**Quick Demo Script:**
```
1. Login → Dashboard loads
2. See green "Start Investing" card
3. Click "Browse X Assets"
4. Asset Browser opens with search/filter
5. Select high-performing EV
6. Investment Wizard Step 1: Choose 20% ownership, ₦100,000
7. Step 2: Review details
8. Step 3: Confirm investment
9. Step 4: Processing (2-3 seconds)
10. Step 5: Success! 🎉
11. Return to dashboard
12. See new token in portfolio
13. Transaction appears in history
```

---

## 🔧 Troubleshooting

### Issue: "Invest Now" button disabled
**Solutions:**
- Check KYC status (must be "verified")
- Verify wallet exists
- Check asset ownership_remaining > 0

### Issue: API call fails during minting
**Solutions:**
- Verify backend server running
- Check auth token validity
- Review backend logs
- Confirm Trovotech API key configured

### Issue: Modal doesn't open
**Solutions:**
- Check browser console for errors
- Verify React state management
- Check if availableAssets array has items

### Issue: Calculations seem wrong
**Solutions:**
- Verify asset has dailySwaps or originalValue
- Check revenue calculation formula
- Review ROI percentage logic

---

## 📱 Mobile Testing

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

Verify:
- [ ] Modals are responsive
- [ ] Buttons are touch-friendly
- [ ] Text is readable
- [ ] Forms work on mobile keyboards

---

## ✅ Sign-Off Checklist

Before marking complete:
- [ ] All test cases pass
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Calculations accurate
- [ ] API integration works
- [ ] Error handling robust
- [ ] User feedback clear
- [ ] Documentation complete

---

## 📞 Support

**Questions or Issues?**
- Check browser console for errors
- Review backend logs
- Check `docs/TROVOTECH_INTEGRATION.md`
- Verify `.env` configuration

**Next Steps:**
1. Production API key integration
2. Payment gateway (Paystack/Flutterwave)
3. Enhanced analytics
4. Mobile app version

---

**Status:** ✅ Ready for Testing  
**Last Updated:** November 15, 2025
