class JarvisSpeech {
    constructor() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.supported = !!SR;
        this.recognition = this.supported ? new SR() : null;
        this.synth = window.speechSynthesis;
        this.isListening = false;
        this.isActive = false;
        this.onWakeWord = null;
        this.onTranscript = null;
        this.onAudioLevel = null;
        this.onFrequencyData = null;
        this.onEnd = null;
        this.restartTimer = null;
        this.preferredVoice = null;
        this.audioCtx = null;
        this.analyser = null;
        this.micStream = null;
        this.levelTimer = null;
        this.elevenLabsKey = null;
        this._elevenAudio = null;

        if (this.recognition) this._configureRecognition();
        this._loadVoices();
    }

    _configureRecognition() {
        const r = this.recognition;
        r.lang = JARVIS_CONFIG.VOICE_LANG;
        r.continuous = true;
        r.interimResults = true;
        r.maxAlternatives = 1;
        r.onresult = (e) => this._handleResult(e);
        r.onerror  = (e) => this._handleError(e);
        r.onend    = ()  => this._handleEnd();
    }

    _handleResult(event) {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript.toLowerCase().trim();
            if (event.results[i].isFinal) final += text + ' ';
            else interim += text;
        }
        const combined = (final + interim).trim();
        if (!this.isActive) {
            if (JARVIS_CONFIG.WAKE_WORDS.some(w => combined.includes(w))) {
                this.isActive = true;
                if (this.onWakeWord) this.onWakeWord();
            }
            return;
        }
        if (final.trim() && this.onTranscript) {
            this.onTranscript(final.trim());
            this.isActive = false;
        }
    }

    _handleError(event) {
        if (event.error === 'no-speech') return;
        if (event.error === 'not-allowed') {
            if (this.onEnd) this.onEnd('permission-denied');
        }
    }

    _handleEnd() {
        this.isListening = false;
        if (this._shouldRestart) {
            this.restartTimer = setTimeout(() => this.start(), 300);
        }
    }

    start() {
        if (!this.supported || this.isListening) return;
        this._shouldRestart = true;
        try { this.recognition.start(); this.isListening = true; this._startAudioMonitor(); } catch (_) {}
    }

    stop() {
        this._shouldRestart = false;
        this.isListening = false;
        clearTimeout(this.restartTimer);
        if (this.recognition) { try { this.recognition.stop(); } catch (_) {} }
        this._stopAudioMonitor();
    }

    resetWakeWord() { this.isActive = false; }

    async _startAudioMonitor() {
        if (this.audioCtx) return;
        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioCtx.createMediaStreamSource(this.micStream);
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 128;
            source.connect(this.analyser);
            const data = new Uint8Array(this.analyser.frequencyBinCount);
            const tick = () => {
                if (!this.analyser) return;
                this.analyser.getByteFrequencyData(data);
                const avg = data.reduce((s, v) => s + v, 0) / data.length;
                if (this.onAudioLevel) this.onAudioLevel(avg / 128);
                if (this.onFrequencyData) this.onFrequencyData(data);
                this.levelTimer = requestAnimationFrame(tick);
            };
            this.levelTimer = requestAnimationFrame(tick);
        } catch (_) {}
    }

    _stopAudioMonitor() {
        if (this.analyser)   { this.analyser.disconnect(); this.analyser = null; }
        if (this.micStream)  { this.micStream.getTracks().forEach(t => t.stop()); this.micStream = null; }
        if (this.audioCtx)   { this.audioCtx.close(); this.audioCtx = null; }
        if (this.levelTimer) { cancelAnimationFrame(this.levelTimer); this.levelTimer = null; }
    }

    _loadVoices() {
        const pick = () => {
            const voices = this.synth.getVoices();
            for (const name of JARVIS_CONFIG.PREFERRED_VOICE_NAMES) {
                const found = voices.find(v => v.name.includes(name));
                if (found) { this.preferredVoice = found; return; }
            }
            const lang = JARVIS_CONFIG.VOICE_LANG.split('-')[0];
            this.preferredVoice = voices.find(v => v.lang.startsWith(lang))
                || voices.find(v => v.lang.startsWith('en'))
                || voices[0] || null;
        };
        pick();
        if (this.synth.onvoiceschanged !== undefined) this.synth.onvoiceschanged = pick;
    }

    speak(text, onDone) {
        if (!text) { if (onDone) onDone(); return; }
        if (this.elevenLabsKey) {
            this._speakElevenLabs(text, onDone);
        } else {
            this._speakWebSpeech(text, onDone);
        }
    }

    _speakWebSpeech(text, onDone) {
        this.synth.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.voice  = this.preferredVoice;
        utt.lang   = JARVIS_CONFIG.VOICE_LANG;
        utt.pitch  = JARVIS_CONFIG.VOICE_PITCH;
        utt.rate   = JARVIS_CONFIG.VOICE_RATE;
        utt.volume = JARVIS_CONFIG.VOICE_VOLUME;
        utt.onend  = () => { if (onDone) onDone(); };
        utt.onerror= () => { if (onDone) onDone(); };
        this.synth.speak(utt);
    }

    async _speakElevenLabs(text, onDone) {
        const VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // Daniel — deep British
        try {
            const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenLabsKey
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.2 }
                })
            });
            if (!res.ok) throw new Error('ElevenLabs ' + res.status);
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            this._elevenAudio = new Audio(url);
            this._elevenAudio.onended = () => { URL.revokeObjectURL(url); if (onDone) onDone(); };
            this._elevenAudio.onerror = () => { if (onDone) onDone(); };
            this._elevenAudio.play();
        } catch (err) {
            console.error('ElevenLabs:', err);
            this._speakWebSpeech(text, onDone);
        }
    }

    stopSpeaking() {
        this.synth.cancel();
        if (this._elevenAudio) { this._elevenAudio.pause(); this._elevenAudio = null; }
    }
}
