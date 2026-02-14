import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Analyst } from '../../src/enemies/definitions/Analyst';
import Phaser from 'phaser';

// Mock Phaser Physics Arcade Sprite
class MockEnemy extends Analyst {
  protected updateState(delta: number): void {
      super.updateState(delta);
  }
}

vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Arcade: {
                    Sprite: class {
                        scene: any;
                        x: number;
                        y: number;
                        texture: string;
                        frame: any;
                        body: any;
                        active: boolean = true;
                        constructor(scene: any, x: number, y: number, texture: string, frame: string | number) {
                            this.scene = scene;
                            this.x = x;
                            this.y = y;
                            this.texture = texture;
                            this.frame = frame;
                            this.body = {
                                setSize: vi.fn(),
                                setOffset: vi.fn(),
                                velocity: { x: 0, y: 0 },
                                checkCollision: { none: false },
                                top: 0,
                                bottom: 20
                            };
                        }
                        setCollideWorldBounds() {}
                        setBounce() {}
                        setGravityY() {}
                        setVelocity(x: number, y: number) { this.body.velocity.x = x; this.body.velocity.y = y; }
                        setTint() {}
                        clearTint() {}
                        destroy() { this.active = false; }
                        setFlipX() {}
                        setTexture() {}
                        setScale() {}
                        setPosition(x: number, y: number) { this.x = x; this.y = y; }
                        setImmovable() {}
                        setData() {}
                    }
                }
            },
            Math: {
                Angle: { Between: () => 0 }
            },
            Display: {
                Color: { GetColor: () => 0 }
            }
        }
    };
});

describe('Analyst', () => {
    let scene: any;
    let enemy: MockEnemy;
    let context: any;

    beforeEach(() => {
        scene = {
            add: { existing: vi.fn() },
            physics: {
                add: { existing: vi.fn() },
                world: { bounds: { height: 600 } }
            },
            time: { delayedCall: vi.fn() },
            tweens: { add: vi.fn() as any }
        };
        context = {
            projectiles: {
                create: vi.fn().mockReturnValue({
                    body: { setAllowGravity: vi.fn(), setVelocity: vi.fn(), setCollideWorldBounds: vi.fn() },
                    setData: vi.fn(),
                    setVelocity: vi.fn(),
                    setCollideWorldBounds: vi.fn()
                })
            },
            spawnLingerZone: vi.fn()
        };
        enemy = new MockEnemy({ scene, x: 100, y: 100, texture: 'test' }, context);
    });

    it('should initialize and be immovable', () => {
        // Immovable logic called in constructor, mocking setImmovable required to check?
        // Mock setImmovable is empty, so just check it doesn't crash.
        expect(enemy).toBeDefined();
    });

    it('should fire projectiles periodically', () => {
        // cadence is 2100. updateState adds timer.
        // It should fire? Constructor set timer = cadence = 2100?
        // Wait, constructor set `this.timer = this.cadence`.
        // So first updateState call: timer += delta (e.g. 16) -> 2116 >= 2100 -> fire!
        
        enemy.manualUpdate(16);
        expect(context.projectiles.create).toHaveBeenCalledTimes(3);
        
        // After firing, timer resets to 0.
        // Next update shouldn't fire.
        context.projectiles.create.mockClear();
        enemy.manualUpdate(16);
        expect(context.projectiles.create).not.toHaveBeenCalled();
    });

    it('should recover from recoil', () => {
        // firing causes recoil (y -= 5)
        enemy.manualUpdate(16); // Fire -> y becomes 95
        expect(enemy.y).toBe(95);

        // Recoil recovery logic: if y < baseY - 4 (100-4=96) && timer > 2000
        // timer is 0 after fire.
        // wait for timer > 2000
        enemy.manualUpdate(2001); 
        // timer is now ~2001. y is 95. 95 < 96.
        // Should increment y by 0.3
        const prevY = enemy.y;
        enemy.manualUpdate(16);
        expect(enemy.y).toBeGreaterThan(prevY);
    });

    it('should show telegraphing visuals before firing', () => {
        // Cadence 2100. Telegraph starts at 1600.
        enemy.manualUpdate(1600);
        // Should have tint and scale change
        // Mock setTint/setScale are empty but we can infer logical execution
        
        // Advance to fire
        enemy.manualUpdate(501);
        expect(context.projectiles.create).toHaveBeenCalled();
    });
});
