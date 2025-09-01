import init, { RustSynth } from './pkg/rust_synth.js';

class RustSynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.synth = null;

    this.port.onmessage = (event) => {
      if (event.data.type === 'init') {
        init(event.data.wasmModule).then(() => {
          this.synth = new RustSynth(event.data.sampleRate);
          this.port.postMessage({ type: 'ready' });
        });
      } else if (this.synth) {
        if (event.data.type === 'note_on') {
          this.synth.note_on(event.data.frequency);
        } else if (event.data.type === 'note_off') {
            this.synth.note_off();
        } else if (event.data.type === 'set_waveform') {
            // We need to map the string waveform to the enum value
            // This will be handled in the main thread for now.
            // Let's assume we get the correct enum value.
            this.synth.set_waveform(event.data.waveform);
        } else if (event.data.type === 'set_harmonics') {
            this.synth.set_harmonics(event.data.harmonics);
        }
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (!this.synth) {
      return true;
    }

    const output = outputs[0];
    const outputChannel = output[0];
    this.synth.process(outputChannel);

    // Send a copy of the audio data to the main thread for visualization.
    // To avoid flooding the main thread, we could downsample or send only periodically.
    // For now, we'll send every buffer.
    this.port.postMessage({ type: 'audio_data', data: outputChannel.slice(0) });

    return true;
  }
}

registerProcessor('rust-synth-processor', RustSynthProcessor);
