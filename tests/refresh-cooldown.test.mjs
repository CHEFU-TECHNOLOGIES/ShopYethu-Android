import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./load-ts.mjs";

const { createRefreshCooldown } = loadTs("src/lib/refresh-cooldown.ts");

test("refresh cooldown blocks repeated starts until the configured period elapses", () => {
    let now = 1000;
    const cooldown = createRefreshCooldown(30_000, () => now);

    assert.equal(cooldown.tryStart(), true);
    assert.equal(cooldown.remainingMs(), 30_000);
    now += 29_999;
    assert.equal(cooldown.tryStart(), false);
    assert.equal(cooldown.remainingMs(), 1);
    now += 1;
    assert.equal(cooldown.tryStart(), true);
});
