export type JsonZReviver = (key: string, value: any) => any;

export type JsonZReplacer = (holder: any, key: string, value: any) => any;
export type JsonZAllowedKeys = (string | number)[];

export interface JsonZOptions {
  space: string | number;
  quote: string;
  replacer: JsonZReplacer | JsonZAllowedKeys;
}

export function parse(text: string, reviver?: JsonZReviver): any;

export function stringify(value: any, replacer?: JsonZReplacer | JsonZAllowedKeys, space?: string | number): string;
export function stringify(value: any, options: JsonZOptions): string;

export const DELETE: Symbol;

export function hasBigInt(): boolean;

export function hasNativeBigInt(): boolean;

export function hasBigDecimal(): boolean;

export function setBigInt<T extends Function>(bigIntClass: T, bigIntEqualityTest?: (a: T, b: T) => boolean): void;

export function setBigDecimal<T extends Function>(bigDoubleClass: T, bigDoubleEqualityTest?: (a: T, b: T) => boolean): void;
