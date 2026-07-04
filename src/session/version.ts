import formatVersions from './formatVersions.json';

export type SessionFormatVersion = `${number}.${number}`;

export const currentSessionFormatVersion =
  formatVersions.session as SessionFormatVersion;
export const currentEncryptedSessionEnvelopeFormatVersion =
  formatVersions.encryptedSessionEnvelope as SessionFormatVersion;
export type SessionWorkflowFormatVersion = '2.0';

export const currentSessionWorkflowFormatVersion =
  formatVersions.sessionWorkflow as SessionWorkflowFormatVersion;
