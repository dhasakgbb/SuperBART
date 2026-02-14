import Phaser from 'phaser';

export const ScanlineFragmentShader = `
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
uniform float uTime;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    
    // Simple scanline effect
    float scanline = sin(outTexCoord.y * 800.0) * 0.04;
    color.rgb -= scanline;

    // Subtle flicker
    float flicker = sin(uTime * 10.0) * 0.005;
    color.rgb += flicker;

    gl_FragColor = color;
}
`;

export class ScanlinePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game: Phaser.Game) {
        super({
            game,
            name: 'ScanlinePipeline',
            fragShader: ScanlineFragmentShader
        });
    }

    onPreRender(): void {
        this.set1f('uTime', this.game.loop.time / 1000);
    }
}
