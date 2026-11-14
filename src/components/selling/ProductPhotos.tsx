import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from '@/components/market/Primitives';
import { palette, ui } from '@/constants/market-theme';
import { sellerStyles as styles } from '@/constants/seller-styles';
import { validPhotoUrl } from '@/lib/product-form';
import type { ProductFieldsProps } from './ProductDetails';

function Photo({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <View style={styles.errorPhoto}><Ionicons name="image-outline" size={25} color={palette.muted} /><Text style={[ui.small, styles.center]}>Photo unavailable</Text></View> : <Image accessibilityLabel="Product photo" source={{ uri: url }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} />;
}
export function ProductPhotos({ form, update, disabled, upload, uploading }: ProductFieldsProps & { upload: () => void; uploading: boolean }) {
  const [showLink, setShowLink] = useState(false), [link, setLink] = useState(''), [error, setError] = useState('');
  function addLink() {
    const value = link.trim();
    if (!validPhotoUrl(value)) { setError('Enter a valid HTTPS image link.'); return; }
    if (form.photos.includes(value)) { setError('This photo is already added.'); return; }
    update('photos', [...form.photos, value]); setLink(''); setError(''); setShowLink(false);
  }
  return <>
    <Text style={ui.subtitle}>Show your product at its best. The first photo is your cover.</Text>
    <Text style={ui.small}>{form.photos.length} of 5 photos · up to 2 MB per upload</Text>
    <View style={styles.photoGrid}>
      {form.photos.map((url, index) => <View key={`${url}:${index}`} style={{ width: '47%', gap: 5 }}>
        <View style={[styles.photo, { width: '100%' }]}>
          <Photo url={url} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${index + 1}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => update('photos', form.photos.filter((_, position) => index !== position))} style={styles.photoRemove}><Ionicons name="close" size={22} color={palette.ink} /></Pressable>
          {index === 0 && <View style={styles.cover}><Text style={styles.status}>COVER</Text></View>}
        </View>
        {index > 0 && <Pressable accessibilityRole="button" accessibilityLabel={`Use photo ${index + 1} as cover`} disabled={disabled} onPress={() => update('photos', [url, ...form.photos.filter((_, position) => position !== index)])} style={styles.photoFooter}><Text style={styles.linkText}>Make cover</Text></Pressable>}
      </View>)}
      {form.photos.length < 5 && <Pressable accessibilityRole="button" accessibilityLabel="Choose product photos" accessibilityState={{ disabled }} disabled={disabled} onPress={upload} style={styles.photoAdd}>
        {uploading ? <ActivityIndicator color={palette.brand} /> : <Ionicons name="add" size={28} color={palette.brand} />}
        <Text style={styles.linkText}>{uploading ? 'Adding photos…' : 'Add photos'}</Text>
      </Pressable>}
    </View>
    {!form.photos.length && <Text style={ui.small}>You can save a draft without photos. Add at least one before publishing.</Text>}
    {form.photos.length < 5 && <Pressable accessibilityRole="button" disabled={disabled} onPress={() => setShowLink(value => !value)} style={styles.link}><Text style={styles.linkText}>{showLink ? 'Hide image link' : 'Use an image link instead'}</Text></Pressable>}
    {showLink && form.photos.length < 5 && <View style={ui.card}>
      <Field label="Image link" placeholder="https://" value={link} onChangeText={setLink} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={2048} editable={!disabled} />
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      <Button title="Add image link" secondary disabled={disabled} onPress={addLink} />
    </View>}
  </>;
}
