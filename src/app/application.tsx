import { useState } from 'react';
import { useDraft } from '@/hooks/use-draft';
import { Text, View } from 'react-native';
import { Button, Field, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useResource } from '@/hooks/use-resource';
import type { SellerApplication, Storefront } from '@/types/marketplace';
import { statusLabel, ui } from '@/constants/market-theme';

export default function ApplicationScreen() {
  const { session } = useAuth();
  const resource = useResource<{ application: SellerApplication | null; store: Storefront | null }>('/me', !!session);
  const previous = resource.data?.application;
  const [form, setForm] = useDraft(`${session?.user.uid}:${previous?.updatedAt || 'new'}`, previous
    ? { businessName: previous.businessName, contactName: previous.contactName, email: previous.email, phone: previous.phone, area: previous.area, plans: previous.plans, response: '' }
    : { businessName: '', contactName: session?.user.name || '', email: session?.user.email || '', phone: '', area: '', plans: '', response: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [submitted, setSubmitted] = useState(false);
  const application = resource.data?.application;
  async function submit() {
    if (busy) return; setBusy(true); setError('');
    try { await api('/application', { method: 'POST', body: JSON.stringify(form) }); setSubmitted(true); resource.refresh(); }
    catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  return <Page title="Start something local." subtitle="Tell us about your business. CheFu reviews every application." back>
    {!session ? <SignInNotice /> : <>
      <ResourceState {...resource} retry={resource.refresh} />
      {submitted && <View style={ui.card}><Text style={ui.heading}>Application submitted</Text><Text style={ui.subtitle}>Pending review. You can keep shopping; refresh your account to check for updates.</Text></View>}
      {application && <View style={ui.card}><Text style={ui.heading}>{statusLabel(application.status)}</Text>{!!application.reason && <Text style={ui.subtitle}>{application.reason}</Text>}</View>}
      {resource.data && (!application || application.status === 'more-info') && <>
        {([['businessName', 'Business or trading name'], ['contactName', 'Contact name'], ['email', 'Contact email'], ['phone', 'Contact phone'], ['area', 'Operating area'], ['plans', 'What do you plan to sell?']] as const).map(([key, label]) => <Field key={key} label={label} value={form[key]} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} multiline={key === 'plans'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} autoCapitalize={key === 'email' ? 'none' : 'sentences'} editable={!busy} />)}
        {application?.status === 'more-info' && <Field label="Your response to CheFu" value={form.response} onChangeText={response => setForm(current => ({ ...current, response }))} multiline editable={!busy} />}
        {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        <Button title={busy ? 'Submitting…' : application ? 'Resubmit application' : 'Submit application'} disabled={busy} onPress={() => void submit()} />
      </>}
    </>}
  </Page>;
}
