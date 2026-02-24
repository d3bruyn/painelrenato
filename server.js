import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fs from "fs/promises"; // Necessário para o fs.unlink funcionar na deleção

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// Conexão MySQL (Preparado para o Railway)
// ==========================
const db = await mysql.createConnection(process.env.DATABASE_URL || {
  host: "localhost",
  user: "root",
  password: "",
  database: "painel_escola",
});

// ==========================
// CRIAÇÃO AUTOMÁTICA DAS TABELAS (A CORREÇÃO ESTÁ AQUI!)
// ==========================
await db.execute(`
  CREATE TABLE IF NOT EXISTS secretaria (
    id INT PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'livre',
    ultima_senha VARCHAR(50) DEFAULT '--'
  )
`);
await db.execute(`INSERT IGNORE INTO secretaria (id, status, ultima_senha) VALUES (1, 'livre', '--')`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caminho VARCHAR(255) NOT NULL
  )
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS cardapio (
    dia_semana VARCHAR(20) PRIMARY KEY,
    matutino TEXT,
    vespertino TEXT
  )
`);

// ==========================
// Upload de imagens
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ==========================
// ROTAS - CLIMA E IMAGENS (Exatamente as suas)
// ==========================

app.get("/api/clima", async (req, res) => {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=-20.3155&longitude=-40.3128&current_weather=true";
    const resposta = await fetch(url);
    const dados = await resposta.json();
    res.json({ temperatura: dados.current_weather.temperature, horario: dados.current_weather.time });
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao buscar clima" });
  }
});

app.get("/api/imagens", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM imagens ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar imagens." });
  }
});

app.post("/api/upload", upload.single("imagem"), async (req, res) => {
  try {
    const caminho = "uploads/" + req.file.filename;
    await db.execute("INSERT INTO imagens (caminho) VALUES (?)", [caminho]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ==========================
// ROTA PARA REMOVER IMAGEM
// ==========================
app.delete("/api/imagens/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute("SELECT caminho FROM imagens WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Imagem não encontrada no banco." });
    }

    const nomeArquivo = rows[0].caminho;
    const caminhoCompleto = path.join(__dirname, "public", nomeArquivo);

    try {
      await fs.unlink(caminhoCompleto);
    } catch (err) {
      console.log("Aviso: Arquivo não existia na pasta, removendo apenas do banco.");
    }

    await db.execute("DELETE FROM imagens WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar imagem:", error);
    res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
});

// ==========================
// ROTAS - CARDÁPIO (Exatamente as suas)
// ==========================

app.get("/api/cardapio/:dia", async (req, res) => {
  const [rows] = await db.execute("SELECT matutino, vespertino FROM cardapio WHERE dia_semana = ?", [req.params.dia]);
  res.json(rows[0] || { matutino: "", vespertino: "" });
});

app.post("/api/cardapio", async (req, res) => {
  try {
    const dias = ["segunda", "terca", "quarta", "quinta", "sexta"];
    for (const dia of dias) {
      const matutino = req.body[`${dia}_matutino`] || "";
      const vespertino = req.body[`${dia}_vespertino`] || "";
      await db.execute(
        `INSERT INTO cardapio (dia_semana, matutino, vespertino) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE matutino = VALUES(matutino), vespertino = VALUES(vespertino)`,
        [dia, matutino, vespertino]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ==========================
// ROTAS - SECRETARIA (Exatamente as suas)
// ==========================

app.get("/api/secretaria", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT status, ultima_senha FROM secretaria WHERE id = 1");
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados da secretaria" });
  }
});

app.post("/api/secretaria", async (req, res) => {
  try {
    const { status, senha } = req.body;
    await db.execute(
      "UPDATE secretaria SET status = ?, ultima_senha = ? WHERE id = 1",
      [status, senha]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar secretaria:", error);
    res.status(500).json({ success: false });
  }
});

// ==========================
// PÁGINAS E INICIALIZAÇÃO
// ==========================

app.get("/tv", (req, res) => res.sendFile(path.join(__dirname, "public/tv.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public/admin.html")));
app.get("/", (req, res) => res.redirect("/tv"));

// Porta do Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor ON na porta ${PORT}`);
});
