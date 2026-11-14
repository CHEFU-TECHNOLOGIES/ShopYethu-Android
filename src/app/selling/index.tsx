import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Field, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { InventoryRow } from '@/components/selling/InventoryRow';
import { StoreOverview } from '@/components/selling/StoreOverview';
import { useSellerInventory } from '@/hooks/use-seller-inventory';
import { useAuth } from '@/lib/auth';
import { palette, ui } from '@/constants/market-theme';
import { sellerStyles as styles } from '@/constants/seller-styles';

export default function SellingScreen() {
  const { session } = useAuth();
  const resource = useSellerInventory();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const products = resource.data?.products || [];
  const visible = products.filter(product => (filter === 'All' || (filter === 'Published' ? product.published : !product.published)) && `${product.name} ${product.category}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <Page title="My Store" subtitle="A little business. A world of possibility." back onRefresh={session ? resource.refresh : undefined} refreshing={resource.loading}>
    {!session ? <SignInNotice /> : <>
      <ResourceState {...resource} retry={resource.refresh} />
      {!!resource.error && <Button title="View seller application" secondary onPress={() => router.push('/application')} />}
      {resource.data && <>
        <StoreOverview data={resource.data} />
        <View style={styles.actions}>
          <View style={styles.action}><Button title="Add product" onPress={() => router.push('/selling/product')} trailingIcon={<Ionicons name="add" size={19} color="#FFFFFF" />} /></View>
          <View style={styles.action}><Button title="Orders" secondary onPress={() => router.push('/selling/orders')} trailingIcon={<Ionicons name="receipt-outline" size={18} color={palette.brand} />} /></View>
        </View>
        {!products.length ? <View style={[ui.card, styles.empty]}>
          <View style={styles.emptyIcon}><Ionicons name="storefront-outline" size={32} color={palette.brand} /></View>
          <Text style={ui.heading}>Make your first listing</Text>
          <Text style={[ui.subtitle, styles.center]}>Add a few photos, a price and stock. Save a draft or publish when you’re ready.</Text>
        </View> : <>
          <Text style={ui.heading}>Your products</Text>
          <Field label="Find a product" placeholder="Search your products" value={search} onChangeText={setSearch} autoCorrect={false} />
          <View style={styles.tabs}>{['All', 'Published', 'Drafts'].map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[styles.tab, filter === value && styles.tabActive]}><Text style={[styles.tabText, filter === value && styles.tabActiveText]}>{value}</Text></Pressable>)}</View>
          {visible.map(product => <InventoryRow key={product.id} product={product} />)}
          {!visible.length && <Text style={ui.subtitle}>No products match this view. Try another filter or search.</Text>}
          {products.length >= 100 && <Text style={ui.small}>Showing the first 100 products.</Text>}
        </>}
      </>}
      <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.link}><Text style={styles.linkText}>Back to shopping</Text></Pressable>
    </>}
  </Page>;
}
