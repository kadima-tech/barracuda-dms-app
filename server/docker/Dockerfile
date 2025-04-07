#################
#  Build Image  #
#################
FROM --platform=linux/amd64 node:16-alpine AS build-env

ARG AUTH_TOKEN

WORKDIR /app

RUN npm config set @kadima-tech:registry https://npm.pkg.github.com
RUN npm config set //npm.pkg.github.com/:_authToken $AUTH_TOKEN

COPY package.json yarn.lock ./
COPY prisma /app/prisma
RUN yarn install --immutable --immutable-cache --check-cache

# Run prisma generate only if prisma is installed
RUN if [ -f /app/prisma/schema.prisma ]; then npx prisma generate; fi

#################
# Runtime Image #
#################
FROM --platform=linux/amd64 node:16-alpine AS runtime

WORKDIR /app

COPY --from=build-env /app/node_modules ./node_modules
COPY . /app

CMD yarn start