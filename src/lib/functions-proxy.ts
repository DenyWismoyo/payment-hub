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

  try {
    const res = await fetch(targetUrl, options);
    const contentType = res.headers.get("content-type");
    
    // Read as text first to prevent JSON parse errors on HTML/plain text
    const text = await res.text();
    let data;

    try {
      // Only parse if not empty
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error(`[proxyToFunction] Failed to parse JSON from ${targetUrl}. Status: ${res.status}. Body preview: ${text.substring(0, 100)}`);
      // If it's a 403 or other error that returns HTML
      if (!res.ok) {
        return NextResponse.json(
          { success: false, message: `Function error (${res.status}): ${res.statusText}`, debug: text.substring(0, 500) }, 
          { status: res.status }
        );
      }
      // If success but invalid JSON
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType || "text/plain" } });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    console.error(`[proxyToFunction] Network/Fetch error to ${targetUrl}:`, error);
    return NextResponse.json(
      { success: false, message: "Gagal menghubungi backend service", error: String(error) }, 
      { status: 500 }
    );
  }
}

export { proxyToFunction, FUNCTION_MAP, FUNCTIONS_BASE };
