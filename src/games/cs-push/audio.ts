export type SoundEvent = 'purchase'|'deploy'|'contact'|'advance'|'boost'|'flash'|'smoke'|'c4'|'defuse'|'baseHit'|'overtime'|'win'|'loss'|'draw';

const ENABLED_KEY = 'cspa:sfx-enabled';
const VOLUME_KEY = 'cspa:sfx-volume';

export class AudioManager {
  private context: AudioContext | null = null;
  private enabled = localStorage.getItem(ENABLED_KEY) !== 'false';
  private volume = Number(localStorage.getItem(VOLUME_KEY) ?? .55);
  private lastPlayed = new Map<SoundEvent, number>();

  isEnabled() { return this.enabled; }
  getVolume() { return this.volume; }
  setEnabled(value: boolean) {
    this.enabled = value;
    localStorage.setItem(ENABLED_KEY, String(value));
    if (value) void this.unlock();
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem(VOLUME_KEY, String(this.volume));
  }
  async unlock() {
    try {
      if (!this.context) this.context = new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      // Browsers can reject AudioContext creation until a user gesture.
      // A later purchase/deploy or the SFX control will retry safely.
    }
  }
  async play(event: SoundEvent) {
    if (!this.enabled) return;
    await this.unlock();
    const now = performance.now();
    const cooldown = event === 'advance' ? 900 : event === 'contact' ? 600 : event === 'baseHit' ? 250 : 0;
    if (now - (this.lastPlayed.get(event) ?? -Infinity) < cooldown) return;
    this.lastPlayed.set(event, now);
    const patterns: Record<SoundEvent, Array<[number, number, OscillatorType, number]>> = {
      purchase: [[620,.04,'square',0],[880,.05,'square',.05]], deploy: [[170,.07,'sawtooth',0],[260,.05,'square',.06]],
      contact: [[90,.08,'square',0],[75,.08,'sawtooth',.07]], advance: [[240,.035,'square',0]], boost: [[440,.08,'square',0],[660,.08,'square',.08],[990,.12,'sine',.16]],
      flash: [[1400,.06,'square',0],[2200,.12,'sine',.04]], smoke: [[120,.25,'sawtooth',0]], c4: [[190,.08,'square',0],[190,.08,'square',.15]],
      defuse: [[850,.05,'square',0],[540,.08,'square',.06]], baseHit: [[65,.18,'sawtooth',0],[48,.24,'square',.08]], overtime: [[240,.15,'square',0],[320,.15,'square',.18],[420,.22,'square',.36]],
      win: [[392,.12,'square',0],[523,.12,'square',.13],[659,.25,'square',.26]], loss: [[220,.15,'sawtooth',0],[165,.2,'sawtooth',.16],[110,.3,'sawtooth',.35]], draw: [[260,.18,'square',0],[260,.18,'square',.23]],
    };
    patterns[event].forEach(([frequency, duration, type, delay]) => this.tone(frequency, duration, type, delay));
  }
  private tone(frequency: number, duration: number, type: OscillatorType, delay: number) {
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(.0001, this.volume * .12), start + .008); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
  }
}

export const audio = new AudioManager();
