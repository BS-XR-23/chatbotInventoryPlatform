// const API_BASE = "http://127.0.0.1:9000";
const API_BASE = "";
const token = localStorage.getItem("access_token");
const currentVendor = JSON.parse(localStorage.getItem("vendor") || "{}");
const role = localStorage.getItem("role");

// ================= GLOBAL FILE STATE =================
let selectedNewFiles = [];
let llmMap = {};
let selectedDetailFiles = [];
let currentChatbotId = null;

// ------------------ Section Control ------------------
function showSection(section) {
  // Hide all sections including chatbot details
  [
    "analyticsSection", 
    "chatbotsSection", 
    "documentsSection",
    "apiTokensSection", 
    "profileSection",
    "chatbotDetailsSection"
  ].forEach(id => document.getElementById(id).classList.add("d-none"));

  // Show the selected section
  document.getElementById(section + "Section").classList.remove("d-none");

  // Handle chat bubble visibility
  const chatBubble = document.getElementById("chatBubble");
  const chatWindow = document.getElementById("chatWindow");

  if (section === "chatbotDetails") {
    if (chatBubble) chatBubble.style.display = "flex";  // show bubble
  } else {
    if (chatBubble) chatBubble.style.display = "none";  // hide bubble
    if (chatWindow) chatWindow.style.display = "none";  // hide chat window
  }
}



async function showMainDashboard() {
  showSection("analytics");
  await loadVendorUsers();
  await loadAnalytics();
}

// ------------------ Logout ------------------
function logout() {
  localStorage.clear();
  window.location.href = "/";
}

function showProfileForm() {
  showSection("profile");
  vendorName.value = currentVendor.name || "";
  vendorEmail.value = currentVendor.email || "";
  vendorDomain.value = currentVendor.domain || "";  // added domain
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
      email: vendorEmail.value,
      domain: vendorDomain.value   // added domain
    })
  });
  alert("Profile updated");
}


// Show the modal
function showChangePasswordModal() {
  const modalEl = document.getElementById('changePasswordModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// Submit password change
async function submitChangePassword() {
  const current = currentPassword.value;
  const newPass = newPassword.value;
  const confirm = confirmNewPassword.value;

  if (!current || !newPass || !confirm) return alert("Please fill all fields");

  if (newPass !== confirm) return alert("New password and confirmation do not match");

  try {
    const res = await fetch(`${API_BASE}/vendors/change-password`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ current_password: current, new_password: newPass })
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.detail || "Failed to change password");
    }

    alert(data.message);
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
    // Logout after password change
    logout();

  } catch (err) {
    alert("Error: " + err.message);
  }
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
  const chatbotList = document.getElementById("chatbotList");
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
        <td>
          <button class="btn btn-sm btn-info" onclick="showChatbotDetails(${b.id})">Details</button>
        </td>
      </tr>`;
  });
}

// ------------------ Chatbot Details ------------------
async function showChatbotDetails(chatbotId) {
  currentChatbotId = chatbotId; // Save current chatbot globally
  showSection("chatbotDetails");

  // ------------------ Fetch chatbot details ------------------
  const res = await fetch(`${API_BASE}/chatbots/role-based-stats/${chatbotId}/vendor`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  document.getElementById("detailsChatbotName").innerText = data.name;
  document.getElementById("detailsChatbotStatus").innerText = data.is_active ? "Active" : "Inactive";
  document.getElementById("detailsChatbotCreatedAt").innerText = new Date(data.created_at).toLocaleString();
  document.getElementById("detailsChatbotDescription").innerText = data.description || "";
  document.getElementById("detailsChatbotSystemPrompt").innerText = data.system_prompt || "";

  // ------------------ Fetch API token for this chatbot ------------------
  let tokenHash = "";
  try {
    const keysRes = await fetch(`${API_BASE}/api-keys/list_of_keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const keysData = await keysRes.json();
    console.log("API Keys response:", keysData);

    const keys = Array.isArray(keysData) ? keysData : [];
    const keyForThisChatbot = keys.find(k => k.chatbot_id === chatbotId);
    if (keyForThisChatbot) {
      tokenHash = keyForThisChatbot.token_hash;
    }
  } catch (err) {
    console.error("Failed to fetch API token:", err);
  }

  // ------------------ Widget script (shown as text, not executed) ------------------
  const widgetScript = `<script 
    src="https://mhz-sarah-enjoy-citysearch.trycloudflare.com/static/widget.js" 
    data-chatbot="${data.id}" 
    data-chatbot-name="${data.name}" 
    data-chatbot-token="${tokenHash}">
  </script>`;

  // Show the script in the <pre> without executing
  const widgetContainer = document.getElementById("detailsChatbotWidget");
  widgetContainer.textContent = widgetScript;

  // ------------------ Style the widget container for black background & white text ------------------
  const widgetWrapper = document.getElementById("detailsChatbotWidgetContainer");
  widgetWrapper.style.backgroundColor = "#1e1e1e";
  widgetWrapper.style.position = "relative";
  widgetContainer.style.color = "#ffffff";
  widgetContainer.style.whiteSpace = "pre-wrap";
  widgetContainer.style.marginTop = "35px"; // leaves space for copy button

  // ------------------ Add Copy Button at top-right ------------------
  let copyBtn = document.getElementById("copyWidgetBtn");
  if (!copyBtn) {
    copyBtn = document.createElement("button");
    copyBtn.id = "copyWidgetBtn";
    copyBtn.innerText = "Copy";
    copyBtn.className = "btn btn-sm btn-outline-light position-absolute";
    copyBtn.style.top = "10px";
    copyBtn.style.right = "10px";
    widgetWrapper.appendChild(copyBtn);
  }

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(widgetScript)
      .then(() => alert("Widget snippet copied to clipboard!"))
      .catch(err => alert("Failed to copy snippet: " + err));
  };

  // ------------------ Chat bubble click ------------------
  document.getElementById("chatBubble").onclick = () => openChat(chatbotId, data.name);

  // ------------------ Load chatbot documents ------------------
  await loadChatbotDocuments(chatbotId);
}


async function loadChatbotDocuments(chatbotId) {
  const container = document.getElementById("chatbotDocumentsContainer");
  if (!container) return; // Safety check
  container.innerHTML = "Loading documents...";

  try {
    const res = await fetch(`${API_BASE}/documents/chatbots_documents/${chatbotId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const docs = await res.json();

    if (!docs.length) {
      container.innerHTML = "<p>No documents found for this chatbot.</p>";
      return;
    }

    // Display document title, status, and created_at (vertically aligned on right)
    container.innerHTML = `<ul class="list-group">
      ${docs.map(doc => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div><strong>${doc.title}</strong></div>
          <div class="text-end">
            <span class="badge bg-${doc.status === "processing" ? "warning" : doc.status === "active" ? "success" : "secondary"} mb-1">
              ${doc.status}
            </span><br>
            <small class="text-muted">${doc.created_at ? new Date(doc.created_at).toLocaleString() : ""}</small>
          </div>
        </li>
      `).join("")}
    </ul>`;

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red;'>Failed to load documents.</p>";
  }
}


// ------------------ ChatbotsDetails Document Upload ------------------

// Render selected files in details page
function renderDetailSelectedFiles() {
  const preview = document.getElementById("selectedFilesPreviewDetail");
  preview.innerHTML = "";

  selectedDetailFiles.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = file.name;

    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-danger";
    btn.textContent = "Remove";
    btn.onclick = () => {
      selectedDetailFiles.splice(index, 1);
      renderDetailSelectedFiles();
    };

    li.appendChild(btn);
    preview.appendChild(li);
  });
}

async function uploadDocumentsForDetail() {
  if (!currentChatbotId) return alert("No chatbot selected"); // >>> CHANGE/ADDED: uses global chatbot ID
  if (selectedDetailFiles.length === 0) return alert("Select files to upload");

  const formData = new FormData();
  selectedDetailFiles.forEach(f => formData.append("files", f));

  try {
    const res = await fetch(`${API_BASE}/documents/chatbots/${currentChatbotId}/documents`, { // >>> CHANGE/ADDED
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      const err = await res.text();
      return alert("Upload failed: " + err);
    }

    alert("Upload successful!");
    selectedDetailFiles = [];
    document.getElementById("documentFilesDetail").value = "";
    renderDetailSelectedFiles();
    loadChatbotDocuments(currentChatbotId); // >>> CHANGE/ADDED
  } catch (err) {
    alert("Upload failed: " + err.message);
  }
}





// Open Chat
function openChat(chatbotId, chatbotName) {
  const chatWindow = document.getElementById("chatWindow");
  chatWindow.style.display = "flex";

  document.getElementById("chatHeaderName").innerText = chatbotName;
  document.getElementById("chatMessages").innerHTML = "";
  document.getElementById("chatInput").value = "";
  currentChatbotId = chatbotId; // >>> CHANGE/ADDED
}

// Close Chat
function closeChat() {
  document.getElementById("chatWindow").style.display = "none";
}

// Send Message
let sessionId = null; // store session_id for multi-turn conversation

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const chatMessages = document.getElementById("chatMessages");

  // --- Display user message ---
  const userMsgDiv = document.createElement("div");
  userMsgDiv.classList.add("chat-message", "user");
  userMsgDiv.innerHTML = `<strong>User:</strong> ${message}`;
  chatMessages.appendChild(userMsgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  input.value = "";
  input.disabled = true;

  try {
    // Build request body
    const body = { question: message };
    if (sessionId) body.session_id = sessionId;

    // Send request to multi-turn backend
    const res = await fetch(`${API_BASE}/chatbots/${currentChatbotId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Optional: only send token if logged in
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("Failed to get response from chatbot");
    const data = await res.json();

    // --- Save session_id for next messages ---
    if (!sessionId && data.session_id) {
      sessionId = data.session_id;
    }
    // --- Display bot response ---
    const botMsgDiv = document.createElement("div");
    botMsgDiv.classList.add("chat-message", "bot");
    botMsgDiv.innerHTML = `<strong>Bot:</strong> ${data.answer}`;
    chatMessages.appendChild(botMsgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

  } catch (err) {
    const errDiv = document.createElement("div");
    errDiv.classList.add("chat-message", "bot");
    errDiv.innerHTML = `<strong>Bot:</strong> Error: ${err.message}`;
    chatMessages.appendChild(errDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } finally {
    input.disabled = false;
    input.focus();
  }
}


// ------------------ Documents ------------------
async function loadDocuments() {
  showSection("documents");
  selectedNewFiles = [];
  selectedFilesPreview.innerHTML = "";
  documentList.innerHTML = "";
  documentChatbotSelect.innerHTML = "";

  // Load chatbots into dropdown
  const botRes = await fetch(`${API_BASE}/chatbots/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const bots = await botRes.json();

  bots.forEach(b => {
    documentChatbotSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
  });

  // Auto-load documents for the first chatbot
  if (bots.length > 0) {
    loadDocumentsForChatbot(bots[0].id);
  }
}

async function loadDocumentsForChatbot(chatbotId) {
  documentList.innerHTML = "";

  const docRes = await fetch(`${API_BASE}/documents/specific_documents/${chatbotId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const docs = await docRes.json();
  console.log("Docs response:", docs);

  // Protect against invalid response
  if (!Array.isArray(docs)) {
    documentList.innerHTML = `<li class="list-group-item text-danger">No documents found for this chatbot.</li>`;
    return;
  }

  // Render documents
  docs.forEach(d => {
    let statusBadge = "";
    switch (d.status) {
      case "processing": statusBadge = '<span class="badge bg-warning text-dark">Processing</span>'; break;
      case "embedded": statusBadge = '<span class="badge bg-success">Embedded</span>'; break;
      case "processing_failed": statusBadge = '<span class="badge bg-danger">Failed</span>'; break;
      default: statusBadge = '<span class="badge bg-secondary">Unknown</span>';
    }

    documentList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-start">
        <div>${d.title}</div>
        <div class="d-flex flex-column align-items-end">
          <span class="mb-1">${statusBadge}</span>
          <button class="btn btn-sm btn-danger" onclick="deleteDocument(${d.id}, this)">Delete</button>
        </div>
      </li>`;
  });
}

// Reload documents when chatbot is changed
documentChatbotSelect.addEventListener("change", (e) => {
  loadDocumentsForChatbot(e.target.value);
});


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
  
  selectedNewFiles.forEach((f, index) => {
    const li = document.createElement("li");
    li.className = "d-flex justify-content-between align-items-center mb-1";

    li.innerHTML = `
      <span>${f.name}</span>
      <button type="button" class="btn btn-sm btn-outline-danger btn-close" aria-label="Remove"></button>
    `;

    // Remove file on button click
    li.querySelector("button").addEventListener("click", () => {
      selectedNewFiles.splice(index, 1);
      renderSelectedFiles();
    });

    selectedFilesPreview.appendChild(li);
  });
}


// ------------------ Upload ------------------
async function uploadDocuments() {
  if (!selectedNewFiles.length) return alert("Select files first");

  const chatbotId = documentChatbotSelect.value;
  if (!chatbotId) return alert("Select a chatbot first");

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

    loadDocuments();

    // Clear selected files and update preview
    selectedNewFiles = [];
    renderSelectedFiles();

  } catch (error) {
    alert("Upload failed: " + error.message);
  }
}



// ------------------ Delete Document ------------------
async function deleteDocument(id, btn) {
  await fetch(`${API_BASE}/documents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  btn.closest("li").remove();
}

// ------------------ API Tokens ------------------
async function loadAPITokens() {
  showSection("apiTokens"); // Show the API Tokens section

  const container = document.getElementById("apiTokensList");
  container.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  try {
    // Fetch API keys for this vendor
    const res = await fetch(`${API_BASE}/api-keys/list_of_keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const keys = await res.json();

    if (!keys.length) {
      container.innerHTML = "<tr><td colspan='5'>No API tokens found</td></tr>";
      return;
    }

    // Fetch all chatbots to map chatbot_id -> chatbot name
    const botsRes = await fetch(`${API_BASE}/chatbots/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bots = await botsRes.json();
    const chatbotMap = {};
    bots.forEach(b => chatbotMap[b.id] = b.name);

    // Render table rows
    container.innerHTML = keys.map(k => `
      <tr>
        <td>${chatbotMap[k.chatbot_id] || "N/A"}</td>
        <td>${k.vendor_domain}</td>
        <td>
          <input type="text" class="form-control form-control-sm" value="${k.token_hash}" readonly>
          <button 
            class="btn btn-sm btn-outline-primary mt-1" 
            onclick="
              const btn = this;
              navigator.clipboard.writeText('${k.token_hash}').then(() => {
                const original = btn.textContent;
                btn.textContent = 'Copied';
                setTimeout(() => btn.textContent = original, 1500);
              });
            "
          >
            Copy
          </button>
        </td>
        <td>${k.status}</td>
        <td>${new Date(k.created_at).toLocaleString()}</td>
      </tr>
    `).join("");

    // Add copy functionality to all buttons

  } catch (err) {
    console.error(err);
    container.innerHTML = "<tr><td colspan='5' style='color:red;'>Failed to load API tokens</td></tr>";
  }
}

// Show the modal and populate chatbot dropdown
async function showCreateApiTokenModal() {
  // Fetch chatbots for this vendor
  const select = document.getElementById("apiChatbotSelect");
  select.innerHTML = "<option value=''>Loading...</option>";

  try {
    const res = await fetch(`${API_BASE}/chatbots/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bots = await res.json();

    select.innerHTML = ""; // clear

    bots.forEach(b => {
      const option = document.createElement("option");
      option.value = b.id;
      option.textContent = b.name;
      select.appendChild(option);
    });

    // Set vendor domain field
    document.getElementById("apiVendorDomain").value = currentVendor.domain || "";

    // Show modal
    const modalEl = document.getElementById("createApiTokenModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

  } catch (err) {
    alert("Failed to load chatbots: " + err.message);
  }
}

// Submit form to create API token
async function submitCreateApiToken(event) {
  event.preventDefault();

  const chatbotId = parseInt(document.getElementById("apiChatbotSelect").value);
  const vendorDomain = document.getElementById("apiVendorDomain").value.trim();

  if (!chatbotId || !vendorDomain) return alert("Fill all fields");

  // Include vendor_id from the current logged-in vendor
  const payload = {
    vendor_id: currentVendor.id,  // << Added this
    chatbot_id: chatbotId,
    vendor_domain: vendorDomain
  };

  try {
    const res = await fetch(`${API_BASE}/api-keys/create_api_key`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(payload) // << send complete payload
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || JSON.stringify(errData));
    }

    const data = await res.json();
    alert(`API Token created!\nToken: ${data.token}`);

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById("createApiTokenModal")).hide();

    // Reload API tokens table
    loadAPITokens();

  } catch (err) {
    alert("Error: " + err.message);
  }
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

  // ---------------- User Token Cards ----------------
  const userCard = document.getElementById("userAnalyticsCard");
  const userContent = document.getElementById("userAnalyticsContent");

  if (userId) {
    userContent.innerHTML = "";

    const userEndpoints = [
      ["Tokens Last 7 Days", `/vendors/user/${userId}/tokens-last7`, "tokens_last_7_days"],
      ["Total Tokens", `/vendors/user/${userId}/tokens-total`, "total_tokens"]
    ];

    for (let [title, url, key] of userEndpoints) {
      const card = document.createElement("div");
      card.className = "analytics-card card p-3 shadow-sm mb-2";

      try {
        const res = await fetch(API_BASE + url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();

        // Extract the number from response
        const value = (typeof data === "number") ? data : data[key] ?? 0;

        card.innerHTML = `<h6>${title}</h6><p class="fs-4 mt-2">${value}</p>`;
      } catch {
        card.innerHTML = `<h6>${title}</h6><p class="text-danger">Failed to load data</p>`;
      }

      userContent.appendChild(card);
    }
  } else {
    userContent.innerHTML = `<p>Select a user to see token stats</p>`;
  }
  // ---------------- All-users Analytics Cards ----------------
  const endpoints = [
    ["Top Chatbots by Messages", "/vendors/top-chatbots/messages", ["Chatbot", "Messages"], ["chatbot_name", "message_count"]],
    ["Top Chatbots by Users", "/vendors/top-chatbots/users", ["Chatbot", "Unique Users"], ["chatbot_name", "unique_users"]],
    ["Daily Messages", "/vendors/daily/messages", ["Day", "Chatbot", "Messages"], ["day", "chatbot_name", "messages"]],
    ["Daily Unique Users", "/vendors/daily/unique-users", ["Day", "Chatbot", "Unique Users"], ["day", "chatbot_name", "unique_users"]]
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const [title, url, headersArr, keysArr] = endpoints[i];
    const card = document.createElement("div");
    card.className = `analytics-card card p-3 shadow-sm`;

    try {
      const res = await fetch(API_BASE + url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();

      let html = `<h6>${title}</h6>`;

      if (Array.isArray(data) && data.length) {
        html += `<table class="table table-sm mt-2">
                  <thead><tr>${headersArr.map(h => `<th>${h}</th>`).join("")}</tr></thead>
                  <tbody>
                    ${data.map(row => `<tr>${keysArr.map(k => `<td>${row[k]}</td>`).join("")}</tr>`).join("")}
                  </tbody>
                 </table>`;
      } else {
        html += `<p class="text-muted mt-2">No data available</p>`;
      }

      card.innerHTML = html;
    } catch {
      card.innerHTML = `<h6>${title}</h6><p class="text-danger">Failed to load data</p>`;
    }

    analyticsList.appendChild(card);
  }
}

// Function to set active sidebar button
function setActiveSidebar(button) {
  // Remove active class from all sidebar buttons
  document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));

  // Add active class to the clicked button
  button.classList.add('active');
}

// ---------------- Event Listener ----------------
analyticsUserSelect.addEventListener("change", loadAnalytics);
document.addEventListener("DOMContentLoaded", showMainDashboard);
// ------------------ Sidebar Active State ------------------
document.querySelectorAll('.sidebar button').forEach(button => {
  button.addEventListener('click', () => {
    setActiveSidebar(button);
  });
});




