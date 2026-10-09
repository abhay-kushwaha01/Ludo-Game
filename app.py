import os
from datetime import datetime

from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_socketio import SocketIO

from models import db, User, GameRoom, GameHistory, Statistic
from socket_events import register_socket_handlers


# =========================
# APP FACTORY
# =========================
def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey123')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'database', 'ludo.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # DB init
    db.init_app(app)

    # SocketIO
    socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

    # Login manager
    login_manager = LoginManager()
    login_manager.login_view = 'login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Context processor
    @app.context_processor
    def inject_year():
        return {'current_year': datetime.utcnow().year}

    # Create DB tables
    with app.app_context():
        db.create_all()

    # Register routes + sockets
    register_routes(app)
    register_socket_handlers(socketio, app)

    return app, socketio


# =========================
# ROUTES
# =========================
def register_routes(app):

    @app.route("/")
    def index():
        if current_user.is_authenticated:
            return redirect(url_for("lobby"))
        return render_template("index.html")

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for("lobby"))

        if request.method == "POST":
            username = request.form.get("username")
            password = request.form.get("password")

            user = User.query.filter_by(username=username).first()

            if user and user.check_password(password):
                login_user(user)
                return redirect(url_for("lobby"))

            flash("Invalid credentials", "danger")

        return render_template("login.html")

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            username = request.form.get("username")
            email = request.form.get("email")
            password = request.form.get("password")

            if User.query.filter_by(username=username).first():
                flash("User already exists", "warning")
                return redirect(url_for("register"))

            user = User(username=username, email=email)
            user.set_password(password)

            db.session.add(user)
            db.session.commit()

            stat = Statistic(user_id=user.id)
            db.session.add(stat)
            db.session.commit()

            login_user(user)
            return redirect(url_for("lobby"))

        return render_template("register.html")

    @app.route("/logout")
    @login_required
    def logout():
        logout_user()
        return redirect(url_for("login"))

    @app.route("/lobby")
    @login_required
    def lobby():
        rooms = GameRoom.query.all()
        return render_template("lobby.html", rooms=rooms)

    @app.route("/profile")
    @login_required
    def profile():
        stat = Statistic.query.filter_by(user_id=current_user.id).first()
        return render_template("profile.html", stat=stat)

    @app.route("/leaderboard")
    @login_required
    def leaderboard():
        players = User.query.all()
        return render_template("leaderboard.html", players=players)

    @app.route("/statistics")
    @login_required
    def statistics():
        stat = Statistic.query.filter_by(user_id=current_user.id).first()
        return render_template("statistics.html", stat=stat)

    @app.route("/game/<room_code>")
    @login_required
    def game(room_code):
        room = GameRoom.query.filter_by(room_code=room_code).first()
        if not room:
            flash("Room not found", "danger")
            return redirect(url_for("lobby"))

        return render_template("game.html", room=room)


# =========================
# RUN
# =========================
if __name__ == "__main__":
    app, socketio = create_app()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)