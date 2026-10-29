import fs from "fs";
import path from "path";

const TICKETS_FILE_PATH = path.join(process.cwd(), "frontend", "data", "tickets.json");
const ALT_TICKETS_FILE_PATH = path.join(process.cwd(), "data", "tickets.json");

function getStoragePath() {
  if (fs.existsSync(TICKETS_FILE_PATH)) return TICKETS_FILE_PATH;
  if (fs.existsSync(ALT_TICKETS_FILE_PATH)) return ALT_TICKETS_FILE_PATH;
  return TICKETS_FILE_PATH;
}

let cachedTickets = null;

function loadFromDisk() {
  try {
    const target = getStoragePath();
    if (fs.existsSync(target)) {
      const raw = fs.readFileSync(target, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedTickets = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[TICKETS_STORE_WARN] Failed reading tickets.json", err.message);
  }

  // Seed baseline
  cachedTickets = [
    {
      id: "TK-108249",
      organizationId: "org_ess_default",
      userName: "Aviral Shukla",
      userEmail: "aviralshukla2612@gmail.com",
      subject: "Inquiry regarding WhatsApp Cloud API Setup",
      category: "WhatsApp Cloud API",
      priority: "Normal",
      message: "Hello team, I would like guidance on connecting our Meta Phone Number ID and Webhook verify token.",
      status: "OPEN",
      adminNotes: "",
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "TK-104921",
      organizationId: "org_ess_01",
      userName: "Srajan",
      userEmail: "srajan@example.com",
      subject: "Assistance with 7-Day Free Trial Autopay verification",
      category: "Billing & Autopay",
      priority: "High",
      message: "We activated the Razorpay 7-day trial and want to confirm our scheduled debit date for Day 8.",
      status: "RESOLVED",
      adminNotes: "Customer verified on live Razorpay dashboard. Autopay active.",
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
  ];

  saveToDisk(cachedTickets);
  return cachedTickets;
}

function saveToDisk(tickets) {
  try {
    cachedTickets = tickets;
    const target = getStoragePath();
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, JSON.stringify(tickets, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[TICKETS_SAVE_ERR] Failed writing tickets to disk", err);
    return false;
  }
}

export const ticketsStore = {
  getTickets() {
    if (!cachedTickets) loadFromDisk();
    return [...cachedTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getTicketById(id) {
    const all = this.getTickets();
    return all.find((t) => t.id === id) || null;
  },

  createTicket({
    organizationId,
    userEmail,
    userName = "Customer",
    subject,
    category = "Technical Issue",
    priority = "Normal",
    message,
  }) {
    const all = this.getTickets();
    const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const newTicket = {
      id: ticketId,
      organizationId: organizationId || "org_unknown",
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      subject: subject.trim(),
      category: category.trim(),
      priority: priority.trim(),
      message: message.trim(),
      status: "OPEN",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
    };

    all.unshift(newTicket);
    saveToDisk(all);
    return newTicket;
  },

  updateTicket(id, updates = {}) {
    const all = this.getTickets();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new Error(`Ticket #${id} not found.`);
    }

    all[idx] = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveToDisk(all);
    return all[idx];
  },

  deleteTicket(id) {
    const all = this.getTickets();
    const filtered = all.filter((t) => t.id !== id);
    if (filtered.length === all.length) {
      throw new Error(`Ticket #${id} not found.`);
    }
    saveToDisk(filtered);
    return true;
  },
};
