import { NextResponse } from "next/server";
import { n8nClient } from "@/lib/n8n/client";
import { websitesDb } from "@/lib/db/websites";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("X-Nexus-Auth");
    if (!n8nClient.verifyCallbackSecret(authHeader)) {
      return NextResponse.json({ error: "Unauthorized callback" }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobId,
      websiteId,
      status,
      currentStep,
      progress,
      discoveredCount,
      indexedCount,
      failedCount,
      errorDetails,
    } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const existingJob = await websitesDb.getIngestionJob(jobId);
    if (existingJob && websiteId && existingJob.websiteSourceId && existingJob.websiteSourceId !== websiteId) {
      return NextResponse.json({ error: "websiteId does not match ingestion job" }, { status: 400 });
    }

    const updates = {};
    if (status) updates.jobStatus = String(status).slice(0, 64);
    if (currentStep) updates.currentStep = String(currentStep).slice(0, 240);
    if (progress !== undefined) updates.progress = Math.max(0, Math.min(100, Number(progress) || 0));
    if (discoveredCount !== undefined) updates.discoveredCount = Math.max(0, Number(discoveredCount) || 0);
    if (indexedCount !== undefined) updates.indexedCount = Math.max(0, Number(indexedCount) || 0);
    if (failedCount !== undefined) updates.failedCount = Math.max(0, Number(failedCount) || 0);
    if (errorDetails) updates.errorDetails = String(errorDetails).slice(0, 1000);

    if (status === "Completed" || status === "Failed") {
      updates.finishedAt = new Date().toISOString();
    }

    await websitesDb.updateIngestionJob(jobId, updates);

    if (websiteId && (status === "Completed" || status === "Failed")) {
      await websitesDb.updateWebsiteSource(websiteId, {
        status: status === "Completed" ? "Ready" : "Failed",
        lastSyncedAt: new Date().toISOString(),
        lastError: errorDetails || null,
      });
    }

    return NextResponse.json({ success: true, message: "Progress updated" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
