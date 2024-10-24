// Title: Plinko Board 
// Author: Jai Janse
// Version: 2.0
// Date: 3/07/24
// Game Info : To create a Plinko Board style game that allows balls to have gravity and freely fall through the board
// and can make contact with pegs and get collected in a collection system at the bottom called slots.

// Constants
const BALL_RADIUS = 7;
const NUM_ROWS = 15; // Number of rows of pegs
const NUM_COLS = 8; // Number of pegs per row
const PEG_RADIUS = 4.5;
const PEG_SPACING_X = 45;
const PEG_SPACING_Y = 48;
const SLOT_WIDTH = 31.5; // Adjusted for proper slot width
const SLOT_HEIGHT = 50; // Adjusted for proper slot height
const SLOT_COUNT = 10; // Number of slots at the bottom

// Constants for gravity and other physics
const GRAVITY = 600; // Pixels per second squared for realistic gravity
const FRICTION = 0.75; // Friction coefficient for ball movement
const SLOT_BOUNCE_REDUCTION = 0.3; // Bounce reduction for slots
const BALL_INITIAL_DY = 0.2; // Initial downward speed for balls
const COLLISION_TOLERANCE = 1; // Lower tolerance for collision detection

// Utility function to generate a random number within a range
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

// Peg class
class Peg {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = PEG_RADIUS;
    }

    // Draw the peg on canvas
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();
    }
}

// Ball class
class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = BALL_RADIUS;
        this.dx = 0;
        this.dy = BALL_INITIAL_DY; // Initial speed downward
        this.color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        this.caught = false;
    }

    // Update ball position and handle collisions
    update(timeDelta) {
        if (this.caught) {
            return; // If ball is caught in a slot, do not update its position
        }

        // Apply gravity
        this.dy += GRAVITY * timeDelta; // Update vertical speed

        // Update position
        this.x += this.dx * timeDelta;
        this.y += this.dy * timeDelta;

        // Check collision with pegs
        for (let row = 0; row < NUM_ROWS; row++) {
            for (let col = 0; col < NUM_COLS; col++) {
                const peg = pegs[row][col];
                const dx = this.x - peg.x;
                const dy = this.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.radius + peg.radius + COLLISION_TOLERANCE) {
                    // Ball hits a peg
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
                    this.dx = speed * Math.cos(angle + Math.PI / 6); // Adjust for bounce
                    this.dy = speed * Math.sin(angle + Math.PI / 6); // Adjust for bounce
                    this.dy *= FRICTION; // Apply friction
                    this.x = peg.x + (this.radius + peg.radius + COLLISION_TOLERANCE) * Math.cos(angle);
                    this.y = peg.y + (this.radius + peg.radius + COLLISION_TOLERANCE) * Math.sin(angle);
                    break; // Only handle collision with one peg per frame
                }
            }
        }

        // Check canvas boundaries
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx *= -1; // Reverse direction
        }
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx *= -1; // Reverse direction
        }

        // Check if ball falls into a slot at the bottom
        if (this.y + this.radius > canvas.height - SLOT_HEIGHT) {
            const slotIndex = Math.floor(this.x / SLOT_WIDTH);
            if (slotIndex >= 0 && slotIndex < SLOT_COUNT) {
                const slot = slots[slotIndex];
                if (this.x >= slot.x && this.x <= slot.x + slot.width) {
                    // Collision with slot sides
                    if (this.x - this.radius < slot.x) {
                        this.x = slot.x + this.radius;
                        this.dx *= -SLOT_BOUNCE_REDUCTION;
                    } else if (this.x + this.radius > slot.x + slot.width) {
                        this.x = slot.x + slot.width - this.radius;
                        this.dx *= -SLOT_BOUNCE_REDUCTION;
                    } else if (this.y + this.radius > canvas.height - slot.height) {
                        // Collision with slot bottom
                        if (this.y + this.radius > canvas.height - this.radius) {
                            this.y = canvas.height - this.radius;
                            this.dy *= -SLOT_BOUNCE_REDUCTION;
                        }
                    }
                    this.caught = true; // Mark ball as caught
                }
            }
        }

        // Draw the ball
        this.draw();
    }

    // Draw the ball on canvas
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

// Initialize canvas and context
const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to desired dimensions
canvas.width = SLOT_WIDTH * SLOT_COUNT; // Adjust canvas width to fit all slots
canvas.height = 800;

// Initialize pegs array
let pegs = [];

// Create pegs
for (let row = 0; row < NUM_ROWS; row++) {
    pegs[row] = [];
    for (let col = 0; col < NUM_COLS; col++) {
        const x = col * PEG_SPACING_X + (row % 2 === 0 ? 0 : PEG_SPACING_X / 2);
        const y = row * PEG_SPACING_Y + PEG_SPACING_Y;
        pegs[row][col] = new Peg(x, y);
    }
}

// Initialize balls array
let balls = [];

// Function to drop balls
function dropBalls() {
    const numBalls = document.getElementById('numBalls').value;
    balls = []; // Clear existing balls
    const startY = BALL_RADIUS * 2;

    for (let i = 0; i < numBalls; i++) {
        const startX = randomRange(0, canvas.width);
        balls.push(new Ball(startX, startY));
    }
}

// Slot class to represent the three-sided boxes at the bottom
class Slot {
    constructor(x, width, height) {
        this.x = x;
        this.width = width;
        this.height = height;
    }

    // Draw the slot on canvas (left, right, and bottom only)
    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, canvas.height - this.height);
        ctx.lineTo(this.x, canvas.height);
        ctx.lineTo(this.x + this.width, canvas.height);
        ctx.lineTo(this.x + this.width, canvas.height - this.height);
        ctx.closePath();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }
}

// Create slots
const slots = [];
for (let i = 0; i < SLOT_COUNT; i++) {
    const x = i * SLOT_WIDTH;
    slots.push(new Slot(x, SLOT_WIDTH, SLOT_HEIGHT));
}

// Function to calculate and display FPS
function calculateFPS(deltaTime) {
    let FPS = 1 / deltaTime;
    document.getElementById('fpsValue').textContent = FPS.toFixed(1);
}

// Animation loop
let lastTime = 0;
function animate(timestamp) {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate time delta
    const timeDelta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Draw pegs
    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_COLS; col++) {
            pegs[row][col].draw();
        }
    }

    // Draw slots
    slots.forEach(slot => slot.draw());

    // Update and draw each ball
    balls.forEach(ball => {
        ball.update(timeDelta);
    });

    // Calculate and display FPS
    calculateFPS(timeDelta);
}

// Start animation
animate(0);

