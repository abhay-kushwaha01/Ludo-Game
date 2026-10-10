import json
from datetime import datetime
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    games_played = db.Column(db.Integer, default=0)
    total_captures = db.Column(db.Integer, default=0)
    total_moves = db.Column(db.Integer, default=0)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

class GameRoom(db.Model):
    __tablename__ = 'game_rooms'
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(12), unique=True, nullable=False)
    host_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    players = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(32), default='waiting')
    game_state = db.Column(db.Text, nullable=False, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_players(self):
        try:
            return json.loads(self.players)
        except Exception:
            return []

    def set_players(self, players_list):
        self.players = json.dumps(players_list)

class GameHistory(db.Model):
    __tablename__ = 'game_history'
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(12), nullable=False)
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    moves_log = db.Column(db.Text, nullable=False)
    duration_seconds = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Statistic(db.Model):
    __tablename__ = 'statistics'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    games_won = db.Column(db.Integer, default=0)
    games_lost = db.Column(db.Integer, default=0)
    captures = db.Column(db.Integer, default=0)
    tokens_finished = db.Column(db.Integer, default=0)
    total_time = db.Column(db.Integer, default=0)
    total_games = db.Column(db.Integer, default=0)

    user = db.relationship('User', backref=db.backref('statistics', uselist=False))
