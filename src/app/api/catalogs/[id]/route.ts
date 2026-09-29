import { NextRequest } from "next/server";
import { proxyToFunction } from "@/lib/functions-proxy";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, props: Props) {
  const { id } = await props.params;
  return proxyToFunction(request, "catalogsApi", `/${id}`);
}

export async function PUT(request: NextRequest, props: Props) {
  const { id } = await props.params;
  return proxyToFunction(request, "catalogsApi", `/${id}`);
}

export async function DELETE(request: NextRequest, props: Props) {
  const { id } = await props.params;
  return proxyToFunction(request, "catalogsApi", `/${id}`);
}
