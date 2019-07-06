type Func = (...args: any[]) => any;

export interface Cache<K, V> {
  get(key: K): V;
  set(key: K, value: V): void;
  has(key: K): boolean;
}

export type Serializer<F extends Func> = (args: Parameters<F>) => string;

export interface Options<F extends Func> {
  cache?: Cache<string, ReturnType<F>>;
  serializer?: Serializer<F>;
  strategy?: MemoizeFunc;
}

export interface MemoizeFunc {
  <F extends Func>(fn: F, options?: Options<F>): F;
}

interface Memoize extends MemoizeFunc {
  strategies: {
    variadic: MemoizeFunc;
    monadic: MemoizeFunc;
  };
}

declare const memoize: Memoize;

export default memoize;
