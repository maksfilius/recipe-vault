type User = { id: string };
type DashboardAuth = {
  getSession: () => Promise<{ data: { session: { user: User } | null } }>;
  getUser: () => Promise<{ data: { user: User | null }; error?: unknown }>;
};

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Auth request timed out.")), milliseconds);
    operation.then(
      (value) => { clearTimeout(timeout); resolve(value); },
      (error) => { clearTimeout(timeout); reject(error); },
    );
  });
}

export async function resolveDashboardIdentity(auth: DashboardAuth, timeoutMs = 2_500) {
  let cachedUserId: string | null = null;
  try {
    const { data } = await withTimeout(auth.getSession(), timeoutMs);
    cachedUserId = data.session?.user.id ?? null;
  } catch {
    // A verified user may still be available if the cached session cannot be read.
  }

  try {
    const { data, error } = await withTimeout(auth.getUser(), timeoutMs);
    if (data.user) return { userId: data.user.id, offline: false };
    if (!error) return { userId: null, offline: false };
  } catch {
    // Keep the last signed-in user's read-only snapshot available offline.
  }

  return { userId: cachedUserId, offline: Boolean(cachedUserId) };
}
