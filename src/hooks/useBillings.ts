import useSWR from "swr";
import type { Billing } from "@/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

export interface UseBillingsOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch billings");
  }
  return data;
};

export function useBillings(options?: UseBillingsOptions) {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.status) params.append("status", options.status);
  if (options?.search) params.append("search", options.search);

  const url = `/api/billings${params.toString() ? `?${params.toString()}` : ""}`;

  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 5000, // Poll every 5s for near-real-time updates
    revalidateOnFocus: true,
  });

  return { 
    billings: (data?.data as Billing[]) || [], 
    pagination: data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 }, 
    loading: isLoading, 
    error: error?.message || null, 
    refetch: mutate 
  };
}
