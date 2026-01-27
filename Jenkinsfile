
pipeline {
    agent any

  
    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['dev', 'main', 'prod'], description: 'Select the environment to deploy to')
    }

    environment {
        IMAGE_NAME = "nodejs-k8s-app"
        DOCKERHUB_USERNAME = "mgelvoleo"
        KEEP_IMAGES = "5"

        IMAGE_TAG = "${params.DEPLOY_ENV}-1.0.${BUILD_NUMBER}"
        K8S_PATH = "k8s/${params.DEPLOY_ENV}"
        INVENTORY_PATH = "ansible/inventories/${params.DEPLOY_ENV}/hosts"
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out correct branch for ${params.DEPLOY_ENV} environment"

                    def branchMapping = [
                        'dev': 'dev',
                        'main': 'main',
                        'prod': 'prod'
                    ]
                    
                    git url: "https://github.com/mgelvoleo/nodejs-project-cicd.git", branch: branchMapping[params.DEPLOY_ENV]
                }
                
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo 'Building Docker image...'
                    sh """
                        docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${params.DEPLOY_ENV}-latest
                    """
                }
            }
        }

      stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo ${DOCKER_PASS} | docker login -u ${DOCKERHUB_USERNAME} --password-stdin
                        docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${params.DEPLOY_ENV}-latest
                    """
                }
            }
        }

       stage('Cleanup Local Docker Images') {
            steps {
                script {
                    echo "🧹 Cleaning up local Docker images (keeping latest ${KEEP_IMAGES})"
                    sh """
                        docker images ${DOCKERHUB_USERNAME}/${IMAGE_NAME} --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
                        sort -rk2 | \
                        tail -n +\$((${KEEP_IMAGES}+1)) | \
                        awk '{print \$1}' | \
                        xargs -r docker rmi -f || true
                    """
                }
            }
        } 

        /* stage('Cleanup Docker Hub Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        echo "🧹 Cleaning up Docker Hub images (keeping latest ${KEEP_IMAGES})"
                        sh """
                            TOKEN=\$(curl -s -X POST https://hub.docker.com/v2/users/login/ \
                                -H "Content-Type: application/json" \
                                -d '{"username": "'\${DOCKER_USER}'", "password": "'\${DOCKER_PASS}'"}' | jq -r .token)

                            curl -s -H "Authorization: JWT \$TOKEN" \
                                "https://hub.docker.com/v2/repositories/\${DOCKER_USER}/${IMAGE_NAME}/tags/?page_size=100" | \
                            jq -r '.results | map(select(.name | startswith("1.0."))) | sort_by(.last_updated) | reverse | .[${KEEP_IMAGES}:] | .[].name' | \
                            while read TAG; do
                                echo "Deleting remote tag: \$TAG"
                                curl -s -X DELETE \
                                    -H "Authorization: JWT \$TOKEN" \
                                    "https://hub.docker.com/v2/repositories/\${DOCKER_USER}/${IMAGE_NAME}/tags/\$TAG/"
                            done
                        """
                    }
                }
            }
        } */

       /*  stage('Update K8s Deployment') {
            steps {
                script {
                    echo 'Updating deployment manifest with new image tag...'
                    sh """
                        sed -i 's|image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:.*|image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}|' k8s/dev/deployment.yaml
                    """
                }
            }
        }
 */
        /* stage('Deploy to Kubernetes') {
            steps {
                sshagent(['ssh-k8s']) {
                    script {
                        echo 'Deploying to Kubernetes cluster...'
                        sh """
                            ansible-playbook -i ansible/inventories/${ENV}/hosts ansible/playbooks/deploy.yml
                        """
                    }
                }
            }
        } */
    
        
        
    }
}
