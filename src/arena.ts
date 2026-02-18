/** Hop slot arena allocator */
export class Arena<T extends object> {
  private slots: Array<null | T> = [];
  private unused: Array<number> = [];
  private _size: number = 0;

  get size(): number {
    return this._size;
  }

  truncate(n: number) {
    this.slots.splice(n);
    this.unused = this.unused.filter((i) => i < n);
    this._size = this.slots.filter((v) => v !== null).length;
  }

  get(n: number): null | T {
    if (n < 0 || n >= this.slots.length) return null;
    return this.slots[n];
  }

  has(n: number): boolean {
    return n >= 0 && n < this.slots.length && this.slots[n] !== null;
  }

  insert(v: T): number {
    let n: number;
    const slot = this.unused.pop();
    if (slot !== undefined) {
      n = slot;
      this.slots[n] = v;
    } else {
      n = this.slots.length;
      this.slots.push(v);
    }
    this._size++;
    return n;
  }

  remove(n: number): null | T {
    if (n < 0 || n >= this.slots.length) return null;
    const v = this.slots[n];
    if (v === null) return null;
    this.slots[n] = null;
    this.unused.push(n);
    this._size--;
    return v;
  }

  *values(): IterableIterator<T> {
    for (const v of this.slots) {
      if (v !== null) yield v;
    }
  }
}
