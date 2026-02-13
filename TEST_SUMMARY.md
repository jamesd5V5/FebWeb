# Message Mayhem - Test Summary & Instructions

**Date:** February 12, 2026
**Server Status:** ✅ Running on http://localhost:5173 (Port 5173, PID 20280)

---

## 🎯 Quick Start - Manual Testing

Since browser automation tools are not available, please follow these manual testing steps:

### 1. Open the Application
```
URL: http://localhost:5173
```

### 2. Login
- **Username:** James
- **Password:** 1234

---

## ✅ Test Scenarios (In Order)

### Test 1: Correct Answer → Confetti
1. Read the first question
2. **Click the CORRECT speaker button** (check the question to know who said it, or guess)
3. **VERIFY:**
   - ✅ Row tiles fill with actual speaker's name (5 letters)
   - ✅ Tiles turn GREEN
   - ✅ Confetti animation plays (colored pieces fall from top)
   - ✅ Correct button turns GREEN
   - ✅ Other button is DIMMED
   - ✅ Both buttons are DISABLED
   - ✅ Status shows "Correct."

**Expected Confetti:**
- ~90 colored pieces
- Colors: green, orange, blue, purple, red
- Falls from top to bottom
- Lasts ~2.1 seconds

---

### Test 2: Wrong Answer → Shake
1. Click "NEXT" button to go to next question
2. **Click the WRONG speaker button** (intentionally guess wrong)
3. **VERIFY:**
   - ✅ Row tiles fill with actual speaker's name (NOT your guess)
   - ✅ Tiles turn GRAY
   - ✅ Board shakes horizontally (left-right motion)
   - ✅ Correct button turns GREEN
   - ✅ Wrong button (your guess) turns RED
   - ✅ Both buttons are DISABLED
   - ✅ Status shows "Wrong. It was [Name]."

**Expected Shake:**
- Horizontal oscillation
- ~420ms duration
- 5 back-and-forth movements

---

### Test 3: Tiles Always Show Actual Speaker
1. For each question you answer (correct or wrong):
2. **VERIFY:**
   - ✅ The 5 tiles ALWAYS show who ACTUALLY said it
   - ✅ NOT who you guessed
   - ✅ Example: If you guess JESS but JAMES said it, tiles show "JAMES"

---

### Test 4: Button States After Answering
**After answering any question, verify button states:**

#### If you guessed CORRECTLY:
- ✅ Correct button: GREEN background, white text
- ✅ Other button: DIMMED (opacity ~55%)
- ✅ Both buttons: DISABLED (cannot click)

#### If you guessed WRONG:
- ✅ Correct button (not clicked): GREEN background, white text
- ✅ Wrong button (you clicked): RED background, white text
- ⚠️ **Note:** Wrong button may appear slightly dimmed (known cosmetic issue)
- ✅ Both buttons: DISABLED (cannot click)

---

### Test 5: Debug Reset
1. **Add `?debug=1` to URL:**
   ```
   http://localhost:5173?debug=1
   ```
2. Refresh the page
3. Click the **menu button (☰)** in top-left
4. **VERIFY:** Debug section is visible at bottom of menu
5. **Note your current accuracy** (e.g., "67% (2/3)")
6. Click **"Reset today's quiz (this user)"**
7. ⚠️ **BUG CHECK:** Does a confirmation dialog appear?
   - **Expected:** NO (this is Bug #1 - should have confirmation)
   - If it resets immediately without asking, this confirms the bug
8. **VERIFY after reset:**
   - ✅ Board clears to empty tiles (no letters)
   - ✅ All tiles return to default (white background, gray border)
   - ✅ Accuracy percentage DECREASES
     - Example: Was 67% (2/3) → Now 0% (0/0)
   - ✅ Status shows: "Debug: reset complete. Pick JAMES or JESS."
   - ✅ You can answer questions again
   - ✅ Menu scoreboard updates

---

## 🐛 Known Bugs to Verify

### Bug #1: Missing Confirmation Dialog ⚠️
**Location:** Debug reset button
**Expected Behavior:** Should ask "Are you sure?" before resetting
**Actual Behavior:** Immediately resets without confirmation
**How to Test:** Follow Test 5 above
**Severity:** Medium (debug feature only)

### Bug #2: Wrong Button Appears Dimmed 🎨
**Location:** Wrong answer button feedback
**Expected Behavior:** Wrong button should be bright RED
**Actual Behavior:** Wrong button is RED but slightly dimmed (opacity 55%)
**How to Test:** Answer a question wrong, observe button opacity
**Severity:** Low (cosmetic only)

---

## 📋 Detailed Checklist

For a comprehensive testing checklist, see: **`TESTING_CHECKLIST.md`**

For detailed bug analysis, see: **`BUG_REPORT.md`**

---

## 🔍 Console Errors to Check

Open browser console (F12) and watch for:

1. **During page load:**
   - ✅ No fetch errors for `quiz-bank.json`
   - ✅ No JavaScript errors

2. **When answering questions:**
   - ✅ No errors when clicking JAMES/JESS buttons
   - ✅ No errors during confetti animation
   - ✅ No errors during shake animation

3. **When using debug reset:**
   - ✅ No errors when resetting
   - ✅ LocalStorage updates correctly

**To check LocalStorage:**
```javascript
// In browser console (F12):
localStorage.getItem('febweb_quiz_progress_v1:james')
localStorage.getItem('febweb_quiz_stats_v1')
```

---

## 📊 Expected Code Behavior

### 1. Tiles Fill Logic (app.js lines 506-519)
```javascript
// Always uses q.answer (actual speaker), not user's guess
setRowLetters(i, SPEAKER_WORD[q.answer] || "");
```

### 2. Confetti Logic (app.js lines 627-628)
```javascript
if (correct) {
  launchConfetti();  // Only on correct answer
}
```

### 3. Shake Logic (app.js lines 629-631)
```javascript
} else {
  shakeBoard();  // Only on wrong answer
}
```

### 4. Button Feedback Logic (app.js lines 408-421)
```javascript
correctBtn?.classList.add("isCorrect");  // Green
if (guessedBtn && guessedBtn !== correctBtn) {
  guessedBtn.classList.add("isWrong");  // Red
}
otherBtn?.classList.add("isDim");  // Dimmed
```

### 5. Debug Reset Logic (app.js lines 648-672)
```javascript
// Subtracts today's attempts from stats
stats[activeName].total -= entries.length;
stats[activeName].correct -= correctCount;
// Clears progress
delete progress[dayKey];
```

---

## 🎬 Testing Recording Suggestions

If you want to record your testing:

1. **Screen Recording:**
   - Windows: Win + G (Game Bar)
   - Record each test scenario
   - Capture confetti and shake animations

2. **Screenshots:**
   - Before answering
   - After correct answer (confetti + green button)
   - After wrong answer (shake + red button)
   - Debug menu with stats
   - After reset (cleared board)

3. **Console Logs:**
   - Take screenshots of any errors
   - Copy error messages exactly

---

## 📝 Test Report Template

After testing, fill this out:

```
=== MESSAGE MAYHEM TEST REPORT ===

Date: [Fill in]
Tester: James
Browser: [Chrome/Firefox/Safari/Edge]
Browser Version: [Fill in]

--- Test 1: Correct Answer + Confetti ---
✅ / ❌  Tiles filled with actual speaker
✅ / ❌  Tiles turned green
✅ / ❌  Confetti appeared
✅ / ❌  Confetti had multiple colors
✅ / ❌  Correct button turned green
✅ / ❌  Other button dimmed
✅ / ❌  Both buttons disabled
Notes: [Any issues?]

--- Test 2: Wrong Answer + Shake ---
✅ / ❌  Tiles filled with actual speaker (not guess)
✅ / ❌  Tiles turned gray
✅ / ❌  Board shook horizontally
✅ / ❌  Correct button turned green
✅ / ❌  Wrong button turned red
✅ / ❌  Both buttons disabled
Notes: [Any issues?]

--- Test 3: Button Feedback ---
✅ / ❌  Correct guess: green + dimmed other
✅ / ❌  Wrong guess: green correct + red wrong
✅ / ❌  Buttons disabled after answering
Notes: [Any issues?]

--- Test 4: Debug Reset ---
✅ / ❌  Debug section visible with ?debug=1
✅ / ❌  Confirmation dialog appeared (Expected: NO - bug)
✅ / ❌  Board cleared after reset
✅ / ❌  Accuracy decreased correctly
✅ / ❌  Can answer again after reset
Notes: [Any issues?]

--- Console Errors ---
[List any errors here]

--- Bugs Confirmed ---
Bug #1 (No confirmation): ✅ / ❌ / N/A
Bug #2 (Dimmed red button): ✅ / ❌ / N/A

--- Overall Assessment ---
[Your thoughts]

--- Recommendations ---
[Suggestions]
```

---

## 🔧 Quick Fixes (If You Want to Apply Them)

### Fix #1: Add Confirmation Dialog
**File:** `app.js` line 676

**Find:**
```javascript
debugResetTodayBtn?.addEventListener("click", () => {
  debugResetDayForUser(usedKey || requestedKey);
});
```

**Replace with:**
```javascript
debugResetTodayBtn?.addEventListener("click", () => {
  if (confirm("Reset today's quiz? This will clear your answers and update your accuracy.")) {
    debugResetDayForUser(usedKey || requestedKey);
  }
});
```

### Fix #2: Prevent Wrong Button Dimming
**File:** `app.js` line 420

**Find:**
```javascript
otherBtn?.classList.add("isDim");
```

**Replace with:**
```javascript
// Only dim if it wasn't the guessed button
if (otherBtn !== guessedBtn) {
  otherBtn.classList.add("isDim");
}
```

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console (F12) for errors
2. Verify server is running: `netstat -ano | findstr :5173`
3. Check `TESTING_CHECKLIST.md` for detailed steps
4. Check `BUG_REPORT.md` for known issues

---

## ✅ Summary

**Server:** Running on http://localhost:5173
**Test Files Created:**
- `TESTING_CHECKLIST.md` - Detailed test steps
- `BUG_REPORT.md` - Code analysis & bugs
- `TEST_SUMMARY.md` - This file

**Known Bugs:**
1. Missing confirmation on debug reset (Medium priority)
2. Wrong button appears dimmed (Low priority, cosmetic)

**Next Steps:**
1. Open http://localhost:5173
2. Login as James / 1234
3. Follow test scenarios above
4. Document any bugs or console errors
5. Optional: Apply quick fixes if desired

Good luck with testing! 🎉
