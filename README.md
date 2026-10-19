

# Cloud-Native AI Microservice & Automated CI/CD Pipeline

A containerized Retrieval-Augmented Generation (RAG) microservice architecture integrating a Node.js/Express backend with a ChromaDB vector database and a local Large Language Model (LLM) inference engine (Ollama). The project features multi-container orchestration via Docker Compose, deployment of three cooperating services on a local Kubernetes (Minikube) cluster, and a Git-driven Jenkins CI/CD pipeline.

---

## 🚀 Tech Stack

- **Backend:** Node.js 18, Express.js, Axios
- **AI Engine:** Ollama (Local LLM Inference) — `phi3` for answer generation, `nomic-embed-text` for embeddings
- **Vector Database:** ChromaDB (semantic document retrieval)
- **Containerization:** Docker (multi-stage build), Docker Compose
- **Orchestration:** Kubernetes (Minikube, Deployments, ClusterIP & NodePort Services)
- **CI/CD Automation:** Jenkins (Declarative Pipeline, SCM integration)
- **Version Control:** Git & GitHub

---

## 🏗️ Architecture & Overview

This project decouples application logic into isolated microservices so each part can be built, deployed and restarted independently:

1. **RAG API / Web Backend (`ccd-web`):** A lightweight Express application exposing `POST /api/ask`. It validates the request, embeds the question, retrieves the two most relevant documents from ChromaDB, builds an augmented prompt and forwards it to Ollama.
2. **Vector Database (`chromadb`):** Stores document embeddings in the `rag_documents` collection and returns the closest matches for each question.
3. **AI Inference Workload (`ollama`):** A dedicated Ollama container that runs heavy model execution (generation and embeddings) without blocking the web backend.
4. **Document Ingestion (`ingest.js`):** A script that embeds sample documents with the shared `embeddings.js` function and loads them into ChromaDB. The same embedding function is used when answering questions, so documents and queries share one vector space.
5. **Automated CI/CD:** A Git-driven Jenkins pipeline that checks out code directly from GitHub, validates the project workspace, and stages the image build and Kubernetes rollout.

**Configuration** (environment variables read by the web service):

| Variable      | Default                | Purpose                                 |
| ------------- | ---------------------- | --------------------------------------- |
| `OLLAMA_HOST` | `http://ollama:11434`  | Ollama API base URL                     |
| `CHROMA_HOST` | `http://chromadb:8000` | ChromaDB base URL                       |
| `EMBED_MODEL` | `nomic-embed-text`     | Ollama model used to create embeddings  |
| `PORT`        | `3000`                 | Port the Express server listens on      |

---

## 🛠️ Prerequisites

Before running this project, ensure you have the following tools installed on your local machine:

- [Docker Desktop](https://www.docker.com/) (with WSL 2 backend on Windows)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) & `kubectl`
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Jenkins](https://www.jenkins.io/) (running locally or inside a container with Docker integration)
- At least 6 GB of free RAM for the `phi3` model (about 2.2 GB download)

---

## ⚙️ Local Execution with Docker Compose

To spin up the Node.js microservice, ChromaDB and the Ollama AI engine together on an isolated network:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git
   cd cloud-native-microservice-pipeline
   ```

2. **Launch the multi-container environment:**

   ```bash
   docker compose up --build
   ```

3. **Pull the models into Ollama** (first run only):

   ```bash
   docker compose exec ollama ollama pull phi3
   docker compose exec ollama ollama pull nomic-embed-text
   ```

4. **Ingest documents into ChromaDB:**

   ```bash
   docker compose exec web npm run ingest
   ```

5. **Ask a question.** The web microservice is available at `http://localhost:3000`:

   ```bash
   curl -X POST http://localhost:3000/api/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "Where does Chirayu live?"}'
   ```

   On Windows PowerShell:

   ```powershell
   Invoke-RestMethod -Uri http://localhost:3000/api/ask -Method Post `
     -ContentType "application/json" `
     -Body '{"question": "Where does Chirayu live?"}'
   ```

---

## ☸️ Kubernetes Deployment (Minikube)

Follow these steps to deploy the application manifests onto your local Kubernetes cluster. `k8s-deployment.yaml` defines three Deployments — `chromadb` (ClusterIP, port 8000), `ollama` (ClusterIP, port 11434) and `ccd-web` (NodePort, port 3000).

1. **Start Minikube** (extra memory helps the LLM run smoothly):

   ```bash
   minikube start --memory=6144
   ```

2. **Build the web image inside Minikube.** The deployment uses `imagePullPolicy: Never`, so the image must already exist in the cluster:

   ```bash
   minikube image build -t ccd-microservice-project-web:latest .
   ```

3. **Apply the Kubernetes manifests:**

   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

4. **Verify pod and service status** until all three pods show `1/1 Running`:

   ```bash
   kubectl get pods
   kubectl get services
   ```

5. **Pull the models into the Ollama pod:**

   ```bash
   kubectl exec -it deploy/ollama -- ollama pull phi3
   kubectl exec -it deploy/ollama -- ollama pull nomic-embed-text
   ```

6. **Ingest vectors into ChromaDB:**

   ```bash
   kubectl exec -it deploy/ccd-web -- npm run ingest
   ```

7. **Expose and access the service:**

   ```bash
   minikube service ccd-web --url
   ```

   On Windows with the Docker driver, keep this terminal open — the tunnel closes when it does, and the printed port changes each time.

**Notes**

- The Ollama and ChromaDB pods use `emptyDir` volumes, so downloaded models and ingested vectors are lost when those pods are recreated. Re-run the pull and ingest steps afterwards.
- After changing the application code, rebuild with a new tag (for example `v2`) and update the deployment with `kubectl set image deployment/ccd-web web=ccd-microservice-project-web:v2`. Re-using the same tag can leave Minikube serving the old image.
- Opening the root URL in a browser shows `Cannot GET /`. This is expected — the service is an API and has no page at `/`.

---

## 🔄 Jenkins CI/CD Pipeline Setup

This repository contains a declarative `Jenkinsfile` for automated continuous integration.

1. Open your local Jenkins dashboard (`http://localhost:8090`).
2. Click **New Item**, enter `ccd-microservice-pipeline`, select **Pipeline**, and click **OK**.
3. Under the **Pipeline** configuration section:
   - Set **Definition** to `Pipeline script from SCM`.
   - Set **SCM** to `Git`.
   - Enter Repository URL: `https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git`.
   - Set Branch Specifier to `*/main`.
4. Click **Save** and then select **Build Now** to execute the pipeline stages:
   - **Stage 1:** Checkout Code (SCM checkout)
   - **Stage 2:** Build Verification (workspace and manifest validation)
   - **Stage 3:** Build & Push Container Image (simulated)
   - **Stage 4:** Automated Deploy to Kubernetes (simulated)

> **Note:** Stages 3 and 4 currently print log messages only (image name `chirayu27/ccd-microservice` tagged with the Jenkins build number). They do not yet build, push or deploy anything, so wire in real `docker build`, `docker push` and `kubectl` steps (with the Docker Hub credentials ID already declared) to make the pipeline deploy automatically.

---

## 💡 API Endpoints

| Endpoint    | Method | Description                                                                                                                                                  |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/ask`  | `POST` | Accepts a JSON body with a `question`, retrieves the two most relevant documents from ChromaDB, sends the augmented prompt to the Ollama `phi3` model and returns the generated answer. |

**Request body**

```json
{ "question": "Where does Chirayu live?" }
```

**Response**

```json
{
  "question": "Where does Chirayu live?",
  "contextUsed": "...the retrieved documents, one per line...",
  "answer": "Chirayu lives in Pune."
}
```

A missing `question` returns `400`, and an upstream failure (ChromaDB or Ollama unreachable) returns `500` with a `details` message. The first request after startup can take a few minutes while `phi3` loads into memory.

---

## 👨‍💻 Author

**Chirayu Agrawal**  
*Computer Science & Engineering Student*

- **GitHub:** [@ChirayuAgrawal-dev](https://github.com/ChirayuAgrawal-dev)
