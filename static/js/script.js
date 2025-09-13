document.addEventListener('DOMContentLoaded', function() {
    const insightsForm = document.getElementById('insightsForm');
    if (insightsForm) {
        insightsForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const prompt = document.getElementById('prompt').value;
            const insightsResult = document.getElementById('insightsResult');
            insightsResult.innerHTML = `<p class="text-muted">Analyzing your data...</p>`;

            try {
                const response = await fetch('/get_insights', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: prompt })
                });
                const result = await response.json();

                if (response.ok) {
                    insightsResult.innerHTML = `<p>${result.insights}</p>`;
                } else {
                    insightsResult.innerHTML = `<p class="text-danger">Error: ${result.error}</p>`;
                }
            } catch (error) {
                insightsResult.innerHTML = `<p class="text-danger">An error occurred while fetching insights.</p>`;
                console.error('Error:', error);
            }
        });
    }
});