pipeline {
    agent any
    
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
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDS_ID}") {
                        def customImage = docker.build("${IMAGE_NAME}:${TAG}")
                        customImage.push()
                        customImage.push('latest')
                    }
                }
            }
        }

        stage('4. Automated Deploy to Kubernetes') {
            steps {
                sh "sed -i 's|image:.*|image: ${IMAGE_NAME}:${TAG}|g' k8s-deployment.yaml"
                sh 'kubectl apply -f k8s-deployment.yaml'
            }
        }
    }

    post {
        success {
            echo 'Pipeline executed successfully! Microservice updated and deployed to Kubernetes.'
        }
        failure {
            echo 'Pipeline failed during execution. Check logs for details.'
        }
    }
}