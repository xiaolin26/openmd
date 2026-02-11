const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: '182.92.238.143',
    port: 9001,
    user: 'openmd',
    password: 'eo0IGu59U86SzEyl',
    database: 'openmd'
  });

  try {
    console.log('开始迁移...');

    // 检查 visibility 列是否已存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'notes' AND COLUMN_NAME = 'visibility'
    `);

    if (columns.length > 0) {
      console.log('✅ visibility 列已存在，跳过迁移');
      return;
    }

    // 添加 visibility 列
    await connection.query(`
      ALTER TABLE notes
      ADD COLUMN visibility ENUM('public', 'private', 'password') DEFAULT 'public' AFTER metadata
    `);
    console.log('✅ 添加 visibility 列');

    // 添加 password 列
    await connection.query(`
      ALTER TABLE notes
      ADD COLUMN password VARCHAR(255) NULL AFTER visibility
    `);
    console.log('✅ 添加 password 列');

    // 添加 expires_at 列
    await connection.query(`
      ALTER TABLE notes
      ADD COLUMN expires_at TIMESTAMP NULL AFTER password
    `);
    console.log('✅ 添加 expires_at 列');

    // 添加索引
    await connection.query(`
      ALTER TABLE notes
      ADD INDEX idx_visibility (visibility)
    `);
    console.log('✅ 添加 visibility 索引');

    await connection.query(`
      ALTER TABLE notes
      ADD INDEX idx_expires_at (expires_at)
    `);
    console.log('✅ 添加 expires_at 索引');

    // 将现有笔记设置为 public
    await connection.query(`
      UPDATE notes SET visibility = 'public' WHERE visibility IS NULL
    `);
    console.log('✅ 更新现有笔记为公开');

    console.log('🎉 迁移完成！');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  } finally {
    await connection.end();
  }
}

migrate();
