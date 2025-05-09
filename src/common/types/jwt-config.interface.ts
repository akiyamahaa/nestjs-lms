export interface JwtConfig {
  secret: string;
  audience: string;
  issuer: string;
  accessTokenTtl: number;
  refreshTokenTtl: number;
}
