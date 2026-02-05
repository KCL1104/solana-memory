import { AgentMemory } from './AgentMemory';

export interface PointOfInterest {
    name: string;
    x: number;
    y: number;
    z: number;
    type: string;
    description?: string;
    discoveredAt: number;
}

export interface NavigationPath {
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
    distance: number;
    discoveredAt: number;
}

export class SpatialMemory {
    private memory: AgentMemory;
    private agentId: string;

    constructor(agentId: string) {
        this.agentId = agentId;
        this.memory = new AgentMemory({
            agentId: `spatial-${agentId}`,
            network: 'devnet'
        });
    }

    /**
     * Remember a location of interest
     */
    async rememberLocation(poi: Omit<PointOfInterest, 'discoveredAt'>): Promise<void> {
        await this.memory.store({
            content: `Discovered ${poi.name}: ${poi.type} at (${poi.x}, ${poi.y}, ${poi.z})${poi.description ? ` - ${poi.description}` : ''}`,
            importance: 'medium',
            tags: ['spatial-memory', 'location', poi.type, poi.name],
            metadata: {
                ...poi,
                discoveredAt: Date.now()
            }
        });
    }

    /**
     * Find locations by type
     */
    async findLocationsByType(type: string): Promise<PointOfInterest[]> {
        const results = await this.memory.search({
            query: type,
            tags: ['spatial-memory', 'location', type],
            limit: 20
        });

        return results
            .filter((r: any) => r.metadata && r.metadata.x !== undefined)
            .map((r: any) => ({
                name: r.metadata!.name,
                x: r.metadata!.x,
                y: r.metadata!.y,
                z: r.metadata!.z,
                type: r.metadata!.type,
                description: r.metadata!.description,
                discoveredAt: r.metadata!.discoveredAt
            }));
    }

    /**
     * Find locations by name
     */
    async findLocationByName(name: string): Promise<PointOfInterest | null> {
        const results = await this.memory.search({
            query: name,
            tags: ['spatial-memory', 'location'],
            limit: 5
        });

        const match = results.find((r: any) => 
            r.metadata?.name?.toLowerCase() === name.toLowerCase()
        );

        if (!match || !match.metadata) return null;

        return {
            name: match.metadata.name,
            x: match.metadata.x,
            y: match.metadata.y,
            z: match.metadata.z,
            type: match.metadata.type,
            description: match.metadata.description,
            discoveredAt: match.metadata.discoveredAt
        };
    }

    /**
     * Remember a navigation path between two points
     */
    async rememberPath(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): Promise<void> {
        const distance = Math.sqrt(
            Math.pow(to.x - from.x, 2) + 
            Math.pow(to.y - from.y, 2) + 
            Math.pow(to.z - from.z, 2)
        );

        await this.memory.store({
            content: `Path from (${from.x}, ${from.y}, ${from.z}) to (${to.x}, ${to.y}, ${to.z}) - distance: ${distance.toFixed(2)} blocks`,
            importance: 'low',
            tags: ['spatial-memory', 'path', 'navigation'],
            metadata: {
                from,
                to,
                distance,
                discoveredAt: Date.now()
            }
        });
    }

    /**
     * Get all remembered locations
     */
    async getAllLocations(): Promise<PointOfInterest[]> {
        const results = await this.memory.search({
            query: 'location',
            tags: ['spatial-memory', 'location'],
            limit: 100
        });

        return results
            .filter((r: any) => r.metadata && r.metadata.x !== undefined)
            .map((r: any) => ({
                name: r.metadata!.name,
                x: r.metadata!.x,
                y: r.metadata!.y,
                z: r.metadata!.z,
                type: r.metadata!.type,
                description: r.metadata!.description,
                discoveredAt: r.metadata!.discoveredAt
            }));
    }

    /**
     * Find nearest location of a specific type
     */
    async findNearestLocation(
        currentPos: { x: number; y: number; z: number },
        type: string
    ): Promise<PointOfInterest | null> {
        const locations = await this.findLocationsByType(type);
        
        if (locations.length === 0) return null;

        let nearest = locations[0];
        let minDistance = Infinity;

        for (const loc of locations) {
            const distance = Math.sqrt(
                Math.pow(loc.x - currentPos.x, 2) +
                Math.pow(loc.y - currentPos.y, 2) +
                Math.pow(loc.z - currentPos.z, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearest = loc;
            }
        }

        return nearest;
    }

    /**
     * Forget a location
     */
    async forgetLocation(name: string): Promise<void> {
        const location = await this.findLocationByName(name);
        if (location) {
            // In a real implementation, we'd delete the memory
            // For now, we store a "forgotten" marker
            await this.memory.store({
                content: `Location ${name} is no longer valid`,
                importance: 'high',
                tags: ['spatial-memory', 'forgotten', name],
                metadata: { name, forgottenAt: Date.now() }
            });
        }
    }
}

export default SpatialMemory;
