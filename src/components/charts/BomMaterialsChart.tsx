import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Product } from "../../models/Product";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BomMaterialsChartProps {
  products: Product[];
}

const BomMaterialsChart: React.FC<BomMaterialsChartProps> = ({ products }) => {
  const materialsUsage: Record<string, number> = {};

  products.forEach((product) => {
    if (product.bom && product.bom.bomMaterials) {
      product.bom.bomMaterials.forEach((material) => {
        const materialNumber = material.material.materialNumber;
        materialsUsage[materialNumber] =
          (materialsUsage[materialNumber] || 0) + material.quantity;
      });
    }
  });

  const sortedMaterials = Object.entries(materialsUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const data = {
    labels: sortedMaterials.map(([material]) => material),
    datasets: [
      {
        label: "Material Usage Quantity",
        data: sortedMaterials.map(([_, quantity]) => quantity),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Top 10 Materials by Usage" },
    },
  };

  return (
    <div className="card shadow">
      <div className="card-header">
        <h5>Materials Usage</h5>
      </div>
      <div className="card-body">
        <Bar options={options} data={data} height={300} />
      </div>
    </div>
  );
};

export default BomMaterialsChart;
