"use client";

import { useEffect } from "react";
import { telemetryError } from "@/lib/telemetry";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    telemetryError("dashboard_render_error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
      <p className="font-semibold">Dashboard failed to render.</p>
      <p className="mt-1">Please retry. If this persists, check wallet/network settings and refresh the app.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 font-semibold text-red-800 hover:bg-red-100"
      >
        Retry
      </button>
    </div>
  );
}
