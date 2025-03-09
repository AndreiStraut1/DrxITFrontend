import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleProducts = () => {
    navigate("/products");
  };

  const handleUsers = () => {
    navigate("/users");
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h1 className="mb-0">Welcome{user ? `, ${user.username}` : "!"}</h1>
        </div>
        <div className="card-body">
          {user && (
            <>
              <p className="lead">
                Email: <strong>{user.email}</strong>
              </p>
              <p className="lead">
                Role: <strong>{user.roles}</strong>
              </p>
              <button className="btn btn-danger" onClick={logout}>
                Logout
              </button>
              <button className="btn btn-primary ms-2" onClick={handleProducts}>
                View Products
              </button>
              {user?.roles.includes("ROLE_ADMIN") && (
                <button className="btn btn-primary ms-2" onClick={handleUsers}>
                  View Users
                </button>
              )}
            </>
          )}
          <p>Thank you for logging in.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
