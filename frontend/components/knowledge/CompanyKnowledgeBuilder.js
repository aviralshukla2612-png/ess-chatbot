"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  MapPin,
  HelpCircle,
  Plus,
  Trash2,
  FileCheck2,
  Download,
  ArrowLeft,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { formatCompanyProfileText, generateCompanyProfilePdfBytes } from "@/lib/utils/pdfGenerator";
import { botsApi } from "@/lib/api/bots";
import { knowledgeApi } from "@/lib/api/knowledge";

const SAMPLE_PROFILE = {
  companyName: "Emperor Smart Solutions",
  tagline: "Next-Gen Enterprise AI & Full-Stack Digital Engineering",
  industry: "Software & Enterprise AI",
  founders: "Yash Sharma (Founder) & Karan Makwana (Co-Founder)",
  description:
    "Emperor Smart Solutions (ESS) is an ISO 27001 & ISO 9001 certified technology company delivering custom web, mobile, autonomous AI agents, and RAG systems across India, the US, and Europe.",
  workingDays: "Monday to Saturday",
  openingTime: "10:00 AM",
  closingTime: "07:00 PM",
  timezone: "IST (UTC+5:30)",
  weekendPolicy: "Sundays closed. 24/7 AI Chatbot & WhatsApp automation active.",
  holidayNote: "Closed on Indian National and Gazetted Holidays.",
  services: [
    {
      id: "s1",
      name: "Custom Web & Mobile Development",
      description: "Full-stack development using Next.js, React, Node.js, Flutter, and React Native with cloud deployments.",
      timeline: "3 to 8 weeks",
      pricing: "Starting from ₹50,000",
    },
    {
      id: "s2",
      name: "Enterprise AI & RAG Chatbots",
      description: "Custom AI knowledge chatbots, vector search, autonomous workflows, and CRM lead capture integrations.",
      timeline: "1 to 3 weeks",
      pricing: "Starting from ₹35,000",
    },
    {
      id: "s3",
      name: "Dedicated Developer Pods",
      description: "Hire vetted full-stack, AI, and DevOps developers on flexible hourly or monthly retainer contracts.",
      timeline: "Immediate onboarding within 48 hours",
      pricing: "Hourly & Monthly milestone billing",
    },
  ],
  startingPrice: "₹25,000 / $350",
  pricingTiers: "Rapid Prototypes: ₹25k–₹50k | Standard Apps: ₹50k–₹2L | Custom Enterprise: ₹2L+",
  paymentTerms: "50% project kickoff milestone, 50% upon verified deployment & NDA handover.",
  freeConsultation: "Free 30-minute discovery call & prototype demonstration.",
  officeAddress: "202, Shitiratna Complex, Panchvati, Navrangpura, Ahmedabad - 380009, Gujarat, India",
  serviceAreas: "Ahmedabad, Mumbai, Delhi-NCR, Bangalore, USA, UAE, and Global Remote",
  phone: "+91 63591 20081",
  whatsapp: "+91 63591 20081",
  email: "contact@emperorsmartsolutions.com",
  website: "https://emperorsmartsolutions.com",
  faqs: [
    {
      id: "f1",
      question: "What are your business hours?",
      answer: "We are open Monday through Saturday from 10:00 AM to 7:00 PM IST. We are closed on Sundays, but our AI assistant and WhatsApp line remain available 24/7.",
    },
    {
      id: "f2",
      question: "Do you sign NDAs before discussing client projects?",
      answer: "Yes, 100% of all client engagements are protected by mutual bilateral non-disclosure agreements before project discovery.",
    },
    {
      id: "f3",
      question: "What services do you provide?",
      answer: "We specialize in Custom Web & Mobile Apps, Enterprise AI & RAG Chatbots, Cloud/DevOps infrastructure, and Dedicated Developer pods.",
    },
    {
      id: "f4",
      question: "Where is your office located?",
      answer: "Our head office is at 202, Shitiratna Complex, Panchvati, Navrangpura, Ahmedabad, Gujarat, India.",
    },
  ],
};

const inputClass =
  "company-profile-input w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden transition-all shadow-2xs placeholder:text-neutral-400 dark:placeholder:text-neutral-500";

const labelClass = "font-bold text-xs text-slate-800 dark:text-neutral-200 block mb-1.5";

export default function CompanyKnowledgeBuilder({
  initialBotId = "",
  isMandatory = false,
  onDocumentTrained,
}) {
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(initialBotId || "");
  const [form, setForm] = useState(SAMPLE_PROFILE);
  const [step, setStep] = useState("form"); // "form" | "review" | "success"
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [compiledText, setCompiledText] = useState("");
  const [reviewTab, setReviewTab] = useState("document"); // "document" | "text"
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [trainedDocResult, setTrainedDocResult] = useState(null);

  useEffect(() => {
    async function loadBots() {
      try {
        const list = await botsApi.getBots();
        if (Array.isArray(list) && list.length > 0) {
          setBots(list);
          const matched = list.find((b) => b.id === initialBotId || b.name === initialBotId);
          setSelectedBotId(matched ? matched.id : list[0].id);
        } else {
          setSelectedBotId(initialBotId || "bot_aa");
        }
      } catch (err) {
        setSelectedBotId(initialBotId || "bot_aa");
      }
    }
    loadBots();
  }, [initialBotId]);

  const handleFieldChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  // Services dynamic handling
  const addService = () => {
    setForm((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        { id: `s_${Date.now()}`, name: "", description: "", timeline: "", pricing: "" },
      ],
    }));
  };

  const updateService = (id, field, val) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
    }));
  };

  const removeService = (id) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

  // FAQ dynamic handling
  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { id: `f_${Date.now()}`, question: "", answer: "" }],
    }));
  };

  const updateFaq = (id, field, val) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, [field]: val } : f)),
    }));
  };

  const removeFaq = (id) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
  };

  // Step 2: Compile and Generate PDF for Review
  const handleProceedToReview = async (e) => {
    if (e) e.preventDefault();
    if (!form.companyName.trim()) {
      alert("Please provide at least a Company Name.");
      return;
    }

    setGeneratingPdf(true);
    setApprovalError("");

    try {
      const text = formatCompanyProfileText(form);
      setCompiledText(text);

      const pdfBytes = await generateCompanyProfilePdfBytes(form);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      setStep("review");
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error compiling PDF: " + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Step 3: User Approves and Triggers Training
  const handleApproveAndTrain = async () => {
    const targetBot = selectedBotId || initialBotId || "bot_aa";
    if (!targetBot) {
      setApprovalError("Please select a target chatbot to train.");
      return;
    }

    setApproving(true);
    setApprovalError("");

    try {
      const sanitizedName = (form.companyName || "Company").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${sanitizedName}_Business_Knowledge_Profile.pdf`;

      const doc = await knowledgeApi.addDocument(targetBot, {
        name: fileName,
        content: compiledText,
        type: "PDF",
      });

      setTrainedDocResult(doc);
      setStep("success");
      if (onDocumentTrained) onDocumentTrained(doc);
    } catch (err) {
      console.error("Failed to approve and train bot:", err);
      setApprovalError(err.message || "Failed to train chatbot knowledge base.");
    } finally {
      setApproving(false);
    }
  };

  const selectedBot = bots.find((b) => b.id === (selectedBotId || initialBotId)) || {
    id: selectedBotId || initialBotId || "bot_aa",
    name: (selectedBotId || initialBotId) === "bot_aa" ? "Official AI Assistant (bot_aa)" : (selectedBotId || initialBotId),
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Notification Alert */}
      {isMandatory && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 dark:text-amber-100">
                Mandatory Setup Required Before Bot Activation
              </h4>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 mt-0.5">
                Every bot requires an approved Company Profile Intake so it can answer visitor inquiries about business hours, services, pricing, and office address.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 text-slate-950 shrink-0 shadow-xs">
            Mandatory Gate
          </span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0 mt-0.5">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Company Knowledge Profile & AI Training
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Step-by-Step Intake
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
                Provide your company hours, services, pricing, office address, and common FAQs.
                The system compiles an official corporate PDF dossier, lets you <strong>review and approve</strong> it, then automatically trains your chatbot!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {step === "form" && (
              <button
                type="button"
                onClick={() => setForm(SAMPLE_PROFILE)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 text-xs font-semibold text-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Fill Sample Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mt-6 pt-5 border-t border-indigo-800/40 grid grid-cols-3 gap-3 text-xs">
          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
              step === "form"
                ? "bg-indigo-500/20 border-indigo-400 text-white font-bold"
                : "border-indigo-900/50 text-indigo-300/70"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
              1
            </span>
            <span>1. Fill Company Form</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
              step === "review"
                ? "bg-amber-500/20 border-amber-400 text-white font-bold"
                : "border-indigo-900/50 text-indigo-300/70"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
              2
            </span>
            <span>2. Review & Approve PDF</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
              step === "success"
                ? "bg-emerald-500/20 border-emerald-400 text-white font-bold"
                : "border-indigo-900/50 text-indigo-300/70"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
              3
            </span>
            <span>3. Chatbot Live & Trained</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Interactive Intake Form */}
      {step === "form" && (
        <form onSubmit={handleProceedToReview} className="space-y-6">
          {/* Target Bot Selection Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Target Chatbot to Train
                </label>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Select which chatbot will ingest and memorize this approved company knowledge.
                </p>
              </div>
            </div>

            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.id})
                </option>
              ))}
              {bots.length === 0 && <option value="bot_aa">Default AI Assistant (bot_aa)</option>}
            </select>
          </div>

          {/* Section 1: Company Identity */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                1. Company Identity & Leadership
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={labelClass}>Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => handleFieldChange("companyName", e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Tagline / Motto</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => handleFieldChange("tagline", e.target.value)}
                  placeholder="e.g. Next-Gen AI Automation for Enterprises"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Industry / Business Domain</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => handleFieldChange("industry", e.target.value)}
                  placeholder="e.g. Healthcare, IT Software, Real Estate, E-Commerce"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Founders / Leadership Names</label>
                <input
                  type="text"
                  value={form.founders}
                  onChange={(e) => handleFieldChange("founders", e.target.value)}
                  placeholder="e.g. Yash Sharma (Founder) & Karan Makwana (Co-Founder)"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Detailed Company Overview & Mission</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Briefly describe what your company does, its certifications, accomplishments, and value proposition..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Business Hours & Timings */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  2. Business Hours & Opening Schedule
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Your chatbot will use these exact timings when visitors ask "When do you open?" or "Are you open on Saturdays?".
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className={labelClass}>Operating Days</label>
                <input
                  type="text"
                  value={form.workingDays}
                  onChange={(e) => handleFieldChange("workingDays", e.target.value)}
                  placeholder="e.g. Monday to Saturday"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Opening Time</label>
                <input
                  type="text"
                  value={form.openingTime}
                  onChange={(e) => handleFieldChange("openingTime", e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Closing Time</label>
                <input
                  type="text"
                  value={form.closingTime}
                  onChange={(e) => handleFieldChange("closingTime", e.target.value)}
                  placeholder="e.g. 07:00 PM"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Timezone</label>
                <input
                  type="text"
                  value={form.timezone}
                  onChange={(e) => handleFieldChange("timezone", e.target.value)}
                  placeholder="e.g. IST (UTC+5:30) or EST"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Sunday & Weekend Policy</label>
                <input
                  type="text"
                  value={form.weekendPolicy}
                  onChange={(e) => handleFieldChange("weekendPolicy", e.target.value)}
                  placeholder="e.g. Closed on Sundays. 24/7 AI chat active."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Public Holidays Policy</label>
                <input
                  type="text"
                  value={form.holidayNote}
                  onChange={(e) => handleFieldChange("holidayNote", e.target.value)}
                  placeholder="e.g. Closed on National Gazetted Holidays"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Services & Products */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    3. Products & Services Provided
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Detail the offerings your chatbot will recommend to prospects.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addService}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.services.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Service #{idx + 1}
                    </span>
                    {form.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(s.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-1">
                      <label className={labelClass}>Service Name *</label>
                      <input
                        type="text"
                        required
                        value={s.name}
                        onChange={(e) => updateService(s.id, "name", e.target.value)}
                        placeholder="e.g. Web & Mobile App Development"
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className={labelClass}>Timeline / Turnaround</label>
                      <input
                        type="text"
                        value={s.timeline}
                        onChange={(e) => updateService(s.id, "timeline", e.target.value)}
                        placeholder="e.g. 2 to 4 weeks"
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className={labelClass}>Pricing / Rates</label>
                      <input
                        type="text"
                        value={s.pricing}
                        onChange={(e) => updateService(s.id, "pricing", e.target.value)}
                        placeholder="e.g. Starting from ₹50,000"
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className={labelClass}>Deliverables & Details</label>
                      <input
                        type="text"
                        value={s.description}
                        onChange={(e) => updateService(s.id, "description", e.target.value)}
                        placeholder="e.g. Full-stack development using Next.js, Flutter, scalable cloud backend and CI/CD pipelines"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Pricing & Policies */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                4. Pricing, Budget Tiers & Payment Policies
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={labelClass}>Starting / Minimum Project Budget</label>
                <input
                  type="text"
                  value={form.startingPrice}
                  onChange={(e) => handleFieldChange("startingPrice", e.target.value)}
                  placeholder="e.g. ₹25,000 / $500"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Standard Budget Tiers</label>
                <input
                  type="text"
                  value={form.pricingTiers}
                  onChange={(e) => handleFieldChange("pricingTiers", e.target.value)}
                  placeholder="e.g. Basic: ₹25k–₹50k | Pro: ₹50k–₹1.5L | Enterprise: Custom"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Payment Milestones & Terms</label>
                <input
                  type="text"
                  value={form.paymentTerms}
                  onChange={(e) => handleFieldChange("paymentTerms", e.target.value)}
                  placeholder="e.g. 50% upfront deposit, 50% upon final sign-off"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Free Consultation / Discovery Call Offer</label>
                <input
                  type="text"
                  value={form.freeConsultation}
                  onChange={(e) => handleFieldChange("freeConsultation", e.target.value)}
                  placeholder="e.g. Free 30-minute discovery call & architecture plan"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Office Location & Contact */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                5. Location & Official Contact Channels
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className={labelClass}>Head Office Address</label>
                <input
                  type="text"
                  value={form.officeAddress}
                  onChange={(e) => handleFieldChange("officeAddress", e.target.value)}
                  placeholder="e.g. 202, Shitiratna Complex, Panchvati, Ahmedabad, Gujarat, India"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Service Coverage Areas</label>
                <input
                  type="text"
                  value={form.serviceAreas}
                  onChange={(e) => handleFieldChange("serviceAreas", e.target.value)}
                  placeholder="e.g. Ahmedabad, Mumbai, Delhi, Remote Worldwide"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Official Phone / WhatsApp</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="e.g. +91 63591 20081"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Support & Sales Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="e.g. contact@emperorsmartsolutions.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Official Website URL</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => handleFieldChange("website", e.target.value)}
                  placeholder="e.g. https://emperorsmartsolutions.com"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Top Customer FAQs */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    6. Frequently Asked Questions (FAQs)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Specific answers the chatbot will draw from to give precise answers.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.faqs.map((faq, idx) => (
                <div
                  key={faq.id}
                  className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Question #{idx + 1}
                    </span>
                    {form.faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFaq(faq.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <input
                      type="text"
                      required
                      value={faq.question}
                      onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
                      placeholder="e.g. Do you offer ongoing maintenance?"
                      className={inputClass}
                    />

                    <textarea
                      rows={2}
                      required
                      value={faq.answer}
                      onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                      placeholder="e.g. Yes, we provide 24/7 SLA maintenance and monthly retainer support."
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Next step: You will review the generated PDF before training your chatbot.</span>
            </div>

            <button
              type="submit"
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {generatingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling PDF Dossier...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Preview & Review PDF Document &rarr;</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Review & Approval Gateway Screen */}
      {step === "review" && (
        <div className="space-y-6">
          {/* Approval Header Card */}
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                    Mandatory Review: Approve Company Knowledge Before Training
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                    Awaiting Your Approval
                  </span>
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Verify the compiled profile below. When satisfied, click <strong>"Approve & Train Chatbot"</strong> to index it into <strong>{selectedBot.name}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download={`${(form.companyName || "Company").replace(/[^a-zA-Z0-9_-]/g, "_")}_Knowledge_Profile.pdf`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download PDF</span>
                </a>
              )}
            </div>
          </div>

          {approvalError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{approvalError}</span>
            </div>
          )}

          {/* Preview Tabs: Formatted Dossier vs Raw Text */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewTab("document")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    reviewTab === "document"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Document Dossier View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab("text")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    reviewTab === "text"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <span>Raw Text Ingestion View</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                Target Bot: <strong className="text-indigo-600 dark:text-indigo-400">{selectedBot.name}</strong>
              </span>
            </div>

            {/* Document Dossier View */}
            {reviewTab === "document" ? (
              <div className="p-8 space-y-6 max-w-4xl mx-auto bg-slate-50 dark:bg-neutral-950 font-sans text-xs text-slate-800 dark:text-slate-200">
                {/* Dossier Cover Header */}
                <div className="p-6 rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Official Company Knowledge Profile
                      </span>
                      <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">
                        {form.companyName}
                      </h2>
                      {form.tagline && (
                        <p className="text-xs text-indigo-200/90 mt-0.5">{form.tagline}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/20">
                      {form.industry || "Enterprise"}
                    </span>
                  </div>
                  {form.founders && (
                    <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-indigo-200">
                      Leadership: <strong className="text-white">{form.founders}</strong>
                    </div>
                  )}
                </div>

                {/* Section 1: Overview */}
                <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    1. Company Overview
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {form.description || "N/A"}
                  </p>
                </div>

                {/* Section 2: Timings */}
                <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    2. Business Hours & Opening Schedule
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <span className="text-slate-400 block">Working Days</span>
                      <strong className="text-slate-900 dark:text-white">{form.workingDays}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <span className="text-slate-400 block">Hours</span>
                      <strong className="text-slate-900 dark:text-white">{form.openingTime} – {form.closingTime}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <span className="text-slate-400 block">Timezone</span>
                      <strong className="text-slate-900 dark:text-white">{form.timezone}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <span className="text-slate-400 block">Sundays</span>
                      <strong className="text-slate-900 dark:text-white">{form.weekendPolicy}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 3: Services */}
                <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    3. Products & Services ({form.services.length})
                  </h4>
                  <div className="space-y-2">
                    {form.services.map((s, idx) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-slate-900 dark:text-white">
                            {idx + 1}. {s.name}
                          </strong>
                          {s.pricing && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {s.pricing}
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <p className="text-[11px] text-slate-600 dark:text-neutral-300 mt-1">
                            {s.description}
                          </p>
                        )}
                        {s.timeline && (
                          <span className="inline-block text-[10px] text-slate-400 mt-1">
                            Turnaround: {s.timeline}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: Location & Contact */}
                <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    4. Office Location & Contact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Office Address:</span>
                      <strong className="text-slate-900 dark:text-white">{form.officeAddress}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Service Areas:</span>
                      <strong className="text-slate-900 dark:text-white">{form.serviceAreas}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone & WhatsApp:</span>
                      <strong className="text-slate-900 dark:text-white">{form.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email & Website:</span>
                      <strong className="text-slate-900 dark:text-white">{form.email} | {form.website}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 5: FAQs */}
                <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    5. Frequently Asked Questions ({form.faqs.length})
                  </h4>
                  <div className="space-y-2">
                    {form.faqs.map((f, idx) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40"
                      >
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          Q{idx + 1}: {f.question}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-neutral-300 mt-1 pl-3 border-l-2 border-indigo-400">
                          {f.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
                  {compiledText}
                </pre>
              </div>
            )}
          </div>

          {/* Approval Decision Action Bar */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>&larr; Back to Edit Answers</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-neutral-400 hidden md:inline">
                Clicking approve will immediately chunk & index this PDF into {selectedBot.name}.
              </span>

              <button
                type="button"
                disabled={approving}
                onClick={handleApproveAndTrain}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {approving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Indexing into Chatbot Knowledge...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Train Chatbot Now ✅</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Success Confirmation Screen */}
      {step === "success" && (
        <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800 shadow-lg text-center space-y-5 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-300 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Training Complete
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Your Company Knowledge is Live in Chatbot!
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-2 max-w-lg mx-auto leading-relaxed">
              <strong>{form.companyName}</strong>'s business profile has been approved and ingested into <strong>{selectedBot.name}</strong> ({trainedDocResult?.chunksCount || 6} knowledge chunks indexed).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Document Name:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {trainedDocResult?.name || `${form.companyName}_Profile.pdf`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Chatbot:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedBot.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Indexed Chunks:</span>
              <span className="font-bold text-emerald-600">{trainedDocResult?.chunksCount || 6} vector chunks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-600">Active & Ready for Visitor Queries</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Create / Update Another Profile</span>
            </button>

            {pdfUrl && (
              <a
                href={pdfUrl}
                download={`${(form.companyName || "Company").replace(/[^a-zA-Z0-9_-]/g, "_")}_Knowledge_Profile.pdf`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Approved PDF</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
