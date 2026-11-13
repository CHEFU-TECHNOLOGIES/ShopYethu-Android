import { useState, type SetStateAction } from 'react';

// Initialize from loaded records without an extra render/effect. An account or
// record change cannot reuse another identity's unsaved form values.
export function useDraft<T>(key: string, initial: T): [T, (update: SetStateAction<T>) => void] {
  const [draft, setDraft] = useState<{ key: string; value: T } | null>(null);
  const value = draft?.key === key ? draft.value : initial;
  function update(next: SetStateAction<T>) {
    setDraft(current => {
      const previous = current?.key === key ? current.value : initial;
      return { key, value: typeof next === 'function' ? (next as (value: T) => T)(previous) : next };
    });
  }
  return [value, update];
}
