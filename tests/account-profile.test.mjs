import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";

function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}
function setup() {
    const cells = [];
    let cursor = 0;
    const dependencies = {
        react: { useState(initial) {
            const index = cursor++;
            if (!(index in cells)) cells[index] = initial;
            return [cells[index], value => { cells[index] = value; }];
        } },
        "react/jsx-runtime": jsx,
        "react-native": { ActivityIndicator: "ActivityIndicator", Image: "Image", Text: "Text", View: "View" },
        "@/components/market/Primitives": { Button: "Button" },
        "@/constants/account-profile-styles": { profile: {} },
        "@/constants/market-theme": { palette: {} },
        "@expo/vector-icons/Feather": { default: () => null },
    };
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL("../src/components/account/AccountProfile.tsx", import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: name => {
        assert.ok(name in dependencies, name); return dependencies[name];
    } });
    return { ...loaded.exports, avatar(user) {
        const avatar = elements(loaded.exports.AccountIdentity({ user })).find(node =>
            typeof node.type === "function" && typeof node.props.initials === "string");
        cursor = 0; return avatar.type(avatar.props);
    } };
}
const user = { uid: "buyer", name: "Alice Example", email: "buyer@example.test" };

test("profile photo shows after loading, with initials while loading and after an image error", () => {
    const component = setup();
    const profileUser = { ...user, picture: "https://images.example.test/alice.jpg" };
    let nodes = elements(component.avatar(profileUser));
    assert.ok(nodes.some(node => node.type === "Text" && node.props.children === "AE"));
    const image = nodes.find(node => node.type === "Image");
    assert.equal(image.props.source.uri, profileUser.picture);
    assert.equal(image.props.resizeMode, "cover");
    image.props.onLoad();
    nodes = elements(component.avatar(profileUser));
    assert.equal(nodes.some(node => node.type === "Text"), false);
    nodes.find(node => node.type === "Image").props.onError();
    nodes = elements(component.avatar(profileUser));
    assert.ok(nodes.some(node => node.type === "Text" && node.props.children === "AE"));
    assert.equal(nodes.some(node => node.type === "Image"), false, "failed images must not retry on each render");
});

test("accounts without a photo, including older stored sessions, show initials", () => {
    for (const picture of [undefined, "", "   ", "http://images.example.test/photo.jpg"]) {
        const nodes = elements(setup().avatar({ ...user, picture }));
        assert.ok(nodes.some(node => node.type === "Text" && node.props.children === "AE"));
        assert.equal(nodes.some(node => node.type === "Image"), false);
    }
});

test("the signed-out card retains its sign-in action and exposes the pending state", () => {
    const component = setup();
    let clicks = 0;
    const idle = elements(component.AccountSignIn({ busy: false, onSignIn: () => { clicks++; } }));
    const button = idle.find(node => node.type === "Button");
    assert.equal(button.props.title, "Sign in to ShopYethu");
    button.props.onPress(); assert.equal(clicks, 1);
    const pending = elements(component.AccountSignIn({ busy: true, onSignIn() {} })).find(node => node.type === "Button");
    assert.equal(pending.props.disabled, true);
    assert.equal(pending.props.trailingIcon.type, "ActivityIndicator");
});

function userMapper() {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL("../src/lib/account-user.ts", import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, URL, Error });
    return loaded.exports;
}

test("sign-in maps actual userinfo names and photos, rejecting malformed identities and unsafe photo URLs", () => {
    const { accountUserFromInfo } = userMapper();
    const info = { sub: "buyer", app: "shopyethu", email: " buyer@example.test ", name: " Alice   Example ", picture: " https://images.example.test/avatar.jpg " };
    const mapped = accountUserFromInfo(info);
    assert.equal(mapped.name, "Alice Example");
    assert.equal(mapped.email, "buyer@example.test");
    assert.equal(mapped.picture, "https://images.example.test/avatar.jpg");
    assert.equal(accountUserFromInfo({ ...info, name: undefined, given_name: "Alice", family_name: "Example" }).name, "Alice Example");
    assert.equal(accountUserFromInfo({ ...info, name: 42 }).name, "buyer@example.test");
    for (const picture of [null, {}, "http://images.example.test/a.jpg", "javascript:alert(1)", "https://user:secret@images.example.test/a.jpg"]) {
        assert.equal(accountUserFromInfo({ ...info, picture }).picture, undefined);
    }
    for (const value of [null, [], { ...info, sub: 42 }, { ...info, email: {} }, { ...info, app: "another-app" }]) {
        assert.throws(() => accountUserFromInfo(value), /Unable to verify/);
    }
});

test("development diagnostics expose profile field names and values without token or credential values", () => {
    const { accountUserDiagnostics } = userMapper();
    const diagnostic = accountUserDiagnostics({ sub: "buyer", name: "Alice Example", picture: "https://images.example.test/a.jpg",
        access_token: "secret-access-value", refresh_token: "secret-refresh-value", password: "secret-password-value" });
    assert.ok(diagnostic.fields.includes("picture"));
    assert.equal(diagnostic.profile.name, "Alice Example");
    assert.equal(JSON.stringify(diagnostic).includes("secret-"), false);
});
