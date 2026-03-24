export type FeedbackType = "success" | "error" | "offline" | "synced";

export function playFeedback(type: FeedbackType, message?: string) {
  triggerVibration(type);
  speakFeedback(message ?? defaultMessage(type));
  playTone(type);
}

function defaultMessage(type: FeedbackType) {
  switch (type) {
    case "success":
      return "Успешен внес";
    case "error":
      return "Неуспешен внес";
    case "offline":
      return "Снимено локално";
    case "synced":
      return "Локалните внесови се испратени";
  }
}

function triggerVibration(type: FeedbackType) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  if (type === "error") {
    navigator.vibrate?.([220, 80, 220, 80, 220]);
    return;
  }

  if (type === "offline") {
    navigator.vibrate?.([120, 60, 120, 60, 200]);
    return;
  }

  if (type === "synced") {
    navigator.vibrate?.([80, 40, 80, 40, 80]);
    return;
  }

  navigator.vibrate?.([120, 40, 120]);
}

function playTone(type: FeedbackType) {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  try {
    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    if (type === "error") {
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.36);
    } else if (type === "offline") {
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(330, audioContext.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.28);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === "synced") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(990, audioContext.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.24);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.24);
    }

    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch {
    // Ignore audio feedback failures.
  }
}

function speakFeedback(message: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "mk-MK";
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis failures.
  }
}
