/**
 * Main Portfolio Controller
 * Handles navigation between portfolio and games
 */

class PortfolioController {
    constructor() {
        this.currentGame = null;
        this.gameInstances = {};
        this.audioManager = new AudioManager();
        
        this.initializePortfolio();
        this.setupEventListeners();
        this.initializeGamePreviews();
    }

    initializePortfolio() {
        // Initialize game instances
        this.gameInstances = {
            match3: new Match3Game(),
            brickBreaker: new BrickBreakerGame(),
            towerDefense: new TowerDefenseGame(),
            memoryCard: new MemoryCardGame()
        };

        // Hide game container initially
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.classList.add('hidden');
        }
    }

    setupEventListeners() {
        // Portfolio game selection
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const gameName = btn.getAttribute('data-game');
                this.startGame(gameName);
            });
        });

        // Game container controls - add safety checks
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.returnToPortfolio();
            });
        }

        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.toggleSound();
            });
        }

        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }

        // Game UI controls - add safety checks
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartCurrentGame();
            });
        }

        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.returnToPortfolio();
            });
        }

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.resumeGame();
            });
        }

        const restartPauseBtn = document.getElementById('restart-pause-btn');
        if (restartPauseBtn) {
            restartPauseBtn.addEventListener('click', () => {
                this.restartCurrentGame();
            });
        }

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                this.returnToPortfolio();
            });
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // Prevent context menu on canvas
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'CANVAS') {
                e.preventDefault();
            }
        });
    }

    initializeGamePreviews() {
        // Create animated previews for each game
        const previewCanvases = document.querySelectorAll('[id$="-preview"]');
        
        previewCanvases.forEach(canvas => {
            const gameName = canvas.id.split('-')[0];
            if (this.gameInstances[gameName]) {
                this.gameInstances[gameName].renderPreview(canvas);
            }
        });
    }

    startGame(gameName) {
        if (!this.gameInstances[gameName]) {
            console.error(`Game ${gameName} not found`);
            return;
        }

        this.showLoadingScreen();
        
        // Simulate loading time
        setTimeout(() => {
            this.currentGame = gameName;
            this.showGameContainer();
            this.initializeCurrentGame();
            this.hideLoadingScreen();
        }, 1000);
    }

    showGameContainer() {
        const portfolio = document.getElementById('portfolio');
        const gameContainer = document.getElementById('game-container');
        const gameTitle = document.getElementById('current-game-title');
        const instructionsText = document.getElementById('instructions-text');
        
        if (portfolio) portfolio.classList.add('hidden');
        if (gameContainer) gameContainer.classList.remove('hidden');
        
        // Update game title
        const gameInstance = this.gameInstances[this.currentGame];
        if (gameTitle) gameTitle.textContent = gameInstance.title;
        
        // Update instructions
        if (instructionsText) instructionsText.innerHTML = gameInstance.instructions;
    }

    initializeCurrentGame() {
        const canvas = document.getElementById('game-canvas');
        const gameInstance = this.gameInstances[this.currentGame];
        
        // Initialize the game
        gameInstance.initialize(canvas);
        gameInstance.start();
        
        // Setup game event listeners
        this.setupGameEventListeners();
    }

    setupGameEventListeners() {
        const gameInstance = this.gameInstances[this.currentGame];
        
        // Listen for game events
        gameInstance.on('scoreUpdate', (data) => {
            this.updateUI(data);
        });

        gameInstance.on('gameOver', (data) => {
            this.showGameOver(data);
        });

        gameInstance.on('levelComplete', (data) => {
            this.showLevelComplete(data);
        });

        gameInstance.on('pause', () => {
            this.showPauseMenu();
        });
    }

    returnToPortfolio() {
        if (this.currentGame && this.gameInstances[this.currentGame]) {
            this.gameInstances[this.currentGame].cleanup();
        }
        
        this.hideGameStatus();
        this.hidePauseMenu();
        
        const gameContainer = document.getElementById('game-container');
        const portfolio = document.getElementById('portfolio');
        
        if (gameContainer) gameContainer.classList.add('hidden');
        if (portfolio) portfolio.classList.remove('hidden');
        
        this.currentGame = null;
    }

    restartCurrentGame() {
        if (this.currentGame && this.gameInstances[this.currentGame]) {
            this.hideGameStatus();
            this.hidePauseMenu();
            this.gameInstances[this.currentGame].restart();
        }
    }

    resumeGame() {
        if (this.currentGame && this.gameInstances[this.currentGame]) {
            this.hidePauseMenu();
            this.gameInstances[this.currentGame].resume();
        }
    }

    toggleSound() {
        this.audioManager.toggleMute();
        const soundBtn = document.getElementById('sound-toggle');
        if (!soundBtn) return;
        
        const icon = soundBtn.querySelector('i');
        if (!icon) return;
        
        if (this.audioManager.isMuted) {
            icon.className = 'fas fa-volume-mute';
            soundBtn.title = 'Unmute';
        } else {
            icon.className = 'fas fa-volume-up';
            soundBtn.title = 'Mute';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    handleKeyDown(e) {
        if (!this.currentGame) return;

        const gameStatus = document.getElementById('game-status');
        const pauseMenu = document.getElementById('pause-menu');

        switch(e.key) {
            case 'Escape':
                if (gameStatus && pauseMenu) {
                    if (gameStatus.classList.contains('hidden') && 
                        !pauseMenu.classList.contains('hidden')) {
                        this.resumeGame();
                    } else if (pauseMenu.classList.contains('hidden')) {
                        this.pauseGame();
                    }
                }
                break;
            case ' ':
                if (e.target.tagName !== 'BUTTON') {
                    e.preventDefault();
                }
                break;
        }

        // Pass key events to current game
        if (this.gameInstances[this.currentGame]) {
            this.gameInstances[this.currentGame].handleKeyDown(e);
        }
    }

    pauseGame() {
        if (this.currentGame && this.gameInstances[this.currentGame]) {
            this.gameInstances[this.currentGame].pause();
            this.showPauseMenu();
        }
    }

    updateUI(data) {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const livesEl = document.getElementById('lives');
        
        if (scoreEl) scoreEl.textContent = data.score || 0;
        if (levelEl) levelEl.textContent = data.level || 1;
        if (livesEl) livesEl.textContent = data.lives || 0;
    }

    showGameOver(data) {
        const statusTitle = document.getElementById('status-title');
        const statusMessage = document.getElementById('status-message');
        const gameStatus = document.getElementById('game-status');
        
        if (statusTitle) statusTitle.textContent = 'Game Over';
        if (statusMessage) statusMessage.textContent = `Final Score: ${data.score || 0}`;
        if (gameStatus) gameStatus.classList.remove('hidden');
        
        // Save high score
        this.saveHighScore(data.score || 0);
    }

    showLevelComplete(data) {
        const statusTitle = document.getElementById('status-title');
        const statusMessage = document.getElementById('status-message');
        const gameStatus = document.getElementById('game-status');
        
        if (statusTitle) statusTitle.textContent = 'Level Complete!';
        if (statusMessage) statusMessage.textContent = `Score: ${data.score || 0} | Next Level: ${data.nextLevel || 1}`;
        if (gameStatus) gameStatus.classList.remove('hidden');
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.hideGameStatus();
        }, 2000);
    }

    showPauseMenu() {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.classList.remove('hidden');
    }

    hidePauseMenu() {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.classList.add('hidden');
    }

    hideGameStatus() {
        const gameStatus = document.getElementById('game-status');
        if (gameStatus) gameStatus.classList.add('hidden');
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.classList.remove('hidden');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.classList.add('hidden');
    }

    saveHighScore(score) {
        const gameName = this.currentGame;
        const highScores = JSON.parse(localStorage.getItem('gameHighScores') || '{}');
        
        if (!highScores[gameName] || score > highScores[gameName]) {
            highScores[gameName] = score;
            localStorage.setItem('gameHighScores', JSON.stringify(highScores));
        }
    }

    getHighScore(gameName) {
        const highScores = JSON.parse(localStorage.getItem('gameHighScores') || '{}');
        return highScores[gameName] || 0;
    }
}

// Initialize the portfolio when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const portfolio = new PortfolioController();
    
    // Make it globally accessible for debugging
    window.portfolio = portfolio;
});
