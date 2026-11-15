import { Text } from "react-native";
import { Field } from "@/components/market/Primitives";
import { ui } from "@/constants/market-theme";
import { applicationCategories } from "@/lib/application-form";
import { CategoryChoices } from "./ApplicationChoices";
import { ApplicationFieldError } from "./ApplicationFieldError";
import type { ApplicationFieldsProps } from "./application-fields.types";

export function ProductFields({
    form,
    update,
    disabled,
    fieldIssue,
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
            <ApplicationFieldError field="categories" issue={fieldIssue} />
            <Field
                label="What do you plan to sell?"
                placeholder="Tell us about your products and who you sell to."
                value={form.plans}
                onChangeText={(value) => update("plans", value)}
                multiline
                maxLength={2000}
                editable={!disabled}
            />
            <ApplicationFieldError field="plans" issue={fieldIssue} />
        </>
    );
}
