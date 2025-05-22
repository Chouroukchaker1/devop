pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM',
                          branches: [[name: '*/main']], // Replace 'main' with your branch
                          userRemoteConfigs: [[url: 'https://github.com/Chouroukchaker1/devop.git']]])
            }
        }
        stage('Vérifier Docker Compose') {
            steps {
                script {
                    if (!fileExists('docker-compose.yml')) {
                        error "❌ Le fichier docker-compose.yml est introuvable."
                    } else {
                        echo "✅ docker-compose.yml trouvé !"
                    }
                }
            }
        }
        stage('Lancer Docker Compose') {
            steps {
                sh "docker-compose up -d --build"
            }
        }
    }
}