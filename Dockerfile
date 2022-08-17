FROM node:16.15-alpine as build

WORKDIR /sso
ENV NODE_ENV production
ADD package.json yarn.lock /sso/
ADD packages /sso/packages
ARG SERVICE_PATH
ADD $SERVICE_PATH /sso/$SERVICE_PATH
RUN yarn --production --pure-lockfile

FROM node:16.15-alpine
ENV NODE_ENV production
COPY --from=build /sso /sso
ENTRYPOINT [ "node", "." ]
ARG SERVICE_PATH
WORKDIR /sso/$SERVICE_PATH
