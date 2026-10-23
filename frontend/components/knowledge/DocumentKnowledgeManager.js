"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  BookOpen,
  Eye,
  Check,
  FileCode,
  FileType,
} from "lucide-react";
import { knowledgeApi } from "@/lib/api/knowledge";

export default function DocumentKnowledgeManager({ botId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Modal State (for both Write and Edit)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null); // null if new, docId if editing
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docType, setDocType] = useState("Custom Note");
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Upload Modal State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState(null);

  // Load documents
  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await knowledgeApi.getDocuments(botId);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (botId) {
      loadDocs();
    }
  }, [botId]);

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Open Editor for New Document
  const handleOpenNew = () => {
    setEditingDocId(null);
    setDocTitle("");
    setDocContent("");
    setDocType("Custom Note");
    setEditorError("");
    setEditorOpen(true);
  };

  // Open Editor to Edit Existing Document
  const handleOpenEdit = (doc) => {
    setEditingDocId(doc.id);
    setDocTitle(doc.name || "");
    setDocContent(doc.content || "");
    setDocType(doc.type || "Custom Note");
    setEditorError("");
    setEditorOpen(true);
  };

  // Insert Templates
  const handleInsertTemplate = (type) => {
    if (type === "faq") {
      setDocTitle((prev) => prev || "Frequently Asked Questions (FAQ)");
      setDocType("FAQ");
      setDocContent(
        (prev) =>
          prev +
          (prev ? "\n\n" : "") +
          `Q: What are your primary products or services?\nA: We specialize in [Describe core products/services with quality highlights].\n\nQ: What is your pricing and payment policy?\nA: Pricing starts from [Specify pricing, plans, or quotes]. We accept credit cards, bank transfers, and digital payments.\n\nQ: What is your return or warranty policy?\nA: All our products come with a 30-day money-back guarantee and a 1-year official warranty.\n\nQ: How can customers contact support?\nA: You can reach our dedicated support team via WhatsApp or email during standard business hours.`
      );
    } else if (type === "product") {
      setDocTitle((prev) => prev || "Product Specifications & Catalog");
      setDocType("Product Details");
      setDocContent(
        (prev) =>
          prev +
          (prev ? "\n\n" : "") +
          `# Product Line Overview\n\nProduct Name: [Product Name]\nCategory: [Category]\nKey Features:\n- Premium build quality with surgical-grade materials.\n- Water-resistant up to 50 meters.\n- 48-hour power reserve.\nPrice: $299 (Includes free worldwide shipping)\nAvailability: In Stock\n\nCare Instructions: Clean with a soft microfiber cloth; avoid prolonged exposure to direct chemical solvents.`
      );
    } else if (type === "policy") {
      setDocTitle((prev) => prev || "Shipping & Refund Policies");
      setDocType("Policy");
      setDocContent(
        (prev) =>
          prev +
          (prev ? "\n\n" : "") +
          `# Shipping & Delivery Guidelines\n- Standard Shipping: 3-5 business days across the country.\n- Express Delivery: 24-48 hours available at checkout.\n- Tracking numbers are dispatched automatically via email upon order confirmation.\n\n# Refund and Replacement Policy\n- Items can be returned within 14 days of delivery in their original, undamaged packaging.\n- Refunds are credited to the original payment method within 5 business days of inspection.`
      );
    }
  };

  // Save Document (Create or Update)
  const handleSaveDoc = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setEditorError("Please enter a document title.");
      return;
    }
    if (!docContent.trim()) {
      setEditorError("Document content cannot be empty. Please type or paste your business information.");
      return;
    }

    setSaving(true);
    setEditorError("");

    try {
      if (editingDocId) {
        // Update existing
        await knowledgeApi.updateDocument(botId, editingDocId, {
          name: docTitle.trim(),
          content: docContent.trim(),
          type: docType,
        });
        setSuccessToast(`Document "${docTitle}" successfully updated and re-indexed!`);
      } else {
        // Create new
        await knowledgeApi.addDocument(botId, {
          name: docTitle.trim(),
          content: docContent.trim(),
          type: docType,
        });
        setSuccessToast(`Document "${docTitle}" created and vectorized!`);
      }
      setEditorOpen(false);
      await loadDocs();
    } catch (err) {
      setEditorError(err.message || "Failed to save document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle File Selection for Upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ""));
    setUploadError("");

    // If it's a text-readable file, read text for preview
    if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json") || file.name.endsWith(".csv")) {
      try {
        const text = await file.text();
        setUploadContent(text);
      } catch (err) {
        console.warn("Could not preview text file:", err);
      }
    } else {
      setUploadContent("");
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      if (uploadContent && uploadContent.trim()) {
        // If we have extracted or edited text content, post as clean JSON document
        await knowledgeApi.addDocument(botId, {
          name: uploadName || uploadFile.name,
          content: uploadContent.trim(),
          type: uploadFile.name.split(".").pop()?.toUpperCase() || "PDF",
        });
      } else {
        // Post as FormData
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("name", uploadName || uploadFile.name);
        await knowledgeApi.addDocument(botId, formData);
      }

      setSuccessToast(`File "${uploadFile.name}" successfully uploaded and vectorized!`);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadContent("");
      await loadDocs();
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDelete = async (docId, docName) => {
    if (confirm(`Are you sure you want to delete "${docName}"? It will be removed from this bot's knowledge.`)) {
      try {
        await knowledgeApi.deleteDocument(botId, docId);
        setSuccessToast(`Document "${docName}" deleted.`);
        await loadDocs();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Word and Chunk Estimation
  const charCount = docContent.length;
  const wordCount = docContent.trim() ? docContent.trim().split(/\s+/).length : 0;
  const estimatedChunks = Math.max(1, Math.ceil(charCount / 400));

  // Filtered documents
  const filteredDocs = documents.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.content || "").toLowerCase().includes(q) ||
      (d.type || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Vectorized Documents & Written Notes
            </h3>
            <span className="text-xs px-2 py-0.5 font-bold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {documents.length}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Write custom business notes, FAQs, or upload documents directly to train this specific bot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadDocs}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            title="Refresh documents list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Write Custom Document Button */}
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>+ Write Document / Note ✍️</span>
          </button>

          {/* Upload Document Button */}
          <button
            type="button"
            onClick={() => {
              setUploadFile(null);
              setUploadName("");
              setUploadContent("");
              setUploadError("");
              setUploadOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Upload Document 📄</span>
          </button>
        </div>
      </div>

      {/* Search Bar (if documents exist) */}
      {documents.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name, content, or type..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      )}

      {/* Zero State */}
      {documents.length === 0 && !loading && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl">
            📚
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              No documents added yet for this bot
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Give your chatbot precise knowledge by typing custom notes, company details, pricing, FAQs, or uploading your existing PDFs and files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            {/* Card 1: Write Custom Document */}
            <div
              onClick={handleOpenNew}
              className="p-5 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-500 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="p-2 rounded-xl bg-indigo-600 text-white group-hover:scale-105 transition-transform">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h5 className="font-bold text-xs text-neutral-900 dark:text-white">
                  Type & Write Custom Knowledge
                </h5>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                Write or paste product catalogs, warranty details, pricing, return rules, or FAQs anytime directly in our built-in editor.
              </p>
              <button
                type="button"
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                Write Custom Note ✍️
              </button>
            </div>

            {/* Card 2: Upload Document File */}
            <div
              onClick={() => {
                setUploadFile(null);
                setUploadName("");
                setUploadContent("");
                setUploadError("");
                setUploadOpen(true);
              }}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="p-2 rounded-xl bg-neutral-900 dark:bg-neutral-700 text-white group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </span>
                <h5 className="font-bold text-xs text-neutral-900 dark:text-white">
                  Upload Document File
                </h5>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                Upload existing PDF, TXT, Markdown, CSV, or DOC files. The system automatically chunks and indexes them with vector embeddings.
              </p>
              <button
                type="button"
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white shadow-xs transition-colors"
              >
                Upload File 📄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {filteredDocs.length > 0 && (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-200 dark:hover:border-indigo-900/60 shadow-xs transition-all gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-bold text-xs">
                  {doc.type === "PDF" ? "PDF" : doc.type === "FAQ" ? "FAQ" : "DOC"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                      {doc.name}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {doc.type || "Document"}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Vectorized & Ready
                    </span>
                  </div>

                  {doc.content && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                      {doc.content.slice(0, 140)}...
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1.5">
                    <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                      <Layers className="w-3 h-3" />
                      {doc.chunksCount ?? doc.chunks?.length ?? 0} chunks indexed
                    </span>
                    {doc.createdAt && (
                      <span>
                        Added: {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {/* View Content */}
                <button
                  type="button"
                  onClick={() => setViewingDoc(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="View full text content and chunks"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                  title="Edit document content and re-vectorize"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit & Write</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.name)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. WRITE / EDIT DOCUMENT MODAL                                    */}
      {/* ================================================================= */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {editingDocId ? `Edit Document: ${docTitle || "Untitled"}` : "Write Custom Knowledge Document"}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Type or edit information directly. The bot will use this exact verified text in RAG responses.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDoc} className="p-6 overflow-y-auto space-y-4 flex-1">
              {editorError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editorError}</span>
                </div>
              )}

              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Document Title / Topic <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Fylex Watches - Pricing, Models & Warranty"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Category Tag
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Custom Note">Custom Note</option>
                    <option value="Product Details">Product Details</option>
                    <option value="FAQ">FAQ Q&A</option>
                    <option value="Policy">Policy / Return</option>
                    <option value="Pricing">Pricing & Plans</option>
                    <option value="Company Overview">Company Overview</option>
                  </select>
                </div>
              </div>

              {/* Quick Template Starters */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                <span className="text-neutral-400 font-medium">Quick Starters:</span>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("faq")}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  💡 Insert FAQ Template
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("product")}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  💡 Insert Product Catalog
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("policy")}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  💡 Insert Shipping & Return Policy
                </button>
              </div>

              {/* The Main Writing Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Document Content & Knowledge <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                    <span>{charCount} characters</span>
                    <span>{wordCount} words</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      ~{estimatedChunks} chunks
                    </span>
                  </div>
                </div>

                <textarea
                  required
                  rows={14}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Type or paste everything you want this chatbot to know about this topic...&#10;&#10;Examples:&#10;- Product prices, specs, materials, and sizes.&#10;- Company history, phone number, and store hours.&#10;- Answers to common questions customers ask.&#10;- Return windows, shipping timelines, and contact email."
                  className="w-full p-4 text-xs font-mono rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-y"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Vectorizing & Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingDocId ? "Update & Re-Index Knowledge" : "Save & Vectorize Knowledge 🚀"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. UPLOAD DOCUMENT MODAL                                          */}
      {/* ================================================================= */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800">
                  <Upload className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Upload Knowledge Document
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Upload PDF, TXT, Markdown, CSV, or DOC files for vectorization.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-neutral-50/50 dark:bg-neutral-800/20">
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.json,.csv,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-xl">
                    📄
                  </div>
                  {uploadFile ? (
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">
                        {uploadFile.name}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {(uploadFile.size / 1024).toFixed(1)} KB — Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                        Click to select or drag and drop a file
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Supports PDF, TXT, MD, CSV, JSON (up to 15MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              {uploadFile && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="e.g. Product Catalog"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {/* Text Preview (if text readable) */}
              {uploadContent && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Extracted Text Preview (You can edit before indexing):
                    </span>
                    <span className="text-neutral-400">{uploadContent.length} chars</span>
                  </div>
                  <textarea
                    rows={6}
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    className="w-full p-3 text-xs font-mono rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading & Vectorizing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Vectorize</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. DOCUMENT CONTENT VIEWER DRAWER                                 */}
      {/* ================================================================= */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {viewingDoc.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {viewingDoc.type || "Document"} • {viewingDoc.chunksCount ?? viewingDoc.chunks?.length ?? 0} chunks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/80 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {viewingDoc.content || "No raw text recorded."}
              </div>

              {Array.isArray(viewingDoc.chunks) && viewingDoc.chunks.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    Indexed Vector Chunks ({viewingDoc.chunks.length}):
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {viewingDoc.chunks.map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 font-mono"
                      >
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                          Chunk #{idx + 1}:
                        </span>
                        {ch}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
              <button
                type="button"
                onClick={() => {
                  const docToEdit = viewingDoc;
                  setViewingDoc(null);
                  handleOpenEdit(docToEdit);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit This Document</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
