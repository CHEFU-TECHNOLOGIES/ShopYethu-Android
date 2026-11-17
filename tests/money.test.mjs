import assert from "node:assert/strict";
import { test } from "node:test";
import { money } from "../src/lib/money.ts";

test("formats rand values without a space after the currency symbol", () => {
    assert.equal(money(630000), "R6 300.00");
    assert.equal(money(123456789), "R1 234 567.89");
    assert.equal(money(95), "R0.95");
});
