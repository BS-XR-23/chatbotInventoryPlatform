// generate-full-frontend.js
const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "chatbot-frontend");

const folders = [
  "components",
  "components/layout",
  "components/tables",
  "components/chat",
  "pages",
  "pages/admin",
  "pages/vendor",
  "pages/user",
  "styles",
  "lib",
];

const files = [
  // ---------------------
  // lib files
  // ---------------------
  {
    path: "lib/auth.ts",
    content: `export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  vendor_domain?: string;
}
export const AUTH_STORAGE_KEYS = { TOKEN: "token", USER: "user" } as const;
export function saveAuthData(token: string, role: string, email: string, vendor_domain?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
  const user: User = { id: "", email, role, vendor_domain };
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
}
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
}
export function getAuthUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
  if (!userStr) return null;
  try { return JSON.parse(userStr); } catch { return null; }
}
export function clearAuthData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
}
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}`
  },
  {
    path: "lib/api.ts",
    content: `const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9000";
import { getAuthToken } from "./auth";
const getAuthHeaders = (isJson = true) => {
  const token = getAuthToken();
  return { ...(isJson && { "Content-Type": "application/json" }), ...(token && { Authorization: \`Bearer \${token}\` }) };
};
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || \`HTTP \${response.status}\`);
  }
  return response.json();
};
const fetchAPI = async (endpoint, options = {}) => {
  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    ...options,
    headers: { ...getAuthHeaders((options.headers)?.["Content-Type"] === "application/json"), ...(options.headers || {}) },
  });
  return handleResponse(response);
};
export const api = {
  // Admin
  getAdmin: (adminId) => fetchAPI(\`/admins/me/\${adminId}\`),
  updateAdmin: (adminId, data) => fetchAPI(\`/admins/edit/\${adminId}\`, { method: "PUT", body: JSON.stringify(data) }),
  changeAdminPassword: (data) => fetchAPI("/admins/change-password", { method: "PUT", body: JSON.stringify(data) }),
  updateVendorStatus: (vendorId, data) => fetchAPI(\`/admins/update-vendors/\${vendorId}\`, { method: "PUT", body: JSON.stringify(data) }),
  getAdminDocuments: () => fetchAPI("/admins/documents"),
  duplicateChatbot: (chatbotId) => fetchAPI(\`/admins/chatbots/duplicate/\${chatbotId}\`, { method: "POST" }),
  getMostUsersByVendors: () => fetchAPI("/admins/most-users-by-vendors"),
  getMostChatbotsByVendors: () => fetchAPI("/admins/most-chatbots-by-vendors"),
  getMostUsedChatbot: () => fetchAPI("/admins/most-used-chatbot"),
  getTotalTokensByVendor: (vendorId) => fetchAPI(\`/admins/total-tokens/\${vendorId}\`),
  // Vendor
  getVendorChatbots: () => fetchAPI("/chatbots/"),
  getVendorTopChatbotsByMessages: () => fetchAPI("/vendors/top-chatbots/messages"),
  getVendorTopChatbotsByUsers: () => fetchAPI("/vendors/top-chatbots/users"),
  getVendorDailyMessages: () => fetchAPI("/vendors/daily/messages"),
  getVendorDailyUniqueUsers: () => fetchAPI("/vendors/daily/unique-users"),
  // User
  getUser: (userId) => fetchAPI(\`/users/\${userId}\`),
  // Chatbot
  createChatbot: (data) => fetchAPI("/chatbots/", { method: "POST", body: JSON.stringify(data) }),
  getAllChatbots: () => fetchAPI("/chatbots/"),
  askChatbot: (chatbotId, question) => fetchAPI(\`/chatbots/\${chatbotId}/ask\`, { method: "POST", body: JSON.stringify({ question }) }),
  chatWithChatbot: (chatbotId, data) => fetchAPI(\`/chatbots/\${chatbotId}/chat\`, { method: "POST", body: JSON.stringify(data) }),
  // Documents
  previewDocument: (formData) => fetch(\`\${API_BASE_URL}/documents/preview\`, { method: "POST", headers: { Authorization: \`Bearer \${getAuthToken()}\` }, body: formData }).then(res => res.json()),
  saveDocument: (formData) => fetch(\`\${API_BASE_URL}/documents/add\`, { method: "POST", headers: { Authorization: \`Bearer \${getAuthToken()}\` }, body: formData }).then(res => res.json()),
  getDocuments: () => fetchAPI("/documents/"),
  // LLMs & Embeddings
  getLLMs: () => fetchAPI("/llms/"),
  getEmbeddings: () => fetchAPI("/embeddings/"),
}`
  },
  // ---------------------
  // Pages
  // ---------------------
  {
    path: "pages/admin/dashboard.tsx",
    content: `import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const user = getAuthUser();

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "admin") router.push("/login");
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    try { const data = await api.getAdminDocuments(); setDocuments(data || []); } 
    catch(e){ console.error(e) }
  };

  const handleLogout = () => { clearAuthData(); router.push("/login"); }

  if (!user) return null;

  return (<div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <button onClick={handleLogout}>Logout</button>
    <div className="mt-4">
      <h2 className="text-xl font-semibold">Documents</h2>
      <ul>
        {documents.map(doc => <li key={doc.id}>{doc.title}</li>)}
      </ul>
    </div>
  </div>); 
}`
  },
  {
    path: "pages/vendor/dashboard.tsx",
    content: `import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth";
import { api } from "@/lib/api";

export default function VendorDashboard() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState([]);
  const user = getAuthUser();

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "vendor") router.push("/login");
    loadChatbots();
  }, [user]);

  const loadChatbots = async () => {
    try { const data = await api.getVendorChatbots(); setChatbots(data || []); } 
    catch(e){ console.error(e) }
  };

  const handleLogout = () => { clearAuthData(); router.push("/login"); }

  if (!user) return null;

  return (<div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Vendor Dashboard</h1>
    <button onClick={handleLogout}>Logout</button>
    <div className="mt-4">
      <h2 className="text-xl font-semibold">My Chatbots</h2>
      <ul>{chatbots.map(c => <li key={c.id}>{c.name}</li>)}</ul>
    </div>
  </div>); 
}`
  },
  {
    path: "pages/user/dashboard.tsx",
    content: `import { useEffect, useState } from "react";
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth";
import { api } from "@/lib/api";

export default function UserDashboard() {
  const [chatbots, setChatbots] = useState([]);
  const user = getAuthUser();

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "user") window.location.href="/login";
    loadChatbots();
  }, [user]);

  const loadChatbots = async () => {
    try { const data = await api.getAllChatbots(); setChatbots(data || []); } 
    catch(e){ console.error(e) }
  };

  const handleLogout = () => { clearAuthData(); window.location.href="/login"; }

  return (<div className="p-6">
    <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
    <button onClick={handleLogout}>Logout</button>
    <div className="mt-4">
      <h2 className="text-xl font-semibold">Top Chatbots</h2>
      <ul>{chatbots.map(c => <li key={c.id}>{c.name}</li>)}</ul>
    </div>
  </div>);
}`
  },
];

function createFolders() {
  folders.forEach(f => {
    const folderPath = path.join(projectRoot, f);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  });
}

function createFiles() {
  files.forEach(file => {
    const filePath = path.join(projectRoot, file.path);
    fs.writeFileSync(filePath, file.content, { encoding: "utf8" });
  });
}

function initProject() {
  if (!fs.existsSync(projectRoot)) fs.mkdirSync(projectRoot);
  createFolders();
  createFiles();
  console.log("Full frontend project scaffold generated at", projectRoot);
}

initProject();
