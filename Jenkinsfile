pipeline {
    agent any

    environment {
        IMAGE_NAME = "nodejs-k8s-app"
        DOCKERHUB_USERNAME = "mgelvoleo"
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        KEEP_IMAGES = "5"

        ENV = "${env.BRANCH_NAME == 'main' ? 'prod' :
               env.BRANCH_NAME == 'test' ? 'test' : 'dev'}"
    }

    stages {

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

        stage('Update K8s Manifest') {
            steps {
                sh """
                    sed -i 's|image:.*|image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}|' \
                    k8s/${ENV}/deployment.yaml
                """
            }
        }

        /* stage('Deploy to Kubernetes') {
            steps {
                sshagent(['ssh-k8s']) {
                    sh """
                        ansible-playbook \
                        -i ansible/inventories/${ENV}/hosts \
                        ansible/playbooks/deploy.yml
                    """
                }
            }
        } */

    }
}
