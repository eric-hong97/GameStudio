/**
 * Memory Card Game
 * Card matching game with smooth animations
 */

class MemoryCardGame extends GameEngine {
    constructor() {
        super('Memory Master', `
            Find matching pairs by clicking on cards to flip them over.
            Remember the positions and match all pairs to advance!
            Complete levels faster for bonus points.
            <br><br>
            <strong>Controls:</strong><br>
            • Click: Flip card<br>
            • ESC: Pause game
        `);
        
        this.gridWidth = 4;
        this.gridHeight = 4;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.cardWidth = 80;
        this.cardHeight = 100;
        this.cardSpacing = 10;
        this.flipAnimation = {};
        this.matchAnimation = {};
        this.gameStartTime = 0;
        this.moveCount = 0;
        this.showingCards = false;
        this.previewTime = 3000; // Show all cards for 3 seconds
        
        this.symbols = [
            '🌟', '🎮', '🎲', '🃏', '🎪', '🎨', '🎭', '🎯',
            '🚀', '⚡', '🔥', '💎', '🌈', '🎊', '🎁', '⭐',
            '🏆', '🎖️', '🏅', '🎗️', '🎯', '🎪', '🎨', '🎭'
        ];
        
        this.cardColors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ];
    }

    setup() {
        this.calculateCardSize();
        this.generateCards();
        this.gameStartTime = performance.now();
        this.showAllCards();
        this.audioManager.startBackgroundMusic(100);
    }

    calculateCardSize() {
        const availableWidth = this.canvas.width - (this.gridWidth + 1) * this.cardSpacing;
        const availableHeight = this.canvas.height - (this.gridHeight + 1) * this.cardSpacing - 100; // Space for UI
        
        this.cardWidth = Math.min(80, availableWidth / this.gridWidth);
        this.cardHeight = Math.min(100, availableHeight / this.gridHeight);
        
        // Adjust grid size based on level
        if (this.level <= 2) {
            this.gridWidth = 4;
            this.gridHeight = 3;
        } else if (this.level <= 5) {
            this.gridWidth = 4;
            this.gridHeight = 4;
        } else {
            this.gridWidth = 6;
            this.gridHeight = 4;
        }
        
        this.totalPairs = (this.gridWidth * this.gridHeight) / 2;
    }

    generateCards() {
        this.cards = [];
        this.matchedPairs = 0;
        this.moveCount = 0;
        
        // Create pairs
        const pairs = [];
        for (let i = 0; i < this.totalPairs; i++) {
            const symbol = this.symbols[i % this.symbols.length];
            const color = this.cardColors[i % this.cardColors.length];
            pairs.push({ symbol, color, id: i });
            pairs.push({ symbol, color, id: i });
        }
        
        // Shuffle pairs
        this.shuffleArray(pairs);
        
        // Create card objects
        const offsetX = (this.canvas.width - (this.gridWidth * (this.cardWidth + this.cardSpacing) - this.cardSpacing)) / 2;
        const offsetY = (this.canvas.height - (this.gridHeight * (this.cardHeight + this.cardSpacing) - this.cardSpacing)) / 2;
        
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const index = row * this.gridWidth + col;
                if (index < pairs.length) {
                    const pair = pairs[index];
                    const card = {
                        x: offsetX + col * (this.cardWidth + this.cardSpacing),
                        y: offsetY + row * (this.cardHeight + this.cardSpacing),
                        width: this.cardWidth,
                        height: this.cardHeight,
                        symbol: pair.symbol,
                        color: pair.color,
                        id: pair.id,
                        flipped: false,
                        matched: false,
                        scale: 1,
                        rotation: 0,
                        glowIntensity: 0
                    };
                    this.cards.push(card);
                }
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    showAllCards() {
        this.showingCards = true;
        this.cards.forEach(card => {
            card.flipped = true;
        });
        
        setTimeout(() => {
            this.hideAllCards();
        }, this.previewTime);
    }

    hideAllCards() {
        this.showingCards = false;
        this.cards.forEach(card => {
            if (!card.matched) {
                card.flipped = false;
            }
        });
    }

    handleClick(mouse) {
        if (this.showingCards || this.flippedCards.length >= 2) return;
        
        const clickedCard = this.getCardAt(mouse.x, mouse.y);
        
        if (clickedCard && !clickedCard.flipped && !clickedCard.matched) {
            this.flipCard(clickedCard);
        }
    }

    getCardAt(x, y) {
        return this.cards.find(card => 
            x >= card.x && x <= card.x + card.width &&
            y >= card.y && y <= card.y + card.height
        );
    }

    flipCard(card) {
        card.flipped = true;
        this.flippedCards.push(card);
        this.audioManager.playSound('click');
        
        // Animation
        this.flipAnimation[card] = {
            progress: 0,
            duration: 300
        };
        
        if (this.flippedCards.length === 2) {
            this.moveCount++;
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.id === card2.id) {
            // Match found
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;
            
            this.updateScore(100 * this.level);
            this.audioManager.playSound('match');
            
            // Match animation
            this.matchAnimation[card1] = { glowIntensity: 1, duration: 1000 };
            this.matchAnimation[card2] = { glowIntensity: 1, duration: 1000 };
            
            this.particleSystem.createStarBurst(card1.x + card1.width / 2, card1.y + card1.height / 2, card1.color);
            this.particleSystem.createStarBurst(card2.x + card2.width / 2, card2.y + card2.height / 2, card2.color);
            
            // Check win condition
            if (this.matchedPairs >= this.totalPairs) {
                setTimeout(() => this.levelComplete(), 500);
            }
            
        } else {
            // No match
            card1.flipped = false;
            card2.flipped = false;
            this.audioManager.playSound('hit');
        }
        
        this.flippedCards = [];
    }

    levelComplete() {
        const timeBonus = Math.max(0, 10000 - (performance.now() - this.gameStartTime));
        const moveBonus = Math.max(0, (this.totalPairs * 3 - this.moveCount) * 50);
        
        this.updateScore(timeBonus + moveBonus);
        this.audioManager.playSound('victory');
        this.particleSystem.createRainbow(this.canvas.width / 2, this.canvas.height / 2);
        
        this.nextLevel();
        setTimeout(() => {
            this.setup();
        }, 2000);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update flip animations
        Object.keys(this.flipAnimation).forEach(cardKey => {
            const anim = this.flipAnimation[cardKey];
            anim.progress += deltaTime;
            
            if (anim.progress >= anim.duration) {
                delete this.flipAnimation[cardKey];
            }
        });
        
        // Update match animations
        Object.keys(this.matchAnimation).forEach(cardKey => {
            const anim = this.matchAnimation[cardKey];
            anim.duration -= deltaTime;
            anim.glowIntensity = Math.max(0, anim.duration / 1000);
            
            if (anim.duration <= 0) {
                delete this.matchAnimation[cardKey];
            }
        });
        
        // Update card effects
        this.cards.forEach(card => {
            // Hover scale effect
            const targetScale = card.matched ? 1.05 : 1;
            card.scale = this.lerp(card.scale, targetScale, 0.1);
            
            // Glow effect for matched cards
            if (this.matchAnimation[card]) {
                card.glowIntensity = this.matchAnimation[card].glowIntensity;
            } else {
                card.glowIntensity = this.lerp(card.glowIntensity, 0, 0.05);
            }
        });
    }

    render() {
        super.render();
        
        // Background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw cards
        this.cards.forEach(card => this.drawCard(card));
        
        // Draw UI
        this.drawUI();
        
        // Preview timer
        if (this.showingCards) {
            this.drawPreviewTimer();
        }
    }

    drawCard(card) {
        this.ctx.save();
        
        // Apply glow effect
        if (card.glowIntensity > 0) {
            this.ctx.shadowColor = card.color;
            this.ctx.shadowBlur = 20 * card.glowIntensity;
        }
        
        // Card transformation
        this.ctx.translate(card.x + card.width / 2, card.y + card.height / 2);
        this.ctx.scale(card.scale, card.scale);
        this.ctx.rotate(card.rotation);
        
        const x = -card.width / 2;
        const y = -card.height / 2;
        
        if (card.flipped) {
            // Front of card (symbol)
            const gradient = this.ctx.createLinearGradient(x, y, x, y + card.height);
            gradient.addColorStop(0, this.lightenColor(card.color, 30));
            gradient.addColorStop(1, card.color);
            
            this.ctx.fillStyle = gradient;
            this.drawRoundedRect(x, y, card.width, card.height, 10, gradient);
            
            // Card border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, card.width, card.height, 10);
            this.ctx.stroke();
            
            // Symbol
            this.ctx.font = `${card.width * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(card.symbol, 0, card.height * 0.1);
            
        } else {
            // Back of card
            const backGradient = this.ctx.createLinearGradient(x, y, x, y + card.height);
            backGradient.addColorStop(0, '#667eea');
            backGradient.addColorStop(1, '#764ba2');
            
            this.ctx.fillStyle = backGradient;
            this.drawRoundedRect(x, y, card.width, card.height, 10, backGradient);
            
            // Pattern
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            
            // Draw diamond pattern
            const centerX = 0;
            const centerY = 0;
            const size = Math.min(card.width, card.height) * 0.3;
            
            this.ctx.moveTo(centerX, centerY - size / 2);
            this.ctx.lineTo(centerX + size / 2, centerY);
            this.ctx.lineTo(centerX, centerY + size / 2);
            this.ctx.lineTo(centerX - size / 2, centerY);
            this.ctx.closePath();
            this.ctx.stroke();
            
            // Card border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, card.width, card.height, 10);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawUI() {
        // Stats background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 60);
        
        // Stats text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        const elapsed = Math.floor((performance.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.ctx.fillText(`Level: ${this.level}`, 20, 25);
        this.ctx.fillText(`Time: ${timeStr}`, 20, 45);
        
        this.ctx.fillText(`Moves: ${this.moveCount}`, 150, 25);
        this.ctx.fillText(`Pairs: ${this.matchedPairs}/${this.totalPairs}`, 150, 45);
        
        // Progress bar
        const barWidth = 200;
        const barHeight = 8;
        const barX = this.canvas.width - barWidth - 20;
        const barY = 26;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const progress = this.matchedPairs / this.totalPairs;
        const progressGradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        progressGradient.addColorStop(0, '#2ecc71');
        progressGradient.addColorStop(1, '#27ae60');
        
        this.ctx.fillStyle = progressGradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }

    drawPreviewTimer() {
        const remaining = Math.max(0, this.previewTime - (performance.now() - this.gameStartTime));
        const seconds = Math.ceil(remaining / 1000);
        
        // Timer background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // Timer text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Memorize the cards!', this.canvas.width / 2, this.canvas.height - 60);
        this.ctx.fillText(`${seconds}`, this.canvas.width / 2, this.canvas.height - 30);
        
        // Timer bar
        const barWidth = this.canvas.width * 0.8;
        const barHeight = 6;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height - 20;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const progress = remaining / this.previewTime;
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }

    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }

    renderPreview(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw sample cards
        const cardWidth = canvas.width / 5;
        const cardHeight = canvas.height / 3;
        const spacing = 5;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const x = col * (cardWidth + spacing) + spacing;
                const y = row * (cardHeight + spacing) + canvas.height / 4;
                
                // Card background
                const cardGradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
                cardGradient.addColorStop(0, '#667eea');
                cardGradient.addColorStop(1, '#764ba2');
                
                ctx.fillStyle = cardGradient;
                ctx.fillRect(x, y, cardWidth - spacing, cardHeight - spacing);
                
                // Pattern
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const centerX = x + cardWidth / 2;
                const centerY = y + cardHeight / 2;
                const size = 8;
                
                ctx.moveTo(centerX, centerY - size);
                ctx.lineTo(centerX + size, centerY);
                ctx.lineTo(centerX, centerY + size);
                ctx.lineTo(centerX - size, centerY);
                ctx.closePath();
                ctx.stroke();
            }
        }
        
        // Add sparkles
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    reset() {
        super.reset();
        this.generateCards();
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moveCount = 0;
        this.gameStartTime = performance.now();
        this.showAllCards();
    }
}
