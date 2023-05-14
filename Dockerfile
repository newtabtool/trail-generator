FROM ghcr.io/puppeteer/puppeteer:19.4.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
    max_tokens=50
    OPENAI_API_KEY =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
    token_=abrcgfdihdgnh343ne56

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "server.js" ]