import assert from "node:assert/strict";
import { test } from "node:test";
import * as jsx from "react/jsx-runtime";
import { loadTs } from "./load-ts.mjs";

function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
}

test("order options open as an anchored dropdown and report the order", () => {
    const cells = [];
    let cursor = 0;
    let reported = false;
    let shared = false;
    let regenerated = false;
    const { OrderMoreOptionsDropdown } = loadTs(
        "src/components/market/OrderMoreOptionsDropdown.tsx",
        {
            react: {
                useRef() {
                    const index = cursor++;
                    if (!(index in cells)) {
                        cells[index] = {
                            current: {
                                measureInWindow(callback) {
                                    callback(300, 50, 40, 40);
                                },
                            },
                        };
                    }
                    return cells[index];
                },
                useState(initial) {
                    const index = cursor++;
                    if (!(index in cells)) cells[index] = initial;
                    return [
                        cells[index],
                        value => {
                            cells[index] =
                                typeof value === "function"
                                    ? value(cells[index])
                                    : value;
                        },
                    ];
                },
            },
            "react/jsx-runtime": jsx,
            "react-native": {
                Modal: "Modal",
                StyleSheet: {
                    absoluteFill: {},
                    create: styles => styles,
                },
                Text: "Text",
                useWindowDimensions: () => ({ width: 360 }),
                View: "View",
            },
            "@expo/vector-icons": { Ionicons: "Icon" },
            "@/components/ui/DebouncedPressable": {
                DebouncedPressable: "Pressable",
            },
            "@/constants/market-theme": {
                palette: {
                    brand: "",
                    danger: "red",
                    ink: "",
                    line: "",
                    muted: "",
                    paper: "",
                },
            },
        },
    );
    const render = () => {
        cursor = 0;
        return OrderMoreOptionsDropdown({
            onReport: () => (reported = true),
            onShareQr: () => (shared = true),
            onRegenerateQr: () => (regenerated = true),
        });
    };

    let tree = nodes(render());
    const trigger = tree.find(
        node => node.props?.accessibilityLabel === "More order options",
    );
    assert.equal(trigger.props.accessibilityState.expanded, false);
    trigger.props.onPress();

    tree = nodes(render());
    const modal = tree.find(node => node.type === "Modal");
    assert.equal(modal.props.visible, true);
    const dropdown = tree.find(
        node => Array.isArray(node.props?.style) && node.props.style[0]?.width === 190,
    );
    assert.equal(dropdown.props.style[1].top, 96);
    assert.equal(dropdown.props.style[1].right, 20);
    const regenerate = tree.find(
        node => node.props?.accessibilityLabel === "Regenerate QR code",
    );
    const share = tree.find(
        node => node.props?.accessibilityLabel === "Share QR code",
    );
    const reportText = tree.find(
        node =>
            node.type === "Text" &&
            node.props?.children === "Report order issue",
    );
    assert.deepEqual(
        tree
            .filter(node =>
                ["Share QR code", "Regenerate QR code", "Report order issue"].includes(
                    node.props?.accessibilityLabel,
                ),
            )
            .map(node => node.props.accessibilityLabel),
        ["Share QR code", "Regenerate QR code", "Report order issue"],
    );
    assert.ok(share);
    share.props.onPress();
    assert.equal(shared, true);
    assert.equal(nodes(render()).find(node => node.type === "Modal").props.visible, false);

    tree = nodes(render());
    tree.find(
        node => node.props?.accessibilityLabel === "More order options",
    ).props.onPress();
    tree = nodes(render());
    assert.ok(regenerate);
    assert.equal(reportText.props.style[1].color, "red");
    regenerate.props.onPress();
    assert.equal(regenerated, true);
    assert.equal(nodes(render()).find(node => node.type === "Modal").props.visible, false);

    tree = nodes(render());
    tree.find(
        node => node.props?.accessibilityLabel === "More order options",
    ).props.onPress();
    tree = nodes(render());
    tree.find(
        node => node.props?.accessibilityLabel === "Report order issue",
    ).props.onPress();
    assert.equal(reported, true);
    assert.equal(nodes(render()).find(node => node.type === "Modal").props.visible, false);
});
