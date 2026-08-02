import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { authApi } from './utils/api';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Header from './layout/Header';
import Footer from './layout/Footer';
import Eventpage from './Pages/Eventpage';
import Jobfair from "./Pages/jobfair";
import Foodevents from "./Pages/Foodevents";
import Educationalexpo from "./Pages/Educationalexpo";
import Adminpanel from "./Pages/Adminpanel";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import TermsOfServices from "./Pages/TermsOfServices";
import Studentpanel from "./Pages/Studentpanel";
import Businesspanel from "./Pages/Businesspanel";
import FloatingFAQ from "./layout/FloatingFAQ";


const roleDashboardPath = (role) => {
  if (role === "student") return "/studentpanel";
  if (role === "business") return "/businesspanel";
  // Admin accounts are managed through Supabase only — no frontend path mapping.
  return "/";
};

// ─── Standard protected route (localStorage + role check) ────────────────────
const ProtectedRoute = ({ isAuthenticated, currentRole, allowedRoles, children }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(currentRole)) {
    return <Navigate to={roleDashboardPath(currentRole)} replace />;
  }

  return children;
};

/**
 * AdminProtectedRoute — performs a server-side role check via GET /auth/me
 * before rendering the admin panel. This prevents privilege escalation
 * through localStorage manipulation (e.g. setting viventAuthRole=admin in
 * browser DevTools). The JWT token is validated on the server and the role
 * returned by the API is authoritative.
 */
const AdminProtectedRoute = ({ isAuthenticated, children }) => {
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // "loading" | "allowed" | "denied"

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus("denied");
      return;
    }
    authApi
      .me()
      .then((user) => {
        if (user?.role === "admin") {
          setStatus("allowed");
        } else {
          setStatus("denied");
        }
      })
      .catch(() => setStatus("denied"));
  }, [isAuthenticated]);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "#1e40af", fontWeight: 600 }}>Verifying access…</p>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to={isAuthenticated ? "/" : "/login"} replace state={{ from: location }} />;
  }

  return children;
};

// ─── Main layout ──────────────────────────────────────────────────────────────
const AppLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () =>
      localStorage.getItem("viventAuth") === "true" &&
      !!localStorage.getItem("viventToken")
  );
  const [authRole, setAuthRole] = useState(
    () => localStorage.getItem("viventAuthRole") || ""
  );

  const handleAuth = (role) => {
    localStorage.setItem("viventAuth", "true");
    if (role) {
      localStorage.setItem("viventAuthRole", role);
    } else {
      localStorage.removeItem("viventAuthRole");
    }
    setIsAuthenticated(true);
    setAuthRole(role || "");
  };

  const handleLogout = () => {
    localStorage.removeItem("viventAuth");
    localStorage.removeItem("viventAuthRole");
    localStorage.removeItem("viventToken");
    localStorage.removeItem("viventUser");
    setIsAuthenticated(false);
    setAuthRole("");
  };

  const protect = (page, allowedRoles = []) => (
    <ProtectedRoute
      allowedRoles={allowedRoles}
      currentRole={authRole}
      isAuthenticated={isAuthenticated}
    >
      {page}
    </ProtectedRoute>
  );

  return (
    <div className="app min-h-screen flex flex-col">
        <Header
          currentRole={authRole}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
        <main className="main-content flex-1">
          <Routes>
            <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
            <Route
              path="/login"
              element={<Login onAuth={handleAuth} />}
            />
            <Route
              path="/signup"
              element={<Signup onAuth={handleAuth} />}
            />
            <Route path='/events' element={protect(<Eventpage />)} />
            <Route path="/jobfair" element={protect(<Jobfair />)} />
            <Route path="/foodevents" element={protect(<Foodevents />)} />
            <Route path="/educationalexpo" element={protect(<Educationalexpo />)} />
            <Route path="/about" element={protect(<About />)} />
            <Route path="/contact" element={protect(<Contact />)} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfServices />} />
            <Route path="/terms-of-services" element={<Navigate to="/terms-of-service" replace />} />

            {/* Admin panel — server-side role verification required */}
            <Route
              path="/adminpanel"
              element={
                <AdminProtectedRoute isAuthenticated={isAuthenticated}>
                  <Adminpanel onLogout={handleLogout} />
                </AdminProtectedRoute>
              }
            />

            <Route path="/studentpanel" element={protect(<Studentpanel onLogout={handleLogout} />, ["student"])} />
            <Route path="/businesspanel" element={protect(<Businesspanel onLogout={handleLogout} />, ["business"])} />
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
            />
          </Routes>
        </main>
        <FloatingFAQ />
        <Footer />
      </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
