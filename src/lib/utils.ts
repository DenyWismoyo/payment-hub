import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: string) {
  switch (status) {
    case "paid": return "bg-green-100 text-green-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "overdue": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "paid": return "Lunas";
    case "pending": return "Menunggu";
    case "overdue": return "Jatuh Tempo";
    default: return status;
  }
}
