# Cloud-Native AI Microservice & Automated CI/CD Pipeline

A production-grade, containerized microservice architecture integrating a Node.js/Express backend with a local LLM inference engine (Ollama). The project features multi-container orchestration via Docker Compose, automated deployment on a local Kubernetes (Minikube) cluster with health probes, and a fully automated Git-driven Jenkins CI/CD pipeline.

---

## 🚀 Tech Stack

* **Backend:** Node.js, Express.js
* **AI Engine:** Ollama (Local Large Language Model inference)
* **Containerization:** Docker, Docker Compose
* **Orchestration:** Kubernetes (Minikube, Deployments, Services, ConfigMaps, Liveness/Readiness Probes)
* **CI/CD Automation:** Jenkins (Declarative Pipeline, SCM integration)
* **Version Control:** Git & GitHub

---

## 📂 Project Architecture

```text
[ GitHub Repository ] 
        │ (Push / SCM Trigger)
        ▼
[ Jenkins CI/CD Pipeline ] ──► [ Docker Build & Push ] ──► [ Kubernetes / Minikube Rollout ]
                                                                     │
[ Client Request ] ──► [ Node.js Express Gateway ] ──────────────────┤
                               │                                     │
                               ▼ (Internal Container Network)        ▼
                        [ Ollama AI Engine ]                 [ Self-Healing Pods ]

🛠️ Prerequisites
Before running this project locally, ensure you have the following installed:

Docker Desktop (with Kubernetes enabled, or Minikube installed)

Minikube & kubectl

Node.js (v18+ recommended)

Jenkins (running locally or via container with Docker integration)

⚙️ Getting Started & Local Execution
1. Clone the Repository
Bash
git clone [https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git](https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git)
cd cloud-native-microservice-pipeline
2. Run Locally Using Docker Compose
To spin up both the Node.js application and the Ollama AI service together on a private network:

Bash
docker compose up --build
The web service will be accessible at http://localhost:3000.

☸️ Deploying to Kubernetes (Minikube)
Start Minikube:

Bash
minikube start
Apply the Kubernetes Manifests:
Deploy the ConfigMap, Deployment (including liveness and readiness probes), and ClusterIP Service:

Bash
kubectl apply -f k8s-deployment.yaml
Verify the Deployment:
Check the status of your pods and services:

Bash
kubectl get pods
kubectl get services
Access the Service:

Bash
minikube service cdb-microservice-service
🔄 Jenkins CI/CD Pipeline Setup
This project uses a declarative Jenkinsfile for automated continuous integration and deployment.

Open your local Jenkins dashboard (http://localhost:8090).

Create a new Pipeline job.

Under the Pipeline configuration section:

Set Definition to Pipeline script from SCM.

Select Git.

Provide your repository URL: https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git.

Set Branch to */main.

Click Save and select Build Now to watch Jenkins execute code checkout, build validation, and deployment stages automatically.

💡 API Endpoints
GET /health — Returns application and container health status (used by Kubernetes probes).

POST /api/generate — Sends a prompt payload to the containerized Ollama AI model and returns the generated response.

👨‍💻 Author
Chirayu Agrawal

Computer Science & Engineering Student 