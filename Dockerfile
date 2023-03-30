# This docker file uses a multi-stage build pattern as described here:
# https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/multi_stage_builds.md

###############################################################################
############## Stage 1: Create pruned version of monorepo #####################
###############################################################################

FROM node:18-alpine AS prune

RUN apk add --no-cache libc6-compat

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

FROM node:18-alpine AS build

# Needed for compilation step
RUN apk add --no-cache libc6-compat python3 make g++ linux-headers

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

# Build code
RUN yarn build

# Purge dev dependencies. It is not equivalent to a fresh `yarn install --production` but it is
# close enough (https://github.com/yarnpkg/yarn/issues/696).
RUN yarn install --production --ignore-scripts --prefer-offline --force --frozen-lockfile

###############################################################################
########## Stage 3: Copy over the built code to a leaner alpine image #########
###############################################################################

FROM node:18-alpine as app

# Requirement for runtime metrics integrations
RUN apk add libc6-compat

# Set non-root user and expose ports
USER node

# Many npm packages use this to trigger production optimized behaviors
ENV NODE_ENV production

RUN mkdir /home/node/app
WORKDIR /home/node/app

# Copy results from previous stage.
# The base image is same as the build stage, so it is safe to copy node_modules over to this stage.
COPY --chown=node:node --from=prune /home/node/app/out/json/ .
COPY --chown=node:node --from=prune /home/node/app/out/yarn.lock ./yarn.lock
COPY --chown=node:node --from=build /home/node/app/node_modules ./node_modules
COPY --chown=node:node --from=build /home/node/app/packages/protobufs/dist ./packages/protobufs/dist/
COPY --chown=node:node --from=build /home/node/app/packages/protobufs/node_modules ./packages/protobufs/node_modules/
COPY --chown=node:node --from=build /home/node/app/packages/utils/dist ./packages/utils/dist/
COPY --chown=node:node --from=build /home/node/app/packages/tsconfig ./packages/tsconfig/

# TODO: determine if this can be removed while using tsx (or find alternative)
# since we should be able to run with just the compiled javascript in build/
COPY --chown=node:node --from=build /home/node/app/apps/hubble ./apps/hubble

# TODO: load identity from some secure store. It is currently passed in via the 'IDENTITY_B64' env var

# BuildKit doesn't support --squash flag, so emulate by copying into fewer layers
FROM scratch
COPY --from=app / /

# Repeat of above since it is lost between build stages
USER node
EXPOSE 2282
EXPOSE 2283
WORKDIR /home/node/app

CMD ["yarn", "--cwd=apps/hubble", "start", "--rpc-port", "2283", "--ip", "0.0.0.0", "--gossip-port", "2282", "--eth-rpc-url", "https://eth-goerli.g.alchemy.com/v2/IvjMoCKt1hT66f9OJoL_dMXypnvQYUdd", "--network", "1", "--allowed-peers", "none"]
