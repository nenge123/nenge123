---
layout: post
title:  Jekyll
date:   2021-11-21 19:28:39 +0800
category: Jekyll
author: Nenge123
tags: [Jekyll,wsl,Ubuntu-29.04LTS]
summary: 更换Ubuntu安装目录,需要先导出,再导入.
permalink: /Jekyll.html
---
## 安装WSL
- 控制面板
- 程序
- 启用或关闭Windows功能
- 基于Linux的Windows子系统
- 勾选启用
- 在Microsoft Store商店安装Ubuntu20.04LTS
- 如果不使用root用户,直接打开,设置密码时,虽然无显示,实际上已经输入了!

```shell
  #设置ROOT 默认登录账号
  ubuntu2004.exe config --default-user root
```

### Ubuntu20.04LTS

```bash
  #设置目录可写
  chmod -R 777 .

  #修改软件源可写
  chmod -c 777 ../etc/apt/sources.list

  cp ../etc/apt/sources.list ../etc/apt/sources.list.bak
```
- 修改源文件 /etc/apt/sources.list 使用阿里云的CDN

```text
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted
deb http://mirrors.aliyun.com/ubuntu/ focal universe
deb http://mirrors.aliyun.com/ubuntu/ focal-updates universe
deb http://mirrors.aliyun.com/ubuntu/ focal multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted
deb http://mirrors.aliyun.com/ubuntu/ focal-security universe
deb http://mirrors.aliyun.com/ubuntu/ focal-security multiverse
```

- 安装环境

```bash
  apt install ruby
  #检查版本
  ruby -v

  apt install bundle
  #检查版本
  bundle -v

  apt install gem
  gem update --system
  #检查版本
  gem -v
  #如果下载异常  更换源
  #gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org/

  apt install jekyll
  #检查版本
  jekyll -v

  gem install jekyll bundler
  #创建你的静态博客
  jekyll new my-awesome-site
  #进入你的静态博客目录
  cd my-awesome-site
  #安装服务器
  bundle install
  #运行服务器
  #如果出错看看出错的模块用 xxx>1.2
  #gem install [错误模块]
  bundle exec jekyll serve
  #明明已经下载,依旧报错?删掉目录重新创建.
```
- 浏览器打开http://127.0.0.1:4000/

- 安装git ssh

```bash
  apt install git
  apt install ssh
  #生成 SSH key
  ssh-keygen -t rsa -C "m@nenge.net"
```
- 打开 ~/.ssh/id_rsa.pub 复制公匙

```text
ssh-rsa xxxxxxxxxxxxxxxx= m@nenge.net
```
### Github
- setting
- SSH ans GPG keys
- New SSH key
- 码云Gitee→设置→SSH

### Ubuntu20.04LTS

```bash
  cd my-awesome-site
  git init
  #origin 为默认远程源分支
  #设置不同源分支 git remote add gitee git@gitee.com:nenge/nenge.git
  git remote add origin git@github.com:nenge123/nenge123.git
  git config --global user.name nenge123
  git config --global user.email m@nenge.net
  #设在分支名
  git branch –set-upstream-to=origin/master master
  #更新到git
  git status ./
  git add ./*
  git commit -m "更新2021-11-29"
  #git push
  #git push -f gitee master
  #强制更新 git push --f origin master
  git push origin master

```

### 分页功能
- 首页必须 index.html格式
- _config.yml 中增加

```yml

paginate: 5
#这里设置的格式必须与模板对应
#例如这里模板对应的应该是 "page/:num"
#下一页 href="/page{{ "{{" }} paginator.next_page }}"
#下一页 href="{{ "{{" }} paginator.next__page_path }}"
#上一页 href="/page{{ "{{" }} paginator.previous_page }}"
#上一页 href="{{ "{{" }} paginator.paginator__page_path }}"
paginate_path: "page/:num"

gems:
  - jekyll-paginate

plugins:
  - jekyll-paginate

```
- 如果报错,先在 ubuntu-20.04 安装  
再打开网站目录下得 "Gemfile" 确保增加了  

```bash
gem 'jekyll-paginate', group: :jekyll_plugins
```

```bash
gem install jekyll-paginate
bundle install
```

- 分页代码

```html
<!--
page 当前页码
per_page 每页文章数量
posts 当前页的文章列表
total_posts 总文章数
total_pages 总页数
previous_page 上一页页码 或 nil（如果上一页不存在）
previous_page_path 上一页路径 或 nil（如果上一页不存在）
next_page 下一页页码 或 nil（如果下一页不存在）
next_page_path 下一页路径 或 nil（如果下一页不存在）
-->
{{ "{%" }} if site.paginate -%}
  {{ "{%" }} for post in paginator.posts -%}
    <h1><a href="{{ "{{" }} post.url }}">{{ "{{" }} post.title }}</a></h1>
  {{ "{%" }} endfor -%}
  {{ "{%" }} if paginator.previous_page -%}
    <a class="newer-posts" href="{{ "{{" }} paginator.previous_page_path }}"><i class="fa fa-chevron-left"></i> 上一页</a>
  {{ "{%" }} endif -%}
  {{ "{%" }} if paginator.next_page -%}
    <a class="newer-posts" href="{{ "{{" }} paginator.next_page_path }}"><i class="fa fa-chevron-left"></i> 上一页</a>
  {{ "{%" }} endif -%}
{{ "{%" }} else -%}
  {{ "{%" }} for post in site.posts -%}
    <h1><a href="{{ "{{" }} post.url }}">{{ "{{" }} post.title }}</a></h1>
  {{ "{%" }} endfor -%}
{{ "{%" }} endif -%}

```



### 参考
- [Jekyllcn]
- [Ruby China]



[Ruby China]://gems.ruby-china.com/
[Jekyllcn]://jekyllcn.com/
