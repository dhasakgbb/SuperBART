import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TechnicalDebt } from '../../src/enemies/definitions/TechnicalDebt';
import Phaser from 'phaser';

// Mock Phaser Physics Arcade Sprite
class MockEnemy extends TechnicalDebt {
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
                            (this as any).on = vi.fn(); // Mock event emitter
                        }
                        setCollideWorldBounds() {}
                        setBounce() {}
                        setGravityY() {}
                        setVelocity(x: number, y: number) { 
                            this.body.velocity.x = x; 
                            this.body.velocity.y = y; 
                        }
                        setTint() {}
                        clearTint() {}
                        destroy() { this.active = false; }
                        setFlipX() {}
                        setTexture() {}
                        setScale() {}
                        setPosition(x: number, y: number) { this.x = x; this.y = y; }
                    }
                }
            },
            Math: {
                Angle: { Between: () => 0 },
                Distance: { Between: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2)) }
            },
            Display: {
                Color: { GetColor: () => 0 }
            }
        }
    };
});

describe('TechnicalDebt', () => {
    let scene: any;
    let enemy: MockEnemy;
    let context: any;

    beforeEach(() => {
        scene = {
            add: { 
                existing: vi.fn(),
                graphics: vi.fn().mockReturnValue({
                    clear: vi.fn(),
                    lineStyle: vi.fn(),
                    lineBetween: vi.fn(),
                    destroy: vi.fn()
                })
            },
            physics: {
                add: { existing: vi.fn() },
                world: { bounds: { height: 600 } }
            },
            time: { delayedCall: vi.fn() },
            tweens: { add: vi.fn() as any }
        };
        context = {
            getPlayerPosition: vi.fn().mockReturnValue({ x: 200, y: 100 })
        };
        enemy = new MockEnemy({ scene, x: 100, y: 100, texture: 'test' }, context);
    });

    it('should initialize in patrol state', () => {
        expect(enemy.serializeDebug().state).toBe('patrol');
    });

    it('should lunge when player is close', () => {
        // Distance 100 (x:100 to x:200) < 140 detection
        enemy.manualUpdate(16);
        expect(enemy.serializeDebug().state).toBe('attack');
        expect(enemy.body!.velocity.x).toBeGreaterThan(0);
    });

    it('should ignore player if far away', () => {
        context.getPlayerPosition.mockReturnValue({ x: 500, y: 100 });
        enemy.manualUpdate(16);
        expect(enemy.serializeDebug().state).toBe('patrol');
        expect(enemy.body!.velocity.x).toBe(0);
    });

    it('should return to anchor after lunge', () => {
        // Trigger lunge
        enemy.manualUpdate(16); 
        expect(enemy.serializeDebug().state).toBe('attack');

        // Fast forward past lunge duration (400ms)
        enemy.manualUpdate(500);
        expect(enemy.serializeDebug().state).toBe('idle'); // Return state
    });
});
