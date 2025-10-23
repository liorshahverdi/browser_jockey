// Musical scales and note mappings
export const scales = {
    major: [0, 2, 4, 5, 7, 9, 11, 12],
    minor: [0, 2, 3, 5, 7, 8, 10, 12],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15],
    'pentatonic-major': [0, 2, 4, 7, 9, 12, 14, 16],
    'pentatonic-minor': [0, 3, 5, 7, 10, 12, 15, 17]
};

export const keyboardMap = {
    // Lower octave (A-K keys)
    'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5, 'j': 6, 'k': 7,
    'A': 0, 'S': 1, 'D': 2, 'F': 3, 'G': 4, 'H': 5, 'J': 6, 'K': 7,
    // Upper octave (Q-I keys)
    'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4, 'y': 5, 'u': 6, 'i': 7,
    'Q': 0, 'W': 1, 'E': 2, 'R': 3, 'T': 4, 'Y': 5, 'U': 6, 'I': 7,
    // Additional mappings for compatibility
    'z': 0, 'x': 2, 'c': 4, 'v': 5, 'b': 7, 'n': 9, 'm': 11, ',': 12,
    'Z': 0, 'X': 2, 'C': 4, 'V': 5, 'B': 7, 'N': 9, 'M': 11, '<': 12
};

// Map musical notes to frequencies and colors
export const noteFrequencies = {
    'C': { freq: 261.63, color: { h: 0, s: 100, l: 50 } },      // Red
    'C#': { freq: 277.18, color: { h: 30, s: 100, l: 50 } },    // Orange
    'D': { freq: 293.66, color: { h: 60, s: 100, l: 50 } },     // Yellow
    'D#': { freq: 311.13, color: { h: 90, s: 100, l: 50 } },    // Yellow-Green
    'E': { freq: 329.63, color: { h: 120, s: 100, l: 50 } },    // Green
    'F': { freq: 349.23, color: { h: 150, s: 100, l: 50 } },    // Cyan-Green
    'F#': { freq: 369.99, color: { h: 180, s: 100, l: 50 } },   // Cyan
    'G': { freq: 392.00, color: { h: 210, s: 100, l: 50 } },    // Light Blue
    'G#': { freq: 415.30, color: { h: 240, s: 100, l: 50 } },   // Blue
    'A': { freq: 440.00, color: { h: 270, s: 100, l: 50 } },    // Purple
    'A#': { freq: 466.16, color: { h: 300, s: 100, l: 50 } },   // Magenta
    'B': { freq: 493.88, color: { h: 330, s: 100, l: 50 } }     // Pink
};

export const musicScales = {
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9]
};
