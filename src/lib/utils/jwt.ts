import { SignJWT, jwtVerify } from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'soso-creative-hub-secret-key-123-please-change-in-prod';
  return new TextEncoder().encode(secret);
};

export async function signPortalToken(clientId: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 24 * 60 * 60; // 24 hours

  return new SignJWT({ clientId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(getJwtSecret());
}

export async function verifyPortalToken(token: string): Promise<{ clientId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { clientId: string };
  } catch (error) {
    console.error('Error verifying portal token:', error);
    return null;
  }
}
