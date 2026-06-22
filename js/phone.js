export function normalizeNumber(s) {
  return String(s ?? '').replace(/\D/g, '');
}

export function sameNumber(a, b) {
  const ta = normalizeNumber(a).slice(-9);
  const tb = normalizeNumber(b).slice(-9);
  // Richiedi almeno 9 cifre: evita falsi match su numeri corti digitati dal
  // tastierino (es. "1234") che per caso coincidono col finale del suo numero.
  return ta.length >= 9 && ta === tb;
}

export function gateStatus(calls, numeroTarget, minutiAttesa, now) {
  const waitMs = (minutiAttesa ?? 30) * 60 * 1000;
  const suoi = (calls ?? []).filter((c) => sameNumber(c.numero, numeroTarget));
  if (suoi.length === 0) return { blocked: false, remainingMs: 0 };
  const ultima = Math.max(...suoi.map((c) => c.timestamp));
  const trascorso = now - ultima;
  if (trascorso >= waitMs) return { blocked: false, remainingMs: 0 };
  return { blocked: true, remainingMs: waitMs - trascorso };
}

export function isBloccato(numero, config) {
  return (config?.bloccati || []).some((b) => sameNumber(b, numero));
}
