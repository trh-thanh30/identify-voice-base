import { registerAs } from '@nestjs/config';

const isProd = process.env.NODE_ENV === 'production';

export default registerAs('cookie', () => {
  const domain = isProd ? process.env.COOKIE_DOMAIN : 'localhost';
  const secure = process.env.COOKIE_SECURE === 'true';
  const sameSite = secure ? 'none' : isProd ? 'lax' : 'lax';

  return {
    // In production, if domain is not explicitly provided or is localhost,
    // it's better to leave it undefined so it defaults to the host domain.
    domain: domain && domain !== 'localhost' ? domain : undefined,
    // sameSite='none' requires secure=true, so HTTP deployments must use lax/strict.
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    secure,
    httpOnly: process.env.COOKIE_HTTP_ONLY === 'true',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000', 10),
    path: process.env.COOKIE_PATH || '/',
    // partitioned attribute (CHIPS) is required for some browsers to accept 3rd party cookies
    partitioned: secure,
  };
});
