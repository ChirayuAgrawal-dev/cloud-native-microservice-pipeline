
pipeline {
    agent any

    tools {
        nodejs 'NodeJS20'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('2. Verify Environment') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('3. Install Dependencies') {
            steps {
                sh 'npm install --no-audit --no-fund'
            }
        }

        stage('4. Validate Source') {
            steps {
                sh 'node --check server.js'
                sh 'node --check ingest.js'
                sh 'node --check embeddings.js'
                sh 'test -f Dockerfile'
                sh 'test -f k8s-deployment.yaml'
                sh 'test -f package.json'
                echo 'Source and required deployment files validated.'
            }
        }
    }

    post {
        success {
            echo 'CI checks passed. No deployment was performed.'
        }

        failure {
            echo 'CI checks failed. Review the console output.'
        }

        always {
            echo 'Pipeline finished.'
        }
    }
}
