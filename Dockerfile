FROM node:18-alpine

# Install jq and other utilities if needed
RUN apk add --no-cache jq curl

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

ENV APP_VERSION=1.0.0

CMD ["npm", "start"]
