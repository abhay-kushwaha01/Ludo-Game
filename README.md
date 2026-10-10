# Ludo Arena

A complete online Ludo game website built with Python, Flask, Flask-SocketIO, SQLite, HTML, CSS, and JavaScript.

## Features

- Real-time multiplayer rooms with 2–4 players
- Official Ludo rules with capturing, safe zones, and extra turns on rolling 6
- Single-player mode with Easy, Medium, and Hard AI
- Login, registration, and user profiles
- Leaderboard, statistics dashboard, and game history
- Dice animation, smooth board rendering, and chat system
- Save/resume game state and match lobby system

## Folder Structure

- `app.py` — Flask application factory and blueprint registration
- `models.py` — SQLAlchemy models for users, rooms, history, and statistics
- `game_logic.py` — Ludo rules engine, move validation, AI decision-making
- `socket_events.py` — Socket.IO event handling for game rooms and chat
- `templates/` — Jinja2 views for UI pages
- `static/css/` — Application styling
- `static/js/` — Client-side interactivity and real-time socket integration
- `database/` — SQLite schema and game database

## Installation

1. Install Python 3.11 or newer.
2. Create a virtual environment:

```powershell
cd "C:\Users\Dhananjay Kushwaha\ludo-flask"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Initialize the database:

```powershell
python -c "from app import create_app; app, _ = create_app(); from models import db; db.init_app(app); with app.app_context(): db.create_all()"
```

## Running locally

```powershell
python app.py
```

Open your browser at `http://127.0.0.1:5000`.

## Deployment

### With Gunicorn and Eventlet

```powershell
pip install gunicorn eventlet
gunicorn -k eventlet -w 1 app:app
```

### With Docker

Create a `Dockerfile` and configure a web service using the Flask application.

## Notes

- The database uses SQLite at `database/ludo.db`.
- The Socket.IO handlers manage room creation, join, roll, moves, chat, and persistent state.
- The AI engine supports automated legal moves based on chosen difficulty.
