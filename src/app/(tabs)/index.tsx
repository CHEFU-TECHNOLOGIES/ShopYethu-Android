import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Page, ResourceState } from '@/components/market/Primitives';
import { ProductCard } from '@/components/market/ProductCard';
import { home } from '@/constants/home-styles';
import { palette } from '@/constants/market-theme';
import { categories } from '@/lib/config';
import { useResource } from '@/hooks/use-resource';
import type { Product } from '@/types/marketplace';

export default function ShopScreen() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const resource = useResource<{ products: (Product & { storeName: string })[] }>(
    `/products?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category === 'All' ? '' : category)}`,
  );

  return (
    <Page
      title="ShopYethu"
      header={
        <View style={home.brand}>
          <Image source={require('@/assets/images/shopyethu-icon.png')} style={home.icon} />
          <Text accessibilityRole="header" style={home.name}>ShopYethu</Text>
        </View>
      }
      onRefresh={resource.refresh}
      refreshing={resource.loading}
    >
      <TextInput
        accessibilityLabel="Search products"
        placeholder="Search products"
        placeholderTextColor={palette.muted}
        value={search}
        onChangeText={setSearch}
        style={home.search}
        returnKeyType="search"
        autoCorrect={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={home.categories}
      >
        {categories.map(item => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: category === item }}
            onPress={() => setCategory(item)}
            style={[home.category, category === item && home.selectedCategory]}
          >
            <Text style={[home.categoryText, category === item && home.selectedText]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text accessibilityRole="header" style={home.sectionTitle}>
        {query ? 'Search results' : category === 'All' ? 'Products' : category}
      </Text>
      <ResourceState
        {...resource}
        retry={resource.refresh}
        empty={resource.data?.products.length === 0 ? 'No products found. Try another search or category.' : undefined}
      />
      <View style={home.products}>
        {resource.data?.products.map(product => <ProductCard key={product.id} product={product} />)}
      </View>
    </Page>
  );
}
