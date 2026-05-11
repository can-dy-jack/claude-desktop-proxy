ai分析当前系统已有功能和后续开发功能计划，并展示在readme里。


github ci，自动打包发布。


使用教程
日志打印 - 方便调试

还是不生效。我的建议，点击生效后，软件将third-party inference配置换为 base url为 http://127.0.0.1:[port] 这种形式，模型列表设置为用户设置的模型列表，但是加上claude-前缀放在calude desktop配置里。我们软件这里只需要设置列表就行，不需要设置替换的。同时，设置生效后，calude desktop，获取请求http://127.0.0.1:[port] 我们要做的是，去掉模型的claude-前缀，并转发请求到配置的baseurl去。

~/Library/Application Support/Claude/claude_desktop_config.json

