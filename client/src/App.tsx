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

      {/* User routes — protection removed for preview */}
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/feed"      element={<FeedPage />} />
      <Route path="/posts/new"      element={<CreatePostPage />} />
      <Route path="/posts/:id"      element={<PostDetailPage />} />
      <Route path="/posts/:id/edit" element={<EditPostPage />} />
      <Route path="/my-communities"          element={<MyCommunitiesPage />} />
      <Route path="/community/create"        element={<CreateCommunityPage />} />
      <Route path="/community/:id/members"   element={<CommunityMembersPage />} />
      <Route path="/profile/me"              element={<MyProfilePage />} />
      <Route path="/profile/me/followers"    element={<FollowersPage />} />
      <Route path="/settings"                element={<SettingsPage />} />

      {/* Admin routes */}
      <Route path="/admin"             element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"       element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/communities" element={<ProtectedRoute requiredRole="admin"><AdminCommunitiesPage /></ProtectedRoute>} />
      <Route path="/admin/audit"       element={<ProtectedRoute requiredRole="admin"><AdminAuditPage /></ProtectedRoute>} />
      <Route path="/admin/health"      element={<ProtectedRoute requiredRole="admin"><AdminHealthPage /></ProtectedRoute>} />
      <Route path="/admin/tags"        element={<ProtectedRoute requiredRole="admin"><AdminTagsPage /></ProtectedRoute>} />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
