class JarvisApp {
    constructor() {
        this.canvas = new JarvisCanvas('jarvis-canvas');
        this.speech = new JarvisSpeech();
        this.claude = new ClaudeClient();

        this.state = 'idle';  // idle | listening | processing | speaking
        this.initialized = false;
        this.greetingIndex = 0;

        this._bindUI();
        this._bindSpeech();
        this._startClock();
        this._checkApiKey();
    }

    _bindUI() {
        const overlay = document.getElementById('start-overlay');
        const btn = document.getElementById('start-btn');

        btn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            this._initialize();
        });

        // Tap on canvas also starts
        document.getElementById('jarvis-canvas').addEventListener('click', () => {
            if (!this.initialized) {
                overlay.classList.add('hidden');
                this._initialize();
                return;
            }
            // If idle, go to listening state for one command
            if (this.state === 'idle') {
                this._activateListening();
            }
        });

        document.getElementById('mic-btn').addEventListener('click', () => {
            if (this.state === 'idle') this._activateListening();
            else if (this.state === 'listening') this._cancelListening();
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            this.claude.clearHistory();
            this._setTranscript('');
            this._setResponse('Memoria conversazione cancellata, sir.');
        });
    }

    _bindSpeech() {
        this.speech.onWakeWord = () => {
            this._activateListening();
        };

        this.speech.onTranscript = (text) => {
            this._handleCommand(text);
        };

        this.speech.onAudioLevel = (level) => {
            this.canvas.setAudioLevel(level);
        };

        this.speech.onEnd = (reason) => {
            if (reason === 'permission-denied') {
                this._setResponse('Accesso al microfono negato. Abilita il microfono nelle impostazioni del browser.');
            }
        };
    }

    async _initialize() {
        if (this.initialized) return;
        this.initialized = true;

        document.getElementById('wake-hint').textContent = 'Avvio in corso...';
        this.speech.start();

        // Brief startup animation
        await this._sleep(800);
        this._setState('idle');
        document.getElementById('wake-hint').textContent = 'Di\' "Hey Jarvis" per iniziare';
        document.getElementById('mic-btn').style.display = 'flex';

        // Startup greeting
        const greeting = 'Sistemi online. JARVIS pronto ai suoi ordini, sir.';
        this._setResponse(greeting);
        this._setState('speaking');
        this.speech.speak(greeting, () => this._setState('idle'));
    }

    _activateListening() {
        if (this.state === 'speaking') {
            this.speech.stopSpeaking();
        }
        this._setState('listening');
        this.speech.isActive = true;
        document.getElementById('wake-hint').textContent = 'In ascolto...';

        const greetings = JARVIS_CONFIG.GREETING_RESPONSES;
        const g = greetings[this.greetingIndex % greetings.length];
        this.greetingIndex++;

        this._setResponse(g);
        this.speech.speak(g);
    }

    _cancelListening() {
        this.speech.resetWakeWord();
        this._setState('idle');
        document.getElementById('wake-hint').textContent = 'Di\' "Hey Jarvis" per iniziare';
    }

    async _handleCommand(text) {
        if (!text || text.length < 2) return;

        this._setTranscript(text);
        this._setState('processing');
        document.getElementById('wake-hint').textContent = 'Elaborazione...';

        const reply = await this.claude.ask(text);

        this._setResponse(reply);
        this._setState('speaking');
        document.getElementById('wake-hint').textContent = 'Risposta in corso...';

        this.speech.speak(reply, () => {
            this._setState('idle');
            document.getElementById('wake-hint').textContent = 'Di\' "Hey Jarvis" per iniziare';
        });
    }

    _setState(state) {
        this.state = state;
        this.canvas.setState(state);

        const micBtn = document.getElementById('mic-btn');
        const micIcon = document.getElementById('mic-icon');
        if (state === 'listening') {
            micBtn.classList.add('active');
            micIcon.textContent = '⬛';
        } else {
            micBtn.classList.remove('active');
            micIcon.textContent = '🎙';
        }
    }

    _setTranscript(text) {
        const el = document.getElementById('transcript');
        if (text) {
            el.textContent = '› ' + text;
            el.style.opacity = '1';
        } else {
            el.textContent = '';
            el.style.opacity = '0';
        }
    }

    _setResponse(text) {
        const el = document.getElementById('response');
        el.textContent = text;
        el.style.opacity = '1';
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 300);
    }

    _startClock() {
        const update = () => {
            const now = new Date();
            const h = now.getHours().toString().padStart(2, '0');
            const m = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            const timeEl = document.getElementById('time-display');
            const dateEl = document.getElementById('date-display');
            if (timeEl) timeEl.textContent = `${h}:${m}:${s}`;
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('it-IT', {
                    weekday: 'short', day: 'numeric', month: 'short'
                }).toUpperCase();
            }
        };
        update();
        setInterval(update, 1000);
    }

    _checkApiKey() {
        if (JARVIS_CONFIG.CLAUDE_API_KEY === 'YOUR_ANTHROPIC_API_KEY_HERE') {
            const banner = document.getElementById('api-banner');
            if (banner) banner.style.display = 'flex';
        }
    }

    _sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.jarvis = new JarvisApp();
});
