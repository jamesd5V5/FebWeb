# FebWeb Valentine Site

Static Valentine website (GitHub Pages) with:
- relationship stats (days together, LA↔SD distance, optional next-visit countdown)
- a daily “who said it?” text-message quiz with a simple login (not secure)

## Customize

Edit these values in `app.js`:
- `girlfriendName`
- `relationshipStartLocalDate`
- `nextVisitLocalDate` (optional)
- `reasons[]`
- `auth.sharedPassword` (defaults to `1234`)

## Message quiz data (privacy-friendly)

Do **not** upload your full message export to GitHub Pages.

Instead, generate a small quiz bank and upload only that:
- `data/quiz-bank.json`

### Build the quiz bank from your CSV
Your export file looks like: `J&JMessages(2_11_26).csv`.

Run:

```bash
python scripts/build_quiz_bank.py "J&JMessages(2_11_26).csv" --days 365 --per-day 3 --start-date 2026-02-12 --out data/quiz-bank.json
```

This picks a limited number of messages and writes a per-day set of questions.

### (Optional) Create a local full-history clean file
This writes `local-output/messages.clean.jsonl` (local only):

```bash
python scripts/parse_messages_csv.py "J&JMessages(2_11_26).csv" --out local-output/messages.clean.jsonl
```

## Publish on GitHub Pages

1. Create a new GitHub repo and push this folder.
2. In your repo: **Settings → Pages**.
3. Under “Build and deployment”, select:
   - Source: **Deploy from a branch**
   - Branch: `main` (or `master`) and folder `/ (root)`
4. Wait for GitHub to deploy. Your site URL will appear there.
