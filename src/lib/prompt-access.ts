import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

export function canViewPrompt(
  prompt: { isPrivate: boolean; authorId: string } | null,
  session: Session | null
): boolean {
  if (!prompt) return false;
  if (!prompt.isPrivate) return true;
  return prompt.authorId === session?.user?.id || session?.user?.role === "ADMIN";
}

export async function checkPromptAccess(
  prompt: { isPrivate: boolean; authorId: string } | null
): Promise<NextResponse | null> {
  if (!prompt) {
    return NextResponse.json(
      { error: "not_found", message: "Prompt not found" },
      { status: 404 }
    );
  }
  if (!prompt.isPrivate) return null;
  const session = await auth();
  if (!canViewPrompt(prompt, session)) {
    return NextResponse.json(
      { error: "not_found", message: "Prompt not found" },
      { status: 404 }
    );
  }
  return null;
}
