// Play tones and sounds when notes are triggered from a keyboard or MIDI input.

function initNotePlayer({ synth, additiveSynth, soundGenerator, oscilloscope }){

  const NOTES = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];

  const padMapping = {
    36: () => soundGenerator.playSound('kick'),
    37: () => soundGenerator.playSound('drysnare'),
    38: () => soundGenerator.playSound('closedhihat'),
    39: () => soundGenerator.playSound('openhihat'),
  };

  const commandMapping = {
    106: () => synth.switchPatch(-1),
    107: () => synth.switchPatch(),
    104: () => additiveSynth.switchPreset(-1), // Scene up/down for additive synth
    105: () => additiveSynth.switchPreset(),
  };

  const activeNotes = {};

  function stopNote({ note, channel }) {
    const { stop } = activeNotes[note] || {};
    if (typeof stop === 'function') stop();  
    delete activeNotes[note];
  }

  function playNote({ note, channel, velocity }) {
    console.log('playNote', { note, channel, velocity });
    if (channel === 10) {
      padMapping[note]({ velocity });
    } else {
      // white and black keys - use additive synth for educational demonstration
      stopNote({ note, channel });
      const octave = Math.floor(note / 12);
      const noteIdx = note % 12;
      const { oscillator, gainNode } = additiveSynth.playNote({ note: NOTES[noteIdx], octave, velocity });

      oscilloscope.connect(gainNode);

      function stop() {
        oscillator.stop();
        oscilloscope.disconnect(gainNode);
      }

      activeNotes[note] = { stop };

    }
  }

  function playParsedMidiMessage({ command, note, channel, velocity }) {
    const commandKey = command === 11;
    const keyUp = command === 8;
    if (commandKey) {
      if (velocity > 0) commandMapping[note]();
    } else if (keyUp) {
      stopNote({ note, channel });
    } else {
      playNote({ note, channel, velocity });
    }
  };

  return {
    playParsedMidiMessage
  };
  
}
