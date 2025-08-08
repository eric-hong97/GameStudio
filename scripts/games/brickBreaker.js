/**
 * Brick Breaker Arcade Game
 * Fast-paced arcade game with physics and power-ups
 */

class BrickBreakerGame extends GameEngine {
    constructor() {
        super('Neon Breaker', `
            Use your paddle to bounce the ball and break all the bricks!
            Collect power-ups for special abilities and bonus points.
            Don't let the ball fall off the bottom!
            <br><br>
            <strong>Controls:</strong><br>
            • Mouse/Touch: Move paddle<br>
            • Space: Launch ball<br>
            • ESC: Pause game
        `);
        
        this.paddle = {
            x: 0,
            y: 0,
            width: 100,
            height: 20,
            speed: 8,
            color: '#667eea'
        };
        
        this.ball = {
            x: 0,
            y: 0,
            radius: 8,
            vx: 4,
            vy: -4,
            speed: 4,
            color: '#ff6b6b',
            launched: false,
            trail: []
        };
        
        this.bricks = [];
        this.powerups = [];
        this.brickColors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'];
        this.powerupTypes = [
            { type: 'multiball', color: '#ff6b6b', duration: 0 },
            { type: 'widepaddle', color: '#2ecc71', duration: 10000 },
            { type: 'slowball', color: '#3498db', duration: 8000 },
            { type: 'points', color: '#ffd93d', duration: 0 }
        ];
        
        this.activePowerups = [];
        this.balls = [];
        this.bricksRemaining = 0;
        this.currentMouseX = 0;
        this.ballSpeed = 4;
        this.originalPaddleWidth = 100;
    }

    setup() {
        this.setupLevel();
        this.resetBall();
        this.audioManager.startBackgroundMusic(120);
    }

    setupLevel() {
        this.bricks = [];
        const rows = 6 + Math.floor(this.level / 3);
        const cols = 10;
        const brickWidth = this.canvas.width / cols;
        const brickHeight = 25;
        const startY = 80;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Skip some bricks at higher levels for patterns
                if (this.level > 3 && Math.random() < 0.1) continue;
                
                const brick = {
                    x: col * brickWidth,
                    y: startY + row * (brickHeight + 5),
                    width: brickWidth - 2,
                    height: brickHeight,
                    color: this.brickColors[row % this.brickColors.length],
                    hits: Math.floor(this.level / 4) + 1,
                    maxHits: Math.floor(this.level / 4) + 1,
                    points: (row + 1) * 10,
                    powerup: Math.random() < 0.15 ? this.powerupTypes[Math.floor(Math.random() * this.powerupTypes.length)] : null
                };
                this.bricks.push(brick);
            }
        }
        
        this.bricksRemaining = this.bricks.length;
        
        // Position paddle
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        this.paddle.y = this.canvas.height - 40;
    }

    resetBall() {
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius - 5;
        this.ball.vx = (Math.random() - 0.5) * 6;
        this.ball.vy = -this.ballSpeed;
        this.ball.launched = false;
        this.ball.trail = [];
        this.balls = []; // Clear extra balls
    }

    handleMouseMove(mouse) {
        this.currentMouseX = mouse.x;
        if (!this.ball.launched) {
            this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, mouse.x - this.paddle.width / 2));
            this.ball.x = this.paddle.x + this.paddle.width / 2;
        } else {
            this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, mouse.x - this.paddle.width / 2));
        }
    }

    handleTouchMove(touch) {
        this.handleMouseMove(touch);
    }

    handleClick() {
        if (!this.ball.launched) {
            this.launchBall();
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space' && !this.ball.launched) {
            e.preventDefault();
            this.launchBall();
        }
    }

    launchBall() {
        this.ball.launched = true;
        this.ball.vx = (Math.random() - 0.5) * 6;
        this.ball.vy = -this.ballSpeed;
        this.audioManager.playSound('hit');
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.ball.launched) return;
        
        this.updateBall(this.ball, deltaTime);
        
        // Update extra balls
        this.balls = this.balls.filter(ball => {
            this.updateBall(ball, deltaTime);
            return ball.y < this.canvas.height + ball.radius;
        });
        
        // Update powerups
        this.updatePowerups(deltaTime);
        this.updateActivePowerups(deltaTime);
        
        // Check win condition
        if (this.bricksRemaining <= 0) {
            this.nextLevel();
            this.setupLevel();
            this.resetBall();
            this.ballSpeed += 0.5; // Increase difficulty
        }
        
        // Check game over
        if (!this.ball.launched || (this.ball.y > this.canvas.height && this.balls.length === 0)) {
            this.loseLife();
            if (this.lives > 0) {
                this.resetBall();
            }
        }
    }

    updateBall(ball, deltaTime) {
        // Update trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) {
            ball.trail.shift();
        }
        
        // Move ball
        ball.x += ball.vx * (deltaTime / 16);
        ball.y += ball.vy * (deltaTime / 16);
        
        // Wall collisions
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= this.canvas.width) {
            ball.vx = -ball.vx;
            ball.x = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.x));
            this.audioManager.playSound('bounce');
            this.particleSystem.createSparkles(ball.x, ball.y, '#fff', 5);
        }
        
        if (ball.y - ball.radius <= 0) {
            ball.vy = -ball.vy;
            ball.y = ball.radius;
            this.audioManager.playSound('bounce');
            this.particleSystem.createSparkles(ball.x, ball.y, '#fff', 5);
        }
        
        // Paddle collision
        if (this.circleRectCollision(ball, this.paddle) && ball.vy > 0) {
            ball.vy = -Math.abs(ball.vy);
            
            // Add spin based on where ball hits paddle
            const hitPos = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            ball.vx += hitPos * 2;
            
            // Limit ball speed
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed > 8) {
                ball.vx = (ball.vx / speed) * 8;
                ball.vy = (ball.vy / speed) * 8;
            }
            
            this.audioManager.playSound('bounce');
            this.particleSystem.createTrail(ball.x, ball.y, this.paddle.color, 8);
        }
        
        // Brick collisions
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const brick = this.bricks[i];
            if (this.circleRectCollision(ball, brick)) {
                this.hitBrick(brick, ball);
                this.bricks.splice(i, 1);
                this.bricksRemaining--;
                break; // Only hit one brick per frame
            }
        }
        
        // Powerup collisions
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (this.circleRectCollision(ball, powerup)) {
                this.collectPowerup(powerup);
                this.powerups.splice(i, 1);
            }
        }
    }

    hitBrick(brick, ball) {
        brick.hits--;
        
        if (brick.hits <= 0) {
            // Brick destroyed
            this.updateScore(brick.points * this.level);
            this.audioManager.playSound('explosion');
            this.particleSystem.createExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 15);
            
            // Drop powerup if brick had one
            if (brick.powerup) {
                this.dropPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.powerup);
            }
        } else {
            // Brick damaged
            this.audioManager.playSound('hit');
            this.particleSystem.createSparkles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 8);
        }
        
        // Determine collision side and bounce ball
        const ballCenterX = ball.x;
        const ballCenterY = ball.y;
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;
        
        const dx = ballCenterX - brickCenterX;
        const dy = ballCenterY - brickCenterY;
        
        if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
            ball.vx = -ball.vx;
        } else {
            ball.vy = -ball.vy;
        }
    }

    dropPowerup(x, y, powerupType) {
        this.powerups.push({
            x: x - 15,
            y: y,
            width: 30,
            height: 30,
            vy: 2,
            type: powerupType.type,
            color: powerupType.color,
            rotation: 0,
            rotationSpeed: 0.1
        });
    }

    collectPowerup(powerup) {
        this.audioManager.playSound('powerup');
        this.particleSystem.createStarBurst(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, powerup.color, 20);
        
        switch (powerup.type) {
            case 'multiball':
                this.createMultiBall();
                break;
            case 'widepaddle':
                this.activateWidePaddle();
                break;
            case 'slowball':
                this.activateSlowBall();
                break;
            case 'points':
                this.updateScore(500);
                break;
        }
    }

    createMultiBall() {
        for (let i = 0; i < 2; i++) {
            const newBall = {
                x: this.ball.x,
                y: this.ball.y,
                radius: this.ball.radius,
                vx: (Math.random() - 0.5) * 8,
                vy: this.ball.vy,
                color: this.ball.color,
                trail: []
            };
            this.balls.push(newBall);
        }
    }

    activateWidePaddle() {
        this.paddle.width = this.originalPaddleWidth * 1.5;
        this.activePowerups.push({
            type: 'widepaddle',
            timeLeft: 10000
        });
    }

    activateSlowBall() {
        this.ball.vx *= 0.5;
        this.ball.vy *= 0.5;
        this.balls.forEach(ball => {
            ball.vx *= 0.5;
            ball.vy *= 0.5;
        });
        
        this.activePowerups.push({
            type: 'slowball',
            timeLeft: 8000
        });
    }

    updatePowerups(deltaTime) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.y += powerup.vy * (deltaTime / 16);
            powerup.rotation += powerup.rotationSpeed * (deltaTime / 16);
            
            // Remove if off screen
            if (powerup.y > this.canvas.height) {
                this.powerups.splice(i, 1);
            }
        }
    }

    updateActivePowerups(deltaTime) {
        for (let i = this.activePowerups.length - 1; i >= 0; i--) {
            const powerup = this.activePowerups[i];
            powerup.timeLeft -= deltaTime;
            
            if (powerup.timeLeft <= 0) {
                switch (powerup.type) {
                    case 'widepaddle':
                        this.paddle.width = this.originalPaddleWidth;
                        break;
                    case 'slowball':
                        // Speed will naturally return to normal with new balls
                        break;
                }
                this.activePowerups.splice(i, 1);
            }
        }
    }

    circleRectCollision(circle, rect) {
        const distX = Math.abs(circle.x - rect.x - rect.width / 2);
        const distY = Math.abs(circle.y - rect.y - rect.height / 2);

        if (distX > (rect.width / 2 + circle.radius)) return false;
        if (distY > (rect.height / 2 + circle.radius)) return false;

        if (distX <= (rect.width / 2)) return true;
        if (distY <= (rect.height / 2)) return true;

        const dx = distX - rect.width / 2;
        const dy = distY - rect.height / 2;
        return (dx * dx + dy * dy <= (circle.radius * circle.radius));
    }

    render() {
        super.render();
        
        // Draw background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f0f1a');
        gradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bricks
        this.bricks.forEach(brick => this.drawBrick(brick));
        
        // Draw paddle
        this.drawPaddle();
        
        // Draw ball
        this.drawBall(this.ball);
        
        // Draw extra balls
        this.balls.forEach(ball => this.drawBall(ball));
        
        // Draw powerups
        this.powerups.forEach(powerup => this.drawPowerup(powerup));
        
        // Draw UI
        this.drawUI();
    }

    drawBrick(brick) {
        // Brick opacity based on hits
        const alpha = brick.hits / brick.maxHits;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Brick gradient
        const gradient = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        gradient.addColorStop(0, this.lightenColor(brick.color, 30));
        gradient.addColorStop(1, brick.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Brick border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        
        // Hit indicator
        if (brick.hits < brick.maxHits) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
        }
        
        this.ctx.restore();
    }

    drawPaddle() {
        // Paddle gradient
        const gradient = this.ctx.createLinearGradient(this.paddle.x, this.paddle.y, this.paddle.x, this.paddle.y + this.paddle.height);
        gradient.addColorStop(0, this.lightenColor(this.paddle.color, 40));
        gradient.addColorStop(1, this.paddle.color);
        
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 10, gradient);
        
        // Paddle highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.drawRoundedRect(this.paddle.x + 2, this.paddle.y + 2, this.paddle.width - 4, 6, 3, 'rgba(255, 255, 255, 0.3)');
    }

    drawBall(ball) {
        // Draw trail
        ball.trail.forEach((pos, index) => {
            const alpha = (index + 1) / ball.trail.length * 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.drawCircle(pos.x, pos.y, ball.radius * alpha, ball.color);
            this.ctx.restore();
        });
        
        // Ball gradient
        const gradient = this.ctx.createRadialGradient(
            ball.x - ball.radius/3, ball.y - ball.radius/3, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, this.lightenColor(ball.color, 60));
        gradient.addColorStop(0.7, ball.color);
        gradient.addColorStop(1, this.darkenColor(ball.color, 20));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x - ball.radius/3, ball.y - ball.radius/3, ball.radius/3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPowerup(powerup) {
        this.ctx.save();
        this.ctx.translate(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2);
        this.ctx.rotate(powerup.rotation);
        
        // Powerup glow
        const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, powerup.width);
        glowGradient.addColorStop(0, powerup.color);
        glowGradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(-powerup.width, -powerup.height, powerup.width * 2, powerup.height * 2);
        
        // Powerup shape
        this.ctx.fillStyle = powerup.color;
        this.ctx.fillRect(-powerup.width / 2, -powerup.height / 2, powerup.width, powerup.height);
        
        // Powerup symbol
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        let symbol = '?';
        switch (powerup.type) {
            case 'multiball': symbol = '●●'; break;
            case 'widepaddle': symbol = '═'; break;
            case 'slowball': symbol = '⏰'; break;
            case 'points': symbol = '★'; break;
        }
        this.ctx.fillText(symbol, 0, 6);
        
        this.ctx.restore();
    }

    drawUI() {
        // Draw level indicator
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level ${this.level}`, 20, 30);
        this.ctx.fillText(`Bricks: ${this.bricksRemaining}`, 20, 50);
        
        // Draw active powerups
        let powerupY = 70;
        this.activePowerups.forEach(powerup => {
            const timeLeft = Math.ceil(powerup.timeLeft / 1000);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${powerup.type}: ${timeLeft}s`, 20, powerupY);
            powerupY += 20;
        });
        
        // Launch instruction
        if (!this.ball.launched) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLICK OR PRESS SPACE TO LAUNCH', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }

    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `rgb(${r}, ${g}, ${b})`;
    }

    renderPreview(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f0f1a');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw sample bricks
        const brickWidth = canvas.width / 5;
        const brickHeight = 15;
        const colors = ['#e74c3c', '#f39c12', '#2ecc71'];
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 5; col++) {
                const x = col * brickWidth;
                const y = 30 + row * (brickHeight + 3);
                ctx.fillStyle = colors[row];
                ctx.fillRect(x, y, brickWidth - 2, brickHeight);
            }
        }
        
        // Draw paddle
        const paddleWidth = canvas.width / 4;
        const paddleHeight = 8;
        const paddleX = (canvas.width - paddleWidth) / 2;
        const paddleY = canvas.height - 20;
        
        ctx.fillStyle = '#667eea';
        ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
        
        // Draw ball
        const ballRadius = 4;
        const ballX = canvas.width / 2;
        const ballY = paddleY - ballRadius - 5;
        
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some sparkles
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    reset() {
        super.reset();
        this.setupLevel();
        this.resetBall();
        this.powerups = [];
        this.activePowerups = [];
        this.balls = [];
        this.ballSpeed = 4;
        this.paddle.width = this.originalPaddleWidth;
    }
}
