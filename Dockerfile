# This docker file uses a multi-stage build pattern as described here:
# https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/multi_stage_builds.md

###############################################################################
############## Stage 1: Create pruned version of monorepo #####################
###############################################################################

FROM node:18 AS prune

USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app

# Run turbo prune to create a pruned version of monorepo
COPY --chown=node:node ./package.json ./package.json
RUN yarn global add turbo@$(node -e "console.log(require('./package.json').devDependencies.turbo)")
COPY --chown=node:node . .
RUN /home/node/.yarn/bin/turbo prune --scope=@farcaster/hubble --docker

###############################################################################
############## Stage 2: Build the code using a full node image ################
###############################################################################

FROM node:18 AS build

USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app

# Copy dependency information and install all dependencies
COPY --chown=node:node --from=prune /home/node/app/out/json/ .
COPY --chown=node:node --from=prune /home/node/app/out/yarn.lock ./yarn.lock

RUN yarn install --frozen-lockfile --network-timeout 1800000

# Copy source code (and all other relevant files)
COPY --chown=node:node --from=prune /home/node/app/out/full/ .
# turbo prune doesn't include global tsconfig.json (https://github.com/vercel/turbo/issues/2177)
COPY --chown=node:node tsconfig.json tsconfig.json

# Build code
RUN yarn build

###############################################################################
########## Stage 3: Copy over the built code to a leaner alpine image #########
###############################################################################

FROM node:18-alpine

RUN apk update && apk add --no-cache g++ make python3 linux-headers

# Set non-root user and expose port 8080
USER node
EXPOSE 8080

# Many npm packages use this to trigger production optimized behaviors
ENV NODE_ENV production

RUN mkdir /home/node/app
WORKDIR /home/node/app

# Copy dependency information and install dependencies
COPY --chown=node:node --from=prune /home/node/app/out/json/ .
COPY --chown=node:node --from=prune /home/node/app/out/yarn.lock ./yarn.lock

RUN yarn install --frozen-lockfile --production --network-timeout 1800000

# Copy results from previous stage
COPY --chown=node:node --from=build /home/node/app/packages/protobufs/dist ./packages/protobufs/dist
COPY --chown=node:node --from=build /home/node/app/packages/utils/dist ./packages/utils/dist
COPY --chown=node:node tsconfig.json tsconfig.json

# TODO: determine if this can be removed while using tsx (or find alternative)
# since we should be able to run with just the compiled javascript in build/
COPY --chown=node:node ./apps/hubble ./apps/hub

# TODO: load identity from some secure store instead of generating a new one
RUN yarn --cwd=apps/hub identity create

CMD ["yarn", "--cwd=apps/hub", "start", "--rpc-port", "8080", "--ip", "0.0.0.0", "--gossip-port", "9090", "--eth-rpc-url", "https://eth-goerli.g.alchemy.com/v2/IvjMoCKt1hT66f9OJoL_dMXypnvQYUdd"]
