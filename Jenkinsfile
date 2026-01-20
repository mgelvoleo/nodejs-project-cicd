pipeline {
    agent any

    environment {
        IMAGE_NAME = "nodejs-k8s-app"
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        DOCKERHUB_USERNAME = "mgelvoleo"
        KEEP_IMAGES=2
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

        stage('Push to DockerHub') {
            steps {
                script {
                    echo '=== Pushing to DockerHub ==='
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                            docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}
                            docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }

        stage('Cleanup Local Docker Images') {
            steps {
                sh '''
                
                echo "🧹 Cleaning up local Docker images (keeping latest $KEEP_IMAGES)"

                docker images "${DOCKERHUB_USERNAME}/${IMAGE_NAME}" \
                --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
                sort -rk2 | \
                tail -n +$((KEEP_IMAGES+1)) | \
                awk '{print $1}' | \
                xargs -r docker rmi -f
                '''
            }
        }

    }
    
}