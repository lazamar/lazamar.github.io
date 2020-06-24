---
layout: post
title: Zero downtime - Making Blue-Green deployments dead simple
---

At the current state of web technologies, having our application be unavailable during every upgrade is not acceptable anymore. And if you are updating your application often, which you should, being available during updates is even more important. In this post I will walk you through hot-swapping docker containers without letting any request drop with just one command.

[Blue-Green deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) is the technique we will use. It involves running your new and old server versions in parallel and having a proxy redirect new requests to the new version. Once the old version is finished answering all its remaining requests it can be shut down safely. There you go, version swap with no downtime.

It's easier said than done, though. Even though everyone seems to be able to explain it very well it was hard to find someone actually showing how to do it.

The setup is not complicated, but can be tricky to get right. We will use a small tool to do the heavy-lifting. I will do the explanation first and the how-to after. You can safely skip the explanation if you just want to see the code.

## How it works

We will use a docker image with an **nginx** server to redirect requests from the outside world to our containers. To avoid exposing unnecessary ports, we create a [Docker network](https://docs.docker.com/engine/userguide/networking/) exclusively for our server-proxy communication.

We do the redirection by using the following nginx configuration:

```
server
    {
        listen SOME_PORT ;
        location /
        {
            proxy_pass CONTAINER_COLOR:CONTAINER_PORT ;
        }
    }

```

When its time to put a new version live, we change the `CONTAINER_COLOR` in the configuration file and run `service nginx reload`, which will make the new configuration take effect.

## How to do it

We will use [easy-deploy](https://github.com/lazamar/easy-deploy) to do the proxy and network handling.

First we download the latest version from the [Github page](https://github.com/lazamar/easy-deploy/releases) and put it in whatever folder we want.

We need to make it executable, so let's do that with

```
chmod 777 path/to/easy-deploy
```

Now everything is ready. We can execute our image just like we would do if we were using `docker run`

```
path/to/easy-deploy -p 8080:8080 -v some/volume:some/path my-image:v1.0
```

We can see the image and proxy server are running, and if we access `localhost:8080` we will get the correct response.
It named our container with the colour blue, which will be replaced by green when we deploy again.

```
docker ps

> CONTAINER ID        IMAGE               ...         PORTS                            NAMES
> c0345092b90c        nginx:latest        ...         80/tcp, 0.0.0.0:8080->8080/tcp   container-PROXY-my-image
> 2a19bd611e96        my-image:v1.0       ...         8080/tcp                         container-Blue-my-image
```

When it's time to switch to let's say version 2 we can just run the same command again with the updated version tag.

```
path/to/easy-deploy -p 8080:8080 -v some/volume:some/path my-image:v2.0
```

Now the new version is in place in a container with the colour green.

```
docker ps

>> CONTAINER ID        IMAGE              ...         PORTS                            NAMES
>> e703e8567995        my-image:v2.0      ...         8080/tcp                         container-Green-my-image
>> c0345092b90c        nginx:latest       ...         80/tcp, 0.0.0.0:8080->8080/tcp   container-PROXY-my-image
```


This will take care of automatically running the two versions in parallel, redirecting traffic to the newest version, and shutting down the old version once it finishes dealing with its requests.

That's it.

I built easy-deploy because there wasn't anything around to do that in a simple, one command, way. If you find it helpful do give me a shout at [@marcelolaza](https://twitter.com/Marcelolaza).
