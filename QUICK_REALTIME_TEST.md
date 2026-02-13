# Quick Real-Time Test - 3 Minute Guide

**URL:** http://localhost:5175
**Goal:** Verify real-time scoreboard updates work

---

## ⚡ Super Quick Test (3 minutes)

### Test 1: Sign In & Scoreboard Populates (30 seconds)

1. Open http://localhost:5175
2. Sign in with existing account
3. Click menu (☰)
4. **Check scoreboard**

**Expected:**
```
Scoreboard (this device):
James: 67% (2/3) • Jess: 100% (1/1)
↑ Populated immediately, no refresh
```

✅ / ❌  Scoreboard populates without refresh

---

### Test 2: Answer & Immediate Update (30 seconds)

1. Note current accuracy (e.g., "67%")
2. Answer a question (click JAMES or JESS)
3. Open menu immediately
4. **Check accuracy**

**Expected:**
```
Before: 67% (2/3)
After:  75% (3/4)  ← Updated without refresh!
```

✅ / ❌  Scoreboard updates after answering (no refresh)

---

### Test 3: Cross-Device Real-Time (2 minutes)

1. **Tab 1:** Keep menu open, note Jess's stats
2. **Tab 2:** Open incognito (Ctrl+Shift+N)
3. **Tab 2:** Go to http://localhost:5175
4. **Tab 2:** Sign in as Jess
5. **Tab 2:** Answer a question
6. **Tab 1:** Watch menu (don't touch anything!)

**Expected:**
```
Tab 1 menu updates automatically within 1-3 seconds
Jess's stats change from 100% (1/1) to 100% (2/2)
No refresh, no clicking needed in Tab 1!
```

✅ / ❌  Tab 1 updates when Tab 2 answers (real-time!)

---

## 🔍 Console Check (30 seconds)

Press F12 → Console tab

**Expected:** No errors

**Check for:**
```javascript
// Should work:
sb.getChannels()
// Shows: [{topic: "realtime:mm_answers_...", state: "joined"}]
```

✅ / ❌  No console errors
✅ / ❌  Real-time channel exists

---

## ✅ Success Criteria

**All tests pass if:**
- Scoreboard populates on sign in (no refresh)
- Scoreboard updates after answering (no refresh)
- Tab 1 updates when Tab 2 answers (no refresh)
- No console errors

---

## 🐛 Common Issues

### Issue: Scoreboard shows "—" or "0%"
**Fix:** Check if you have answers in database

### Issue: Stats don't update after answering
**Fix:** Check console for errors, verify real-time enabled

### Issue: Cross-device doesn't work
**Fix:** Check both tabs use same coupleId, verify WebSocket connected

---

## 📊 Quick Test Results

```
Date: [Fill in]
Browser: [Fill in]

✅ / ❌  Scoreboard populates on sign in
✅ / ❌  Updates after answering
✅ / ❌  Cross-device updates work
✅ / ❌  No console errors

Overall: PASS / FAIL

Notes: [Any issues?]
```

---

## 📁 Detailed Guides

For more detailed testing:
- **REALTIME_TEST_GUIDE.md** - Comprehensive testing guide
- **REALTIME_VISUAL_GUIDE.md** - Visual reference with examples

---

## 🚀 That's It!

**Total time:** 3 minutes
**Expected result:** Everything updates without refresh!

The key test is #3 (cross-device). If Tab 1 updates when Tab 2 answers, real-time works! 🎉

Good luck! ✨
