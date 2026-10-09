// ============================================
// LUDO MASTER - MAIN APPLICATION
// ============================================

// Global Variables
const gameState = {
    roomCode: null,
    userId: null,
    username: null,
    currentPlayer: null,
    gameActive: false,
    diceValue: 0,
    selectedToken: null,
    players: [],
    tokens: {},
    messages: [],
    animationInProgress: false
};

// DOM References
const gameBoard = document.querySelector('.ludo-board');
const diceElement = document.querySelector('.dice');
const playersContainer = document.querySelector('.players-container');
const chatMessages = document.querySelector('.chat-messages');
const chatInput = document.querySelector('.chat-input');
const chatSendBtn = document.querySelector('.chat-send-btn');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserPreferences();
});

function initializeApp() {
    console.log('Initializing Ludo Master Application');
    
    // Set room code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    gameState.roomCode = urlParams.get('room') || localStorage.getItem('lastRoomCode');
    
    // Load user info from session storage
    if (sessionStorage.getItem('userId')) {
        gameState.userId = parseInt(sessionStorage.getItem('userId'));
        gameState.username = sessionStorage.getItem('username');
    }
    
    // Setup board if on game page
    if (gameBoard) {
        initializeBoard();
    }
}

function setupEventListeners() {
    // Dice click
    if (diceElement) {
        diceElement.addEventListener('click', rollDice);
    }
    
    // Chat
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage);
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                }
            });
        }
    }
    
    // Window Events
    window.addEventListener('beforeunload', saveGameState);
}

// ============================================
// BOARD FUNCTIONS
// ============================================

function initializeBoard() {
    console.log('Initializing game board');
    if (!gameBoard) return;
    
    // Clear previous board
    gameBoard.innerHTML = '';
    
    // Create 52 main board squares
    for (let i = 0; i < 52; i++) {
        const square = createBoardSquare(i);
        gameBoard.appendChild(square);
    }
}

function createBoardSquare(index) {
    const square = document.createElement('div');
    square.className = 'board-square';
    square.id = `square-${index}`;
    square.dataset.position = index;
    
    // Mark safe squares
    const safeSquares = [0, 8, 13, 21, 26, 34, 39, 47];
    if (safeSquares.includes(index)) {
        square.classList.add('safe');
    }
    
    square.addEventListener('click', handleSquareClick);
    return square;
}

function initializeTokens() {
    const colors = ['red', 'green', 'yellow', 'blue'];
    gameState.tokens = {};
    
    colors.forEach(color => {
        gameState.tokens[color] = [];
        
        for (let i = 0; i < 4; i++) {
            const token = createToken(color, i);
            gameState.tokens[color].push({
                id: i,
                element: token,
                position: null,
                finished: false
            });
        }
    });
}

function createToken(color, index) {
    const token = document.createElement('div');
    token.className = `token ${color}`;
    token.id = `token-${color}-${index}`;
    token.innerHTML = `<span class="token-label">${index + 1}</span>`;
    token.dataset.color = color;
    token.dataset.tokenId = index;
    
    token.addEventListener('click', handleTokenClick);
    token.addEventListener('dblclick', handleTokenDoubleClick);
    
    return token;
}

function handleSquareClick(e) {
    if (!gameState.gameActive) return;
    const square = e.currentTarget;
    console.log(`Square clicked: ${square.id}`);
}

function handleTokenClick(e) {
    e.stopPropagation();
    if (!gameState.gameActive) return;
    
    const token = e.currentTarget;
    const color = token.dataset.color;
    const tokenId = parseInt(token.dataset.tokenId);
    
    // Deselect previous token
    document.querySelectorAll('.token.selected').forEach(t => t.classList.remove('selected'));
    
    // Select current token
    token.classList.add('selected');
    gameState.selectedToken = { color, tokenId };
}

function handleTokenDoubleClick(e) {
    e.stopPropagation();
    if (!gameState.gameActive) return;
    
    const token = e.currentTarget;
    const color = token.dataset.color;
    const tokenId = parseInt(token.dataset.tokenId);
    
    moveToken(color, tokenId, gameState.diceValue);
}

// ============================================
// GAME FUNCTIONS
// ============================================

function rollDice() {
    if (!gameState.gameActive || gameState.animationInProgress) return;
    if (!diceElement) return;
    
    diceElement.disabled = true;
    diceElement.classList.add('dice-rolling');
    
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        const randomDice = Math.floor(Math.random() * 6) + 1;
        diceElement.textContent = randomDice;
        rollCount++;
        
        if (rollCount > 10) {
            clearInterval(rollInterval);
            gameState.diceValue = Math.floor(Math.random() * 6) + 1;
            diceElement.textContent = gameState.diceValue;
            diceElement.classList.remove('dice-rolling');
            
            // Emit to socket
            if (window.socket) {
                window.socket.emit('roll_dice', {
                    room_code: gameState.roomCode,
                    user_id: gameState.userId
                });
            }
            
            setTimeout(() => {
                diceElement.disabled = false;
            }, 500);
        }
    }, 100);
}

function moveToken(color, tokenId, steps) {
    if (gameState.animationInProgress) return;
    gameState.animationInProgress = true;
    
    setTimeout(() => {
        gameState.animationInProgress = false;
    }, 600);
}

function updateBoardDisplay() {
    // Clear all squares
    document.querySelectorAll('.board-square').forEach(sq => {
        sq.innerHTML = '';
    });
}

// ============================================
// CHAT FUNCTIONS
// ============================================

function sendChatMessage() {
    if (!chatInput || !chatInput.value.trim()) return;
    
    const message = {
        author: gameState.username,
        text: chatInput.value,
        timestamp: new Date().toLocaleTimeString()
    };
    
    if (window.socket) {
        window.socket.emit('send_message', {
            room_code: gameState.roomCode,
            user_id: gameState.userId,
            message: message
        });
    }
    
    chatInput.value = '';
}

function addChatMessage(message) {
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    messageElement.innerHTML = `
        <div class="chat-author">${escapeHtml(message.author)}</div>
        <div class="chat-text">${escapeHtml(message.text)}</div>
        <small class="text-muted">${message.timestamp}</small>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.innerHTML = `
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container-fluid') || document.body;
    container.insertBefore(toast, container.firstChild);
    
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveGameState() {
    if (gameState.roomCode) {
        localStorage.setItem('lastRoomCode', gameState.roomCode);
    }
}

function loadUserPreferences() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
}

// Lobby Page
function createRoom() {
    if (window.socket) {
        window.socket.emit('create_room', {
            username: gameState.username,
            user_id: gameState.userId
        });
    }
}

function joinRoom() {
    const roomCodeInput = document.querySelector('input[name="room_code"]');
    if (!roomCodeInput || !roomCodeInput.value.trim()) {
        showNotification('Please enter a room code', 'warning');
        return;
    }
    
    if (window.socket) {
        window.socket.emit('join_room', {
            room_code: roomCodeInput.value.toUpperCase(),
            username: gameState.username,
            user_id: gameState.userId
        });
    }
}

// Export for use in other files
window.ludoApp = {
    gameState,
    rollDice,
    createRoom,
    joinRoom,
    sendChatMessage,
    showNotification,
    addChatMessage
};

console.log('Ludo Master Application Loaded');
