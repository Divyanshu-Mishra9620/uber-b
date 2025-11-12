# 🚀 Render Deployment Guide - UBER Backend

## ⚠️ IMPORTANT: Follow These Steps Exactly

### Step 1: Set Environment Variables on Render

**DO NOT SKIP THIS STEP!**

1. Go to: https://dashboard.render.com
2. Click on **uber-backend** service
3. On the left sidebar, click **Environment**
4. You will see a form to add variables. Add these THREE variables:

#### Variable 1:

```
Key: DB_CONNECT
Value: mongodb+srv://dvbeast465_db_user:LcHvT7mzOaV49zUv@cluster0.4curpeg.mongodb.net/uber-app?retryWrites=true&w=majority
```

#### Variable 2:

```
Key: JWT_SECRET
Value: m@i_kyU_B@t@U
```

#### Variable 3:

```
Key: PORT
Value: 4000
```

**IMPORTANT NOTES:**

- ❌ NO quotes around values
- ❌ NO extra spaces
- ✅ Copy-paste exactly as shown
- ✅ Click "Save" after adding each one

### Step 2: Trigger Redeploy

1. After saving all 3 variables, go to **Deployments** tab
2. Find the latest deployment
3. Click the **three dots (...)** button
4. Click **Redeploy**
5. Wait 2-3 minutes for deployment to complete

### Step 3: Verify It Works

Test the health endpoint:

```bash
curl https://uber-backend-acj6.onrender.com/
```

Should return: `Hello World`

If you see this, the backend is working! ✅

---

## 🔧 Troubleshooting

### If still getting 500 error:

**1. Check the Render Logs:**

- Go to **Logs** tab in your service
- Look for error messages
- Screenshot and share the error

**2. Verify MongoDB Connection String:**

- Make sure NO typos in the connection string
- Make sure it includes the database name: `uber-app`
- Should end with: `?retryWrites=true&w=majority`

**3. Check MongoDB Atlas Whitelist:**

- Go to: https://cloud.mongodb.com
- Select your cluster
- Go to **Network Access**
- Verify **0.0.0.0/0** is whitelisted (Allow access from anywhere)

**4. Manual Test:**
Try registering locally first:

```bash
curl -X POST http://localhost:4000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": {"firstname": "John", "lastname": "Doe"},
    "email": "test@example.com",
    "password": "password123"
  }'
```

Should return a 201 status with user data and token.

---

## 📝 If Environment Variables Still Don't Work

If Render is not picking up the environment variables, try this alternative:

1. Delete the current service
2. Create a new service from GitHub and use the render.yaml file
3. Render will automatically read environment variables from render.yaml

---

## ✅ Final Verification

Once environment variables are set and redeployed:

1. Test signup on your frontend
2. You should see a token returned
3. User should be able to login
4. No more 500 errors!

If you're still having issues, please share:

- Screenshot of your Render Environment variables
- Error message from Render Logs
- Any error shown in browser console
