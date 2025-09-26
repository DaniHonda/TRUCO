document.addEventListener('DOMContentLoaded', () => {

    const navButtons = document.querySelectorAll('.nav-button');
    const contentArea = document.getElementById('ranking-content-area');

    async function loadRanking(difficulty) {
        // 1. Atualiza o estilo do botão ativo
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        // 2. Mostra mensagem de carregamento
        contentArea.innerHTML = '<p>Carregando ranking...</p>';

        try {
            // 3. Busca os dados do servidor
            // ATENÇÃO: a URL '/api/ranking.php' é um exemplo. Mude para o endereço do seu servidor.
            const response = await fetch(`/api/ranking.php?difficulty=${difficulty}&limit=all`);
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
            contentArea.innerHTML = '<p>Erro ao carregar ranking. Tente novamente mais tarde.</p>';
        }
    }

    // 5. Adiciona o evento de clique para cada botão de navegação
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const difficulty = button.dataset.difficulty;
            loadRanking(difficulty);
        });
    });

    // 6. Carrega o ranking 'Fácil' por padrão ao abrir a página
    loadRanking('easy');
});