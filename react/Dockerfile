# Étape 1 : build
FROM node:18 as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Étape 2 : Nginx pour servir le build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
