import React, { useState, useEffect } from "react";
import axios from "axios";
import { StageHistory } from "../models/StageHistory";
import { useAuth } from "../context/useAuth";

interface ProductStageHistoryProps {
  productId: number;
}

const ProductStageHistory: React.FC<ProductStageHistoryProps> = ({
  productId,
}) => {
  const [history, setHistory] = useState<StageHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    axios
      .get(
        `http://localhost:8080/api/products/${productId}/get-stage-history`,
        {
          headers: accessToken
            ? { Authorization: "Bearer " + accessToken }
            : {},
        }
      )
      .then((response) => {
        const historyData: StageHistory[] = response.data.map(
          (record: any) => ({
            stageName: record.stage.name,
            changedBy: record.user.username,
            startOfStage: record.startOfStage,
          })
        );
        setHistory(historyData);
      })
      .catch((err) => {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  }, [accessToken, productId]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!history.length) {
    return <div>No stage history available.</div>;
  }

  return (
    <div>
      <h3>Stage History</h3>
      <ul>
        {history.map((record, index) => (
          <li key={index}>
            <strong>{record.stageName}</strong> changed by {record.changedBy} on{" "}
            {new Date(record.startOfStage).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductStageHistory;
