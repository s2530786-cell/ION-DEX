/**
 * Legacy export: bridge nav uses BusinessPage → BridgeDeskPage.
 * This module re-exports the desk surface for imports/tests that still reference BridgePage.
 */
import { BusinessPage } from "@/pages/BusinessPages";

export function BridgePage() {
  return <BusinessPage page="bridge" />;
}
