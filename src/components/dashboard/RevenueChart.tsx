"use client";

import { useTheme } from "next-themes";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRupiah } from "@/lib/utils";
import { useEffect, useState } from "react";

interface RevenueChartProps {
  data: { name: string; total: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return <div className="h-[300px] w-full mt-4 flex items-center justify-center animate-pulse bg-[var(--surface-hover)] rounded-xl" />;

  const isDark = resolvedTheme === "dark";
  const colors = {
    primary: isDark ? "#60a5fa" : "#3b82f6", // blue-400 : blue-500
    grid: isDark ? "#334155" : "#e2e8f0",    // slate-700 : slate-200
    text: isDark ? "#94a3b8" : "#64748b",    // slate-400 : slate-500
    background: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e2e8f0"
  };

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
          <XAxis 
            dataKey="name" 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000000) return `Rp${value / 1000000000}M`;
              if (value >= 1000000) return `Rp${value / 1000000}Jt`;
              if (value >= 1000) return `Rp${value / 1000}Rb`;
              return `Rp${value}`;
            }}
            width={65}
          />
          <Tooltip 
            formatter={(value: any) => [formatRupiah(Number(value) || 0), "Pendapatan"]}
            labelStyle={{ color: colors.text, marginBottom: "4px" }}
            contentStyle={{ 
              backgroundColor: colors.background, 
              borderColor: colors.border,
              borderRadius: "0.5rem",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            }}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke={colors.primary} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
