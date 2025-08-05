"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page Error:", error);
  }, [error]);

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1">Something went wrong!</h1>
        <div className="empty-state">
          <h3 className="h3 mt-4">Unable to load files</h3>
          <p className="body-1 text-light-200 mt-2">
            Please check your connection and try again.
          </p>
          <button onClick={reset} className="button mt-4">
            Try again
          </button>
        </div>
      </section>
    </div>
  );
}
