---
layout: post
title:  wordpress 关闭自动保存autosave 自动草稿auto-draft完整方法
date:   2021-11-15 19:28:39 +0800
category: Wordpress
author: Nenge123
tags: [workpress]
summary: "使用wordpress的同学可能都已经发现，你发布的文章的ID都是不连续的。为什么会这样呢？原因是wordpress具有自动存草稿和保存修订版的功能，这样每当它存一次，就会产生一个相应的ID，同时会在数据库中产生大量的垃圾文件。…网上的各种解决方案抄完又抄有很多错漏. "
---

### 流程
- 文件 ~/wp-config.php

```php
<?php
  define( 'AUTOSAVE_INTERVAL', 99999999999 ); //超过99999999999秒才保存
  define('WP_POST_REVISIONS', 99999999999 );  //超过99999999999秒才保存
?>
```
- 后台文件 ~/wp-admin/includes/post.php  
> 取消自动草稿auto-draft  

```php
<?php
if ( $create_in_db ) {
  /**
   * 原始代码
   * $post_id = wp_insert_post(
   * array(
   * 'post_title'  => __( 'Auto Draft' ),
   * 'post_type'   => $post_type,
   * 'post_status' => 'auto-draft',
   * ),
   * false,
   * false
   * );
   * $post    = get_post( $post_id );
   * 修改为以下代码
   */
  $posts = query_posts(array(
    'post_status' => 'auto-draft',
    'post_type' => $post_type,
    'posts_per_page' => 1
  ));
  if ($posts) {
    $post = get_post($posts[0]->ID);
  } else {
    $post_id = wp_insert_post(array(
       'post_title' => __('Auto Draft') ,
       'post_type' => $post_type,
       'post_status' => 'auto-draft',
    ));
    $post = get_post($post_id);
  }
?>
```
