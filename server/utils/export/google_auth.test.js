const decodeGoogleAuthenticatorBackupURL = require('./google_auth.js');

describe('decodeGoogleAuthenticatorBackupURL', () => {
  it('should correctly decode and process OTP parameters from the backup URL', () => {
    const url = 'otpauth-migration://offline?data=CjYKEExyJfPiZeroMa/MdF%2BnkTISE2pvaG5kb2VAZXhhbXBsZS5jb20aB0Rpc2NvcmQgASgBMAIQARgBIAA%3D';
    
    const expectedOtps = [
      {
        algorithm: 'SHA1',
        digits: null,  // Assuming default TOTP digits is 6
        method: 'TOTP',  // Assuming the method is HOTP as per your data
        secret: 'THIl8+Jl6ugxr8x0X6eRMg',  // Corrected expected secret
        label: 'johndoe@example.com',  // Assuming this is the email used as label
        issuer: 'Discord',
        period: null,  // Assuming default TOTP period is 30
        counter: null  // Assuming counter is null for TOTP
      }
    ];

    const decodedOtps = decodeGoogleAuthenticatorBackupURL(url);
    console.log(decodedOtps)
    expect(decodedOtps).toEqual(expectedOtps);
  });

  it('should throw an error for invalid protocol', () => {
    const url = 'http://offline?data=CjYKEExyJfPiZeroMa/MdF%2BnkTISE2pvaG5kb2VAZXhhbXBsZS5jb20aB0Rpc2NvcmQgASgBMAIQARgBIAA%3D';
    expect(() => decodeGoogleAuthenticatorBackupURL(url)).toThrow('Invalid OTP migration URL format: expected protocol to be otpauth-migration, got http:');
  });

  it('should throw an error for invalid host', () => {
    const url = 'otpauth-migration://invalid?data=CjYKEExyJfPiZeroMa/MdF%2BnkTISE2pvaG5kb2VAZXhhbXBsZS5jb20aB0Rpc2NvcmQgASgBMAIQARgBIAA%3D';
    expect(() => decodeGoogleAuthenticatorBackupURL(url)).toThrow('Invalid OTP migration URL format: expected host to be offline, got invalid');
  });

  it('should throw an error for missing data parameter', () => {
    const url = 'otpauth-migration://offline';
    expect(() => decodeGoogleAuthenticatorBackupURL(url)).toThrow('Invalid OTP migration URL format: expected a data query parameter');
  });
});
