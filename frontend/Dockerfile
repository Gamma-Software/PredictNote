# frontend/Dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve with a simple server like serve
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]