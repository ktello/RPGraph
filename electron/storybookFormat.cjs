const formatVersions = require('../src/storybook/formatVersions.json');
const { hasCurrentScryptParameters } = require('./encryptionFormat.cjs');

const currentEncryptedStorybookEnvelopeFormatVersion = formatVersions.encryptedStorybookEnvelope;
const currentStorybookFormatVersion = formatVersions.storybook;

function isBase64Bytes(value, expectedLength) {
  if (typeof value !== 'string' || !value) {
    return false;
  }
  const bytes = Buffer.from(value, 'base64');
  return bytes.toString('base64') === value && (
    expectedLength === undefined ? bytes.length > 0 : bytes.length === expectedLength
  );
}

function storybookMetadata(storybook) {
  const formatVersion = typeof storybook?.version === 'string'
    ? storybook.version
    : undefined;
  return {
    type: 'storybook',
    protection: 'plain',
    formatVersion,
    compatible:
      storybook?.format === 'rpgraph-storybook' &&
      formatVersion === currentStorybookFormatVersion,
  };
}

function encryptedStorybookMetadata(envelope) {
  const envelopeFormatVersion = typeof envelope?.envelopeFormatVersion === 'string'
    ? envelope.envelopeFormatVersion
    : undefined;
  const formatVersion = typeof envelope?.payloadFormatVersion === 'string'
    ? envelope.payloadFormatVersion
    : undefined;
  return {
    type: 'storybook',
    protection: 'encrypted',
    envelopeFormatVersion,
    formatVersion,
    compatible:
      envelope?.format === 'rpgraph-encrypted-storybook' &&
      envelopeFormatVersion === currentEncryptedStorybookEnvelopeFormatVersion &&
      envelope.payloadFormat === 'rpgraph-storybook' &&
      formatVersion === currentStorybookFormatVersion &&
      envelope.encryption === 'aes-256-gcm' &&
      envelope.keyDerivation === 'scrypt' &&
      hasCurrentScryptParameters(envelope.keyDerivationParameters) &&
      isBase64Bytes(envelope.salt, 16) &&
      isBase64Bytes(envelope.iv, 12) &&
      isBase64Bytes(envelope.authenticationTag, 16) &&
      isBase64Bytes(envelope.ciphertext),
  };
}

module.exports = {
  currentEncryptedStorybookEnvelopeFormatVersion,
  currentStorybookFormatVersion,
  encryptedStorybookMetadata,
  storybookMetadata,
};
