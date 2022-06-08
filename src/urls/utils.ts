/**
 * File pulled from https://github.com/ChainAgnostic/caip-js/blob/b2af86364fc19d2f11deea50858c73567969805a/src/utils.ts
 */

import { IdentifierSpec, Params } from 'caip/dist/types';

export function splitParams(id: string, spec: IdentifierSpec): string[] {
  return id.split(spec.parameters.delimiter);
}

export function getParams<T>(id: string, spec: IdentifierSpec): T {
  const arr = splitParams(id, spec);
  const params: any = {};
  arr.forEach((value, index) => {
    params[spec.parameters.values[index].name] = value;
  });
  return params as T;
}

export function joinParams(params: Params, spec: IdentifierSpec): string {
  return Object.values(spec.parameters.values)
    .map((parameter) => {
      const param = params[parameter.name];
      return typeof param === 'string' ? param : joinParams(param, parameter as IdentifierSpec);
    })
    .join(spec.parameters.delimiter);
}

export function isValidId(id: string, spec: IdentifierSpec): boolean {
  if (!new RegExp(spec.regex).test(id)) return false;
  const params = splitParams(id, spec);
  if (params.length !== Object.keys(spec.parameters.values).length) return false;
  const matches = params
    .map((param, index) => new RegExp(spec.parameters.values[index].regex).test(param))
    .filter((x) => !!x);
  if (matches.length !== params.length) return false;
  return true;
}

export function regexOr(left: string, right: string): string {
  return `(${left})|(${right})`;
}
