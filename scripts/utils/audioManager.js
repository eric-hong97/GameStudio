/**
 * Audio Manager
 * Handles all audio playback and management
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isMuted = false;
        this.masterVolume = 1.0;
        this.soundVolume = 0.7;
        this.musicVolume = 0.3;
        
        this.initializeAudioContext();
        this.loadSounds();
    }

    initializeAudioContext() {
        try {
            // Try to create AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Handle autoplay policy
            if (this.audioContext.state === 'suspended') {
                document.addEventListener('click', () => {
                    this.audioContext.resume();
                }, { once: true });
            }
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioContext = null;
        }
    }

    loadSounds() {
        // Define sound effects using Web Audio API oscillators
        this.sounds = {
            match: () => this.createTone(800, 0.1, 'sine'),
            explosion: () => this.createNoise(0.3),
            victory: () => this.createMelody([523, 659, 784, 1047], 0.2),
            click: () => this.createTone(1000, 0.05, 'square'),
            powerup: () => this.createTone(1200, 0.3, 'sawtooth'),
            hit: () => this.createTone(200, 0.1, 'triangle'),
            bounce: () => this.createTone(400, 0.1, 'sine'),
            collect: () => this.createTone(600, 0.15, 'sine')
        };
    }

    createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || this.isMuted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.soundVolume * this.masterVolume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing tone:', error);
        }
    }

    createNoise(duration) {
        if (!this.audioContext || this.isMuted) return;

        try {
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate white noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();

            source.buffer = buffer;
            source.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filterNode.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);

            gainNode.gain.setValueAtTime(this.soundVolume * this.masterVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            source.start(this.audioContext.currentTime);
        } catch (error) {
            console.warn('Error playing noise:', error);
        }
    }

    createMelody(frequencies, noteDuration) {
        if (!this.audioContext || this.isMuted) return;

        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, noteDuration, 'sine');
            }, index * noteDuration * 1000);
        });
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    // Background music using oscillators
    startBackgroundMusic(tempo = 120) {
        if (this.backgroundMusicInterval) {
            this.stopBackgroundMusic();
        }

        if (this.isMuted) return;

        const beatInterval = (60 / tempo) * 1000;
        const melody = [523, 659, 587, 523, 440, 493, 523]; // C major scale
        let currentNote = 0;

        this.backgroundMusicInterval = setInterval(() => {
            if (!this.isMuted) {
                const frequency = melody[currentNote];
                this.createTone(frequency, 0.2, 'sine');
                currentNote = (currentNote + 1) % melody.length;
            }
        }, beatInterval);
    }

    stopBackgroundMusic() {
        if (this.backgroundMusicInterval) {
            clearInterval(this.backgroundMusicInterval);
            this.backgroundMusicInterval = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        }
        return this.isMuted;
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
}
