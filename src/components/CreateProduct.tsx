import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import { toast } from "react-toastify";

interface Material {
  materialNumber: string;
  materialDescription: string;
  width?: number | "";
  height?: number | "";
  weight?: number | "";
}

interface BomMaterial {
  material: Material;
  quantity: number;
  unitMeasureCode: string;
}

interface Bom {
  name: string;
  bomMaterials: BomMaterial[];
}

interface NewProduct {
  name: string;
  description: string;
  estimated_height: number | "";
  estimated_weight: number | "";
  estimated_width: number | "";
  bom: Bom;
  [key: string]: any;
}

interface CreateProductProps {
  materialsRefreshFlag: boolean;
  onProductCreated: () => void;
  onMaterialChange?: () => void;
}

const CreateProduct: React.FC<CreateProductProps> = ({
  onProductCreated,
  materialsRefreshFlag,
  onMaterialChange,
}) => {
  const [searchedMaterial, setSearchedMaterial] = useState<string>("");
  const [showMaterialEdit, setShowMaterialEdit] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [ShowMaterialNew, setShowMaterialNew] = useState<boolean>(false);
  const [newMaterial, setNewMaterial] = useState<Material>({
    materialNumber: "",
    materialDescription: "",
    width: "",
    height: "",
    weight: "",
  });

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) {
      toast.error("No material selected");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this material?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:8080/api/material/${selectedMaterial.materialNumber}`,
        {
          headers: accessToken
            ? { Authorization: "Bearer " + accessToken }
            : {},
        }
      );

      setMaterials((prevMaterials) =>
        prevMaterials.map((material) =>
          material.materialNumber === selectedMaterial.materialNumber
            ? response.data
            : material
        )
      );

      setShowMaterialEdit(false);
      toast.success("Material deleted successfully");
      if (onMaterialChange) onMaterialChange();
    } catch (err: any) {
      const errorMsg = err.response
        ? JSON.stringify(err.response.data)
        : err.message;
      toast.error(`Error updating material: ${errorMsg}`);
    }
  };

  const handleEditMaterial = async () => {
    if (!selectedMaterial) {
      toast.error("No material selected for editing");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:8080/api/material/${selectedMaterial.materialNumber}`,
        selectedMaterial,
        {
          headers: accessToken
            ? { Authorization: "Bearer " + accessToken }
            : {},
        }
      );

      setMaterials((prevMaterials) =>
        prevMaterials.map((material) =>
          material.materialNumber === selectedMaterial.materialNumber
            ? response.data
            : material
        )
      );

      setShowMaterialEdit(false);
      toast.success("Material updated successfully");
      if (onMaterialChange) onMaterialChange();
    } catch (err: any) {
      const errorMsg = err.response
        ? JSON.stringify(err.response.data)
        : err.message;
      toast.error(`Error updating material: ${errorMsg}`);
    }
  };

  const handleCreateMaterial = async () => {
    if (!newMaterial.materialNumber || !newMaterial.materialDescription) {
      toast.error("Material number and description are required");
      return;
    }

    const materialNumberPattern = /^M\d{4}$/;
    if (!materialNumberPattern.test(newMaterial.materialNumber)) {
      toast.error(
        "Error: Material number must be in format 'M' followed by exactly 4 digits (e.g., M1234)"
      );
      return;
    }

    const materialExists = materials.some(
      (material) => material.materialNumber === newMaterial.materialNumber
    );

    if (materialExists) {
      toast.error(
        "Error: Material number already exists. Please use a unique material number."
      );
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/material",
        newMaterial,
        {
          headers: accessToken
            ? { Authorization: "Bearer " + accessToken }
            : {},
        }
      );

      setMaterials([...materials, response.data]);

      setNewMaterial({
        materialNumber: "",
        materialDescription: "",
        width: "",
        height: "",
        weight: "",
      });
      setShowMaterialNew(false);

      toast.success("Material created successfully");
      if (onMaterialChange) onMaterialChange();
    } catch (err: any) {
      const errorMsg = err.response
        ? JSON.stringify(err.response.data)
        : err.message;
      toast.error(`Error creating material: ${errorMsg}`);
    }
  };

  const [product, setProduct] = useState<NewProduct>({
    name: "",
    description: "",
    estimated_height: 0,
    estimated_weight: 0,
    estimated_width: 0,
    bom: {
      name: "",
      bomMaterials: [],
    },
  });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [message] = useState<string>("");
  const { accessToken } = useAuth();

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/material", {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then((response) => {
        setMaterials(response.data);
      })
      .catch((err) => {
        toast.error("Error fetching materials:", err);
      });
  }, [accessToken, materialsRefreshFlag]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    if (keys.length > 1) {
      setProduct((prevProduct) => {
        const updatedProduct = { ...prevProduct };
        let currentLevel = updatedProduct;

        for (let i = 0; i < keys.length - 1; i++) {
          currentLevel = currentLevel[keys[i]];
        }

        currentLevel[keys[keys.length - 1]] = value;
        return updatedProduct;
      });
    } else {
      setProduct({
        ...product,
        [name]: name.includes("estimated")
          ? value === ""
            ? ""
            : Number(value)
          : value,
      });
    }
  };

  const handleBomMaterialChange = (
    index: number,
    field: string,
    value: string | number | Material
  ) => {
    const updatedBomMaterials = product.bom.bomMaterials.map((bomMaterial, i) =>
      i === index ? { ...bomMaterial, [field]: value } : bomMaterial
    );
    setProduct({
      ...product,
      bom: { ...product.bom, bomMaterials: updatedBomMaterials },
    });
  };

  const handleAddBomMaterial = () => {
    setProduct({
      ...product,
      bom: {
        ...product.bom,
        bomMaterials: [
          ...product.bom.bomMaterials,
          {
            material: { materialNumber: "", materialDescription: "" },
            quantity: 0,
            unitMeasureCode: "",
          },
        ],
      },
    });
  };

  const handleRemoveMaterialRow = (index: number) => {
    product.bom.bomMaterials.splice(index, 1);
    setProduct({
      ...product,
      bom: {
        ...product.bom,
        bomMaterials: [...product.bom.bomMaterials],
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/api/products/new",
        product,
        {
          headers: accessToken
            ? { Authorization: "Bearer " + accessToken }
            : {},
        }
      );
      toast.success(`Product created with id: ${response.data.id}`);
      onProductCreated();
    } catch (err: any) {
      const errorMsg = err.response
        ? JSON.stringify(err.response.data)
        : err.message;
      toast.error(errorMsg);
    }
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  return (
    <div className="container mt-5">
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white text-center">
          <h3 className="mb-0">Create New Product</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  className="form-control"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  className="form-control"
                  rows={3}
                  required
                  minLength={5}
                  maxLength={200}
                  style={{ resize: "none", overflow: "auto" }}
                />
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label">Estimated Height</label>
                <input
                  type="number"
                  name="estimated_height"
                  value={product.estimated_height}
                  onFocus={(e) => (e.target.value = "")}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Estimated Weight</label>
                <input
                  type="number"
                  name="estimated_weight"
                  value={product.estimated_weight}
                  onFocus={(e) => (e.target.value = "")}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Estimated Width</label>
                <input
                  type="number"
                  name="estimated_width"
                  value={product.estimated_width}
                  onFocus={(e) => (e.target.value = "")}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="any"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <h5>BOM Details</h5>
              <div className="mb-3">
                <input
                  type="text"
                  name="bom.name"
                  value={product.bom.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter BOM name"
                  minLength={3}
                  maxLength={50}
                />
              </div>
            </div>

            <div className="mb-4">
              <h5>BOM Materials</h5>
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Measure Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {product.bom.bomMaterials.map((bomMaterial, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-control"
                          value={bomMaterial.material.materialNumber}
                          onChange={(e) =>
                            handleBomMaterialChange(
                              index,
                              "material",
                              materials.find(
                                (m) => m.materialNumber === e.target.value
                              ) || {
                                materialNumber: "",
                                materialDescription: "",
                              }
                            )
                          }
                          required
                        >
                          <option value="">Select Material</option>
                          {materials.map((material) => (
                            <option
                              key={material.materialNumber}
                              value={material.materialNumber}
                            >
                              {material.materialNumber} -{" "}
                              {material.materialDescription}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          value={bomMaterial.quantity}
                          onFocus={(e) => (e.target.value = "")}
                          onChange={(e) =>
                            handleBomMaterialChange(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={bomMaterial.unitMeasureCode}
                          minLength={1}
                          maxLength={20}
                          onFocus={(e) => (e.target.value = "")}
                          onChange={(e) =>
                            handleBomMaterialChange(
                              index,
                              "unitMeasureCode",
                              e.target.value
                            )
                          }
                          required
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRemoveMaterialRow(index)}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddBomMaterial}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Material
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setShowMaterialNew(true)}
                >
                  <i className="bi bi-tools me-1"></i> Create New Material
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setShowMaterialEdit(true)}
                >
                  <i className="bi bi-tools me-1"></i> Edit Material
                </button>
              </div>
              {ShowMaterialNew && (
                <>
                  <div
                    className="modal-backdrop fade show"
                    style={{ zIndex: 1040 }}
                  ></div>
                  <div
                    className="modal show d-block"
                    style={{ zIndex: 1050 }}
                    tabIndex={-1}
                  >
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Create New Material</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowMaterialNew(false)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <label className="form-label">
                                Material Number
                              </label>
                              <input
                                type="text"
                                className={`form-control ${
                                  newMaterial.materialNumber &&
                                  !newMaterial.materialNumber.startsWith("M")
                                    ? "is-invalid"
                                    : ""
                                }`}
                                value={newMaterial.materialNumber}
                                onChange={(e) =>
                                  setNewMaterial({
                                    ...newMaterial,
                                    materialNumber: e.target.value.startsWith(
                                      "M"
                                    )
                                      ? e.target.value
                                      : "M" + e.target.value,
                                  })
                                }
                                maxLength={5}
                                placeholder="Must start with M"
                                required
                              />
                              {newMaterial.materialNumber &&
                                !newMaterial.materialNumber.startsWith("M") && (
                                  <div className="invalid-feedback">
                                    Material number must start with M
                                  </div>
                                )}
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Description</label>
                              <input
                                type="text"
                                className="form-control"
                                value={newMaterial.materialDescription}
                                onChange={(e) =>
                                  setNewMaterial({
                                    ...newMaterial,
                                    materialDescription: e.target.value,
                                  })
                                }
                                maxLength={200}
                                required
                              />
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-md-4">
                              <label className="form-label">Width</label>
                              <input
                                required
                                type="number"
                                className="form-control"
                                min="0"
                                step="any"
                                value={newMaterial.width}
                                onFocus={(e) => (e.target.value = "")}
                                onChange={(e) =>
                                  setNewMaterial({
                                    ...newMaterial,
                                    width:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Height</label>
                              <input
                                required
                                type="number"
                                className="form-control"
                                min="0"
                                step="any"
                                value={newMaterial.height}
                                onFocus={(e) => (e.target.value = "")}
                                onChange={(e) =>
                                  setNewMaterial({
                                    ...newMaterial,
                                    height:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Weight</label>
                              <input
                                required
                                type="number"
                                className="form-control"
                                min="0"
                                step="any"
                                value={newMaterial.weight}
                                onFocus={(e) => (e.target.value = "")}
                                onChange={(e) =>
                                  setNewMaterial({
                                    ...newMaterial,
                                    weight:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowMaterialNew(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreateMaterial}
                          >
                            Create Material
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {showMaterialEdit && (
                <>
                  <div
                    className="modal-backdrop fade show"
                    style={{ zIndex: 1040 }}
                  ></div>
                  <div
                    className="modal show d-block"
                    style={{ zIndex: 1050 }}
                    tabIndex={-1}
                  >
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">
                            Edit Or Delete Material
                          </h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowMaterialEdit(false)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <div className="mb-3">
                            <label className="form-label">
                              Select Material
                            </label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search materials..."
                                value={searchedMaterial}
                                onChange={(e) =>
                                  setSearchedMaterial(e.target.value)
                                }
                              />
                              <select
                                className="form-select"
                                onChange={(e) => {
                                  const selectedMaterial = materials.find(
                                    (m) => m.materialNumber === e.target.value
                                  );
                                  if (selectedMaterial) {
                                    setSelectedMaterial(selectedMaterial);
                                  }
                                }}
                              >
                                <option value="">Select a material</option>
                                {materials
                                  .filter(
                                    (m) =>
                                      m.materialNumber
                                        .toLowerCase()
                                        .includes(
                                          searchedMaterial.toLowerCase()
                                        ) ||
                                      m.materialDescription
                                        .toLowerCase()
                                        .includes(
                                          searchedMaterial.toLowerCase()
                                        )
                                  )
                                  .map((material) => (
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

                          <div className="row mb-3">
                            <div className="col-md-12">
                              <label className="form-label">Description</label>
                              <input
                                type="text"
                                className="form-control"
                                value={
                                  selectedMaterial
                                    ? selectedMaterial.materialDescription
                                    : ""
                                }
                                onChange={(e) => {
                                  if (selectedMaterial) {
                                    setSelectedMaterial({
                                      ...selectedMaterial,
                                      materialDescription: e.target.value,
                                    });
                                  }
                                }}
                                maxLength={200}
                                required
                              />
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-4">
                              <label className="form-label">Width</label>
                              <input
                                required
                                type="number"
                                className="form-control"
                                min="0"
                                step="any"
                                value={selectedMaterial?.width || ""}
                                onFocus={(e) => (e.target.value = "")}
                                onChange={(e) =>
                                  setSelectedMaterial({
                                    ...selectedMaterial!,
                                    width:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Height</label>
                              <input
                                required
                                type="number"
                                className="form-control"
                                min="0"
                                step="any"
                                value={selectedMaterial?.height || ""}
                                onFocus={(e) => (e.target.value = "")}
                                onChange={(e) =>
                                  setSelectedMaterial({
                                    ...selectedMaterial!,
                                    height:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Weight</label>
                              <input
                                required
                                type="number"
                                className="form-control"
                                min="0"
                                step="any"
                                value={selectedMaterial?.weight || ""}
                                onFocus={(e) => (e.target.value = "")}
                                onChange={(e) =>
                                  setSelectedMaterial({
                                    ...selectedMaterial!,
                                    weight:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowMaterialEdit(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleEditMaterial}
                          >
                            Edit Material
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={handleDeleteMaterial}
                            >
                              Delete Material
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="btn btn-success w-100">
              Create Product
            </button>
          </form>

          {message && <div className="alert mt-3">{message}</div>}
        </div>
      </div>
    </div>
  );
};
export default CreateProduct;
