FROM node:16.15-alpine as build
ADD package.json yarn.lock /sso/
ADD app /sso/app
WORKDIR /sso
RUN yarn --pure-lockfile
ARG COMMAND_URL
ARG QUERY_URL
ARG SUBSCRIPTION_URL
ENV VITE_GRAPHQL_COMMAND_URL=$COMMAND_URL
ENV VITE_GRAPHQL_QUERY_URL=$QUERY_URL
ENV VITE_GRAPHQL_SUBSCRIPTION_URL=$SUBSCRIPTION_URL
WORKDIR /sso/app
RUN yarn build

FROM nginx:alpine
COPY --from=build /sso/app/dist /usr/share/nginx/html
COPY app/nginx.conf /etc/nginx/conf.d/default.conf
