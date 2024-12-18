```app:name
 ██████╗██╗  ██╗ █████╗ ████████╗ ██████╗ ████████╗
██╔════╝██║  ██║██╔══██╗╚══██╔══╝██╔═══██╗╚══██╔══╝
██║     ███████║███████║   ██║   ██║   ██║   ██║   
██║     ██╔══██║██╔══██║   ██║   ██║   ██║   ██║   
╚██████╗██║  ██║██║  ██║   ██║   ╚██████╔╝   ██║   
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝    ╚═╝   
```

# 初始化

```bash
openssl req -x509 -out crt -keyout key -newkey rsa:2048 -nodes -sha256

```

# 构建镜像

```bash
# docker build -t [镜像名]:[版本号] .
docker build -t app:latest .
```

启动容器

```bash
# docker run -d -v [本地目录]:[容器内部目录] -p [本地端口]:[容器内部端口] --restart always --name [容器名] [镜像名]:[版本号]
docker run -d -v /app/db:/data/db --net host  --restart always --name mongo mongo:latest
docker run -d -v /app/cert:/app/cert -v /app/config:/app/config --net host --restart always --name app app:latest
```

查看所有容器IP
```bash
docker inspect --format '{{ .Name }}  {{ .NetworkSettings.IPAddress }}' $(docker ps -aq)
```

创建网络
```bash
docker network create [网络名称]
```

列出所有网络
```bash
docker network ls
```

查看网络详情
```bash
docker network inspect [网络名称]
```

加入网络
```bash
docker network connect [网络名称] [容器名称]
```

关于端口占用问题解决
```bash
ps -aux | grep -v grep | grep docker-proxy
rm /var/lib/docker/network/files/local-kv.db
```


# 阿里云镜像仓库

## 登录仓库

```bash
docker login --username=<username> registry.cn-shenzhen.aliyuncs.com
```

用于登录的用户名为阿里云账号全名，密码为开通服务时设置的密码。

## 修改标签

```bash
docker tag [ImageId] registry.cn-shenzhen.aliyuncs.com/logedx/chatot:[镜像版本号]
```

## 从仓库中拉取镜像

```bash
docker pull registry.cn-shenzhen.aliyuncs.com/logedx/chatot:[镜像版本号]
```

## 将镜像推送到仓库

```bash
docker push registry.cn-shenzhen.aliyuncs.com/logedx/chatot:[镜像版本号]
```