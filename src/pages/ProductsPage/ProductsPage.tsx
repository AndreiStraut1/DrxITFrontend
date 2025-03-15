import React, { useState } from "react";
import ProductList from "../../components/ProductList";
import CreateProduct from "../../components/CreateProduct";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const ProductPage: React.FC = () => {
  const materialsRefreshFlag = false;
  const [refresh, setRefresh] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePageRefresh = () => {
    setRefresh((prev) => !prev);
  };

  const handleHomePage = () => {
    navigate("/home");
  };

  return (
    <div>
      <button className="btn btn-primary ms-2 mt-3" onClick={handleHomePage}>
        Back to HomePage
      </button>
      {(user?.roles.includes("ROLE_ADMIN") ||
        user?.roles.includes("ROLE_DESIGNER")) && (
        <CreateProduct
          onMaterialChange={handlePageRefresh}
          onProductCreated={handlePageRefresh}
          materialsRefreshFlag={false}
        />
      )}
      <ProductList
        materialsRefreshFlag={materialsRefreshFlag}
        refresh={refresh}
        onMoveToNextStage={handlePageRefresh}
      />
    </div>
  );
};

export default ProductPage;
