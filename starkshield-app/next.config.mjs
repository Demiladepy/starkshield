import path from "node:path";
import { fileURLToPath } from "node:url";
import webpack from "webpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http: https: ws: wss:",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const csp = process.env.NEXT_PUBLIC_CSP || defaultCsp;
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const tongo = path.join(__dirname, "src/stubs/starkzap-tongo.js");
      const hyper = path.join(__dirname, "src/stubs/starkzap-hyperlane.js");
      const sol = path.join(__dirname, "src/stubs/starkzap-solana-web3.js");
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]starkzap[\\/]dist[\\/]src[\\/]confidential[\\/]tongo\.js$/,
          tongo,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]starkzap[\\/]dist[\\/]src[\\/]bridge[\\/]solana[\\/]hyperlaneRuntime\.js$/,
          hyper,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]starkzap[\\/]dist[\\/]src[\\/]connect[\\/]solanaWeb3Runtime\.js$/,
          sol,
        ),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
