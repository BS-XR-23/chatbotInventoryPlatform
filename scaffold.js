// scaffold.js
const fs = require("fs");
const path = require("path");

const projectName = "chatbotInventoryPlatformFrontend";

const folders = [
  "app",
  "app/components",
  "app/components/tables",
  "app/components/chat",
  "app/components/modals",
  "app/components/layout",
  "app/modules/admin/pages",
  "app/modules/admin/components",
  "app/modules/vendor/pages",
  "app/modules/vendor/components",
  "app/modules/user/pages",
  "app/modules/user/components",
  "app/lib",
];

// Placeholder pages to generate
const pages = {
  "app/modules/admin/pages/dashboard.tsx": "Admin Dashboard placeholder",
  "app/modules/admin/pages/vendors.tsx": "Admin Vendors placeholder",
  "app/modules/admin/pages/chatbots.tsx": "Admin Chatbots placeholder",
  "app/modules/admin/pages/documents.tsx": "Admin Documents placeholder",
  "app/modules/admin/pages/users.tsx": "Admin Users placeholder",
  
  "app/modules/vendor/pages/dashboard.tsx": "Vendor Dashboard placeholder",
  "app/modules/vendor/pages/chatbots.tsx": "Vendor Chatbots placeholder",
  "app/modules/vendor/pages/documents.tsx": "Vendor Documents placeholder",
  "app/modules/vendor/pages/analytics.tsx": "Vendor Analytics placeholder",
  "app/modules/vendor/pages/users.tsx": "Vendor Users placeholder",
  
  "app/modules/user/pages/dashboard.tsx": "User Dashboard placeholder",
  "app/modules/user/pages/chatbots.tsx": "User Chatbots placeholder",
  "app/modules/user/pages/conversations.tsx": "User Conversations placeholder",
  
  "app/components/tables/Table.tsx": "Generic Table component placeholder",
  "app/components/chat/ChatBubble.tsx": "ChatBubble placeholder",
  "app/components/modals/DocumentModal.tsx": "DocumentModal placeholder",
  "app/components/layout/Navbar.tsx": "Navbar placeholder",
  "app/components/layout/Sidebar.tsx": "Sidebar placeholder",
  "app/components/layout/Layout.tsx": "Layout placeholder",
  
  "app/lib/api.ts": "// API helper placeholder\nexport const api = {}",
  "app/lib/auth.ts": "// Auth helper placeholder\nexport const auth = {}",
};

// Create folders
folders.forEach((folder) => {
  const folderPath = path.join(projectName, folder);
  fs.mkdirSync(folderPath, { recursive: true });
  console.log(`Created folder: ${folderPath}`);
});

// Create pages/components/lib files
Object.entries(pages).forEach(([filePath, content]) => {
  const fullPath = path.join(projectName, filePath);
  fs.writeFileSync(fullPath, `// ${content}\n`);
  console.log(`Created file: ${fullPath}`);
});

console.log("\nProject scaffolding complete!");
