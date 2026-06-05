import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/protected_route/ProtectedRoute";

import LandingPage from "./pages/public/LandingPage";
import LoginPage    from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NotFoundPage from "./pages/not_found/NotFoundPage";

import UserDashboard from "./pages/user/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import PostDetailPage from "./pages/posts/PostDetailPage";

import ExplorePage from "./pages/public/ExplorePage";
import CommunityFeedPage from "./pages/public/CommunityFeedPage";
import MyCommunitiesPage from "./pages/user/MyCommunitiesPage";
import CreateCommunityPage from "./pages/user/CreateCommunityPage";
import CommunityMembersPage from "./pages/user/CommunityMembersPage";

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public community routes */}
      <Route path="/explore"        element={<ExplorePage />} />
      <Route path="/community/:id"  element={<CommunityFeedPage />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/posts/:id"  element={<ProtectedRoute requiredRole="user"><PostDetailPage /></ProtectedRoute>} />
      <Route path="/my-communities"          element={<ProtectedRoute requiredRole="user"><MyCommunitiesPage /></ProtectedRoute>} />
      <Route path="/community/create"        element={<ProtectedRoute requiredRole="user"><CreateCommunityPage /></ProtectedRoute>} />
      <Route path="/community/:id/members"   element={<ProtectedRoute requiredRole="user"><CommunityMembersPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin"       element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
