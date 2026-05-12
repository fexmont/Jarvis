class ClaudeClient {
    constructor() {
        this.apiKey = JARVIS_CONFIG.GROQ_API_KEY;
        this.model = JARVIS_CONFIG.GROQ_MODEL;
        this.history = [];
    }

    async ask(userMessage) {
        if (!this.apiKey || this.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
            return this._fallback(userMessage);
        }

        this.history.push({ role: 'user', content: userMessage });
        if (this.history.length > 10) {
            this.history = this.history.slice(-8);
        }

        const messages = [
            { role: 'system', content: JARVIS_CONFIG.SYSTEM_PROMPT },
            ...this.history
        ];

        const body = {
            model: this.model,
            messages,
            max_tokens: JARVIS_CONFIG.MAX_TOKENS,
            temperature: 0.7
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
                return 'Mi dispiace, la richiesta ha impiegato troppo tempo. Riprovi.';
            }
            console.error('Groq API error:', err);
            return `Errore di connessione: ${err.message}`;
        }
    }

    _fallback(input) {
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
            return 'Tutti i sistemi operano al 100% di efficienza, sir.';
        }
        if (lower.includes('grazie')) {
            return 'Prego, sir. È un piacere servirla.';
        }
        return 'Chiave API Groq non configurata. Aggiungila in js/config.js per attivare le risposte AI.';
    }

    clearHistory() {
        this.history = [];
    }
}
