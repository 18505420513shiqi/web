(function () {
  const COLS = 10;
  const ROWS = 20;
  const CELL = 20;

  const COLORS = {
    I: "#5ba3d0",
    O: "#c9a66b",
    T: "#1f6f5b",
    S: "#7eb8de",
    Z: "#d4785a",
    J: "#4a7c91",
    L: "#8f6b3a",
  };

  const SHAPES = {
    I: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
    ],
    O: [
      [
        [1, 1],
        [1, 1],
      ],
    ],
    T: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
    S: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
    ],
    Z: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
    ],
    J: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
    L: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  };

  const TYPES = Object.keys(SHAPES);

  const widget = document.getElementById("tetris-widget");
  const toggle = document.getElementById("tetris-toggle");
  const canvas = document.getElementById("tetris-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("tetris-score");
  const linesEl = document.getElementById("tetris-lines");
  const startBtn = document.getElementById("tetris-start");
  const pauseBtn = document.getElementById("tetris-pause");
  const overlay = document.getElementById("tetris-overlay");
  const overlayText = document.getElementById("tetris-overlay-text");

  let board = createBoard();
  let piece = null;
  let score = 0;
  let lines = 0;
  let dropMs = 700;
  let lastDrop = 0;
  let running = false;
  let paused = false;
  let gameOver = false;
  let rafId = null;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function randomPiece() {
    const type = TYPES[(Math.random() * TYPES.length) | 0];
    return {
      type,
      rotation: 0,
      x: 3,
      y: 0,
    };
  }

  function matrixOf(p) {
    const rotations = SHAPES[p.type];
    return rotations[p.rotation % rotations.length];
  }

  function collides(p, offsetX = 0, offsetY = 0, nextRotation = p.rotation) {
    const rotations = SHAPES[p.type];
    const matrix = rotations[nextRotation % rotations.length];
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;
        const nx = p.x + x + offsetX;
        const ny = p.y + y + offsetY;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    const matrix = matrixOf(piece);
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;
        const ny = piece.y + y;
        const nx = piece.x + x;
        if (ny < 0) {
          endGame();
          return;
        }
        board[ny][nx] = piece.type;
      }
    }
    clearLines();
    spawn();
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      if (board[y].every((cell) => cell)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared += 1;
        y += 1;
      }
    }
    if (!cleared) return;
    lines += cleared;
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] || cleared * 200;
    dropMs = Math.max(180, 700 - lines * 18);
    scoreEl.textContent = String(score);
    linesEl.textContent = String(lines);
  }

  function spawn() {
    piece = randomPiece();
    if (collides(piece)) {
      endGame();
    }
  }

  function drop(byUser) {
    if (!piece || !running || paused || gameOver) return;
    if (!collides(piece, 0, 1)) {
      piece.y += 1;
      if (byUser) {
        score += 1;
        scoreEl.textContent = String(score);
      }
    } else {
      lockPiece();
    }
    draw();
  }

  function hardDrop() {
    if (!piece || !running || paused || gameOver) return;
    while (!collides(piece, 0, 1)) {
      piece.y += 1;
      score += 2;
    }
    scoreEl.textContent = String(score);
    lockPiece();
    draw();
  }

  function move(dx) {
    if (!piece || !running || paused || gameOver) return;
    if (!collides(piece, dx, 0)) {
      piece.x += dx;
      draw();
    }
  }

  function rotate() {
    if (!piece || !running || paused || gameOver) return;
    const next = piece.rotation + 1;
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collides(piece, kick, 0, next)) {
        piece.rotation = next;
        piece.x += kick;
        draw();
        return;
      }
    }
  }

  function drawCell(x, y, color) {
    const pad = 1.5;
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL + pad, y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x * CELL + pad, y * CELL + pad, CELL - pad * 2, 3);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a2421";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(COLS * CELL, y * CELL);
      ctx.stroke();
    }

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const type = board[y][x];
        if (type) drawCell(x, y, COLORS[type]);
      }
    }

    if (piece) {
      const matrix = matrixOf(piece);
      for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
          if (!matrix[y][x]) continue;
          const nx = piece.x + x;
          const ny = piece.y + y;
          if (ny >= 0) drawCell(nx, ny, COLORS[piece.type]);
        }
      }
    }
  }

  function setOverlay(text, show) {
    overlayText.textContent = text;
    overlay.classList.toggle("is-hidden", !show);
  }

  function loop(timestamp) {
    if (!running) return;
    if (!paused && !gameOver && timestamp - lastDrop >= dropMs) {
      drop(false);
      lastDrop = timestamp;
    }
    rafId = requestAnimationFrame(loop);
  }

  function startGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    dropMs = 700;
    gameOver = false;
    paused = false;
    running = true;
    scoreEl.textContent = "0";
    linesEl.textContent = "0";
    startBtn.textContent = "重开";
    pauseBtn.disabled = false;
    pauseBtn.textContent = "暂停";
    setOverlay("", false);
    spawn();
    draw();
    lastDrop = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!running || gameOver) return;
    paused = !paused;
    pauseBtn.textContent = paused ? "继续" : "暂停";
    setOverlay(paused ? "已暂停" : "", paused);
    if (!paused) {
      lastDrop = performance.now();
    }
  }

  function endGame() {
    gameOver = true;
    running = false;
    paused = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = "暂停";
    setOverlay("游戏结束", true);
    cancelAnimationFrame(rafId);
    draw();
  }

  toggle.addEventListener("click", () => {
    const collapsed = widget.classList.toggle("is-collapsed");
    toggle.setAttribute("aria-expanded", String(!collapsed));
  });

  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", togglePause);

  document.querySelector(".tetris-controls").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-tetris]");
    if (!btn) return;
    const action = btn.dataset.tetris;
    if (action === "left") move(-1);
    if (action === "right") move(1);
    if (action === "down") drop(true);
    if (action === "rotate") rotate();
    if (action === "drop") hardDrop();
  });

  document.addEventListener("keydown", (event) => {
    if (widget.classList.contains("is-collapsed")) return;
    const isControlKey = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key);
    if (!running || (!isControlKey && event.key !== "p" && event.key !== "P")) return;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        move(-1);
        break;
      case "ArrowRight":
        event.preventDefault();
        move(1);
        break;
      case "ArrowDown":
        event.preventDefault();
        drop(true);
        break;
      case "ArrowUp":
        event.preventDefault();
        rotate();
        break;
      case " ":
        event.preventDefault();
        hardDrop();
        break;
      case "p":
      case "P":
        togglePause();
        break;
      default:
        break;
    }
  });

  draw();
  setOverlay("准备好了？", true);
})();
