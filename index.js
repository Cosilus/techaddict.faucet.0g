const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const path = require("path");
const archiver = require("archiver");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("⚠️ PRIVATE_KEY non défini !");
  process.exit(1);
}

// Remplace l'URL ci-dessous par ton endpoint choisi
const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

provider.getNetwork()
  .then(n => console.log("🎯 Réseau connecté :", n))
  .catch(console.error);

app.post("/request", async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Adresse manquante" });

  try {
    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther("0.01")
    });
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (err) {
    console.error("❌ Erreur lors de l’envoi :", err);
    res.status(500).json({ error: err.message || "Erreur inconnue" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/download", (req, res) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  res.attachment('faucet-0g-testnet.zip');
  archive.pipe(res);
  
  // Ajouter les fichiers au ZIP
  archive.file('index.js', { name: 'index.js' });
  archive.file('package.json', { name: 'package.json' });
  archive.directory('public/', 'public');
  
  archive.finalize();
});

app.listen(PORT, () => {
  console.log(`✅ Faucet 0G Testnet en service sur le port ${PORT}`);
});
