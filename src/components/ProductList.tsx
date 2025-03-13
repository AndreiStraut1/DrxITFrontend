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
import { toast } from "react-toastify";
import ProductPdfExport from "./ProductsToPdf";

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
  const [filters, setFilters] = useState({
    stages: [] as SelectOption[],
    materials: [] as SelectOption[],
    value: undefined as SelectOption | undefined,
    minHeight: undefined as number | undefined,
    maxHeight: undefined as number | undefined,
    minWidth: undefined as number | undefined,
    maxWidth: undefined as number | undefined,
    minWeight: undefined as number | undefined,
    maxWeight: undefined as number | undefined,
    productName: undefined as string | undefined,
  });
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

  const getMaterialOptions = () => {
    const uniqueMaterials = new Set<string>();

    products.forEach((product) => {
      if (product.bom && product.bom.bomMaterials) {
        product.bom.bomMaterials.forEach((material) => {
          uniqueMaterials.add(material.material.materialNumber);
        });
      }
    });

    return Array.from(uniqueMaterials).map((material, index) => ({
      label: material,
      value: index,
    }));
  };

  const materialOptions = getMaterialOptions();

  const filteredProducts = products.filter((product) => {
    if (filters.stages.length > 0) {
      const stageLabels = filters.stages.map((option) => option.label);
      if (product.currentStage && !stageLabels.includes(product.currentStage)) {
        return false;
      }
    }

    if (filters.materials.length > 0) {
      if (!product.bom || !product.bom.bomMaterials) return false;

      const materialLabels = filters.materials.map((option) => option.label);
      const productHasAnySelectedMaterial = product.bom.bomMaterials.some(
        (bomMaterial) =>
          materialLabels.includes(bomMaterial.material.materialNumber)
      );

      if (!productHasAnySelectedMaterial) {
        return false;
      }
    }

    if (
      filters.minHeight !== undefined &&
      product.estimated_height < filters.minHeight
    ) {
      return false;
    }

    if (
      filters.maxHeight !== undefined &&
      product.estimated_height > filters.maxHeight
    ) {
      return false;
    }

    if (
      filters.minWidth !== undefined &&
      product.estimated_width < filters.minWidth
    ) {
      return false;
    }

    if (
      filters.maxWidth !== undefined &&
      product.estimated_width > filters.maxWidth
    ) {
      return false;
    }

    if (
      filters.minWeight !== undefined &&
      product.estimated_weight < filters.minWeight
    ) {
      return false;
    }
    if (
      filters.maxWeight !== undefined &&
      product.estimated_weight > filters.maxWeight
    ) {
      return false;
    }

    if (
      product.name
        .toLowerCase()
        .includes(filters.productName?.toLowerCase() || "") == false
    ) {
      return false;
    }
    return true;
  });

  const openBomPopup = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && product.bom) {
      setSelectedBom(product.bom);
      setBomPopup(true);
    } else {
      toast.warning("No BOM data available for this product");
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
        toast.error(
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
        toast.error(
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
        toast.error(
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
        toast.error(
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
      <div className="container mt-3">
        <h2 className="mb-4">Products</h2>
        {error && <div className="alert alert-danger">Error: {error}</div>}

        <div className="card p-4">
          <h5 className="card-title">Filter Products</h5>

          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Filter by Stages</label>
              <Select
                multiple
                options={options}
                value={filters.stages}
                onChange={(selections) =>
                  setFilters({ ...filters, stages: selections })
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Filter by Materials</label>
              <Select
                multiple
                options={materialOptions}
                value={filters.materials}
                onChange={(selections) =>
                  setFilters({ ...filters, materials: selections })
                }
              />
            </div>
          </div>

          {/* Dimensions Filters */}
          <h6 className="mt-4">Filter by Dimensions</h6>
          <div className="row">
            {["Height", "Width", "Weight"].map((dim) => (
              <div className="col-md-4" key={dim}>
                <label className="form-label">{dim}</label>
                <div className="input-group mb-2">
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={`Min ${dim}`}
                    value={
                      filters[`min${dim as "Height" | "Width" | "Weight"}`] ||
                      ""
                    }
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        [`min${dim}`]: Number(e.target.value) || undefined,
                      })
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={`Max ${dim}`}
                    value={
                      filters[`max${dim as "Height" | "Width" | "Weight"}`] ||
                      ""
                    }
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        [`max${dim}`]: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="row mt-3">
            <div className="col-md-6">
              <label className="form-label">Search Product</label>
              <input
                type="text"
                className="form-control"
                placeholder="Product name"
                value={filters.productName || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    productName: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-4">
            <button
              className="btn btn-outline-danger"
              onClick={() =>
                setFilters({
                  stages: [],
                  materials: [],
                  value: undefined,
                  minHeight: undefined,
                  maxHeight: undefined,
                  minWidth: undefined,
                  maxWidth: undefined,
                  minWeight: undefined,
                  maxWeight: undefined,
                  productName: undefined,
                })
              }
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="prodNr">
        <p>Number of products: {filteredProducts.length}</p>
      </div>

      <ProductPdfExport products={filteredProducts} />
      {products.length === 0 && !error ? (
        <p>No products available.</p>
      ) : filteredProducts.length === 0 ? (
        <div className="alert alert-warning">
          No products match your filter criteria.
        </div>
      ) : (
        <div className="row">
          {filteredProducts.map((product) => (
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
