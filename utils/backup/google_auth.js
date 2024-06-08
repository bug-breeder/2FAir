const protobuf = require('protobufjs');
const { URL } = require('url');

// Protobuf definitions for the OTP migration payload
const root = protobuf.Root.fromJSON({
  nested: {
    migration_payload: {
      nested: {
        MigrationPayload: {
          fields: {
            otp_parameters: { rule: 'repeated', type: 'OtpParameters', id: 1 },
            version: { type: 'int32', id: 2 },
            batch_size: { type: 'int32', id: 3 },
            batch_index: { type: 'int32', id: 4 },
            batch_id: { type: 'int32', id: 5 }
          }
        },
        OtpParameters: {
          fields: {
            secret: { type: 'bytes', id: 1 },
            name: { type: 'string', id: 2 },
            issuer: { type: 'string', id: 3 },
            algorithm: { type: 'Algorithm', id: 4 },
            digits: { type: 'int32', id: 5 },
            type: { type: 'OtpType', id: 6 },
            counter: { type: 'int64', id: 7 }
          }
        },
        Algorithm: {
          values: {
            ALGO_INVALID: 0,
            ALGO_SHA1: 1
          }
        },
        OtpType: {
          values: {
            OTP_INVALID: 0,
            OTP_HOTP: 1,
            OTP_TOTP: 2
          }
        }
      }
    }
  }
});

const MigrationPayload = root.lookupType('migration_payload.MigrationPayload');

function decodeGoogleAuthenticatorBackupURL(urlString) {
  const url = new URL(urlString);

  if (url.protocol !== 'otpauth-migration:') {
    throw new Error(`Invalid OTP migration URL format: expected protocol to be otpauth-migration, got ${url.protocol}`);
  }

  if (url.host !== 'offline') {
    throw new Error(`Invalid OTP migration URL format: expected host to be offline, got ${url.host}`);
  }

  const dataParam = url.searchParams.get('data');
  if (!dataParam) {
    throw new Error('Invalid OTP migration URL format: expected a data query parameter');
  }

  // Percent-decode and base64-decode the data parameter
  const decodedData = Buffer.from(decodeURIComponent(dataParam), 'base64');

  // Decode the protobuf message
  const message = MigrationPayload.decode(decodedData);
  const object = MigrationPayload.toObject(message, { defaults: true });

  // Process OTP parameters and convert to desired format
  const otps = object.otp_parameters.map(otp => ({
    algorithm: otp.algorithm === 1 ? 'SHA1' : 'UNKNOWN',
    digits: otp.type === 1 ? otp.digits : null, // default 6
    method: otp.type === 1 ? 'HOTP' : otp.type === 2 ? 'TOTP' : 'UNKNOWN',
    secret: otp.secret.toString('base64').replace(/=+$/, ''), // Remove padding
    label: otp.name,
    issuer: otp.issuer,
    period: otp.counter.toNumber() !== 0? otp.counter.toNumber(): null,  // Convert Long to number for TOTP
    counter: otp.counter.toNumber() !== 0? otp.counter.toNumber(): null,  // Convert Long to number for TOTP
  }));

  return otps;
}

module.exports = decodeGoogleAuthenticatorBackupURL; 

// Example usage

// const url = 'otpauth-migration://offline?data=CjYKEExyJfPiZeroMa/MdF%2BnkTISE2pvaG5kb2VAZXhhbXBsZS5jb20aB0Rpc2NvcmQgASgBMAIQARgBIAA%3D';
// const decodedOtps = decodeGoogleAuthenticatorBackupURL(url);
// console.log(decodedOtps);