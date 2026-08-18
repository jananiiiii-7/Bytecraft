import { getHealthStatus } from "../controllers/healthController";

export function getHealthPayload() {
  return getHealthStatus();
}
