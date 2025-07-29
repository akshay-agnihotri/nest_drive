// File: app/api/test-my-action/route.ts

import { NextResponse } from "next/server";

// --- EDIT THIS PART ---
// 1. Import your function from the action file.
import { signOut } from "@/lib/actions/user.action";
// --------------------

export async function GET() {
  console.log("Test API was called!");

  try {
    // --- EDIT THIS PART ---
    // 2. Call your function. Add arguments if it needs any.
    const result = await signOut();
    // --------------------

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
