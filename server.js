const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Armazenamento em memória
let ranking = {};
let lastUpdate = new Date().toISOString();

// Recebe dados do CS2
app.post('/gsi', (req, res) => {
  try {
    const data = req.body;
    
    // Verifica se tem dados de jogador
    if (data.player?.match_stats && data.provider?.steamid) {
      const steamid = data.provider.steamid;
      const kills = data.player.match_stats.kills || 0;
      
      // Atualiza ou cria jogador
      ranking[steamid] = {
        name: data.player.name || `Player_${steamid.slice(-4)}`,
        kills: kills,
        steamid: steamid,
        lastUpdate: new Date().toISOString()
      };
      
      lastUpdate = new Date().toISOString();
      
      console.log(`🎯 ${ranking[steamid].name} - Kills: ${kills}`);
    }
    
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint do ranking (público)
app.get('/ranking', (req, res) => {
  const sorted = Object.values(ranking)
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 16); // Top 16 jogadores
  
  res.json({
    lastUpdate: lastUpdate,
    totalPlayers: Object.keys(ranking).length,
    players: sorted
  });
});

// Página inicial (health check)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'CS2 Rank API - Funcionando! ✅',
    endpoint: '/ranking'
  });
});

// Limpa ranking quando servidor reinicia
app.post('/reset', (req, res) => {
  ranking = {};
  lastUpdate = new Date().toISOString();
  res.json({ status: 'reset', message: 'Ranking resetado!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor CS2 Rank online na porta ${PORT}`);
  console.log(`📊 Ranking: http://localhost:${PORT}/ranking`);
});
