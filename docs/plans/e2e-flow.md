Below is a field-tested blueprint that teams have used in 2024-25 when building **cloud-synced, multi-device TOTP vaults**.  I’ve broken it into the decisions you’ll hit chronologically; if you only need certain pieces, skip around.

---

## 1 Define what “cloud-based” means (threat model first)

| Goal                                                                                      | Must survive if …                 |
| ----------------------------------------------------------------------------------------- | --------------------------------- |
| **End-to-end encryption.** Server never sees TOTP seeds in the clear.                     | Your database or S3 bucket leaks. |
| **Multi-device access.**  Users add phones/laptops and immediately see the same OTP list. | Device A is lost or wiped.        |
| **Zero-knowledge backup.**  A new install restores from cloud without extra hardware.     | User loses *all* active devices.  |

Everything else—UI polish, notifications, export—is layered on top.

---

## 2 Key material & crypto primitives

### 2.1  Use WebAuthn PRF (passkeys) as the Key-Encryption Key

* The PRF extension lets you ask the authenticator for **32 random bytes that are never exported**; that becomes your KEK. ([corbado.com][1])
* Because most modern passkeys are *synced* by Apple ID, Google Password Manager, Windows Hello, etc., the same KEK transparently follows the user to every device. ([support.apple.com][2], [webauthn.me][3], [theverge.com][4])

### 2.2  Derive a Data-Encryption Key per user

```
KEK (32 B from PRF) ──HKDF──► DEK (AES-256-GCM)
```

Store the **DEK encrypted (“wrapped”) with the KEK**, following the OWASP DEK/KEK pattern so that you can rotate or back-up one without the other. ([cheatsheetseries.owasp.org][5])

### 2.3  Encrypt every TOTP seed with the DEK

Use `AES-GCM` for confidentiality *and* integrity and generate a fresh 96-bit IV per seed record. ([security.stackexchange.com][6])

---

## 3 Cloud data model

| Column       | Purpose                                |
| ------------ | -------------------------------------- |
| `id` (UUID)  | Stable reference for the seed          |
| `ct`         | Cipher text (Uint8Array → Base64)      |
| `iv`         | AES-GCM IV (Base64)                    |
| `metadata`   | Issuer, account name, icon, added At   |
| `wrappedDEK` | The DEK encrypted with the current KEK |

> 🔒 **No** copy of the raw seed or DEK ever lands in the DB.

---

## 4 Device onboarding flows

| Scenario                                                         | Flow                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **First device**                                                 | *Create* PRF-capable passkey → derive KEK → derive DEK → encrypt seeds → upload.                                         |
| **Additional device (same Apple ID / Google acct / MS account)** | Log in → synced passkey already present → PRF gives same KEK → unwrap DEK → decrypt seeds.                               |
| **Device with roaming FIDO2 key (YubiKey, SoloKey)**             | User plugs in → PRF works (key isn’t synced) → KEK reproduced → rest same.                                               |
| **Fallback (“legacy” browsers)**                                 | Derive KEK from Argon2-id(passphrase) and **mark account “needs upgrade”** until the user adds a passkey-capable device. |

---

## 5 Local persistence & offline support

* Cache the wrapped DEK plus ciphertext in **IndexedDB** and/or the **Origin Private File System (OPFS)** so codes keep working without the network. ([developer.mozilla.org][7])
* Keep decrypted seeds **only in RAM** for a short TTL (e.g. 30 s) to limit post-exploitation window.

---

## 6 Backup & recovery

1. **Server copy** already acts as an E2EE backup: if a user loses every device, the synced passkey in their cloud account can still reproduce the KEK on a new phone.
2. Offer an **encrypted export** (QR/JSON) where you:

   * Re-wrap the DEK with a user-supplied 256-bit passphrase (Argon2-id).
   * Print the blob as an *“offline recovery code”* the user can store in a safe.
3. Support **key rotation** by versioning `wrappedDEK` rows; keep N−1 old versions for graceful migration.

---

## 7 Server-side sync logic

* **Stateless** API design: the client sends a `since` timestamp and receives a diff of `ct` blobs.
* **Conflict resolution**: latest-write-wins on metadata; the encrypted payload never merges.
* **Rate/quota limits** to block bulk-download attacks.

---

## 8 UX guard-rails

| Pattern                                                                           | Why                                                 |
| --------------------------------------------------------------------------------- | --------------------------------------------------- |
| Cache the KEK/DEK in memory for 30–60 s after a biometric prompt                  | Users hate authenticating for every 30-second code. |
| Show an “🔒E2EE” badge and let users download the recovery blob during onboarding | Sets mental model early.                            |
| Detect PRF *not* supported → politely steer users to a passkey update page        | Keeps crypto surface consistent.                    |
| Treat PRF failures (e.g., security-key removed) as log-out events                 | Prevents ghost sessions.                            |

---

## 9 Security checklist (build-time & run-time)

* **Strict CSP + COOP/COEP** to cut XSS vectors that would let an attacker call `decrypt()`.
* Pin modern TLS (TLS 1.3) and HSTS.
* Use `SameSite=Strict` cookies or, better, *token-bound* session cookies to thwart CSRF.
* Perform **independent cryptography review**—TOTP seeds are long-lived shared secrets.
* Unit-test with known RFC 6238 test vectors to guarantee code generation conformity. ([datatracker.ietf.org][8])

---

## 10 When *not* to use this architecture

* If your backend needs the plain TOTP key to verify logins (traditional 2-FA **for your own service**), you can’t keep it encrypted from yourself.
* If you must support SMS or push-OTP fallback on the server side, store a *separate* seed dedicated to that channel.

---

### TL;DR

1. **KEK** ← WebAuthn-PRF passkey (synced ⇒ multi-device).
2. **DEK** ← HKDF(KEK).
3. **Seed** ← AES-GCM(DEK, IV).
4. Server stores only `{iv, ct, wrappedDEK}` — never the clear secret.
5. Local cache + OPFS for offline; recovery via synced passkey or encrypted export.

Follow these layers and you’ll match the security posture of modern password managers while giving users the “set-up-once, works-everywhere” experience they expect in 2025.

---

**Next step?**
If you’d like concrete code for one of the flows above (e.g., the backup blob export), let me know which one and I’ll sketch it out.

[1]: https://www.corbado.com/blog/passkeys-prf-webauthn?utm_source=chatgpt.com "Using Passkeys and PRF for End-to-End Encryption (2025)"
[2]: https://support.apple.com/en-us/102195?utm_source=chatgpt.com "About the security of passkeys - Apple Support"
[3]: https://webauthn.me/passkeys?utm_source=chatgpt.com "WebAuthn and Passkeys"
[4]: https://www.theverge.com/2024/10/10/24266780/microsoft-windows-11-passkey-redesign-windows-hello?utm_source=chatgpt.com "Windows 11's new passkey design includes cloud syncing and 1Password integration"
[5]: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html?utm_source=chatgpt.com "Cryptographic Storage Cheat Sheet - OWASP"
[6]: https://security.stackexchange.com/questions/181184/storing-totp-secret-in-database-plaintext-or-encrypted?utm_source=chatgpt.com "Storing TOTP secret in database, plaintext or encrypted?"
[7]: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system?utm_source=chatgpt.com "Origin private file system - Web APIs | MDN - MDN Web Docs"
[8]: https://datatracker.ietf.org/doc/html/rfc6238?utm_source=chatgpt.com "RFC 6238 - TOTP: Time-Based One-Time Password Algorithm - IETF Datatracker"
