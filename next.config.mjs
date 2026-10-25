/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";
// Vercel shows its feedback toolbar on preview deployments only.
const isPreview = process.env.VERCEL_ENV === "preview";
const live = isPreview ? " https://vercel.live https://*.vercel.live" : "";

// Content Security Policy: the app loads scripts, styles, fonts and images only from itself.
// 'unsafe-inline' is needed for the inline scripts Next.js adds; 'unsafe-eval' only in development.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${live}`,
  `style-src 'self' 'unsafe-inline'${live}`,
  `img-src 'self' data: blob:${live}`,
  `font-src 'self' data:${live}`,
  `connect-src 'self'${isDev ? " ws:" : ""}${live}${isPreview ? " wss://*.pusher.com" : ""}`,
  `frame-src ${isPreview ? "https://vercel.live" : "'none'"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Location is used only by the elder SOS on this site; camera and microphone are never used.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
