pipeline {
    agent any

    stages {
        stage('Cloner le dépôt') {
            steps {
                git branch: 'main', url: 'https://github.com/Chouroukchaker1/devop.git', credentialsId: 'github-token'
            }
        }

        stage('Lancer Docker Compose') {
            steps {
                sh 'docker-compose up -d --build'
            }
        }
    }
}
