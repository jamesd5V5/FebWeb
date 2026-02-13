/* eslint-disable no-console */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/**
 * Customize these values.
 * (You can safely edit this file directly on GitHub later.)
 */
const CONFIG = {
  girlfriendName: "Jessie",
  editedBy: "Made by a Kool Kat ᓚᘏᗢ",
  relationshipStartLocalDate: "2025-10-30",
  // All "today" / daily keys are based on this zone (not your computer's).
  displayTimeZone: "America/Los_Angeles", // Pacific

  // Monthly anniversaries:
  // - primary day is the 30th
  // - if a month doesn't have a 30th (Feb), we use the last day of that month (28 or 29)
  monthlyAnniversaryDay: 30,

  auth: {
    allowedNames: ["james", "jess"],
    displayName: {
      james: "James",
      jess: "Jess",
    },
  },

  supabase: {
    url: "https://qdrqradnjscsfnjptbnz.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnFyYWRuanNjc2ZuanB0Ym56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjMyMzEsImV4cCI6MjA4NjQ5OTIzMX0.GJtk2nHgqE4Fwv98x2mFD2kYooFvDrPFNxE-CN47ON8",
    // Set this after you run the SQL in SUPABASE_SETUP.md
    coupleId: "5f6e13cf-7522-4af6-b01d-4394665a02c5",
  },

  quiz: {
    bankUrl: "./data/quiz-bank.json",
  },
};

function qs(id) {
  return document.getElementById(id);
}

function parseYmd(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function ymdToKey(ymd) {
  const y = ymd?.y;
  const m = ymd?.m;
  const d = ymd?.d;
  if (!y || !m || !d) return "—";
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getTimeZoneYmd(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function ymdCompare(a, b) {
  if (a.y !== b.y) return a.y < b.y ? -1 : 1;
  if (a.m !== b.m) return a.m < b.m ? -1 : 1;
  if (a.d !== b.d) return a.d < b.d ? -1 : 1;
  return 0;
}

function ymdToUtcDayNumber(ymd) {
  return Math.floor(Date.UTC(ymd.y, ymd.m - 1, ymd.d) / (24 * 60 * 60 * 1000));
}

function daysBetweenYmd(a, b) {
  return ymdToUtcDayNumber(b) - ymdToUtcDayNumber(a);
}

function daysInMonthUtc(y, m1) {
  // m1 is 1..12
  return new Date(Date.UTC(y, m1, 0)).getUTCDate();
}

function monthlyAnniversaryYmdForMonth({ y, m }, preferredDay) {
  const dim = daysInMonthUtc(y, m);
  const d = Math.min(preferredDay, dim);
  return { y, m, d };
}

function addMonthsToYearMonth({ y, m }, deltaMonths) {
  const idx = (y * 12 + (m - 1)) + deltaMonths;
  const y2 = Math.floor(idx / 12);
  const m2 = (idx % 12) + 1;
  return { y: y2, m: m2 };
}

function ordinalSuffix(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = n % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

function formatMonthDayOrdinalYmd(ymd, timeZone) {
  // Use UTC noon so formatting in the target time zone stays on the same calendar date.
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12, 0, 0));
  const month = new Intl.DateTimeFormat(undefined, { month: "short", timeZone }).format(dt);
  return `${month} ${ymd.d}${ordinalSuffix(ymd.d)}, ${ymd.y}`;
}

function getMonthlyAnniversaryOccurrences({ startYmd, fromYmd, preferredDay, count }) {
  const out = [];
  const startYm = { y: startYmd.y, m: startYmd.m };
  let ym = { y: Math.max(fromYmd.y, startYm.y), m: fromYmd.y < startYm.y ? startYm.m : fromYmd.m };

  // Ensure ym isn't before the relationship start month.
  if (ym.y === startYm.y && ym.m < startYm.m) ym = { ...startYm };

  // Find first occurrence >= both start date and from date.
  for (;;) {
    const occ = monthlyAnniversaryYmdForMonth(ym, preferredDay);
    if (ymdCompare(occ, startYmd) >= 0 && ymdCompare(occ, fromYmd) >= 0) break;
    ym = addMonthsToYearMonth(ym, 1);
  }

  for (let i = 0; i < count; i += 1) {
    const occ = monthlyAnniversaryYmdForMonth(ym, preferredDay);
    out.push(occ);
    ym = addMonthsToYearMonth(ym, 1);
  }
  return out;
}

function localYyyyMmDd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDateYYYYMMDD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  // Local midnight.
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function daysBetweenLocalMidnights(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.floor((b0 - a0) / ms);
}

function formatDateFriendly(d, timeZone) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R_km = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R_km * c;
  return km * 0.621371;
}

function formatCountdown(targetDate) {
  const now = new Date();
  const ms = targetDate.getTime() - now.getTime();
  if (Number.isNaN(ms)) return "—";

  if (ms <= 0) return "Today";

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes - days * 60 * 24 - hours * 60;

  if (days >= 2) return `${days} days`;
  if (days === 1) return `1 day ${hours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function setText(id, text) {
  const el = qs(id);
  if (!el) return;
  el.textContent = text;
}

function initStats() {
  setText("gfName", CONFIG.girlfriendName);
  setText("editedBy", CONFIG.editedBy || "");

  const tz = CONFIG.displayTimeZone || "America/Los_Angeles";
  const startYmd = parseYmd(CONFIG.relationshipStartLocalDate);
  const todayYmd = getTimeZoneYmd(new Date(), tz);
  const todayForDisplay = todayYmd
    ? new Date(Date.UTC(todayYmd.y, todayYmd.m - 1, todayYmd.d, 12, 0, 0))
    : new Date();

  let daysTogether = null;
  if (startYmd && todayYmd) {
    const days = Math.max(0, daysBetweenYmd(startYmd, todayYmd));
    daysTogether = days;
    setText("daysTogether", `${days}`);
    setText(
      "togetherSince",
      `Since ${formatDateFriendly(
        new Date(Date.UTC(startYmd.y, startYmd.m - 1, startYmd.d, 12, 0, 0)),
        tz,
      )}`,
    );
  } else {
    setText("daysTogether", "—");
    setText("togetherSince", "Set a start date in app.js");
  }

  setText("distanceMiles", `105 miles apart`);

  if (daysTogether !== null) {
    setText("puzzleNumber", String(daysTogether));
  }

  setText(
    "footDate",
    todayForDisplay.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: tz,
    }),
  );

  // Monthly anniversaries (30th; Feb falls back to 28th/29th).
  if (startYmd && todayYmd) {
    const preferredDay = Number(CONFIG.monthlyAnniversaryDay) || 30;
    const occurrences = getMonthlyAnniversaryOccurrences({
      startYmd,
      fromYmd: todayYmd,
      preferredDay,
      count: 12,
    });

    const nextOcc = occurrences[0];

    const daysTil = Math.max(0, daysBetweenYmd(todayYmd, nextOcc));
    setText("countdown", `${daysTil} ${daysTil === 1 ? "day" : "days"}`);

    // "Happy X months" only on the anniversary day.
    const thisMonthOcc = monthlyAnniversaryYmdForMonth(
      { y: todayYmd.y, m: todayYmd.m },
      preferredDay,
    );
    const isTodayAnniversary = ymdCompare(todayYmd, thisMonthOcc) === 0;
    const monthsNow =
      (todayYmd.y - startYmd.y) * 12 + (todayYmd.m - startYmd.m);
    if (isTodayAnniversary && monthsNow >= 1) {
      setText("anniversaryMsgSep", " • ");
      setText("anniversaryMessage", `Happy ${monthsNow} Months!`);
    } else {
      setText("anniversaryMsgSep", "");
      setText("anniversaryMessage", "");
    }
  } else {
    setText("countdown", "—");
    setText("anniversaryMsgSep", "");
    setText("anniversaryMessage", "");
  }
}

// ---------------------------
// Supabase auth + shared state
// ---------------------------

const sb = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

function openAuth() {
  const overlay = qs("authOverlay");
  if (!overlay) return;
  overlay.classList.add("isOpen");
  overlay.setAttribute("aria-hidden", "false");
}

function closeAuth() {
  const overlay = qs("authOverlay");
  if (!overlay) return;
  overlay.classList.remove("isOpen");
  overlay.setAttribute("aria-hidden", "true");
}

async function getSessionUser() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data?.session?.user || null;
}

async function signInWithEmailPassword(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function signUpWithEmailPassword(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

async function signOut() {
  await sb.auth.signOut();
}

async function fetchMyMembership(userId) {
  if (!CONFIG.supabase.coupleId) {
    throw new Error(
      "Supabase coupleId is not set. Follow SUPABASE_SETUP.md and paste the couple id into CONFIG.supabase.coupleId.",
    );
  }

  const { data, error } = await sb
    .from("couple_members")
    .select("role, display_name")
    .eq("couple_id", CONFIG.supabase.coupleId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "This account isn't linked to the couple yet. Ask James to add you in Supabase (see SUPABASE_SETUP.md).",
    );
  }

  if (!CONFIG.auth.allowedNames.includes(data.role)) {
    throw new Error("Invalid role in couple_members.");
  }

  return {
    coupleId: CONFIG.supabase.coupleId,
    role: data.role,
    displayName: data.display_name || CONFIG.auth.displayName[data.role],
  };
}

async function initAuth(onAuthed) {
  const form = qs("authForm");
  const emailEl = qs("authEmail");
  const pwEl = qs("authPassword");
  const errEl = qs("authError");
  const signUpBtn = qs("authSignUpBtn");

  const showErr = (msg) => {
    if (errEl) errEl.textContent = msg || "";
  };

  const finish = async (user) => {
    const membership = await fetchMyMembership(user.id);
    closeAuth();
    onAuthed({
      userId: user.id,
      coupleId: membership.coupleId,
      role: membership.role,
      displayName: membership.displayName,
    });
  };

  try {
    const existing = await getSessionUser();
    if (existing) {
      await finish(existing);
      return;
    }
  } catch (e) {
    console.warn(e);
  }

  openAuth();
  showErr("");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    showErr("");
    const email = emailEl?.value?.trim?.() || "";
    const pw = pwEl?.value || "";
    if (!email || !pw) {
      showErr("Enter email + password.");
      return;
    }

    try {
      const user = await signInWithEmailPassword(email, pw);
      await finish(user);
    } catch (err) {
      showErr(err?.message || String(err));
    }
  });

  signUpBtn?.addEventListener("click", async () => {
    showErr("");
    const email = emailEl?.value?.trim?.() || "";
    const pw = pwEl?.value || "";
    if (!email || !pw) {
      showErr("Enter email + password.");
      return;
    }

    try {
      await signUpWithEmailPassword(email, pw);
      showErr(
        "Account created. If email confirmations are enabled, confirm your email then sign in.",
      );
    } catch (err) {
      showErr(err?.message || String(err));
    }
  });
}

// ---------------------------
// Daily quiz
// ---------------------------

const SPEAKER_WORD = {
  james: "JAMES",
  jess: "JESS ", // pad to 5 tiles
};

async function fetchAnswersForDay(coupleId, dayKey, userId) {
  const { data, error } = await sb
    .from("quiz_answers")
    .select("question_id, guess, correct, answered_at")
    .eq("couple_id", coupleId)
    .eq("day_key", dayKey)
    .eq("user_id", userId);

  if (error) throw error;
  const list = Array.isArray(data) ? data : [];
  const map = {};
  for (const row of list) {
    if (!row?.question_id) continue;
    map[row.question_id] = {
      guess: row.guess,
      correct: Boolean(row.correct),
      at: row.answered_at || "",
    };
  }
  return map;
}

async function upsertAnswerRow({
  coupleId,
  dayKey,
  questionId,
  userId,
  guess,
  correct,
}) {
  const { error } = await sb.from("quiz_answers").upsert(
    {
      couple_id: coupleId,
      day_key: dayKey,
      question_id: questionId,
      user_id: userId,
      guess,
      correct,
    },
    { onConflict: "couple_id,day_key,question_id,user_id" },
  );
  if (error) throw error;
}

async function fetchQuizBank() {
  const url = `${CONFIG.quiz.bankUrl}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Quiz bank fetch failed: ${res.status}`);
  return res.json();
}

function setQuizStatus(text) {
  const el = qs("quizStatus");
  if (!el) return;
  el.textContent = text;
}

async function renderScoreboard(ctx) {
  const { coupleId, userId, activeRole, activeDisplayName } = ctx;
  setText("signedInAs", activeDisplayName || CONFIG.auth.displayName[activeRole] || "—");

  const { data, error } = await sb
    .from("quiz_answers")
    .select("user_id, correct, day_key, question_id")
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

  const me = stats[activeRole] || { correct: 0, total: 0 };
  const mePct = me.total ? Math.round((me.correct / me.total) * 100) : 0;
  setText("myAccuracy", `${mePct}%`);
  setText("myAccuracyFine", `${me.correct} correct out of ${me.total} total`);

  // Visual scoreboards
  const todayGridEl = qs("todayScoreGrid");
  const overallEl = qs("overallScore");

  const todayKey = ctx.dayKey || "";
  const questionIds = Array.isArray(ctx.questions) ? ctx.questions.map((q) => q.id) : [];

  // Today per-question (only if we know today's questions)
  if (todayGridEl) {
    if (!todayKey || questionIds.length === 0) {
      todayGridEl.textContent = "—";
    } else {
      const todayRows = list.filter((r) => r.day_key === todayKey);
      const byQ = {};
      for (const qid of questionIds) byQ[qid] = { me: null, other: null };

      for (const r of todayRows) {
        if (!byQ[r.question_id]) continue;
        const bucket = r.user_id === userId ? "me" : "other";
        byQ[r.question_id][bucket] = r.correct ? "correct" : "wrong";
      }

      const mkRow = (roleLabel, bucketKey) => {
        const cells = questionIds
          .map((qid, idx) => {
            const st = byQ[qid]?.[bucketKey];
            const cls = st || "empty";
            const txt = `Q${idx + 1}`;
            return `<div class="sgCell ${cls}">${txt}</div>`;
          })
          .join("");
        return `<div class="sgRow"><div class="sgName">${roleLabel}</div>${cells}</div>`;
      };

      todayGridEl.innerHTML =
        mkRow(CONFIG.auth.displayName[activeRole] || "You", "me") +
        mkRow(CONFIG.auth.displayName[otherRole] || "Partner", "other");
    }
  }

  // Overall breakdown: number of 1/3, 2/3, 3/3 days (only counting completed 3-answer days)
  if (overallEl) {
    const perUserDay = {}; // dayKey -> { me: {c,t}, other: {c,t} }
    for (const r of list) {
      if (!r.day_key) continue;
      if (!perUserDay[r.day_key]) {
        perUserDay[r.day_key] = {
          me: { correct: 0, total: 0 },
          other: { correct: 0, total: 0 },
        };
      }
      const bucket = r.user_id === userId ? "me" : "other";
      perUserDay[r.day_key][bucket].total += 1;
      if (r.correct) perUserDay[r.day_key][bucket].correct += 1;
    }

    const tally = {
      me: { "1/3": 0, "2/3": 0, "3/3": 0, incomplete: 0 },
      other: { "1/3": 0, "2/3": 0, "3/3": 0, incomplete: 0 },
    };

    for (const dayKey of Object.keys(perUserDay)) {
      for (const bucket of ["me", "other"]) {
        const d = perUserDay[dayKey][bucket];
        if (d.total !== 3) {
          if (d.total > 0) tally[bucket].incomplete += 1;
          continue;
        }
        const k = `${d.correct}/3`;
        if (k === "1/3" || k === "2/3" || k === "3/3") tally[bucket][k] += 1;
      }
    }

    const mkBar = (t) => {
      const totalDays = t["1/3"] + t["2/3"] + t["3/3"];
      if (!totalDays) {
        return `<div class="soLegend"><span class="legendItem">No finished days yet</span></div>`;
      }
      const wBad = (t["1/3"] / totalDays) * 100;
      const wMid = (t["2/3"] / totalDays) * 100;
      const wGood = (t["3/3"] / totalDays) * 100;
      const bar = `
        <div class="soBar" role="img" aria-label="Overall day results bar">
          <span class="seg bad" style="width:${wBad.toFixed(1)}%"></span>
          <span class="seg mid" style="width:${wMid.toFixed(1)}%"></span>
          <span class="seg good" style="width:${wGood.toFixed(1)}%"></span>
        </div>
      `;
      const legend = `
        <div class="soLegend">
          <span class="legendItem"><span class="swatch bad"></span>1/3 × ${t["1/3"]}</span>
          <span class="legendItem"><span class="swatch mid"></span>2/3 × ${t["2/3"]}</span>
          <span class="legendItem"><span class="swatch good"></span>3/3 × ${t["3/3"]}</span>
          ${t.incomplete > 0
          ? `<span class="legendItem">incomplete × ${t.incomplete}</span>`
          : ""
        }
        </div>
      `;
      return bar + legend;
    };

    overallEl.innerHTML =
      `<div class="soRow"><div class="sgName">${CONFIG.auth.displayName[activeRole] || "You"}</div><div>${mkBar(tally.me)}</div></div>` +
      `<div class="soRow"><div class="sgName">${CONFIG.auth.displayName[otherRole] || "Partner"}</div><div>${mkBar(tally.other)}</div></div>`;
  }
}

function normalizeQuestionsForDay(raw, dateKey) {
  const days = raw?.days;
  if (!days || typeof days !== "object") return [];
  const list = days[dateKey];
  if (!Array.isArray(list)) return [];
  return list
    .map((q, idx) => ({
      id: q.id || `${dateKey}:${idx}`,
      text: String(q.text || ""),
      answer: String(q.answer || "").toLowerCase(),
      timestamp: q.timestamp ? String(q.timestamp) : "",
    }))
    .filter(
      (q) =>
        q.text.trim() !== "" &&
        (q.answer === "james" || q.answer === "jess"),
    );
}

function pickAvailableQuizDayKey(raw, requestedKey) {
  const days = raw?.days;
  if (!days || typeof days !== "object") return null;

  const keys = Object.keys(days).filter((k) => Array.isArray(days[k]));
  if (!keys.length) return null;

  // Exact match
  if (keys.includes(requestedKey)) return requestedKey;

  keys.sort(); // YYYY-MM-DD sorts lexicographically
  const minKey = keys[0];
  const maxKey = keys[keys.length - 1];

  // If user is before/after our bank range, clamp.
  if (requestedKey < minKey) return minKey;
  if (requestedKey > maxKey) return maxKey;

  // Otherwise pick nearest previous key (stable day-to-day).
  for (let i = keys.length - 1; i >= 0; i -= 1) {
    if (keys[i] < requestedKey) return keys[i];
  }

  return minKey;
}

function initQuizUI(ctx) {
  const tz = CONFIG.displayTimeZone || "America/Los_Angeles";
  const reqYmd = getTimeZoneYmd(new Date(), tz);
  const requestedKey = reqYmd ? ymdToKey(reqYmd) : localYyyyMmDd(new Date());
  setText("quizDate", requestedKey);
  // Render immediately so menu isn't stuck on "—"
  renderScoreboard({
    coupleId: ctx.coupleId,
    userId: ctx.userId,
    activeRole: ctx.activeRole,
    activeDisplayName: ctx.activeDisplayName,
  }).catch((e) => console.warn(e));

  const boardEl = qs("board");
  const clueTextEl = qs("clueText");
  const clueMetaEl = qs("clueMeta");
  const clueStatusEl = qs("clueStatus");

  const keyJames = qs("keyJames");
  const keyJess = qs("keyJess");
  const keyNext = qs("keyNext");

  let questions = [];
  let qIndex = 0;
  let loadError = null;
  let usedKey = requestedKey;

  const progress = {}; // { [dayKey]: { [questionId]: {correct, guess, at} } }

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
            dayKey: usedKey,
            questions,
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

  window.addEventListener("beforeunload", () => {
    if (realtimeChannel) sb.removeChannel(realtimeChannel);
  });

  function clearKeyFeedback() {
    for (const btn of [keyJames, keyJess]) {
      if (!btn) continue;
      btn.disabled = false;
      btn.classList.remove("isCorrect", "isWrong", "isDim");
    }
  }

  function setKeyFeedbackForAnswered(q, answered) {
    if (!q || !answered) return;
    if (keyJames) keyJames.disabled = true;
    if (keyJess) keyJess.disabled = true;

    const correctBtn = q.answer === "james" ? keyJames : keyJess;
    const guessedBtn = answered.guess === "james" ? keyJames : keyJess;

    correctBtn?.classList.add("isCorrect");
    if (guessedBtn && guessedBtn !== correctBtn) {
      guessedBtn.classList.add("isWrong");
      // Two-button UI: when wrong, show red on guess and green on correct (no dim).
      return;
    }

    if (guessedBtn && guessedBtn === correctBtn) {
      guessedBtn.classList.add("isCorrect");
      const otherBtn = q.answer === "james" ? keyJess : keyJames;
      otherBtn?.classList.add("isDim");
    }
  }

  function current() {
    return questions[qIndex] || null;
  }

  function rowTiles(row) {
    if (!boardEl) return [];
    return Array.from(boardEl.querySelectorAll(`.tile[data-row="${row}"]`));
  }

  function setRowLetters(row, word) {
    const tiles = rowTiles(row);
    const w = String(word || "");
    for (let c = 0; c < tiles.length; c += 1) {
      const ch = w[c] || "";
      tiles[c].textContent = ch === " " ? "" : ch;
    }
  }

  function setRowState(row, state) {
    const tiles = rowTiles(row);
    for (const t of tiles) {
      t.classList.remove("correct", "wrong");
      if (state === "correct") t.classList.add("correct");
      if (state === "wrong") t.classList.add("wrong");
    }
  }

  function setActiveRow(row) {
    if (!boardEl) return;
    for (const tile of boardEl.querySelectorAll(".tile")) {
      tile.classList.remove("active");
    }
    for (const t of rowTiles(row)) t.classList.add("active");
  }

  function popRow(row) {
    const tiles = rowTiles(row);
    for (const t of tiles) {
      t.classList.remove("pop");
      // restart animation
      // eslint-disable-next-line no-unused-expressions
      t.offsetHeight;
      t.classList.add("pop");
    }
  }

  function shakeBoard() {
    if (!boardEl) return;
    boardEl.classList.remove("shake");
    // eslint-disable-next-line no-unused-expressions
    boardEl.offsetHeight;
    boardEl.classList.add("shake");
  }

  function launchConfetti() {
    const root = document.createElement("div");
    root.className = "confetti";
    root.setAttribute("aria-hidden", "true");

    const colors = ["#6aaa64", "#f59e0b", "#60a5fa", "#a78bfa", "#ef4444"];
    const pieces = 90;
    for (let i = 0; i < pieces; i += 1) {
      const p = document.createElement("span");
      p.className = "confettiPiece";
      const x = Math.random() * 100;
      const d = Math.random() * 260;
      const r = Math.floor(Math.random() * 360);
      const c = colors[i % colors.length];
      const w = 6 + Math.random() * 7;
      const h = 10 + Math.random() * 10;
      p.style.setProperty("--x", x.toFixed(2));
      p.style.setProperty("--d", `${d.toFixed(0)}ms`);
      p.style.setProperty("--r", `${r}deg`);
      p.style.setProperty("--c", c);
      p.style.setProperty("--w", `${w.toFixed(0)}px`);
      p.style.setProperty("--h", `${h.toFixed(0)}px`);
      root.appendChild(p);
    }

    document.body.appendChild(root);
    window.setTimeout(() => root.remove(), 2600);
  }

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
      setRowLetters(i, SPEAKER_WORD[q.answer] || "");
      setRowState(i, answered.correct ? "correct" : "wrong");
    }
  }

  function firstUnansweredIndex() {
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!progress[usedKey]?.[q.id]) return i;
    }
    return 0;
  }

  function nextUnansweredIndex(from) {
    if (!questions.length) return 0;
    for (let k = 1; k <= questions.length; k += 1) {
      const idx = (from + k) % questions.length;
      const q = questions[idx];
      if (!progress[usedKey]?.[q.id]) return idx;
    }
    return (from + 1) % questions.length;
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = "";
    const rows = Math.max(questions.length || 0, 3);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.dataset.row = String(r);
        tile.dataset.col = String(c);
        tile.setAttribute("role", "img");
        tile.setAttribute("aria-label", `Row ${r + 1} tile ${c + 1}`);
        tile.addEventListener("click", () => {
          if (r < questions.length) {
            qIndex = r;
            renderClue();
          }
        });
        boardEl.appendChild(tile);
      }
    }
    renderAllRowsFromProgress();
  }

  function renderClue() {
    if (!questions.length) {
      if (clueTextEl) {
        clueTextEl.textContent = loadError
          ? "Couldn’t load ./data/quiz-bank.json.\n\nIf you opened index.html by double-clicking (file://), the browser may block fetch.\nRun a local server (python -m http.server) or use GitHub Pages."
          : "No questions found in the quiz bank.";
      }
      if (clueMetaEl) clueMetaEl.textContent = loadError ? String(loadError) : "";
      if (clueStatusEl) clueStatusEl.textContent = "—";
      return;
    }

    const q = current();
    if (!q) return;

    setActiveRow(qIndex);

    const answered = progress[usedKey]?.[q.id] || null;
    if (clueTextEl) clueTextEl.textContent = q.text;
    if (clueMetaEl) {
      clueMetaEl.textContent = q.timestamp
        ? `Quiz day: ${usedKey} • Q ${qIndex + 1}/${questions.length} • ${q.timestamp}`
        : `Quiz day: ${usedKey} • Q ${qIndex + 1}/${questions.length}`;
    }

    renderAllRowsFromProgress();
    clearKeyFeedback();

    if (answered) {
      if (clueStatusEl) {
        clueStatusEl.textContent = answered.correct
          ? "Correct."
          : `Wrong. It was ${CONFIG.auth.displayName[q.answer]}.`;
      }
      setKeyFeedbackForAnswered(q, answered);
    } else {
      if (clueStatusEl) clueStatusEl.textContent = "Choose: JAMES or JESS";
    }
  }

  function answer(guess) {
    const q = current();
    if (!q) return;
    if (!progress[usedKey]) progress[usedKey] = {};
    if (progress[usedKey][q.id]) return; // already answered

    const correct = guess === q.answer;
    progress[usedKey][q.id] = { correct, guess, at: new Date().toISOString() };

    upsertAnswerRow({
      coupleId: ctx.coupleId,
      dayKey: usedKey,
      questionId: q.id,
      userId: ctx.userId,
      guess,
      correct,
    })
      .then(() =>
        renderScoreboard({
          coupleId: ctx.coupleId,
          userId: ctx.userId,
          activeRole: ctx.activeRole,
          activeDisplayName: ctx.activeDisplayName,
          dayKey: usedKey,
          questions,
        }),
      )
      .catch((e) => console.warn(e));

    if (clueStatusEl) {
      clueStatusEl.textContent = correct
        ? "Correct."
        : `Wrong. It was ${CONFIG.auth.displayName[q.answer]}.`;
    }

    renderAllRowsFromProgress();
    popRow(qIndex);
    if (correct) {
      launchConfetti();
    } else {
      shakeBoard();
    }
  }

  keyJames?.addEventListener("click", () => {
    answer("james");
    renderClue();
  });
  keyJess?.addEventListener("click", () => {
    answer("jess");
    renderClue();
  });
  keyNext?.addEventListener("click", () => {
    if (!questions.length) return;
    qIndex = nextUnansweredIndex(qIndex);
    renderClue();
  });

  fetchQuizBank()
    .then((raw) => {
      usedKey = pickAvailableQuizDayKey(raw, requestedKey) || requestedKey;
      if (usedKey !== requestedKey) {
        setText("quizDate", `${requestedKey} (using ${usedKey})`);
      }

      questions = normalizeQuestionsForDay(raw, usedKey);
      qIndex = firstUnansweredIndex();
      renderBoard();
      fetchAnswersForDay(ctx.coupleId, usedKey, ctx.userId)
        .then((map) => {
          progress[usedKey] = map || {};
          renderBoard();
          qIndex = firstUnansweredIndex();
          renderClue();
        })
        .catch((e) => {
          console.warn(e);
          progress[usedKey] = {};
          renderClue();
        });

      renderScoreboard({
        coupleId: ctx.coupleId,
        userId: ctx.userId,
        activeRole: ctx.activeRole,
        activeDisplayName: ctx.activeDisplayName,
        dayKey: usedKey,
        questions,
      }).catch((e) => console.warn(e));
    })
    .catch((e) => {
      console.warn(e);
      loadError = e?.message || String(e);
      questions = [];
      renderBoard();
      renderClue();
    });
}

function initHelp() {
  const btn = qs("helpBtn");
  btn?.addEventListener("click", () => {
    // Simple, Wordle-like help.
    window.alert(
      "How to play Message Mayhem:\n\n- Read the message.\n- Tap Who Said It.\n- Each day has 3 questions.\n- A row turns green if you’re correct, gray if you’re wrong.\n- Your accuracy is saved in the cloud (shared).",
    );
  });
}

function initLogout() {
  const btn = qs("logoutBtn");
  btn?.addEventListener("click", () => {
    signOut().finally(() => location.reload());
  });
}

function boot() {
  initStats();
  initHelp();
  initLogout();
  initAuth(async ({ userId, coupleId, role, displayName }) => {
    initQuizUI({
      userId,
      coupleId,
      activeRole: role,
      activeDisplayName: displayName,
    });
  });
}

window.addEventListener("DOMContentLoaded", boot);

