# Supabase Auth - Visual Testing Reference

**Quick visual guide for what to expect**

---

## 🎯 What You Should See

### 1. Initial Page Load (Auth Overlay)

```
┌─────────────────────────────────────────┐
│                                         │
│        Message Mayhem                   │
│        Sign in (Supabase)               │
│                                         │
│        EMAIL                            │
│        [                              ] │
│                                         │
│        PASSWORD                         │
│        [                              ] │
│                                         │
│   [  Sign in  ]    [  Sign up  ]       │
│                                         │
│   [Error message appears here]          │
│                                         │
└─────────────────────────────────────────┘
```

**Key Visual Elements:**
- Dark overlay covering entire page
- White card in center
- Title: "Message Mayhem"
- Subtitle: "Sign in (Supabase)"
- Email input (type="email")
- Password input (type="password", dots/asterisks)
- Sign in button: **DARK/BLACK** (primary)
- Sign up button: **GRAY** (secondary)
- Error area: Empty initially, RED text when error

---

## 🎯 Test Scenario 1: Sign Up

### Click "Sign up" with fake credentials

**Input:**
```
Email:    test@example.com
Password: password123
```

**Expected Visual Response:**

```
┌─────────────────────────────────────────┐
│        Message Mayhem                   │
│        Sign in (Supabase)               │
│                                         │
│        EMAIL                            │
│        [test@example.com              ] │
│                                         │
│        PASSWORD                         │
│        [••••••••••••                  ] │
│                                         │
│   [  Sign in  ]    [  Sign up  ]       │
│                                         │
│   Account created. If email             │
│   confirmations are enabled, confirm    │
│   your email then sign in.              │
│   ↑ RED TEXT                            │
└─────────────────────────────────────────┘
```

**Message Color:** 🔴 Red (`#b42318`)
**Auth Overlay:** Stays open
**Page Reload:** No

---

## 🎯 Test Scenario 2: Sign In (Email Not Confirmed)

### Click "Sign in" with same credentials

**If Supabase has email confirmation enabled:**

```
┌─────────────────────────────────────────┐
│        Message Mayhem                   │
│        Sign in (Supabase)               │
│                                         │
│        EMAIL                            │
│        [test@example.com              ] │
│                                         │
│        PASSWORD                         │
│        [••••••••••••                  ] │
│                                         │
│   [  Sign in  ]    [  Sign up  ]       │
│                                         │
│   Email not confirmed                   │
│   ↑ RED TEXT                            │
└─────────────────────────────────────────┘
```

**OR:**

```
│   Invalid login credentials             │
│   ↑ RED TEXT                            │
```

---

## 🎯 Test Scenario 3: Sign In (Email Confirmed, No coupleId)

### Click "Sign in" after email is confirmed

**This is the KEY test - should show coupleId error:**

```
┌─────────────────────────────────────────┐
│        Message Mayhem                   │
│        Sign in (Supabase)               │
│                                         │
│        EMAIL                            │
│        [test@example.com              ] │
│                                         │
│        PASSWORD                         │
│        [••••••••••••                  ] │
│                                         │
│   [  Sign in  ]    [  Sign up  ]       │
│                                         │
│   Supabase coupleId is not set. Follow  │
│   SUPABASE_SETUP.md and paste the       │
│   couple id into CONFIG.supabase.       │
│   coupleId.                             │
│   ↑ RED TEXT                            │
└─────────────────────────────────────────┘
```

**Message Color:** 🔴 Red
**Auth Overlay:** Stays open
**This confirms:** 
- ✅ Supabase auth worked (sign in succeeded)
- ✅ Error handling works (caught empty coupleId)
- ✅ User-friendly error message displayed

---

## 🎯 Console View (DevTools)

### Expected Console (No Errors):

```
Console
  ▼ Network
    ✅ @supabase/supabase-js@2/+esm  200 OK  1.2 MB
  
  (No errors)
```

### If Module Import Fails:

```
Console
  ❌ Failed to load module script: Expected a JavaScript module 
     script but the server responded with a MIME type of "text/html"
```

### If Supabase Connection Fails:

```
Console
  ❌ Failed to fetch
  ❌ TypeError: Cannot read properties of undefined
```

---

## 🎯 Network Tab View

### Expected Network Requests:

```
Network Tab (Filter: supabase)
┌──────────────────────────────────────────────────────────┐
│ Name                              Status    Type    Size  │
├──────────────────────────────────────────────────────────┤
│ @supabase/supabase-js@2/+esm      200 OK    script  1.2MB│
│ ↑ Should be GREEN                                         │
└──────────────────────────────────────────────────────────┘
```

### When You Click "Sign Up":

```
Network Tab (Filter: auth)
┌──────────────────────────────────────────────────────────┐
│ Name                              Status    Type    Size  │
├──────────────────────────────────────────────────────────┤
│ signup                            200 OK    xhr     1.5KB │
│ ↑ POST to Supabase auth endpoint                         │
└──────────────────────────────────────────────────────────┘
```

### When You Click "Sign In":

```
Network Tab (Filter: auth)
┌──────────────────────────────────────────────────────────┐
│ Name                              Status    Type    Size  │
├──────────────────────────────────────────────────────────┤
│ token?grant_type=password         200 OK    xhr     2.1KB │
│ ↑ POST to Supabase auth endpoint                         │
│                                                           │
│ (If email confirmed, may also see:)                      │
│ couple_members                    400 Bad   xhr     0.5KB │
│ ↑ Database query (fails because coupleId empty)          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Button States

### Sign In Button (Primary):
```css
Background: #121213 (almost black)
Color: white
Font weight: Bold (750)
Hover: Slightly lighter
```

### Sign up Button (Secondary):
```css
Background: #d3d6da (light gray)
Color: #121213 (dark text)
Font weight: Bold (750)
Hover: Slightly darker
```

### Both Buttons:
```
Height: 58px
Border radius: 6px
Width: ~50% of card width each
```

---

## 🎯 Error Message Styling

### Location:
```html
<div class="authError" id="authError"></div>
```

### CSS:
```css
.authError {
  min-height: 18px;
  color: #b42318;  /* Red */
  font-size: 12px;
}
```

### Visual:
- **Color:** 🔴 Bright red
- **Size:** Small (12px)
- **Position:** Below buttons
- **Min height:** 18px (even when empty)

---

## 🎯 Comparison: Old vs New Auth UI

### OLD (Port 5173):
```
┌─────────────────────────────────────────┐
│        Message Mayhem                   │
│        Quick login (not secure)         │
│                                         │
│        NAME                             │
│        [James ▼]  ← Dropdown            │
│                                         │
│        PASSWORD                         │
│        [1234                          ] │
│                                         │
│   [  Enter  ]      [  Hint  ]          │
└─────────────────────────────────────────┘
```

### NEW (Port 5174):
```
┌─────────────────────────────────────────┐
│        Message Mayhem                   │
│        Sign in (Supabase)               │
│                                         │
│        EMAIL                            │
│        [                              ] │
│                                         │
│        PASSWORD                         │
│        [                              ] │
│                                         │
│   [  Sign in  ]    [  Sign up  ]       │
└─────────────────────────────────────────┘
```

**Key Differences:**
- ❌ No more name dropdown
- ✅ Email input instead
- ❌ No more "Hint" button
- ✅ "Sign up" button instead
- ✅ Subtitle changed to "Sign in (Supabase)"

---

## 🎯 Code Flow Visualization

### Sign Up Flow:
```
User enters email + password
         ↓
Clicks "Sign up" button
         ↓
JavaScript: signUpBtn click handler (line 309)
         ↓
Calls: signUpWithEmailPassword(email, pw) (line 319)
         ↓
Supabase: sb.auth.signUp({ email, password }) (line 197)
         ↓
Network: POST to Supabase auth/signup endpoint
         ↓
Response: { user, session } or { error }
         ↓
If success: Show "Account created..." message (line 320-322)
If error: Show error.message (line 324)
         ↓
Auth overlay stays open
```

### Sign In Flow:
```
User enters email + password
         ↓
Clicks "Sign in" button (or presses Enter)
         ↓
JavaScript: form submit handler (line 295)
         ↓
Calls: signInWithEmailPassword(email, pw) (line 302)
         ↓
Supabase: sb.auth.signInWithPassword({ email, password }) (line 191)
         ↓
Network: POST to Supabase auth/token endpoint
         ↓
If email not confirmed: Error "Email not confirmed"
If credentials wrong: Error "Invalid login credentials"
If success: Returns user object
         ↓
Calls: finish(user) (line 303)
         ↓
Calls: fetchMyMembership(user.id) (line 268)
         ↓
Checks: CONFIG.supabase.coupleId (line 207)
         ↓
If empty: Throws error "Supabase coupleId is not set..." ← KEY TEST
         ↓
Error caught and displayed (line 305)
         ↓
Auth overlay stays open
```

---

## 🎯 Expected Test Timeline

### Minute 0-1: Page Load
- ✅ Auth overlay appears
- ✅ Email/Password fields visible
- ✅ No console errors

### Minute 1-2: Sign Up
- ✅ Enter fake email/password
- ✅ Click "Sign up"
- ✅ See success message

### Minute 2-3: Sign In (First Attempt)
- ✅ Click "Sign in"
- ✅ See "Email not confirmed" error (expected)

### Minute 3-5: Check Console
- ✅ No module import errors
- ✅ No CORS errors
- ✅ Supabase client initialized

### Minute 5-10: Sign In (After Confirmation)
- ✅ If you confirm email (or if confirmation disabled)
- ✅ Click "Sign in" again
- ✅ See "Supabase coupleId is not set..." error
- ✅ **This is the success condition!**

---

## 🎯 Success Indicators

### ✅ Everything Works If:

1. **Auth overlay shows:**
   - Email field (not name dropdown)
   - Password field
   - "Sign in" and "Sign up" buttons

2. **Console shows:**
   - No module import errors
   - No CORS errors
   - Supabase client exists

3. **Sign up shows:**
   - "Account created..." message
   - OR appropriate error (weak password, etc.)

4. **Sign in shows:**
   - "Email not confirmed" (if confirmation enabled)
   - OR "Supabase coupleId is not set..." (if email confirmed)
   - This error message is **EXPECTED** and **CORRECT**!

5. **Network tab shows:**
   - Supabase module loaded (200 OK)
   - Auth requests sent to Supabase
   - Responses received

---

## 🎯 Failure Indicators

### ❌ Something's Wrong If:

1. **Console shows:**
   - Module import errors
   - CORS errors
   - "createClient is not defined"

2. **Auth overlay shows:**
   - Old UI (name dropdown)
   - No email field
   - "Enter" and "Hint" buttons

3. **Buttons don't work:**
   - Clicking does nothing
   - No error messages appear
   - No network requests sent

4. **Network tab shows:**
   - 404 errors for Supabase module
   - Failed requests to Supabase
   - CORS policy errors

---

## 📸 Screenshot Checklist

Take these screenshots:

1. ✅ **Initial auth overlay** (full view)
2. ✅ **Console on page load** (showing no errors)
3. ✅ **Network tab** (Supabase module loaded)
4. ✅ **After Sign up** (success message)
5. ✅ **After Sign in** (coupleId error message)
6. ✅ **Console errors** (if any - hopefully none!)

---

## 🚀 Quick Test (30 seconds)

**Fastest way to verify Supabase integration:**

1. Open http://localhost:5174
2. Press F12 (open console)
3. Look for errors (should be none)
4. Check auth overlay has Email/Password fields
5. Enter: `test@example.com` / `password123`
6. Click "Sign up"
7. Look for: "Account created..." message

**If you see that message → Supabase integration works! ✅**

---

## 🎉 You're Ready!

Open http://localhost:5174 and follow the visual guide above.

**Remember:** The coupleId error is **EXPECTED** and **CORRECT**! It means:
- ✅ Supabase auth works
- ✅ Sign in succeeded
- ✅ Error handling works
- ✅ Ready for next step (setting up couple data)
