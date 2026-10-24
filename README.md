# 🎲 Ludo 

A web-based Ludo game built using Python, Flask, Flask-SocketIO, SQLite, HTML, CSS, and JavaScript.

Play Ludo with friends in real time or challenge AI opponents. The project also includes user authentication, leaderboards, player statistics, and an interactive game interface.

## ✨ Features

- 🎮 Real-time multiplayer gameplay for 2–4 players
- 🤖 Single-player mode with Easy, Medium, and Hard AI
- 🔐 User registration and login
- 🏆 Leaderboard and player statistics
- 💬 In-game chat
- 🎲 Interactive game board and dice animations
- ♟️ Token capturing, safe zones, and extra turns on rolling a six
- 👤 Player profiles and match history

## 🛠️ Tech Stack

- **Backend:** Python, Flask, Flask-SocketIO
- **Database:** SQLite, SQLAlchemy
- **Frontend:** HTML, CSS, JavaScript
- **Templates:** Jinja2

## 📁 Project Structures

```text
Ludo-Game/
├── app.py
├── models.py
├── game_logic.py
├── socket_events.py
├── requirements.txt
├── README.md
├── database/
├── static/
│   ├── css/
│   └── js/
└── templates/
```

## 🚀 Installation and set

### Prerequisites

- Python 3.11 or newer
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/abhay-kushwaha01/Ludo-Game.git
cd Ludo-Game
```

### 2. Create a Virtual Environment

A virtual environment keeps this project's Python dependencies separate from other projects.

```bash
python -m venv .venv
```

### 3. Activate the Virtual Environment

**Windows — Command Prompt:

```bat
.venv\Scripts\activate.bat
```

**Windows — PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
source .venv/bin/activate
``
### 4. Install Dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Run the Application

```bash
python app.py
```

Open your browser and open

**http://127.0.0.1:5000**

Follow the database initialization instructions in the application code if the database is not created automatically.

## 👨‍💻 Author

**Abhay Kushwaha**

- GitHub: [@abhay-kushwaha01](https://github.com/abhay-kushwaha01)
- Repository: [Ludo-Game](https://github.com/abhay-kushwaha01/Ludo-Game)

## 📄 License

No license has been specified for this project yet.

---

⭐ If you like this project, consider giving it a star!

