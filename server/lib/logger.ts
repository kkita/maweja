const isDev = process.env.NODE_ENV !== "production";

type LogLevel = "info" | "warn" | "error";

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

function log(level: LogLevel, message: string, context?: unknown): void {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
  if (level === "error") {
    if (context instanceof Error) {
      console.error(`${prefix} ${message} —`, context.message);
      if (isDev && context.stack) console.error(context.stack);
    } else if (context !== undefined) {
      console.error(`${prefix} ${message}`, context);
    } else {
      console.error(`${prefix} ${message}`);
    }
  } else if (level === "warn") {
    console.warn(`${prefix} ${message}`, context !== undefined ? context : "");
  } else {
    // info-level logs are emitted in BOTH dev and prod so that operational
    // events (heartbeat, lifecycle, security observability) remain visible
    // in production logs. Use logger.debug() for dev-only verbose output.
    console.log(`${prefix} ${message}`, context !== undefined ? context : "");
  }
}

export const logger = {
  info: (msg: string, ctx?: unknown) => log("info", msg, ctx),
  warn: (msg: string, ctx?: unknown) => log("warn", msg, ctx),
  error: (msg: string, ctx?: unknown) => log("error", msg, ctx),
};
