use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq)]
pub enum Waveform {
    Sine,
    Square,
    Sawtooth,
    Triangle,
    Pulse,
    Additive,
}

#[wasm_bindgen]
pub struct RustSynth {
    waveform: Waveform,
    phase: f32,
    frequency: f32,
    duty_cycle: f32,
    sample_rate: f32,
    harmonics: Vec<f32>,
}

#[wasm_bindgen]
impl RustSynth {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> RustSynth {
        RustSynth {
            waveform: Waveform::Sine,
            phase: 0.0,
            frequency: 0.0, // Start silent
            duty_cycle: 0.5,
            sample_rate,
            harmonics: vec![1.0], // Default to a single harmonic (sine wave)
        }
    }

    pub fn set_waveform(&mut self, waveform: Waveform) {
        self.waveform = waveform;
    }

    pub fn set_harmonics(&mut self, harmonics: Vec<f32>) {
        self.harmonics = harmonics;
    }

    pub fn note_on(&mut self, frequency: f32) {
        self.frequency = frequency;
        self.phase = 0.0; // Reset phase on new note
    }

    pub fn note_off(&mut self) {
        self.frequency = 0.0;
    }

    pub fn set_duty_cycle(&mut self, duty_cycle: f32) {
        self.duty_cycle = duty_cycle;
    }

    pub fn process(&mut self, output: &mut [f32]) {
        if self.frequency == 0.0 {
            for sample in output.iter_mut() {
                *sample = 0.0;
            }
            return;
        }

        let increment = self.frequency / self.sample_rate;
        for sample in output.iter_mut() {
            *sample = if self.waveform == Waveform::Additive {
                let mut value = 0.0;
                for (i, amplitude) in self.harmonics.iter().enumerate() {
                    if *amplitude > 0.0 {
                        let harmonic_frequency = (i + 1) as f32;
                        value += (self.phase * 2.0 * PI * harmonic_frequency).sin() * amplitude;
                    }
                }
                // Normalize the output to avoid clipping
                let total_amplitude: f32 = self.harmonics.iter().sum();
                if total_amplitude > 1.0 {
                    value / total_amplitude
                } else {
                    value
                }
            } else {
                 match self.waveform {
                    Waveform::Sine => (self.phase * 2.0 * PI).sin(),
                    Waveform::Square => {
                        if self.phase < self.duty_cycle { 1.0 } else { -1.0 }
                    }
                    Waveform::Sawtooth => 2.0 * (self.phase - self.phase.floor()) - 1.0,
                    Waveform::Triangle => 4.0 * (self.phase - 0.5).abs() - 1.0,
                    Waveform::Pulse => { // Same as square for now, but could be different
                        if self.phase < self.duty_cycle { 1.0 } else { -1.0 }
                    }
                    Waveform::Additive => 0.0, // Should not happen due to the if/else
                }
            };
            self.phase = (self.phase + increment) % 1.0;
        }
    }

    pub fn get_pulse_waveform_data(&self) -> Vec<f32> {
        let mut real = vec![0.0; 512];
        for n in 1..512 {
            real[n] = 2.0 * (PI * n as f32 * self.duty_cycle).sin() / (PI * n as f32);
        }
        real
    }
}
