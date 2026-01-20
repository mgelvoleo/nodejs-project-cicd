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

        stage('Cleanup Docker Hub Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo "🧹 Cleaning up Docker Hub images (keeping latest ${KEEP_IMAGES})"

                    TOKEN=$(curl -s -X POST https://hub.docker.com/v2/users/login/ \
                    -H "Content-Type: application/json" \
                    -d '{"username": "'$DOCKER_USER'", "password": "'$DOCKER_PASS'"}' | jq -r .token)

                    curl -s -H "Authorization: JWT $TOKEN" \
                    "https://hub.docker.com/v2/repositories/${DOCKER_USER}/${IMAGE_NAME}/tags/?page_size=100" | \
                    jq -r '.results // [] 
                        | map(select(.name | startswith("1.0."))) 
                        | sort_by(.last_updated) 
                        | reverse 
                        | .[${KEEP_IMAGES}:] 
                        | .[].name' | \
                    while read TAG; do
                        echo "Deleting remote tag: $TAG"
                        curl -s -X DELETE \
                        -H "Authorization: JWT $TOKEN" \
                        "https://hub.docker.com/v2/repositories/${DOCKER_USER}/${IMAGE_NAME}/tags/$TAG/"
                    done
                    '''
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