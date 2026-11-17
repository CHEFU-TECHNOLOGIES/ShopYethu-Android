export function publicQuery(path: string, method = 'GET') {
  return method === 'GET' && /^\/(config(?:\?|$)|products(?:\/|\?|$)|stores\/|areas\/)/.test(path);
}

export function canonicalPath(path: string) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.delete('updated'); // Older order screens used this as a cache buster.
  if (params.has('q')) params.set('q', params.get('q')!.trim().toLowerCase());
  for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
  params.sort();
  return pathname + (params.size ? `?${params}` : '');
}

// All screens reuse saved data, regardless of its age. A null timestamp means a
// known change invalidated the snapshot. Only missing/invalidated data or an
// explicit refresh requires a GET; mutations validate permissions server-side.
export function canReuseSnapshot(snapshot: { data: unknown; updatedAt: number | null }) {
  return snapshot.data !== null && snapshot.updatedAt !== null;
}
