import React, { useState } from "react";
import ProductList from "../../components/ProductList";
import CreateProduct from "../../components/CreateProduct";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const ProductPage: React.FC = () => {
  const [refresh, setRefresh] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePageRefresh = () => {
    // Toggle the refresh flag to force ProductList to update
    setRefresh((prev) => !prev);
  };

  const handleHomePage = () => {
    navigate("/home");
  };

  return (
    <div>
      <button className="btn btn-primary ms-2" onClick={handleHomePage}>
        Back to HomePage
      </button>
      {(user?.roles.includes("ROLE_ADMIN") ||
        user?.roles.includes("ROLE_DESIGNER")) && (
        <CreateProduct onProductCreated={handlePageRefresh} />
      )}
      <ProductList refresh={refresh} onMoveToNextStage={handlePageRefresh} />
    </div>
  );
};

export default ProductPage;
