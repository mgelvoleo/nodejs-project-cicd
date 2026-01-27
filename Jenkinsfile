pipeline {
    agent any

    environment {
        IMAGE_NAME = "nodejs-k8s-app"
        DOCKERHUB_USERNAME = "mgelvoleo"
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        KEEP_IMAGES = "5"

        
    }

    stages {

        stage('Set Environment') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'dev') {
                        env.ENV = 'dev'
                    } else if (env.BRANCH_NAME == 'main') {
                        env.ENV = 'main'
                    } else {
                        env.ENV = 'prod'
                    }

                    echo "🚀 Branch: ${env.BRANCH_NAME}"
                    echo "🌍 Target ENV: ${env.ENV}"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} .
                """
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
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                        docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        /*stage('Update K8s Manifest') {
            steps {
                sh """
                    sed -i 's|image:.*|image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}|' \
                    k8s/${env.ENV}/deployment.yaml
                """
            }
        }*/

        /* stage('Deploy to Kubernetes') {
            steps {
                sshagent(['ssh-k8s']) {
                    sh """
                        ansible-playbook \
                        -i ansible/inventories/${env.ENV}/hosts \
                        ansible/playbooks/deploy.yml
                    """
                }
            }
        } */

    }
}
