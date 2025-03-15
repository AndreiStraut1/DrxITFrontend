import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
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
  materialsRefreshFlag: boolean;
  refresh: boolean;
  onMoveToNextStage: () => void;
}

const ProductList: React.FC<ProductListProps> = ({
  refresh,
  onMoveToNextStage,
  materialsRefreshFlag,
}) => {
  const [localRefresh, setLocalRefresh] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterialForBom, setSelectedMaterialForBom] =
    useState<any>(null);
  const [showMaterialSelector, setShowMaterialSelector] =
    useState<boolean>(false);
  const [showProductEdit, setShowProductEdit] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/material", {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then((response) => {
        setMaterials(response.data);
      })
      .catch((err) => {
        toast.error(
          "Error fetching materials: " + (err.response?.data || err.message)
        );
      });
  }, [accessToken, materialsRefreshFlag, refresh, localRefresh]);

  const MaterialSelector = () => {
    const [searchedMaterial, setSearchedMaterial] = useState("");

    const filteredMaterials = materials.filter(
      (m) =>
        m.materialNumber
          .toLowerCase()
          .includes(searchedMaterial.toLowerCase()) ||
        m.materialDescription
          .toLowerCase()
          .includes(searchedMaterial.toLowerCase())
    );

    return (
      <>
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ zIndex: 99999 }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Material</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowMaterialSelector(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select Material</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search materials..."
                      value={searchedMaterial}
                      onChange={(e) => setSearchedMaterial(e.target.value)}
                    />
                    <select
                      className="form-select"
                      onChange={(e) => {
                        const selected = materials.find(
                          (m) => m.materialNumber === e.target.value
                        );
                        if (selected) {
                          setSelectedMaterialForBom(selected);
                        }
                      }}
                      value={selectedMaterialForBom?.materialNumber || ""}
                    >
                      <option value="">Select a material</option>
                      {filteredMaterials.map((material) => (
                        <option
                          key={material.materialNumber}
                          value={material.materialNumber}
                        >
                          {material.materialNumber} -{" "}
                          {material.materialDescription}
                        </option>
                      ))}
                    </select>
                  </div>
                  <small className="text-muted">
                    Type to search by material number or description
                  </small>
                </div>

                {selectedMaterialForBom && (
                  <div className="alert alert-info">
                    <strong>Selected:</strong>{" "}
                    {selectedMaterialForBom.materialNumber} -{" "}
                    {selectedMaterialForBom.materialDescription}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMaterialSelector(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addSelectedMaterialToBom}
                  disabled={!selectedMaterialForBom}
                >
                  Add Material
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const addSelectedMaterialToBom = () => {
    if (!selectedMaterialForBom || !selectedProduct) return;

    const newBomMaterial = {
      id: -1,
      material: {
        materialNumber: selectedMaterialForBom.materialNumber,
        materialDescription: selectedMaterialForBom.materialDescription,
        width: selectedMaterialForBom.width,
        height: selectedMaterialForBom.height,
        weight: selectedMaterialForBom.weight,
      },
      quantity: 1,
      unitMeasureCode: "pcs",
    };

    if (selectedProduct.bom) {
      setSelectedProduct({
        ...selectedProduct,
        bom: {
          ...selectedProduct.bom,
          bomMaterials: [
            ...(selectedProduct.bom.bomMaterials || []),
            newBomMaterial,
          ],
        },
      });
    } else {
      setSelectedProduct({
        ...selectedProduct,
        bom: {
          id: -1,
          name: "New BOM",
          bomMaterials: [newBomMaterial],
        },
      });
    }

    setShowMaterialSelector(false);
    setSelectedMaterialForBom(null);
  };

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
        toast.success("Product stage changed!");
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
        toast.warning(
          err.response
            ? JSON.stringify("No products to show or " + err.response.data)
            : err.message
        );
      });
  }, [accessToken, refresh, materialsRefreshFlag, localRefresh]);

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
        setProducts(products.filter((product) => product.id !== productId));
      })
      .catch((err) => {
        toast.error(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  };

  const handleSaveProductChanges = async () => {
    if (!selectedProduct) return;

    try {
      const productToSave = {
        ...selectedProduct,
        bom: selectedProduct.bom
          ? {
              ...selectedProduct.bom,
              bomMaterials: selectedProduct.bom.bomMaterials?.map(
                (material) => ({
                  material: {
                    materialNumber: material.material.materialNumber,
                    materialDescription: material.material.materialDescription,
                  },
                  quantity: material.quantity,
                  unitMeasureCode: material.unitMeasureCode || "pcs",
                })
              ),
            }
          : null,
      };

      const response = await axios.put(
        `http://localhost:8080/api/products/${selectedProduct.id}`,
        productToSave,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === selectedProduct.id ? response.data : p
        )
      );
      setSelectedProduct(response.data);

      setLocalRefresh((prev) => !prev);
      setShowProductEdit(false);
      toast.success("Product updated successfully");
    } catch (err: any) {
      console.error("Error details:", err.response?.data);
      toast.error(`Error: ${err.response?.data || err.message}`);
    }
  };

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const isDesigner = user?.roles?.includes("ROLE_DESIGNER");

  const openStageHistory = (productId: number) => {
    setSelectedProductId(productId);
    setButtonPopup(true);
  };

  return (
    <div className="container mt-3">
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

                    {(isAdmin || isDesigner) && (
                      <button
                        type="button"
                        className="btn btn-outline-primary mt-2 w-100"
                        onClick={() => {
                          setShowProductEdit(true);
                          setSelectedProduct(product);
                        }}
                      >
                        <i className="bi bi-tools me-1"></i> Edit Product
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
          {showProductEdit && (
            <>
              <div className="modal-backdrop fade show"></div>
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Edit Or Delete Product</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowProductEdit(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Product Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter product name..."
                          value={selectedProduct?.name}
                          onChange={(e) => {
                            if (selectedProduct) {
                              setSelectedProduct({
                                ...selectedProduct,
                                name: e.target.value,
                              });
                            }
                          }}
                          minLength={3}
                          maxLength={50}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter description..."
                          value={selectedProduct?.description}
                          onChange={(e) => {
                            if (selectedProduct) {
                              setSelectedProduct({
                                ...selectedProduct,
                                description: e.target.value,
                              });
                            }
                          }}
                          minLength={5}
                          maxLength={200}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Dimensions</label>
                        <div className="row mb-2">
                          <div className="col-6">
                            <div className="input-group">
                              <span className="input-group-text">Height</span>
                              <input
                                type="number"
                                className="form-control"
                                value={selectedProduct?.estimated_height || ""}
                                onChange={(e) => {
                                  if (selectedProduct) {
                                    setSelectedProduct({
                                      ...selectedProduct,
                                      estimated_height: Number(e.target.value),
                                    });
                                  }
                                }}
                                min="0"
                              />
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="input-group">
                              <span className="input-group-text">Width</span>
                              <input
                                type="number"
                                className="form-control"
                                value={selectedProduct?.estimated_width || ""}
                                onChange={(e) => {
                                  if (selectedProduct) {
                                    setSelectedProduct({
                                      ...selectedProduct,
                                      estimated_width: Number(e.target.value),
                                    });
                                  }
                                }}
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-6">
                            <div className="input-group">
                              <span className="input-group-text">Weight</span>
                              <input
                                type="number"
                                className="form-control"
                                value={selectedProduct?.estimated_weight || ""}
                                onChange={(e) => {
                                  if (selectedProduct) {
                                    setSelectedProduct({
                                      ...selectedProduct,
                                      estimated_weight: Number(e.target.value),
                                    });
                                  }
                                }}
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">BOM Details</label>
                        <div className="input-group mb-2">
                          <span className="input-group-text">BOM Name</span>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedProduct?.bom?.name || ""}
                            onChange={(e) => {
                              if (selectedProduct && selectedProduct.bom) {
                                setSelectedProduct({
                                  ...selectedProduct,
                                  bom: {
                                    ...selectedProduct.bom,
                                    name: e.target.value,
                                  },
                                });
                              } else if (selectedProduct) {
                                setSelectedProduct({
                                  ...selectedProduct,
                                  bom: {
                                    id: -1,
                                    name: e.target.value,
                                    bomMaterials: [],
                                  },
                                });
                              }
                            }}
                            minLength={3}
                            maxLength={50}
                          />
                        </div>

                        <div className="mt-3">
                          <label className="form-label">Materials</label>
                          {selectedProduct?.bom?.bomMaterials &&
                          selectedProduct.bom.bomMaterials.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-bordered table-sm">
                                <thead>
                                  <tr>
                                    <th>Material Number</th>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedProduct.bom.bomMaterials.map(
                                    (bomMaterial, index) => (
                                      <tr key={index}>
                                        <td>
                                          {bomMaterial.material.materialNumber}
                                        </td>
                                        <td>
                                          {
                                            bomMaterial.material
                                              .materialDescription
                                          }
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            value={bomMaterial.quantity || 1}
                                            onChange={(e) => {
                                              if (
                                                selectedProduct &&
                                                selectedProduct.bom
                                              ) {
                                                const updatedMaterials = [
                                                  ...selectedProduct.bom
                                                    .bomMaterials,
                                                ];
                                                updatedMaterials[index] = {
                                                  ...updatedMaterials[index],
                                                  quantity: Number(
                                                    e.target.value
                                                  ),
                                                };

                                                setSelectedProduct({
                                                  ...selectedProduct,
                                                  bom: {
                                                    ...selectedProduct.bom,
                                                    bomMaterials:
                                                      updatedMaterials,
                                                  },
                                                });
                                              }
                                            }}
                                            min="1"
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={
                                              bomMaterial.unitMeasureCode || ""
                                            }
                                            minLength={1}
                                            maxLength={20}
                                            onChange={(e) => {
                                              if (
                                                selectedProduct &&
                                                selectedProduct.bom
                                              ) {
                                                const updatedMaterials = [
                                                  ...selectedProduct.bom
                                                    .bomMaterials,
                                                ];
                                                updatedMaterials[index] = {
                                                  ...updatedMaterials[index],
                                                  unitMeasureCode:
                                                    e.target.value,
                                                };

                                                setSelectedProduct({
                                                  ...selectedProduct,
                                                  bom: {
                                                    ...selectedProduct.bom,
                                                    bomMaterials:
                                                      updatedMaterials,
                                                  },
                                                });
                                              }
                                            }}
                                          />
                                        </td>
                                        <td className="text-center">
                                          <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => {
                                              if (
                                                selectedProduct &&
                                                selectedProduct.bom
                                              ) {
                                                const updatedMaterials =
                                                  selectedProduct.bom.bomMaterials.filter(
                                                    (_, i) => i !== index
                                                  );
                                                setSelectedProduct({
                                                  ...selectedProduct,
                                                  bom: {
                                                    ...selectedProduct.bom,
                                                    bomMaterials:
                                                      updatedMaterials,
                                                  },
                                                });
                                              }
                                            }}
                                          >
                                            &times;
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted">
                              No materials associated with this BOM.
                            </p>
                          )}

                          <div className="mt-3">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => setShowMaterialSelector(true)}
                            >
                              Add Material
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowProductEdit(false)}
                      >
                        Close
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => {
                            selectedProduct && handleDelete(selectedProduct.id);
                            setShowProductEdit(false);
                          }}
                        >
                          Delete
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveProductChanges}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {showMaterialSelector && <MaterialSelector />}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductList;
