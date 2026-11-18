"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building2,
  HelpCircle,
  ShieldCheck,
  Palette,
  CheckCircle2,
  RotateCcw,
  Bot,
  AlertCircle,
  X,
} from "lucide-react";
import Step01Industry from "./Step01Industry";
import Step02BusinessInfo from "./Step02BusinessInfo";
import Step03Questionnaire from "./Step03Questionnaire";
import Step04Review from "./Step04Review";
import Step05AssistantConfig from "./Step05AssistantConfig";
import Step06CreateBot from "./Step06CreateBot";
import {
  INDUSTRIES,
  generateKnowledgeMarkdown,
  generateIndustrySystemPrompt,
} from "@/lib/wizard/industryTemplates";
import { botsApi } from "@/lib/api/bots";

const DRAFT_STORAGE_KEY = "emperor_nexus_bot_wizard_draft_v1";

const WIZARD_STEPS = [
  { id: 1, number: "01", label: "Industry", icon: Sparkles },
  { id: 2, number: "02", label: "Business Info", icon: Building2 },
  { id: 3, number: "03", label: "Questions", icon: HelpCircle },
  { id: 4, number: "04", label: "Review", icon: ShieldCheck },
  { id: 5, number: "05", label: "Assistant", icon: Palette },
  { id: 6, number: "06", label: "Launch", icon: CheckCircle2 },
];

export default function IndustryBotWizard() {
  const router = useRouter();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);
  const [draftDetected, setDraftDetected] = useState(false);

  // Form State
  const [selectedIndustry, setSelectedIndustry] = useState("clinic");
  const [customIndustryDesc, setCustomIndustryDesc] = useState("");

  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    tagline: "",
    description: "",
    websiteUrl: "",
    businessEmail: "",
    phoneNumber: "",
    businessAddress: "",
    workingDaysHours: "Monday to Saturday: 10:00 AM – 07:00 PM IST (Sundays Closed)",
    mainOfferings: "",
  });

  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const [assistantConfig, setAssistantConfig] = useState({
    name: "Clinic Care Assistant",
    personality: "Helpful & Professional",
    welcomeMessage: "Hello! Welcome to our clinic. How can I help you today?",
    primaryColor: "#4F46E5",
    avatar: "🤖",
    launcherShape: "squircle",
    launcherAnimation: "none",
    starterQuestions: [
      "What doctors and specialists are available?",
      "What are your consultation timings and fees?",
      "Do I need an appointment or are walk-ins welcome?",
    ],
    customInstructions: "",
  });

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationStage, setCreationStage] = useState(1);
  const [submitError, setSubmitError] = useState("");
  const [createdBot, setCreatedBot] = useState(null);

  // 1. Auto-update defaults when industry changes (if user hasn't heavily customized them)
  const handleSelectIndustry = (indId) => {
    setSelectedIndustry(indId);
    const ind = INDUSTRIES.find((i) => i.id === indId);
    if (ind) {
      setAssistantConfig((prev) => ({
        ...prev,
        name: ind.defaultBotName,
        welcomeMessage: ind.defaultWelcomeMessage,
        starterQuestions: [...ind.starterQuestions],
        primaryColor: ind.accentColor || prev.primaryColor,
      }));
    }
  };

  // 2. Pre-fill user/org details and check for URL param / stored industry or existing draft
  useEffect(() => {
    async function loadAccountDetails() {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (meRes?.user) {
          setBusinessDetails((prev) => ({
            ...prev,
            businessEmail: prev.businessEmail || meRes.user.email || "",
            businessName: prev.businessName || meRes.activeOrgName || meRes.user.name || "",
          }));
        }
      } catch (e) {}

      // Auto-detect selected industry from landing page / sign-in redirect
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryInd = urlParams.get("industry") || localStorage.getItem("nexus_selected_industry");
        if (queryInd) {
          const s = String(queryInd).toLowerCase().trim();
          let canonical = null;
          if (s === "real-estate" || s === "realestate" || s === "property") canonical = "real-estate";
          else if (s === "healthcare" || s === "clinic" || s === "health" || s === "medical") canonical = "clinic";
          else if (s === "hospital") canonical = "hospital";
          else if (s === "education" || s === "school" || s === "college" || s === "admissions") canonical = "education";
          else if (s === "hospitality" || s === "hotel" || s === "resort") canonical = "hotel";
          else if (s === "restaurant" || s === "dining" || s === "cafe" || s === "food") canonical = "restaurant";
          else if (s === "retail" || s === "retail-ecommerce" || s === "ecommerce" || s === "shop") canonical = "retail-ecommerce";
          else if (s === "professional-services" || s === "consulting" || s === "corporate") canonical = "professional-services";
          else if (s === "and-more" || s === "other" || s === "more") canonical = "other";
          else if (INDUSTRIES.some((i) => i.id === s)) canonical = s;

          if (canonical) {
            handleSelectIndustry(canonical);
          }
        }
      } catch (e) {}

      // Check draft
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.selectedIndustry || parsed.businessDetails?.businessName)) {
            setDraftDetected(true);
          }
        }
      } catch (e) {}
    }

    loadAccountDetails();
  }, []);

  // 3. Draft management
  const handleResumeDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.currentStep) setCurrentStep(d.currentStep);
        if (d.selectedIndustry) setSelectedIndustry(d.selectedIndustry);
        if (d.customIndustryDesc) setCustomIndustryDesc(d.customIndustryDesc);
        if (d.businessDetails) setBusinessDetails(d.businessDetails);
        if (d.questionnaireAnswers) setQuestionnaireAnswers(d.questionnaireAnswers);
        if (d.uploadedDocuments) setUploadedDocuments(d.uploadedDocuments);
        if (d.assistantConfig) setAssistantConfig(d.assistantConfig);
      }
    } catch (e) {}
    setDraftDetected(false);
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
    setDraftDetected(false);
  };

  // Autosave to localStorage on state changes
  useEffect(() => {
    if (currentStep === 6 && createdBot) return; // Don't save after finish
    const draftPayload = {
      currentStep,
      selectedIndustry,
      customIndustryDesc,
      businessDetails,
      questionnaireAnswers,
      uploadedDocuments,
      assistantConfig,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    } catch (e) {}
  }, [
    currentStep,
    selectedIndustry,
    customIndustryDesc,
    businessDetails,
    questionnaireAnswers,
    uploadedDocuments,
    assistantConfig,
    createdBot,
  ]);

  // Document add/remove
  const handleAddDocument = (doc) => {
    setUploadedDocuments((prev) => [...prev, doc]);
  };
  const handleRemoveDocument = (docId) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // 4. Final Submission Logic
  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    setCreationStage(1);

    try {
      // Stage 1: Validate payload
      await new Promise((r) => setTimeout(r, 400));
      setCreationStage(2);

      // Synthesize approved business knowledge profile
      const knowledgeMarkdown = generateKnowledgeMarkdown({
        industry: selectedIndustry,
        commonDetails: businessDetails,
        questionnaireAnswers,
        assistantConfig,
      });

      const systemPrompt = generateIndustrySystemPrompt({
        industry: selectedIndustry,
        commonDetails: businessDetails,
        questionnaireAnswers,
        assistantConfig,
      });

      const payload = {
        name: assistantConfig.name || "AI Assistant",
        company: businessDetails.businessName,
        industry: selectedIndustry,
        description: businessDetails.description || `${selectedIndustry} AI Assistant`,
        websiteUrl: businessDetails.websiteUrl?.trim() || null,
        phoneNumber: businessDetails.phoneNumber?.trim() || null,
        businessAddress: businessDetails.businessAddress || null,
        workingDaysHours: businessDetails.workingDaysHours || null,
        primaryColor: assistantConfig.primaryColor || "#4F46E5",
        avatar: assistantConfig.avatar || "🤖",
        welcomeMessage: assistantConfig.welcomeMessage,
        personality: assistantConfig.personality,
        launcherShape: assistantConfig.launcherShape || "squircle",
        launcherAnimation: assistantConfig.launcherAnimation || "none",
        starterQuestions: assistantConfig.starterQuestions || [],
        systemPrompt,
        businessDetails,
        questionnaireAnswers,
        assistantConfig,
        knowledgeMarkdown,
        documents: uploadedDocuments,
      };

      // Stage 2 & 3: Register Bot & Synthesize Knowledge
      setCreationStage(3);
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create bot. Limit may have been reached.");
      }

      // Stage 4: Indexing RAG
      setCreationStage(4);
      await new Promise((r) => setTimeout(r, 500));

      // Stage 5: Activated
      setCreationStage(5);
      await new Promise((r) => setTimeout(r, 300));

      const bot = data.bot;
      setCreatedBot(bot);

      // Clean draft from localStorage upon confirmed creation
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}
    } catch (err) {
      console.error("[WIZARD_CREATION_ERR]", err);
      setSubmitError(err.message || "Failed to create assistant. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in text-[var(--text-primary)] font-sans">
      {/* Draft Recovery Banner */}
      {draftDetected && (
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-border)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-[var(--shadow-xs)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-primary)]">
                Saved Draft Detected
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                You have an unfinished chatbot setup draft on this device. Resume where you left off?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResumeDraft}
              className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Resume Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="h-8 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-medium cursor-pointer transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* 6-Step Visual Breadcrumb Indicator */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between overflow-x-auto gap-2 py-0.5 scrollbar-none">
          {WIZARD_STEPS.map((stg, sIdx) => {
            const isCompleted = currentStep > stg.id;
            const isCurrent = currentStep === stg.id;

            return (
              <React.Fragment key={stg.id}>
                <button
                  type="button"
                  disabled={isSubmitting || Boolean(createdBot)}
                  onClick={() => {
                    if (stg.id < currentStep) {
                      setCurrentStep(stg.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all shrink-0 select-none ${
                    isCurrent
                      ? "bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)] font-semibold"
                      : isCompleted
                      ? "text-emerald-700 dark:text-emerald-400 hover:bg-[var(--bg-subtle)] cursor-pointer font-medium"
                      : "text-[var(--text-muted)] cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : isCompleted
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                    }`}
                  >
                    {isCompleted ? "✓" : stg.number}
                  </div>

                  <span className="text-xs tracking-tight whitespace-nowrap">
                    {stg.label}
                  </span>
                </button>

                {sIdx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`h-px w-4 sm:w-8 shrink-0 transition-all ${
                      currentStep > sIdx + 1 ? "bg-emerald-500/60" : "bg-[var(--border-subtle)]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Stages */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <Step01Industry
            selectedIndustry={selectedIndustry}
            onSelectIndustry={handleSelectIndustry}
            customIndustryDesc={customIndustryDesc}
            onChangeCustomDesc={setCustomIndustryDesc}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step02BusinessInfo
            businessDetails={businessDetails}
            onChangeBusinessDetails={setBusinessDetails}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step03Questionnaire
            industry={selectedIndustry}
            questionnaireAnswers={questionnaireAnswers}
            onChangeAnswers={setQuestionnaireAnswers}
            uploadedDocuments={uploadedDocuments}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step04Review
            industry={selectedIndustry}
            businessDetails={businessDetails}
            questionnaireAnswers={questionnaireAnswers}
            uploadedDocuments={uploadedDocuments}
            onEditStep={(stepNum) => setCurrentStep(stepNum)}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step05AssistantConfig
            industry={selectedIndustry}
            businessDetails={businessDetails}
            assistantConfig={assistantConfig}
            onChangeAssistantConfig={setAssistantConfig}
            onNext={() => setCurrentStep(6)}
            onBack={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 6 && (
          <Step06CreateBot
            industry={selectedIndustry}
            businessDetails={businessDetails}
            assistantConfig={assistantConfig}
            uploadedDocuments={uploadedDocuments}
            isSubmitting={isSubmitting}
            submitError={submitError}
            createdBot={createdBot}
            creationStage={creationStage}
            onConfirmCreate={handleConfirmCreate}
            onBack={() => setCurrentStep(5)}
          />
        )}
      </div>
    </div>
  );
}

