---
layout: post
title:  WSL ubuntu修改默认安装目录到其他盘
date:   2021-11-16 19:28:39 +0800
category: Ubuntu
author: Nenge123
tags: [wsl,Ubuntu-29.04LTS]
summary: 更换Ubuntu安装目录,需要先导出,再导入.
---

### PowerShell

```shell
  #查看版本
  wsl -l --all -v

  #导出
  wsl --export Ubuntu-20.04 d:\wsl-ubuntu20.04.tar

  #注销并且删除 需要重启
  wsl --unregister Ubuntu-20.04

  #导入 如果没安装虚拟机 只能--version 1
  wsl --import Ubuntu-20.04 d:\wsl-ubuntu20.04 d:\wsl-ubuntu20.04.tar --version 2

  #设置默认登录用户root
  ubuntu2004 config --default-user root

  #删除文件
  del d:\wsl-ubuntu20.04.tar
```

> 请启用虚拟机平台 Windows 功能并确保在 BIOS 中启用虚拟化.  
有关信息，请访问 https://aka.ms/wsl2-install  
但是家庭版并没有虚拟机

### 解决方法  
> PowerShell运行一下  
或者打开 程序->启用或关闭Windows功能->虚拟机->勾选后确定.然后再重启.  

```shell
  dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```
> 仍无法解决,如家庭版.新建文本文件 "虚拟机.cmd",编辑后,管理员打开.  

```bat
pushd "%~dp0"
dir /b %SystemRoot%\servicing\Packages\*Hyper-V*.mum >hyper-v.txt
for /f %%i in ('findstr /i . hyper-v.txt 2^>nul') do dism /online /norestart /add-package:"%SystemRoot%\servicing\Packages\%%i"
del hyper-v.txt
Dism /online /enable-feature /featurename:Microsoft-Hyper-V-All /LimitAccess /ALL
pause
```
