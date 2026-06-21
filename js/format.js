export function countdown(ms) {
  const tot = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(tot / 60);
  const s = tot % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(m)}:${pad(s)}`;
}

const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

function stessoGiorno(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function relativeTime(ts, now) {
  const d = new Date(ts);
  const n = new Date(now);
  const pad = (x) => String(x).padStart(2, '0');
  if (stessoGiorno(d, n)) return `oggi ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const ieri = new Date(n);
  ieri.setDate(n.getDate() - 1);
  if (stessoGiorno(d, ieri)) return 'ieri';
  const diffGiorni = Math.floor((n - d) / (24 * 60 * 60 * 1000));
  if (diffGiorni < 7) return GIORNI[d.getDay()];
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
