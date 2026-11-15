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
function setup(auth, complete = async () => {}) {
    const cells = [];
    let cursor = 0;
    const destinations = [];
    const loaded = { exports: {} };
    const dependencies = {
        react: {
            useRef: initial => cells[cursor++] ??= { current: initial },
            useState(initial) {
                const index = cursor++;
                if (!(index in cells)) cells[index] = initial;
                return [cells[index], value => { cells[index] = value; }];
            },
        },
        "react/jsx-runtime": jsx,
        "react-native": { Image: "Image", ScrollView: "ScrollView", Text: "Text", View: "View" },
        "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
        "expo-router": { router: { replace: value => destinations.push(value) } },
        "@expo/vector-icons/Feather": { default: () => null },
        "@/components/market/Primitives": { Button: "Button" },
        "@/constants/market-theme": { palette: {} },
        "@/constants/welcome-styles": { welcome: {} },
        "@/lib/auth": { useAuth: () => ({ ready: true, busy: false, error: "", ...auth }) },
        "@/lib/welcome": { useWelcome: () => ({ complete }) },
        "@/assets/images/shopyethu-icon.png": 1,
    };
    const code = ts.transpileModule(fs.readFileSync(new URL("../src/app/welcome.tsx", import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: name => {
        assert.ok(name in dependencies, name); return dependencies[name];
    } });
    return { destinations, render() { cursor = 0; return loaded.exports.default(); },
        button(title) { return elements(this.render()).find(node => node.type === "Button" && node.props.title === title); } };
}

test("welcome sign-in launches authentication directly without first navigating to Account", async () => {
    const events = [];
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const state = setup({ signIn: async () => { events.push("sign-in"); await pending; } }, async () => { events.push("welcome-complete"); });
    const button = state.button("Sign in");
    button.props.onPress(); button.props.onPress();
    await new Promise(setImmediate);
    assert.deepEqual(events, ["welcome-complete", "sign-in"]);
    assert.deepEqual(state.destinations, []);
    assert.equal(state.button("Start shopping").props.disabled, true);
    finish(); await new Promise(setImmediate);
    assert.deepEqual(state.destinations, [], "auth cancellation must not force the Account screen");
    assert.equal(state.button("Sign in").props.disabled, false);
});

test("authenticated users open their account and shoppers can still browse without authentication", async () => {
    let signIns = 0;
    const state = setup({ session: {}, signIn: async () => { signIns++; } });
    state.button("Your account").props.onPress(); await new Promise(setImmediate);
    assert.deepEqual(state.destinations, ["/account"]);
    assert.equal(signIns, 0);
    const shopper = setup({ signIn: async () => { signIns++; } });
    shopper.button("Start shopping").props.onPress(); await new Promise(setImmediate);
    assert.deepEqual(shopper.destinations, ["/"]);
    assert.equal(signIns, 0);
});

test("welcome shows authentication errors and blocks actions while authentication is loading", () => {
    const state = setup({ busy: true, error: "Sign-in failed. Please try again." });
    assert.equal(state.button("Signing in…").props.disabled, true);
    assert.equal(state.button("Start shopping").props.disabled, true);
    assert.ok(elements(state.render()).some(node => node.props?.accessibilityRole === "alert" && /Sign-in failed/.test(node.props.children)));
    assert.equal(setup({ ready: false }).button("Sign in").props.disabled, true);
});
