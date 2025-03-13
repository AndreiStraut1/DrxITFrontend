import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import axios from "axios";
import { Product } from "../../models/Product";
import ProductStageChart from "../../components/charts/ProductStageChart";
import BomMaterialsChart from "../../components/charts/BomMaterialsChart";
import UserRolesChart from "../../components/charts/UserRolesChart";

const DashboardPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:8080/api/products/get-all", {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          const productsData = response.data;

          // After getting products, fetch their current stages
          Promise.all(
            productsData.map((prod) =>
              axios
                .get(
                  `http://localhost:8080/api/products/${prod.id}/get-current-stage`,
                  {
                    headers: accessToken
                      ? { Authorization: "Bearer " + accessToken }
                      : {},
                  }
                )
                .then((res) => res.data)
                .catch((error) => {
                  console.error(
                    "Error fetching current stage for product",
                    prod.id,
                    error.response || error
                  );
                  return "Unknown";
                })
            )
          ).then((stages) => {
            // Update each product with its current stage
            const updatedProducts = productsData.map((prod, index) => ({
              ...prod,
              currentStage: stages[index],
            }));
            setProducts(updatedProducts);
            setLoading(false);
          });
        } else {
          setError("Invalid data format received");
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
        setLoading(false);
      });
  }, [accessToken]);

  const handleHomePage = () => {
    navigate("/home");
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status"></div>
      </div>
    );
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Analytics Dashboard</h2>
        <button className="btn btn-primary" onClick={handleHomePage}>
          Back to Home
        </button>
      </div>

      <div className="row">
        {/* Left column with Product Stage Distribution & User Role Distribution stacked */}
        <div className="col-md-6">
          <div className="mb-4">
            <ProductStageChart products={products} />
          </div>
          {user?.roles.includes("ROLE_ADMIN") && (
            <div className="mb-4">
              <UserRolesChart />
            </div>
          )}
        </div>

        {/* Right column with Materials Usage chart */}
        <div className="col-md-6">
          <BomMaterialsChart products={products} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
