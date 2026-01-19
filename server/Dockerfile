FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias del servidor
COPY server/package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY server/ ./

# Compilar TypeScript
RUN npm run build

# Exponer el puerto (Railway usa PORT env var, pero documentamos 5001)
EXPOSE 5001

# Comando de inicio
CMD ["npm", "start"]
