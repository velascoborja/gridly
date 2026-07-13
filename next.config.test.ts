import test from "node:test";
import assert from "node:assert/strict";

import nextConfig, { contentSecurityPolicy, securityHeaders } from "./next.config.ts";

test("security headers apply to every route", async () => {
  const headers = await nextConfig.headers!();
  const configured = Object.fromEntries(securityHeaders.map(({ key, value }) => [key, value]));

  assert.equal(nextConfig.poweredByHeader, false);
  assert.deepEqual(headers, [{ source: "/(.*)", headers: securityHeaders }]);
  assert.match(configured["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(configured["X-Frame-Options"], "DENY");
  assert.equal(configured["X-Content-Type-Options"], "nosniff");
  assert.equal(configured["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(configured["Permissions-Policy"], /camera=\(\)/);
  assert.equal(configured["Content-Security-Policy"], contentSecurityPolicy);
});
