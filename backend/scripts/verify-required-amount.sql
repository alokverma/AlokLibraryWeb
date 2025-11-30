-- Verification Script for Required Amount Storage
-- Run this in your PostgreSQL database to verify the implementation

-- 1. Check if required_amount column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students' AND column_name = 'required_amount';

-- 2. View all students with their payment information
SELECT 
  name, 
  subscription_months, 
  payment_amount, 
  required_amount,
  CASE 
    WHEN required_amount IS NULL THEN '⚠️ NULL (needs backfill)'
    WHEN required_amount IS NOT NULL THEN '✅ Stored'
  END as status,
  (required_amount - payment_amount) as remaining_amount,
  is_payment_done,
  created_at
FROM students 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Check students with NULL required_amount (backward compatibility)
SELECT 
  name,
  subscription_months,
  payment_amount,
  required_amount,
  'Needs backfill' as note
FROM students 
WHERE required_amount IS NULL
ORDER BY created_at DESC;

-- 4. Verify discount amounts are stored correctly for 3-month subscriptions
SELECT 
  name,
  subscription_months,
  payment_amount,
  required_amount,
  (1500 * 0.80) as expected_3month_discount, -- 20% off = ₹1,200
  CASE 
    WHEN subscription_months = 3 AND required_amount = 1200 THEN '✅ Correct (₹1,200 with 20% discount)'
    WHEN subscription_months = 3 AND required_amount != 1200 THEN '❌ Mismatch'
    ELSE 'N/A'
  END as verification
FROM students 
WHERE subscription_months = 3
ORDER BY created_at DESC;

-- 5. Verify discount amounts are stored correctly for 6-month subscriptions
SELECT 
  name,
  subscription_months,
  payment_amount,
  required_amount,
  (3000 * 0.70) as expected_6month_discount, -- 30% off = ₹2,100
  CASE 
    WHEN subscription_months = 6 AND required_amount = 2100 THEN '✅ Correct (₹2,100 with 30% discount)'
    WHEN subscription_months = 6 AND required_amount != 2100 THEN '❌ Mismatch'
    ELSE 'N/A'
  END as verification
FROM students 
WHERE subscription_months = 6
ORDER BY created_at DESC;

-- 6. Summary statistics
SELECT 
  COUNT(*) as total_students,
  COUNT(required_amount) as students_with_required_amount,
  COUNT(*) - COUNT(required_amount) as students_without_required_amount,
  COUNT(CASE WHEN subscription_months = 3 THEN 1 END) as students_3months,
  COUNT(CASE WHEN subscription_months = 6 THEN 1 END) as students_6months,
  ROUND(AVG(required_amount), 2) as avg_required_amount,
  SUM(payment_amount) as total_payments_received,
  SUM(required_amount) as total_required_amount
FROM students;

-- 7. Check for potential payment status issues
SELECT 
  name,
  subscription_months,
  payment_amount,
  required_amount,
  (required_amount - payment_amount) as remaining,
  is_payment_done,
  CASE 
    WHEN required_amount IS NOT NULL AND payment_amount >= required_amount AND is_payment_done = false THEN '⚠️ Should be Payment Done'
    WHEN required_amount IS NOT NULL AND payment_amount < required_amount AND is_payment_done = true THEN '⚠️ Should be Partial/Pending'
    ELSE '✅ Status OK'
  END as status_check
FROM students 
WHERE required_amount IS NOT NULL
ORDER BY created_at DESC;

