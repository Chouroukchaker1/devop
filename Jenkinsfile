pipeline {
    agent any

    stages {
        stage('Cloner le dépôt') {
            steps {
                git branch: 'main', url: 'https://github.com/Chouroukchaker1/devop.git', credentialsId: 'github-token'
            }
        }

        stage('Vérifier Docker Compose') {
            steps {
                script {
                    if (!fileExists('docker-compose.yml')) {
                        error "❌ Le fichier docker-compose.yml est introuvable. Assure-toi qu'il est bien présent à la racine du dépôt."
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
