import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Sanitizes input text so it is 100% compatible with standard PDF fonts (WinAnsi encoding).
 * Converts symbols like ₹ (Indian Rupee), em-dashes, curly quotes, and bullets into standard WinAnsi chars.
 */
export function sanitizeForPdf(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/₹/g, "Rs. ")
    .replace(/[\u20B9]/g, "Rs. ")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/©/g, "(c)")
    .replace(/®/g, "(R)")
    .replace(/™/g, "(TM)")
    .replace(/[^\x00-\x7F]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code >= 160 && code <= 255) return char;
      return " ";
    });
}

/**
 * Compiles company profile form data into a well-structured plain text document
 * suitable for vector chunking and LLM RAG ingestion.
 */
export function formatCompanyProfileText(data) {
  const {
    companyName = "Company",
    tagline = "",
    industry = "",
    founders = "",
    description = "",
    workingDays = "",
    openingTime = "",
    closingTime = "",
    timezone = "",
    weekendPolicy = "",
    holidayNote = "",
    services = [],
    startingPrice = "",
    pricingTiers = "",
    paymentTerms = "",
    freeConsultation = "",
    officeAddress = "",
    serviceAreas = "",
    phone = "",
    whatsapp = "",
    email = "",
    website = "",
    faqs = [],
  } = data;

  let text = `================================================================================
COMPANY BUSINESS PROFILE & KNOWLEDGE BASE: ${companyName.toUpperCase()}
Generated on: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
================================================================================

1. COMPANY IDENTITY & MISSION
• Company Name: ${companyName}
${tagline ? `• Tagline / Motto: ${tagline}\n` : ""}${industry ? `• Industry / Sector: ${industry}\n` : ""}${founders ? `• Leadership / Founders: ${founders}\n` : ""}• Overview:
${description || "A premier provider of dedicated products and services."}

2. BUSINESS HOURS & AVAILABILITY
• Working Days: ${workingDays || "Monday to Saturday"}
• Opening Time: ${openingTime || "09:00 AM"}
• Closing Time: ${closingTime || "06:00 PM"}
${timezone ? `• Timezone: ${timezone}\n` : ""}• Weekend Policy: ${weekendPolicy || "Closed on Sundays. Online support active."}
${holidayNote ? `• Holidays Policy: ${holidayNote}\n` : ""}
3. PRODUCTS & SERVICES OFFERED
`;

  if (Array.isArray(services) && services.length > 0) {
    services.forEach((s, idx) => {
      text += `• Service ${idx + 1}: ${s.name || "Service"}\n`;
      if (s.description) text += `  Details: ${s.description}\n`;
      if (s.timeline) text += `  Delivery Timeline: ${s.timeline}\n`;
      if (s.pricing) text += `  Pricing / Rates: ${s.pricing}\n`;
      text += `\n`;
    });
  } else {
    text += `Standard enterprise solutions and customer services.\n\n`;
  }

  text += `4. PRICING & PAYMENT POLICIES
${startingPrice ? `• Starting Price: ${startingPrice}\n` : ""}${pricingTiers ? `• Budget Tiers: ${pricingTiers}\n` : ""}${paymentTerms ? `• Payment Terms: ${paymentTerms}\n` : ""}${freeConsultation ? `• Free Discovery / Consultation: ${freeConsultation}\n` : ""}
5. OFFICE LOCATION & CONTACT CHANNELS
${officeAddress ? `• Head Office Address: ${officeAddress}\n` : ""}${serviceAreas ? `• Service Regions: ${serviceAreas}\n` : ""}${phone ? `• Primary Phone: ${phone}\n` : ""}${whatsapp ? `• WhatsApp Support: ${whatsapp}\n` : ""}${email ? `• Official Email: ${email}\n` : ""}${website ? `• Official Website: ${website}\n` : ""}
6. FREQUENTLY ASKED QUESTIONS (FAQS)
`;

  if (Array.isArray(faqs) && faqs.length > 0) {
    faqs.forEach((faq, idx) => {
      text += `Q${idx + 1}: ${faq.question || "Frequently Asked Question"}\n`;
      text += `A${idx + 1}: ${faq.answer || "Answer provided by business."}\n\n`;
    });
  } else {
    text += `Please reach out via our contact channels for specific inquiries.\n`;
  }

  text += `================================================================================
END OF DOCUMENT — VERIFIED CORPORATE KNOWLEDGE BASE
================================================================================`;

  return text;
}

/**
 * Builds a formatted, multi-page PDF document using pdf-lib.
 * Returns Uint8Array of PDF bytes.
 */
export async function generateCompanyProfilePdfBytes(data) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const safeData = {
    companyName: sanitizeForPdf(data.companyName || "Company Profile"),
    tagline: sanitizeForPdf(data.tagline || ""),
    industry: sanitizeForPdf(data.industry || ""),
    founders: sanitizeForPdf(data.founders || ""),
    description: sanitizeForPdf(data.description || ""),
    workingDays: sanitizeForPdf(data.workingDays || ""),
    openingTime: sanitizeForPdf(data.openingTime || ""),
    closingTime: sanitizeForPdf(data.closingTime || ""),
    timezone: sanitizeForPdf(data.timezone || ""),
    weekendPolicy: sanitizeForPdf(data.weekendPolicy || ""),
    holidayNote: sanitizeForPdf(data.holidayNote || ""),
    startingPrice: sanitizeForPdf(data.startingPrice || ""),
    pricingTiers: sanitizeForPdf(data.pricingTiers || ""),
    paymentTerms: sanitizeForPdf(data.paymentTerms || ""),
    freeConsultation: sanitizeForPdf(data.freeConsultation || ""),
    officeAddress: sanitizeForPdf(data.officeAddress || ""),
    serviceAreas: sanitizeForPdf(data.serviceAreas || ""),
    phone: sanitizeForPdf(data.phone || ""),
    whatsapp: sanitizeForPdf(data.whatsapp || ""),
    email: sanitizeForPdf(data.email || ""),
    website: sanitizeForPdf(data.website || ""),
    services: (data.services || []).map((s) => ({
      name: sanitizeForPdf(s.name),
      description: sanitizeForPdf(s.description),
      timeline: sanitizeForPdf(s.timeline),
      pricing: sanitizeForPdf(s.pricing),
    })),
    faqs: (data.faqs || []).map((f) => ({
      question: sanitizeForPdf(f.question),
      answer: sanitizeForPdf(f.answer),
    })),
  };

  const primaryColor = rgb(0.12, 0.22, 0.45); // Deep Indigo
  const textColor = rgb(0.15, 0.2, 0.25);
  const mutedColor = rgb(0.45, 0.5, 0.55);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const checkPageBreak = (neededHeight) => {
    if (y - neededHeight < margin + 30) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      return true;
    }
    return false;
  };

  // Header Banner
  currentPage.drawRectangle({
    x: margin,
    y: y - 50,
    width: contentWidth,
    height: 50,
    color: primaryColor,
  });

  currentPage.drawText(safeData.companyName.slice(0, 45), {
    x: margin + 16,
    y: y - 28,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const subtitle = safeData.tagline || "Official Company Business Profile & Knowledge Document";
  currentPage.drawText(subtitle.slice(0, 70), {
    x: margin + 16,
    y: y - 42,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  y -= 70;

  // Metadata ribbon
  const metaDate = `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  currentPage.drawText(metaDate, {
    x: margin,
    y: y,
    size: 8,
    font: fontOblique,
    color: mutedColor,
  });

  y -= 18;

  // Helper to draw section header
  const drawSectionHeader = (title) => {
    const cleanTitle = sanitizeForPdf(title);
    checkPageBreak(35);
    currentPage.drawRectangle({
      x: margin,
      y: y - 18,
      width: contentWidth,
      height: 20,
      color: rgb(0.94, 0.96, 0.99),
    });
    currentPage.drawText(cleanTitle, {
      x: margin + 8,
      y: y - 14,
      size: 11,
      font: fontBold,
      color: primaryColor,
    });
    y -= 30;
  };

  // Helper to draw text block with automatic line wrapping
  const drawWrappedText = (text, fontSize = 9, isBold = false, indent = 0) => {
    if (!text) return;
    const cleanText = sanitizeForPdf(text);
    const font = isBold ? fontBold : fontRegular;
    const lines = cleanText.split("\n");

    for (const rawLine of lines) {
      const words = rawLine.split(" ");
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > contentWidth - indent) {
          checkPageBreak(fontSize + 5);
          currentPage.drawText(currentLine, {
            x: margin + indent,
            y: y,
            size: fontSize,
            font,
            color: textColor,
          });
          y -= fontSize + 4;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        checkPageBreak(fontSize + 5);
        currentPage.drawText(currentLine, {
          x: margin + indent,
          y: y,
          size: fontSize,
          font,
          color: textColor,
        });
        y -= fontSize + 4;
      }
    }
  };

  // 1. Company Identity
  drawSectionHeader("1. COMPANY IDENTITY & MISSION");
  drawWrappedText(`Company: ${safeData.companyName || "N/A"}`, 9, true);
  if (safeData.industry) drawWrappedText(`Industry: ${safeData.industry}`, 9);
  if (safeData.founders) drawWrappedText(`Founders / Leadership: ${safeData.founders}`, 9);
  if (safeData.description) {
    y -= 4;
    drawWrappedText(`Overview:`, 9, true);
    drawWrappedText(safeData.description, 9, false, 8);
  }
  y -= 12;

  // 2. Business Hours
  drawSectionHeader("2. BUSINESS HOURS & SCHEDULE");
  drawWrappedText(`- Operating Days: ${safeData.workingDays || "Monday to Saturday"}`, 9);
  drawWrappedText(`- Working Hours: ${safeData.openingTime || "09:00 AM"} - ${safeData.closingTime || "06:00 PM"} (${safeData.timezone || "IST"})`, 9);
  drawWrappedText(`- Weekend Policy: ${safeData.weekendPolicy || "Closed on Sundays. Online support active."}`, 9);
  if (safeData.holidayNote) drawWrappedText(`- Holiday Schedule: ${safeData.holidayNote}`, 9);
  y -= 12;

  // 3. Services & Products
  drawSectionHeader("3. PRODUCTS & SERVICES");
  if (Array.isArray(safeData.services) && safeData.services.length > 0) {
    safeData.services.forEach((s, idx) => {
      checkPageBreak(25);
      drawWrappedText(`${idx + 1}. ${s.name || "Service Item"}`, 9, true);
      if (s.description) drawWrappedText(s.description, 8.5, false, 12);
      if (s.timeline || s.pricing) {
        const extra = [s.timeline ? `Timeline: ${s.timeline}` : "", s.pricing ? `Rates: ${s.pricing}` : ""].filter(Boolean).join(" | ");
        drawWrappedText(extra, 8, false, 12);
      }
      y -= 4;
    });
  } else {
    drawWrappedText("Contact business directly for custom offerings.", 9);
  }
  y -= 12;

  // 4. Pricing & Policies
  drawSectionHeader("4. PRICING & PAYMENT POLICIES");
  if (safeData.startingPrice) drawWrappedText(`- Starting Price: ${safeData.startingPrice}`, 9);
  if (safeData.pricingTiers) drawWrappedText(`- Budget Tiers: ${safeData.pricingTiers}`, 9);
  if (safeData.paymentTerms) drawWrappedText(`- Payment Terms: ${safeData.paymentTerms}`, 9);
  if (safeData.freeConsultation) drawWrappedText(`- Discovery Consultation: ${safeData.freeConsultation}`, 9);
  y -= 12;

  // 5. Office Location & Contact
  drawSectionHeader("5. OFFICE LOCATION & CONTACT DETAILS");
  if (safeData.officeAddress) drawWrappedText(`- Head Office: ${safeData.officeAddress}`, 9);
  if (safeData.serviceAreas) drawWrappedText(`- Service Regions: ${safeData.serviceAreas}`, 9);
  if (safeData.phone) drawWrappedText(`- Phone: ${safeData.phone}`, 9);
  if (safeData.whatsapp) drawWrappedText(`- WhatsApp: ${safeData.whatsapp}`, 9);
  if (safeData.email) drawWrappedText(`- Email: ${safeData.email}`, 9);
  if (safeData.website) drawWrappedText(`- Website: ${safeData.website}`, 9);
  y -= 12;

  // 6. Frequently Asked Questions
  if (Array.isArray(safeData.faqs) && safeData.faqs.length > 0) {
    drawSectionHeader("6. FREQUENTLY ASKED QUESTIONS");
    safeData.faqs.forEach((faq, idx) => {
      checkPageBreak(30);
      drawWrappedText(`Q${idx + 1}: ${faq.question}`, 9, true);
      drawWrappedText(`A${idx + 1}: ${faq.answer}`, 8.5, false, 8);
      y -= 6;
    });
  }

  // Footer on each page
  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(`Page ${idx + 1} of ${pages.length}  |  Official Knowledge Base for ${safeData.companyName || "AI Chatbot"}`, {
      x: margin,
      y: margin - 15,
      size: 7.5,
      font: fontRegular,
      color: mutedColor,
    });
  });

  return await pdfDoc.save();
}
