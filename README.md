# ReviewPilot AI — Project Review & Internship Hub

A full local MVP for an internship company to coordinate up to 100 active candidates, review project submissions, provide AI-assisted feedback, support English/Tamil/Hindi chat and browser speech, schedule admin-managed Google Meet sessions, email candidates, track correction deadlines, and prepare an offer-letter template after admin approval.

> **Important:** This is a working prototype, not a certified or production-hardened hiring platform. AI feedback is advisory. The company administrator makes all selection decisions. The offer-letter page is a template preview and must be verified/signed by an authorized company representative before it becomes an official offer.

## Features

- **Admin dashboard:** create candidate accounts (100 active-account cap), enable/disable accounts, inspect project reviews, update review status, schedule meetings, view audit log.
- **Candidate portal:** sign in, upload ZIP/source files, include project requirements, view findings and correction deadline, see meeting details, change password, view offer-letter template only after admin marks a review approved.
- **Project analysis:** reads source text without extracting or executing submitted code; checks archive paths/size, README, dependency manifests, tests, possible hard-coded secrets and TODO markers.
- **Gemini integration:** optional project-specific review and chat via `GEMINI_API_KEY`. Without a key, safe static checks still run and the chat tells the user AI is not configured.
- **Language and voice:** chat language selector for English/Tamil/Hindi; browser speech recognition; optional natural neural voice through ElevenLabs, with browser text-to-speech fallback. Speech recognition availability depends on browser/OS.
- **Email:** optional SMTP notifications for candidate credentials, review reports, status changes, meeting details, and reminders.
- **Follow-up scheduler:** when the Flask app is running, checks hourly for overdue 48-hour correction reminders and meetings within 24 hours. Reminder emails require SMTP. For a production deployment, run a dedicated worker/scheduler rather than relying on a web process.
- **Security basics:** password hashing, role checks, active-account checks, session cookie settings, CSRF tokens on form posts, upload limits, path traversal checks, no execution of candidate code, audit entries.
- **SQLite database:** initialized automatically on first run; old starter databases are migrated for added columns.

## Requirements

- Python 3.10 or later
- Google Chrome or another modern browser for best browser speech support
- Optional: Gemini API key for actual AI responses
- Optional: SMTP account/app password for actual email delivery

## Windows setup

1. Extract `ReviewPilot_AI_Complete_MVP.zip`.
2. Open the `reviewpilot_ai` folder in VS Code or PowerShell.
3. Create and activate a virtual environment:

```powershell
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

4. Edit `.env` before running. At minimum, set a unique `FLASK_SECRET_KEY`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL`. Example strong secret generation:

```powershell
py -c "import secrets; print(secrets.token_urlsafe(48))"
```

5. Optional AI: set `GEMINI_API_KEY` to your own key. Keep it only in `.env`, never in frontend JavaScript or GitHub. `GEMINI_MODEL` defaults to `gemini-2.5-flash`; use a model available to your account.
6. Optional natural voice: set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. Without these, the browser built-in speech synthesis is used. Check provider support for Tamil and Hindi and review provider pricing/terms.
7. Optional email: configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM`. For Gmail, use a Google App Password when eligible, not your normal account password.
8. Run:

```powershell
python app.py
```

9. Open `http://127.0.0.1:5000`.

The initial admin credentials come from `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`. The default sample username is `admin` and default sample password is `ChangeMe123!`; **change these before running**. If the database already exists, changing `.env` does not reset an existing account's password. Use the password-change screen or reset the local development database only if you are okay losing its data.

## Google Meet and Calendar

The admin manually creates/manages a Google Meet link (or uses a link generated in Google Calendar) and enters the HTTPS URL, meeting date/time and description. ReviewPilot emails the candidate when SMTP is configured. The current MVP does **not** create Google Meet sessions through the Google Calendar API automatically. That requires Google Cloud OAuth/service configuration and explicit company authorization.

## 48-hour follow-up behavior

A deadline is stored when each project is submitted. The scheduler attempts an email reminder when a review remains in `Improvements Required` and the deadline passes. A meeting reminder is attempted within 24 hours of a meeting. Email must be configured, and the app process must be running. To ensure reminders survive restarts and multiple server workers, deploy a dedicated persistent job worker in production.

## Upload and AI safety

- Uploaded code is **not executed** by this server.
- ZIP entries are read directly, not extracted to the filesystem; suspicious paths are skipped.
- The reviewer reads selected text files only. PDFs are accepted as uploads but their text is not extracted by this MVP.
- AI results depend on the files and excerpts supplied, may be incorrect, and do not prove that code runs or requirements are fully met. Run code/tests in a sandbox separately and let a human reviewer verify evidence.
- Do not upload confidential customer data, production secrets, private keys or personal information unless the company has approved the data handling process.

## Before public deployment

Use HTTPS, a production WSGI server, a persistent database, a proper secret manager, malware scanning, rate limiting, password reset/MFA, retention/deletion controls, backups, monitoring, email delivery tracking, sandboxed build/test execution, explicit consent/privacy notices, and a dedicated scheduler. Do not expose Flask's development server to the internet. Review applicable company policies and local law.

## Project structure

```text
reviewpilot_ai/
  app.py
  requirements.txt
  .env.example
  README.md
  app/
    templates/   # Jinja HTML pages
    static/      # CSS and browser voice/chat JavaScript
  uploads/       # candidate files (not committed)
  reports/       # reserved for report exports
```

## Troubleshooting

- **AI chat says not configured:** set `GEMINI_API_KEY` in `.env`, restart `python app.py`, and check the terminal if the provider is unavailable.
- **No email arrives:** verify SMTP settings, app password, sender authorization and spam folder. The app logs send failures to the terminal.
- **No reminder arrives:** keep the app running, configure SMTP and check the database status/deadline. The scheduler runs hourly, not exactly at the deadline.
- **Browser voice unavailable:** allow microphone permission and try current Chrome over localhost. Browser speech support and language voices vary by OS.
- **CSRF form error:** refresh the page and submit again.
- **Admin password changed in `.env` but login still uses old password:** the environment is used only when the admin row is first created; existing database accounts are not overwritten.
