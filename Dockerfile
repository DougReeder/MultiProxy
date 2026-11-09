# Use Node.js 26 (LTS-to-be or current LTS in 2026)
FROM node:26-slim AS build

# Create app directory
WORKDIR /usr/src/app

# Install dependencies separately to leverage Docker cache
COPY package*.json ./
RUN npm ci --only=production

# Final stage
FROM node:26-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y wget

# Set environment variables
ENV NODE_ENV=production
# These must be set at runtime
#ENV OPEN_AI_URL=""
#ENV OPEN_AI_API_KEY=""

# Copy production dependencies from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy app source
COPY . .

# Use a non-root user
USER node

# Expose port 3000
EXPOSE 3000

# Start the application
# Note: We don't use --env-file here because environment variables
# are expected to be provided via Docker's -e or an orchestration tool.
CMD [ "node", "./bin/www" ]
