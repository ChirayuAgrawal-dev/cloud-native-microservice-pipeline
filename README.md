# Cloud-Native AI Microservice & Automated CI/CD Pipeline

A production-grade, containerized microservice architecture integrating a Node.js/Express backend with a local Large Language Model (LLM) inference engine (Ollama). The project features multi-container orchestration via Docker Compose, automated deployment on a local Kubernetes (Minikube) cluster with health probes, and a fully automated Git-driven Jenkins CI/CD pipeline.

---

## 🚀 Tech Stack

* **Backend:** Node.js, Express.js
* **AI Engine:** Ollama (Local LLM Inference)
* **Containerization:** Docker, Docker Compose
* **Orchestration:** Kubernetes (Minikube, Deployments, ClusterIP Services, ConfigMaps, Liveness/Readiness Probes)
* **CI/CD Automation:** Jenkins (Declarative Pipeline, SCM integration)
* **Version Control:** Git & GitHub

---

## 🏗️ Architecture & Overview

This project decouples application logic into isolated microservices to ensure stability, resilience, and rapid continuous deployment:

1. **API Gateway / Web Backend:** A lightweight Express application managing API routing, user request validation, and Kubernetes health endpoints (`/health`).
2. **AI Inference Workload:** A dedicated Ollama container running locally to handle heavy model execution without blocking the web backend.
3. **Automated CI/CD:** A Git-driven Jenkins pipeline that checks out code directly from GitHub, validates the project workspace, and triggers automated updates to Kubernetes.

---

## 🛠️ Prerequisites

Before running this project, ensure you have the following tools installed on your local machine:

* [Docker Desktop](https://www.docker.com/) (with WSL 2 backend on Windows)
* [Minikube](https://minikube.sigs.k8s.io/docs/start/) & `kubectl`
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Jenkins](https://www.jenkins.io/) (running locally or inside a container with Docker integration)

---

## ⚙️ Local Execution with Docker Compose

To spin up both the Node.js microservice and the Ollama AI engine together on an isolated network:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git
   cd cloud-native-microservice-pipeline
   ```

2. **Launch multi-container environment:**
   ```bash
   docker compose up --build
   ```

3. **Verify running containers:**
   The web microservice will be accessible at `http://localhost:3000`.

---

## ☸️ Kubernetes Deployment (Minikube)

Follow these steps to deploy the application manifests onto your local Kubernetes cluster:

1. **Start Minikube:**
   ```bash
   minikube start
   ```

2. **Apply Kubernetes Manifests:**
   Deploy the `ConfigMap`, `Deployment` (with liveness and readiness probes), and `ClusterIP Service`:
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

3. **Verify Pod & Service Status:**
   ```bash
   kubectl get pods
   kubectl get services
   ```

4. **Expose and Access Service:**
   ```bash
   minikube service cdb-microservice-service
   ```

---

## 🔄 Jenkins CI/CD Pipeline Setup

This repository contains a declarative `Jenkinsfile` for automated continuous integration.

1. Open your local Jenkins dashboard (`http://localhost:8090`).
2. Click **New Item**, enter `ccd-microservice-pipeline`, select **Pipeline**, and click **OK**.
3. Under the **Pipeline** configuration section:
   * Set **Definition** to `Pipeline script from SCM`.
   * Set **SCM** to `Git`.
   * Enter Repository URL: `https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git`.
   * Set Branch Specifier to `*/main`.
4. Click **Save** and then select **Build Now** to execute the pipeline stages:
   * **Stage 1:** SCM Checkout
   * **Stage 2:** Workspace Build Verification
   * **Stage 3:** Container Image Simulation
   * **Stage 4:** Automated Kubernetes Deployment

---

## 💡 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Returns microservice health status (used for K8s liveness/readiness probes). |
| `/api/generate` | `POST` | Forwards user prompts to the containerized Ollama AI engine and returns generated text. |

---

## 👨‍💻 Author

**Chirayu Agrawal**  
*Computer Science & Engineering Student  
* **GitHub:** [@ChirayuAgrawal-dev](https://github.com/ChirayuAgrawal-dev)