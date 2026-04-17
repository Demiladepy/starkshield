type TelemetryPayload = Record<string, unknown>;

function redact(payload: TelemetryPayload): TelemetryPayload {
  const next: TelemetryPayload = { ...payload };
  for (const key of ["publicKey", "recipient", "address", "privateKey", "walletId"]) {
    if (key in next) next[key] = "[redacted]";
  }
  return next;
}

interface TelemetryAdapter {
  info: (event: string, payload: TelemetryPayload) => void;
  error: (event: string, payload: TelemetryPayload) => void;
}

const consoleAdapter: TelemetryAdapter = {
  info: (event, payload) => console.info(`[telemetry] ${event}`, payload),
  error: (event, payload) => console.error(`[telemetry] ${event}`, payload),
};

let activeAdapter: TelemetryAdapter = consoleAdapter;

export function setTelemetryAdapter(adapter: TelemetryAdapter): void {
  activeAdapter = adapter;
}

export function telemetryInfo(event: string, payload: TelemetryPayload = {}): void {
  activeAdapter.info(event, redact(payload));
}

export function telemetryError(event: string, payload: TelemetryPayload = {}): void {
  activeAdapter.error(event, redact(payload));
}
