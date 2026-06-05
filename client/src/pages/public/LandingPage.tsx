import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { PublicNavbar } from "../../components/public/Navbar";
import { PublicFooter } from "../../components/public/Footer";
import { HeroSection } from "../../components/public/HeroSection";
import { StatsBar } from "../../components/public/StatsBar";
import { FeaturesSection } from "../../components/public/FeaturesSection";
import { CommunitiesGrid } from "../../components/public/CommunitiesGrid";
import { FinalCTA } from "../../components/public/FinalCTA";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <PublicNavbar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <CommunitiesGrid />
      <FinalCTA />
      <PublicFooter />
    </div>
  );
}
