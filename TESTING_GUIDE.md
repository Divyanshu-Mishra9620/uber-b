# Quick Testing Guide - Captain Ride Acceptance

## Prerequisites

- ✅ Backend running on port 4000 (Render or localhost)
- ✅ Frontend running on port 5173/5174
- ✅ MongoDB Atlas connected
- ✅ Both apps deployed and accessible

## Step-by-Step Testing

### Part 1: Setup Two Browser Windows/Tabs

**Window 1 - Captain:**

1. Open browser and go to `https://uber-b-4vyh.vercel.app/captain-signup` (or `http://localhost:5174/captain-signup`)
2. Fill in the form:
   ```
   Email: captain1@test.com
   Password: captain123
   First Name: John
   Last Name: Doe
   Vehicle Color: White
   Vehicle Plate: ABC123
   Vehicle Capacity: 4
   Vehicle Type: car
   ```
3. Click "Sign Up"
4. Should redirect to `/captain-home`

**Window 2 - User:**

1. Open another browser window/tab
2. Go to `https://uber-b-4vyh.vercel.app/signup` (or `http://localhost:5174/signup`)
3. Fill in the form:
   ```
   Email: user1@test.com
   Password: user123
   First Name: Alice
   Last Name: Smith
   ```
4. Click "Sign Up"
5. Should redirect to `/home`

### Part 2: Create a Ride Request

**On User Window:**

1. You should see the map interface
2. Click on "Add a pickup location" input field
3. Type: `Times Square, New York`
4. Select from dropdown suggestions
5. Click on "Enter your destination" input field
6. Type: `Central Park, New York`
7. Select from dropdown suggestions
8. Click "Find Trip"
9. Select a vehicle type (e.g., "Car")
10. Click "Confirm Ride"

**Expected Result:** User sees "Looking For Driver" panel slide up with loading animation

### Part 3: Captain Receives Notification

**On Captain Window:**

1. Should automatically receive the ride notification
2. You'll see a `RidePopUp` slide up from the bottom showing:
   - Driver photo (default avatar)
   - Pickup location: "Times Square, New York"
   - Destination: "Central Park, New York"
   - Fare amount: $XXX
3. Two buttons: "Ignore" and "Accept"

### Part 4: Captain Accepts Ride

**On Captain Window:**

1. Click the green "Accept" button
2. The `RidePopUp` slides down
3. A `ConfirmRidePopup` slides up showing:
   - User details
   - Pickup & destination details
   - A "Start Ride" button

### Part 5: User Receives Confirmation

**On User Window:**

1. "Looking For Driver" panel automatically slides down
2. "Waiting For Driver" panel slides up showing:
   - Captain name
   - Captain vehicle details
   - Live map tracking
   - 6-digit OTP (e.g., "123456")
   - "Cancel Ride" button

**This confirms the full acceptance flow is working! ✅**

## What's Happening Behind the Scenes

### User Side

```
User clicks "Confirm Ride"
  ↓
Frontend: POST /rides/create
  ↓
Backend:
  - Validates input
  - Calculates fare
  - Creates ride document
  - Finds captains in radius
  - Broadcasts "new-ride" via Socket.io
  ↓
Captain Socket.io receives "new-ride" event
```

### Captain Side

```
Backend: sendMessageToSocketId(captain.socketId, "new-ride")
  ↓
Frontend: socket.on("new-ride", handleNewRide)
  ↓
Shows RidePopUp with ride details
```

### Acceptance Flow

```
Captain clicks "Accept"
  ↓
Frontend: POST /rides/confirm (with JWT token)
  ↓
Backend:
  - Verifies captain auth
  - Updates ride.status → "accepted"
  - Assigns ride.captain = captainId
  - Sends "ride-confirmed" event to user
  ↓
User Socket.io receives "ride-confirmed" event
  ↓
Shows WaitingForDriver panel with captain details
```

## Console Logs to Check

### Backend Console (Should show):

```
Client connected: socket_id_here
User joined: captain_id as captain with socket ID: socket_id_here
ride.controller.captain[captain_id]
✅ Ride created with ID: ride_id_here
ride.service.confirmRide
```

### Browser Console (Captain - Should show):

```
Connected to server
New ride received: {_id: "...", userId: {...}, pickup: "...", ...}
```

### Browser Console (User - Should show):

```
Connected to server
Ride accepted: {_id: "...", status: "accepted", captain: {...}, ...}
```

## Troubleshooting Issues

### Issue 1: Captain doesn't receive ride notification

**Possible Causes:**

- Captain not connected to Socket.io (check browser console)
- Captain didn't emit "join" event (check CaptainHome.jsx useEffect)
- No captains in search radius (location query issue)

**Quick Fix:**

1. Open browser console on captain window (F12)
2. Look for "Connected to server" message
3. Check Network → WS (WebSocket tab) for Socket.io connection
4. If no connection, refresh the page and check for CORS errors

### Issue 2: User doesn't see confirmation after captain accepts

**Possible Causes:**

- User Socket.io not connected
- Socket.io events not reaching user
- User's socketId not saved in database

**Quick Fix:**

1. Open browser console on user window (F12)
2. Check "Connected to server" message
3. In backend console, verify "User joined: user_id" message
4. Check MongoDB: `db.users.findOne({_id: ObjectId("user_id")})` should have socketId

### Issue 3: Ride acceptance returns 401 error

**Possible Causes:**

- JWT token invalid or expired
- Captain token not in localStorage
- authCaptain middleware failing

**Quick Fix:**

1. In browser console: `localStorage.getItem('token')` - should show JWT
2. Refresh and login again to get fresh token
3. Check browser Network tab → /rides/confirm request → Headers for Authorization

### Issue 4: "Ride not found" error during acceptance

**Possible Causes:**

- Race condition: Ride document not yet saved
- Wrong rideId sent to backend
- MongoDB connection issue

**Quick Fix:**

1. Wait 1-2 seconds after user confirms before captain accepts
2. Refresh captain page and try again
3. Restart backend and test again

## Advanced Testing (Optional)

### Test with Actual Location Data

1. Grant location permission to browser
2. Frontend will auto-update captain location every 10 seconds
3. Map will show real-time captain movement

### Test Multiple Captains

1. Open 3rd browser window
2. Sign up another captain
3. Create ride from user
4. All captains in range should receive notification
5. Test that only accepting captain gets the ride

### Test Socket.io on Different Networks

1. Deploy frontend to Vercel
2. Deploy backend to Render
3. Test with `https://uber-b-4vyh.vercel.app`
4. Socket.io should work across origins with CORS enabled

## Success Checklist

- [ ] Captain receives ride notification immediately after user creates ride
- [ ] Ride details display correctly (pickup, destination, fare)
- [ ] Captain can click "Accept" button
- [ ] No console errors on captain browser
- [ ] User receives confirmation within 1-2 seconds of captain acceptance
- [ ] Confirmation shows correct captain details
- [ ] OTP is visible and matches backend OTP
- [ ] Both consoles show expected logs
- [ ] Feature works on both localhost and deployed URLs

## Next Steps After Verification

Once you verify the captain acceptance feature is working:

1. **Test Start Ride Flow** (requires OTP entry)
2. **Test End Ride Flow** (marks ride as completed)
3. **Test Ride Rating** (if implemented)
4. **Load Testing** - Try 10+ simultaneous ride requests
5. **Production Monitoring** - Set up alerts for Socket.io disconnections

---

**Estimated Testing Time:** 5-10 minutes per full cycle

For detailed implementation info, see `CAPTAIN_ACCEPTANCE_FEATURE.md`
