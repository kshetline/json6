export type JsonZReviver = (key: string, value: any) => any;

export type JsonZReplacer = (holder: any, key: string, value: any) => any;
export type JsonZAllowedKeys = (string | number)[];

export enum Quote {
  DOUBLE,
  SINGLE,
  PREFER_DOUBLE,
  PREFER_SINGLE
}

export interface JsonZOptions {
  addTrailingComma: boolean;
  quote: '"' | "'" | Quote;
  quoteAllKeys: boolean;
  replacer: JsonZReplacer | JsonZAllowedKeys;
  space: string | number;
}

export function parse(text: string, reviver?: JsonZReviver): any;

export function stringify(value: any, replacer?: JsonZReplacer | JsonZAllowedKeys, space?: string | number): string;
export function stringify(value: any, options: JsonZOptions): string;

export function setOptions(options: JsonZOptions): void;

export const DELETE: Symbol;

export function hasBigInt(): boolean;

export function hasNativeBigInt(): boolean;

export function hasBigDecimal(): boolean;

export function setBigInt<T extends Function>(bigIntClass: T | boolean, bigIntEqualityTest?: (a: T, b: T) => boolean): void;

export function setBigDecimal<T extends Function>(bigDoubleClass: T, bigDoubleEqualityTest?: (a: T, b: T) => boolean): void;
