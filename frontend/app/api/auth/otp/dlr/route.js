import { NextResponse } from "next/server";
import { smsService } from "@/lib/auth/smsService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId || messageId.length > 80) {
      return NextResponse.json(
        { success: false, error: "Valid messageId is required." },
        { status: 400 }
      );
    }

    const dlr = await smsService.getDeliveryStatus(messageId);
    return NextResponse.json({
      success: true,
      messageId,
      status: dlr.status || "queued",
      stat: dlr.stat || "SUBMITTED",
      deliveredAt: dlr.deliveredAt || null,
      err: dlr.err || null,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to query delivery status." },
      { status: 500 }
    );
  }
}
