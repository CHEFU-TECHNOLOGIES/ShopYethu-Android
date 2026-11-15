import { Image, type ImageProps } from 'expo-image';
import { palette } from '@/constants/market-theme';

export function imageVariant(uri: string, width = 480) {
  // Preserve signed URLs and other hosts. Cloudinary's version/path/query remain intact.
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?!s--)/.test(uri)) return uri;
  return uri.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
export function MarketImage({ uri, width = 480, ...props }: Omit<ImageProps, 'source'> & { uri?: string; width?: number }) {
  return <Image {...props} source={uri ? { uri: imageVariant(uri, width) } : undefined}
    recyclingKey={uri || 'empty'} cachePolicy="memory-disk" contentFit="cover" transition={120}
    style={[{ backgroundColor: palette.soft }, props.style]} />;
}
