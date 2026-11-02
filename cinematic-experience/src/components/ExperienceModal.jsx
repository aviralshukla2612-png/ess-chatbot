import React, { useState } from "react";
import {
  X,
  Sparkles,
  Send,
  Building2,
  PlusSquare,
  GraduationCap,
  BedDouble,
  ShoppingBag,
  CheckCircle2,
  Bot,
  TrendingUp,
} from "lucide-react";

const DEMO_PRESETS = {
  "real-estate": {
    name: "Emperor Real Estate Assistant",
    tagline: "Ultra-Luxury Property Sales & Lease Discovery",
    avatar: "🏢",
    sampleQuestions: [
      "What are the rates and floor plans for 3BHK penthouses at Azure Residences?",
      "Can I schedule a private VIP site walkthrough this Saturday?",
      "Are there flexible 2-year payment plans available?",
    ],
    initialMessages: [
      {
        sender: "bot",
        text: "Welcome to Azure Residences VIP Sales Lounge. I can assist you with penthouse pricing, architectural layouts, panoramic view orientations, and private viewing appointments. What unit type are you exploring today?",
      },
    ],
    replyMap: {
      default:
        "Azure Residences features 3-Bedroom Sky Penthouses from $1.85M (2,840 sq.ft) with private elevator vestibules and sunset marina views. Would you like me to send you the confidential brochure and reserve a private developer walkthrough?",
    },
    leadData: {
      intent: "High Commercial Intent",
      score: "94/100",
      budget: "$1.5M - $2.5M",
      status: "VIP Qualified Lead",
    },
  },
  healthcare: {
    name: "Emperor Health Concierge",
    tagline: "Clinical Intake & Patient Navigation Assistant",
    avatar: "🩺",
    sampleQuestions: [
      "Do you accept international insurance for cardiology diagnostics?",
      "How soon can I schedule an MRI consultation?",
      "What are the prerequisites for outpatient elective surgery?",
    ],
    initialMessages: [
      {
        sender: "bot",
        text: "Hello! Welcome to Emperor Specialty Medical Care. I can assist with clinical specialties, doctor schedules, insurance eligibility, and immediate priority appointment bookings. How can we support your care today?",
      },
    ],
    replyMap: {
      default:
        "Yes, our diagnostic center is in-network with Cigna, Bupa, and Aetna International for cardiology consultations and advanced echocardiography. Our next available senior specialist consultation is tomorrow at 10:30 AM. Shall I secure this slot for you?",
    },
    leadData: {
      intent: "Clinical Consultation",
      score: "91/100",
      urgency: "Immediate (48h)",
      status: "Intake Verified",
    },
  },
  education: {
    name: "Emperor Academic Advisor",
    tagline: "Admissions Guidance & Executive Program Counseling",
    avatar: "🎓",
    sampleQuestions: [
      "What are the application deadlines and tuition for the Global Executive MBA?",
      "Are merit-based leadership scholarships available for Fall intake?",
      "Can I transfer postgraduate credits from an accredited institution?",
    ],
    initialMessages: [
      {
        sender: "bot",
        text: "Greetings from the Admissions Directorate. I can guide you through program curricula, cohort profiles, entrance requirements, and executive scholarship applications. What academic milestone are you pursuing?",
      },
    ],
    replyMap: {
      default:
        "The Fall cohort deadline for the Global Executive MBA is June 15th with an investment of $42,500. Merit scholarships of up to 35% are currently open for candidates with 7+ years of leadership track record. Would you like me to evaluate your profile eligibility?",
    },
    leadData: {
      intent: "Admissions Inquiry",
      score: "88/100",
      cohort: "Executive Fall 2026",
      status: "Application Qualified",
    },
  },
  hospitality: {
    name: "Emperor Luxury Concierge",
    tagline: "5-Star Resort Booking & Bespoke Guest Experiences",
    avatar: "🥂",
    sampleQuestions: [
      "Can we reserve an overwater pool villa with late checkout for our anniversary?",
      "Are private yacht charters and private chef dinners available?",
      "What airport chauffeur transfer services are included?",
    ],
    initialMessages: [
      {
        sender: "bot",
        text: "Welcome to Emperor Mirage Island Resort. I am your personal guest concierge. How may I orchestrate your upcoming stay, dining reservations, or wellness experiences?",
      },
    ],
    replyMap: {
      default:
        "Congratulations on your upcoming anniversary! Our Overwater Sunset Lagoon Villas feature private infinity plunge pools, personalized champagne amenities, and guaranteed 4:00 PM late checkout. Would you like me to hold this reservation for your preferred dates?",
    },
    leadData: {
      intent: "VIP Reservation",
      score: "96/100",
      tier: "Platinum Suite",
      status: "Booking Confirmed",
    },
  },
  retail: {
    name: "Emperor Luxury Retail AI",
    tagline: "High-Ticket E-commerce Conversational Sales",
    avatar: "💎",
    sampleQuestions: [
      "What is the warranty and certification on hand-crafted mechanical watches?",
      "Do you provide insured international courier shipping to London?",
      "Can I book a private consultation at your Fifth Avenue boutique?",
    ],
    initialMessages: [
      {
        sender: "bot",
        text: "Welcome to the Emperor Haute Horlogerie & High Jewelry House. I can assist you with reference availability, certified provenance, bespoke engraving, and worldwide white-glove delivery.",
      },
    ],
    replyMap: {
      default:
        "Every Emperor timepiece is accompanied by an international 5-year manufacture warranty and COSC chronometer certification. We offer fully insured door-to-door courier delivery to London in 48 hours. Would you like to review the collector catalog?",
    },
    leadData: {
      intent: "Luxury Acquisition",
      score: "92/100",
      category: "Fine Timepieces",
      status: "High Value Prospect",
    },
  },
};

export default function ExperienceModal({ isOpen, onClose, selectedIndustry = "real-estate" }) {
  const [activeTab, setActiveTab] = useState(selectedIndustry || "real-estate");
  const [messages, setMessages] = useState(() => (DEMO_PRESETS[selectedIndustry] || DEMO_PRESETS["real-estate"]).initialMessages);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setMessages((DEMO_PRESETS[newTab] || DEMO_PRESETS["real-estate"]).initialMessages);
  };

  if (!isOpen) return null;

  const currentPreset = DEMO_PRESETS[activeTab] || DEMO_PRESETS["real-estate"];

  const handleSend = (textToSend) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = currentPreset.replyMap.default;
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      setIsTyping(false);
    }, 900);
  };

  const industriesList = [
    { id: "real-estate", label: "Real Estate", icon: Building2 },
    { id: "healthcare", label: "Healthcare", icon: PlusSquare },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "hospitality", label: "Hospitality", icon: BedDouble },
    { id: "retail", label: "Luxury Retail", icon: ShoppingBag },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] max-h-[820px] bg-[#0B0B10] border border-white/[0.12] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#963DFF] to-[#55A9FF] flex items-center justify-center text-white shadow-[0_0_15px_rgba(150,61,255,0.4)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Emperor Nexus — Live Experience Studio
              </h3>
              <p className="text-[11px] text-[#9898A6]">
                Interactive multi-industry sales conversation & lead qualification simulation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9898A6] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Industry Preset Selector Tabs */}
        <div className="px-6 py-3 border-b border-white/[0.06] bg-[#0E0E16] flex items-center gap-2 overflow-x-auto">
          {industriesList.map((ind) => {
            const isSelected = activeTab === ind.id;
            const Icon = ind.icon;
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => handleTabChange(ind.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-[#963DFF]/20 border border-[#963DFF] text-[#C28AFF] shadow-[0_0_16px_rgba(150,61,255,0.3)]"
                    : "bg-white/[0.02] border border-white/[0.06] text-[#9898A6] hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{ind.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Body (2 Columns) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Live Chatbot Window (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#08080C]/80">
            {/* Assistant Header Card */}
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{currentPreset.avatar}</span>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">
                    {currentPreset.name}
                  </h4>
                  <span className="text-[10px] text-[#C28AFF] font-medium block">
                    {currentPreset.tagline}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live AI Grounded
              </span>
            </div>

            {/* Chat Transcript Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "bot" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#963DFF] to-[#55A9FF] flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-[#963DFF] to-[#7928CA] text-white rounded-tr-xs shadow-[0_4px_16px_rgba(150,61,255,0.3)]"
                        : "bg-white/[0.05] border border-white/[0.08] text-[#F5F5F7] rounded-tl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#9898A6]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#963DFF] to-[#55A9FF] flex items-center justify-center text-white shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C28AFF] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C28AFF] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C28AFF] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/[0.04] flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-[#9898A6] font-semibold shrink-0">Ask:</span>
              {currentPreset.sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-[#D9D9E2] hover:text-white transition-colors cursor-pointer shrink-0 truncate max-w-[280px]"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3.5 bg-black/60 border-t border-white/[0.08]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-[#12121A] border border-white/[0.1] rounded-2xl p-1.5 pl-3.5 focus-within:border-[#963DFF] transition-colors"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask a question or test qualification..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-[#9898A6] outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isTyping}
                  className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#963DFF] to-[#55A9FF] flex items-center justify-center text-white disabled:opacity-40 cursor-pointer shadow-sm hover:brightness-110 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Lead Qualification & Real-Time Intelligence (5 Cols) */}
          <div className="lg:col-span-5 p-5 bg-[#0B0B10] flex flex-col space-y-4 overflow-y-auto">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9898A6] block mb-1">
                Real-Time CRM Intelligence
              </span>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#55A9FF]" />
                Automated Intent Scoring
              </h4>
            </div>

            {/* Live Scorecard */}
            <div className="p-4 rounded-2xl bg-[#12121A] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9898A6]">Lead Qualification Score:</span>
                <span className="text-xs font-bold text-[#C28AFF] px-2 py-0.5 rounded-full bg-[#963DFF]/20 border border-[#963DFF]/40">
                  {currentPreset.leadData.score}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9898A6]">Intent Level:</span>
                <span className="text-xs font-semibold text-emerald-400">
                  {currentPreset.leadData.intent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9898A6]">Lifecycle Pipeline:</span>
                <span className="text-xs font-semibold text-white">
                  {currentPreset.leadData.status}
                </span>
              </div>
            </div>

            {/* Architectural Guardrails Highlight */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C28AFF] block">
                Active Governance & Guardrails
              </span>
              <div className="space-y-2 text-xs text-[#D9D9E2]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Strict zero-hallucination vector retrieval citation enforcement</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Multi-tenant encrypted document collection isolation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Instant CRM dispatch via Webhook, Zapier & REST API</span>
                </div>
              </div>
            </div>

            {/* Bottom Call to Action within Modal */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = "/register";
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Deploy This Assistant For Your Business</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
