# Usa una imagen base de Node.js
FROM node:20-alpine

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias de la aplicación
RUN npm install

# Expone el puerto en el que se ejecuta la aplicación
EXPOSE 3000

# Copia el resto del código de la aplicación al contenedor
COPY . .

# Define el comando para iniciar la aplicación
CMD ["npm", "start"]