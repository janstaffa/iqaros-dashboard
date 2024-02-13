FROM node:21-alpine

WORKDIR /server

# Install dependencies
COPY ./package.json .
COPY ./package-lock.json .

RUN npm install typescript

RUN npm install

# Copy source code
COPY . .

# Compile typescript
RUN npm run build

RUN mkdir -p /server/userdata/upload/maps

# Run
EXPOSE 4000

CMD ["node", "dist/index.js"]