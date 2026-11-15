import assert from "node:assert/strict";
import { test } from "node:test";
import { money } from "../src/lib/money.ts";

test("formats rand values with spaced thousands and two decimal places", () => {
    assert.equal(money(630000), "R 6 300.00");
    assert.equal(money(123456789), "R 1 234 567.89");
    assert.equal(money(95), "R 0.95");
});
