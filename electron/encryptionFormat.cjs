const currentScryptParameters = Object.freeze({
  N: 65536,
  r: 8,
  p: 1,
});

function hasCurrentScryptParameters(value) {
  return (
    value?.N === currentScryptParameters.N &&
    value.r === currentScryptParameters.r &&
    value.p === currentScryptParameters.p
  );
}

module.exports = {
  currentScryptParameters,
  hasCurrentScryptParameters,
};
