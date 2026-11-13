import { useState } from 'react';
import { useDraft } from '@/hooks/use-draft';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Field, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useResource } from '@/hooks/use-resource';
import { categories } from '@/lib/config';
import type { Product } from '@/types/marketplace';
import { palette, ui } from '@/constants/market-theme';

export default function ProductEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const resource = useResource<{ products: Product[] }>('/seller/store', !!session);
  const [savedId, setSavedId] = useState(id);
  const product = resource.data?.products.find(item => item.id === id);
  const [form, setForm] = useDraft(`${session?.user.uid}:${id || 'new'}`, product
    ? { name: product.name, description: product.description, category: product.category, price: (product.priceCents / 100).toFixed(2), stock: String(product.stock), photos: product.photos, published: product.published }
    : { name: '', description: '', category: 'Other', price: '', stock: '', photos: [] as string[], published: false });
  const [photoUrl, setPhotoUrl] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  function addPhoto() {
    try {
      const url = new URL(photoUrl.trim());
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      if (form.photos.length >= 5) throw new Error();
      setForm(value => ({ ...value, photos: [...value.photos, url.toString()] })); setPhotoUrl(''); setError('');
    } catch { setError('Add a valid HTTPS image link. You can use up to five photos.'); }
  }
  async function save(published: boolean) {
    if (busy) return; setBusy(true); setNotice(''); setError('');
    const price = Number(form.price.replace(',', '.'));
    if (!form.price.trim() || !form.stock.trim() || !Number.isFinite(price)) { setError('Enter a valid price and stock quantity.'); setBusy(false); return; }
    try {
      const product = await api<Product>(`/seller/products${savedId ? `/${savedId}` : ''}`, { method: savedId ? 'PUT' : 'POST', body: JSON.stringify({ ...form, priceCents: Math.round(price * 100), stock: Number(form.stock), published, fulfilment: ['collection'] }) });
      setSavedId(product.id); setForm(value => ({ ...value, published })); setNotice(published ? 'Product published to your storefront.' : 'Product saved as a draft. It is hidden from shoppers.');
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  const missing = id && resource.data && !resource.data.products.some(product => product.id === id);
  async function uploadPhoto() {
    if (busy || form.photos.length >= 5) return;
    setBusy(true); setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7, allowsEditing: true });
      if (result.canceled) return;
      const image = result.assets[0]?.base64;
      if (!image || image.length > 2_800_000) throw new Error('Choose a photo smaller than 2 MB.');
      const uploaded = await api<{ url: string }>('/seller/photos', { method: 'POST', body: JSON.stringify({ image }) });
      setForm(value => ({ ...value, photos: [...value.photos, uploaded.url] }));
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  return <Page title={savedId ? 'Edit your product' : 'A new local find'} subtitle="Add the details customers need to shop with confidence." back>
    {!session ? <SignInNotice /> : <>
      <ResourceState {...resource} retry={resource.refresh} />
      {missing && <Text style={ui.error}>This product is not in your store.</Text>}
      {resource.data && !missing && <>
        <Text style={ui.badge}>{form.published ? 'Published' : 'Draft'}</Text>
        <Field label="Product name" value={form.name} onChangeText={name => setForm(value => ({ ...value, name }))} editable={!busy} />
        <Field label="Description" value={form.description} onChangeText={description => setForm(value => ({ ...value, description }))} multiline editable={!busy} />
        <Text style={ui.heading}>Category</Text><View style={[ui.row, { flexWrap: 'wrap' }]}>{categories.filter(value => value !== 'All').map(category => <Pressable disabled={busy} key={category} style={[ui.pill, form.category === category && ui.pillActive]} onPress={() => setForm(value => ({ ...value, category }))}><Text style={{ color: form.category === category ? '#fff' : palette.ink }}>{category}</Text></Pressable>)}</View>
        <Field label="Price in rand (R)" value={form.price} onChangeText={price => setForm(value => ({ ...value, price }))} keyboardType="decimal-pad" editable={!busy} />
        <Field label="Stock quantity" value={form.stock} onChangeText={stock => setForm(value => ({ ...value, stock }))} keyboardType="number-pad" editable={!busy} />
        <Text style={ui.heading}>Product photos</Text><Text style={ui.small}>Add up to five photos, smaller than 2 MB each. Uploads use Chefu’s image storage.</Text>
        <Button title={busy ? 'Please wait…' : 'Choose photo from device'} secondary disabled={busy || form.photos.length >= 5} onPress={() => void uploadPhoto()} />
        {form.photos.map((photo, index) => <View key={`${photo}-${index}`} style={ui.row}><Image source={{ uri: photo }} style={{ width: 75, height: 75, borderRadius: 10 }} /><View style={{ flex: 1 }}><Text style={ui.small} numberOfLines={2}>{photo}</Text><Button title="Remove photo" secondary disabled={busy} onPress={() => setForm(value => ({ ...value, photos: value.photos.filter((_, i) => i !== index) }))} /></View></View>)}
        <Field label="HTTPS photo URL" value={photoUrl} onChangeText={setPhotoUrl} autoCapitalize="none" keyboardType="url" editable={!busy} /><Button title="Add photo link" secondary disabled={busy || form.photos.length >= 5} onPress={addPhoto} />
        <View style={ui.card}><Text style={ui.heading}>Fulfilment</Text><Text style={ui.subtitle}>Collection from your store. Online payment and delivery integrations are not yet configured.</Text></View>
        {notice && <Text style={ui.body}>{notice}</Text>}{error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        <Button title={busy ? 'Saving…' : 'Publish product'} disabled={busy} onPress={() => void save(true)} /><Button title={form.published ? 'Unpublish & save draft' : 'Save draft'} secondary disabled={busy} onPress={() => void save(false)} />
      </>}
    </>}
  </Page>;
}
