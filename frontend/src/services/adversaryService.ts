import { Adversary } from '@/types/adversaryTypes';
import { Participant } from '@/state/participantsStore';
import { nanoid } from 'nanoid';

/**
 * Service to load and manage adversary data
 */
class AdversaryService {
  private adversaries: Adversary[] = [];
  private loaded = false;
  
  /**
   * Load adversaries from the JSON file
   */
  async loadAdversaries(): Promise<Adversary[]> {
    if (this.loaded) {
      return this.adversaries;
    }
    
    try {
      const response = await fetch('/assets/data/adversaries.json');
      if (!response.ok) {
        throw new Error(`Failed to load adversaries: ${response.statusText}`);
      }
      
      this.adversaries = await response.json();
      this.loaded = true;
      return this.adversaries;
    } catch (error) {
      console.error('Error loading adversaries:', error);
      return [];
    }
  }
  
  /**
   * Get all adversaries
   */
  async getAdversaries(): Promise<Adversary[]> {
    if (!this.loaded) {
      return this.loadAdversaries();
    }
    return this.adversaries;
  }
  
  /**
   * Find an adversary by name
   */
  async getAdversaryByName(name: string): Promise<Adversary | undefined> {
    const adversaries = await this.getAdversaries();
    return adversaries.find(adv => adv.name === name);
  }
  
  /**
   * Convert an adversary to a participant
   */
  convertToParticipant(adversary: Adversary): Participant {
    // Get characteristics with proper capitalization
    const characteristics = adversary.characteristics || {};
    
    // Create a participant from the adversary data
    const participant: Participant = {
      id: nanoid(),
      name: adversary.name,
      isPC: false,
      stats: {
        // Basic stats
        type: adversary.type,
        adversaryId: adversary.name, // Store the adversary name as a reference
        
        // Characteristics
        brawn: characteristics.Brawn || 2,
        agility: characteristics.Agility || 2,
        intellect: characteristics.Intellect || 2,
        cunning: characteristics.Cunning || 2,
        willpower: characteristics.Willpower || 2,
        presence: characteristics.Presence || 2,
        
        // Derived stats
        soak: adversary.derived?.soak || characteristics.Brawn || 2,
        woundThreshold: adversary.derived?.wounds || (adversary.type === 'Minion' ? 5 : 12),
        wounds: 0,
        strainThreshold: adversary.derived?.strain || 0,
        strain: 0,
        
        // Defense values
        meleeDefense: adversary.derived?.defense?.[0] || 0,
        rangedDefense: adversary.derived?.defense?.[1] || 0,
        
        // Set minion count if this is a minion
        minions: adversary.type === 'Minion' ? 4 : undefined,
        
        // Skills, weapons and talents
        skills: adversary.skills || {},
        weapons: adversary.weapons || [],
        talents: adversary.talents || [],
        abilities: adversary.abilities || []
      },
      // Initialize dice pouch with default values
      dicePouch: {
        boost: 0,
        setback: 0,
        advantage: 0,
        threat: 0,
        success: 0,
        failure: 0,
        triumph: 0,
        despair: 0,
        force: 0
      }
    };
    
    return participant;
  }
  
  /**
   * Filter adversaries by type
   */
  async getAdversariesByType(type: 'Minion' | 'Rival' | 'Nemesis'): Promise<Adversary[]> {
    const adversaries = await this.getAdversaries();
    return adversaries.filter(adv => adv.type === type);
  }
  
  /**
   * Filter adversaries by tag
   */
  async getAdversariesByTag(tag: string): Promise<Adversary[]> {
    const adversaries = await this.getAdversaries();
    return adversaries.filter(adv => adv.tags?.includes(tag));
  }

  /**
   * Get a random adversary
   * @param type Optional type to filter by
   */
  async getRandomAdversary(type?: 'Minion' | 'Rival' | 'Nemesis'): Promise<Adversary | undefined> {
    const adversaries = await this.getAdversaries();
    
    if (adversaries.length === 0) {
      return undefined;
    }
    
    // Filter by type if provided
    const filteredAdversaries = type 
      ? adversaries.filter(adv => adv.type === type)
      : adversaries;
    
    // Return a random adversary from the filtered list
    if (filteredAdversaries.length === 0) {
      return undefined;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredAdversaries.length);
    return filteredAdversaries[randomIndex];
  }
}

// Create a singleton instance
const adversaryService = new AdversaryService();

export default adversaryService;
