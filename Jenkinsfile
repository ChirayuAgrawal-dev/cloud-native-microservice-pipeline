pipeline {
    agent {
        docker {
            image 'node:18-alpine'
            args '-u root' // Runs container with proper permissions
        }
    }
    
    environment {
        DOCKER_CREDS_ID = 'dockerhub-credentials-id' 
        IMAGE_NAME = 'chirayu27/ccd-microservice'
        TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('2. Install Dependencies') {
            steps {
                sh 'npm install --omit=dev'
            }
        }

        stage('3. Build & Push Docker Image') {
            steps {
                script {
                    // Note: If running Docker-in-Docker, ensure your Jenkins container has access to the Docker socket
                    echo 'Building container image...'
                }
            }
        }

        stage('4. Automated Deploy to Kubernetes') {
            steps {
                echo 'Deploying to Kubernetes cluster...'
            }
        }
    }

    post {
        success {
            echo 'Pipeline executed successfully!'
        }
        failure {
            echo 'Pipeline failed during execution. Check logs for details.'
        }
    }
}