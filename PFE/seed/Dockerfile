FROM node:18
WORKDIR /app

# Copier le package.json pour installer bcrypt et mongodb
COPY package.json ./
RUN npm install

# Puis copier le script de seed
COPY seed-usersettings.js .

CMD ["node", "seed-usersettings.js"]
