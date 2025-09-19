document.addEventListener('DOMContentLoaded', () => {

    const navButtons = document.querySelectorAll('.nav-button');
    const contentArea = document.getElementById('ranking-content-area');

    async function loadRanking(difficulty) {
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        contentArea.innerHTML = '<p>Carregando ranking...</p>';

        try {
            const response = await fetch(`https://truco-rosy.vercel.app/api/ranking?difficulty=${difficulty}&limit=all`);
            if (!response.ok) throw new Error('A resposta da rede não foi OK');
            const ranks = await response.json();

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Pos.</th>
                            <th>Nome</th>
                            <th>Tempo</th>
                        </tr>
                    </thead>
                    <tbody>`;
            
            if (ranks.length === 0) {
                tableHTML += '<tr><td colspan="3">Nenhum registro encontrado.</td></tr>';
            } else {
                ranks.forEach((rank, index) => {
                    tableHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${rank.name}</td>
                            <td>${rank.time}</td>
                        </tr>`;
                });
            }

            tableHTML += '</tbody></table>';
            contentArea.innerHTML = tableHTML;

        } catch (error) {
            console.error(`Erro ao carregar ranking ${difficulty}:`, error);
            contentArea.innerHTML = '<p>Erro ao carregar ranking. Verifique o backend.</p>';
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const difficulty = button.dataset.difficulty;
            loadRanking(difficulty);
        });
    });

    loadRanking('easy');
});