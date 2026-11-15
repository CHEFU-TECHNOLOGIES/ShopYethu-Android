import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ResourceState } from '@/components/market/Primitives';
import { CatalogSkeleton } from '@/components/market/CatalogSkeleton';
import { ProductCard } from '@/components/market/ProductCard';
import { home } from '@/constants/home-styles';
import { palette, ui } from '@/constants/market-theme';
import { categories } from '@/lib/config';
import { useProductFeed } from '@/hooks/use-product-feed';

export default function ShopScreen() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const resource = useProductFeed(
    `/products?page=1&view=compact&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category === 'All' ? '' : category)}`,
  );

  return (
    <SafeAreaView style={ui.page} edges={['top']}>
    <FlatList
      data={resource.data?.products || []}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ProductCard product={item} />}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      contentContainerStyle={[ui.content, { gap: 0 }]}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onRefresh={resource.refresh}
      refreshing={resource.refreshing}
      ListHeaderComponent={<View style={{ gap: 18, paddingBottom: 18 }}>
        <View style={home.brand}>
          <Image source={require('@/assets/images/shopyethu-icon.png')} style={home.icon} />
          <Text accessibilityRole="header" style={home.name}>ShopYethu</Text>
        </View>
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
      {!resource.data && resource.loading ? <CatalogSkeleton /> : <ResourceState
        {...resource}
        retry={resource.refresh}
        empty={resource.data?.products.length === 0 ? resource.data.nextCursor ? 'No matches on this page. Load more to keep searching.' : 'No products found. Try another search or category.' : undefined}
      />}
      </View>}
      ListFooterComponent={resource.data?.nextCursor ? <Button title={resource.loadingMore ? 'Loading more…' : 'Load more products'} secondary disabled={resource.loadingMore} onPress={() => void resource.more()} /> : undefined}
    />
    </SafeAreaView>
  );
}
