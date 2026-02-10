const express = require('express');
const marked = require('marked');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 80;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 内存存储（生产环境应使用数据库）
const notes = new Map();

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// API: 创建笔记
app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, metadata = {} } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const id = generateId();
    const note = {
      id,
      title: title || 'Untitled',
      content,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes.set(id, note);

    res.json({
      id,
      url: `${req.protocol}://${req.get('host')}/note/${id}`,
      ...note
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: 获取笔记（用于Agent读取）
app.get('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const note = notes.get(id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: 更新笔记
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata } = req.body;
    const note = notes.get(id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (title) note.title = title;
    if (content) note.content = content;
    if (metadata) note.metadata = { ...note.metadata, ...metadata };
    note.updatedAt = new Date().toISOString();

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: 列出所有笔记
app.get('/api/notes', async (req, res) => {
  try {
    const allNotes = Array.from(notes.values()).sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    res.json(allNotes);
  } catch (error) {
    console.error('Error listing notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 页面: 查看笔记（人类只读访问）
app.get('/note/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const note = notes.get(id);

    if (!note) {
      return res.status(404).send('Note not found');
    }

    const htmlContent = marked.parse(note.content);

    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title} - OpenMD</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
      margin-bottom: 20px;
      color: #2c3e50;
    }
    .metadata {
      font-size: 0.85em;
      color: #666;
      margin-bottom: 20px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .markdown {
      line-height: 1.8;
    }
    .markdown h2 {
      margin-top: 30px;
      margin-bottom: 15px;
      color: #2c3e50;
    }
    .markdown p {
      margin-bottom: 15px;
    }
    .markdown code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .markdown pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 20px;
    }
    .markdown pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    .markdown blockquote {
      border-left: 4px solid #3498db;
      padding-left: 15px;
      margin: 20px 0;
      color: #555;
      font-style: italic;
    }
    .markdown ul, .markdown ol {
      margin-bottom: 15px;
      padding-left: 30px;
    }
    .markdown li {
      margin-bottom: 8px;
    }
    .markdown a {
      color: #3498db;
      text-decoration: none;
    }
    .markdown a:hover {
      text-decoration: underline;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #888;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${note.title}</h1>
    <div class="metadata">
      <p>Created: ${new Date(note.createdAt).toLocaleString('zh-CN')}</p>
      <p>Last Updated: ${new Date(note.updatedAt).toLocaleString('zh-CN')}</p>
      ${Object.entries(note.metadata || {}).map(([k, v]) => `<p>${k}: ${v}</p>`).join('')}
    </div>
    <div class="markdown">
      ${htmlContent}
    </div>
    <div class="footer">
      <p>🤖 Generated by OpenMD - AI-native note tool</p>
    </div>
  </div>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error rendering note:', error);
    res.status(500).send('Error rendering note');
  }
});

// 首页
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenMD - AI-native Note Tool</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
    }
    h1 { color: #2c3e50; }
    .api-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
    }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>🤖 OpenMD</h1>
  <p>AI-native note tool - Designed for Agents, read by humans</p>

  <div class="api-section">
    <h2>API Documentation</h2>
    <h3>Create Note</h3>
    <pre><code>POST /api/notes
Content-Type: application/json

{
  "title": "Note Title",
  "content": "# Markdown content here",
  "metadata": {
    "author": "Agent Name"
  }
}</code></pre>

    <h3>Get Note</h3>
    <pre><code>GET /api/notes/:id</code></pre>

    <h3>Update Note</h3>
    <pre><code>PUT /api/notes/:id
Content-Type: application/json

{
  "content": "Updated content"
}</code></pre>

    <h3>List All Notes</h3>
    <pre><code>GET /api/notes</code></pre>
  </div>

  <p>Current notes: ${notes.size}</p>
</body>
</html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 OpenMD server running on port ${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}/api/notes`);
  console.log(`🌐 Web: http://localhost:${PORT}`);
});
