# Message Mayhem - Testing Checklist

## Test Date: [Fill in]
## Tester: [Fill in]
## URL: http://localhost:5173

---

## ✅ Test 1: Login
**Steps:**
1. Navigate to http://localhost:5173
2. Select "James" from dropdown
3. Enter password "1234"
4. Click "Enter"

**Expected Result:**
- [ ] Auth overlay closes
- [ ] Main game board appears
- [ ] Menu shows "Signed in as James"

**Actual Result:**
```
[Fill in your observations]
```

**Console Errors:**
```
[Check browser console - F12]
```

---

## ✅ Test 2: Answering Question - Tiles Fill with Actual Speaker
**Code Location:** `app.js` lines 506-519

**Steps:**
1. Read the first question
2. Click either JAMES or JESS button (try guessing wrong on purpose)
3. Observe the row tiles

**Expected Result:**
- [ ] Row's 5 tiles fill with letters spelling the ACTUAL speaker's name
- [ ] Even if you guessed JESS but JAMES said it, tiles show "JAMES"
- [ ] Even if you guessed JAMES but JESS said it, tiles show "JESS " (with space)
- [ ] Tiles turn GREEN if you guessed correctly
- [ ] Tiles turn GRAY if you guessed wrong

**Actual Result:**
```
Question: [Copy question text]
Correct answer: [JAMES or JESS]
Your guess: [JAMES or JESS]
Tiles show: [What letters appeared?]
Tile color: [Green or gray?]
```

**Console Errors:**
```
[Any errors?]
```

---

## ✅ Test 3: Correct Answer - Confetti Animation
**Code Location:** `app.js` lines 627-628, `styles.css` lines 342-377

**Steps:**
1. Answer a question CORRECTLY
2. Watch for confetti animation

**Expected Result:**
- [ ] Confetti pieces (colored rectangles) fall from top of screen
- [ ] Animation lasts ~2.1 seconds
- [ ] Confetti has multiple colors (green, orange, blue, purple, red)
- [ ] ~90 pieces total

**Actual Result:**
```
Confetti appeared: [Yes/No]
Colors visible: [List colors]
Duration: [Approximate seconds]
Any visual glitches: [Describe]
```

**Console Errors:**
```
[Any errors?]
```

---

## ✅ Test 4: Wrong Answer - Shake Animation
**Code Location:** `app.js` lines 629-631, `styles.css` lines 301-324

**Steps:**
1. Answer a question INCORRECTLY
2. Watch the board

**Expected Result:**
- [ ] Board shakes horizontally (left-right motion)
- [ ] Animation lasts ~420ms
- [ ] Shake is visible and smooth

**Actual Result:**
```
Shake appeared: [Yes/No]
Shake direction: [Horizontal/Vertical/Other]
Duration: [Approximate milliseconds]
Smooth animation: [Yes/No]
```

**Console Errors:**
```
[Any errors?]
```

---

## ✅ Test 5: Button Feedback After Answering
**Code Location:** `app.js` lines 408-421

### Test 5a: Correct Guess
**Steps:**
1. Answer a question CORRECTLY (e.g., click JAMES when JAMES is correct)
2. Observe both buttons

**Expected Result:**
- [ ] Correct button (JAMES) turns GREEN
- [ ] Correct button shows white text
- [ ] Other button (JESS) is DIMMED (opacity ~55%)
- [ ] Both buttons are DISABLED (cannot click)

**Actual Result:**
```
Correct button color: [Green/Other]
Correct button text color: [White/Other]
Other button opacity: [Dimmed/Normal]
Buttons disabled: [Yes/No]
```

### Test 5b: Wrong Guess
**Steps:**
1. Answer a question INCORRECTLY (e.g., click JESS when JAMES is correct)
2. Observe both buttons

**Expected Result:**
- [ ] Correct button (JAMES) turns GREEN
- [ ] Wrong button (JESS - the one you clicked) turns RED
- [ ] Both buttons show white text
- [ ] Both buttons are DISABLED

**Actual Result:**
```
Correct button (not clicked) color: [Green/Other]
Wrong button (clicked) color: [Red/Other]
Any button dimmed incorrectly: [Yes/No - describe]
Buttons disabled: [Yes/No]
```

**Console Errors:**
```
[Any errors?]
```

---

## ✅ Test 6: Debug Reset Functionality
**Code Location:** `app.js` lines 648-683

**Steps:**
1. Answer at least 1-2 questions (note your accuracy %)
2. Navigate to http://localhost:5173?debug=1 (add ?debug=1)
3. Click menu button (☰)
4. Verify "Debug" section is visible
5. Note current accuracy stats
6. Click "Reset today's quiz (this user)"
7. Check if confirmation dialog appears (EXPECTED: No - this is a bug)
8. Observe the results

**Expected Result:**
- [ ] Debug section visible with ?debug=1
- [ ] Board clears to empty tiles (no letters)
- [ ] All tiles return to default state (white background, gray border)
- [ ] Accuracy percentage DECREASES (today's attempts subtracted)
- [ ] Status message: "Debug: reset complete. Pick JAMES or JESS."
- [ ] Can answer questions again
- [ ] ⚠️ **BUG**: No confirmation dialog appears (should ask before resetting)

**Actual Result:**
```
Debug section visible: [Yes/No]
Board cleared: [Yes/No]
Accuracy before reset: [X%]
Accuracy after reset: [Y%]
Can answer again: [Yes/No]
Status message: [Copy exact text]
Confirmation dialog appeared: [Yes/No]
```

**Console Errors:**
```
[Any errors?]
```

---

## 🐛 Known Issues / Bugs Found

### Issue 1: Missing Confirmation on Debug Reset
**Severity:** Medium
**Location:** `app.js` line 676
**Description:** The debug reset button doesn't ask for confirmation before deleting data.
**Suggested Fix:**
```javascript
debugResetTodayBtn?.addEventListener("click", () => {
  if (confirm("Reset today's quiz? This will clear your answers and update your accuracy.")) {
    debugResetDayForUser(usedKey || requestedKey);
  }
});
```

### Issue 2: [Add any bugs you find]
**Severity:** 
**Location:** 
**Description:** 
**Steps to Reproduce:**

---

## Additional Tests

### Test: Multiple Questions
**Steps:**
1. Answer all questions for the day
2. Click "NEXT" button between questions
3. Verify each question's state persists

**Result:**
```
[Your observations]
```

### Test: Clicking Tiles
**Steps:**
1. Click on different row tiles
2. Verify clicking a tile switches to that question

**Result:**
```
[Your observations]
```

### Test: Menu Stats
**Steps:**
1. Open menu
2. Verify "Today" date is correct
3. Verify "Accuracy" matches your performance
4. Check scoreboard shows both James and Jess stats

**Result:**
```
Today date: [Correct/Incorrect]
Accuracy: [Matches/Doesn't match]
Scoreboard: [Correct/Incorrect]
```

---

## Summary

**Total Tests:** 6 main scenarios
**Passed:** [ ]
**Failed:** [ ]
**Bugs Found:** [ ]

**Overall Assessment:**
```
[Your overall impression of the app functionality]
```

**Critical Issues:**
```
[List any blocking issues]
```

**Recommendations:**
```
[Any suggestions for improvements]
```
