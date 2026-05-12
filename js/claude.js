class ClaudeClient {
    constructor() {
        this.apiKey = JARVIS_CONFIG.CLAUDE_API_KEY;
        this.model = JARVIS_CONFIG.CLAUDE_MODEL;
        this.history = [];
    }

    async ask(userMessage) {
        if (this.apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
            return this._fallback(userMessage);
        }

        this.history.push({ role: 'user', content: userMessage });

        // Keep history short for voice conversations
        if (this.history.length > 10) {
            this.history = this.history.slice(-8);
        }

        const body = {
            model: this.model,
            max_tokens: JARVIS_CONFIG.MAX_TOKENS,
            system: JARVIS_CONFIG.SYSTEM_PROMPT,
            messages: this.history
        };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), JARVIS_CONFIG.TIMEOUT_MS);

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
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
            const reply = data.content?.[0]?.text?.trim() || 'Non ho ricevuto risposta.';
            this.history.push({ role: 'assistant', content: reply });
            return reply;

        } catch (err) {
            clearTimeout(timer);
            if (err.name === 'AbortError') {
                return 'Mi dispiace, la richiesta ha impiegato troppo tempo. Riprovi.';
            }
            console.error('Claude API error:', err);
            return `Si è verificato un errore: ${err.message}`;
        }
    }

    _fallback(input) {
        // Local responses when no API key configured
        const lower = input.toLowerCase();
        if (lower.includes('ora') || lower.includes('ore') || lower.includes('time')) {
            const t = new Date();
            return `Sono le ${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}, sir.`;
        }
        if (lower.includes('data') || lower.includes('giorno')) {
            const d = new Date();
            return `Oggi è ${d.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}.`;
        }
        if (lower.includes('ciao') || lower.includes('salve') || lower.includes('hello')) {
            return 'Buonasera. Tutti i sistemi sono operativi e in attesa dei suoi ordini.';
        }
        if (lower.includes('come stai') || lower.includes('come va')) {
            return 'Tutti i sistemi operano al 100% di efficienza, sir. Lei come sta?';
        }
        if (lower.includes('grazie')) {
            return 'Prego, sir. È un piacere servirla.';
        }
        return 'Per rispondere in modo intelligente ho bisogno di una chiave API Anthropic. Configuri la sua chiave in config.js.';
    }

    clearHistory() {
        this.history = [];
    }
}
