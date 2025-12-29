const API_BASE = "http://127.0.0.1:9000";
const token = localStorage.getItem("access_token");
const currentVendor = JSON.parse(localStorage.getItem("vendor") || "{}");
const role = localStorage.getItem("role");

// ================= GLOBAL FILE STATE =================
let selectedNewFiles = [];
let llmMap = {};

// ------------------ Section Control ------------------
// ------------------ Section Control ------------------
// ------------------ Section Control ------------------
function showSection(section) {
  // Hide all sections including chatbot details
  [
    "analyticsSection", 
    "chatbotsSection", 
    "documentsSection", 
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
  window.location.href = "/index.html";
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
        <td>${b.mode}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="showChatbotDetails(${b.id})">Details</button>
        </td>
      </tr>`;
  });
}

// Show chatbot details
async function showChatbotDetails(chatbotId) {
  showSection("chatbotDetails");

  // Fetch Chatbot Details
  const res = await fetch(`${API_BASE}/chatbots/role-based-stats/${chatbotId}/vendor`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  document.getElementById("detailsChatbotName").innerText = data.name;
  document.getElementById("detailsChatbotStatus").innerText = data.is_active ? "Active" : "Inactive";
  document.getElementById("detailsChatbotCreatedAt").innerText = new Date(data.created_at).toLocaleString();
  document.getElementById("detailsChatbotDescription").innerText = data.description || "";
  document.getElementById("detailsChatbotSystemPrompt").innerText = data.system_prompt || "";

  // Chat bubble setup
  document.getElementById("chatBubble").onclick = () => openChat(chatbotId, data.name);

  // Fetch & Display Documents
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

    // Display document titles
    container.innerHTML = `<ul class="list-group">
      ${docs.map(doc => `<li class="list-group-item">${doc.title}</li>`).join("")}
    </ul>`;

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red;'>Failed to load documents.</p>";
  }
}



// Open Chat
function openChat(chatbotId, chatbotName) {
  const chatWindow = document.getElementById("chatWindow");
  chatWindow.style.display = "flex";

  document.getElementById("chatHeaderName").innerText = chatbotName;
  document.getElementById("chatMessages").innerHTML = "";
  document.getElementById("chatInput").value = "";

  window.currentChatbotId = chatbotId;
}

// Close Chat
function closeChat() {
  document.getElementById("chatWindow").style.display = "none";
}

// Send Message
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML += `<div class="chat-message user">${message}</div>`;
  input.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/chatbots/${window.currentChatbotId}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ question: message })
    });

    if (!res.ok) throw new Error("Failed to get response from chatbot");

    const data = await res.json();

    chatMessages.innerHTML += `<div class="chat-message bot">${data.answer}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

  } catch (err) {
    chatMessages.innerHTML += `<div class="chat-message bot">Error: ${err.message}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
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
    // Map enum to badge
    let statusBadge = '';
    switch(d.status) {
      case 'processing':
        statusBadge = '<span class="badge bg-warning text-dark">Processing</span>';
        break;
      case 'embedded':
        statusBadge = '<span class="badge bg-success">Embedded</span>';
        break;
      case 'processing_failed':
        statusBadge = '<span class="badge bg-danger">Failed</span>';
        break;
      default:
        statusBadge = '<span class="badge bg-secondary">Unknown</span>';
    }

    documentList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-start">
        <!-- Left: Title -->
        <div>${d.title}</div>

        <!-- Right: Status + Delete vertically -->
        <div class="d-flex flex-column align-items-end">
          <span class="mb-1">${statusBadge}</span>
          <button class="btn btn-sm btn-danger" onclick="deleteDocument(${d.id}, this)">Delete</button>
        </div>
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

    // Refresh documents list
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

// ---------------- Event Listener ----------------
analyticsUserSelect.addEventListener("change", loadAnalytics);
document.addEventListener("DOMContentLoaded", showMainDashboard);



