# syntax=docker/dockerfile:1
# Build context MUST be the repository root, e.g.:
#   docker build -f deploy/docker/web.Dockerfile -t mtart/web .
#
# NOTE: The React app (src/Web/mtart-web) is scaffolded in Phase 3 of the roadmap.
# This Dockerfile is prepared ahead of time so the "web" service in docker-compose.yml
# is ready to enable as soon as the frontend exists; until then it stays behind the
# "web" compose profile so `docker compose up` for the backend does not require it.
FROM node:22-alpine AS build
WORKDIR /app

COPY src/Web/mtart-web/package*.json ./
RUN npm ci

COPY src/Web/mtart-web/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS final
COPY deploy/docker/nginx/mtart-web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
