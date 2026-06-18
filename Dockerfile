FROM node:23.11.0

WORKDIR /app
COPY package*.json ./
Run npm install

COPY . .

CMD npm run start:dev