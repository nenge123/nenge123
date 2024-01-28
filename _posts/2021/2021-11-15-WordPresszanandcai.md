---
layout: post
title:  WordPress增加点赞,评论顶/踩,文章访问数
date:   2021-11-15 19:28:39 +0800
category: Wordpress
author: Nenge123
tags: [wordpress]
summary: "主要利用wp_postmeta,wp_commentmeta进行记录数据.<br>再利用indexDB进行本地记录判断,代替以往的cookies方式记录.  
当然他的缺点比cookies的安全性更致命!  
随便来个C语言大佬可以一句代码刷爆你的赞数.  
要安全性最好还是记录IP.O(∩_∩)O.  
大概比较适合小站!"
---




### 流程
- 后台文件 /wp-content/themes/[风格文件]/functions.php

```php
<?php
//绑定  /wp-admin/admin-ajax.php 行为事件
add_action('wp_ajax_nopriv_like_click', 'like_click');
add_action('wp_ajax_like_click', 'like_click');
function like_click(){
	$id = $_POST["id"];
	if(!$id) ShowJson($json);
	$actionKey = $_POST["key"];
	if(!$actionKey) ShowJson($json);
	$actionKey = explode ('_',$actionKey);
	if(!$actionKey[1]) ShowJson($json);
	else $key = 'likeClick_'.$actionKey[1];
	if($actionKey[2]) $key .= ucfirst($actionKey[2]);
	$json = array('result'=>false);
    if($actionKey[1]=='post')$likeClick_raters = intval(get_post_meta($id,$key,true));
	if($actionKey[1]=='comment')$likeClick_raters = intval(get_comment_meta($id,$key,true));
	if(!isset($likeClick_raters)) ShowJson($json);
	if ( $actionKey[0] == 'add'){
		$likeClick_raters += 1;
		$json['num'] = $likeClick_raters;
		$json['result'] = true;
    }else if (  $actionKey[0] == 'remove'){
		$likeClick_raters-=1;
		$json['num'] = $likeClick_raters;
	}
    if($actionKey[1]=='post')update_post_meta($id, $key, $likeClick_raters);
	if($actionKey[1]=='comment')update_comment_meta($id, $key, $likeClick_raters);
	ShowJson($json);
	exit;
}
function ShowJson($json)
{
	echo json_encode($json);
	exit;
}

?>
```

- 模板调用  
> 这是一个自定义HTML 符合两个英文之间有个横线的格式 the_ID() 是文章的ID

```php
<like-click data-id="post-<?php the_ID(); ?>">
<span class="likes_count"><?php echo intval(get_post_meta(get_the_ID(),'likeClick_post',true));?></span>
</like-click>

<!-- 自启动并且执行一次 不绑定点击事件 -->
<like-click data-id="post_view-<?php the_ID(); ?>" data-once="1">
<span class="likes_count"><?php echo intval(get_post_meta(get_the_ID(),'likeClick_postView',true));?></span>
</like-click>
```
- Javacript处理  
<click-script file="wordpress/likeClick.js"></click-script>