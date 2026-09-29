import { NextRequest, NextResponse } from "next/server";

const FUNCTIONS_BASE = "https://us-central1-wsmy-lab.cloudfunctions.net";

// Map API route -> Firebase Function name
const FUNCTION_MAP: Record<string, string> = {
  "dashboard":    "dashboardApi",
  "catalogs":     "catalogsApi",
  "clients":      "clientsApi",
  "billings":     "billingsApi",
  "payments":     "paymentsApi",
  "subscriptions":"subscriptionsApi",
  "coupons":      "couponsApi",
};

async function proxyToFunction(request: NextRequest, functionName: string, subPath = "/") {
  const targetUrl = `${FUNCTIONS_BASE}/${functionName}${subPath}${request.nextUrl.search}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const options: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) options.body = body;
  }

  const res = await fetch(targetUrl, options);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export { proxyToFunction, FUNCTION_MAP, FUNCTIONS_BASE };
