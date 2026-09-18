//#region src/credentials.d.ts
declare const credentialNames: readonly ["CREDS_KEY", "CREDS_IV", "JWT_SECRET", "JWT_REFRESH_SECRET"];
type CredentialName = (typeof credentialNames)[number];
type CredentialSource = "environment" | "temporary";
interface CredentialRuntimeState {
  filePath: string;
  sources: Record<CredentialName, CredentialSource>;
  generated: CredentialName[];
  loadedFromFile: CredentialName[];
  missingFromEnvironment: CredentialName[];
  persistenceFailed: boolean;
}
interface CredentialFingerprintRecord {
  CREDS_KEY: string;
  CREDS_IV: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
}
declare const credentialMetadataId = "primary";
declare const credentialMetadataCollection = "librechatCredentialMetadata";
declare function bootstrapCredentials(): CredentialRuntimeState;
declare function getCredentialRuntimeState(): CredentialRuntimeState | undefined;
declare function getCredentialFingerprints(env?: NodeJS.ProcessEnv): CredentialFingerprintRecord;
declare function isLegacyCredential(name: CredentialName, value: string | undefined): boolean;
declare function getLegacyCredentialNames(env?: NodeJS.ProcessEnv): CredentialName[];
//#endregion
export { CredentialFingerprintRecord, CredentialName, CredentialRuntimeState, CredentialSource, bootstrapCredentials, credentialMetadataCollection, credentialMetadataId, credentialNames, getCredentialFingerprints, getCredentialRuntimeState, getLegacyCredentialNames, isLegacyCredential };
//# sourceMappingURL=credentials.d.cts.map