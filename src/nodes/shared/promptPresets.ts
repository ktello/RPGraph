export type PromptPresetSource = 'default' | 'custom' | 'workflow';

export type PromptTextSetting = {
  mode: 'default' | 'custom';
  customText?: string;
};

export function promptPresetSource(
  setting: PromptTextSetting | undefined,
  defaultText: string,
  localCustomText: string | undefined,
): PromptPresetSource {
  if (setting?.mode !== 'custom') {
    return 'default';
  }
  if (localCustomText !== undefined && setting.customText === localCustomText) {
    return 'custom';
  }
  return setting.customText === defaultText ? 'default' : 'workflow';
}

export function promptPresetDisplayText(
  source: PromptPresetSource,
  setting: PromptTextSetting | undefined,
  defaultText: string,
  localCustomText: string | undefined,
) {
  if (source === 'default') {
    return defaultText;
  }
  if (source === 'custom') {
    return localCustomText ?? setting?.customText ?? defaultText;
  }
  return setting?.customText ?? defaultText;
}

export function promptSettingForSource(
  source: PromptPresetSource,
  currentText: string,
  defaultText: string,
  localCustomText: string | undefined,
  workflowText: string | undefined,
): PromptTextSetting {
  if (source === 'default') {
    return { mode: 'default', customText: '' };
  }
  if (source === 'custom') {
    return { mode: 'custom', customText: localCustomText ?? (currentText || defaultText) };
  }
  return { mode: 'custom', customText: workflowText ?? (currentText || defaultText) };
}
