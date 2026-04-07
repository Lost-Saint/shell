/**
 * A "hop slot" arena allocator that manages a pool of typed objects
 * with O(1) insert and remove via index-stable slots.
 *
 * ## Why use this?
 * Standard arrays shift indices on removal (O(n)). Maps have hash overhead.
 * This arena holds items in fixed slots and recycles freed indices, giving
 * stable numeric handles (useful for ECS, scene graphs, object pools).
 *
 * ## How it works
 * - `slots[]` is a sparse array: live items or `null` tombstones.
 * - `unused[]` is a stack of freed indices to hand out before growing.
 * - `_size` tracks live-item count separately (avoids filtering on every read).
 *
 * @template T - The object type stored in the arena. Must be non-null object.
 *
 * @example
 * ```ts
 * const arena = new Arena<{ name: string }>();
 * const id = arena.insert({ name: "Alice" }); // id = 0
 * arena.get(id);                              // { name: "Alice" }
 * arena.remove(id);                           // { name: "Alice" }
 * arena.get(id);                              // null
 * ```
 */
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
