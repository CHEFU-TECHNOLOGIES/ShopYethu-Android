import { Pressable, Text, View } from 'react-native';
import { Field } from '@/components/market/Primitives';
import { applicationStyles as styles } from '@/constants/application-styles';
import { ui } from '@/constants/market-theme';
import type { ApplicationFieldsProps } from './ApplicationFields';

export function ApplicationReview({ form, email, disabled, update, edit, requested }: ApplicationFieldsProps & { edit: (step: number) => void; requested?: string }) {
  const sections = [
    { title: 'Business', lines: [form.businessName, form.businessType === 'individual' ? 'Individual / sole trader' : 'Registered business', `Operating area: ${form.area}`] },
    { title: 'Products', lines: [form.categories.join(' · '), form.plans] },
    { title: 'Contact & pickup', lines: [form.contactName, email, form.phone, form.phoneConfirmed ? 'Business contact number confirmed by you' : 'Contact number needs confirmation', form.collectionOffered ? `Collection: ${form.collectionArea}` : 'No collection', ...(form.collectionOffered ? [form.pickupHours] : [])] },
  ];
  return <>
    <Text style={ui.subtitle}>Check your details before sending your application for review.</Text>
    {sections.map((section, index) => <View key={section.title} style={ui.card}>
      <View style={styles.top}>
        <Text style={ui.heading}>{section.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${section.title.toLowerCase()}`} disabled={disabled} onPress={() => edit(index)} style={styles.link}><Text style={styles.linkText}>Edit</Text></Pressable>
      </View>
      <View style={styles.summary}>{section.lines.map((line, lineIndex) => <Text key={lineIndex} style={styles.detail}>{line}</Text>)}</View>
    </View>)}
    {requested !== undefined && <>
      <View style={ui.card}><Text style={ui.heading}>More information requested</Text><Text style={ui.subtitle}>{requested}</Text></View>
      <Field label="Your response" value={form.response} onChangeText={value => update('response', value)} multiline maxLength={2000} editable={!disabled} />
    </>}
    <Text style={ui.small}>Your application will be reviewed before selling is enabled. You can keep shopping while you wait.</Text>
  </>;
}
