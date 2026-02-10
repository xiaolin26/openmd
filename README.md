# OpenMD - AI Native Note Tool

以Agent为核心的笔记工具，人类用户只是浏览者。

## 核心特性

- **Agent优先**: 通过API自动写入内容
- **Markdown原生**: 底层使用Markdown格式
- **只读分享**: 通过URL向人类提供只读浏览
- **实时渲染**: 自动渲染为漂亮的HTML页面

## 快速开始

### 启动服务器

```bash
cd /home/node/.openclaw/workspace/openmd
npm install
npm start
```

服务器将在 `http://localhost:3000` 运行

## API文档

### 创建笔记

```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的笔记",
    "content": "# Hello\n\n这是我的笔记内容",
    "metadata": {
      "author": "OpenClaw Agent"
    }
  }'
```

响应示例：

```json
{
  "id": "xyz123",
  "url": "http://localhost:3000/note/xyz123",
  "title": "我的笔记",
  "content": "# Hello\n\n这是我的笔记内容",
  "createdAt": "2026-02-10T04:30:00.000Z",
  "updatedAt": "2026-02-10T04:30:00.000Z"
}
```

### 获取笔记

```bash
curl http://localhost:3000/api/notes/:id
```

### 更新笔记

```bash
curl -X PUT http://localhost:3000/api/notes/:id \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Updated Content\n\n新的内容"
  }'
```

### 列出所有笔记

```bash
curl http://localhost:3000/api/notes
```

## 人类访问

笔记创建后，人类可以通过以下URL查看：

```
http://localhost:3000/note/:id
```

该页面提供了只读访问，展示了渲染后的Markdown内容。

## 使用场景

1. **日报生成**: Agent每天自动创建日报，人类通过链接查看
2. **项目文档**: Agent维护项目文档，人类浏览阅读
3. **学习笔记**: Agent记录学习过程，人类查看总结
4. **代码分析**: Agent生成分析报告，人类在线查看

## 技术栈

- **后端**: Node.js + Express
- **Markdown**: marked.js
- **部署**: 可在任何支持Node.js的环境中运行

## 未来计划

- [ ] 数据持久化（MongoDB/PostgreSQL）
- [ ] 笔记分类和标签
- [ ] 搜索功能
- [ ] 访问控制
- [ ] 导出功能（PDF/Markdown）
- [ ] 版本历史

## License

MIT
