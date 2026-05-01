# Evergreen (legacy stack)

Evergreen is a full-stack web app for discovering and curating **Evergreen-worthy YouTube videos**: community reviews, personal collections, and ranking signals driven by engagement and aggregated watch behavior.

This repository pairs a **Django REST** backend with a **React (Vite)** frontend.

## What’s in here

- **Videos** — Indexed by YouTube ID with metadata (title, channel, thumbnails, moderation via `is_approved`). Trusted curators (`is_trusted_curator`) can bypass normal submission gates.
- **Reviews & replies** — One review per user per video (1–6 star ratings), plus replies and upvotes on reviews/replies.
- **Evergreen collection** — Per-user saved videos (“my evergreen list”).
- **Watch events & ranking** — The frontend can emit coarse watch sessions (`VideoWatchEvent`); management commands aggregate these with reviews/collections into `VideoEvergreenStats` for Evergreen scoring and search/browse ranking.

Authentication uses **JWT** (Simple JWT / dj-rest-auth) plus **social login** hooks for Google and Apple (django-allauth), configured for local development redirects.

## Tech stack

| Area        | Choices |
|------------|---------|
| Backend    | Python 3, Django 5, Django REST Framework, SQLite (default), CORS-enabled API |
| Frontend   | React 19, Vite 7, React Router, Axios, Bootstrap 5 |
| External   | YouTube Data API (`YOUTUBE_API_KEY`) for ingestion/metadata flows |

## Repository layout

- `backend/` — Django project (`manage.py`), `api` app with models, serializers, views, and management commands (`import_videos`, `recompute_evergreen_stats`).
- `frontend/` — Vite SPA; API client targets `http://localhost:8000/` by default.

## Local development

### Backend

From `backend/`:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` in `backend/` (or project root per your setup) with at least:

- `SECRET_KEY` — Django secret key
- `DEBUG` — set to `TRUE` for local debug mode
- `YOUTUBE_API_KEY` — for commands/features that talk to YouTube

Then:

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Optional: run `python manage.py recompute_evergreen_stats` after data changes to refresh ranking aggregates.

### Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Vite’s dev server defaults to port **5173**; CORS in `backend/backend/settings.py` already allows `localhost:5173` (and a few neighboring ports).

Ensure the SPA can reach the API at the same origin your `frontend/src/api/api.js` expects (`http://localhost:8000/` unless you change it).

### Social auth notes

django-allauth is configured with `LOGIN_REDIRECT_URL` pointing at the local SPA. For Google/Apple sign-in beyond local smoke tests you will need provider keys and OAuth settings as required by django-allauth and each provider—see Django admin and allauth docs for your environment.
