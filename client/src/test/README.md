# Tests

Vitest + Testing Library, jsdom environment.

```bash
yarn test            # watch mode
yarn test --run      # single run
yarn test:coverage
```

- `src/lib/__tests__/` – TOTP parsing/generation (RFC 6238 vectors) and search.
- `src/lib/vault/__tests__/` – vault encryption, passcode wrapping, backup files.
  These use the real WebCrypto API from Node, no mocks.
- `utils.tsx` – `render` wrapped in the router and HeroUI providers for component tests.

Passkey (WebAuthn PRF) flows need a real browser; test them end-to-end with
Chromium's virtual authenticator.
