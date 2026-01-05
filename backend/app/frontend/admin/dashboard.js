// const API_BASE = "http://127.0.0.1:9000";
const API_BASE = "";
const token = localStorage.getItem("access_token");
const role = localStorage.getItem("role");

let selectedNewFiles = [];

if (!token) {
  window.location.href = "/index.html";
}

const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
};

/* ===================== GLOBAL ===================== */
let globalEmbeddings = [];
let globalLLMs = [];
let globalVendors = [];
let selectedChatbotFiles = [];

/* ===================== DASHBOARD STATS ===================== */
async function loadDashboardStats() {
  try {
    const [
      vendorsRes,
      usersRes,
      chatbotsRes,
      messagesRes,
      conversationsRes
    ] = await Promise.all([
      fetch(`${API_BASE}/admins/total-vendors`, { headers }),
      fetch(`${API_BASE}/admins/total-users`, { headers }),
      fetch(`${API_BASE}/admins/total-chatbots`, { headers }),
      fetch(`${API_BASE}/admins/total-messages`, { headers }),
      fetch(`${API_BASE}/admins/total-conversations`, { headers })
    ]);

    const [
      totalVendors,
      totalUsers,
      totalChatbots,
      totalMessages,
      totalConversations
    ] = await Promise.all([
      vendorsRes.json(),
      usersRes.json(),
      chatbotsRes.json(),
      messagesRes.json(),
      conversationsRes.json()
    ]);

    document.getElementById("totalVendors").innerText = totalVendors;
    document.getElementById("totalUsers").innerText = totalUsers;
    document.getElementById("totalChatbots").innerText = totalChatbots;
    document.getElementById("totalMessages").innerText = totalMessages;
    document.getElementById("totalConversations").innerText = totalConversations;

  } catch (err) {
    console.error("Failed to load dashboard stats", err);
  }
}

/* ===================== DELETE CHATBOT ===================== */
async function deleteChatbot(chatbotId) {
  if (!confirm("Are you sure you want to delete this chatbot?")) return;

  await fetch(`${API_BASE}/chatbots/${chatbotId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  loadChatbots(); // refresh list after deletion
}

// Duplicate chatbot function
async function duplicateChatbot(chatbotId) {
  try {
    const res = await fetch(`${API_BASE}/admins/chatbots/duplicate/${chatbotId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.detail || "Failed to duplicate chatbot");
      return;
    }

    // Refresh the chatbot list after duplication
    loadChatbots();
  } catch (err) {
    console.error(err);
    alert("An error occurred while duplicating the chatbot");
  }
}

/* ===================== CHATBOTS ===================== */
async function loadChatbots() {
  const res = await fetch(`${API_BASE}/admins/`, { headers });
  const bots = await res.json();

  const llmRes = await fetch(`${API_BASE}/llms/`, { headers });
  const llms = await llmRes.json();
  globalLLMs = llms;
  const llmMap = {};
  llms.forEach(l => { llmMap[l.id] = l; });

  const container = document.getElementById("chatbotList");
  container.innerHTML = `
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Name</th>
          <th>LLM</th>
          <th>Vector Store</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="chatbotTableBody"></tbody>
    </table>
  `;

  const tbody = document.getElementById("chatbotTableBody");

  bots.forEach(bot => {
    const llm = llmMap[bot.llm_id]; 
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${bot.name}</td>
      <td>
        ${llm?.name || "N/A"}<br>
        <small class="text-muted">Provider: ${llm?.provider || "N/A"} | Token Limit: ${llm?.def_token_limit || "N/A"}</small>
      </td>
      <td>${bot.vector_store_type}</td>
    `;

    // Actions td with vertical buttons
    const tdActions = document.createElement("td");
    tdActions.className = "d-flex flex-column";
    tdActions.style.gap = "4px";

    // Duplicate button
    const dupBtn = document.createElement("button");
    dupBtn.className = "btn btn-sm btn-primary";
    dupBtn.textContent = "Duplicate";
    dupBtn.addEventListener("click", () => duplicateChatbot(bot.id));
    tdActions.appendChild(dupBtn);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-warning";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openUpdateChatbotModal(bot));
    tdActions.appendChild(editBtn);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-sm btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteChatbot(bot.id));
    tdActions.appendChild(delBtn);

    // Details button
    const detailsBtn = document.createElement("button");
    detailsBtn.className = "btn btn-sm btn-info";
    detailsBtn.textContent = "Details";
    detailsBtn.addEventListener("click", () => showChatbotDetails(bot.id));
    tdActions.appendChild(detailsBtn);

    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });

  // Load most-used chatbot analytics
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

  // -------------------------------
  // Populate chatbot dropdown for document uploads
  // -------------------------------
  const documentChatbotSelect = document.getElementById("documentChatbotSelect");
  if (documentChatbotSelect) {
    documentChatbotSelect.innerHTML = '<option value="">-- Select Chatbot --</option>';
    bots.forEach(bot => {
      const option = document.createElement("option");
      option.value = bot.id;
      option.text = bot.name;
      documentChatbotSelect.appendChild(option);
    });
  }
}



/* ===================== CHATBOT MODAL ===================== */
function openAddChatbotModal() {
  const modal = new bootstrap.Modal(document.getElementById("chatbotModal"));
  document.getElementById("chatbotForm").reset();
  document.getElementById("chatbotId").value = "";
  document.getElementById("chatbotDescription").value = "";
  if (window.systemPromptEditor) systemPromptEditor.root.innerHTML = "";

  selectedChatbotFiles = [];
  renderSelectedChatbotFiles();
  document.getElementById("chatbotModalTitle").innerText = "Add Chatbot";

  // Populate LLM dropdown
  const llmSelect = document.getElementById("chatbotLLMId");
  llmSelect.innerHTML = "";
  globalLLMs.forEach(l => {
    const option = document.createElement("option");
    option.value = l.id;
    option.text = l.name;
    option.dataset.path = l.path || "";
    llmSelect.appendChild(option);
  });

  // Populate Vendor dropdown
  const vendorSelect = document.getElementById("chatbotVendorId");
  vendorSelect.innerHTML = "";
  globalVendors.forEach(v => {
    const option = document.createElement("option");
    option.value = v.id;
    option.text = v.name;
    vendorSelect.appendChild(option);
  });

  updateLLMPath();

  // Set default status to Active
  document.getElementById("chatbotIsActive").value = "true";

  modal.show();
}


function openUpdateChatbotModal(bot) {
  const modal = new bootstrap.Modal(document.getElementById("chatbotModal"));
  document.getElementById("chatbotModalTitle").innerText = "Update Chatbot";
  document.getElementById("chatbotId").value = bot.id;
  document.getElementById("chatbotName").value = bot.name;
  document.getElementById("chatbotDescription").value = bot.description || "";
  // Load existing system prompt into rich text editor
  if (window.systemPromptEditor) {
    systemPromptEditor.root.innerHTML = bot.system_prompt || "";
  }

  // LLM dropdown
  const llmSelect = document.getElementById("chatbotLLMId");
  llmSelect.innerHTML = "";
  globalLLMs.forEach(l => {
    const option = document.createElement("option");
    option.value = l.id;
    option.text = l.name;
    option.dataset.path = l.path || "";
    if (l.id === bot.llm_id) option.selected = true;
    llmSelect.appendChild(option);
  });
  updateLLMPath();

  // Vendor dropdown
  const vendorSelect = document.getElementById("chatbotVendorId");
  vendorSelect.innerHTML = "";
  globalVendors.forEach(v => {
    const option = document.createElement("option");
    option.value = v.id;
    option.text = v.name;
    if (v.id === bot.vendor_id) option.selected = true;
    vendorSelect.appendChild(option);
  });

  document.getElementById("chatbotLLMPath").value = bot.llm_path || "";
  document.getElementById("chatbotVectorStore").value = bot.vector_store_type;

  // Set the current status
  document.getElementById("chatbotIsActive").value = bot.is_active ? "true" : "false";

  selectedChatbotFiles = [];
  renderSelectedChatbotFiles();

  modal.show();
}

function updateLLMPath() {
  const llmSelect = document.getElementById("chatbotLLMId");
  const pathInput = document.getElementById("chatbotLLMPath");
  const selectedOption = llmSelect.options[llmSelect.selectedIndex];
  pathInput.value = selectedOption.dataset.path || "";
}

/* ===================== FILE HANDLING ===================== */
function handleChatbotFileSelect(event) {
  const newFiles = Array.from(event.target.files);

  newFiles.forEach(file => {
    const exists = selectedChatbotFiles.some(
      f => f.name === file.name && f.size === file.size
    );
    if (!exists) selectedChatbotFiles.push(file);
  });

  event.target.value = ""; // reset input to allow re-selection
  renderSelectedChatbotFiles();
}

// Render selected files with remove buttons
function renderSelectedChatbotFiles() {
  const preview = document.getElementById("chatbotFilesPreview");
  preview.innerHTML = "";

  selectedChatbotFiles.forEach((file, index) => {
    const li = document.createElement("li");
    li.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-1");
    li.innerHTML = `
      ${file.name}
      <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeChatbotFile(${index})">
        &times;
      </button>
    `;
    preview.appendChild(li);
  });
}

// Remove a selected file
function removeChatbotFile(index) {
  selectedChatbotFiles.splice(index, 1);
  renderSelectedChatbotFiles();
}

/* ===================== FORM SUBMISSION ===================== */
async function submitChatbotForm(event) {
  event.preventDefault();

  const id = document.getElementById("chatbotId").value;
  const system_prompt = systemPromptEditor.root.innerHTML;
  const name = document.getElementById("chatbotName").value;
  const description = document.getElementById("chatbotDescription").value;
  const llm_id = document.getElementById("chatbotLLMId").value;
  const llm_path = document.getElementById("chatbotLLMPath").value;
  const vendor_id = document.getElementById("chatbotVendorId").value;
  const vector_store_type = document.getElementById("chatbotVectorStore").value;

  // Get status value
  const is_active = document.getElementById("chatbotIsActive").value === "true";

  const formData = new FormData();
  formData.append("name", name);
  formData.append("vendor_id", vendor_id);
  formData.append("description", description || "");
  formData.append("system_prompt", system_prompt);
  formData.append("llm_id", llm_id);
  formData.append("llm_path", llm_path);
  formData.append("vector_store_type", vector_store_type);

  // Append status
  formData.append("is_active", is_active);

  selectedChatbotFiles.forEach(file => formData.append("files", file));

  const url = id
    ? `${API_BASE}/chatbots/${id}`
    : `${API_BASE}/chatbots/create`;

  const method = id ? "PUT" : "POST";

  await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  selectedChatbotFiles = [];
  renderSelectedChatbotFiles();

  bootstrap.Modal
    .getInstance(document.getElementById("chatbotModal"))
    .hide();

  loadChatbots();
}


/* ===================== VENDORS ===================== */
async function loadVendors() {
  const res = await fetch(`${API_BASE}/admins/all-vendors`, { headers });
  const vendors = await res.json();
  globalVendors = vendors; // save globally for modal use

  // ---------------------------
  // Populate vendor list (for vendor card)
  // ---------------------------
  const vendorListEl = document.getElementById("vendorList");
  vendorListEl.innerHTML = "";

  vendors.forEach(v => {
    vendorListEl.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-start">
        <div>
          <div><strong>${v.name}</strong></div>
          <div class="text-muted small">
            Users: ${v.user_count || 0} | Chatbots: ${v.chatbot_count || 0}
          </div>
        </div>
        <div class="d-flex flex-column align-items-end gap-2">
          <span class="badge bg-secondary">${v.status || 'N/A'}</span>
          <button class="btn btn-sm btn-warning-solid"
            onclick="updateVendorStatus(${v.id})">
            Update Status
          </button>
        </div>
      </li>`;
  });

  // ---------------------------
  // Populate analytics dropdown
  // ---------------------------
  const analyticsSelect = document.getElementById("vendorSelectAnalytics");
  analyticsSelect.innerHTML = "";
  vendors.forEach(v => {
    const option = document.createElement("option");
    option.value = v.id;
    option.text = v.name;
    analyticsSelect.appendChild(option);
  });

  // Load total tokens on change
  analyticsSelect.onchange = loadTotalTokensAnalytics;

  // Load for first vendor by default
  if (vendors.length > 0) {
    analyticsSelect.value = vendors[0].id;
    loadTotalTokensAnalytics();
  }

  // ---------------------------
  // Populate vendor dropdown for Admin Document Uploads
  // ---------------------------
  const vendorSelectUpload = document.getElementById("chatbotVendorId");
  if (vendorSelectUpload) {
    vendorSelectUpload.innerHTML = '<option value="">-- Select Vendor --</option>';
    vendors.forEach(v => {
      const option = document.createElement("option");
      option.value = v.id;
      option.text = v.name;
      vendorSelectUpload.appendChild(option);
    });
  }

  // ---------------------------
  // Optional: Most users vendor (commented)
  // ---------------------------
  // const usersRes = await fetch(`${API_BASE}/admins/most-users-by-vendors`, { headers });
  // let usersData = await usersRes.json();
  // if (Array.isArray(usersData)) usersData = usersData[0];
  // if (usersData?.vendor) {
  //   mostUsersVendor.innerHTML = `
  //     <strong>Vendor with Most Users</strong><br>
  //     Vendor: ${usersData.vendor.name}<br>
  //     Users: ${usersData.user_count}
  //   `;
  // } else {
  //   mostUsersVendor.innerText = "No data available";
  // }

  // ---------------------------
  // Optional: Most chatbots vendor (commented)
  // ---------------------------
  // const botsRes = await fetch(`${API_BASE}/admins/most-chatbots-by-vendors`, { headers });
  // let botsData = await botsRes.json();
  // if (Array.isArray(botsData)) botsData = botsData[0];
  // if (botsData?.vendor) {
  //   mostChatbotsVendor.innerHTML = `
  //     <strong>Vendor with Most Chatbots</strong><br>
  //     Vendor: ${botsData.vendor.name}<br>
  //     Chatbots: ${botsData.chatbot_count}
  //   `;
  // } else {
  //   mostChatbotsVendor.innerText = "No data available";
  // }
}

async function loadTotalTokensAnalytics() {
  const vendorId = document.getElementById("vendorSelectAnalytics").value;
  if (!vendorId) return;

  const res = await fetch(`${API_BASE}/conversations/total-tokens/${vendorId}`, { headers });
  const data = await res.json();

  const totalTokens = data?.total_tokens;
  const displayText = (totalTokens && totalTokens > 0) ? totalTokens : "No token used";

  document.getElementById("totalTokensAnalytics").innerHTML = `
    <strong>Total Tokens Used:</strong> ${displayText}
  `;
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

  try {
    const res = await fetch(`${API_BASE}/conversations/total-tokens/${vendorId}`, { headers });
    const data = await res.json();

    // Put total tokens in the analytics card (not inside vendor list)
    document.getElementById("totalTokens").innerHTML = `
      <strong>Total Tokens Used by ${vendorSelect.options[vendorSelect.selectedIndex].text}:</strong> ${data.total_tokens}
    `;
  } catch (err) {
    console.error(err);
    document.getElementById("totalTokens").innerText = "Failed to load total tokens";
  }
}

function openCreateVendorModal() {
  const modal = new bootstrap.Modal(
    document.getElementById("createVendorModal")
  );

  document.getElementById("vendorName").value = "";
  document.getElementById("vendorEmail").value = "";
  document.getElementById("vendorDomain").value = "";
  document.getElementById("vendorPassword").value = "";
  document.getElementById("vendorStatus").value = "active";

  modal.show();
}

async function submitCreateVendor(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById("vendorName").value,
    email: document.getElementById("vendorEmail").value,
    domain: document.getElementById("vendorDomain").value,
    password: document.getElementById("vendorPassword").value,
    status: document.getElementById("vendorStatus").value
  };

  const res = await fetch(`${API_BASE}/vendors/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.detail || "Failed to create vendor");
    return;
  }

  bootstrap.Modal
    .getInstance(document.getElementById("createVendorModal"))
    .hide();

  loadVendors(); // refresh vendor list
}

/* ===================== DOCUMENTS ===================== */
async function loadDocuments() {
  const chatbotId = document.getElementById("documentChatbotSelect").value;
  const documentList = document.getElementById("documentList");
  documentList.innerHTML = ""; // Clear the list first

  // Only load documents if chatbot is selected
  if (!chatbotId) {
    return; 
  }

  try {
    const res = await fetch(`${API_BASE}/documents/specific_documents/${chatbotId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch documents");

    const docs = await res.json();

    docs.forEach(doc => {
      documentList.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <span>${doc.title}</span>
          <span class="badge bg-secondary">${doc.status}</span>
        </li>
      `;
    });
  } catch (error) {
    console.error("Error loading documents:", error);
    alert("Error loading documents: " + error.message);
  }
}

// Listen for file selection
document.getElementById("documentFiles").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  // Add new files, prevent duplicates
  files.forEach(f => {
    if (!selectedNewFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
      selectedNewFiles.push(f);
    }
  });

  renderSelectedFiles();
});

async function uploadDocuments() {
  const chatbotId = documentChatbotSelect.value;
  if (!chatbotId) return alert("Select a chatbot first");
  if (selectedNewFiles.length === 0) return alert("Select files to upload");

  const formData = new FormData();
  selectedNewFiles.forEach(f => formData.append("files", f));

  try {
    const res = await fetch(`${API_BASE}/documents/chatbots/${chatbotId}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      const err = await res.text();
      return alert("Upload failed: " + err);
    }

    alert("Upload successful");
    selectedNewFiles = [];
    document.getElementById("documentFiles").value = "";
    renderSelectedFiles();
    loadDocuments(); // Refresh document list
  } catch (error) {
    alert("Upload failed: " + error.message);
  }
}

// -------- MULTI-FILE FIX --------
// Render selected files with remove option
function renderSelectedFiles() {
  const preview = document.getElementById("selectedFilesPreview") || document.createElement("ul");
  preview.id = "selectedFilesPreview";
  preview.classList.add("list-group", "mb-2");
  preview.innerHTML = "";

  selectedNewFiles.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = file.name;

    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-danger";
    btn.textContent = "Remove";
    btn.addEventListener("click", () => {
      selectedNewFiles.splice(index, 1);
      renderSelectedFiles();
    });

    li.appendChild(btn);
    preview.appendChild(li);
  });

  // Append preview after file input if not already in DOM
  const container = document.getElementById("documentFiles").parentElement;
  if (!document.getElementById("selectedFilesPreview")) {
    container.appendChild(preview);
  }
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
        <div class="d-flex flex-column gap-1">
          <button class="btn btn-sm btn-warning-solid"
            onclick="openUpdateEmbeddingModal(${e.id}, '${e.model_name.replace(/'/g,"\\'")}', '${e.provider.replace(/'/g,"\\'")}', '${e.path?.replace(/'/g,"\\'") || ""}')">
            Update
          </button>
          <button class="btn btn-sm btn-danger-solid"
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
          <strong>${l.name}</strong>
          <small class="text-muted">Provider: ${l.provider} | Embedding: ${l.embedding?.model_name || "None"}</small>
        </div>
        <div class="d-flex flex-column gap-1">
          <button class="btn btn-sm btn-warning-solid"
            onclick="openUpdateLLMModal(${l.id}, '${l.name.replace(/'/g,"\\'")}', '${l.provider.replace(/'/g,"\\'")}', ${l.embedding_id}, ${l.def_token_limit}, ${l.def_context_limit}, '${(l.path||"").replace(/'/g,"\\'")}')">
            Update
          </button>
          <button class="btn btn-sm btn-danger-solid"
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

function openUpdateLLMModal(id, name, provider, embedding_id, token_limit, context_limit, path) {
  const modal = new bootstrap.Modal(document.getElementById("llmModal"));
  document.getElementById("llmModalTitle").innerText = "Update LLM";

  document.getElementById("llmId").value = id;
  document.getElementById("llmName").value = name;
  document.getElementById("llmProvider").value = provider;
  document.getElementById("llmTokenLimit").value = token_limit;
  document.getElementById("llmContextLimit").value = context_limit;
  document.getElementById("llmPath").value = path || "";

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

  const payload = {
    name,
    provider,
    embedding_id: Number(embedding_id),
    def_token_limit: Number(token_limit),
    def_context_limit: Number(context_limit),
    path: path || undefined
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
async function openProfile() {
  try {
    // Call the backend endpoint that returns current admin info from the token
    const res = await fetch(`${API_BASE}/admins/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) throw new Error("Failed to fetch admin data");

    const data = await res.json();

    document.getElementById("profileId").value = data.id;
    document.getElementById("profileName").value = data.name || "";
    document.getElementById("profileEmail").value = data.email || "";

    const modal = new bootstrap.Modal(document.getElementById("profileModal"));
    modal.show();
  } catch (err) {
    console.error(err);
    alert("Error loading profile data. Please log in again.");
  }
}

async function submitProfileForm(event) {
  event.preventDefault();

  const id = document.getElementById("profileId").value;
  const name = document.getElementById("profileName").value;
  const email = document.getElementById("profileEmail").value;

  try {
    const res = await fetch(`${API_BASE}/admins/edit/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ name, email })
    });

    if (!res.ok) throw new Error("Failed to update profile");

    const updatedAdmin = await res.json();

    // Optionally, update localStorage
    localStorage.setItem("admin", JSON.stringify(updatedAdmin));

    bootstrap.Modal.getInstance(document.getElementById("profileModal")).hide();
    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Error updating profile");
  }
}

function openPassword() {
  const modal = new bootstrap.Modal(document.getElementById("passwordModal"));
  document.getElementById("passwordForm").reset();
  modal.show();
}

async function submitPasswordForm(event) {
  event.preventDefault();
  
  const old_password = document.getElementById("currentPassword").value;
  const new_password = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;

  if (new_password !== confirmNewPassword) {
    alert("New passwords do not match");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admins/change-password`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ old_password, new_password })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "Failed to change password");
    }

    alert("Password changed successfully!");
    bootstrap.Modal.getInstance(document.getElementById("passwordModal")).hide();
  } catch (err) {
    console.error(err);
    alert(`Error: ${err.message}`);
  }
}

// Function to set active sidebar button
function setActiveSidebar(button) {
  // Remove active class from all sidebar buttons
  document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));

  // Add active class to the clicked button
  button.classList.add('active');
}

/* ===================== LOGOUT ===================== */
function logout() {
  localStorage.clear();
  window.location.href = "/";
}

function showAnalytics() {
  document.querySelectorAll(".section").forEach(s => s.classList.add("d-none"));
  document.getElementById("dashboard").classList.remove("d-none");

  loadDashboardStats(); // 🔥 NEW
  loadChatbots();       // Most used chatbot
  loadVendors();        // Vendor analytics
}
showAnalytics();
window.addEventListener("DOMContentLoaded", () => {
  const vendorDropdown = document.getElementById("chatbotVendorId");
  const chatbotDropdown = document.getElementById("documentChatbotSelect");

  if (vendorDropdown && chatbotDropdown) {
    vendorDropdown.addEventListener("change", loadDocuments);
    chatbotDropdown.addEventListener("change", loadDocuments);
  }
});

// ------------------ Sidebar Active State ------------------
document.querySelectorAll('.sidebar button').forEach(button => {
  button.addEventListener('click', () => {
    setActiveSidebar(button);
  });
});

