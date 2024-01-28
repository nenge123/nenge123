---
layout: post
title:  acme免费申请泛域名SSL IIS方法
date:   2021-11-15 19:28:39 +0800
category: acme
author: Nenge123
tags: [acme,Ubuntu-29.04LTS]
summary: "WSL下Ubuntu安装acme,绑定API参数,申请域名"
---
### 安装WSL ubuntu-20.04LTS  
- 参考 [ubuntu-20.04LTS安装](/Jekyll.html)

### 安装Acme.sh  
```shell
  wget -O - https://get.acme.sh | sh
  #或 curl https://get.acme.sh | sh

  sh .acme.sh/acme.sh --upgrade

  #API参数 阿里云KEY#
  export Ali_Key="..."
  export Ali_Secret="..."
  #申请SSL 如果出错,可能被墙了,或者域名记录已存在,需要手动去删除再试.
  sh .acme.sh/acme.sh --issue --dns dns_ali -d nenge.net -d *.nenge.net
  #生成IIS用的PFX
  openssl pkcs12 -export -out .acme.sh/nenge.net/nenge.net.pfx -in .acme.sh/nenge.net/nenge.net.cer -inkey .acme.sh/nenge.net/nenge.net.key -certfile .acme.sh/nenge.net/ca.cer -passout pass:123456
  #复制到D盘
  cp .acme.sh/nenge.net/nenge.net.pfx /mnt/d/nenge.net.pfx
```
### 修改IIS配置  
> 7.5版本不支持SNI需要手动修改  
> 直接修改:C:\Windows\System32\inetsrv\config\applicationHost.config  

```xml
#C:\Windows\System32\inetsrv\config\applicationHost.config
#查找你刚添加的网站对应位置
<binding protocol="https" bindingInformation="*:443:" sslFlags="0" />
#改成
<binding protocol="https" bindingInformation="*:443:local.nenge.net" sslFlags="0" />
```
> 命令 为"Default Web Site"添加绑定  

```bat
@echo off
set sitename="Default Web Site"
set domain="local.nenge.net"
copy C:\Windows\System32\inetsrv\config\applicationHost.config C:\Windows\System32\inetsrv\config\%date:~0,4%_%date:~5,2%_%date:~8,2%_%time:~0,2%_%time:~3,2%_%time:~6,2%_applicationHost.config
C:\Windows\System32\Inetsrv\appcmd.exe set site /site.name:%sitename% /+bindings.[protocol='https',bindingInformation='*:443:%domain%',sslFlags='0']
@echo on
```
> 列表  

```bat
C:\Windows\System32\Inetsrv\appcmd.exe list sites
```
### 参考  
- [Acme.sh中文文档](https://github.com/acmesh-official/acme.sh/wiki/%E8%AF%B4%E6%98%8E)
