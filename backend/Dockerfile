# 백엔드(NestJS) 운영 이미지 — Lightsail momong-prod-api 에서 docker compose 로 띄운다.
# bcrypt 가 네이티브 모듈이라 미리 빌드된 바이너리가 있는 Debian(glibc) slim 을 쓴다 (alpine 은 빌드 도구가 필요).
# 설정 · 실행 방법: deploy/lightsail/README.md

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# 운영 DB 에 직접 적용하는 SQL 도 이미지에 같이 넣어 둔다 (서버에서 psql 로 실행)
COPY --from=build /app/migrations ./migrations
USER node
EXPOSE 3200
CMD ["node", "dist/main"]
