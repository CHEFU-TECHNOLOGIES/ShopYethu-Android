import type { Storefront } from '@/types/marketplace';

type StoreForm = { name: string; description: string; area: string; areaPlaceId?: string };

export function storeHasChanges(store: Storefront | undefined, form: StoreForm) {
  if (!store) return false;
  // A resolved place label and autocomplete token are display/session data.
  // Only a different place ID changes the saved operating area.
  const areaChanged = (form.areaPlaceId || '') !== (store.areaPlaceId || '') ||
    !form.areaPlaceId && form.area.trim() !== (store.area || '').trim();
  return store.nameEditable === true && form.name.trim() !== store.name ||
    form.description.trim() !== (store.description || '').trim() || areaChanged;
}
