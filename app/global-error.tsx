'use client';

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import NextError from "next/error";

interface GlobalErrorProps {
  error: Error & { digest?: string };
}

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={(error as { statusCode?: number })?.statusCode || 500} />
      </body>
    </html>
  );
}
