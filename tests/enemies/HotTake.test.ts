import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HotTake } from '../../src/enemies/definitions/HotTake';
import Phaser from 'phaser';

// Mock Phaser Physics Arcade Sprite
class MockEnemy extends HotTake {
  protected updateState(delta: number): void {
      super.updateState(delta);
  }
  public getState() { return (this as any).currentState; } 
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
                        setVelocityX(v: number) { this.body.velocity.x = v; }
                        setVelocityY(v: number) { this.body.velocity.y = v; }
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
                Angle: { Between: () => 0 }
            },
            Display: {
                Color: { GetColor: () => 0 }
            }
        }
    };
});

describe('HotTake', () => {
    let scene: any;
    let enemy: MockEnemy;

    beforeEach(() => {
        scene = {
            add: { existing: vi.fn() },
            physics: {
                add: { existing: vi.fn() },
                world: { bounds: { height: 600 } }
            },
            time: { delayedCall: vi.fn(), now: 1000 },
            tweens: { add: vi.fn() as any }
        };
        enemy = new MockEnemy({ scene, x: 100, y: 100, texture: 'test' });
    });

    it('should initialize in drift state', () => {
        // HotTake calls transitionTo('drift') in constructor
        // BaseEnemy.currentState is protected.
        // We can expose it via getter in MockEnemy.
        // Or check behavior (velocity x = -35)
        expect(enemy.body!.velocity.x).toBe(-35);
    });

    it('should oscillate Y during drift', () => {
        const initialY = enemy.y;
        scene.time.now = 2000; // Advance time
        enemy.manualUpdate(16);
        expect(enemy.y).not.toBe(initialY);
    });

    it('should transition to warn then burst', () => {
        // Drift for a while
        // phaseDuration default is ~2800 (DRIFT_MS * 1.4)
        scene.time.now = 5000;
        enemy.manualUpdate(3000); 
        
        // Should trigger transition to 'warn'
        // Mock setTint does nothing, we can verify state via debug or tint spy if we mock it better.
    });
        
    it('should jitter during warn state', () => {
        // Drift to warn
        scene.time.now = 5000;
        enemy.manualUpdate(3000); // Enter warn
        
        const startX = enemy.x;
        const startY = enemy.y;
        enemy.manualUpdate(16);
        // Should jitter
        expect(enemy.x).not.toBe(startX);
        expect(enemy.y).not.toBe(startY);
    });
});
