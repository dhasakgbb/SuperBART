import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../../src/enemies/BaseEnemy';
import Phaser from 'phaser';

// Mock Phaser Physics Arcade Sprite
class MockEnemy extends BaseEnemy {
  public get kind(): EnemyKind { return 'walker'; }
  public get displayName(): string { return 'MOCK'; }
  protected updateState(delta: number): void {}
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

describe('BaseEnemy', () => {
    let scene: any;
    let enemy: MockEnemy;

    beforeEach(() => {
        scene = {
            add: { existing: vi.fn() },
            physics: {
                add: { existing: vi.fn() },
                world: { bounds: { height: 600 } }
            },
            time: { delayedCall: vi.fn() },
            tweens: { add: vi.fn() }
        };
        enemy = new MockEnemy({ scene, x: 100, y: 100, texture: 'test' });
    });

    it('should initialize with default state', () => {
        expect(enemy.serializeDebug().state).toBe('idle');
        expect(enemy.serializeDebug().hp).toBe(1);
    });

    it('should transition states', () => {
        enemy.transitionTo('patrol');
        expect(enemy.serializeDebug().state).toBe('patrol');
    });

    it('should take damage and die', () => {
        enemy.takeDamage(1);
        expect(scene.tweens.add).toHaveBeenCalled(); // Death tween
        expect(enemy.serializeDebug().state).toBe('dead');
    });

    it('should handle stomp collision', () => {
        const player = {
            body: {
                bottom: 90, // Above enemy top (100)
                velocity: { y: 100 }
            },
            x: 100
        } as any;
        
        // Mock enemy bounds override
        Object.defineProperty(enemy.body, 'top', { value: 100, writable: true });
        
        const result = enemy.onPlayerCollision(player);
        expect(result).toBe('stomp');
    });
});
