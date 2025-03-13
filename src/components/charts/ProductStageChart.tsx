import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { Product } from "../../models/Product";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProductStageChartProps {
  products: Product[];
}

const ProductStageChart: React.FC<ProductStageChartProps> = ({ products }) => {
  const stagesCount: Record<string, number> = {};

  products.forEach((product) => {
    const stage = product.currentStage || "Unknown";
    stagesCount[stage] = (stagesCount[stage] || 0) + 1;
  });

  const data = {
    labels: Object.keys(stagesCount),
    datasets: [
      {
        label: "Products by Stage",
        data: Object.values(stagesCount),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(199, 199, 199, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="card shadow">
      <div className="card-header">
        <h5>Product Stage Distribution</h5>
      </div>
      <div className="card-body">
        <div style={{ maxHeight: "300px" }}>
          <Pie data={data} options={{ maintainAspectRatio: false }}></Pie>
        </div>
      </div>
    </div>
  );
};

export default ProductStageChart;
