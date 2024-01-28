---
layout: post
title: SteamDeck SMB局域网共享
date: 2023-04-06 23:30
category: SteamDeck
author: Nenge123
tags: [steamos,smb]
summary: SteamDeck实现局域网共享访问,由于他使用最新的共享协议,所以windows局域网会看不见.在地址栏输入\\\\IP即可! 当然也可以安装那个wsdd,但是个人觉得没必要装那么多!
---


### 初始化管理员密码
> 没必要设置那么复杂.  

```sh
    passwd
    curl -L nenge.net/script/steamdeck/smb.sh >> /home/deck/Downloads/install_smb.sh
    sh /home/deck/Downloads/install_smb.sh
```

> 需要在home/deck/创建一个Rooms (注意大小写) 如果不需要此共享删除该条目.  
> `map to guest = bad user`是关闭输入账号密码,`guest account = deck`指定匿名账号.  
> 使用无密码有奇葩错误,最好设置一个账号例如 deck/888888,电脑输入后报错凭证就不需要下次再输入!  
> 如果输入地址无权(无法)访问,肯定是权限问题或者账号密码不正确  
> 在`map to guest`前面加上注释,然后重启smb.用之前的deck账号登录即可.

<click-script file="steamdeck/smb.sh,steamdeck/smb.conf"></click-script>

最后windows地址栏中输入\\\\steamdeck  或者 \\\\IP 就会见到  如\\\\172.20.10.5


