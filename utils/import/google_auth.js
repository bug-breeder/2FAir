const protobuf = require("protobufjs");
const { URL } = require("url");
const decodeGoogleAuthenticatorBackupURL = require("../export/google_auth.js");

// Protobuf definitions for the OTP migration payload
const root = protobuf.Root.fromJSON({
  nested: {
    migration_payload: {
      nested: {
        MigrationPayload: {
          fields: {
            otp_parameters: { rule: "repeated", type: "OtpParameters", id: 1 },
            version: { type: "int32", id: 2 },
            batch_size: { type: "int32", id: 3 },
            batch_index: { type: "int32", id: 4 },
            batch_id: { type: "int32", id: 5 },
          },
        },
        OtpParameters: {
          fields: {
            secret: { type: "bytes", id: 1 },
            name: { type: "string", id: 2 },
            issuer: { type: "string", id: 3 },
            algorithm: { type: "Algorithm", id: 4 },
            digits: { type: "int32", id: 5 },
            type: { type: "OtpType", id: 6 },
            counter: { type: "int64", id: 7 },
          },
        },
        Algorithm: {
          values: {
            ALGO_INVALID: 0,
            ALGO_SHA1: 1,
            // Add other algorithms if needed
          },
        },
        OtpType: {
          values: {
            OTP_INVALID: 0,
            OTP_HOTP: 1,
            OTP_TOTP: 2,
          },
        },
      },
    },
  },
});

const MigrationPayload = root.lookupType("migration_payload.MigrationPayload");

async function generateGoogleAuthenticatorBackupURL(otps) {
  const otpParameters = otps.map((otp) => ({
    secret: Buffer.from(otp.secret, "base64"), // Assuming secret is base64 encoded
    name: otp.label,
    issuer: otp.issuer,
    algorithm: otp.algorithm === "SHA1" ? 1 : 0, // Adjust as needed for other algorithms
    digits: otp.digits,
    type: otp.method === "HOTP" ? 1 : otp.method === "TOTP" ? 2 : 0,
    counter: otp.method === "HOTP" ? otp.counter : 0, // HOTP uses counter, TOTP uses period
  }));

  const payload = {
    otp_parameters: otpParameters,
    version: 1,
    batch_size: otpParameters.length,
    batch_index: 0,
    batch_id: 0,
  };

  const errMsg = MigrationPayload.verify(payload);
  if (errMsg) throw Error(errMsg);

  const message = MigrationPayload.create(payload);
  const buffer = MigrationPayload.encode(message).finish();

  const base64Data = Buffer.from(buffer).toString("base64");
  const url = new URL("otpauth-migration://offline");
  url.searchParams.set("data", encodeURIComponent(base64Data));

  return url.toString();
}

module.exports = generateGoogleAuthenticatorBackupURL;

// Example usage with mongoose OTP schema
// const mongoose = require("mongoose");

// const otpSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   issuer: String,
//   label: String,
//   secret: String,
//   algorithm: String,
//   digits: Number,
//   period: Number,
//   counter: Number,
//   method: String,
//   createdAt: { type: Date, default: Date.now },
// });

// const Otp = mongoose.model("Otp", otpSchema);

// (async () => {
//   // Example OTP objects
//   const otps = [
//     {
//       issuer: "ExampleIssuer",
//       label: "johndoe@example.com",
//       secret: "THIl8+Jl6ugxr8x0X6eRMg==", // Base64 encoded secret
//       algorithm: "SHA1",
//       digits: 6,
//       method: "TOTP",
//       period: 30,
//       counter: 0,
//     },
//     {
//       algorithm: "SHA1",
//       digits: null, // Assuming default TOTP digits is 6
//       method: "TOTP", // Assuming the method is HOTP as per your data
//       secret: "THIl8+Jl6ugxr8x0X6eRMg", // Corrected expected secret
//       label: "johndoe@example.com", // Assuming this is the email used as label
//       issuer: "Discord",
//       period: null, // Assuming default TOTP period is 30
//       counter: null, // Assuming counter is null for TOTP
//     },
//   ];

//   const url = await generateGoogleAuthenticatorBackupURL(otps);
//   console.log(url);
//   console.log(decodeGoogleAuthenticatorBackupURL(url));
// })();
