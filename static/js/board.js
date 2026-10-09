const canvasPadding = 14;
const cellSize = 42;
const boardSize = cellSize * 16 + canvasPadding * 2;
const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];

const positionCoordinates = [];
for (let i = 0; i < 14; i += 1) {
  positionCoordinates.push({ pos: i, x: canvasPadding + cellSize * (i + 1), y: canvasPadding + cellSize * 1 });
}
for (let i = 0; i < 12; i += 1) {
  positionCoordinates.push({ pos: 14 + i, x: canvasPadding + cellSize * 15, y: canvasPadding + cellSize * (i + 2) });
}
for (let i = 0; i < 14; i += 1) {
  positionCoordinates.push({ pos: 26 + i, x: canvasPadding + cellSize * (14 - i), y: canvasPadding + cellSize * 15 });
}
for (let i = 0; i < 12; i += 1) {
  positionCoordinates.push({ pos: 40 + i, x: canvasPadding + cellSize * 1, y: canvasPadding + cellSize * (14 - i) });
}

const homeCoordinates = {
  red: Array.from({ length: 6 }, (_, i) => ({ x: canvasPadding + cellSize * 6, y: canvasPadding + cellSize * (2 + i) })),
  green: Array.from({ length: 6 }, (_, i) => ({ x: canvasPadding + cellSize * (9 + i), y: canvasPadding + cellSize * 6 })),
  yellow: Array.from({ length: 6 }, (_, i) => ({ x: canvasPadding + cellSize * 8, y: canvasPadding + cellSize * (9 + i) })),
  blue: Array.from({ length: 6 }, (_, i) => ({ x: canvasPadding + cellSize * (2 + i), y: canvasPadding + cellSize * 9 })),
};

const homePathMap = {
  100: homeCoordinates.red[0], 101: homeCoordinates.red[1], 102: homeCoordinates.red[2], 103: homeCoordinates.red[3], 104: homeCoordinates.red[4], 105: homeCoordinates.red[5],
  110: homeCoordinates.green[0], 111: homeCoordinates.green[1], 112: homeCoordinates.green[2], 113: homeCoordinates.green[3], 114: homeCoordinates.green[4], 115: homeCoordinates.green[5],
  120: homeCoordinates.yellow[0], 121: homeCoordinates.yellow[1], 122: homeCoordinates.yellow[2], 123: homeCoordinates.yellow[3], 124: homeCoordinates.yellow[4], 125: homeCoordinates.yellow[5],
  130: homeCoordinates.blue[0], 131: homeCoordinates.blue[1], 132: homeCoordinates.blue[2], 133: homeCoordinates.blue[3], 134: homeCoordinates.blue[4], 135: homeCoordinates.blue[5],
};

function drawBoardGrid(ctx) {
  ctx.clearRect(0, 0, boardSize, boardSize);
  ctx.fillStyle = '#081724';
  ctx.fillRect(0, 0, boardSize, boardSize);
  ctx.fillStyle = '#0f1c3a';
  ctx.fillRect(canvasPadding, canvasPadding, boardSize - canvasPadding * 2, boardSize - canvasPadding * 2);

  positionCoordinates.forEach((entry) => {
    ctx.fillStyle = safePositions.includes(entry.pos) ? '#2f4cc0' : '#15204a';
    ctx.fillRect(entry.x, entry.y, cellSize, cellSize);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeRect(entry.x, entry.y, cellSize, cellSize);
  });

  Object.values(homePathMap).forEach((coord) => {
    ctx.fillStyle = '#15244b';
    ctx.fillRect(coord.x, coord.y, cellSize, cellSize);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.strokeRect(coord.x, coord.y, cellSize, cellSize);
  });
}

function drawTokens(ctx, state) {
  state.player_order.forEach((player) => {
    player.tokens.forEach((token) => {
      if (token.position === null) return;
      const entry = positionCoordinates.find((row) => row.pos === token.position) || homePathMap[token.position];
      if (!entry) return;
      const centerX = entry.x + cellSize / 2;
      const centerY = entry.y + cellSize / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
      const fill = {
        red: '#ff5b67',
        green: '#4dd69b',
        yellow: '#ffd659',
        blue: '#74a8ff',
      }[player.color] || '#ffffff';
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#06112d';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(token.id + 1), centerX, centerY);
    });
  });
}

function renderBoard(state) {
  const canvasElement = document.getElementById('boardCanvas');
  if (!canvasElement) return;
  canvasElement.width = boardSize;
  canvasElement.height = boardSize;
  const ctx = canvasElement.getContext('2d');
  drawBoardGrid(ctx);
  drawTokens(ctx, state);
}

window.renderBoard = renderBoard;
