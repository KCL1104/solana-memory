import { MinecraftNPCAgent } from '../src/agent/NPCAgent';

/**
 * Shopkeeper NPC Demo
 * 
 * Demonstrates:
 * - Transaction history tracking
 * - Player preference learning
 * - Personalized shopping experience
 */

async function demoShopkeeper() {
    console.log('=== Shopkeeper Demo ===\n');

    const shopkeeper = new MinecraftNPCAgent('shopkeeper-thorin', { x: 200, y: 65, z: 150 });

    console.log('Shopkeeper "Thorin" created at (200, 65, 150)\n');

    const playerId = 'player-789';

    // First visit - generic greeting
    console.log('--- First Visit ---');
    const greeting1 = await shopkeeper.onPlayerInteract(playerId, 'entered-shop');
    console.log(`Player: enters Thorin's shop`);
    console.log(`Thorin: "${greeting1}"`);
    console.log('Thorin: "Welcome to my shop! Take a look around."\n');

    // Player buys items
    console.log('--- Transaction ---');
    console.log('Player buys: 10 arrows (20 gold)');
    console.log('Player buys: 5 bread (10 gold)');
    console.log('Player buys: 1 bow (100 gold)\n');

    await shopkeeper.memory.store({
        content: `Player ${playerId} bought 10 arrows, 5 bread, and 1 bow for 130 gold total`,
        importance: 'medium',
        tags: ['transaction', playerId, 'purchase'],
        metadata: { 
            playerId, 
            items: ['arrows', 'bread', 'bow'], 
            quantities: [10, 5, 1],
            gold: 130,
            purchasedAt: Date.now()
        }
    });

    // Remember preferences
    await shopkeeper.memory.store({
        content: `Player ${playerId} prefers ranged weapons and survival items`,
        importance: 'high',
        tags: ['preference', playerId, 'shopping-pattern']
    });

    await shopkeeper.memory.store({
        content: `Player ${playerId} has spent 130 gold (big spender!)`,
        importance: 'medium',
        tags: ['customer-value', playerId]
    });

    console.log('(Thorin stores purchase in memory and analyzes preferences)\n');

    // Second visit - personalized greeting
    console.log('--- Second Visit (One Day Later) ---');
    const greeting2 = await shopkeeper.onPlayerInteract(playerId, 'returned-to-shop');
    console.log(`Player: returns to the shop`);
    console.log(`Thorin: "${greeting2}"`);
    console.log('Thorin: "Welcome back! I have new arrows that might interest you."');
    console.log('Thorin: "Since you bought that bow last time, perhaps you\'d like some enchanted arrows?"\n');

    // Another transaction
    console.log('--- Second Transaction ---');
    console.log('Player buys: 20 enchanted arrows (200 gold)');
    console.log('Player buys: 2 health potions (40 gold)\n');

    await shopkeeper.memory.store({
        content: `Player ${playerId} bought 20 enchanted arrows and 2 health potions for 240 gold`,
        importance: 'medium',
        tags: ['transaction', playerId, 'purchase'],
        metadata: { 
            playerId, 
            items: ['enchanted-arrows', 'health-potion'], 
            quantities: [20, 2],
            gold: 240,
            purchasedAt: Date.now()
        }
    });

    // Update preference with new insight
    await shopkeeper.memory.store({
        content: `Player ${playerId} values high-quality enchanted gear and consumables`,
        importance: 'high',
        tags: ['preference', playerId, 'shopping-pattern']
    });

    // Third visit - even more personalized
    console.log('--- Third Visit ---');
    const greeting3 = await shopkeeper.onPlayerInteract(playerId, 'returned-to-shop');
    console.log(`Player: visits again`);
    console.log(`Thorin: "${greeting3}"`);
    console.log('Thorin: "I see you\'re preparing for something big!"');
    console.log('Thorin: "I just got a shipment of rare potions - only my best customers get to see them."\n');

    // Query preferences
    console.log('--- Shopkeeper Memory Analysis ---');
    const preferences = await shopkeeper.memory.search({
        query: playerId,
        tags: ['preference']
    });
    console.log('Thorin remembers these preferences:');
    preferences.forEach((p: any, i: number) => {
        console.log(`  ${i + 1}. ${p.content}`);
    });

    // Query transaction history
    const transactions = await shopkeeper.memory.search({
        query: playerId,
        tags: ['transaction']
    });
    console.log(`\nTransaction history (${transactions.length} purchases):`);
    let totalSpent = 0;
    transactions.forEach((t: any, i: number) => {
        console.log(`  ${i + 1}. ${t.content}`);
        totalSpent += t.metadata?.gold || 0;
    });
    console.log(`\nTotal customer value: ${totalSpent} gold`);

    // Player asks for recommendation
    console.log('\n--- Personalized Recommendation ---');
    console.log('Player: "What do you recommend?"');
    console.log('Thorin: "Based on your purchases, I know you prefer ranged combat."');
    console.log('Thorin: "You\'ve bought arrows twice now - try this new Flame Bow!"');
    console.log('Thorin: "And with all those potions you bought, you must be preparing for a dungeon."\n');

    console.log('=== Demo Complete ===');
    console.log('Thorin now has persistent memory of:');
    console.log('  - Player\'s purchase history');
    console.log('  - Player\'s preferences (ranged weapons, quality gear)');
    console.log('  - Customer lifetime value');
    console.log('  - Personalized dialogue based on history');
}

// Run the demo
demoShopkeeper().catch(console.error);
