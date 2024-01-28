---
layout: post
title: 配置wsl局域网访问Jekyll
date: 2023-03-06 00:15
category: Jekyll
author: Nenge123
tags: [Jekyll,wsl]
summary: 局域网访问本机WSL下的Jekyll服务器
---

```shell
#桥接 提示重启不用管
#Set-VMSwitch WSL -NetAdapterName  以太网
#卸载桥接
#Set-VMSwitch WSL -SwitchType Internal

#端口设置不要存在重复,例如不能设置4000,否则Jekyll重启无法使用127.0.0.1:4000打开
netsh interface portproxy add v4tov4 listenport=88 connectport=4000 connectaddress=localhost

#防火墙 入站规则
#添加端口88 允许访问

```

