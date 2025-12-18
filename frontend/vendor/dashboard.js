const API_BASE = "http://127.0.0.1:9000";
const token = localStorage.getItem("access_token");
const currentVendor = JSON.parse(localStorage.getItem("vendor"));

// ================== FILE STATE ==================
let selectedNewFiles = [];

// ------------------ Show Sections ------------------
function showSection(section) {
  ["chatbotsSection", "documentsSection", "profileSection", "analyticsSection"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("d-none");
  });
  const secEl = document.getElementById(section + "Section");
  if (secEl) secEl.classList.remove("d-none");
}

// ------------------ Logout ------------------
function logout() {
  localStorage.clear();
  window.location.href = "/index.html";
}

// ------------------ Profile ------------------
function showProfileForm() {
  showSection("profile");
  document.getElementById("vendorName").value = currentVendor.name || "";
  document.getElementById("vendorEmail").value = currentVendor.email || "";
}

async function saveProfile() {
  const name = document.getElementById("vendorName").value;
  const email = document.getElementById("vendorEmail").value;
  try {
    await fetch(`${API_BASE}/vendors/update/${currentVendor.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email })
    });
    alert("Profile updated!");
    currentVendor.name = name;
    currentVendor.email = email;
  } catch(err){
    console.error(err);
    alert("Failed to update profile");
  }
}

// ------------------ Chatbots ------------------
async function loadChatbots() {
  showSection("chatbots");
  const list = document.getElementById("chatbotList");
  list.innerHTML = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/chatbots/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    list.innerHTML = "";
    const chatbots = Array.isArray(data) ? data : data.results || [];

    chatbots.forEach(bot => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <span>${bot.name}</span>
        <div>
          <button class="btn btn-sm btn-warning me-1" onclick="editChatbot(${bot.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteChatbot(${bot.id})">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });
  } catch(err) {
    console.error(err);
    list.innerHTML = "Failed to load chatbots";
  }
}

// ------------------ Documents ------------------
async function loadDocuments() {
  showSection("documents");
  const list = document.getElementById("documentList");
  list.innerHTML = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/documents/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    list.innerHTML = "";
    const docs = Array.isArray(data) ? data : data.results || [];

    docs.forEach(doc => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <span>${doc.title}</span>
        <div>
          <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id}, this)">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });
  } catch(err){
    console.error(err);
    list.innerHTML = "Failed to load documents";
  }
}

// ------------------ Add Document ------------------
function showAddDocumentForm() {
  showSection("documents");
  alert("Document upload form can be implemented here (reuse existing chatbot modal logic for files)");
}

// ------------------ Chatbot Modal ------------------
function showAddChatbotModal() {
  const modalEl = document.getElementById("chatbotModal");

  // reset modal fields
  const resetIds = [
    "chatbotId", "chatbotName", "chatbotDescription", "systemPrompt",
    "llmSelect", "llmPath", "mode", "isActive", "vectorStoreType", "vectorStoreConfig"
  ];
  resetIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = true;
    else if (el.tagName === "SELECT") el.value = el.id === "mode" ? "private" : "chroma";
    else if (id === "vectorStoreConfig") el.value = JSON.stringify(getDefaultVectorStoreConfig("chroma"), null, 2);
    else el.value = "";
  });

  // reset file state
  selectedNewFiles = [];
  document.getElementById("docFile").value = "";
  document.getElementById("selectedFiles").innerHTML = "";
  document.getElementById("existingDocs").innerHTML = "";

  document.querySelector("#docFile").closest("div").style.display = "block";
  document.querySelector("#existingDocs").closest("div").style.display = "block";

  let modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (!modalInstance) modalInstance = new bootstrap.Modal(modalEl);
  modalInstance.show();
}

// ------------------ Edit Chatbot ------------------
async function editChatbot(id) {
  try {
    const res = await fetch(`${API_BASE}/chatbots/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch chatbot");
    const bot = await res.json();

    const setValue = (id, value) => { const el = document.getElementById(id); if(el) el.value = value; };
    setValue("chatbotId", bot.id);
    setValue("chatbotName", bot.name);
    setValue("chatbotDescription", bot.description);
    setValue("systemPrompt", bot.system_prompt);
    setValue("mode", bot.mode);
    const isActiveEl = document.getElementById("isActive");
    if(isActiveEl) isActiveEl.checked = bot.is_active;
    setValue("vectorStoreType", bot.vector_store_type || "chroma");
    setValue("vectorStoreConfig", JSON.stringify(bot.vector_store_config || getDefaultVectorStoreConfig(bot.vector_store_type || "chroma"), null, 2));

    selectedNewFiles = [];
    const selectedFilesEl = document.getElementById("selectedFiles");
    if(selectedFilesEl) selectedFilesEl.innerHTML = "";

    const docFileDiv = document.getElementById("docFile")?.closest("div");
    if(docFileDiv) docFileDiv.style.display = "none";
    const existingDocsDiv = document.getElementById("existingDocs")?.closest("div");
    if(existingDocsDiv) existingDocsDiv.style.display = "none";

    await loadLLMs();
    const llmSelect = document.getElementById("llmSelect");
    if(llmSelect) llmSelect.value = bot.llm_id;

    const modalEl = document.getElementById("chatbotModal");
    if(modalEl){
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) modalInstance = new bootstrap.Modal(modalEl);
      modalInstance.show();
    }

  } catch(err) {
    console.error(err);
    alert("Failed to load chatbot: " + err.message);
  }
}

// ------------------ Save Chatbot ------------------
document.getElementById("saveChatbotBtn").addEventListener("click", async () => {
  const id = parseInt(document.getElementById("chatbotId").value, 10) || null;
  const formData = new FormData();

  formData.append("name", document.getElementById("chatbotName").value);
  formData.append("description", document.getElementById("chatbotDescription").value);
  formData.append("system_prompt", document.getElementById("systemPrompt").value);
  formData.append("llm_id", parseInt(document.getElementById("llmSelect").value, 10));
  formData.append("llm_path", document.getElementById("llmPath").value);
  formData.append("mode", document.getElementById("mode").value);
  formData.append("is_active", document.getElementById("isActive").checked);
  formData.append("vector_store_type", document.getElementById("vectorStoreType").value);
  formData.append("vector_store_config", document.getElementById("vectorStoreConfig").value);

  if (document.querySelector("#docFile").closest("div").style.display !== "none") {
    selectedNewFiles.forEach(file => formData.append("files", file));
  }

  const endpoint = id ? `${API_BASE}/chatbots/${id}` : `${API_BASE}/chatbots/create`;
  const method = id ? "PUT" : "POST";

  try {
    await fetch(endpoint, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    alert("Chatbot saved successfully!");
    loadChatbots();
    const modalEl = document.getElementById("chatbotModal");
    bootstrap.Modal.getInstance(modalEl).hide();
  } catch(err){
    console.error(err);
    alert("Failed to save chatbot");
  }
});

// ------------------ Delete ------------------
async function deleteChatbot(id){
  if(!confirm("Delete this chatbot?")) return;
  try{
    await fetch(`${API_BASE}/chatbots/${id}`,{
      method:"DELETE",
      headers:{Authorization:`Bearer ${token}` }
    });
    loadChatbots();
  }catch(err){
    console.error(err);
    alert("Failed to delete chatbot");
  }
}

async function deleteDocument(id, btn){
  if(!confirm("Delete this document?")) return;
  try{
    await fetch(`${API_BASE}/documents/${id}`,{
      method:"DELETE",
      headers:{Authorization:`Bearer ${token}` }
    });
    btn.parentElement.parentElement.remove();
  }catch(err){
    console.error(err);
    alert("Failed to delete document");
  }
}

// ------------------ LLM Handling ------------------
async function loadLLMs(){
  try{
    const res = await fetch(`${API_BASE}/llms/`,{
      headers:{Authorization:`Bearer ${token}` }
    });
    const llms = await res.json();
    const select = document.getElementById("llmSelect");
    select.innerHTML = '<option value="">Select LLM</option>';
    llms.forEach(llm=>{
      const opt = document.createElement("option");
      opt.value = llm.id;
      opt.dataset.path = llm.path;
      opt.textContent = `${llm.name} (${llm.path})`;
      select.appendChild(opt);
    });
  }catch(err){ console.error(err); }
}

document.getElementById("llmSelect").addEventListener("change", function(){
  const opt = this.options[this.selectedIndex];
  document.getElementById("llmPath").value = opt.dataset.path || "";
});

// ------------------ Multi File Handling ------------------
document.getElementById("docFile").addEventListener("change", function(){
  const container = document.getElementById("selectedFiles");
  for (let file of this.files) {
    if (selectedNewFiles.some(f => f.name === file.name && f.size === file.size)) continue;

    selectedNewFiles.push(file);
    const div = document.createElement("div");
    div.className = "d-flex justify-content-between align-items-center mb-1";
    div.innerHTML = `<span>${file.name}</span><button class="btn btn-sm btn-danger">Remove</button>`;
    div.querySelector("button").onclick = () => {
      selectedNewFiles = selectedNewFiles.filter(f => f !== file);
      div.remove();
    };
    container.appendChild(div);
  }
  this.value = "";
});

// ------------------ Vector Store Config Helpers ------------------
function getDefaultVectorStoreConfig(type) {
  switch(type) {
    case "pinecone": return { index_name: "your_index_name", api_key: "your_api_key", environment: "your_env" };
    case "qdrant": return { url: "http://localhost:6333" };
    case "weaviate": return { url: "http://localhost:8080" };
    case "pgvector": return { connection_string: "postgresql://user:pass@host:port/db" };
    case "chroma":
    default: return { persist_dir: `uploads/vectorstore/chatbot_default` };
  }
}

document.getElementById("vectorStoreType").addEventListener("change", function(){
  const type = this.value;
  const configField = document.getElementById("vectorStoreConfig");
  configField.value = JSON.stringify(getDefaultVectorStoreConfig(type), null, 2);
});

// ------------------ Analytics ------------------
async function showAnalyticsSection() {
  showSection("analytics");

  await loadVendorUsers();
  await loadAnalytics();
}

// Load vendor users for dropdown
async function loadVendorUsers() {
  const select = document.getElementById("analyticsUserSelect");
  if (!select) return;

  select.innerHTML = `<option value="">All Users</option>`;

  try {
    const res = await fetch(`${API_BASE}/users/`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const users = await res.json();
    users.forEach(user => {
      const opt = document.createElement("option");
      opt.value = user.id;
      opt.textContent = user.email || `User ${user.id}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load users", err);
  }
}

// Load all analytics JSON
async function loadAnalytics() {
  const container = document.getElementById("analyticsList");
  if (!container) return;

  const userId = document.getElementById("analyticsUserSelect").value;
  container.innerHTML = "Loading...";

  const endpoints = [
    ["Top Chatbots by Messages", "/vendors/top-chatbots/messages"],
    ["Top Chatbots by Users", "/vendors/top-chatbots/users"],
    ["Daily Messages (7 Days)", "/vendors/daily/messages"],
    ["Daily Unique Users (7 Days)", "/vendors/daily/unique-users"]
  ];

  if (userId) {
    endpoints.push(
      ["User Tokens (Last 7 Days)", `/vendors/user/${userId}/tokens-last7`],
      ["User Tokens (Total)", `/vendors/user/${userId}/tokens-total`]
    );
  }

  container.innerHTML = "";

  for (const [label, url] of endpoints) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      const div = document.createElement("div");
      div.className = "border rounded p-3 mb-3";
      div.innerHTML = `
        <strong>${label}</strong>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
      container.appendChild(div);
    } catch (err) {
      console.error(err);
      const div = document.createElement("div");
      div.className = "border rounded p-3 mb-3 text-danger";
      div.textContent = `Failed to load ${label}`;
      container.appendChild(div);
    }
  }
}

document.getElementById("analyticsUserSelect")?.addEventListener("change", loadAnalytics);

// ------------------ Initialize ------------------
document.addEventListener("DOMContentLoaded", ()=>{
  loadLLMs();
});
