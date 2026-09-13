# Сборка фронтенда на Bun и раздача статики через nginx
FROM oven/bun:1-alpine AS build
WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_API_MODE=real
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_MODE=$VITE_API_MODE

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
