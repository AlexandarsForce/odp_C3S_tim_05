import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/protected_route/ProtectedRoute";

import LandingPage from "./pages/public/LandingPage";
import LoginPage    from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NotFoundPage from "./pages/not_found/NotFoundPage";

import UserDashboard from "./pages/user/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import AdminCommunitiesPage from "./pages/admin/CommunitiesPage";
import AdminAuditPage from "./pages/admin/AuditPage";
import AdminHealthPage from "./pages/admin/HealthPage";
import AdminTagsPage from "./pages/admin/TagsPage";
import PostDetailPage from "./pages/posts/PostDetailPage";

import ExplorePage from "./pages/public/ExplorePage";
import CommunityFeedPage from "./pages/public/CommunityFeedPage";
import FeedPage from "./pages/public/FeedPage";
import PublicProfilePage from "./pages/public/PublicProfilePage";
import MyCommunitiesPage from "./pages/user/MyCommunitiesPage";
import CreateCommunityPage from "./pages/user/CreateCommunityPage";
import CommunityMembersPage from "./pages/user/CommunityMembersPage";
import CreatePostPage from "./pages/user/CreatePostPage";
import EditPostPage from "./pages/user/EditPostPage";
import MyProfilePage from "./pages/user/MyProfilePage";
import FollowersPage from "./pages/user/FollowersPage";
import SettingsPage from "./pages/user/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public community routes */}
      <Route path="/explore"        element={<ExplorePage />} />
      <Route path="/community/:id"  element={<CommunityFeedPage />} />
      <Route path="/profile/:id"    element={<PublicProfilePage />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/feed"      element={<ProtectedRoute requiredRole="user"><FeedPage /></ProtectedRoute>} />
      <Route path="/posts/new"      element={<ProtectedRoute requiredRole="user"><CreatePostPage /></ProtectedRoute>} />
      <Route path="/posts/:id"      element={<ProtectedRoute requiredRole="user"><PostDetailPage /></ProtectedRoute>} />
      <Route path="/posts/:id/edit" element={<ProtectedRoute requiredRole="user"><EditPostPage /></ProtectedRoute>} />
      <Route path="/my-communities"          element={<ProtectedRoute requiredRole="user"><MyCommunitiesPage /></ProtectedRoute>} />
      <Route path="/community/create"        element={<ProtectedRoute requiredRole="user"><CreateCommunityPage /></ProtectedRoute>} />
      <Route path="/community/:id/members"   element={<ProtectedRoute requiredRole="user"><CommunityMembersPage /></ProtectedRoute>} />
      <Route path="/profile/me"              element={<ProtectedRoute requiredRole="user"><MyProfilePage /></ProtectedRoute>} />
      <Route path="/profile/me/followers"    element={<ProtectedRoute requiredRole="user"><FollowersPage /></ProtectedRoute>} />
      <Route path="/settings"                element={<ProtectedRoute requiredRole="user"><SettingsPage /></ProtectedRoute>} />

      {/* Admin routes — protection removed for preview */}
      <Route path="/admin"             element={<AdminDashboard />} />
      <Route path="/admin/users"       element={<UsersPage />} />
      <Route path="/admin/communities" element={<AdminCommunitiesPage />} />
      <Route path="/admin/audit"       element={<AdminAuditPage />} />
      <Route path="/admin/health"      element={<AdminHealthPage />} />
      <Route path="/admin/tags"        element={<AdminTagsPage />} />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
