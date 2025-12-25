// Haptic feedback utility
class HapticManager {
  constructor() {
    this.enabled = true;
  }

  light() {
    if (!this.enabled || !window.navigator.vibrate) return;
    window.navigator.vibrate(10);
  }

  medium() {
    if (!this.enabled || !window.navigator.vibrate) return;
    window.navigator.vibrate(20);
  }

  heavy() {
    if (!this.enabled || !window.navigator.vibrate) return;
    window.navigator.vibrate(40);
  }

  success() {
    if (!this.enabled || !window.navigator.vibrate) return;
    window.navigator.vibrate([10, 50, 20]);
  }

  error() {
    if (!this.enabled || !window.navigator.vibrate) return;
    window.navigator.vibrate([20, 20, 20]);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

export const haptics = new HapticManager();