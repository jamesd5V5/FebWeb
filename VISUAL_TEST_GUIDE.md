# Message Mayhem - Visual Testing Guide

**Quick Reference:** What to look for during each test

---

## 🎯 Test 1: Correct Answer

### What to Click:
1. Open http://localhost:5173
2. Login: James / 1234
3. Read the question
4. Click the CORRECT speaker button (JAMES or JESS)

### What to See:

#### ✅ Board Tiles (5 tiles in a row):
```
Before: [ ] [ ] [ ] [ ] [ ]  (empty, white background)
After:  [J] [A] [M] [E] [S]  (green background, white letters)
   or:  [J] [E] [S] [S] [ ]  (green background, white letters)
```

#### ✅ Confetti Animation:
- **Appearance:** Colored rectangles falling from top
- **Colors:** Mix of green, orange, blue, purple, red
- **Count:** ~90 pieces
- **Duration:** ~2 seconds
- **Motion:** Fall straight down with rotation

#### ✅ Button States:
```
JAMES button:  [GREEN with white text]  ← If JAMES was correct
JESS button:   [GRAY, dimmed 55%]      ← Other button

Both buttons: DISABLED (cursor: not-allowed)
```

#### ✅ Status Message:
```
"Correct."
```

---

## 🎯 Test 2: Wrong Answer

### What to Click:
1. Click "NEXT" button
2. Read the next question
3. Click the WRONG speaker button (intentionally guess wrong)

### What to See:

#### ✅ Board Tiles:
```
Shows ACTUAL speaker, NOT your guess!

Example: You clicked JESS, but JAMES said it
Result: [J] [A] [M] [E] [S]  (gray background, white letters)
```

#### ✅ Shake Animation:
- **Motion:** Board moves left-right horizontally
- **Pattern:** Left → Right → Left → Right → Left → Center
- **Duration:** ~420ms (less than half a second)
- **Amplitude:** ~7px → 5px (decreasing)

#### ✅ Button States:
```
Example: You guessed JESS, but JAMES was correct

JAMES button:  [GREEN with white text]  ← Correct answer
JESS button:   [RED with white text]    ← Your wrong guess

Both buttons: DISABLED
```

**⚠️ Known Issue:** RED button may appear slightly dimmed (Bug #2)

#### ✅ Status Message:
```
"Wrong. It was James."  (or "Wrong. It was Jess.")
```

---

## 🎯 Test 3: Button Feedback Matrix

### Scenario A: Guessed JAMES, Answer is JAMES ✅
```
JAMES button: [GREEN] (correct)
JESS button:  [GRAY, dimmed] (other)
```

### Scenario B: Guessed JESS, Answer is JESS ✅
```
JAMES button: [GRAY, dimmed] (other)
JESS button:  [GREEN] (correct)
```

### Scenario C: Guessed JAMES, Answer is JESS ❌
```
JAMES button: [RED] (wrong guess)
JESS button:  [GREEN] (correct answer)
```

### Scenario D: Guessed JESS, Answer is JAMES ❌
```
JAMES button: [GREEN] (correct answer)
JESS button:  [RED] (wrong guess)
```

---

## 🎯 Test 4: Tiles Always Show Truth

### Important: Tiles show WHO SAID IT, not who you guessed!

#### Example 1: Correct Guess
```
Question: "Good morning!"
Actual speaker: JAMES
Your guess: JAMES ✅

Tiles show: [J] [A] [M] [E] [S] (green)
```

#### Example 2: Wrong Guess
```
Question: "I love you"
Actual speaker: JESS
Your guess: JAMES ❌

Tiles show: [J] [E] [S] [S] [ ] (gray) ← Shows JESS, not JAMES!
```

#### Example 3: Another Wrong Guess
```
Question: "What's for dinner?"
Actual speaker: JAMES
Your guess: JESS ❌

Tiles show: [J] [A] [M] [E] [S] (gray) ← Shows JAMES, not JESS!
```

---

## 🎯 Test 5: Debug Reset

### Setup:
1. Answer at least 2 questions (mix of correct/wrong)
2. Note your accuracy (e.g., "50% (1/2)")
3. Navigate to: http://localhost:5173?debug=1
4. Refresh page

### What to Click:
1. Click menu button (☰) in top-left corner
2. Scroll to bottom of menu
3. Look for "Debug" section

### What to See:

#### ✅ Debug Section Visible:
```
┌─────────────────────────────────┐
│ Debug                           │
│ Testing tools                   │
│                                 │
│ [Reset today's quiz (this user)]│ ← Red button
│                                 │
│ Tip: open with ?debug=1 to     │
│ show this.                      │
└─────────────────────────────────┘
```

### Click "Reset today's quiz (this user)":

#### ⚠️ BUG CHECK #1: Confirmation Dialog
```
Expected: NO dialog (this is the bug!)
Actual: Should show confirm() dialog asking "Are you sure?"

If it resets immediately without asking:
✅ Bug #1 confirmed
```

### After Reset:

#### ✅ Board State:
```
Before: [J] [A] [M] [E] [S]  (filled)
        [J] [E] [S] [S] [ ]  (filled)
        [ ] [ ] [ ] [ ] [ ]  (empty)

After:  [ ] [ ] [ ] [ ] [ ]  (all empty)
        [ ] [ ] [ ] [ ] [ ]  (all empty)
        [ ] [ ] [ ] [ ] [ ]  (all empty)
```

#### ✅ Accuracy Stats:
```
Before: 50% (1/2)
After:  0% (0/0)  ← Today's attempts subtracted
```

#### ✅ Status Message:
```
"Debug: reset complete. Pick JAMES or JESS."
```

#### ✅ Can Answer Again:
- JAMES and JESS buttons are ENABLED
- Clicking them works normally
- Confetti/shake animations work

---

## 🎨 Visual Reference: Colors

### Tile Colors:
- **Empty:** White background (#fbfbfb), gray border (#d3d6da)
- **Active:** White background, darker gray border (#878a8c)
- **Correct:** Green background (#6aaa64), white text
- **Wrong:** Gray background (#787c7e), white text

### Button Colors:
- **Default:** Light gray background (#d3d6da), black text
- **isCorrect:** Green background (#6aaa64), white text
- **isWrong:** Red background (#b42318), white text
- **isDim:** 55% opacity (0.55)

### Confetti Colors:
- Green: #6aaa64
- Orange: #f59e0b
- Blue: #60a5fa
- Purple: #a78bfa
- Red: #ef4444

---

## 📸 Screenshot Checklist

Take screenshots of:

1. **Initial state:** Empty board after login
2. **Correct answer:** Green tiles + confetti (mid-animation if possible)
3. **Wrong answer:** Gray tiles + red button
4. **Button feedback:** Both scenarios (correct/wrong)
5. **Debug menu:** With stats visible
6. **After reset:** Empty board + updated stats

---

## 🎬 Animation Timing

### Confetti:
- **Start:** Immediately on correct answer
- **Fade in:** 0-250ms (pieces appear)
- **Fall:** 250-2100ms (pieces fall and rotate)
- **Fade out:** 2100-2600ms (pieces disappear)
- **Total:** ~2.6 seconds

### Shake:
- **Start:** Immediately on wrong answer
- **Duration:** 420ms
- **Keyframes:**
  - 0ms: Center
  - 76ms: Left (-7px)
  - 151ms: Right (+7px)
  - 227ms: Left (-5px)
  - 302ms: Right (+5px)
  - 420ms: Center

### Pop (tiles):
- **Start:** When answer is submitted
- **Duration:** 240ms
- **Scale:** 1.0 → 1.08 → 1.0

---

## 🔍 Console Commands

Open browser console (F12) and try these:

### Check LocalStorage:
```javascript
// View your progress
localStorage.getItem('febweb_quiz_progress_v1:james')

// View stats
localStorage.getItem('febweb_quiz_stats_v1')

// View auth
localStorage.getItem('febweb_auth_v1')
```

### Debug Commands (with ?debug=1):
```javascript
// Reset today's quiz
window.febwebDebug.resetToday()
```

### Check Current State:
```javascript
// See all localStorage keys
Object.keys(localStorage).filter(k => k.startsWith('febweb'))
```

---

## ✅ Quick Verification Checklist

After each test, verify:

- [ ] No JavaScript errors in console
- [ ] No network errors (quiz-bank.json loaded)
- [ ] Animations played smoothly
- [ ] Colors match expected values
- [ ] Text is readable (white on green/gray/red)
- [ ] Buttons respond correctly (enabled/disabled)
- [ ] Stats update in menu
- [ ] Progress persists after refresh

---

## 🐛 Bug Spotting Guide

### Bug #1: Missing Confirmation
**When:** Clicking debug reset button
**Look for:** Does a confirm dialog appear?
**Expected:** NO (this is the bug)
**Should be:** YES with message asking to confirm

### Bug #2: Dimmed Red Button
**When:** Answering wrong
**Look for:** Is the RED button slightly transparent?
**Expected:** Possibly YES (this is the bug)
**Should be:** NO, should be fully opaque red

### Other Issues to Watch For:
- [ ] Confetti doesn't appear
- [ ] Shake doesn't happen
- [ ] Tiles don't fill
- [ ] Tiles show wrong letters
- [ ] Buttons don't disable
- [ ] Stats don't update
- [ ] Reset doesn't work
- [ ] Can answer same question twice

---

## 📊 Expected vs Actual Template

For each test, fill this out:

```
Test: [Name]
Expected: [What should happen]
Actual: [What actually happened]
Match: ✅ / ❌
Notes: [Any differences]
```

---

## 🎯 Success Criteria

All tests pass if:

1. ✅ Tiles always show actual speaker (not guess)
2. ✅ Confetti plays on correct answer
3. ✅ Shake plays on wrong answer
4. ✅ Buttons show correct colors (green/red/dimmed)
5. ✅ Buttons disable after answering
6. ✅ Debug reset clears board and updates stats
7. ⚠️ Bug #1: No confirmation (expected bug)
8. ⚠️ Bug #2: Dimmed red button (possible cosmetic issue)

---

## 🚀 Ready to Test!

1. Open http://localhost:5173
2. Login as James / 1234
3. Follow the test scenarios above
4. Take screenshots
5. Note any issues
6. Check console for errors
7. Fill out test report

**Estimated Time:** 10-15 minutes for all tests

Good luck! 🎉
