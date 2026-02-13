# Quick UI Test - 3 Minute Guide

**URL:** http://localhost:5176
**Goal:** Verify UI improvements work

---

## ⚡ Super Quick Test (3 minutes)

### Test 1: Login Modal - No Overflow (15 seconds)

1. Open http://localhost:5176
2. Look at email field
3. Try typing long email: `verylongemailaddress@example.com`

**Expected:** Text stays within field, no cutoff

✅ / ❌  Email field doesn't overflow

---

### Test 2: Sign In (15 seconds)

1. Enter your email
2. Enter your password
3. Click "Sign in"

**Expected:** Auth closes, game appears

✅ / ❌  Sign in works

---

### Test 3: Menu Layout (30 seconds)

1. Click menu (☰)
2. Check top: "Signed in as [Name]"
3. Scroll to bottom: "Log out" link

**Expected:**
- "Signed in as" is clean, bold name
- "Log out" is small, gray, right-aligned at bottom

✅ / ❌  Menu layout looks clean
✅ / ❌  Logout is small link at bottom

---

### Test 4: New Scoreboards (30 seconds)

1. Menu still open
2. Find "TODAY (PER QUESTION)"
3. Find "OVERALL (DAYS FINISHED)"

**Expected:**

**Today Grid:**
```
       Q1    Q2    Q3
James  ✓     ✗     ✓     ← 2 rows
Jess   ✓     ✓     ✓     ← 3 columns
```

**Overall Pills:**
```
James
[1/3 × 2] [2/3 × 1] [3/3 × 5]  ← Colored pills
```

✅ / ❌  Today grid appears (2 rows × 3 columns)
✅ / ❌  Overall pills appear (gray, orange, green)

---

### Test 5: Grid Updates (1 minute)

1. Close menu
2. Answer a question (click JAMES or JESS)
3. Open menu immediately
4. Check "Today (per question)" grid

**Expected:** Grid updates, new answer shows (no refresh)

✅ / ❌  Grid updates after answering (no refresh)

---

### Test 6: Console Check (15 seconds)

1. Press F12
2. Check Console tab

**Expected:** No errors

✅ / ❌  No console errors

---

## ✅ Success Criteria

**All tests pass if:**
- Email field doesn't overflow
- Menu layout is clean
- Logout is small link at bottom
- Today grid appears (2 rows × 3 columns)
- Overall pills appear (colored)
- Grid updates after answering (no refresh)
- No console errors

---

## 🐛 Common Issues

### Issue: Email still overflows
**Fix:** Check `styles.css` has `width: 100%; max-width: 100%;`

### Issue: Grid doesn't appear
**Fix:** Check you have answered questions today

### Issue: Pills don't appear
**Fix:** Check you have completed days (3 answers per day)

### Issue: Grid doesn't update
**Fix:** Check console for errors, verify real-time enabled

---

## 📊 Quick Test Results

```
Date: [Fill in]
Browser: [Fill in]

✅ / ❌  Email no overflow
✅ / ❌  Sign in works
✅ / ❌  Menu layout clean
✅ / ❌  Logout small link
✅ / ❌  Today grid appears
✅ / ❌  Overall pills appear
✅ / ❌  Grid updates
✅ / ❌  No errors

Overall: PASS / FAIL

Notes: [Any issues?]
```

---

## 📁 Detailed Guides

For more detailed testing:
- **UI_IMPROVEMENTS_TEST.md** - Comprehensive testing guide
- **UI_VISUAL_REFERENCE.md** - Visual reference with examples

---

## 🚀 That's It!

**Total time:** 3 minutes
**Expected result:** All UI improvements work!

The key tests are:
1. Email field no overflow
2. Today grid appears (2 rows × 3 columns)
3. Overall pills appear (colored)
4. Grid updates without refresh

Good luck! 🎉
