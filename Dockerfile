FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . ./
RUN chown -R node:node /app/node_modules
RUN yarn build

# https://lipanski.com/posts/smallest-docker-image-static-website
FROM busybox:1.35 as production-stage

# Create a non-root user to own the files and run our server
RUN adduser -D static
USER static
WORKDIR /home/static

# Copy the static website
# Use the .dockerignore file to control what ends up inside the image!
COPY --from=build-stage /app/dist .

# Run BusyBox httpd
CMD ["busybox", "httpd", "-f", "-v", "-p", "8000"]