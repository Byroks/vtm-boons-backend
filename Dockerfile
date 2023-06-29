FROM node:20

WORKDIR /usr/app

# COPY package.json .
COPY package-lock.json .

RUN npm ci --production

COPY . .

EXPOSE 3000

CMD [ "node", "." ]