# Testing Guide: Required Amount Storage

This guide helps you test that `requiredAmount` is properly stored and preserves payment history even when discount logic changes.

## Prerequisites

1. **Backend server running**: `cd backend && npm run dev`
2. **Frontend server running**: `npm run dev`
3. **Database accessible**: PostgreSQL database should be running

## Test Scenarios

### Test 1: Create New Student with Discount (3 months - 20% off)

**Steps:**
1. Open the application in browser (http://localhost:5173)
2. Click "Add Student" button
3. Fill in student details:
   - Name: "Test Student 1"
   - Phone: "+91 99999 99999"
   - Address: "Test Address"
   - Aadhar: "123456789012"
   - Subscription Duration: **3 months** (should show ₹1,200 with 20% discount)
   - Payment Amount: **1200**
   - Start Date: Today's date
4. Click "Add Student"

**Expected Result:**
- Student created successfully
- Payment status shows "Payment Done"
- Required Amount should be ₹1,200 (stored with 20% discount)

**Verify in Database:**
```sql
SELECT name, subscription_months, payment_amount, required_amount, is_payment_done 
FROM students 
WHERE name = 'Test Student 1';
```

Expected:
- `subscription_months` = 3
- `payment_amount` = 1200
- `required_amount` = 1200 (stored with discount)
- `is_payment_done` = true

---

### Test 2: Create New Student with Discount (6 months - 30% off)

**Steps:**
1. Add another student:
   - Name: "Test Student 2"
   - Subscription Duration: **6 months** (should show ₹2,100 with 30% discount)
   - Payment Amount: **2100**
2. Complete the form and submit

**Expected Result:**
- Required Amount should be ₹2,100 (stored with 30% discount)
- Payment status: "Payment Done"

**Verify:**
- Check the student card shows correct payment status
- Check database has `required_amount` = 2100

---

### Test 3: Create Student with Partial Payment

**Steps:**
1. Add student:
   - Name: "Test Student 3"
   - Subscription: **3 months** (₹1,200 required)
   - Payment Amount: **600** (partial payment)
2. Submit

**Expected Result:**
- Payment status: "Payment Partial Done"
- Remaining amount: ₹600
- `required_amount` = 1200 (stored)
- `payment_amount` = 600
- `is_payment_done` = false

---

### Test 4: Verify Payment Status Uses Stored requiredAmount

**Steps:**
1. View "Test Student 1" in student detail modal
2. Check the payment information shows:
   - Required Amount: ₹1,200
   - Payment Received: ₹1,200
   - Status: Payment Done

**Expected Result:**
- Payment status is calculated using stored `requiredAmount` (₹1,200), NOT recalculated
- Status remains "Payment Done"

---

### Test 5: Renew Subscription (Should Update requiredAmount)

**Steps:**
1. Find "Test Student 1"
2. Click "Renew Subscription"
3. Set:
   - Subscription Months: **6 months** (₹2,100 with 30% discount)
   - Payment Amount: **2100**
4. Renew

**Expected Result:**
- Subscription renewed
- New `required_amount` = 2100 (stored for the renewal)
- Payment status: "Payment Done"

**Verify in Database:**
```sql
SELECT subscription_months, payment_amount, required_amount 
FROM students 
WHERE name = 'Test Student 1';
```

---

### Test 6: Update Payment Amount (Should Preserve requiredAmount)

**Steps:**
1. Find "Test Student 3" (who paid ₹600 of ₹1,200)
2. Update payment amount to ₹1,200 (full payment)
3. Save

**Expected Result:**
- `required_amount` remains ₹1,200 (preserved)
- `payment_amount` updated to ₹1,200
- Payment status changes to "Payment Done"

---

### Test 7: Backward Compatibility (Students Without requiredAmount)

**Steps:**
1. Check database for students created before this update
2. They may have `required_amount` = NULL

**Expected Behavior:**
- System should recalculate `required_amount` using current discount logic
- Student cards should still display correctly
- Payment status should work as expected

**Verify:**
- View an old student in the UI
- Check payment status displays correctly
- System uses fallback calculation if `required_amount` is NULL

---

### Test 8: Simulate Removing Discount Logic

**Important:** This test verifies the core requirement - that payment status is preserved when discount logic changes.

**Steps:**
1. Temporarily modify discount logic in `backend/utils/subscriptionUtils.js`:
   ```javascript
   // Change discounts to 0%
   if (months === 3) {
     discountPercent = 0; // Was 20%
   } else if (months === 6) {
     discountPercent = 0; // Was 30%
   }
   ```

2. Restart backend server

3. Check "Test Student 1" (paid ₹1,200 for 3 months):
   - Open student detail modal
   - Check payment status

**Expected Result:**
- Payment status should still show "Payment Done"
- Required Amount should still show ₹1,200 (stored value)
- NOT ₹1,500 (new calculation without discount)
- Status should NOT change to "Payment Pending"

**This proves the fix works!**

4. Create a NEW student now:
   - Will use new logic (no discount)
   - Will store `required_amount` = ₹1,500 for 3 months
   - But old students keep their stored `required_amount`

5. **Revert the discount changes** after testing:
   ```javascript
   // Restore original discounts
   if (months === 3) {
     discountPercent = 20;
   } else if (months === 6) {
     discountPercent = 30;
   }
   ```

---

## Database Verification Queries

### Check all students with their required amounts:
```sql
SELECT 
  name, 
  subscription_months, 
  payment_amount, 
  required_amount,
  (required_amount - payment_amount) as remaining_amount,
  is_payment_done
FROM students 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check students with NULL required_amount (backward compatibility):
```sql
SELECT name, subscription_months, payment_amount, required_amount
FROM students 
WHERE required_amount IS NULL;
```

### Verify discount amounts are stored correctly:
```sql
SELECT 
  name,
  subscription_months,
  payment_amount,
  required_amount,
  CASE 
    WHEN subscription_months = 3 THEN 1500 * 0.80  -- 20% off
    WHEN subscription_months = 6 THEN 3000 * 0.70  -- 30% off
    ELSE subscription_months * 500
  END as calculated_with_discount,
  CASE 
    WHEN required_amount = CASE 
      WHEN subscription_months = 3 THEN 1500 * 0.80
      WHEN subscription_months = 6 THEN 3000 * 0.70
      ELSE subscription_months * 500
    END THEN '✅ Correct'
    ELSE '❌ Mismatch'
  END as verification
FROM students 
WHERE subscription_months IN (3, 6);
```

---

## Quick Manual Test Checklist

- [ ] Create student with 3 months subscription (₹1,200)
  - [ ] Required amount shows ₹1,200
  - [ ] Payment done status correct
  - [ ] Database has `required_amount` = 1200

- [ ] Create student with 6 months subscription (₹2,100)
  - [ ] Required amount shows ₹2,100
  - [ ] Payment done status correct
  - [ ] Database has `required_amount` = 2100

- [ ] Create student with partial payment
  - [ ] Payment partial done status correct
  - [ ] Remaining amount calculated correctly

- [ ] Renew subscription
  - [ ] New `required_amount` stored correctly
  - [ ] Payment status updated correctly

- [ ] View existing students
  - [ ] Payment status displays correctly
  - [ ] Required amount shows correct value

- [ ] Simulate discount logic removal
  - [ ] Old students still show correct status
  - [ ] Status doesn't change to "Payment Pending"

---

## Troubleshooting

**Issue: Students showing "Payment Pending" incorrectly**
- Check database: `SELECT required_amount, payment_amount FROM students WHERE name = 'Student Name';`
- Verify `required_amount` is stored (not NULL)
- Check if discount calculation is being used instead of stored value

**Issue: Backend errors when creating students**
- Check database column exists: `\d students` (in psql)
- Verify migration ran: Check `backend/utils/dbUtils.js` migration code executed
- Check server logs for errors

**Issue: Frontend not displaying required amount**
- Check browser console for errors
- Verify API response includes `requiredAmount` field
- Check TypeScript types are updated

---

## Expected Database Schema

After running the application, the `students` table should have:
- `required_amount DECIMAL(10, 2)` column
- Existing students should have `required_amount` populated (if they had payments)

To verify schema:
```sql
\d students
```

You should see `required_amount` in the column list.

