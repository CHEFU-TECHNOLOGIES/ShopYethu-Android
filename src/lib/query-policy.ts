export function publicQuery(path: string) {
  return /^\/(config(?:\?|$)|products(?:\/|\?|$)|stores\/)/.test(path);
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

export function queryPolicy(path: string, data?: unknown) {
  let staleMs = 120_000;
  if (path === '/me') staleMs = 300_000;
  else if (path === '/config') staleMs = 3_600_000;
  else if (path.startsWith('/stores/')) staleMs = 300_000;
  else if (path.startsWith('/products/')) staleMs = 60_000;
  else if (path.startsWith('/seller')) staleMs = 30_000;
  if (path.startsWith('/orders') || path === '/seller/orders') {
    const orders = (data as { orders?: { status: string }[] } | undefined)?.orders;
    staleMs = orders?.some(order => !['completed', 'collected', 'cancelled'].includes(order.status)) ? 30_000 : 120_000;
  }
  return { staleMs, maxAgeMs: publicQuery(path) ? 86_400_000 : 3_600_000 };
}
