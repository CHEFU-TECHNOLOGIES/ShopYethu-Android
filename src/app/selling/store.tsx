import { useState } from 'react';
import { useDraft } from '@/hooks/use-draft';
import { Text } from 'react-native';
import { Button, Field, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useResource } from '@/hooks/use-resource';
import type { Storefront } from '@/types/marketplace';
import { ui } from '@/constants/market-theme';

export default function StoreEditor() {
  const { session } = useAuth();
  const resource = useResource<{ store: Storefront }>('/seller/store', !!session);
  const initial = resource.data?.store;
  const [form, setForm] = useDraft(`${session?.user.uid}:${initial?.id || 'store'}`, { name: initial?.name || '', description: initial?.description || '', area: initial?.area || '' });
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  async function save() {
    if (busy) return; setBusy(true); setNotice(''); setError('');
    try { await api('/seller/store', { method: 'PUT', body: JSON.stringify(form) }); setNotice('Your storefront has been updated.'); }
    catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  return <Page title="Your storefront" subtitle="Give customers a little insight into your business." back>
    {!session ? <SignInNotice /> : <><ResourceState {...resource} retry={resource.refresh} />{resource.data && <>
      <Field label="Store name" value={form.name} onChangeText={name => setForm(value => ({ ...value, name }))} editable={!busy} />
      <Field label="About your store" value={form.description} multiline onChangeText={description => setForm(value => ({ ...value, description }))} editable={!busy} />
      <Field label="Operating area" value={form.area} onChangeText={area => setForm(value => ({ ...value, area }))} editable={!busy} />
      {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{notice && <Text style={ui.body}>{notice}</Text>}
      <Button title={busy ? 'Saving…' : 'Save storefront'} disabled={busy} onPress={() => void save()} />
    </>}</>}
  </Page>;
}
