/**
 * Tower Defense Game
 * Strategic tower defense with upgrades and waves
 */

class TowerDefenseGame extends GameEngine {
    constructor() {
        super('Tower Command', `
            Build towers along the path to stop enemies from reaching the end!
            Upgrade your towers and use strategic placement to defend.
            Defeat all waves to advance to the next level.
            <br><br>
            <strong>Controls:</strong><br>
            • Click: Select tower type / Place tower<br>
            • Click on tower: Upgrade tower<br>
            • ESC: Pause game
        `);
        
        this.path = [];
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.waves = [];
        this.currentWave = 0;
        this.waveInProgress = false;
        this.enemiesSpawned = 0;
        this.lastSpawnTime = 0;
        this.spawnDelay = 1000;
        
        this.money = 150;
        this.health = 20;
        this.selectedTowerType = 'basic';
        this.selectedTower = null;
        
        this.towerTypes = {
            basic: {
                name: 'Basic Tower',
                cost: 50,
                damage: 20,
                range: 80,
                fireRate: 1000,
                color: '#4ecdc4',
                projectileColor: '#ffd93d'
            },
            rapid: {
                name: 'Rapid Tower',
                cost: 80,
                damage: 10,
                range: 60,
                fireRate: 300,
                color: '#ff6b6b',
                projectileColor: '#ff9f43'
            },
            heavy: {
                name: 'Heavy Tower',
                cost: 120,
                damage: 50,
                range: 100,
                fireRate: 2000,
                color: '#9b59b6',
                projectileColor: '#e74c3c'
            }
        };
        
        this.enemyTypes = {
            basic: {
                health: 40,
                speed: 1,
                reward: 10,
                color: '#ff6b6b',
                size: 8
            },
            fast: {
                health: 25,
                speed: 2,
                reward: 15,
                color: '#f39c12',
                size: 6
            },
            tank: {
                health: 100,
                speed: 0.5,
                reward: 25,
                color: '#2c3e50',
                size: 12
            }
        };
        
        this.cellSize = 40;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = [];
        
        this.uiHeight = 100;
    }

    setup() {
        this.calculateGrid();
        this.generatePath();
        this.setupWaves();
        this.initializeGrid();
        this.audioManager.startBackgroundMusic(90);
    }

    calculateGrid() {
        this.gridWidth = Math.floor(this.canvas.width / this.cellSize);
        this.gridHeight = Math.floor((this.canvas.height - this.uiHeight) / this.cellSize);
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                this.grid[row][col] = {
                    x: col * this.cellSize,
                    y: row * this.cellSize,
                    blocked: false,
                    tower: null
                };
            }
        }
        
        // Mark path cells as blocked
        this.path.forEach(point => {
            const col = Math.floor(point.x / this.cellSize);
            const row = Math.floor(point.y / this.cellSize);
            if (this.grid[row] && this.grid[row][col]) {
                this.grid[row][col].blocked = true;
            }
        });
    }

    generatePath() {
        this.path = [];
        const startX = 0;
        const startY = Math.floor(this.gridHeight / 2) * this.cellSize + this.cellSize / 2;
        const endX = this.canvas.width;
        const endY = startY;
        
        // Simple straight path with some curves
        const segments = 5;
        const segmentWidth = this.canvas.width / segments;
        
        for (let i = 0; i <= segments; i++) {
            const x = i * segmentWidth;
            const offset = (i > 0 && i < segments) ? Math.sin(i) * 60 : 0;
            this.path.push({ x: x, y: startY + offset });
        }
        
        // Smooth the path
        this.smoothPath();
    }

    smoothPath() {
        const smoothed = [this.path[0]];
        
        for (let i = 1; i < this.path.length - 1; i++) {
            const prev = this.path[i - 1];
            const curr = this.path[i];
            const next = this.path[i + 1];
            
            // Add intermediate points for smoother movement
            const steps = 10;
            for (let j = 0; j < steps; j++) {
                const t = j / steps;
                const x = this.lerp(prev.x, curr.x, t);
                const y = this.lerp(prev.y, curr.y, t);
                smoothed.push({ x, y });
            }
        }
        
        smoothed.push(this.path[this.path.length - 1]);
        this.path = smoothed;
    }

    setupWaves() {
        this.waves = [];
        for (let wave = 1; wave <= 10; wave++) {
            const waveData = {
                enemies: [],
                reward: wave * 20
            };
            
            // Basic enemies
            for (let i = 0; i < 5 + wave * 2; i++) {
                waveData.enemies.push('basic');
            }
            
            // Add fast enemies after wave 2
            if (wave > 2) {
                for (let i = 0; i < wave; i++) {
                    waveData.enemies.push('fast');
                }
            }
            
            // Add tank enemies after wave 4
            if (wave > 4) {
                for (let i = 0; i < Math.floor(wave / 2); i++) {
                    waveData.enemies.push('tank');
                }
            }
            
            this.waves.push(waveData);
        }
    }

    handleClick(mouse) {
        // Check if clicking on UI
        if (mouse.y > this.canvas.height - this.uiHeight) {
            this.handleUIClick(mouse);
            return;
        }
        
        const col = Math.floor(mouse.x / this.cellSize);
        const row = Math.floor(mouse.y / this.cellSize);
        
        if (row < 0 || row >= this.gridHeight || col < 0 || col >= this.gridWidth) return;
        
        const cell = this.grid[row][col];
        
        if (cell.tower) {
            // Click on existing tower - select/upgrade
            this.selectedTower = cell.tower;
            this.audioManager.playSound('click');
        } else if (!cell.blocked) {
            // Place new tower
            this.placeTower(col, row);
        }
    }

    handleUIClick(mouse) {
        const buttonWidth = 100;
        const buttonHeight = 40;
        const startX = 20;
        const startY = this.canvas.height - this.uiHeight + 20;
        
        // Tower type buttons
        const towerKeys = Object.keys(this.towerTypes);
        for (let i = 0; i < towerKeys.length; i++) {
            const buttonX = startX + i * (buttonWidth + 10);
            if (mouse.x >= buttonX && mouse.x <= buttonX + buttonWidth &&
                mouse.y >= startY && mouse.y <= startY + buttonHeight) {
                this.selectedTowerType = towerKeys[i];
                this.selectedTower = null;
                this.audioManager.playSound('click');
                return;
            }
        }
        
        // Start wave button
        const waveButtonX = this.canvas.width - 120;
        if (mouse.x >= waveButtonX && mouse.x <= waveButtonX + 100 &&
            mouse.y >= startY && mouse.y <= startY + buttonHeight) {
            this.startWave();
        }
        
        // Upgrade button (if tower selected)
        if (this.selectedTower) {
            const upgradeButtonX = startX;
            const upgradeButtonY = startY + 50;
            if (mouse.x >= upgradeButtonX && mouse.x <= upgradeButtonX + buttonWidth &&
                mouse.y >= upgradeButtonY && mouse.y <= upgradeButtonY + buttonHeight) {
                this.upgradeTower();
            }
        }
    }

    placeTower(col, row) {
        const towerType = this.towerTypes[this.selectedTowerType];
        
        if (this.money >= towerType.cost) {
            const tower = {
                x: col * this.cellSize + this.cellSize / 2,
                y: row * this.cellSize + this.cellSize / 2,
                type: this.selectedTowerType,
                level: 1,
                damage: towerType.damage,
                range: towerType.range,
                fireRate: towerType.fireRate,
                lastFireTime: 0,
                target: null,
                color: towerType.color,
                projectileColor: towerType.projectileColor
            };
            
            this.towers.push(tower);
            this.grid[row][col].tower = tower;
            this.money -= towerType.cost;
            this.selectedTower = tower;
            
            this.audioManager.playSound('collect');
            this.particleSystem.createCollectEffect(tower.x, tower.y, tower.color);
        }
    }

    upgradeTower() {
        if (!this.selectedTower) return;
        
        const upgradeCost = this.selectedTower.level * 30;
        
        if (this.money >= upgradeCost) {
            this.money -= upgradeCost;
            this.selectedTower.level++;
            this.selectedTower.damage *= 1.3;
            this.selectedTower.range *= 1.1;
            this.selectedTower.fireRate *= 0.9; // Faster firing
            
            this.audioManager.playSound('powerup');
            this.particleSystem.createStarBurst(this.selectedTower.x, this.selectedTower.y, this.selectedTower.color);
        }
    }

    startWave() {
        if (this.waveInProgress || this.currentWave >= this.waves.length) return;
        
        this.waveInProgress = true;
        this.enemiesSpawned = 0;
        this.lastSpawnTime = performance.now();
        this.audioManager.playSound('hit');
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Spawn enemies
        if (this.waveInProgress) {
            this.spawnEnemies();
        }
        
        // Update towers
        this.updateTowers(deltaTime);
        
        // Update enemies
        this.updateEnemies(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Check wave completion
        if (this.waveInProgress && this.enemies.length === 0 && 
            this.enemiesSpawned >= this.waves[this.currentWave].enemies.length) {
            this.completeWave();
        }
        
        // Check game over
        if (this.health <= 0) {
            this.gameOver();
        }
        
        // Check level completion
        if (this.currentWave >= this.waves.length && this.enemies.length === 0) {
            this.nextLevel();
            this.currentWave = 0;
            this.setupWaves();
        }
    }

    spawnEnemies() {
        const now = performance.now();
        const currentWaveData = this.waves[this.currentWave];
        
        if (now - this.lastSpawnTime >= this.spawnDelay && 
            this.enemiesSpawned < currentWaveData.enemies.length) {
            
            const enemyType = currentWaveData.enemies[this.enemiesSpawned];
            this.spawnEnemy(enemyType);
            this.enemiesSpawned++;
            this.lastSpawnTime = now;
        }
    }

    spawnEnemy(type) {
        const enemyData = this.enemyTypes[type];
        const enemy = {
            x: this.path[0].x,
            y: this.path[0].y,
            type: type,
            health: enemyData.health * this.level,
            maxHealth: enemyData.health * this.level,
            speed: enemyData.speed,
            reward: enemyData.reward,
            color: enemyData.color,
            size: enemyData.size,
            pathIndex: 0,
            pathProgress: 0
        };
        
        this.enemies.push(enemy);
    }

    updateTowers(deltaTime) {
        this.towers.forEach(tower => {
            // Find target
            if (!tower.target || !this.isEnemyInRange(tower, tower.target)) {
                tower.target = this.findNearestEnemy(tower);
            }
            
            // Fire at target
            if (tower.target && performance.now() - tower.lastFireTime >= tower.fireRate) {
                this.fireProjectile(tower, tower.target);
                tower.lastFireTime = performance.now();
            }
        });
    }

    findNearestEnemy(tower) {
        let nearest = null;
        let nearestDistance = Infinity;
        
        this.enemies.forEach(enemy => {
            if (this.isEnemyInRange(tower, enemy)) {
                const distance = this.getDistance(tower, enemy);
                if (distance < nearestDistance) {
                    nearest = enemy;
                    nearestDistance = distance;
                }
            }
        });
        
        return nearest;
    }

    isEnemyInRange(tower, enemy) {
        const distance = this.getDistance(tower, enemy);
        return distance <= tower.range;
    }

    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    fireProjectile(tower, target) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            target: target,
            damage: tower.damage,
            speed: 8,
            color: tower.projectileColor,
            size: 3
        };
        
        // Calculate velocity
        const dx = target.x - tower.x;
        const dy = target.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        projectile.vx = (dx / distance) * projectile.speed;
        projectile.vy = (dy / distance) * projectile.speed;
        
        this.projectiles.push(projectile);
        this.audioManager.playSound('hit');
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move along path
            this.moveEnemyAlongPath(enemy, deltaTime);
            
            // Check if reached end
            if (enemy.pathIndex >= this.path.length - 1) {
                this.health--;
                this.enemies.splice(i, 1);
                this.particleSystem.createExplosion(enemy.x, enemy.y, '#ff0000');
                continue;
            }
            
            // Remove if dead
            if (enemy.health <= 0) {
                this.money += enemy.reward;
                this.updateScore(enemy.reward * 10);
                this.enemies.splice(i, 1);
                this.audioManager.playSound('explosion');
                this.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color);
            }
        }
    }

    moveEnemyAlongPath(enemy, deltaTime) {
        if (enemy.pathIndex >= this.path.length - 1) return;
        
        const currentPoint = this.path[enemy.pathIndex];
        const nextPoint = this.path[enemy.pathIndex + 1];
        
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveDistance = enemy.speed * (deltaTime / 16);
            enemy.pathProgress += moveDistance / distance;
            
            if (enemy.pathProgress >= 1) {
                enemy.pathIndex++;
                enemy.pathProgress = 0;
            }
            
            enemy.x = this.lerp(currentPoint.x, nextPoint.x, enemy.pathProgress);
            enemy.y = this.lerp(currentPoint.y, nextPoint.y, enemy.pathProgress);
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.x += projectile.vx * (deltaTime / 16);
            projectile.y += projectile.vy * (deltaTime / 16);
            
            // Check collision with target
            if (projectile.target && this.getDistance(projectile, projectile.target) < projectile.size + projectile.target.size) {
                projectile.target.health -= projectile.damage;
                this.projectiles.splice(i, 1);
                this.particleSystem.createSparkles(projectile.x, projectile.y, projectile.color);
                continue;
            }
            
            // Remove if out of bounds
            if (projectile.x < 0 || projectile.x > this.canvas.width ||
                projectile.y < 0 || projectile.y > this.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    completeWave() {
        this.waveInProgress = false;
        this.currentWave++;
        this.money += this.waves[this.currentWave - 1].reward;
        this.audioManager.playSound('victory');
        this.particleSystem.createRainbow(this.canvas.width / 2, this.canvas.height / 4);
    }

    render() {
        super.render();
        
        // Background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - this.uiHeight);
        
        // Draw grid
        this.drawGrid();
        
        // Draw path
        this.drawPath();
        
        // Draw towers
        this.towers.forEach(tower => this.drawTower(tower));
        
        // Draw enemies
        this.enemies.forEach(enemy => this.drawEnemy(enemy));
        
        // Draw projectiles
        this.projectiles.forEach(projectile => this.drawProjectile(projectile));
        
        // Draw tower ranges (for selected tower)
        if (this.selectedTower) {
            this.drawTowerRange(this.selectedTower);
        }
        
        // Draw UI
        this.drawUI();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let col = 0; col <= this.gridWidth; col++) {
            const x = col * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.gridHeight * this.cellSize);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= this.gridHeight; row++) {
            const y = row * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.gridWidth * this.cellSize, y);
            this.ctx.stroke();
        }
    }

    drawPath() {
        if (this.path.length < 2) return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 20;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        
        this.ctx.stroke();
    }

    drawTower(tower) {
        // Tower base
        this.ctx.fillStyle = this.darkenColor(tower.color, 20);
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tower body
        this.ctx.fillStyle = tower.color;
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tower level indicator
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tower.level.toString(), tower.x, tower.y + 3);
        
        // Selection indicator
        if (tower === this.selectedTower) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawTowerRange(tower) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawEnemy(enemy) {
        // Enemy body
        this.ctx.fillStyle = enemy.color;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Health bar
        const barWidth = enemy.size * 2;
        const barHeight = 3;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.size - 8;
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = enemy.health / enemy.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    drawProjectile(projectile) {
        this.ctx.fillStyle = projectile.color;
        this.ctx.beginPath();
        this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Glow effect
        this.ctx.shadowColor = projectile.color;
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.arc(projectile.x, projectile.y, projectile.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawUI() {
        // UI background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, this.canvas.height - this.uiHeight, this.canvas.width, this.uiHeight);
        
        // Game stats
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Money: $${this.money}`, 20, this.canvas.height - this.uiHeight + 70);
        this.ctx.fillText(`Health: ${this.health}`, 150, this.canvas.height - this.uiHeight + 70);
        this.ctx.fillText(`Wave: ${this.currentWave + 1}/${this.waves.length}`, 280, this.canvas.height - this.uiHeight + 70);
        
        // Tower buttons
        const buttonWidth = 100;
        const buttonHeight = 40;
        const startX = 20;
        const startY = this.canvas.height - this.uiHeight + 20;
        
        const towerKeys = Object.keys(this.towerTypes);
        towerKeys.forEach((key, index) => {
            const tower = this.towerTypes[key];
            const buttonX = startX + index * (buttonWidth + 10);
            
            // Button background
            const isSelected = this.selectedTowerType === key;
            const canAfford = this.money >= tower.cost;
            
            this.ctx.fillStyle = isSelected ? tower.color : 
                                canAfford ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(buttonX, startY, buttonWidth, buttonHeight);
            
            // Button border
            this.ctx.strokeStyle = canAfford ? 'white' : 'gray';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(buttonX, startY, buttonWidth, buttonHeight);
            
            // Button text
            this.ctx.fillStyle = canAfford ? 'white' : 'gray';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tower.name, buttonX + buttonWidth / 2, startY + 15);
            this.ctx.fillText(`$${tower.cost}`, buttonX + buttonWidth / 2, startY + 30);
        });
        
        // Start wave button
        if (!this.waveInProgress && this.currentWave < this.waves.length) {
            const waveButtonX = this.canvas.width - 120;
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fillRect(waveButtonX, startY, 100, buttonHeight);
            
            this.ctx.strokeStyle = 'white';
            this.ctx.strokeRect(waveButtonX, startY, 100, buttonHeight);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Start Wave', waveButtonX + 50, startY + 25);
        }
        
        // Upgrade button (if tower selected)
        if (this.selectedTower) {
            const upgradeButtonX = startX;
            const upgradeButtonY = startY + 50;
            const upgradeCost = this.selectedTower.level * 30;
            const canUpgrade = this.money >= upgradeCost;
            
            this.ctx.fillStyle = canUpgrade ? '#f39c12' : 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(upgradeButtonX, upgradeButtonY, buttonWidth, 30);
            
            this.ctx.strokeStyle = canUpgrade ? 'white' : 'gray';
            this.ctx.strokeRect(upgradeButtonX, upgradeButtonY, buttonWidth, 30);
            
            this.ctx.fillStyle = canUpgrade ? 'white' : 'gray';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Upgrade $${upgradeCost}`, upgradeButtonX + buttonWidth / 2, upgradeButtonY + 20);
        }
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
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw path
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.quadraticCurveTo(canvas.width / 2, canvas.height / 4, canvas.width, canvas.height / 2);
        ctx.stroke();
        
        // Draw towers
        const towerPositions = [
            { x: canvas.width * 0.25, y: canvas.height * 0.7 },
            { x: canvas.width * 0.5, y: canvas.height * 0.3 },
            { x: canvas.width * 0.75, y: canvas.height * 0.8 }
        ];
        
        const towerColors = ['#4ecdc4', '#ff6b6b', '#9b59b6'];
        
        towerPositions.forEach((pos, index) => {
            ctx.fillStyle = towerColors[index];
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw enemies
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.1, canvas.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(canvas.width * 0.3, canvas.height * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some effects
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    reset() {
        super.reset();
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.currentWave = 0;
        this.waveInProgress = false;
        this.enemiesSpawned = 0;
        this.money = 150;
        this.health = 20;
        this.selectedTower = null;
        this.setupWaves();
    }
}
