/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer', 'puppeteer-core'],
};

export default nextConfig;