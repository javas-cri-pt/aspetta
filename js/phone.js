export function normalizeNumber(s) {
  return String(s ?? '').replace(/\D/g, '');
}

export function sameNumber(a, b) {
  const ta = normalizeNumber(a).slice(-9);
  const tb = normalizeNumber(b).slice(-9);
  return ta.length > 0 && ta === tb;
}
