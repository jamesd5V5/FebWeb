#!/usr/bin/env python3
"""
Build a *small* daily quiz bank JSON for the website from your message export.

Goal: You don't need to upload your entire message history to GitHub Pages.
Instead, this script selects a limited number of messages and outputs:
  data/quiz-bank.json

The website will show today's questions (local date) and track accuracy
per-user in the browser (localStorage).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import random
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

# Command to generate the quiz-bank.json file
#
# python "scripts/build_quiz_bank.py" "local-output/messages.clean.jsonl" --days 365 --per-day 3 --start-date 2026-02-11 --out "data/quiz-bank.json"
#

DATE_FMT = "%m/%d/%Y %I:%M:%S %p"


def normalize_sender(sender: str) -> str:
    s = (sender or "").strip()
    if s.lower().startswith("jamesd5@"):
        return "james"
    if s.replace(" ", "") in {"+17607168689", "17607168689"}:
        return "jess"
    return s.lower()


REACTION_PREFIXES = (
    "Loved “",
    "Loved \"",
    "Laughed at “",
    "Laughed at \"",
    "Liked “",
    "Liked \"",
    "Emphasized “",
    "Emphasized \"",
    "Disliked “",
    "Disliked \"",
)


REACTION_MAP: dict[str, tuple[str, ...]] = {
    "Loved": ("Loved “", "Loved \""),
    "Laughed": ("Laughed at “", "Laughed at \""),
    "Liked": ("Liked “", "Liked \""),
    "Emphasized": ("Emphasized “", "Emphasized \""),
    "Disliked": ("Disliked “", "Disliked \""),
}

# --- "Interesting stat" thresholds (tune as you like) ---
# Only ask about an emoji/word if there is enough usage and a clear winner.
EMOJI_MIN_TOTAL = 4
EMOJI_MIN_WIN_MARGIN = 2
EMOJI_MIN_WINNER_COUNT = 3
EMOJI_POOL_LIMIT = 250  # "within reason"

WORD_MIN_TOTAL = 10
WORD_MIN_WIN_MARGIN = 3
WORD_MIN_WINNER_COUNT = 7
WORD_POOL_LIMIT = 450  # "within reason"

REACTION_MIN_TOTAL = 8
REACTION_MIN_WIN_MARGIN = 2


def is_good_quiz_text(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return False
    if any(t.startswith(p) for p in REACTION_PREFIXES):
        return False
    # skip pure emoji / super short
    if len(t) < 18:
        return False
    # skip "ok", "lol", etc.
    if re.fullmatch(r"[\W_]+", t):
        return False
    # keep it readable on a card
    if len(t) > 240:
        return False
    return True


def parse_dt_local(s: str) -> datetime | None:
    raw = (s or "").strip()
    if not raw:
        return None
    try:
        return datetime.strptime(raw, DATE_FMT)
    except ValueError:
        return None


@dataclass(frozen=True)
class Msg:
    sender: str  # james/jess
    text: str
    timestamp_raw: str
    is_reaction: bool = False


@dataclass
class UserStats:
    name: str
    emojis: Counter[str] = field(default_factory=Counter)
    reactions: Counter[str] = field(default_factory=Counter)
    words: Counter[str] = field(default_factory=Counter)


def extract_emojis(text: str) -> list[str]:
    """
    Lightweight emoji/symbol picker.

    Note: Emoji detection is hard without external deps; this tries to capture
    "non-word" characters while excluding common punctuation.
    """

    if not text:
        return []
    skip = {
        ".", ",", "!", "?", ":", ";",
        "'", "\"", "“", "”", "‘", "’",
        "…",
        "(", ")", "[", "]", "{", "}",
        "<", ">", "-", "—", "_",
        "/", "\\", "|", "@", "#", "$", "%", "^", "&", "*", "+", "=", "~", "`",
    }

    def is_variation_selector(ch: str) -> bool:
        o = ord(ch)
        return 0xFE00 <= o <= 0xFE0F

    def is_skin_tone_modifier(ch: str) -> bool:
        o = ord(ch)
        return 0x1F3FB <= o <= 0x1F3FF

    def is_zwj(ch: str) -> bool:
        return ord(ch) == 0x200D

    def is_keycap_combiner(ch: str) -> bool:
        return ord(ch) == 0x20E3

    out: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch.isspace() or re.match(r"\w", ch, flags=re.UNICODE):
            i += 1
            continue

        # Skip common punctuation/symbols we don't want treated as emoji.
        if ch in skip:
            i += 1
            continue

        # Build a small emoji "cluster" so pieces like:
        # - "👍🏼" (base + skin tone)
        # - "♀️" (base + variation selector)
        # - ZWJ sequences (👩‍❤️‍👨) don't get split into invisible parts.
        cluster = ch
        j = i + 1
        while j < n:
            nxt = text[j]
            if is_variation_selector(nxt) or is_skin_tone_modifier(nxt) or is_keycap_combiner(nxt):
                cluster += nxt
                j += 1
                continue
            if is_zwj(nxt) and (j + 1) < n:
                # include the joiner and the next base char
                cluster += nxt + text[j + 1]
                j += 2
                continue
            break

        # If the "cluster" is just an invisible piece (rare), drop it.
        if all(is_variation_selector(c) or is_skin_tone_modifier(c) or is_zwj(c) for c in cluster):
            i = j
            continue

        out.append(cluster)
        i = j

    return out


def _track_stats_for_message(stats: dict[str, UserStats], sender: str, text: str) -> bool:
    """
    Updates stats counters. Returns True if the message is a "reaction" system line.
    """

    is_rxn = False
    t = (text or "").strip()
    if not t:
        return False

    # Reactions
    for rxn_type, prefixes in REACTION_MAP.items():
        if any(t.startswith(p) for p in prefixes):
            stats[sender].reactions[rxn_type] += 1
            is_rxn = True
            break

    # Emojis + words (exclude reaction system lines)
    if not is_rxn:
        for ch in extract_emojis(t):
            stats[sender].emojis[ch] += 1

        # words >= 5 chars (lowercased)
        for w in re.findall(r"\b\w{5,}\b", t.lower()):
            stats[sender].words[w] += 1

    return is_rxn


def read_messages_csv(csv_path: str) -> tuple[list[Msg], dict[str, UserStats]]:
    """
    Reads the exported messages CSV.

    Returns:
      - eligible quote messages (non-reaction, readable)
      - lifetime stats (emoji/reaction/word counters)
    """

    quotes: list[Msg] = []
    stats: dict[str, UserStats] = {"james": UserStats("james"), "jess": UserStats("jess")}

    with open(csv_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sender = normalize_sender(row.get("Sender", ""))
            if sender not in ("james", "jess"):
                continue

            text = row.get("Text", "") or ""
            ts = row.get("Date", "") or ""
            if parse_dt_local(ts) is None:
                continue

            is_rxn = _track_stats_for_message(stats, sender, text)

            # Quote pool: readable, non-reaction, long-enough, etc.
            if (not is_rxn) and is_good_quiz_text(text):
                quotes.append(Msg(sender=sender, text=text.strip(), timestamp_raw=ts.strip()))

    return quotes, stats


def read_messages_jsonl(jsonl_path: str) -> tuple[list[Msg], dict[str, UserStats]]:
    """
    Reads local-output/messages.clean.jsonl (from parse_messages_csv.py).

    Each line has: date, time, user, text, datetime_local
    """

    quotes: list[Msg] = []
    stats: dict[str, UserStats] = {"james": UserStats("james"), "jess": UserStats("jess")}

    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            sender = normalize_sender(data.get("user", ""))
            if sender not in ("james", "jess"):
                continue
            text = data.get("text", "") or ""
            # keep a familiar timestamp format for UI meta
            ts = f"{data.get('date','')} {data.get('time','')}".strip()
            if not ts:
                ts = data.get("datetime_local", "") or ""

            is_rxn = _track_stats_for_message(stats, sender, text)
            if (not is_rxn) and is_good_quiz_text(text):
                quotes.append(Msg(sender=sender, text=text.strip(), timestamp_raw=ts, is_reaction=False))

    return quotes, stats


def _winner_margin(a: int, b: int) -> tuple[str, int, int] | None:
    """
    Returns (winner, winner_count, margin) or None if tie/no info.
    """

    if a == b:
        return None
    if a > b:
        return ("james", a, a - b)
    return ("jess", b, b - a)


def build_emoji_pool(stats: dict[str, UserStats], rnd: random.Random) -> list[str]:
    combined = stats["james"].emojis + stats["jess"].emojis
    if not combined:
        return []

    # Start from most common overall (keeps it readable/fun), then filter on margin.
    pool: list[str] = []
    for emoji, total in combined.most_common(5000):
        if total < EMOJI_MIN_TOTAL:
            break
        a = stats["james"].emojis[emoji]
        b = stats["jess"].emojis[emoji]
        wm = _winner_margin(a, b)
        if wm is None:
            continue
        _winner, winner_count, margin = wm
        if winner_count < EMOJI_MIN_WINNER_COUNT:
            continue
        if margin < EMOJI_MIN_WIN_MARGIN:
            continue
        pool.append(emoji)
        if len(pool) >= EMOJI_POOL_LIMIT:
            break

    rnd.shuffle(pool)
    return pool


def build_reaction_pool(stats: dict[str, UserStats], rnd: random.Random) -> list[str]:
    combined = stats["james"].reactions + stats["jess"].reactions
    if not combined:
        return []

    pool: list[str] = []
    for rxn, total in combined.most_common():
        if total < REACTION_MIN_TOTAL:
            continue
        a = stats["james"].reactions[rxn]
        b = stats["jess"].reactions[rxn]
        wm = _winner_margin(a, b)
        if wm is None:
            continue
        _winner, _winner_count, margin = wm
        if margin < REACTION_MIN_WIN_MARGIN:
            continue
        pool.append(rxn)

    rnd.shuffle(pool)
    return pool


_STOPWORDS = {
    # tiny hand-rolled list to avoid boring picks
    "about",
    "after",
    "again",
    "because",
    "before",
    "could",
    "first",
    "going",
    "gonna",
    "great",
    "hello",
    "there",
    "these",
    "thing",
    "think",
    "those",
    "today",
    "tomorrow",
    "wanna",
    "would",
    "where",
    "which",
    "their",
    "youre",
    "yours",
    "yourselves",
}


def build_word_pool(stats: dict[str, UserStats], rnd: random.Random) -> list[str]:
    combined = stats["james"].words + stats["jess"].words
    if not combined:
        return []

    pool: list[str] = []
    for w, total in combined.most_common(20000):
        if total < WORD_MIN_TOTAL:
            break
        if len(w) < 5:
            continue
        if w in _STOPWORDS:
            continue
        a = stats["james"].words[w]
        b = stats["jess"].words[w]
        wm = _winner_margin(a, b)
        if wm is None:
            continue
        _winner, winner_count, margin = wm
        if winner_count < WORD_MIN_WINNER_COUNT:
            continue
        if margin < WORD_MIN_WIN_MARGIN:
            continue
        pool.append(w)
        if len(pool) >= WORD_POOL_LIMIT:
            break

    rnd.shuffle(pool)
    return pool


@dataclass
class ExhaustingPool:
    """
    Deterministic pool: shuffled once, then consumed without repeats until exhausted.
    When exhausted, it reshuffles and continues (only then can items repeat).
    """

    rnd: random.Random
    items: list[str]
    idx: int = 0

    def next(self) -> str | None:
        if not self.items:
            return None
        if self.idx >= len(self.items):
            self.rnd.shuffle(self.items)
            self.idx = 0
        v = self.items[self.idx]
        self.idx += 1
        return v


def build_q2_stat_pool(stats: dict[str, UserStats], rnd: random.Random) -> ExhaustingPool:
    emojis = build_emoji_pool(stats, rnd)
    reactions = build_reaction_pool(stats, rnd)

    # Create a single stat pool (unique targets) then shuffle once.
    # Emojis dominate the count (more variety), reactions still appear occasionally.
    items: list[str] = [f"emoji:{e}" for e in emojis] + [f"reaction:{r}" for r in reactions]
    rnd.shuffle(items)
    return ExhaustingPool(rnd=rnd, items=items, idx=0)


def build_q3_word_pool(stats: dict[str, UserStats], rnd: random.Random) -> ExhaustingPool:
    return ExhaustingPool(rnd=rnd, items=build_word_pool(stats, rnd), idx=0)


def make_q2_stat_question(item: str, stats: dict[str, UserStats]) -> dict[str, str] | None:
    if not item:
        return None
    if item.startswith("emoji:"):
        target = item.split(":", 1)[1]
        a = stats["james"].emojis[target]
        b = stats["jess"].emojis[target]
        wm = _winner_margin(a, b)
        if wm is None:
            return None
        winner, _winner_count, _margin = wm
        return {"text": f"Who uses the '{target}' emoji the most?", "answer": winner, "timestamp": "All-time stat"}
    if item.startswith("reaction:"):
        rxn = item.split(":", 1)[1]
        a = stats["james"].reactions[rxn]
        b = stats["jess"].reactions[rxn]
        wm = _winner_margin(a, b)
        if wm is None:
            return None
        winner, _winner_count, _margin = wm
        return {"text": f"Who emphasized the most? ({rxn})", "answer": winner, "timestamp": "All-time stat"}
    return None


def make_q3_word_question(word: str, stats: dict[str, UserStats]) -> dict[str, str] | None:
    if not word:
        return None
    a = stats["james"].words[word]
    b = stats["jess"].words[word]
    wm = _winner_margin(a, b)
    if wm is None:
        return None
    winner, _winner_count, _margin = wm
    return {"text": f"Who has used the word '{word}' more in our texts?", "answer": winner, "timestamp": "Lifetime stats"}


@dataclass
class QuotePicker:
    rnd: random.Random
    pool: list[Msg]
    idx: int = 0

    @classmethod
    def from_quotes(cls, rnd: random.Random, quotes: list[Msg]) -> "QuotePicker":
        pool = quotes[:]
        rnd.shuffle(pool)
        return cls(rnd=rnd, pool=pool, idx=0)

    def next(self) -> Msg | None:
        if not self.pool:
            return None
        if self.idx >= len(self.pool):
            self.rnd.shuffle(self.pool)
            self.idx = 0
        m = self.pool[self.idx]
        self.idx += 1
        return m


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "input_path",
        nargs="?",
        default="J&JMessages(2_11_26).csv",
        help="Path to exported messages CSV OR local-output/messages.clean.jsonl",
    )
    ap.add_argument("--days", type=int, default=365, help="Number of days to generate")
    ap.add_argument(
        "--per-day", type=int, default=3, help="Questions per day (recommend 2-5)"
    )
    ap.add_argument(
        "--start-date",
        default=str(date.today()),
        help="Start date YYYY-MM-DD (default: today, local machine)",
    )
    ap.add_argument(
        "--seed",
        default="febweb",
        help="Seed string (keeps quiz stable if regenerated with same inputs)",
    )
    ap.add_argument(
        "--out",
        default=os.path.join("data", "quiz-bank.json"),
        help="Output path (this WILL be uploaded to the site)",
    )
    args = ap.parse_args()

    start = date.fromisoformat(args.start_date)

    # Read inputs + build lifetime stats
    in_path = args.input_path
    if str(in_path).lower().endswith(".jsonl"):
        quotes, stats = read_messages_jsonl(in_path)
    else:
        quotes, stats = read_messages_csv(in_path)

    quote_slots_per_day = 1 + max(0, args.per_day - 3)
    if len(quotes) < args.days * quote_slots_per_day:
        # It's ok, but warn because repeats may happen.
        print(
            f"Warning: only {len(quotes)} eligible quote messages for {args.days * quote_slots_per_day} quote slots; repeats may occur."
        )

    rnd = random.Random(f"{args.seed}:{args.start_date}:{args.days}:{args.per_day}")

    picker = QuotePicker.from_quotes(rnd, quotes)
    q2_pool = build_q2_stat_pool(stats, rnd)
    q3_pool = build_q3_word_pool(stats, rnd)

    days_obj: dict[str, list[dict[str, str]]] = {}
    for i in range(args.days):
        d = start + timedelta(days=i)
        key = d.isoformat()
        days_obj[key] = []

        # Slot 1: classic quote
        qn = 1
        if args.per_day >= 1:
            m = picker.next()
            if m is not None:
                days_obj[key].append(
                    {
                        "id": f"{key}-{qn}",
                        "text": m.text,
                        "answer": m.sender,
                        "timestamp": m.timestamp_raw,
                    }
                )
                qn += 1

        # Slot 2: emoji/reaction stat
        if args.per_day >= 2:
            q2_item = q2_pool.next()
            q2 = make_q2_stat_question(q2_item or "", stats) if q2_item else None
            if q2 is None:
                # Fallback (should be rare if you have enough stats): use a quote.
                m = picker.next()
                if m is not None:
                    q2 = {"text": m.text, "answer": m.sender, "timestamp": m.timestamp_raw}

            if q2 is not None:
                days_obj[key].append(
                    {
                        "id": f"{key}-{qn}",
                        "text": q2["text"],
                        "answer": q2["answer"],
                        "timestamp": q2["timestamp"],
                    }
                )
                qn += 1

        # Slot 3: word stat
        if args.per_day >= 3:
            w = q3_pool.next()
            q3 = make_q3_word_question(w or "", stats) if w else None
            if q3 is None:
                # Fallback to quote if word pool is empty.
                m = picker.next()
                if m is not None:
                    q3 = {"text": m.text, "answer": m.sender, "timestamp": m.timestamp_raw}

            if q3 is not None:
                days_obj[key].append(
                    {
                        "id": f"{key}-{qn}",
                        "text": q3["text"],
                        "answer": q3["answer"],
                        "timestamp": q3["timestamp"],
                    }
                )
                qn += 1

        # Any extra slots: fill with more quotes
        while len(days_obj[key]) < args.per_day:
            m = picker.next()
            if m is None:
                break
            days_obj[key].append(
                {
                    "id": f"{key}-{qn}",
                    "text": m.text,
                    "answer": m.sender,
                    "timestamp": m.timestamp_raw,
                }
            )
            qn += 1

    payload = {
        "generatedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "source": os.path.basename(in_path),
        "startDate": start.isoformat(),
        "daysCount": args.days,
        "perDay": args.per_day,
        "days": days_obj,
    }

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Wrote quiz bank to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
