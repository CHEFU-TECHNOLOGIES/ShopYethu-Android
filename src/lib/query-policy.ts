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

export function queryPolicy(path: string) {
  const minute = 60_000, hour = 60 * minute, day = 24 * hour;
  const pathname = path.split('?')[0];
  let staleMs = day, maxAgeMs = 7 * day;
  if (pathname === '/me') staleMs = Infinity;
  else if (pathname === '/config') { staleMs = 7 * day; maxAgeMs = 30 * day; }
  else if (pathname === '/products') staleMs = 6 * hour;
  return { staleMs, maxAgeMs };
}

// A screen's use of saved data can need a newer snapshot than ordinary reuse.
// These checks run on focus/user actions, never on an idle timer or mere resume.
export function queryUsage(path: string, data?: unknown) {
  const minute = 60_000, hour = 60 * minute, pathname = path.split('?')[0];
  if (pathname.startsWith('/products/')) return 15 * minute;
  if (pathname.startsWith('/stores/')) return 6 * hour;
  if (pathname === '/seller/store') return hour;
  if (pathname.startsWith('/seller/products/')) return minute;
  if (pathname === '/orders' || pathname === '/seller/orders') {
    const orders = (data as { orders?: { status: string }[] } | undefined)?.orders;
    return pathname === '/seller/orders' || !orders?.length || orders.some(order => !['completed', 'collected', 'cancelled'].includes(order.status)) ? 2 * minute : 24 * hour;
  }
  return queryPolicy(path).staleMs;
}
