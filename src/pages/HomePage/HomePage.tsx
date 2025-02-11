import React from "react";
import { useAuth } from "../../context/useAuth";

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

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
              <button className="btn btn-danger" onClick={logout}>
                Logout
              </button>
            </>
          )}
          <p>Thank you for logging in.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
