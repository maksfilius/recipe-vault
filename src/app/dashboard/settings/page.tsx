import SettingsClient from "@/src/components/dashboard/settings/SettingsClient";
import { isAccountDeletionEnabled } from "@/src/lib/env";

export default function SettingsPage() {
  return <SettingsClient accountDeletionEnabled={isAccountDeletionEnabled()} />;
}
