import { AgentMemory } from '../memory/AgentMemory';

export interface WorldEvent {
    type: string;
    description: string;
    location?: { x: number; y: number; z: number };
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface WorldState {
    name: string;
    seed: string;
    lastSaved: number;
    dayTime: number;
    weather: 'clear' | 'rain' | 'thunder';
    loadedChunks: string[];
    activeEntities: string[];
}

export class WorldStateManager {
    private memory: AgentMemory;
    private worldId: string;

    constructor(worldId: string) {
        this.worldId = worldId;
        this.memory = new AgentMemory({
            agentId: `world-${worldId}`,
            network: 'devnet'
        });
    }

    /**
     * Save world state
     */
    async saveWorldState(state: Omit<WorldState, 'lastSaved'>): Promise<void> {
        const fullState: WorldState = {
            ...state,
            lastSaved: Date.now()
        };

        await this.memory.store({
            content: `World state saved: ${state.name} - Day ${Math.floor(state.dayTime / 24000)}, Weather: ${state.weather}`,
            importance: 'high',
            tags: ['world-state', 'save', this.worldId],
            metadata: fullState
        });
    }

    /**
     * Load the most recent world state
     */
    async loadWorldState(): Promise<WorldState | null> {
        const results = await this.memory.search({
            query: 'world state save',
            tags: ['world-state', 'save'],
            limit: 1
        });

        if (results.length === 0 || !results[0].metadata) {
            return null;
        }

        return results[0].metadata as WorldState;
    }

    /**
     * Record a world event
     */
    async recordEvent(event: Omit<WorldEvent, 'timestamp'>): Promise<void> {
        const fullEvent: WorldEvent = {
            ...event,
            timestamp: Date.now()
        };

        await this.memory.store({
            content: `Event: ${event.type} - ${event.description}`,
            importance: this.getEventImportance(event.type),
            tags: ['world-event', event.type, this.worldId],
            metadata: fullEvent
        });
    }

    /**
     * Get recent events
     */
    async getRecentEvents(limit: number = 10): Promise<WorldEvent[]> {
        const results = await this.memory.search({
            query: 'event',
            tags: ['world-event'],
            limit
        });

        return results
            .filter((r: any) => r.metadata)
            .map((r: any) => r.metadata as WorldEvent)
            .sort((a: WorldEvent, b: WorldEvent) => b.timestamp - a.timestamp);
    }

    /**
     * Get events by type
     */
    async getEventsByType(type: string, limit: number = 20): Promise<WorldEvent[]> {
        const results = await this.memory.search({
            query: type,
            tags: ['world-event', type],
            limit
        });

        return results
            .filter((r: any) => r.metadata)
            .map((r: any) => r.metadata as WorldEvent)
            .sort((a: WorldEvent, b: WorldEvent) => b.timestamp - a.timestamp);
    }

    /**
     * Get events in a region
     */
    async getEventsInRegion(
        center: { x: number; y: number; z: number },
        radius: number,
        limit: number = 20
    ): Promise<WorldEvent[]> {
        const allEvents = await this.getRecentEvents(100);
        
        return allEvents
            .filter((event: WorldEvent) => {
                if (!event.location) return false;
                const distance = Math.sqrt(
                    Math.pow(event.location.x - center.x, 2) +
                    Math.pow(event.location.y - center.y, 2) +
                    Math.pow(event.location.z - center.z, 2)
                );
                return distance <= radius;
            })
            .slice(0, limit);
    }

    /**
     * Track player session
     */
    async trackPlayerSession(playerId: string, action: 'join' | 'leave', location?: { x: number; y: number; z: number }): Promise<void> {
        await this.recordEvent({
            type: `player-${action}`,
            description: `Player ${playerId} ${action}ed the world`,
            location,
            metadata: { playerId, action }
        });
    }

    /**
     * Get world statistics
     */
    async getWorldStats(): Promise<{
        totalEvents: number;
        playerJoins: number;
        playerLeaves: number;
        lastSave: number | null;
    }> {
        const allEvents = await this.memory.search({
            query: '',
            tags: ['world-event'],
            limit: 1000
        });

        const joins = allEvents.filter((e: any) => e.metadata?.type === 'player-join').length;
        const leaves = allEvents.filter((e: any) => e.metadata?.type === 'player-leave').length;
        
        const saves = await this.memory.search({
            query: '',
            tags: ['world-state', 'save'],
            limit: 1
        });

        return {
            totalEvents: allEvents.length,
            playerJoins: joins,
            playerLeaves: leaves,
            lastSave: saves[0]?.metadata?.lastSaved || null
        };
    }

    private getEventImportance(type: string): 'low' | 'medium' | 'high' {
        const highImportance = ['player-death', 'boss-defeated', 'structure-discovered'];
        const mediumImportance = ['player-join', 'player-leave', 'item-craft', 'mob-kill'];
        
        if (highImportance.includes(type)) return 'high';
        if (mediumImportance.includes(type)) return 'medium';
        return 'low';
    }
}

export default WorldStateManager;
