class JarvisApp {
    constructor() {
        this.canvas = new JarvisCanvas('jarvis-canvas');
        this.speech = new JarvisSpeech();
        this.claude = new ClaudeClient();

        this.state = 'idle';
        this.initialized = false;

        this._bindSettings();
        this._bootSequence();
    }

    _bootSequence() {
        const groqKey   = localStorage.getItem('jarvis_groq_key');
        const elevenKey = localStorage.getItem('jarvis_eleven_key');
        const userName  = localStorage.getItem('jarvis_user_name') || '';
        if (groqKey)   this.claude.setKey(groqKey);
        if (elevenKey) this.speech.elevenLabsKey = elevenKey;
        if (userName)  this.claude.setUserName(userName);
        if (groqKey) {
            this._showStartOverlay();
        } else {
            this._showSettingsOverlay();
        }
    }

    _showSettingsOverlay(prefill) {
        document.getElementById('settings-overlay').classList.remove('hidden');
        document.getElementById('start-overlay').classList.add('hidden');
        if (prefill) document.getElementById('api-key-input').value = prefill;
        const savedName = localStorage.getItem('jarvis_user_name') || '';
        const nameEl = document.getElementById('user-name-input');
        if (nameEl && savedName) nameEl.value = savedName;
    }

    _hideSettingsOverlay() {
        document.getElementById('settings-overlay').classList.add('hidden');
    }

    _showStartOverlay() {
        document.getElementById('start-overlay').classList.remove('hidden');
    }

    _bindSettings() {
        document.getElementById('toggle-key-btn').addEventListener('click', () => {
            const inp = document.getElementById('api-key-input');
            inp.type = inp.type === 'password' ? 'text' : 'password';
        });

        document.getElementById('save-key-btn').addEventListener('click', () => {
            const key = document.getElementById('api-key-input').value.trim();
            if (!key || !key.startsWith('gsk_')) {
                document.getElementById('api-key-input').style.borderColor = '#ff4444';
                document.getElementById('api-key-input').placeholder = 'Chiave non valida — deve iniziare con gsk_';
                return;
            }
            localStorage.setItem('jarvis_groq_key', key);
            this.claude.setKey(key);
            const elKey = (document.getElementById('eleven-key-input') || {}).value || '';
            if (elKey.trim()) {
                localStorage.setItem('jarvis_eleven_key', elKey.trim());
                this.speech.elevenLabsKey = elKey.trim();
            }
            const userName = (document.getElementById('user-name-input') || {}).value || '';
            if (userName.trim()) {
                localStorage.setItem('jarvis_user_name', userName.trim());
                this.claude.setUserName(userName.trim());
            }
            this._hideSettingsOverlay();
            this._showStartOverlay();
        });

        document.getElementById('skip-key-btn').addEventListener('click', () => {
            this._hideSettingsOverlay();
            this._showStartOverlay();
        });

        document.getElementById('change-key-btn').addEventListener('click', () => {
            const existing = localStorage.getItem('jarvis_groq_key') || '';
            document.getElementById('start-overlay').classList.add('hidden');
            this._showSettingsOverlay(existing);
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            const existing = localStorage.getItem('jarvis_groq_key') || '';
            this.speech.stop();
            document.getElementById('start-overlay').classList.remove('hidden');
            this._showSettingsOverlay(existing);
            this.initialized = false;
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('start-overlay').classList.add('hidden');
            this._initialize();
        });

        document.getElementById('jarvis-canvas').addEventListener('click', () => {
            if (!this.initialized) return;
            if (this.state === 'idle') this._activateListening();
        });

        document.getElementById('mic-btn').addEventListener('click', () => {
            if (this.state === 'idle') this._activateListening();
            else if (this.state === 'listening') this._cancelListening();
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            this.claude.clearHistory();
            this._setTranscript('');
            this._setResponse('Memoria cancellata.');
        });
    }

    _bindSpeech() {
        this.speech.onWakeWord = () => this._activateListening();
        this.speech.onTranscript = (text) => this._handleCommand(text);
        this.speech.onAudioLevel = (level) => this.canvas.setAudioLevel(level);
        this.speech.onFrequencyData = (data) => this.canvas.setFrequencyData(data);
        this.speech.onEnd = (reason) => {
            if (reason === 'permission-denied') {
                this._setResponse('Accesso al microfono negato. Abilitalo nelle impostazioni di Safari.');
            }
        };
        this.speech.onElevenLabsError = (msg) => {
            this._setResponse('ElevenLabs: ' + msg);
        };
    }

    async _initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.speech.unlockAudio();

        this._bindSpeech();
        document.getElementById('wake-hint').textContent = 'Avvio in corso...';
        this.speech.start();

        await this._sleep(800);
        this._setState('idle');
        document.getElementById('wake-hint').textContent = 'Di\' "Hey Jarvis" per iniziare';
        document.getElementById('mic-btn').style.display = 'flex';
        document.getElementById('clear-btn').style.display = 'flex';
        document.getElementById('settings-btn').style.display = 'flex';

        const name = this.claude.userName;
        const greeting = name
            ? `Sistemi online. Ciao ${name}, sono pronto.`
            : 'Sistemi online. JARVIS pronto ai suoi ordini.';
        this._setResponse(greeting);
        this._setState('speaking');
        this.speech.speak(greeting, () => this._setState('idle'));
    }

    _activateListening() {
        if (this.state === 'speaking') this.speech.stopSpeaking();
        this._setState('listening');
        document.getElementById('wake-hint').textContent = 'In ascolto...';
        this._setResponse('Dimmi.');

        this.speech.stop();
        this.speech.speak('Dimmi.', () => {
            if (this.state === 'listening') {
                setTimeout(() => {
                    this.speech.isActive = true;
                    this.speech.start();
                }, 150);
            }
        });
    }

    _cancelListening() {
        this.speech.resetWakeWord();
        this._setState('idle');
        document.getElementById('wake-hint').textContent = 'Di\' "Hey Jarvis" per iniziare';
        setTimeout(() => this.speech.start(), 150);
    }

    async _handleCommand(text) {
        if (!text || text.length < 2) return;
        this._setTranscript(text);
        this._setState('processing');
        document.getElementById('wake-hint').textContent = 'Elaborazione...';

        this.speech.stop();

        const reply = await this.claude.ask(text);

        this._setResponse(reply);
        this._setState('speaking');
        document.getElementById('wake-hint').textContent = 'Risposta in corso...';
        this.speech.speak(reply, () => {
            this._setState('idle');
            document.getElementById('wake-hint').textContent = 'Di\' "Hey Jarvis" per iniziare';
            setTimeout(() => this.speech.start(), 300);
        });
    }

    _setState(state) {
        this.state = state;
        this.canvas.setState(state);
        const micBtn  = document.getElementById('mic-btn');
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
        el.textContent = text ? '› ' + text : '';
        el.style.opacity = text ? '1' : '0';
    }

    _setResponse(text) {
        const el = document.getElementById('response');
        el.textContent = text;
        el.style.opacity = '1';
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 300);
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

window.addEventListener('DOMContentLoaded', () => {
    window.jarvis = new JarvisApp();
});
