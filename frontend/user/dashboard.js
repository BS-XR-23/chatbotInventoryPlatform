// ------------------ API & Auth ------------------
const API_BASE = "http://127.0.0.1:9000"; // change if needed
const token = localStorage.getItem("access_token");
const role = localStorage.getItem("role");
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

// Redirect if not logged in or role is not "user"
if (!token || role !== "user") {
    window.location.href = "/login.html";
}

// ------------------ Logout ------------------
function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
}

// ------------------ Profile Actions ------------------
async function updateProfile() {
    const endpoint = `${API_BASE}/users/update/${currentUser.id}`;

    const newName = prompt("Enter new name", currentUser.name);
    const newEmail = prompt("Enter new email", currentUser.email);

    const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newName, email: newEmail })
    });

    if (res.ok) {
        const updatedUser = await res.json();
        alert("Profile updated successfully!");
        localStorage.setItem("user", JSON.stringify(updatedUser));
        renderUserInfo(updatedUser);
    } else {
        alert("Failed to update profile");
    }
}

async function deleteAccount() {
    if (!confirm("Are you sure you want to delete your account?")) return;

    const endpoint = `${API_BASE}/users/${currentUser.id}`;

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

// Render conversations grouped by session
function renderConversations(data) {
    const container = document.getElementById("conversationsContainer");
    container.innerHTML = ""; // clear previous

    for (const sessionId in data) {
        const sessionDiv = document.createElement("div");
        sessionDiv.classList.add("session", "mb-3", "p-2", "border", "rounded");

        const sessionHeader = document.createElement("h5");
        sessionHeader.textContent = `Session: ${sessionId}`;
        sessionDiv.appendChild(sessionHeader);

        const messages = data[sessionId];
        messages.forEach(msg => {
            const msgDiv = document.createElement("div");
            msgDiv.classList.add("message", msg.sender_type, "mb-1");
            msgDiv.textContent = `[${new Date(msg.timestamp).toLocaleString()}] ${msg.sender_type.toUpperCase()}: ${msg.content}`;
            sessionDiv.appendChild(msgDiv);
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

// Track current session for the chat
let chatSessionId = null;
const chatbotId = 10; // You can make this dynamic if you have multiple chatbots

// Toggle chat window
chatBubble.addEventListener("click", () => {
    chatWindow.style.display = chatWindow.style.display === "flex" ? "none" : "flex";
    chatWindow.style.flexDirection = "column";
    chatInput.focus();
});

// Close chat window on header click
chatHeader.addEventListener("click", () => {
    chatWindow.style.display = "none";
});

// Send message to chatbot
async function sendMessage() {
    const question = chatInput.value.trim();
    if (!question) return;

    // Add user message to chat
    const userMsgDiv = document.createElement("div");
    userMsgDiv.classList.add("message", "user", "mb-1");
    userMsgDiv.textContent = `[${new Date().toLocaleTimeString()}] YOU: ${question}`;
    chatMessages.appendChild(userMsgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatInput.value = "";
    chatInput.disabled = true;
    sendBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/chatbots/${chatbotId}/chat`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question, session_id: chatSessionId })
        });

        if (!res.ok) throw new Error("Failed to chat with bot");

        const data = await res.json();
        chatSessionId = data.session_id; // Save session_id for multi-turn

        // Add bot response
        const botMsgDiv = document.createElement("div");
        botMsgDiv.classList.add("message", "chatbot", "mb-1");
        botMsgDiv.textContent = `[${new Date().toLocaleTimeString()}] BOT: ${data.answer}`;
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

// Send message on button click
sendBtn.addEventListener("click", sendMessage);

// Send message on Enter key
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// ------------------ DOMContentLoaded ------------------
document.addEventListener("DOMContentLoaded", () => {
    // Profile buttons
    document.getElementById("updateProfileBtn").addEventListener("click", updateProfile);
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("deleteAccountBtn").addEventListener("click", deleteAccount);

    // Render user info
    renderUserInfo(currentUser);

    // Bind "All Conversations" button
    document.getElementById("allConversationsBtn").addEventListener("click", () => {
        fetchConversations();
    });
});
