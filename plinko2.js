// Title: Plinko Board 
// Author: Jai Janse
// Version: 2.0
// Date: 3/07//24
// Game Info : To create a Plinko Board style game that allows balls to have gravity and freely fallthough the board
//and can make contact with pegs and get collected in a colletion system at the bottom called slots.

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
const GRAVITY = 0.35; // Increased for more lifelike gravity
const FRICTION = 0.75; // Slightly adjusted friction
const SLOT_BOUNCE_REDUCTION = 0.5; // Reduced sensitivity for slot collisions

// Utility function to generate random number within a range
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
        this.dy = 1.0; // Increased initial speed downward
        this.color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        this.caught = false;
    }

    // Update ball position and handle collisions
    update() {
        if (this.caught) return; // If ball is caught in a slot, do not update its position

        // Apply gravity
        this.dy += GRAVITY;

        // Number of substeps for better collision detection
        const substeps = 5;
        const stepX = this.dx / substeps;
        const stepY = this.dy / substeps;

        for (let i = 0; i < substeps; i++) {
            // Check collision with pegs
            for (let row = 0; row < NUM_ROWS; row++) {
                for (let col = 0; col < NUM_COLS; col++) {
                    const peg = pegs[row][col];
                    const dx = this.x - peg.x;
                    const dy = this.y - peg.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < this.radius + peg.radius) {
                        // Ball hits a peg, change direction randomly
                        const angle = Math.atan2(dy, dx);
                        const randAngle = angle + randomRange(-Math.PI / 4, Math.PI / 4);
                        this.dx = Math.cos(randAngle) * 2; // Adjusted for realistic bounce
                        this.dy = Math.sin(randAngle) * 2; // Adjusted for realistic bounce
                        break; // Only handle collision with one peg per frame
                    }
                }
            }

            // Update position
            this.x += stepX;
            this.y += stepY;

            // Check canvas boundaries and keep balls within canvas
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
                    }
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

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        ball.update();
    });
}

// Start animation
animate();
