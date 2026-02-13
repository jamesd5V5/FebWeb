# Quick Supabase Test - 5 Minute Guide

**URL:** http://localhost:5174
**Goal:** Verify Supabase authentication integration works

---

## ⚡ Super Quick Test (2 minutes)

### Step 1: Open & Check Console
1. Open http://localhost:5174
2. Press **F12** to open DevTools
3. Look at Console tab

**Expected:** No errors (especially no module import errors)

✅ / ❌  No console errors

---

### Step 2: Check Auth UI
**Expected:**
- Email field (not name dropdown)
- Password field
- "Sign in" button (dark/black)
- "Sign up" button (gray)

✅ / ❌  New auth UI visible

---

### Step 3: Test Sign Up
1. Enter email: `test@example.com`
2. Enter password: `password123`
3. Click **"Sign up"**

**Expected:** Red message appears:
```
"Account created. If email confirmations are enabled, confirm your email then sign in."
```

✅ / ❌  Sign up works

---

### Step 4: Test Sign In
1. Click **"Sign in"** with same credentials

**Expected:** One of these red messages:
- `"Email not confirmed"` (if confirmation enabled)
- `"Supabase coupleId is not set. Follow SUPABASE_SETUP.md..."` (if no confirmation)

✅ / ❌  Sign in shows appropriate error

---

### Step 5: Check Network
1. Go to Network tab in DevTools
2. Filter by "supabase"
3. Look for `@supabase/supabase-js@2/+esm`

**Expected:** Status 200 OK (green)

✅ / ❌  Supabase module loaded

---

## ✅ Success Criteria

**All tests pass if:**
- No console errors on page load
- Auth UI shows Email/Password (not Name dropdown)
- Sign up button works and shows message
- Sign in button shows error (expected behavior)
- Supabase module loads from CDN (200 OK)

---

## 🎯 The Key Test: coupleId Error

**Most Important:** When you sign in (after email confirmed), you should see:

```
"Supabase coupleId is not set. Follow SUPABASE_SETUP.md and paste the couple id into CONFIG.supabase.coupleId."
```

**This error is EXPECTED and CORRECT!** It means:
1. ✅ Supabase CDN import works
2. ✅ Supabase client initialized
3. ✅ Sign in authentication succeeded
4. ✅ Error handling works
5. ✅ Ready for next step (setting up couple data)

---

## 🐛 Common Issues

### Issue: Console shows module import error
**Fix:** Check `index.html` has `<script type="module" src="./app.js">`

### Issue: Old UI still shows (Name dropdown)
**Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: "Failed to fetch" error
**Fix:** Check internet connection, Supabase URL in CONFIG

### Issue: Buttons don't respond
**Fix:** Check console for JavaScript errors

---

## 📊 Test Results

```
Date: [Fill in]
Browser: [Fill in]

✅ / ❌  No console errors
✅ / ❌  New auth UI visible
✅ / ❌  Sign up works
✅ / ❌  Sign in shows error
✅ / ❌  Supabase module loaded

Overall: PASS / FAIL

Notes:
[Any issues or observations]
```

---

## 📁 Detailed Guides

For more detailed testing:
- **SUPABASE_TEST_GUIDE.md** - Comprehensive testing guide
- **SUPABASE_VISUAL_REFERENCE.md** - Visual reference with screenshots
- **CODE_REFERENCE.md** - Code locations for debugging

---

## 🚀 Next Steps

After confirming Supabase integration works:
1. Follow `SUPABASE_SETUP.md` to set up database
2. Create couple record in Supabase
3. Add couple members
4. Set `CONFIG.supabase.coupleId` in `app.js`
5. Test full authentication flow

---

## 💡 Quick Console Commands

Open console (F12) and try:

```javascript
// Check Supabase client exists
typeof sb !== 'undefined'

// Check current session
sb.auth.getSession().then(({data}) => console.log(data.session))

// Check CONFIG
console.log('Couple ID:', CONFIG.supabase.coupleId)
console.log('Is empty:', CONFIG.supabase.coupleId === "")
```

---

## ✨ That's It!

**Total time:** 2-5 minutes
**Expected result:** Everything works, coupleId error appears (this is correct!)

Good luck! 🎉
