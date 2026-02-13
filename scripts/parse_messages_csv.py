#!/usr/bin/env python3
"""
Parse the exported messages CSV and write a clean local file.

Input CSV columns (your export):
  Date, Sender, Received, iMessage, Text

Output (default): local-output/messages.clean.jsonl
  One JSON object per line with:
    date, time, user, text, datetime_local

This output is intended to stay LOCAL (do not upload to GitHub Pages).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
from dataclasses import dataclass
from datetime import datetime


DATE_FMT = "%m/%d/%Y %I:%M:%S %p"


def normalize_sender(sender: str) -> str:
    s = (sender or "").strip()
    # Match your known IDs
    if s.lower().startswith("jamesd5@"):
        return "james"
    if s.replace(" ", "") in {"+17607168689", "17607168689"}:
        return "jess"

    # Fallback heuristics
    if "@" in s:
        return s.split("@", 1)[0].lower()
    if s.startswith("+"):
        return s
    return s.lower()


@dataclass(frozen=True)
class CleanMsg:
    date: str
    time: str
    user: str
    text: str
    datetime_local: str


def parse_dt_local(s: str) -> datetime | None:
    raw = (s or "").strip()
    if not raw:
        return None
    try:
        return datetime.strptime(raw, DATE_FMT)
    except ValueError:
        return None


def clean_row(row: dict[str, str]) -> CleanMsg | None:
    dt_raw = row.get("Date", "") or ""
    sender_raw = row.get("Sender", "") or ""
    text_raw = row.get("Text", "") or ""

    dt = parse_dt_local(dt_raw)
    if dt is None:
        return None

    user = normalize_sender(sender_raw)
    date = dt.strftime("%Y-%m-%d")
    time = dt.strftime("%H:%M:%S")
    datetime_local = dt.strftime("%Y-%m-%dT%H:%M:%S")

    return CleanMsg(
        date=date,
        time=time,
        user=user,
        text=text_raw,
        datetime_local=datetime_local,
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "input_csv",
        nargs="?",
        default="J&JMessages(2_11_26).csv",
        help="Path to exported messages CSV",
    )
    ap.add_argument(
        "--out",
        default=os.path.join("local-output", "messages.clean.jsonl"),
        help="Output JSONL path (local-only)",
    )
    args = ap.parse_args()

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)

    written = 0
    with open(args.input_csv, "r", encoding="utf-8", newline="") as f_in, open(
        args.out, "w", encoding="utf-8", newline=""
    ) as f_out:
        reader = csv.DictReader(f_in)
        for row in reader:
            msg = clean_row(row)
            if msg is None:
                continue
            f_out.write(
                json.dumps(
                    {
                        "date": msg.date,
                        "time": msg.time,
                        "user": msg.user,
                        "text": msg.text,
                        "datetime_local": msg.datetime_local,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
            written += 1

    print(f"Wrote {written} messages to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
