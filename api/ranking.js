// Importa a biblioteca do PostgreSQL.
const { Pool } = require('pg');

// Cria um "pool" de conexões usando a string de conexão do Neon.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// A função principal que a Vercel irá executar
module.exports = async (req, res) => {
    // URL ATUALIZADA para a permissão de segurança (CORS)
    res.setHeader('Access-Control-Allow-Origin', 'https://truco-resenha.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Rota para BUSCAR o ranking (GET)
        if (req.method === 'GET') {
            const { difficulty } = req.query;

            if (!['easy', 'medium', 'hard'].includes(difficulty)) {
                return res.status(400).json({ error: 'Dificuldade inválida' });
            }

            const { rows } = await pool.query(
                `SELECT name, time FROM rankings
                 WHERE difficulty = $1
                 ORDER BY (SUBSTRING(time, 1, 2)::int * 60 + SUBSTRING(time, 4, 2)::int) ASC
                 LIMIT 100;`,
                [difficulty]
            );

            return res.status(200).json(rows);
        }
        // Rota para SALVAR um novo score (POST)
        else if (req.method === 'POST') {
            const { name, time, difficulty } = req.body;

            if (!name || !time || !difficulty || name.length > 10) {
                return res.status(400).json({ error: 'Dados inválidos' });
            }

            await pool.query(
                'INSERT INTO rankings (name, time, difficulty) VALUES ($1, $2, $3);',
                [name, time, difficulty]
            );
            
            const { rows } = await pool.query(
                `WITH ranked_scores AS (
                    SELECT name, time, difficulty, RANK() OVER (
                        PARTITION BY difficulty 
                        ORDER BY (SUBSTRING(time, 1, 2)::int * 60 + SUBSTRING(time, 4, 2)::int) ASC
                    ) as rank
                    FROM rankings
                )
                SELECT rank FROM ranked_scores
                WHERE name = $1 AND time = $2 AND difficulty = $3;`,
                [name, time, difficulty]
            );

            return res.status(201).json({ message: 'Score salvo com sucesso!', newRank: rows[0]?.rank || 'N/A' });
        }
        else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Método ${req.method} não permitido`);
        }
    } catch (error) {
        console.error('Erro no servidor:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
