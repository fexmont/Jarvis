class ClaudeClient {
    constructor() {
        this.apiKey = JARVIS_CONFIG.GROQ_API_KEY;
        this.model = JARVIS_CONFIG.GROQ_MODEL;
        this.history = [];
        this.userName = '';
        this.systemPrompt = JARVIS_CONFIG.buildSystemPrompt('');
    }

    setKey(key) {
        this.apiKey = key;
    }

    setUserName(name) {
        this.userName = name || '';
        this.systemPrompt = JARVIS_CONFIG.buildSystemPrompt(this.userName);
    }

    async ask(userMessage) {
        if (!this.apiKey || this.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
            return this._fallback(userMessage);
        }

        this.history.push({ role: 'user', content: userMessage });
        if (this.history.length > 20) {
            this.history = this.history.slice(-16);
        }

        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.history
        ];

        const body = {
            model: this.model,
            messages,
            max_tokens: JARVIS_CONFIG.MAX_TOKENS,
            temperature: 0.75
        };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), JARVIS_CONFIG.TIMEOUT_MS);

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timer);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content?.trim() || 'Non ho ricevuto risposta.';
            this.history.push({ role: 'assistant', content: reply });
            return reply;

        } catch (err) {
            clearTimeout(timer);
            if (err.name === 'AbortError') {
                return 'La richiesta ha impiegato troppo tempo. Riprovi.';
            }
            console.error('Groq API error:', err);
            return `Errore di connessione: ${err.message}`;
        }
    }

    _fallback(input) {
        const n = this.userName || 'sir';
        const lower = input.toLowerCase();
        if (lower.includes('ora') || lower.includes('ore')) {
            const t = new Date();
            return `Sono le ${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}, ${n}.`;
        }
        if (lower.includes('data') || lower.includes('giorno')) {
            const d = new Date();
            return `Oggi è ${d.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}.`;
        }
        if (lower.includes('ciao') || lower.includes('salve')) {
            return `Ciao ${n}. Chiave API non configurata — aggiungila nelle impostazioni.`;
        }
        if (lower.includes('come stai') || lower.includes('come va')) {
            return 'Tutti i sistemi operano al massimo dell\'efficienza.';
        }
        if (lower.includes('grazie')) {
            return `Prego, ${n}.`;
        }
        return 'Chiave API Groq non configurata. Aprire le impostazioni per aggiungerla.';
    }

    clearHistory() {
        this.history = [];
    }
}
