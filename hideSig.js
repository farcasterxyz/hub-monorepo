/**
 * TypeDoc plugin to hide the return type of a function signature
 */
const { Converter, ReflectionKind, UnknownType } = require('typedoc');

exports.load = function (app) {
  app.converter.on(Converter.EVENT_CREATE_SIGNATURE, (ctx, sig) => {
    if (sig.kind === ReflectionKind.CallSignature) {
      sig.type = undefined;
    }
  });
};