import { librechat } from 'librechat-data-provider';
import type { DynamicSettingProps, ImageDetail } from 'librechat-data-provider';

type TerraMindKeys = keyof typeof librechat;

type TerraMindParams = {
  modelOptions: Omit<NonNullable<DynamicSettingProps['conversation']>, TerraMindKeys>;
  resendFiles: boolean;
  promptPrefix?: string | null;
  maxContextTokens?: number;
  fileTokenLimit?: number;
  modelLabel?: string | null;
  imageDetail?: ImageDetail;
};

/**
 * Separates TerraMind-specific parameters from model options
 * @param options - The combined options object
 */
export function extractTerraMindParams(
  options?: DynamicSettingProps['conversation'],
): TerraMindParams {
  if (!options) {
    return {
      modelOptions: {} as Omit<NonNullable<DynamicSettingProps['conversation']>, TerraMindKeys>,
      resendFiles: librechat.resendFiles.default as boolean,
    };
  }

  const modelOptions = { ...options };

  const resendFiles =
    (delete modelOptions.resendFiles, options.resendFiles) ??
    (librechat.resendFiles.default as boolean);
  const promptPrefix = (delete modelOptions.promptPrefix, options.promptPrefix);
  const maxContextTokens = (delete modelOptions.maxContextTokens, options.maxContextTokens);
  const fileTokenLimit = (delete modelOptions.fileTokenLimit, options.fileTokenLimit);
  const modelLabel = (delete modelOptions.modelLabel, options.modelLabel);
  const imageDetail = (delete modelOptions.imageDetail, options.imageDetail);

  return {
    modelOptions: modelOptions as Omit<
      NonNullable<DynamicSettingProps['conversation']>,
      TerraMindKeys
    >,
    maxContextTokens,
    fileTokenLimit,
    promptPrefix,
    resendFiles,
    modelLabel,
    imageDetail,
  };
}
