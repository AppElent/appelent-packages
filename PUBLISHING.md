# Publishing @appelent/* packages (GitHub Packages, private)

## One-time setup
1. Create a GitHub Personal Access Token (classic) with `write:packages` +
   `read:packages` for the AppElent account.
2. Create the GitHub repo `AppElent/appelent-packages` and push this repo to it.
3. Export the token in your shell before publishing:
   - PowerShell: `$env:NODE_AUTH_TOKEN="ghp_..."`

## Publish a package
```bash
pnpm --filter @appelent/auth build
pnpm --filter @appelent/auth publish --no-git-checks
```

CLI shortcut:
```bash
pnpm publish:cli
```
This builds `@appelent/cli` before publishing it.

## Consume from an app
- Add `.npmrc` with `@appelent:registry=https://npm.pkg.github.com` and the
  `read:packages` token via `${NODE_AUTH_TOKEN}`.
- `npm i @appelent/auth`
