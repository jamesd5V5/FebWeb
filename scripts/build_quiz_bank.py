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
from dataclasses import dataclass
from datetime import date, datetime, timedelta


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


def read_messages(csv_path: str) -> list[Msg]:
    out: list[Msg] = []
    with open(csv_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sender = normalize_sender(row.get("Sender", ""))
            if sender not in ("james", "jess"):
                continue
            text = row.get("Text", "") or ""
            if not is_good_quiz_text(text):
                continue
            ts = row.get("Date", "") or ""
            if parse_dt_local(ts) is None:
                continue
            out.append(Msg(sender=sender, text=text.strip(), timestamp_raw=ts.strip()))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "input_csv",
        nargs="?",
        default="J&JMessages(2_11_26).csv",
        help="Path to exported messages CSV",
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
    msgs = read_messages(args.input_csv)
    if len(msgs) < args.days * args.per_day:
        # It's ok, but warn because repeats may happen.
        print(
            f"Warning: only {len(msgs)} eligible messages for {args.days*args.per_day} slots; repeats may occur."
        )

    rnd = random.Random(f"{args.seed}:{args.start_date}:{args.days}:{args.per_day}")

    # Sample without immediate duplicates where possible
    pool = msgs[:]
    rnd.shuffle(pool)
    pool_idx = 0

    days_obj: dict[str, list[dict[str, str]]] = {}
    for i in range(args.days):
        d = start + timedelta(days=i)
        key = d.isoformat()
        days_obj[key] = []
        for j in range(args.per_day):
            if not pool:
                break
            if pool_idx >= len(pool):
                rnd.shuffle(pool)
                pool_idx = 0
            m = pool[pool_idx]
            pool_idx += 1
            qid = f"{key}-{j+1}"
            days_obj[key].append(
                {
                    "id": qid,
                    "text": m.text,
                    "answer": m.sender,
                    "timestamp": m.timestamp_raw,
                }
            )

    payload = {
        "generatedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "source": os.path.basename(args.input_csv),
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
