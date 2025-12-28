import { getWorkletCode, WORKLET_PROCESSOR_NAME } from "./worklet.js";

export function createAudioEngine(ui) {
  let audio = null;
  let node = null;
  let masterGain = null;
  let playing = false;

  async function ensure() {
    if (audio) return { audio, node, masterGain };
    audio = new (window.AudioContext || window.webkitAudioContext)();

    const code = getWorkletCode();
    const blob = new Blob([code], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    await audio.audioWorklet.addModule(url);

    node = new AudioWorkletNode(audio, WORKLET_PROCESSOR_NAME, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });

    masterGain = audio.createGain();
    masterGain.gain.value = +ui.gain.value;

    node.connect(masterGain).connect(audio.destination);
    return { audio, node, masterGain };
  }

  function isReady() { return !!node; }
  function getNode() { return node; }
  function getAudio() { return audio; }

  function setMasterGain(v) {
    if (!masterGain || !audio) return;
    masterGain.gain.setValueAtTime(v, audio.currentTime);
  }

  function setParams() {
    if (!node || !audio) return;
    node.parameters.get("bpm").setValueAtTime(+ui.bpm.value, audio.currentTime);
    node.parameters.get("fmin").setValueAtTime(+ui.fmin.value, audio.currentTime);
    node.parameters.get("fmax").setValueAtTime(+ui.fmax.value, audio.currentTime);
    node.parameters.get("beatGain").setValueAtTime(+ui.beatGain.value, audio.currentTime);
    node.parameters.get("beatSteps").setValueAtTime(+ui.beatSteps.value, audio.currentTime);
  }

  function postTime(timeBuf) {
    if (!node) return;
    node.port.postMessage({ type: "time", time: timeBuf });
  }

  function postWaves(wavesPayload) {
    if (!node) return;
    node.port.postMessage({ type: "waves", waves: wavesPayload });
  }

  function postBeats(beatsPayload) {
    if (!node) return;
    node.port.postMessage({ type: "beats", beats: beatsPayload });
  }

  async function togglePlay() {
    const { audio: ctx, masterGain: mg } = await ensure();
    if (ctx.state === "suspended") await ctx.resume();

    playing = !playing;
    if (playing) {
      ui.playBtn.textContent = "Stop";
      mg.gain.setTargetAtTime(+ui.gain.value, ctx.currentTime, 0.01);
    } else {
      ui.playBtn.textContent = "Play";
      mg.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    }
    return playing;
  }

  return {
    ensure,
    isReady,
    getNode,
    getAudio,
    setMasterGain,
    setParams,
    postTime,
    postWaves,
    postBeats,
    togglePlay,
  };
}
