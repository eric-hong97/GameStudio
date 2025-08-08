/**
 * Match-3 Puzzle Game
 * Similar to classic Flash puzzle games
 */

class Match3Game extends GameEngine {
    constructor() {
        super('Crystal Match', `
            Click to select a gem, then click an adjacent gem to swap them.
            Match 3 or more gems of the same color to score points.
            Create combos for bonus points!
            <br><br>
            <strong>Controls:</strong><br>
            • Click: Select/Swap gems<br>
            • ESC: Pause game
        `);
        
        this.gridWidth = 8;
        this.gridHeight = 8;
        this.gemSize = 60;
        this.gemColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        this.grid = [];
        this.selectedGem = null;
        this.isSwapping = false;
        this.isMatching = false;
        this.matches = [];
        this.combo = 0;
        this.animations = [];
        this.gravity = [];
        this.newGems = [];
        this.targetScore = 1000;
    }

    setup() {
        this.initializeGrid();
        this.calculateGridOffset();
        this.audioManager.startBackgroundMusic(80);
    }

    calculateGridOffset() {
        this.offsetX = (this.canvas.width - (this.gridWidth * this.gemSize)) / 2;
        this.offsetY = (this.canvas.height - (this.gridHeight * this.gemSize)) / 2;
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                let color;
                do {
                    color = this.gemColors[Math.floor(Math.random() * this.gemColors.length)];
                } while (this.wouldCreateMatch(row, col, color));
                
                this.grid[row][col] = {
                    color: color,
                    x: col * this.gemSize,
                    y: row * this.gemSize,
                    scale: 1,
                    alpha: 1,
                    falling: false,
                    fallSpeed: 0
                };
            }
        }
    }

    wouldCreateMatch(row, col, color) {
        // Check horizontal
        let horizontalCount = 1;
        // Check left
        for (let c = col - 1; c >= 0; c--) {
            if (this.grid[row] && this.grid[row][c] && this.grid[row][c].color === color) {
                horizontalCount++;
            } else {
                break;
            }
        }
        // Check right
        for (let c = col + 1; c < this.gridWidth; c++) {
            if (this.grid[row] && this.grid[row][c] && this.grid[row][c].color === color) {
                horizontalCount++;
            } else {
                break;
            }
        }

        // Check vertical
        let verticalCount = 1;
        // Check up
        for (let r = row - 1; r >= 0; r--) {
            if (this.grid[r] && this.grid[r][col] && this.grid[r][col].color === color) {
                verticalCount++;
            } else {
                break;
            }
        }
        // Check down
        for (let r = row + 1; r < this.gridHeight; r++) {
            if (this.grid[r] && this.grid[r][col] && this.grid[r][col].color === color) {
                verticalCount++;
            } else {
                break;
            }
        }

        return horizontalCount >= 3 || verticalCount >= 3;
    }

    handleClick(mouse) {
        if (this.isSwapping || this.isMatching) return;

        const col = Math.floor((mouse.x - this.offsetX) / this.gemSize);
        const row = Math.floor((mouse.y - this.offsetY) / this.gemSize);

        if (col < 0 || col >= this.gridWidth || row < 0 || row >= this.gridHeight) {
            this.selectedGem = null;
            return;
        }

        if (this.selectedGem === null) {
            // Select gem
            this.selectedGem = { row, col };
            this.grid[row][col].scale = 1.1;
            this.audioManager.playSound('click');
        } else {
            // Try to swap
            const selectedRow = this.selectedGem.row;
            const selectedCol = this.selectedGem.col;
            
            // Reset previous selection scale
            this.grid[selectedRow][selectedCol].scale = 1;

            if (this.areAdjacent(selectedRow, selectedCol, row, col)) {
                this.swapGems(selectedRow, selectedCol, row, col);
            } else {
                // Select new gem
                this.selectedGem = { row, col };
                this.grid[row][col].scale = 1.1;
            }
        }
    }

    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapGems(row1, col1, row2, col2) {
        this.isSwapping = true;
        
        // Temporarily swap for match checking
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;

        // Check if swap creates matches
        const hasMatches = this.findMatches().length > 0;

        if (hasMatches) {
            // Valid swap - play match sound and process matches
            this.audioManager.playSound('match');
            this.selectedGem = null;
            this.processMatches();
        } else {
            // Invalid swap - revert
            const temp2 = this.grid[row1][col1];
            this.grid[row1][col1] = this.grid[row2][col2];
            this.grid[row2][col2] = temp2;
            this.selectedGem = null;
        }
        
        this.isSwapping = false;
    }

    findMatches() {
        const matches = [];
        
        // Check horizontal matches
        for (let row = 0; row < this.gridHeight; row++) {
            let currentMatch = [{ row, col: 0 }];
            for (let col = 1; col < this.gridWidth; col++) {
                if (this.grid[row][col].color === this.grid[row][col - 1].color) {
                    currentMatch.push({ row, col });
                } else {
                    if (currentMatch.length >= 3) {
                        matches.push([...currentMatch]);
                    }
                    currentMatch = [{ row, col }];
                }
            }
            if (currentMatch.length >= 3) {
                matches.push([...currentMatch]);
            }
        }

        // Check vertical matches
        for (let col = 0; col < this.gridWidth; col++) {
            let currentMatch = [{ row: 0, col }];
            for (let row = 1; row < this.gridHeight; row++) {
                if (this.grid[row][col].color === this.grid[row - 1][col].color) {
                    currentMatch.push({ row, col });
                } else {
                    if (currentMatch.length >= 3) {
                        matches.push([...currentMatch]);
                    }
                    currentMatch = [{ row, col }];
                }
            }
            if (currentMatch.length >= 3) {
                matches.push([...currentMatch]);
            }
        }

        return matches;
    }

    processMatches() {
        this.isMatching = true;
        this.matches = this.findMatches();
        
        if (this.matches.length > 0) {
            this.combo++;
            
            // Calculate score
            let points = 0;
            this.matches.forEach(match => {
                points += match.length * 10 * this.combo;
                
                // Create particles for each matched gem
                match.forEach(gem => {
                    const x = this.offsetX + gem.col * this.gemSize + this.gemSize / 2;
                    const y = this.offsetY + gem.row * this.gemSize + this.gemSize / 2;
                    this.particleSystem.createStarBurst(x, y, this.grid[gem.row][gem.col].color);
                    
                    // Mark gem as matched (will be removed)
                    this.grid[gem.row][gem.col] = null;
                });
            });
            
            this.updateScore(points);
            
            // Show combo effect
            if (this.combo > 1) {
                this.showComboEffect();
            }
            
            // Apply gravity and spawn new gems
            setTimeout(() => {
                this.applyGravity();
                this.spawnNewGems();
                
                // Check for more matches after gravity
                setTimeout(() => {
                    const newMatches = this.findMatches();
                    if (newMatches.length > 0) {
                        this.processMatches();
                    } else {
                        this.combo = 0;
                        this.isMatching = false;
                        this.checkGameEnd();
                    }
                }, 300);
            }, 500);
            
        } else {
            this.combo = 0;
            this.isMatching = false;
        }
    }

    showComboEffect() {
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 4;
        
        this.particleSystem.createRainbow(x, y);
        
        // Create floating text effect
        this.animations.push({
            type: 'combo',
            x: x,
            y: y,
            text: `COMBO x${this.combo}!`,
            alpha: 1,
            scale: 0.5,
            life: 2
        });
    }

    applyGravity() {
        for (let col = 0; col < this.gridWidth; col++) {
            // Find empty spaces and move gems down
            let writeIndex = this.gridHeight - 1;
            for (let row = this.gridHeight - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (writeIndex !== row) {
                        this.grid[writeIndex][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                        
                        // Update gem position
                        this.grid[writeIndex][col].y = writeIndex * this.gemSize;
                    }
                    writeIndex--;
                }
            }
        }
    }

    spawnNewGems() {
        for (let col = 0; col < this.gridWidth; col++) {
            for (let row = 0; row < this.gridHeight; row++) {
                if (this.grid[row][col] === null) {
                    let color;
                    do {
                        color = this.gemColors[Math.floor(Math.random() * this.gemColors.length)];
                    } while (this.wouldCreateMatch(row, col, color));
                    
                    this.grid[row][col] = {
                        color: color,
                        x: col * this.gemSize,
                        y: row * this.gemSize,
                        scale: 0.1,
                        alpha: 0.8,
                        falling: true,
                        fallSpeed: 0
                    };
                    
                    // Animate gem appearance
                    this.animations.push({
                        type: 'spawn',
                        gem: this.grid[row][col],
                        targetScale: 1,
                        targetAlpha: 1,
                        duration: 300
                    });
                }
            }
        }
    }

    checkGameEnd() {
        if (this.score >= this.targetScore) {
            this.nextLevel();
            this.targetScore *= 1.5;
        }
        
        // Check if no more moves are possible
        if (!this.hasValidMoves()) {
            this.gameOver();
        }
    }

    hasValidMoves() {
        // Simple check - in a real implementation, this would be more sophisticated
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth - 1; col++) {
                // Try swapping horizontally
                const temp = this.grid[row][col];
                this.grid[row][col] = this.grid[row][col + 1];
                this.grid[row][col + 1] = temp;
                
                const hasMatch = this.findMatches().length > 0;
                
                // Revert swap
                this.grid[row][col + 1] = this.grid[row][col];
                this.grid[row][col] = temp;
                
                if (hasMatch) return true;
            }
        }
        
        for (let row = 0; row < this.gridHeight - 1; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                // Try swapping vertically
                const temp = this.grid[row][col];
                this.grid[row][col] = this.grid[row + 1][col];
                this.grid[row + 1][col] = temp;
                
                const hasMatch = this.findMatches().length > 0;
                
                // Revert swap
                this.grid[row + 1][col] = this.grid[row][col];
                this.grid[row][col] = temp;
                
                if (hasMatch) return true;
            }
        }
        
        return false;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update animations
        this.animations = this.animations.filter(anim => {
            switch (anim.type) {
                case 'spawn':
                    anim.gem.scale = this.lerp(anim.gem.scale, anim.targetScale, 0.1);
                    anim.gem.alpha = this.lerp(anim.gem.alpha, anim.targetAlpha, 0.1);
                    anim.duration -= deltaTime;
                    return anim.duration > 0;
                    
                case 'combo':
                    anim.life -= deltaTime / 1000;
                    anim.alpha = anim.life / 2;
                    anim.scale += deltaTime / 1000;
                    anim.y -= deltaTime / 20;
                    return anim.life > 0;
                    
                default:
                    return false;
            }
        });
    }

    render() {
        super.render();
        
        // Draw grid background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(this.offsetX, this.offsetY, 
            this.gridWidth * this.gemSize, this.gridHeight * this.gemSize);
        
        // Draw gems
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                if (this.grid[row][col]) {
                    this.drawGem(row, col);
                }
            }
        }
        
        // Draw selection highlight
        if (this.selectedGem && !this.isSwapping) {
            const { row, col } = this.selectedGem;
            const x = this.offsetX + col * this.gemSize;
            const y = this.offsetY + row * this.gemSize;
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.gemSize, this.gemSize);
        }
        
        // Draw animations
        this.animations.forEach(anim => {
            if (anim.type === 'combo') {
                this.ctx.save();
                this.ctx.globalAlpha = anim.alpha;
                this.ctx.font = `bold ${24 * anim.scale}px Arial`;
                this.ctx.fillStyle = '#ffd93d';
                this.ctx.textAlign = 'center';
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(anim.text, anim.x, anim.y);
                this.ctx.fillText(anim.text, anim.x, anim.y);
                this.ctx.restore();
            }
        });
        
        // Draw progress bar
        this.drawProgressBar();
    }

    drawGem(row, col) {
        const gem = this.grid[row][col];
        if (!gem) return;
        
        const x = this.offsetX + col * this.gemSize + this.gemSize / 2;
        const y = this.offsetY + row * this.gemSize + this.gemSize / 2;
        const radius = (this.gemSize / 2 - 5) * gem.scale;
        
        this.ctx.save();
        this.ctx.globalAlpha = gem.alpha;
        
        // Draw gem shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw gem
        const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
        gradient.addColorStop(0, this.lightenColor(gem.color, 40));
        gradient.addColorStop(0.7, gem.color);
        gradient.addColorStop(1, this.darkenColor(gem.color, 20));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw gem highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x - radius/4, y - radius/4, radius/3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawProgressBar() {
        const barWidth = this.canvas.width * 0.8;
        const barHeight = 20;
        const x = (this.canvas.width - barWidth) / 2;
        const y = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress
        const progress = Math.min(this.score / this.targetScore, 1);
        const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        // Text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.score} / ${this.targetScore}`, this.canvas.width / 2, y + 15);
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
        const gridSize = 4;
        const cellSize = canvas.width / gridSize;
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
        
        // Background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw gems
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                const radius = cellSize / 3;
                const color = colors[(row + col) % colors.length];
                
                // Gem
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(x - radius/4, y - radius/4, radius/3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Sparkle effect
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    reset() {
        super.reset();
        this.initializeGrid();
        this.selectedGem = null;
        this.isSwapping = false;
        this.isMatching = false;
        this.matches = [];
        this.combo = 0;
        this.animations = [];
        this.targetScore = 1000;
    }
}
