pipeline {
  agent any

  environment {
    IMAGE_NAME_FRONT = "chouroukchaker/devop-frontend"
    IMAGE_NAME_BACK = "chouroukchaker/devop-backend"
  }

  stages {
    stage('Build Frontend') {
      steps {
        dir('react') {
          sh 'docker build -t $IMAGE_NAME_FRONT .'
        }
      }
    }

    stage('Build Backend') {
      steps {
        dir('PFE') {
          sh 'docker build -t $IMAGE_NAME_BACK .'
        }
      }
    }

    stage('Push Images to DockerHub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh 'docker push $IMAGE_NAME_FRONT'
          sh 'docker push $IMAGE_NAME_BACK'
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
