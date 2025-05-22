pipeline {
    agent any

    stages {
        stage('Nettoyer workspace') {
            steps {
                echo "🧹 Nettoyage complet du workspace"
                deleteDir()
            }
        }

        stage('Cloner le dépôt') {
            steps {
                echo "📥 Clonage du dépôt GitHub"
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'refs/heads/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Chouroukchaker1/devop.git',
                        credentialsId: 'github-token'
                    ]]
                ])
            }
        }

        stage('Vérifier docker-compose.yml') {
            steps {
                script {
                    if (!fileExists('docker-compose.yml')) {
                        error "❌ Le fichier docker-compose.yml est introuvable à la racine du dépôt."
                    } else {
                        echo "✅ docker-compose.yml trouvé !"
                    }
                }
            }
        }

        stage('Lancer Docker Compose') {
            steps {
                echo "🚀 Lancement du build avec docker-compose"
                sh "docker-compose up -d --build"
            }
        }
    }
}
