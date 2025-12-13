import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Session } from "next-auth";

type ActionContext = {
  session: Session;
  user: any; 
};

type ActionHandler<T, R> = (data: T, ctx: ActionContext) => Promise<R>;

export async function authenticatedAction<T = any, R = any>(
  handler: ActionHandler<T, R>,
  data?: T
): Promise<R | { error: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    const ctx: ActionContext = {
      session,
      user: session.user,
    };

    return await handler(data as T, ctx);
  } catch (error) {
    console.error("Action Error:", error);
    return { error: "Something went wrong" };
  }
}
