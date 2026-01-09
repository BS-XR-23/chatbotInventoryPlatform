✨ Chatbot Inventory Platform

A multi-tenant Chatbot Inventory Platform that allows admins and vendors (companies) to create, configure, and manage RAG-based AI chatbots.
Each vendor operates in a securely isolated environment with dedicated data, API keys, document stores, and analytics.

📝 Overview

The Chatbot Inventory Platform enables businesses to deploy intelligent, document-aware conversational chatbots using Retrieval-Augmented Generation (RAG).

The system ensures:

Complete data isolation between vendors

Secure API-based access

Scalable chatbot deployment via an embeddable widget

Admins can monitor system-wide performance, while vendors manage their own chatbots, documents, and analytics independently.

🚀 Key Features

Vendor-Specific Chatbot Management
Each vendor can create and manage multiple chatbots with isolated documents, vector stores, and configurations.

RAG-Powered Conversational AI
Chatbots generate accurate, context-aware responses by retrieving relevant information from uploaded documents.

Analytics & Usage Insights
Dashboards provide insights into chatbot usage, message volume, and performance trends.

Secure Multi-Tenancy
Full separation of vendor data, API keys, and chatbot configurations to ensure privacy and compliance.

Easy Chatbot Integration
Embed chatbots into any website using a simple 5-line HTML widget script.

🧩 System Components

Frontend (Client)
Handles UI rendering, user interactions, and dashboard visualization.

Backend (API)
Manages business logic, authentication, RAG pipelines, vector stores, and widget communication.

Database
Persistent storage for users, vendors, chatbots, documents, embeddings, and analytics.

💻 Tech Stack
Layer	Technology / Tools
Frontend	HTML, Bootstrap, JavaScript
Backend	FastAPI, Pydantic, SQLAlchemy, LangChain, Ollama
Database	PostgreSQL, Chroma, FAISS
Testing	Postman
Hosting	Cloudflared (Local Tunnel Hosting)
📁 Project Structure
/project-root
├── backend/
│   └── app/
│       ├── frontend/                  # UI and client-side assets
│       ├── uploads/
│       │   ├── documents/              # Uploaded documents per chatbot
│       │   └── vectorstores/            # Vector embeddings per chatbot
│       └── main.py                     # Application entry point
├── frontend/                           # Standalone frontend assets
└── README.md                           # Project documentation

🛠️ Installation & Setup
Prerequisites

Ensure the following are installed:

Python 3.12.0

uv (Python package manager)

pip install uv

Environment Configuration

Create a .env file and configure the following:

SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database credentials
DB_USER=database_username
DB_PASSWORD=database_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name

API_PREFIX=/api
DEBUG=True

🏃 Running the Application Locally

Navigate to the app directory:

cd backend/app


Run the application:

uv run main.py


This command installs all required dependencies (one-time) and starts the server.

Access the app at:

http://localhost:<PORT>

🤖 Chatbot Integration via Widget

To embed a chatbot into any website:

Go to Vendor Dashboard

Create an API Key for a selected chatbot (API Tokens section)

Open the Chatbot Details page

Copy the generated widget script

Paste it inside your website’s HTML:

<body>
  <!-- Paste chatbot widget here -->
</body>


That’s it — the chatbot will be live on your site.

🤝 Contributing & Workflow

We follow a structured Git workflow to ensure stability and scalability.

Branching Strategy
Branch	Purpose	Origin	Status
main	Production-ready stable code	—	Stable
development	Active development and testing branch	main	Ongoing
Best Practices

Write clear, descriptive commit messages

Always pull the latest changes before starting work

Resolve merge conflicts promptly

Merge into main only via development

🧪 Testing

API testing is performed using Postman

Ensure all endpoints work correctly before merging to development

🚀 Deployment (Cloudflared)

Create a free Cloudflared account

Run:

cloudflared tunnel --url http://localhost:<backend_port>


You’ll receive a public tunnel URL:

"https://this-glad-genealogy-duties.trycloudflare.com" like this. ## example url


Use this URL as the API base

⚠️ Note:
The Cloudflared URL changes every time the tunnel restarts.
Update the API base URL in the following files:

frontend/index.html (line 80)

frontend/signup.html (line 63)

frontend/widget.js (line 2)

frontend/admin/chatbotDetailsSection.js (line 164)

frontend/vendor/dashboard.js (line 195)

📄 License

This project is currently under internal development.
License information can be added as needed.