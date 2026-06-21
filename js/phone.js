export function normalizeNumber(s) {
  return String(s ?? '').replace(/\D/g, '');
}

export function sameNumber(a, b) {
  const ta = normalizeNumber(a).slice(-9);
  const tb = normalizeNumber(b).slice(-9);
  return ta.length > 0 && ta === tb;
}

export function gateStatus(calls, config, now) {
  const waitMs = (config.minutiAttesa ?? 30) * 60 * 1000;
  const suoi = (calls ?? []).filter((c) => sameNumber(c.numero, config.numero));
  if (suoi.length === 0) return { blocked: false, remainingMs: 0 };
  const ultima = Math.max(...suoi.map((c) => c.timestamp));
  const trascorso = now - ultima;
  if (trascorso >= waitMs) return { blocked: false, remainingMs: 0 };
  return { blocked: true, remainingMs: waitMs - trascorso };
}
