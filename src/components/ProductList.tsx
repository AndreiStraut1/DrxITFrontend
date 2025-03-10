import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import PSHPopup from "./PSHPopup";
import { Product } from "../models/Product";
import { StageHistory } from "../models/StageHistory";
import ProductStageHistory from "./ProductStageHistory";
import { Select, SelectOption } from "./Select";
import { Bom } from "../models/Bom";
import BomList from "./BomList";

const options = [
  { label: "CONCEPT", value: 1 },
  { label: "FEASIBILITY", value: 2 },
  { label: "PROJECTION", value: 3 },
  { label: "PRODUCTION", value: 4 },
  { label: "RETREAT", value: 5 },
  { label: "STANDBY", value: 6 },
  { label: "CANCEL", value: 7 },
];

interface ProductListProps {
  refresh: boolean;
  onMoveToNextStage: () => void;
}

const ProductList: React.FC<ProductListProps> = ({
  refresh,
  onMoveToNextStage,
}) => {
  const [selectedStagesMap, setSelectedStagesMap] = useState<
    Record<number, SelectOption | undefined>
  >({});
  const [visibilityMap, setVisibilityMap] = useState<Record<number, boolean>>(
    {}
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buttonPopup, setButtonPopup] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const { accessToken } = useAuth();
  const { user } = useAuth();

  const [bomPopup, setBomPopup] = useState(false);
  const [selectedBom, setSelectedBom] = useState<Bom | null>(null);

  const openBomPopup = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && product.bom) {
      setSelectedBom(product.bom);
      setBomPopup(true);
    } else {
      setError("No BOM data available for this product");
    }
  };

  const handleStageSelectionChange = (
    options: SelectOption | undefined,
    stageId: number
  ) => {
    setSelectedStagesMap((prev) => ({
      ...prev,
      [stageId]: options,
    }));
  };

  const handleSaveStage = (productId: number) => {
    const selectedOption = selectedStagesMap[productId];
    if (!selectedOption) return;

    const stageLabel = selectedOption.label;
    handleStagesChange(stageLabel, productId);
  };

  const handleStagesChange = (selectedStage: string, productId: number) => {
    axios
      .post(
        `http://localhost:8080/api/products/${productId}/set-stage`,
        { stage: selectedStage },
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

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/products/get-all", {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          const productsData: Product[] = response.data;
          const bomData: Bom[] = productsData
            .map((x) => x.bom)
            .filter((bom): bom is Bom => bom !== undefined);
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
            console.log(products);
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

  const toggleVisibility = (prodId: number) => {
    setVisibilityMap((prev) => ({
      ...prev,
      [prodId]: !prev[prodId],
    }));
  };

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
                    <strong>Width:</strong> {product.estimated_width}
                  </li>
                  <li className="list-group-item">
                    <strong>Weight:</strong> {product.estimated_weight}
                  </li>
                  <li className="list-group-item">
                    <strong>Current Stage:</strong> {product.currentStage}
                  </li>
                </ul>

                <div className="card-footer d-flex flex-column align-items-center gap-2">
                  <div className="col d-flex flex-column align-items-center">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => handleNextStage(product.id)}
                    >
                      Next Stage
                    </button>

                    <div className="mt-2 d-flex gap-2">
                      <button
                        className="btn btn-primary"
                        onClick={() => openStageHistory(product.id)}
                      >
                        Stage History
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => toggleVisibility(product.id)}
                      >
                        {visibilityMap[product.id] ? "Hide" : "Stage"}
                      </button>
                    </div>

                    {visibilityMap[product.id] && (
                      <div className="mt-2 w-100 text-center">
                        <Select
                          options={options}
                          value={selectedStagesMap[product.id]}
                          onChange={(o) =>
                            handleStageSelectionChange(o, product.id)
                          }
                        />
                        <button
                          className="btn btn-primary mt-2 w-100"
                          onClick={() => handleSaveStage(product.id)}
                        >
                          Save Stage
                        </button>
                      </div>
                    )}

                    <button
                      className="btn btn-primary mt-2 w-100"
                      onClick={() => openBomPopup(product.id)}
                    >
                      View BOM
                    </button>

                    {isAdmin && (
                      <button
                        className="btn btn-danger mt-2 w-100"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete Product
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <PSHPopup trigger={buttonPopup} setTrigger={setButtonPopup}>
            {selectedProductId && (
              <ProductStageHistory
                productId={selectedProductId}
              ></ProductStageHistory>
            )}
          </PSHPopup>
          <PSHPopup trigger={bomPopup} setTrigger={setBomPopup}>
            {selectedBom && <BomList bomData={selectedBom} />}
          </PSHPopup>
        </div>
      )}
    </div>
  );
};

export default ProductList;
