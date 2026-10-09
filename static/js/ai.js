const aiModeButtons = document.querySelectorAll('[data-ai-mode]');
if (aiModeButtons.length) {
  aiModeButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const difficulty = event.currentTarget.dataset.aiMode;
      const select = document.getElementById('difficultySelect');
      if (select) select.value = difficulty;
    });
  });
}

function applyAiIndicator(mode) {
  const label = document.querySelector('.ai-mode-label');
  if (label) {
    label.textContent = `AI mode selected: ${mode}`;
  }
}

window.setAiMode = applyAiIndicator;
