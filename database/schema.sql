CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_captures INTEGER DEFAULT 0,
  total_moves INTEGER DEFAULT 0,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  captures INTEGER DEFAULT 0,
  tokens_finished INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE game_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_code TEXT UNIQUE NOT NULL,
  host_id INTEGER NOT NULL,
  players TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  game_state TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(host_id) REFERENCES users(id)
);

CREATE TABLE game_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_code TEXT NOT NULL,
  winner_id INTEGER NOT NULL,
  summary TEXT NOT NULL,
  moves_log TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(winner_id) REFERENCES users(id)
);
