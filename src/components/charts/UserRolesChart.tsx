import React, { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import axios from "axios";
import { useAuth } from "../../context/useAuth";

ChartJS.register(ArcElement, Tooltip, Legend);

interface UserRole {
  name: string;
  count: number;
}

const UserRolesChart: React.FC = () => {
  const [roleDistribution, setRoleDistribution] = useState<UserRole[]>([]);
  const { accessToken } = useAuth();

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/users/get-all", {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          const users = response.data;
          const roleCount: Record<string, number> = {};

          users.forEach((user: { roles: { name: string }[] }) => {
            user.roles.forEach((role: { name: string }) => {
              roleCount[role.name] = (roleCount[role.name] || 0) + 1;
            });
          });

          const distribution = Object.entries(roleCount).map(
            ([name, count]) => ({ name, count })
          );
          setRoleDistribution(distribution);
        }
      })
      .catch((err) => {
        console.error("Error fetching user data for chart:", err);
      });
  }, [accessToken]);

  const data = {
    labels: roleDistribution.map((role) => role.name),
    datasets: [
      {
        label: "Users",
        data: roleDistribution.map((role) => role.count),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="card shadow">
      <div className="card-header">
        <h5>User Role Distribution</h5>
      </div>
      <div className="card-body">
        <div style={{ maxHeight: "300px" }}>
          <Doughnut data={data} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
};

export default UserRolesChart;
