import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LegacySystem } from '../../src/enemies/definitions/LegacySystem';
import Phaser from 'phaser';

// Mock Phaser Physics Arcade Sprite
class MockEnemy extends LegacySystem {
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
                                setOffset: vi.fn(), // Needed for LegacySystem
                                velocity: { x: 0, y: 0 },
                                checkCollision: { none: false, left: false, right: false },
                                blocked: { left: false, right: false }, // Needed for patrol
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
                        setTexture(t: string) { this.texture = t; }
                        setScale() {}
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

describe('LegacySystem', () => {
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
            tweens: { add: vi.fn() as any }
        };
        enemy = new MockEnemy({ scene, x: 100, y: 100, texture: 'test' });
    });

    it('should initialize in patrol state', () => {
        expect(enemy.serializeDebug().state).toBe('patrol');
        expect(enemy.body!.velocity.x).not.toBe(0);
    });

    it('should turn around when blocked', () => {
        const initialVel = -55;
        enemy.setVelocityX(initialVel);
        
        // Simulate blocked left
        enemy.body!.blocked.left = true;
        enemy.manualUpdate(16);
        
        expect(enemy.body!.velocity.x).toBeGreaterThan(0);
    });

    it('should retract when stomped', () => {
        const player = {
            body: {
                bottom: 90, 
                velocity: { y: 100 }
            },
            x: 100,
            setVelocityY: vi.fn()
        } as any;
        
        // Mock body top
        Object.defineProperty(enemy.body, 'top', { value: 100, writable: true });

        const result = enemy.onPlayerCollision(player);
        
        expect(result).toBe('stomp');
        expect(enemy.serializeDebug().state).toBe('idle');
        expect(enemy.texture).toBe('enemy_shell_retracted');
        expect(player.setVelocityY).toHaveBeenCalled();
    });

    it('should slide when kicked', () => {
        // First transition to idle
        enemy.transitionTo('idle');
        enemy.manualUpdate(1000); // clear safe timer logic if any

        const player = {
            body: {
                bottom: 110, // Not a stomp
                velocity: { y: 0 }
            },
            x: 50, // Left of enemy
            setVelocityY: vi.fn()
        } as any;
        
        // Mock body top
        Object.defineProperty(enemy.body, 'top', { value: 100, writable: true });

        const result = enemy.onPlayerCollision(player);
        
        expect(result).toBe('stomp'); // Kick counts as stomp return to prevent damage
        expect(enemy.serializeDebug().state).toBe('attack');
        expect(enemy.body!.velocity.x).toBeGreaterThan(0); // Should move right
    });
});
