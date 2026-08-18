export function getHealthStatus() {
  return {
    ok: true,
    service: "bytecraft-os-server",
    timestamp: new Date().toISOString(),
  };
}
