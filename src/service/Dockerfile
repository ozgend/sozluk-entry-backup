FROM node:15.5-buster-slim

ENV NODE_ENV=production
ENV PORT=80
ENV HOST=localhost:3000

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 80
CMD ["npm", "start"]
