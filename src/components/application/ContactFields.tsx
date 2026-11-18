import { Text, View } from "react-native";
import { Field } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import type { ApplicationFieldsProps } from "./application-fields.types";
import { ApplicationFieldError } from "./ApplicationFieldError";
import { Choice } from "./ApplicationChoices";

export function ContactFields({
    form,
    update,
    disabled,
    email,
    fieldIssue,
}: ApplicationFieldsProps) {
    return (
        <>
            <Text style={ui.subtitle}>
                We’ll use these details to contact you about your application.
            </Text>
            <Field
                label="Contact name"
                value={form.contactName}
                onChangeText={(value) => update("contactName", value)}
                maxLength={100}
                autoCapitalize="words"
                editable={!disabled}
            />
            <ApplicationFieldError field="contactName" issue={fieldIssue} />
            <Field
                label="Contact email"
                value={email}
                editable={false}
                accessibilityHint="Uses the email address you signed in with"
                style={[
                    ui.input,
                    { backgroundColor: palette.soft, color: palette.muted },
                ]}
            />
            <Field
                label="Contact number"
                placeholder="e.g. 082 123 4567"
                value={form.phone}
                onChangeText={(value) => update("phone", value)}
                keyboardType="phone-pad"
                maxLength={30}
                editable={!disabled}
            />
            <ApplicationFieldError field="phone" issue={fieldIssue} />
            <View style={{ gap: 10 }}>
                <Text style={ui.heading}>
                    Will customers be able to collect?
                </Text>
                <Choice
                    label="Yes, I offer collection"
                    selected={form.collectionOffered === true}
                    onPress={() => update("collectionOffered", true)}
                    disabled={disabled}
                />
                <Choice
                    label="No collection"
                    selected={form.collectionOffered === false}
                    onPress={() => update("collectionOffered", false)}
                    disabled={disabled}
                />
            </View>
            <ApplicationFieldError field="collectionOffered" issue={fieldIssue} />
            {form.collectionOffered && (
                <>
                    <Field
                        label="Pickup area"
                        placeholder="Town or suburb, not a private street address"
                        value={form.collectionArea}
                        onChangeText={(value) =>
                            update("collectionArea", value)
                        }
                        maxLength={120}
                        editable={!disabled}
                    />
                    <ApplicationFieldError
                        field="collectionArea"
                        issue={fieldIssue}
                    />
                    <Field
                        label="Pickup hours"
                        placeholder="Days and times customers can collect"
                        value={form.pickupHours}
                        onChangeText={(value) => update("pickupHours", value)}
                        multiline
                        maxLength={300}
                        editable={!disabled}
                    />
                    <ApplicationFieldError
                        field="pickupHours"
                        issue={fieldIssue}
                    />
                    <Text style={ui.small}>
                        These details help us review your application. Product
                        fulfilment options are set when you create listings.
                    </Text>
                </>
            )}
        </>
    );
}
