// ============================================
// SOCKET.IO - REAL-TIME COMMUNICATION
// ============================================

// Initialize Socket.IO
const socket = io();

// Make socket available globally
window.socket = socket;

// ============================================
// CONNECTION EVENTS
// ============================================

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    if (window.ludoApp && window.ludoApp.showNotification) {
        window.ludoApp.showNotification('Connected to game server', 'success');
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    if (window.ludoApp) {
        window.ludoApp.showNotification('Disconnected from server', 'danger');
        window.ludoApp.gameState.gameActive = false;
    }
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    if (window.ludoApp && window.ludoApp.showNotification) {
        window.ludoApp.showNotification('Connection error', 'danger');
    }
});

// ============================================
// ROOM EVENTS
// ============================================

socket.on('room_created', (data) => {
    console.log('Room created:', data);
    if (window.ludoApp) {
        window.ludoApp.gameState.roomCode = data.room_code;
        localStorage.setItem('lastRoomCode', data.room_code);
        window.ludoApp.showNotification('Room created! Code: ' + data.room_code, 'success');
        
        setTimeout(() => {
            window.location.href = `/game?room=${data.room_code}`;
        }, 1500);
    }
});

socket.on('room_update', (data) => {
    console.log('Room updated:', data);
    if (window.ludoApp) {
        window.ludoApp.gameState.players = data.players;
        updatePlayersDisplay();
    }
});

socket.on('joined_room', (data) => {
    console.log('Joined room:', data);
    if (window.ludoApp) {
        window.ludoApp.gameState.roomCode = data.room_code;
        window.ludoApp.showNotification('Joined room successfully!', 'success');
        
        if (data.redirect) {
            window.location.href = `/game?room=${data.room_code}`;
        }
    }
});

socket.on('room_full', () => {
    if (window.ludoApp && window.ludoApp.showNotification) {
        window.ludoApp.showNotification('This room is full', 'warning');
    }
});

socket.on('room_not_found', () => {
    if (window.ludoApp && window.ludoApp.showNotification) {
        window.ludoApp.showNotification('Room not found', 'danger');
    }
});

// ============================================
// GAME EVENTS
// ============================================

socket.on('game_state', (data) => {
    console.log('Received game state:', data);
    if (data.state && window.ludoApp) {
        updateGameState(data.state);
    }
});

socket.on('game_started', (data) => {
    console.log('Game started:', data);
    if (window.ludoApp && data.state) {
        window.ludoApp.gameState.gameActive = true;
        window.ludoApp.gameState.players = data.state.player_order;
        window.ludoApp.gameState.currentPlayer = data.state.player_order[data.state.current_index];
        
        window.ludoApp.showNotification('Game Started!', 'success');
        updatePlayersDisplay();
        updateGameDisplay();
    }
});

socket.on('dice_rolled', (data) => {
    console.log('Dice rolled:', data);
    if (window.ludoApp) {
        window.ludoApp.gameState.diceValue = data.dice;
        
        const diceElement = document.querySelector('.dice');
        if (diceElement) {
            diceElement.textContent = data.dice;
        }
        
        updateGameState(data.state);
    }
});

socket.on('move_applied', (data) => {
    console.log('Move applied:', data);
    if (window.ludoApp && data.state) {
        updateGameState(data.state);
    }
});

socket.on('game_finished', (data) => {
    console.log('Game finished:', data);
    if (window.ludoApp) {
        window.ludoApp.gameState.gameActive = false;
        showGameOverModal(data);
    }
});

// ============================================
// CHAT EVENTS
// ============================================

socket.on('message_received', (data) => {
    console.log('Message received:', data);
    if (window.ludoApp && data.message) {
        window.ludoApp.addChatMessage(data.message);
    }
});

socket.on('system_message', (data) => {
    console.log('System message:', data);
    if (window.ludoApp) {
        const systemMsg = {
            author: 'System',
            text: data.message,
            timestamp: new Date().toLocaleTimeString()
        };
        window.ludoApp.addChatMessage(systemMsg);
    }
});

// ============================================
// ERROR EVENTS
// ============================================

socket.on('error', (data) => {
    console.error('Error from server:', data);
    if (window.ludoApp && window.ludoApp.showNotification) {
        window.ludoApp.showNotification(data.message || 'An error occurred', 'danger');
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function updateGameState(state) {
    if (!window.ludoApp || !state) return;
    
    window.ludoApp.gameState.currentPlayer = state.player_order[state.current_index];
    window.ludoApp.gameState.diceValue = state.dice_value;
    window.ludoApp.gameState.players = state.player_order;
    
    updatePlayersDisplay();
    updateGameDisplay();
}

function updatePlayersDisplay() {
    const playersContainer = document.querySelector('.players-container');
    if (!playersContainer || !window.ludoApp) return;
    
    playersContainer.innerHTML = '';
    
    window.ludoApp.gameState.players.forEach((player) => {
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${player.color}`;
        
        if (window.ludoApp.gameState.currentPlayer && 
            window.ludoApp.gameState.currentPlayer.user_id === player.user_id) {
            playerCard.classList.add('active');
        }
        
        let statusBadge = 'Waiting';
        if (player.has_finished) {
            statusBadge = '✓ Finished';
        } else if (window.ludoApp.gameState.currentPlayer && 
                   window.ludoApp.gameState.currentPlayer.user_id === player.user_id) {
            statusBadge = '● Your Turn';
        }
        
        playerCard.innerHTML = `
            <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-status">${statusBadge}</div>
            </div>
            <div class="tokens-progress">
                ${player.tokens.map((token, i) => `
                    <div class="token-dot ${token.finished ? 'finished' : (token.position ? 'playing' : 'home')}">
                        ${i + 1}
                    </div>
                `).join('')}
            </div>
        `;
        
        playersContainer.appendChild(playerCard);
    });
}

function updateGameDisplay() {
    const diceElement = document.querySelector('.dice');
    if (!diceElement || !window.ludoApp) return;
    
    const isCurrentPlayer = window.ludoApp.gameState.userId === 
                           window.ludoApp.gameState.currentPlayer?.user_id;
    
    diceElement.disabled = !isCurrentPlayer || window.ludoApp.gameState.diceValue > 0;
    diceElement.style.cursor = diceElement.disabled ? 'not-allowed' : 'pointer';
    diceElement.style.opacity = diceElement.disabled ? '0.6' : '1';
}

function showGameOverModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">🎉 Game Over!</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="winner-badge">
                        🏆 Winner: ${data.winner}
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="/lobby" class="btn btn-primary">Back to Lobby</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// ============================================
// EMIT FUNCTIONS
// ============================================

function emitRoomCreate(username, userId) {
    socket.emit('create_room', {
        username: username,
        user_id: userId
    });
}

function emitRoomJoin(roomCode, username, userId) {
    socket.emit('join_room', {
        room_code: roomCode.toUpperCase(),
        username: username,
        user_id: userId
    });
}

function emitDiceRoll(roomCode, userId) {
    socket.emit('roll_dice', {
        room_code: roomCode,
        user_id: userId
    });
}

function emitChatMessage(roomCode, userId, message) {
    socket.emit('send_message', {
        room_code: roomCode,
        user_id: userId,
        message: message
    });
}

// Make functions available globally
window.socketFunctions = {
    emitRoomCreate,
    emitRoomJoin,
    emitDiceRoll,
    emitChatMessage
};

console.log('Socket.IO Module Loaded');

function appendHistoryEntry(text) {
  const log = document.getElementById('historyLog');
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.textContent = text;
  log.prepend(entry);
}

function appendChatMessage(message) {
  const log = document.getElementById('chatLog');
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = 'chat-message';
  entry.innerHTML = `<strong>${message.player}</strong>: ${message.message}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function renderGameBoard(state) {
  if (!window.renderBoard) return;
  window.renderBoard(state);
}

const roomCodeInput = document.getElementById('joinRoomCode');
const createRoomButton = document.getElementById('createRoom');
const joinRoomButton = document.getElementById('joinRoom');
const startGameButton = document.getElementById('startGame');
const rollDiceButton = document.getElementById('rollDice');
const chatForm = document.getElementById('chatForm');

if (createRoomButton) {
  createRoomButton.addEventListener('click', () => {
    socket.emit('create_room', {
      username: GAME_CONFIG.currentUser,
      user_id: GAME_CONFIG.userId,
      mode: document.getElementById('modeSelect').value,
      difficulty: document.getElementById('difficultySelect').value,
    });
  });
}

if (joinRoomButton) {
  joinRoomButton.addEventListener('click', () => {
    const roomCode = roomCodeInput.value.trim();
    if (!roomCode) return;
    socket.emit('join_room', {
      room_code: roomCode,
      username: GAME_CONFIG.currentUser,
      user_id: GAME_CONFIG.userId,
    });
  });
}

if (startGameButton) {
  startGameButton.addEventListener('click', () => {
    socket.emit('start_game', { room_code: GAME_CONFIG.roomCode });
  });
}

if (rollDiceButton) {
  rollDiceButton.addEventListener('click', () => {
    socket.emit('roll_dice', { room_code: GAME_CONFIG.roomCode });
  });
}

if (chatForm) {
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    if (!input.value.trim()) return;
    socket.emit('chat_message', {
      room_code: GAME_CONFIG.roomCode,
      username: GAME_CONFIG.currentUser,
      message: input.value.trim(),
    });
    input.value = '';
  });
}

socket.on('connected', () => {
  console.log('Connected');
});

socket.on('room_created', (payload) => {
  if (payload.room_code) {
    window.location.href = `/game/${payload.room_code}`;
  }
});

socket.on('joined_room', () => {
  window.location.href = `/game/${roomCodeInput.value.trim().toUpperCase()}`;
});

socket.on('room_update', (payload) => {
  if (payload.players) {
    createPlayerList(payload.players);
  }
});

socket.on('game_started', (payload) => {
  if (!payload.state) return;
  updateElementText('#matchStatus', 'Game started');
  renderGameBoard(payload.state);
  createPlayerList(payload.state.player_order);
  appendHistoryEntry('Game started with live rules and AI support.');
});

socket.on('game_state', (payload) => {
  if (!payload.state) return;
  renderGameBoard(payload.state);
  createPlayerList(payload.state.player_order);
  updateElementText('#currentPlayer', payload.state.player_order[payload.state.current_index].username);
});

socket.on('dice_rolled', (payload) => {
  if (payload.dice !== undefined) {
    updateElementText('#diceValue', payload.dice);
  }
  if (payload.state) {
    renderGameBoard(payload.state);
    updateElementText('#currentPlayer', payload.state.player_order[payload.state.current_index].username);
    appendHistoryEntry(`${payload.state.player_order[payload.state.current_index].username} rolled ${payload.dice}.`);
  }
});

socket.on('move_applied', (payload) => {
  if (!payload.state) return;
  renderGameBoard(payload.state);
  updateElementText('#currentPlayer', payload.state.player_order[payload.state.current_index].username);
  if (payload.token_id !== undefined) {
    appendHistoryEntry(`${payload.state.player_order[payload.state.current_index].username} moved token ${payload.token_id}.`);
  }
  if (payload.state.finished) {
    appendHistoryEntry(`Victory! ${payload.state.winner} has won the game.`);
    updateElementText('#matchStatus', `Winner: ${payload.state.winner}`);
  }
});

socket.on('turn_passed', (payload) => {
  if (payload.state) {
    renderGameBoard(payload.state);
    updateElementText('#currentPlayer', payload.state.player_order[payload.state.current_index].username);
    appendHistoryEntry('Turn passed automatically.');
  }
});

socket.on('chat_updated', (payload) => {
  if (!payload.messages) return;
  const log = document.getElementById('chatLog');
  if (!log) return;
  log.innerHTML = '';
  payload.messages.forEach(appendChatMessage);
});

socket.on('error', (payload) => {
  if (!payload.message) return;
  alert(payload.message);
});

window.addEventListener('load', () => {
  if (GAME_CONFIG.roomCode) {
    socket.emit('load_game', { room_code: GAME_CONFIG.roomCode });
  }
});
