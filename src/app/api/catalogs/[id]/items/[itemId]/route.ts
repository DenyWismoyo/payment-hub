import { NextRequest } from "next/server";
import { proxyToFunction } from "@/lib/functions-proxy";

type Props = { params: Promise<{ id: string; itemId: string }> };

export async function PUT(request: NextRequest, props: Props) {
  const { id, itemId } = await props.params;
  return proxyToFunction(request, "catalogsApi", `/${id}/items/${itemId}`);
}

export async function DELETE(request: NextRequest, props: Props) {
  const { id, itemId } = await props.params;
  return proxyToFunction(request, "catalogsApi", `/${id}/items/${itemId}`);
}
