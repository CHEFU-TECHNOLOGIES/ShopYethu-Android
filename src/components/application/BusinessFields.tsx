import { ActivityIndicator, Text, View } from "react-native";
import { Button, Field } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import type { ApplicationFieldsProps } from "./application-fields.types";
import { ApplicationFieldError } from "./ApplicationFieldError";
import { Choice } from "./ApplicationChoices";
import { OperatingAreaField } from "@/components/market/OperatingAreaField";

export function BusinessFields({
    form,
    update,
    disabled,
    fieldIssue,
    uploadProof,
    uploadingProof,
}: ApplicationFieldsProps) {
    return (
        <>
            <Text style={ui.subtitle}>
                A few details about the business you want to grow.
            </Text>
            <Text style={ui.small}>Applications are open to South Africans only.</Text>
            <Text style={ui.small}>How do you trade?</Text>
            <Choice
                label="Individual / sole trader"
                selected={form.businessType === "individual"}
                onPress={() => update("businessType", "individual")}
                disabled={disabled}
            />
            <Choice
                label="Registered business"
                selected={form.businessType === "registered-business"}
                onPress={() => update("businessType", "registered-business")}
                disabled={disabled}
            />
            <ApplicationFieldError field="businessType" issue={fieldIssue} />
            {form.businessType === "registered-business" && (
                <View style={{ gap: 8 }}>
                    <Text style={ui.heading}>CIPC registration certificate</Text>
                    <Text style={ui.small}>
                        Upload proof of registration as a PDF, JPG, PNG or WebP
                        (up to 2 MB). Your document is stored privately for
                        review.
                    </Text>
                    <Button
                        title={
                            uploadingProof
                                ? "Uploading certificate…"
                                : form.cipcCertificateId
                                  ? "Replace certificate"
                                  : "Upload certificate"
                        }
                        secondary
                        disabled={disabled || uploadingProof}
                        onPress={() => void uploadProof?.()}
                        trailingIcon={
                            uploadingProof ? (
                                <ActivityIndicator
                                    size="small"
                                    color={palette.brand}
                                    accessible={false}
                                />
                            ) : undefined
                        }
                    />
                    <ApplicationFieldError
                        field="cipcCertificateId"
                        issue={fieldIssue}
                    />
                </View>
            )}
            <Field
                label="Business or trading name"
                value={form.businessName}
                onChangeText={(value) => update("businessName", value)}
                maxLength={100}
                autoCapitalize="words"
                editable={!disabled}
                placeholder="e.g. Naledi Handmade Jewellery"
            />
            <ApplicationFieldError field="businessName" issue={fieldIssue} />
            <OperatingAreaField
                value={form.area}
                placeId={form.areaPlaceId}
                sessionToken={form.areaSessionToken}
                editable={!disabled}
                onChange={(area, areaPlaceId, areaSessionToken) => {
                    update("area", area);
                    update("areaPlaceId", areaPlaceId);
                    update("areaSessionToken", areaSessionToken);
                }}
            />
            <ApplicationFieldError field="area" issue={fieldIssue} />
        </>
    );
}
