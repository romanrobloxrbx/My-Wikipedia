# My Wikipedia

A responsive, browser-based community encyclopedia built with Flask, HTML, and CSS. Visitors can browse and search articles; registered users can write and edit; administrators can manage roles and restore previous revisions.

## Run locally

1. Install Python 3.10 or newer.
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`
4. Initialize sample articles: `flask --app app init-db`
5. Start the website: `flask --app app run --debug`
6. Open the local address printed by Flask (normally `http://127.0.0.1:5000`).

You can also run `python app.py`; it creates database tables automatically, but use the CLI command above to add sample articles.

## Configuration

- `SECRET_KEY`: set a long random secret before deployment.
- `DATABASE_URL`: optional SQLAlchemy database URL; defaults to SQLite.
- `FLASK_DEBUG`: set to `1` only for local development.

## Current MVP

- Responsive home page, site-wide search, subject categories, article pages
- Account registration and sign-in with password hashing
- Registered-user article creation and editing
- Immutable revision history and admin rollback
- Admin dashboard, role management, and moderation log
- Source/attribution model for future references and imports

## Important production work

This repository is an MVP, not yet a production-ready public encyclopedia. Before deployment, add CSRF protection to every state-changing form, email verification and password reset, login and editing rate limits, secure cookie settings, database migrations, robust Markdown rendering and sanitization, a safe first-admin bootstrap command, tests, backups, and a licensed content importer. Set `SECRET_KEY` securely and disable debug mode. Do not import Wikipedia or other content without following the source's license and attribution requirements.

The first registered account is **not** automatically an administrator. Promote an account only through a secure, trusted database or deployment operation.
