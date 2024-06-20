import ansi from 'ansi-escapes';
import styles from 'ansi-styles';

export class Line {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-template-expressions */
  static red(text: any): string {
    return `${styles.red.open}${text}${styles.red.close}`;
  }
  static green(text: any): string {
    return `${styles.green.open}${text}${styles.green.close}`;
  }
  static cyan(text: any): string {
    return `${styles.cyanBright.open}${text}${styles.cyanBright.close}`;
  }
  static yellow(text: any): string {
    return `${styles.yellow.open}${text}${styles.yellow.close}`;
  }
  static word(text: any): string {
    return ` ${text}`;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-template-expressions */

  private segments: string[];
  private marker: number;
  private notifier?: () => void;

  constructor(text?: string, notifier?: () => void) {
    this.segments = [];
    this.marker = 0;
    this.notifier = notifier;
    if (text) {
      this.text = text;
    }
  }

  get text(): string {
    return this.segments.join('');
  }
  set text(value: string) {
    this.segments = [value];
    this.notify();
  }

  /** Add a new segment to the line */
  append(text: string) {
    this.segments.push(text);
    this.notify();
  }

  /** Mark the current segment in the line. Optionally, append the text after marking. */
  mark(text?: string) {
    this.marker = this.segments.length;
    if (text) {
      this.append(text);
    }
  }

  /** Clear back to the last marked segment. Optionally, append the text after clearing. */
  clear(text?: string) {
    this.segments = this.segments.slice(0, this.marker);
    if (text) {
      this.append(text);
    } else {
      this.notify();
    }
  }

  private notify() {
    if (this.notifier) {
      this.notifier();
    }
  }
}
export class Lines {
  private lines: Line[];
  private updatedOnce: boolean;

  constructor() {
    this.lines = [];
    this.updatedOnce = false;
  }

  update() {
    if (this.updatedOnce) {
      console.log(ansi.cursorUp(this.lines.length + 1));
    }
    this.updatedOnce = true;
    for (const line of this.lines) {
      console.log(`${ansi.eraseLine}${line.text}`);
    }
  }

  add(text?: string): Line {
    const line = new Line(text, () => {
      this.update();
    });
    this.lines.push(line);
    return line;
  }

  get last(): Line {
    return this.line(this.lines.length - 1);
  }

  line(index: number): Line {
    return this.lines[index];
  }
}
