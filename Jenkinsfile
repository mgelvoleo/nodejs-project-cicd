pipeline {
    agent any

    environment {
        IMAGE_NAME = "nodejs-k8s-app"
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        DOCKERHUB_USERNAME = "mgelvoleo"
    }

    stages {
        
        stage('Checkout') {
            steps {
                echo '=== Checking out source code ==='
                git url: "https://github.com/mgelvoleo/nodejs-project-cicd.git", branch: 'main'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo '=== Building Docker image ==='
                    sh """
                        docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
                    """
                }
            }
        }
    }
    
}