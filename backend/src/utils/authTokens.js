import { config } from '../config/index.js';

export const REFRESH_COOKIE_NAME = 'fc_refresh_token';

const getCookieOptions = () => {
  const isProduction = config.env === 'production';
  const domain = process.env.COOKIE_DOMAIN || undefined;

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api',
    domain,
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14일
  };
};

export const setRefreshTokenCookie = (res, token) => {
  const options = getCookieOptions();
  res.cookie(REFRESH_COOKIE_NAME, token, options);
};

export const clearRefreshTokenCookie = (res) => {
  const options = getCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
};

