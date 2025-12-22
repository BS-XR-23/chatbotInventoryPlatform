const API_BASE = "http://127.0.0.1:9000";
const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "/login.html";
}

const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
};

/* ===================== GLOBAL ===================== */
let globalEmbeddings = [];

/* ===================== NAV ===================== */
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("d-none"));
  document.getElementById(id).classList.remove("d-none");

  if (id === "chatbots") loadChatbots();
  if (id === "vendors") loadVendors();
  if (id === "documents") loadDocuments();
  if (id === "embeddings") loadEmbeddings();
  if (id === "llms") loadLLMs();
}

/* ===================== CHATBOTS ===================== */
async function loadChatbots() {
  const res = await fetch(`${API_BASE}/admins/`, { headers });
  const bots = await res.json();

  chatbotList.innerHTML = "";
  bots.forEach(bot => {
    chatbotList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${bot.name}
        <button class="btn btn-sm btn-outline-primary"
          onclick="duplicateChatbot(${bot.id})">
          Duplicate
        </button>
      </li>`;
  });

  const analyticsRes = await fetch(`${API_BASE}/admins/most-used-chatbot`, { headers });
  const analytics = await analyticsRes.json();

  if (analytics?.chatbot) {
    mostUsedChatbot.innerHTML = `
      <strong>${analytics.chatbot.name}</strong><br>
      Usage Count: ${analytics.usage_count}
    `;
  } else {
    mostUsedChatbot.innerText = "No analytics data available";
  }
}

async function duplicateChatbot(id) {
  await fetch(`${API_BASE}/admins/chatbots/duplicate/${id}`, { method: "POST", headers });
  loadChatbots();
}


/* ===================== VENDORS ===================== */
async function loadVendors() {
  const res = await fetch(`${API_BASE}/admins/all-vendors`, { headers });
  const vendors = await res.json();

  vendorList.innerHTML = "";
  vendorSelect.innerHTML = "";

  vendors.forEach(v => {
    vendorList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${v.name}
        <span class="badge bg-secondary">${v.status}</span>
        <button class="btn btn-sm btn-outline-warning"
          onclick="updateVendorStatus(${v.id})">
          Update Status
        </button>
      </li>`;

    vendorSelect.innerHTML += `<option value="${v.id}">${v.name}</option>`;
  });

  vendorSelect.onchange = loadTotalTokens;

  const usersRes = await fetch(`${API_BASE}/admins/most-users-by-vendors`, { headers });
  let usersData = await usersRes.json();
  if (Array.isArray(usersData)) usersData = usersData[0];

  if (usersData?.vendor) {
    mostUsersVendor.innerHTML = `
      <strong>Vendor with Most Users</strong><br>
      Vendor: ${usersData.vendor.name}<br>
      Users: ${usersData.user_count}
    `;
  } else {
    mostUsersVendor.innerText = "No data available";
  }

  const botsRes = await fetch(`${API_BASE}/admins/most-chatbots-by-vendors`, { headers });
  let botsData = await botsRes.json();
  if (Array.isArray(botsData)) botsData = botsData[0];

  if (botsData?.vendor) {
    mostChatbotsVendor.innerHTML = `
      <strong>Vendor with Most Chatbots</strong><br>
      Vendor: ${botsData.vendor.name}<br>
      Chatbots: ${botsData.chatbot_count}
    `;
  } else {
    mostChatbotsVendor.innerText = "No data available";
  }
}

async function updateVendorStatus(id) {
  const status = prompt("Enter status (active / inactive):");
  if (!status) return;

  await fetch(`${API_BASE}/admins/update-vendors/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status })
  });

  loadVendors();
}

async function loadTotalTokens() {
  const vendorId = vendorSelect.value;
  if (!vendorId) return;

  const res = await fetch(`${API_BASE}/admins/total-tokens/${vendorId}`, { headers });
  const data = await res.json();

  totalTokens.innerHTML = `<strong>Total Tokens Used:</strong> ${data.total_tokens}`;
}

/* ===================== DOCUMENTS ===================== */
async function loadDocuments() {
  const res = await fetch(`${API_BASE}/admins/documents`, { headers });
  const docs = await res.json();

  documentList.innerHTML = "";
  docs.forEach(doc => {
    documentList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${doc.title}</span>
        <span class="badge bg-secondary">${doc.status}</span>
      </li>`;
  });
}

/* ===================== EMBEDDINGS ===================== */
async function loadEmbeddings() {
  const list = document.getElementById("embeddingList");
  list.innerHTML = "<li class='list-group-item'>Loading...</li>";

  try {
    const res = await fetch(`${API_BASE}/embeddings/`, { headers });
    const embeds = await res.json();
    globalEmbeddings = embeds;

    list.innerHTML = "";

    embeds.forEach(e => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";

      li.innerHTML = `
        <div>
          <strong>${e.model_name}</strong><br>
          <small class="text-muted">${e.provider}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-warning me-2"
            onclick="openUpdateEmbeddingModal(${e.id}, '${e.model_name.replace(/'/g,"\\'")}', '${e.provider.replace(/'/g,"\\'")}', '${e.path?.replace(/'/g,"\\'") || ""}')">
            Update
          </button>
          <button class="btn btn-sm btn-outline-danger"
            onclick="deleteEmbedding(${e.id})">
            Delete
          </button>
        </div>
      `;

      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = "<li class='list-group-item text-danger'>Failed to load embeddings</li>";
  }
}

function openAddEmbeddingModal() {
  const modal = new bootstrap.Modal(document.getElementById("embeddingModal"));
  document.getElementById("embeddingForm").reset();
  document.getElementById("embeddingModalTitle").innerText = "Add Embedding";
  document.getElementById("embeddingId").value = "";
  modal.show();
}

function openUpdateEmbeddingModal(id, model_name, provider, path) {
  const modal = new bootstrap.Modal(document.getElementById("embeddingModal"));
  document.getElementById("embeddingModalTitle").innerText = "Update Embedding";
  document.getElementById("embeddingId").value = id;
  document.getElementById("embeddingModelName").value = model_name;
  document.getElementById("embeddingProvider").value = provider;
  document.getElementById("embeddingPath").value = path || "";
  modal.show();
}

async function submitEmbeddingForm(event) {
  event.preventDefault();
  const id = document.getElementById("embeddingId").value;
  const model_name = document.getElementById("embeddingModelName").value;
  const provider = document.getElementById("embeddingProvider").value;
  const path = document.getElementById("embeddingPath").value;

  const payload = { model_name, provider, path: path || undefined };

  if (id) {
    await fetch(`${API_BASE}/embeddings/update/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(`${API_BASE}/embeddings/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
  }

  bootstrap.Modal.getInstance(document.getElementById("embeddingModal")).hide();
  loadEmbeddings();
}

async function deleteEmbedding(id) {
  if (!confirm("Are you sure you want to delete this embedding?")) return;

  await fetch(`${API_BASE}/embeddings/delete/${id}`, {
    method: "DELETE",
    headers
  });

  loadEmbeddings();
}

/* ===================== LLMs ===================== */
async function loadLLMs() {
  const list = document.getElementById("llmList");
  list.innerHTML = "<li class='list-group-item'>Loading...</li>";

  try {
    const res = await fetch(`${API_BASE}/llms/`, { headers });
    const llms = await res.json();

    // Fetch embeddings for dropdown
    const embedRes = await fetch(`${API_BASE}/embeddings/`, { headers });
    globalEmbeddings = await embedRes.json();

    list.innerHTML = "";

    llms.forEach(l => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";

      li.innerHTML = `
        <div>
          <strong>${l.name}</strong> (${l.status})<br>
          <small class="text-muted">Provider: ${l.provider} | Embedding: ${l.embedding?.model_name || "None"}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-warning me-2"
            onclick="openUpdateLLMModal(${l.id}, '${l.name.replace(/'/g,"\\'")}', '${l.provider.replace(/'/g,"\\'")}', ${l.embedding_id}, ${l.def_token_limit}, ${l.def_context_limit}, '${(l.path||"").replace(/'/g,"\\'")}', '${l.status}')">
            Update
          </button>
          <button class="btn btn-sm btn-outline-danger"
            onclick="deleteLLM(${l.id})">
            Delete
          </button>
        </div>
      `;

      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = "<li class='list-group-item text-danger'>Failed to load LLMs</li>";
  }
}

async function openAddLLMModal() {
  const modal = new bootstrap.Modal(document.getElementById("llmModal"));
  document.getElementById("llmForm").reset();
  document.getElementById("llmModalTitle").innerText = "Add LLM";
  document.getElementById("llmId").value = "";

  populateEmbeddingDropdown(globalEmbeddings);
  modal.show();
}

function openUpdateLLMModal(id, name, provider, embedding_id, token_limit, context_limit, path, status) {
  const modal = new bootstrap.Modal(document.getElementById("llmModal"));
  document.getElementById("llmModalTitle").innerText = "Update LLM";

  document.getElementById("llmId").value = id;
  document.getElementById("llmName").value = name;
  document.getElementById("llmProvider").value = provider;
  document.getElementById("llmTokenLimit").value = token_limit;
  document.getElementById("llmContextLimit").value = context_limit;
  document.getElementById("llmPath").value = path || "";
  document.getElementById("llmStatus").value = status;

  populateEmbeddingDropdown(globalEmbeddings, embedding_id);
  modal.show();
}

function populateEmbeddingDropdown(embeddings, selectedId = null) {
  const select = document.getElementById("llmEmbeddingId");
  select.innerHTML = "";
  embeddings.forEach(e => {
    const option = document.createElement("option");
    option.value = e.id;
    option.text = e.model_name;
    if (selectedId && e.id === selectedId) option.selected = true;
    select.appendChild(option);
  });
}

async function submitLLMForm(event) {
  event.preventDefault();
  const id = document.getElementById("llmId").value;
  const name = document.getElementById("llmName").value;
  const provider = document.getElementById("llmProvider").value;
  const embedding_id = document.getElementById("llmEmbeddingId").value;
  const token_limit = document.getElementById("llmTokenLimit").value;
  const context_limit = document.getElementById("llmContextLimit").value;
  const path = document.getElementById("llmPath").value;
  const status = document.getElementById("llmStatus").value;

  const payload = {
    name,
    provider,
    embedding_id: Number(embedding_id),
    def_token_limit: Number(token_limit),
    def_context_limit: Number(context_limit),
    path: path || undefined,
    status
  };

  if (id) {
    await fetch(`${API_BASE}/llms/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(`${API_BASE}/llms/`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
  }

  bootstrap.Modal.getInstance(document.getElementById("llmModal")).hide();
  loadLLMs();
}

async function deleteLLM(id) {
  if (!confirm("Are you sure you want to delete this LLM?")) return;

  await fetch(`${API_BASE}/llms/${id}`, {
    method: "DELETE",
    headers
  });

  loadLLMs();
}

/* ===================== PROFILE ===================== */
function openProfile() { alert("Use GET /admins/me/{id} and PUT /admins/edit/{id}"); }
function openPassword() { alert("Use PUT /admins/change-password"); }

/* ===================== LOGOUT ===================== */
function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function showAnalytics() {
  // Hide all sections
  document.querySelectorAll(".section").forEach(s => s.classList.add("d-none"));
  
  // Show the analytics section
  document.getElementById("dashboard").classList.remove("d-none");

  // Reload analytics data
  loadChatbots(); // Most used chatbot
  loadVendors();  // Vendor analytics
}
showAnalytics();