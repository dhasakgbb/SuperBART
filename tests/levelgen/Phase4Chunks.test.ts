import { describe, it, expect } from 'vitest';
import { CHUNK_LIBRARY, FAMILY_TEMPLATES } from '../../src/levelgen/generator';
import { getWorldRules } from '../../src/levelgen/worldRules';

describe('Phase 4 Chunks', () => {
    it('technical_debt_sprint should be in library', () => {
        expect(CHUNK_LIBRARY['technical_debt_sprint']).toBeDefined();
        expect(CHUNK_LIBRARY['technical_debt_sprint'].tags).toContain('GAP_LONG');
    });

    it('analyst_tower should be in library', () => {
        expect(CHUNK_LIBRARY['analyst_tower']).toBeDefined();
        expect(CHUNK_LIBRARY['analyst_tower'].tags).toContain('RISE_STEP');
    });

    it('should be included in distinct families', () => {
        expect(FAMILY_TEMPLATES['technical_debt_sprint']).toContain('technical_debt_sprint');
        expect(FAMILY_TEMPLATES['analyst_tower']).toContain('analyst_tower');
        expect(FAMILY_TEMPLATES['legacy_slide_01']).toContain('legacy_slide_01');
        expect(FAMILY_TEMPLATES['hot_take_gauntlet']).toContain('hot_take_gauntlet');
    });
    
    it('World 4 rules should allow technical_debt enemy', () => {
        const rules = getWorldRules(4);
        expect(rules.campaign?.allowedEnemyTags).toContain('technical_debt');
        expect(rules.campaign?.allowedEnemyTags).toContain('spitter');
        expect(rules.campaign?.allowedEnemyTags).toContain('hot_take');
    });
    
    it('World 3 rules should allow technical_debt enemy', () => {
        const rules = getWorldRules(3);
        expect(rules.campaign?.allowedEnemyTags).toContain('technical_debt');
        expect(rules.campaign?.allowedEnemyTags).toContain('spitter');
    });
});
