# Feature: MCP Server (AI Assistant Access)

Gridly exposes a [Model Context Protocol](https://modelcontextprotocol.io) server so Claude (or any MCP client) can read a user's financial data. Phase 1 is **read-only**: no tool writes to the database.

## Endpoint

`POST /api/mcp` on the same deployment as the app (production: `https://appgridly.com/api/mcp`). It is a regular Next.js route handler (`src/app/api/mcp/route.ts`), so it ships with every deploy and uses the same `DATABASE_URL`. There is no extra infrastructure.

- **Transport:** Streamable HTTP via the SDK's `WebStandardStreamableHTTPServerTransport`, in **stateless** mode (`sessionIdGenerator: undefined`) with JSON responses (`enableJsonResponse: true`). Each request builds a fresh `McpServer` + transport and closes it afterwards, which suits serverless invocations.
- `GET` and `DELETE` return `405`: there is no session or server-initiated SSE stream to resume or end.
- Responses carry `Cache-Control: no-store`.

## Authentication: personal access tokens

MCP clients can't use the NextAuth session cookie, so the endpoint authenticates with a per-user bearer token: `Authorization: Bearer gridly_mcp_…`.

- **Format:** `gridly_mcp_` + 32 random bytes in base64url (43 characters). Malformed values are rejected before any database query (`parseBearerToken` in `src/lib/mcp-tokens.ts`).
- **Storage:** only the SHA-256 hash (`token_hash`, unique) and a display prefix (`gridly_mcp_` + 4 chars) are stored. The plaintext is returned once, at creation, and never again. Generation and hashing live in the server-only `src/lib/server/mcp-token-crypto.ts`, so the client bundle never imports `node:crypto`.
- **Lookup:** `authenticateMcpRequest` hashes the presented token, updates `last_used_at` and returns the owning `userId` in a single `UPDATE … RETURNING`. An unknown or revoked token returns `401` with `WWW-Authenticate: Bearer realm="gridly-mcp"`.
- **Limit:** 10 tokens per user (`MCP_TOKENS_PER_USER_LIMIT`). Names are trimmed, 1–60 characters.
- **Revocation** deletes the row, so access ends on the next request. Tokens cascade-delete with the user.

### `mcp_tokens` table (`src/db/schema.ts`, `drizzle/0007_mcp_tokens.sql`)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `user_id` | text FK → `users.id` | `onDelete: cascade` |
| `name` | text NOT NULL | User label, e.g. "Claude" |
| `token_hash` | text NOT NULL UNIQUE | SHA-256 hex of the token |
| `token_prefix` | text NOT NULL | Shown in Settings to recognise the token |
| `created_at` | timestamp | `defaultNow()` |
| `last_used_at` | timestamp | Updated on every authenticated MCP request |

### Token management API (session-authenticated)

| Method | Route | Result |
|---|---|---|
| `GET` | `/api/user/mcp-tokens` | The user's tokens (no hashes, no plaintext) |
| `POST` | `/api/user/mcp-tokens` `{ name }` | `201` with `{ token, …summary }`; `400 invalidName`; `409 tokenLimitReached` |
| `DELETE` | `/api/user/mcp-tokens/[tokenId]` | `204`; `404` if the token isn't the user's |

### Settings UI

`McpTokensCard` (`src/components/settings/mcp-tokens-card.tsx`) sits on the Settings page between Tags and Help. It shows the endpoint URL (built from `window.location.origin`) with a copy button, a form to create a named token, a one-time panel with the new plaintext token, and the token list with created and last-used dates. Revoking confirms through `AlertDialog`. Strings live under `Settings.mcp` in `messages/es.json` and `messages/en.json`.

## Tools

Defined in `src/lib/server/mcp-server.ts`. All of them carry `readOnlyHint: true` and are scoped to the token owner's `userId`. They reuse the same loaders the UI uses (`getYearData`, `getYearsForUser`, `getHistoricalYearsForUser`, `getEvolutionSourcesForUser`), so balances and the month chain match the app exactly. The output shaping is pure and unit-tested in `src/lib/mcp-tool-data.ts`.

| Tool | Input | Returns |
|---|---|---|
| `list_years` | — | Gridly years and historical (summary-only) years |
| `get_year_summary` | `year` | Year configuration, annual totals (income, expenses, saved amount, savings rate, investment, interests, start/final balance) and a per-month overview |
| `get_month` | `year`, `month` | Balances, payslips, interests, fixed expenses, total investment and every entry |
| `list_entries` | `year`, optional `month`, `type`, `tag`, `search` | Matching entries plus income/expense totals |
| `list_tags` | — | The user's tags |
| `get_evolution` | — | Per-year evolution metrics (Gridly and historical) and the overall summary |

Notes:

- Entries are flattened from additional incomes and expenses, grouped expenses (with their `group` label; they inherit the group tag) and monthly recurring expenses (`kind: "recurring"`).
- `tag` matches the exact tag name, ignoring case and accents. `search` matches text in the entry label or group name, also ignoring case and accents.
- Amounts are euros rounded to 2 decimals. Rates are fractions (`0.25` = 25%).
- A missing year or month returns a tool error (`isError: true`) with a hint to call `list_years`. Out-of-range arguments are rejected by the Zod input schemas.
- The server sends `instructions` describing these units and the domain rules (month chain, June/December extra pay).

## Connecting a client

1. In Gridly, open Settings → "Acceso para asistentes de IA (MCP)", create a token and copy it.
2. Add a remote MCP server in the client with the endpoint URL and the header `Authorization: Bearer <token>`. For Claude Code:

   ```bash
   claude mcp add --transport http gridly https://appgridly.com/api/mcp \
     --header "Authorization: Bearer gridly_mcp_..."
   ```

Clients that only support OAuth for remote connectors can't use personal tokens yet; OAuth support is a possible later phase.

## Future phases

Write tools (adding and editing entries, assigning tags) need the financial write logic that now lives in the route handlers (`withFinancialTransaction`, ownership checks, `propagateYearCarryOver`) to move into shared server functions first, so HTTP routes and MCP tools run the same code.
