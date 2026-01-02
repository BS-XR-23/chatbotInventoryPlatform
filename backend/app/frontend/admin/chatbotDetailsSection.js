// Globals
window.activeChatbotId = null;
window.activeChatbotName = null;
let selectedDetailFiles = [];

function showSection(section) {
  // All possible sections including dashboard
  const sections = [
    "dashboard",
    "chatbots",
    "vendors",
    "documents",
    "embeddings",
    "llms",
    "chatbotDetails"
  ];

  // Hide all sections
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("d-none");
  });

  // Show the requested section
  const target = document.getElementById(section);
  if (target) target.classList.remove("d-none");

  // Chat bubble & window references
  const chatBubble = document.getElementById("chatBubble");
  const chatWindow = document.getElementById("chatWindow");

  // Always hide chat bubble & window first
  if (chatBubble) chatBubble.style.display = "none";
  if (chatWindow) chatWindow.style.display = "none";

  // Only show chat bubble if we're in chatbotDetails
  if (section === "chatbotDetails" && chatBubble) {
    chatBubble.style.display = "flex";
  }

  // Load dynamic content depending on section
  switch(section) {
    case "dashboard":
      loadAnalytics();
      break;
    case "chatbots":
      loadChatbots();
      break;
    case "vendors":
      loadVendors();
      break;
    case "documents":
      loadDocuments();
      break;
    case "embeddings":
      loadEmbeddings();
      break;
    case "llms":
      loadLLMs();
      break;
  }
}


function openChat(chatbotId, chatbotName) {
  const chatWindow = document.getElementById("chatWindow");
  chatWindow.style.display = "flex";

  // Set active chatbot name in header
  document.getElementById("chatHeaderName").innerText = chatbotName;

  // Clear previous messages & input
  document.getElementById("chatMessages").innerHTML = "";
  document.getElementById("chatInput").value = "";

  window.currentChatbotId = chatbotId;
  window.currentChatbotName = chatbotName;
}

function closeChat() {
  document.getElementById("chatWindow").style.display = "none";
}

// ===================== SHOW CHATBOT DETAILS =====================
async function showChatbotDetails(chatbotId) {
  showSection("chatbotDetails");

  try {
    const res = await fetch(`${API_BASE}/chatbots/role-based-stats/${chatbotId}/${role}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to fetch chatbot details");
    }
    const data = await res.json();

    window.activeChatbotId = chatbotId;
    window.activeChatbotName = data.name;

    const container = document.getElementById("chatbotDetailsContainer");
    container.innerHTML = `
      <div class="card shadow-sm p-3 mb-3">
        <h3 class="card-title">${data.name}</h3>
        <p><strong>Vendor:</strong> ${data.vendor?.name || "N/A"}</p>
        <p><strong>Description:</strong> ${data.description || "N/A"}</p>
        <p><strong>System Prompt:</strong>
          <pre class="text-muted">${data.system_prompt || "N/A"}</pre>
        </p>
        <p><strong>LLM:</strong> ${data.llm?.name || "N/A"}</p>
        <p><strong>Status:</strong>
          <span class="badge bg-${data.is_active ? "success" : "secondary"}">
            ${data.is_active ? "Active" : "Inactive"}
          </span>
        </p>
        <p><strong>Vector Store Type:</strong> ${data.vector_store_type || "N/A"}</p>

        <h5 class="mt-4">📄 Documents</h5>
        <div id="chatbotDocumentsContainer">Loading documents...</div>

        <!-- Upload documents in details page -->
        <div class="mt-3">
          <label for="documentFilesDetail" class="form-label">Upload Documents</label>
          <input type="file" id="documentFilesDetail" class="form-control" multiple
            onchange="Array.from(this.files).forEach(f => {
              if(!selectedDetailFiles.some(x => x.name === f.name)) selectedDetailFiles.push(f);
              renderDetailSelectedFiles();
            })">
          <ul id="selectedFilesPreviewDetail" class="list-group mt-2 mb-2"></ul>
          <button class="btn btn-primary" onclick="uploadDocumentsForDetail(${chatbotId})">Upload</button>
        </div>

        <button class="btn btn-secondary mt-3" onclick="showSection('chatbots')">Back</button>
      </div>
    `;

    document.getElementById("chatBubble").onclick = () => openChat(chatbotId, data.name);
    window.currentChatbotId = chatbotId;

    // Load documents
    loadChatbotDocuments(chatbotId);

  } catch (err) {
    console.error(err);
    alert("Failed to load chatbot details.");
  }
}

/* ===================== LOAD CHATBOT DOCUMENTS ===================== */
async function loadChatbotDocuments(chatbotId) {
  const docsContainer = document.getElementById("chatbotDocumentsContainer");

  try {
    const res = await fetch(`${API_BASE}/documents/chatbots_documents/${chatbotId}`, { headers });
    if (!res.ok) {
      docsContainer.innerHTML = `<p class="text-danger">No documents found.</p>`;
      return;
    }

    const documents = await res.json();

    if (!documents.length) {
      docsContainer.innerHTML = `<p class="text-muted">No documents available.</p>`;
      return;
    }

    docsContainer.innerHTML = `
      <ul class="list-group">
        ${documents.map(doc => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>${doc.title || "Unnamed Document"}</div>
            <div class="text-end">
              <span class="badge bg-${doc.status === "processing" ? "warning" : doc.status === "active" ? "success" : "secondary"} mb-1">
                ${doc.status}
              </span><br>
              <small class="text-muted">${doc.created_at ? new Date(doc.created_at).toLocaleString() : ""}</small>
            </div>
          </li>
        `).join("")}
      </ul>
    `;

  } catch (error) {
    docsContainer.innerHTML = `<p class="text-danger">Error loading documents.</p>`;
    console.error(error);
  }
}


/* ===================== SEND MESSAGE ===================== */
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML += `<div class="chat-message user">${message}</div>`;
  input.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/chatbots/${window.currentChatbotId}/test_chatbot`, {
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

// ===================== RENDER SELECTED FILES =====================
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
    btn.addEventListener("click", () => {
      selectedDetailFiles.splice(index, 1);
      renderDetailSelectedFiles();
    });

    li.appendChild(btn);
    preview.appendChild(li);
  });
}

// ===================== UPLOAD DOCUMENTS FOR DETAIL =====================
async function uploadDocumentsForDetail(chatbotId) {
  if (!chatbotId) return alert("Invalid chatbot");
  if (selectedDetailFiles.length === 0) return alert("Select files to upload");

  const formData = new FormData();
  selectedDetailFiles.forEach(f => formData.append("files", f));

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

    selectedDetailFiles = [];
    document.getElementById("documentFilesDetail").value = "";
    renderDetailSelectedFiles();

    loadChatbotDocuments(chatbotId); // refresh documents list

  } catch (error) {
    alert("Upload failed: " + error.message);
  }
}
