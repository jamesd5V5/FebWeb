# Message Mayhem - Code Reference Guide

**Quick reference for debugging issues during testing**

---

## 🎯 Feature 1: Tiles Fill with Actual Speaker

### Code Location: `app.js`

#### Main Function: `renderAllRowsFromProgress()` (lines 506-519)
```javascript
function renderAllRowsFromProgress() {
  // Fill the Wordle boxes with who actually said it (even if you guessed wrong).
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const answered = progress[usedKey]?.[q.id] || null;
    if (!answered) {
      setRowLetters(i, "");
      setRowState(i, null);
      continue;
    }
    setRowLetters(i, SPEAKER_WORD[q.answer] || "");  // ← KEY LINE
    setRowState(i, answered.correct ? "correct" : "wrong");
  }
}
```

**Key Line:** 516
- Uses `q.answer` (actual speaker), NOT `answered.guess` (user's guess)

#### Helper Function: `setRowLetters()` (lines 432-439)
```javascript
function setRowLetters(row, word) {
  const tiles = rowTiles(row);
  const w = String(word || "");
  for (let c = 0; c < tiles.length; c += 1) {
    const ch = w[c] || "";
    tiles[c].textContent = ch === " " ? "" : ch;  // Spaces become empty
  }
}
```

#### Speaker Names: `SPEAKER_WORD` (lines 258-261)
```javascript
const SPEAKER_WORD = {
  james: "JAMES",  // 5 letters
  jess: "JESS ",   // 4 letters + 1 space = 5 chars
};
```

### If Tiles Don't Fill:
**Check:**
1. Is `SPEAKER_WORD[q.answer]` defined?
2. Is `q.answer` "james" or "jess" (lowercase)?
3. Are tiles being created? (Check `renderBoard()` line 539-561)
4. Console error: "Cannot read property 'textContent' of undefined"?

---

## 🎯 Feature 2: Confetti on Correct Answer

### Code Location: `app.js`

#### Trigger: `answer()` function (lines 627-628)
```javascript
if (correct) {
  launchConfetti();
} else {
  shakeBoard();
}
```

#### Confetti Function: `launchConfetti()` (lines 477-504)
```javascript
function launchConfetti() {
  const root = document.createElement("div");
  root.className = "confetti";
  root.setAttribute("aria-hidden", "true");

  const colors = ["#6aaa64", "#f59e0b", "#60a5fa", "#a78bfa", "#ef4444"];
  const pieces = 90;  // ← Number of pieces
  
  for (let i = 0; i < pieces; i += 1) {
    const p = document.createElement("span");
    p.className = "confettiPiece";
    // ... positioning and styling ...
    root.appendChild(p);
  }

  document.body.appendChild(root);
  window.setTimeout(() => root.remove(), 2600);  // ← Cleanup after 2.6s
}
```

### CSS Animation: `styles.css` (lines 342-377)
```css
.confetti {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 9998;
}

.confettiPiece {
  position: absolute;
  left: calc(var(--x) * 1%);
  top: -12px;
  width: var(--w);
  height: var(--h);
  background: var(--c);
  border-radius: 2px;
  opacity: 0;
  transform: rotate(var(--r));
  animation: confettiFall 2100ms ease-out forwards;
  animation-delay: var(--d);
}

@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(var(--r));
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  100% {
    transform: translateY(112vh) rotate(calc(var(--r) + 540deg));
    opacity: 0;
  }
}
```

### If Confetti Doesn't Appear:
**Check:**
1. Is `correct` true? (Add `console.log('correct:', correct)` at line 627)
2. Is `launchConfetti()` being called? (Add `console.log('confetti!')` at line 478)
3. Are elements being created? (Inspect DOM for `<div class="confetti">`)
4. CSS animation working? (Check browser supports CSS animations)
5. Z-index issue? (Confetti should be z-index: 9998)

---

## 🎯 Feature 3: Shake on Wrong Answer

### Code Location: `app.js`

#### Trigger: `answer()` function (lines 629-631)
```javascript
} else {
  shakeBoard();
}
```

#### Shake Function: `shakeBoard()` (lines 469-475)
```javascript
function shakeBoard() {
  if (!boardEl) return;
  boardEl.classList.remove("shake");
  // eslint-disable-next-line no-unused-expressions
  boardEl.offsetHeight;  // ← Force reflow to restart animation
  boardEl.classList.add("shake");
}
```

**Key Technique:** Lines 472-474
- Remove class
- Force reflow with `offsetHeight`
- Add class back
- This allows animation to restart even if already playing

### CSS Animation: `styles.css` (lines 301-324)
```css
.board.shake {
  animation: mmShake 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes mmShake {
  0% {
    transform: translateX(0);
  }
  18% {
    transform: translateX(-7px);
  }
  36% {
    transform: translateX(7px);
  }
  54% {
    transform: translateX(-5px);
  }
  72% {
    transform: translateX(5px);
  }
  100% {
    transform: translateX(0);
  }
}
```

### If Shake Doesn't Happen:
**Check:**
1. Is `correct` false? (Add `console.log('correct:', correct)` at line 627)
2. Is `shakeBoard()` being called? (Add `console.log('shake!')` at line 470)
3. Is `boardEl` defined? (Check `const boardEl = qs("board")` at line 380)
4. Does board have `shake` class? (Inspect element during shake)
5. CSS animation working? (Check browser DevTools > Animations)

---

## 🎯 Feature 4: Button Feedback

### Code Location: `app.js`

#### Main Function: `setKeyFeedbackForAnswered()` (lines 408-421)
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
  otherBtn?.classList.add("isDim");  // ← BUG #2: Dims wrong button too
}
```

**Logic Breakdown:**
- `correctBtn` = button for correct answer
- `otherBtn` = button that's NOT correct
- `guessedBtn` = button user clicked

**Line 417:** Correct button always gets green
**Line 418:** Wrong guess gets red (only if guessed wrong)
**Line 419:** Correct guess gets green (redundant with line 417)
**Line 420:** Other button gets dimmed (⚠️ BUG: also dims wrong guess)

#### Called From: `renderClue()` (line 597)
```javascript
setKeyFeedbackForAnswered(q, answered);
```

#### Also Called From: `answer()` (line 636)
```javascript
keyJames?.addEventListener("click", () => {
  answer("james");
  renderClue();  // ← This calls setKeyFeedbackForAnswered
});
```

### CSS Styles: `styles.css` (lines 287-299)
```css
.key.isCorrect {
  background: var(--correct);  /* #6aaa64 = green */
  color: white;
}

.key.isWrong {
  background: #b42318;  /* Red */
  color: white;
}

.key.isDim {
  opacity: 0.55;  /* 55% opacity */
}
```

### If Button Colors Wrong:
**Check:**
1. Are classes being added? (Inspect button elements)
2. Is `q.answer` correct? (Add `console.log('answer:', q.answer)`)
3. Is `answered.guess` correct? (Add `console.log('guess:', answered.guess)`)
4. CSS specificity issue? (Check computed styles in DevTools)
5. Buttons disabled? (Should be `disabled="true"`)

---

## 🎯 Feature 5: Debug Reset

### Code Location: `app.js`

#### Enable Debug Mode: `isDebugEnabled()` (lines 263-269)
```javascript
function isDebugEnabled() {
  try {
    const sp = new URLSearchParams(window.location.search || "");
    return sp.get("debug") === "1" || sp.get("debug") === "true";
  } catch {
    return false;
  }
}
```

**Checks for:** `?debug=1` or `?debug=true` in URL

#### Show Debug Section: (lines 674-683)
```javascript
if (isDebugEnabled()) {
  if (debugSection) debugSection.hidden = false;
  debugResetTodayBtn?.addEventListener("click", () => {
    debugResetDayForUser(usedKey || requestedKey);  // ← BUG #1: No confirmation
  });
  // For console use: window.febwebDebug.resetToday()
  window.febwebDebug = {
    resetToday: () => debugResetDayForUser(usedKey || requestedKey),
  };
}
```

**Line 676:** ⚠️ BUG #1 - No confirmation dialog

#### Reset Function: `debugResetDayForUser()` (lines 648-672)
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

**What it does:**
1. **Lines 658-662:** Subtract today's attempts from stats
2. **Line 664:** Delete today's progress
3. **Line 666:** Update scoreboard
4. **Lines 668-670:** Re-render board and clue
5. **Line 671:** Show status message

### HTML: `index.html` (lines 84-95)
```html
<div class="menuSection debugSection" id="debugSection" hidden>
  <div class="menuRow">
    <div class="menuLabel">Debug</div>
    <div class="menuValue">Testing tools</div>
  </div>
  <button class="key keyWide keyDanger" id="debugResetTodayBtn" type="button">
    Reset today's quiz (this user)
  </button>
  <div class="menuHint">
    Tip: open with <code>?debug=1</code> to show this.
  </div>
</div>
```

**Initially:** `hidden` attribute (line 84)
**Shown when:** `debugSection.hidden = false` (line 675 in app.js)

### If Debug Section Not Visible:
**Check:**
1. URL has `?debug=1`? (Check address bar)
2. Is `isDebugEnabled()` returning true? (Add `console.log`)
3. Is `debugSection` element found? (Check `qs("debugSection")`)
4. Is `hidden` attribute removed? (Inspect element)

### If Reset Doesn't Work:
**Check:**
1. Is button click handler attached? (Check event listeners in DevTools)
2. Is `progress[dayKey]` defined? (Add `console.log('progress:', progress)`)
3. Are stats being updated? (Check localStorage before/after)
4. Is board re-rendering? (Check if `renderBoard()` is called)
5. Console errors during reset?

---

## 🔧 Debugging Tools

### Console Logging Points:

#### Check if answer is correct:
```javascript
// Add at line 609 in answer() function
console.log('Answering:', { guess, actual: q.answer, correct });
```

#### Check button feedback:
```javascript
// Add at line 409 in setKeyFeedbackForAnswered()
console.log('Button feedback:', { 
  correctAnswer: q.answer, 
  userGuess: answered.guess,
  correctBtn: correctBtn?.id,
  guessedBtn: guessedBtn?.id,
  otherBtn: otherBtn?.id
});
```

#### Check confetti trigger:
```javascript
// Add at line 627
console.log('Correct answer! Launching confetti...');
```

#### Check shake trigger:
```javascript
// Add at line 630
console.log('Wrong answer! Shaking board...');
```

#### Check debug reset:
```javascript
// Add at line 649 in debugResetDayForUser()
console.log('Resetting day:', dayKey, 'Entries:', entries.length);
```

### LocalStorage Inspection:

```javascript
// In browser console (F12):

// View progress
JSON.parse(localStorage.getItem('febweb_quiz_progress_v1:james'))

// View stats
JSON.parse(localStorage.getItem('febweb_quiz_stats_v1'))

// Clear all data (CAUTION!)
localStorage.clear()
```

### DOM Inspection:

```javascript
// Check if elements exist
document.getElementById('board')
document.getElementById('keyJames')
document.getElementById('keyJess')

// Check button states
document.getElementById('keyJames').disabled
document.getElementById('keyJames').classList

// Check tile content
document.querySelectorAll('.tile[data-row="0"]').forEach(t => console.log(t.textContent))
```

---

## 🐛 Bug Fixes

### Fix #1: Add Confirmation Dialog

**File:** `app.js`
**Line:** 676
**Find:**
```javascript
debugResetTodayBtn?.addEventListener("click", () => {
  debugResetDayForUser(usedKey || requestedKey);
});
```

**Replace with:**
```javascript
debugResetTodayBtn?.addEventListener("click", () => {
  const message = 
    "Reset today's quiz?\n\n" +
    "This will:\n" +
    "• Clear all your answers for today\n" +
    "• Update your accuracy stats\n" +
    "• Allow you to answer again\n\n" +
    "This action cannot be undone.";
  
  if (confirm(message)) {
    debugResetDayForUser(usedKey || requestedKey);
  }
});
```

---

### Fix #2: Prevent Wrong Button Dimming

**File:** `app.js`
**Line:** 420
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

**Or, cleaner refactor of entire function:**
```javascript
function setKeyFeedbackForAnswered(q, answered) {
  if (!q || !answered) return;
  
  // Disable both buttons
  if (keyJames) keyJames.disabled = true;
  if (keyJess) keyJess.disabled = true;

  const correctBtn = q.answer === "james" ? keyJames : keyJess;
  const guessedBtn = answered.guess === "james" ? keyJames : keyJess;
  const otherBtn = (correctBtn === keyJames) ? keyJess : keyJames;

  // Correct button always green
  correctBtn?.classList.add("isCorrect");
  
  if (guessedBtn === correctBtn) {
    // Guessed correctly: dim the other button
    otherBtn?.classList.add("isDim");
  } else {
    // Guessed wrong: red wrong button, dim nothing
    guessedBtn?.classList.add("isWrong");
  }
}
```

---

## 📊 Data Flow

### Answer Submission Flow:
```
User clicks JAMES/JESS button (line 634-641)
  ↓
answer(guess) called (line 603)
  ↓
Check if correct (line 609)
  ↓
Save to progress (line 610)
  ↓
Update stats (line 613-616)
  ↓
Update UI (line 619-631)
  ├─ Correct → launchConfetti() (line 628)
  └─ Wrong → shakeBoard() (line 630)
  ↓
renderClue() called (line 636)
  ↓
setKeyFeedbackForAnswered() called (line 597)
```

### Debug Reset Flow:
```
User clicks reset button (line 676)
  ↓
debugResetDayForUser(dayKey) called (line 648)
  ↓
Get today's progress (line 650-651)
  ↓
Loop through entries (line 657)
  ├─ Decrement total (line 658)
  └─ Decrement correct if applicable (line 659-661)
  ↓
Save stats (line 663)
  ↓
Delete progress (line 664)
  ↓
Update UI (line 666-671)
```

---

## 🎯 Quick Reference Table

| Feature | Main Function | Line | CSS | Line |
|---------|--------------|------|-----|------|
| Tiles fill | `renderAllRowsFromProgress()` | 506-519 | `.tile.correct` | 188-192 |
| Confetti | `launchConfetti()` | 477-504 | `@keyframes confettiFall` | 365-377 |
| Shake | `shakeBoard()` | 469-475 | `@keyframes mmShake` | 305-324 |
| Button feedback | `setKeyFeedbackForAnswered()` | 408-421 | `.key.isCorrect` | 287-290 |
| Debug reset | `debugResetDayForUser()` | 648-672 | `.keyDanger` | 277-280 |

---

## 📞 Troubleshooting Checklist

If something doesn't work:

1. **Check browser console** (F12) for errors
2. **Check network tab** for failed requests (quiz-bank.json)
3. **Check localStorage** for data persistence
4. **Check DOM** for missing elements
5. **Check CSS** for animation support
6. **Check JavaScript** for function calls (add console.logs)
7. **Check event listeners** in DevTools
8. **Check button states** (disabled/enabled)
9. **Check class names** on elements
10. **Check URL** for ?debug=1 parameter

---

## ✅ Success Indicators

Everything works if:

- ✅ No console errors
- ✅ quiz-bank.json loads (200 status)
- ✅ Tiles fill with letters
- ✅ Confetti appears (90 pieces)
- ✅ Board shakes horizontally
- ✅ Buttons change colors
- ✅ Buttons disable after answer
- ✅ Stats update in menu
- ✅ Debug reset clears board
- ✅ Progress persists on refresh

---

## 🚀 Ready to Debug!

Use this guide to quickly locate code when testing reveals issues.

**Pro tip:** Keep browser DevTools open (F12) during all testing!
