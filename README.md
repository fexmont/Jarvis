# JARVIS — Voice Assistant

Iron Man-style AI voice assistant con wake word "Hey Jarvis", animazione circolare e integrazione Claude AI.

## Setup rapido

### 1. Chiave API Anthropic
Apri `js/config.js` e sostituisci `YOUR_ANTHROPIC_API_KEY_HERE` con la tua chiave da [console.anthropic.com](https://console.anthropic.com).

### 2. Avvia il server locale
```bash
# Installa dipendenze opzionali
pip install Pillow      # per generare le icone
python generate_icons.py

# Avvia server HTTPS (necessario per il microfono su mobile)
python server.py
```

### 3. Apri su iPad
1. Apri Safari e vai su `https://IP_DEL_TUO_MAC:8443`
2. Accetta l'avviso del certificato (è self-signed)
3. Premi "Avvia Sistema"
4. Concedi l'accesso al microfono
5. Di' **"Hey Jarvis"** per attivarlo

### 4. Aggiungi alla schermata Home (iPad)
1. Safari → pulsante Condividi (□↑)
2. "Aggiungi alla schermata Home"
3. Si apre come app fullscreen senza barra del browser

---

## Funzionamento wake word su iPad chiuso

**Limitazione iOS:** Le web app non possono rimanere attive in background su iOS.

**Soluzione consigliata — Siri Shortcut:**
1. Apri l'app **Comandi** (Shortcuts) su iPad
2. Crea nuovo comando → **Apri App** → seleziona JARVIS dalla schermata Home
3. Assegna la frase: *"Hey Siri, apri Jarvis"*
4. Adesso anche con lo schermo spento dici "Hey Siri, apri Jarvis" e si apre direttamente

---

## Come usarlo
| Azione | Come fare |
|--------|-----------|
| Attivare | Di' "Hey Jarvis" (o tocca lo schermo) |
| Fare una domanda | Parla dopo la risposta di JARVIS |
| Interrompere | Tocca il pulsante 🎙 |
| Cancellare la memoria | Tocca il pulsante 🗑 |

---

## Struttura
```
Jarvis/
├── index.html          ← Interfaccia principale
├── manifest.json       ← PWA manifest
├── css/style.css       ← Stile Iron Man dark
├── js/
│   ├── config.js       ← Configurazione e chiave API
│   ├── canvas.js       ← Animazione circolare
│   ├── speech.js       ← Riconoscimento vocale + sintesi
│   ├── claude.js       ← Integrazione Claude AI
│   └── jarvis.js       ← Controller principale
├── assets/             ← Icone PNG (generate con generate_icons.py)
├── server.py           ← Server HTTPS locale
└── generate_icons.py   ← Generatore icone PWA
```

## Personalizzazione
Tutto in `js/config.js`:
- `WAKE_WORDS` — parole che attivano JARVIS (aggiungi "computer", "ehi", ecc.)
- `VOICE_LANG` — lingua (`it-IT`, `en-US`, ecc.)
- `GREETING_RESPONSES` — frasi di saluto casuali
- `SYSTEM_PROMPT` — personalità di JARVIS (modifica il tono, la lingua, il carattere)
- `CLAUDE_MODEL` — modello AI (`claude-sonnet-4-6`, `claude-opus-4-7`, ecc.)
