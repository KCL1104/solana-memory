import { AgentMemory } from '../memory/AgentMemory';

export interface Location {
    x: number;
    y: number;
    z: number;
}

export interface NPCMemory {
    content: string;
    importance: 'low' | 'medium' | 'high';
    tags: string[];
    metadata?: Record<string, any>;
}

export class MinecraftNPCAgent {
    public memory: AgentMemory;
    private npcId: string;
    private location: Location;

    constructor(npcId: string, spawnLocation: Location) {
        this.npcId = npcId;
        this.location = spawnLocation;
        this.memory = new AgentMemory({
            agentId: `minecraft-npc-${npcId}`,
            network: 'devnet'
        });
    }

    /**
     * Remember player interactions
     */
    async onPlayerInteract(playerId: string, action: string, item?: string): Promise<string> {
        await this.memory.store({
            content: `Player ${playerId} ${action}${item ? ` with ${item}` : ''} at ${JSON.stringify(this.location)}`,
            importance: 'high',
            tags: ['player-interaction', playerId, action],
            metadata: {
                playerId,
                action,
                item,
                location: this.location,
                timestamp: Date.now()
            }
        });

        // Check for repeat visits
        const history = await this.getPlayerHistory(playerId);
        if (history.length > 1) {
            // Find previous interaction
            const prevInteraction = history.find((h: any) => h.metadata?.action && h.metadata.action !== action);
            if (prevInteraction) {
                return `Welcome back! I remember you ${prevInteraction.metadata?.action} here before.`;
            }
            return `Welcome back! I remember you from before.`;
        }
        return `Hello! I'm ${this.npcId}.`;
    }

    /**
     * Spatial memory - remember locations
     */
    async rememberLocation(name: string, location: Location, type: string): Promise<void> {
        await this.memory.store({
            content: `${name} is a ${type} at coordinates ${location.x}, ${location.y}, ${location.z}`,
            importance: 'medium',
            tags: ['spatial-memory', 'location', type],
            metadata: { name, location, type }
        });
    }

    /**
     * Quest memory
     */
    async rememberQuestProgress(playerId: string, questId: string, stage: string): Promise<void> {
        await this.memory.store({
            content: `Player ${playerId} completed ${stage} of quest ${questId}`,
            importance: 'high',
            tags: ['quest', playerId, questId],
            metadata: { playerId, questId, stage, completedAt: Date.now() }
        });
    }

    /**
     * Retrieve player history
     */
    async getPlayerHistory(playerId: string): Promise<any[]> {
        return await this.memory.search({
            query: playerId,
            tags: ['player-interaction'],
            limit: 10
        });
    }

    /**
     * Get quest status
     */
    async getQuestStatus(playerId: string, questId: string): Promise<string> {
        // Search all quest memories and filter by metadata
        const memories = await this.memory.search({
            tags: ['quest'],
            limit: 100
        });
        
        // Filter for this specific quest and player
        const questMemories = memories.filter((m: any) => 
            m.metadata?.questId === questId && m.metadata?.playerId === playerId
        );
        
        if (questMemories.length === 0) {
            return 'not-started';
        }
        
        // Sort by timestamp to get latest (use entry timestamp as fallback)
        const sorted = questMemories.sort((a: any, b: any) => {
            const aTime = a.metadata?.completedAt || a.timestamp || 0;
            const bTime = b.metadata?.completedAt || b.timestamp || 0;
            return bTime - aTime;
        });
        
        return sorted[0]?.metadata?.stage || 'not-started';
    }

    /**
     * Get NPC ID
     */
    getId(): string {
        return this.npcId;
    }

    /**
     * Get current location
     */
    getLocation(): Location {
        return { ...this.location };
    }

    /**
     * Update location
     */
    updateLocation(location: Location): void {
        this.location = location;
    }
}

export default MinecraftNPCAgent;
