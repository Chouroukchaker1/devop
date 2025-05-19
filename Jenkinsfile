pipeline {
  agent any

  environment {
    IMAGE_NAME = "tonutilisateurdocker/devop-frontend"
    BACKEND_IMAGE = "tonutilisateurdocker/devop-backend"
  }

  stages {
    stage('Checkout') {
      steps {
        git 'https://github.com/Chouroukchaker1/devop.git'

'
      }
    }

    stage('Build Frontend') {
      steps {
        dir('react') {
          sh 'docker build -t $IMAGE_NAME .'
        }
      }
    }

    stage('Build Backend') {
      steps {
        dir('PFE') {
          sh 'docker build -t $BACKEND_IMAGE .'
        }
      }
    }

    stage('Push Images to DockerHub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh 'docker push $IMAGE_NAME'
          sh 'docker push $BACKEND_IMAGE'
        }
      }
    }

    stage('Deploy with Helm') {
      steps {
        sh 'helm upgrade --install frontend ./react/helm-charts'
        sh 'helm upgrade --install backend ./PFE/backend-chart'
      }
    }
  }
}
