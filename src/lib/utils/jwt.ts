import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'soso-creative-hub-secret-key-123-please-change-in-prod';
};

export async function signPortalToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { clientId },
      getJwtSecret(),
      { expiresIn: "24h", algorithm: "HS256" },
      (err, token) => {
        if (err || !token) reject(err);
        else resolve(token);
      }
    );
  });
}

export async function verifyPortalToken(token: string): Promise<{ clientId: string } | null> {
  return new Promise((resolve) => {
    jwt.verify(token, getJwtSecret(), (err, decoded) => {
      if (err) resolve(null);
      else resolve(decoded as { clientId: string });
    });
  });
}
