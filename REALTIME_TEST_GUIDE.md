# Real-Time Scoreboard Testing Guide

**Test Date:** February 12, 2026
**Server:** http://localhost:5175 (Port 5175, PID 24028)
**Feature:** Supabase Real-time subscriptions for live scoreboard updates

---

## 🎯 Overview

The application now includes real-time functionality using Supabase's real-time subscriptions. This allows:

1. **Scoreboard updates without refresh** - When you answer a question, stats update immediately
2. **Cross-device updates** - When another user answers, your scoreboard updates automatically
3. **Live synchronization** - All connected clients see changes in real-time

---

## 📋 Test Checklist

### ✅ Test 1: Initial Sign In & Scoreboard Population
**Goal:** Verify scoreboard loads on sign in without manual refresh

**Prerequisites:**
- You have an existing Supabase account
- Account is linked to `couple_members` table
- `CONFIG.supabase.coupleId` is set

**Steps:**
1. Open http://localhost:5175
2. Sign in with your credentials (e.g., James's account)
3. **Immediately observe the menu scoreboard** (don't refresh)

**Expected:**
- [ ] Auth overlay closes
- [ ] Main game appears
- [ ] Open menu (☰ button)
- [ ] "Signed in as" shows your display name (e.g., "James")
- [ ] "Accuracy" shows your percentage (e.g., "67%")
- [ ] "Scoreboard (this device)" shows both users' stats
  - Example: `James: 67% (2/3) • Jess: 100% (1/1)`
- [ ] Stats populate **immediately** without manual refresh

**Code Location:** `app.js` lines 377-420 (`renderScoreboard` function)

**What Happens:**
1. Sign in succeeds
2. `onAuthed()` callback fires (line 867)
3. `initQuizUI()` called (line 868)
4. `renderScoreboard()` called immediately (line 478)
5. Fetches all `quiz_answers` for your couple
6. Calculates stats for both users
7. Displays in menu

**Console Check:**
```javascript
// Open DevTools (F12) and check:
// Should see no errors
```

**Screenshot:** Menu with populated scoreboard

---

### ✅ Test 2: Answer Question & Immediate Scoreboard Update
**Goal:** Verify scoreboard updates immediately after answering (no refresh)

**Steps:**
1. While signed in, note current accuracy (e.g., "67% (2/3)")
2. Answer a question (click JAMES or JESS)
3. **Immediately open menu** (don't refresh page)
4. Observe accuracy stats

**Expected:**
- [ ] After answering, confetti/shake animation plays
- [ ] Open menu immediately
- [ ] Accuracy updates to new value (e.g., "75% (3/4)")
- [ ] Scoreboard updates without page refresh
- [ ] Update happens within 1-2 seconds

**Code Location:** `app.js` lines 736-758 (`answer` function)

**What Happens:**
1. User clicks JAMES/JESS button
2. `answer()` function called (line 736)
3. Answer saved to Supabase `quiz_answers` table (line 747)
4. Real-time subscription detects change (line 503)
5. `renderScoreboard()` called automatically (line 505)
6. Stats update in menu

**Console Check:**
```javascript
// Should see no errors
// May see: "Realtime subscription active" or similar
```

**Screenshot:** Menu showing updated stats after answering

---

### ✅ Test 3: Real-Time Cross-Device Updates
**Goal:** Verify scoreboard updates when another user answers (different tab/device)

**Setup:**
You'll need two browser sessions:
- **Tab 1:** Signed in as James
- **Tab 2:** Signed in as Jess (incognito or different browser)

**Steps:**

#### Part A: Open Two Tabs
1. **Tab 1:** Sign in as James at http://localhost:5175
2. Open menu, note scoreboard (e.g., `James: 67% (2/3) • Jess: 100% (1/1)`)
3. **Keep menu open** in Tab 1
4. **Tab 2:** Open incognito window (Ctrl+Shift+N)
5. Navigate to http://localhost:5175
6. Sign in as Jess

#### Part B: Answer in Tab 2 (Jess)
1. **Tab 2 (Jess):** Answer a question
2. Note Jess's new stats in Tab 2 menu
3. **Tab 1 (James):** Watch the menu scoreboard

**Expected:**
- [ ] Tab 2 (Jess) answers question successfully
- [ ] Tab 2 menu updates immediately (expected)
- [ ] **Tab 1 (James) menu updates automatically** within 1-3 seconds
- [ ] No page refresh needed in Tab 1
- [ ] Tab 1 scoreboard shows Jess's new stats
  - Example: `James: 67% (2/3) • Jess: 100% (2/2)`

**Code Location:** `app.js` lines 493-526 (Real-time subscription)

**What Happens:**
1. Jess answers in Tab 2
2. Answer saved to Supabase `quiz_answers` table
3. Supabase broadcasts change to all subscribed clients
4. Tab 1's real-time subscription receives event (line 503)
5. Tab 1 calls `renderScoreboard()` automatically (line 505)
6. Tab 1 menu updates without user action

**Console Check (Both Tabs):**
```javascript
// Tab 1 (James) console should show:
// - Real-time event received
// - Scoreboard re-rendered
// - No errors
```

**Screenshot:** 
- Tab 1 menu before Tab 2 answers
- Tab 1 menu after Tab 2 answers (showing update)

---

### ✅ Test 4: Real-Time Subscription Setup
**Goal:** Verify real-time channel is created and subscribed

**Steps:**
1. Sign in to http://localhost:5175
2. Open DevTools (F12) → Console
3. Check for subscription messages

**Expected Console Output:**
```javascript
// May see messages like:
// "Realtime subscription active"
// "Channel subscribed: mm_answers_[coupleId]"
// Or silence (no errors)
```

**Code Location:** `app.js` lines 491-529

**Channel Details:**
```javascript
// Channel name format:
`mm_answers_${ctx.coupleId}`

// Example:
"mm_answers_550e8400-e29b-41d4-a716-446655440000"

// Subscription:
.on("postgres_changes", {
  event: "*",              // All events (INSERT, UPDATE, DELETE)
  schema: "public",
  table: "quiz_answers",
  filter: `couple_id=eq.${ctx.coupleId}`
})
```

**What It Listens For:**
- Any INSERT to `quiz_answers` (new answer)
- Any UPDATE to `quiz_answers` (answer changed)
- Any DELETE to `quiz_answers` (answer removed)
- Only for your couple (filtered by `couple_id`)

**Console Commands:**
```javascript
// Check if channel exists (in console):
console.log('Realtime channels:', sb.getChannels())

// Should show channel like:
// [{topic: "realtime:mm_answers_...", ...}]
```

**Screenshot:** Console showing subscription status

---

### ✅ Test 5: Real-Time Cleanup on Page Unload
**Goal:** Verify subscription is cleaned up when leaving page

**Steps:**
1. Sign in to http://localhost:5175
2. Open DevTools (F12) → Console
3. Note active channels
4. Navigate away or close tab
5. Check if cleanup happens

**Expected:**
- [ ] Before unload: Channel exists
- [ ] On unload: Channel removed
- [ ] No memory leaks

**Code Location:** `app.js` lines 531-533

```javascript
window.addEventListener("beforeunload", () => {
  if (realtimeChannel) sb.removeChannel(realtimeChannel);
});
```

**Console Check:**
```javascript
// Before leaving:
sb.getChannels().length  // Should be > 0

// After leaving (in new tab):
sb.getChannels().length  // Should be 0 (or no channels for old couple)
```

---

## 🔍 Code Analysis

### Real-Time Subscription Setup
**Location:** `app.js` lines 491-529

```javascript
// Realtime updates (so scoreboard updates without refresh, including across devices)
let realtimeChannel = null;
try {
  realtimeChannel = sb
    .channel(`mm_answers_${ctx.coupleId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "quiz_answers",
        filter: `couple_id=eq.${ctx.coupleId}`,
      },
      (payload) => {
        // Update scoreboard
        renderScoreboard({
          coupleId: ctx.coupleId,
          userId: ctx.userId,
          activeRole: ctx.activeRole,
          activeDisplayName: ctx.activeDisplayName,
        }).catch((e) => console.warn(e));

        // If my answers changed for the currently viewed day, refresh my day map
        const changedDayKey = payload?.new?.day_key || payload?.old?.day_key;
        const changedUserId = payload?.new?.user_id || payload?.old?.user_id;
        if (changedDayKey === usedKey && changedUserId === ctx.userId) {
          fetchAnswersForDay(ctx.coupleId, usedKey, ctx.userId)
            .then((map) => {
              progress[usedKey] = map || {};
              renderAllRowsFromProgress();
              renderClue();
            })
            .catch((e) => console.warn(e));
        }
      },
    )
    .subscribe();
} catch (e) {
  console.warn(e);
}
```

**Key Points:**
1. **Channel name:** `mm_answers_${ctx.coupleId}` (unique per couple)
2. **Event filter:** Only changes to `quiz_answers` table for this couple
3. **Callback:** Runs when any answer is inserted/updated/deleted
4. **Actions:**
   - Always re-render scoreboard (line 505)
   - If it's your answer for today, refresh board (lines 515-522)

### Scoreboard Rendering
**Location:** `app.js` lines 377-420

```javascript
async function renderScoreboard(ctx) {
  const { coupleId, userId, activeRole, activeDisplayName } = ctx;
  setText("signedInAs", activeDisplayName || CONFIG.auth.displayName[activeRole] || "—");

  const { data, error } = await sb
    .from("quiz_answers")
    .select("user_id, correct")
    .eq("couple_id", coupleId);
  if (error) throw error;

  const otherRole = activeRole === "james" ? "jess" : "james";
  const stats = {
    james: { correct: 0, total: 0 },
    jess: { correct: 0, total: 0 },
  };

  const list = Array.isArray(data) ? data : [];
  for (const row of list) {
    // couple_members is locked down to "read own row" to avoid RLS recursion.
    // Since only two roles exist and (couple_id, role) is unique, we can bucket as:
    // - my rows => my role
    // - any other member rows => other role
    const who = row.user_id === userId ? activeRole : otherRole;
    stats[who].total += 1;
    if (row.correct) stats[who].correct += 1;
  }

  const fmt = (role) => {
    const s = stats[role];
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    return `${CONFIG.auth.displayName[role]}: ${pct}% (${s.correct}/${s.total})`;
  };

  setText("scoreboard", `${fmt("james")} • ${fmt("jess")}`);

  const me = stats[activeRole];
  const mePct = me.total ? Math.round((me.correct / me.total) * 100) : 0;
  setText("myAccuracy", `${mePct}%`);
  setText("myAccuracyFine", `${me.correct} correct out of ${me.total} total`);
}
```

**Key Points:**
1. Fetches ALL answers for the couple (line 381-384)
2. Calculates stats for both users (lines 394-402)
3. Updates menu display (lines 418-420)
4. Called on initial load AND on real-time events

### Answer Submission
**Location:** `app.js` lines 736-758

```javascript
async function answer(guess) {
  const q = current();
  if (!q) return;
  if (!progress[usedKey]) progress[usedKey] = {};
  if (progress[usedKey][q.id]) return; // already answered

  const correct = guess === q.answer;
  
  // Save to Supabase
  await saveAnswerToSupabase({
    coupleId: ctx.coupleId,
    userId: ctx.userId,
    dayKey: usedKey,
    questionId: q.id,
    guess,
    correct,
  });

  progress[usedKey][q.id] = { correct, guess, at: new Date().toISOString() };

  // ... UI updates ...
}
```

**Key Points:**
1. Saves answer to Supabase (line 747)
2. This triggers real-time event
3. All subscribed clients receive update
4. Scoreboard re-renders automatically

---

## 🐛 Potential Issues to Watch For

### Issue 1: Scoreboard Doesn't Populate on Sign In
**Symptom:** Menu shows "—" or "0%" after sign in
**Possible Causes:**
- `renderScoreboard()` not called
- Database query fails
- No answers in database yet
**Check:**
- Console for errors
- Network tab for failed requests
- Database has `quiz_answers` rows

### Issue 2: Scoreboard Doesn't Update After Answering
**Symptom:** Stats stay same after answering question
**Possible Causes:**
- Answer not saved to database
- Real-time subscription not active
- `renderScoreboard()` not called
**Check:**
- Console for errors
- Network tab shows INSERT to `quiz_answers`
- Real-time channel exists

### Issue 3: Cross-Device Updates Don't Work
**Symptom:** Tab 1 doesn't update when Tab 2 answers
**Possible Causes:**
- Real-time subscription not set up
- Supabase real-time not enabled
- Channel not subscribed
- Filter incorrect
**Check:**
- Console shows subscription active
- Both tabs using same `coupleId`
- Supabase project has real-time enabled

### Issue 4: Console Errors
**Possible Errors:**

```javascript
// RLS policy error:
"new row violates row-level security policy"
// Fix: Check RLS policies on quiz_answers table

// Channel subscription error:
"Failed to subscribe to channel"
// Fix: Check Supabase real-time is enabled

// Fetch error:
"Failed to fetch quiz_answers"
// Fix: Check RLS policies allow reading answers
```

---

## 📊 Expected Test Results Summary

### Test 1: Initial Sign In
- ✅ Scoreboard populates immediately
- ✅ Shows both users' stats
- ✅ No manual refresh needed

### Test 2: Answer Question
- ✅ Stats update immediately after answering
- ✅ Update happens within 1-2 seconds
- ✅ No page refresh needed

### Test 3: Cross-Device Updates
- ✅ Tab 1 updates when Tab 2 answers
- ✅ Update happens within 1-3 seconds
- ✅ Works across incognito/different browsers

### Test 4: Subscription Setup
- ✅ Real-time channel created
- ✅ Subscription active
- ✅ No console errors

### Test 5: Cleanup
- ✅ Channel removed on page unload
- ✅ No memory leaks

---

## 🔧 Manual Console Tests

Open DevTools (F12) and try these commands:

### Check Real-Time Channels:
```javascript
// Should show active channel:
sb.getChannels()

// Example output:
// [{topic: "realtime:mm_answers_550e8400-...", ...}]
```

### Check Subscription Status:
```javascript
// Check if subscribed:
sb.getChannels()[0]?.state
// Should be: "joined" or "subscribed"
```

### Manually Trigger Scoreboard Update:
```javascript
// Force re-render (for testing):
renderScoreboard({
  coupleId: CONFIG.supabase.coupleId,
  userId: '[your-user-id]',
  activeRole: 'james',
  activeDisplayName: 'James'
})
```

### Check Current Stats:
```javascript
// Fetch current answers:
sb.from('quiz_answers')
  .select('user_id, correct')
  .eq('couple_id', CONFIG.supabase.coupleId)
  .then(({data}) => console.log('Answers:', data))
```

---

## 📸 Screenshots to Capture

1. **Menu after sign in** (scoreboard populated)
2. **Menu before answering** (note stats)
3. **Menu after answering** (stats updated)
4. **Tab 1 menu before Tab 2 answers**
5. **Tab 1 menu after Tab 2 answers** (showing real-time update)
6. **Console showing subscription status**
7. **Network tab showing real-time events**

---

## 📝 Test Report Template

```
=== REAL-TIME SCOREBOARD TEST REPORT ===

Date: February 12, 2026
Tester: [Your name]
Browser: [Chrome/Firefox/Safari/Edge]
Browser Version: [Version]
URL: http://localhost:5175

--- Test 1: Initial Sign In ---
✅ / ❌  Signed in successfully
✅ / ❌  Menu opened
✅ / ❌  "Signed in as" shows name
✅ / ❌  Accuracy shows percentage
✅ / ❌  Scoreboard shows both users
✅ / ❌  Stats populated without refresh
Initial stats: [e.g., James: 67% (2/3) • Jess: 100% (1/1)]
Notes: [Any issues?]

--- Test 2: Answer Question ---
✅ / ❌  Answered question successfully
✅ / ❌  Animation played (confetti/shake)
✅ / ❌  Opened menu immediately
✅ / ❌  Stats updated without refresh
✅ / ❌  Update within 1-2 seconds
Stats before: [e.g., 67% (2/3)]
Stats after: [e.g., 75% (3/4)]
Notes: [Any issues?]

--- Test 3: Cross-Device Updates ---
✅ / ❌  Tab 1 signed in as James
✅ / ❌  Tab 2 signed in as Jess (incognito)
✅ / ❌  Tab 2 answered question
✅ / ❌  Tab 1 menu updated automatically
✅ / ❌  Update within 1-3 seconds
✅ / ❌  No refresh needed in Tab 1
Tab 1 stats before: [e.g., James: 67% • Jess: 100% (1/1)]
Tab 1 stats after: [e.g., James: 67% • Jess: 100% (2/2)]
Notes: [Any issues?]

--- Test 4: Subscription Setup ---
✅ / ❌  Console shows subscription active
✅ / ❌  Channel name correct
✅ / ❌  No subscription errors
Channel name: [e.g., mm_answers_550e8400-...]
Notes: [Any issues?]

--- Test 5: Cleanup ---
✅ / ❌  Channel removed on page unload
✅ / ❌  No memory leaks observed
Notes: [Any issues?]

--- Console Errors ---
[List any errors here, or write "None"]

--- Network Activity ---
[Note any failed requests or issues]

--- Overall Assessment ---
[Your thoughts on real-time functionality]

--- Issues Found ---
[List any bugs or problems]

--- Recommendations ---
[Any suggestions]
```

---

## ✅ Success Criteria

All tests pass if:

1. ✅ Scoreboard populates on sign in without refresh
2. ✅ Scoreboard updates immediately after answering
3. ✅ Cross-device updates work (Tab 1 sees Tab 2's changes)
4. ✅ Real-time subscription is active
5. ✅ No console errors
6. ✅ Updates happen within 1-3 seconds
7. ✅ Cleanup happens on page unload

---

## 🚀 Quick Test (5 minutes)

**Fastest way to verify real-time functionality:**

1. Open http://localhost:5175 and sign in
2. Open menu → note scoreboard stats
3. Answer a question
4. Open menu again → verify stats updated (no refresh)
5. Open incognito tab → sign in as other user
6. Answer question in incognito
7. Check original tab menu → verify it updated automatically

**If all updates happen without refresh → Real-time works! ✅**

---

## 🎉 Ready to Test!

1. Open http://localhost:5175
2. Sign in with existing account
3. Follow test scenarios above
4. Take screenshots
5. Note any console errors
6. Fill out test report

**Estimated Time:** 10-15 minutes for all tests

Good luck! 🚀
