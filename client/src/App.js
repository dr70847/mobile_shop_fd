import { Suspense, lazy } from "react";
import "./App.css";
import Layout from "./components/Layout";
import { Route, Routes } from "react-router-dom";
import RequireAuth from "./routes/RequireAuth";
import RequireRole from "./routes/RequireRole";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const ManagerPage = lazy(() => import("./pages/ManagerPage"));
const UserDashboardPage = lazy(() => import("./pages/UserDashboardPage"));

function App() {
  return (
    <Layout>
      <div className="App">
        <Suspense fallback={<div className="ms-state">Loading page…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/products/:id" element={<ProductDetailsPage />} />
            <Route
              path="/orders"
              element={
                <RequireAuth>
                  <OrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireRole allowedRoles={["admin"]}>
                  <AdminPage />
                </RequireRole>
              }
            />
            <Route
              path="/manager"
              element={
                <RequireRole allowedRoles={["manager", "admin"]}>
                  <ManagerPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <UserDashboardPage />
                </RequireAuth>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </Layout>
  );
}

export default App;

