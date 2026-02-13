# Message Mayhem - Bug Report & Code Analysis

**Analysis Date:** February 12, 2026
**Analyzed By:** AI Code Review
**Codebase Version:** Current

---

## 🔍 Code Analysis Summary

Based on static code analysis, the application appears to be well-structured with most features correctly implemented. Below are findings from reviewing the test requirements:

---

## ✅ VERIFIED: Working Features

### 1. Tiles Fill with Actual Speaker Letters
**Status:** ✅ Correctly Implemented
**Location:** `app.js` lines 506-519

**Code:**
```javascript
function renderAllRowsFromProgress() {
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const answered = progress[usedKey]?.[q.id] || null;
    if (!answered) {
      setRowLetters(i, "");
      setRowState(i, null);
      continue;
    }
    setRowLetters(i, SPEAKER_WORD[q.answer] || "");  // ← Uses actual answer
    setRowState(i, answered.correct ? "correct" : "wrong");
  }
}
```

**Analysis:** The function correctly fills tiles with `SPEAKER_WORD[q.answer]` (the actual speaker), not the user's guess. Even if you guess wrong, it shows who really said it.

---

### 2. Confetti on Correct Answer
**Status:** ✅ Correctly Implemented
**Location:** `app.js` lines 627-628, 477-504

**Code:**
```javascript
if (correct) {
  launchConfetti();
}
```

**Analysis:** 
- Confetti launches only when `correct === true`
- Creates 90 colored pieces
- Animation lasts 2.6 seconds (2100ms + 260ms delay)
- Uses 5 colors: green, orange, blue, purple, red
- Properly cleaned up after animation

---

### 3. Shake Animation on Wrong Answer
**Status:** ✅ Correctly Implemented
**Location:** `app.js` lines 629-631, 469-475

**Code:**
```javascript
} else {
  shakeBoard();
}

function shakeBoard() {
  if (!boardEl) return;
  boardEl.classList.remove("shake");
  boardEl.offsetHeight; // Force reflow
  boardEl.classList.add("shake");
}
```

**CSS Animation:** `styles.css` lines 301-324
- Duration: 420ms
- Horizontal shake with 5 oscillations
- Smooth cubic-bezier easing

**Analysis:** Correctly triggers shake animation on wrong answers. Uses reflow trick to restart animation if needed.

---

### 4. Button Feedback After Answering
**Status:** ✅ Correctly Implemented (with minor note)
**Location:** `app.js` lines 408-421

**Code:**
```javascript
function setKeyFeedbackForAnswered(q, answered) {
  if (!q || !answered) return;
  if (keyJames) keyJames.disabled = true;
  if (keyJess) keyJess.disabled = true;

  const correctBtn = q.answer === "james" ? keyJames : keyJess;
  const otherBtn = q.answer === "james" ? keyJess : keyJames;
  const guessedBtn = answered.guess === "james" ? keyJames : keyJess;

  correctBtn?.classList.add("isCorrect");
  if (guessedBtn && guessedBtn !== correctBtn) guessedBtn.classList.add("isWrong");
  if (guessedBtn && guessedBtn === correctBtn) guessedBtn.classList.add("isCorrect");
  otherBtn?.classList.add("isDim");
}
```

**CSS Styles:** `styles.css` lines 287-299
```css
.key.isCorrect {
  background: var(--correct);  /* Green */
  color: white;
}

.key.isWrong {
  background: #b42318;  /* Red */
  color: white;
}

.key.isDim {
  opacity: 0.55;  /* Dimmed */
}
```

**Analysis:**
- ✅ Correct button turns green
- ✅ Wrong guessed button turns red
- ✅ Other button is dimmed
- ✅ Both buttons disabled
- **Logic is correct:** `otherBtn` is always the non-correct button, so dimming it is appropriate

**Test Cases:**
1. **Correct guess (JAMES when answer is JAMES):**
   - JAMES button: Green (`isCorrect`)
   - JESS button: Dimmed (`isDim`)
   - Both disabled ✅

2. **Wrong guess (JESS when answer is JAMES):**
   - JAMES button: Green (`isCorrect`)
   - JESS button: Red (`isWrong`) + Dimmed (`isDim`)
   - Both disabled ✅
   - **Note:** JESS button gets both `isWrong` and `isDim`, but CSS specificity should handle this correctly since `isWrong` has explicit background color.

---

### 5. Debug Reset Functionality
**Status:** ✅ Mostly Correct (Missing Confirmation - see Bug #1)
**Location:** `app.js` lines 648-683

**Code:**
```javascript
function debugResetDayForUser(dayKey) {
  const k = String(dayKey || "");
  const day = progress[k];
  if (!day || typeof day !== "object") return;

  const entries = Object.values(day);
  if (!entries.length) return;

  const stats = getStats();
  for (const a of entries) {
    stats[activeName].total = Math.max(0, stats[activeName].total - 1);
    if (a?.correct) {
      stats[activeName].correct = Math.max(0, stats[activeName].correct - 1);
    }
  }
  saveStats(stats);
  delete progress[k];
  saveProgress(activeName, progress);
  renderScoreboard(activeName);

  qIndex = 0;
  renderBoard();
  renderClue();
  if (clueStatusEl) clueStatusEl.textContent = "Debug: reset complete. Pick JAMES or JESS.";
}
```

**Analysis:**
- ✅ Correctly subtracts today's attempts from stats
- ✅ Clears progress for the day
- ✅ Re-renders board (clears tiles)
- ✅ Updates scoreboard
- ✅ Shows status message
- ⚠️ Missing confirmation dialog (see Bug #1)

---

## 🐛 BUGS IDENTIFIED

### Bug #1: Missing Confirmation Dialog on Debug Reset
**Severity:** Medium
**Priority:** Should Fix
**Location:** `app.js` line 676

**Issue:**
The debug reset button immediately deletes data without asking for confirmation. This could lead to accidental data loss.

**Current Code:**
```javascript
debugResetTodayBtn?.addEventListener("click", () => {
  debugResetDayForUser(usedKey || requestedKey);
});
```

**Recommended Fix:**
```javascript
debugResetTodayBtn?.addEventListener("click", () => {
  const confirmed = confirm(
    "Reset today's quiz?\n\n" +
    "This will:\n" +
    "• Clear all your answers for today\n" +
    "• Update your accuracy stats\n" +
    "• Allow you to answer again\n\n" +
    "This action cannot be undone."
  );
  if (confirmed) {
    debugResetDayForUser(usedKey || requestedKey);
  }
});
```

**Impact:** Low (debug feature only), but improves UX

---

### Bug #2: Potential CSS Conflict on Wrong Button
**Severity:** Low
**Priority:** Monitor
**Location:** `app.js` line 420, `styles.css` lines 287-299

**Issue:**
When a user guesses wrong, the wrong button gets both `isWrong` and `isDim` classes applied:
- Line 418: `guessedBtn.classList.add("isWrong")` 
- Line 420: `otherBtn?.classList.add("isDim")` (and guessedBtn can be otherBtn)

**Wait, let me re-analyze...**

Actually, this is **NOT a bug**. Here's why:

```javascript
const correctBtn = q.answer === "james" ? keyJames : keyJess;
const otherBtn = q.answer === "james" ? keyJess : keyJames;
const guessedBtn = answered.guess === "james" ? keyJames : keyJess;
```

- `correctBtn` = button for correct answer
- `otherBtn` = button that's NOT correct (always the wrong answer)
- `guessedBtn` = button user clicked

**Scenario: User guesses JESS, correct is JAMES**
- `correctBtn` = keyJames
- `otherBtn` = keyJess
- `guessedBtn` = keyJess
- Line 417: keyJames gets `isCorrect` ✅
- Line 418: keyJess gets `isWrong` (because guessedBtn !== correctBtn) ✅
- Line 420: keyJess gets `isDim` ✅

**Result:** keyJess has both `isWrong` (red background) and `isDim` (opacity 0.55)

**CSS:**
```css
.key.isWrong {
  background: #b42318;  /* Red */
  color: white;
}
.key.isDim {
  opacity: 0.55;
}
```

**Actual Rendering:** Red button with 55% opacity = darker red

**Is this intended?** Probably not. The wrong button should likely be fully opaque red, not dimmed.

**Recommended Fix:**

**Option A:** Don't dim the guessed button (cleaner logic)
```javascript
function setKeyFeedbackForAnswered(q, answered) {
  if (!q || !answered) return;
  if (keyJames) keyJames.disabled = true;
  if (keyJess) keyJess.disabled = true;

  const correctBtn = q.answer === "james" ? keyJames : keyJess;
  const otherBtn = q.answer === "james" ? keyJess : keyJames;
  const guessedBtn = answered.guess === "james" ? keyJames : keyJess;

  correctBtn?.classList.add("isCorrect");
  
  if (guessedBtn !== correctBtn) {
    guessedBtn.classList.add("isWrong");
  }
  
  // Only dim the button that wasn't guessed and isn't correct
  if (otherBtn !== guessedBtn) {
    otherBtn.classList.add("isDim");
  }
}
```

**Option B:** Override opacity for wrong buttons in CSS
```css
.key.isWrong {
  background: #b42318;
  color: white;
  opacity: 1 !important;  /* Override isDim */
}
```

**Impact:** Visual only - wrong button appears darker red than intended

---

### Bug #3: SPEAKER_WORD for JESS has trailing space
**Severity:** Very Low (Cosmetic)
**Priority:** Optional
**Location:** `app.js` lines 258-261

**Issue:**
```javascript
const SPEAKER_WORD = {
  james: "JAMES",
  jess: "JESS ", // pad to 5 tiles ← Trailing space
};
```

The comment says "pad to 5 tiles" but JESS is 4 letters, so adding a space makes it 5 characters. However, this trailing space might not be visible in the UI.

**Analysis:**
- Board has 5 tiles per row
- "JAMES" = 5 letters ✅
- "JESS " = 4 letters + 1 space = 5 characters ✅
- The space is intentional for visual consistency

**Code that handles this:** `app.js` lines 436-438
```javascript
for (let c = 0; c < tiles.length; c += 1) {
  const ch = w[c] || "";
  tiles[c].textContent = ch === " " ? "" : ch;  // ← Spaces become empty
}
```

**Verdict:** This is actually **correct design**, not a bug. The space is intentionally converted to an empty tile for visual balance.

---

## 📊 Test Coverage Analysis

### Features to Test Manually:

1. ✅ **Login Flow**
   - Test with correct password (1234)
   - Test with wrong password
   - Test with different users (James, Jess)

2. ✅ **Question Answering**
   - Answer correctly → verify confetti
   - Answer incorrectly → verify shake
   - Verify tiles fill with actual speaker
   - Verify button states after answering

3. ✅ **Navigation**
   - Click NEXT button
   - Click on tile rows to jump to questions
   - Verify active row highlighting

4. ✅ **Persistence**
   - Refresh page → verify answers persist
   - Switch users → verify separate progress

5. ✅ **Debug Mode**
   - Add ?debug=1 to URL
   - Verify debug section appears
   - Test reset functionality
   - Verify stats update correctly

6. ✅ **Edge Cases**
   - Complete all questions for the day
   - Try to answer same question twice
   - Check behavior with no quiz data

---

## 🔧 Recommended Fixes

### Priority 1: Add Confirmation Dialog
**File:** `app.js`
**Line:** 676
**Change:**
```javascript
// Before:
debugResetTodayBtn?.addEventListener("click", () => {
  debugResetDayForUser(usedKey || requestedKey);
});

// After:
debugResetTodayBtn?.addEventListener("click", () => {
  if (confirm("Reset today's quiz? This will clear your answers and update your accuracy.")) {
    debugResetDayForUser(usedKey || requestedKey);
  }
});
```

### Priority 2: Fix Wrong Button Dimming
**File:** `app.js`
**Line:** 408-421
**Change:**
```javascript
function setKeyFeedbackForAnswered(q, answered) {
  if (!q || !answered) return;
  if (keyJames) keyJames.disabled = true;
  if (keyJess) keyJess.disabled = true;

  const correctBtn = q.answer === "james" ? keyJames : keyJess;
  const otherBtn = q.answer === "james" ? keyJess : keyJames;
  const guessedBtn = answered.guess === "james" ? keyJames : keyJess;

  correctBtn?.classList.add("isCorrect");
  
  if (guessedBtn !== correctBtn) {
    guessedBtn.classList.add("isWrong");
  }
  
  // Only dim the button that wasn't guessed and isn't correct
  if (otherBtn !== guessedBtn) {
    otherBtn.classList.add("isDim");
  }
}
```

---

## 📝 Manual Testing Checklist

Use the companion file `TESTING_CHECKLIST.md` for detailed manual testing steps.

**Quick Test:**
1. Open http://localhost:5173
2. Login as James with password 1234
3. Answer first question correctly → expect confetti
4. Answer second question incorrectly → expect shake
5. Verify buttons show green/red feedback
6. Add ?debug=1 and test reset

---

## 🎯 Conclusion

**Overall Code Quality:** ✅ Good

The application is well-structured with proper separation of concerns. Most features are correctly implemented. The two identified issues are:

1. **Missing confirmation dialog** (easy fix, improves UX)
2. **Wrong button dimming** (cosmetic issue, low priority)

**Recommendation:** Apply Priority 1 fix before production. Priority 2 is optional but improves visual clarity.
