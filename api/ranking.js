// Importa a biblioteca do PostgreSQL. Em um ambiente como Vercel, ela já estará disponível.
const { Pool } = require('pg');

// Cria um "pool" de conexões usando a string de conexão do Neon.
// O process.env.DATABASE_URL é uma variável de ambiente segura que você configurará na plataforma de hospedagem.
// NUNCA COLOQUE A STRING DE CONEXÃO DIRETAMENTE AQUI.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// A função principal que a Vercel (ou outra plataforma) irá executar
module.exports = async (req, res) => {
    try {
        // Rota para BUSCAR o ranking (GET)
        if (req.method === 'GET') {
            const { difficulty } = req.query;

            // Validação simples para segurança
            if (!['easy', 'medium', 'hard'].includes(difficulty)) {
                return res.status(400).json({ error: 'Dificuldade inválida' });
            }

            // Query para buscar os rankings, ordenando pelo tempo
            const { rows } = await pool.query(
                `SELECT name, time FROM rankings
                 WHERE difficulty = $1
                 ORDER BY (SUBSTRING(time, 1, 2)::int * 60 + SUBSTRING(time, 4, 2)::int) ASC
                 LIMIT 100;`, // Limita a 100 resultados por segurança
                [difficulty]
            );

            res.status(200).json(rows);
        }
        // Rota para SALVAR um novo score (POST)
        else if (req.method === 'POST') {
            const { name, time, difficulty } = req.body;

            // Validações simples
            if (!name || !time || !difficulty || name.length > 10) {
                return res.status(400).json({ error: 'Dados inválidos' });
            }

            // Insere o novo score no banco de dados
            await pool.query(
                'INSERT INTO rankings (name, time, difficulty) VALUES ($1, $2, $3);',
                [name, time, difficulty]
            );
            
            // Descobre a nova posição (rank) do jogador
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

            res.status(201).json({ message: 'Score salvo com sucesso!', newRank: rows[0]?.rank || 'N/A' });
        }
        // Se for qualquer outro método (PUT, DELETE, etc.)
        else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Método ${req.method} não permitido`);
        }
    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};