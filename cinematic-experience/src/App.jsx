import React, { useState, useEffect } from "react";
import Lenis from "lenis";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ExperienceModal from "./components/ExperienceModal";
import IndustriesSection from "./components/IndustriesSection";
import BenefitsSection from "./components/BenefitsSection";
import HowItWorksSection from "./components/HowItWorksSection";
import PricingSection from "./components/PricingSection";
import Footer from "./components/Footer";

export default function App() {
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("real-estate");

  // Initialize Lenis Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const reqId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(reqId);
      lenis.destroy();
    };
  }, []);

  const handleOpenExperience = (industryId = "real-estate") => {
    setSelectedIndustry(industryId);
    setExperienceModalOpen(true);
  };

  const handleOpenTrial = () => {
    // Navigate to registration or login
    window.location.href = "/register";
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] font-body selection:bg-[#963DFF] selection:text-white relative">
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
