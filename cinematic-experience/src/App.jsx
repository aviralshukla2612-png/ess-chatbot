import React, { useState, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ExperienceModal from "./components/ExperienceModal";
import IndustriesSection from "./components/IndustriesSection";
import BenefitsSection from "./components/BenefitsSection";
import HowItWorksSection from "./components/HowItWorksSection";
import PricingSection from "./components/PricingSection";
import Footer from "./components/Footer";
import TrionnLoader from "./components/TrionnLoader";

// Register ScrollTrigger globally
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("real-estate");

  // Coordinate Lenis Smooth Scrolling with GSAP ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    // 1. Forward Lenis scroll updates to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 2. Drive Lenis via GSAP ticker for synchronized frame delivery
    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // 3. Initial ScrollTrigger layout refresh after paint
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(refreshTimer);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const handleOpenExperience = (industryId = "real-estate") => {
    setSelectedIndustry(industryId);
    setExperienceModalOpen(true);
  };

  const handleOpenTrial = () => {
    // Navigate to login
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] font-body selection:bg-[#963DFF] selection:text-white relative">
      {/* 0. Trionn-style Cinematic Preloader with User's Video */}
      {loading && <TrionnLoader onComplete={() => setLoading(false)} />}

      {/* 1. Header / Navigation */}
      <Navbar
        onOpenExperience={() => handleOpenExperience("real-estate")}
        onOpenTrial={handleOpenTrial}
      />

      {/* 2. Hero Section (Primary Implementation with bg.png) */}
      <HeroSection
        onOpenExperience={() => handleOpenExperience("real-estate")}
        onOpenTrial={handleOpenTrial}
        onSelectIndustry={(indId) => handleOpenExperience(indId)}
      />

      {/* 3. Deep Dive Industries Section */}
      <IndustriesSection
        onOpenExperience={(indId) => handleOpenExperience(indId)}
        onOpenTrial={handleOpenTrial}
      />

      {/* 4. Architectural Benefits & Governance */}
      <BenefitsSection
        onOpenTrial={handleOpenTrial}
      />

      {/* 5. 3-Step Setup: How It Works */}
      <HowItWorksSection
        onOpenTrial={handleOpenTrial}
      />

      {/* 6. Pricing Matrix */}
      <PricingSection
        onOpenTrial={handleOpenTrial}
      />

      {/* 7. Footer */}
      <Footer />

      {/* 8. Interactive Experience Studio Modal */}
      <ExperienceModal
        key={selectedIndustry + (experienceModalOpen ? "_open" : "_closed")}
        isOpen={experienceModalOpen}
        onClose={() => setExperienceModalOpen(false)}
        selectedIndustry={selectedIndustry}
      />
    </div>
  );
}
