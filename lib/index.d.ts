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
  expandedPrimitives?: boolean,
  expandedTypes?: boolean,
  primitiveBigDecimal?: boolean;
  primitiveBigInt?: boolean;
  quote?: '"' | "'" | Quote;
  quoteAllKeys?: boolean;
  replacer?: JsonZReplacer | JsonZAllowedKeys;
  space?: string | number | String | Number;
  sparseArrays?: boolean;
  trailingComma?: boolean;
  typePrefix?: string;
}

export interface JsonZTypeHandler {
  test: (instance: any, options?: JsonZOptions) => boolean;
  name: string;
  creator: (value: any) => any;
  serializer: (instance: any) => string;
}

export interface JsonZParseOptions {
  reviveTypedContainers?: boolean;
}

export function parse(text: string, options?: JsonZParseOptions): any;
export function parse(text: string, reviver?: JsonZReviver, options?: JsonZParseOptions): any;

export function stringify(value: any, replacer?: JsonZReplacer | JsonZAllowedKeys,
                          space?: string | number | String | Number): string;
export function stringify(value: any, options?: JsonZOptions,
                          space?: string | number | String | Number): string;

export function setOptions(options: JsonZOptions): void;

export function resetOptions(): void;

export function setParseOptions(options: JsonZParseOptions): void;

export function resetParseOptions(): void;

export const DELETE: Symbol;

export function hasBigInt(): boolean;

export function hasNativeBigInt(): boolean;

export function hasBigDecimal(): boolean;

export function setBigInt(bigIntClass: Function | boolean): void;

export function setBigDecimal(bigDoubleClass: Function): void;
