import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";

function load(file, dependencies = {}) {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: name => {
        assert.ok(name in dependencies, name); return dependencies[name];
    } });
    return loaded.exports;
}
function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}
const phoneValidation = load("lib/contact-phone.ts");
const validation = load("lib/application-form.ts", {
    "./config": load("lib/config.ts"), "./contact-phone": phoneValidation,
});
const completeForm = () => ({
    businessType: "individual", cipcCertificateId: "", cipcCertificateFormat: "", cipcCertificateName: "",
    businessName: "Test trading business", area: "Cape Town", areaPlaceId: "ChIJtest", areaSessionToken: "",
    categories: ["Clothing"], plans: "Clothing made locally for customers.",
    contactName: "Test Applicant", phone: "0821234567", phoneConfirmed: true,
    collectionOffered: false, collectionArea: "", pickupHours: "", response: "",
});

function setup(step, form = completeForm(), previous = null) {
    const cells = [];
    let cursor = 0;
    const requests = [], destinations = [], submitted = [];
    const draft = { form, step, ready: true, save: async () => true, discard: async () => {},
        goTo: index => { draft.step = index; }, update() {} };
    let respond = async () => ({ id: "application", status: "pending" });
    const { ApplicationWizard } = load("components/application/ApplicationWizard.tsx", {
        react: {
            useCallback: callback => callback,
            useRef: value => cells[cursor++] ??= { current: value },
            useState(value) {
                const index = cursor++;
                if (!(index in cells)) cells[index] = value;
                return [cells[index], next => { cells[index] = next; }];
            },
        },
        "react/jsx-runtime": jsx,
        "react-native": { ActivityIndicator: "ActivityIndicator", BackHandler: {}, Pressable: "Pressable", Text: "Text", View: "View" },
        "expo-document-picker": { getDocumentAsync: async () => ({ canceled: true, assets: null }) },
        "expo-file-system": { File: class {} },
        "expo-router": { router: { replace: path => destinations.push(path) }, useFocusEffect() {} },
        "@/components/market/Primitives": { Button: "Button", Page: "Page" },
        "@/constants/application-styles": { applicationStyles: {} },
        "@/constants/market-theme": { palette: {}, ui: {} },
        "@/hooks/use-application-draft": { useApplicationDraft: () => draft },
        "@/lib/application-form": validation,
        "@/lib/api": { api: async (...args) => { requests.push(args); return respond(...args); } },
        "@/lib/session": { currentSession: () => ({ user: { uid: "applicant" } }) },
        "./ApplicationFields": { BusinessFields: "BusinessFields", ContactFields: "ContactFields", ProductFields: "ProductFields" },
        "./ApplicationReview": { ApplicationReview: "ApplicationReview" },
    });
    return { draft, requests, destinations, submitted,
        respond: callback => { respond = callback; },
        render() {
            cursor = 0;
            return ApplicationWizard({ session: { user: { uid: "applicant", name: "Test Applicant", email: "applicant@example.test" } },
                previous, onSubmitted: application => submitted.push(application), onCheckStatus() {} });
        },
        forward() { return elements(this.render()).find(node => node.type === "Button" && /^(Continue|Submit application|Resubmit application|Please wait)/.test(node.props.title)); },
    };
}

test("Business Continue stays disabled until business type, name and a selected operating area are complete", () => {
    const state = setup(0, { ...completeForm(), businessType: "", businessName: "", area: " ", areaPlaceId: "" });
    assert.equal(state.forward().props.disabled, true);
    state.draft.form.businessType = "individual";
    state.draft.form.businessName = "Test business";
    assert.equal(state.forward().props.disabled, true);
    state.draft.form.area = "Cape Town";
    state.draft.form.areaPlaceId = "ChIJtest";
    assert.equal(state.forward().props.disabled, false);

    const registered = setup(0, { ...completeForm(), businessType: "registered-business" });
    assert.equal(registered.forward().props.disabled, true);
    registered.draft.form.cipcCertificateId = "uploaded-certificate";
    registered.draft.form.cipcCertificateFormat = "pdf";
    assert.equal(registered.forward().props.disabled, false);
    state.forward().props.onPress();
    assert.equal(state.draft.step, 1);
    assert.equal(state.requests.length, 0);
});

test("required validation is routed to its field or review section instead of the wizard footer", () => {
    const business = setup(0, { ...completeForm(), businessType: "" });
    const businessTree = elements(business.render());
    const businessFields = businessTree.find(node => node.type === "BusinessFields");
    assert.equal(businessFields.props.fieldIssue.field, "businessType");
    assert.equal(businessFields.props.fieldIssue.message, "Choose your business type.");
    assert.equal(
        businessTree.some(node => node.type === "Text" && JSON.stringify(node.props.children).includes("Choose your business type.")),
        false,
    );

    const review = setup(3, { ...completeForm(), businessName: "", areaPlaceId: "" });
    const reviewFields = elements(review.render()).find(node => node.type === "ApplicationReview");
    assert.equal(reviewFields.props.issue.field, "businessName");
    assert.equal(reviewFields.props.issue.message, "Enter a business or trading name (2–100 characters).");
    assert.equal(reviewFields.props.issue.index, 0);
});

test("Products Continue reacts to category deselection and incomplete descriptions", () => {
    const state = setup(1, { ...completeForm(), categories: [], plans: "" });
    assert.equal(state.forward().props.disabled, true);
    state.draft.form.categories = ["Clothing"];
    assert.equal(state.forward().props.disabled, true);
    state.draft.form.plans = "Locally made clothing for customers.";
    assert.equal(state.forward().props.disabled, false);
    state.draft.form.categories = [];
    assert.equal(state.forward().props.disabled, true);
});

test("registered-business applicants can continue from Products when categories and description are complete", () => {
    const state = setup(1, {
        ...completeForm(),
        businessType: "registered-business",
        cipcCertificateId: "uploaded-certificate",
        cipcCertificateFormat: "pdf",
        categories: ["Clothing", "Home & Living"],
        plans: "Locally made clothing and home products for customers.",
    });
    assert.equal(state.forward().props.disabled, false);
});

test("Contact Continue requires confirmation and a collection choice, with pickup fields required only for collection", () => {
    const state = setup(2, { ...completeForm(), contactName: "", phone: "", phoneConfirmed: false, collectionOffered: null });
    assert.equal(state.forward().props.disabled, true);
    Object.assign(state.draft.form, { contactName: "Test Applicant", phone: "0821234567", phoneConfirmed: true });
    assert.equal(state.forward().props.disabled, true);
    state.draft.form.collectionOffered = false;
    assert.equal(state.forward().props.disabled, false);
    state.draft.form.collectionOffered = true;
    assert.equal(state.forward().props.disabled, true);
    state.draft.form.collectionArea = "Cape Town";
    assert.equal(state.forward().props.disabled, true);
    state.draft.form.pickupHours = "Weekdays 09:00–17:00";
    assert.equal(state.forward().props.disabled, false);
    state.draft.form.phoneConfirmed = false;
    assert.equal(state.forward().props.disabled, true);
});

test("contact numbers are checked locally and incomplete numbers keep Continue disabled", () => {
    for (const [input, expected] of [
        ["082 123 4567", "+27821234567"], ["(011) 234-5678", "+27112345678"],
        [" +27 82 123 4567 ", "+27821234567"],
    ]) assert.equal(phoneValidation.normalizeApplicationPhone(input), expected);
    const state = setup(2);
    for (const phone of ["", "1234567", "082123456", "08212345678", "0000000000", "27821234567",
        "+27 082 123 4567", "+27 82 123456", "+44 20 7946 0958", "+000000000", "+1234567890123456", "082ABC4567", "0821234567 ext 1", "++27821234567"]) {
        assert.equal(phoneValidation.normalizeApplicationPhone(phone), null, phone);
        state.draft.form.phone = phone;
        assert.equal(state.forward().props.disabled, true, phone);
    }
    assert.equal(state.requests.length, 0, "typing does not request server validation");
    state.draft.form.phone = "082 123 4567";
    assert.equal(state.forward().props.disabled, false);
});

test("review checks all earlier fields in restored drafts and requires a response when more information was requested", async () => {
    const state = setup(3, { ...completeForm(), area: "", areaPlaceId: "" });
    assert.equal(state.forward().props.disabled, true);
    state.forward().props.onPress();
    await new Promise(setImmediate);
    assert.equal(state.requests.length, 0, "the handler also rejects invalid stale presses");
    assert.equal(state.draft.step, 0);
    const resubmission = setup(3, completeForm(), { status: "more-info", reason: "Describe your products." });
    assert.equal(resubmission.forward().props.disabled, true);
    resubmission.draft.form.response = "Updated the product information.";
    assert.equal(resubmission.forward().props.disabled, false);
});

test("valid submissions retain duplicate-tap protection and missing fields do not block Back or saving a draft", async () => {
    const state = setup(3);
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    state.respond(() => pending);
    const forward = state.forward();
    assert.equal(forward.props.disabled, false);
    forward.props.onPress(); forward.props.onPress();
    assert.equal(state.requests.length, 1);
    assert.equal(state.forward().props.disabled, true);
    finish({ id: "application", status: "pending" });
    await new Promise(setImmediate);
    assert.equal(state.submitted.length, 1);
    const incomplete = setup(2, { ...completeForm(), phone: "" });
    const back = elements(incomplete.render()).find(node => node.type === "Button" && node.props.title === "Back");
    assert.equal(back.props.disabled, false);
    assert.equal(incomplete.render().props.header.props.children[0].props.children[1].props.disabled, false, "Save & exit remains available");
});
