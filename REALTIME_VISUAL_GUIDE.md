# Real-Time Scoreboard - Visual Testing Guide

**Quick visual reference for real-time functionality**

---

## 🎯 Test 1: Initial Sign In - Scoreboard Populates

### Before Sign In:
```
┌─────────────────────────────────────────┐
│        Message Mayhem                   │
│        Sign in (Supabase)               │
│                                         │
│        EMAIL                            │
│        [james@example.com             ] │
│                                         │
│        PASSWORD                         │
│        [••••••••••••                  ] │
│                                         │
│   [  Sign in  ]    [  Sign up  ]       │
└─────────────────────────────────────────┘
```

### After Sign In (Menu Opened):
```
┌─────────────────────────────────────────┐
│ ☰  Message Mayhem                     ? │
└─────────────────────────────────────────┘

Menu Panel:
┌─────────────────────────────────────────┐
│ Message Mayhem                          │
│                                         │
│ SIGNED IN AS                            │
│ James                    ← Populated!   │
│                                         │
│ TODAY                                   │
│ 2026-02-12                              │
│                                         │
│ ACCURACY                                │
│ 67%                      ← Populated!   │
│ 2 correct out of 3 total                │
│                                         │
│ Scoreboard (this device):               │
│ James: 67% (2/3) • Jess: 100% (1/1)    │
│ ↑ Both users populated immediately!     │
└─────────────────────────────────────────┘
```

**Key Observation:**
- ✅ Stats appear **immediately** after sign in
- ✅ No manual refresh needed
- ✅ Both users' stats visible

---

## 🎯 Test 2: Answer Question - Immediate Update

### Step 1: Before Answering
```
Menu:
┌─────────────────────────────────────────┐
│ ACCURACY                                │
│ 67%                      ← Note this    │
│ 2 correct out of 3 total                │
│                                         │
│ Scoreboard (this device):               │
│ James: 67% (2/3) • Jess: 100% (1/1)    │
│         ↑ Note James's stats            │
└─────────────────────────────────────────┘
```

### Step 2: Answer Question
```
Game Board:
┌─────────────────────────────────────────┐
│ Who said this?                          │
│ "Good morning!"                         │
│                                         │
│ [  JAMES  ]    [  JESS  ]              │
│    ↑ Click this                         │
└─────────────────────────────────────────┘

[Confetti animation plays! 🎉]
```

### Step 3: Open Menu (No Refresh!)
```
Menu:
┌─────────────────────────────────────────┐
│ ACCURACY                                │
│ 75%                      ← Updated!     │
│ 3 correct out of 4 total ← Updated!    │
│                                         │
│ Scoreboard (this device):               │
│ James: 75% (3/4) • Jess: 100% (1/1)    │
│         ↑ Updated automatically!        │
└─────────────────────────────────────────┘
```

**Key Observation:**
- ✅ Stats update **without page refresh**
- ✅ Update happens within 1-2 seconds
- ✅ Both accuracy and scoreboard update

---

## 🎯 Test 3: Cross-Device Real-Time Updates

### Setup: Two Tabs

#### Tab 1 (James) - Menu Open:
```
Browser Tab 1 (http://localhost:5175)
┌─────────────────────────────────────────┐
│ ☰  Message Mayhem                     ? │
└─────────────────────────────────────────┘

Menu:
┌─────────────────────────────────────────┐
│ SIGNED IN AS                            │
│ James                                   │
│                                         │
│ Scoreboard (this device):               │
│ James: 67% (2/3) • Jess: 100% (1/1)    │
│                          ↑ Note Jess    │
│                                         │
│ [Keep this menu open and watch!]       │
└─────────────────────────────────────────┘
```

#### Tab 2 (Jess) - Incognito:
```
Browser Tab 2 - Incognito (http://localhost:5175)
┌─────────────────────────────────────────┐
│ Game Board                              │
│                                         │
│ Who said this?                          │
│ "I love you"                            │
│                                         │
│ [  JAMES  ]    [  JESS  ]              │
│                   ↑ Jess clicks this    │
└─────────────────────────────────────────┘
```

### After Jess Answers:

#### Tab 2 (Jess) - Updates Immediately:
```
Menu:
┌─────────────────────────────────────────┐
│ SIGNED IN AS                            │
│ Jess                                    │
│                                         │
│ Scoreboard (this device):               │
│ James: 67% (2/3) • Jess: 100% (2/2)    │
│                          ↑ Updated      │
└─────────────────────────────────────────┘
```

#### Tab 1 (James) - Updates Automatically! 🎉
```
Menu (still open, no refresh):
┌─────────────────────────────────────────┐
│ SIGNED IN AS                            │
│ James                                   │
│                                         │
│ Scoreboard (this device):               │
│ James: 67% (2/3) • Jess: 100% (2/2)    │
│                          ↑ UPDATED!     │
│                                         │
│ [Updated automatically within 1-3s]    │
└─────────────────────────────────────────┘
```

**Key Observation:**
- ✅ Tab 1 updates **without any user action**
- ✅ No refresh, no clicking needed
- ✅ Update happens within 1-3 seconds
- ✅ Real-time synchronization works!

---

## 🎯 Console View - Real-Time Subscription

### Expected Console (No Errors):
```
Console
  ▼ Network
    ✅ @supabase/supabase-js@2/+esm  200 OK
    ✅ quiz-bank.json                 200 OK
  
  (No errors - silence is golden!)
```

### Check Subscription Status:
```javascript
> sb.getChannels()
◀ [
    {
      topic: "realtime:mm_answers_550e8400-e29b-41d4-a716-446655440000",
      state: "joined",
      ...
    }
  ]
```

### When Real-Time Event Fires:
```
Console (may see):
  Realtime event received: {
    new: { user_id: "...", correct: true, ... },
    old: null,
    eventType: "INSERT"
  }
  
  Scoreboard re-rendered
```

---

## 🎯 Network Tab - Real-Time Activity

### Initial Page Load:
```
Network Tab
┌──────────────────────────────────────────────────────────┐
│ Name                              Status    Type    Size  │
├──────────────────────────────────────────────────────────┤
│ @supabase/supabase-js@2/+esm      200 OK    script  1.2MB│
│ quiz-bank.json                    200 OK    xhr     225KB│
│ quiz_answers?couple_id=eq....     200 OK    xhr     2.1KB│
│ ↑ Fetches all answers for scoreboard                     │
└──────────────────────────────────────────────────────────┘
```

### When You Answer:
```
Network Tab
┌──────────────────────────────────────────────────────────┐
│ Name                              Status    Type    Size  │
├──────────────────────────────────────────────────────────┤
│ quiz_answers                      201 OK    xhr     0.8KB│
│ ↑ POST - inserts your answer                             │
│                                                           │
│ (Then real-time event fires automatically)               │
└──────────────────────────────────────────────────────────┘
```

### Real-Time Connection:
```
Network Tab (WebSocket)
┌──────────────────────────────────────────────────────────┐
│ Name                              Status    Type          │
├──────────────────────────────────────────────────────────┤
│ realtime/v1/websocket             101 OK    websocket    │
│ ↑ Persistent connection for real-time events             │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Timeline Visualization

### Test 2: Answer Question Update

```
Time: 0s
  User clicks JAMES button
  
Time: 0.1s
  Answer saved to Supabase
  ↓
  POST /quiz_answers (201 Created)
  
Time: 0.2s
  Supabase broadcasts change
  ↓
  Real-time event sent to all subscribers
  
Time: 0.3s
  JavaScript receives event
  ↓
  renderScoreboard() called
  
Time: 0.5s
  Fetch updated stats
  ↓
  GET /quiz_answers?couple_id=eq...
  
Time: 0.7s
  Menu updates
  ↓
  New stats displayed: 75% (3/4)
  
Total: ~0.7 seconds
```

### Test 3: Cross-Device Update

```
Time: 0s
  Tab 2 (Jess) clicks JESS button
  
Time: 0.1s
  Answer saved to Supabase
  ↓
  POST /quiz_answers (201 Created)
  
Time: 0.2s
  Supabase broadcasts change to ALL subscribers
  ↓
  Real-time event sent to:
  - Tab 1 (James) ← watching!
  - Tab 2 (Jess)
  
Time: 0.3s
  Tab 1 JavaScript receives event
  ↓
  renderScoreboard() called in Tab 1
  
Time: 0.5s
  Tab 1 fetches updated stats
  ↓
  GET /quiz_answers?couple_id=eq...
  
Time: 0.7s
  Tab 1 menu updates
  ↓
  New stats displayed: Jess: 100% (2/2)
  
Total: ~0.7 seconds (no user action in Tab 1!)
```

---

## 🎯 Comparison: With vs Without Real-Time

### WITHOUT Real-Time (Old Behavior):
```
1. User answers question
2. Stats saved to database
3. Menu shows old stats
4. User must manually refresh page (F5)
5. Stats update after refresh

Total: Manual action required
```

### WITH Real-Time (New Behavior):
```
1. User answers question
2. Stats saved to database
3. Real-time event fires
4. Menu updates automatically
5. Stats update within 1 second

Total: No action required! ✨
```

---

## 🎯 Success Indicators

### ✅ Everything Works If You See:

1. **Initial Sign In:**
   ```
   Menu opens → Stats appear immediately
   No "—" or "0%" placeholders
   Both users' stats visible
   ```

2. **After Answering:**
   ```
   Answer question → Menu updates within 1-2s
   No page refresh needed
   Stats increment correctly
   ```

3. **Cross-Device:**
   ```
   Tab 2 answers → Tab 1 updates within 1-3s
   Tab 1 menu shows new stats
   No user action in Tab 1
   ```

4. **Console:**
   ```
   No errors
   Real-time channel exists
   WebSocket connection active
   ```

---

## 🎯 Failure Indicators

### ❌ Something's Wrong If You See:

1. **Initial Sign In:**
   ```
   Menu shows "—" or "0%"
   Stats don't populate
   Must refresh to see stats
   ```

2. **After Answering:**
   ```
   Stats don't update
   Must refresh to see new stats
   Console shows errors
   ```

3. **Cross-Device:**
   ```
   Tab 1 doesn't update
   Tab 1 shows old stats
   Must refresh Tab 1 manually
   ```

4. **Console:**
   ```
   "Failed to subscribe to channel"
   "RLS policy violation"
   "WebSocket connection failed"
   ```

---

## 🎯 Visual Checklist

### Before Testing:
- [ ] Server running on port 5175
- [ ] Supabase configured
- [ ] coupleId set in CONFIG
- [ ] Account linked to couple_members

### During Test 1 (Sign In):
- [ ] Auth overlay appears
- [ ] Sign in succeeds
- [ ] Auth overlay closes
- [ ] Open menu immediately
- [ ] "Signed in as" shows name
- [ ] Accuracy shows percentage
- [ ] Scoreboard shows both users
- [ ] All stats populated (no "—")

### During Test 2 (Answer):
- [ ] Note current stats
- [ ] Answer question
- [ ] Animation plays
- [ ] Open menu immediately
- [ ] Stats updated
- [ ] No page refresh
- [ ] Update within 1-2 seconds

### During Test 3 (Cross-Device):
- [ ] Tab 1 signed in
- [ ] Tab 1 menu open
- [ ] Tab 2 signed in (incognito)
- [ ] Tab 2 answers question
- [ ] Tab 1 menu updates automatically
- [ ] No action in Tab 1
- [ ] Update within 1-3 seconds

### Console Check:
- [ ] No errors on page load
- [ ] No subscription errors
- [ ] Real-time channel exists
- [ ] WebSocket connected
- [ ] No RLS errors

---

## 📸 Screenshot Checklist

Capture these moments:

1. ✅ **Menu after sign in** (stats populated immediately)
2. ✅ **Menu before answering** (note stats)
3. ✅ **Menu after answering** (stats updated, no refresh)
4. ✅ **Two tabs side by side**:
   - Tab 1 (James) with menu open
   - Tab 2 (Jess) about to answer
5. ✅ **Tab 1 after Tab 2 answers** (showing real-time update)
6. ✅ **Console showing channels** (`sb.getChannels()`)
7. ✅ **Network tab showing WebSocket**

---

## 🚀 Quick Visual Test (30 seconds)

**Fastest way to see real-time in action:**

1. Open http://localhost:5175
2. Sign in
3. Open menu → see stats populate ✅
4. Close menu
5. Answer a question → see animation ✅
6. Open menu → see stats updated ✅
7. **No refresh used!** ✅

**If all stats update without refresh → Real-time works!** 🎉

---

## 🎉 You're Ready!

Open http://localhost:5175 and watch the magic happen!

**Remember:** The key test is seeing Tab 1 update when Tab 2 answers. That's the real-time synchronization in action! ✨
