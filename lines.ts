import ansi from 'ansi-escape-sequences';

export class Lines {
  private lines: Line[];
  private updatedOnce: boolean;

  constructor() {
    this.lines = [];
    this.updatedOnce = false;
  }

  update() {
    if (this.updatedOnce) {
      console.log(ansi.cursor.previousLine(this.lines.length + 1));
    }
    this.updatedOnce = true;
    for (const line of this.lines) {
      console.log(`${ansi.erase.inLine(0)}${line.text}`);
    }
  }

  add(text?: string): Line {
    const line = new Line(text, () => this.update());
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

export class Line {
  static red(text: any): string {
    return `${ansi.style.red}${text}${ansi.style.reset}`;
  }
  static green(text: any): string {
    return `${ansi.style.green}${text}${ansi.style.reset}`;
  }
  static cyan(text: any): string {
    return `${ansi.style.cyan}${text}${ansi.style.reset}`;
  }
  static word(text: any): string {
    return ` ${text}`;
  }

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
