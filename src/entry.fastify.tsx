/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Fastify server when building for production.
 *
 * Learn more about Node.js server integrations here:
 * - https://qwik.dev/docs/deployments/node/
 *
 */
import { type PlatformNode } from "@builder.io/qwik-city/middleware/node";
import "dotenv/config";
import Fastify from "fastify";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import FastifyQwik from "./plugins/fastify-qwik";

declare global {
  type QwikCityPlatform = PlatformNode;
}

// Directories where the static assets are located
const distDir = join(fileURLToPath(import.meta.url), "..", "..", "dist");
const buildDir = join(distDir, "build");
const assetsDir = join(distDir, "assets");

// Allow for dynamic port and host
const PORT = parseInt(process.env.PORT ?? "3000");
const HOST = process.env.HOST ?? "0.0.0.0";

const start = async () => {
  const fastify = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: false,
          translateTime: "SYS:mm-dd HH:MM:ss",
          ignore: "pid,hostname",
          singleLine: true,
          hideObject: true,
        },
      },
    },
    disableRequestLogging: true,
  });

  fastify.addHook("onRequest", async (request) => {
    request.log.info(
      `${request.method} ${request.url} from ${request.hostname}\n`,
    );
  });

  fastify.addHook("onResponse", async (request, reply) => {
    request.log.info(
      `${request.method} ${request.url} ${reply.statusCode}\n`,
    );
  });

  await fastify.register(FastifyQwik, { distDir, buildDir, assetsDir });
  await fastify.listen({ port: PORT, host: HOST });
};

start();
