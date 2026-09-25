import useSWR from "swr";
import { SettingsData } from "@/lib/validations/settings";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch settings");
  }
  const json = await res.json();
  return json.data;
};

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<SettingsData>("/api/settings", fetcher);

  const updateSettings = async (newData: SettingsData) => {
    const res = await fetchWithAuth("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update settings");
    }

    const json = await res.json();
    mutate(json.data, false);
    return json.data;
  };

  return {
    settings: data,
    isLoading,
    isError: error,
    updateSettings,
  };
}
