import json
import random
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict, Optional

COLORS = ['red', 'green', 'yellow', 'blue']
START_POSITIONS = {'red': 0, 'green': 13, 'yellow': 26, 'blue': 39}
SAFE_SQUARES = {0, 8, 13, 21, 26, 34, 39, 47}
HOME_PATH = {
    'red': [100, 101, 102, 103, 104, 105],
    'green': [110, 111, 112, 113, 114, 115],
    'yellow': [120, 121, 122, 123, 124, 125],
    'blue': [130, 131, 132, 133, 134, 135],
}
BOARD_LENGTH = 52

def route_for(color):
    path = []
    start = START_POSITIONS[color]
    for step in range(BOARD_LENGTH):
        path.append((start + step) % BOARD_LENGTH)
    path.extend(HOME_PATH[color])
    return path

def is_safe_position(position):
    return position in SAFE_SQUARES or position in HOME_PATH['red'] or position in HOME_PATH['green'] or position in HOME_PATH['yellow'] or position in HOME_PATH['blue']

@dataclass
class TokenState:
    id: int
    position: Optional[int] = None
    finished: bool = False

@dataclass
class PlayerState:
    user_id: int
    username: str
    color: str
    is_ai: bool = False
    difficulty: str = 'easy'
    tokens: List[TokenState] = field(default_factory=lambda: [TokenState(id=i) for i in range(4)])
    has_finished: bool = False
    score: int = 0

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'username': self.username,
            'color': self.color,
            'is_ai': self.is_ai,
            'difficulty': self.difficulty,
            'tokens': [vars(token) for token in self.tokens],
            'has_finished': self.has_finished,
            'score': self.score,
        }

    @classmethod
    def from_dict(cls, data):
        state = cls(
            user_id=data['user_id'],
            username=data['username'],
            color=data['color'],
            is_ai=data.get('is_ai', False),
            difficulty=data.get('difficulty', 'easy'),
        )
        state.tokens = [TokenState(**token) for token in data['tokens']]
        state.has_finished = data.get('has_finished', False)
        state.score = data.get('score', 0)
        return state

@dataclass
class LudoGame:
    room_code: str
    player_order: List[PlayerState] = field(default_factory=list)
    current_index: int = 0
    dice_value: int = 0
    last_roll: Optional[int] = None
    turn_started: bool = False
    turn_passed_at: Optional[str] = None
    messages: List[Dict] = field(default_factory=list)
    move_history: List[Dict] = field(default_factory=list)
    finished: bool = False
    winner: Optional[str] = None

    def to_dict(self):
        return {
            'room_code': self.room_code,
            'player_order': [player.to_dict() for player in self.player_order],
            'current_index': self.current_index,
            'dice_value': self.dice_value,
            'last_roll': self.last_roll,
            'turn_started': self.turn_started,
            'turn_passed_at': self.turn_passed_at,
            'messages': self.messages,
            'move_history': self.move_history,
            'finished': self.finished,
            'winner': self.winner,
        }

    @classmethod
    def from_dict(cls, data):
        game = cls(room_code=data['room_code'])
        game.player_order = [PlayerState.from_dict(player) for player in data['player_order']]
        game.current_index = data.get('current_index', 0)
        game.dice_value = data.get('dice_value', 0)
        game.last_roll = data.get('last_roll')
        game.turn_started = data.get('turn_started', False)
        game.turn_passed_at = data.get('turn_passed_at')
        game.messages = data.get('messages', [])
        game.move_history = data.get('move_history', [])
        game.finished = data.get('finished', False)
        game.winner = data.get('winner')
        return game

    def get_current_player(self):
        return self.player_order[self.current_index]

    def roll_dice(self):
        self.dice_value = random.randint(1, 6)
        self.last_roll = self.dice_value
        self.turn_started = True
        self.move_history.append({
            'type': 'roll',
            'player': self.get_current_player().username,
            'value': self.dice_value,
            'timestamp': datetime.utcnow().isoformat(),
        })
        return self.dice_value

    def advance_route(self, color, position, steps):
        if position is None:
            route = route_for(color)
            if steps == 6:
                return route[0]
            return None
        route = route_for(color)
        if position in HOME_PATH[color]:
            index = route.index(position)
        else:
            index = route.index(position)
        new_index = index + steps
        if new_index >= len(route):
            return None
        return route[new_index]

    def get_valid_moves(self, player_index=None):
        if player_index is None:
            player_index = self.current_index
        player = self.player_order[player_index]
        moves = []
        for token in player.tokens:
            if token.finished:
                continue
            if token.position is None:
                if self.dice_value == 6:
                    target = START_POSITIONS[player.color]
                    moves.append({'token_id': token.id, 'from': None, 'to': target})
                continue
            target = self.advance_route(player.color, token.position, self.dice_value)
            if target is not None:
                moves.append({'token_id': token.id, 'from': token.position, 'to': target})
        return moves

    def apply_move(self, token_id):
        player = self.get_current_player()
        token = next((token for token in player.tokens if token.id == token_id), None)
        if token is None or token.finished:
            return False
        valid_moves = self.get_valid_moves(self.current_index)
        selected = next((move for move in valid_moves if move['token_id'] == token_id), None)
        if not selected:
            return False
        destination = selected['to']
        if token.position is None and destination == START_POSITIONS[player.color]:
            token.position = destination
        else:
            token.position = destination
        if destination in HOME_PATH[player.color] and destination == HOME_PATH[player.color][-1]:
            token.finished = True
        self.capture_opponent_tokens(player.color, destination)
        self.move_history.append({
            'type': 'move',
            'player': player.username,
            'token_id': token.id,
            'destination': destination,
            'timestamp': datetime.utcnow().isoformat(),
        })
        self.update_player_score(player)
        if self.dice_value != 6:
            self.advance_turn()
        else:
            self.turn_started = False
        self.check_game_winner()
        return True

    def update_player_score(self, player):
        player.score = sum(1 for token in player.tokens if token.finished)

    def capture_opponent_tokens(self, color, destination):
        if destination is None or destination in HOME_PATH[color]:
            return
        if is_safe_position(destination):
            return
        for opponent in self.player_order:
            if opponent.color == color:
                continue
            for token in opponent.tokens:
                if token.position == destination:
                    token.position = None
                    token.finished = False
                    self.move_history.append({
                        'type': 'capture',
                        'attacker': self.get_current_player().username,
                        'victim': opponent.username,
                        'destination': destination,
                        'timestamp': datetime.utcnow().isoformat(),
                    })

    def advance_turn(self):
        self.current_index = (self.current_index + 1) % len(self.player_order)
        self.turn_started = False
        self.dice_value = 0

    def check_game_winner(self):
        for player in self.player_order:
            player.has_finished = all(token.finished for token in player.tokens)
            if player.has_finished:
                self.finished = True
                self.winner = player.username
                break

    def add_message(self, username, message):
        self.messages.append({
            'player': username,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
        })

    @classmethod
    def create(cls, room_code, players):
        ordered_players = [PlayerState.from_dict(player) for player in players]
        return cls(room_code=room_code, player_order=ordered_players)

@dataclass
class AIPlayer:
    difficulty: str = 'easy'

    def select_move(self, game: LudoGame):
        valid_moves = game.get_valid_moves(game.current_index)
        if not valid_moves:
            return None
        if self.difficulty == 'hard':
            captures = [move for move in valid_moves if self.is_capture_move(game, move)]
            if captures:
                return random.choice(captures)
            finishes = [move for move in valid_moves if self.is_finish_move(game, move)]
            if finishes:
                return random.choice(finishes)
        if self.difficulty == 'medium':
            safe_moves = [move for move in valid_moves if self.is_safe_target(move['to'])]
            if safe_moves:
                return random.choice(safe_moves)
        return random.choice(valid_moves)

    def is_capture_move(self, game, move):
        destination = move['to']
        player = game.get_current_player()
        if destination is None or destination in HOME_PATH[player.color]:
            return False
        for opponent in game.player_order:
            if opponent.color == player.color:
                continue
            if any(token.position == destination for token in opponent.tokens):
                return True
        return False

    def is_finish_move(self, game, move):
        player = game.get_current_player()
        return move['to'] in HOME_PATH[player.color] and move['to'] == HOME_PATH[player.color][-1]

    def is_safe_target(self, destination):
        return destination is None or is_safe_position(destination)
