import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";

interface Material {
  materialNumber: string;
  materialDescription: string;
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
  onProductCreated: () => void;
}

const CreateProduct: React.FC<CreateProductProps> = ({ onProductCreated }) => {
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
  const [message, setMessage] = useState<string>("");
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
        console.error("Error fetching materials:", err);
      });
  }, [accessToken]);

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
      setMessage(`Product created with id: ${response.data.id}`);
      onProductCreated();
    } catch (err: any) {
      const errorMsg = err.response
        ? JSON.stringify(err.response.data)
        : err.message;
      setMessage(errorMsg);
    }
  };

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
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  className="form-control"
                  rows={1}
                  required
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
                          min="0"
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
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddBomMaterial}
              >
                &#xFF0B; Add Material
              </button>
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
