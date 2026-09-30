import { nodeServerAdapter } from "@builder.io/qwik-city/adapters/node-server/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.fastify.tsx", "@qwik-city-plan"],
        external: [
          "tesseract.js",
          "tesseract.js-core",
          "wasm-feature-detect",
          "regenerator-runtime",
        ],
      },
    },
    ssr: {
      external: [
        "tesseract.js",
        "tesseract.js-core",
        "wasm-feature-detect",
        "regenerator-runtime",
      ],
    },
    plugins: [nodeServerAdapter({ name: "fastify" })],
  };
});
