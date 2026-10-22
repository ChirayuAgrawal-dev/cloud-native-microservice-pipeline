 
# Cloud-Native AI Microservice & Automated CI/CD Pipeline

A cloud-native AI application combining the **Aurora AI frontend** with a Retrieval-Augmented Generation (RAG) backend. The system uses Node.js and Express for API handling, ChromaDB for semantic document retrieval, and Ollama for local LLM inference. It is containerized with Docker, deployed on a local Kubernetes cluster using Minikube, and integrated with Jenkins for continuous integration and continuous deployment (CI/CD).

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

1. **Aurora AI Frontend (`ccd-frontend`):** The user-facing interface through which users enter questions and view AI-generated answers.
2. **RAG API / Backend (`ccd-web`):** A Node.js/Express service exposing `POST /api/ask`. It processes questions, generates embeddings, retrieves relevant documents, builds an augmented prompt, and sends it to Ollama.
3. **ChromaDB (`chromadb`):** Stores document embeddings in the `rag_documents` collection and returns relevant context for incoming questions.
4. **Ollama (`ollama`):** Runs the language model for answer generation and the embedding model for vector creation.
5. **Document Ingestion (`ingest.js`):** Loads document embeddings into ChromaDB. The same embedding function is used for stored documents and incoming questions.
6. **Docker:** Packages the application into container images and provides a consistent runtime environment.
7. **Jenkins CI/CD Pipeline:** Checks out the repository, validates JavaScript and project files, builds and verifies the Docker image, and deploys the application to Minikube using the Windows deployment agent.
8. **Kubernetes Deployment:** Runs the frontend, web backend, ChromaDB, and Ollama as separate workloads on Minikube.

### Frontend–Backend Integration

The application follows this request/response flow:

1. A user enters a question in Aurora AI.
2. The frontend sends the question to the backend API at `POST /api/ask`.
3. The backend creates an embedding for the question using `nomic-embed-text`.
4. ChromaDB retrieves the most relevant documents from `rag_documents`.
5. The backend adds the retrieved context to the prompt and sends it to Ollama.
6. Ollama uses `phi3` to generate an answer.
7. The backend returns the response to the frontend, which displays it to the user.

### Jenkins Node Architecture

The Jenkins setup uses separate nodes to divide CI/CD responsibilities.

- **Built-In Node:** Hosts the Jenkins controller, manages jobs, schedules pipeline stages, and coordinates the agents.
- **Linux `docker-build-agent`:** Checks out the repository, installs Node.js dependencies, validates JavaScript syntax, and verifies required project files.
- **Windows `windows-deploy`:** Checks Docker and Minikube availability, builds and verifies the Docker image using Docker Desktop, and executes `deploy.ps1` to load the image into Minikube and update the Kubernetes deployment.

Windows deployment agent startup: The windows-deploy agent has been configured and tested, but automatic startup after a Windows restart has not yet been configured. Until automatic startup is set up, the agent may need to be launched manually after a restart.

The Linux agent does not need direct access to Docker's unauthenticated TCP port `2375`. Docker image building and Minikube deployment are performed by the Windows agent, which has access to the Windows Docker Desktop and Kubernetes environment.

### Configuration

The web service uses the following environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama API endpoint |
| `CHROMA_HOST` | `http://chromadb:8000` | ChromaDB endpoint |
| `EMBED_MODEL` | `nomic-embed-text` | Model used to generate embeddings |
| `PORT` | `3000` | Express server port |

These defaults use Docker Compose or Kubernetes service names. They must be appropriate for the environment in which the backend is running.

---

## 🛠️ Prerequisites

Install the following tools before running the project:

- [Docker Desktop](https://www.docker.com/) with the WSL 2 backend on Windows
- [Node.js](https://nodejs.org/) version 18 or higher
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- `kubectl` for Kubernetes management
- [Jenkins](https://www.jenkins.io/) running locally or in a container, with the required plugins and agent configuration
- Git and a GitHub account
- Sufficient RAM and disk space for the containers and Ollama models

The `phi3` model download is approximately 2.2 GB. Actual memory usage depends on the model configuration, workload, and runtime environment.

---

## ⚙️ Local Execution with Docker Compose

Docker Compose can run the web backend, ChromaDB, Ollama, and the frontend when the corresponding services are defined in `docker-compose.yml`.

### 1. Clone the repository

```bash
git clone https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git
cd cloud-native-microservice-pipeline
```

### 2. Build and start the containers

```bash
docker compose up --build -d
```

Check the container status:

```bash
docker compose ps
```

### 3. Download the Ollama models

Run these commands after the Ollama container is running:

```bash
docker compose exec ollama ollama pull phi3
docker compose exec ollama ollama pull nomic-embed-text
```

### 4. Ingest documents

```bash
docker compose exec web npm run ingest
```

This populates the ChromaDB collection with the documents configured by the ingestion script.

### 5. Access Aurora AI

Open the frontend in your browser:

**http://localhost:8080**

The frontend is served through its configured Nginx container.

### 6. Test the API

If the Compose configuration publishes backend port `3000` to the host, the API is available at:

`http://localhost:3000/api/ask`

Using curl:

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What information is available in the knowledge base?"}'
```

Using Windows PowerShell:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/ask" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"question":"What information is available in the knowledge base?"}'
```

The request must use the JSON field expected by the backend: `question`.

---

## ☸️ Kubernetes Deployment (Minikube)

The project has been deployed and tested on a local Minikube cluster.

The current Kubernetes environment includes the following workloads:

- `ccd-frontend` — Aurora AI frontend
- `ccd-web` — web backend and RAG API
- `chromadb` — vector database
- `ollama` — local LLM inference
- `rag-ingest` — document ingestion job

### 1. Start Minikube

If Minikube is not already running:

```bash
minikube start --memory=6144
```

Adjust memory according to the resources available on your machine. If the cluster is already running, check its status first:

```bash
minikube status
```

### 2. Build the Docker image

The Jenkins pipeline builds the following image:

```text
ccd-microservice-project:web-ci-test
```

When building directly inside Minikube, use:

```bash
minikube image build -t ccd-microservice-project:web-ci-test .
```

The image name and tag must match the image configured in the Kubernetes deployment. If the manifest uses `imagePullPolicy: Never`, the image must already exist inside Minikube.

### 3. Apply the Kubernetes configuration

```bash
kubectl apply -f k8s-deployment.yaml
```

The exact set of resources created depends on the manifests and any additional configuration files in the repository.

### 4. Check pod and service status

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

The verified cluster showed the frontend, backend, ChromaDB, and Ollama pods in the `Running` state, with each application pod reporting `1/1` ready. The `rag-ingest` job reported `Completed`.

Pod names can change when Kubernetes recreates workloads.

### 5. Download models into Ollama

Run these commands on the first deployment or if the required models are missing from Ollama's storage:

```bash
kubectl exec -it deployment/ollama -- ollama pull phi3
kubectl exec -it deployment/ollama -- ollama pull nomic-embed-text
```

### 6. Ingest documents

If the knowledge base needs to be populated or refreshed, run:

```bash
kubectl exec -it deployment/ccd-web -- npm run ingest
```

This command assumes the backend image contains the ingestion script and its npm script is configured.

### 7. Access Aurora AI

The verified Kubernetes services use these NodePort mappings:

| Service | Type | Port mapping |
|---|---|---|
| `ccd-frontend` | NodePort | `80:30080` |
| `ccd-web` | NodePort | `3000:32638` |
| `chromadb` | ClusterIP | `8000` |
| `ollama` | ClusterIP | `11434` |

To obtain the frontend URL:

```bash
minikube service ccd-frontend --url
```

To obtain the backend service URL:

```bash
minikube service ccd-web --url
```

On Windows with the Docker driver, Minikube may return a temporary URL such as `http://127.0.0.1:<port>`. Keep the terminal running while using that URL. The port may change when the service tunnel restarts.

**Frontend and backend URLs serve different purposes:**

- The frontend URL opens the Aurora AI dashboard.
- The backend URL exposes the Express service; it is not the dashboard.
- ChromaDB and Ollama are internal `ClusterIP` services and are intended to be reached by other workloads inside the cluster.

### 8. Verify deployment health

Check the rollout status of the deployments:

```bash
kubectl rollout status deployment/ccd-frontend
kubectl rollout status deployment/ccd-web
kubectl rollout status deployment/chromadb
kubectl rollout status deployment/ollama
```

If the backend exposes a health endpoint, obtain the current backend URL and append `/health`:

```text
<backend-service-url>/health
```

The backend health endpoint previously returned:

```text
status: ok
```

The exact URL depends on the current Minikube service tunnel.

### Deployment Notes

- Ollama and ChromaDB may use ephemeral `emptyDir` storage in the current configuration. Models and stored vectors can be lost when the corresponding pods are recreated.
- Re-run model downloads and document ingestion if the required data is no longer present.
- When application code changes, rebuild the image and ensure the deployment uses the intended image tag.
- Opening `/` on the backend may display `Cannot GET /` if the backend is API-only. This does not necessarily mean the API is unavailable.
- The first AI request may take longer if the model needs to load or the runtime is under resource pressure.
- The local Docker Compose and Minikube environments use different networking paths. Response times may differ between them.
- On Windows, keep the terminal running when using a temporary Minikube service URL.

---

## 🔄 Jenkins CI/CD Pipeline Setup

The repository includes a declarative `Jenkinsfile` that integrates GitHub, a Linux validation agent, a Windows deployment agent, Docker Desktop, and Minikube.

### Jenkins Configuration

1. Open Jenkins at `http://localhost:8090`.
2. Open the existing Pipeline job, `ccd-microservice-pipeline`.
3. Configure the pipeline to use the repository's `Jenkinsfile`:
   - **Definition:** Pipeline script from SCM
   - **SCM:** Git
   - **Repository URL:** `https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline.git`
   - **Branch Specifier:** `*/main`
4. Save the configuration.
5. Select **Build Now** to run the pipeline.
6. Open the build's **Console Output** to inspect the stage results.

### Jenkins Nodes and Responsibilities

| Node | Responsibility |
|---|---|
| Built-In Node | Jenkins controller, job scheduling, pipeline orchestration |
| `docker-build-agent` | Linux-based source checkout, dependency installation, syntax validation, and project-file checks |
| `windows-deploy` | Docker image build and verification, image loading into Minikube, and Kubernetes deployment |

Separating these responsibilities allows the pipeline to validate the source code on Linux while using the Windows environment that has access to Docker Desktop and the local Minikube cluster.

### Verified Pipeline Stages

The Jenkins pipeline has completed successfully with all stages passing.

1. **Checkout:** Retrieves the repository source code from GitHub.
2. **Verify Build Agent:** Checks that Node.js and npm are available on the Linux build agent.
3. **Install Dependencies:** Installs the Node.js project dependencies.
4. **Syntax Check:** Runs `node --check` against `server.js`, `ingest.js`, and `embeddings.js`.
5. **Verify Project Files:** Checks that the required project files, including the Dockerfile and `deploy.ps1`, exist.
6. **Verify Windows Environment:** Checks Docker, Minikube, and the existing `ccd-web` Kubernetes deployment.
7. **Build Docker Image:** Builds `ccd-microservice-project:web-ci-test` using Docker Desktop.
8. **Verify Docker Image:** Inspects the built image to confirm it exists.
9. **Deploy to Minikube:** Executes `deploy.ps1` on the Windows deployment agent.
10. **Load and Update Deployment:** Loads the built image into Minikube, updates the `ccd-web` deployment, waits for rollout completion, and checks deployment and pod status.

### How the Deployment Script Works

The `deploy.ps1` script automates the following operations:

1. Checks that Minikube is ready.
2. Confirms that the expected Docker image exists.
3. Loads the image into Minikube.
4. Updates the container image for the `ccd-web` deployment.
5. Waits for the rollout and checks the resulting deployment and pods.

The deployment script updates the backend deployment. Other Kubernetes workloads, including the frontend, ChromaDB, and Ollama, remain managed by their respective Kubernetes configurations.

### Current CI/CD Status

- **GitHub source integration:** Configured.
- **Jenkins Linux validation agent:** Configured.
- **Jenkins Windows deployment agent:** Configured.
- **JavaScript validation:** Successfully tested.
- **Docker image build and inspection:** Successfully tested.
- **Automated backend deployment to Minikube:** Successfully tested through Jenkins.
- **Kubernetes rollout verification:** Included in the deployment script.
- **Automated image publishing to a remote registry:** Not configured.
- **Automated deployment of every Kubernetes workload from Jenkins:** Not included in the current backend deployment stage.
- **Automatic Windows agent startup:** Not yet configured; remains a future improvement.

The Jenkins pipeline is a working local CI/CD workflow. It does not require an unauthenticated Docker TCP endpoint on port `2375`.

---

## 💡 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/ask` | `POST` | Accepts a question, retrieves relevant documents from ChromaDB, sends the augmented prompt to Ollama, and returns the generated answer. |
| `/health` | `GET` | Returns the service health status, if enabled in the backend implementation. |

### Request Body

```json
{
  "question": "What information is available in the knowledge base?"
}
```

### Example Response

```json
{
  "question": "What information is available in the knowledge base?",
  "contextUsed": "...retrieved document context...",
  "answer": "...generated answer..."
}
```

The response above is illustrative. The actual answer and retrieved context depend on the documents available to the RAG pipeline and the implementation of the API response.

A missing `question` returns HTTP `400`. An upstream failure, such as an unavailable ChromaDB or Ollama service, can return HTTP `500` with error details, depending on the backend's error handling.

---

## 🔀 Git and GitHub Workflow

The source repository is:

[cloud-native-microservice-pipeline](https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline)

Check the current changes:

```powershell
git status
```

Review the differences in the README:

```powershell
git diff -- README.md
```

Stage the README and any other intended changes:

```powershell
git add README.md
```

If you also intend to publish other modified files, stage them individually after reviewing their changes:

```powershell
git add Jenkinsfile deploy.ps1
```

Verify what will be committed:

```powershell
git status
git diff --cached
```

Commit and push the changes:

```powershell
git commit -m "Update README with verified CI/CD workflow"
git push origin main
```

If Git reports that the remote branch has newer commits, resolve the synchronization issue before pushing. Do not overwrite remote changes without reviewing them.

**Safety note:** Before staging files, check that secrets, `.env` files, credentials, Jenkins agent secrets, and large generated files are not being committed accidentally.

---

## 👨‍💻 Author

**Chirayu Agrawal**  
*Computer Science & Engineering Student*

- **GitHub:** [@ChirayuAgrawal-dev](https://github.com/ChirayuAgrawal-dev)

---

## 📌 Project Status Summary

- Aurora AI frontend is deployed in Kubernetes and is also available through the Docker Compose configuration.
- The Node.js/Express RAG backend integrates with ChromaDB and Ollama.
- The `phi3` model generates answers, while `nomic-embed-text` generates embeddings.
- Docker image builds and verification are automated through Jenkins.
- The Jenkins pipeline has completed successfully, including automated deployment of the backend to Minikube.
- The Kubernetes frontend, backend, ChromaDB, and Ollama pods were verified as running.
- The `rag-ingest` job completed successfully.
- The backend health endpoint has previously returned `status: ok`.
- Publishing images to a remote container registry and automating deployment of every Kubernetes workload remain possible future improvements.
