import assert from "node:assert/strict";

const origin = "https://thetoolware.company";
const get = (url: string) => fetch(url, { redirect: "error", signal: AbortSignal.timeout(20_000) });

const status = await get(`${origin}/status`);
assert.equal(status.status, 200, "Production status must be available");
const release = await status.json();
assert.equal(release.ok, true, "Production must be healthy");
assert.equal(release.service, "system-mcp");
assert.ok(release.release?.sha, "Status must identify the deployed release");

const challenge = await get(`${origin}/mcp`);
assert.equal(challenge.status, 401, "Anonymous MCP access must require OAuth");
const metadataUrl = `${origin}/.well-known/oauth-protected-resource/mcp`;
assert.ok(
  challenge.headers.get("www-authenticate")?.includes(`resource_metadata="${metadataUrl}"`),
  "MCP challenge must advertise the production resource metadata",
);
const metadataResponse = await get(metadataUrl);
assert.equal(metadataResponse.status, 200);
const metadata = await metadataResponse.json();
assert.equal(metadata.resource, `${origin}/mcp`);
assert.deepEqual(metadata.authorization_servers, [`${origin}/api/auth`]);

const authResponse = await get(`${origin}/.well-known/oauth-authorization-server/api/auth`);
assert.equal(authResponse.status, 200, "OAuth authorization metadata must be available");
const auth = await authResponse.json();
assert.equal(auth.issuer, `${origin}/api/auth`);
for (const field of ["authorization_endpoint", "token_endpoint", "registration_endpoint"]) {
  assert.equal(new URL(auth[field]).origin, origin, `${field} must use the production origin`);
}
assert.ok(auth.code_challenge_methods_supported?.includes("S256"), "OAuth must support PKCE S256");

process.stdout.write(
  `Production status and OAuth discovery passed (release ${release.release.sha}).\n` +
    "Browser sign-in, authenticated catalog access, and refresh/revocation remain manual checks.\n",
);
