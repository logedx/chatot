# ██████╗ ██╗   ██╗██╗██╗     ██████╗ ███████╗██████╗ 
# ██╔══██╗██║   ██║██║██║     ██╔══██╗██╔════╝██╔══██╗
# ██████╔╝██║   ██║██║██║     ██║  ██║█████╗  ██████╔╝
# ██╔══██╗██║   ██║██║██║     ██║  ██║██╔══╝  ██╔══██╗
# ██████╔╝╚██████╔╝██║███████╗██████╔╝███████╗██║  ██║
# ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝
#

FROM node:lts-slim as builder

# Create app directory
WORKDIR /app

# Bundle app source
COPY . /app


RUN npm ci --ignore-scripts

RUN npm run build






# ██████╗ ██╗   ██╗███╗   ██╗███╗   ██╗██╗███╗   ██╗ ██████╗ 
# ██╔══██╗██║   ██║████╗  ██║████╗  ██║██║████╗  ██║██╔════╝ 
# ██████╔╝██║   ██║██╔██╗ ██║██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
# ██╔══██╗██║   ██║██║╚██╗██║██║╚██╗██║██║██║╚██╗██║██║   ██║
# ██║  ██║╚██████╔╝██║ ╚████║██║ ╚████║██║██║ ╚████║╚██████╔╝
# ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
#

FROM node:lts-slim

# Create app directory
WORKDIR /app

# Bundle app source
COPY --from=builder /app/dist /app
COPY --from=builder /app/package-lock.json /app/package-lock.json


ENV PORT=443 NODE_ENV=production

# Set time zone
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime


# If you are building your code for production
# RUN npm ci --only=production
RUN npm ci --only=production --ignore-scripts

EXPOSE 80
EXPOSE 443

CMD [ "node", "--experimental-specifier-resolution=node", "./bin/www" ]