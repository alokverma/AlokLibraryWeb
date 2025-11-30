#!/bin/bash

echo "🧪 Testing Required Amount Storage Feature"
echo "=========================================="
echo ""

# Check if backend is running
echo "1. Checking if backend server is running..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server is not running. Please start it with: cd backend && npm run dev"
    exit 1
fi

# Check if frontend is running
echo ""
echo "2. Checking if frontend server is running..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend server is running"
else
    echo "⚠️  Frontend server may not be running. Start it with: npm run dev"
fi

echo ""
echo "3. Testing API endpoint for students..."
response=$(curl -s http://localhost:3000/api/students | head -c 100)
if [[ $response == *"["* ]] || [[ $response == *"error"* ]]; then
    echo "✅ API endpoint is accessible"
else
    echo "⚠️  Could not verify API endpoint"
fi

echo ""
echo "=========================================="
echo "✅ Quick checks completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Create a test student with 3 months subscription (₹1,200)"
echo "3. Create a test student with 6 months subscription (₹2,100)"
echo "4. Check payment status displays correctly"
echo "5. Verify in database that required_amount is stored"
echo ""
echo "📖 See TESTING_REQUIRED_AMOUNT.md for detailed test scenarios"
