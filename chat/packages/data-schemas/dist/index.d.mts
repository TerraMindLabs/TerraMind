import { a as CapabilityImplications, c as ResourceCapabilityMap, d as configCapability, f as expandImplications, h as readConfigCapability, i as CapabilityCategory, l as SystemCapabilities, m as isValidCapability, n as BaseSystemCapability, o as ConfigAssignTarget, p as hasImpliedCapability, r as CAPABILITY_CATEGORIES, s as ConfigSection, t as BASE_CONFIG_PRINCIPAL_ID, u as SystemCapability } from "./capabilities-BX6jBhpR.mjs";
import { AgentGitIdentity, AgentSubagentsConfig, AgentToolOptions, AgentToolResources, CloudFrontConfig, CodeApprovalMode, CodeEnvRef, CodeEnvRefMap, CodeEnvironmentMode, CodeEnvironmentUserSettings, CodeWorkspaceSelection, DeepPartial, EModelEndpoint, EToolResources, FileContext, FileStorage, FiltersConfig, GraphEdge, MCPOptions, MCPServerDB, MemoryScope, PermissionBits, PermissionTypes, Permissions, PrincipalModel, PrincipalType, RefillIntervalUnit, ResourceType, RunFileProvenance, ScheduleDisabledReason, ScheduleMCPOutcome, ScheduleRunStatus, SearchCategories, SkillSyncConfig, SkillsScope, StatefulCodeEnvironment, SummarizationConfig, TAgentsEndpoint, TAnthropicEndpoint, TAssistantEndpoint, TAttachment, TAzureConfig, TConfigDefaults, TCustomConfig, TCustomEndpoints, TEndpoint, TFeedbackRating, TFeedbackTag, TFile, TFileConfig, TInsightsAgent, TInsightsParams, TInsightsResponse, TMemoryConfig, TPrincipalSearchResult, TScheduleCadence, TSubagentThreadLineage, TUserFavorite, TVertexAIConfig, TVertexAISchema, TWebSearchConfigInput, UserSubmittedMessageFieldPath } from "librechat-data-provider";
import winston from "winston";
import { AsyncLocalStorage } from "async_hooks";
import mongoose, { AnyBulkWriteOperation, CallbackWithoutResultAndOptionalError, ClientSession, Connection, DeleteResult, Document, FilterQuery, Model, MongooseBulkWriteOptions, PipelineStage, ProjectionType, QueryOptions, RootFilterQuery, Schema, SortOrder, Types } from "mongoose";
import { Index, SearchParams, SearchResponse } from "meilisearch";
import { BulkWriteResult } from "mongodb";

//#region src/app/agents.d.ts
/**
* Sets up the Agents configuration from the config (`librechat.yaml`) file.
* If no agents config is defined, uses the provided defaults or parses empty object.
*
* @param config - The loaded custom configuration.
* @param [defaultConfig] - Default configuration from getConfigDefaults.
* @returns The Agents endpoint configuration.
*/
declare function agentsConfigSetup(config: Partial<TCustomConfig>, defaultConfig?: Partial<TAgentsEndpoint>): Partial<TAgentsEndpoint>;
//#endregion
//#region src/types/app.d.ts
type JsonSchemaType = {
  type: "string" | "number" | "integer" | "float" | "boolean" | "array" | "object";
  enum?: string[];
  items?: JsonSchemaType;
  properties?: Record<string, JsonSchemaType>;
  required?: string[];
  description?: string;
  additionalProperties?: boolean | JsonSchemaType;
};
type ConvertJsonSchemaToZodOptions = {
  allowEmptyObject?: boolean;
  dropFields?: string[];
  transformOneOfAnyOf?: boolean;
};
interface FunctionTool {
  type: "function";
  function: {
    description: string;
    name: string;
    parameters: JsonSchemaType;
  };
}
/**
* Application configuration object
* Based on the configuration defined in api/server/services/Config/getAppConfig.js
*/
interface AppConfig {
  /** The main custom configuration */
  config: Partial<TCustomConfig>;
  /** OCR configuration */
  ocr?: TCustomConfig["ocr"];
  /** File paths configuration */
  paths?: {
    uploads: string;
    imageOutput: string;
    publicPath: string;
    [key: string]: string;
  };
  /** Memory configuration */
  memory?: TMemoryConfig;
  /** Summarization configuration */
  summarization?: SummarizationConfig;
  /** Web search configuration */
  webSearch?: TCustomConfig["webSearch"];
  /** Source-scoped content filter configuration */
  filters?: FiltersConfig;
  /** Message filter configuration (PII and future filter types) */
  messageFilter?: TCustomConfig["messageFilter"];
  /** Langfuse tracing configuration */
  langfuse?: TCustomConfig["langfuse"];
  /** Skill sync configuration */
  skillSync?: SkillSyncConfig;
  /** File storage strategy ('local', 's3', 'firebase', 'azure_blob', 'cloudfront') */
  fileStrategy: FileStorage;
  /** File strategies configuration */
  fileStrategies?: TCustomConfig["fileStrategies"];
  /** CloudFront CDN configuration */
  cloudfront?: CloudFrontConfig;
  /** Registration configurations */
  registration?: TCustomConfig["registration"];
  /** Actions configurations */
  actions?: TCustomConfig["actions"];
  /** Admin-filtered tools */
  filteredTools?: string[];
  /** Admin-included tools */
  includedTools?: string[];
  /** Image output type configuration */
  imageOutputType: string;
  /** Interface configuration */
  interfaceConfig?: TCustomConfig["interface"];
  /** Turnstile configuration */
  turnstileConfig?: Partial<TCustomConfig["turnstile"]>;
  /** Balance configuration */
  balance?: Partial<TCustomConfig["balance"]>;
  /** Transactions configuration */
  transactions?: TCustomConfig["transactions"];
  /** Speech configuration */
  speech?: TCustomConfig["speech"];
  /** MCP server configuration */
  mcpConfig?: TCustomConfig["mcpServers"] | null;
  /** MCP settings (domain allowlist, etc.) */
  mcpSettings?: TCustomConfig["mcpSettings"] | null;
  /** File configuration */
  fileConfig?: TFileConfig;
  /** Secure image links configuration, enabled unless explicitly disabled */
  secureImageLinks?: TCustomConfig["secureImageLinks"];
  /** Processed model specifications */
  modelSpecs?: TCustomConfig["modelSpecs"];
  /** Available tools */
  availableTools?: Record<string, FunctionTool>;
  endpoints?: {
    /** Admin exemption list of host:port pairs that bypass the SSRF private-IP block */allowedAddresses?: string[]; /** OpenAI endpoint configuration */
    openAI?: Partial<TEndpoint>; /** Google endpoint configuration */
    google?: Partial<TEndpoint>; /** Bedrock endpoint configuration */
    bedrock?: Partial<TEndpoint>; /** Anthropic endpoint configuration with optional Vertex AI support */
    anthropic?: Partial<TAnthropicEndpoint> & {
      /** Validated Vertex AI configuration */vertexConfig?: TVertexAIConfig;
    }; /** Azure OpenAI endpoint configuration */
    azureOpenAI?: TAzureConfig; /** Assistants endpoint configuration */
    assistants?: Partial<TAssistantEndpoint>; /** Azure assistants endpoint configuration */
    azureAssistants?: Partial<TAssistantEndpoint>; /** Agents endpoint configuration */
    [EModelEndpoint.agents]?: Partial<TAgentsEndpoint>; /** Custom endpoints configuration */
    [EModelEndpoint.custom]?: TCustomEndpoints; /** Global endpoint configuration */
    all?: Partial<TEndpoint>;
  };
}
//#endregion
//#region src/app/interface.d.ts
/**
* Loads the default interface object.
* @param params - The loaded custom configuration.
* @param params.config - The loaded custom configuration.
* @param params.configDefaults - The custom configuration default values.
* @returns default interface object.
*/
declare function loadDefaultInterface({
  config,
  configDefaults
}: {
  config?: Partial<TCustomConfig>;
  configDefaults: TConfigDefaults;
}): Promise<AppConfig["interfaceConfig"]>;
//#endregion
//#region src/app/memory.d.ts
declare function loadMemoryConfig(config: TCustomConfig["memory"]): TMemoryConfig | undefined;
declare function isMemoryEnabled(config: TMemoryConfig | undefined): boolean;
declare function isMemoryAgentEnabled(config: TMemoryConfig | undefined): boolean;
//#endregion
//#region src/app/service.d.ts
declare function loadSummarizationConfig(config: DeepPartial<TCustomConfig>): AppConfig["summarization"];
declare function loadSkillSyncConfig(config: DeepPartial<TCustomConfig>): AppConfig["skillSync"];
declare function loadLangfuseConfig(config: DeepPartial<TCustomConfig>): AppConfig["langfuse"];
declare function loadFiltersConfig(config: DeepPartial<TCustomConfig>): AppConfig["filters"];
type Paths = {
  root: string;
  uploads: string;
  clientPath: string;
  dist: string;
  publicPath: string;
  fonts: string;
  assets: string;
  imageOutput: string;
  structuredTools: string;
  pluginManifest: string;
};
/**
* Loads custom config and initializes app-wide variables.
* @function AppService
*/
declare const AppService: (params?: {
  config: DeepPartial<TCustomConfig>;
  paths?: Paths;
  systemTools?: Record<string, FunctionTool>;
}) => Promise<AppConfig>;
//#endregion
//#region src/app/specs.d.ts
/**
* Sets up Model Specs from the config (`librechat.yaml`) file.
* @param [endpoints] - The loaded custom configuration for endpoints.
* @param [modelSpecs] - The loaded custom configuration for model specs.
* @param [interfaceConfig] - The loaded interface configuration.
* @returns The processed model specs, if any.
*/
declare function processModelSpecs(endpoints?: TCustomConfig["endpoints"], _modelSpecs?: TCustomConfig["modelSpecs"], interfaceConfig?: TCustomConfig["interface"]): TCustomConfig["modelSpecs"] | undefined;
//#endregion
//#region src/app/turnstile.d.ts
/**
* Loads and maps the Cloudflare Turnstile configuration.
*
* Expected config structure:
*
* turnstile:
*   siteKey: "your-site-key-here"
*   options:
*     language: "auto"    // "auto" or an ISO 639-1 language code (e.g. en)
*     size: "normal"      // Options: "normal", "compact", "flexible", or "invisible"
*
* @param config - The loaded custom configuration.
* @param configDefaults - The custom configuration default values.
* @returns The mapped Turnstile configuration.
*/
declare function loadTurnstileConfig(config: Partial<TCustomConfig> | undefined, configDefaults: TConfigDefaults): Partial<TCustomConfig["turnstile"]>;
//#endregion
//#region src/app/vertex.d.ts
/**
* Default Vertex AI models available through Google Cloud
* These are the standard Anthropic model names as served by Vertex AI
*/
declare const defaultVertexModels: string[];
/**
* Validates and processes Vertex AI configuration
* @param vertexConfig - The Vertex AI configuration object
* @returns Validated configuration with errors if any
*/
declare function validateVertexConfig(vertexConfig: TVertexAISchema | undefined): TVertexAIConfig | null;
/**
* Sets up the Vertex AI configuration from the config (`librechat.yaml`) file.
* Similar to azureConfigSetup, this processes and validates the Vertex AI configuration.
* @param config - The loaded custom configuration.
* @returns The validated Vertex AI configuration or null if not configured.
*/
declare function vertexConfigSetup(config: Partial<TCustomConfig>): TVertexAIConfig | null;
//#endregion
//#region src/types/web.d.ts
type TWebSearchKeys = "serperApiKey" | "searxngInstanceUrl" | "searxngApiKey" | "firecrawlApiKey" | "firecrawlApiUrl" | "firecrawlVersion" | "tavilyApiKey" | "tavilySearchUrl" | "tavilyExtractUrl" | "keenableApiKey" | "keenableApiUrl" | "jinaApiKey" | "jinaApiUrl" | "cohereApiKey";
type TWebSearchCategories = SearchCategories.PROVIDERS | SearchCategories.SCRAPERS | SearchCategories.RERANKERS;
//#endregion
//#region src/app/web.d.ts
declare const webSearchAuth: {
  providers: {
    serper: {
      serperApiKey: 1;
    };
    searxng: {
      searxngInstanceUrl: 1; /** Optional (0) */
      searxngApiKey: 0;
    };
    tavily: {
      tavilyApiKey: 1;
      tavilySearchUrl: 0;
    };
    keenable: {
      /** Optional (0) — Keenable works keyless; a key only lifts rate limits */keenableApiKey: 0;
      keenableApiUrl: 0;
    };
  };
  scrapers: {
    firecrawl: {
      firecrawlApiKey: 1; /** Optional (0) */
      firecrawlApiUrl: 0;
      firecrawlVersion: 0;
    };
    serper: {
      serperApiKey: 1;
    };
    tavily: {
      tavilyApiKey: 1;
      tavilyExtractUrl: 0;
    };
    keenable: {
      /** Optional (0) — Keenable's page fetch is keyless as well; a key only
      * lifts rate limits. The fetch endpoint itself is overridden with the
      * `KEENABLE_FETCH_URL` env var, not through this config. */
      keenableApiKey: 0;
    };
  };
  rerankers: {
    jina: {
      jinaApiKey: 1; /** Optional (0) */
      jinaApiUrl: 0;
    };
    cohere: {
      cohereApiKey: 1;
    };
  };
};
/**
* Extracts all unique API keys from the webSearchAuth configuration object
*/
declare function getWebSearchKeys(): TWebSearchKeys[];
declare const webSearchKeys: TWebSearchKeys[];
declare const webSearchSelectionFields: {
  readonly selectedProvider: "LIBRECHAT_WEB_SEARCH_PROVIDER";
  readonly selectedScraper: "LIBRECHAT_WEB_SEARCH_SCRAPER";
  readonly selectedReranker: "LIBRECHAT_WEB_SEARCH_RERANKER";
};
declare function loadWebSearchConfig(config: TWebSearchConfigInput | undefined): TCustomConfig["webSearch"];
//#endregion
//#region src/types/cache.d.ts
/**
* Cache store contract injected into database methods from the api layer
* (e.g. getLogStores). Lock members are only present when the store is
* Redis-backed and cross-process build deduplication is enabled.
*/
interface CacheStore {
  get: (key: string) => Promise<unknown>;
  /** The optional ttl overrides the store's namespace default for this entry. */
  set: (key: string, value: unknown, ttl?: number) => Promise<unknown>;
  delete?: (key: string) => Promise<unknown>;
  clear?: () => Promise<unknown>;
  /** True when the store is shared across processes (e.g. Redis-backed). */
  crossProcess?: boolean;
  /** Delay before the second invalidation pass that evicts cross-process stale rewrites. */
  staleEvictionDelayMs?: number;
  /** Acquires a cross-process build lock; resolves a release token, or null when already held. */
  acquireLock?: (key: string) => Promise<string | null>;
  releaseLock?: (key: string, token: string) => Promise<unknown>;
  /** Max time to wait for another process holding the build lock to fill the cache. */
  lockWaitMs?: number;
}
//#endregion
//#region src/types/compaction.d.ts
declare const COMPACTION_SEMANTIC_INDEX_PROJECTION_VERSION: 1;
declare const MAX_COMPACTION_SEMANTIC_INDEX_ENTRIES = 256;
declare const MAX_COMPACTION_SEMANTIC_INDEX_TEXT_LENGTH = 4096;
declare const MAX_COMPACTION_SEMANTIC_INDEX_IDENTITY_LENGTH = 512;
declare const MAX_COMPACTION_SEMANTIC_INDEX_SOURCE_CONTENT_INDEX = 4095;
type TCompactionSemanticIndexStatus = "committed" | "pending";
interface ICompactionSemanticIndexEntryBase {
  type: "tool_intent" | "tool_outcome" | "activity_phase" | "reasoning_label";
  sourceMessageId: string;
  sourceContentIndex: number;
  revision: number;
  status: TCompactionSemanticIndexStatus;
  text: string;
  redacted?: boolean;
}
interface ICompactionToolSemanticIndexEntry extends ICompactionSemanticIndexEntryBase {
  type: "tool_intent" | "tool_outcome";
  toolCallId: string;
}
interface ICompactionActivitySemanticIndexEntry extends ICompactionSemanticIndexEntryBase {
  type: "activity_phase";
}
interface ICompactionReasoningSemanticIndexEntry extends ICompactionSemanticIndexEntryBase {
  type: "reasoning_label";
  reasoningStepId: string;
}
type TCompactionSemanticIndexEntry = ICompactionToolSemanticIndexEntry | ICompactionActivitySemanticIndexEntry | ICompactionReasoningSemanticIndexEntry;
/** Versioned, JSON-safe continuation projection of SDK compaction guidance. */
interface ICompactionSemanticIndexProjection {
  version: typeof COMPACTION_SEMANTIC_INDEX_PROJECTION_VERSION;
  entries: TCompactionSemanticIndexEntry[];
  /** Cumulative entries supplied before bounded retention. Absent on legacy snapshots. */
  providedEntryCount?: number;
}
declare function isCompactionSemanticIndexProjection(projection: Partial<ICompactionSemanticIndexProjection> | null | undefined): projection is ICompactionSemanticIndexProjection;
//#endregion
//#region src/common/enum.d.ts
/**
* Common role combinations. Values mirror unions of `PermissionBits` flags;
* literals are required by `--isolatedDeclarations` (cross-file enum refs
* aren't computable). The guard below fails fast on any drift.
*/
declare enum RoleBits {
  /** VIEW */
  VIEWER = 1,
  /** VIEW | EDIT */
  EDITOR = 3,
  /** VIEW | EDIT | DELETE */
  MANAGER = 7,
  /** VIEW | EDIT | DELETE | SHARE */
  OWNER = 15
}
//#endregion
//#region src/common/search.d.ts
/** MeiliSearch's default `pagination.maxTotalHits` ceiling. */
declare const MEILI_SEARCH_LIMIT = 1e3;
//#endregion
//#region src/common/pagination.d.ts
interface CursorPaginationParams {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
interface CursorPaginationResponse<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
    totalCount?: number;
  };
}
//#endregion
//#region src/common/permissions.d.ts
/**
* Upper bound for any stored `permBits` value. Computed as the bitwise OR of
* every numeric member of `PermissionBits`. Used by:
*
*   - the `permBits` schema validator (rejects writes above this bound)
*   - `permissionBitSupersets` (enumerates `$in` candidates within this range)
*   - every ACL read path (via `permissionBitSupersets`)
*
* The shared definition keeps the read-side enumeration and the write-side
* bound locked together: adding a new member to `PermissionBits` auto-expands
* both at once. See issue #12729 for the Cosmos DB / `$bitsAllSet` fix.
*/
declare const MAX_PERM_BITS: number;
//#endregion
//#region src/types/user.d.ts
interface IUser extends Document {
  _id: Types.ObjectId;
  /**
  * Mongoose's `Document.id` virtual is typed `id?: any`. At runtime it's
  * always `_id.toString()` for a hydrated doc, so narrow to a required
  * string. This also lets `IUser` satisfy Express.User augmentations
  * (the OIDC remote-agent middleware assigns `req.user = IUser` where
  * the project's local `Express.User` requires `id: string`).
  */
  id: string;
  name?: string;
  username?: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  avatar?: string;
  provider: string;
  role?: string;
  googleId?: string;
  facebookId?: string;
  openidId?: string;
  samlId?: string;
  ldapId?: string;
  githubId?: string;
  discordId?: string;
  appleId?: string;
  plugins?: string[];
  openidIssuer?: string;
  twoFactorEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: Array<{
    codeHash: string;
    used: boolean;
    usedAt?: Date | null;
  }>;
  pendingTotpSecret?: string;
  pendingBackupCodes?: Array<{
    codeHash: string;
    used: boolean;
    usedAt?: Date | null;
  }>;
  refreshToken?: Array<{
    refreshToken: string;
  }>;
  expiresAt?: Date;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date | null;
  /** Internal fence that prevents agent-trigger admission during account deletion. */
  agentTriggerDeletionStartedAt?: Date;
  /** Expiring fences closing subagent admission while bulk deletions drain. */
  subagentAdmissionFences?: Array<{
    token: string;
    expiresAt: Date;
  }>;
  personalization?: {
    memories?: boolean;
    statefulCodeEnvironment?: StatefulCodeEnvironment;
  };
  favorites?: TUserFavorite[];
  /** Display order for the sidebar's Pinned section: favorite and pinned-chat
  *  entry keys interleaved (`agent:`, `spec:`, `model:`, `convo:` prefixes). */
  pinnedOrder?: string[];
  /** Per-skill active/inactive overrides. Key = skillId, value = active state. */
  skillStates?: Record<string, boolean>;
  createdAt?: Date;
  updatedAt?: Date;
  /** Field for external source identification (for consistency with TPrincipal schema) */
  idOnTheSource?: string;
  tenantId?: string;
  federatedTokens?: OIDCTokens;
  openidTokens?: OIDCTokens;
}
interface OIDCTokens {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_at?: number;
}
interface BalanceConfig {
  enabled?: boolean;
  startBalance?: number;
  autoRefillEnabled?: boolean;
  refillIntervalValue?: number;
  refillIntervalUnit?: RefillIntervalUnit;
  refillAmount?: number;
  reservationTtlMs?: number;
}
interface CreateUserRequest extends Partial<IUser> {
  email: string;
}
interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  emailVerified?: boolean;
  avatar?: string;
  plugins?: string[];
  twoFactorEnabled?: boolean;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date | null;
  personalization?: {
    memories?: boolean;
    statefulCodeEnvironment?: StatefulCodeEnvironment;
  };
  skillStates?: Record<string, boolean>;
}
interface UserDeleteResult {
  deletedCount: number;
  message: string;
}
interface UserFilterOptions extends CursorPaginationParams {
  _id?: Types.ObjectId | string;
  search?: string;
  role?: string;
  emailVerified?: boolean;
  provider?: string;
  twoFactorEnabled?: boolean;
  googleId?: string;
  facebookId?: string;
  openidId?: string;
  samlId?: string;
  ldapId?: string;
  githubId?: string;
  discordId?: string;
  appleId?: string;
  createdAfter?: string;
  createdBefore?: string;
}
interface UserQueryOptions {
  fieldsToSelect?: string | string[] | null;
  lean?: boolean;
}
//#endregion
//#region src/types/token.d.ts
interface IToken extends Document {
  userId: Types.ObjectId;
  email?: string;
  type?: string;
  identifier?: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Map<string, unknown>;
  tenantId?: string;
}
interface TokenCreateData {
  userId: Types.ObjectId | string;
  email?: string;
  type?: string;
  identifier?: string;
  token: string;
  expiresIn: number;
  metadata?: Record<string, unknown> | Map<string, unknown>;
}
interface TokenQuery {
  userId?: Types.ObjectId | string;
  token?: string;
  email?: string | null;
  type?: string | null;
  identifier?: string | RegExp | null;
  /** Internal optimistic-concurrency selector for OAuth token record generations. */
  metadataCredentialSetId?: string | null;
}
interface TokenUpdateData {
  email?: string;
  type?: string;
  identifier?: string;
  token?: string;
  expiresAt?: Date;
  expiresIn?: number;
  metadata?: Record<string, unknown> | Map<string, unknown>;
}
interface TokenDeleteResult {
  deletedCount?: number;
}
//#endregion
//#region src/types/refreshTokenBridge.d.ts
interface IRefreshTokenBridge extends Document {
  oldRefreshTokenHash: string;
  encryptedNewRefreshToken: string;
  userId: string;
  tenantId?: string;
  openidIssuer?: string;
  version?: string;
  createdAt: Date;
  expiresAt: Date;
}
interface RefreshTokenBridgeCreateData {
  oldRefreshTokenHash: string;
  encryptedNewRefreshToken: string;
  userId: string;
  tenantId?: string;
  openidIssuer?: string;
  version?: string;
  expiresAt: Date;
}
interface RefreshTokenBridgeQuery {
  oldRefreshTokenHash: string;
  userId: string;
  tenantId?: string;
}
interface RefreshTokenBridgeDeleteData {
  oldRefreshTokenHashes?: string[];
  userId: string;
  tenantId?: string;
  version?: string;
}
//#endregion
//#region src/types/openidRefreshFlight.d.ts
type OpenIDRefreshFlightStatus = "pending" | "completed" | "failed" | "revoked";
interface IOpenIDRefreshFlight extends Document {
  key: string;
  ownerId: string;
  status: OpenIDRefreshFlightStatus;
  encryptedResult?: string;
  errorMessage?: string;
  deliveryId?: string;
  deliveryExpiresAt?: Date;
  revocationRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lockExpiresAt: Date;
  expiresAt: Date;
}
interface OpenIDRefreshFlightCreateData {
  key: string;
  ownerId: string;
  lockExpiresAt: Date;
  expiresAt: Date;
}
interface OpenIDRefreshFlightCompleteData {
  key: string;
  ownerId: string;
  encryptedResult: string;
  expiresAt: Date;
}
interface OpenIDRefreshFlightRenewData {
  key: string;
  ownerId: string;
  lockExpiresAt: Date;
  expiresAt: Date;
}
interface OpenIDRefreshFlightFailData {
  key: string;
  ownerId: string;
  errorMessage: string;
  expiresAt: Date;
}
interface OpenIDRefreshFlightRevokeData {
  key: string;
  expiresAt: Date;
}
interface OpenIDRefreshFlightClaimDeliveryData {
  key: string;
  ownerId: string;
  deliveryId: string;
  deliveryExpiresAt: Date;
  createdAt?: Date;
}
interface OpenIDRefreshFlightReleaseDeliveryData {
  key: string;
  ownerId: string;
  deliveryId: string;
}
interface OpenIDRefreshFlightQuery {
  key: string;
}
interface OpenIDRefreshFlightAcquireResult {
  acquired: boolean;
  flight: IOpenIDRefreshFlight | null;
}
//#endregion
//#region src/types/convo.d.ts
declare const MAX_AGENT_EVENT_ACTOR_SKILLS = 64;
declare const MAX_AGENT_EVENT_ACTOR_DISCOVERED_TOOLS = 128;
declare const MAX_AGENT_EVENT_ACTOR_TOOL_NAME_LENGTH = 512;
declare const MAX_AGENT_EVENT_ACTOR_SUMMARY_LENGTH = 1e6;
declare const MAX_AGENT_EVENT_ACTOR_ENCODING_LENGTH = 128;
/**
* Provenance of a stored event-actor summary. States written before this
* version kept only `{ text, tokenCount }`, so a round that failed or never
* finished is indistinguishable from a checkpoint once persisted. A restore
* requires the current version, which is what lets a warm continuation trust
* the summary instead of rebuilding from durable history.
*/
declare const AGENT_EVENT_ACTOR_SUMMARY_VERSION = 1;
interface ISubagentThreadLease {
  token: string;
  taskId: string;
  expiresAt: Date;
}
/** Server-private route from one authenticated event source to a child actor thread. */
interface IAgentEventBinding {
  bindingId: string;
  sourceKeyId: string;
  actorId: string;
}
interface IAgentEventActorCheckpoint {
  threadId: string;
  checkpointId: string;
  checkpointNs: string;
}
interface IAgentEventActorContextFingerprint {
  algorithm: "sha256";
  version: number;
  digest: string;
}
interface IAgentEventActorSkillIdentity {
  id: string;
  name: string;
  version: number;
  contentDigest?: string;
}
interface IAgentEventActorSummary {
  text: string;
  tokenCount: number;
  /** {@link AGENT_EVENT_ACTOR_SUMMARY_VERSION}; absent on pre-version states. */
  version?: number;
}
/**
* Latched context-fading tier from `@librechat/agents`. Every cap the SDK
* applies to its provider-only projection of historical tool results derives
* from it alone, so persisting it keeps that projection byte-stable across runs
* for prefix-based provider prompt caches. Graph messages stay canonical.
*/
interface IAgentFadingTier {
  v: 1;
  /** Token budget the caps derive from; never grows within a conversation. */
  budgetTokens: number;
  /** Whether observation masking has activated. */
  masked: boolean;
}
/** One agent's latched tier inside the persisted per-agent map. */
interface IAgentFadingTierEntry extends IAgentFadingTier {
  agentId: string;
}
/**
* Compact context state a run hands to its successor: calibration and the
* latched fading tiers. Messages themselves are never part of it; the SDK keeps
* graph history canonical and derives a provider-only projection per run.
*/
interface IAgentEventActorContextMeta {
  calibrationRatio: number;
  encoding?: string;
  /** Default agent's tier, kept for single-agent seeding. */
  fading?: IAgentFadingTier;
  /** Tiers keyed by agent ID, stored as entries so agent IDs never become field names. */
  fadingTiers?: IAgentFadingTierEntry[];
}
/** Private committed checkpoint state for one event-bound child actor. */
interface IAgentEventActorState {
  generation: number;
  checkpoint: IAgentEventActorCheckpoint;
  contextFingerprint?: IAgentEventActorContextFingerprint;
  /** Bounded semantic Skill set needed to validate a warm continuation without history. */
  skillManifest?: IAgentEventActorSkillIdentity[];
  /** Bounded run-evolved tool-search state needed to rebuild the next model binding. */
  discoveredToolNames?: string[];
  /** Active compaction summary, which the SDK keeps outside checkpointed graph messages. */
  summary?: IAgentEventActorSummary;
  /** Pruner calibration carried by ordinary turns on the parent response message. */
  contextMeta?: IAgentEventActorContextMeta;
  /** Bounded advisory guidance replayed without reading durable message history. */
  compactionSemanticIndex?: ICompactionSemanticIndexProjection;
  previousCheckpoint?: IAgentEventActorCheckpoint;
  /** Forces the next qualifying event to rebuild from durable message history. */
  requiresColdStart?: boolean;
}
interface IAgentEventActorReconciliation {
  invocationId: string;
  /** New-protocol executions acquire the delivery-owned action admission CAS
  * before the external action may run. Absent only on mixed-version rows. */
  actionAdmitted?: boolean;
  status: "invocation_pending" | "persistence_pending" | "history_persisted" | "commit_conflict" | "commit_indeterminate" | "persistence_failed" | "settled";
  checkpoint: Omit<IAgentEventActorCheckpoint, "checkpointId"> & {
    checkpointId?: string;
  };
  action: {
    toolName: string;
    toolCallId?: string;
  };
  error?: string;
  /** How a retained receipt reached `settled`. Absent on active lifecycle rows. */
  resolution?: "checkpoint_verified" | "action_compensated" | "history_repaired";
  observedAt: Date;
}
/**
* Durable fence covering one legacy-path turn from before its execution until
* its history is persisted. While present, no fork may execute or commit — the
* turn's messages are not yet durable, so any rebuild would be incomplete. A
* crash leaves the token in place (fail-closed) until it is reclaimed.
*/
interface IAgentEventActorLegacyTurn {
  token: string;
  startedAt: Date;
}
/** JSON-safe value retained inside SDK-issued event-actor evidence. */
type TAgentEventActorEvent = null | boolean | number | string | TAgentEventActorEvent[] | {
  [key: string]: TAgentEventActorEvent;
};
interface IAgentEventActorInvocationReference {
  actorThreadId: string;
  invocationId: string;
  depth: number;
  continuation: "warm" | "cold";
  base: {
    actorThreadId: string;
    generation: number;
    checkpoint?: Omit<IAgentEventActorCheckpoint, "checkpointId"> & {
      checkpointId?: string;
    };
  };
  fork: Omit<IAgentEventActorCheckpoint, "checkpointId"> & {
    checkpointId?: string;
    invocationId: string;
  };
}
/** Exact, signed SDK evidence for a paused invocation fork. */
interface IAgentEventActorSuspensionEvidence {
  version: 1;
  suspensionId: string;
  attempt: number;
  issuedAt: number;
  expiresAt: number;
  invocation: IAgentEventActorInvocationReference;
  checkpoint: IAgentEventActorInvocationReference["fork"];
  interrupt: {
    id: string;
    payload: TAgentEventActorEvent;
  };
  suspensionDigest: string;
}
/**
* Host-owned current suspension fence. SDK evidence authenticates the fork;
* the mirrored action/job identity binds it to TerraMind's approval CAS.
*/
interface IAgentEventActorSuspension {
  suspension: IAgentEventActorSuspensionEvidence;
  /** Host-side reason for suspension. Missing legacy values are human decisions. */
  kind?: "human_decision" | "internal_completion";
  /** Expected-action evidence already applied before a later re-pause. */
  appliedAction?: {
    toolName: string;
    toolCallId?: string;
  };
  /** Original delivery-handling generation retained across resumed generations. */
  handlingGenerationCreatedAt?: number;
  actionId: string;
  jobCreatedAt: number;
  /** Owned states fence legacy replicas; snapshot readers expose pending/claimed. */
  status: "pending" | "claimed" | "pending_owned" | "claimed_owned" | "closed";
  resumeAttemptId?: string;
  outcome?: "committed" | "stale" | "settled" | "cancelled";
  closedAt?: Date;
  observedAt: Date;
}
interface IAgentEventActorSnapshot {
  state: IAgentEventActorState | null;
  reconciliations: IAgentEventActorReconciliation[];
  legacyTurn: IAgentEventActorLegacyTurn | null;
  suspension: IAgentEventActorSuspension | null;
  /** Durable invalidation epoch. Every legacy-path event bumps it — including
  * for headless or already cold-marked actors, where the marker alone leaves
  * no CAS-visible trace — and the commit CAS requires the epoch observed at
  * preparation, so a stale fork can never commit state built from history
  * read before an intervening legacy turn. */
  epoch: number;
}
interface IAgentEventBindingRecord {
  conversationId: string;
  agentId: string;
  tenantId?: string;
  isTemporary?: boolean;
  expiredAt?: Date;
  binding: IAgentEventBinding;
  lineage: TSubagentThreadLineage;
}
interface IActiveSubagentThreadLease {
  conversationId: string;
  parentConversationId: string;
  taskId: string;
}
interface ISubagentThreadReservation {
  conversation: IConversation;
  created: boolean;
}
interface IConversation extends Document {
  conversationId: string;
  title?: string;
  user?: string;
  messages?: Types.ObjectId[];
  isTemporary?: boolean;
  endpoint?: string;
  endpointType?: string;
  model?: string;
  region?: string;
  chatGptLabel?: string;
  examples?: unknown[];
  modelLabel?: string;
  promptPrefix?: string;
  temperature?: number;
  top_p?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  maxTokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  file_ids?: string[];
  resendImages?: boolean;
  promptCache?: boolean;
  promptCacheTtl?: "5m" | "1h";
  thinking?: boolean;
  thinkingBudget?: number;
  effort?: string;
  system?: string;
  resendFiles?: boolean;
  imageDetail?: string;
  agent_id?: string;
  codeApprovalMode?: CodeApprovalMode;
  codeEnvironmentMode?: CodeEnvironmentMode;
  codeWorkspaces?: CodeWorkspaceSelection[];
  /** Immutable primary persisted-agent attribution for Insights. */
  initial_agent_id?: string | null;
  subagentThread?: TSubagentThreadLineage;
  /** Internal execution fence. Excluded from ordinary conversation reads. */
  subagentThreadLease?: ISubagentThreadLease;
  /** Internal event-source identity. Excluded from ordinary conversation reads. */
  agentEventBinding?: IAgentEventBinding;
  /** Internal event-actor checkpoint head. Excluded from ordinary conversation reads. */
  agentEventActor?: IAgentEventActorState;
  /** Prune work persisted atomically before the actor rotates its predecessor. */
  agentEventActorCleanup?: IAgentEventActorCheckpoint[];
  /** Private invocation proof: active lifecycle fences plus settled same-ID receipts. */
  agentEventActorReconciliations?: IAgentEventActorReconciliation[];
  /** Private invalidation epoch; see {@link IAgentEventActorSnapshot.epoch}. */
  agentEventActorEpoch?: number;
  /** Private in-flight legacy-turn fence; see {@link IAgentEventActorLegacyTurn}. */
  agentEventActorLegacyTurn?: IAgentEventActorLegacyTurn;
  /** Private current suspended invocation; see {@link IAgentEventActorSuspension}. */
  agentEventActorSuspension?: IAgentEventActorSuspension;
  assistant_id?: string;
  instructions?: string;
  stop?: string[];
  isArchived?: boolean;
  /** Set when archived, cleared on unarchive; absent on chats archived before it existed. */
  archivedAt?: Date | null;
  pinned?: boolean;
  /** Derived per request from the shared-links collection; never persisted on the conversation. */
  isShared?: boolean;
  iconURL?: string;
  greeting?: string;
  spec?: string;
  tags?: string[];
  chatProjectId?: string | null;
  tools?: string[];
  maxContextTokens?: number;
  max_tokens?: number;
  reasoning_effort?: string;
  reasoning_summary?: string;
  reasoning_mode?: string;
  reasoning_context?: string;
  verbosity?: string;
  useResponsesApi?: boolean;
  web_search?: boolean;
  url_context?: boolean;
  disableStreaming?: boolean;
  fileTokenLimit?: number;
  files?: string[];
  expiredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
//#endregion
//#region src/types/chatProject.d.ts
interface IChatProject {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  user: string;
  conversationCount: number;
  lastConversationAt?: Date | null;
  lastConversationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
interface IChatProjectDocument extends Omit<IChatProject, "_id">, Document {}
//#endregion
//#region src/types/session.d.ts
interface ISession extends Document {
  refreshTokenHash: string;
  expiration: Date;
  user: Types.ObjectId;
  tenantId?: string;
}
interface CreateSessionOptions {
  expiration?: Date;
  /** Duration in milliseconds for session expiry. Default: 7 days */
  expiresIn?: number;
}
interface UpsertSessionOptions {
  expiration: Date;
  tenantId?: string;
}
interface UpdateExpirationOptions {
  /** Duration in milliseconds for session expiry. Default: 7 days */
  expiresIn?: number;
}
interface SessionSearchParams {
  refreshToken?: string;
  userId?: string;
  sessionId?: string | {
    sessionId: string;
  };
}
interface SessionQueryOptions {
  lean?: boolean;
}
interface DeleteSessionParams {
  refreshToken?: string;
  sessionId?: string;
}
interface DeleteAllSessionsOptions {
  excludeCurrentSession?: boolean;
  currentSessionId?: string;
}
interface SessionResult {
  session: Partial<ISession>;
  refreshToken: string;
}
interface SignPayloadParams {
  payload: Record<string, unknown>;
  secret?: string;
  expirationTime: number;
}
//#endregion
//#region src/types/balance.d.ts
/** Whole credits held against a balance while the request that reserved them is in flight */
interface IBalanceReservation {
  id: string;
  amount: number;
  expiresAt: Date;
}
/** An applied auto-refill whose ledger transaction has not been confirmed as recorded */
interface IBalancePendingRefill {
  transactionId: Types.ObjectId;
  rawAmount: number;
}
interface IBalance extends Document {
  user: Types.ObjectId;
  tokenCredits: number;
  autoRefillEnabled: boolean;
  refillIntervalValue: number;
  refillIntervalUnit: RefillIntervalUnit;
  lastRefill: Date;
  refillAmount: number;
  tenantId?: string;
  /** Reservation state is excluded from reads unless explicitly selected */
  reservations?: IBalanceReservation[];
  /** Sum of `reservations` amounts, maintained by the same writes */
  reservedCredits?: number;
  pendingRefill?: IBalancePendingRefill;
}
/** Plain data fields for creating or updating a balance record (no Mongoose Document methods) */
interface IBalanceUpdate {
  user?: string;
  tokenCredits?: number;
  autoRefillEnabled?: boolean;
  refillIntervalValue?: number;
  refillIntervalUnit?: RefillIntervalUnit;
  refillAmount?: number;
  lastRefill?: Date;
}
/** Holds credits against a user's balance for the lifetime of one in-flight request */
interface BalanceReservationRequest {
  user: string;
  /** Unique per request; the release addresses the reservation by this id */
  reservationId: string;
  /** Credits the request is admitted against */
  amount: number;
  /** An unreleased reservation stops counting against the balance at this instant */
  expiresAt: Date;
  /** Creates the balance record with these fields when the user has none */
  initialBalance?: IBalanceUpdate;
}
interface BalanceReservationRenewal {
  user: string;
  reservationId: string;
  expiresAt: Date;
}
interface BalanceReservationRelease {
  user: string;
  reservationId: string;
  /** The amount that was reserved */
  amount: number;
}
interface BalanceReservationResult {
  reserved: boolean;
  /** Credits not held by other in-flight requests, after any auto-refill */
  balance: number;
}
//#endregion
//#region src/types/banner.d.ts
interface IBanner extends Document {
  bannerId: string;
  message: string;
  displayFrom: Date;
  displayTo?: Date;
  type: "banner" | "popup";
  isPublic: boolean;
  persistable: boolean;
  tenantId?: string;
}
//#endregion
//#region src/types/transaction.d.ts
interface TransactionData {
  user: string;
  conversationId: string;
  tokenType: string;
  model?: string;
  context?: string;
  valueKey?: string;
  rate?: number;
  rawAmount?: number;
  tokenValue?: number;
  inputTokens?: number;
  writeTokens?: number;
  readTokens?: number;
  messageId?: string;
  inputTokenCount?: number;
  rateDetail?: Record<string, number>;
}
//#endregion
//#region src/types/message.d.ts
type SubagentTaskControlAction = "steer" | "queue" | "interrupt" | "cancel" | "cancel_message";
type SubagentTaskControlReceiptStatus = "reserved" | "accepted" | "applied" | "rejected" | "failed";
type SubagentTriggerProjection = {
  version: 1;
  eventType: string;
  sourceType: string;
  occurredAt: Date;
  expectedActionToolName?: string;
};
/** Server-private durable receipt for one parent-to-child control invocation. */
interface ISubagentTaskControlReceipt {
  invocationId: string;
  fingerprint: string;
  controlId?: string;
  action: SubagentTaskControlAction;
  status: SubagentTaskControlReceiptStatus;
  createdAt: Date;
  updatedAt: Date;
  boundary?: "preempt" | "tool" | "turn";
  reason?: string;
  message?: string;
  messageTruncated?: boolean;
}
interface IMessage extends Document {
  messageId: string;
  conversationId: string;
  user: string;
  model?: string;
  endpoint?: string;
  conversationSignature?: string;
  clientId?: string;
  invocationId?: number;
  parentMessageId?: string | null;
  tokenCount?: number;
  summaryTokenCount?: number;
  sender?: string;
  text?: string;
  summary?: string;
  isCreatedByUser: boolean;
  /** True when the complete stored row came from outside the model. */
  isUserSubmitted?: boolean;
  /** JSON pointers to caller-authored fields in an otherwise mixed model response. */
  userSubmittedPaths?: string[];
  /** Exact HITL message fields stored at caller-authored paths in a mixed response. */
  userSubmittedMessageFieldPaths?: UserSubmittedMessageFieldPath[];
  isTemporary?: boolean;
  unfinished?: boolean;
  error?: boolean;
  finish_reason?: string;
  feedback?: {
    rating: TFeedbackRating;
    tag: TFeedbackTag | undefined;
    text?: string;
  };
  langfuseSampled?: boolean;
  langfuseDestinationIds?: string[];
  /** The run whose trace this response reports, when that run's id is not the message's own (a failed turn's error row). */
  langfuseRunId?: string;
  _meiliIndex?: boolean;
  files?: unknown[];
  plugin?: {
    latest?: string;
    inputs?: unknown[];
    outputs?: string;
  };
  plugins?: unknown[];
  content?: unknown[];
  thread_id?: string;
  iconURL?: string;
  addedConvo?: boolean;
  metadata?: Record<string, unknown>;
  /** Server-private canonical message delta for durable subagent-thread continuation. */
  subagentTranscript?: {
    taskId: string;
    mode: "append" | "replace";
    messagesJson: string;
  };
  /** Server-private bounded rendering projection derived once at child settlement. */
  subagentActivityProjection?: {
    taskId: string;
    version: 1;
    activityJson: string;
    truncated: boolean;
  };
  /** Server-private durable idempotency marker for one detached subagent turn. */
  subagentTask?: {
    attemptKey: string; /** Parent response that initiated this exact child task. */
    parentRunId?: string;
    requestFingerprint?: string;
    status: "running" | "completed" | "error" | "cancelled";
    resultClaim?: {
      kind: "manual" | "wakeup";
      claimId: string;
      claimedAt: Date; /** Response generation that owns a manual delivery claim. */
      generationId?: string;
    };
    controlReceipts?: ISubagentTaskControlReceipt[];
  };
  subagentTriggerProjection?: SubagentTriggerProjection;
  contextMeta?: Partial<IAgentEventActorContextMeta>;
  attachments?: unknown[];
  /** Skills the user invoked manually via the `$` popover on this turn. UI-only metadata for `SkillPills`. */
  manualSkills?: string[];
  /**
  * Skills auto-primed on this turn via `always-apply` frontmatter. Persisted
  * at turn time so pinned badges survive later flips of the skill's
  * `alwaysApply` flag — the audit trail follows what actually ran, not what
  * the current catalog says.
  */
  alwaysAppliedSkills?: string[];
  /** Verbatim excerpts the user quoted to reference on this turn. UI-only metadata for `MessageQuotes`. */
  quotes?: string[];
  expiredAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
//#endregion
//#region src/types/agent.d.ts
interface ISupportContact {
  name?: string;
  email?: string;
}
interface IAgent extends Omit<Document, "model"> {
  id: string;
  name?: string;
  description?: string;
  instructions?: string;
  avatar?: {
    filepath: string;
    source: string;
  };
  provider: string;
  model: string;
  model_parameters?: Record<string, unknown>;
  artifacts?: string;
  access_level?: number;
  recursion_limit?: number;
  tools?: string[];
  skills?: string[];
  skills_enabled?: boolean;
  skill_authoring_enabled?: boolean;
  skills_scope?: SkillsScope;
  tool_kwargs?: Array<unknown>;
  actions?: string[];
  author: Types.ObjectId;
  authorName?: string;
  hide_sequential_outputs?: boolean;
  end_after_tools?: boolean;
  stateful_code_sessions?: boolean;
  stateful_code_environment?: "user" | "agent-user" | "conversation";
  code_environment_id?: string;
  code_workspace_id?: string;
  git_identity?: AgentGitIdentity | null;
  /** @deprecated Use edges instead */
  agent_ids?: string[];
  edges?: GraphEdge[];
  conversation_starters?: string[];
  tool_resources?: AgentToolResources;
  versions?: Omit<IAgent, "versions">[];
  category: string;
  support_contact?: ISupportContact;
  is_promoted?: boolean;
  /** MCP server names extracted from tools for efficient querying */
  mcpServerNames?: string[];
  /** Per-tool configuration (defer_loading, allowed_callers, run_in_background, describe_intent) */
  tool_options?: AgentToolOptions;
  /** Subagent spawning configuration — isolated-context child agents. */
  subagents?: AgentSubagentsConfig;
  /** Memory partition: 'agent' isolates memories per (user, agent); default shared pool */
  memory_scope?: MemoryScope;
  tenantId?: string;
}
//#endregion
//#region src/types/agentApiKey.d.ts
interface IAgentApiKey extends Document {
  userId: Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}
interface AgentApiKeyCreateData {
  userId: Types.ObjectId | string;
  name: string;
  expiresAt?: Date | null;
}
interface AgentApiKeyCreateResult {
  id: string;
  name: string;
  keyPrefix: string;
  key: string;
  createdAt: Date;
  expiresAt?: Date;
}
interface AgentApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}
interface AgentApiKeyQuery {
  userId?: Types.ObjectId | string;
  keyPrefix?: string;
  id?: string;
}
interface AgentApiKeyDeleteResult {
  deletedCount?: number;
}
//#endregion
//#region src/types/agentCategory.d.ts
type AgentCategory = {
  /** Unique identifier for the category (e.g., 'general', 'hr', 'finance') */value: string; /** Display label for the category */
  label: string; /** Description of the category */
  description?: string; /** Display order for sorting categories */
  order: number; /** Whether the category is active and should be displayed */
  isActive: boolean; /** Whether this is a custom user-created category */
  custom?: boolean;
  tenantId?: string;
};
type IAgentCategory = AgentCategory & Document & {
  _id: Types.ObjectId;
};
//#endregion
//#region src/types/codeEnvironment.d.ts
type CodeEnvironment = {
  environmentId: string;
  name: string;
  type: "managed" | "attached";
  baseURL: string;
  controlPlaneId: string;
  createdBy: Types.ObjectId;
  ownerSlot?: number;
  pendingAgentReferences?: Array<{
    reservationId: string;
    expiresAt: Date;
  }>;
  deletionStartedAt?: Date;
  deletionLeaseId?: string;
  deletionLeaseExpiresAt?: Date;
  deletionCommittedAt?: Date;
  registrationPendingAt?: Date;
  registrationLeaseId?: string;
  registrationLeaseExpiresAt?: Date;
  registrationReconcileAfter?: Date;
  revocationPendingAt?: Date;
  revocationAttempts?: number;
  revocationLastError?: string;
  revocationReconcileAfter?: Date;
  revocationLeaseId?: string;
  revocationLeaseExpiresAt?: Date;
  workerId?: string;
  revocationTokenEnv?: string;
  workerPrincipal?: {
    type: "deployment" | "tenant" | "user" | "role" | "group";
    id: string;
  };
  settings?: CodeEnvironmentUserSettings;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
};
type CodeEnvironmentDocument = CodeEnvironment & Document<Types.ObjectId> & {
  _id: Types.ObjectId;
};
//#endregion
//#region src/types/role.d.ts
interface IRole extends Document {
  name: string;
  description?: string;
  permissions: {
    [PermissionTypes.BOOKMARKS]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.PROMPTS]?: {
      [Permissions.USE]?: boolean;
      [Permissions.CREATE]?: boolean;
      [Permissions.SHARE]?: boolean;
      [Permissions.SHARE_PUBLIC]?: boolean;
    };
    [PermissionTypes.MEMORIES]?: {
      [Permissions.USE]?: boolean;
      [Permissions.CREATE]?: boolean;
      [Permissions.UPDATE]?: boolean;
      [Permissions.READ]?: boolean;
    };
    [PermissionTypes.AGENTS]?: {
      [Permissions.USE]?: boolean;
      [Permissions.CREATE]?: boolean;
      [Permissions.SHARE]?: boolean;
      [Permissions.SHARE_PUBLIC]?: boolean;
    };
    [PermissionTypes.MULTI_CONVO]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.TEMPORARY_CHAT]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.RUN_CODE]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.WEB_SEARCH]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.PEOPLE_PICKER]?: {
      [Permissions.VIEW_USERS]?: boolean;
      [Permissions.VIEW_GROUPS]?: boolean;
      [Permissions.VIEW_ROLES]?: boolean;
    };
    [PermissionTypes.MARKETPLACE]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.FILE_SEARCH]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.FILE_CITATIONS]?: {
      [Permissions.USE]?: boolean;
    };
    [PermissionTypes.MCP_SERVERS]?: {
      [Permissions.USE]?: boolean;
      [Permissions.CREATE]?: boolean;
      [Permissions.SHARE]?: boolean;
      [Permissions.SHARE_PUBLIC]?: boolean;
    };
    [PermissionTypes.REMOTE_AGENTS]?: {
      [Permissions.USE]?: boolean;
      [Permissions.CREATE]?: boolean;
      [Permissions.SHARE]?: boolean;
      [Permissions.SHARE_PUBLIC]?: boolean;
    };
    [PermissionTypes.SKILLS]?: {
      [Permissions.USE]?: boolean;
      [Permissions.CREATE]?: boolean;
      [Permissions.SHARE]?: boolean;
      [Permissions.SHARE_PUBLIC]?: boolean;
    };
    [PermissionTypes.SHARED_LINKS]?: {
      [Permissions.CREATE]?: boolean;
      [Permissions.SHARE]?: boolean;
      [Permissions.SHARE_PUBLIC]?: boolean;
    };
    [PermissionTypes.SCHEDULES]?: {
      [Permissions.USE]?: boolean;
      [Permissions.CREATE]?: boolean;
    };
  };
  tenantId?: string;
}
type RolePermissions = IRole["permissions"];
type RolePermissionsInput = DeepPartial<RolePermissions>;
interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: RolePermissionsInput;
}
interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: RolePermissionsInput;
}
interface RoleFilterOptions extends CursorPaginationParams {
  search?: string;
  hasPermission?: string;
}
//#endregion
//#region src/types/query.d.ts
/**
* A criterion that matches a single value or any one of several.
*
* Storage-agnostic on purpose: it is part of the domain query vocabulary, not
* of any engine's filter language.
*/
type OneOrMany<T> = T | T[];
//#endregion
//#region src/types/action.d.ts
interface IAction extends Document {
  user: mongoose.Types.ObjectId;
  action_id: string;
  type: string;
  settings?: unknown;
  agent_id?: string;
  assistant_id?: string;
  metadata: {
    api_key?: string;
    auth: {
      authorization_type?: string;
      custom_auth_header?: string;
      type: "service_http" | "oauth" | "none";
      authorization_content_type?: string;
      authorization_url?: string;
      client_url?: string;
      scope?: string;
      token_exchange_method: "default_post" | "basic_auth_header" | null;
    };
    domain: string;
    privacy_policy_url?: string;
    raw_spec?: string;
    oauth_client_id?: string;
    oauth_client_secret?: string;
  };
  tenantId?: string;
}
/**
* Domain criteria for locating actions. Fields are combined with AND; an array
* value matches any of its entries. Deliberately storage-agnostic — it names
* domain concepts, not stored field names or query operators.
*/
interface ActionQuery {
  actionId?: OneOrMany<string>;
  agentId?: OneOrMany<string>;
  assistantId?: OneOrMany<string>;
  user?: string;
}
//#endregion
//#region src/types/assistant.d.ts
interface IAssistant extends Document {
  user: Types.ObjectId;
  assistant_id: string;
  endpoint?: string;
  avatar?: {
    filepath: string;
    source: string;
  };
  conversation_starters?: string[];
  access_level?: number;
  file_ids?: string[];
  actions?: string[];
  append_current_datetime?: boolean;
  tenantId?: string;
}
/**
* Domain criteria for locating assistants. Fields are combined with AND; an
* array value matches any of its entries.
*/
interface AssistantQuery {
  assistantId?: OneOrMany<string>;
  user?: string;
  /** Matches the stored avatar path, used to authorize avatar image reads. */
  avatarFilepath?: OneOrMany<string>;
}
//#endregion
//#region src/types/file.d.ts
type RunArtifactRunScope = {
  userId: string;
  tenantId?: string | null;
  conversationId: string;
  runId: string;
};
type RunArtifactScope = RunArtifactRunScope & {
  executionId: string;
  agentId: string;
  sourceFileId: string;
};
type RunArtifactFile = TFile & {
  conversationId: string;
  messageId?: string;
  expiredAt?: Date | null;
  previewRevision?: string;
  metadata: NonNullable<TFile["metadata"]> & {
    runFile: RunFileProvenance;
  };
};
type RunArtifactContent = Pick<TFile, "filename" | "filepath" | "bytes" | "type" | "source" | "storageKey" | "storageRegion" | "text" | "textFormat" | "width" | "height" | "status" | "previewError" | "llmDeliveryPath"> & {
  messageId?: string;
  expiredAt?: Date | null;
  previewRevision?: string;
  metadata?: Omit<NonNullable<TFile["metadata"]>, "runFile">;
};
type CodeFileCommitData = Omit<RunArtifactContent, "text" | "status" | "previewError" | "previewRevision"> & {
  file_id: string;
  user: string;
  tenantId?: string;
  conversationId?: string;
  context?: FileContext;
  object?: "file";
  embedded?: boolean;
  usage?: number;
  text?: string | null;
  status?: TFile["status"] | null;
  previewError?: string | null;
  previewRevision?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
type PublishRunArtifactInput = {
  scope: RunArtifactScope;
  file: RunArtifactContent;
  provenance: RunFileProvenance;
};
type RunArtifactClaim = {
  file_id: string;
  file?: RunArtifactFile;
};
interface IMongoFile extends Omit<Document, "model"> {
  user: Types.ObjectId;
  conversationId?: string;
  messageId?: string;
  file_id: string;
  temp_file_id?: string;
  bytes: number;
  text?: string;
  /**
  * Format of the `text` field — `'html'` when the backend produced
  * a sanitized full-document HTML preview (e.g. office types via
  * `bufferToOfficeHtml`), `'text'` for plain-text extracts (e.g.
  * RAG mammoth/pdf-parse output), `undefined` for legacy records
  * that pre-date the field. Clients MUST treat `undefined` as
  * `'text'` and refuse to inject the value into HTML contexts —
  * otherwise plain document text containing `<script>` tags would
  * become executable markup. See Codex P1 review on PR #12934.
  */
  textFormat?: "html" | "text";
  /**
  * Lifecycle of the inline preview rendered from `text`. Tracks the
  * deferred-preview code-execution flow (PR #12951 follow-up): the
  * immediate persist step saves the file blob and emits the attachment
  * record with `status: 'pending'`; a background render runs HTML
  * extraction and updates the record to `'ready'` (with `text` +
  * `textFormat`) or `'failed'` (with `previewError`). Decouples the
  * agent's final response from CPU-heavy office-format rendering.
  *
  * Absent for legacy records and for files that never expect a preview
  * (RAG uploads, images, plain-text artifacts). Clients MUST treat
  * `undefined` as `'ready'` so prior-version records render normally.
  */
  status?: "pending" | "ready" | "failed";
  /**
  * Short machine-readable reason when `status === 'failed'` —
  * `'timeout'`, `'parser-error'`, `'oversized'`, `'orphaned'`. UI hint
  * for tooltip text; not user-facing prose. Absent otherwise.
  */
  previewError?: string;
  /**
  * Generation marker for the deferred-preview lifecycle. The
  * immediate persist step stamps a fresh UUID on every emit; the
  * deferred render's update only commits when the marker still
  * matches. Guards against an older render overwriting a newer
  * record on cross-turn filename reuse. Absent for legacy records
  * and for files that never expect a preview.
  */
  previewRevision?: string;
  filename: string;
  filepath: string;
  storageKey?: string;
  storageRegion?: string;
  object: "file";
  embedded?: boolean;
  type: string;
  context?: string;
  usage: number;
  source: string;
  model?: string;
  width?: number;
  height?: number;
  metadata?: {
    runFile?: RunFileProvenance;
    /**
    * Code-environment cache pointer for files re-uploadable to
    * codeapi (chat attachments, agent tool resources, code-output
    * files). Carries the resource kind + identity so codeapi can
    * derive the sessionKey explicitly.
    */
    codeEnvRef?: CodeEnvRef;
    codeEnvRefs?: CodeEnvRefMap; /** Dispatch-order stamp for the current source artifact generation. */
    sourceDispatchedAt?: number; /** Vector namespaces this file has been embedded into. */
    embeddedEntities?: string[]; /** The user named this destination, so absent ones were declined. */
    destinationChosen?: boolean; /** The type the delivery route was resolved against, when conversion changed it. */
    routingMimeType?: string;
  };
  /** Upload-time inference, not a durable contract. See the schema field for why. */
  llmDeliveryPath?: string;
  expiresAt?: Date;
  expiredAt?: Date | null;
  /**
  * Consecutive failed retention-sweep deletions. The sweep backs off
  * between attempts and parks the file once this reaches the configured
  * cap, so a file whose backing storage refuses deletion cannot occupy
  * the sweep's bounded queue. Absent until the first failure.
  */
  deletionAttempts?: number;
  /**
  * Earliest time the retention sweep may retry this file, and the only
  * thing holding it back. Set alongside `deletionAttempts` on every
  * failure; absent until the first one.
  */
  deletionRetryAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
//#endregion
//#region src/types/share.d.ts
/**
* Immutable snapshot of a file referenced by a shared chat snapshot. Captured at
* share create/update so shared-link viewers can preview/download the file through
* the share-scoped routes without consulting the original owner's live file ACL.
* References the original stored object (no byte copy); only the metadata needed to
* stream/preview is duplicated.
*/
interface SharedFileSnapshot {
  file_id: string;
  source?: string;
  storageKey?: string;
  filepath?: string;
  type?: string;
  filename?: string;
  bytes?: number;
  width?: number;
  height?: number;
  model?: string;
  /** Determines whether the shared renderer previews the original object or
  * the extracted text served by the share-scoped preview route. Null marks a
  * legacy snapshot checked without a matching live file; do not retry on each view. */
  llmDeliveryPath?: "provider" | "text" | "none" | null;
  /** Deferred-preview generation marker captured at share time. The share routes
  * refuse to serve when the live file's revision no longer matches (the file_id
  * was reused/overwritten by a later turn), so a link can't surface post-share
  * content. */
  previewRevision?: string;
  /** Stable generation marker stamped whenever a source artifact is dispatched.
  * Unlike `updatedAt`, preview finalization does not change this value. */
  sourceDispatchedAt?: number;
  tenantId?: string;
}
interface ISharedLink {
  _id?: Types.ObjectId;
  conversationId: string;
  title?: string;
  user?: string;
  messages?: Types.ObjectId[];
  shareId?: string;
  targetMessageId?: string;
  expiredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  /** Owning tenant for multi-tenant deployments (read by the shared-link access middleware). */
  tenantId?: string;
  /**
  * Per-link choice of whether the conversation's files are included in the share
  * (the "share files" checkbox). `false` means the viewer sees no files; absent
  * means a legacy link (treated as included). Distinct from `fileSnapshots` so an
  * opt-out is never mistaken for a not-yet-backfilled legacy link.
  */
  snapshotFiles?: boolean;
  /** Per-share file snapshot referenced by the share-scoped file routes. */
  fileSnapshots?: SharedFileSnapshot[];
}
interface ShareServiceError extends Error {
  code: string;
}
/**
* A file or attachment as exposed through a public shared link: storage- and
* identity-internal fields are stripped, but render-relevant data (including
* dynamic tool-call payloads keyed by tool name) is preserved.
*/
type SharedFile = Record<string, unknown>;
/**
* Public, anonymized projection of a message returned by a shared link. Only
* render-relevant fields are surfaced; internal fields (user, endpoint,
* conversationSignature, clientId, plugin(s), metadata, etc.) are omitted.
*/
type SharedMessage = Pick<IMessage, "messageId" | "parentMessageId" | "conversationId" | "sender" | "text" | "content" | "iconURL" | "isCreatedByUser" | "isUserSubmitted" | "userSubmittedPaths" | "userSubmittedMessageFieldPaths" | "createdAt" | "updatedAt" | "tokenCount" | "unfinished" | "error" | "finish_reason" | "manualSkills" | "alwaysAppliedSkills" | "quotes"> & {
  model?: string;
  files?: SharedFile[];
  attachments?: SharedFile[];
};
interface SharedLinksResult {
  links: Array<{
    shareId: string;
    title: string;
    createdAt: Date;
    conversationId: string;
  }>;
  nextCursor?: Date | string;
  hasNextPage: boolean;
}
interface SharedMessagesResult {
  conversationId: string;
  messages: Array<SharedMessage>;
  shareId: string;
  title?: string;
  /** Whether the shared messages show a configured sender label, so the share view can
  * withhold the model on hover as the chat view does. */
  hasConfiguredSender?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
interface CreateShareResult {
  _id?: string;
  shareId: string;
  conversationId: string;
  targetMessageId?: string;
}
interface UpdateShareResult {
  _id?: string;
  shareId: string;
  conversationId: string;
  targetMessageId?: string;
}
interface DeleteShareResult {
  _id?: string;
  success: boolean;
  shareId: string;
  message: string;
}
interface GetShareLinkResult {
  _id?: string;
  shareId: string | null;
  targetMessageId?: string;
  snapshotFiles?: boolean;
  success: boolean;
}
interface DeleteAllSharesResult {
  message: string;
  deletedCount: number;
}
//#endregion
//#region src/types/pluginAuth.d.ts
interface IPluginAuth extends Document {
  authField: string;
  value: string;
  userId: string;
  pluginKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
interface PluginAuthQuery {
  userId: string;
  authField?: string;
  pluginKey?: string;
}
interface FindPluginAuthParams {
  userId: string;
  authField: string;
  pluginKey?: string;
}
interface FindPluginAuthsByKeysParams {
  userId: string;
  pluginKeys: string[];
}
interface UpdatePluginAuthParams {
  userId: string;
  authField: string;
  pluginKey: string;
  value: string;
}
interface DeletePluginAuthParams {
  userId: string;
  authField?: string;
  pluginKey?: string;
  all?: boolean;
}
//#endregion
//#region src/types/memory.d.ts
interface IMemoryEntry extends Document {
  userId: Types.ObjectId;
  key: string;
  value: string;
  /** Agent partition; null/absent = shared personal pool */
  agentId?: string;
  tokenCount?: number;
  updated_at?: Date;
  tenantId?: string;
}
interface IMemoryEntryLean {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  key: string;
  value: string;
  agentId?: string;
  tokenCount?: number;
  updated_at?: Date;
  __v?: number;
}
interface SetMemoryParams {
  userId: string | Types.ObjectId;
  key: string;
  value: string;
  tokenCount?: number;
  /** Agent partition; omit for the shared personal pool */
  agentId?: string;
}
interface DeleteMemoryParams {
  userId: string | Types.ObjectId;
  key: string;
  agentId?: string;
}
interface MemoryByIdParams {
  userId: string | Types.ObjectId;
  id: string;
  agentId?: string;
}
interface SetMemoryByIdParams extends MemoryByIdParams {
  /** Omit to preserve the existing key. */
  key?: string;
  value: string;
  tokenCount?: number;
}
interface GetUserMemoriesParams {
  userId: string | Types.ObjectId;
  agentId?: string;
}
interface GetFormattedMemoriesParams {
  userId: string | Types.ObjectId;
  agentId?: string;
}
interface MemoryResult {
  ok: boolean;
}
interface SetMemoryByIdResult extends MemoryResult {
  conflict?: boolean;
  memory?: IMemoryEntryLean;
}
interface FormattedMemoriesResult {
  withKeys: string;
  withoutKeys: string;
  totalTokens?: number;
  tokenCountsByKey?: Map<string, number>;
}
//#endregion
//#region src/types/favorite.d.ts
declare const FAVORITE_ITEM_TYPES: readonly ["builtin", "tool", "mcp", "skill"];
type FavoriteItemType = (typeof FAVORITE_ITEM_TYPES)[number];
interface IToolFavorite extends Document {
  user: Types.ObjectId;
  itemType: FavoriteItemType;
  itemId: string;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IToolFavoriteLean {
  itemType: FavoriteItemType;
  itemId: string;
}
interface ToolFavoriteParams {
  userId: string | Types.ObjectId;
  itemType: FavoriteItemType;
  itemId: string;
}
interface AddToolFavoriteResult {
  ok: boolean;
  added: boolean;
}
interface RemoveToolFavoriteResult {
  ok: boolean;
  removed: boolean;
}
//#endregion
//#region src/types/prompts.d.ts
interface IPrompt extends Document {
  groupId: Types.ObjectId;
  author: Types.ObjectId;
  prompt: string;
  type: "text" | "chat";
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
interface IPromptGroup {
  name: string;
  numberOfGenerations: number;
  oneliner: string;
  category: string;
  productionId: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  command?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPublic?: boolean;
  tenantId?: string;
}
interface IPromptGroupDocument extends IPromptGroup, Document {}
//#endregion
//#region src/types/skill.d.ts
/**
* Skill — the single source of truth for a TerraMind skill.
* Each document is the full SKILL.md body plus structured frontmatter and metadata.
* The `version` field is an integer monotonic counter used for optimistic concurrency.
*/
interface ISkill {
  /**
  * Machine-readable kebab-case identifier. This is what Claude sees in the
  * system-prompt skill manifest and what slash-command integrations key off.
  * Unique per `(author, tenantId)`. Must be stable across edits — a rename
  * invalidates any external reference to the skill.
  */
  name: string;
  /**
  * Human-readable label shown only in the TerraMind UI (skill list, detail
  * header, sharing dialogs). NOT sent to Claude and NOT part of the trigger
  * path — `name` + `description` drive triggering. Purely cosmetic: lets an
  * author keep a stable kebab-case `name` while showing something prettier
  * in the UI.
  */
  displayTitle?: string;
  /**
  * "When to use this skill" sentence. This is the highest-leverage field for
  * Claude's triggering decision — vague or missing descriptions cause
  * undertriggering. Denormalized from the YAML frontmatter onto its own
  * column so listings can filter/sort on it without loading `body`.
  */
  description: string;
  /** The SKILL.md body (markdown after the YAML frontmatter). */
  body: string;
  /**
  * Structured YAML frontmatter (excluding `name` and `description`, which live as
  * top-level columns). Stored as Mongoose Mixed so callers can extend without schema
  * churn; validated in strict mode via `validateSkillFrontmatter` — unknown keys
  * are rejected so expanding the allowed set is an intentional code change.
  */
  frontmatter: Record<string, unknown>;
  /**
  * Mirrors the `disable-model-invocation` frontmatter field. `true` removes
  * the skill from the model's catalog and rejects model-side `skill` tool
  * calls; manual `$` invocation is unaffected. Defaults to `false`.
  */
  disableModelInvocation?: boolean;
  /**
  * Mirrors the `user-invocable` frontmatter field. `false` hides the skill
  * from the `$` popover and rejects manual invocation. Defaults to `true`.
  */
  userInvocable?: boolean;
  /**
  * Skill-declared tool allowlist (mirrors the `allowed-tools` frontmatter
  * field). When the skill is invoked **manually** (via `$` popover, or
  * always-apply once Phase 5 lands), these tools are unioned into the
  * agent's effective tool set for the turn. Tolerant of unknown names —
  * the runtime intersects against the loaded tool registry and silently
  * drops anything missing, so cross-ecosystem skills authored against
  * unimplemented tools import without breaking.
  *
  * Note: model-invoked skills (via the `skill` tool mid-turn) do NOT
  * trigger tool union at execution time — adding tools after the graph
  * has started would require a rebuild. Agents that need a tool when
  * the model picks a skill should add it to `agent.tools` directly.
  */
  allowedTools?: string[];
  category?: string;
  author: Types.ObjectId;
  authorName: string;
  version: number;
  /**
  * Provenance of this skill's canonical definition.
  * - `inline` — authored inside TerraMind.
  * - `github` — mirrored from a configured GitHub skill sync source.
  * - `notion` — reserved for future external sync integrations.
  */
  source: "inline" | "github" | "notion";
  /**
  * Provenance payload keyed by `source`, including upstream identifiers
  * such as GitHub source id, path, and commit/blob SHAs.
  */
  sourceMetadata?: Record<string, unknown>;
  /** Denormalized count of associated `SkillFile` rows. Kept in sync by skill methods. */
  fileCount: number;
  /**
  * When `true`, the skill is auto-primed into every turn — no user `$`
  * invocation or model discretion required. Mirrors the `always-apply` YAML
  * frontmatter field; indexed so the per-turn "always-apply" query stays
  * cheap as the catalog grows.
  */
  alwaysApply: boolean;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  /** Computed from ACL at read time, never persisted. */
  isPublic?: boolean;
}
interface ISkillDocument extends ISkill, Document {}
/**
* Lean summary projection returned by `listSkillsByAccess`. The list query
* uses a narrow `.select()` that omits `body` and `frontmatter` to keep
* payloads small, so those fields are truthfully absent on summary rows.
*/
type ISkillSummary = Omit<ISkill, "body" | "frontmatter">;
/**
* SkillFile — metadata for a file bundled inside a skill.
* Blob content lives in the existing file storage layer (local/S3/etc.) and is
* addressed via `source` + `filepath` + `file_id` (mirroring the File schema).
* `(skillId, relativePath)` is unique per skill.
*/
interface ISkillFile {
  skillId: Types.ObjectId;
  relativePath: string;
  file_id: string;
  filename: string;
  filepath: string;
  storageKey?: string;
  storageRegion?: string;
  source: string;
  sourceMetadata?: Record<string, unknown>;
  mimeType: string;
  bytes: number;
  category: "script" | "reference" | "asset" | "other";
  isExecutable: boolean;
  author: Types.ObjectId;
  tenantId?: string;
  /** Lazily cached text content (≤ 512 KB). Populated on first read; cleared on re-upload. */
  content?: string;
  /** Set on first read. `true` prevents repeated storage reads for non-text files. */
  isBinary?: boolean;
  /**
  * Code-environment cache pointer. Set after uploading the file to
  * codeapi, used to check freshness on subsequent primes. Cleared
  * when the skill file is re-uploaded to storage.
  */
  codeEnvRef?: CodeEnvRef;
  codeEnvRefs?: CodeEnvRefMap;
  createdAt?: Date;
  updatedAt?: Date;
}
interface ISkillFileDocument extends ISkillFile, Document {}
//#endregion
//#region src/types/skillSync.d.ts
type SkillSyncProvider = "github";
/**
* `partial` means the source published at least one skill while dropping some
* of what it was asked to mirror — an unusable `SKILL.md`, or a file whose path
* cannot be represented as a skill file path. A single bad skill must not hide
* the ones that synced fine, and a run that quietly reported `succeeded` would
* hide whatever it dropped.
*/
type SkillSyncRunStatus = "idle" | "running" | "succeeded" | "partial" | "failed" | "skipped";
/** One upstream skill a run could not publish, with the reason it was dropped. */
interface ISkillSyncSkippedSkill {
  /** Repository path of the skill root that was skipped. */
  path: string;
  /** Frontmatter name, when the failure happened late enough for one to exist. */
  name?: string;
  errorCode: string;
  errorMessage: string;
}
/**
* One upstream file a run published a skill without. Unlike a skipped skill,
* the skill itself is live — it is just missing this file, which is invisible
* from the mirrored copy alone and so has to be recorded here.
*/
interface ISkillSyncSkippedFile {
  /** Repository path of the file that was dropped. */
  path: string;
  /** Repository path of the skill root it belongs to. */
  skillPath: string;
  errorCode: string;
  errorMessage: string;
}
interface ISkillSyncCredential {
  provider: SkillSyncProvider;
  credentialKey: string;
  encryptedToken: string;
  tokenHash: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
interface ISkillSyncCredentialDocument extends ISkillSyncCredential, Document {}
interface ISkillSyncStatus {
  provider: SkillSyncProvider;
  sourceId: string;
  tenantId?: string;
  status: SkillSyncRunStatus;
  credentialKey?: string;
  owner?: string;
  repo?: string;
  ref?: string;
  paths?: string[];
  startedAt?: Date;
  finishedAt?: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  syncedSkillCount: number;
  syncedFileCount: number;
  deletedSkillCount: number;
  deletedFileCount: number;
  skippedSkillCount: number;
  /** Capped sample of the skipped skills; `skippedSkillCount` is the full total. */
  skippedSkills?: ISkillSyncSkippedSkill[];
  skippedFileCount: number;
  /** Capped sample of the skipped files; `skippedFileCount` is the full total. */
  skippedFiles?: ISkillSyncSkippedFile[];
  lockOwner?: string;
  lockExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
interface ISkillSyncStatusDocument extends ISkillSyncStatus, Document {}
//#endregion
//#region src/types/triggerDelivery.d.ts
type AgentTriggerDeliveryStatus = "staging" | "capability_staging" | "batched" | "pending" | "capability_pending" | "leased" | "capability_leased" | "succeeded" | "capability_dead" | "dead";
declare const AGENT_TRIGGER_WORKER_CAPABILITY_DETACHED_ACTION_V1 = "event_actor_detached_action_v1";
declare const AGENT_TRIGGER_WORKER_CAPABILITY_BACKGROUND_COMPLETION_V1 = "background_tool_completion_v1";
declare const AGENT_TRIGGER_WORKER_CAPABILITY_QUEUED_TURN_V1 = "agent_queued_turn_v1";
type AgentTriggerDeliveryOutcome = "succeeded" | "retry" | "dead";
interface AgentTriggerHandlingState {
  status: "started" | "applied" | "completed_no_action" | "failed" | "cancelled";
  conversationId: string;
  streamId: string;
  generationCreatedAt: number;
  startedAt: Date;
  settledAt?: Date;
  error?: string;
  action?: {
    toolName: string;
    toolCallId?: string;
  };
}
/** Private terminal proof for one delivery-owned event-actor invocation. */
interface AgentEventActorReceipt {
  bindingId: string;
  resolution: "checkpoint_verified" | "action_compensated" | "history_repaired";
  checkpoint: IAgentEventActorReconciliation["checkpoint"];
  action: {
    toolName: string;
    toolCallId?: string;
  };
  settledAt: Date;
}
/** Private launch authority for one delivery-owned detached expected action. */
interface AgentEventActorDetachedAction {
  version: 1;
  invocationId: string;
  expectedToolName: string;
  toolName: string;
  toolCallId: string;
  /** Stable graph-turn identity, independent of retry allocation. */
  turnId: string;
  taskId: string;
  idempotencyKey: string;
  launchAttempt: number;
  status: "reserved" | "running" | "launch_indeterminate" | "succeeded" | "failed" | "cancelled";
  reservedAt: Date;
  observedAt: Date;
  /** A recovery fence, not relaunch authority. Expiry only permits the exact
  * launch to be marked indeterminate while late terminal proof remains valid. */
  recoveryAfter: Date;
  launchedAt?: Date;
  settledAt?: Date;
  result?: string;
  error?: string;
}
interface AgentTriggerDeliveryFailure {
  code: string;
  message: string;
  certainty: "definite" | "ambiguous";
  retryable: boolean;
  attemptedAt: Date;
  status?: number;
}
interface AgentTriggerDeliveryHistoryEntry {
  attempt: number;
  outcome: AgentTriggerDeliveryOutcome;
  at: Date;
  workerId: string;
  error?: AgentTriggerDeliveryFailure;
}
interface IAgentTriggerDelivery {
  _id?: Types.ObjectId;
  deliveryKey: string;
  fingerprint: string;
  orderingKey: string;
  /** Monotonic sequence allocated while holding the lane publication fence. */
  laneSequence: number;
  envelope: unknown;
  user: Types.ObjectId;
  tenantId?: string;
  status: AgentTriggerDeliveryStatus;
  /** Keeps a delivery invisible to pre-capability workers during rolling deploys. */
  requiredWorkerCapability?: string;
  /** Private lifecycle for capability-owned work. The outer delivery status
  * remains a legacy-known, nonclaimable compatibility shield. */
  capabilityStatus?: "publishing" | "pending" | "leased" | "dead";
  /** Canonical claim ordering timestamp. Old rows omit it and sort first. */
  claimAvailableAt?: Date;
  capabilityLeaseBy?: string;
  capabilityLeaseUntil?: Date;
  capabilityClaimToken?: string;
  /** Durable liveness evidence for process-owned capability work. */
  producerLeaseUntil?: Date;
  attempts: number;
  availableAt: Date;
  envelopeBytes?: number;
  coalesceKey?: string;
  coalesceFrom?: Date;
  coalesceUntil?: Date;
  batchSize?: number;
  batchBytes?: number;
  batchMemberIds?: Types.ObjectId[];
  batchRootId?: Types.ObjectId;
  batchRootRequeueCount?: number;
  batchMembersSettledAt?: Date;
  /** Keeps this binding lane serialized until its admitted child turn reaches
  *  an authoritative terminal handling outcome. */
  awaitTerminalHandling?: boolean;
  handling?: AgentTriggerHandlingState;
  actorReceipt?: AgentEventActorReceipt;
  /** Durable launch identity; excluded from ordinary delivery reads. */
  actorDetachedAction?: AgentEventActorDetachedAction;
  /** Bounded audit trail for terminal attempts replaced by an explicit retry. */
  actorDetachedActionHistory?: AgentEventActorDetachedAction[];
  /** Delivery-owned serialization point acquired exactly once before an event
  * actor may invoke an external action. */
  actorActionAdmittedAt?: Date;
  /** Attempt identity that fences admission takeover and release. */
  actorActionAdmissionId?: string;
  /** Account-deletion fence that atomically closes action admission on this delivery. */
  actorActionAdmissionClosedAt?: Date;
  leaseBy?: string;
  leaseUntil?: Date;
  claimToken?: string;
  lastError?: AgentTriggerDeliveryFailure;
  result?: unknown;
  history?: AgentTriggerDeliveryHistoryEntry[];
  settledAt?: Date;
  expiresAt?: Date;
  requeueCount?: number;
  /** Fairness cursor for bounded recovery of rows stranded before lane publication. */
  stagingRecoveryAt?: Date;
  /** Durable proof that successful settlement still owes lane cleanup publication. */
  laneCleanupPendingAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IAgentTriggerDeliveryDocument extends Omit<IAgentTriggerDelivery, "_id">, Document {}
interface AgentTriggerDeliveryRecord extends Omit<IAgentTriggerDelivery, "_id" | "createdAt"> {
  id: string;
  createdAt: Date;
}
/** Owner-scoped projection safe for public delivery-status reads. */
type AgentTriggerDeliveryStatusRecord = Pick<AgentTriggerDeliveryRecord, "deliveryKey" | "status" | "attempts" | "availableAt" | "createdAt" | "settledAt" | "result" | "lastError" | "handling">;
interface IAgentTriggerLaneSequence {
  _id: string;
  value: number;
  user: Types.ObjectId;
  tenantId?: string;
  /** Latest delivery admitted to this lane. Used to reclaim inactive lane counters safely. */
  tailDeliveryId?: Types.ObjectId;
  /** Delivery currently owning the serialized sequence/publication step. */
  publisherDeliveryId?: Types.ObjectId;
  /** Requeue generation captured when this publisher reservation was acquired. */
  publisherRequeueCount?: number;
  publisherStartedAt?: Date;
  cleanupRequestedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IAgentTriggerLaneSequenceDocument extends Omit<IAgentTriggerLaneSequence, "_id">, Document<string> {}
/** Durable proof that trigger payload cleanup must survive the deleting process. */
interface IAgentTriggerUserPurge {
  _id: Types.ObjectId;
  fenceStartedAt: Date;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IAgentTriggerUserPurgeDocument extends Omit<IAgentTriggerUserPurge, "_id">, Document {}
interface AgentTriggerDeliveryClaim extends AgentTriggerDeliveryRecord {
  claimToken: string;
  leaseBy: string;
  leaseUntil: Date;
  status: "leased" | "capability_leased";
}
interface AgentTriggerOrderingBlock {
  availableAt: Date;
  leaseUntil?: Date;
  reason?: "active_handling";
}
//#endregion
//#region src/types/queuedTurn.d.ts
type AgentQueuedTurnStatus = "reserving" | "queued" | "claimed" | "admitted" | "cancelled" | "dead";
type AgentQueuedTurnDeliveryState = "pending" | "publishing" | "published" | "retiring" | "retired";
interface AgentQueuedTurnFileRef {
  file_id: string;
  type?: string;
  filepath?: string;
  filename?: string;
  llmDeliveryPath?: "provider" | "text" | "none";
  height?: number;
  width?: number;
  bytes?: number;
}
interface AgentQueuedTurnFailure {
  code: string;
  message: string;
}
interface AgentQueuedTurnTerminalReceipt {
  outcome: "admitted" | "cancelled" | "dead";
  settledAt: Date;
  admissionId?: string;
  admissionMode?: "warm" | "ordinary";
  generationId?: string;
  generationCreatedAt?: number;
  /** Effective predecessor consumed by this admission after queued-turn chaining. */
  effectivePredecessorCreatedAt?: number;
  /** Durable lineage node: the root-message identity or predecessor queued-turn identity. */
  lineagePredecessorId?: string;
  /** This admission consumed no predecessor generation boundary. */
  rootPredecessor?: true;
  failure?: AgentQueuedTurnFailure;
}
interface IAgentQueuedTurn {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  tenantId?: string;
  conversationId: string;
  agentId: string;
  parentMessageId: string;
  clientRequestId: string;
  fingerprint: string;
  /** Immutable generation of the conversation lane that admitted this row. */
  laneId?: string;
  /** Assigned after the row is durably visible as `reserving`. */
  sequence?: number;
  /** Fences a reserving row to the lane writer allowed to assign its sequence. */
  reservationWriterId?: string;
  /** Bounded active-lane capacity token. Present only while queued/claimed. */
  activeSlot?: number;
  /** Unique durable admission-order reservation for one conversation lane. */
  admissionSlot?: boolean;
  status: AgentQueuedTurnStatus;
  priority: boolean;
  text: string;
  files?: AgentQueuedTurnFileRef[];
  quotes?: string[];
  manualSkills?: string[];
  expectedPredecessorCreatedAt?: number;
  attempts: number;
  availableAt: Date;
  deliveryKey?: string;
  deliveryState?: AgentQueuedTurnDeliveryState;
  scheduledAt?: Date;
  claimId?: string;
  claimBy?: string;
  claimUntil?: Date;
  /** Durable proof that ordinary admission may have crossed the HTTP boundary. */
  admissionStartedAt?: Date;
  admissionId?: string;
  /** Effective predecessor durably fenced before provider admission begins. */
  admissionEffectivePredecessorCreatedAt?: number;
  /** Durable lineage node fenced with the effective predecessor. */
  admissionLineagePredecessorId?: string;
  /** Version 2 requires accepted and deduplicated execution responses to prove
  * the exact post-invocation source receipt. */
  admissionProtocolVersion?: 2;
  reconciliationAvailableAt?: Date;
  reconciliationClaimId?: string;
  reconciliationClaimBy?: string;
  reconciliationClaimUntil?: Date;
  reconciliationAttempts?: number;
  terminalReceipt?: AgentQueuedTurnTerminalReceipt;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IAgentQueuedTurnDocument extends Omit<IAgentQueuedTurn, "_id">, Document {}
interface IAgentQueuedTurnSequence {
  _id: string;
  user: Types.ObjectId;
  tenantId?: string;
  conversationId: string;
  /** Changes whenever a fully retired lane is recreated. */
  laneId: string;
  value: number;
  /** Visible reservation currently owning `value`; recovery completes it. */
  reservationId?: string;
  writerId?: string;
  writerUntil?: Date;
  retiredAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IAgentQueuedTurnSequenceDocument extends Omit<IAgentQueuedTurnSequence, "_id">, Document<string> {}
interface AgentQueuedTurnRecord extends Omit<IAgentQueuedTurn, "_id" | "createdAt" | "sequence" | "status"> {
  queuedTurnId: string;
  sequence: number;
  status: Exclude<AgentQueuedTurnStatus, "reserving">;
  createdAt: Date;
}
type AgentQueuedTurnActiveRecord = Pick<AgentQueuedTurnRecord, "queuedTurnId" | "conversationId" | "agentId" | "parentMessageId" | "clientRequestId" | "sequence" | "activeSlot" | "status" | "priority" | "text" | "files" | "quotes" | "manualSkills" | "expectedPredecessorCreatedAt" | "attempts" | "availableAt" | "deliveryKey" | "deliveryState" | "scheduledAt" | "createdAt" | "updatedAt" | "terminalReceipt">;
interface AgentQueuedTurnClaim extends AgentQueuedTurnRecord {
  status: "claimed";
  admissionSlot: true;
  claimId: string;
  claimBy: string;
  claimUntil: Date;
}
//#endregion
//#region src/types/schedule.d.ts
interface ISchedule {
  _id?: Types.ObjectId;
  id: string;
  user: Types.ObjectId;
  tenantId?: string;
  name: string;
  prompt: string;
  agent_id: string;
  cadence: TScheduleCadence;
  timezone: string;
  target: "new";
  /** Chat project every run's conversation is filed under. Re-validated at each
  *  fire; a pinned operator project (interface.schedules.projectId) overrides it. */
  chatProjectId?: string;
  file_ids?: string[];
  tools?: string[];
  cron?: string;
  enabled: boolean;
  disabledReason?: ScheduleDisabledReason;
  nextRunAt?: Date;
  leaseUntil?: Date;
  leaseBy?: string;
  claimToken?: string;
  /** Owner-config generation; bumped only by an owner edit. */
  configRevision?: number;
  deleting?: boolean;
  /** Reversible account-deletion suspension. Set at quiesce under a per-attempt token
  *  that snapshots the pre-suspension enabled/next-run state, so a deletion that is
  *  later cancelled restores exactly this row (fenced to its token) instead of leaving
  *  a live user with silently disabled schedules. Distinct from `deleting`, which marks
  *  a row for erasure. */
  deletionSuspension?: {
    token: string;
    enabled: boolean;
    nextRunAt?: Date;
  };
  erased?: boolean;
  erasedAt?: Date;
  slot?: number;
  /** Client-supplied idempotency key of the create that produced this row. */
  clientRequestId?: string;
  /** Digest of the ORIGINAL create payload, stamped at insert and never edited.
  *  Replay matching compares against this rather than mutable schedule state, so a
  *  PATCH landing between the first attempt and its retry cannot fail the retry. */
  clientRequestDigest?: string;
  /** When an erasure sweep last attempted this soft-deleted row; orders the sweep
  *  window so undrainable rows cannot starve the ones behind them. */
  eraseAttemptedAt?: Date;
  lastRun?: {
    conversationId?: string;
    status: ScheduleRunStatus;
    error?: string;
    mcp?: ScheduleMCPOutcome[];
    firedAt: Date;
    /** The OCCURRENCE this projection came from; orders the card against delayed
    *  outcomes (a resumed pause, a reconciler replay) arriving after a newer run. */
    scheduledFor?: Date;
  };
  runCount: number;
  failureCount: number;
  balanceSkipCount: number;
  countedFor?: Date[];
  /** Newest occurrence applied to the streak counters; orders them like the card. */
  countersAsOf?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IScheduleDocument extends Omit<ISchedule, "id" | "_id">, Document {
  id: string;
}
interface IScheduleRun {
  mcp?: ScheduleMCPOutcome[];
  _id?: Types.ObjectId;
  scheduleId: string;
  user: Types.ObjectId;
  tenantId?: string;
  scheduledFor: Date;
  firedAt?: Date;
  conversationId?: string;
  checkpointNamespace?: string;
  status: ScheduleRunStatus;
  error?: string;
  /** Deterministic durable-trigger delivery key for this occurrence, stamped at
  *  reservation (before enqueue). Lets reconciliation read the delivery's live/dead
  *  state instead of orphan-settling a jobless run that is merely deferred (Retry-After)
  *  or that dead-lettered before a generation ever started. */
  deliveryKey?: string;
  /** The destination project THIS occurrence actually used, recorded at reservation
  *  because the schedule-level value can move on (an operator pin redirects later
  *  fires, and a paused run does not block them), leaving the row describing a project
  *  this occurrence's conversation was never filed under.
  *
  *  ALWAYS written, `null` for a deliberately unscoped occurrence: an absent key means
  *  "this row predates the field", which is a different thing from "this run had no
  *  project" and must not be validated as if it were. */
  chatProjectId?: string | null;
  droppedFileIds?: string[];
  durationMs?: number;
  bookkept?: boolean;
  /** Set only by terminal writes; the retention TTL index expires on this field. */
  settledAt?: Date;
  /** Global concurrency slot held while `started`. */
  capacitySlot?: number;
  /** A started row used only to durably settle admission failure bookkeeping. It
  * never dispatched generation work and therefore does not consume capacity. */
  admissionOnly?: boolean;
  /** When an abort was requested; capacity is held until settlement is confirmed. */
  abortRequestedAt?: Date;
  /** Who requested the abort: the interactive Stop route ('stop', which persists a
  *  partial response before the run may settle) or a deletion path ('deletion'). */
  abortSource?: "stop" | "deletion";
  /** Stamped by the interactive Stop route once every write it makes (checkpoint
  *  prune, partial-response save) has landed; the generation owner defers its
  *  terminal settlement until this appears so the run can never leave the active
  *  set while the route is still persisting. */
  abortPersistedAt?: Date;
  /** The schedule's configRevision at claim time. */
  configRevision?: number;
  /** When reconciliation last examined this row; rotates each bounded non-terminal
  *  window so no abandoned row can starve behind a full batch of live runs. */
  reconciledAt?: Date;
  resumeClaimedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IScheduleRunDocument extends Omit<IScheduleRun, "_id">, Document {}
//#endregion
//#region src/types/accessRole.d.ts
type AccessRole = {
  /** e.g., "agent_viewer", "agent_editor" */accessRoleId: string; /** e.g., "Viewer", "Editor" */
  name: string;
  description?: string; /** e.g., 'agent', 'project', 'file' */
  resourceType: string; /** e.g., 1 for read, 3 for read+write */
  permBits: number;
  tenantId?: string;
};
type IAccessRole = AccessRole & Document & {
  _id: Types.ObjectId;
};
//#endregion
//#region src/types/aclEntry.d.ts
type AclEntry = {
  /** The type of principal (PrincipalType.USER, PrincipalType.GROUP, PrincipalType.PUBLIC) */principalType: PrincipalType; /** The ID of the principal (null for PrincipalType.PUBLIC, string for PrincipalType.ROLE) */
  principalId?: Types.ObjectId | string; /** The model name for the principal (`PrincipalModel`) */
  principalModel?: PrincipalModel; /** The type of resource (`ResourceType`) */
  resourceType: ResourceType; /** The ID of the resource */
  resourceId: Types.ObjectId; /** Permission bits for this entry */
  permBits: number; /** Optional role ID for predefined roles */
  roleId?: Types.ObjectId; /** ID of the resource this permission is inherited from */
  inheritedFrom?: Types.ObjectId; /** ID of the user who granted this permission */
  grantedBy?: Types.ObjectId; /** When this permission was granted */
  grantedAt?: Date; /** Optional expiration date for permissions tied to expiring resources */
  expiredAt?: Date;
  tenantId?: string;
};
type IAclEntry = AclEntry & Document & {
  _id: Types.ObjectId;
};
//#endregion
//#region src/types/admin.d.ts
/** Config document as returned by the admin API (no Mongoose internals). */
type AdminConfig = {
  _id: string;
  principalType: PrincipalType;
  principalId: string;
  principalModel: PrincipalModel;
  priority: number;
  overrides: Partial<TCustomConfig>;
  isActive: boolean;
  configVersion: number;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
};
type AdminConfigListResponse = {
  configs: AdminConfig[];
};
type AdminConfigResponse = {
  config: AdminConfig;
};
type AdminConfigDeleteResponse = {
  success: boolean;
};
/**
* High-level domains an audit entry can belong to. The audit log is a
* general-purpose, append-only compliance record; new domains (agent runs,
* tool/MCP calls, config and permission changes, approvals) are added here as
* the surface grows, without reshaping the record.
*/
declare const AUDIT_CATEGORIES: readonly ["grant", "agent_run", "tool_call", "mcp", "config", "permission", "auth", "approval"];
type AuditCategory = (typeof AUDIT_CATEGORIES)[number];
/**
* Single source of truth for the audit-action enum. Actions are namespaced
* `<category>.<verb>` so the registry stays readable as it grows and every
* action maps unambiguously to a category. The Mongoose schema enum and the
* HTTP handler's whitelist both consume this constant so they cannot drift.
*/
declare const AUDIT_ACTIONS: readonly ["grant.assigned", "grant.removed", "permission.insights_assigned", "permission.insights_removed"];
type AuditAction = (typeof AUDIT_ACTIONS)[number];
/** Maps each action to its category so writers never pass both. */
declare const AUDIT_ACTION_CATEGORY: Record<AuditAction, AuditCategory>;
/** Result of the audited operation. Kept first-class instead of being encoded
* into the action so `allowed` vs `denied` vs `failed` is queryable. */
declare const AUDIT_OUTCOMES: readonly ["success", "failure", "denied", "pending"];
type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];
/** Coarse severity for SIEM routing and alerting. */
declare const AUDIT_SEVERITIES: readonly ["info", "warning", "critical"];
type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];
/**
* Who initiated the action. Non-human actors are first-class: a scheduled job,
* an agent acting autonomously, an internal service, or a webhook are all
* representable without forcing a `User` id.
*/
declare const AUDIT_ACTOR_TYPES: readonly ["user", "system", "agent", "service", "schedule", "webhook", "api"];
type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];
/** Primitive metadata values; event-specific payload is a flat string-keyed map
* (e.g. `{ capability }` for grants, `{ runId, triggerType }` for agent runs). */
type AuditMetadataValue = string | number | boolean | null;
type AuditMetadata = Record<string, AuditMetadataValue>;
/** Denormalized actor identity captured at write time. */
type AuditActor = {
  type: AuditActorType;
  /** Stable id (user id, service-account id, agent id); absent for anonymous
  * system events. */
  id?: string;
  /** Display name captured at write time so the record stays readable after the
  * underlying principal is renamed or deleted. */
  name: string;
};
/** Generic target of the action — not principal-locked, so it can describe a
* role, agent, MCP server, config section, etc. */
type AuditTarget = {
  type: string;
  id?: string;
  name?: string;
};
/** Request context for forensic joins and SIEM correlation. */
type AuditContext = {
  /** Correlation id (`x-request-id` / `x-correlation-id`). */requestId?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
};
/** Per-entry tamper-evidence surfaced to readers. The full chain is verifiable
* via the verify endpoint. */
type AuditIntegrity = {
  /** Monotonic per-chain sequence number (1-based). */seq: number; /** SHA-256 of this entry's canonical content linked to `prevHash`. */
  hash: string; /** Hash of the previous entry in the chain (genesis links to a zero hash). */
  prevHash: string;
};
/** SystemGrant document as returned by the admin API. */
type AdminSystemGrant = {
  id: string;
  principalType: PrincipalType;
  principalId: string;
  capability: string;
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
};
/** Audit log entry as returned by the admin API. */
type AdminAuditLogEntry = {
  id: string;
  schemaVersion: number;
  category: AuditCategory;
  action: AuditAction;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  actor: AuditActor;
  target: AuditTarget;
  metadata?: AuditMetadata;
  context?: AuditContext; /** Absent = platform-operator entry; present = tenant-scoped entry. */
  tenantId?: string;
  integrity: AuditIntegrity; /** `createdAt` as an ISO 8601 string. */
  timestamp: string;
};
/** Group as returned by the admin API. */
type AdminGroup = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  topMembers: {
    name: string;
  }[];
  isActive: boolean;
};
/** Member entry as returned by the admin API for group/role membership lists. */
type AdminMember = {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  joinedAt?: string;
};
/** Full user info returned by the admin user list endpoint. */
type AdminUserListItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  provider: string;
  createdAt?: string;
  updatedAt?: string;
};
/** Minimal user info returned by user search endpoints. */
type AdminUserSearchResult = {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
};
//#endregion
//#region src/types/systemGrant.d.ts
type SystemGrant = {
  /** The type of principal — matches PrincipalType enum values */principalType: PrincipalType; /** ObjectId string for user/group, role name string for role */
  principalId: string | Types.ObjectId; /** The capability being granted */
  capability: SystemCapability; /** Absent = platform-operator, present = tenant-scoped */
  tenantId?: string; /** ID of the user who granted this capability */
  grantedBy?: Types.ObjectId; /** When this capability was granted */
  grantedAt?: Date; /** Reserved for future TTL enforcement — time-bounded / temporary grants. */
  expiresAt?: Date;
};
type ISystemGrant = SystemGrant & Document & {
  _id: Types.ObjectId;
};
//#endregion
//#region src/types/auditLog.d.ts
/**
* AuditLog is an append-only, hash-chained compliance record. Enforcement lives
* in `~/schema/auditLog` (immutable fields, pre-update/delete/save hooks) and in
* `~/methods/auditLog` (per-chain hash linking + a unique `{ chainKey, seq }`
* index that serializes concurrent appends). `createdAt` is set explicitly by
* the writer so it is covered by the entry hash.
*/
type AuditLog = {
  /** Record-format version, so future migrations can interpret older rows. */schemaVersion: number;
  category: AuditCategory;
  action: AuditAction;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  actor: AuditActor;
  target: AuditTarget;
  metadata?: AuditMetadata;
  context?: AuditContext; /** Absent = platform-level entry; present = tenant-scoped entry. */
  tenantId?: string;
  /**
  * Always present; equals `tenantId` or the platform sentinel. The hash chain
  * and keyset pagination are scoped to this key, and `{ chainKey, seq }` is the
  * unique index that serializes appends.
  */
  chainKey: string; /** Monotonic per-chain sequence number (1-based). */
  seq: number; /** Hash of the previous entry in the chain; genesis links to the zero hash. */
  prevHash: string; /** SHA-256 over this entry's canonical content (including `seq` and `prevHash`). */
  hash: string;
  createdAt: Date;
};
type IAuditLog = AuditLog & Document & {
  _id: Types.ObjectId;
};
/** Actor as accepted by writers; `id` may be an ObjectId for convenience. */
interface AuditActorInput {
  type: AuditActorType;
  id?: string | Types.ObjectId;
  name: string;
}
/** Target as accepted by writers; `id` may be an ObjectId for convenience. */
interface AuditTargetInput {
  type: string;
  id?: string | Types.ObjectId;
  name?: string;
}
interface RecordAuditEntryInput {
  action: AuditAction;
  /** Derived from `action` when omitted. */
  category?: AuditCategory;
  /** Defaults to `'success'`. */
  outcome?: AuditOutcome;
  /** Defaults to `'warning'` for `failure`/`denied`, else `'info'`. */
  severity?: AuditSeverity;
  actor: AuditActorInput;
  target: AuditTargetInput;
  metadata?: AuditMetadata;
  context?: AuditContext;
  tenantId?: string;
}
/** Options that shape a single audit write. */
interface RecordAuditEntryOptions {
  /**
  * When true, a failed write throws instead of resolving to `null`. Callers
  * that must not proceed without a durable audit record opt in here; the
  * default is fail-open so audit emission never blocks a privileged operation.
  */
  failClosed?: boolean;
}
interface AuditLogFilters {
  search?: string;
  category?: AuditCategory[];
  action?: AuditAction[];
  outcome?: AuditOutcome[];
  severity?: AuditSeverity[];
  /** Exact match on `actor.type`. */
  actorType?: AuditActorType;
  /** Case-insensitive substring match against the denormalized `actor.name`. */
  actorQuery?: string;
  /** Exact match on `target.type`. */
  targetType?: string;
  /** Case-insensitive substring match against the denormalized `target.name`. */
  targetQuery?: string;
  /** Case-insensitive substring match against `metadata.capability`. */
  capability?: string;
  from?: Date;
  to?: Date;
  /** Offset pagination (legacy / random-access). Prefer `cursor`. */
  offset?: number;
  limit?: number;
  /**
  * Keyset cursor: the `seq` of the last entry from the previous page. Results
  * are newest-first, so the next page is `seq < cursor`. Stable under
  * concurrent appends, unlike `offset`.
  */
  cursor?: number;
}
interface AuditLogPage {
  entries: AdminAuditLogEntry[];
  total: number;
  /** Pass as `cursor` to fetch the next page; `null` when the page is the last. */
  nextCursor: number | null;
}
/** Outcome of verifying a chain's tamper-evidence. */
interface AuditChainVerification {
  ok: boolean;
  chainKey: string;
  /** Number of entries inspected. */
  checked: number;
  /** First `seq` where the chain broke (gap, broken link, or hash mismatch). */
  brokenAt?: number;
  reason?: string;
  /** Earliest/latest `seq` present. `firstSeq > 1` indicates a purged prefix. */
  range?: {
    firstSeq: number;
    lastSeq: number;
  };
}
interface PurgeAuditLogOptions {
  /** Delete entries strictly older than this instant (a contiguous prefix). */
  before: Date;
  /** Required safety latch; the purge is a no-op unless explicitly confirmed. */
  confirm: boolean;
}
/** A trusted boundary marker proving a prefix was purged by an authorized
* retention run rather than deleted by an attacker. Persisted by the caller
* (e.g. alongside retention-job records) and passed back to `verifyAuditChain`. */
interface AuditCheckpoint {
  /** Highest `seq` that was purged; the chain resumes at `throughSeq + 1`. */
  throughSeq: number;
  /** Hash of the last purged entry === `prevHash` of the new earliest entry. */
  prevHash: string;
}
interface PurgeAuditLogResult {
  deletedCount: number;
  /** The boundary the verifier must be given to accept the now-shorter chain.
  * Absent when the chain is now empty or nothing was purged. */
  checkpoint?: AuditCheckpoint;
}
interface VerifyAuditChainOptions {
  /** Stop verification early when the caller has gone away. */
  isCancelled?: () => boolean;
  /** Maximum rows to inspect before returning a bounded, non-OK result. */
  maxRows?: number;
  /** When the chain no longer starts at `seq: 1` (a prefix was purged), the
  * verifier requires this boundary to distinguish an authorized retention purge
  * from an attacker deleting the oldest rows. Without it, a non-genesis start
  * fails verification rather than being silently trusted. */
  trustedCheckpoint?: AuditCheckpoint;
}
//#endregion
//#region src/types/group.d.ts
interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  email?: string;
  avatar?: string;
  /** Array of member IDs (stores idOnTheSource values, not ObjectIds) */
  memberIds?: string[];
  source: "local" | "entra";
  /** External ID (e.g., Entra ID) - required for non-local sources */
  idOnTheSource?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
interface CreateGroupRequest {
  name: string;
  description?: string;
  email?: string;
  avatar?: string;
  memberIds?: string[];
  source: "local" | "entra";
  idOnTheSource?: string;
}
interface UpdateGroupRequest {
  name?: string;
  description?: string;
  email?: string;
  avatar?: string;
  memberIds?: string[];
  source?: "local" | "entra" | "ldap";
  idOnTheSource?: string;
}
interface GroupFilterOptions extends CursorPaginationParams {
  search?: string;
  source?: "local" | "entra" | "ldap";
  hasMember?: string;
}
//#endregion
//#region src/types/config.d.ts
/**
* Configuration override for a principal (user, group, or role).
* Stores partial overrides at the TCustomConfig (YAML) level,
* which are merged with the base config before processing through AppService.
*/
type Config = {
  /** The type of principal (user, group, role) */principalType: PrincipalType; /** The ID of the principal (ObjectId for users/groups, string for roles) */
  principalId: Types.ObjectId | string; /** The model name for the principal */
  principalModel: PrincipalModel; /** Priority level for determining merge order (higher = more specific) */
  priority: number; /** Configuration overrides matching librechat.yaml structure */
  overrides: Partial<TCustomConfig>; /** Dot-paths that suppress inherited config values during resolution */
  tombstones?: string[]; /** Whether this config override is currently active */
  isActive: boolean; /** Version number for cache invalidation, auto-increments on overrides change */
  configVersion: number; /** Tenant identifier for multi-tenancy isolation */
  tenantId?: string; /** When this config was created */
  createdAt?: Date; /** When this config was last updated */
  updatedAt?: Date;
};
type IConfig = Config & Document & {
  _id: Types.ObjectId;
};
//#endregion
//#region src/types/mcp.d.ts
/**
* Mongoose document interface for MCP Server
* Extends API interface with Mongoose-specific database fields
*/
interface MCPServerDocument extends Omit<MCPServerDB, "author" | "_id">, Document<Types.ObjectId> {
  normalizedServerName: string;
  author: Types.ObjectId;
  tenantId?: string;
}
//#endregion
//#region src/types/mcpAuthority.d.ts
declare const MCP_AUTHORITY_PROOF_VERSION: 1;
type MCPAuthorityServerSource = "config" | "database";
interface MCPAuthorityBootRevision {
  readonly revision: string;
  readonly digest: string;
}
interface MCPAuthorityTargetBase {
  readonly serverName: string;
  readonly sourceRevision: string;
  readonly expectedCredentialRevision: string;
  readonly expectedOAuthGrantGeneration: string | null;
  readonly resolvedConfig: MCPOptions;
  readonly credentialFields?: readonly string[];
  readonly requiresOAuth?: boolean;
}
type MCPAuthorityTargetInput = MCPAuthorityTargetBase & ({
  readonly source: "config";
  readonly databaseId?: never;
} | {
  readonly source: "database";
  readonly databaseId: string;
});
interface MCPAuthorityResolveInput {
  readonly userId: string;
  readonly tenantId?: string;
  readonly boot: MCPAuthorityBootRevision;
  readonly targets: readonly MCPAuthorityTargetInput[];
  readonly session?: ClientSession;
}
interface MCPAuthorityUserProof {
  readonly userId: string;
  readonly tenantId: string | null;
  readonly role: string;
  readonly provider: string;
  readonly sourceIdentityDigest: string;
  readonly revision: string;
}
interface MCPAuthorityGroupProof {
  readonly id: string;
  readonly source: string;
  readonly sourceIdentityDigest: string;
  readonly revision: string;
}
interface MCPAuthorityConfigProof {
  readonly principalType: string;
  readonly principalId: string;
  readonly present: boolean;
  readonly active: boolean;
  readonly priority: number | null;
  readonly configVersion: number | null;
  readonly mcpOverrideDigest: string | null;
  readonly tombstones: readonly string[];
  readonly revision: string;
}
interface MCPAuthorityRoleProof {
  readonly id: string;
  readonly name: string;
  readonly use: boolean;
  readonly revision: string;
}
interface MCPAuthoritySharedProofV1 {
  readonly user: MCPAuthorityUserProof;
  readonly groups: readonly MCPAuthorityGroupProof[];
  readonly configs: readonly MCPAuthorityConfigProof[];
  readonly role: MCPAuthorityRoleProof;
  readonly boot: MCPAuthorityBootRevision;
  readonly groupsRevision: string;
  readonly configsRevision: string;
  readonly revision: string;
}
interface MCPAuthorityServerProofV1 {
  readonly serverName: string;
  readonly normalizedServerName: string;
  readonly source: MCPAuthorityServerSource;
  readonly databaseId: string | null;
  readonly sourceRevision: string;
  readonly resolvedConfigDigest: string;
  readonly serverRevision: string;
  readonly linkedAgentIds: readonly string[];
  readonly directAccess: boolean;
  readonly agentAccess: boolean;
  readonly authorizationRevision: string;
  readonly credentialFields: readonly string[];
  readonly credentialRevision: string;
  readonly requiresOAuth: boolean;
  readonly oauthGrantGeneration: string | null;
  readonly oauthRevision: string;
  readonly effectivePolicyDigest: string;
  readonly revision: string;
}
interface MCPAuthorityProofV1 {
  readonly version: typeof MCP_AUTHORITY_PROOF_VERSION;
  readonly shared: MCPAuthoritySharedProofV1;
  readonly servers: readonly MCPAuthorityServerProofV1[];
  readonly revision: string;
}
interface MCPAuthorityAssertInput {
  readonly proofs: MCPAuthorityProofV1 | readonly MCPAuthorityProofV1[];
  readonly boot: MCPAuthorityBootRevision;
  readonly session?: ClientSession;
}
interface MCPAuthorityDatabaseMethods {
  resolveMCPAuthorityProof(input: MCPAuthorityResolveInput): Promise<MCPAuthorityProofV1>;
  assertMCPAuthorityProofsCurrent(input: MCPAuthorityAssertInput): Promise<void>;
}
type MCPAuthorityImmutableConfig = Readonly<Pick<TCustomConfig, "mcpServers" | "mcpSettings">>;
type MCPAuthorityRejectionReason = "malformed_input" | "proof_unavailable" | "user_revoked" | "principal_changed" | "groups_changed" | "config_changed" | "mcp_use_revoked" | "role_changed" | "boot_revision_changed" | "server_revoked" | "server_changed" | "access_revoked" | "authorization_changed" | "credential_changed" | "oauth_grant_changed";
//#endregion
//#region src/types/index.d.ts
type ObjectId = Types.ObjectId;
//#endregion
//#region src/app/resolution.d.ts
/**
* Merge DB config overrides into a base AppConfig.
*
* Configs are sorted by priority ascending (lowest first, highest wins).
* Each config's `overrides` is deep-merged into the base config in order.
*/
declare function mergeConfigOverrides(baseConfig: AppConfig, configs: IConfig[]): AppConfig;
/** Whether a runtime-config interface field reads as OFF in either of its two shapes:
*  boolean `false`, or the object form with `use: false`. Exported so runtime gates
*  (e.g. the schedule engine's global stop) apply the same semantics as the merge. */
declare function isRuntimeDisabled(value: unknown): boolean;
//#endregion
//#region src/crypto/index.d.ts
declare function signPayload({
  payload,
  secret,
  expirationTime
}: SignPayloadParams): Promise<string>;
declare function hashToken(str: string): Promise<string>;
/** --- Legacy v1/v2 Setup: AES-CBC with fixed key and IV --- */
/**
* Encrypts a value using AES-CBC
* @param value - The plaintext to encrypt
* @returns The encrypted string in hex format
*/
declare function encrypt(value: string): Promise<string>;
/**
* Decrypts an encrypted value using AES-CBC
* @param encryptedValue - The encrypted string in hex format
* @returns The decrypted plaintext
*/
declare function decrypt(encryptedValue: string): Promise<string>;
/** --- v2: AES-CBC with a random IV per encryption --- */
/**
* Encrypts a value using AES-CBC with a random IV per encryption
* @param value - The plaintext to encrypt
* @returns The encrypted string with IV prepended (iv:ciphertext format)
*/
declare function encryptV2(value: string): Promise<string>;
/**
* Decrypts an encrypted value using AES-CBC with random IV
* @param encryptedValue - The encrypted string in iv:ciphertext format
* @returns The decrypted plaintext
*/
declare function decryptV2(encryptedValue: string): Promise<string>;
/**
* Encrypts a value using AES-256-CTR.
* Note: AES-256 requires a 32-byte key. Ensure that process.env.CREDS_KEY is a 64-character hex string.
* @param value - The plaintext to encrypt.
* @returns The encrypted string with a "v3:" prefix.
*/
declare function encryptV3(value: string): string;
/**
* Decrypts an encrypted value using AES-256-CTR.
* @param encryptedValue - The encrypted string with "v3:" prefix.
* @returns The decrypted plaintext.
*/
declare function decryptV3(encryptedValue: string): string;
/**
* Generates random values as a hex string
* @param length - The number of random bytes to generate
* @returns The random values as a hex string
*/
declare function getRandomValues(length: number): Promise<string>;
/**
* Computes SHA-256 hash for the given input.
* @param input - The input to hash.
* @returns The SHA-256 hash of the input.
*/
declare function hashBackupCode(input: string): Promise<string>;
//#endregion
//#region src/schema/action.d.ts
declare const Action: mongoose.Schema<IAction>;
//#endregion
//#region src/schema/agent.d.ts
declare const agentSchema: Schema<IAgent>;
//#endregion
//#region src/schema/aclEntry.d.ts
declare const aclEntrySchema: Schema<IAclEntry>;
//#endregion
//#region src/schema/agentApiKey.d.ts
interface IAgentApiKey$1 extends Document {
  userId: Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}
declare const agentApiKeySchema: Schema<IAgentApiKey$1>;
//#endregion
//#region src/schema/agentCategory.d.ts
declare const agentCategorySchema: Schema<IAgentCategory>;
//#endregion
//#region src/schema/assistant.d.ts
declare const assistantSchema: Schema<IAssistant>;
//#endregion
//#region src/schema/balance.d.ts
declare const balanceSchema: Schema<IBalance>;
//#endregion
//#region src/schema/banner.d.ts
interface IBanner$1 extends Document {
  bannerId: string;
  message: string;
  displayFrom: Date;
  displayTo?: Date;
  type: "banner" | "popup";
  isPublic: boolean;
  persistable: boolean;
  tenantId?: string;
}
declare const bannerSchema: Schema<IBanner$1>;
//#endregion
//#region src/schema/categories.d.ts
interface ICategory extends Document {
  label: string;
  value: string;
  tenantId?: string;
}
declare const categoriesSchema: Schema<ICategory>;
//#endregion
//#region src/schema/chatProject.d.ts
declare const chatProjectSchema: Schema<IChatProjectDocument>;
//#endregion
//#region src/schema/codeEnvironment.d.ts
declare const codeEnvironmentSchema: Schema<CodeEnvironmentDocument>;
//#endregion
//#region src/schema/conversationTag.d.ts
interface IConversationTag extends Document {
  tag?: string;
  user?: string;
  description?: string;
  count?: number;
  position?: number;
  tenantId?: string;
}
declare const conversationTag: Schema<IConversationTag>;
//#endregion
//#region src/schema/convo.d.ts
declare const convoSchema: Schema<IConversation>;
//#endregion
//#region src/schema/file.d.ts
declare const file: Schema<IMongoFile>;
//#endregion
//#region src/schema/key.d.ts
interface IKey extends Document {
  userId: Types.ObjectId;
  name: string;
  value: string;
  expiresAt?: Date;
  tenantId?: string;
}
declare const keySchema: Schema<IKey>;
//#endregion
//#region src/schema/message.d.ts
declare const messageSchema: Schema<IMessage>;
//#endregion
//#region src/schema/pluginAuth.d.ts
declare const pluginAuthSchema: Schema<IPluginAuth>;
//#endregion
//#region src/schema/preset.d.ts
interface IPreset$1 extends Document {
  presetId: string;
  title: string;
  user: string | null;
  defaultPreset?: boolean;
  order?: number;
  endpoint?: string;
  endpointType?: string;
  model?: string;
  region?: string;
  chatGptLabel?: string;
  examples?: unknown[];
  modelLabel?: string;
  promptPrefix?: string;
  temperature?: number;
  top_p?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  maxTokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  file_ids?: string[];
  resendImages?: boolean;
  promptCache?: boolean;
  promptCacheTtl?: "5m" | "1h";
  thinking?: boolean;
  thinkingBudget?: number;
  effort?: string;
  system?: string;
  resendFiles?: boolean;
  imageDetail?: string;
  agent_id?: string;
  assistant_id?: string;
  instructions?: string;
  stop?: string[];
  isArchived?: boolean;
  iconURL?: string;
  greeting?: string;
  spec?: string;
  tags?: string[];
  tools?: string[];
  maxContextTokens?: number;
  max_tokens?: number;
  reasoning_effort?: string;
  reasoning_summary?: string;
  reasoning_mode?: string;
  reasoning_context?: string;
  verbosity?: string;
  useResponsesApi?: boolean;
  web_search?: boolean;
  url_context?: boolean;
  disableStreaming?: boolean;
  fileTokenLimit?: number;
  tenantId?: string;
}
declare const presetSchema: Schema<IPreset$1>;
//#endregion
//#region src/schema/prompt.d.ts
declare const promptSchema: Schema<IPrompt>;
//#endregion
//#region src/schema/promptGroup.d.ts
declare const promptGroupSchema: Schema<IPromptGroupDocument>;
//#endregion
//#region src/schema/openidRefreshFlight.d.ts
declare const openidRefreshFlightSchema: Schema<IOpenIDRefreshFlight>;
//#endregion
//#region src/schema/refreshTokenBridge.d.ts
declare const refreshTokenBridgeSchema: Schema<IRefreshTokenBridge>;
//#endregion
//#region src/schema/role.d.ts
declare const roleSchema: Schema<IRole>;
//#endregion
//#region src/schema/session.d.ts
declare const sessionSchema: Schema<ISession>;
//#endregion
//#region src/schema/share.d.ts
interface ISharedLink$1 extends Document {
  conversationId: string;
  title?: string;
  user?: string;
  messages?: Types.ObjectId[];
  shareId?: string;
  targetMessageId?: string;
  expiredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
  snapshotFiles?: boolean;
  fileSnapshots?: SharedFileSnapshot[];
}
declare const shareSchema: Schema<ISharedLink$1>;
//#endregion
//#region src/schema/skillSyncCredential.d.ts
declare const skillSyncCredentialSchema: Schema<ISkillSyncCredentialDocument>;
//#endregion
//#region src/schema/skillSyncStatus.d.ts
declare const skillSyncStatusSchema: Schema<ISkillSyncStatusDocument>;
//#endregion
//#region src/schema/token.d.ts
declare const tokenSchema: Schema<IToken>;
//#endregion
//#region src/schema/toolCall.d.ts
interface IToolCallData$1 extends Document {
  conversationId: string;
  messageId: string;
  toolId: string;
  user: Types.ObjectId;
  result?: unknown;
  attachments?: TAttachment[];
  blockIndex?: number;
  partIndex?: number;
  expiredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
declare const toolCallSchema: Schema<IToolCallData$1>;
//#endregion
//#region src/schema/transaction.d.ts
interface ITransaction extends Document {
  user: Types.ObjectId;
  conversationId?: string;
  tokenType: "prompt" | "completion" | "credits";
  model?: string;
  context?: string;
  valueKey?: string;
  rate?: number;
  rawAmount?: number;
  tokenValue?: number;
  inputTokens?: number;
  writeTokens?: number;
  readTokens?: number;
  messageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
}
declare const transactionSchema: Schema<ITransaction>;
//#endregion
//#region src/schema/user.d.ts
declare const userSchema: Schema<IUser>;
//#endregion
//#region src/schema/memory.d.ts
declare function isValidMemoryKey(key: string): boolean;
declare const MemoryEntrySchema: Schema<IMemoryEntry>;
//#endregion
//#region src/schema/favorite.d.ts
declare const toolFavoriteSchema: Schema<IToolFavorite>;
//#endregion
//#region src/schema/group.d.ts
declare const groupSchema: Schema<IGroup>;
//#endregion
//#region src/schema/systemGrant.d.ts
declare const systemGrantSchema: Schema<ISystemGrant>;
//#endregion
//#region src/schema/auditLog.d.ts
/** Sentinel `chainKey` for platform-level (non-tenant) audit entries. */
declare const PLATFORM_CHAIN_KEY = "__platform__";
/** Genesis link: the `prevHash` of the first entry in any chain. */
declare const GENESIS_HASH: string;
/**
* Append-only by schema contract: every field is `immutable`, every
* update-style operation is short-circuited in the pre-hooks below, and there
* is no `updatedAt` — a mutable timestamp would imply mutation is allowed.
* `createdAt` is set explicitly by the writer (not by `timestamps`) so it is
* covered by the per-entry hash. Tamper-evidence beyond these app-layer guards
* comes from the hash chain (`prevHash`/`hash`/`seq`) maintained in
* `~/methods/auditLog`.
*/
declare const auditLogSchema: Schema<IAuditLog>;
//#endregion
//#region src/schema/config.d.ts
declare const configSchema: Schema<IConfig>;
//#endregion
//#region src/schema/triggerDelivery.d.ts
declare const triggerDeliverySchema: Schema<IAgentTriggerDeliveryDocument>;
//#endregion
//#region src/schema/triggerLaneSequence.d.ts
declare const triggerLaneSequenceSchema: Schema<IAgentTriggerLaneSequenceDocument>;
//#endregion
//#region src/schema/triggerUserPurge.d.ts
declare const triggerUserPurgeSchema: Schema<IAgentTriggerUserPurgeDocument>;
//#endregion
//#region src/schema/queuedTurn.d.ts
declare const queuedTurnSchema: Schema<IAgentQueuedTurnDocument>;
//#endregion
//#region src/schema/queuedTurnSequence.d.ts
declare const queuedTurnSequenceSchema: Schema<IAgentQueuedTurnSequenceDocument>;
//#endregion
//#region src/schema/schedule.d.ts
declare const scheduleSchema: Schema<IScheduleDocument>;
//#endregion
//#region src/schema/scheduleRun.d.ts
declare const scheduleRunSchema: Schema<IScheduleRunDocument>;
//#endregion
//#region src/utils/principal.d.ts
/**
* Normalizes a principalId to the correct type for MongoDB queries and storage.
* USER and GROUP principals are stored as ObjectIds; ROLE principals are strings.
* Ensures a string caller ID is cast to ObjectId so it matches documents written
* by `grantCapability` — which always stores user/group IDs as ObjectIds to match
* what `getUserPrincipals` returns.
*/
declare const normalizePrincipalId: (principalId: string | Types.ObjectId, principalType: PrincipalType) => string | Types.ObjectId;
//#endregion
//#region src/utils/string.d.ts
/**
* Escapes special regex characters in a string.
*/
declare function escapeRegExp(str: string): string;
//#endregion
//#region src/utils/tempChatRetention.d.ts
/**
* Default retention period for temporary chats in hours
*/
declare const DEFAULT_RETENTION_HOURS: number;
/**
* Minimum allowed retention period in hours
*/
declare const MIN_RETENTION_HOURS = 1;
/**
* Maximum allowed retention period in hours (1 year = 8760 hours)
*/
declare const MAX_RETENTION_HOURS = 8760;
/**
* Gets the temporary chat retention period from environment variables or config
* @param interfaceConfig - The custom configuration object
* @returns The retention period in hours
*/
declare function getTempChatRetentionHours(interfaceConfig?: AppConfig["interfaceConfig"] | null): number;
/**
* Creates an expiration date for temporary chats
* @param interfaceConfig - The custom configuration object
* @returns The expiration date
*/
declare function createTempChatExpirationDate(interfaceConfig?: AppConfig["interfaceConfig"]): Date;
/** Regular chats fall back to the temporary retention policy for existing configurations. */
declare function createChatExpirationDate(interfaceConfig?: AppConfig["interfaceConfig"], isTemporary?: boolean): Date;
//#endregion
//#region src/utils/retention.d.ts
type RetentionFilterDocument = {
  isTemporary?: boolean | null;
  expiredAt?: Date | null;
};
declare const activeExpirationFilter: <T extends RetentionFilterDocument = RetentionFilterDocument>() => FilterQuery<T>;
declare const legacyPermanentExpirationFilter: <T extends RetentionFilterDocument = RetentionFilterDocument>() => FilterQuery<T>;
declare const buildRetentionVisibilityFilter: <T extends RetentionFilterDocument = RetentionFilterDocument>() => FilterQuery<T>;
declare const createFallbackRetentionDate: (now?: number) => Date;
//#endregion
//#region src/utils/tenantBulkWrite.d.ts
/**
* Tenant-safe wrapper around Mongoose `Model.bulkWrite()`.
*
* Mongoose's `bulkWrite` does not trigger schema-level middleware hooks, so the
* `applyTenantIsolation` plugin cannot intercept it. This wrapper:
*
* 1. **Sanitizes** every update document by stripping `tenantId` unconditionally
*    (both top-level and inside `$set`/`$unset`/`$setOnInsert`/`$rename`).
* 2. **Injects** `tenantId` into operation filters and insert documents when a
*    tenant context is active.
*
* Unlike the query middleware, which throws on cross-tenant values, this wrapper
* strips silently (`strip` mode). Throwing mid-batch would abort the entire write
* for one bad field; the filter injection already scopes every operation to the
* correct tenant.
*
* Behavior:
* - **tenantId present** (normal request): sanitize + inject into filters/documents.
* - **SYSTEM_TENANT_ID**: sanitize only, skip injection (cross-tenant system op).
* - **No tenantId + strict mode**: throws (fail-closed, same as the plugin).
* - **No tenantId + non-strict**: sanitize only, no injection (backward compat).
*/
declare function tenantSafeBulkWrite<T>(model: Model<T>, ops: AnyBulkWriteOperation[], options?: MongooseBulkWriteOptions): Promise<BulkWriteResult>;
//#endregion
//#region src/utils/transactions.d.ts
declare const CANCEL_RATE = 1.15;
/**
* Checks if the connected MongoDB deployment supports transactions
* This requires a MongoDB replica set configuration
*
* Amazon DocumentDB rejects a transaction that touches a collection which does
* not exist ("Feature not supported: non-existent collection in transaction"),
* so a failed first probe materializes the canary and probes once more —
* otherwise engines that fully support transactions would report unsupported
* and silently drop every caller to the non-transactional path. MongoDB allows
* transactional reads of missing collections, so deployments that pass the
* first probe never pay the create and never gain the canary collection. A
* failed create is logged rather than swallowed: on a hardened role it is the
* only visible explanation for a wrong "unsupported" verdict.
*
* @returns True if transactions are supported, false otherwise
*/
declare const supportsTransactions: (mongoose: typeof import("mongoose")) => Promise<boolean>;
/**
* Gets whether the current MongoDB deployment supports transactions
* Caches the result for performance
*
* Concurrent first callers share one in-flight probe instead of each paying
* the session/transaction round trips before the caller-side cache fills.
*
* @returns True if transactions are supported, false otherwise
*/
declare const getTransactionSupport: (mongoose: typeof import("mongoose"), transactionSupportCache: boolean | null) => Promise<boolean>;
//#endregion
//#region src/utils/objectId.d.ts
/** Returns true when `id` is a 24-character hex string (MongoDB ObjectId format). */
declare const isValidObjectIdString: (id: string) => boolean;
//#endregion
//#region src/utils/yaml.d.ts
/**
* Strip a trailing YAML inline comment from an unquoted scalar.
* YAML treats ` # ...` (space before hash) as a comment; `#` without a
* preceding space is part of the value (e.g. `hashtag#foo`). A scalar
* that's entirely a comment (`# nothing yet`) collapses to empty so
* callers can treat it as "no value". Applied narrowly — only to
* boolean fields where the token is a single word — to avoid
* accidentally truncating free-form strings like descriptions that
* might legitimately contain `#`.
*/
declare function stripYamlTrailingComment(value: string): string;
//#endregion
//#region src/utils/stripUIResourceMarkers.d.ts
/** Remove MCP-UI markers only from Markdown text nodes visited by the renderer plugin. */
declare function stripUIResourceMarkers(text: string): string;
declare function stripUIResourceMarkers(text: undefined): undefined;
declare function stripUIResourceMarkers(text: string | undefined): string | undefined;
/** Sanitize only the portion of a legacy message that the client renders as Markdown. */
declare function stripMessageUIResourceMarkers(text: string | undefined, error?: unknown): string | undefined;
/** Sanitize assistant text parts, including arbitrarily nested persisted subagent content. */
declare function sanitizeUIResourceContent(content: unknown, sanitizeTextParts?: boolean): unknown;
//#endregion
//#region src/utils/fading.d.ts
/** Version of the persisted context-fading tier shape; must match `@librechat/agents`. */
declare const AGENT_FADING_TIER_VERSION = 1;
/** Whether a persisted value is a well-formed context-fading tier. */
declare function isAgentFadingTier(value: unknown): value is IAgentFadingTier;
/**
* Whether a persisted value is a well-formed per-agent tier entry. Agent IDs
* are server-generated and unbounded (an ephemeral agent's ID encodes its
* endpoint, model and sender), so only emptiness is rejected.
*/
declare function isAgentFadingTierEntry(value: unknown): value is IAgentFadingTierEntry;
/** Whether a persisted value is a list of per-agent tier entries with unique agent IDs. */
declare function isAgentFadingTierEntries(value: unknown): value is IAgentFadingTierEntry[];
//#endregion
//#region src/utils/retry.d.ts
interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  retryableErrors?: string[];
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}
/**
* Executes an async operation with exponential backoff + jitter retry
* on transient errors (deadlocks, connection resets, lock timeouts).
*
* Designed for FerretDB/DocumentDB operations where concurrent index
* creation or bulk writes can trigger PostgreSQL-level deadlocks.
*/
interface IndexedModel {
  createIndexes: () => Promise<unknown>;
  init?: () => Promise<unknown>;
  modelName: string;
}
interface IndexBuildOptions extends RetryOptions {
  /** Interval between attempts while another build holds the collection. */
  peerBuildPollMs?: number;
  /** Longest wait for another build to finish; unbounded when omitted. */
  peerBuildDeadlineMs?: number;
}
declare function isIndexBuildInProgress(error: unknown): boolean;
/**
* Runs an index build with peer-build polling and transient-error retry, for a
* caller that holds a raw driver collection or a third-party builder rather
* than a Mongoose model. `build` is re-invoked until it settles, so it must be
* idempotent — which every `createIndex` of an existing spec is.
* Use this (or `createIndexesWithRetry`) instead of a raw `createIndex` on
* FerretDB or DocumentDB; the static guard in `methods/documentdb.spec.ts`
* rejects a raw call outside this module.
*/
declare function buildIndexWithRetry<T>(build: () => Promise<T>, label: string, options?: IndexBuildOptions): Promise<T>;
/**
* Creates all indexes for a Mongoose model with deadlock retry.
* Use this instead of raw `model.createIndexes()` on FerretDB or DocumentDB.
*/
declare function createIndexesWithRetry(model: IndexedModel, options?: IndexBuildOptions): Promise<void>;
//#endregion
//#region src/models/queuedTurn.d.ts
declare function createAgentQueuedTurnModel(mongoose: typeof import("mongoose")): Model<IAgentQueuedTurnDocument>;
declare function createAgentQueuedTurnSequenceModel(mongoose: typeof import("mongoose")): Model<IAgentQueuedTurnSequenceDocument>;
//#endregion
//#region src/models/triggerLaneSequence.d.ts
declare function createAgentTriggerLaneSequenceModel(mongoose: typeof import("mongoose")): Model<IAgentTriggerLaneSequenceDocument>;
//#endregion
//#region src/models/schedule.d.ts
declare function createScheduleModel(mongoose: typeof import("mongoose")): Model<IScheduleDocument>;
declare function createScheduleRunModel(mongoose: typeof import("mongoose")): Model<IScheduleRunDocument>;
//#endregion
//#region src/models/skillSyncCredential.d.ts
declare function createSkillSyncCredentialModel(mongoose: typeof import("mongoose")): Model<ISkillSyncCredentialDocument>;
//#endregion
//#region src/models/openidRefreshFlight.d.ts
/**
* Short-lived cross-worker coordination for inline OIDC refreshes. These
* documents are keyed by hashed token/session context and expire via TTL.
*/
declare function createOpenIDRefreshFlightModel(mongoose: typeof import("mongoose")): Model<IOpenIDRefreshFlight>;
//#endregion
//#region src/models/triggerUserPurge.d.ts
declare function createAgentTriggerUserPurgeModel(mongoose: typeof import("mongoose")): Model<IAgentTriggerUserPurgeDocument>;
//#endregion
//#region src/models/refreshTokenBridge.d.ts
/**
* Refresh-token bridges are looked up from unauthenticated refresh requests
* after user context is recovered from a signed cookie. Methods apply explicit
* tenant checks, so automatic tenant isolation would be the wrong boundary here.
*/
declare function createRefreshTokenBridgeModel(mongoose: typeof import("mongoose")): Model<IRefreshTokenBridge>;
//#endregion
//#region src/models/triggerDelivery.d.ts
declare function createAgentTriggerDeliveryModel(mongoose: typeof import("mongoose")): Model<IAgentTriggerDeliveryDocument>;
//#endregion
//#region src/models/skillSyncStatus.d.ts
declare function createSkillSyncStatusModel(mongoose: typeof import("mongoose")): Model<ISkillSyncStatusDocument>;
//#endregion
//#region src/models/conversationTag.d.ts
declare function createConversationTagModel(mongoose: typeof import("mongoose")): Model<IConversationTag>;
//#endregion
//#region src/models/codeEnvironment.d.ts
declare function createCodeEnvironmentModel(mongoose: typeof import("mongoose")): Model<CodeEnvironmentDocument>;
//#endregion
//#region src/models/agentCategory.d.ts
declare function createAgentCategoryModel(mongoose: typeof import("mongoose")): Model<IAgentCategory>;
//#endregion
//#region src/models/chatProject.d.ts
declare function createChatProjectModel(mongoose: typeof import("mongoose")): Model<IChatProjectDocument>;
//#endregion
//#region src/models/agentApiKey.d.ts
declare function createAgentApiKeyModel(mongoose: typeof import("mongoose")): Model<IAgentApiKey$1>;
//#endregion
//#region src/models/transaction.d.ts
declare function createTransactionModel(mongoose: typeof import("mongoose")): Model<ITransaction>;
//#endregion
//#region src/models/promptGroup.d.ts
declare function createPromptGroupModel(mongoose: typeof import("mongoose")): Model<IPromptGroupDocument>;
//#endregion
//#region src/models/systemGrant.d.ts
/**
* SystemGrant is a cross-tenant control plane — its query logic in systemGrant methods
* explicitly handles tenantId conditions (platform-level vs tenant-scoped grants).
* Do NOT apply tenant isolation plugin here; it would inject a hard tenantId equality
* filter that conflicts with the $and/$or logic in hasCapabilityForPrincipals.
*/
declare function createSystemGrantModel(mongoose: typeof import("mongoose")): Model<ISystemGrant>;
//#endregion
//#region src/models/pluginAuth.d.ts
declare function createPluginAuthModel(mongoose: typeof import("mongoose")): Model<IPluginAuth>;
//#endregion
//#region src/models/sharedLink.d.ts
declare function createSharedLinkModel(mongoose: typeof import("mongoose")): Model<ISharedLink$1>;
//#endregion
//#region src/models/accessRole.d.ts
declare function createAccessRoleModel(mongoose: typeof import("mongoose")): Model<IAccessRole>;
//#endregion
//#region src/models/favorite.d.ts
declare function createToolFavoriteModel(mongoose: typeof import("mongoose")): Model<IToolFavorite>;
//#endregion
//#region src/models/mcpServer.d.ts
declare function createMCPServerModel(mongoose: typeof import("mongoose")): Model<MCPServerDocument>;
//#endregion
//#region src/models/assistant.d.ts
declare function createAssistantModel(mongoose: typeof import("mongoose")): Model<IAssistant>;
//#endregion
//#region src/models/skillFile.d.ts
declare function createSkillFileModel(mongoose: typeof import("mongoose")): Model<ISkillFileDocument>;
//#endregion
//#region src/models/convo.d.ts
declare function createConversationModel(mongoose: typeof import("mongoose")): Model<IConversation>;
//#endregion
//#region src/models/toolCall.d.ts
declare function createToolCallModel(mongoose: typeof import("mongoose")): Model<IToolCallData$1>;
//#endregion
//#region src/models/aclEntry.d.ts
declare function createAclEntryModel(mongoose: typeof import("mongoose")): Model<IAclEntry>;
//#endregion
//#region src/models/auditLog.d.ts
/**
* AuditLog is an append-only, hash-chained compliance record.
*
* Like SystemGrant, the tenant-isolation plugin is intentionally not applied:
* every query is scoped by `chainKey` (the JWT-resolved tenantId, or the
* platform sentinel for admin operations outside any tenant), which is also the
* serialization key for the per-tenant hash chain.
*/
declare function createAuditLogModel(mongoose: typeof import("mongoose")): Model<IAuditLog>;
//#endregion
//#region src/models/session.d.ts
declare function createSessionModel(mongoose: typeof import("mongoose")): Model<ISession>;
//#endregion
//#region src/models/balance.d.ts
declare function createBalanceModel(mongoose: typeof import("mongoose")): Model<IBalance>;
//#endregion
//#region src/models/message.d.ts
declare function createMessageModel(mongoose: typeof import("mongoose")): Model<IMessage>;
//#endregion
//#region src/models/action.d.ts
declare function createActionModel(mongoose: typeof import("mongoose")): Model<IAction>;
//#endregion
//#region src/models/banner.d.ts
declare function createBannerModel(mongoose: typeof import("mongoose")): Model<IBanner>;
//#endregion
//#region src/models/preset.d.ts
declare function createPresetModel(mongoose: typeof import("mongoose")): Model<IPreset$1>;
//#endregion
//#region src/models/prompt.d.ts
declare function createPromptModel(mongoose: typeof import("mongoose")): Model<IPrompt>;
//#endregion
//#region src/models/memory.d.ts
declare function createMemoryModel(mongoose: typeof import("mongoose")): Model<IMemoryEntry>;
//#endregion
//#region src/models/config.d.ts
declare function createConfigModel(mongoose: typeof import("mongoose")): Model<IConfig>;
//#endregion
//#region src/models/token.d.ts
declare function createTokenModel(mongoose: typeof import("mongoose")): Model<IToken>;
//#endregion
//#region src/models/agent.d.ts
declare function createAgentModel(mongoose: typeof import("mongoose")): Model<IAgent>;
//#endregion
//#region src/models/skill.d.ts
declare function createSkillModel(mongoose: typeof import("mongoose")): Model<ISkillDocument>;
//#endregion
//#region src/models/group.d.ts
declare function createGroupModel(mongoose: typeof import("mongoose")): Model<IGroup>;
//#endregion
//#region src/models/user.d.ts
declare function createUserModel(mongoose: typeof import("mongoose")): Model<IUser>;
//#endregion
//#region src/models/role.d.ts
declare function createRoleModel(mongoose: typeof import("mongoose")): Model<IRole>;
//#endregion
//#region src/models/file.d.ts
declare function createFileModel(mongoose: typeof import("mongoose")): Model<IMongoFile>;
//#endregion
//#region src/models/key.d.ts
declare function createKeyModel(mongoose: typeof import("mongoose")): Model<IKey>;
//#endregion
//#region src/models/index.d.ts
/**
* Creates all database models for all collections
*/
declare function createModels(mongoose: typeof import("mongoose")): {
  User: ReturnType<typeof createUserModel>;
  Token: ReturnType<typeof createTokenModel>;
  Session: ReturnType<typeof createSessionModel>;
  Balance: ReturnType<typeof createBalanceModel>;
  Conversation: ReturnType<typeof createConversationModel>;
  ChatProject: ReturnType<typeof createChatProjectModel>;
  CodeEnvironment: ReturnType<typeof createCodeEnvironmentModel>;
  Message: ReturnType<typeof createMessageModel>;
  Agent: ReturnType<typeof createAgentModel>;
  AgentApiKey: ReturnType<typeof createAgentApiKeyModel>;
  AgentCategory: ReturnType<typeof createAgentCategoryModel>;
  MCPServer: ReturnType<typeof createMCPServerModel>;
  Role: ReturnType<typeof createRoleModel>;
  Action: ReturnType<typeof createActionModel>;
  Assistant: ReturnType<typeof createAssistantModel>;
  File: ReturnType<typeof createFileModel>;
  Banner: ReturnType<typeof createBannerModel>;
  Key: ReturnType<typeof createKeyModel>;
  PluginAuth: ReturnType<typeof createPluginAuthModel>;
  Transaction: ReturnType<typeof createTransactionModel>;
  Preset: ReturnType<typeof createPresetModel>;
  Prompt: ReturnType<typeof createPromptModel>;
  PromptGroup: ReturnType<typeof createPromptGroupModel>;
  Skill: ReturnType<typeof createSkillModel>;
  SkillFile: ReturnType<typeof createSkillFileModel>;
  SkillSyncCredential: ReturnType<typeof createSkillSyncCredentialModel>;
  SkillSyncStatus: ReturnType<typeof createSkillSyncStatusModel>;
  ConversationTag: ReturnType<typeof createConversationTagModel>;
  SharedLink: ReturnType<typeof createSharedLinkModel>;
  ToolCall: ReturnType<typeof createToolCallModel>;
  MemoryEntry: ReturnType<typeof createMemoryModel>;
  ToolFavorite: ReturnType<typeof createToolFavoriteModel>;
  AccessRole: ReturnType<typeof createAccessRoleModel>;
  AclEntry: ReturnType<typeof createAclEntryModel>;
  SystemGrant: ReturnType<typeof createSystemGrantModel>;
  AuditLog: ReturnType<typeof createAuditLogModel>;
  Group: ReturnType<typeof createGroupModel>;
  Config: ReturnType<typeof createConfigModel>;
  AgentTriggerDelivery: ReturnType<typeof createAgentTriggerDeliveryModel>;
  AgentTriggerLaneSequence: ReturnType<typeof createAgentTriggerLaneSequenceModel>;
  AgentTriggerUserPurge: ReturnType<typeof createAgentTriggerUserPurgeModel>;
  AgentQueuedTurn: ReturnType<typeof createAgentQueuedTurnModel>;
  AgentQueuedTurnSequence: ReturnType<typeof createAgentQueuedTurnSequenceModel>;
  Schedule: ReturnType<typeof createScheduleModel>;
  ScheduleRun: ReturnType<typeof createScheduleRunModel>;
  RefreshTokenBridge: ReturnType<typeof createRefreshTokenBridgeModel>;
  OpenIDRefreshFlight: ReturnType<typeof createOpenIDRefreshFlightModel>;
};
//#endregion
//#region src/methods/role.d.ts
declare class RoleConflictError extends Error {
  constructor(message: string);
}
interface RoleDeps {
  /** Returns a cache store for the given key. Injected from getLogStores. */
  getCache?: (key: string) => CacheStore | undefined;
}
declare function createRoleMethods(mongoose: typeof import("mongoose"), deps?: RoleDeps): {
  listRoles: (options?: {
    limit?: number;
    offset?: number;
  }) => Promise<Pick<IRole, "_id" | "name" | "description">[]>;
  countRoles: () => Promise<number>;
  initializeRoles: () => Promise<void>;
  getRoleByName: (roleName: string, fieldsToSelect?: string | string[] | null) => Promise<IRole>;
  findRolesByNames: (roleNames: string[], fieldsToSelect?: string | string[] | null) => Promise<IRole[]>;
  updateRoleByName: (roleName: string, updates: Partial<IRole>) => Promise<IRole>;
  updateAccessPermissions: (roleName: string, permissionsUpdate: Record<string, Record<string, boolean>>, roleData?: IRole) => Promise<void>;
  migrateRoleSchema: (roleName?: string) => Promise<number>;
  createRoleByName: (roleData: Partial<IRole>) => Promise<IRole>;
  deleteRoleByName: (roleName: string) => Promise<IRole | null>;
  updateUsersByRole: (oldRole: string, newRole: string) => Promise<void>;
  findUserIdsByRole: (roleName: string) => Promise<string[]>;
  updateUsersRoleByIds: (userIds: string[], newRole: string) => Promise<void>;
  listUsersByRole: (roleName: string, options?: {
    limit?: number;
    offset?: number;
  }) => Promise<IUser[]>;
  countUsersByRole: (roleName: string) => Promise<number>;
};
type RoleMethods = ReturnType<typeof createRoleMethods>;
//#endregion
//#region src/methods/openidRefreshFlight.d.ts
declare function createOpenIDRefreshFlightMethods(mongoose: typeof import("mongoose")): {
  acquireOpenIDRefreshFlight: (data: OpenIDRefreshFlightCreateData) => Promise<OpenIDRefreshFlightAcquireResult>;
  completeOpenIDRefreshFlight: (data: OpenIDRefreshFlightCompleteData) => Promise<IOpenIDRefreshFlight | null>;
  renewOpenIDRefreshFlight: (data: OpenIDRefreshFlightRenewData) => Promise<IOpenIDRefreshFlight | null>;
  failOpenIDRefreshFlight: (data: OpenIDRefreshFlightFailData) => Promise<IOpenIDRefreshFlight | null>;
  revokeOpenIDRefreshFlight: (data: OpenIDRefreshFlightRevokeData) => Promise<IOpenIDRefreshFlight | null>;
  claimOpenIDRefreshFlightDelivery: (data: OpenIDRefreshFlightClaimDeliveryData) => Promise<IOpenIDRefreshFlight | null>;
  releaseOpenIDRefreshFlightDelivery: (data: OpenIDRefreshFlightReleaseDeliveryData) => Promise<IOpenIDRefreshFlight | null>;
  findOpenIDRefreshFlight: (query: OpenIDRefreshFlightQuery) => Promise<IOpenIDRefreshFlight | null>;
};
type OpenIDRefreshFlightMethods = ReturnType<typeof createOpenIDRefreshFlightMethods>;
//#endregion
//#region src/methods/mcpAuthorizationFenceRetry.d.ts
interface MCPAuthorizationFenceRetryScope {
  userId: string;
  serverName: string;
}
interface MCPAuthorizationFenceRetryRecord extends MCPAuthorizationFenceRetryScope {
  _id: string;
  tenantId?: string | null;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}
interface RetryVersionInput {
  scope: MCPAuthorizationFenceRetryScope;
  tenantId?: string | null;
  version: string;
}
interface RetryUpsertInput extends RetryVersionInput {
  now: Date;
}
interface RetryDeferInput extends RetryVersionInput {
  updatedAt: Date;
}
/** Owns the raw collection and guarded index lifecycle used by durable MCP fence replay. */
declare function createMCPAuthorizationFenceRetryStorage(mongoose: typeof import("mongoose")): {
  upsert({
    scope,
    tenantId,
    version,
    now
  }: RetryUpsertInput): Promise<void>;
  deleteVersion({
    scope,
    tenantId,
    version
  }: RetryVersionInput): Promise<void>;
  deferVersion({
    scope,
    tenantId,
    version,
    updatedAt
  }: RetryDeferInput): Promise<void>;
  list(limit: number): Promise<MCPAuthorizationFenceRetryRecord[]>;
};
type MCPAuthorizationFenceRetryStorage = ReturnType<typeof createMCPAuthorizationFenceRetryStorage>;
//#endregion
//#region src/methods/refreshTokenBridge.d.ts
declare function createRefreshTokenBridgeMethods(mongoose: typeof import("mongoose")): {
  upsertRefreshTokenBridge: (bridgeData: RefreshTokenBridgeCreateData) => Promise<IRefreshTokenBridge | null>;
  findRefreshTokenBridge: (query: RefreshTokenBridgeQuery) => Promise<IRefreshTokenBridge | null>;
  deleteRefreshTokenBridges: (data: RefreshTokenBridgeDeleteData) => Promise<DeleteResult>;
};
type RefreshTokenBridgeMethods = ReturnType<typeof createRefreshTokenBridgeMethods>;
//#endregion
//#region src/methods/session.d.ts
declare class SessionError extends Error {
  code: string;
  constructor(message: string, code?: string);
}
/** Default refresh token expiry: 7 days in milliseconds */
declare const DEFAULT_REFRESH_TOKEN_EXPIRY: number;
declare function createSessionMethods(mongoose: typeof import("mongoose")): {
  findSession: (params: SessionSearchParams, options?: SessionQueryOptions) => Promise<ISession | null>;
  SessionError: typeof SessionError;
  deleteSession: (params: DeleteSessionParams) => Promise<{
    deletedCount?: number;
  }>;
  createSession: (userId: string, options?: CreateSessionOptions) => Promise<SessionResult>;
  upsertSession: (userId: string, refreshToken: string, options: UpsertSessionOptions) => Promise<ISession>;
  ensureSessionIndexes: () => Promise<void>;
  updateExpiration: (session: ISession | string, newExpiration?: Date, options?: UpdateExpirationOptions) => Promise<ISession>;
  countActiveSessions: (userId: string) => Promise<number>;
  generateRefreshToken: (session: ISession) => Promise<string>;
  deleteAllUserSessions: (userId: string | {
    userId: string;
  }, options?: DeleteAllSessionsOptions) => Promise<{
    deletedCount?: number;
  }>;
};
type SessionMethods = ReturnType<typeof createSessionMethods>;
//#endregion
//#region src/methods/user.d.ts
/** Default JWT session expiry: 15 minutes in milliseconds */
declare const DEFAULT_SESSION_EXPIRY: number;
interface UserMethodDeps {
  getCache?: (key: string) => CacheStore | undefined;
}
/** Factory function that takes mongoose instance and returns the methods */
declare function createUserMethods(mongoose: typeof import("mongoose"), deps?: UserMethodDeps): {
  findUser: (searchCriteria: FilterQuery<IUser>, fieldsToSelect?: string | string[] | null) => Promise<IUser | null>;
  findUsers: (searchCriteria: FilterQuery<IUser>, fieldsToSelect?: string | string[] | null, options?: {
    limit?: number;
    offset?: number;
    sort?: Record<string, 1 | -1>;
  }) => Promise<IUser[]>;
  countUsers: (filter?: FilterQuery<IUser>) => Promise<number>;
  createUser: (data: CreateUserRequest, balanceConfig?: BalanceConfig, disableTTL?: boolean, returnUser?: boolean) => Promise<mongoose.Types.ObjectId | Partial<IUser>>;
  updateUser: (userId: string, updateData: Partial<IUser>) => Promise<IUser | null>;
  claimSamlIdentity: (userId: string, samlId: string, profileData: Pick<Partial<IUser>, "username" | "name">) => Promise<IUser | null>;
  acceptTerms: (userId: string) => Promise<IUser | null>;
  searchUsers: ({
    searchPattern,
    limit,
    fieldsToSelect
  }: {
    searchPattern: string;
    limit?: number;
    fieldsToSelect?: string | string[] | null;
  }) => Promise<{
    _id: mongoose.Types.ObjectId;
    id: string;
    name?: string;
    username?: string;
    email: string;
    emailVerified: boolean;
    password?: string;
    avatar?: string;
    provider: string;
    role?: string;
    googleId?: string;
    facebookId?: string;
    openidId?: string;
    samlId?: string;
    ldapId?: string;
    githubId?: string;
    discordId?: string;
    appleId?: string;
    plugins?: string[];
    openidIssuer?: string;
    twoFactorEnabled?: boolean;
    totpSecret?: string;
    backupCodes?: Array<{
      codeHash: string;
      used: boolean;
      usedAt?: Date | null;
    }>;
    pendingTotpSecret?: string;
    pendingBackupCodes?: Array<{
      codeHash: string;
      used: boolean;
      usedAt?: Date | null;
    }>;
    refreshToken?: Array<{
      refreshToken: string;
    }>;
    expiresAt?: Date;
    termsAccepted?: boolean;
    personalization?: {
      memories?: boolean;
      statefulCodeEnvironment?: import("librechat-data-provider").StatefulCodeEnvironment;
    };
    favorites?: import("librechat-data-provider").TUserFavorite[];
    skillStates?: Record<string, boolean>;
    createdAt?: Date;
    updatedAt?: Date;
    idOnTheSource?: string;
    tenantId?: string;
    federatedTokens?: OIDCTokens;
    openidTokens?: OIDCTokens;
    $locals: Record<string, unknown>;
    $op: "save" | "validate" | "remove" | null;
    $where: Record<string, unknown>;
    baseModelName?: string;
    collection: mongoose.Collection;
    db: mongoose.Connection;
    errors?: mongoose.Error.ValidationError;
    isNew: boolean;
    schema: mongoose.Schema;
  }[]>;
  getUserById: (userId: string, fieldsToSelect?: string | string[] | null) => Promise<IUser | null>;
  generateToken: (user: IUser, expiresIn?: number) => Promise<string>;
  beginAgentTriggerUserDeletion: (userId: string, startedAt: Date) => Promise<"acquired" | "in_progress" | "missing">;
  recoverStaleAgentTriggerUserDeletion: (userId: string, recoveredAt: Date) => Promise<"acquired" | "in_progress" | "missing">;
  cancelAgentTriggerUserDeletion: (userId: string, startedAt: Date) => Promise<boolean>;
  isAgentTriggerPrincipalActive: (userId: string) => Promise<boolean>;
  fenceSubagentAdmission: (userId: string, token: string, fencedUntil: Date) => Promise<void>;
  renewSubagentAdmission: (userId: string, token: string, fencedUntil: Date) => Promise<boolean>;
  releaseSubagentAdmission: (userId: string, token: string) => Promise<void>;
  isSubagentOwnerAdmissible: (userId: string) => Promise<boolean>;
  deleteUserById: (userId: string) => Promise<UserDeleteResult>;
  updateUserPlugins: (userId: string, plugins: string[] | undefined, pluginKey: string, action: "install" | "uninstall") => Promise<IUser | null>;
  toggleUserMemories: (userId: string, memoriesEnabled: boolean) => Promise<IUser | null>;
  updateUserStatefulCodeEnvironment: (userId: string, environment: StatefulCodeEnvironment) => Promise<IUser | null>;
};
type UserMethods = ReturnType<typeof createUserMethods>;
//#endregion
//#region src/methods/file.d.ts
type FileOwnerScope = {
  userId: string;
  tenantId?: string | null;
};
type ExpiredFileQueryOptions = {
  now?: Date;
};
/** Factory function that takes mongoose instance and returns the file methods */
declare function createFileMethods(mongoose: typeof import("mongoose")): {
  getRunFileCandidates: (fileIds: readonly string[], tenantId?: string | null) => Promise<TFile[]>;
  claimRunArtifactFile: (scope: RunArtifactScope) => Promise<RunArtifactClaim>;
  publishRunArtifactFile: (input: PublishRunArtifactInput) => Promise<RunArtifactFile>;
  findRunArtifactFile: (scope: RunArtifactScope) => Promise<RunArtifactFile | null>;
  listRunArtifacts: (scope: RunArtifactRunScope) => Promise<RunArtifactFile[]>;
  findFileById: (file_id: string, options?: Record<string, unknown>) => Promise<IMongoFile | null>;
  getFiles: (filter: FilterQuery<IMongoFile>, _sortOptions?: Record<string, SortOrder> | null, selectFields?: Record<string, 0 | 1> | string | null) => Promise<IMongoFile[] | null>;
  getExpiredFiles: (limit?: number, options?: ExpiredFileQueryOptions) => Promise<IMongoFile[]>;
  incrementFileDeletionAttempts: (file_id: string) => Promise<number>;
  deferExpiredFile: (file_id: string, deletionRetryAt: Date) => Promise<void>;
  getToolFilesByIds: (fileIds: string[], toolResourceSet?: Set<EToolResources>, ownerScope?: FileOwnerScope) => Promise<IMongoFile[]>;
  getCodeGeneratedFiles: (conversationId: string, threadFileIds?: string[], ownerScope?: FileOwnerScope) => Promise<IMongoFile[]>;
  getUserCodeFiles: (fileIds: string[], ownerScope: FileOwnerScope) => Promise<IMongoFile[]>;
  getDeferredProvisionFiles: (fileIds: string[], ownerScope: FileOwnerScope, resources?: {
    code?: boolean;
    search?: boolean;
    codeRouteKey?: string;
    searchNamespaces?: string[];
    hydrateProvisioned?: boolean;
  }) => Promise<IMongoFile[]>;
  claimCodeFile: (data: {
    filename: string;
    conversationId: string;
    file_id: string;
    user: string;
    tenantId?: string | null;
    sourceDispatchedAt?: number;
  }) => Promise<IMongoFile>;
  commitCodeFile: (data: CodeFileCommitData, sourceDispatchedAt?: number) => Promise<boolean>;
  createFile: (data: Partial<IMongoFile>, disableTTL?: boolean) => Promise<IMongoFile | null>;
  updateFile: (data: Partial<IMongoFile> & {
    file_id: string;
  }, extraFilter?: FilterQuery<IMongoFile>) => Promise<IMongoFile | null>;
  updateFileCodeEnvRef: (data: {
    file_id: string;
    routeKey: string;
    ref: CodeEnvRef;
    legacyRef?: CodeEnvRef;
  }) => Promise<IMongoFile | null>;
  addFileEmbeddedEntity: (data: {
    file_id: string;
    entityId: string;
  }) => Promise<IMongoFile | null>;
  updateFileUsage: (data: {
    file_id: string;
    inc?: number;
    user?: string;
    tenantId?: string | null;
  }) => Promise<IMongoFile | null>;
  deleteFile: (file_id: string) => Promise<IMongoFile | null>;
  deleteFiles: (file_ids: string[], user?: string) => Promise<{
    deletedCount?: number;
  }>;
  deleteFileByFilter: (filter: FilterQuery<IMongoFile>) => Promise<IMongoFile | null>;
  batchUpdateFiles: (updates: Array<{
    file_id: string;
    filepath: string;
    storageKey?: string;
    storageRegion?: string;
  }>) => Promise<void>;
  updateFilesUsage: (files: Array<{
    file_id: string;
  }>, fileIds?: string[], options?: {
    user?: string;
    tenantId?: string | null;
  }) => Promise<IMongoFile[]>;
  extendFilesTTL: (fileIds: string[], hold: {
    renewMs: number;
    maxLifetimeMs: number;
  }, owner: {
    user: string;
    tenantId?: string | null;
  }) => Promise<number>;
  sweepOrphanedPreviews: (maxAgeMs?: number) => Promise<number>;
};
type FileMethods = ReturnType<typeof createFileMethods>;
//#endregion
//#region src/methods/token.d.ts
declare function createTokenMethods(mongoose: typeof import("mongoose")): {
  findToken: (query: TokenQuery, options?: QueryOptions) => Promise<IToken | null>;
  createToken: (tokenData: TokenCreateData) => Promise<IToken>;
  updateToken: (query: TokenQuery, updateData: TokenUpdateData) => Promise<IToken | null>;
  deleteTokens: (query: TokenQuery) => Promise<TokenDeleteResult>;
};
type TokenMethods = ReturnType<typeof createTokenMethods>;
//#endregion
//#region src/methods/key.d.ts
/** Factory function that takes mongoose instance and returns the key methods */
declare function createKeyMethods(mongoose: typeof import("mongoose")): {
  getUserKey: (params: {
    userId: string;
    name: string;
  }) => Promise<string>;
  updateUserKey: (params: {
    userId: string;
    name: string;
    value: string;
    expiresAt?: Date | null;
  }) => Promise<unknown>;
  deleteUserKey: (params: {
    userId: string;
    name?: string;
    all?: boolean;
  }) => Promise<unknown>;
  getUserKeyValues: (params: {
    userId: string;
    name: string;
  }) => Promise<Record<string, string>>;
  getUserKeyExpiry: (params: {
    userId: string;
    name: string;
  }) => Promise<{
    expiresAt: Date | "never" | null;
  }>;
};
type KeyMethods = ReturnType<typeof createKeyMethods>;
//#endregion
//#region src/methods/memory.d.ts
declare function createMemoryMethods(mongoose: typeof import("mongoose")): {
  setMemory: ({
    userId,
    key,
    value,
    tokenCount,
    agentId
  }: SetMemoryParams) => Promise<MemoryResult>;
  createMemory: ({
    userId,
    key,
    value,
    tokenCount,
    agentId
  }: SetMemoryParams) => Promise<MemoryResult>;
  deleteMemory: ({
    userId,
    key,
    agentId
  }: DeleteMemoryParams) => Promise<MemoryResult>;
  setMemoryById: (params: SetMemoryByIdParams) => Promise<SetMemoryByIdResult>;
  deleteMemoryById: (params: MemoryByIdParams) => Promise<MemoryResult>;
  getAllUserMemories: (userId: string | Types.ObjectId) => Promise<IMemoryEntryLean[]>;
  getUserMemories: ({
    userId,
    agentId
  }: GetUserMemoriesParams) => Promise<IMemoryEntryLean[]>;
  getFormattedMemories: ({
    userId,
    agentId
  }: GetFormattedMemoriesParams) => Promise<FormattedMemoriesResult>;
  deleteAllUserMemories: (userId: string | Types.ObjectId) => Promise<number>;
};
type MemoryMethods = ReturnType<typeof createMemoryMethods>;
//#endregion
//#region src/methods/favorite.d.ts
declare const MAX_TOOL_FAVORITES = 100;
declare function createToolFavoriteMethods(mongoose: typeof import("mongoose")): {
  getToolFavorites: (userId: string) => Promise<IToolFavoriteLean[]>;
  addToolFavorite: (params: ToolFavoriteParams) => Promise<AddToolFavoriteResult>;
  removeToolFavorite: (params: ToolFavoriteParams) => Promise<RemoveToolFavoriteResult>;
};
type ToolFavoriteMethods = ReturnType<typeof createToolFavoriteMethods>;
//#endregion
//#region src/methods/agentCategory.d.ts
declare function createAgentCategoryMethods(mongoose: typeof import("mongoose")): {
  getActiveCategories: () => Promise<IAgentCategory[]>;
  getCategoriesWithCounts: () => Promise<(IAgentCategory & {
    agentCount: number;
  })[]>;
  getValidCategoryValues: () => Promise<string[]>;
  seedCategories: (categories: Array<{
    value: string;
    label?: string;
    description?: string;
    order?: number;
    custom?: boolean;
  }>) => Promise<import("mongoose").mongo.BulkWriteResult>;
  findCategoryByValue: (value: string) => Promise<IAgentCategory | null>;
  createCategory: (categoryData: Partial<IAgentCategory>) => Promise<IAgentCategory>;
  updateCategory: (value: string, updateData: Partial<IAgentCategory>) => Promise<IAgentCategory | null>;
  deleteCategory: (value: string) => Promise<boolean>;
  findCategoryById: (id: string | Types.ObjectId) => Promise<IAgentCategory | null>;
  getAllCategories: () => Promise<IAgentCategory[]>;
  ensureDefaultCategories: () => Promise<boolean>;
};
type AgentCategoryMethods = ReturnType<typeof createAgentCategoryMethods>;
//#endregion
//#region src/methods/agentApiKey.d.ts
declare function createAgentApiKeyMethods(mongoose: typeof import("mongoose")): {
  createAgentApiKey: (data: AgentApiKeyCreateData) => Promise<AgentApiKeyCreateResult>;
  validateAgentApiKey: (apiKey: string) => Promise<{
    userId: Types.ObjectId;
    keyId: Types.ObjectId;
  } | null>;
  listAgentApiKeys: (userId: string | Types.ObjectId) => Promise<AgentApiKeyListItem[]>;
  deleteAgentApiKey: (keyId: string | Types.ObjectId, userId: string | Types.ObjectId) => Promise<boolean>;
  deleteAllAgentApiKeys: (userId: string | Types.ObjectId) => Promise<number>;
  getAgentApiKeyById: (keyId: string | Types.ObjectId, userId: string | Types.ObjectId) => Promise<AgentApiKeyListItem | null>;
};
type AgentApiKeyMethods = ReturnType<typeof createAgentApiKeyMethods>;
//#endregion
//#region src/methods/mcpServer.d.ts
declare function createMCPServerMethods(mongoose: typeof import("mongoose")): {
  createMCPServer: (data: {
    config: MCPOptions;
    author: string | Types.ObjectId;
    reservedServerNames?: Iterable<string>;
  }) => Promise<MCPServerDocument>;
  findMCPServerByServerName: (serverName: string) => Promise<MCPServerDocument | null>;
  findMCPServerByObjectId: (_id: string | Types.ObjectId) => Promise<MCPServerDocument | null>;
  findMCPServersByAuthor: (authorId: string | Types.ObjectId) => Promise<MCPServerDocument[]>;
  getListMCPServersByIds: ({
    ids,
    otherParams,
    limit,
    after
  }: {
    ids?: Types.ObjectId[];
    otherParams?: RootFilterQuery<MCPServerDocument>;
    limit?: number | null;
    after?: string | null;
  }) => Promise<{
    data: MCPServerDocument[];
    has_more: boolean;
    after: string | null;
  }>;
  getListMCPServersByNames: ({
    names
  }: {
    names: string[];
  }) => Promise<{
    data: MCPServerDocument[];
  }>;
  updateMCPServer: (serverName: string, updateData: {
    config?: MCPOptions;
  }) => Promise<MCPServerDocument | null>;
  deleteMCPServer: (serverName: string) => Promise<MCPServerDocument | null>;
};
type MCPServerMethods = ReturnType<typeof createMCPServerMethods>;
//#endregion
//#region src/methods/codeEnvironment.d.ts
type CreateCodeEnvironmentInput = Pick<CodeEnvironmentDocument, "environmentId" | "name" | "type" | "baseURL" | "controlPlaneId" | "createdBy"> & Pick<Partial<CodeEnvironmentDocument>, "workerId" | "revocationTokenEnv" | "workerPrincipal">;
declare function createCodeEnvironmentMethods(mongoose: typeof import("mongoose")): {
  createCodeEnvironment: (input: CreateCodeEnvironmentInput) => Promise<CodeEnvironmentDocument>;
  createCodeEnvironmentWithinOwnerLimit: (input: CreateCodeEnvironmentInput, maxOwned: number) => Promise<CodeEnvironmentDocument | null>;
  findCodeEnvironmentsByIds: (ids: Array<string | Types.ObjectId>) => Promise<CodeEnvironmentDocument[]>;
  findCodeEnvironmentByEnvironmentId: (environmentId: string) => Promise<CodeEnvironmentDocument | null>;
  updateCodeEnvironmentSettings: (environmentId: string, settings: CodeEnvironmentUserSettings) => Promise<CodeEnvironmentDocument | null>;
  listCodeEnvironmentIds: () => Promise<string[]>;
  findCodeEnvironmentsByCreator: (userId: string | Types.ObjectId) => Promise<CodeEnvironmentDocument[]>;
  deleteCodeEnvironmentById: (id: string | Types.ObjectId) => Promise<CodeEnvironmentDocument | null>;
  discardCodeEnvironmentById: (id: string | Types.ObjectId) => Promise<void>;
  completeCodeEnvironmentRegistration: (id: string | Types.ObjectId) => Promise<void>;
  beginCodeEnvironmentRemoval: (id: string | Types.ObjectId) => Promise<CodeEnvironmentDocument | null>;
  cancelCodeEnvironmentRemoval: (id: string | Types.ObjectId, leaseId: string) => Promise<void>;
  commitCodeEnvironmentRemoval: (id: string | Types.ObjectId, leaseId: string) => Promise<void>;
  deleteUserCodeEnvironments: (userId: string | Types.ObjectId) => Promise<number>;
};
type CodeEnvironmentMethods = ReturnType<typeof createCodeEnvironmentMethods>;
//#endregion
//#region src/methods/pluginAuth.d.ts
declare function createPluginAuthMethods(mongoose: typeof import("mongoose")): {
  findOnePluginAuth: ({
    userId,
    authField,
    pluginKey
  }: FindPluginAuthParams) => Promise<IPluginAuth | null>;
  findPluginAuthsByKeys: ({
    userId,
    pluginKeys
  }: FindPluginAuthsByKeysParams) => Promise<IPluginAuth[]>;
  updatePluginAuth: ({
    userId,
    authField,
    pluginKey,
    value
  }: UpdatePluginAuthParams) => Promise<IPluginAuth>;
  deletePluginAuth: ({
    userId,
    authField,
    pluginKey,
    all
  }: DeletePluginAuthParams) => Promise<DeleteResult>;
  deleteAllUserPluginAuths: (userId: string) => Promise<DeleteResult>;
};
type PluginAuthMethods = ReturnType<typeof createPluginAuthMethods>;
//#endregion
//#region src/methods/accessRole.d.ts
declare function createAccessRoleMethods(mongoose: typeof import("mongoose")): {
  createRole: (roleData: Partial<IAccessRole>) => Promise<IAccessRole>;
  updateRole: (accessRoleId: string | Types.ObjectId, updateData: Partial<IAccessRole>) => Promise<IAccessRole | null>;
  deleteRole: (accessRoleId: string | Types.ObjectId) => Promise<DeleteResult>;
  getAllRoles: () => Promise<IAccessRole[]>;
  findRoleById: (roleId: string | Types.ObjectId) => Promise<IAccessRole | null>;
  seedDefaultRoles: () => Promise<Record<string, IAccessRole>>;
  findRoleByIdentifier: (accessRoleId: string | Types.ObjectId) => Promise<IAccessRole | null>;
  getRoleForPermissions: (resourceType: string, permBits: PermissionBits | RoleBits) => Promise<IAccessRole | null>;
  findRoleByPermissions: (resourceType: string, permBits: PermissionBits | RoleBits) => Promise<IAccessRole | null>;
  findRolesByResourceType: (resourceType: string) => Promise<IAccessRole[]>;
};
type AccessRoleMethods = ReturnType<typeof createAccessRoleMethods>;
//#endregion
//#region src/methods/userGroup.d.ts
interface UserGroupDeps {
  /** Returns the USER_PRINCIPALS cache store when principal caching is enabled. From getLogStores. */
  getCache?: (key: string) => CacheStore | undefined;
  /**
  * Notified after membership caches are invalidated so access caches derived from
  * memberships (e.g. prompt group access IDs) drop their stale entries too.
  */
  onMemberGroupsInvalidated?: () => void | Promise<void>;
}
/**
* Runs cache invalidation immediately, or defers it to commit for transactional
* writes. Mid-transaction invalidation would let concurrent readers re-cache pre-commit
* state with no later correction; deferring keeps the existing entry serving the
* still-committed old memberships until the transaction commits. Aborts discard the queue.
*/
declare function runAfterTransaction(session: ClientSession | undefined, invalidate: () => Promise<void>): Promise<void>;
declare function createUserGroupMethods(mongoose: typeof import("mongoose"), deps?: UserGroupDeps): {
  findGroupById: (groupId: string | Types.ObjectId, projection?: Record<string, 0 | 1>, session?: ClientSession) => Promise<IGroup | null>;
  findGroupByExternalId: (idOnTheSource: string, source?: "entra" | "local", projection?: Record<string, 0 | 1>, session?: ClientSession) => Promise<IGroup | null>;
  findGroupsByExternalIds: (idsOnTheSource: string[], source?: "entra" | "local", session?: ClientSession) => Promise<IGroup[]>;
  findGroupsByNamePattern: (namePattern: string, source?: "entra" | "local" | null, limit?: number, session?: ClientSession) => Promise<IGroup[]>;
  findGroupsByMemberId: (userId: string | Types.ObjectId, session?: ClientSession) => Promise<IGroup[]>;
  createGroup: (groupData: Partial<IGroup>, session?: ClientSession) => Promise<IGroup>;
  upsertGroupByExternalId: (idOnTheSource: string, source: "entra" | "local", updateData: Partial<IGroup>, session?: ClientSession) => Promise<IGroup | null>;
  addUserToGroup: (userId: string | Types.ObjectId, groupId: string | Types.ObjectId, session?: ClientSession) => Promise<{
    user: IUser;
    group: IGroup | null;
  }>;
  removeUserFromGroup: (userId: string | Types.ObjectId, groupId: string | Types.ObjectId, session?: ClientSession) => Promise<{
    user: IUser;
    group: IGroup | null;
  }>;
  removeUserFromAllGroups: (userId: string | Types.ObjectId) => Promise<void>;
  findGroupByQuery: (filter: Record<string, unknown>, session?: ClientSession) => Promise<IGroup | null>;
  updateGroupById: (groupId: string | Types.ObjectId, data: Record<string, unknown>, session?: ClientSession) => Promise<IGroup | null>;
  bulkUpdateGroups: (filter: Record<string, unknown>, update: Record<string, unknown>, options?: {
    session?: ClientSession;
  }) => Promise<import("mongoose").UpdateWriteOpResult>;
  getUserGroups: (userId: string | Types.ObjectId, session?: ClientSession) => Promise<IGroup[]>;
  getUserPrincipals: (params: {
    userId: string | Types.ObjectId;
    role?: string | null;
    idOnTheSource?: string | null;
  }, session?: ClientSession) => Promise<Array<{
    principalType: PrincipalType;
    principalId?: string | Types.ObjectId;
  }>>;
  syncUserEntraGroups: (userId: string | Types.ObjectId, entraGroups: Array<{
    id: string;
    name: string;
    description?: string;
    email?: string;
  }>, session?: ClientSession) => Promise<{
    user: IUser;
    addedGroups: IGroup[];
    removedGroups: IGroup[];
  }>;
  searchPrincipals: (searchPattern: string, limitPerType?: number, typeFilter?: Array<PrincipalType.USER | PrincipalType.GROUP | PrincipalType.ROLE> | null, session?: ClientSession) => Promise<TPrincipalSearchResult[]>;
  calculateRelevanceScore: (item: TPrincipalSearchResult, searchPattern: string) => number;
  sortPrincipalsByRelevance: <T extends {
    _searchScore?: number;
    type: string;
    name?: string;
    email?: string;
  }>(results: T[]) => T[];
  listGroups: (filter?: {
    source?: "local" | "entra";
    search?: string;
    limit?: number;
    offset?: number;
  }, session?: ClientSession) => Promise<IGroup[]>;
  countGroups: (filter?: {
    source?: "local" | "entra";
    search?: string;
  }, session?: ClientSession) => Promise<number>;
  deleteGroup: (groupId: string | Types.ObjectId, session?: ClientSession) => Promise<IGroup | null>;
  removeMemberById: (groupId: string | Types.ObjectId, memberId: string, session?: ClientSession) => Promise<IGroup | null>;
};
type UserGroupMethods = ReturnType<typeof createUserGroupMethods>;
//#endregion
//#region src/methods/aclEntry.d.ts
/**
* Enumerates every `permBits` value (in the range `[0, MAX_PERM_BITS]`) whose
* set bits include all bits in `requiredBits`. Used with a `$in` filter to push
* permission-mask matching down to the database without relying on the
* `$bitsAllSet` query operator, which is not supported by Azure Cosmos DB for
* MongoDB (see issue #12729).
*
* **Invariant:** stored `permBits` values must lie in `[0, MAX_PERM_BITS]`.
* Values with higher-order bits set would never appear in the emitted `$in`
* list and would silently produce false permission denials. The aclEntry
* schema enforces this with a `max` validator; if the `PermissionBits` enum
* grows, `MAX_PERM_BITS` auto-expands from the new enum values.
*
* **Cache safety:** callers sometimes forward user input directly (e.g.
* `req.query.requiredPermission` is parsed and passed through without a range
* check). To prevent the process-global cache from growing unboundedly from
* attacker-supplied integers, any `requiredBits` outside `[0, MAX_PERM_BITS]`
* or with bits set above the max returns a shared frozen empty array and is
* NOT added to the cache. An empty `$in` list correctly matches zero rows,
* which is the right behavior for a request asking for bits the system does
* not recognize.
*
* For the current 5-bit `PermissionBits` enum the worst case is `required = 0`
* which expands to 32 values; the best case (all bits required) expands to 1.
* Results are memoized per `requiredBits` so the expansion runs at most once
* per distinct mask over the process lifetime.
*/
declare function permissionBitSupersets(requiredBits: number): readonly number[];
declare function createAclEntryMethods(mongoose: typeof import("mongoose")): {
  findEntriesByPrincipal: (principalType: string, principalId: string | Types.ObjectId, resourceType?: string) => Promise<IAclEntry[]>;
  findEntriesByResource: (resourceType: string, resourceId: string | Types.ObjectId, session?: ClientSession) => Promise<IAclEntry[]>;
  findEntriesByPrincipalsAndResource: (principalsList: Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>, resourceType: string, resourceId: string | Types.ObjectId) => Promise<IAclEntry[]>;
  hasPermission: (principalsList: Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>, resourceType: string, resourceId: string | Types.ObjectId, permissionBit: number) => Promise<boolean>;
  getEffectivePermissions: (principalsList: Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>, resourceType: string, resourceId: string | Types.ObjectId) => Promise<number>;
  getEffectivePermissionsForResources: (principalsList: Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>, resourceType: string, resourceIds: Array<string | Types.ObjectId>) => Promise<Map<string, number>>;
  grantPermission: (principalType: string, principalId: string | Types.ObjectId | null, resourceType: string, resourceId: string | Types.ObjectId, permBits: number, grantedBy?: string | Types.ObjectId, session?: ClientSession, roleId?: string | Types.ObjectId, expiredAt?: Date) => Promise<IAclEntry | null>;
  revokePermission: (principalType: string, principalId: string | Types.ObjectId | null, resourceType: string, resourceId: string | Types.ObjectId, session?: ClientSession) => Promise<DeleteResult>;
  modifyPermissionBits: (principalType: string, principalId: string | Types.ObjectId | null, resourceType: string, resourceId: string | Types.ObjectId, addBits?: number | null, removeBits?: number | null, session?: ClientSession) => Promise<IAclEntry | null>;
  findAccessibleResources: (principalsList: Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>, resourceType: string, requiredPermBit: number, resourceIds?: Types.ObjectId[], readPrimary?: boolean) => Promise<Types.ObjectId[]>;
  deleteAclEntries: (filter: Record<string, unknown>, options?: {
    session?: ClientSession;
  }) => Promise<DeleteResult>;
  bulkWriteAclEntries: (ops: AnyBulkWriteOperation[], options?: {
    session?: ClientSession;
  }) => Promise<import("mongodb").BulkWriteResult>;
  findPublicResourceIds: (resourceType: string, requiredPermissions: number, resourceIds?: Types.ObjectId[], readPrimary?: boolean) => Promise<Types.ObjectId[]>;
  aggregateAclEntries: (pipeline: PipelineStage[]) => Promise<unknown[]>;
  getSoleOwnedResourceIds: (userObjectId: Types.ObjectId, resourceTypes: string | string[]) => Promise<Types.ObjectId[]>;
};
type AclEntryMethods = ReturnType<typeof createAclEntryMethods>;
//#endregion
//#region src/methods/systemGrant.d.ts
declare function createSystemGrantMethods(mongoose: typeof import("mongoose")): {
  grantCapability: ({
    principalType,
    principalId,
    capability,
    tenantId,
    grantedBy
  }: {
    principalType: PrincipalType;
    principalId: string | Types.ObjectId;
    capability: SystemCapability;
    tenantId?: string;
    grantedBy?: string | Types.ObjectId;
  }, session?: ClientSession) => Promise<{
    grant: ISystemGrant | null;
    created: boolean;
  }>;
  seedSystemGrants: () => Promise<void>;
  revokeCapability: ({
    principalType,
    principalId,
    capability,
    tenantId
  }: {
    principalType: PrincipalType;
    principalId: string | Types.ObjectId;
    capability: SystemCapability;
    tenantId?: string;
  }, session?: ClientSession) => Promise<{
    deletedCount: number;
  }>;
  hasCapabilityForPrincipals: ({
    principals,
    capability,
    tenantId
  }: {
    principals: Array<{
      principalType: PrincipalType;
      principalId?: string | Types.ObjectId;
    }>;
    capability: SystemCapability;
    tenantId?: string;
  }) => Promise<boolean>;
  hasAnyConfigReadAccess: ({
    principals,
    tenantId
  }: {
    principals: Array<{
      principalType: PrincipalType;
      principalId?: string | Types.ObjectId;
    }>;
    tenantId?: string;
  }) => Promise<boolean>;
  getHeldCapabilities: ({
    principals,
    capabilities,
    tenantId
  }: {
    principals: Array<{
      principalType: PrincipalType;
      principalId?: string | Types.ObjectId;
    }>;
    capabilities: SystemCapability[];
    tenantId?: string;
  }) => Promise<Set<SystemCapability>>;
  listGrants: (options?: {
    tenantId?: string;
    principalTypes?: PrincipalType[];
    limit?: number;
    offset?: number;
  }) => Promise<ISystemGrant[]>;
  countGrants: (options?: {
    tenantId?: string;
    principalTypes?: PrincipalType[];
  }) => Promise<number>;
  getCapabilitiesForPrincipal: ({
    principalType,
    principalId,
    tenantId
  }: {
    principalType: PrincipalType;
    principalId: string | Types.ObjectId;
    tenantId?: string;
  }) => Promise<ISystemGrant[]>;
  getCapabilitiesForPrincipals: ({
    principals,
    tenantId
  }: {
    principals: Array<{
      principalType: PrincipalType;
      principalId: string | Types.ObjectId;
    }>;
    tenantId?: string;
  }) => Promise<ISystemGrant[]>;
  deleteGrantsForPrincipal: (principalType: PrincipalType, principalId: string | Types.ObjectId, options?: {
    tenantId?: string;
    session?: ClientSession;
  }) => Promise<ISystemGrant[]>;
};
type SystemGrantMethods = ReturnType<typeof createSystemGrantMethods>;
//#endregion
//#region src/methods/auditLog.d.ts
declare const MAX_AUDIT_LOG_LIMIT = 500;
/**
* Upper bound on rows emitted by the CSV export stream. At 100k rows per tenant
* per export request, a careless admin script (or a hostile auditor) can keep a
* cursor and a Node worker busy without saturating either; beyond that, exports
* should be sliced by `from`/`to`.
*/
declare const MAX_AUDIT_EXPORT_ROWS = 1e5;
/**
* Upper bound on rows verified in a single HTTP-triggered integrity check. Full
* offline jobs can pass a larger value explicitly when needed.
*/
declare const MAX_AUDIT_VERIFY_ROWS = 1e5;
/** Record-format version stamped on every new entry. */
declare const AUDIT_SCHEMA_VERSION = 1;
interface AuditLogMethods {
  recordAuditEntry: (input: RecordAuditEntryInput, options?: RecordAuditEntryOptions) => Promise<IAuditLog | null>;
  listAuditLogPage: (tenantId: string | undefined, filters: AuditLogFilters) => Promise<AuditLogPage>;
  findAuditLogEntry: (tenantId: string | undefined, id: string) => Promise<AdminAuditLogEntry | null>;
  streamAuditLogEntries: (tenantId: string | undefined, filters: Omit<AuditLogFilters, "offset" | "limit" | "cursor">, onEntry: (entry: AdminAuditLogEntry) => void | Promise<void>, options?: {
    isCancelled?: () => boolean;
    maxRows?: number;
  }) => Promise<{
    count: number;
    truncated: boolean;
  }>;
  verifyAuditChain: (tenantId: string | undefined, options?: VerifyAuditChainOptions) => Promise<AuditChainVerification>;
  purgeAuditLogEntries: (tenantId: string | undefined, options: PurgeAuditLogOptions) => Promise<PurgeAuditLogResult>;
}
//#endregion
//#region src/methods/share.d.ts
interface SharedLinkContentSnapshot {
  readonly title: string;
  readonly messages: readonly IMessage[];
}
type SharedLinkContentPreflight = (snapshot: SharedLinkContentSnapshot) => void | Promise<void>;
type SharedMessagesPreflight = (snapshot: SharedMessagesResult) => void | Promise<void>;
interface GetSharedMessagesOptions {
  readonly snapshotFiles?: boolean;
  /**
  * Runs against the exact public projection before a legacy file snapshot is
  * persisted. This keeps a policy-rejected read side-effect free.
  */
  readonly preflight?: SharedMessagesPreflight;
}
/** Factory function that takes mongoose instance and returns the methods */
declare function createShareMethods(mongoose: typeof import("mongoose")): {
  getSharedLink: (user: string, conversationId: string) => Promise<GetShareLinkResult>;
  getSharedLinks: (user: string, pageParam?: Date | string, pageSize?: number, sortBy?: string, sortDirection?: string, search?: string) => Promise<SharedLinksResult>;
  createSharedLink: (user: string, conversationId: string, targetMessageId?: string, expiredAt?: Date, snapshotFiles?: boolean, preflight?: SharedLinkContentPreflight) => Promise<CreateShareResult>;
  updateSharedLink: (user: string, shareId: string, targetMessageId?: string, expiredAt?: Date | null, snapshotFiles?: boolean, preflight?: SharedLinkContentPreflight, beforePublish?: () => void | Promise<void>) => Promise<UpdateShareResult>;
  deleteSharedLink: (user: string, shareId: string) => Promise<DeleteShareResult | null>;
  getSharedMessages: (shareId: string, shareObjectId?: string, options?: GetSharedMessagesOptions) => Promise<SharedMessagesResult | null>;
  getSharedLinkFile: (shareId: string, fileId: string) => Promise<{
    file: SharedFileSnapshot | null;
    hasSnapshots: boolean;
    optedOut: boolean;
  }>;
  backfillSharedLinkFiles: (shareId: string, fileId?: string) => Promise<SharedFileSnapshot | SharedFileSnapshot[] | null>;
  deleteAllSharedLinks: (user: string) => Promise<DeleteAllSharesResult & {
    deletedIds: string[];
  }>;
  deleteConvoSharedLink: (user: string, conversationId: string) => Promise<DeleteAllSharesResult & {
    deletedIds: string[];
  }>;
};
type ShareMethods = ReturnType<typeof createShareMethods>;
//#endregion
//#region src/methods/action.d.ts
declare function createActionMethods(mongoose: typeof import("mongoose")): {
  getActions: (query: ActionQuery, includeSensitive?: boolean) => Promise<IAction[]>;
  updateAction: (query: ActionQuery, updateData: Partial<IAction>) => Promise<IAction | null>;
  deleteAction: (query: ActionQuery) => Promise<IAction | null>;
  deleteActions: (query: ActionQuery) => Promise<number>;
};
type ActionMethods = ReturnType<typeof createActionMethods>;
//#endregion
//#region src/methods/assistant.d.ts
declare function createAssistantMethods(mongoose: typeof import("mongoose")): {
  updateAssistantDoc: (query: AssistantQuery, updateData: Partial<IAssistant>) => Promise<IAssistant | null>;
  deleteAssistant: (query: AssistantQuery) => Promise<IAssistant | null>;
  deleteAssistants: (query: AssistantQuery) => Promise<number>;
  getAssistants: (query: AssistantQuery, select?: string | Record<string, number> | null) => Promise<IAssistant[]>;
  getAssistant: (query: AssistantQuery, projection?: ProjectionType<IAssistant>) => Promise<IAssistant | null>;
  ensureAssistantIndexes: () => Promise<void>;
};
type AssistantMethods = ReturnType<typeof createAssistantMethods>;
//#endregion
//#region src/methods/banner.d.ts
declare function createBannerMethods(mongoose: typeof import("mongoose")): {
  getBanner: (user?: IUser | null) => Promise<IBanner | null>;
};
type BannerMethods = ReturnType<typeof createBannerMethods>;
//#endregion
//#region src/methods/toolCall.d.ts
interface IToolCallData {
  messageId?: string;
  conversationId?: string;
  user?: string;
  [key: string]: unknown;
}
declare function createToolCallMethods(mongoose: typeof import("mongoose")): {
  createToolCall: (toolCallData: IToolCallData) => Promise<IToolCallData>;
  updateToolCall: (id: string, updateData: Partial<IToolCallData>) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    messageId?: string | undefined;
    conversationId?: string | undefined;
    user?: string | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  }) | null>;
  deleteToolCalls: (userId: string, conversationId?: string) => Promise<import("mongodb").DeleteResult>;
  getToolCallById: (id: string) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    messageId?: string | undefined;
    conversationId?: string | undefined;
    user?: string | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  }) | null>;
  getToolCallsByConvo: (conversationId: string, userId: string) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    messageId?: string | undefined;
    conversationId?: string | undefined;
    user?: string | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  })[]>;
  getToolCallsByMessage: (messageId: string, userId: string) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    messageId?: string | undefined;
    conversationId?: string | undefined;
    user?: string | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  })[]>;
};
type ToolCallMethods = ReturnType<typeof createToolCallMethods>;
//#endregion
//#region src/methods/categories.d.ts
type CategoryOption = {
  label: string;
  value: string;
};
declare function createCategoriesMethods(_mongoose: typeof import("mongoose")): {
  getCategories: () => Promise<CategoryOption[]>;
};
type CategoriesMethods = ReturnType<typeof createCategoriesMethods>;
//#endregion
//#region src/methods/preset.d.ts
interface IPreset {
  user?: string;
  presetId?: string;
  order?: number;
  defaultPreset?: boolean;
  tools?: (string | {
    pluginKey?: string;
  })[];
  updatedAt?: Date;
  [key: string]: unknown;
}
declare function createPresetMethods(mongoose: typeof import("mongoose")): {
  getPreset: (user: string, presetId: string) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    user?: string | undefined;
    presetId?: string | undefined;
    order?: number | undefined;
    defaultPreset?: boolean | undefined;
    tools?: (string | {
      pluginKey?: string | undefined;
    })[] | undefined;
    updatedAt?: Date | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  }) | {
    message: string;
  } | null>;
  getPresets: (user: string, filter?: Record<string, unknown>) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    user?: string | undefined;
    presetId?: string | undefined;
    order?: number | undefined;
    defaultPreset?: boolean | undefined;
    tools?: (string | {
      pluginKey?: string | undefined;
    })[] | undefined;
    updatedAt?: Date | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  })[] | {
    message: string;
  }>;
  savePreset: (user: string, {
    presetId,
    newPresetId,
    defaultPreset,
    ...preset
  }: {
    presetId?: string;
    newPresetId?: string;
    defaultPreset?: boolean;
    [key: string]: unknown;
  }) => Promise<IPreset | {
    message: string;
  }>;
  deletePresets: (user: string, filter?: Record<string, unknown>) => Promise<import("mongodb").DeleteResult>;
};
type PresetMethods = ReturnType<typeof createPresetMethods>;
//#endregion
//#region src/methods/conversationTag.d.ts
declare function createConversationTagMethods(mongoose: typeof import("mongoose")): {
  getConversationTags: (user: string) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    user: string;
    tag: string;
    description?: string | undefined;
    position: number;
    count: number;
    createdAt?: Date | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  })[]>;
  createConversationTag: (user: string, data: {
    tag: string;
    description?: string;
    addToConversation?: boolean;
    conversationId?: string;
  }) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    user: string;
    tag: string;
    description?: string | undefined;
    position: number;
    count: number;
    createdAt?: Date | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  }) | null>;
  updateConversationTag: (user: string, oldTag: string, data: {
    tag?: string;
    description?: string;
    position?: number;
  }) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    user: string;
    tag: string;
    description?: string | undefined;
    position: number;
    count: number;
    createdAt?: Date | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  }) | null>;
  deleteConversationTag: (user: string, tag: string) => Promise<(import("mongoose").FlattenMaps<{
    [x: string]: unknown;
    user: string;
    tag: string;
    description?: string | undefined;
    position: number;
    count: number;
    createdAt?: Date | undefined;
  }> & {
    _id: import("mongoose").Types.ObjectId;
  } & {
    __v: number;
  }) | null>;
  deleteConversationTags: (filter: Record<string, unknown>) => Promise<number>;
  bulkIncrementTagCounts: (user: string, tags: string[]) => Promise<void>;
  updateTagsForConversation: (user: string, conversationId: string, tags: string[]) => Promise<string[]>;
};
type ConversationTagMethods = ReturnType<typeof createConversationTagMethods>;
//#endregion
//#region src/methods/import.d.ts
interface ConversationImportCleanupScope {
  user: string;
  conversationIds: readonly string[];
  tenantId?: string;
}
interface ConversationImportMethods {
  deleteImportedMessages(scope: ConversationImportCleanupScope): Promise<void>;
  deleteImportedConversations(scope: ConversationImportCleanupScope): Promise<void>;
}
//#endregion
//#region src/models/plugins/mongoMeili.d.ts
interface MeiliIndexable {
  [key: string]: unknown;
  _meiliIndex?: boolean;
  _meiliIndexAttempted?: boolean;
  _meiliIndexVersion?: string;
  _meiliIndexSchemaVersion?: number;
  _meiliCleanupVersion?: number;
}
interface SyncProgress {
  lastSyncedId?: string;
  totalProcessed: number;
  totalDocuments: number;
  pendingIndexing: number;
  pendingCleanup: number;
  isComplete: boolean;
}
interface _DocumentWithMeiliIndex extends Document {
  _meiliIndex?: boolean;
  _meiliIndexAttempted?: boolean;
  _meiliIndexVersion?: string;
  _meiliIndexSchemaVersion?: number;
  _meiliCleanupVersion?: number;
  isTemporary?: boolean;
  expiredAt?: Date | null;
  preprocessObjectForIndex?: () => Record<string, unknown>;
  addObjectToMeili?: (next: CallbackWithoutResultAndOptionalError) => Promise<void>;
  updateObjectToMeili?: (next: CallbackWithoutResultAndOptionalError) => Promise<void>;
  deleteObjectFromMeili?: (next: CallbackWithoutResultAndOptionalError) => Promise<void>;
  postSaveHook?: (next: CallbackWithoutResultAndOptionalError) => Promise<void>;
  postUpdateHook?: (next: CallbackWithoutResultAndOptionalError) => Promise<void> | void;
  postRemoveHook?: (next: CallbackWithoutResultAndOptionalError) => Promise<void> | void;
}
type DocumentWithMeiliIndex = _DocumentWithMeiliIndex & IConversation & Partial<IMessage>;
interface SchemaWithMeiliMethods extends Model<DocumentWithMeiliIndex> {
  syncWithMeili(): Promise<void>;
  getSyncProgress(): Promise<SyncProgress>;
  processSyncBatch(index: Index<MeiliIndexable>, documents: Array<Record<string, unknown>>): Promise<void>;
  cleanupExcludedMeiliIndex(): Promise<void>;
  cleanupMeiliIndex(index: Index<MeiliIndexable>, primaryKey: string, batchSize: number, delayMs: number): Promise<void>;
  setMeiliIndexSettings(settings: Record<string, unknown>): Promise<unknown>;
  meiliSearch(q: string, params?: SearchParams, populate?: boolean): Promise<SearchResponse<MeiliIndexable, Record<string, unknown>>>;
}
//#endregion
//#region src/methods/message.d.ts
type StoredSubagentControlReceipt = NonNullable<NonNullable<IMessage["subagentTask"]>["controlReceipts"]>[number];
/**
* Maximum private transcript JSON that may cross the MongoDB projection seam
* for the bounded public subagent-activity view. This gives the sanitizer
* enough source headroom while preventing multi-megabyte transcripts from
* being materialized merely to produce a 64 KiB public activity response.
*/
declare const SUBAGENT_TRANSCRIPT_SOURCE_BYTE_LIMIT: number;
declare const CLIENT_MESSAGE_SELECT: string;
interface MessageQueryOptions {
  limit?: number;
  sort?: Record<string, 1 | -1> | false;
}
type SubagentTaskResultClaim = {
  status: "not_found";
} | {
  status: "claimed";
  message: IMessage;
} | {
  status: "acquired";
  message: IMessage;
};
interface BackgroundToolResultRecord {
  taskId: string;
  toolCallId: string;
  toolName: string;
  status: "completed" | "error" | "cancelled";
  output: string;
  agentId?: string;
}
type BackgroundToolResultClaim = {
  status: "not_found" | "not_ready";
} | {
  status: "outcome_unknown";
  toolName: string;
} | {
  status: "claimed";
  claim?: {
    kind: "manual" | "wakeup";
    claimId: string;
    generationId?: string;
  };
  messageId?: string;
} | {
  status: "acquired";
  results: BackgroundToolResultRecord[];
  messageId?: string;
};
type SubagentThreadViewMessageRecord = Pick<IMessage, "messageId" | "parentMessageId" | "isCreatedByUser" | "text" | "createdAt" | "error" | "unfinished" | "subagentTranscript" | "subagentTriggerProjection"> & {
  textProjectionTruncated?: boolean;
  subagentTranscriptProjectionTruncated?: boolean; /** Storage-bounded visible content; validated into the public activity type by the API. */
  subagentActivity?: unknown[];
  subagentActivityProjectionJson?: string;
  subagentActivityProjectionTruncated?: boolean; /** Storage-bounded task state; private replay and execution fields never cross this seam. */
  subagentTask?: {
    status?: NonNullable<IMessage["subagentTask"]>["status"];
    controlReceipts?: Array<Omit<StoredSubagentControlReceipt, "fingerprint"> & {
      fingerprint?: never;
    }>;
    controlReceiptsProjectionTruncated?: boolean;
  };
};
type ParentSubagentTaskRecord = {
  conversationId: string; /** The shared bounded source window filled, so this child's history may be incomplete. */
  sourceTruncated?: boolean;
  tasks: Array<Pick<IMessage, "messageId" | "createdAt"> & {
    status: NonNullable<IMessage["subagentTask"]>["status"]; /** True when status was inferred from an ordinary event-turn row. */
    statusDerived?: boolean; /** Private ordering token used only while merging bounded storage reads. */
    occurrenceId?: Types.ObjectId;
  }>;
};
/** A response message whose run was sampled into a trace. */
interface SampledTraceMessage {
  messageId: string;
  createdAt?: Date;
  /** Opaque ids of the tracing destinations eligible to hold the trace, when recorded. */
  langfuseDestinationIds?: string[];
  /** The run whose trace this response reports, when it is not the message's own id. */
  langfuseRunId?: string;
  /** Opaque position in the conversation's response order, which a later read can resume from. */
  orderKey?: string;
}
interface ConversationTraceRefs {
  /** Creation time of the user's earliest message in the conversation. */
  firstMessageAt?: Date;
  /** Sampled response messages, oldest first. */
  sampledMessages: SampledTraceMessage[];
}
interface MessageMethods {
  saveMessage(ctx: {
    userId: string;
    isTemporary?: boolean;
    expiredAt?: Date;
    interfaceConfig?: AppConfig["interfaceConfig"];
  }, params: Omit<Partial<IMessage>, "contextMeta"> & {
    newMessageId?: string;
    contextMeta?: IMessage["contextMeta"] | null;
  }, metadata?: {
    context?: string;
  }): Promise<IMessage | null | undefined>;
  /**
  * Reads the references a trace viewer needs for one of the user's
  * conversations: when it began and which responses were sampled into traces.
  */
  getConversationTraceRefs(input: {
    user: string;
    conversationId: string;
    tenantId?: string; /** Only this response, when it is a sampled one. */
    messageId?: string; /** The newest response to include, by the `orderKey` a previous read returned for it. */
    through?: {
      messageId: string;
      orderKey: string;
    }; /** The most responses to return, newest first from `through`; all of them when absent. */
    limit?: number;
  }): Promise<ConversationTraceRefs>;
  /**
  * Whether any of the user's responses in the conversation was sampled into a
  * trace that one of `destinationIds` can hold. A response with no recorded
  * destinations predates the record and counts for every destination.
  */
  hasSampledTraceMessage(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    destinationIds: string[];
  }): Promise<boolean>;
  recordSubagentTaskControlReceipt(input: {
    userId: string;
    conversationId: string;
    taskId: string;
    tenantId?: string;
    receipt: NonNullable<NonNullable<IMessage["subagentTask"]>["controlReceipts"]>[number];
  }): Promise<boolean | "unchanged" | "conflict">;
  getSubagentTaskControlReceipt(input: {
    userId: string;
    conversationId: string;
    taskId: string;
    invocationId: string;
    tenantId?: string;
  }): Promise<NonNullable<NonNullable<IMessage["subagentTask"]>["controlReceipts"]>[number] | null>;
  getSubagentTaskControlReplay(input: {
    userId: string;
    parentConversationId: string;
    taskId: string;
    invocationId: string;
    tenantId?: string;
  }): Promise<{
    receipt: NonNullable<NonNullable<IMessage["subagentTask"]>["controlReceipts"]>[number];
    task: {
      taskId: string;
      threadId: string;
      subagentType: string;
      status: NonNullable<IMessage["subagentTask"]>["status"];
      resultAvailable: boolean;
      resultClaimed: boolean;
      pendingControls: number;
      createdAt: Date;
      updatedAt: Date;
    };
  } | null>;
  bulkSaveMessages(messages: Array<Partial<IMessage>>, overrideTimestamp?: boolean): Promise<unknown>;
  recordMessage(params: {
    user: string;
    endpoint?: string;
    messageId: string;
    conversationId?: string;
    parentMessageId?: string;
    [key: string]: unknown;
  }): Promise<IMessage | null>;
  updateMessageText(userId: string, params: {
    messageId: string;
    text: string;
  }): Promise<void>;
  updateToolCallResult(params: {
    userId: string;
    messageId: string;
    conversationId: string;
    toolCallId: string;
    stepId?: string;
    agentId?: string;
    output?: string;
    attachments?: unknown[];
    markBackgrounded?: boolean;
    backgroundTask?: {
      taskId: string;
      toolName: string;
      status: "completed" | "error";
      cancelled?: true;
      settledAt: Date;
      completionWakeup?: true;
      resultClaim?: {
        kind: "manual" | "wakeup";
        claimId: string;
        claimedAt: Date;
        generationId?: string;
      };
    };
  }): Promise<{
    matched: boolean;
    unfinished: boolean;
  }>;
  claimBackgroundToolResults(params: {
    userId: string;
    conversationId: string; /** Optional on recovery polls after the process-local task registry was lost. */
    messageId?: string;
    taskId: string;
    agentId?: string;
    kind: "manual" | "wakeup";
    claimId: string; /** Response generation that owns this manual result delivery. */
    generationId?: string; /** Manual owner-process takeover after automatic delivery was retired. */
    allowUnfinished?: boolean;
    limit?: number;
  }): Promise<BackgroundToolResultClaim>;
  releaseBackgroundToolResultClaims(params: {
    userId: string;
    conversationId: string;
    messageId: string; /** Omit to release every sibling owned by this exact batch claim. */
    taskIds?: string[];
    kind: "manual" | "wakeup";
    claimId: string;
  }): Promise<boolean>;
  updateMessage(userId: string, message: Partial<IMessage> & {
    newMessageId?: string;
  }, metadata?: {
    context?: string;
  }): Promise<Partial<IMessage>>;
  claimSubagentTaskResult(params: {
    userId: string;
    conversationId: string;
    taskId: string;
    kind: "manual" | "wakeup";
    claimId: string;
  }): Promise<SubagentTaskResultClaim>;
  releaseSubagentTaskResultClaim(params: {
    userId: string;
    conversationId: string;
    taskId: string;
    kind: "manual" | "wakeup";
    claimId: string;
  }): Promise<boolean>;
  deleteMessagesSince(userId: string, params: {
    messageId: string;
    conversationId: string;
  }): Promise<DeleteResult>;
  getMessages(filter: FilterQuery<IMessage>, select?: string, options?: MessageQueryOptions): Promise<IMessage[]>;
  getMessagesForSubagentThreadView(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    selectedTaskId?: string;
    beforeMessageId?: string;
    limit: number;
    textCodePointLimit: number;
  }): Promise<SubagentThreadViewMessageRecord[]>;
  listSubagentTasksForThreads(input: {
    user: string;
    conversationIds: string[];
    tenantId?: string;
    limitPerThread: number;
  }): Promise<ParentSubagentTaskRecord[]>;
  getMessage(params: {
    user: string;
    messageId: string;
  }): Promise<IMessage | null>;
  getMessagesByCursor(filter: FilterQuery<IMessage>, options?: {
    sortField?: string;
    sortOrder?: 1 | -1;
    limit?: number;
    cursor?: string | null;
  }): Promise<{
    messages: IMessage[];
    nextCursor: string | null;
  }>;
  searchMessages(query: string, searchOptions: SearchParams, hydrate?: boolean): Promise<Awaited<ReturnType<SchemaWithMeiliMethods["meiliSearch"]>>>;
  deleteMessages(filter: FilterQuery<IMessage>): Promise<DeleteResult>;
}
//#endregion
//#region src/methods/conversation.d.ts
type SubagentThreadReadRecord = Pick<IConversation, "conversationId" | "tenantId" | "title" | "agent_id" | "updatedAt" | "subagentThread" | "subagentThreadLease"> & {
  actorId?: string;
};
type ParentSubagentThreadRecord = SubagentThreadReadRecord;
type AgentEventActorCommitResult = {
  status: "committed";
  state: IAgentEventActorState;
  prunableCheckpoint?: IAgentEventActorCheckpoint;
} | {
  status: "stale";
  state?: IAgentEventActorState;
};
interface AgentEventActorSettlementAuthority {
  suspensionId: string;
  attempt: number;
  resumeAttemptId: string;
}
interface AgentEventActorReconciliationStorageMetrics {
  pending: number;
  oldestPendingAgeSeconds: number;
}
interface ConversationMethods {
  getConvoFiles(conversationId: string): Promise<string[]>;
  searchConversation(conversationId: string, fieldsToSelect?: string | null): Promise<IConversation | null>;
  deleteNullOrEmptyConversations(): Promise<{
    conversations: {
      deletedCount?: number;
    };
    messages: {
      deletedCount?: number;
    };
  }>;
  saveConvo(ctx: {
    userId: string;
    isTemporary?: boolean;
    expiredAt?: Date;
    interfaceConfig?: AppConfig["interfaceConfig"];
  }, data: {
    conversationId: string;
    newConversationId?: string;
    [key: string]: unknown;
  }, metadata?: {
    context?: string;
    unsetFields?: Record<string, number>;
    noUpsert?: boolean;
    createdAtOnInsert?: Date;
    preserveUpdatedAt?: boolean; /** Same-tenant persisted agent already resolved by the request layer. */
    initialAgentId?: string | null;
    /** `_id`s of messages this save just wrote. When present, they are appended with
    *  `$addToSet` and the O(n) read-and-rewrite of the `messages` array is skipped;
    *  every save without this option still rebuilds the array from the database. */
    appendMessageIds?: Types.ObjectId[];
  }): Promise<IConversation | {
    message: string;
  } | null>;
  setConvoPinned(user: string, conversationId: string, pinned: boolean): Promise<IConversation | null>;
  replaceConvoCodeEnvironmentDecision(params: {
    user: string;
    conversationId: string;
    expected: Pick<IConversation, "codeEnvironmentMode" | "codeWorkspaces">;
    codeWorkspaces: NonNullable<IConversation["codeWorkspaces"]>;
  }): Promise<IConversation | null>;
  bulkSaveConvos(conversations: Array<Record<string, unknown>>): Promise<unknown>;
  getConvosByCursor(user: string, options?: {
    cursor?: string | null;
    limit?: number;
    isArchived?: boolean;
    pinned?: boolean;
    tags?: string[];
    search?: string;
    sortBy?: string;
    sortDirection?: string;
    projectId?: string;
  }): Promise<{
    conversations: IConversation[];
    nextCursor: string | null;
  }>;
  getConvosQueried(user: string, convoIds: Array<{
    conversationId: string;
  }> | null, cursor?: string | null, limit?: number): Promise<{
    conversations: IConversation[];
    nextCursor: string | null;
    convoMap: Record<string, unknown>;
  }>;
  getConvo(user: string, conversationId: string): Promise<IConversation | null>;
  getSubagentThreadForParent(input: {
    user: string;
    parentConversationId: string;
    conversationId: string;
    tenantId?: string;
  }): Promise<SubagentThreadReadRecord | null>;
  listSubagentThreadsForParent(input: {
    user: string;
    parentConversationId: string;
    tenantId?: string;
    limit: number;
  }): Promise<ParentSubagentThreadRecord[]>;
  getAgentEventBinding(input: {
    user: string;
    bindingId: string;
    sourceKeyId: string;
    tenantId?: string;
  }): Promise<IAgentEventBindingRecord | null>;
  getAgentEventActorSnapshot(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
  }): Promise<IAgentEventActorSnapshot | undefined>;
  commitAgentEventActorState(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    invocationId: string;
    action: IAgentEventActorReconciliation["action"];
    expected?: IAgentEventActorState;
    expectedEpoch: number;
    checkpoint: IAgentEventActorCheckpoint;
    contextFingerprint?: IAgentEventActorState["contextFingerprint"];
    skillManifest?: IAgentEventActorState["skillManifest"];
    discoveredToolNames?: IAgentEventActorState["discoveredToolNames"];
    summary?: IAgentEventActorState["summary"];
    contextMeta?: IAgentEventActorState["contextMeta"];
    compactionSemanticIndex?: IAgentEventActorState["compactionSemanticIndex"];
    settlementAuthority?: AgentEventActorSettlementAuthority;
  }): Promise<AgentEventActorCommitResult>;
  storeAgentEventActorSuspension(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    suspension: IAgentEventActorSuspensionEvidence;
    kind?: "human_decision" | "internal_completion";
    appliedAction?: {
      toolName: string;
      toolCallId?: string;
    };
    handlingGenerationCreatedAt?: number;
    actionId: string;
    jobCreatedAt: number; /** The segment applied its expected action before publishing this successor pause. */
    invalidateHead?: boolean;
    previous?: AgentEventActorSettlementAuthority;
  }): Promise<{
    status: "stored" | "stale";
  }>;
  claimAgentEventActorSuspension(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    suspensionId: string;
    attempt: number;
    actionId: string;
    jobCreatedAt: number;
    resumeAttemptId: string;
  }): Promise<{
    status: "claimed" | "stale";
  }>;
  settleAgentEventActorSuspension(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    suspensionId: string;
    attempt: number;
    resumeAttemptId: string;
    invocationId: string;
    checkpoint: IAgentEventActorReconciliation["checkpoint"];
  }): Promise<{
    status: "settled" | "stale";
  }>;
  cancelAgentEventActorSuspension(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    suspensionId: string;
    attempt: number;
    invocationId: string;
    checkpoint: IAgentEventActorReconciliation["checkpoint"]; /** Exact orphaned resume claim proven not to have entered provider execution. */
    claimedResumeAttemptId?: string;
  }): Promise<{
    status: "cancelled" | "stale";
  }>;
  beginAgentEventActorLegacyTurn(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    token: string;
  }): Promise<boolean>;
  completeAgentEventActorLegacyTurn(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    token: string;
  }): Promise<boolean>;
  recordAgentEventActorReconciliation(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    reconciliation: IAgentEventActorReconciliation;
  }): Promise<boolean>;
  resolveAgentEventActorReconciliation(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    invocationId: string;
    checkpoint: IAgentEventActorReconciliation["checkpoint"];
    expectedActionAdmitted?: boolean;
    resolution: "checkpoint_verified" | "action_compensated" | "history_repaired" | "invocation_abandoned";
  }): Promise<boolean>;
  clearAgentEventActorReconciliation(input: {
    user: string;
    conversationId: string;
    tenantId?: string;
    invocationId: string;
    checkpoint: IAgentEventActorReconciliation["checkpoint"];
    resolution: "checkpoint_verified" | "action_compensated" | "history_repaired";
  }): Promise<boolean>;
  getAgentEventActorReconciliationStorageMetrics(now: Date): Promise<AgentEventActorReconciliationStorageMetrics>;
  expireLegacyAgentEventActorReceipts(now: Date, limit?: number): Promise<number>;
  reserveSubagentThread(input: {
    user: string;
    conversationId: string;
    conversation: Partial<IConversation>;
    tenantId?: string;
  }): Promise<ISubagentThreadReservation>;
  acquireSubagentThreadLease(input: {
    user: string;
    conversationId: string;
    token: string;
    taskId: string;
    now: Date;
    expiresAt: Date;
    tenantId?: string;
  }): Promise<boolean>;
  renewSubagentThreadLease(input: {
    user: string;
    conversationId: string;
    token: string;
    now: Date;
    expiresAt: Date;
    tenantId?: string;
  }): Promise<boolean>;
  releaseSubagentThreadLease(input: {
    user: string;
    conversationId: string;
    token: string;
    tenantId?: string;
  }): Promise<boolean>;
  countActiveSubagentThreadLeases(input: {
    user: string;
    now: Date;
    tenantId?: string;
  }): Promise<number>;
  listActiveSubagentThreadLeases(input: {
    user: string;
    now: Date;
    tenantId?: string;
  }): Promise<IActiveSubagentThreadLease[]>;
  getConvoOwnership(user: string, conversationId: string, tenantId?: string | null): Promise<Pick<IConversation, "user" | "tenantId" | "subagentThread"> | null>;
  getConvoRetention(user: string, conversationId: string): Promise<Pick<IConversation, "expiredAt" | "isTemporary"> | null>;
  getConvoTitle(user: string, conversationId: string): Promise<string | null>;
  deleteConvos(user: string, filter: FilterQuery<IConversation>, options?: {
    beforeDelete?: (conversationIds: string[]) => Promise<void>;
    allowEmpty?: boolean;
  }): Promise<DeleteResult & {
    messages: DeleteResult;
    conversationIds: string[];
  }>;
  archiveAllConvos(user: string): Promise<{
    archivedCount: number;
  }>;
}
//#endregion
//#region src/methods/chatProject.d.ts
type ChatProjectSortBy = "name" | "createdAt" | "lastConversationAt";
type ChatProjectSortDirection = "asc" | "desc";
type CreateChatProjectInput = {
  name: string;
  description?: string | null;
};
type UpdateChatProjectInput = Partial<CreateChatProjectInput>;
type ListChatProjectsOptions = {
  cursor?: string | null;
  limit?: number;
  sortBy?: ChatProjectSortBy;
  sortDirection?: ChatProjectSortDirection;
  search?: string;
};
type ListChatProjectsResult = {
  projects: IChatProject[];
  nextCursor: string | null;
};
type DeleteChatProjectResult = {
  deletedCount: number;
  modifiedCount: number;
};
type AssignConversationToProjectResult = {
  conversation: IConversation;
  previousProjectId: string | null;
  projectId: string | null;
};
interface ChatProjectMethods {
  createChatProject(user: string, input: CreateChatProjectInput): Promise<IChatProject>;
  getChatProject(user: string, projectId: string): Promise<IChatProject | null>;
  listChatProjects(user: string, options?: ListChatProjectsOptions): Promise<ListChatProjectsResult>;
  updateChatProject(user: string, projectId: string, input: UpdateChatProjectInput): Promise<IChatProject | null>;
  deleteChatProject(user: string, projectId: string): Promise<DeleteChatProjectResult>;
  assignConversationToProject(user: string, conversationId: string, projectId: string | null): Promise<AssignConversationToProjectResult | null>;
  refreshChatProjectStats(user: string, projectId: string): Promise<IChatProject | null>;
}
//#endregion
//#region src/methods/tx.d.ts
/**
* Token Pricing Configuration
*
* Pattern Matching
* ================
* `findMatchingPattern` uses `modelName.includes(key)` and selects the **longest**
* matching key. If a key's length equals the model name's length (exact match), it
* returns immediately — no further keys are checked.
*
* For keys of different lengths, definition order does not affect the result — the
* longest match always wins. For **same-length ties**, the function iterates in
* reverse, so the last-defined key wins. Key ordering therefore matters for:
* 1. **Performance**: list older/legacy models first, newer models last — newer
*    models are more commonly used and will match earlier in the reverse scan.
* 2. **Same-length tie-breaking**: when two keys of equal length both match,
*    the last-defined key wins.
*/
interface TxDeps {
  /** From @librechat/api — matches a model name to a canonical key. */
  matchModelName: (model: string, endpoint?: string) => string | undefined;
  /** From @librechat/api — finds the longest key in `values` whose key is a substring of `model`. */
  findMatchingPattern: (model: string, values: Record<string, number | Record<string, number>>) => string | undefined;
}
declare const defaultRate = 6;
/**
* Mapping of model token sizes to their respective multipliers for prompt and completion.
* The rates are 1 USD per 1M tokens.
*/
declare const tokenValues: Record<string, {
  prompt: number;
  completion: number;
}>;
/**
* Mapping of model token sizes to their respective multipliers for cached input, read and write.
* The rates are 1 USD per 1M tokens.
*/
declare const cacheTokenValues: Record<string, {
  write: number;
  read: number;
}>;
/**
* Premium (tiered) pricing for models whose rates change based on prompt size.
*/
declare const premiumTokenValues: Record<string, {
  threshold: number;
  prompt: number;
  completion: number;
}>;
declare function createTxMethods(_mongoose: typeof import("mongoose"), txDeps: TxDeps): {
  tokenValues: Record<string, {
    prompt: number;
    completion: number;
  }>;
  premiumTokenValues: Record<string, {
    threshold: number;
    prompt: number;
    completion: number;
  }>;
  getValueKey: (model: string, endpoint?: string) => string | undefined;
  getMultiplier: ({
    model,
    valueKey,
    endpoint,
    tokenType,
    inputTokenCount,
    endpointTokenConfig
  }: {
    model?: string;
    valueKey?: string;
    endpoint?: string;
    tokenType?: "prompt" | "completion";
    inputTokenCount?: number;
    endpointTokenConfig?: Record<string, Record<string, number>>;
  }) => number;
  getPremiumRate: (valueKey: string, tokenType: string, inputTokenCount?: number | null) => number | null;
  getCacheMultiplier: ({
    valueKey,
    cacheType,
    model,
    endpoint,
    endpointTokenConfig,
    inputTokenCount
  }: {
    valueKey?: string;
    cacheType?: "write" | "read";
    model?: string;
    endpoint?: string;
    endpointTokenConfig?: Record<string, Record<string, number>>;
    inputTokenCount?: number | null;
  }) => number | null;
  defaultRate: number;
  cacheTokenValues: Record<string, {
    write: number;
    read: number;
  }>;
};
type TxMethods = ReturnType<typeof createTxMethods>;
//#endregion
//#region src/methods/transaction.d.ts
type MultiplierParams = {
  model?: string;
  valueKey?: string;
  tokenType?: "prompt" | "completion";
  inputTokenCount?: number;
  endpointTokenConfig?: Record<string, Record<string, number>>;
};
type CacheMultiplierParams = {
  cacheType?: "write" | "read";
  model?: string;
  endpointTokenConfig?: Record<string, Record<string, number>>;
  inputTokenCount?: number;
};
/** Input data for creating a transaction */
interface TxData {
  user: string | Types.ObjectId;
  conversationId?: string;
  model?: string;
  context?: string;
  tokenType?: "prompt" | "completion" | "credits";
  rawAmount?: number;
  valueKey?: string;
  endpointTokenConfig?: Record<string, Record<string, number>> | null;
  inputTokenCount?: number;
  inputTokens?: number;
  writeTokens?: number;
  readTokens?: number;
  balance?: {
    enabled?: boolean;
  };
  transactions?: {
    enabled?: boolean;
  };
}
/** Return value from a successful transaction that also updates the balance */
interface TransactionResult {
  rate: number;
  user: string;
  balance: number;
  prompt?: number;
  completion?: number;
  credits?: number;
}
declare function createTransactionMethods(mongoose: typeof import("mongoose"), txMethods: {
  getMultiplier: (params: MultiplierParams) => number;
  getCacheMultiplier: (params: CacheMultiplierParams) => number | null;
}): {
  updateBalance: ({
    user,
    incrementValue,
    setValues
  }: {
    user: string;
    incrementValue: number;
    setValues?: IBalanceUpdate;
  }) => Promise<IBalance>;
  bulkInsertTransactions: (docs: TransactionData[]) => Promise<void>;
  findBalanceByUser: (user: string, options?: {
    includeReservedCredits?: boolean;
  }) => Promise<IBalance | null>;
  upsertBalanceFields: (user: string, fields: IBalanceUpdate, insertOnly?: IBalanceUpdate) => Promise<IBalance | null>;
  getTransactions: (filter: FilterQuery<ITransaction>) => Promise<ITransaction[]>;
  deleteTransactions: (filter: FilterQuery<ITransaction>) => Promise<import("mongodb").DeleteResult>;
  deleteBalances: (filter: FilterQuery<IBalance>) => Promise<import("mongodb").DeleteResult>;
  createTransaction: (_txData: TxData) => Promise<TransactionResult | undefined>;
  reserveBalance: (request: BalanceReservationRequest) => Promise<BalanceReservationResult | null>;
  renewBalanceReservation: (params: BalanceReservationRenewal) => Promise<void>;
  releaseBalanceReservation: (params: BalanceReservationRelease) => Promise<void>;
  createStructuredTransaction: (_txData: TxData) => Promise<TransactionResult | undefined>;
};
type TransactionMethods = ReturnType<typeof createTransactionMethods>;
//#endregion
//#region src/methods/spendTokens.d.ts
/** Base transaction context passed by callers — does not include fields added internally */
interface SpendTxData {
  user: string | import("mongoose").Types.ObjectId;
  conversationId?: string;
  model?: string;
  context?: string;
  endpointTokenConfig?: Record<string, Record<string, number>> | null;
  balance?: {
    enabled?: boolean;
  };
  transactions?: {
    enabled?: boolean;
  };
  valueKey?: string;
}
declare function createSpendTokensMethods(_mongoose: typeof import("mongoose"), transactionMethods: {
  createTransaction: (txData: TxData) => Promise<TransactionResult | undefined>;
  createStructuredTransaction: (txData: TxData) => Promise<TransactionResult | undefined>;
}): {
  spendTokens: (txData: SpendTxData, tokenUsage: {
    promptTokens?: number;
    completionTokens?: number;
  }) => Promise<void>;
  spendStructuredTokens: (txData: SpendTxData, tokenUsage: {
    promptTokens?: {
      input?: number;
      write?: number;
      read?: number;
    };
    completionTokens?: number;
  }) => Promise<{
    prompt: TransactionResult | undefined;
    completion: TransactionResult | undefined;
  }>;
};
type SpendTokensMethods = ReturnType<typeof createSpendTokensMethods>;
//#endregion
//#region src/methods/prompt.d.ts
interface PromptMethods {
  getPromptGroups(filter: Record<string, unknown>): Promise<{
    promptGroups: Record<string, unknown>[];
    pageNumber: string;
    pageSize: string;
    pages: string;
  } | {
    message: string;
  }>;
  deletePromptGroup(params: {
    _id: string;
  }): Promise<{
    message: string;
  }>;
  getAllPromptGroups(filter: Record<string, unknown>): Promise<Record<string, unknown>[] | {
    message: string;
  }>;
  getListPromptGroupsByAccess(params: {
    accessibleIds?: Types.ObjectId[];
    otherParams?: Record<string, unknown>;
    limit?: number | null;
    after?: string | null;
  }): Promise<{
    object: "list";
    data: Record<string, unknown>[];
    first_id: string | null;
    last_id: string | null;
    has_more: boolean;
    after: string | null;
  }>;
  incrementPromptGroupUsage(groupId: string): Promise<{
    numberOfGenerations: number;
  }>;
  createPromptGroup(saveData: {
    prompt: Record<string, unknown>;
    group: Record<string, unknown>;
    author: string;
    authorName: string;
  }): Promise<{
    prompt: Record<string, unknown> | null;
    group: Record<string, unknown>;
  }>;
  savePrompt(saveData: {
    prompt: Record<string, unknown>;
    author: string | Types.ObjectId;
  }): Promise<{
    prompt: IPrompt;
  } | {
    message: string;
  }>;
  getPrompts(filter: Record<string, unknown>): Promise<Record<string, unknown>[] | {
    message: string;
  }>;
  getPrompt(filter: Record<string, unknown>): Promise<Record<string, unknown> | null | {
    message: string;
  }>;
  getRandomPromptGroups(filter: {
    skip: number | string;
    limit: number | string;
  }): Promise<{
    prompts: unknown[];
  } | {
    message: string;
  }>;
  getPromptGroupsWithPrompts(filter: Record<string, unknown>): Promise<Record<string, unknown> | null | {
    message: string;
  }>;
  getPromptGroup(filter: Record<string, unknown>): Promise<Record<string, unknown> | null>;
  getOwnedPromptGroupIds(author: string, readPrimary?: boolean): Promise<Types.ObjectId[]>;
  getPromptGroupAccessContext(params: {
    userId: string;
    role?: string;
  }): Promise<{
    accessibleIds: Types.ObjectId[];
    publiclyAccessibleIds: Types.ObjectId[];
    ownedPromptGroupIds: Types.ObjectId[];
  }>;
  invalidatePromptGroupAccessContext(): Promise<void>;
  deletePrompt(params: {
    promptId: string | Types.ObjectId;
    groupId: string | Types.ObjectId;
  }): Promise<{
    prompt: string;
    promptGroup?: {
      message: string;
      id: string | Types.ObjectId;
    };
  }>;
  deleteUserPrompts(userId: string): Promise<void>;
  updatePromptGroup(filter: Record<string, unknown>, data: Record<string, unknown>): Promise<IPromptGroupDocument | {
    message: string;
  }>;
  makePromptProduction(promptId: string): Promise<{
    message: string;
  }>;
  updatePromptLabels(_id: string, labels: unknown): Promise<{
    message: string;
  }>;
}
//#endregion
//#region src/methods/skill.d.ts
/** ---------- Validation helpers (pure) ---------- */
/**
* A single validation issue emitted by a skill validator. Most issues are
* errors and block the mutation; some are warnings (e.g. "description is
* awfully short, the agent may undertrigger the skill") that surface inline
* coaching without rejecting the request.
*/
type ValidationIssue = {
  field: string;
  code: string;
  message: string;
  /**
  * Defaults to `'error'` when omitted. Errors cause `createSkill` /
  * `updateSkill` to throw with code `SKILL_VALIDATION_FAILED`; warnings
  * are surfaced on successful responses so the UI can show inline feedback.
  */
  severity?: "error" | "warning";
};
/** Partition an issue list into blocking errors and non-blocking warnings. */
declare function partitionIssues(issues: ValidationIssue[]): {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};
declare function validateSkillName(name: unknown): ValidationIssue[];
declare function validateSkillDescription(description: unknown): ValidationIssue[];
declare function validateSkillBody(body: unknown): ValidationIssue[];
declare function getCanonicalSkillFrontmatterKey(key: string): string | undefined;
declare function normalizeSkillFrontmatterKeys(frontmatter: Record<string, unknown>): {
  frontmatter: Record<string, unknown>;
} | {
  error: string;
};
/**
* Validate a skill's structured YAML frontmatter. Known keys are type-checked
* against `FRONTMATTER_KIND`; `hooks`, `metadata` and `references` fall back to
* a shallow JSON-safety check because their full schemas live outside this
* module. Unknown keys are reported as warnings, not errors: authors regularly
* carry keys from other tooling, and failing the skill for one of them takes
* down every other skill in the same GitHub sync source.
*/
declare function validateSkillFrontmatter(frontmatter: unknown): ValidationIssue[];
declare function validateRelativePath(relativePath: unknown): ValidationIssue[];
declare function inferSkillFileCategory(relativePath: string): "script" | "reference" | "asset" | "other";
/** ---------- Method factory ---------- */
interface SkillDeps {
  /** Removes all ACL entries for a resource. Injected from PermissionService. */
  removeAllPermissions: (params: {
    resourceType: string;
    resourceId: unknown;
  }) => Promise<void>;
  /** Returns resource IDs solely owned by the given user. From createAclEntryMethods. */
  getSoleOwnedResourceIds: (userObjectId: Types.ObjectId, resourceTypes: string | string[]) => Promise<Types.ObjectId[]>;
}
type CreateSkillInput = {
  name: string;
  displayTitle?: string;
  description: string;
  body?: string;
  frontmatter?: Record<string, unknown>;
  category?: string;
  author: Types.ObjectId;
  authorName: string;
  source?: "inline" | "github" | "notion";
  sourceMetadata?: Record<string, unknown>;
  /**
  * When `true`, the skill is auto-primed into every turn. Callers pass this
  * through alongside `frontmatter` so the boolean lands on both the indexed
  * first-class column (queryable) and the raw frontmatter bag (inspectable).
  */
  alwaysApply?: boolean;
  tenantId?: string;
};
type UpdateSkillInput = {
  name?: string;
  displayTitle?: string;
  description?: string;
  body?: string;
  frontmatter?: Record<string, unknown>;
  category?: string;
  alwaysApply?: boolean;
  source?: "inline" | "github" | "notion";
  sourceMetadata?: Record<string, unknown>;
};
type GetAuthorSkillByNameParams = {
  name: string;
  author: Types.ObjectId | string;
  tenantId?: string | null;
};
/**
* Maps the runtime-enforced frontmatter fields onto their first-class
* column equivalents. Returns only the keys that were explicitly set on the
* frontmatter so callers can decide whether to write `undefined` (skip the
* `$set`) versus a concrete value.
*
* `allowed-tools` accepts string or string[] per the validator; both are
* normalized to an array. Empty strings are filtered out so a stray comma
* in YAML doesn't leak through as `''`.
*/
declare function deriveStructuredFrontmatterFields(frontmatter: Record<string, unknown> | undefined): {
  disableModelInvocation?: boolean;
  userInvocable?: boolean;
  allowedTools?: string[];
};
type UpsertSkillFileInput = {
  skillId: Types.ObjectId | string;
  relativePath: string;
  file_id: string;
  filename: string;
  filepath: string;
  storageKey?: string;
  storageRegion?: string;
  source: string;
  sourceMetadata?: Record<string, unknown>;
  mimeType: string;
  bytes: number;
  isExecutable?: boolean;
  author: Types.ObjectId;
  tenantId?: string;
};
type ListSkillsByAccessParams = {
  /** Trusted capability-authorized tenant scope; never accept directly from client input. */manageTenantId?: string;
  accessibleIds: Types.ObjectId[];
  category?: string;
  search?: string;
  limit: number;
  cursor?: string | null;
};
type ListSkillsByAccessResult = {
  /**
  * Summary rows — `body` and `frontmatter` are intentionally omitted at the
  * query projection layer to keep list payloads small. Callers that need the
  * full document must fetch the detail via `getSkillById`.
  */
  skills: Array<ISkillSummary & {
    _id: Types.ObjectId;
  }>;
  has_more: boolean;
  after: string | null;
};
type ListAlwaysApplySkillsParams = {
  accessibleIds: Types.ObjectId[]; /** Max rows to return per page. The caller paginates to fill an active-state budget. */
  limit: number; /** Opaque cursor from a prior page. `null` / absent = first page. */
  cursor?: string | null;
};
type ListAlwaysApplySkillsResult = {
  /**
  * Rows for `alwaysApply: true` skills within `accessibleIds` on this page.
  * Returns `body` eagerly — callers prime the full SKILL.md on every turn,
  * so round-tripping through `getSkillById` per skill would double DB ops.
  */
  skills: Array<{
    _id: Types.ObjectId;
    name: string;
    body: string;
    author: Types.ObjectId;
    frontmatter?: Record<string, unknown>;
    allowedTools?: string[];
    version: number;
  }>; /** `true` when another page exists beyond this one. */
  has_more: boolean; /** Cursor for the next page, or `null` when `has_more` is `false`. */
  after: string | null;
};
type UpdateSkillResult = {
  status: "updated";
  skill: ISkill & {
    _id: Types.ObjectId;
  };
  warnings: ValidationIssue[];
} | {
  status: "conflict";
  current: ISkill & {
    _id: Types.ObjectId;
  };
} | {
  status: "not_found";
};
type CreateSkillResult = {
  skill: ISkill & {
    _id: Types.ObjectId;
  };
  warnings: ValidationIssue[];
};
declare function createSkillMethods(mongoose: typeof import("mongoose"), deps: SkillDeps): {
  createSkill: (data: CreateSkillInput) => Promise<CreateSkillResult>;
  getSkillById: (id: string | Types.ObjectId) => Promise<(ISkill & {
    _id: Types.ObjectId;
  }) | null>;
  getSkillByName: (name: string, accessibleIds: Types.ObjectId[], options?: {
    /**
    * Manual paths (`$` popover, always-apply once Phase 5 lands) set
    * this so a same-name newer `userInvocable: false` duplicate can't
    * shadow the older user-invocable doc the popover surfaced.
    * Disable-model-invocation status is irrelevant here — manually-
    * primed disabled skills are explicitly supported (iter 4).
    */
    preferUserInvocable?: boolean;
    /**
    * Model paths (`skill` / `read_file` tool handlers) set this so a
    * same-name newer `disable-model-invocation: true` duplicate can't
    * shadow the cataloged model-invocable doc. User-invocability is
    * irrelevant here — `userInvocable: false` skills are model-only
    * and remain valid model-invocation targets.
    *
    * Both flags fall back to the newest match when no preferred doc
    * exists, so handlers can still fire their explicit-rejection
    * error paths (e.g. "cannot be invoked by the model" in the
    * disabled-only case).
    */
    preferModelInvocable?: boolean;
  }) => Promise<(ISkill & {
    _id: Types.ObjectId;
  }) | null>;
  getAuthorSkillByName: (params: GetAuthorSkillByNameParams) => Promise<(ISkill & {
    _id: Types.ObjectId;
  }) | null>;
  listSkillsByAccess: (params: ListSkillsByAccessParams) => Promise<ListSkillsByAccessResult>;
  listAlwaysApplySkills: (params: ListAlwaysApplySkillsParams) => Promise<ListAlwaysApplySkillsResult>;
  updateSkill: (params: {
    id: string;
    expectedVersion: number;
    update: UpdateSkillInput;
  }) => Promise<UpdateSkillResult>;
  deleteSkill: (id: string) => Promise<{
    deleted: boolean;
  }>;
  deleteUserSkills: (userId: Types.ObjectId | string) => Promise<number>;
  findSkillBySourceIdentity: (params: {
    source: "github" | "notion";
    upstreamId: string;
    tenantId?: string;
  }) => Promise<(ISkill & {
    _id: Types.ObjectId;
  }) | null>;
  listSkillsBySource: (params: {
    source: "github" | "notion";
    sourceId: string;
  }) => Promise<Array<ISkill & {
    _id: Types.ObjectId;
  }>>;
  listSkillFiles: (skillId: Types.ObjectId | string) => Promise<Array<ISkillFile & {
    _id: Types.ObjectId;
  }>>;
  upsertSkillFile: (row: UpsertSkillFileInput) => Promise<ISkillFile & {
    _id: Types.ObjectId;
  }>;
  deleteSkillFile: (skillId: Types.ObjectId | string, relativePath: string) => Promise<{
    deleted: boolean;
  }>;
  getSkillFileByPath: (skillId: Types.ObjectId | string, relativePath: string) => Promise<(ISkillFile & {
    _id: Types.ObjectId;
  }) | null>;
  updateSkillFileContent: (skillId: Types.ObjectId | string, relativePath: string, update: {
    content?: string;
    isBinary?: boolean;
  }) => Promise<void>;
  updateSkillFileCodeEnvIds: (updates: Array<{
    skillId: Types.ObjectId | string;
    relativePath: string;
    codeEnvRef: CodeEnvRef;
  }>) => Promise<{
    matchedCount: number;
    modifiedCount: number;
  }>;
};
type SkillMethods = ReturnType<typeof createSkillMethods>;
//#endregion
//#region src/methods/schedule.d.ts
interface ClaimDueScheduleParams {
  instanceId: string;
  leaseMs: number;
}
interface RecordRunOutcomeParams {
  scheduleId: string;
  scheduledFor: Date;
  status: Extract<ScheduleRunStatus, "success" | "error" | "requires_action" | "interrupted" | "skipped_balance" | "skipped_overlap">;
  conversationId?: string;
  checkpointNamespace?: string;
  /** Erase the run row's RESERVED conversationId in the same terminal write: a
  *  pre-start abort reserved an id but never created the conversation, and any
  *  recovery replay that reads the row would otherwise project a dead link. */
  clearConversationId?: boolean;
  error?: string;
  /** Sanitized per-server MCP readiness outcomes for this occurrence. */
  mcp?: IScheduleRun["mcp"];
  durationMs?: number;
  autoDisableAfterFailures: number;
  /** Consecutive-balance-skip auto-disable threshold; required to settle a run as
  *  `skipped_balance` (a mid-generation balance refusal), ignored otherwise. */
  balanceSkipDisableThreshold?: number;
  /**
  * RECOVERY REPLAY of a pause, from an actor holding a possibly-stale row snapshot:
  * apply the transition only while no FRESH resume claim owns the row — that is, the
  * row carries no `resumeClaimedAt`, or one older than this cutoff. Without the fence,
  * two clustered sweepers observing the same unprojected pause race: the first projects
  * it, the owner's approval then claims a fresh slot (`markRunResumeClaimed` sets
  * `started` + `resumeClaimedAt` in ONE write), and the second still passes its
  * snapshot-based hand-off check and unsets the capacity slot and claim stamp out from
  * under the running continuation.
  *
  * A CUTOFF rather than a mere existence check, because the stamp outlives its meaning:
  * a worker that dies between claiming and resuming leaves it set forever, and rejecting
  * on existence alone would strand that row `started` — holding its capacity slot, with
  * its approval unresumable (`markRunResumeClaimed` only matches `requires_action`) —
  * which is the very state this replay exists to recover. Pass the same staleness bound
  * the caller's own in-flight check uses so the two agree.
  *
  * Never set by the generation owner: its own re-pause legitimately clears the stamp as
  * the hand-off's completion signal.
  */
  resumeClaimStaleBefore?: Date;
}
/** Outcome of reserving the single-active-run slot for a fired occurrence. */
type StartedRunReservation = {
  run: IScheduleRun;
} | {
  conflict: "duplicate" | "overlap" | "slot-taken";
  /** For a `duplicate`, the status of the row that already holds this occurrence.
  *  A TERMINAL status means the occurrence is finished and merely never advanced
  *  past; an active one means another worker is still running it. */
  existingStatus?: ScheduleRunStatus;
};
/** Outcome of promoting a paused occurrence back into the capacity-consuming
* `started` set. Both conflicts are database-arbitrated by the same partial
* unique indexes used for a first fire. */
type ResumedRunReservation = {
  capacitySlot: number;
} | {
  conflict: "not-paused" | "overlap" | "slot-taken";
};
type ScheduleMethods = {
  ensureScheduleIndexes: () => Promise<void>;
  createSchedule: (data: Partial<ISchedule>) => Promise<ISchedule>;
  createScheduleWithSlot: (data: Partial<ISchedule>, maxPerUser: number) => Promise<ISchedule | "limit">;
  updateScheduleById: (id: string, userId: string | Types.ObjectId, update: Partial<ISchedule>, unset?: Record<string, 1>, options?: {
    expectedConfigRevision?: number;
  }) => Promise<ISchedule | null>;
  deleteScheduleById: (id: string, userId: string | Types.ObjectId) => Promise<boolean>;
  deleteUnarmedSchedule: (id: string, userId: string | Types.ObjectId, expectedConfigRevision?: number) => Promise<"deleted" | "draining" | "kept" | "missing">;
  getScheduleById: (id: string, userId?: string | Types.ObjectId) => Promise<ISchedule | null>;
  getSchedulesByUser: (userId: string | Types.ObjectId) => Promise<ISchedule[]>;
  countSchedulesByUser: (userId: string | Types.ObjectId) => Promise<number>;
  claimDueSchedule: (params: ClaimDueScheduleParams) => Promise<ISchedule | null>;
  acquireManualRunLease: (id: string, userId: string | Types.ObjectId, leaseMs: number) => Promise<ISchedule | null>;
  acquireResumeLease: (id: string, expectedConfigRevision: number | undefined, requireEnabled: boolean, leaseMs: number) => Promise<ISchedule | null>;
  consumeResumeLease: (id: string, expectedClaimToken: string, expectedLeaseBy: string, requireEnabled: boolean, expectedConfigRevision?: number) => Promise<boolean>;
  releaseLease: (id: string, expectedClaimToken?: string) => Promise<boolean>;
  releaseLeaseByHolder: (id: string, leaseBy: string) => Promise<void>;
  revalidateClaim: (id: string, claimToken: string, requireEnabled?: boolean) => Promise<boolean>;
  advanceSchedule: (id: string, nextRunAt: Date | null, expectedNextRunAt?: Date | null, expectedClaimToken?: string) => Promise<boolean>;
  disableSchedule: (id: string, reason: ScheduleDisabledReason, expectedClaimToken?: string, expectedConfigRevision?: number, counterGuard?: Record<string, unknown>) => Promise<void>;
  insertScheduleRun: (data: Partial<IScheduleRun>) => Promise<IScheduleRun | null>;
  /** Converges the schedule row on the destination a fire resolved; claim-token
  *  fenced, and never bumps configRevision (this is not an owner edit). */
  persistResolvedProject: (id: string, chatProjectId: string | undefined, expectedClaimToken?: string) => Promise<void>; /** The destination one occurrence used; null when the row is absent. */
  getScheduleRunProject: (scheduleId: string, scheduledFor: string | Date) => Promise<{
    recorded: boolean;
    chatProjectId?: string;
  } | null>;
  reserveStartedRun: (data: Partial<IScheduleRun>) => Promise<StartedRunReservation>;
  getCapacityOccupancy: () => Promise<{
    takenSlots: number[];
    unslotted: number;
  }>;
  requestRunAbort: (scheduleId: string, scheduledFor: Date, source?: IScheduleRun["abortSource"]) => Promise<boolean | "in_progress">;
  getScheduleRunAbortState: (scheduleId: string, scheduledFor: Date) => Promise<Pick<IScheduleRun, "status" | "abortRequestedAt" | "abortSource" | "abortPersistedAt"> | null>;
  markRunResumeClaimed: (scheduleId: string, scheduledFor: Date, capacitySlot: number) => Promise<ResumedRunReservation>;
  releaseRunResumeClaim: (scheduleId: string, scheduledFor: Date, capacitySlot: number) => Promise<boolean>;
  markRunAbortPersisted: (scheduleId: string, scheduledFor: Date) => Promise<void>;
  setRunFireDetails: (scheduleId: string, scheduledFor: Date, details: {
    conversationId: string;
    droppedFileIds?: string[];
    mcp?: IScheduleRun["mcp"];
  }) => Promise<void>;
  countActiveRuns: () => Promise<number>;
  deleteScheduleRun: (scheduleId: string, scheduledFor: Date, expectedStatus?: ScheduleRunStatus, expectedConversationId?: string) => Promise<void>;
  markScheduleDeleting: (id: string, userId: string | Types.ObjectId) => Promise<ISchedule | null>;
  getActiveRunsForSchedule: (scheduleId: string) => Promise<IScheduleRun[]>;
  getActiveRunsForUser: (userId: string | Types.ObjectId, statuses?: readonly ScheduleRunStatus[]) => Promise<IScheduleRun[]>;
  suspendUserSchedulesForDeletion: (userId: string | Types.ObjectId, token: string) => Promise<void>;
  restoreUserSchedulesFromDeletion: (userId: string | Types.ObjectId, token: string) => Promise<void>;
  getDeletingSchedules: (limit: number) => Promise<ISchedule[]>;
  markEraseAttempted: (ids: string[]) => Promise<void>;
  getScheduleByClientRequestId: (userId: string | Types.ObjectId, clientRequestId: string) => Promise<ISchedule | null>;
  getDeletingScheduleIds: (userId: string | Types.ObjectId, limit: number) => Promise<string[]>;
  getUnarmedSchedules: (limit: number) => Promise<ISchedule[]>;
  armSchedule: (id: string, nextRunAt: Date, expectedConfigRevision?: number) => Promise<boolean>;
  eraseScheduleIfDrained: (id: string) => Promise<boolean>;
  deleteSchedulesByUser: (userId: string | Types.ObjectId) => Promise<void>;
  getUnbookkeptRuns: (olderThan: Date, limit: number) => Promise<IScheduleRun[]>;
  finalizeBookkeeping: (params: RecordRunOutcomeParams) => Promise<void>;
  recordRunOutcome: (params: RecordRunOutcomeParams) => Promise<void>;
  recordSkippedRun: (data: Partial<IScheduleRun> & {
    scheduleId: string;
    scheduledFor: Date;
    status: Extract<ScheduleRunStatus, "skipped_overlap" | "skipped_balance">;
  }, balanceSkipDisableThreshold?: number) => Promise<void>;
  getRunsForReconciliation: (olderThan: Date, limit: number) => Promise<IScheduleRun[]>;
  markRunsReconciled: (runs: Array<Pick<IScheduleRun, "_id">>) => Promise<void>;
};
//#endregion
//#region src/methods/queuedTurn.d.ts
declare class AgentQueuedTurnConflictError extends Error {
  constructor(clientRequestId: string);
}
declare class AgentQueuedTurnCapacityError extends Error {
  constructor();
}
declare class AgentQueuedTurnLaneRetiredError extends Error {
  constructor();
}
interface AgentQueuedTurnOwnerScope {
  user: Types.ObjectId;
  tenantId?: string;
}
interface AgentQueuedTurnConversationScope extends AgentQueuedTurnOwnerScope {
  conversationId: string;
}
interface AgentQueuedTurnDeletionTarget {
  conversationId: string;
  tenantId?: string;
  /** Recovery for a conversation row that was already deleted cannot recover
  * its tenant. User + conversation identity is still sufficient to purge it. */
  allTenants?: true;
}
interface EnqueueAgentQueuedTurnInput extends AgentQueuedTurnConversationScope {
  agentId: string;
  parentMessageId: string;
  clientRequestId: string;
  text: string;
  files?: readonly AgentQueuedTurnFileRef[];
  quotes?: readonly string[];
  manualSkills?: readonly string[];
  expectedPredecessorCreatedAt?: number;
  priority?: boolean;
  availableAt?: Date;
}
interface AgentQueuedTurnClaimFence extends AgentQueuedTurnConversationScope {
  queuedTurnId: string;
  claimId: string;
  claimBy: string;
}
type CancelAgentQueuedTurnResult = {
  outcome: "cancelled" | "already_cancelled";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "not_cancellable";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "not_found";
  turn: null;
};
type ReleaseAgentQueuedTurnResult = {
  outcome: "released" | "dead";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "conflict";
  turn: AgentQueuedTurnRecord | null;
};
type AdmitAgentQueuedTurnResult = {
  outcome: "admitted" | "already_admitted";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "conflict";
  turn: AgentQueuedTurnRecord | null;
};
type DeadLetterAgentQueuedTurnResult = {
  outcome: "dead" | "already_terminal" | "admission_reconciled";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "admission_indeterminate";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "missing";
  turn: null;
} | {
  outcome: "conflict";
  turn: AgentQueuedTurnRecord;
};
type ScheduleAgentQueuedTurnResult = {
  outcome: "scheduled" | "already_scheduled";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "conflict";
  turn: AgentQueuedTurnRecord | null;
};
type ReserveAgentQueuedTurnDeliveryResult = {
  outcome: "reserved" | "already_reserved";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "conflict";
  turn: AgentQueuedTurnRecord | null;
};
type ClaimAgentQueuedTurnResult = {
  outcome: "acquired" | "replayed";
  claim: AgentQueuedTurnClaim;
} | {
  outcome: "blocked";
  claim: null;
} | {
  outcome: "missing";
  claim: null;
};
type BeginAgentQueuedTurnAdmissionResult = {
  outcome: "started" | "already_started" | "retired" | "order_unavailable";
  turn: AgentQueuedTurnRecord;
} | {
  outcome: "conflict";
  turn: AgentQueuedTurnRecord | null;
};
interface AgentQueuedTurnAdmissionEvidence {
  generationId?: string;
  generationCreatedAt: number;
}
interface AgentQueuedTurnPredecessor {
  lineagePredecessorId: string;
  effectivePredecessorCreatedAt?: number;
}
interface ClaimAgentQueuedTurnReconciliationInput {
  claimId: string;
  claimBy: string;
  now: Date;
  leaseUntil: Date;
  limit?: number;
}
interface AgentQueuedTurnMethods {
  ensureAgentQueuedTurnIndexes: () => Promise<void>;
  enqueueAgentQueuedTurn: (input: EnqueueAgentQueuedTurnInput) => Promise<{
    turn: AgentQueuedTurnRecord;
    replayed: boolean;
  }>;
  getAgentQueuedTurnByClientRequestId: (input: AgentQueuedTurnConversationScope & {
    clientRequestId: string;
  }) => Promise<AgentQueuedTurnRecord | null>;
  listActiveAgentQueuedTurns: (input: AgentQueuedTurnConversationScope & {
    limit?: number;
  }) => Promise<AgentQueuedTurnActiveRecord[]>;
  listAgentQueuedTurnReceipts: (input: AgentQueuedTurnConversationScope & {
    clientRequestIds?: readonly string[];
  }) => Promise<AgentQueuedTurnActiveRecord[]>;
  findQueuedTurnsNeedingDelivery: (limit?: number) => Promise<AgentQueuedTurnRecord[]>;
  claimQueuedTurnsForAdmissionReconciliation: (input: ClaimAgentQueuedTurnReconciliationInput) => Promise<AgentQueuedTurnRecord[]>;
  deferAgentQueuedTurnAdmissionReconciliation: (input: AgentQueuedTurnConversationScope & {
    queuedTurnId: string;
    deliveryKey: string;
    claimId: string;
    claimBy: string;
    availableAt: Date;
  }) => Promise<boolean>;
  reserveAgentQueuedTurnDelivery: (input: AgentQueuedTurnConversationScope & {
    queuedTurnId: string;
    deliveryKey: string;
  }) => Promise<ReserveAgentQueuedTurnDeliveryResult>;
  markQueuedTurnScheduled: (input: AgentQueuedTurnConversationScope & {
    queuedTurnId: string;
    deliveryKey: string;
    scheduledAt?: Date;
  }) => Promise<ScheduleAgentQueuedTurnResult>;
  cancelAgentQueuedTurn: (input: AgentQueuedTurnOwnerScope & {
    queuedTurnId: string;
    conversationId?: string;
    settledAt?: Date;
  }) => Promise<CancelAgentQueuedTurnResult>;
  claimNextAgentQueuedTurn: (input: AgentQueuedTurnConversationScope & {
    queuedTurnId: string;
    claimId: string;
    claimBy: string;
    now: Date;
    leaseUntil: Date;
  }) => Promise<ClaimAgentQueuedTurnResult>;
  releaseAgentQueuedTurn: (input: AgentQueuedTurnClaimFence & ({
    disposition: "retry";
    availableAt: Date;
  } | {
    disposition: "dead";
    settledAt: Date;
    failure: AgentQueuedTurnFailure;
  })) => Promise<ReleaseAgentQueuedTurnResult>;
  beginAgentQueuedTurnAdmission: (input: AgentQueuedTurnClaimFence & {
    admissionId: string;
    startedAt: Date;
    admissionProtocolVersion?: 2;
  }) => Promise<BeginAgentQueuedTurnAdmissionResult>;
  markAgentQueuedTurnAdmitted: (input: AgentQueuedTurnClaimFence & {
    admissionId: string;
    admissionMode: "warm" | "ordinary";
    generationId?: string;
    generationCreatedAt?: number;
    effectivePredecessorCreatedAt?: number;
    lineagePredecessorId?: string;
    settledAt: Date;
  }) => Promise<AdmitAgentQueuedTurnResult>;
  hasAgentQueuedTurnAdmissionReceipt: (input: AgentQueuedTurnConversationScope & {
    queuedTurnId: string;
    admissionId: string;
    generationId: string;
    generationCreatedAt: number;
    effectivePredecessorCreatedAt?: number;
    lineagePredecessorId?: string;
  }) => Promise<boolean>;
  deadLetterAgentQueuedTurn: (input: AgentQueuedTurnConversationScope & {
    queuedTurnId: string;
    deliveryKey: string;
    settledAt: Date;
    failure: AgentQueuedTurnFailure;
    admissionEvidence?: AgentQueuedTurnAdmissionEvidence;
    reconciliationClaimId?: string;
    reconciliationClaimBy?: string;
  }) => Promise<DeadLetterAgentQueuedTurnResult>;
  getEffectiveAgentQueuedTurnPredecessor: (input: AgentQueuedTurnConversationScope & {
    sequence: number;
    rootParentMessageId: string;
    expectedPredecessorCreatedAt?: number;
    allowLegacyPredecessorInference?: boolean;
  }) => Promise<AgentQueuedTurnPredecessor | null>;
  drainAgentQueuedTurns: (input: AgentQueuedTurnOwnerScope & {
    conversationId?: string;
    settledAt?: Date;
  }) => Promise<number>;
  deleteAgentQueuedTurns: (input: AgentQueuedTurnOwnerScope & {
    conversationId?: string;
  }) => Promise<number>;
  prepareAgentQueuedTurnConversationDeletion: (input: {
    user: Types.ObjectId;
    targets: readonly AgentQueuedTurnDeletionTarget[];
    settledAt?: Date;
  }) => Promise<string[]>;
  deletePreparedAgentQueuedTurnConversations: (input: {
    user: Types.ObjectId;
    targets: readonly AgentQueuedTurnDeletionTarget[];
  }) => Promise<number>;
  markAgentQueuedTurnDeliveryRetired: (input: {
    deliveryKey: string;
  }) => Promise<boolean>;
  beginAgentQueuedTurnMissingDeliveryRetirement: (input: {
    deliveryKey: string;
  }) => Promise<boolean>;
  markAgentQueuedTurnMissingDeliveryRetired: (input: {
    deliveryKey: string;
  }) => Promise<boolean>;
  deleteAllAgentQueuedTurnsForUser: (input: {
    user: Types.ObjectId;
  }) => Promise<number>;
}
//#endregion
//#region src/methods/triggerDelivery.d.ts
type AgentEventActorReceiptMetric = {
  operation: "read" | "settle" | "backfill";
  outcome: "hit" | "miss" | "success" | "replay" | "conflict";
  resolution?: AgentEventActorReceipt["resolution"];
};
/** Installs one process-local, low-cardinality observer at the storage boundary. */
declare function setAgentEventActorReceiptMetricObserver(observer?: (metric: AgentEventActorReceiptMetric) => void): void;
/** Emits one already-bounded receipt metric through the configured observer. */
declare function recordAgentEventActorReceiptMetric(metric: AgentEventActorReceiptMetric): void;
declare class AgentTriggerDeliveryConflictError extends Error {
  constructor(deliveryKey: string);
}
interface EnqueueAgentTriggerDeliveryInput {
  deliveryKey: string;
  fingerprint: string;
  orderingKey: string;
  envelope: unknown;
  user: string | Types.ObjectId;
  tenantId?: string;
  availableAt: Date;
  envelopeBytes?: number;
  coalesceKey?: string;
  coalesceFrom?: Date;
  coalesceUntil?: Date;
  awaitTerminalHandling?: boolean;
  requiredWorkerCapability?: string;
  producerLeaseUntil?: Date;
}
type AgentTriggerProducerLeaseStatus = {
  status: "live";
  leaseUntil: Date;
} | {
  status: "expired";
  leaseUntil: Date;
} | {
  status: "missing";
};
interface AgentTriggerDeliveryFence {
  id: string;
  workerId: string;
  claimToken: string;
}
interface SettleAgentTriggerHandlingOutcomeInput {
  deliveryKey: string;
  conversationId: string;
  generationCreatedAt: number;
  status: Exclude<AgentTriggerHandlingState["status"], "started">;
  settledAt: Date;
  error?: string;
  action?: AgentTriggerHandlingState["action"];
}
interface SettleAgentEventActorReceiptInput {
  deliveryKey: string;
  user: string | Types.ObjectId;
  tenantId?: string;
  bindingId: string;
  conversationId: string;
  generationCreatedAt: number;
  status: "applied" | "failed";
  settledAt: Date;
  error?: string;
  /** Present for executions that acquired the delivery-owned action CAS.
  * Absent only for mixed-version terminal rows created before this field. */
  requiresActionAdmission?: true;
  receipt: Omit<AgentEventActorReceipt, "bindingId" | "settledAt">;
}
interface AdmitAgentEventActorActionInput extends GetAgentEventActorReceiptInput {
  admittedAt: Date;
  admissionId: string;
}
interface AgentEventActorActionAdmissionInput extends GetAgentEventActorReceiptInput {
  admissionId: string;
}
/** Durable transition receipt. Storage unavailability remains an exception;
* callers never collapse it into a conflict or a negative acknowledgement. */
interface AgentEventActorDetachedTransitionResult {
  status: "applied" | "already_applied" | "conflict";
}
interface ReserveAgentEventActorDetachedActionInput extends GetAgentEventActorReceiptInput {
  generationCreatedAt: number;
  turnId: string;
  invocationId: string;
  expectedToolName: string;
  toolName: string;
  toolCallId: string;
  reservedAt: Date;
  recoveryAfter: Date;
}
interface UpdateAgentEventActorDetachedActionInput extends GetAgentEventActorReceiptInput {
  generationCreatedAt: number;
  taskId: string;
  idempotencyKey: string;
  observedAt: Date;
}
interface MarkAgentEventActorDetachedActionRunningInput extends UpdateAgentEventActorDetachedActionInput {
  recoveryAfter: Date;
}
interface SettleAgentEventActorDetachedActionInput extends UpdateAgentEventActorDetachedActionInput {
  status: "succeeded" | "failed" | "cancelled";
  result?: string;
  error?: string;
}
interface GetAgentEventActorReceiptInput {
  deliveryKey: string;
  user: string | Types.ObjectId;
  tenantId?: string;
  bindingId: string;
  conversationId: string;
}
type BackfillAgentEventActorReceiptInput = SettleAgentEventActorReceiptInput;
interface AgentEventActorReceiptStorageMetrics {
  retainedByResolution: Record<AgentEventActorReceipt["resolution"], number>;
  expiryEligible: number;
  retryDeliveries: number;
  deadDeliveries: number;
}
interface AgentTriggerDeliveryMethods {
  ensureAgentTriggerDeliveryIndexes: () => Promise<void>;
  enqueueAgentTriggerDelivery: (input: EnqueueAgentTriggerDeliveryInput) => Promise<{
    delivery: AgentTriggerDeliveryRecord;
    replayed: boolean;
  }>;
  claimNextAgentTriggerDelivery: (input: {
    workerId: string;
    claimToken: string;
    now: Date;
    leaseUntil: Date;
    workerCapabilities?: string[];
  }) => Promise<AgentTriggerDeliveryClaim | null>;
  findEarlierAgentTriggerDelivery: (delivery: Pick<AgentTriggerDeliveryRecord, "orderingKey" | "laneSequence">) => Promise<AgentTriggerOrderingBlock | null>;
  getAgentTriggerDeliveryBatch: (delivery: Pick<AgentTriggerDeliveryRecord, "id" | "batchMemberIds">) => Promise<AgentTriggerDeliveryRecord[]>;
  releaseAgentTriggerDelivery: (input: AgentTriggerDeliveryFence & {
    availableAt: Date;
  }) => Promise<boolean>;
  beginAgentTriggerDeliveryAttempt: (input: AgentTriggerDeliveryFence & {
    now: Date;
  }) => Promise<number | null>;
  deferAgentTriggerDeliveryAttempt: (input: AgentTriggerDeliveryFence & {
    attempt: number;
    availableAt: Date;
  }) => Promise<boolean>;
  completeAgentTriggerDelivery: (input: AgentTriggerDeliveryFence & {
    attempt: number;
    result: unknown;
    settledAt: Date;
    handling?: AgentTriggerHandlingState;
    awaitTerminalHandling?: true;
  }) => Promise<boolean>;
  retireAgentTriggerDelivery: (input: {
    deliveryKey: string;
    sourceId: string;
    settledAt: Date;
    reason: string;
    onlyIfUnclaimed?: boolean;
    onlyIfDead?: boolean;
  }) => Promise<boolean>;
  renewAgentTriggerDeliveryProducerLease: (input: {
    deliveryKey: string;
    sourceId: string;
    leaseUntil: Date;
  }) => Promise<boolean>;
  getAgentTriggerDeliveryProducerLease: (input: {
    deliveryKey: string;
    sourceId: string;
    now: Date;
  }) => Promise<AgentTriggerProducerLeaseStatus>;
  settleAgentTriggerHandlingOutcome: (input: SettleAgentTriggerHandlingOutcomeInput) => Promise<boolean>;
  admitAgentEventActorAction: (input: AdmitAgentEventActorActionInput) => Promise<boolean>;
  releaseAgentEventActorAction: (input: AgentEventActorActionAdmissionInput) => Promise<boolean>;
  getAgentEventActorActionAdmission: (input: GetAgentEventActorReceiptInput) => Promise<string | null>;
  hasAgentEventActorActionAdmission: (input: AgentEventActorActionAdmissionInput) => Promise<boolean>;
  reserveAgentEventActorDetachedAction: (input: ReserveAgentEventActorDetachedActionInput) => Promise<{
    status: "reserved" | "replay" | "conflict";
    action: AgentEventActorDetachedAction;
  }>;
  markAgentEventActorDetachedActionRunning: (input: MarkAgentEventActorDetachedActionRunningInput) => Promise<AgentEventActorDetachedTransitionResult>;
  markAgentEventActorDetachedActionLaunchIndeterminate: (input: UpdateAgentEventActorDetachedActionInput) => Promise<AgentEventActorDetachedTransitionResult>;
  settleAgentEventActorDetachedAction: (input: SettleAgentEventActorDetachedActionInput) => Promise<AgentEventActorDetachedTransitionResult>;
  getAgentEventActorDetachedAction: (input: GetAgentEventActorReceiptInput & {
    generationCreatedAt: number;
  }) => Promise<AgentEventActorDetachedAction | null>;
  settleAgentEventActorReceipt: (input: SettleAgentEventActorReceiptInput) => Promise<boolean>;
  getAgentEventActorReceipt: (input: GetAgentEventActorReceiptInput) => Promise<AgentEventActorReceipt | null>;
  backfillAgentEventActorReceipt: (input: BackfillAgentEventActorReceiptInput) => Promise<boolean>;
  getAgentEventActorReceiptStorageMetrics: (now: Date) => Promise<AgentEventActorReceiptStorageMetrics>;
  retryAgentTriggerDelivery: (input: AgentTriggerDeliveryFence & {
    attempt: number;
    error: AgentTriggerDeliveryFailure;
    availableAt: Date;
  }) => Promise<boolean>;
  deadLetterAgentTriggerDelivery: (input: AgentTriggerDeliveryFence & {
    attempt: number;
    error: AgentTriggerDeliveryFailure;
    settledAt: Date;
  }) => Promise<boolean>;
  getAgentTriggerDelivery: (deliveryKey: string) => Promise<AgentTriggerDeliveryRecord | null>;
  getAgentTriggerDeliveryStatus: (deliveryKey: string, user: string | Types.ObjectId, sourceKeyId: string, tenantId?: string) => Promise<AgentTriggerDeliveryStatusRecord | null>;
  getAgentTriggerDeadLetters: (limit?: number) => Promise<AgentTriggerDeliveryRecord[]>;
  requeueAgentTriggerDelivery: (id: string, availableAt: Date) => Promise<AgentTriggerDeliveryRecord | null>;
  countActiveAgentTriggerDeliveriesByUser: (user: string | Types.ObjectId, now: Date) => Promise<number>;
  recoverAgentTriggerLanePublications: (limit?: number) => Promise<number>;
  recoverAgentTriggerBatchReceipts: (limit?: number) => Promise<number>;
  reclaimInactiveAgentTriggerLanes: (limit?: number) => Promise<number>;
  prepareAgentTriggerUserPurge: (user: string | Types.ObjectId, fenceStartedAt: Date, tenantId?: string) => Promise<void>;
  cancelAgentTriggerUserPurge: (user: string | Types.ObjectId, fenceStartedAt: Date) => Promise<boolean>;
  recoverAgentTriggerUserPurges: (limit?: number) => Promise<number>;
  deleteAgentTriggerDeliveriesByUser: (user: string | Types.ObjectId) => Promise<void>;
}
//#endregion
//#region src/methods/skillSync.d.ts
type SkillSyncCredentialSummary = {
  provider: SkillSyncProvider;
  credentialKey: string;
  credentialPresent: boolean;
  tokenFingerprint?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
type UpsertSkillSyncCredentialInput = {
  provider: SkillSyncProvider;
  credentialKey: string;
  token: string;
  userId?: Types.ObjectId;
};
type SkillSyncStatusInput = {
  provider: SkillSyncProvider;
  sourceId: string;
  tenantId?: string;
  status: SkillSyncRunStatus;
  credentialKey?: string;
  owner?: string;
  repo?: string;
  ref?: string;
  paths?: string[];
  startedAt?: Date;
  finishedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  syncedSkillCount?: number;
  syncedFileCount?: number;
  deletedSkillCount?: number;
  deletedFileCount?: number;
  skippedSkillCount?: number;
  skippedSkills?: ISkillSyncSkippedSkill[];
  skippedFileCount?: number;
  skippedFiles?: ISkillSyncSkippedFile[];
};
type SkillSyncLockInput = {
  provider: SkillSyncProvider;
  lockOwner: string;
  leaseMs: number;
  tenantId?: string;
};
type SkillSyncReleaseLockInput = {
  provider: SkillSyncProvider;
  lockOwner: string;
  tenantId?: string;
};
type SkillSyncMethods = {
  upsertSkillSyncCredential: (input: UpsertSkillSyncCredentialInput) => Promise<SkillSyncCredentialSummary>;
  deleteSkillSyncCredential: (provider: SkillSyncProvider, credentialKey: string) => Promise<{
    deleted: boolean;
  }>;
  listSkillSyncCredentials: (provider: SkillSyncProvider) => Promise<SkillSyncCredentialSummary[]>;
  getSkillSyncCredentialToken: (provider: SkillSyncProvider, credentialKey: string) => Promise<string | null>;
  getSkillSyncCredentialSummary: (provider: SkillSyncProvider, credentialKey: string) => Promise<SkillSyncCredentialSummary | null>;
  listSkillSyncStatuses: (provider: SkillSyncProvider) => Promise<ISkillSyncStatus[]>;
  getSkillSyncStatus: (provider: SkillSyncProvider, sourceId: string, tenantId?: string) => Promise<ISkillSyncStatus | null>;
  upsertSkillSyncStatus: (input: SkillSyncStatusInput) => Promise<ISkillSyncStatus>;
  tryAcquireSkillSyncLock: (params: SkillSyncLockInput) => Promise<boolean>;
  refreshSkillSyncLock: (params: SkillSyncLockInput) => Promise<boolean>;
  releaseSkillSyncLock: (params: SkillSyncReleaseLockInput) => Promise<void>;
};
//#endregion
//#region src/methods/agent.d.ts
interface AgentDeps {
  /** Removes all ACL permissions for a resource. Injected from PermissionService. */
  removeAllPermissions: (params: {
    resourceType: string;
    resourceId: unknown;
  }) => Promise<void>;
  /** Gets actions. Created by createActionMethods. */
  getActions: (query: ActionQuery, includeSensitive?: boolean) => Promise<unknown[]>;
  /** Returns resource IDs solely owned by the given user. From createAclEntryMethods. */
  getSoleOwnedResourceIds: (userObjectId: Types.ObjectId, resourceTypes: string | string[]) => Promise<Types.ObjectId[]>;
  /** Resolves ACL principals. Kept inside data-schemas so callers pass plain identity. */
  getUserPrincipals: (params: {
    userId: string | Types.ObjectId;
    role?: string | null;
    idOnTheSource?: string | null;
  }) => Promise<Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>>;
  /** Resolves ACL-visible resources. Kept inside data-schemas so callers use logical IDs. */
  findAccessibleResources: (principals: Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>, resourceType: string, requiredPermissions: number, resourceIds?: Types.ObjectId[]) => Promise<Types.ObjectId[]>;
  /** Recognizes skill IDs supplied by an external, non-database registry. */
  isExternalSkillId?: (id: string) => boolean;
}
/** Plain projection used to discover runnable agent graphs without exposing Mongoose. */
interface AgentGraphNode {
  id: string;
  provider: string;
  model: string;
  tools?: string[];
  mcpServerNames?: string[];
  agent_ids?: string[];
  edges?: IAgent["edges"];
  subagents?: IAgent["subagents"];
}
interface AgentGraphAccess {
  userId: string;
  role?: string | null;
  idOnTheSource?: string | null;
}
declare const agentGraphAccessContext: unique symbol;
/** Opaque resolved ACL context. Only data-schemas creates or consumes its contents. */
type AgentGraphAccessContext = {
  readonly [agentGraphAccessContext]: true;
};
/**
* Generates a hash of action metadata for version comparison.
*/
declare function generateActionMetadataHash(actionIds: string[] | null | undefined, actions: Array<{
  action_id: string;
  metadata: Record<string, unknown> | null;
}>): Promise<string>;
declare function createAgentMethods(mongoose: typeof import("mongoose"), deps: AgentDeps): {
  getAgent: (searchParameter: FilterQuery<IAgent>, projection?: ProjectionType<IAgent>) => Promise<IAgent | null>;
  getAgentVersions: (searchParameter: FilterQuery<IAgent>) => Promise<IAgent["versions"] | null>;
  getAgentWithVersionCount: (searchParameter: FilterQuery<IAgent>) => Promise<(IAgent & {
    version: number;
  }) | null>;
  getAgents: (searchParameter: FilterQuery<IAgent>, select?: string | Record<string, number>) => Promise<IAgent[]>;
  resolveAgentGraphAccess: (access: AgentGraphAccess) => Promise<AgentGraphAccessContext>;
  getAgentGraphNodes: (ids: string[], access?: AgentGraphAccessContext) => Promise<AgentGraphNode[]>;
  createAgent: (agentData: Record<string, unknown>) => Promise<IAgent>;
  getAgentIdsByMCPServerName: (serverName: string) => Promise<Types.ObjectId[]>;
  getAgentsWithMCPServerNames: () => Promise<Array<Pick<IAgent, "_id" | "mcpServerNames">>>;
  updateAgent: (searchParameter: FilterQuery<IAgent>, updateData: Record<string, unknown>, options?: {
    updatingUserId?: string | null;
    forceVersion?: boolean;
    skipVersioning?: boolean;
  }) => Promise<IAgent | null>;
  deleteAgent: (searchParameter: FilterQuery<IAgent>) => Promise<IAgent | null>;
  deleteUserAgents: (userId: string) => Promise<void>;
  revertAgentVersion: (searchParameter: FilterQuery<IAgent>, versionIndex: number) => Promise<IAgent>;
  countPromotedAgents: () => Promise<number>;
  addAgentResourceFile: ({
    agent_id,
    tool_resource,
    file_id,
    updatingUserId
  }: {
    agent_id: string;
    tool_resource: string;
    file_id: string;
    updatingUserId?: string;
  }) => Promise<IAgent>;
  getListAgentsByAccess: ({
    accessibleIds,
    otherParams,
    limit,
    after,
    includeSkillConfig,
    includeExecutionConfig
  }: {
    accessibleIds?: Types.ObjectId[];
    otherParams?: Record<string, unknown>;
    limit?: number | null;
    after?: string | null;
    includeSkillConfig?: boolean;
    includeExecutionConfig?: boolean;
  }) => Promise<{
    object: string;
    data: Array<Record<string, unknown>>;
    first_id: string | null;
    last_id: string | null;
    has_more: boolean;
    after: string | null;
  }>;
  getAgentManagementListByAccess: ({
    accessibleIds,
    tenantId,
    limit,
    after
  }: {
    /** `null` means the caller already passed the unrestricted management-capability check. */accessibleIds: Types.ObjectId[] | null;
    tenantId: string;
    limit: number;
    after?: string | null;
  }) => Promise<{
    data: Array<IAgent & {
      version: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    has_more: boolean;
    after: string | null;
  }>;
  removeAgentResourceFiles: ({
    agent_id,
    files
  }: {
    agent_id: string;
    files: Array<{
      tool_resource: string;
      file_id: string;
    }>;
  }) => Promise<IAgent>;
  generateActionMetadataHash: typeof generateActionMetadataHash;
  removeAgentFromUserFavorites: (resourceId: string, userIds: string[]) => Promise<void>;
  removeAgentResourceFilesFromAllAgents: ({
    file_ids
  }: {
    file_ids: string[];
  }) => Promise<{
    matchedCount: number;
    modifiedCount: number;
  }>;
};
type AgentMethods = ReturnType<typeof createAgentMethods>;
//#endregion
//#region src/methods/config.d.ts
declare function createConfigMethods(mongoose: typeof import("mongoose")): {
  listAllConfigs: (filter?: {
    isActive?: boolean;
  }, session?: ClientSession) => Promise<IConfig[]>;
  findConfigByPrincipal: (principalType: PrincipalType, principalId: string | Types.ObjectId, options?: {
    includeInactive?: boolean;
  }, session?: ClientSession) => Promise<IConfig | null>;
  getApplicableConfigs: (principals?: Array<{
    principalType: string;
    principalId?: string | Types.ObjectId;
  }>, session?: ClientSession) => Promise<IConfig[]>;
  upsertConfig: (principalType: PrincipalType, principalId: string | Types.ObjectId, principalModel: PrincipalModel, overrides: Partial<TCustomConfig>, priority: number, session?: ClientSession, options?: {
    expectEmpty?: boolean;
    preservePriority?: boolean;
  }) => Promise<IConfig | null>;
  patchConfigFields: (principalType: PrincipalType, principalId: string | Types.ObjectId, principalModel: PrincipalModel, fields: Record<string, unknown>, priority: number, session?: ClientSession) => Promise<IConfig | null>;
  tombstoneConfigField: (principalType: PrincipalType, principalId: string | Types.ObjectId, principalModel: PrincipalModel, fieldPath: string, priority: number, session?: ClientSession) => Promise<IConfig | null>;
  unsetConfigField: (principalType: PrincipalType, principalId: string | Types.ObjectId, fieldPath: string, session?: ClientSession) => Promise<IConfig | null>;
  deleteConfig: (principalType: PrincipalType, principalId: string | Types.ObjectId, session?: ClientSession, options?: {
    expectEmpty?: boolean;
  }) => Promise<IConfig | null>;
  toggleConfigActive: (principalType: PrincipalType, principalId: string | Types.ObjectId, isActive: boolean, session?: ClientSession, options?: {
    expectEmpty?: boolean;
  }) => Promise<IConfig | null>;
};
type ConfigMethods = ReturnType<typeof createConfigMethods>;
//#endregion
//#region src/methods/mcpAuthority.d.ts
declare const MAX_MCP_AUTHORITY_TARGETS = 32;
type MCPAuthorityMethods = MCPAuthorityDatabaseMethods;
interface MCPAuthorityMethodHooks {
  afterPrincipalSnapshot?: () => void | Promise<void>;
  /** Overrides the cooldown that throttles snapshot-namespace preflight
  * retries after a failure. Tests use it to exercise both sides of the
  * boundary without waiting. */
  snapshotNamespaceRetryCooldownMs?: number;
}
declare class MCPAuthorityProofError extends Error {
  readonly reason: MCPAuthorityRejectionReason;
  readonly serverName?: string | undefined;
  constructor(reason: MCPAuthorityRejectionReason, message: string, serverName?: string | undefined);
}
declare function digestMCPAuthorityValue(value: unknown): string;
declare function createMCPAuthorityBootRevision(revision: string, immutableConfig: MCPAuthorityImmutableConfig): MCPAuthorityBootRevision;
interface MCPAuthorityConfigSourceDocument {
  _id: Types.ObjectId | string;
  principalType: PrincipalType;
  principalId: Types.ObjectId | string;
  priority: number;
  overrides?: IConfig["overrides"];
  tombstones?: readonly string[];
  isActive: boolean;
  configVersion: number;
  updatedAt?: Date | null;
}
declare function createMCPAuthorityConfigSourceRevision(bootDigest: string, documents: readonly MCPAuthorityConfigSourceDocument[]): string;
declare function createMCPAuthorityDatabaseSourceRevision(server: {
  databaseId: string;
  serverName: string;
  author: string;
  config: MCPServerDocument["config"];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}): string;
interface MCPAuthorityCredentialSourceDocument {
  _id: Types.ObjectId | string;
  authField: string;
  value: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}
declare function createMCPAuthorityCredentialRevision(credentialFields: readonly string[], credentials: readonly MCPAuthorityCredentialSourceDocument[]): string;
//#endregion
//#region src/methods/insights.d.ts
type InsightsOptions = TInsightsParams & {
  tenantId?: string;
  agents?: TInsightsAgent[];
};
type InsightsResult = TInsightsResponse;
type InsightsMethods = {
  getInsights: (options?: InsightsOptions) => Promise<InsightsResult>;
};
//#endregion
//#region src/methods/index.d.ts
type AllMethods = UserMethods & SessionMethods & TokenMethods & RefreshTokenBridgeMethods & OpenIDRefreshFlightMethods & RoleMethods & KeyMethods & FileMethods & MemoryMethods & ToolFavoriteMethods & AgentCategoryMethods & AgentApiKeyMethods & MCPServerMethods & CodeEnvironmentMethods & UserGroupMethods & AclEntryMethods & SystemGrantMethods & AuditLogMethods & ShareMethods & AccessRoleMethods & PluginAuthMethods & ActionMethods & AssistantMethods & BannerMethods & ToolCallMethods & CategoriesMethods & PresetMethods & ConversationTagMethods & ConversationImportMethods & MessageMethods & ConversationMethods & ChatProjectMethods & TxMethods & TransactionMethods & SpendTokensMethods & PromptMethods & SkillMethods & SkillSyncMethods & AgentTriggerDeliveryMethods & AgentQueuedTurnMethods & ScheduleMethods & AgentMethods & ConfigMethods & MCPAuthorityMethods & InsightsMethods;
/** Dependencies injected from the api layer into createMethods */
interface CreateMethodsDeps {
  /** Matches a model name to a canonical key. From @librechat/api. */
  matchModelName?: (model: string, endpoint?: string) => string | undefined;
  /** Finds the first key in values whose key is a substring of model. From @librechat/api. */
  findMatchingPattern?: (model: string, values: Record<string, number | Record<string, number>>) => string | undefined;
  /** Removes all ACL permissions for a resource. From PermissionService. */
  removeAllPermissions?: (params: {
    resourceType: string;
    resourceId: unknown;
  }) => Promise<void>;
  /** Returns a cache store for the given key. From getLogStores. */
  getCache?: RoleDeps["getCache"];
  /** Recognizes agent skill IDs supplied by an external, non-database registry. */
  isExternalSkillId?: AgentDeps["isExternalSkillId"];
}
/**
* Creates all database methods for all collections
* @param mongoose - Mongoose instance
* @param deps - Optional dependencies injected from the api layer
*/
declare function createMethods(mongoose: typeof import("mongoose"), deps?: CreateMethodsDeps): AllMethods;
//#endregion
//#region src/config/winston.d.ts
declare const baseLogFormat: winston.Logform.Format;
declare const logger: winston.Logger;
//#endregion
//#region src/config/meiliLogger.d.ts
declare const logger$1: winston.Logger;
//#endregion
//#region src/config/parsers.d.ts
/**
* Redacts sensitive information from a console message and trims it to a specified length if provided.
* @param str - The console message to be redacted.
* @param trimLength - The optional length at which to trim the redacted message.
* @returns The redacted and optionally trimmed console message.
*/
declare function redactMessage(str: string, trimLength?: number): string;
/**
* Redacts sensitive information from log messages at every level.
* Note: Intentionally mutates the object.
* @param info - The log information object.
* @returns The modified log information object.
*/
/**
* Truncates long string values in JSON log objects.
* Prevents outputting extremely long values (e.g., base64, blobs).
*/
declare const jsonTruncateFormat: winston.Logform.FormatWrap;
//#endregion
//#region src/config/tenantContext.d.ts
interface TenantContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  requestMethod?: string;
  requestPath?: string;
}
/** Sentinel value for deliberate cross-tenant system operations */
declare const SYSTEM_TENANT_ID = "__SYSTEM__";
/**
* AsyncLocalStorage instance for propagating tenant context.
* Callbacks passed to `tenantStorage.run()` must be `async` for the context to propagate
* through Mongoose query execution. Sync callbacks returning a Mongoose thenable will lose context.
*/
declare const tenantStorage: AsyncLocalStorage<TenantContext>;
/** Returns the current tenant ID from async context, or undefined if none is set */
declare function getTenantId(): string | undefined;
/** Returns the current user ID from async context, or undefined if none is set */
declare function getUserId(): string | undefined;
/** Returns the current request ID from async context, or undefined if none is set */
declare function getRequestId(): string | undefined;
/** Returns the safe request method from async context, or undefined if none is set */
declare function getRequestMethod(): string | undefined;
/** Returns the safe request path from async context, or undefined if none is set */
declare function getRequestPath(): string | undefined;
/**
* Runs a function in an explicit cross-tenant system context (bypasses tenant filtering).
* The callback MUST be async — sync callbacks returning Mongoose thenables will lose context.
*/
declare function runAsSystem<T>(fn: () => Promise<T>): Promise<T>;
/**
* Appends `:${tenantId}` to a cache key when a non-system tenant context is active.
* Returns the base key unchanged when no ALS context is set or when running
* inside `runAsSystem()` (SYSTEM_TENANT_ID context).
*/
declare function scopedCacheKey(baseKey: string): string;
//#endregion
//#region src/migrations/tenantIndexes.d.ts
interface MigrationResult {
  planned: string[];
  dropped: string[];
  skipped: string[];
  errors: string[];
}
/**
* Drops superseded unique indexes that block multi-tenant operation.
* Idempotent — skips indexes that don't exist. Safe to run on fresh databases.
*
* Call this before enabling multi-tenant middleware on an existing deployment.
* On a fresh database (no pre-existing data), this is a no-op.
*/
declare function dropSupersededTenantIndexes(connection: Connection, {
  dryRun
}?: {
  dryRun?: boolean;
}): Promise<MigrationResult>;
/**
* Offline upgrade: build tenant constraints before removing global constraints,
* then explicitly create current indexes even when MONGO_AUTO_INDEX is disabled.
* The caller must connect with autoIndex and autoCreate disabled and stop writers.
*/
declare function migrateTenantIndexes(connection: Connection, {
  dryRun
}?: {
  dryRun?: boolean;
}): Promise<MigrationResult>;
//#endregion
//#region src/migrations/promptGroupIndexes.d.ts
declare function dropSupersededPromptGroupIndexes(connection: Connection): Promise<{
  dropped: string[];
  skipped: string[];
  errors: string[];
}>;
//#endregion
//#region src/migrations/mcpAuthorityIndexes.d.ts
/** Creates the bounded lookup indexes required before MCP authority proofs are enabled. */
declare function createMCPAuthorityLookupIndexes(connection: Connection): Promise<readonly string[]>;
//#endregion
//#region src/migrations/mcpServerNames.d.ts
interface MCPServerNameMigrationResult {
  scanned: number;
  updated: number;
}
declare class MCPServerNameMigrationError extends Error {
  constructor(message: string);
}
/** Backfills the compact normalized-name index required before authority proofs are enabled. */
declare function backfillMCPServerNormalizedNames(connection: Connection): Promise<MCPServerNameMigrationResult>;
//#endregion
export { AGENT_EVENT_ACTOR_SUMMARY_VERSION, AGENT_FADING_TIER_VERSION, AGENT_TRIGGER_WORKER_CAPABILITY_BACKGROUND_COMPLETION_V1, AGENT_TRIGGER_WORKER_CAPABILITY_DETACHED_ACTION_V1, AGENT_TRIGGER_WORKER_CAPABILITY_QUEUED_TURN_V1, AUDIT_ACTIONS, AUDIT_ACTION_CATEGORY, AUDIT_ACTOR_TYPES, AUDIT_CATEGORIES, AUDIT_OUTCOMES, AUDIT_SCHEMA_VERSION, AUDIT_SEVERITIES, type AccessRole, type AccessRoleMethods, type AclEntry, type AclEntryMethods, type ActionMethods, type ActionQuery, type AddToolFavoriteResult, type AdminAuditLogEntry, type AdminConfig, type AdminConfigDeleteResponse, type AdminConfigListResponse, type AdminConfigResponse, type AdminGroup, type AdminMember, type AdminSystemGrant, type AdminUserListItem, type AdminUserSearchResult, type AgentApiKeyCreateData, type AgentApiKeyCreateResult, type AgentApiKeyDeleteResult, type AgentApiKeyListItem, type AgentApiKeyMethods, type AgentApiKeyQuery, type AgentCategory, type AgentCategoryMethods, type AgentEventActorDetachedAction, type AgentEventActorReceipt, type AgentEventActorReceiptMetric, type AgentEventActorReceiptStorageMetrics, type AgentEventActorReconciliationStorageMetrics, type AgentGraphAccess, type AgentGraphAccessContext, type AgentGraphNode, type AgentMethods, type AgentQueuedTurnActiveRecord, AgentQueuedTurnCapacityError, type AgentQueuedTurnClaim, AgentQueuedTurnConflictError, type AgentQueuedTurnDeliveryState, type AgentQueuedTurnFailure, type AgentQueuedTurnFileRef, AgentQueuedTurnLaneRetiredError, type AgentQueuedTurnMethods, type AgentQueuedTurnRecord, type AgentQueuedTurnStatus, type AgentQueuedTurnTerminalReceipt, type AgentTriggerDeliveryClaim, AgentTriggerDeliveryConflictError, type AgentTriggerDeliveryFailure, type AgentTriggerDeliveryHistoryEntry, type AgentTriggerDeliveryMethods, type AgentTriggerDeliveryOutcome, type AgentTriggerDeliveryRecord, type AgentTriggerDeliveryStatus, type AgentTriggerDeliveryStatusRecord, type AgentTriggerHandlingState, type AgentTriggerOrderingBlock, type AgentTriggerProducerLeaseStatus, type AllMethods, type AppConfig, AppService, type AssignConversationToProjectResult, type AssistantMethods, type AssistantQuery, type AuditAction, type AuditActor, type AuditActorInput, type AuditActorType, type AuditCategory, type AuditChainVerification, type AuditCheckpoint, type AuditContext, type AuditIntegrity, type AuditLog, type AuditLogFilters, type AuditLogMethods, type AuditLogPage, type AuditMetadata, type AuditMetadataValue, type AuditOutcome, type AuditSeverity, type AuditTarget, type AuditTargetInput, BASE_CONFIG_PRINCIPAL_ID, type BackgroundToolResultClaim, type BackgroundToolResultRecord, type BalanceConfig, type BalanceReservationRelease, type BalanceReservationRenewal, type BalanceReservationRequest, type BalanceReservationResult, type BannerMethods, BaseSystemCapability, CANCEL_RATE, CAPABILITY_CATEGORIES, CLIENT_MESSAGE_SELECT, COMPACTION_SEMANTIC_INDEX_PROJECTION_VERSION, type CacheStore, CapabilityCategory, CapabilityImplications, type CategoriesMethods, type ChatProjectMethods, type ChatProjectSortBy, type ChatProjectSortDirection, type CodeEnvironment, type CodeEnvironmentDocument, type CodeEnvironmentMethods, type CodeFileCommitData, type Config, ConfigAssignTarget, type ConfigMethods, ConfigSection, type ConversationImportMethods, type ConversationMethods, type ConversationTagMethods, type ConversationTraceRefs, type ConvertJsonSchemaToZodOptions, type CreateChatProjectInput, type CreateGroupRequest, type CreateMethodsDeps, type CreateRoleRequest, type CreateSessionOptions, type CreateShareResult, type CreateSkillInput, type CreateSkillResult, type CreateUserRequest, CursorPaginationParams, CursorPaginationResponse, DEFAULT_REFRESH_TOKEN_EXPIRY, DEFAULT_RETENTION_HOURS, DEFAULT_SESSION_EXPIRY, type DeleteAllSessionsOptions, type DeleteAllSharesResult, type DeleteChatProjectResult, type DeleteMemoryParams, type DeletePluginAuthParams, type DeleteSessionParams, type DeleteShareResult, FAVORITE_ITEM_TYPES, type FavoriteItemType, type FileMethods, type FileOwnerScope, type FindPluginAuthParams, type FindPluginAuthsByKeysParams, type FormattedMemoriesResult, type FunctionTool, GENESIS_HASH, type GetFormattedMemoriesParams, type GetShareLinkResult, type GetUserMemoriesParams, type GroupFilterOptions, type IAccessRole, type IAclEntry, type IAction, type IActiveSubagentThreadLease, type IAgent, type IAgentApiKey, type IAgentCategory, type IAgentEventActorCheckpoint, type IAgentEventActorContextFingerprint, type IAgentEventActorContextMeta, type IAgentEventActorInvocationReference, type IAgentEventActorLegacyTurn, type IAgentEventActorReconciliation, type IAgentEventActorSkillIdentity, type IAgentEventActorSnapshot, type IAgentEventActorState, type IAgentEventActorSummary, type IAgentEventActorSuspension, type IAgentEventActorSuspensionEvidence, type IAgentEventBinding, type IAgentEventBindingRecord, type IAgentFadingTier, type IAgentFadingTierEntry, type IAgentQueuedTurn, type IAgentQueuedTurnDocument, type IAgentQueuedTurnSequence, type IAgentQueuedTurnSequenceDocument, type IAgentTriggerDelivery, type IAgentTriggerDeliveryDocument, type IAgentTriggerLaneSequence, type IAgentTriggerLaneSequenceDocument, type IAgentTriggerUserPurge, type IAgentTriggerUserPurgeDocument, type IAssistant, type IAuditLog, type IBalance, type IBalancePendingRefill, type IBalanceReservation, type IBalanceUpdate, type IBanner, type IChatProject, type IChatProjectDocument, type ICompactionActivitySemanticIndexEntry, type ICompactionReasoningSemanticIndexEntry, type ICompactionSemanticIndexProjection, type ICompactionToolSemanticIndexEntry, type IConfig, type IConversation, type IGroup, type IMemoryEntry, type IMemoryEntryLean, type IMessage, type IMongoFile, type IOpenIDRefreshFlight, type IPluginAuth, type IPrompt, type IPromptGroup, type IPromptGroupDocument, type IRefreshTokenBridge, type IRole, type ISchedule, type IScheduleDocument, type IScheduleRun, type IScheduleRunDocument, type ISession, type ISharedLink, type ISkill, type ISkillDocument, type ISkillFile, type ISkillFileDocument, type ISkillSummary, type ISkillSyncCredential, type ISkillSyncCredentialDocument, type ISkillSyncSkippedFile, type ISkillSyncSkippedSkill, type ISkillSyncStatus, type ISkillSyncStatusDocument, type ISubagentTaskControlReceipt, type ISubagentThreadLease, type ISubagentThreadReservation, type ISupportContact, type ISystemGrant, type IToken, type IToolFavorite, type IToolFavoriteLean, type IUser, type IndexBuildOptions, type InsightsMethods, type JsonSchemaType, type KeyMethods, type ListChatProjectsOptions, type ListChatProjectsResult, type ListSkillsByAccessParams, type ListSkillsByAccessResult, MAX_AGENT_EVENT_ACTOR_DISCOVERED_TOOLS, MAX_AGENT_EVENT_ACTOR_ENCODING_LENGTH, MAX_AGENT_EVENT_ACTOR_SKILLS, MAX_AGENT_EVENT_ACTOR_SUMMARY_LENGTH, MAX_AGENT_EVENT_ACTOR_TOOL_NAME_LENGTH, MAX_AUDIT_EXPORT_ROWS, MAX_AUDIT_LOG_LIMIT, MAX_AUDIT_VERIFY_ROWS, MAX_COMPACTION_SEMANTIC_INDEX_ENTRIES, MAX_COMPACTION_SEMANTIC_INDEX_IDENTITY_LENGTH, MAX_COMPACTION_SEMANTIC_INDEX_SOURCE_CONTENT_INDEX, MAX_COMPACTION_SEMANTIC_INDEX_TEXT_LENGTH, MAX_MCP_AUTHORITY_TARGETS, MAX_PERM_BITS, MAX_RETENTION_HOURS, MAX_TOOL_FAVORITES, type MCPAuthorityAssertInput, type MCPAuthorityBootRevision, type MCPAuthorityConfigProof, type MCPAuthorityConfigSourceDocument, type MCPAuthorityCredentialSourceDocument, type MCPAuthorityDatabaseMethods, type MCPAuthorityGroupProof, type MCPAuthorityImmutableConfig, type MCPAuthorityMethodHooks, type MCPAuthorityMethods, MCPAuthorityProofError, type MCPAuthorityProofV1, type MCPAuthorityRejectionReason, type MCPAuthorityResolveInput, type MCPAuthorityRoleProof, type MCPAuthorityServerProofV1, type MCPAuthorityServerSource, type MCPAuthoritySharedProofV1, type MCPAuthorityTargetInput, type MCPAuthorityUserProof, type MCPAuthorizationFenceRetryStorage, type MCPServerDocument, type MCPServerMethods, MCPServerNameMigrationError, type MCP_AUTHORITY_PROOF_VERSION, MEILI_SEARCH_LIMIT, MIN_RETENTION_HOURS, type MemoryByIdParams, type MemoryMethods, type MemoryResult, type MessageMethods, type OIDCTokens, type ObjectId, type OneOrMany, type OpenIDRefreshFlightAcquireResult, type OpenIDRefreshFlightClaimDeliveryData, type OpenIDRefreshFlightCompleteData, type OpenIDRefreshFlightCreateData, type OpenIDRefreshFlightFailData, type OpenIDRefreshFlightMethods, type OpenIDRefreshFlightQuery, type OpenIDRefreshFlightReleaseDeliveryData, type OpenIDRefreshFlightRenewData, type OpenIDRefreshFlightRevokeData, type OpenIDRefreshFlightStatus, PLATFORM_CHAIN_KEY, type ParentSubagentTaskRecord, type ParentSubagentThreadRecord, Paths, type PluginAuthMethods, type PluginAuthQuery, type PresetMethods, type PromptMethods, type PublishRunArtifactInput, type PurgeAuditLogOptions, type PurgeAuditLogResult, type RecordAuditEntryInput, type RecordAuditEntryOptions, type RefreshTokenBridgeCreateData, type RefreshTokenBridgeDeleteData, type RefreshTokenBridgeMethods, type RefreshTokenBridgeQuery, type RemoveToolFavoriteResult, ResourceCapabilityMap, RetentionFilterDocument, RoleBits, RoleConflictError, type RoleFilterOptions, type RoleMethods, type RolePermissions, type RolePermissionsInput, type RunArtifactClaim, type RunArtifactContent, type RunArtifactFile, type RunArtifactRunScope, type RunArtifactScope, SUBAGENT_TRANSCRIPT_SOURCE_BYTE_LIMIT, SYSTEM_TENANT_ID, type SampledTraceMessage, type ScheduleMethods, type SessionMethods, type SessionQueryOptions, type SessionResult, type SessionSearchParams, type SetMemoryByIdParams, type SetMemoryByIdResult, type SetMemoryParams, type ShareMethods, type ShareServiceError, type SharedFile, type SharedFileSnapshot, type SharedLinksResult, type SharedMessage, type SharedMessagesResult, type SignPayloadParams, type SkillDeps, type SkillMethods, type SkillSyncCredentialSummary, type SkillSyncMethods, type SkillSyncProvider, type SkillSyncRunStatus, type SkillSyncStatusInput, type SpendTokensMethods, type SubagentTaskControlAction, type SubagentTaskControlReceiptStatus, type SubagentTaskResultClaim, type SubagentThreadViewMessageRecord, type SubagentTriggerProjection, SystemCapabilities, SystemCapability, type SystemGrant, type SystemGrantMethods, type TAgentEventActorEvent, type TCompactionSemanticIndexEntry, type TCompactionSemanticIndexStatus, type TWebSearchCategories, type TWebSearchKeys, type TenantContext, type TokenCreateData, type TokenDeleteResult, type TokenMethods, type TokenQuery, type TokenUpdateData, type ToolCallMethods, type ToolFavoriteMethods, type ToolFavoriteParams, type TransactionData, type TransactionMethods, type TxMethods, type UpdateChatProjectInput, type UpdateExpirationOptions, type UpdateGroupRequest, type UpdatePluginAuthParams, type UpdateRoleRequest, type UpdateShareResult, type UpdateSkillInput, type UpdateSkillResult, type UpdateUserRequest, type UpsertSessionOptions, type UpsertSkillFileInput, type UpsertSkillSyncCredentialInput, type UserDeleteResult, type UserFilterOptions, type UserGroupMethods, type UserMethods, type UserQueryOptions, type ValidationIssue, type VerifyAuditChainOptions, aclEntrySchema, Action as actionSchema, activeExpirationFilter, agentApiKeySchema, agentCategorySchema, agentSchema, agentsConfigSetup, assistantSchema, auditLogSchema, backfillMCPServerNormalizedNames, balanceSchema, bannerSchema, baseLogFormat, buildIndexWithRetry, buildRetentionVisibilityFilter, cacheTokenValues, categoriesSchema, chatProjectSchema, codeEnvironmentSchema, configCapability, configSchema, conversationTag as conversationTagSchema, convoSchema, createChatExpirationDate, createFallbackRetentionDate, createIndexesWithRetry, createMCPAuthorityBootRevision, createMCPAuthorityConfigSourceRevision, createMCPAuthorityCredentialRevision, createMCPAuthorityDatabaseSourceRevision, createMCPAuthorityLookupIndexes, createMCPAuthorizationFenceRetryStorage, createMethods, createModels, createTempChatExpirationDate, createTxMethods, decrypt, decryptV2, decryptV3, defaultRate, defaultVertexModels, deriveStructuredFrontmatterFields, digestMCPAuthorityValue, dropSupersededPromptGroupIndexes, dropSupersededTenantIndexes, encrypt, encryptV2, encryptV3, escapeRegExp, expandImplications, file as fileSchema, getCanonicalSkillFrontmatterKey, getRandomValues, getRequestId, getRequestMethod, getRequestPath, getTempChatRetentionHours, getTenantId, getTransactionSupport, getUserId, getWebSearchKeys, groupSchema, hasImpliedCapability, hashBackupCode, hashToken, inferSkillFileCategory, isAgentFadingTier, isAgentFadingTierEntries, isAgentFadingTierEntry, isCompactionSemanticIndexProjection, isIndexBuildInProgress, isMemoryAgentEnabled, isMemoryEnabled, isRuntimeDisabled, isValidCapability, isValidMemoryKey, isValidObjectIdString, jsonTruncateFormat, keySchema, legacyPermanentExpirationFilter, loadDefaultInterface, loadFiltersConfig, loadLangfuseConfig, loadMemoryConfig, loadSkillSyncConfig, loadSummarizationConfig, loadTurnstileConfig, loadWebSearchConfig, logger, logger$1 as meiliLogger, MemoryEntrySchema as memorySchema, mergeConfigOverrides, messageSchema, migrateTenantIndexes, normalizePrincipalId, normalizeSkillFrontmatterKeys, openidRefreshFlightSchema, partitionIssues, permissionBitSupersets, pluginAuthSchema, premiumTokenValues, presetSchema, processModelSpecs, promptGroupSchema, promptSchema, queuedTurnSchema, queuedTurnSequenceSchema, readConfigCapability, recordAgentEventActorReceiptMetric, redactMessage, refreshTokenBridgeSchema, roleSchema, runAfterTransaction, runAsSystem, sanitizeUIResourceContent, scheduleRunSchema, scheduleSchema, scopedCacheKey, sessionSchema, setAgentEventActorReceiptMetricObserver, shareSchema, signPayload, skillSyncCredentialSchema, skillSyncStatusSchema, stripMessageUIResourceMarkers, stripUIResourceMarkers, stripYamlTrailingComment, supportsTransactions, systemGrantSchema, tenantSafeBulkWrite, tenantStorage, tokenSchema, tokenValues, toolCallSchema, toolFavoriteSchema, transactionSchema, triggerDeliverySchema, triggerLaneSequenceSchema, triggerUserPurgeSchema, userSchema, validateRelativePath, validateSkillBody, validateSkillDescription, validateSkillFrontmatter, validateSkillName, validateVertexConfig, vertexConfigSetup, webSearchAuth, webSearchKeys, webSearchSelectionFields };
//# sourceMappingURL=index.d.mts.map