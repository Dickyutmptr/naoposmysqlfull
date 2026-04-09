const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const mysql = require('mysql2/promise');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

// Init Next.js
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Test Database Connection
  try {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
          // Connect ping and disconnect nicely to prevent hanging connection limits
          const connection = await mysql.createConnection(dbUrl);
          console.log("✅ Server Database Terkoneksi: MySQL Connected");
          await connection.end();
      } else {
          console.log("⚠️ Peringatan: DATABASE_URL tidak ditemukan di environment.");
      }
  } catch (error) {
      console.error("❌ MySQL error:", error.message);
  }

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
