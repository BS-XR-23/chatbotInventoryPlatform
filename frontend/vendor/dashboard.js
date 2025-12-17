const API_BASE = "http://127.0.0.1:9000";
const token = localStorage.getItem("access_token");
const currentVendor = JSON.parse(localStorage.getItem("vendor"));

// ------------------ Section Switching ------------------
function showSection(section) {
  ["chatbotsSection", "documentsSection", "chatSection"].forEach(id => {
    document.getElementById(id).classList.add("d-none");
  });
  document.getElementById(section + "Section").classList.remove("d-none");
}

// ------------------ Logout ------------------
function logout() {
  localStorage.clear();
  window.location.href = "/index.html";
}

// ================== Chatbots ==================
async function loadChatbots() {
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
      li.textContent = bot.name;
      li.innerHTML += `
        <div>
          <button class="btn btn-sm btn-warning me-1" onclick="editChatbot('${bot.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteChatbot('${bot.id}')">Delete</button>
        </div>`;
      list.appendChild(li);
    });

    // populate chat select
    const chatSelect = document.getElementById("chatbotSelect");
    chatSelect.innerHTML = "";
    chatbots.forEach(bot => {
      const opt = document.createElement("option");
      opt.value = bot.id;
      opt.textContent = bot.name;
      chatSelect.appendChild(opt);
    });
  } catch (err) {
    list.innerHTML = "Failed to load chatbots";
    console.error(err);
  }
}

// ------------------ Modal Form ------------------
function showAddChatbotModal() {
  const modal = document.getElementById("chatbotModal");
  modal.dataset.chatbotId = "";
  ["chatbotId","chatbotName","chatbotDescription","systemPrompt","llmSelect","llmPath","mode","isActive"].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    if(el.type === "checkbox") el.checked = true;
    else if(el.tagName === "SELECT") el.value = "private";
    else el.value = "";
  });

  const selectedFilesContainer = document.getElementById("selectedFiles");
  selectedFilesContainer.innerHTML = "";
  document.getElementById("docFile").value = "";

  new bootstrap.Modal(modal).show();
}

// ------------------ Edit Chatbot ------------------
async function editChatbot(id) {
  try {
    const res = await fetch(`${API_BASE}/chatbots/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bot = await res.json();

    document.getElementById("chatbotId").value = bot.id;
    document.getElementById("chatbotName").value = bot.name;
    document.getElementById("chatbotDescription").value = bot.description;
    document.getElementById("systemPrompt").value = bot.system_prompt;
    document.getElementById("llmSelect").value = bot.llm_id;
    document.getElementById("llmPath").value = bot.llm_path;
    document.getElementById("mode").value = bot.mode;
    document.getElementById("isActive").checked = bot.is_active;

    // Load existing documents
    const docContainer = document.getElementById("selectedFiles");
    docContainer.innerHTML = "Loading documents...";
    const docsRes = await fetch(`${API_BASE}/documents/?chatbot_id=${bot.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const docs = await docsRes.json();
    docContainer.innerHTML = "";
    (Array.isArray(docs) ? docs : docs.results || []).forEach(doc => {
      const div = document.createElement("div");
      div.className = "d-flex justify-content-between align-items-center mb-1";
      div.innerHTML = `
        <span>${doc.title} (${doc.status})</span>
        <button class="btn btn-sm btn-danger" onclick="deleteDocument('${doc.id}', this)">Delete</button>`;
      docContainer.appendChild(div);
    });

    new bootstrap.Modal(document.getElementById("chatbotModal")).show();
  } catch(err) {
    console.error(err);
    alert("Failed to load chatbot");
  }
}

// ------------------ Save Chatbot & Documents ------------------
async function saveChatbotWithDocument() {
  const id = document.getElementById("chatbotId").value;
  const formData = new FormData();
  formData.append("name", document.getElementById("chatbotName").value);
  formData.append("description", document.getElementById("chatbotDescription").value);
  formData.append("llm_id", document.getElementById("llmSelect").value);
  formData.append("llm_path", document.getElementById("llmPath").value);
  formData.append("token_limit", 4000);
  formData.append("context_limit", 2000);

  const fileInput = document.getElementById("docFile");
  if(fileInput.files.length > 0){
    for(let f of fileInput.files){
      formData.append("files", f);
    }
  }

  const endpoint = id ? `${API_BASE}/chatbots/${id}` : `${API_BASE}/chatbots/create`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const bot = await res.json();

    alert("Chatbot and documents saved successfully!");
    loadChatbots();
    bootstrap.Modal.getInstance(document.getElementById("chatbotModal")).hide();
  } catch(err){
    console.error(err);
    alert("Failed to save chatbot and/or documents");
  }
}

// ------------------ Delete ------------------
async function deleteChatbot(id){
  if(!confirm("Delete this chatbot?")) return;
  try{
    await fetch(`${API_BASE}/chatbots/${id}`,{
      method:"DELETE",
      headers:{Authorization:`Bearer ${token}`}
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
      headers:{Authorization:`Bearer ${token}`}
    });
    btn.parentElement.remove();
  }catch(err){
    console.error(err);
    alert("Failed to delete document");
  }
}

// ------------------ Live Chat ------------------
async function initChat(){
  const select = document.getElementById("chatbotSelect");
  select.innerHTML = "";
  try{
    const res = await fetch(`${API_BASE}/chatbots/`,{
      headers:{Authorization:`Bearer ${token}`}
    });
    const chatbots = await res.json();
    (Array.isArray(chatbots) ? chatbots : chatbots.results || []).forEach(bot=>{
      const opt = document.createElement("option");
      opt.value = bot.id;
      opt.textContent = bot.name;
      select.appendChild(opt);
    });
  }catch(err){ console.error(err); }
}

async function sendChat(){
  const chatbotId = document.getElementById("chatbotSelect").value;
  const message = document.getElementById("chatInput").value;
  const chatWindow = document.getElementById("chatWindow");
  try{
    const res = await fetch(`${API_BASE}/chatbots/${chatbotId}/ask`,{
      method:"POST",
      headers:{
        Authorization:`Bearer ${token}`,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({question: message})
    });
    const data = await res.json();
    const p = document.createElement("p");
    p.textContent = `You: ${message}\nBot: ${data.answer}`;
    chatWindow.appendChild(p);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    document.getElementById("chatInput").value = "";
  }catch(err){
    console.error(err);
    alert("Failed to send message");
  }
}

// ------------------ Load LLMs ------------------
async function loadLLMs(){
  try{
    const res = await fetch(`${API_BASE}/llms/`,{
      headers:{Authorization:`Bearer ${token}`}
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

// ------------------ Show Selected Files ------------------
document.getElementById("docFile").addEventListener("change", function(){
  const container = document.getElementById("selectedFiles");
  container.innerHTML = "";
  const files = Array.from(this.files);
  files.forEach(file => {
    const div = document.createElement("div");
    div.textContent = file.name;
    div.className = "mb-1";
    container.appendChild(div);
  });
});

// ------------------ Initialize ------------------
document.addEventListener("DOMContentLoaded", ()=>{
  loadLLMs();
  loadChatbots();
  initChat();
});
