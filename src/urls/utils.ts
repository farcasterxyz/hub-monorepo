/**
 * File pulled from https://github.com/ChainAgnostic/caip-js/blob/b2af86364fc19d2f11deea50858c73567969805a/src/utils.ts
 * Utilities from this file are required, but the original versions are not exported in the built version of the caip-js
 * library.
 */
import { IdentifierSpec, KeyValue, ParameterSpec, Params } from 'caip/dist/types';

export const splitParams = (id: string, spec: IdentifierSpec): string[] => id.split(spec.parameters.delimiter);

export const getParams = <T>(id: string, spec: IdentifierSpec): T => {
  const arr = splitParams(id, spec);
  const params: any = {};
  arr.forEach((value, index) => {
    params[(spec.parameters.values[index] as ParameterSpec).name] = value;
  });
  return params as T;
};

export const joinParams = (params: Params, spec: IdentifierSpec): string =>
  Object.values(spec.parameters.values)
    .map((parameter) => {
      const param = params[parameter.name] as KeyValue;
      return typeof param === 'string' ? param : joinParams(param, parameter as IdentifierSpec);
    })
    .join(spec.parameters.delimiter);

export const isValidId = (id: string, spec: IdentifierSpec): boolean => {
  if (!new RegExp(spec.regex).test(id)) return false;
  const params = splitParams(id, spec);
  if (params.length !== Object.keys(spec.parameters.values).length) return false;
  const matches = params
    .map((param, index) => new RegExp((spec.parameters.values[index] as ParameterSpec).regex).test(param))
    .filter((x) => !!x);
  if (matches.length !== params.length) return false;
  return true;
};

export const regexOr = (left: string, right: string): string => `(${left})|(${right})`;
