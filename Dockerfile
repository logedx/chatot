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

# If you are building your code for production
# RUN npm ci --omit=dev
RUN npm ci --omit=dev

RUN npm run build

RUN ls -l /app/dist





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
COPY --from=builder /app/cert /app/cert
COPY --from=builder /app/config /app/config
COPY --from=builder /app/node_modules /app/node_modules

COPY --from=builder /app/README.md /app/README.md
COPY --from=builder /app/package.json /app/package.json


ENV PORT=443 NODE_ENV=production

RUN ls -l /app
RUN ls -l /app/src

# Set time zone
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime


EXPOSE 80
EXPOSE 443

CMD [ "node", "--experimental-specifier-resolution=node", "./bin/www" ]