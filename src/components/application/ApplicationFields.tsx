import { Text, View } from "react-native";
import { Field } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import {
    applicationCategories,
    type ApplicationForm,
} from "@/lib/application-form";
import { CategoryChoices, Choice } from "./ApplicationChoices";

export type ApplicationFieldsProps = {
    form: ApplicationForm;
    disabled: boolean;
    email: string;
    update: <K extends keyof ApplicationForm>(
        field: K,
        value: ApplicationForm[K],
    ) => void;
};

export function BusinessFields({
    form,
    update,
    disabled,
}: ApplicationFieldsProps) {
    return (
        <>
            <Text style={ui.subtitle}>
                A few details about the business you want to grow.
            </Text>
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
            <Field
                label="Business or trading name"
                value={form.businessName}
                onChangeText={(value) => update("businessName", value)}
                maxLength={100}
                autoCapitalize="words"
                editable={!disabled}
                placeholder="e.g. Naledi Handmade Jewellery"
            />
            <Field
                label="Operating area"
                placeholder="Town, suburb or area"
                value={form.area}
                onChangeText={(value) => update("area", value)}
                maxLength={120}
                autoCapitalize="words"
                editable={!disabled}
            />
        </>
    );
}

export function ProductFields({
    form,
    update,
    disabled,
}: ApplicationFieldsProps) {
    return (
        <>
            <Text style={ui.subtitle}>
                Help us understand what customers will find in your store.
            </Text>
            <Text style={ui.small}>
                Product categories · choose all that apply
            </Text>
            <CategoryChoices
                options={applicationCategories}
                value={form.categories}
                onChange={(value) => update("categories", value)}
                disabled={disabled}
            />
            <Field
                label="What do you plan to sell?"
                placeholder="Tell us about your products and who you sell to."
                value={form.plans}
                onChangeText={(value) => update("plans", value)}
                multiline
                maxLength={2000}
                editable={!disabled}
            />
        </>
    );
}

export function ContactFields({
    form,
    update,
    disabled,
    email,
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
                value={form.phone}
                onChangeText={(value) => update("phone", value)}
                keyboardType="phone-pad"
                maxLength={30}
                editable={!disabled}
            />
            <Choice
                checkbox
                label="This is my business contact number"
                selected={form.phoneConfirmed}
                onPress={() => update("phoneConfirmed", !form.phoneConfirmed)}
                disabled={disabled}
            />
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
                    <Field
                        label="Pickup hours"
                        placeholder="Days and times customers can collect"
                        value={form.pickupHours}
                        onChangeText={(value) => update("pickupHours", value)}
                        multiline
                        maxLength={300}
                        editable={!disabled}
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
