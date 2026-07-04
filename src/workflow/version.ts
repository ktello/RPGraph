import formatVersions from './formatVersions.json';

export type WorkflowFormatVersion = `${number}.${number}`;

export const currentWorkflowFormatVersion =
  formatVersions.workflow as WorkflowFormatVersion;
export const currentEncryptedWorkflowEnvelopeFormatVersion =
  formatVersions.encryptedWorkflowEnvelope as WorkflowFormatVersion;

export function isCurrentWorkflowFormatVersion(
  value: unknown,
): value is typeof currentWorkflowFormatVersion {
  return value === currentWorkflowFormatVersion;
}
