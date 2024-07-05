ARG NODE_IMAGE=node:18-alpine3.17

FROM $NODE_IMAGE as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ .

FROM nginx as production-stage
RUN mkdir /app
COPY --from=build-stage /app/dist /app
COPY nginx.conf /etc/nginx/nginx.conf