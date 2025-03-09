import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import UserList from "../../components/UserList";

const UsersPage: React.FC = () => {
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
      <UserList refresh={refresh} onRoleChange={handlePageRefresh} />
    </div>
  );
};

export default UsersPage;
