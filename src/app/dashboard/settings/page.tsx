import SettingsClient from "@/src/components/dashboard/settings/SettingsClient";
import { env, isAccountDeletionEnabled } from "@/src/lib/env";

export default function SettingsPage() {
  return <SettingsClient accountDeletionEnabled={isAccountDeletionEnabled()} supportEmail={env.supportEmail} />;
}
