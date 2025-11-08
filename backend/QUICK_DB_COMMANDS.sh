#!/bin/bash
# Quick Database Commands for Alok Library

DB_NAME="alok_library"
DB_USER="alokverma"

echo "📊 Alok Library Database Commands"
echo "=================================="
echo ""

# View all students
echo "1️⃣  View All Students:"
psql -d $DB_NAME -U $DB_USER -c "SELECT id, name, phone_number as phone, expiry_date as expiry, created_at FROM students ORDER BY created_at DESC;"
echo ""

# Count students
echo "2️⃣  Student Count:"
psql -d $DB_NAME -U $DB_USER -c "SELECT COUNT(*) as total_students FROM students;"
echo ""

# Active vs Expired
echo "3️⃣  Subscription Status:"
psql -d $DB_NAME -U $DB_USER -c "SELECT 
  COUNT(CASE WHEN expiry_date >= CURRENT_DATE THEN 1 END) as active,
  COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired,
  COUNT(*) as total
FROM students;"
echo ""

# Table structure
echo "4️⃣  Table Structure:"
psql -d $DB_NAME -U $DB_USER -c "\d students"
echo ""

