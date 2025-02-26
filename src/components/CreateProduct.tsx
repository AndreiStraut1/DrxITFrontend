import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";

interface NewProduct {
  name: string;
  description: string;
  estimated_height: number | "";
  estimated_weight: number | "";
  estimated_width: number | "";
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
  });
  const [message, setMessage] = useState<string>("");
  const { accessToken } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: name.includes("estimated")
        ? value === ""
          ? ""
          : Number(value)
        : value,
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
      onProductCreated(); // Notify parent to refresh product list
    } catch (err: any) {
      const errorMsg = err.response
        ? JSON.stringify(err.response.data)
        : err.message;
      setMessage(errorMsg);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white">
          <h2 className="mb-0">Create Product</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Row for Name and Description */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter product name"
                    required
                  />
                </label>
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Description:
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter product description"
                    rows={3}
                    required
                  />
                </label>
              </div>
            </div>

            {/* Row for Estimated Height, Weight, and Width */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  Estimated Height:
                  <input
                    type="number"
                    name="estimated_height"
                    value={product.estimated_height}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </label>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Estimated Weight:
                  <input
                    type="number"
                    name="estimated_weight"
                    value={product.estimated_weight}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </label>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Estimated Width:
                  <input
                    type="number"
                    name="estimated_width"
                    value={product.estimated_width}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Create Product
            </button>
          </form>
          {message && (
            <div className="mt-3">
              <p className="alert alert-info">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CreateProduct;
