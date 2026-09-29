import { NextRequest } from "next/server";
import { proxyToFunction } from "@/lib/functions-proxy";

export async function GET(request: NextRequest) {
  return proxyToFunction(request, "couponsApi", "/");
}

export async function POST(request: NextRequest) {
  return proxyToFunction(request, "couponsApi", "/");
}
