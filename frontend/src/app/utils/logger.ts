import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Initializes Sentry for frontend error reporting.
 * Replace the DSN with your actual Sentry DSN.
 */
export const initMonitoring = () => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
    });
    console.info("Sentry monitoring initialized.");
  } else {
    console.warn("Sentry DSN not found. Frontend error reporting is disabled.");
  }
};

/**
 * Centralized logger that sends errors to Sentry if initialized,
 * otherwise logs to the console.
 */
export const logger = {
  info: (message: string, extra?: any) => {
    console.info(message, extra);
  },
  warn: (message: string, extra?: any) => {
    console.warn(message, extra);
    Sentry.withScope((scope) => {
      if (extra) scope.setExtras(extra);
      Sentry.captureMessage(message, "warning");
    });
  },
  error: (error: Error | string, extra?: any) => {
    console.error(error, extra);
    if (typeof error === "string") {
      Sentry.withScope((scope) => {
        if (extra) scope.setExtras(extra);
        Sentry.captureMessage(error, "error");
      });
    } else {
      Sentry.withScope((scope) => {
        if (extra) scope.setExtras(extra);
        Sentry.captureException(error);
      });
    }
  },
};
