import { fillStrokedText } from '../util/util.js'
import { canvas, overlayCanvas, W, H } from '../canvas.js'
import { drawButton } from './button.js'
import { gameState } from '../state.js';

export const options = {
  fpsDisplay: 2, // 0 - off, 1 - fps, 2 - full
}


// Framerate Variables
let frameTimeSum = 0;
let frameTimeMin = 10000;
let frameTimeMax = -10000;
let frameTimeI = 0;
let frameTimeSamples = new Array(99);
const frameTimeSampleCount = 100;

export const tickUI = (prev, now) => {
  if (options.fpsDisplay > 0) {
    let dt = now - prev
    frameTimeSum -= frameTimeSamples[frameTimeI] || 0;
    frameTimeSamples[frameTimeI] = dt;
    frameTimeSum += dt;
    frameTimeMin = dt < frameTimeMin ? dt : frameTimeMin;
    frameTimeMax = dt > frameTimeMax ? dt : frameTimeMax;
    frameTimeI = frameTimeI >= frameTimeSampleCount - 1 ? 0 : frameTimeI + 1;
  }
}

export const drawUI = (ctx, dt, socket, playerCount, locPlayer) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = "20px monospace";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";

  ctx.lineWidth = 0.5;
  ctx.textAlign = "left";
  const avgFrameTime = (frameTimeSum / frameTimeSamples.length);
  if (options.fpsDisplay == 2) {
    ctx.fillText(`    Avg Frame Time: ${(avgFrameTime).toPrecision(4)} ms`, 5, 23);
    ctx.fillText(`Min/Max Frame Time: ${(frameTimeMin).toPrecision(4)}/${(frameTimeMax).toPrecision(4)} ms`, 5, 43);
  }
  if (options.fpsDisplay >= 1) {
    ctx.fillText(`${options.fpsDisplay == 2 ? '           ' : ''}Avg FPS: ${(1000 / avgFrameTime).toPrecision(6)} FPS`, 5, 63);
    if (frameTimeSamples[frameTimeI] <= frameTimeMin)
      frameTimeMin = 100000;
    if (frameTimeSamples[frameTimeI] >= frameTimeMax)
      frameTimeMax = -100000;


    ctx.font = "10px Kumbh Sans, sans-serif"
    ctx.beginPath()
    ctx.moveTo(5, 0);
    for (let i = 0; i < frameTimeSampleCount; i++) {
      ctx.lineTo(5 + frameTimeSamples[i] * 10000, (H / frameTimeSampleCount) * i);
    }
    ctx.fillRect(0, (H / frameTimeSampleCount) * frameTimeI, 200, 1);
    ctx.stroke();
  }

  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.font = "50px Kumbh Sans, sans-serif";
  // TODO: use non canvas HUD overlay for finer text control?
  fillStrokedText(ctx, socket.nsp.slice(1), W / 2, H - 43);
  ctx.font = "30px Kumbh Sans, sans-serif";
  fillStrokedText(ctx, `${playerCount}/10`, W / 2, H - 93);

  if (locPlayer.host) {
    ctx.font = "50px Kumbh Sans, sans-serif";
    ctx.fillStyle = "white";
    ctx.buttonStyle = "#606060";
    ctx.disabledStyle = "#555555";
    ctx.hoverStyle = "#7a7a7a";
    ctx.activeStyle = "#545454";
    if (drawButton(ctx, "Start", W / 2, H - 130, 250, 80, 0.5, 1, playerCount < 4))
      console.log('start game!!')
  }

  ctx.textAlign = "right";
  ctx.font = "30px Kumbh Sans, sans-serif";
  fillStrokedText(ctx, Math.max(0, gameState.killCounter.toFixed(0)), W - 10, H - 43)

  ctx.fillStyle = "white";

  // ctx.fillText(["held", "down", "unheld", "up"][mouseState], W / 2, 100);


  // TODO need a better human to debug this
  // ctx.drawImage(randomUiFunc(), 0, 0)
  // ctx.drawImage(scoreCanvas, 0, 0)
  // joystick goes main layer
  // drawJoystick(ctx, dt);
}

const randomUiFunc = () => {
  // ui components are dont move and stay in their seperate areas, when they update the space they takeup is cleared
  uiCtx.fillStyle = "white"
  let epic = drawButton(ctx, "call meting", W / 2, H - 130, 250, 80, 0.5, 1)
  return uiCanvas
}

/** @type {Canvas} */
// let scoreCanvas = document.createElement('canvas')
// scoreCanvas.width = 300
// scoreCanvas.height = 200

// /** @type {CanvasRenderingContext2D} */
// let scoreCtx = scoreCanvas.getContext('2d')
// let curScoreAmnt = 0;
// let scoreDirty = false;

// const scoreUIDraw = (dt) => {

//   scoreCtx.fillStyle = "white"
//   scoreCtx.fillRect(0, 0, 20, 200)
//   scoreCtx.fillRect(280, 0, 20, 200)
//   scoreCtx.stroke()
//   scoreCtx.fillStyle = "green"
//   scoreCtx.fillRect(20, 70, (curScoreAmnt / gameOptions.max_score) * 260, 60)

//   if (dt) {
//     curScoreAmnt = lerp(curScoreAmnt, gameState.score, 20 * dt);
//     if (gameState.score - curScoreAmnt <= EPSILON) scoreDirty = false;
//   } else
//     scoreDirty = true;
// }