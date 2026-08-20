document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const resultsEl = document.getElementById('results');
    const winnerNameEl = document.getElementById('winner-name');
    const topicsContainer = document.getElementById('topics-container');

    try {
        const response = await fetch('/api/results');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch data');
        }

        loadingEl.classList.add('hidden');
        resultsEl.classList.remove('hidden');

        winnerNameEl.textContent = data.winner || 'No votes yet';

        data.topics.forEach((topic, index) => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <div class="topic-name">${topic.name}</div>
                <div class="topic-votes">${topic.votes}</div>
                <div class="topic-label">Votes</div>
            `;
            
            topicsContainer.appendChild(card);
        });

    } catch (err) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorEl.textContent = err.message;
    }
});
