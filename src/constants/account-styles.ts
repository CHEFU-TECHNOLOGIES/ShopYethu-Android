import { StyleSheet } from 'react-native';
import { palette } from './market-theme';

// Supporting tints that sit beside the green theme. Kept local so market-theme stays untouched.
const tint = {
    danger: '#F8EFEC',
    dangerLine: '#EBD3CC',
    success: '#DCFCE7',
    successText: '#166534',
    review: '#FFF3CD',
    reviewText: '#805B15',
    attention: '#FCE5D4',
    attentionText: '#8A461B',
    rejected: '#FDE8E7',
    neutral: '#F0F1EB',
};

// Keep dividers aligned with the row text.
const ROW_PADDING_X = 16;
const ROW_GAP = 14;

export const account = StyleSheet.create({
    settings: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    settingsFixed: { gap: 12 },
    settingsScroll: { flex: 1 },
    settingsScrollContent: { gap: 18, paddingTop: 18, paddingBottom: 36 },
    profileDivider: {
        height: 2,
        borderRadius: 1,
        backgroundColor: palette.line,
        marginTop: 4,
        marginHorizontal: -20,
        shadowColor: palette.brand,
        shadowOpacity: 0.18,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
    heading: { fontSize: 30, lineHeight: 38, fontWeight: '700', letterSpacing: -0.7, color: palette.ink },
    refresh: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
        backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line,
    },
    pressed: { backgroundColor: palette.soft },
    disabled: { opacity: 0.5 },

    // Sections and rows
    section: { gap: 10, marginTop: 8 },
    sectionTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: '700', marginLeft: 6, letterSpacing: -0.1 },
    group: { backgroundColor: palette.paper, borderRadius: 18, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' },
    row: {
        minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: ROW_GAP,
        paddingVertical: 14, paddingHorizontal: ROW_PADDING_X,
    },
    rowText: { flex: 1, minWidth: 0, gap: 2 },
    rowTitle: { color: palette.ink, fontSize: 16, lineHeight: 22, fontWeight: '600' },
    rowTitleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    rowTitleWithAccessory: { flexShrink: 1 },
    rowDescription: { color: palette.muted, fontSize: 13, lineHeight: 18 },
    separator: {
        height: StyleSheet.hairlineWidth, backgroundColor: palette.line,
        marginLeft: ROW_PADDING_X, marginRight: 0,
    },
    dangerText: { color: palette.danger },

    // Seller status
    statusBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
    status: {
        alignSelf: 'flex-start',
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        width: 'auto',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: tint.neutral,
    },
    statusText: { color: palette.muted, fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.1 },
    statusSuccess: { backgroundColor: palette.soft },
    statusSuccessText: { color: palette.brand },
    statusActive: { backgroundColor: tint.success },
    statusActiveText: { color: tint.successText },
    statusReview: { backgroundColor: tint.review },
    statusReviewText: { color: tint.reviewText },
    statusAttention: { backgroundColor: tint.attention },
    statusAttentionText: { color: tint.attentionText },
    statusDanger: { backgroundColor: tint.rejected },
    statusRefreshing: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 2 },
    statusRefreshingText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
    message: { color: palette.muted, fontSize: 14, lineHeight: 21 },

    // Loading and error states
    error: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16,
        backgroundColor: tint.danger, borderWidth: 1, borderColor: tint.dangerLine,
    },
    errorText: { flex: 1, color: palette.danger, fontSize: 14, lineHeight: 20, fontWeight: '500' },
    sellerError: { color: palette.muted, fontSize: 14, lineHeight: 21, paddingHorizontal: 16, paddingTop: 16 },

    // Confirmation dialog
    dialogOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    dialogBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20, 32, 26, 0.42)' },
    dialog: { width: '100%', maxWidth: 380, padding: 22, borderRadius: 22, backgroundColor: palette.paper, gap: 10 },
    dialogTitle: { color: palette.ink, fontSize: 21, lineHeight: 28, fontWeight: '700' },
    dialogMessage: { color: palette.muted, fontSize: 14, lineHeight: 21 },
    dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
    dialogButton: { minHeight: 44, minWidth: 92, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dialogCancel: { backgroundColor: palette.soft },
    dialogCancelText: { color: palette.brand, fontSize: 14, fontWeight: '700' },
    dialogSignOut: { backgroundColor: palette.danger },
    dialogSignOutPressed: { opacity: 0.82 },
    dialogSignOutText: { color: palette.paper, fontSize: 14, fontWeight: '700' },

    footer: { color: palette.muted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6 },
});
