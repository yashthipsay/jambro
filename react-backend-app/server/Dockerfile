# Use an official Node.js runtime as the base image
FROM node:21

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the source code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 5000

#Define the environment variable
ENV NODE_ENV=development

# Serve the app
CMD ["npm", "run", "dev"]