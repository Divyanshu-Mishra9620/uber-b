# 🚀 Uber Backend - Maps Service Improvements

## ✅ Issues Fixed

### 1. **GET /rides/get-fare - 500 Error Fixed**

**Problem:** OSRM API was timing out or failing
**Solution:**

- Added 10-second timeout to OSRM requests
- Implemented Haversine formula fallback for distance calculation
- Better error logging to identify exact failure point

### 2. **POST /rides/create - 500 Error Fixed**

**Problem:** Maps service calls were failing
**Solution:**

- Added timeout to Nominatim (address geocoding) API
- Improved error messages for better debugging
- Added fallback distance calculation using Haversine formula

### 3. **API Timeout Issues**

**Problem:** Remote APIs (OSRM, Nominatim) might timeout
**Solution:**

- Set 10-second timeout for OSRM API calls
- Set 8-second timeout for Nominatim API calls
- If OSRM fails, falls back to Haversine distance calculation

---

## 📦 Updated Files

### `Backend/services/maps.service.js`

- ✅ Added `calculateHaversineDistance()` function
- ✅ Added timeout to axios requests
- ✅ Better error messages with emoji indicators
- ✅ Fallback calculation when OSRM fails

### `Backend/controllers/ride.controller.js`

- ✅ Better error logging
- ✅ More detailed error responses

---

## 🔧 Technical Details

### Haversine Formula

Calculates the great-circle distance between two points on a sphere given their latitudes and longitudes.

```
Distance = 2 * R * arcsin(sqrt(sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)))
Where R = Earth's radius (6371 km)
```

### API Calls Made

1. **Nominatim (OpenStreetMap)** - Convert address to coordinates

   - Timeout: 8 seconds
   - Fallback: Manual coordinate validation

2. **OSRM (Open Source Routing Machine)** - Get distance & time between points
   - Timeout: 10 seconds
   - Fallback: Haversine formula (calculates straight-line distance, adds 1.5x for actual route)

---

## 📊 Fare Calculation

```
Fare = BaseFare + (Distance × PerKmRate) + (Duration × PerMinuteRate)

For Car:
- Base Fare: ₹50
- Per KM: ₹15
- Per Minute: ₹3

For Auto:
- Base Fare: ₹30
- Per KM: ₹10
- Per Minute: ₹2

For Moto:
- Base Fare: ₹20
- Per KM: ₹8
- Per Minute: ₹1.50
```

---

## ✅ Testing Checklist

- [ ] Try getting fare estimate from Home page
- [ ] Verify fare displays correctly for all vehicle types
- [ ] Try creating a ride
- [ ] Check backend logs show proper sequence:
  - 🔍 Searching address (pickup)
  - ✅ Address found
  - 🔍 Searching address (destination)
  - ✅ Address found
  - 🔗 OSRM URL called
  - ✅ Distance calculated
  - ✅ Fare calculated

---

## 🎯 What Happens Now

### When User Tries to Get Fare:

1. Frontend sends: `GET /rides/get-fare?pickup=...&destination=...`
2. Backend:
   - Converts pickup address → coordinates via Nominatim
   - Converts destination address → coordinates via Nominatim
   - Calls OSRM to get distance & time (with fallback to Haversine if fails)
   - Calculates fare for all vehicle types
   - Returns: `{auto: 50, car: 75, moto: 40}`

### When User Creates a Ride:

1. Frontend sends: `POST /rides/create` with pickup, destination, vehicleType
2. Backend:
   - Calculates fare (same process as above)
   - Creates ride in database
   - Finds all captains within 1km radius
   - Sends notification to captains via Socket.io

---

## 🔍 Debugging

If you still see errors, check:

1. **Render Logs:**

   - Look for emoji indicators: 🔍 📍 ✅ ❌ 🔗
   - Watch the sequence of steps

2. **Check Address Format:**

   - Nominatim requires valid addresses
   - Try using full address: "City, State, Country"
   - Not: "xyz123" or "---"

3. **Check Network:**
   - Open browser DevTools → Network tab
   - Look at request/response for `/rides/get-fare`
   - See the exact error message

---

## 📝 Example Response

### Fare Response:

```json
{
  "auto": 45,
  "car": 68,
  "moto": 38
}
```

### Ride Creation Response:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "pickup": "Indira, Subarana..., Indonesia",
  "destination": "Gomti, India",
  "vehicleType": "car",
  "fare": 68,
  "status": "pending",
  "otp": "123456",
  "createdAt": "2025-11-12T...",
  "updatedAt": "2025-11-12T..."
}
```

---

## 🚀 Next Steps

1. **Test the improved fare calculation**
2. **Try creating a ride**
3. **Wait for captain to accept**
4. **Check Socket.io notifications**

If issues persist, share:

- Browser console errors
- Render backend logs
- Exact addresses used in the test
