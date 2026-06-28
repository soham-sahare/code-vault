/**
 * Shared authentication helper for use in API Route handlers.
 * Server Actions have their own `requireAuth()` closure,
 * but API Routes need this exported version.
 *
 * Per PLAN.md § 13: "Every DB mutation verifies user_id = session.userId
 * before proceeding."
 */
import { auth } from "@/auth";

export async function requireAuth(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}
