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
  rain: 'https://cdn.pixabay.com/audio/2022/05/13/audio_257112ce99.mp3',
  cafe: 'https://archive.org/download/1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart/1%20Hour%20Relaxing%20Jazz%20Coffee%20Shop%20Music%20%20The%20Best%20Melodies%20That%20Will%20Warm%20Your%20Heart.mp3',
  whitenoise: 'https://assets.mixkit.co/active_storage/sfx/2395/2395.wav',
  synth: 'https://archive.org/download/youtube-g6hY7dB54bc/2%20Hour%20Synthwave%20MIX%20-%20L.A.%20Sunset%20%20Royalty%20Free%20Copyright%20Safe%20Music-g6hY7dB54bc.mp3',
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
    ambientAudio.volume = 0.4;
    
    const playPromise = ambientAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Ambient sound playing:', ambientType);
          currentAmbient = ambientType;
        })
        .catch(error => {
          console.error('Play failed:', error);
        });
    }
  } catch (error) {
    console.error('Failed to create ambient sound:', error);
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