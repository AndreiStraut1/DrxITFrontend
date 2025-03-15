import React, { useState, useEffect } from "react";
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
import axios from "axios";
import { useAuth } from "../../context/useAuth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StageTransition {
  fromStage: string;
  toStage: string;
  durationDays: number;
}

interface ProductStageData {
  productId: number;
  transitions: StageTransition[];
}

interface AverageTransition {
  fromStage: string;
  toStage: string;
  averageDurationDays: number;
  count: number;
}

const StageTransitionChart: React.FC = () => {
  const [averageTransitions, setAverageTransitions] = useState<
    AverageTransition[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const productsResponse = await axios.get(
          "http://localhost:8080/api/products/get-all",
          {
            headers: accessToken
              ? { Authorization: "Bearer " + accessToken }
              : {},
          }
        );

        const products = productsResponse.data;

        const productsWithHistory: ProductStageData[] = await Promise.all(
          products.map(async (product: any) => {
            try {
              const historyResponse = await axios.get(
                `http://localhost:8080/api/products/${product.id}/get-stage-history`,
                {
                  headers: accessToken
                    ? { Authorization: "Bearer " + accessToken }
                    : {},
                }
              );

              const stageHistory = historyResponse.data.map((record: any) => ({
                stageName: record.stage.name,
                startOfStage: record.startOfStage,
              }));

              stageHistory.sort(
                (a: any, b: any) =>
                  new Date(a.startOfStage).getTime() -
                  new Date(b.startOfStage).getTime()
              );

              const transitions: StageTransition[] = [];
              for (let i = 0; i < stageHistory.length - 1; i++) {
                const fromStage = stageHistory[i];
                const toStage = stageHistory[i + 1];

                const fromDate = new Date(fromStage.startOfStage);
                const toDate = new Date(toStage.startOfStage);

                const durationDays =
                  (toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24);

                transitions.push({
                  fromStage: fromStage.stageName,
                  toStage: toStage.stageName,
                  durationDays,
                });
              }

              return {
                productId: product.id,
                transitions,
              };
            } catch (err) {
              console.error(
                `Error fetching history for product ${product.id}:`,
                err
              );
              return {
                productId: product.id,
                transitions: [],
              };
            }
          })
        );

        const transitionMap: Record<string, { sum: number; count: number }> =
          {};

        productsWithHistory.forEach((product) => {
          product.transitions.forEach((transition) => {
            const key = `${transition.fromStage}→${transition.toStage}`;

            if (!transitionMap[key]) {
              transitionMap[key] = { sum: 0, count: 0 };
            }

            transitionMap[key].sum += transition.durationDays;
            transitionMap[key].count += 1;
          });
        });

        const averages: AverageTransition[] = Object.entries(transitionMap).map(
          ([key, value]) => {
            const [fromStage, toStage] = key.split("→");
            return {
              fromStage,
              toStage,
              averageDurationDays: value.sum / value.count,
              count: value.count,
            };
          }
        );

        const stageOrder = [
          "CONCEPT",
          "FEASIBILITY",
          "PROJECTION",
          "PRODUCTION",
          "RETREAT",
          "STANDBY",
          "CANCEL",
        ];
        averages.sort((a, b) => {
          const aFromIndex = stageOrder.indexOf(a.fromStage);
          const bFromIndex = stageOrder.indexOf(b.fromStage);
          if (aFromIndex !== bFromIndex) return aFromIndex - bFromIndex;

          const aToIndex = stageOrder.indexOf(a.toStage);
          const bToIndex = stageOrder.indexOf(b.toStage);
          return aToIndex - bToIndex;
        });

        setAverageTransitions(averages);
        setLoading(false);
      } catch (err: any) {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  const chartData = {
    labels: averageTransitions.map((t) => `${t.fromStage} → ${t.toStage}`),
    datasets: [
      {
        label: "Average Days",
        data: averageTransitions.map((t) =>
          parseFloat(t.averageDurationDays.toFixed(2))
        ),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Average Days Between Product Stages",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const transition = averageTransitions[context.dataIndex];
            return [
              `Average: ${context.raw} days`,
              `Based on ${transition.count} transitions`,
            ];
          },
        },
      },
    },
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status"></div>
      </div>
    );
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="card shadow text-center">
      <div className="card-header">
        <h5 className="text-center">Average Stage Transition Duration</h5>
      </div>
      <div className="card-body d-flex flex-column align-items-center justify-content-center">
        {averageTransitions.length === 0 ? (
          <p className="text-center">No stage transition data available.</p>
        ) : (
          <div
            style={{
              height: "400px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Bar options={chartOptions} data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StageTransitionChart;
