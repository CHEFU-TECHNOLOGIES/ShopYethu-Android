import assert from "node:assert/strict";
import { test } from "node:test";
import * as jsx from "react/jsx-runtime";
import { loadTs } from "./load-ts.mjs";

function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}

test("native Selling tab is visible only for an active seller store", () => {
    function NativeTabs() {}
    NativeTabs.Trigger = function Trigger() {};
    NativeTabs.Trigger.Label = function Label() {};
    NativeTabs.Trigger.Icon = function Icon() {};
    NativeTabs.Trigger.VectorIcon = function VectorIcon() {};
    NativeTabs.Trigger.Badge = function Badge() {};
    const { default: AppTabs } = loadTs("src/components/app-tabs.tsx", {
        "react/jsx-runtime": jsx,
        "expo-router/native-tabs": { NativeTabs },
        "@expo/vector-icons": { Ionicons: "Ionicons" },
        "@/constants/market-theme": { palette: {} },
        "@/lib/cart": { useCart: () => ({ items: [] }) },
        "@/hooks/use-seller-account": { useSellerAccount: () => ({ data: { store: { status: "pending" } } }) },
    });

    const hiddenTab = elements(AppTabs()).find(node => node.type === NativeTabs.Trigger && node.props.name === "selling");
    assert.equal(hiddenTab.props.hidden, true);

    const { default: activeAppTabs } = loadTs("src/components/app-tabs.tsx", {
        "react/jsx-runtime": jsx,
        "expo-router/native-tabs": { NativeTabs },
        "@expo/vector-icons": { Ionicons: "Ionicons" },
        "@/constants/market-theme": { palette: {} },
        "@/lib/cart": { useCart: () => ({ items: [] }) },
        "@/hooks/use-seller-account": { useSellerAccount: () => ({ data: { store: { status: "active" } } }) },
    });
    const activeTree = activeAppTabs();
    const visibleTab = elements(activeTree).find(node => node.type === NativeTabs.Trigger && node.props.name === "selling");
    assert.equal(visibleTab.props.hidden, false);
    const icon = elements(visibleTab).find(node => node.type === NativeTabs.Trigger.Icon);
    assert.equal(icon.props.selectedColor, "black");
    assert.equal(icon.props.src.type, NativeTabs.Trigger.VectorIcon);
    assert.equal(icon.props.src.props.name, "storefront-outline");
});

test("web Selling tab is hidden until the store is active", () => {
    function Tabs() {}
    Tabs.Screen = function Screen() {};
    const { default: AppTabs } = loadTs("src/components/app-tabs.web.tsx", {
        "react/jsx-runtime": jsx,
        "expo-router": { Tabs },
        "@expo/vector-icons": { Ionicons: "Ionicons" },
        "@/constants/market-theme": { palette: {} },
        "@/hooks/use-seller-account": { useSellerAccount: () => ({ data: { store: null } }) },
    });
    const hiddenTab = elements(AppTabs()).find(node => node.type === Tabs.Screen && node.props.name === "selling");
    assert.equal(hiddenTab.props.options.href, null);

    const { default: ActiveAppTabs } = loadTs("src/components/app-tabs.web.tsx", {
        "react/jsx-runtime": jsx,
        "expo-router": { Tabs },
        "@expo/vector-icons": { Ionicons: "Ionicons" },
        "@/constants/market-theme": { palette: {} },
        "@/hooks/use-seller-account": { useSellerAccount: () => ({ data: { store: { status: "active" } } }) },
    });
    const visibleTab = elements(ActiveAppTabs()).find(node => node.type === Tabs.Screen && node.props.name === "selling");
    assert.equal(visibleTab.props.options.href, undefined);
    const icon = visibleTab.props.options.tabBarIcon();
    assert.equal(icon.type, "Ionicons");
    assert.equal(icon.props.name, "storefront-outline");
    assert.equal(icon.props.size, 24);
    assert.equal(icon.props.color, "black");
});
