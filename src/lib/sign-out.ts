// Shared by the desktop account menu (AppShell) and Settings, the only sign-out on phones.
export async function signOutThisDevice(
  auth: { signOut: () => Promise<{ error: unknown }> },
  clearOfflineData: () => Promise<void>,
): Promise<boolean> {
  const { error } = await auth.signOut();
  if (error) {
    console.error("Failed to sign out", error);
    return false;
  }
  await clearOfflineData();
  return true;
}
