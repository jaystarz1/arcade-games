// Game Integration for PWA Install Prompt
// This script monitors for game over events and triggers install prompt

(function() {
  'use strict';

  let gamesPlayedThisSession = 0;

  // Function to track game completion
  window.trackGameComplete = function() {
    gamesPlayedThisSession++;
    console.log('Game completed. Total this session:', gamesPlayedThisSession);

    // Notify install manager if it exists
    if (window.installManager) {
      window.installManager.incrementGamesPlayed();
    }
  };

  // Monitor DOM for game over screens (fallback detection)
  // This watches for text changes that might indicate game over
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const bodyText = document.body.textContent || '';

        // Look for game over indicators
        if (bodyText.includes('GAME OVER') ||
            bodyText.includes('Game Over') ||
            bodyText.includes('MISSION SUCCESS!') ||
            bodyText.includes('MISSION FAILED') ||
            bodyText.includes('PRESS SPACE TO RESTART') ||
            bodyText.includes('TAP TO RESTART') ||
            (bodyText.includes('Success!') && bodyText.includes('Score:'))) {

          // Debounce: only trigger once per game
          if (!observer.gameOverDetected) {
            observer.gameOverDetected = true;
            console.log('Game over detected via DOM observation');

            // Visual debug feedback
            const debugDiv = document.createElement('div');
            debugDiv.style.cssText = 'position:fixed;top:10px;left:10px;background:red;color:white;padding:10px;z-index:99999;font-size:14px;';
            debugDiv.textContent = 'Game ' + (parseInt(localStorage.getItem('si-games-played') || '0') + 1) + ' detected!';
            document.body.appendChild(debugDiv);
            setTimeout(() => debugDiv.remove(), 2000);

            window.trackGameComplete();

            // Reset after 2 seconds (allows for new game)
            setTimeout(() => {
              observer.gameOverDetected = false;
            }, 2000);
          }
        }
      }
    });
  });

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  console.log('Game integration loaded - install prompts will trigger every 5 games');
})();
