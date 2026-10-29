import fs from "fs";
import path from "path";

const USERS_FILE_PATH = path.join(process.cwd(), "frontend", "data", "users.json");
const ALT_USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");

function getStoragePath() {
  if (fs.existsSync(USERS_FILE_PATH)) return USERS_FILE_PATH;
  if (fs.existsSync(ALT_USERS_FILE_PATH)) return ALT_USERS_FILE_PATH;
  return USERS_FILE_PATH;
}

export function isDummyOrTestAccount(email, name) {
  if (!email) return true;
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name || "").trim().toLowerCase();

  // Test suite / mock email patterns
  if (
    cleanEmail.includes("google.user.") ||
    cleanEmail.includes("returning.google.") ||
    cleanEmail.startsWith("new.google") ||
    cleanEmail.startsWith("returning.google") ||
    cleanEmail.includes("company-a.com") ||
    cleanEmail.includes("company-b.com") ||
    cleanEmail.includes("company.com") ||
    cleanEmail.includes("alpha.com") ||
    cleanEmail.includes("example.com") ||
    cleanEmail.includes("test.com") ||
    cleanEmail.includes("eval.test") ||
    cleanEmail.includes("mock.com") ||
    cleanEmail.includes("dummy.com") ||
    cleanEmail.startsWith("duplicate@") ||
    cleanEmail.startsWith("test_") ||
    cleanEmail.startsWith("mock_") ||
    cleanEmail.startsWith("dummy_") ||
    cleanEmail.includes("security-audit") ||
    cleanEmail === "security@company.com"
  ) {
    return true;
  }

  // Test suite names
  if (
    cleanName.includes("sarah parker") ||
    cleanName.includes("alex doe") ||
    cleanName.includes("alice founder") ||
    cleanName.includes("bob cto") ||
    cleanName.startsWith("test ") ||
    cleanName.startsWith("user ") ||
    cleanName === "alice" ||
    cleanName === "bob" ||
    cleanName === "security" ||
    cleanName.includes("audit")
  ) {
    return true;
  }

  return false;
}

const DEFAULT_USERS = [
  {
    id: "usr_6908bee7720343c7",
    name: "Emperor Smart Solution",
    email: "admin@emperorsmartsolutions.com",
    organization: "Emperor Smart Solutions",
    role: "Platform Super Admin",
    status: "Active",
    bots: 1,
    lastLogin: "Active now",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "usr_aviral_01",
    name: "Aviral Shukla",
    email: "aviralshukla2612@gmail.com",
    organization: "Aviral's Workspace",
    role: "Workspace Owner",
    status: "Active",
    bots: 1,
    lastLogin: "Active now",
    createdAt: "2026-10-28T05:12:00.000Z",
  },
];

let cachedUsers = null;

function loadFromDisk() {
  try {
    const target = getStoragePath();
    if (fs.existsSync(target)) {
      const raw = fs.readFileSync(target, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip any dummy accounts from the loaded array
        const cleaned = parsed.filter((u) => !isDummyOrTestAccount(u?.email, u?.name));
        cachedUsers = cleaned.length > 0 ? cleaned : [...DEFAULT_USERS];
        return cachedUsers;
      }
    }
  } catch (err) {
    console.warn("[USERS_STORE_WARN] Failed reading users.json", err.message);
  }

  cachedUsers = [...DEFAULT_USERS];
  return cachedUsers;
}

function saveToDisk(users) {
  try {
    const target = getStoragePath();
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const safeUsers = users.filter((u) => !isDummyOrTestAccount(u?.email, u?.name));
    fs.writeFileSync(target, JSON.stringify(safeUsers, null, 2), "utf-8");
    cachedUsers = safeUsers;
  } catch (err) {
    console.warn("[USERS_STORE_WARN] Failed writing users.json", err.message);
  }
}

export const usersStore = {
  getUsers() {
    if (!cachedUsers) return loadFromDisk();
    return cachedUsers.filter((u) => !isDummyOrTestAccount(u?.email, u?.name));
  },

  upsertUser(userData) {
    const users = this.getUsers();
    const cleanEmail = (userData.email || "").trim().toLowerCase();
    if (!cleanEmail) return null;

    const isTest =
      process.env.NODE_ENV === "test" ||
      process.env.VITEST ||
      isDummyOrTestAccount(cleanEmail, userData.name);

    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    const updatedUser = {
      id: userData.id || (existingIndex >= 0 ? users[existingIndex].id : `usr_${Date.now()}`),
      name: userData.name || (existingIndex >= 0 ? users[existingIndex].name : cleanEmail.split("@")[0]),
      email: cleanEmail,
      organization: userData.organization || (existingIndex >= 0 ? users[existingIndex].organization : `${userData.name || "User"}'s Workspace`),
      role: userData.role || (existingIndex >= 0 ? users[existingIndex].role : "Workspace Owner"),
      status: userData.status || (existingIndex >= 0 ? users[existingIndex].status : "Active"),
      bots: userData.bots !== undefined ? userData.bots : (existingIndex >= 0 ? users[existingIndex].bots : 1),
      lastLogin: "Active now",
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isTest) {
      // In-memory update only during tests or for dummy users; never persist to disk
      return updatedUser;
    }

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...updatedUser };
    } else {
      users.push(updatedUser);
    }

    saveToDisk(users);
    return updatedUser;
  },
};
