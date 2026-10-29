import { NextResponse } from "next/server";

export async function POST(request) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set({
    name: "ess_session",
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function GET(request) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set({
    name: "ess_session",
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
