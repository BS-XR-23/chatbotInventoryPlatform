// Globals
window.activeChatbotId = null;
window.activeChatbotName = null;

function showSection(section) {
  // List of valid sections that actually exist in HTML
  const sections = [
    "dashboard",
    "chatbots",
    "vendors",
    "documents",
    "embeddings",
    "llms",
    "chatbotDetails" // correct ID from your HTML
  ];

  // Hide all first
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("d-none");
  });

  // Show the requested section
  const target = document.getElementById(section === "chatbotDetails" ? "chatbotDetails" : section);
  if (target) target.classList.remove("d-none");

  // Chat bubble + window behavior
  const chatBubble = document.getElementById("chatBubble");
  const chatWindow = document.getElementById("chatWindow");

  if (section === "chatbotDetails") {
    if (chatBubble) chatBubble.style.display = "flex"; // enable bubble
  } else {
    if (chatBubble) chatBubble.style.display = "none"; // hide bubble
    if (chatWindow) chatWindow.style.display = "none"; // ensure closed
  }

  // Load lists depending on where we are
  if (section === "chatbots") loadChatbots();
  else if (section === "vendors") loadVendors();
  else if (section === "documents") loadDocuments();
  else if (section === "embeddings") loadEmbeddings();
  else if (section === "llms") loadLLMs();
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

/* ===================== SHOW CHATBOT DETAILS ===================== */
async function showChatbotDetails(chatbotId) {
  showSection("chatbotDetails");

  try {
    const res = await fetch(`${API_BASE}/chatbots/role-based-stats/${chatbotId}/${role}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to fetch chatbot details");
    }
    const data = await res.json();
    // Store globally
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
        <p><strong>Created At:</strong> ${new Date(data.created_at).toLocaleString()}</p>

        <h5 class="mt-4">📄 Documents</h5>
        <div id="chatbotDocumentsContainer">Loading documents...</div>

        <button class="btn btn-secondary mt-3" onclick="showSection('chatbots')">Back</button>
      </div>
    `;

    // Set up chat bubble to open chat window for this chatbot
    document.getElementById("chatBubble").onclick = () => openChat(chatbotId, data.name);

    // Set current chatbot
    window.currentChatbotId = chatbotId;

    // Load chatbot documents
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
            ${doc.title || "Unnamed Document"}
            <span class="badge bg-primary">${new Date(doc.created_at).toLocaleDateString()}</span>
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

// Initialize chat UI on page load
// document.addEventListener("DOMContentLoaded", initChatUI);
