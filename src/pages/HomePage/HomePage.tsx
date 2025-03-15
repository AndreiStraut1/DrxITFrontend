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

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  const hasNonUserRoles = () => {
    if (!user || !user.roles) return false;

    if (Array.isArray(user.roles)) {
      return (
        user.roles.some((role) => role !== "ROLE_USER") ||
        !user.roles.includes("ROLE_USER")
      );
    } else if (typeof user.roles === "string") {
      return user.roles !== "ROLE_USER";
    }
    return false;
  };

  const hasOnlyUserRole = () => {
    if (!user || !user.roles) return false;

    if (Array.isArray(user.roles)) {
      return user.roles.length === 1 && user.roles[0] === "ROLE_USER";
    } else if (typeof user.roles === "string") {
      return user.roles === "ROLE_USER";
    }
    return false;
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
              {hasOnlyUserRole() && (
                <p>
                  <strong>
                    You have standard user privileges. Please wait until an
                    administrator assigns you a role.
                  </strong>
                </p>
              )}
              <button className="btn btn-danger" onClick={logout}>
                Logout
              </button>

              {hasNonUserRoles() && (
                <button
                  className="btn btn-primary ms-2"
                  onClick={handleProducts}
                >
                  View Products
                </button>
              )}
              {user?.roles.includes("ROLE_ADMIN") && (
                <button className="btn btn-primary ms-2" onClick={handleUsers}>
                  View Users
                </button>
              )}
              {user?.roles.includes("ROLE_ADMIN") && (
                <button
                  className="btn btn-primary ms-2"
                  onClick={handleDashboard}
                >
                  Analytics Dashboard
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
