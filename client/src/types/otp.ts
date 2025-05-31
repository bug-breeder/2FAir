export interface OTP {
  Id: string;
  Issuer: string;
  Label: string;
  Secret: string;
  Period: number;
}

export interface OTPSecret {
  Id: string;
  CurrentCode: string;
  CurrentExpireAt: string; // Backend returns string, we'll parse to Date when needed
  NextCode: string;
  NextExpireAt: string; // Backend returns string, we'll parse to Date when needed
}

export interface OTPWithCodes extends OTP {
  CurrentCode: string;
  CurrentExpireAt: Date;
  NextCode: string;
  NextExpireAt: Date;
  displayCode: string; // The code currently being displayed
}
