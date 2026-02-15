import Phaser from 'phaser';
import { runtimeStore } from '../core/runtime';
import { getInterlude } from '../content/scriptNarrative';
import { completeCurrentLevel, persistSave } from '../systems/save';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

type InterludeData = {
  completedWorld?: number;
  completedStage?: number;
  stats?: { timeSec: number; coins: number; stars: number; deaths: number };
};

type InterludeCompletionResult = {
  world: number;
  stage: number;
  revealWorld?: number;
  revealFromWorld?: number;
  finishedCampaign: boolean;
};

export class InterludeScene extends Phaser.Scene {
  constructor() {
    super('InterludeScene');
  }

  create(data: InterludeData): void {
    const typography = styleConfig.typography;
    const completedWorld = data.completedWorld ?? runtimeStore.save.campaign.world;
    const completedStage = data.completedStage ?? runtimeStore.save.campaign.stage;
    const copy = getInterlude(completedWorld, completedStage)
      ?? { text: 'Bart keeps walking. The corridor hums. Another door unlocks.' };

    const result = completeCurrentLevel(runtimeStore.save);
    runtimeStore.save = result.save;
    persistSave(runtimeStore.save);

    this.cameras.main.setBackgroundColor(palette('skyDeep'));
    this.add
      .bitmapText(72, 120, typography.fontKey, `INTERLUDE ${completedWorld}-${completedStage}`, 22)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(1);
    this.add
      .bitmapText(72, 178, typography.fontKey, copy.text, 16)
      .setMaxWidth(816)
      .setTint(palette('hudText'))
      .setLetterSpacing(1);
    this.add
      .bitmapText(72, 458, typography.fontKey, 'NO INPUT REQUIRED', 14)
      .setTint(palette('inkSoft'))
      .setLetterSpacing(1);

    this.time.delayedCall(3400, () => {
      const completion: InterludeCompletionResult = {
        world: completedWorld,
        stage: completedStage,
        revealWorld: result.revealWorld,
        revealFromWorld: result.revealFromWorld,
        finishedCampaign: result.finishedCampaign,
      };

      if (completedWorld === 5 && completedStage === 2 && !runtimeStore.save.choiceFlags.recordsDeleteChoice) {
        transitionToScene(this, 'ChoiceScene', { type: 'records' }, { durationMs: 160, fadeInMs: 120 });
        return;
      }
      if (completedWorld === 6 && completedStage === 2) {
        transitionToScene(this, 'ChoiceScene', { type: 'reboot' }, { durationMs: 160, fadeInMs: 120 });
        return;
      }
      if (completedStage >= 4) {
        if (completedWorld >= 6) {
          transitionToScene(this, 'ChoiceScene', { type: 'reboot' }, { durationMs: 160, fadeInMs: 120 });
          return;
        }
        if (completion.finishedCampaign) {
          transitionToScene(this, 'ChoiceScene', { type: 'reboot' }, { durationMs: 160, fadeInMs: 120 });
          return;
        }
        transitionToScene(this, 'DebriefScene', {
          world: completion.world,
          revealWorld: completion.revealWorld,
          revealFromWorld: completion.revealFromWorld,
        }, { durationMs: 160, fadeInMs: 120 });
        return;
      }
      transitionToScene(
        this,
        'PlayScene',
        { world: runtimeStore.save.campaign.world, stage: runtimeStore.save.campaign.stage },
        { durationMs: 120, fadeInMs: 120 },
      );
    });
  }
}
