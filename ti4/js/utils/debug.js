// Debug script to check if modules are loaded correctly
console.log('Debug script loaded');
console.log('window.stateCore exists?', !!window.stateCore);
console.log('window.actionPhase exists?', !!window.actionPhase);
console.log('window.strategyPhase exists?', !!window.strategyPhase);

// Check if gameState is accessible
if (window.stateCore && window.stateCore.getGameState) {
    console.log('gameState accessible?', !!window.stateCore.getGameState());
}

// Add a global debug function
window.debugModules = function() {
    console.log('=== MODULE DEBUG INFO ===');
    console.log('window.stateCore:', window.stateCore);
    console.log('window.actionPhase:', window.actionPhase);
    console.log('window.strategyPhase:', window.strategyPhase);
    
    if (window.stateCore && window.stateCore.getGameState) {
        const state = window.stateCore.getGameState();
        console.log('gameState:', state);
        console.log('gameState.stage:', state ? state.stage : 'N/A');
        console.log('gameState.turnOrder:', state ? state.turnOrder : 'N/A');
        console.log('gameState.selectedCards:', state ? state.selectedCards : 'N/A');
    }
    
    return 'Debug info logged to console';
};

// Call it once on load
setTimeout(window.debugModules, 1000);
