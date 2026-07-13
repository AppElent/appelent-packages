---
name: mcp
version: 1
description: How Appelent apps expose a Model Context Protocol (MCP) server
---

# MCP server

## What

The standard way an Appelent app exposes MCP tools: transport choice,
endpoint wiring, auth, tests, and MCP Inspector verification. Currently
documented/guided (no `@appelent/mcp` package): create a package only when
two or more apps need the same imported runtime helpers.

## Stack

- Options: `lib: tanstack-ai-mcp | @modelcontextprotocol/sdk`;
  `deploy: cloudflare-workers` (the only described deploy target)
- Host app shape: TanStack Start on Cloudflare Workers

## Architecture

- App-specific MCP tools, domain logic, and permission rules live in the
  app; see `references/tanstack-start-cloudflare.md` and
  `references/cloudflare-worker.md` for endpoint wiring per option
- Auth decisions: `references/auth.md`

## Configuration

- Wrangler/route config per `references/cloudflare-worker.md`
- Tests + MCP Inspector verification per `references/testing.md`

## Changelog

- 1 — initial capture (migrated from the `add-mcp-server` global skill)
