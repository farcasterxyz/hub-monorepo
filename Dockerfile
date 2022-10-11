FROM node:18

# Set non-root user and expose port 8080
USER node
EXPOSE 8080

WORKDIR /home/node/app

# Copy dependency information and install dependencies
COPY --chown=node:node tsconfig.json package.json yarn.lock ./

# Use the frozen lockfile to speed up the install and prevent package drift
RUN yarn install --frozen-lockfile 

# Copy source code (and all other relevant files)
COPY --chown=node:node src ./src

# Build code
RUN yarn build

CMD [ "yarn", "start" ]

# TODO: Use a multi-stage build as describe below to improve security and reduce build sizes
# https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/multi_stage_builds.md
#
# This is hard to implement today because of our dependency on the tsx runner which 
# cannot be invoked on a compiled js file and instead requires the entire src folder to be available.
