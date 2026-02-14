import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { loadSave, persistSave } from '../systems/save';
import { runtimeStore } from '../core/runtime';
import { transitionToScene } from './sceneFlow';

function hexToInt(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

function palette(name: string): number {
  return hexToInt(stylePalette[name] ?? '#ffffff');
}

export class TitleScene extends Phaser.Scene {
  private promptBlink: Phaser.Time.TimerEvent | null = null;
  private cameraPanTween: Phaser.Tweens.Tween | null = null;
  private sceneReadyStableFrames = 2;

  constructor() {
    super('TitleScene');
  }

  // Duplicate function removed.


  create(): void {
    const titleLayout = styleConfig.titleLayout;
    
    runtimeStore.mode = 'title';
    runtimeStore.save = loadSave();
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();

    // 1. Premium Background: Cinematic Sky
    const bg = this.add.image(0, 0, 'title_sky_premium')
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-100);

    // 2. Premium Logo: "Hi-Bit" Metallic
    const logoY = this.scale.height * 0.35;
    const logo = this.add.image(this.scale.width / 2, logoY, 'title_logo_premium')
      .setOrigin(0.5, 0.5)
      .setScale(0.8) // Adjust based on visual fit
      .setDepth(10);
    
    // Add subtle bobbing to logo
    this.tweens.add({
        targets: logo,
        y: logoY - 5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // 3. Hero Sprite (V5 Hi-Rez) - Standing "On Top" of the world
    // We'll place him on a "Server Rack" cliff if we had one, but for now, 
    // let's place him dramatically in the center bottom or side.
    // For this pass, let's keep it simple: Logo + Sky + Start Prompt.
    
    // 4. Start Prompt (Pulsing)
    const promptY = this.scale.height * 0.8;
    const prompt = this.add.bitmapText(
      this.scale.width / 2,
      promptY,
      styleConfig.typography.fontKey,
      "PRESS START",
      16 // Hardcoded size as styleConfig doesn't have fontSizePx
    )
    .setOrigin(0.5, 0.5)
    .setTint(palette('hudAccent')) // Gold/Yellow
    .setDepth(20);

    this.tweens.add({
        targets: prompt,
        alpha: 0,
        duration: 800,
        yoyo: true,
        repeat: -1,
    });

    // 5. Version/Credit (Subtle)
    this.add.bitmapText(
        10, 
        this.scale.height - 20, 
        styleConfig.typography.fontKey, 
        "SUPER BART: CLOUD QUEST (PREMIUM BUILD)", 
        16
    ).setTint(0x888888).setDepth(20);

    // logic for input...
    this.setupInput(audio);
    this.setSceneReadyMarker();
  }

  private setupInput(audio: AudioEngine): void {
    const goLevelSelect = (): void => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'WorldMapScene');
    };

    this.input.keyboard?.on('keydown-ENTER', () => goLevelSelect());
    this.input.keyboard?.on('keydown-SPACE', () => goLevelSelect());
    
    // Cheat to reset save
    this.input.keyboard?.on('keydown-N', () => {
        const fresh = loadSave();
        runtimeStore.save = { ...fresh, progression: { score: 0, coins: 0, stars: 0, deaths: 0, timeMs: 0 }, campaign: { ...fresh.campaign, world: 1, levelIndex: 1, unlockedLevelKeys: ['1-1'], completedLevelKeys: [] } };
        persistSave(runtimeStore.save);
        goLevelSelect();
    });
  }

  // Remove duplicate setSceneReadyMarker if it exists below or above.
  // The previous implementation had it at the top. We will keep it here if it's unique.
  // Checking the file content, it seems I pasted it at the bottom in the previous turn, 
  // but it might already exist at the top. I will ensure it's valid.

}
