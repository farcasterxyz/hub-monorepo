FROM node:16

# Uncomment and set this to the relevant Farcaster node port
# EXPOSE 8000

COPY . .
RUN yarn install
RUN yarn build

CMD ["yarn", "server"]
