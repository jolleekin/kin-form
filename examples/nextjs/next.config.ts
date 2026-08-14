import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  webpack: (config) => {
    config.resolve.alias["@kin-form/core"] = path.resolve(
      __dirname,
      "../../core/index.ts",
    );
    config.resolve.alias["@kin-form/react"] = path.resolve(
      __dirname,
      "../../react/index.ts",
    );
    config.resolve.alias["@kin-form/validators"] = path.resolve(
      __dirname,
      "../../validators/index.ts",
    );
    return config;
  },
};

export default nextConfig;
