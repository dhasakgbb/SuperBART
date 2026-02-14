import { describe, expect, test, vi } from 'vitest';
import { PopupManager } from '../src/systems/PopupManager';

// Mock Phaser
vi.mock('phaser', () => {
  return {
    default: {
      Display: {
        Color: {
          HexStringToColor: (hex: string) => ({ color: 12345 }), // Dummy color
        },
      },
    },
  };
});

describe('PopupManager', () => {
  test('spawn creates a bitmap text and animates it', () => {
    // Setup Mock Scene
    const mockText = {
      setOrigin: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    const scene = {
      add: {
        bitmapText: vi.fn().mockReturnValue(mockText),
      },
      tweens: {
        add: vi.fn(),
      },
      time: {
        delayedCall: vi.fn(),
      },
    };

    // Instantiate Manager
    const manager = new PopupManager(scene as any);

    // Act
    manager.spawn(100, 200, '+100 TEST');

    // Assert: Text Creation
    expect(scene.add.bitmapText).toHaveBeenCalledWith(100, 200, expect.any(String), '+100 TEST', expect.any(Number));
    expect(mockText.setOrigin).toHaveBeenCalledWith(0.5);
    expect(mockText.setDepth).toHaveBeenCalledWith(100);
    expect(mockText.setScale).toHaveBeenCalledWith(0);

    // Assert: Animation
    expect(scene.tweens.add).toHaveBeenCalledTimes(1);
    const tweenConfig = (scene.tweens.add as any).mock.calls[0][0];
    expect(tweenConfig.targets).toBe(mockText);
    expect(tweenConfig.scale).toBe(1.2);
    expect(tweenConfig.limit).toBeUndefined(); // Checking it's not some other tween

    // Simulate completion of first tween
    if (tweenConfig.onComplete) {
      tweenConfig.onComplete();
    }

    // Assert: Exit Animation
    expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    const exitTween = (scene.tweens.add as any).mock.calls[1][0];
    expect(exitTween.targets).toBe(mockText);
    expect(exitTween.alpha).toBe(0);
    
    // Simulate completion of exit tween
    if (exitTween.onComplete) {
      exitTween.onComplete();
    }

    // Assert: Cleanup
    expect(mockText.destroy).toHaveBeenCalled();
  });
});
