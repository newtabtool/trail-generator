FROM ghcr.io/puppeteer/puppeteer:19.4.0

# Instala o Redis
RUN apt-get update && \
    apt-get install -y redis-server

# Configuração do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Configuração do diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos da aplicação
COPY package*.json ./
RUN npm ci
COPY . .

# Inicia o servidor Redis
CMD ["redis-server"]

# Inicia a aplicação
CMD [ "node", "server.js" ]
