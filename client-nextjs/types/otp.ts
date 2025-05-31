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
  CurrentExpireAt: Date;
  NextCode: string;
  NextExpireAt: Date;
}
