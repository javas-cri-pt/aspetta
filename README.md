# Aspetta

PWA dialer in stile iOS con un timer di cortesia tra le chiamate verso un
contatto configurato. Local-first, zero dipendenze, funziona offline.

## Uso locale
`python3 -m http.server 8080` poi apri http://localhost:8080

## Test
`node --test`

## Deploy (GitHub Pages)
1. Push di questa cartella su un repo GitHub.
2. Settings → Pages → Source: branch `main`, cartella `/root`.
3. Apri l'URL su iPhone in Safari → Condividi → "Aggiungi a Home".
4. Al primo avvio inserisci i dati del contatto (restano solo sul tuo dispositivo).

## Privacy
Nessun dato di contatto è nel codice: vive solo in localStorage sul dispositivo.

## Icone
Le icone (`icon-180.png`, `icon-512.png`) si rigenerano aprendo
`tools/make-icon.html` nel browser e cliccando i due bottoni.
