"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  FileText,
  Upload,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { getIndustryQuestions, INDUSTRIES } from "@/lib/wizard/industryTemplates";

export default function Step03Questionnaire({
  industry,
  questionnaireAnswers,
  onChangeAnswers,
  onNext,
  onBack,
  uploadedDocuments,
  onAddDocument,
  onRemoveDocument,
}) {
  const questions = getIndustryQuestions(industry);
  const ind = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[0];

  // Paginate questions 1 by 1 or in focused sub-steps
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [showEnrichmentPanel, setShowEnrichmentPanel] = useState(false);
  const [newCustomTag, setNewCustomTag] = useState("");

  const currentQ = questions[currentQuestionIdx];
  const isFirst = currentQuestionIdx === 0;
  const isLast = currentQuestionIdx === questions.length - 1;

  const currentVal = questionnaireAnswers[currentQ?.id];

  const updateAnswer = (val) => {
    setValidationError("");
    onChangeAnswers({
      ...questionnaireAnswers,
      [currentQ.id]: val,
    });
  };

  // Repeater handlers
  const handleAddRepeaterItem = () => {
    const list = Array.isArray(currentVal) ? [...currentVal] : [];
    const blank = {};
    currentQ.fields.forEach((f) => {
      blank[f.key] = "";
    });
    list.push(blank);
    updateAnswer(list);
  };

  const handleUpdateRepeaterField = (itemIdx, fieldKey, val) => {
    const list = Array.isArray(currentVal) ? [...currentVal] : [];
    if (!list[itemIdx]) list[itemIdx] = {};
    list[itemIdx][fieldKey] = val;
    updateAnswer(list);
  };

  const handleRemoveRepeaterItem = (itemIdx) => {
    const list = Array.isArray(currentVal) ? [...currentVal] : [];
    list.splice(itemIdx, 1);
    updateAnswer(list);
  };

  // Multiselect toggle handler
  const handleToggleMultiselect = (opt) => {
    const list = Array.isArray(currentVal) ? [...currentVal] : [];
    const idx = list.indexOf(opt);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(opt);
    }
    updateAnswer(list);
  };

  const handleAddCustomTag = () => {
    if (!newCustomTag.trim()) return;
    const list = Array.isArray(currentVal) ? [...currentVal] : [];
    if (!list.includes(newCustomTag.trim())) {
      list.push(newCustomTag.trim());
      updateAnswer(list);
    }
    setNewCustomTag("");
  };

  // Validation & Progression
  const handleNextQuestion = () => {
    if (currentQ?.required) {
      if (
        currentVal === undefined ||
        currentVal === null ||
        currentVal === "" ||
        (Array.isArray(currentVal) && currentVal.length === 0)
      ) {
        setValidationError("This question is required before proceeding.");
        return;
      }
    }

    if (!isLast) {
      setValidationError("");
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      onNext();
    }
  };

  const handlePrevQuestion = () => {
    setValidationError("");
    if (!isFirst) {
      setCurrentQuestionIdx((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  // File upload helper
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        onAddDocument({
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          content: typeof reader.result === "string" ? reader.result : "",
          type: file.type || "Document",
        });
      };
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        reader.readAsText(file);
      } else {
        // Mock text for PDFs/binary in browser preview
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Top Breadcrumb & Progress Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${ind.accentColor}20`,
                color: ind.accentColor,
              }}
            >
              {ind.name} Questionnaire
            </span>
            <span className="text-xs text-[#9898A6]">
              Question {currentQuestionIdx + 1} of {questions.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowEnrichmentPanel(!showEnrichmentPanel)}
            className="text-xs font-semibold text-[#55A9FF] hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Optional: Upload Brochures / PDFs ({uploadedDocuments?.length || 0})</span>
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-[#1A1A24] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] transition-all duration-300 rounded-full"
            style={{
              width: `${Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Optional Knowledge Enrichment Panel (PDFs, menus, docs) */}
      {showEnrichmentPanel && (
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#55A9FF]/30 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <FileText className="w-4 h-4 text-[#55A9FF]" />
              <span>Optional Document Enrichment</span>
            </div>
            <button
              type="button"
              onClick={() => setShowEnrichmentPanel(false)}
              className="text-[#9898A6] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#9898A6]">
            Have a PDF menu, brochure, clinic tariff sheet, or property price list? Upload it here to directly feed additional verified context into your assistant&apos;s knowledge base.
          </p>

          <label className="border-2 border-dashed border-white/20 hover:border-[#55A9FF] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-[#0B0B10]/50">
            <Upload className="w-5 h-5 text-[#55A9FF]" />
            <span className="text-xs font-bold text-white">Choose PDF, TXT or DOC files</span>
            <span className="text-[10px] text-[#9898A6]">Max 10MB per file</span>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {uploadedDocuments?.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono text-[#9898A6] uppercase tracking-wider block">
                Attached Documents ({uploadedDocuments.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {uploadedDocuments.map((doc, dIdx) => (
                  <div
                    key={doc.id || dIdx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#181824] border border-white/10 text-xs text-white"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#55A9FF] shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveDocument(doc.id)}
                      className="text-rose-400 hover:text-rose-300 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Single Question Focus Card */}
      {currentQ && (
        <div className="p-6 sm:p-10 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-2xl space-y-6 min-h-[360px] flex flex-col justify-between">
          <div className="space-y-5">
            {/* Question Heading */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9898A6]">
                  QUESTION {currentQuestionIdx + 1} OF {questions.length}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    currentQ.required
                      ? "bg-[#963DFF]/20 text-[#C28AFF] font-bold"
                      : "bg-white/5 text-[#9898A6]"
                  }`}
                >
                  {currentQ.required ? "Required Field *" : "Optional"}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentQ.label}
              </h3>
              {currentQ.subtitle && (
                <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed">
                  {currentQ.subtitle}
                </p>
              )}
            </div>

            {/* Validation Message */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Input Rendering by Type */}
            <div className="pt-2">
              {/* 1. TEXT INPUT */}
              {currentQ.type === "text" && (
                <input
                  type="text"
                  value={currentVal || ""}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={currentQ.placeholder || "Enter details..."}
                  className="w-full px-5 py-4 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] transition-all"
                />
              )}

              {/* 2. TEXTAREA */}
              {currentQ.type === "textarea" && (
                <textarea
                  rows={5}
                  value={currentVal || ""}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={currentQ.placeholder || "Provide clear details here..."}
                  className="w-full px-5 py-4 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] transition-all resize-none leading-relaxed"
                />
              )}

              {/* 3. SINGLE SELECT */}
              {currentQ.type === "select" && (
                <div className="space-y-2.5">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isOptSelected = currentVal === opt;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => updateAnswer(opt)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                          isOptSelected
                            ? "bg-[#181828] border-[#963DFF] text-white shadow-md ring-1 ring-[#963DFF]"
                            : "bg-[#0B0B10] border-white/10 text-[#9898A6] hover:bg-[#14141E] hover:text-white"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-semibold">{opt}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isOptSelected
                              ? "bg-[#963DFF] border-[#963DFF] text-white"
                              : "border-white/20"
                          }`}
                        >
                          {isOptSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. MULTISELECT */}
              {currentQ.type === "multiselect" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQ.options?.map((opt, oIdx) => {
                      const isChecked = Array.isArray(currentVal) && currentVal.includes(opt);
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleToggleMultiselect(opt)}
                          className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between text-xs sm:text-sm ${
                            isChecked
                              ? "bg-[#181828] border-[#963DFF] text-white shadow-sm ring-1 ring-[#963DFF]"
                              : "bg-[#0B0B10] border-white/10 text-[#9898A6] hover:bg-[#14141E] hover:text-white"
                          }`}
                        >
                          <span className="font-medium pr-2">{opt}</span>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-[#963DFF] border-[#963DFF] text-white"
                                : "border-white/20"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Tag / Option if allowed */}
                  {currentQ.allowCustom && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newCustomTag}
                        onChange={(e) => setNewCustomTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomTag())}
                        placeholder={currentQ.placeholder || "Add custom specialty or tag..."}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTag}
                        className="px-4 py-2.5 rounded-xl bg-[#963DFF] hover:bg-[#852FE0] text-white text-xs font-bold cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  )}

                  {/* Selected count */}
                  {Array.isArray(currentVal) && currentVal.length > 0 && (
                    <p className="text-[11px] text-[#C28AFF] font-mono">
                      ✓ {currentVal.length} selected
                    </p>
                  )}
                </div>
              )}

              {/* 5. REPEATER (Multiple entries e.g. doctors, rooms, properties, courses, products) */}
              {currentQ.type === "repeater" && (
                <div className="space-y-4">
                  {Array.isArray(currentVal) && currentVal.length > 0 ? (
                    <div className="space-y-3">
                      {currentVal.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="p-4 sm:p-5 rounded-2xl bg-[#0B0B10] border border-white/10 space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                            <span className="text-xs font-bold text-[#C28AFF] font-mono">
                              {currentQ.itemTitle || "Entry"} #{itemIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRepeaterItem(itemIdx)}
                              className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentQ.fields.map((field) => (
                              <div key={field.key} className="space-y-1">
                                <label className="text-[11px] text-[#9898A6] font-medium block">
                                  {field.label} {field.required && <span className="text-[#963DFF]">*</span>}
                                </label>
                                <input
                                  type={field.type || "text"}
                                  value={item[field.key] || ""}
                                  onChange={(e) => handleUpdateRepeaterField(itemIdx, field.key, e.target.value)}
                                  placeholder={field.placeholder || ""}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121A] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF]"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-[#0B0B10] border border-dashed border-white/10 text-center space-y-2">
                      <p className="text-xs text-[#9898A6]">
                        No {currentQ.itemTitle?.toLowerCase() || "entries"} added yet.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddRepeaterItem}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#963DFF]/20 text-[#C28AFF] hover:bg-[#963DFF]/30 text-xs font-bold cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First {currentQ.itemTitle || "Item"}</span>
                      </button>
                    </div>
                  )}

                  {Array.isArray(currentVal) && currentVal.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddRepeaterItem}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4 text-[#963DFF]" />
                      <span>Add Another {currentQ.itemTitle || "Item"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Inside Question Card */}
          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevQuestion}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-[#9898A6] hover:text-white bg-[#0B0B10] hover:bg-[#14141E] border border-white/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isFirst ? "Back to Details" : "Previous Question"}</span>
            </button>

            <div className="flex items-center gap-2">
              {!currentQ.required && !isLast && (
                <button
                  type="button"
                  onClick={() => {
                    setValidationError("");
                    setCurrentQuestionIdx((prev) => prev + 1);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9898A6] hover:text-white transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              )}

              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] to-[#55A9FF] hover:opacity-95 active:scale-[0.98] shadow-lg shadow-[#963DFF]/25 transition-all cursor-pointer"
              >
                <span>{isLast ? "Review Information →" : "Next Question"}</span>
                {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
