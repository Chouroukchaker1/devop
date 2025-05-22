# Utiliser l'image Node officielle
FROM node:18

# Installer Python 3, pip et créer alias pour python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    apt-get clean && \
    ln -s /usr/bin/python3 /usr/bin/python

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances Node.js
COPY package*.json ./
RUN npm install

# Copier requirements.txt AVANT le code source
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt && pip3 show pandas

# Copier le reste du projet
COPY . .

# Exposer le port utilisé dans server.js
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
