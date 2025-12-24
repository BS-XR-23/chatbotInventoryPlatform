// ------------------ API & Auth ------------------
const API_BASE = "http://127.0.0.1:9000"; // change if needed
const token = localStorage.getItem("access_token");
// const role = localStorage.getItem("role");
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
if (!token) {
    window.location.href = "/index.html";
}

console.log(localStorage.getItem("user"));

// ------------------ Logout ------------------
function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
}

async function ensureCurrentUser() {
    if (currentUser.id) return;
    try {
        const res = await fetch(`${API_BASE}/users/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to load user");

        const user = await res.json();

        localStorage.setItem("user", JSON.stringify(user));
        Object.assign(currentUser, user);

        renderUserInfo(user);
    } catch (err) {
        console.error(err);
        logout(); // token invalid → force logout
    }
}


// ------------------ Profile Actions ------------------
function updateProfile() {
    // Prefill modal inputs with current user info
    document.getElementById("modalName").value = currentUser.name || "";
    document.getElementById("modalEmail").value = currentUser.email || "";

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('updateProfileModal'));
    modal.show();
}

// ------------------ Modal Form Submission ------------------
document.getElementById("updateProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const newName = document.getElementById("modalName").value.trim();
    const newEmail = document.getElementById("modalEmail").value.trim();

    try {
        const res = await fetch(`${API_BASE}/users/update`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: newName,
                email: newEmail
            })
        });

        if (!res.ok) throw new Error("Failed to update profile");

        const updatedUser = await res.json();

        // Update localStorage + in-memory user
        localStorage.setItem("user", JSON.stringify(updatedUser));
        Object.assign(currentUser, updatedUser);

        renderUserInfo(updatedUser);

        // Close modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("updateProfileModal")
        );
        modal.hide();

        alert("Profile updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to update profile");
    }
});


async function deleteAccount() {
    if (!confirm("Are you sure you want to delete your account?")) return;

    const endpoint = `${API_BASE}/users/me`;

    const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
        alert("Account deleted");
        logout();
    } else {
        alert("Failed to delete account");
    }
}

// ------------------ Render User Info ------------------
function renderUserInfo(user) {
    document.getElementById("userName").textContent = user.name || "User";
    document.getElementById("userEmail").textContent = user.email || "";
}

// ------------------ Conversations ------------------
async function fetchConversations() {
    try {
        const endpoint = `${API_BASE}/conversations/`;

        const res = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch conversations");

        const data = await res.json();
        renderConversations(data); // backend returns grouped by session_id
    } catch (err) {
        console.error(err);
        alert("Error loading conversations");
    }
}

// ------------------ All Conversations Toggle ------------------
let allConversationsVisible = false;

// Toggle function
async function toggleAllConversations() {
    const container = document.getElementById("conversationsContainer");

    if (allConversationsVisible) {
        // Hide conversations
        container.style.display = "none";
        allConversationsVisible = false;
        document.getElementById("allConversationsBtn").textContent = "All Conversations";
    } else {
        // Show conversations
        try {
            const res = await fetch(`${API_BASE}/conversations/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to fetch conversations");
            const data = await res.json();

            renderConversations(data); // renders collapsible sessions
            container.style.display = "block";
            allConversationsVisible = true;
            document.getElementById("allConversationsBtn").textContent = "Hide Conversations";
        } catch (err) {
            console.error(err);
            alert("Error loading conversations");
        }
    }
}

// ------------------ Render Conversations (collapsible) ------------------
function renderConversations(data) {
    const container = document.getElementById("conversationsContainer");
    container.innerHTML = ""; // clear previous

    for (const sessionId in data) {
        const sessionDiv = document.createElement("div");
        sessionDiv.classList.add("session", "mb-3", "p-2", "border", "rounded");

        // Session header
        const sessionHeader = document.createElement("h5");
        sessionHeader.textContent = `Session: ${sessionId}`;
        sessionHeader.style.cursor = "pointer"; // clickable
        sessionDiv.appendChild(sessionHeader);

        // Messages container
        const messagesDiv = document.createElement("div");
        const messages = data[sessionId];
        messages.forEach(msg => {
            const msgDiv = document.createElement("div");
            msgDiv.classList.add("message", msg.sender_type === "user" ? "user" : "chatbot", "mb-1");
            msgDiv.textContent = msg.content;
            msgDiv.setAttribute("data-time", new Date(msg.timestamp).toLocaleTimeString());
            messagesDiv.appendChild(msgDiv);
        });
        sessionDiv.appendChild(messagesDiv);

        // Collapse toggle for each session
        let collapsed = false;
        sessionHeader.addEventListener("click", () => {
            collapsed = !collapsed;
            messagesDiv.style.display = collapsed ? "none" : "block";
        });

        container.appendChild(sessionDiv);
    }
}




// ------------------ Chat Bubble Functionality ------------------
const chatBubble = document.getElementById("chatBubble");
const chatWindow = document.getElementById("chatWindow");
const chatHeader = document.getElementById("chatHeader");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// Track selected chatbot and session
let chatSessionId = null;
let selectedChatbotId = null;
let currentChatbotMode = null;
let userApiKey = null; // API key for private chatbots
let selectedChatbotName = "Chatbot"; // store chatbot name for header

// ------------------ Load Chatbots ------------------
async function loadChatbots() {
    try {
        const res = await fetch(`${API_BASE}/users/vendor_chatbots`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) throw new Error("Failed to load chatbots");

        const chatbots = await res.json();

        if (!Array.isArray(chatbots)) {
            console.error("Invalid chatbots response: ", chatbots);
            throw new Error("Invalid chatbots response");
        }

        const listContainer = document.getElementById("chatbotList");
        listContainer.innerHTML = "";

        chatbots.forEach(cb => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <span>${cb.name} <small>(${cb.mode})</small></span>
                <button class="btn btn-sm btn-primary">Select</button>
            `;
            li.querySelector("button").addEventListener("click", () => {
                selectedChatbotId = cb.id;
                selectedChatbotName = cb.name;
                currentChatbotMode = cb.mode;
                chatSessionId = null;
                userApiKey = null;

                if (cb.mode === "private") {
                    alert("This is a private chatbot. Generate API key from profile to chat.");
                } else {
                    alert(`Selected chatbot: ${cb.name}`);
                }

                updateChatHeader();
            });
            listContainer.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        alert("Failed to load chatbots");
    }
}

// ------------------ Chat Header Update ------------------
function updateChatHeader() {
    chatHeader.innerHTML = `
        ${selectedChatbotName}
        <button class="closeChat" onclick="chatWindow.style.display='none'">✖</button>
    `;
}

// ------------------ Chat Bubble Toggle ------------------
chatBubble.addEventListener("click", () => {
    if (!selectedChatbotId) {
        alert("Select a chatbot first.");
        return;
    }
    chatWindow.style.display = chatWindow.style.display === "flex" ? "none" : "flex";
    chatWindow.style.flexDirection = "column";
    chatInput.focus();

    updateChatHeader();
});

// ------------------ Send Message ------------------
async function sendMessage() {
    if (!selectedChatbotId) {
        alert("Select a chatbot first.");
        return;
    }
    if (currentChatbotMode === "private" && !userApiKey) {
        alert("You need an API key to chat with this private chatbot.");
        return;
    }

    const question = chatInput.value.trim();
    if (!question) return;

    // Add user message to chat
    const userMsgDiv = document.createElement("div");
    userMsgDiv.classList.add("message", "user");
    userMsgDiv.textContent = question;
    userMsgDiv.setAttribute("data-time", new Date().toLocaleTimeString());
    chatMessages.appendChild(userMsgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatInput.value = "";
    chatInput.disabled = true;
    sendBtn.disabled = true;

    try {
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
        if (currentChatbotMode === "private") {
            headers["x-api-key"] = userApiKey;
        }

        const res = await fetch(`${API_BASE}/chatbots/${selectedChatbotId}/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify({ question, session_id: chatSessionId })
        });

        if (!res.ok) throw new Error("Failed to chat with bot");

        const data = await res.json();
        chatSessionId = data.session_id;

        // Add bot response
        const botMsgDiv = document.createElement("div");
        botMsgDiv.classList.add("message", "chatbot");
        botMsgDiv.textContent = data.answer;
        botMsgDiv.setAttribute("data-time", new Date().toLocaleTimeString());
        chatMessages.appendChild(botMsgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (err) {
        console.error(err);
        alert("Error sending message");
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Send message events
sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// ------------------ Generate API Key ------------------
async function generateApiKey() {
    if (!selectedChatbotId) {
        alert("Select a chatbot first.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api-keys/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chatbot_id: selectedChatbotId,
                key: crypto.randomUUID(),
                status: "active"
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            console.error("API key creation error:", errData);
            throw new Error("Failed to generate API key");
        }

        const data = await res.json();
        userApiKey = data.key;

        alert(`API key generated: ${userApiKey}`);
    } catch (err) {
        console.error(err);
        alert("Failed to generate API key");
    }
}


// ------------------ DOMContentLoaded ------------------
document.addEventListener("DOMContentLoaded", async () => {
    
    await ensureCurrentUser();

    renderUserInfo(currentUser);

    // Profile buttons
    document.getElementById("updateProfileBtn").addEventListener("click", updateProfile);
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("deleteAccountBtn").addEventListener("click", deleteAccount);
    document.getElementById("generateApiKeyBtn").addEventListener("click", generateApiKey);
    document.getElementById("allConversationsBtn").addEventListener("click", fetchConversations);

    loadChatbots();

    document.getElementById("allConversationsBtn").addEventListener("click", toggleAllConversations);
});
