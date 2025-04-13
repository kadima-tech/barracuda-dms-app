import type { FeatureExtractor } from './types';

/**
 * Mel-Frequency Cepstral Coefficients (MFCC) feature extractor
 * This class implements the FeatureExtractor interface to extract MFCC features from audio data
 * MFCC is a widely used technique in speech processing that better represents human auditory perception
 */
export class MFCCFeatureExtractor implements FeatureExtractor {
	private fftSize: number;
	private melFilterbankCount: number;
	private cepstralCoeffCount: number;
	private sampleRate: number;
	private preEmphasisCoefficient: number;

	constructor(
		options: {
			fftSize?: number;
			melFilterbankCount?: number;
			cepstralCoeffCount?: number;
			sampleRate?: number;
			preEmphasisCoefficient?: number;
		} = {}
	) {
		this.fftSize = options.fftSize || 1024;
		this.melFilterbankCount = options.melFilterbankCount || 26;
		this.cepstralCoeffCount = options.cepstralCoeffCount || 13;
		this.sampleRate = options.sampleRate || 44100;
		this.preEmphasisCoefficient = options.preEmphasisCoefficient || 0.97;
	}

	/**
	 * Extract MFCC features from audio data
	 * @param audioData Raw frequency data in Uint8Array format
	 * @returns Array of MFCC coefficients
	 */
	extract(audioData: Uint8Array): number[] {
		// Convert Uint8Array to Float32Array with values between -1 and 1
		const floatData = this.convertToFloat32(audioData);

		// Apply pre-emphasis filter to boost higher frequencies
		const preEmphasized = this.preEmphasis(floatData);

		// Apply windowing to reduce spectral leakage
		const windowed = this.applyWindow(preEmphasized);

		// Calculate power spectrum using FFT
		const powerSpectrum = this.powerSpectrum(windowed);

		// Apply mel filterbank
		const melFilterbank = this.melFilterBank(powerSpectrum);

		// Take log of filterbank energies
		const logFilterbank = melFilterbank.map((energy) => Math.log(Math.max(energy, 1e-10)));

		// Apply DCT to get cepstral coefficients
		const mfccs = this.discreteCosineTransform(logFilterbank);

		// Return the first N coefficients (typically 13)
		return mfccs.slice(0, this.cepstralCoeffCount);
	}

	/**
	 * Convert Uint8Array (0-255) to normalized Float32Array (-1 to 1)
	 */
	private convertToFloat32(data: Uint8Array): Float32Array {
		const float32 = new Float32Array(data.length);
		for (let i = 0; i < data.length; i++) {
			// Convert from 0-255 to -1-1 range
			float32[i] = data[i] / 128.0 - 1.0;
		}
		return float32;
	}

	/**
	 * Apply pre-emphasis filter to boost higher frequencies
	 */
	private preEmphasis(data: Float32Array): Float32Array {
		const result = new Float32Array(data.length);
		result[0] = data[0];
		for (let i = 1; i < data.length; i++) {
			result[i] = data[i] - this.preEmphasisCoefficient * data[i - 1];
		}
		return result;
	}

	/**
	 * Apply Hamming window to reduce spectral leakage
	 */
	private applyWindow(data: Float32Array): Float32Array {
		const result = new Float32Array(data.length);
		for (let i = 0; i < data.length; i++) {
			// Hamming window
			const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (data.length - 1));
			result[i] = data[i] * window;
		}
		return result;
	}

	/**
	 * Calculate power spectrum using FFT
	 * Note: In a real implementation, we would use a proper FFT library
	 * This is a simplified version for demonstration
	 */
	private powerSpectrum(data: Float32Array): Float32Array {
		// For demonstration, just return the absolute values
		// In a real implementation, this would perform an FFT
		const result = new Float32Array(this.fftSize / 2);
		for (let i = 0; i < result.length; i++) {
			const index = Math.floor(i * (data.length / result.length));
			result[i] = Math.abs(data[index]);
		}
		return result;
	}

	/**
	 * Convert frequency to Mel scale
	 */
	private freqToMel(freq: number): number {
		return 2595 * Math.log10(1 + freq / 700);
	}

	/**
	 * Convert Mel to frequency
	 */
	private melToFreq(mel: number): number {
		return 700 * (Math.pow(10, mel / 2595) - 1);
	}

	/**
	 * Apply mel filterbank to power spectrum
	 */
	private melFilterBank(powerSpectrum: Float32Array): Float32Array {
		const result = new Float32Array(this.melFilterbankCount);

		// Calculate mel filter banks (simplified)
		const lowFreq = 0;
		const highFreq = this.sampleRate / 2;
		const lowMel = this.freqToMel(lowFreq);
		const highMel = this.freqToMel(highFreq);

		// Create equally spaced points in mel scale
		const melPoints = new Array(this.melFilterbankCount + 2);
		for (let i = 0; i < melPoints.length; i++) {
			melPoints[i] = lowMel + (i * (highMel - lowMel)) / (melPoints.length - 1);
		}

		// Convert back to frequency
		const freqPoints = melPoints.map((mel) => this.melToFreq(mel));

		// Convert to FFT bin indices
		const bins = freqPoints.map((freq) =>
			Math.floor(((this.fftSize + 1) * freq) / this.sampleRate)
		);

		// Create filterbank (simplified)
		for (let m = 0; m < this.melFilterbankCount; m++) {
			let sum = 0;
			for (let i = 0; i < powerSpectrum.length; i++) {
				// Simple triangular filter (very simplified)
				if (i >= bins[m] && i <= bins[m + 2]) {
					let weight = 0;
					if (i <= bins[m + 1]) {
						weight = (i - bins[m]) / (bins[m + 1] - bins[m]);
					} else {
						weight = (bins[m + 2] - i) / (bins[m + 2] - bins[m + 1]);
					}
					sum += powerSpectrum[i] * weight;
				}
			}
			result[m] = sum;
		}

		return result;
	}

	/**
	 * Apply Discrete Cosine Transform (DCT) to get cepstral coefficients
	 */
	private discreteCosineTransform(logFilterbank: Float32Array): number[] {
		const result = new Array(this.melFilterbankCount);

		for (let i = 0; i < this.melFilterbankCount; i++) {
			let sum = 0;
			for (let j = 0; j < this.melFilterbankCount; j++) {
				sum += logFilterbank[j] * Math.cos((Math.PI * i * (j + 0.5)) / this.melFilterbankCount);
			}
			result[i] = sum;
		}

		return result;
	}
}
