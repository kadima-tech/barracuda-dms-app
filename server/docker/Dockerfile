#################
#  Build Image  #
#################
FROM --platform=linux/amd64 node:18-alpine AS build-env

ARG SRC_DIR=.
ARG AUTH_TOKEN

RUN npm config set @kadima-tech:registry https://npm.pkg.github.com
RUN npm config set //npm.pkg.github.com/:_authToken $AUTH_TOKEN

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

# Copy source code and build TypeScript
COPY . /app
RUN yarn build

#################
# Runtime Image #
#################
FROM --platform=linux/amd64 node:18-alpine AS runtime

WORKDIR /app

# Expose port 8080 for HTTP server
EXPOSE 8080

COPY --from=build-env /app/node_modules ./node_modules
COPY --from=build-env /app/dist ./dist
COPY package.json ./
COPY docker/entrypoint.sh /app

CMD ./entrypoint.sh