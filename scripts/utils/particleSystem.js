/**
 * Particle System
 * Creates and manages visual effects and particles
 */

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 4;
        this.vy = options.vy || (Math.random() - 0.5) * 4;
        this.life = options.life || 1.0;
        this.maxLife = this.life;
        this.size = options.size || Math.random() * 4 + 2;
        this.color = options.color || `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.gravity = options.gravity || 0.1;
        this.friction = options.friction || 0.98;
        this.type = options.type || 'circle';
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || (Math.random() - 0.5) * 0.2;
    }

    update(deltaTime) {
        // Apply velocity
        this.x += this.vx * (deltaTime / 16);
        this.y += this.vy * (deltaTime / 16);
        
        // Apply gravity
        this.vy += this.gravity * (deltaTime / 16);
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update rotation
        this.rotation += this.rotationSpeed * (deltaTime / 16);
        
        // Reduce life
        this.life -= (1 / this.maxLife) * (deltaTime / 1000);
        
        return this.life > 0;
    }

    render(ctx) {
        const alpha = Math.max(0, this.life);
        ctx.save();
        
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        switch(this.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size * alpha, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                break;
                
            case 'square':
                const halfSize = (this.size * alpha) / 2;
                ctx.fillStyle = this.color;
                ctx.fillRect(-halfSize, -halfSize, this.size * alpha, this.size * alpha);
                break;
                
            case 'star':
                this.drawStar(ctx, 0, 0, 5, this.size * alpha, this.size * alpha * 0.5);
                ctx.fillStyle = this.color;
                ctx.fill();
                break;
                
            case 'spark':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-this.size * alpha, 0);
                ctx.lineTo(this.size * alpha, 0);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }

    drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
            rot += step;
        }
        
        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    addParticle(x, y, options = {}) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(new Particle(x, y, options));
        }
    }

    addParticles(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            const particleOptions = {
                ...options,
                vx: options.vx || (Math.random() - 0.5) * 6,
                vy: options.vy || (Math.random() - 0.5) * 6
            };
            this.addParticle(x, y, particleOptions);
        }
    }

    // Preset particle effects
    createExplosion(x, y, color = '#ff6b6b', count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 6 + 2,
                life: 2.0,
                type: 'circle',
                gravity: 0.05
            });
        }
    }

    createStarBurst(x, y, color = '#ffd93d', count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 4 + 3,
                life: 1.5,
                type: 'star',
                gravity: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.5
            });
        }
    }

    createSparkles(x, y, color = '#fff', count = 10) {
        for (let i = 0; i < count; i++) {
            this.addParticle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, {
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: color,
                size: Math.random() * 3 + 1,
                life: 1.0,
                type: 'spark',
                gravity: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    createTrail(x, y, color = '#667eea', count = 5) {
        for (let i = 0; i < count; i++) {
            this.addParticle(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, {
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                color: color,
                size: Math.random() * 2 + 1,
                life: 0.5,
                type: 'circle',
                gravity: 0,
                friction: 0.95
            });
        }
    }

    createCollectEffect(x, y, color = '#2ecc71', count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 3 + 2,
                life: 1.2,
                type: 'circle',
                gravity: -0.05,
                friction: 0.99
            });
        }
    }

    createRainbow(x, y, count = 25) {
        for (let i = 0; i < count; i++) {
            const hue = (i / count) * 360;
            const angle = (i / count) * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: `hsl(${hue}, 100%, 50%)`,
                size: Math.random() * 4 + 2,
                life: 2.0,
                type: 'circle',
                gravity: 0.03
            });
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => particle.update(deltaTime));
    }

    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }

    clear() {
        this.particles = [];
    }

    getParticleCount() {
        return this.particles.length;
    }
}
