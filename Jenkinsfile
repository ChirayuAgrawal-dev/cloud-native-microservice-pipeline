
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
                echo 'Checking Node.js, npm, and Docker on the dedicated agent...'

                sh '''
                    set -eu
                    echo "Agent: $(hostname)"
                    node --version
                    npm --version
                    docker version
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

                    echo "Required project files are present."
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    set -eu

                    docker build \
                      --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
                      .

                    echo "Docker image built successfully."
                '''
            }
        }

        stage('Verify Docker Image') {
            steps {
                sh '''
                    set -eu

                    docker image inspect \
                      "${IMAGE_NAME}:${IMAGE_TAG}" \
                      --format 'Image ID: {{.Id}}'

                    docker image ls "${IMAGE_NAME}:${IMAGE_TAG}"
                '''
            }
        }
    }

    post {
        success {
            echo 'CI and Docker image build completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check the stage logs above.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
