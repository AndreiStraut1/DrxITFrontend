import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserProvider, useAuth } from "./context/useAuth";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import HomePage from "./pages/HomePage/HomePage"; // Assuming you have a HomePage component
import ProductsPage from "./pages/ProductsPage/ProductsPage";
import "./main.css";
import UsersPage from "./pages/UsersPage/UsersPage";

const RoutesComponent = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/home"
        element={user ? <HomePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/products"
        element={user ? <ProductsPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/users"
        element={user ? <UsersPage /> : <Navigate to="/login" />}
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
