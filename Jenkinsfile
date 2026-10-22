


pipeline {
    agent {
        label 'docker-build'
    }

    options {
        timestamps()
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME = 'ccd-microservice-project'
        IMAGE_TAG  = 'web-ci-test'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Build Agent') {
            steps {
                echo 'Checking Linux build agent...'
                sh '''
                    set -eu
                    echo "Agent: $(hostname)"
                    node --version
                    npm --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -eu
                    npm install --no-audit --no-fund
                '''
            }
        }

        stage('Syntax Check') {
            steps {
                sh '''
                    set -eu
                    node --check server.js
                    node --check ingest.js
                    node --check embeddings.js
                    echo "JavaScript syntax checks passed."
                '''
            }
        }

        stage('Verify Project Files') {
            steps {
                sh '''
                    set -eu
                    test -f package.json
                    test -f package-lock.json
                    test -f server.js
                    test -f ingest.js
                    test -f embeddings.js
                    test -f Dockerfile
                    test -f deploy.ps1
                    echo "Required project files are present."
                '''
            }
        }

        stage('Build and Deploy to Minikube') {
            agent {
                label 'windows-deploy'
            }

            steps {
                // The Windows agent has its own workspace.
                checkout scm

                echo 'Checking Docker and Kubernetes on Windows...'

                powershell '''
                    $ErrorActionPreference = "Stop"

                    docker version
                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker daemon is unavailable to the Windows agent."
                    }

                    minikube status
                    if ($LASTEXITCODE -ne 0) {
                        throw "Minikube is not ready."
                    }

                    kubectl get deployment ccd-web
                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes deployment ccd-web was not found."
                    }
                '''

                echo 'Building and verifying Docker image...'

                powershell '''
                    $ErrorActionPreference = "Stop"

                    $image = "$env:IMAGE_NAME`:$env:IMAGE_TAG"

                    docker build --tag $image .
                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image build failed."
                    }

                    docker image inspect $image
                    if ($LASTEXITCODE -ne 0) {
                        throw "Built Docker image could not be verified."
                    }
                '''

                echo 'Loading image and deploying to Minikube...'

                powershell '''
                    $ErrorActionPreference = "Stop"

                    if (-not (Test-Path ".\\deploy.ps1")) {
                        throw "deploy.ps1 was not found."
                    }

                    & ".\\deploy.ps1"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Deployment script failed."
                    }
                '''
            }
        }
    }

    post {
        success {
            echo 'Code validation, Docker build, and Minikube deployment completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Inspect the stage logs for the failing step.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
