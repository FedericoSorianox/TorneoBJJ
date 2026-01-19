#!/bin/bash

# 1. Create a dummy athlete
echo "Creating athlete..."
RESPONSE=$(curl -s -X POST http://localhost:5001/api/athletes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UpdateTestUser",
    "academy": "Test Academy",
    "belt": "White",
    "gender": "Male",
    "weight": 80,
    "age": 30
  }')

echo "Create Response: $RESPONSE"

# Extract ID using python for reliability
ID=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['_id'])")
echo "Created ID: $ID"

if [ -z "$ID" ] || [ "$ID" == "null" ]; then
  echo "Failed to get ID"
  exit 1
fi

# 2. Update the athlete
echo "Updating athlete $ID..."
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:5001/api/athletes/$ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UpdatedNameVerified",
    "academy": "Test Academy",
    "belt": "Blue",
    "gender": "Male",
    "weight": 82,
    "age": 31
  }')

echo "Update Response received."

# 3. Verify Update
GET_RESPONSE=$(curl -s http://localhost:5001/api/athletes/$ID)
echo "Get Response: $GET_RESPONSE"

if [[ "$GET_RESPONSE" == *"UpdatedNameVerified"* ]]; then
  echo "SUCCESS_VERIFIED: Name was updated."
else
  echo "FAILURE_VERIFIED: Name was NOT updated."
fi

# 4. Clean up
curl -s -X DELETE http://localhost:5001/api/athletes/$ID > /dev/null
echo "Cleaned up."
