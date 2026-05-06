# base stage, used by all later stages
FROM node:24.11.1 AS base
# working directory
WORKDIR /medi_routines_frontend
# copy dependencies
COPY package.json package-lock.json ./
# install deps
RUN npm install
COPY . .

# client dev stage
FROM base AS dev
# start dev server
CMD ["npm", "run", "dev", "--", "--host"]

# builder stage, just builds for production
FROM base AS builder
ARG VITE_MEDI_ROUTINES_SERVER_URL
ARG VITE_TIMEZONES_SERVER_URL=https://timeapi.io
ENV VITE_MEDI_ROUTINES_SERVER_URL=$VITE_MEDI_ROUTINES_SERVER_URL
ENV VITE_TIMEZONES_SERVER_URL=$VITE_TIMEZONES_SERVER_URL
RUN npm run build

# final production stage
FROM nginx:1.27-alpine AS final
COPY --from=builder /medi_routines_frontend/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf