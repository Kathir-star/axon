import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/patient/Dashboard";
import Vault from "./pages/patient/Vault";
import Onboarding from "./pages/Onboarding";
import ProviderAccess from "./pages/doctor/Portal";
import AuthPage from "./pages/Auth";
import Architecture from "./pages/Architecture";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0f172a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }} />
      <div className="min-h-screen flex flex-col font-sans bg-slate-950">
        <Routes>
          {/* Public Routes with Navbar */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/provider-access" element={<ProviderAccess />} />
          </Route>
          
          {/* Patient Routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />
          <Route path="/vault" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Vault />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col pt-16">
        <Outlet />
      </main>
    </>
  );
}

