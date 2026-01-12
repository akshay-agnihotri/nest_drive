// File: app/api/test-my-action/route.ts

import { NextResponse } from "next/server";

import { signOut } from "@/lib/actions/user.action";

export async function GET() {
  console.log("Test API was called!");

  try {
    const result = await signOut();

    console.log("Action ran successfully!");
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Action failed:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}
