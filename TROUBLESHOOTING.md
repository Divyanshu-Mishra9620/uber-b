# 🚨 Troubleshooting Guide - Uber MERN Clone

## Issue: 500 Errors on Ride Operations

### Common Causes & Solutions

---

## **Issue 1: GET /rides/get-fare Returns 500**

### Symptoms:

- Frontend shows: `Request failed with status code 500`
- Getting fare estimate fails

### Root Cause:

- Maps service cannot calculate distance between pickup and destination
- OSRM API timeout or unreachable
- Invalid address format

### Solutions:

**✅ Solution 1: Check Address Format**

- Make sure addresses are complete
- Example: `"Indira, Suvarnasutra, Sindang Asih, Sindangjaya, Kabupaten Tangerang, Banten, Jawa, Indonesia"`
- Should include city, state, country

**✅ Solution 2: Use Haversine Fallback (Already Implemented)**
The system now automatically falls back to Haversine distance calculation if OSRM fails. This is more reliable for development.

**✅ Solution 3: Check Render Logs**

1. Go to Render Dashboard
2. Click **uber-backend** service
3. Go to **Logs** tab
4. Look for error messages like:
   ```
   ❌ Error in getDistanceAndTime: ...
   ```

---

## **Issue 2: POST /rides/create Returns 500**

### Symptoms:

- Can't create a new ride
- Getting 500 error after selecting pickup, destination, and vehicle type

### Root Cause:

- Same as Issue 1 (getFare fails)
- Missing required fields
- Database connection issues

### Solutions:

**✅ Solution 1: Verify All Required Fields**
Required fields in request body:

```json
{
  "pickup": "Complete address string",
  "destination": "Complete address string",
  "vehicleType": "car|auto|moto"
}
```

**✅ Solution 2: Test Fare Calculation First**
Before creating a ride, test the fare endpoint:

```bash
curl "https://uber-backend-acj6.onrender.com/rides/get-fare?pickup=Mumbai&destination=Pune"
```

Should return:

```json
{
  "auto": 150,
  "car": 250,
  "moto": 100
}
```

If this fails, the fare calculation is the issue.

---

## **Issue 3: Database Connection Problems**

### Symptoms:

- All ride operations fail
- Logs show MongoDB errors

### Root Cause:

- MongoDB Atlas network access not configured
- Invalid connection string
- Credentials incorrect

### Solutions:

**✅ Solution 1: Verify MongoDB Atlas Network Access**

1. Go to: https://cloud.mongodb.com
2. Select your cluster
3. Go to **Network Access**
4. Ensure **0.0.0.0/0** is whitelisted OR add Render's IP

**✅ Solution 2: Test Connection**

1. Go to Render Dashboard
2. Check **Logs** for:
   ```
   ✅ MongoDB Connected Successfully
   ```

If you see this, connection is working! ✅

---

## **Distance Calculation Methods (In Order of Preference)**

### 1. **Haversine Formula** ✅ (Recommended)

- **Status:** Always works
- **Accuracy:** 99% accurate for short distances
- **Speed:** Instant
- **Cost:** Free

### 2. **OSRM (Open Source Routing Machine)** ⚠️

- **Status:** Used if Haversine needs accuracy for routing
- **Accuracy:** 100% accurate with turn-by-turn routes
- **Speed:** 1-2 seconds
- **Cost:** Free but might timeout
- **Fallback:** If OSRM times out, uses Haversine

### 3. **Google Maps API** ❌ (Not Used - Requires API Key)

- Cost: Paid service
- Setup: Complex
- Not implemented in this project

---

## **Testing Checklist**

### ✅ Backend Health Check

```bash
curl https://uber-backend-acj6.onrender.com/
# Should return: "Hello World"
```

### ✅ Database Connection

```bash
curl https://uber-backend-acj6.onrender.com/debug/env
# Should show:
# {
#   "PORT": "✅ SET",
#   "JWT_SECRET": "✅ SET",
#   "DB_CONNECT": "✅ SET"
# }
```

### ✅ Fare Calculation

```bash
curl "https://uber-backend-acj6.onrender.com/rides/get-fare?pickup=Times+Square,+New+York&destination=Central+Park,+New+York"
# Should return fare estimates
```

### ✅ User Signup

```bash
curl -X POST https://uber-backend-acj6.onrender.com/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": {"firstname": "John", "lastname": "Doe"},
    "email": "john'$(date +%s)'@test.com",
    "password": "password123"
  }'
# Should return user + token
```

---

## **Common Error Messages & Meanings**

| Error                                 | Meaning                         | Solution                   |
| ------------------------------------- | ------------------------------- | -------------------------- |
| `Request failed with status code 500` | Server error                    | Check Render logs          |
| `Invalid scheme, expected mongodb://` | DB env var not set              | Set `DB_CONNECT` on Render |
| `Address not found`                   | Nominatim couldn't find address | Use more complete address  |
| `No route found`                      | OSRM couldn't calculate route   | Falls back to Haversine    |
| `401 Unauthorized`                    | User not registered             | Sign up first              |
| `400 Bad Request`                     | Invalid input data              | Check request format       |

---

## **Latest Fixes (Current Build)**

✅ **Haversine Fallback** - Distance calculation now uses Haversine as primary method
✅ **Better Error Handling** - More detailed error messages in responses
✅ **Timeout Protection** - 5-second timeout for OSRM API calls
✅ **Comprehensive Logging** - Each step is logged for debugging

---

**Check the Backend logs on Render for detailed error information!** 🚀
