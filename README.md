 
# Cloud-Native AI Microservice & Automated CI/CD Pipeline

A cloud-native AI application combining the **Aurora AI frontend** with a Retrieval-Augmented Generation (RAG) backend. The system uses Node.js and Express for API handling, ChromaDB for semantic document retrieval, and Ollama for local LLM inference. It is containerized with Docker, deployed on a local Kubernetes cluster using Minikube, and integrated with Jenkins for continuous integration.

---

## 🚀 Tech Stack

- **Frontend:** Aurora AI — user interface for interacting with the AI assistant
- **Backend:** Node.js 18, Express.js, Axios
- **AI Engine:** Ollama — `phi3` for answer generation and `nomic-embed-text` for embeddings
- **Vector Database:** ChromaDB for semantic document retrieval
- **Containerization:** Docker, Docker Compose, Docker image builds
- **Orchestration:** Kubernetes, Minikube, `kubectl`, Deployments and Services
- **CI/CD:** Jenkins Declarative Pipeline, GitHub source control integration
- **Version Control:** Git and GitHub

---

## 🏗️ Architecture & Overview

The project separates the user interface, API, document retrieval, and AI inference into cooperating components.

1. **Aurora AI Frontend:** The user-facing interface through which users enter questions and view AI-generated answers.
2. **RAG API / Backend (`ccd-web`):** A Node.js/Express service exposing `POST /api/ask`. It processes questions, generates embeddings, retrieves relevant documents, builds an augmented prompt, and sends it to Ollama.
3. **ChromaDB (`chromadb`):** Stores document embeddings in the `rag_documents` collection and returns relevant context for incoming questions.
4. **Ollama (`ollama`):** Runs the language model for answer generation and the embedding model for vector creation.
5. **Document Ingestion (`ingest.js`):** Loads document embeddings into ChromaDB. The shared embedding function is used for both stored documents and incoming questions.
6. **Jenkins CI Pipeline:** Checks out the repository, validates project files and JavaScript syntax, builds the web container image, and inspects the image.
7. **Kubernetes Deployment:** Runs the web backend, ChromaDB, and Ollama as separate workloads on Minikube.

### Frontend–Backend Integration

The application follows this request/response flow:

1. A user enters a question in Aurora AI.
2. The frontend sends the question to the backend API at `POST /api/ask`.
3. The backend creates an embedding for the question.
4. ChromaDB retrieves the most relevant documents.
5. The backend adds the retrieved context to the prompt and sends it to Ollama.
6. Ollama generates an answer.
7. The backend returns the answer to the frontend, which displays it to the user.

**Note:** The frontend framework, frontend-specific launch command, and exact browser URL depend on the frontend configuration. These details should be documented after verifying the current frontend files.

### Configuration

The web service uses the following environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama API endpoint |
| `CHROMA_HOST` | `http://chromadb:8000` | ChromaDB endpoint |
| `EMBED_MODEL` | `nomic-embed-text` | Model used to generate embeddings |
| `PORT` | `3000` | Express server port |

---

## 🛠️ Prerequisites

Install the following tools before running the project:

- [Docker Desktop](https://www.docker.com/) with the WSL 2 backend on Windows
- [Node.js](https://nodejs.org/) version 18 or higher
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- `kubectl` for Kubernetes management
- [Jenkins](https://www.jenkins.io/) running locally or in a container with the required Docker integration
- Git and a GitHub account
- Sufficient RAM and disk space for the containers and Ollama models

The `phi3` model download is approximately 2.2 GB; actual memory requirements depend on the environment.

---

## ⚙️ Local Execution with Docker Compose

Docker Compose can be used to run the web backend, ChromaDB, and Ollama together.

### 1. Clone the repository

```bash
git clone https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git
cd cloud-native-microservice-pipeline
```

### 2. Build and start the containers

```bash
docker compose up --build
```

### 3. Download the Ollama models

Run these commands in another terminal after the Ollama container is running:

```bash
docker compose exec ollama ollama pull phi3
docker compose exec ollama ollama pull nomic-embed-text
```

### 4. Ingest documents

```bash
docker compose exec web npm run ingest
```

### 5. Test the API

The backend API is expected at `http://localhost:3000`, depending on the port mapping in the Compose configuration.

Using curl:

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Where does Chirayu live?"}'
```

Using Windows PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/ask -Method Post `
  -ContentType "application/json" `
  -Body '{"question": "Where does Chirayu live?"}'
```

### Frontend

Aurora AI is the user-facing interface. Its exact start command and URL should be taken from the frontend's package scripts and deployment configuration rather than assumed.

---

## ☸️ Kubernetes Deployment (Minikube)

The project has been deployed and tested on a local Minikube cluster.

The Kubernetes configuration includes workloads for:

- `ccd-web` — web backend and RAG API
- `chromadb` — vector database
- `ollama` — local LLM inference

### 1. Start Minikube

```bash
minikube start --memory=6144
```

Adjust memory according to the resources available on your machine.

### 2. Build the container image

Build the image using the tag expected by the Kubernetes deployment configuration.

The image used during the verified Jenkins build was:

```bash
ccd-microservice-project:web-ci-test
```

If building directly inside Minikube, use:

```bash
minikube image build -t ccd-microservice-project:web-ci-test .
```

**Important:** The image name and tag must match the image configured in the Kubernetes manifest. If the manifest uses `imagePullPolicy: Never`, the image must already be available inside Minikube.

### 3. Apply the Kubernetes configuration

```bash
kubectl apply -f k8s-deployment.yaml
```

### 4. Check pod and service status

```bash
kubectl get pods
kubectl get services
```

During verification, the `ccd-web` pod reached `1/1 Running`. ChromaDB and Ollama were also running in the cluster.

Pod names can change when Kubernetes recreates workloads.

### 5. Download models into Ollama

Run these commands on the first deployment, or when the model storage has been reset:

```bash
kubectl exec -it deploy/ollama -- ollama pull phi3
kubectl exec -it deploy/ollama -- ollama pull nomic-embed-text
```

### 6. Ingest documents

```bash
kubectl exec -it deploy/ccd-web -- npm run ingest
```

### 7. Access the web service

```bash
minikube service ccd-web --url
```

Minikube prints a URL that can be used to access the service. On Windows with the Docker driver, keep the terminal running while using the URL. The port can change when the service tunnel restarts.

### 8. Verify the health endpoint

Append `/health` to the service URL printed by Minikube.

Example:

```powershell
Invoke-RestMethod "http://127.0.0.1:64184/health"
```

The port above is an example from a previous successful test; your current port may be different.

The health endpoint returned:

```text
status: ok
```

### Deployment Notes

- Ollama and ChromaDB may use ephemeral `emptyDir` storage in the current configuration. Models and stored vectors can be lost when the corresponding pods are recreated.
- Re-run model downloads and document ingestion if the required data is no longer present.
- When application code changes, rebuild the image and ensure the deployment uses the intended image tag.
- Opening `/` may display `Cannot GET /` if the backend is API-only. This does not necessarily mean the API is unavailable.
- The health endpoint and `/api/ask` are the relevant backend endpoints to test.

---

## 🔄 Jenkins CI/CD Pipeline Setup

The repository includes a declarative `Jenkinsfile` for GitHub-based continuous integration.

### Jenkins Configuration

1. Open Jenkins at `http://localhost:8090`.
2. Create or open the Pipeline job named `ccd-microservice-pipeline`.
3. Configure the pipeline:
   - **Definition:** Pipeline script from SCM
   - **SCM:** Git
   - **Repository URL:** `https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git`
   - **Branch Specifier:** `*/main`
4. Save the configuration and select **Build Now**.

### Verified Pipeline Stages

The Jenkins pipeline was successfully executed and performed the following tasks:

1. **Checkout Code:** Checks out the source code from GitHub.
2. **Build Verification:** Checks the project workspace, required files, tools, and JavaScript syntax.
3. **Container Image Build:** Builds the image `ccd-microservice-project:web-ci-test`.
4. **Image Inspection:** Inspects the built container image.

### Current CI/CD Status

- **Jenkins CI:** Successfully tested.
- **Docker image build:** Successfully tested by Jenkins.
- **Kubernetes deployment:** Running and tested separately on Minikube.
- **Automated registry push:** Not yet configured.
- **Automated Kubernetes rollout from Jenkins:** Not yet configured.

The current pipeline does not automatically push the image to a container registry or deploy it to Kubernetes. These capabilities require additional pipeline stages, credentials, and deployment configuration.

---

## 💡 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/ask` | `POST` | Accepts a question, retrieves relevant documents from ChromaDB, sends the augmented prompt to Ollama, and returns the generated answer. |
| `/health` | `GET` | Returns the service health status. |

### Request Body

```json
{
  "question": "Where does Chirayu live?"
}
```

### Example Response

```json
{
  "question": "Where does Chirayu live?",
  "contextUsed": "...the retrieved documents, one per line...",
  "answer": "Chirayu lives in Pune."
}
```

The response above is illustrative. The actual answer depends on the documents available to the RAG pipeline.

A missing `question` returns HTTP `400`. An upstream failure, such as an unavailable ChromaDB or Ollama service, returns HTTP `500` with a details message. The first request may take longer while the model loads.

---

## 🔀 Git and GitHub Workflow

The source repository is:

[cloud-native-microservice-pipeline](https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline)

To check the current changes:

```powershell
git status
```

To stage everything except `README.md`:

```powershell
git add .
git reset -- README.md
```

Verify the staged changes before committing:

```powershell
git status
```

Ensure `README.md` is not listed under **Changes to be committed**.

Commit and push the other changes:

```powershell
git commit -m "Update project files and CI pipeline"
git push origin main
```

These commands exclude README changes from the new commit. They do not remove an existing README from GitHub.

**Safety note:** Before using `git add .`, check that secrets, `.env` files, credentials, and large generated files are not being staged accidentally.

---

## 👨‍💻 Author

**Chirayu Agrawal**  
*Computer Science & Engineering Student*

- **GitHub:** [@ChirayuAgrawal-dev](https://github.com/ChirayuAgrawal-dev)

---

## 📌 Project Status Summary

- Aurora AI frontend is part of the project architecture.
- Node.js/Express RAG backend integrates with ChromaDB and Ollama.
- Docker image builds are verified through Jenkins.
- Jenkins CI pipeline has completed successfully.
- The backend is deployed on Minikube and the `/health` endpoint has returned `status: ok`.
- Automated image publishing and Kubernetes deployment from Jenkins remain future improvements.
