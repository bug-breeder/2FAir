# 2FAir client

The whole app: an offline PWA built with React, Vite and HeroUI. See the
[root README](../README.md) for features, the encryption design and deployment.

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
npm test
npm run lint
npm run build && npm run preview   # production build with service worker
```

The theme follows [bambotics.dev](https://bambotics.dev): colors live in
`tailwind.config.js`, fonts (Be Vietnam Pro, with Inter digits for OTP codes)
and the highlighter style in `src/styles/globals.css`.
