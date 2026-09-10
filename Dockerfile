###################
# BUILD
###################

FROM node:22-alpine AS build-stage

WORKDIR /app

# Vite inlines import.meta.env.VITE_* into the bundle at BUILD time, so the API
# base URL has to be known here -- it cannot be supplied via `docker run -e`.
#
# The default is relative on purpose: nginx (below) proxies /api/ to the API
# container, which keeps one image usable against any host and sidesteps CORS.
# Every call site concatenates directly (`${VITE_APP_API_URL}auth/refresh`), so
# the value MUST keep its trailing slash.
ARG VITE_APP_API_URL=/api/
ENV VITE_APP_API_URL=$VITE_APP_API_URL

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

###################
# PRODUCTION
###################

FROM nginx:1.27-alpine AS production-stage

RUN mkdir -p /app

COPY --from=build-stage /app/dist /app
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
