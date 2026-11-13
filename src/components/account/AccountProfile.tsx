import { Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Button } from '@/components/market/Primitives';
import { account } from '@/constants/account-styles';
import { palette } from '@/constants/market-theme';
import type { Session } from '@/lib/session';

export function AccountIdentity({ user }: { user: Session['user'] }) {
  const name = user.name.trim() || user.email;
  const words = name.split(/\s+/);
  const initials = (words.length > 1 ? [words[0], words[words.length - 1]] : [words[0]])
    .map(word => Array.from(word)[0]).join('').toLocaleUpperCase();

  return (
    <View style={account.profile}>
      <View style={account.avatar} accessible={false}>
        <Text style={account.initials}>{initials}</Text>
      </View>
      <View style={account.identity}>
        <Text style={account.name}>{name}</Text>
        {name !== user.email && <Text style={account.email}>{user.email}</Text>}
      </View>
    </View>
  );
}

export function AccountSignIn({ busy, onSignIn }: { busy: boolean; onSignIn: () => void }) {
  return (
    <View style={account.signIn}>
      <View style={account.guestAvatar}>
        <Feather name="user" size={27} color={palette.brand} accessible={false} />
      </View>
      <View style={account.signInCopy}>
        <Text style={account.signInTitle}>Your account, all in one place.</Text>
        <Text style={account.signInDescription}>
          Sign in to track your orders and manage your store.
        </Text>
      </View>
      <Button
        title={busy ? 'Signing in…' : 'Continue'}
        disabled={busy}
        onPress={onSignIn}
        trailingIcon={!busy && <Feather name="external-link" size={17} color={palette.paper} accessible={false} />}
      />
    </View>
  );
}
