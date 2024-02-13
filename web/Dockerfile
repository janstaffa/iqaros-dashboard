### STAGE 1: Build ###
FROM node:21-alpine AS build

WORKDIR /web

# Install dependencies
COPY ./package.json .
COPY ./package-lock.json .

RUN npm install

# Build
COPY . .

RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.25-alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /web/build /usr/share/nginx/html

EXPOSE 80
# Run
# CMD ["npm", "start"]