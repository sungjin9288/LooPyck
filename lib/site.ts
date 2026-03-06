import { resolveSiteName, resolveSiteUrl } from '@/lib/config/appConfig';

export const SITE_NAME = resolveSiteName();
export const SITE_URL = resolveSiteUrl();
export const SITE_HOST = new URL(SITE_URL).hostname.replace(/^www\./, '');
