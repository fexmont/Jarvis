# TUCCI™ — Landing page scherzosa

Sito celebrativo (e affettuosamente preso in giro) su **Jacopo Tucci**:
ingegnere metalmeccanico, "sviluppatore" di Jarvis (con l'AI), finto
palestrato, leggenda del calcio a 18 anni, marito di Greta (un videogioco)
e rivale del cane Tucci.

## Come aprirlo
Basta aprire `index.html` nel browser. È tutto statico, nessun server richiesto.

```bash
# oppure, per un server locale:
cd tucci
python3 -m http.server 8000
# poi vai su http://localhost:8000
```

## Sostituire i placeholder con le foto vere
Nella cartella `img/` ci sono dei placeholder `.svg`. Per usare le foto reali,
metti i file nella cartella `img/` e aggiorna i percorsi in `index.html`:

| Placeholder        | Sostituiscilo con            | Dove appare                |
|--------------------|------------------------------|----------------------------|
| `img/tucci.svg`    | foto di Tucci (dolcevita)    | Hero in alto               |
| `img/greta.svg`    | foto / screen di Greta       | Sezione "Vita privata"     |
| `img/cane.svg`     | foto del cane Tucci          | Sezione "Il cane"          |
| `img/aurora.svg`   | foto della cugina            | (disponibile, non in uso)  |

Esempio: rinomina la tua foto in `tucci.jpg`, mettila in `img/`, e in
`index.html` cambia `src="img/tucci.svg"` in `src="img/tucci.jpg"`.

## File
- `index.html` — la pagina
- `style.css` — stile (tema arancio/dark, ispirato alla parete della foto)
- `script.js` — animazioni e un easter egg (clicca 5 volte sulla foto di Tucci)
- `img/` — immagini

> Tutto questo sito è stato realizzato dall'intelligenza artificiale.
> Proprio come i "progetti" di Tucci. 🤖
