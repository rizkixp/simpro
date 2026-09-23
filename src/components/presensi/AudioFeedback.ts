// Web Audio API & Web Speech API Helper for Digital Attendance Kiosk

class AudioManager {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Sound effect for successful attendance (bright futuristic chime)
   */
  playSuccess(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      // First note (587.33 Hz - D5), then glide to (880 Hz - A5)
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Audio playback can silently fail if user has not interacted with DOM yet
    }
  }

  /**
   * Sound effect for already checked-in warning (dual gentle alert beep)
   */
  playWarning(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(440, now + 0.12); // A4

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      gain.gain.setValueAtTime(0.2, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  /**
   * Sound effect for unrecognized barcode/student
   */
  playError(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  /**
   * Indonesian Text-to-Speech Greeting for Student
   */
  speakGreeting(
    nama: string,
    kelas: string,
    statusKeterangan: "Tepat Waktu" | "Terlambat" | "Pulang" | "Sudah Hadir"
  ): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      // Clean first name for natural speech
      const firstName = nama.split(" ")[0] || nama;
      let text = "";

      if (statusKeterangan === "Tepat Waktu") {
        text = `Selamat pagi ${firstName}, kelas ${kelas}. Hadir tepat waktu.`;
      } else if (statusKeterangan === "Terlambat") {
        text = `Halo ${firstName}. Hadir tercatat, terlambat.`;
      } else if (statusKeterangan === "Pulang") {
        text = `Terima kasih ${firstName}, presensi pulang berhasil. Hati-hati di jalan.`;
      } else {
        text = `${firstName}, Anda sudah absen hari ini.`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select Indonesian voice if present
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang === "id-ID" || v.lang.startsWith("id") || v.name.toLowerCase().includes("indonesia")
      );
      if (idVoice) {
        utterance.voice = idVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis unsupported or blocked
    }
  }
}

export const attendanceAudio = new AudioManager();
