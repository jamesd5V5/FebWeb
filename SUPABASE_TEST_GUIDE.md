# Supabase Authentication Testing Guide

**Test Date:** February 12, 2026
**Server:** http://localhost:5174 (Port 5174, PID 21040)
**Integration:** Supabase Auth + Database

---

## 🎯 Overview

The application has been migrated from simple password auth to Supabase authentication with the following changes:

### Key Changes:
1. **Auth UI:** Email/Password fields (was: Name dropdown + Password)
2. **Buttons:** "Sign in" / "Sign up" (was: "Enter" / "Hint")
3. **Import:** Supabase client from CDN (`@supabase/supabase-js@2`)
4. **Config:** `CONFIG.supabase.coupleId` is **empty** (intentionally for testing)

---

## 📋 Test Checklist

### ✅ Test 1: Initial Page Load & Auth Overlay
**URL:** http://localhost:5174

**Expected:**
- [ ] Auth overlay is visible (modal dialog)
- [ ] Title: "Message Mayhem"
- [ ] Subtitle: "Sign in (Supabase)"
- [ ] Email input field (type="email")
- [ ] Password input field (type="password")
- [ ] Two buttons: "Sign in" (primary/dark) and "Sign up" (secondary/gray)
- [ ] No console errors related to Supabase import

**Console Check:**
```javascript
// Open DevTools (F12) and check:
// 1. No errors about module imports
// 2. Supabase client should be initialized
console.log('Supabase client:', typeof sb !== 'undefined')
```

**Screenshot:** Take screenshot of auth overlay

---

### ✅ Test 2: Supabase CDN Import
**Location:** `app.js` line 3

**Code:**
```javascript
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
```

**Expected:**
- [ ] No console errors about module loading
- [ ] No CORS errors
- [ ] Network tab shows successful load of supabase-js module

**How to Check:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "supabase"
4. Look for: `@supabase/supabase-js@2/+esm`
5. Status should be: **200 OK**

**Console Check:**
```javascript
// Should not throw error:
typeof createClient === 'function'
```

**If Import Fails:**
- Error message will appear in console
- Likely errors:
  - `Failed to load module`
  - `CORS error`
  - `Unexpected token '<'` (HTML error page loaded instead)

---

### ✅ Test 3: Sign Up with Fake Email/Password
**Goal:** Test sign-up flow and observe Supabase response

**Steps:**
1. Enter fake email: `test@example.com`
2. Enter fake password: `password123`
3. Click **"Sign up"** button
4. Observe response message

**Expected Responses:**

#### Scenario A: Email Confirmation Enabled (Most Likely)
**Message:**
```
"Account created. If email confirmations are enabled, confirm your email then sign in."
```
- [ ] Message appears in red text below buttons
- [ ] Auth overlay stays open
- [ ] No page reload
- [ ] User NOT signed in yet

**Code Location:** `app.js` lines 319-322
```javascript
await signUpWithEmailPassword(email, pw);
showErr(
  "Account created. If email confirmations are enabled, confirm your email then sign in.",
);
```

#### Scenario B: Email Confirmation Disabled (Less Likely)
**Message:**
```
"Supabase coupleId is not set. Follow SUPABASE_SETUP.md and paste the couple id into CONFIG.supabase.coupleId."
```
- [ ] Message appears in red text
- [ ] This means account was created AND auto-signed in
- [ ] App tried to fetch membership but coupleId is empty

#### Scenario C: Error (e.g., weak password, invalid email)
**Possible Messages:**
- `"Password should be at least 6 characters"`
- `"Invalid email format"`
- `"User already registered"`

**Console Check:**
```javascript
// Check Supabase auth state:
sb.auth.getSession().then(({ data }) => console.log('Session:', data.session))
```

**Screenshot:** Take screenshot of response message

---

### ✅ Test 4: Sign In (Should Fail - No coupleId)
**Goal:** Verify coupleId error message appears

**Steps:**
1. Clear the error message (refresh page if needed)
2. Enter the same email: `test@example.com`
3. Enter the same password: `password123`
4. Click **"Sign in"** button
5. Observe response

**Expected Response:**

#### If Email Confirmation Required:
**Message:**
```
"Email not confirmed"
```
or
```
"Invalid login credentials"
```
- [ ] Message appears in red text
- [ ] Auth overlay stays open
- [ ] Cannot sign in until email confirmed

#### If Email Confirmation NOT Required (or already confirmed):
**Message:**
```
"Supabase coupleId is not set. Follow SUPABASE_SETUP.md and paste the couple id into CONFIG.supabase.coupleId."
```
- [ ] Message appears in red text
- [ ] Auth overlay stays open
- [ ] This confirms the error handling works!

**Code Location:** `app.js` lines 206-211
```javascript
async function fetchMyMembership(userId) {
  if (!CONFIG.supabase.coupleId) {
    throw new Error(
      "Supabase coupleId is not set. Follow SUPABASE_SETUP.md and paste the couple id into CONFIG.supabase.coupleId.",
    );
  }
  // ...
}
```

**Why This Happens:**
1. Sign in succeeds (Supabase auth works)
2. App calls `fetchMyMembership(user.id)` (line 268)
3. Function checks `CONFIG.supabase.coupleId` (line 207)
4. Since it's empty (`""`), throws error
5. Error displayed to user

**Screenshot:** Take screenshot of error message

---

### ✅ Test 5: Logout Functionality
**Goal:** Verify logout works even without being fully signed in

**Note:** If you got the coupleId error, you might not see the main app. Let me check if logout is accessible...

**Steps:**
1. If auth overlay closed (unlikely), open menu (☰)
2. Click "Log out" button
3. Observe behavior

**Expected:**
- [ ] `signOut()` is called
- [ ] Page reloads
- [ ] Auth overlay appears again
- [ ] Session cleared

**Code Location:** `app.js` lines 898-903
```javascript
function initLogout() {
  const btn = qs("logoutBtn");
  btn?.addEventListener("click", () => {
    signOut().finally(() => location.reload());
  });
}
```

**Console Check:**
```javascript
// Before logout:
sb.auth.getSession().then(({ data }) => console.log('Before:', data.session))

// After logout (after page reload):
sb.auth.getSession().then(({ data }) => console.log('After:', data.session))
// Should be null
```

**Note:** If you can't access the logout button because auth overlay is blocking, you can manually sign out via console:
```javascript
sb.auth.signOut().then(() => location.reload())
```

---

## 🔍 Console Errors to Check

### Expected: NO Errors
Open DevTools (F12) → Console tab

**Check for these potential errors:**

### ❌ Module Import Errors:
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```
**Cause:** CDN URL incorrect or blocked

```
Uncaught SyntaxError: Cannot use import statement outside a module
```
**Cause:** `<script>` tag missing `type="module"`

```
Uncaught ReferenceError: createClient is not defined
```
**Cause:** Import failed

### ❌ CORS Errors:
```
Access to fetch at 'https://cdn.jsdelivr.net/...' from origin 'http://localhost:5174' has been blocked by CORS policy
```
**Cause:** Browser blocking CDN (unlikely with jsdelivr)

### ❌ Supabase Errors:
```
Invalid API key
```
**Cause:** `CONFIG.supabase.anonKey` is wrong

```
Failed to fetch
```
**Cause:** Supabase URL wrong or network issue

### ✅ Expected Console Logs:
```
(No errors - silence is golden!)
```

---

## 📊 Code Analysis

### Supabase Client Initialization
**Location:** `app.js` line 168
```javascript
const sb = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
```

**Config Values:**
- **URL:** `https://qdrqradnjscsfnjptbnz.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (valid JWT)
- **Couple ID:** `""` (empty - intentional for testing)

### Sign Up Flow
**Location:** `app.js` lines 309-326

```javascript
signUpBtn?.addEventListener("click", async () => {
  showErr("");
  const email = emailEl?.value?.trim?.() || "";
  const pw = pwEl?.value || "";
  if (!email || !pw) {
    showErr("Enter email + password.");
    return;
  }

  try {
    await signUpWithEmailPassword(email, pw);
    showErr(
      "Account created. If email confirmations are enabled, confirm your email then sign in.",
    );
  } catch (err) {
    showErr(err?.message || String(err));
  }
});
```

**Function:** `signUpWithEmailPassword()` (lines 196-200)
```javascript
async function signUpWithEmailPassword(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}
```

### Sign In Flow
**Location:** `app.js` lines 295-307

```javascript
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  showErr("");
  const email = emailEl?.value?.trim?.() || "";
  const pw = pwEl?.value || "";
  if (!email || !pw) {
    showErr("Enter email + password.");
    return;
  }

  try {
    const user = await signInWithEmailPassword(email, pw);
    await finish(user);  // ← This calls fetchMyMembership
  } catch (err) {
    showErr(err?.message || String(err));
  }
});
```

**Function:** `signInWithEmailPassword()` (lines 190-194)
```javascript
async function signInWithEmailPassword(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}
```

**Function:** `finish()` (lines 267-280)
```javascript
const finish = async (user) => {
  const membership = await fetchMyMembership(user.id);  // ← Will throw error
  closeAuth();
  onAuthed({
    userId: user.id,
    email: user.email,
    role: membership.role,
    displayName: membership.displayName,
    coupleId: membership.coupleId,
  });
};
```

### Empty coupleId Check
**Location:** `app.js` lines 206-211

```javascript
async function fetchMyMembership(userId) {
  if (!CONFIG.supabase.coupleId) {
    throw new Error(
      "Supabase coupleId is not set. Follow SUPABASE_SETUP.md and paste the couple id into CONFIG.supabase.coupleId.",
    );
  }
  // ... rest of function
}
```

**This is the key test:** When you sign in successfully, this error should appear!

---

## 🎯 Expected Test Results Summary

### Test 1: Page Load
- ✅ Auth overlay visible
- ✅ Email/Password fields
- ✅ Sign in / Sign up buttons
- ✅ No console errors

### Test 2: CDN Import
- ✅ Supabase module loads from jsdelivr
- ✅ No module/import errors
- ✅ Network tab shows 200 OK

### Test 3: Sign Up
- ✅ Clicking "Sign up" with fake credentials
- ✅ Response: "Account created. If email confirmations are enabled, confirm your email then sign in."
- ✅ OR: Error about password strength, etc.

### Test 4: Sign In
- ✅ Clicking "Sign in" with same credentials
- ✅ If email not confirmed: "Email not confirmed" or "Invalid login credentials"
- ✅ If email confirmed (or no confirmation required): **"Supabase coupleId is not set. Follow SUPABASE_SETUP.md..."**
- ✅ This confirms the error handling works!

### Test 5: Logout
- ✅ Logout button works (if accessible)
- ✅ Page reloads
- ✅ Session cleared
- ✅ Auth overlay appears again

---

## 🐛 Potential Issues to Watch For

### Issue 1: Module Import Fails
**Symptom:** Console error about module loading
**Check:** 
- Is `<script>` tag in `index.html` set to `type="module"`?
- Network tab shows 200 OK for supabase-js?

### Issue 2: CORS Error
**Symptom:** Console error about CORS policy
**Unlikely:** jsdelivr CDN should work fine
**Workaround:** Use different CDN (unpkg, esm.sh)

### Issue 3: Supabase Connection Fails
**Symptom:** "Failed to fetch" or network errors
**Check:**
- Is Supabase URL correct?
- Is anon key valid?
- Is internet connection working?

### Issue 4: Auth Overlay Doesn't Show Email/Password
**Symptom:** Still shows old Name/Password UI
**Check:**
- Is correct version of `index.html` loaded?
- Hard refresh (Ctrl+Shift+R)
- Check line 21-45 in `index.html`

### Issue 5: Error Message Not Displayed
**Symptom:** Clicking buttons does nothing
**Check:**
- Console for JavaScript errors
- Is `authError` element present?
- Are event listeners attached?

---

## 📸 Screenshots to Capture

1. **Initial auth overlay** (Email/Password fields, Sign in/Sign up buttons)
2. **Console on page load** (check for import errors)
3. **Network tab** (Supabase module load)
4. **After clicking Sign up** (success message or error)
5. **After clicking Sign in** (coupleId error message)
6. **Console errors** (if any)

---

## 🔧 Manual Console Tests

Open DevTools (F12) and try these commands:

### Check Supabase Client:
```javascript
// Should be defined:
console.log('Supabase client exists:', typeof sb !== 'undefined')
console.log('Supabase client:', sb)
```

### Check Current Session:
```javascript
sb.auth.getSession().then(({ data, error }) => {
  console.log('Session:', data.session)
  console.log('Error:', error)
})
```

### Check Current User:
```javascript
sb.auth.getUser().then(({ data, error }) => {
  console.log('User:', data.user)
  console.log('Error:', error)
})
```

### Manual Sign Out:
```javascript
sb.auth.signOut().then(() => {
  console.log('Signed out')
  location.reload()
})
```

### Test coupleId Check:
```javascript
console.log('Couple ID:', CONFIG.supabase.coupleId)
console.log('Is empty:', CONFIG.supabase.coupleId === "")
```

---

## ✅ Success Criteria

All tests pass if:

1. ✅ Page loads without console errors
2. ✅ Supabase module imports successfully from CDN
3. ✅ Auth overlay shows Email/Password fields
4. ✅ Sign up button works and shows appropriate message
5. ✅ Sign in button shows **coupleId error** (this is expected!)
6. ✅ Error message is clear and helpful
7. ✅ Logout works (if accessible)
8. ✅ No module/import/CORS errors in console

---

## 📝 Test Report Template

```
=== SUPABASE AUTHENTICATION TEST REPORT ===

Date: February 12, 2026
Tester: [Your name]
Browser: [Chrome/Firefox/Safari/Edge]
Browser Version: [Version number]
URL: http://localhost:5174

--- Test 1: Page Load ---
✅ / ❌  Auth overlay visible
✅ / ❌  Email field present
✅ / ❌  Password field present
✅ / ❌  Sign in button present
✅ / ❌  Sign up button present
✅ / ❌  No console errors
Notes: [Any issues?]

--- Test 2: CDN Import ---
✅ / ❌  Supabase module loaded
✅ / ❌  No module import errors
✅ / ❌  Network tab shows 200 OK
✅ / ❌  No CORS errors
Notes: [Any issues?]

--- Test 3: Sign Up ---
Email used: [e.g., test@example.com]
Password used: [e.g., password123]
✅ / ❌  Button clicked successfully
Response message: [Copy exact message]
Expected: "Account created. If email confirmations..."
Match: ✅ / ❌
Notes: [Any issues?]

--- Test 4: Sign In ---
Email used: [same as above]
Password used: [same as above]
✅ / ❌  Button clicked successfully
Response message: [Copy exact message]
Expected: "Supabase coupleId is not set..." OR "Email not confirmed"
Match: ✅ / ❌
Notes: [Any issues?]

--- Test 5: Logout ---
✅ / ❌  Logout button accessible
✅ / ❌  Logout triggered successfully
✅ / ❌  Page reloaded
✅ / ❌  Session cleared
✅ / ❌  Auth overlay appeared again
Notes: [Any issues?]

--- Console Errors ---
[List any errors here, or write "None"]

--- Overall Assessment ---
[Your thoughts on the Supabase integration]

--- Issues Found ---
[List any bugs or problems]

--- Recommendations ---
[Any suggestions]
```

---

## 🚀 Next Steps After Testing

1. **If all tests pass:** Supabase integration is working!
2. **Next:** Follow `SUPABASE_SETUP.md` to:
   - Set up database tables
   - Create a couple record
   - Add couple members
   - Set `CONFIG.supabase.coupleId`
3. **Then:** Test full authentication flow with real couple data

---

## 📞 Troubleshooting

If you encounter issues:

1. **Check console** (F12) for errors
2. **Check network tab** for failed requests
3. **Hard refresh** (Ctrl+Shift+R) to clear cache
4. **Check `index.html`** - should have `type="module"` on script tag
5. **Check `app.js`** - should have import statement at top
6. **Check CONFIG** - Supabase URL and key should be set

---

## 🎉 Ready to Test!

1. Open http://localhost:5174
2. Open DevTools (F12)
3. Follow the test scenarios above
4. Take screenshots
5. Note any console errors
6. Fill out test report

**Estimated Time:** 10-15 minutes

Good luck! 🚀
