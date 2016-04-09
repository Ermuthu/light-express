define({"markdown.markdown":"# markdown语法\n\nmarkdown是一种轻量级的“标记语言”，因其语法简单，文档易读，修改方法，被越来越多的程序开发者所青睐，用来书开发写文档，博客文章等内容。下面简单介绍几种常用的语法：\n\n##### h1的写法有两种：\n\n```md\n第一种：\nHello.\n===\n第二种：\n# 这是 H1\n```\n##### 效果：\n\nHello.\n===\n# 这是 H1\n\n##### h2的写法也有两种：\n\n```md\n第一种：\ntest\n---\n\n第二种：\n## 这是 H2\n```\n##### 效果：\n\ntest\n---\n## 这是 H2\n\n##### h3~h6的写法：\n\n```md\n### 这是 H3\n#### 这是 H4\n##### 这是 H5\n###### 这是 H6\n```\n##### 效果：\n\n### 这是 H3\n#### 这是 H4\n##### 这是 H5\n###### 这是 H6\n\n##### 无序列表：\n\n```md\n* This is markdown.\n* It is fun.\n* Love it or leave it.\n```\n##### 效果：\n\n* This is markdown.\n* It is fun.\n* Love it or leave it.\n\n##### 有序列表，主意前面的数字并不会影响实际生成的数字值：\n\n```md\n1.  Bird\n1.  McHale\n1.  Parish\n```\n##### 效果：\n\n1.  Bird\n1.  McHale\n1.  Parish\n\n##### 链接使用：\n\n```md\nI get 10 times more traffic from [Google][1] than from [Yahoo][2] or [MSN][3].\n```\n##### 效果：\n\nI get 10 times more traffic from [Google][1] than from [Yahoo][2] or [MSN][3].\n\n##### 代码块：\n\n```ruby\nrequire 'redcarpet'\nmarkdown = Redcarpet.new(\"Hello World!\")\nputs markdown.to_html\n```\n\n##### 支持html语法：\n```html\n<div style=\"color:red;\">test</div>\n水的化学符号：H<sub>2</sub>O\n2<sup>3</sup>=8\n```\n##### 效果：\n<div style=\"color:red;\">test</div>\n水的化学符号：H<sub>2</sub>O\n2<sup>3</sup>=8\n\n##### 表格语法：\n```md\nFirst Header  | Second Header\n------------- | -------------\nContent<br /> Cell  | Content Cell\nContent Cell  | Content Cell\n\n| Name          | Description                  |\n| ------------- | -----------                  |\n| Help          | ~~Display the~~ help window. |\n| Close         | _Closes_ a window            |\n\n| Left-Aligned  | Center Aligned    | Right Aligned |\n| :------------ | :---------------: | -----:        |\n| col 3 is      | some wordy text   | $1600         |\n| col 2 is      | centered          | $12           |\n| zebra stripes | are neat          | $1            |\n```\n##### 效果：\nFirst Header  | Second Header\n------------- | -------------\nContent<br /> Cell  | Content Cell\nContent Cell  | Content Cell\n\n| Name          | Description                  |\n| ------------- | -----------                  |\n| Help          | ~~Display the~~ help window. |\n| Close         | _Closes_ a window            |\n\n| Left-Aligned  | Center Aligned    | Right Aligned |\n| :------------ | :---------------: | -----:        |\n| col 3 is      | some wordy text   | $1600         |\n| col 2 is      | centered          | $12           |\n| zebra stripes | are neat          | $1            |\n\n##### 上文中用到的链接语法：\n```md\n[1]: http://google.com/ \"Google\"\n[2]: http://search.yahoo.com/ \"Yahoo Search\"\n[3]: http://search.msn.com/ \"MSN Search\"\n```\n[1]: http://google.com/ \"Google\"\n[2]: http://search.yahoo.com/ \"Yahoo Search\"\n[3]: http://search.msn.com/ \"MSN Search\"\n"});