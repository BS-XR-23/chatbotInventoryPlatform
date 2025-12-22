const API_BASE = "http://127.0.0.1:9000";
const token = localStorage.getItem("access_token");
const currentVendor = JSON.parse(localStorage.getItem("vendor") || "{}");

// ================= GLOBAL FILE STATE =================
let selectedNewFiles = [];
let llmMap = {};

// ------------------ Section Control ------------------
function showSection(section) {
  ["analyticsSection", "chatbotsSection", "documentsSection", "profileSection"]
    .forEach(id => document.getElementById(id).classList.add("d-none"));

  document.getElementById(section + "Section").classList.remove("d-none");
}

async function showMainDashboard() {
  showSection("analytics");
  await loadVendorUsers();
  await loadAnalytics();
}

// ------------------ Logout ------------------
function logout() {
  localStorage.clear();
  window.location.href = "/index.html";
}

// ------------------ Profile ------------------
function showProfileForm() {
  showSection("profile");
  vendorName.value = currentVendor.name || "";
  vendorEmail.value = currentVendor.email || "";
}

async function saveProfile() {
  await fetch(`${API_BASE}/vendors/update/${currentVendor.id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: vendorName.value,
      email: vendorEmail.value
    })
  });
  alert("Profile updated");
}

// ------------------ LLM Map ------------------
async function loadLLMsMap() {
  const res = await fetch(`${API_BASE}/llms/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const llms = await res.json();
  llmMap = {};
  llms.forEach(l => llmMap[l.id] = l.name);
}

// ------------------ Chatbots ------------------
async function loadChatbots() {
  showSection("chatbots");
  chatbotList.innerHTML = "";
  await loadLLMsMap();

  const res = await fetch(`${API_BASE}/chatbots/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const bots = await res.json();

  bots.forEach(b => {
    chatbotList.innerHTML += `
      <tr>
        <td>${b.name}</td>
        <td>${llmMap[b.llm_id] || "N/A"}</td>
        <td>${b.vector_store_type || "N/A"}</td>
        <td>${b.mode}</td>
      </tr>`;
  });
}

// ------------------ Documents ------------------
async function loadDocuments() {
  showSection("documents");
  selectedNewFiles = [];
  selectedFilesPreview.innerHTML = "";
  documentList.innerHTML = "";
  documentChatbotSelect.innerHTML = "";

  const botRes = await fetch(`${API_BASE}/chatbots/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const bots = await botRes.json();

  bots.forEach(b => {
    documentChatbotSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
  });

  const docRes = await fetch(`${API_BASE}/documents/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const docs = await docRes.json();

  docs.forEach(d => {
    documentList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between">
        ${d.title}
        <button class="btn btn-sm btn-danger" onclick="deleteDocument(${d.id}, this)">Delete</button>
      </li>`;
  });
}

// -------- MULTI-FILE FIX --------
function handleDocumentFileSelect(e) {
  const newFiles = Array.from(e.target.files);

  newFiles.forEach(file => {
    const exists = selectedNewFiles.some(
      f => f.name === file.name && f.size === file.size
    );
    if (!exists) selectedNewFiles.push(file);
  });

  e.target.value = "";
  renderSelectedFiles();
}

function renderSelectedFiles() {
  selectedFilesPreview.innerHTML = "";
  selectedNewFiles.forEach(f => {
    selectedFilesPreview.innerHTML += `<li>${f.name}</li>`;
  });
}

// ------------------ Upload ------------------
async function uploadDocuments() {
  if (!selectedNewFiles.length) return alert("Select files first");

  const chatbotId = documentChatbotSelect.value;
  const formData = new FormData();

  selectedNewFiles.forEach(f => formData.append("files", f));
  formData.append("chatbot_id", chatbotId);

  await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  alert("Upload successful");
  loadDocuments();
}

// ------------------ Delete Document ------------------
async function deleteDocument(id, btn) {
  await fetch(`${API_BASE}/documents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  btn.closest("li").remove();
}

// ------------------ Analytics ------------------
async function loadVendorUsers() {
  analyticsUserSelect.innerHTML = `<option value="">All Users</option>`;
  const res = await fetch(`${API_BASE}/users/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const users = await res.json();

  users.forEach(u => {
    analyticsUserSelect.innerHTML += `<option value="${u.id}">${u.email || u.id}</option>`;
  });
}

async function loadAnalytics() {
  analyticsList.innerHTML = "";
  const userId = analyticsUserSelect.value;

  // User analytics card is always visible
  const userCard = document.getElementById("userAnalyticsCard");
  const userContent = document.getElementById("userAnalyticsContent");

  if (userId) {
    try {
      const res = await fetch(`${API_BASE}/vendors/user/${userId}/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      userContent.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch {
      userContent.innerHTML = `<p class="text-danger">Failed to load user data</p>`;
    }
  } else {
    userContent.innerHTML = `<p>All user analytics shown below</p>`;
  }

  // Analytics cards endpoints
  const endpoints = [
    ["Top Chatbots by Messages", "/vendors/top-chatbots/messages"],
    ["Top Chatbots by Users", "/vendors/top-chatbots/users"],
    ["Daily Messages", "/vendors/daily/messages"],
    ["Daily Unique Users", "/vendors/daily/unique-users"]
  ];

  if (userId) {
    endpoints.push(
      ["User Tokens (7 Days)", `/vendors/user/${userId}/tokens-last7`],
      ["User Tokens (Total)", `/vendors/user/${userId}/tokens-total`]
    );
  }

  for (let i = 0; i < endpoints.length; i++) {
    const [title, url] = endpoints[i];
    const card = document.createElement("div");
    card.className = `analytics-card card p-3 shadow-sm`;

    try {
      const res = await fetch(API_BASE + url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      card.innerHTML = `<h6>${title}</h6><pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch {
      card.innerHTML = `<h6>${title}</h6><p class="text-danger">Failed</p>`;
    }

    analyticsList.appendChild(card);
  }
}

// ------------------ Event Listeners ------------------
analyticsUserSelect.addEventListener("change", loadAnalytics);
document.addEventListener("DOMContentLoaded", showMainDashboard);
