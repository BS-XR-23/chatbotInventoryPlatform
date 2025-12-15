module.exports = [
"[project]/frontend/lib/auth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/auth.ts
__turbopack_context__.s([
    "AUTH_STORAGE_KEYS",
    ()=>AUTH_STORAGE_KEYS,
    "clearAuthData",
    ()=>clearAuthData,
    "getAuthToken",
    ()=>getAuthToken,
    "getAuthUser",
    ()=>getAuthUser,
    "isAuthenticated",
    ()=>isAuthenticated,
    "saveAuthData",
    ()=>saveAuthData
]);
const AUTH_STORAGE_KEYS = {
    TOKEN: "token",
    USER: "user"
};
function saveAuthData(token, role, email, vendor_domain) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const user = undefined;
}
function getAuthToken() {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
}
function getAuthUser() {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
    const userStr = undefined;
}
function clearAuthData() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function isAuthenticated() {
    return !!getAuthToken();
}
}),
"[project]/frontend/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth.ts [app-ssr] (ecmascript)");
;
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:9000") || "http://127.0.0.1:9000";
const getAuthHeaders = ()=>{
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAuthToken"])();
    return {
        "Content-Type": "application/json",
        ...token && {
            Authorization: `Bearer ${token}`
        }
    };
};
const handleResponse = async (response)=>{
    if (!response.ok) {
        const error = await response.json().catch(()=>({
                detail: "An error occurred"
            }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
};
const fetchAPI = async (endpoint, options = {})=>{
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers
        }
    });
    return handleResponse(response);
};
const api = {
    login: async (credentials)=>{
        let endpoint;
        switch(credentials.role){
            case "admin":
                endpoint = `/auth/admin/token`;
                break;
            case "user":
                endpoint = `/auth/user/token`;
                break;
            case "vendor":
                if (!credentials.vendor_domain) throw new Error("Vendor domain is required");
                endpoint = `/auth/vendor/${credentials.vendor_domain}/token`;
                break;
            default:
                throw new Error("Invalid role");
        }
        const formData = new URLSearchParams();
        formData.append("username", credentials.email);
        formData.append("password", credentials.password);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
        });
        return handleResponse(response);
    },
    // Admin endpoints
    createAdmin: (data)=>fetchAPI("/admins/create", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getAdmin: (adminId)=>fetchAPI(`/admins/me/${adminId}`),
    updateAdmin: (adminId, data)=>fetchAPI(`/admins/edit/${adminId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    changeAdminPassword: (data)=>fetchAPI("/admins/change-password", {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    updateVendorStatus: (vendorId, data)=>fetchAPI(`/admins/update-vendors/${vendorId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    getAdminDocuments: ()=>fetchAPI("/admins/documents"),
    duplicateChatbot: (chatbotId)=>fetchAPI(`/admins/chatbots/duplicate/${chatbotId}`, {
            method: "POST"
        }),
    getMostUsersByVendors: ()=>fetchAPI("/admins/most-users-by-vendors"),
    getMostChatbotsByVendors: ()=>fetchAPI("/admins/most-chatbots-by-vendors"),
    getMostUsedChatbot: ()=>fetchAPI("/admins/most-used-chatbot"),
    getTotalTokensByVendor: (vendorId)=>fetchAPI(`/admins/total-tokens/${vendorId}`),
    // Vendor endpoints
    createVendor: (data)=>fetchAPI("/vendors/create", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getAllVendors: ()=>fetchAPI("/vendors/all-vendors"),
    getVendor: (vendorId)=>fetchAPI(`/vendors/${vendorId}`),
    updateVendor: (vendorId, data)=>fetchAPI(`/vendors/update/${vendorId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    getVendorTopChatbotsByMessages: ()=>fetchAPI("/vendors/top-chatbots/messages"),
    getVendorTopChatbotsByUsers: ()=>fetchAPI("/vendors/top-chatbots/users"),
    getVendorDailyMessages: ()=>fetchAPI("/vendors/daily/messages"),
    getVendorDailyUniqueUsers: ()=>fetchAPI("/vendors/daily/unique-users"),
    getVendorUserTokensLast7Days: (userId)=>fetchAPI(`/vendors/user/${userId}/tokens-last7`),
    getVendorUserTokensTotal: (userId)=>fetchAPI(`/vendors/user/${userId}/tokens-total`),
    getVendorUserChatbotMessagesCount: (userId, chatbotId)=>fetchAPI(`/vendors/user/${userId}/chatbot/${chatbotId}/messages-count`),
    // User endpoints
    createUser: (data)=>fetchAPI("/users/create", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getUser: (userId)=>fetchAPI(`/users/${userId}`),
    getVendorUsers: ()=>fetchAPI("/users/"),
    updateUser: (userId, data)=>fetchAPI(`/users/update/${userId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    deleteUser: (userId)=>fetchAPI(`/users/${userId}`, {
            method: "DELETE"
        }),
    // Chatbot endpoints
    createChatbot: (data)=>fetchAPI("/chatbots/", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getVendorChatbots: ()=>fetchAPI("/chatbots/"),
    getAllChatbots: ()=>fetchAPI("/chatbots/"),
    getChatbot: (chatbotId)=>fetchAPI(`/chatbots/${chatbotId}`),
    updateChatbot: (chatbotId, data)=>fetchAPI(`/chatbots/${chatbotId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    deleteChatbot: (chatbotId)=>fetchAPI(`/chatbots/${chatbotId}`, {
            method: "DELETE"
        }),
    askChatbot: async (chatbotId, question)=>{
        const response = await fetch(`${API_BASE_URL}/chatbots/${chatbotId}/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question
            })
        });
        return response.json();
    },
    chatWithChatbot: (chatbotId, data)=>fetchAPI(`/chatbots/${chatbotId}/chat`, {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getGlobalTopChatbots: ()=>fetchAPI("/chatbots/global/top-chatbots"),
    // Conversation endpoints
    getUserConversations: ()=>fetchAPI("/conversations/"),
    getUserChatbotConversations: (chatbotId)=>fetchAPI(`/conversations/${chatbotId}`),
    deleteConversation: (conversationId)=>fetchAPI(`/conversations/${conversationId}`, {
            method: "DELETE"
        }),
    // Document endpoints
    previewDocument: (formData)=>{
        const token = localStorage.getItem("token");
        return fetch(`${API_BASE_URL}/documents/preview`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }).then((res)=>res.json());
    },
    saveDocument: (formData)=>{
        const token = localStorage.getItem("token");
        return fetch(`${API_BASE_URL}/documents/add`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }).then((res)=>res.json());
    },
    getDocuments: ()=>fetchAPI("/documents/"),
    getDocument: (documentId)=>fetchAPI(`/documents/${documentId}`),
    updateDocument: (documentId, data)=>fetchAPI(`/documents/${documentId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    deleteDocument: (documentId)=>fetchAPI(`/documents/${documentId}`, {
            method: "DELETE"
        }),
    createKnowledgeBase: (documentId)=>fetchAPI(`/documents/${documentId}/knowledge-base`, {
            method: "POST"
        }),
    // LLM endpoints
    createLLM: (data)=>fetchAPI("/llms/", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getLLMs: ()=>fetchAPI("/llms/"),
    getLLM: (llmId)=>fetchAPI(`/llms/${llmId}`),
    updateLLM: (llmId, data)=>fetchAPI(`/llms/${llmId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    deleteLLM: (llmId)=>fetchAPI(`/llms/${llmId}`, {
            method: "DELETE"
        }),
    // Embedding endpoints
    createEmbedding: (data)=>fetchAPI("/embeddings/create", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getEmbeddings: ()=>fetchAPI("/embeddings/"),
    getEmbedding: (embeddingId)=>fetchAPI(`/embeddings/${embeddingId}`),
    updateEmbedding: (embeddingId, data)=>fetchAPI(`/embeddings/update/${embeddingId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    deleteEmbedding: (embeddingId)=>fetchAPI(`/embeddings/delete/${embeddingId}`, {
            method: "DELETE"
        }),
    // API Keys endpoints
    createAPIKey: (data)=>fetchAPI("/api-keys/", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getAPIKeys: ()=>fetchAPI("/api-keys/"),
    getAPIKey: (keyId)=>fetchAPI(`/api-keys/${keyId}`),
    updateAPIKey: (keyId, data)=>fetchAPI(`/api-keys/${keyId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    deleteAPIKey: (keyId)=>fetchAPI(`/api-keys/${keyId}`, {
            method: "DELETE"
        })
};
}),
"[project]/frontend/app/login/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LoginForm",
    ()=>LoginForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function LoginForm() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("vendor");
    const [vendorDomain, setVendorDomain] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setError("");
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].login({
                email,
                password,
                role,
                vendor_domain: role === "vendor" ? vendorDomain : undefined
            });
            // Save token and user info
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveAuthData"])(res.access_token, role, email, role === "vendor" ? vendorDomain : undefined);
            // Redirect to dashboard based on role
            if (role === "vendor") router.push("/vendor/dashboard");
            else if (role === "admin") router.push("/admin/dashboard");
            else router.push("/user/dashboard");
        } catch (err) {
            setError(err.message || "Login failed");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: "space-y-4 p-6 border rounded bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-xl font-bold text-center",
                children: "Login"
            }, void 0, false, {
                fileName: "[project]/frontend/app/login/page.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                value: role,
                onChange: (e)=>setRole(e.target.value),
                className: "w-full p-2 border rounded",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "vendor",
                        children: "Vendor"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/login/page.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "admin",
                        children: "Admin"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/login/page.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "user",
                        children: "User"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/login/page.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/login/page.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            role === "vendor" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                placeholder: "Vendor Domain",
                value: vendorDomain,
                onChange: (e)=>setVendorDomain(e.target.value),
                className: "w-full p-2 border rounded",
                required: true
            }, void 0, false, {
                fileName: "[project]/frontend/app/login/page.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "email",
                placeholder: "Email",
                value: email,
                onChange: (e)=>setEmail(e.target.value),
                className: "w-full p-2 border rounded",
                required: true
            }, void 0, false, {
                fileName: "[project]/frontend/app/login/page.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "password",
                placeholder: "Password",
                value: password,
                onChange: (e)=>setPassword(e.target.value),
                className: "w-full p-2 border rounded",
                required: true
            }, void 0, false, {
                fileName: "[project]/frontend/app/login/page.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-red-500 text-sm",
                children: error
            }, void 0, false, {
                fileName: "[project]/frontend/app/login/page.tsx",
                lineNumber: 82,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                className: "w-full p-2 bg-blue-600 text-white rounded",
                children: "Login"
            }, void 0, false, {
                fileName: "[project]/frontend/app/login/page.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/login/page.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_3dfe4350._.js.map