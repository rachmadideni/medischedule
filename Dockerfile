FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build

ENTRYPOINT ["node", "dist/index.js"]
