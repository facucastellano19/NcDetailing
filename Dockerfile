# Use a Node.js base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install application dependencies
RUN npm install

# Expose the port the application runs on
EXPOSE 3000

# Copy the rest of the application code to the container
COPY . .

# Define the command to start the application
CMD ["npm", "start"]