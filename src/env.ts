import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DISCORD_TOKEN: z.string().min(1),
    APP_ID: z.string().min(1),
    DATABASE_URL: z.string().url(),
    UPSTASH_REDIS_URL: z.string().url(),
    UPSTASH_REDIS_TOKEN: z.string().min(1),
  },
  //this is server only so we don't need client
  client: {},
  clientPrefix: "",
  runtimeEnv: process.env,
});
