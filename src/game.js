let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let isPlaying = false;
let gameStarted = false;

let fps = 15;
let time = 0; // Current time (in frames)

let boxSize = 20; // Size of each box in the grid

// * Snake data
let snakePositions = [];
let snakeLength = 0;
let currentDirection = "right";

// * Apple data
let applePosition = {};

// * Images
let gameOverImage = new Image(480, 360);
gameOverImage.src = "img/mgs-game-over.png";

// * Audio
let coinAudio = new Audio("sound/retro-game-coin.mp3");
let gameOverAudio = new Audio("sound/snake-game-over.mp3");

drawGame(); // Start drawing!

// ===== Drawing functions =====================================================

// Set the canvas back to the default background
function resetCanvas() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the box grid
    ctx.fillStyle = "#0F0F0F";
    for (let i = 0; i < canvas.width; i += boxSize) {
        ctx.fillRect(i, 0, 1, canvas.height);
    }
    for (let i = 0; i < canvas.height; i += boxSize) {
        ctx.fillRect(0, i, canvas.width, 1);
    }
}

// Draw a play button (triangle pointing right) on the center of the canvas
function drawPlayButton() {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2 - 10);
    ctx.lineTo(canvas.width / 2 - 10, canvas.height / 2 + 10);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 8, canvas.height / 2 - 8);
    ctx.lineTo(canvas.width / 2 - 8, canvas.height / 2 + 8);
    ctx.lineTo(canvas.width / 2 + 8, canvas.height / 2);
    ctx.fill();
}

// Draw the snake
function drawSnake() {
    ctx.fillStyle = "green";
    for (let i = 0; i < snakePositions.length; i++) {
        ctx.fillRect(
            snakePositions[i].x + 1,
            snakePositions[i].y + 1,
            boxSize - 1,
            boxSize - 1
        );
    }
}

// Draw the apple
function drawApple() {
    ctx.fillStyle = "red";
    ctx.fillRect(applePosition.x, applePosition.y, boxSize, boxSize);
}

// Draw "Game Over!" above the center of the canvas
function drawGameOver() {
    gameOverAudio.play();

    // Draw the game over image
    ctx.drawImage(
        gameOverImage,
        canvas.width / 2 - gameOverImage.width / 2,
        canvas.height / 2 - gameOverImage.height / 2 - 80
    );

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "20px Roboto";
    ctx.fillText(
        "Score: " + (snakeLength - 1),
        canvas.width / 2,
        canvas.height / 2 + 50
    );

    ctx.font = "15px Roboto";
    ctx.fillText("Play again?", canvas.width / 2, canvas.height / 2 + 75);
}

// ===== Game logic ============================================================

function startGame() {
    if (!isPlaying) return;
    if (gameStarted) return;

    // Set initial direction
    currentDirection = "right";

    // Pick a random position within the left half of the screen for the snake
    let x = Math.floor(Math.random() * canvas.width * 0.5);
    let y = Math.floor(Math.random() * canvas.height);
    // Get the corresponding box coordinates
    x -= x % boxSize;
    y -= y % boxSize;
    snakePositions = [{ x: x, y: y }];
    snakeLength = 1;

    // Pick a random position for the apple
    while (x === snakePositions[0].x && y === snakePositions[0].y) {
        x = Math.floor(Math.random() * canvas.width);
        y = Math.floor(Math.random() * canvas.height);
        x -= x % boxSize;
        y -= y % boxSize;
    }
    applePosition = { x: x, y: y };
}

function checkSnakeCollision() {
    // Check if the snake is out of bounds
    if (
        snakePositions[0].x < 0 ||
        snakePositions[0].x >= canvas.width ||
        snakePositions[0].y < 0 ||
        snakePositions[0].y >= canvas.height
    ) {
        return true;
    }

    // Check if the snake is colliding with itself
    for (let i = 1; i < snakePositions.length; i++) {
        if (
            snakePositions[0].x === snakePositions[i].x &&
            snakePositions[0].y === snakePositions[i].y
        ) {
            return true;
        }
    }

    return false;
}

function checkAppleCollision() {
    if (
        snakePositions[0].x === applePosition.x &&
        snakePositions[0].y === applePosition.y
    ) {
        return true;
    }

    return false;
}

function moveSnake() {
    // Move the snake
    let x = snakePositions[0].x;
    let y = snakePositions[0].y;
    if (currentDirection === "up") y -= boxSize;
    if (currentDirection === "left") x -= boxSize;
    if (currentDirection === "down") y += boxSize;
    if (currentDirection === "right") x += boxSize;
    snakePositions.unshift({ x: x, y: y });

    // If the snake is longer than it should be, remove the last element
    if (snakePositions.length > snakeLength) {
        snakePositions.pop();
    }
}

function pointCollidingWithSnake(position) {
    for (let i = 0; i < snakePositions.length; i++) {
        if (
            snakePositions[i].x === position.x &&
            snakePositions[i].y === position.y
        ) {
            return true;
        }
    }
    return false;
}

function dropNewApple() {
    let appleColliding = true;
    let x, y;
    while (appleColliding) {
        // Pick a random position for the apple
        x = Math.floor(Math.random() * (canvas.width - boxSize) + boxSize);
        y = Math.floor(Math.random() * (canvas.height - boxSize) + boxSize);
        x -= x % boxSize;
        y -= y % boxSize;

        // Check if the apple is colliding with the snake
        let point = { x: x, y: y };
        appleColliding = pointCollidingWithSnake(point);
    }
    applePosition = { x: x, y: y };
}

// ===== Event handlers ========================================================

document.addEventListener("keydown", function (e) {
    // Spacebar pauses or plays the game
    if (e.code === "Space") playPause();

    // WASD or arrow keys change the direction of the snake
    if (e.code === "KeyW" || e.code === "ArrowUp") currentDirection = "up";
    if (e.code === "KeyA" || e.code === "ArrowLeft") currentDirection = "left";
    if (e.code === "KeyS" || e.code === "ArrowDown") currentDirection = "down";
    if (e.code === "KeyD" || e.code === "ArrowRight")
        currentDirection = "right";
});

// ===== Driver code ===========================================================

function drawCall() {
    resetCanvas();

    // If the game hasn't started, start it
    if (!gameStarted) {
        startGame();
        gameStarted = true;
    }

    // Draw the snake
    drawSnake();
    // Draw the apple
    drawApple();

    // If the snake collides, stop the game
    if (checkSnakeCollision()) {
        isPlaying = false; // Pause the game
        gameStarted = false; // Reset the game
        drawGameOver();
    }

    // If the snake eats the apple, increment its length
    if (checkAppleCollision()) {
        snakeLength += 1;
        // Play the coin sound effect
        coinAudio.play();
        // Make a new apple
        dropNewApple();
    }

    // Move the snake
    moveSnake();

    // Increment the time
    time += 1;
}

function drawGame() {
    resetCanvas();

    // Start the draw loop
    setTimeout(function aDrawCall() {
        if (isPlaying) {
            drawCall();
        } else {
            drawPlayButton();
        }

        setTimeout(aDrawCall, 1000 / fps);
    }, 1000 / fps);
}

function playPause() {
    isPlaying = !isPlaying;
}
