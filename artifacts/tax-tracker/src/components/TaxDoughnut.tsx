import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { LocalSpendingCategory } from "@/hooks/use-tax-store";

ChartJS.register(ArcElement, Tooltip, Legend);

interface TaxDoughnutProps {
  categories: LocalSpendingCategory[];
  totalLabel?: string;
  totalValue?: string;
  hideLegend?: boolean;
}

export function TaxDoughnut({ categories, totalLabel, totalValue, hideLegend = false }: TaxDoughnutProps) {
  const data = {
    labels: categories.map((c) => c.label),
    datasets: [
      {
        data: categories.map((c) => c.percentage * 100),
        backgroundColor: categories.map((c) => c.color),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        display: !hideLegend,
        position: "bottom" as const,
        labels: {
          color: "#A1A1AA",
          font: { family: "Inter", size: 12 },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "#18181B",
        titleColor: "#FFFFFF",
        bodyColor: "#A1A1AA",
        padding: 12,
        cornerRadius: 8,
        borderColor: "#27272A",
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const raw = context.raw || 0;
            return ` ${raw.toFixed(1)}% of total budget`;
          },
        },
      },
    },
  };

  return (
    <div className="relative w-full aspect-square max-h-[400px] flex items-center justify-center">
      <Doughnut data={data} options={options} />
      {totalValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-sm font-medium text-muted-foreground mb-1">{totalLabel}</span>
          <span className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
            {totalValue}
          </span>
        </div>
      )}
    </div>
  );
}
