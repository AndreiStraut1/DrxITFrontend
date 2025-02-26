import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import PSHPopup from "./PSHPopup";
import { Product } from "../models/Product";
import { StageHistory } from "../models/StageHistory";
import ProductStageHistory from "./ProductStageHistory";

interface ProductListProps {
  refresh: boolean;
  onMoveToNextStage: () => void;
}

const ProductList: React.FC<ProductListProps> = ({
  refresh,
  onMoveToNextStage,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buttonPopup, setButtonPopup] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const { accessToken } = useAuth();
  const { user } = useAuth();

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/products/get-all", {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          const productsData: Product[] = response.data;
          // For each product, fetch its current stage in parallel
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
          });
        } else {
          setError(response.data);
        }
      })
      .catch((err) => {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  }, [accessToken, refresh]);

  const handleNextStage = (productId: number) => {
    axios
      .post(
        `http://localhost:8080/api/products/${productId}/next-stage`,
        {},
        {
          headers: accessToken
            ? { Authorization: "Bearer " + accessToken }
            : {},
        }
      )
      .then(() => {
        onMoveToNextStage();
      })
      .catch((err) => {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  };

  const handleDelete = (productId: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    axios
      .delete(`http://localhost:8080/api/products/${productId}/delete`, {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then(() => {
        setProducts(products.filter((product) => product.id !== productId)); // Remove product from UI
      })
      .catch((err) => {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  };

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const openStageHistory = (productId: number) => {
    setSelectedProductId(productId);
    setButtonPopup(true);
  };

  return (
    <div className="container mt-3">
      <h2 className="mb-4">Products</h2>
      {error && (
        <div className="alert alert-danger" role="alert">
          Error: {error}
        </div>
      )}
      {products.length === 0 && !error ? (
        <p>No products available.</p>
      ) : (
        <div className="row">
          {products.map((product) => (
            <div key={product.id} className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text">{product.description}</p>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">
                    <strong>Height:</strong> {product.estimated_height}
                  </li>
                  <li className="list-group-item">
                    <strong>Weight:</strong> {product.estimated_weight}
                  </li>
                  <li className="list-group-item">
                    <strong>Width:</strong> {product.estimated_width}
                  </li>
                  <li className="list-group-item">
                    <strong>Width:</strong> {product.estimated_width}
                  </li>
                  <li className="list-group-item">
                    <strong>Current Stage:</strong> {product.currentStage}
                  </li>
                </ul>
                <div className="card-footer text-center">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleNextStage(product.id)}
                  >
                    Move to Next Stage
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => openStageHistory(product.id)}
                  >
                    Stage History
                  </button>
                  <PSHPopup trigger={buttonPopup} setTrigger={setButtonPopup}>
                    {selectedProductId && (
                      <ProductStageHistory
                        productId={selectedProductId}
                      ></ProductStageHistory>
                    )}
                  </PSHPopup>
                  {isAdmin && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete Product
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
