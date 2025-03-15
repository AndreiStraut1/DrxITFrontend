import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserProvider, useAuth } from "./context/useAuth";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import HomePage from "./pages/HomePage/HomePage";
import ProductsPage from "./pages/ProductsPage/ProductsPage";
import UsersPage from "./pages/UsersPage/UsersPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./main.css";

const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/home" element={<ProtectedRoute element={<HomePage />} />} />
      <Route
        path="/products"
        element={<ProtectedRoute element={<ProductsPage />} />}
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute
            element={<UsersPage />}
            allowedRoles={["ROLE_ADMIN"]}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            element={<DashboardPage />}
            allowedRoles={["ROLE_ADMIN"]}
          />
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <>
        <RoutesComponent />
        <ToastContainer />
      </>
    </UserProvider>
  );
}

export default App;
