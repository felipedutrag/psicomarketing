import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Evita o redirecionamento automático de URLs terminadas em barra '/'
  skipTrailingSlashRedirect: true,

  logging: {
    incomingRequests: false,
  },

  // Garante que o Turbopack reconheça a pasta deste subprojeto como a raiz dele
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;