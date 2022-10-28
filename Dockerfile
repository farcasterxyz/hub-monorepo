# This docker file uses a multi-stage build pattern as described here:
# https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/multi_stage_builds.md

###############################################################################
############## Stage 1: Build the code using a full node image ################
###############################################################################

FROM node:18 AS build

USER node
WORKDIR /home/node/app

# Copy dependency information and install all dependencies
COPY --chown=node:node tsconfig.json package.json yarn.lock ./

RUN yarn install --frozen-lockfile --network-timeout 1800000

# Copy source code (and all other relevant files)
COPY --chown=node:node src ./src
COPY --chown=node:node .config ./.config

# Build code
RUN yarn build

###############################################################################
########## Stage 2: Copy over the built code to a leaner alpine image #########
###############################################################################

FROM node:18-alpine

RUN apk update && apk add --no-cache g++ make python3 linux-headers

# Set non-root user and expose port 8080
USER node
EXPOSE 8080

# Many npm packages use this to trigger production optimized behaviors
ENV NODE_ENV production

WORKDIR /home/node/app

# Copy dependency information and install dependencies
COPY --chown=node:node tsconfig.json package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production --network-timeout 1800000

# Copy results from previous stage
COPY --chown=node:node --from=build /home/node/app/build ./build
COPY --chown=node:node --from=build /home/node/app/.config ./.config

# TODO: determine if this can be removed while using tsx (or find alternative) 
# since we should be able to run with just the compiled javascript in build/
COPY --chown=node:node --from=build /home/node/app/src ./src

# TODO: load identity from some secure store instead of generating a new one
RUN yarn identity create

CMD ["yarn", "tsx", "src/cli.ts", "start", "--rpc-port", "8080", "--gossip-port", "9090" ]