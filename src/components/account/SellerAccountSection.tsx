import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { AccountRow, AccountSection } from './AccountMenu';
import { account } from '@/constants/account-styles';
import { statusLabel } from '@/constants/market-theme';
import type { SellerApplication, Storefront } from '@/types/marketplace';

export type SellerAccount = { application: SellerApplication | null; store: Storefront | null };
type Tone = 'neutral' | 'success' | 'attention' | 'danger';

function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <View style={[
      account.status,
      tone === 'success' && account.statusSuccess,
      tone === 'attention' && account.statusAttention,
      tone === 'danger' && account.statusDanger,
    ]}>
      <Text style={[
        account.statusText,
        tone === 'success' && account.statusSuccessText,
        tone === 'attention' && account.statusAttentionText,
        tone === 'danger' && account.dangerText,
      ]}>{label}</Text>
    </View>
  );
}

export function SellerAccountSection({ data, loading, error, onRetry }: {
  data: SellerAccount | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const store = data?.store;
  const application = data?.application;

  return (
    <AccountSection title="Selling">
      {loading ? (
        <View style={account.loading}><Text style={account.message}>Loading seller status…</Text></View>
      ) : error ? (
        <>
          <Text accessibilityRole="alert" style={account.sellerError}>{error}</Text>
          <AccountRow icon="refresh-cw" title="Try again" onPress={onRetry} trailingIcon={null} />
        </>
      ) : store ? (
        <>
          <AccountRow icon="briefcase" title="My Store" description={store.name} onPress={() => router.push('/selling')} />
          <View style={account.statusBody}>
            <StatusPill label={store.status === 'active' ? 'Active seller' : 'Selling suspended'} tone={store.status === 'active' ? 'success' : 'danger'} />
            {!!store.reason && <Text style={account.message}>{store.reason}</Text>}
          </View>
        </>
      ) : application ? (
        <>
          <AccountRow
            icon={application.status === 'more-info' ? 'edit-3' : 'file-text'}
            title={application.status === 'more-info' ? 'Update application' : 'Seller application'}
            description={application.businessName}
            onPress={() => router.push('/application')}
          />
          <View style={account.statusBody}>
            <StatusPill
              label={statusLabel(application.status)}
              tone={application.status === 'approved' ? 'success' : application.status === 'more-info' ? 'attention' : application.status === 'rejected' ? 'danger' : 'neutral'}
            />
            {!!application.reason ? <Text style={account.message}>{application.reason}</Text> : application.status === 'pending' && (
              <Text style={account.message}>Your application is under review. You can keep shopping.</Text>
            )}
          </View>
        </>
      ) : data ? (
        <AccountRow icon="briefcase" title="Start selling" description="Apply to open your store" onPress={() => router.push('/application')} />
      ) : null}
    </AccountSection>
  );
}
