const { execSync } = require('child_process');

async function restore() {
    try {
        console.log('--- Starting Master Recipe Restoration ---');
        
        console.log('1/5: Running update_recipes.js...');
        execSync('node update_recipes.js', { stdio: 'inherit' });
        
        console.log('2/5: Running seed_gujarati.js...');
        execSync('node seed_gujarati.js', { stdio: 'inherit' });
        
        console.log('3/5: Running seed_south_indian.js...');
        execSync('node seed_south_indian.js', { stdio: 'inherit' });
        
        console.log('4/5: Running seed_punjabi.js...');
        execSync('node seed_punjabi.js', { stdio: 'inherit' });
        
        console.log('5/5: Running cleanup_recipes.js...');
        execSync('node cleanup_recipes.js', { stdio: 'inherit' });
        
        console.log('\n✅ All recipes restored successfully!');
    } catch (err) {
        console.error('\n❌ Restoration failed:', err.message);
        process.exit(1);
    }
}

restore();
