import { StackServerApp } from "@stackframe/stack-server";
import type { Request } from "express";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  projectId: process.env.STACK_PROJECT_ID!,
  publishableClientKey: process.env.STACK_PUBLISHABLE_CLIENT_KEY!,
});

/**
 * Extract the Stack Auth user ID from the incoming request.
 * Returns null if the request is unauthenticated.
 */
export async function getStackUserId(req: Request): Promise<string | null> {
  try {
    const user = await stackServerApp.getUser({ tokenStore: req });
    return user?.id ?? null;
  } catch {
    return null;
  }
}
