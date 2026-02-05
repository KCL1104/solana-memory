import { MinecraftNPCAgent } from '../src/agent/NPCAgent';

/**
 * Quest Giver NPC Demo
 * 
 * Demonstrates:
 * - Quest state tracking across sessions
 * - Remembering quest progress per player
 * - NPC dialogue based on quest status
 */

async function demoQuestGiver() {
    console.log('=== Quest Giver Demo ===\n');

    const questGiver = new MinecraftNPCAgent('quest-giver-elara', { x: 150, y: 70, z: 300 });

    console.log('Quest Giver "Elara" created at (150, 70, 300)\n');

    const playerId = 'player-456';
    const questId = 'lost-amulet-quest';

    // Check initial quest status
    console.log('--- Checking Initial Quest Status ---');
    const initialStatus = await questGiver.getQuestStatus(playerId, questId);
    console.log(`Quest status for ${playerId}: ${initialStatus}`);
    console.log();

    // Give quest
    console.log('--- Quest Offered ---');
    console.log('Elara: "Please find my lost amulet in the cave!"');
    console.log('Elara: "It was stolen by goblins and taken to the Ancient Cave."');
    console.log();
    
    await questGiver.rememberQuestProgress(playerId, questId, 'accepted');
    console.log(`(Quest progress stored: ${playerId} accepted the quest)\n`);

    // Player starts the quest
    const status1 = await questGiver.getQuestStatus(playerId, questId);
    console.log(`Quest status: ${status1}`);
    console.log();

    // Simulate time passing and player progress
    console.log('--- Player Progress ---');
    console.log('Player travels to the cave...');
    console.log('Player defeats goblins...');
    console.log('Player finds the amulet...\n');

    // Player returns after finding amulet
    await questGiver.rememberQuestProgress(playerId, questId, 'found-amulet');
    console.log(`(Quest progress stored: ${playerId} found the amulet)\n`);

    // Player completes the quest
    console.log('--- Quest Completion ---');
    await questGiver.rememberQuestProgress(playerId, questId, 'completed');
    console.log(`(Quest progress stored: ${playerId} completed the quest)\n`);

    // Check quest status later
    console.log('--- Final Quest Status ---');
    const finalStatus = await questGiver.getQuestStatus(playerId, questId);
    console.log(`Quest status: ${finalStatus}`);
    console.log();

    // Elara remembers and thanks
    console.log('--- NPC Dialogue ---');
    console.log('Elara: "Thank you for finding my amulet! I remember you helped me before."');
    console.log('Elara gives player reward: 100 gold coins\n');

    // Store reward in memory
    await questGiver.memory.store({
        content: `Player ${playerId} received 100 gold reward for completing ${questId}`,
        importance: 'medium',
        tags: ['quest-reward', playerId, questId],
        metadata: { playerId, questId, reward: 100, rewardedAt: Date.now() }
    });

    // Player returns later - Elara remembers
    console.log('--- Player Returns Later ---');
    const greeting = await questGiver.onPlayerInteract(playerId, 'visited');
    console.log(`Player: returns to Elara`);
    console.log(`Elara: "${greeting}"`);
    console.log('Elara: "How is that amulet treating you? I\'m so glad you found it!"\n');

    // Show quest history
    console.log('--- Quest History ---');
    const questHistory = await questGiver.memory.search({
        tags: ['quest'],
        limit: 100
    });
    // Filter for this specific quest and player
    const playerQuestHistory = questHistory.filter((h: any) => 
        h.metadata?.questId === questId && h.metadata?.playerId === playerId
    );
    console.log(`Quest progress entries: ${playerQuestHistory.length}`);
    playerQuestHistory.forEach((h: any, i: number) => {
        console.log(`  ${i + 1}. ${h.content}`);
    });

    console.log('\n=== Demo Complete ===');
    console.log('Elara now has persistent memory of:');
    console.log('  - Player who completed the quest');
    console.log('  - Quest progression through all stages');
    console.log('  - Reward that was given');
}

// Run the demo
demoQuestGiver().catch(console.error);
