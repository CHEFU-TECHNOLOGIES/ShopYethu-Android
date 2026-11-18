import { Platform, Share } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export function orderReceiptUrl(orderId: string, qrToken: string) {
    return `https://api.chefu.co.za/shopyethu/order/${encodeURIComponent(orderId)}/${encodeURIComponent(qrToken)}`;
}

export async function shareOrderQr(
    orderId: string,
    qrToken: string,
    reference: string,
) {
    const url = orderReceiptUrl(orderId, qrToken);
    await Share.share({
        title: `ShopYethu order ${reference}`,
        message: `ShopYethu order QR code (${reference}):\n${url}`,
    });
}

export async function saveOrderQrImage(base64: string, reference: string) {
    if (Platform.OS !== "android") {
        throw new Error("Saving QR images is currently supported on Android.");
    }

    const { StorageAccessFramework } = FileSystem;
    const permission =
        await StorageAccessFramework.requestDirectoryPermissionsAsync(
            StorageAccessFramework.getUriForDirectoryInRoot("Download"),
        );
    if (!permission.granted) return false;

    const fileName = `ShopYethu-QR-${reference.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const fileUri = await StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        fileName,
        "image/png",
    );
    await StorageAccessFramework.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return true;
}
