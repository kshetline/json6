export type JsonZReviver = (key: string, value: any, holder?: any) => any;

export type JsonZReplacer = (holder: any, key: string, value: any) => any;
export type JsonZAllowedKeys = (string | number)[];

export enum Quote {
  DOUBLE,
  SINGLE,
  PREFER_DOUBLE,
  PREFER_SINGLE
}

export enum OptionSet {
  MAX_COMPATIBILITY = 0,
  RELAXED = 1,
  THE_WORKS = 2
}

export enum ExtendedTypeMode {
  OFF,
  AS_FUNCTIONS,
  AS_OBJECTS
}

export interface JsonZOptions {
  extendedPrimitives?: boolean,
  extendedTypes?: ExtendedTypeMode,
  primitiveBigDecimal?: boolean;
  primitiveBigInt?: boolean;
  quote?: '"' | "'" | Quote;
  quoteAllKeys?: boolean;
  replacer?: JsonZReplacer | JsonZAllowedKeys;
  revealHiddenArrayProperties?: boolean;
  space?: string | number | String | Number;
  sparseArrays?: boolean;
  trailingComma?: boolean;
  typePrefix?: string;
}

export interface JsonZTypeHandler {
  name: string;
  test: (instance: any, options?: JsonZOptions) => boolean;
  creator: (value: any) => any;
  serializer: (instance: any, options?: JsonZOptions) => any;
}

export interface JsonZParseOptions {
  reviveTypedContainers?: boolean;
  reviver?: JsonZReviver;
}

export function parse(text: string, options?: JsonZParseOptions): any;
export function parse(text: string, reviver?: JsonZReviver, options?: JsonZParseOptions): any;

export function stringify(value: any, replacer?: JsonZReplacer | JsonZAllowedKeys,
                          space?: string | number | String | Number): string;
export function stringify(value: any, options?: JsonZOptions,
                          space?: string | number | String | Number): string;

export function setOptions(options: JsonZOptions | OptionSet, extraOptions?: JsonZOptions): void;
export function resetOptions(): void;

export function setParseOptions(options: JsonZParseOptions): void;

export function resetParseOptions(): void;

export function addTypeHandler(handler: JsonZTypeHandler): void;
export function removeTypeHandler(typeName: string): void;
export function resetStandardTypeHandlers(): void;
export function restoreStandardTypeHandlers(): void;
export function globalizeTypeHandlers(prefix?: string): void;

export const DELETE: Symbol;

export function hasBigInt(): boolean;

export function hasNativeBigInt(): boolean;

export function hasBigDecimal(): boolean;

export function setBigInt(bigIntClass: Function | boolean): void;

export function setBigDecimal(bigDoubleClass: Function): void;
