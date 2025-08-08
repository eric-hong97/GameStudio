/**
 * Base Game Engine
 * Provides common functionality for all games
 */

class GameEngine {
    constructor(title, instructions) {
        this.title = title;
        this.instructions = instructions;
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.isPaused = false;
        this.animationFrame = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.targetFrameTime = 1000 / this.fps;
        
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        this.eventListeners = {};
        this.inputManager = new InputManager();
        this.particleSystem = new ParticleSystem();
        this.audioManager = new AudioManager();
        
        this.setupDefaultEventListeners();
    }

    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Setup event listeners
        this.setupInputEvents();
        
        // Initialize game-specific setup
        this.setup();
        
        console.log(`${this.title} initialized`);
    }

    resizeCanvas() {
        // Maintain aspect ratio
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        const targetWidth = Math.min(800, containerRect.width * 0.9);
        const targetHeight = Math.min(600, containerRect.height * 0.8);
        
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        this.canvas.style.width = targetWidth + 'px';
        this.canvas.style.height = targetHeight + 'px';
    }

    setupInputEvents() {
        this.inputManager.setup(this.canvas);
        
        // Mouse events
        this.inputManager.on('click', (e) => this.handleClick(e));
        this.inputManager.on('mousedown', (e) => this.handleMouseDown(e));
        this.inputManager.on('mouseup', (e) => this.handleMouseUp(e));
        this.inputManager.on('mousemove', (e) => this.handleMouseMove(e));
        
        // Touch events
        this.inputManager.on('touchstart', (e) => this.handleTouchStart(e));
        this.inputManager.on('touchend', (e) => this.handleTouchEnd(e));
        this.inputManager.on('touchmove', (e) => this.handleTouchMove(e));
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        this.gameLoop();
        this.emit('gameStart');
        console.log(`${this.title} started`);
    }

    pause() {
        this.isPaused = true;
        this.emit('pause');
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.emit('resume');
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.emit('gameEnd');
    }

    restart() {
        this.stop();
        this.reset();
        setTimeout(() => this.start(), 100);
        this.emit('restart');
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        
        if (this.deltaTime >= this.targetFrameTime) {
            if (!this.isPaused) {
                this.update(this.deltaTime);
                this.render();
            }
            this.lastTime = currentTime - (this.deltaTime % this.targetFrameTime);
        }

        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update particles
        this.particleSystem.update(deltaTime);
        
        // Override in child classes
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render particles
        this.particleSystem.render(this.ctx);
        
        // Override in child classes
    }

    setup() {
        // Override in child classes
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.particleSystem.clear();
        // Override in child classes
    }

    cleanup() {
        this.stop();
        this.inputManager.cleanup();
        this.particleSystem.clear();
        this.eventListeners = {};
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data = null) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    setupDefaultEventListeners() {
        // Setup default event listeners without causing recursion
        // The scoreUpdate event will be emitted directly by updateScore method
    }

    // Input handlers (override in child classes)
    handleClick(e) {}
    handleMouseDown(e) {}
    handleMouseUp(e) {}
    handleMouseMove(e) {}
    handleTouchStart(e) {}
    handleTouchEnd(e) {}
    handleTouchMove(e) {}
    handleKeyDown(e) {}

    // Utility methods
    updateScore(points) {
        this.score += points;
        this.emit('scoreUpdate', {
            score: this.score,
            level: this.level,
            lives: this.lives
        });
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.emit('lifeLost', { lives: this.lives });
        }
    }

    nextLevel() {
        this.level++;
        this.emit('levelComplete', {
            level: this.level,
            score: this.score,
            nextLevel: this.level
        });
    }

    gameOver() {
        this.stop();
        this.emit('gameOver', {
            score: this.score,
            level: this.level
        });
    }

    // Collision detection
    circleCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }

    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }

    // Animation helpers
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    // Rendering helpers
    drawCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }

    drawRoundedRect(x, y, width, height, radius, color) {
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, radius);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawText(text, x, y, font = '16px Arial', color = '#000', align = 'left') {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }

    // Preview rendering (for portfolio)
    renderPreview(canvas) {
        // Override in child classes
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#667eea';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, canvas.width/2, canvas.height/2);
    }
}

/**
 * Input Manager
 * Handles mouse, touch, and keyboard input
 */
class InputManager {
    constructor() {
        this.canvas = null;
        this.eventListeners = {};
        this.boundEvents = [];
        this.mouse = { x: 0, y: 0, isDown: false };
        this.touches = [];
    }

    setup(canvas) {
        this.canvas = canvas;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse events
        const mouseMove = (e) => this.handleMouseMove(e);
        const mouseDown = (e) => this.handleMouseDown(e);
        const mouseUp = (e) => this.handleMouseUp(e);
        const click = (e) => this.handleClick(e);

        this.canvas.addEventListener('mousemove', mouseMove);
        this.canvas.addEventListener('mousedown', mouseDown);
        this.canvas.addEventListener('mouseup', mouseUp);
        this.canvas.addEventListener('click', click);

        // Touch events
        const touchStart = (e) => this.handleTouchStart(e);
        const touchMove = (e) => this.handleTouchMove(e);
        const touchEnd = (e) => this.handleTouchEnd(e);

        this.canvas.addEventListener('touchstart', touchStart, { passive: false });
        this.canvas.addEventListener('touchmove', touchMove, { passive: false });
        this.canvas.addEventListener('touchend', touchEnd, { passive: false });

        // Store bound events for cleanup
        this.boundEvents = [
            { element: this.canvas, event: 'mousemove', handler: mouseMove },
            { element: this.canvas, event: 'mousedown', handler: mouseDown },
            { element: this.canvas, event: 'mouseup', handler: mouseUp },
            { element: this.canvas, event: 'click', handler: click },
            { element: this.canvas, event: 'touchstart', handler: touchStart },
            { element: this.canvas, event: 'touchmove', handler: touchMove },
            { element: this.canvas, event: 'touchend', handler: touchEnd }
        ];
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        this.emit('mousemove', this.mouse);
    }

    handleMouseDown(e) {
        this.mouse.isDown = true;
        this.emit('mousedown', this.mouse);
    }

    handleMouseUp(e) {
        this.mouse.isDown = false;
        this.emit('mouseup', this.mouse);
    }

    handleClick(e) {
        this.emit('click', this.mouse);
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.updateTouches(e);
        const touch = this.getMainTouch();
        if (touch) {
            this.emit('touchstart', touch);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.updateTouches(e);
        const touch = this.getMainTouch();
        if (touch) {
            this.emit('touchmove', touch);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.updateTouches(e);
        const touch = this.getMainTouch();
        this.emit('touchend', touch || { x: 0, y: 0 });
    }

    updateTouches(e) {
        this.touches = [];
        const rect = this.canvas.getBoundingClientRect();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            this.touches.push({
                x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
                y: (touch.clientY - rect.top) * (this.canvas.height / rect.height),
                id: touch.identifier
            });
        }
    }

    getMainTouch() {
        return this.touches.length > 0 ? this.touches[0] : null;
    }

    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    cleanup() {
        this.boundEvents.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.boundEvents = [];
        this.eventListeners = {};
    }
}
