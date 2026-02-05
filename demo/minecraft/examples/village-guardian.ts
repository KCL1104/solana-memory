import { MinecraftNPCAgent } from '../src/agent/NPCAgent';

/**
 * Village Guardian NPC Demo
 * 
 * Demonstrates:
 * - Player recognition on repeat visits
 * - Remembering player actions
 * - Spatial memory for important locations
 */

async function demoVillageGuardian() {
    console.log('=== Village Guardian Demo ===\n');

    // Create guardian NPC at village center
    const guardian = new MinecraftNPCAgent(
        'village-guardian-elder',
        { x: 100, y: 64, z: 200 }
    );

    console.log('Guardian NPC created at village center (100, 64, 200)\n');

    // Player first encounter
    console.log('--- First Player Encounter ---');
    const greeting1 = await guardian.onPlayerInteract('player-123', 'greeted');
    console.log(`Player: approaches guardian`);
    console.log(`Guardian: "${greeting1}"`);
    console.log();

    // Player attacks goblin
    console.log('--- Player Action ---');
    const response1 = await guardian.onPlayerInteract('player-123', 'defeated', 'goblin');
    console.log(`Player: defeats goblin near the village`);
    console.log(`Guardian: "${response1}"`);
    console.log('(Guardian stores this heroic action in memory)\n');

    // Player returns later
    console.log('--- Player Returns Later ---');
    const greeting2 = await guardian.onPlayerInteract('player-123', 'returned');
    console.log(`Player: returns to the village`);
    console.log(`Guardian: "${greeting2}"`);
    console.log('(Guardian recognizes the returning player!)\n');

    // Remember important locations
    console.log('--- Spatial Memory ---');
    await guardian.rememberLocation(
        'Blacksmith Forge',
        { x: 120, y: 64, z: 220 },
        'crafting-station'
    );
    console.log('Guardian remembers: Blacksmith Forge at (120, 64, 220)');

    await guardian.rememberLocation(
        'Village Well',
        { x: 100, y: 64, z: 200 },
        'water-source'
    );
    console.log('Guardian remembers: Village Well at (100, 64, 200)');

    await guardian.rememberLocation(
        'Ancient Cave',
        { x: 50, y: 40, z: 150 },
        'dungeon'
    );
    console.log('Guardian remembers: Ancient Cave at (50, 40, 150)\n');

    // Query memory
    console.log('--- Memory Query ---');
    const forge = await guardian.memory.search({
        query: 'Blacksmith'
    });
    console.log('Searching memory for "Blacksmith":');
    if (forge.length > 0) {
        console.log(`  Found: ${forge[0].content}`);
    }

    const playerHistory = await guardian.getPlayerHistory('player-123');
    console.log(`\nPlayer-123 interaction count: ${playerHistory.length}`);
    console.log('Interactions:');
    playerHistory.forEach((h: any, i: number) => {
        console.log(`  ${i + 1}. ${h.content}`);
    });

    console.log('\n=== Demo Complete ===');
    console.log('The guardian NPC now has persistent memory of:');
    console.log('  - Player who defeated the goblin');
    console.log('  - Important village locations');
    console.log('  - Player interaction history');
}

// Run the demo
demoVillageGuardian().catch(console.error);
