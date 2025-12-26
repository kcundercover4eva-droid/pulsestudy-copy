// Sound effect URLs - using free sound libraries
const sounds = {
  questComplete: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  purchase: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  unlock: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  streak: 'https://assets.mixkit.co/active_storage/sfx/1437/1437-preview.mp3',
  coin: 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
};

class SoundManager {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.audioCache = {};
  }

  play(soundName, volume = this.volume) {
    if (!this.enabled || !sounds[soundName]) return;

    try {
      let audio;
      if (this.audioCache[soundName]) {
        audio = this.audioCache[soundName].cloneNode();
      } else {
        audio = new Audio(sounds[soundName]);
        this.audioCache[soundName] = audio;
      }
      
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (error) {}
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

export const soundManager = new SoundManager();

// Ambient sound URLs (loopable ambient tracks)
const ambientSounds = {
  rain: 'https://assets.mixkit.co/active_storage/sfx/2393/2393.wav',
  cafe: 'https://assets.mixkit.co/active_storage/sfx/2487/2487.wav',
  whitenoise: 'https://assets.mixkit.co/active_storage/sfx/2395/2395.wav',
  synth: 'https://assets.mixkit.co/active_storage/sfx/2466/2466.wav',
};

// Ambient sound management
let currentAmbient = null;
let ambientAudio = null;

export const playSound = (soundType) => {
  soundManager.play(soundType);
};

export const playAmbient = (ambientType) => {
  stopAmbient();
  
  if (ambientType === 'none' || !ambientSounds[ambientType]) {
    return;
  }

  try {
    ambientAudio = new Audio(ambientSounds[ambientType]);
    ambientAudio.loop = true;
    ambientAudio.volume = 0.3;
    ambientAudio.play().catch(() => {});
    currentAmbient = ambientType;
  } catch (error) {
    console.error('Failed to play ambient sound:', error);
  }
};

export const stopAmbient = () => {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
  }
  currentAmbient = null;
};