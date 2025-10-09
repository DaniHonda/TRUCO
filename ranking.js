document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.ranking-nav .nav-button');
    const contentArea = document.getElementById('ranking-content-area');

    async function loadRanking(difficulty) {
        // 1. Atualiza o estilo do botão ativo
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        // 2. Mostra mensagem de carregamento
        contentArea.innerHTML = '<p>Carregando ranking...</p>';

        try {
            // 3. Busca os dados do servidor (URL CORRIGIDA)
            const response = await fetch(`/api/ranking?difficulty=${difficulty}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const ranks = await response.json();

            // 4. Monta a tabela com os dados recebidos
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
                    // Previne XSS, tratando os dados como texto
                    const rankName = document.createTextNode(rank.name).textContent;
                    const rankTime = document.createTextNode(rank.time).textContent;
                    tableHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${rankName}</td>
                            <td>${rankTime}</td>
                        </tr>`;
                });
            }

            tableHTML += '</tbody></table>';
            contentArea.innerHTML = tableHTML;

        } catch (error) {
            console.error(`Erro ao carregar ranking ${difficulty}:`, error);
            contentArea.innerHTML = '<p>Erro ao carregar ranking. Tente novamente mais tarde.</p>';
        }
    }

    // 5. Adiciona o evento de clique para cada botão de navegação
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const difficulty = button.dataset.difficulty;
            if (difficulty) {
                loadRanking(difficulty);
            }
        });
    });

    // 6. Carrega o ranking 'Fácil' por padrão ao abrir a página
    loadRanking('easy');
});
