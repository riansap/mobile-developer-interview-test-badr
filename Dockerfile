FROM node:lts-alpine

ENV TZ=Asia/Jakarta

WORKDIR /app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package*.json /app/

RUN npm install

COPY . /app

ARG PORT
ENV PORT $PORT
EXPOSE $PORT

RUN npm run build

USER node

CMD [ "node", "-r", "./dist/apm", "./dist/bin/www" ]