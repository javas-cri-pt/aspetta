# Aspetta

PWA che assomiglia all'app Telefono iOS e impone 30 minuti d'attesa tra una
chiamata e l'altra verso un numero specifico.

## Uso locale
`python3 -m http.server 8080` poi apri http://localhost:8080

## Test
`node --test`

## Deploy (GitHub Pages)
1. Crea un repo su GitHub e fai push di questa cartella.
2. Settings → Pages → Source: branch `main`, cartella `/root`.
3. Apri l'URL su iPhone in Safari → Condividi → "Aggiungi a Home".
4. Al primo avvio inserisci nome e numero (restano solo sul tuo telefono).

## Privacy
Il numero non è nel codice: vive solo in localStorage sul tuo dispositivo.

## Icone
Le icone (`icon-180.png`, `icon-512.png`) si rigenerano aprendo
`tools/make-icon.html` nel browser e cliccando i due bottoni.
