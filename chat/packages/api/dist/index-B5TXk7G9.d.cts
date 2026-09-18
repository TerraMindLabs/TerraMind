import { AppConfig, IAgentEventActorContextMeta, ICompactionSemanticIndexProjection, IConversation, IMongoFile, IPromptGroup, IUser, OIDCTokens, TokenMethods } from "@librechat/data-schemas";
import { Error as Error$1, Types } from "mongoose";
import { AgentModelParameters, Agents, AuthKeys, BedrockConverseInput, BedrockDocumentFormat, CodeApprovalMode, CodeEnvironmentMode, CodeWorkspaceSelection, MCPOptionsSchema, MCPServersSchema, PrincipalType, RefillIntervalUnit, SSEOptionsSchema, SearchResultData, StdioOptionsSchema, StreamableHTTPOptionsSchema, TConfig, TEndpointOption, TFile, TPendingSteer, TPlugin, TRole, TVertexAISchema, ThinkingDisplayWireValue, Tools, UIResource, UserSubmittedMessageFieldPath, WebSocketOptionsSchema, anthropicSchema, googleBaseSchema, openAISchema } from "librechat-data-provider";
import { Request } from "express";
import { z } from "zod";
import { Dispatcher } from "undici";
import { AnthropicClientOptions, AskUserQuestionResolution, AskUserQuestionsResolution, ClientOptions, EventHandler, HookCallback, HookInputByEvent, LCTool, OpenAIClientOptions, Providers, RunStep, ToolApprovalDecisionMap } from "@librechat/agents";
import { BindToolsInput } from "@librechat/agents/langchain/language_models/chat_models";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { Readable } from "stream";
import { EventEmitter } from "events";
import { AudioContent, EmbeddedResource, ImageContent, ListToolsResult, ResourceLink, TextContent, Tool } from "@modelcontextprotocol/sdk/types.js";
import { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { Logger } from "winston";
import { Keyv, StoredDataNoRaw } from "keyv";

//#region src/utils/key.d.ts
interface GoogleServiceKey {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  [key: string]: unknown;
}
/**
* Load Google service key from file path, URL, or stringified JSON
* @param keyPath - The path to the service key file, URL to fetch it from, or stringified JSON
* @returns The parsed service key object or null if failed
*/
declare function loadServiceKey(keyPath: string): Promise<GoogleServiceKey | null>;
/**
* Checks if a user key has expired based on the provided expiration date and endpoint.
* If the key has expired, it throws an Error with details including the type of error,
* the expiration date, and the endpoint.
*
* @param expiresAt - The expiration date of the user key in a format that can be parsed by the Date constructor
* @param endpoint - The endpoint associated with the user key to be checked
* @throws Error if the user key has expired. The error message is a stringified JSON object
* containing the type of error (`ErrorTypes.EXPIRED_USER_KEY`), the expiration date as an ISO 8601
* timestamp the client formats in the reader's locale, and the endpoint.
*/
declare function checkUserKeyExpiry(expiresAt: string, endpoint: string): void;
//#endregion
//#region src/types/azure.d.ts
/**
* Azure OpenAI configuration interface
*/
interface AzureOptions {
  azureOpenAIApiKey?: string;
  azureOpenAIApiInstanceName?: string;
  azureOpenAIApiDeploymentName?: string;
  azureOpenAIApiVersion?: string;
  azureOpenAIBasePath?: string;
}
/**
* Client with azure property for setting deployment name
*/
interface GenericClient {
  azure: {
    azureOpenAIApiDeploymentName?: string;
  };
}
//#endregion
//#region src/types/openai.d.ts
type OpenAIParameters = z.infer<typeof openAISchema>;
type OpenAIModelOptions = Partial<OpenAIParameters>;
/**
* Configuration options for the getLLMConfig function
*/
interface OpenAIConfigOptions {
  modelOptions?: OpenAIModelOptions;
  directEndpoint?: boolean;
  reverseProxyUrl?: string | null;
  baseURLIsUserProvided?: boolean;
  allowedAddresses?: string[] | null;
  defaultQuery?: Record<string, string | undefined>;
  headers?: Record<string, string>;
  proxy?: string | null;
  azure?: false | AzureOptions;
  streaming?: boolean;
  addParams?: Record<string, unknown>;
  dropParams?: string[];
  customParams?: Partial<TConfig["customParams"]>;
}
type OpenAIConfiguration = OpenAIClientOptions["configuration"];
type OAIClientOptions = Omit<OpenAIClientOptions, "verbosity"> & {
  include_reasoning?: boolean; /** Replays `reasoning_content` on tool-bearing turns (DeepSeek thinking-mode, #13366). */
  includeReasoningContent?: boolean;
  promptCache?: boolean;
  promptCacheTtl?: "5m" | "1h";
  /**
  * Declares that this client talks to a first-party OpenAI or Azure surface, which is
  * what gates the agents SDK's model-specific request constraints (GPT-6
  * Astra: Responses-only tool calls, rejected sampling parameters,
  * unsupported reasoning efforts). The SDK defaults them off and takes this as
  * a declaration rather than inferring it from a base URL, because only this
  * layer knows whether a URL is a faithful first-party route or a gateway.
  */
  firstPartyEndpoint?: boolean;
  _lc_stream_delay?: number;
  verbosity?: string | null;
};
/**
* Return type for getLLMConfig function
*/
interface LLMConfigResult<T = OAIClientOptions> {
  llmConfig: T;
  provider?: Providers;
  tools?: BindToolsInput[];
}
type OpenAIConfigResult = LLMConfigResult<OAIClientOptions> & {
  configOptions?: OpenAIConfiguration;
};
//#endregion
//#region src/types/anthropic.d.ts
type AnthropicParameters = z.infer<typeof anthropicSchema>;
type AnthropicCredentials = {
  [AuthKeys.GOOGLE_SERVICE_KEY]?: GoogleServiceKey;
  [AuthKeys.ANTHROPIC_API_KEY]?: string;
};
/**
* Vertex AI client options for configuring the Anthropic Vertex client.
* These options are typically loaded from the YAML config or environment variables.
*/
interface VertexAIClientOptions$1 {
  /** Google Cloud region for Vertex AI (e.g., 'us-east5', 'europe-west1') */
  region?: string;
  /** Google Cloud Project ID */
  projectId?: string;
}
interface ThinkingConfigDisabled {
  type: "disabled";
}
interface ThinkingConfigEnabled {
  /**
  * Determines how many tokens Claude can use for its internal reasoning process.
  * Larger budgets can enable more thorough analysis for complex problems, improving
  * response quality.
  *
  * Must be ≥1024 and less than `max_tokens`.
  *
  * See
  * [extended thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
  * for details.
  */
  budget_tokens: number;
  type: "enabled";
}
interface ThinkingConfigAdaptive {
  type: "adaptive";
  display?: ThinkingDisplayWireValue;
}
/**
* Configuration for enabling Claude's extended thinking.
*
* When enabled, responses include `thinking` content blocks showing Claude's
* thinking process before the final answer. Requires a minimum budget of 1,024
* tokens and counts towards your `max_tokens` limit.
*
* See
* [extended thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
* for details.
*/
type ThinkingConfigParam = ThinkingConfigEnabled | ThinkingConfigDisabled | ThinkingConfigAdaptive;
type AnthropicModelOptions = Partial<Omit<AnthropicParameters, "thinking">> & {
  thinking?: AnthropicParameters["thinking"] | null;
  user?: string;
};
/**
* Configuration options for the getLLMConfig function
*/
interface AnthropicConfigOptions {
  modelOptions?: AnthropicModelOptions;
  /** Proxy server URL */
  proxy?: string | null;
  /** URL for a reverse proxy, if used */
  reverseProxyUrl?: string | null;
  /** Whether the reverse proxy URL came from a user-stored credential */
  baseURLIsUserProvided?: boolean;
  /** Admin-approved internal host:port exemptions for user-provided base URLs */
  allowedAddresses?: string[] | null;
  /** Default parameters to apply only if fields are undefined */
  defaultParams?: Record<string, unknown>;
  /** Additional parameters to add to the configuration */
  addParams?: Record<string, unknown>;
  /** Parameters to drop/exclude from the configuration */
  dropParams?: string[];
  /**
  * Admin-configured custom request headers (with unresolved placeholders).
  * Merged beneath provider-managed headers and resolved at request time.
  */
  headers?: Record<string, string>;
  /** Vertex AI specific options for Google Cloud configuration */
  vertexOptions?: VertexAIClientOptions$1;
  /** Full Vertex AI configuration including model mappings from YAML config */
  vertexConfig?: TVertexAISchema;
}
/**
* Return type for getLLMConfig function
*/
type AnthropicLLMConfigResult = LLMConfigResult<AnthropicClientOptions & {
  clientOptions?: {
    fetchOptions?: {
      dispatcher?: Dispatcher;
      redirect?: RequestRedirect;
    };
  };
  stream?: boolean;
}>;
//#endregion
//#region src/types/balance.d.ts
interface BalanceUpdateFields {
  user?: string;
  tokenCredits?: number;
  autoRefillEnabled?: boolean;
  refillIntervalValue?: number;
  refillIntervalUnit?: RefillIntervalUnit;
  refillAmount?: number;
  lastRefill?: Date;
}
//#endregion
//#region src/types/bedrock.d.ts
/**
* AWS credentials for Bedrock
* Extends AWS AwsCredentialIdentity to ensure compatibility
*/
type BedrockCredentials = Partial<AwsCredentialIdentity>;
/**
* User-provided Bedrock credentials can be either AWS credentials or an API key.
*/
type BedrockUserCredentials = BedrockCredentials & {
  bearerToken?: string;
};
/**
* AWS Bedrock Guardrail configuration
* @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_GuardrailConfiguration.html
*/
interface GuardrailConfiguration {
  /** The identifier for the guardrail (ID or ARN) */
  guardrailIdentifier: string;
  /** The version of the guardrail (version number or "DRAFT") */
  guardrailVersion: string;
  /** The trace behavior for the guardrail */
  trace?: "enabled" | "disabled" | "enabled_full";
  /** The processing mode for guardrail; 'sync' is the default guardrail behavior if unset */
  streamProcessingMode?: "sync" | "async";
}
/**
* AWS Bedrock Inference Profile configuration
* Maps model IDs to their inference profile ARNs
* @see https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html
*/
type InferenceProfileConfig = Record<string, string>;
/**
* Configuration options for Bedrock LLM
*/
interface BedrockConfigOptions {
  modelOptions?: Partial<BedrockConverseInput>;
  /** AWS region for Bedrock */
  region?: string;
  /** Optional pre-configured Bedrock client (used with proxy) */
  client?: BedrockRuntimeClient;
  /** AWS credentials */
  credentials?: BedrockCredentials;
  /** AWS shared config profile for the SDK credential provider chain */
  profile?: string;
  /** Custom endpoint host for reverse proxy */
  endpointHost?: string;
  /** Guardrail configuration for content filtering */
  guardrailConfig?: GuardrailConfiguration;
  /** Inference profile ARNs keyed by model ID / friendly name */
  inferenceProfiles?: InferenceProfileConfig;
}
/**
* Return type for Bedrock getOptions function
*/
interface BedrockLLMConfigResult {
  llmConfig: BedrockConverseInput & {
    region?: string;
    client?: BedrockRuntimeClient;
    credentials?: BedrockCredentials;
    profile?: string;
    endpointHost?: string;
    guardrailConfig?: GuardrailConfiguration;
    applicationInferenceProfile?: string;
  };
  configOptions: Record<string, unknown>;
}
//#endregion
//#region src/types/http.d.ts
/**
* TerraMind-specific request body type that extends Express Request body
* (have to use type alias because you can't extend indexed access types like Request['body'])
*/
type RequestBody = {
  messageId?: string;
  fileTokenLimit?: number;
  conversationId?: string;
  parentMessageId?: string;
  endpoint?: string;
  endpointType?: string;
  model?: string;
  imageDetail?: Agents.ImageDetail;
  key?: string;
  endpointOption?: Partial<TEndpointOption>; /** Browser IANA timezone used to resolve local-time prompt variables (e.g. `{{current_datetime}}`). */
  timezone?: string;
  codeApprovalMode?: CodeApprovalMode;
  codeEnvironmentMode?: CodeEnvironmentMode;
  codeWorkspaces?: CodeWorkspaceSelection[];
};
type ServerRequest = Request<unknown, unknown, RequestBody> & {
  user?: IUser;
  config?: AppConfig; /** Server-captured generation start time used to anchor dynamic prompt variables. */
  turnStartedAt?: number; /** Server-captured conversation creation time used when inserting conversation metadata. */
  conversationCreatedAt?: string;
  /** Conversation read by request middleware (`null` = looked up, absent), reused by the
  *  subagent guard, agent initialization, and the first save instead of re-reading it. */
  resolvedConversation?: Partial<IConversation> | null; /** Passport strategy that populated req.user for this request. */
  authStrategy?: string;
};
//#endregion
//#region src/types/tokens.d.ts
interface TokenConfig {
  [key: string]: number;
  prompt: number;
  completion: number;
  context: number;
}
/** An endpoint's config object mapping model keys to their respective prompt, completion rates, and context limit */
type EndpointTokenConfig = Record<string, TokenConfig>;
//#endregion
//#region src/types/endpoints.d.ts
type TCustomEndpointsConfig = Partial<{
  [key: string]: Omit<TConfig, "order">;
}>;
/**
* Interface for user key values retrieved from the database
*/
interface UserKeyValues {
  apiKey?: string;
  baseURL?: string;
}
/**
* Function type for getting user key (single decrypted value)
*/
type GetUserKeyFunction = (params: {
  userId: string;
  name: string;
}) => Promise<string>;
/**
* Function type for getting user key values (parsed JSON object with apiKey/baseURL)
*/
type GetUserKeyValuesFunction = (params: {
  userId: string;
  name: string;
}) => Promise<UserKeyValues>;
/**
* Database methods required for endpoint initialization
* These are passed in at invocation time to allow for dependency injection
*/
interface EndpointDbMethods {
  /** Get single decrypted key value (used for simple API keys) */
  getUserKey: GetUserKeyFunction;
  /** Get parsed key values object (used for apiKey + baseURL combinations) */
  getUserKeyValues: GetUserKeyValuesFunction;
}
/** Transport-free state consumed while resolving provider credentials and configuration. */
interface EndpointRuntimeContext {
  appConfig?: AppConfig;
  user?: IUser;
  requestBody: RequestBody;
}
/**
* Base parameters for all endpoint initialization functions
*/
interface InitializeParamsBase {
  /** The endpoint name/identifier (e.g., 'openAI', 'anthropic', 'custom-endpoint-name') */
  endpoint: string;
  /** Model parameters from the request (includes model, temperature, topP, etc.) */
  model_parameters?: Record<string, unknown>;
  /** Database methods for user key operations */
  db: EndpointDbMethods;
}
/** Request-backed compatibility contract retained for existing endpoint callers. */
interface BaseInitializeParams extends InitializeParamsBase {
  req: ServerRequest;
  runtime?: never;
}
/** Request-free provider initialization contract used by Agent execution hosts. */
interface RuntimeInitializeParams extends InitializeParamsBase {
  runtime: EndpointRuntimeContext;
  req?: never;
}
type ProviderInitializeParams = BaseInitializeParams | RuntimeInitializeParams;
declare function resolveEndpointRuntime(params: ProviderInitializeParams): EndpointRuntimeContext;
/**
* Base result type that all initialize functions return
* Using a more permissive type to accommodate different provider-specific results
*/
interface InitializeResultBase {
  /** Request-resolved Azure identity, retained when Responses removes the Azure client fields. */
  azureOptions?: AzureOptions;
  llmConfig: ClientOptions;
  configOptions?: OpenAIClientOptions["configuration"];
  endpointTokenConfig?: EndpointTokenConfig;
  useLegacyContent?: boolean;
  provider?: string;
  tools?: unknown[];
}
//#endregion
//#region src/types/error.d.ts
/** MongoDB duplicate key error interface */
interface MongoServerError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
  errmsg?: string;
}
/** Mongoose validation error interface */
interface ValidationError extends Error$1 {
  name: "ValidationError";
  errors: Record<string, {
    message: string;
    path?: string;
  }>;
}
/** Custom error with status code and body */
interface CustomError extends Error {
  statusCode?: number;
  body?: unknown;
  code?: string | number;
}
//#endregion
//#region src/types/events.d.ts
/** SSE streaming event (on_run_step, on_message_delta, etc.) */
type StreamEvent = {
  event: string;
  data: string | Record<string, unknown>;
};
/** Control event emitted when user message is created and generation starts */
type CreatedEvent = {
  created: true;
  message: {
    messageId: string;
    parentMessageId?: string;
    conversationId?: string;
    text?: string;
    sender: string;
    isCreatedByUser: boolean;
    /** Quoted excerpts referenced on this turn, carried through resumable job
    *  metadata so reconstructed user messages keep their `MessageQuotes`. */
    quotes?: string[];
  };
  streamId: string;
};
type FinalMessageFields = {
  messageId?: string;
  parentMessageId?: string;
  conversationId?: string;
  text?: string;
  content?: unknown[];
  sender?: string;
  isCreatedByUser?: boolean;
  unfinished?: boolean; /** Per-message error flag — matches TMessage.error (boolean or error text) */
  error?: boolean | string;
  [key: string]: unknown;
};
/** Terminal event emitted when generation completes or is aborted */
type FinalEvent = {
  final: true;
  /** The terminal status CAS committed, but its normal FINAL payload was not
  * durably published (for example, the owner crashed in that narrow window).
  * Clients close the stream and refetch authoritative message/status state. */
  reconcile?: boolean;
  reconcileReason?: "terminal_payload_missing" | "generation_replaced" | "abort_persistence_failed";
  terminalStatus?: "complete" | "error" | "aborted";
  generationCreatedAt?: number;
  requestMessage?: FinalMessageFields | null;
  responseMessage?: FinalMessageFields | null;
  conversation?: {
    conversationId?: string;
    [key: string]: unknown;
  } | null;
  title?: string;
  aborted?: boolean;
  earlyAbort?: boolean;
  runMessages?: FinalMessageFields[];
  /** Steers that never reached an injection boundary; the client converts
  *  them to queued follow-up messages instead of dropping them. */
  pendingSteers?: TPendingSteer[]; /** Top-level event error (abort-during-completion edge case) */
  error?: {
    message: string;
  };
};
type ServerSentEvent = StreamEvent | CreatedEvent | FinalEvent;
//#endregion
//#region src/storage/types.d.ts
interface SaveBufferParams {
  userId: string;
  buffer: Buffer;
  fileName: string;
  basePath?: string;
  tenantId?: string | null;
  storageRegion?: string | null;
  includeRegionInPath?: boolean;
  useInlinePath?: boolean;
}
interface GetURLParams {
  userId: string;
  fileName: string;
  basePath?: string;
  customFilename?: string | null;
  contentType?: string | null;
  tenantId?: string | null;
  storageRegion?: string | null;
  includeRegionInPath?: boolean;
  useInlinePath?: boolean;
}
interface SaveURLParams {
  userId: string;
  URL: string;
  fileName: string;
  basePath?: string;
  tenantId?: string | null;
  storageRegion?: string | null;
  includeRegionInPath?: boolean;
  useInlinePath?: boolean;
}
interface SaveURLResult {
  filepath: string;
  storageKey?: string;
  storageRegion?: string;
  bytes?: number;
  type?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
}
interface UploadFileParams {
  req: ServerRequest;
  file: Express.Multer.File;
  file_id: string;
  basePath?: string;
  tenantId?: string | null;
  storageRegion?: string | null;
  includeRegionInPath?: boolean;
  useInlinePath?: boolean;
}
interface DownloadURLParams {
  req?: ServerRequest;
  file: TFile;
  customFilename?: string | null;
  contentType?: string | null;
}
interface UploadImageParams extends UploadFileParams {
  endpoint: string;
  resolution?: string;
}
interface UploadResult {
  filepath: string;
  storageKey?: string;
  storageRegion?: string;
  bytes: number;
}
interface ImageUploadResult extends UploadResult {
  width: number;
  height: number;
}
interface ProcessAvatarParams {
  buffer: Buffer;
  userId: string;
  manual: string;
  agentId?: string;
  basePath?: string;
  tenantId?: string | null;
}
interface S3FileRef {
  filepath: string;
  storageKey?: string;
  storageRegion?: string;
  source: string;
}
type SaveBufferFn = (params: SaveBufferParams) => Promise<string>;
type BatchUpdateFn = (files: Array<{
  file_id: string;
  filepath: string;
  storageKey?: string;
  storageRegion?: string;
}>) => Promise<void>;
type UrlBuilder = (params: GetURLParams) => Promise<string>;
//#endregion
//#region src/types/files.d.ts
interface STTService {
  getInstance(): Promise<STTService>;
  getProviderSchema(req: ServerRequest): Promise<[string, object, string[] | undefined]>;
  sttRequest(provider: string, schema: object, params: {
    audioBuffer: Buffer;
    audioFile: AudioFileInfo;
  }, allowedAddresses?: string[]): Promise<string>;
}
interface AudioFileInfo {
  originalname: string;
  mimetype: string;
  size: number;
}
interface FileObject {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
}
interface AudioProcessingResult {
  text: string;
  bytes: number;
}
/** Google video block format */
interface GoogleVideoBlock {
  type: "media";
  mimeType: string;
  data: string;
}
/** OpenAI-compatible video block format (OpenRouter, vLLM, configured custom endpoints) */
interface OpenRouterVideoBlock {
  type: "video_url";
  video_url: {
    url: string;
  };
}
type VideoBlock = GoogleVideoBlock | OpenRouterVideoBlock;
interface VideoResult {
  videos: VideoBlock[];
  files: Array<{
    file_id?: string;
    temp_file_id?: string;
    filepath: string;
    source?: string;
    filename: string;
    type: string;
  }>;
}
/** Anthropic document block format */
interface AnthropicDocumentBlock {
  type: "document";
  source: {
    type: string;
    media_type: string;
    data: string;
  };
  context?: string;
  title?: string;
  cache_control?: {
    type: string;
  };
  citations?: {
    enabled: boolean;
  };
}
/** Google document block format */
interface GoogleDocumentBlock {
  type: "media";
  mimeType: string;
  data: string;
}
/** OpenAI file block format */
interface OpenAIFileBlock {
  type: "file";
  file: {
    filename: string;
    file_data: string;
  };
}
/** OpenAI Responses API file format */
interface OpenAIInputFileBlock {
  type: "input_file";
  filename: string;
  file_data: string;
}
/** Bedrock Converse API document block (passthrough via @langchain/aws) */
interface BedrockDocumentBlock {
  type: "document";
  document: {
    name: string;
    format: BedrockDocumentFormat;
    source: {
      bytes: Buffer;
    };
  };
}
type DocumentBlock = AnthropicDocumentBlock | GoogleDocumentBlock | OpenAIFileBlock | OpenAIInputFileBlock | BedrockDocumentBlock;
interface DocumentResult {
  documents: DocumentBlock[];
  files: Array<{
    file_id?: string;
    temp_file_id?: string;
    filepath: string;
    source?: string;
    filename: string;
    type: string;
  }>;
}
/** Google audio block format */
interface GoogleAudioBlock {
  type: "media";
  mimeType: string;
  data: string;
}
/** OpenAI-compatible audio block format (OpenRouter, vLLM, configured custom endpoints) */
interface OpenRouterAudioBlock {
  type: "input_audio";
  input_audio: {
    data: string;
    format: string;
  };
}
type AudioBlock = GoogleAudioBlock | OpenRouterAudioBlock;
interface AudioResult {
  audios: AudioBlock[];
  files: Array<{
    file_id?: string;
    temp_file_id?: string;
    filepath: string;
    source?: string;
    filename: string;
    type: string;
  }>;
}
interface ProcessedFile<T = IMongoFile> {
  file: T;
  content: string;
  metadata: {
    file_id: string;
    temp_file_id?: string;
    filepath: string;
    source?: string;
    filename: string;
    type: string;
  };
}
/** Subset of storage strategy functions needed by download and delete access flows. */
interface StrategyFunctions {
  getDownloadStream: (req: ServerRequest, filepath: string) => Promise<Readable>;
  getDownloadURL?: (params: DownloadURLParams) => Promise<string>;
  deleteFile?: (req: ServerRequest, file: {
    filepath: string;
    storageKey?: string | null;
    storageRegion?: string | null;
    user?: string;
    tenantId?: string | null;
  }) => Promise<void>;
}
//#endregion
//#region src/types/google.d.ts
type GoogleParameters = z.infer<typeof googleBaseSchema>;
type GoogleCredentials = {
  [AuthKeys.GOOGLE_SERVICE_KEY]?: string | Record<string, unknown>;
  [AuthKeys.GOOGLE_API_KEY]?: string;
};
/**
* Configuration options for the getLLMConfig function
*/
interface GoogleConfigOptions {
  modelOptions?: Partial<GoogleParameters>;
  reverseProxyUrl?: string;
  defaultQuery?: Record<string, string | undefined>;
  headers?: Record<string, string>;
  proxy?: string;
  streaming?: boolean;
  authHeader?: boolean;
  /** Default parameters to apply only if fields are undefined */
  defaultParams?: Record<string, unknown>;
  addParams?: Record<string, unknown>;
  dropParams?: string[];
  /** Stream rate delay for controlling token streaming speed */
  streamRate?: number;
  /** Model to use for title generation */
  titleModel?: string;
  /** Force Vertex AI auth semantics even when a Google API key is configured */
  forceVertex?: boolean;
  /** GCP project id for Vertex AI ADC/service-account authentication */
  projectId?: string;
}
//#endregion
//#region src/types/mistral.d.ts
/**
* Mistral OCR API Types
* Based on https://docs.mistral.ai/api/#tag/ocr/operation/ocr_v1_ocr_post
*/
interface MistralFileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}
interface MistralSignedUrlResponse {
  url: string;
  expires_at: number;
}
interface OCRImage {
  id: string;
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
  image_base64: string;
  image_annotation?: string;
}
interface PageDimensions {
  dpi: number;
  height: number;
  width: number;
}
interface OCRResultPage {
  index: number;
  markdown: string;
  images: OCRImage[];
  dimensions: PageDimensions;
}
interface OCRUsageInfo {
  pages_processed: number;
  doc_size_bytes: number;
}
interface OCRResult {
  pages: OCRResultPage[];
  model: string;
  document_annotation?: string | null;
  usage_info: OCRUsageInfo;
}
interface MistralOCRRequest {
  model: string;
  image_limit?: number;
  include_image_base64?: boolean;
  document: {
    type: "document_url" | "image_url";
    document_url?: string;
    image_url?: string;
  };
}
interface MistralOCRError {
  detail?: string;
  message?: string;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}
interface MistralOCRUploadResult {
  filename: string;
  bytes: number;
  filepath: string;
  text: string;
  images: string[];
}
//#endregion
//#region src/types/prompts.d.ts
interface PromptGroupsListResponse {
  promptGroups: IPromptGroup[];
  pageNumber: string;
  pageSize: string;
  pages: string;
  has_more: boolean;
  after: string | null;
}
interface PromptGroupsAllResponse {
  data: IPromptGroup[];
}
interface AccessiblePromptGroupsResult {
  object: "list";
  data: IPromptGroup[];
  first_id: Types.ObjectId | null;
  last_id: Types.ObjectId | null;
  has_more: boolean;
  after: string | null;
}
//#endregion
//#region src/types/run.d.ts
type RunLLMConfig = {
  provider: Providers;
  streaming: boolean;
  streamUsage: boolean;
  usage?: boolean;
  configuration?: OpenAIConfiguration;
} & AgentModelParameters & ClientOptions;
//#endregion
//#region src/agents/json.d.ts
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | {
  [key: string]: JsonValue;
};
//#endregion
//#region src/agents/triggers/types.d.ts
/** Optional source-declared proof the generation is expected to produce. The
* host evaluates this against completed tool evidence; it never trusts a model
* assertion that work happened. */
interface AgentTriggerExpectedAction {
  toolName: string;
  argumentSubset?: Record<string, JsonValue>;
}
/** Minimal job-store projection of the canonical Conversation suspension.
* The signed suspension stays private in Mongo; this marker only routes a
* paused job through the durable resume protocol during rolling deploys. */
interface AgentEventSuspensionProjection {
  version: 1;
  suspensionId: string;
  attempt: number;
}
/** Durable host evidence for the exact external action an Event Actor applied. */
interface AgentEventAppliedAction {
  toolName: string;
  toolCallId?: string;
}
/** Job-store outbox record for terminal detached-action evidence that has not
* necessarily reached the authoritative delivery row yet. */
interface AgentEventDetachedTerminalEvidence {
  version: 1;
  deliveryKey: string;
  generationCreatedAt: number;
  taskId: string;
  idempotencyKey: string;
  status: "succeeded" | "failed" | "cancelled";
  result?: string;
  error?: string;
  observedAt: number;
}
//#endregion
//#region src/agents/activityLabels/runtime.d.ts
type PostToolBatchInput = HookInputByEvent["PostToolBatch"];
type BatchEntry = PostToolBatchInput["entries"][number];
/** Resolved provider + client options for the label model call. */
interface ActivityLabelLLM {
  provider: Providers;
  clientOptions: ClientOptions;
  /**
  * Token config of the endpoint the LABEL runs on, which differs from the
  * agent's whenever `activityEndpoint` is set. Pricing must use this or a
  * cross-endpoint label is costed at the wrong rates.
  */
  endpointTokenConfig?: unknown;
  /**
  * True when the label resolved to the agent's OWN endpoint. Callers need
  * this to read an undefined `endpointTokenConfig` correctly: for a built-in
  * label endpoint undefined means "price from the shared table", so
  * inheriting the agent's custom rates there would misprice the label.
  */
  sameEndpoint?: boolean;
}
/**
* Batch metadata handed to the host at slot-claim time (all deterministic).
*
* Deliberately carries no tool-type tally. A tally can only restate the tool
* cards rendered directly beneath the header ("ran 1 command"), so it has no
* place in either the prompt or the UI; the header earns its row solely by
* saying something the cards cannot.
*/
interface ActivityLabelBatchMeta {
  toolCallIds: string[];
  /** ok = all succeeded, failed = all failed, partial = mixed. */
  status: "ok" | "partial" | "failed";
  /** Owning agent in multi-agent graphs — lets the host stamp the part for lane grouping. */
  executingAgentId?: string;
}
/**
* Block context captured host-side at claim time (before more parts stream
* in): reasoning excerpts from the block and the assistant's preceding text.
* Never contains human messages.
*/
interface ActivityLabelBlockContext {
  thinkingExcerpts?: string[];
  lastAssistantText?: string;
  lastAssistantPhase?: "commentary" | "final_answer";
}
/**
* A content slot claimed synchronously at the batch boundary. `fill` is
* called later (or with `null` on failure) once the label resolves.
*/
interface ActivityLabelSlot {
  index: number;
  /**
  * Resolves `true` when the fill COMMITTED (mutated content + emitted) and
  * `false` when the host dropped it because the response already finalized.
  * Usage accounting keys on this: a dropped label must not be billed.
  */
  fill: (text: string | null) => boolean | Promise<boolean>;
  /** Snapshot of block context, captured synchronously at claim time. */
  context?: ActivityLabelBlockContext;
}
/** Payload handed to the host's `generateLabel` (SDK-backed) implementation. */
interface GenerateLabelPayload {
  entries: BatchEntry[];
  context: ActivityLabelBlockContext;
  /**
  * Committed headers from earlier batches in this run (run order, most
  * recent last, max {@link MAX_PREVIOUS_LABELS}) — continuity context so
  * consecutive same-activity batches extend the story instead of restating
  * it. Present only when at least one earlier label committed. An SDK
  * without the field ignores it harmlessly; the fallback path renders it
  * regardless.
  */
  previousLabels?: string[];
  /** Deterministic Langfuse trace seed, unique per slot. */
  traceSeed: string;
  signal: AbortSignal;
  /** Effective per-entry truncation, forwarded so host and SDK prompts agree. */
  charLimit: number;
  /**
  * Instruction for the label model. Always sent: left unset, the SDK falls
  * back to its own generic past-tense prompt and the register defined here
  * never reaches the preferred path.
  */
  prompt?: string;
  /**
  * Owning agent of the batch. Selects that agent's tracing metadata AND its
  * tool-output redaction policy on the SDK path, so a handoff is not traced
  * or redacted under the default agent's configuration.
  */
  executingAgentId?: string;
  /**
  * Defers usage accounting until AFTER the slot commits. A generator that
  * bills inline consumes the settlement window with its balance write, so
  * the deadline can expire mid-write — the charge lands but the fill is
  * then dropped as out-of-scope: billed, never shown. Registering the
  * accounting here instead lets the hook commit the visible label first and
  * only then run it, and only for a committed fill. The hook passes a lazy
  * {@link LabelUsageEstimate} on the success path so the biller can fall
  * back to title-style estimated billing when the provider omits usage.
  */
  deferUsage: (collect: (estimate?: () => LabelUsageEstimate) => void | Promise<void>) => void;
}
/**
* Text the biller can count locally when the provider omits usage metadata,
* following the title convention of estimate-based billing. Produced lazily —
* tokenizing costs CPU, so the thunk runs only when real usage is absent.
*/
interface LabelUsageEstimate {
  promptText: string;
  completionText: string;
}
/** Per-generation LLM callbacks for usage accounting on the fallback path. */
interface ActivityLabelInvokeCallbacks {
  callbacks: Array<Record<string, unknown>>;
  collect: (estimate?: () => LabelUsageEstimate) => void | Promise<void>;
}
interface ActivityLabelHookOptions {
  /**
  * Synchronously claims the next live content index on the host (push
  * placeholder part + bump the shared index offset, exactly like steering's
  * `applySteerPart`). Receives deterministic batch metadata so the
  * placeholder is informative before the LLM label lands. Must be cheap
  * — it runs inside the awaited hook.
  */
  claimSlot: (meta: ActivityLabelBatchMeta) => ActivityLabelSlot;
  /**
  * Preferred generation path: host bridges to the SDK's
  * `run.generateActivityLabel()` (session-grouped Langfuse tracing).
  *
  * Resolve `undefined` to decline — the SDK lacks the API — and the hook
  * falls back to a direct, untraced model call via `resolveLLM`. `null`
  * means the opposite: this path ran and produced no label, so the slot
  * fills empty. Hosts wire this bridge unconditionally (the run does not
  * exist yet at construction time), which is why declining has to be
  * expressible at call time rather than by omitting the option.
  */
  generateLabel?: (payload: GenerateLabelPayload) => Promise<string | null | undefined>;
  /**
  * Fallback model resolution for the direct-call path. Memoized here so
  * hosts can pass a fresh thunk without caching concerns.
  */
  resolveLLM: () => Promise<ActivityLabelLLM>;
  /** Run abort signal; in-flight label calls are also bounded by a timeout. */
  signal?: AbortSignal;
  /**
  * Factory for per-generation LLM callbacks (fallback path only): fresh
  * aggregator per call, `collect()` invoked after a successful response so
  * label calls participate in usage accounting like titles do.
  */
  getInvokeCallbacks?: () => ActivityLabelInvokeCallbacks;
  /** Cap on labels per run (cost guard). Default 20. */
  maxPerRun?: number;
  /** Per-entry output truncation for the prompt. Default 600 chars. */
  charLimit?: number;
  /**
  * `activityPrompt` override. Applies to BOTH paths: the SDK bridge passes
  * it through, and the direct fallback seeds `buildPrompt` with it instead
  * of the built-in instruction.
  */
  prompt?: string;
  /**
  * Labels already present on the response (HITL resume rebuilds the hook
  * with pre-pause content), so the per-response cap counts them instead of
  * restarting at zero after every approval.
  */
  initialGeneratedCount?: number;
  /**
  * Committed label texts already on the response, keyed by content index —
  * the continuity seed for a HITL resume, so post-approval batches still
  * see the pre-pause headers. Unfilled reservations are excluded by the
  * host; only text the user is actually reading belongs here.
  */
  initialLabels?: ReadonlyArray<{
    index: number;
    text: string;
  }>;
  /**
  * Receives the whole detached task (generate → fill → deferred usage) so
  * the host's bounded settle covers the accounting too. Deferring usage
  * until after the commit moved it PAST the fill's resolution, so a settle
  * keyed on fills alone could let finalization flush the usage sink and
  * snapshot metadata while the label's billing was still in flight. The
  * task never rejects.
  */
  trackTask?: (task: Promise<void>) => void;
}
declare function stringifyActivityEvidence(value: unknown, limit: number): string;
/**
* Deterministic batch facts: which tool calls the label covers (for lane
* stamping) and whether they succeeded (for failure tinting). No tool-type
* tally — see {@link ActivityLabelBatchMeta}.
*/
declare function classifyBatch(entries: BatchEntry[]): ActivityLabelBatchMeta;
/**
* The header sits directly above the tool cards it summarizes, so anything
* the cards already display — tool names, how many ran, the arguments — is
* noise when repeated. What the cards cannot show is the point of the batch
* and how it came out, and that is the only thing worth a row of screen.
*
* Because this fires after the batch, the tool OUTPUTS are available: prefer
* the answer the calls produced over a restatement of what was attempted.
*
* Sentence ORDER is deliberate, not stylistic: content rules first and
* format rules last measurably improves both format adherence and opening-
* verb diversity on small label models (eval corpus:
* scripts/activity-labels/), so a reshuffle here regresses real output.
*/
declare const ACTIVITY_INSTRUCTION: string;
declare function buildPrompt(entries: BatchEntry[], charLimit: number, context?: ActivityLabelBlockContext, instruction?: string, previousLabels?: string[]): string;
/**
* PoC PostToolBatch hook: claims a content slot synchronously, then generates
* a one-line batch summary on a cheap model as a DETACHED promise — the hook
* returns immediately so the next model call is never delayed. Failures fill
* the slot with `null` (host renders nothing for empty summaries).
*/
declare function createActivityLabelHook(opts: ActivityLabelHookOptions): HookCallback<"PostToolBatch">;
//#endregion
//#region src/agents/activityLabels/wiring.d.ts
/** Structural view of a content part; hosts pass their live parts array. */
interface LooseContentPart {
  type?: string;
  text?: unknown;
  think?: unknown;
  agentId?: unknown;
  groupId?: unknown;
  tool_call?: {
    id?: unknown;
  };
  pending?: boolean;
  phase?: unknown;
  [key: string]: unknown;
}
/**
* Captures the current activity block's context for the label payload:
* reasoning excerpts since the last text part, plus the assistant's last
* text (~200 chars) as intent. Deliberately NO human messages. Reasoning
* collection stops at the previous block's label part — labels delimit
* blocks, so scanning past one would bleed another batch's reasoning into
* this payload — and filters by executing agent in multi-agent runs.
* Intent keeps scanning past labels: with consecutive batches and no
* interleaved text, the assistant's last words remain the current intent.
*/
declare function captureActivityBlockContext(parts: ReadonlyArray<LooseContentPart | null | undefined>, executingAgentId?: string): ActivityLabelBlockContext;
/**
* Removes UI-only activity-label parts from a message payload before any
* `formatAgentMessages` call. Published SDK versions without the formatter
* skip would otherwise fold the label text into provider-facing content via
* the formatter's catch-all. Non-mutating; returns the same reference when
* nothing needed stripping.
*/
declare function stripActivityLabelParts<T extends {
  content?: unknown;
}>(payload: T[]): T[];
/** Minimal SSE shape for synthesized gap events. */
interface ActivityLabelGapEvent {
  event: string;
  data: Record<string, unknown>;
}
/**
* Synthesizes `on_activity_label` events for labels that appeared OR were
* filled between a resume snapshot and subscriber attach. In Redis mode the
* label publish is fire-and-forget and the sync payload carries only the
* snapshot, so a label claimed or resolved in that window would otherwise
* never reach the reconnecting client. Compares by index: a fresh label part
* whose text, pending state, or phase bounds differ from the snapshot's (or
* that has no snapshot counterpart) is re-emitted. Idempotent - the client
* applier ignores duplicates and refuses stale pending placeholders.
*/
declare function synthesizeActivityLabelGapEvents(snapshotContent: ReadonlyArray<LooseContentPart | null | undefined>, freshContent: ReadonlyArray<LooseContentPart | null | undefined>, meta: {
  conversationId: string;
  responseMessageId?: string;
}): ActivityLabelGapEvent[];
/** Host closures the wiring needs; each is a thin bridge into the caller. */
interface ActivityLabelHostDeps {
  /** Cost cap from `activityMaxPerRun`; falls back to the hook default. */
  maxPerRun?: number;
  /** Prompt truncation from `activityCharLimit`; falls back to the hook default. */
  charLimit?: number;
  /** `activityPrompt` override, applied on both generation paths. */
  prompt?: string;
  abortSignal?: AbortSignal;
  /** Returns the LIVE host content array (same instance the SDK writes into). */
  getContentParts: () => Array<LooseContentPart | null | undefined>;
  /** Bumps the shared index offset so subsequent SDK indices skip the slot. */
  bumpIndexOffset: () => void;
  /** Emits the on_activity_label SSE/chunk event for a slot state. */
  emitLabelEvent: (index: number, part: LooseContentPart) => Promise<unknown>;
  /** Registers a promise the bounded settle must await at finalization:
  *  per-slot fill completion AND the hook's whole detached task (fill plus
  *  the usage accounting deferred until after the commit). */
  trackPendingFill: (fillDone: Promise<void>) => void;
  /**
  * True once the response has finalized (settle timed out). A late fill
  * must then neither mutate persisted content nor emit chunks for a job
  * whose runtime is gone.
  */
  isClosed?: () => boolean;
  resolveLLM: () => Promise<ActivityLabelLLM>;
  /**
  * Resolve `undefined` to DECLINE — this bridge cannot serve the request, so
  * the hook falls back to the direct model call. `null` means it ran and
  * produced no label. The distinction is the contract the hook keys on, so it
  * belongs in the exported type.
  */
  generateLabel?: (payload: GenerateLabelPayload) => Promise<string | null | undefined>;
  getInvokeCallbacks?: () => ActivityLabelInvokeCallbacks;
}
/**
* Builds the run wiring for activity labels: slot claiming at each batch
* boundary (steering's index-offset pattern), fill-time label emit,
* groupId/agentId lane stamping, and settle tracking. Implementation lives
* here (TS) so the JS controller stays a thin wrapper.
*/
declare function createActivityLabelWiring(deps: ActivityLabelHostDeps): {
  hook: HookCallback<"PostToolBatch">;
};
//#endregion
//#region src/agents/activityPhases/runtime.d.ts
type AssistantTextPhase = "commentary" | "final_answer";
interface ActivityPhaseEntry {
  label?: string;
  entries?: Array<{
    toolName: string;
    toolInput: unknown;
    toolOutput?: unknown;
    error?: string;
    status: "success" | "error";
  }>;
  thinkingExcerpts?: string[];
  agentId?: string;
  status?: "success" | "partial" | "error";
}
type TrackedActivity = ActivityPhaseEntry & {
  startIndex: number; /** A prior boundary can retain only the materialized tail of a straddling batch. */
  partitionStartIndex?: number; /** Anchor-only activities keep position and status but carry no prompt evidence. */
  bounded?: boolean;
  /** Activities folded into this anchor once the anchor budget was reached.
  *  Every counted activity therefore keeps a position, so a boundary can
  *  partition counts instead of reconstructing them by subtraction. */
  mergedCount?: number;
  mergedFailedCount?: number;
  mergedPartialCount?: number;
  /** Agents whose activities were folded into this anchor, so attribution and
  *  the summarizer payload keep every contributor the count represents. */
  mergedAgentIds?: string[];
  childLabelIndex?: number; /** Stable anchors survive content filtering and prepends across HITL resume. */
  toolCallIds?: string[]; /** Original boundary retained while only part of a saved tool batch is materialized. */
  unresolvedToolStartIndex?: number;
};
interface ActivityPhaseSnapshot {
  /** Version 2 introduces object-valued assistant context and overflow anchors.
  *  Version 3 folds those anchors into `activities` so every counted activity
  *  carries a position; readers still accept 1 and 2. */
  version: 1 | 2 | 3;
  generated: number;
  /** @deprecated Version 3 derives the total from positioned activities. */
  activityCount: number;
  /** @deprecated Version 3 derives failures from positioned activities. */
  failedActivityCount: number;
  /** @deprecated Version 3 derives partials from positioned activities. */
  partialActivityCount: number;
  agentIds: string[];
  activities: TrackedActivity[];
  overflowActivityStartIndex?: number;
  overflowToolCallIds?: string[];
  /** IDs tied to the saved numeric overflow boundary, including equal-index batches. */
  overflowBoundaryToolCallIds?: string[];
  /** @deprecated Stable anchor retained for snapshots created before multi-anchor support. */
  overflowReasoningExcerpt?: string;
  /** Bounded stable anchors for reasoning-only overflow after HITL content compaction. */
  overflowReasoningAnchors?: string[];
  /** Lightweight anchors retain per-activity partitioning beyond prompt evidence limits. */
  overflowActivities?: TrackedActivity[];
  assistantContext: Array<string | {
    text: string;
    activityPosition: number;
  }>;
  pendingReasoning: Array<{
    key: string;
    text: string;
    agentId?: string;
    startIndex?: number;
  }>;
}
interface GenerateActivityPhasePayload {
  activities: ActivityPhaseEntry[];
  assistantContext?: string[];
  closingTextPhase?: AssistantTextPhase;
  phaseIndex: number;
  totalActivityCount: number;
  status: "completed" | "partial" | "failed";
  agentIds: string[];
  charLimit: number;
  prompt?: string;
  signal: AbortSignal;
}
interface GeneratedActivityPhase {
  label?: string;
  collectUsage?: (label?: string) => void | Promise<void>;
}
interface ActivityPhaseHostDeps {
  maxPerRun?: number;
  charLimit?: number;
  prompt?: string;
  abortSignal?: AbortSignal;
  initialSnapshot?: ActivityPhaseSnapshot;
  getContentParts: () => Array<LooseContentPart | null | undefined>;
  getStepIndex?: (stepId: string) => number | undefined;
  bumpIndexOffset: () => void;
  emitLabelEvent: (index: number, part: LooseContentPart) => Promise<unknown>;
  trackPendingFill: (fillDone: Promise<void>) => void;
  isClosed?: () => boolean;
  generatePhase: (payload: GenerateActivityPhasePayload) => Promise<GeneratedActivityPhase>;
}
interface ActivityPhaseWiring {
  hook: HookCallback<"PostToolBatch">;
  handlers: (handlers: Record<string, EventHandler> | undefined) => Record<string, EventHandler> | undefined;
  /** A steer is a hard semantic boundary; incomplete evidence is discarded. */
  drop: () => void;
  /** Finalizes unphased evidence once the root AgentRun has actually completed. */
  complete: () => void;
  /** Bounded state needed to continue the same phase after a HITL pause. */
  snapshot: () => ActivityPhaseSnapshot;
}
declare const ACTIVITY_PHASE_INSTRUCTION = "Summarize what this phase of an agent run accomplished. The result appears as the header of one collapsed parent group containing several activities.\n\nRules:\n- One line, 8 to 18 words, past tense\n- Lead with the concrete outcome and name the most distinctive subject\n- Synthesize the phase; do not enumerate, count, or restate individual activities\n- Describe failures plainly when they are the phase's material outcome\n- Never mention tool names, calls, arguments, reasoning, commentary, or activity counts\n- Output only the summary — no quotes, no trailing punctuation, no preamble\n\nExamples:\n- Reconciled authentication behavior and fixed the failing session refresh path\n- Compared deployment options and documented the safest production rollout\n- Investigated database latency but could not confirm the suspected index regression\n\nBad examples:\n- Used three tools to inspect files and run tests\n- Searched code, read configuration, and updated middleware";
/** Persists Open Responses text-phase metadata onto TerraMind text parts.
*  Installed for existing batch labels too, so commentary can supply intent
*  even when parent phase summaries are disabled. */
declare function createAssistantPhaseStampingHandlers(handlers: Record<string, EventHandler> | undefined): Record<string, EventHandler> | undefined;
/**
* Collects run-wide logical activities and emits one parent summary at an
* explicit final-answer boundary or root-run completion. The summary call is
* detached; final-answer streams only pay the synchronous slot reservation.
*/
declare function createActivityPhaseWiring(deps: ActivityPhaseHostDeps): ActivityPhaseWiring;
//#endregion
//#region src/types/earlyBufferRecovery.d.ts
type EarlyBufferRecoveryMethod = "redis" | "snapshot";
type EarlyBufferRecoveryOutcome = "success" | "failed" | "not_required";
type EarlyBufferRecoveryFailureReason = "durable_state_missing" | "durable_frontier_gap" | "snapshot_missing" | "subscriber_never_attached" | "subscriber_disconnected" | "reconstruction_error" | "overflow_marker_persistence_failed";
interface EarlyBufferOverflowState {
  id: string;
  occurredAt: number;
  durableEvents: number;
  droppedEvents: number;
  droppedBytes: number;
  /** True while the owner is flushing accepted durable appends and has not
  * published the final recovery frontier yet. */
  persistencePending?: boolean;
  recoveryMethod?: EarlyBufferRecoveryMethod;
  recoveryOutcome?: EarlyBufferRecoveryOutcome;
  recoveryCompletedAt?: number;
  recoveryFailureReason?: EarlyBufferRecoveryFailureReason;
}
//#endregion
//#region src/agents/hitl/resume.d.ts
/**
* Translate the host-facing approval wire format into the SDK's resume value.
*
* The wire format ({@link Agents.ToolApprovalResolution}) is shaped for the UI —
* a flat `decision` string plus optional `editedArguments` / `responseText`. The
* SDK consumes a discriminated {@link ToolApprovalDecision} per tool call. This is
* the single adapter between the two; the resume route maps once, here, instead of
* branching on `decision` at the call site.
*
* Returns the map form (keyed by `tool_call_id`) so a batch that calls the same
* tool twice resolves unambiguously — by-position ordering breaks with duplicates.
*/
declare function mapToolApprovalResolutions(resolutions: readonly Agents.ToolApprovalResolution[]): ToolApprovalDecisionMap;
/** Translate the ask-user wire answer into the SDK's resume value. */
declare function mapAskUserAnswer(resolution: Agents.AskUserQuestionResolution): AskUserQuestionResolution;
/** Translate batched ask-user wire answers into the SDK's resume value. */
declare function mapAskUserAnswers(resolution: Agents.AskUserQuestionsResolution): AskUserQuestionsResolution;
/** Return batched ask-user values when their count and length are bounded. */
declare function getBoundedAskUserAnswerValues(answers: unknown): string[];
/**
* Serialize every ordering a validated batch can take after the SDK rebuilds
* its answer map in question order. Batches are capped at four questions, so
* this remains bounded at 24 candidates and lets pre-controller PII/moderation
* checks inspect the exact ToolMessage even for a crafted key order.
*/
declare function serializeAskUserAnswerVariants(answers: unknown): string[];
interface AskUserResumeBody {
  answer?: unknown;
  answers?: unknown;
}
/** Ask-user answer retained with the job until the generation terminalizes. */
interface ResolvedAskUserQuestion {
  /** String supports pending records written before the structured question shape. */
  request: Agents.AskUserQuestionRequest | Agents.AskUserQuestionsRequest | string;
  output: string;
  toolCallId?: string;
  /** Stable association for legacy SDK payloads that omitted tool_call_id. */
  contentIndex?: number;
  /** The paused ask part was absent, so this answer must not bind to a later ask. */
  contentMissing?: true;
}
type AskUserResumeResult = {
  resumeValue: AskUserQuestionResolution | AskUserQuestionsResolution;
} | {
  status: 400;
  error: string;
};
/** Validate an ask-user resume payload and translate it to the SDK contract. */
declare function resolveAskUserQuestionResume(payload: Agents.AskUserQuestionInterruptPayload, body: AskUserResumeBody): AskUserResumeResult;
/** Build the durable answer stamp committed with the resume ownership CAS. */
declare function buildResolvedAskUserQuestion(pendingAction: Agents.PendingAction, body: AskUserResumeBody, contentIndex?: number, contentMissing?: boolean): ResolvedAskUserQuestion | undefined;
/** Add the current answer without losing exact-ID stamps from earlier pauses. */
declare function appendResolvedAskUserQuestion(retained: readonly ResolvedAskUserQuestion[] | undefined, current: ResolvedAskUserQuestion | undefined): ResolvedAskUserQuestion[] | undefined;
/**
* Validate that a set of resolutions covers exactly the tool calls a pending
* `tool_approval` action is waiting on. Returns the list of `tool_call_id`s that
* were requested but not decided (empty when the batch is fully resolved), so the
* resume route can 400 a partial submission instead of driving a half-decided run.
*/
declare function findUndecidedToolCalls(payload: Agents.ToolApprovalInterruptPayload, resolutions: readonly Agents.ToolApprovalResolution[]): string[];
/** Reject ambiguous or foreign decisions before adapting them to the SDK's ID-keyed map. */
declare function hasInvalidToolApprovalResolutions(payload: Agents.ToolApprovalInterruptPayload, resolutions: readonly Agents.ToolApprovalResolution[]): boolean;
/**
* Enforce the policy's per-tool `allowed_decisions`. Returns the `tool_call_id`s
* whose submitted decision is NOT one the interrupt's `review_configs` permits for
* that tool — so the resume route can reject a crafted request that, e.g., approves
* a tool the policy restricted to `reject`/`respond`. A resolution for a tool with
* no matching review_config (shouldn't happen) is treated as disallowed (fail closed).
*/
declare function findDisallowedDecisions(payload: Agents.ToolApprovalInterruptPayload, resolutions: readonly Agents.ToolApprovalResolution[]): string[];
/**
* Enforce that `edit` and `respond` decisions carry their required payload. Returns
* the `tool_call_id`s whose decision is structurally incomplete:
*   - `edit` without an object `editedArguments`, or
*   - `respond` without a non-empty `responseText`.
*
* Without this, {@link toSdkDecision}'s defensive defaults (`{}` / `''`) would turn a
* crafted or buggy submission into an empty tool input or an empty synthetic result —
* resuming the run with behavior the user never actually approved. The route rejects
* these (400) rather than mapping them.
*/
declare function findIncompleteDecisions(resolutions: readonly Agents.ToolApprovalResolution[]): string[];
/** Validate and translate one complete tool-approval batch for the resume controller. */
declare function resolveToolApprovalResume(payload: Agents.ToolApprovalInterruptPayload, resolutions: readonly Agents.ToolApprovalResolution[]): {
  resumeValue: ToolApprovalDecisionMap;
} | {
  status: 400;
  error: string;
  undecided?: string[];
  incomplete?: string[];
} | {
  status: 403;
  error: string;
  disallowed: string[];
};
/**
* Reconcile persisted tool-step indices with the content being seeded into a
* rebuilt aggregator.
*
* A pause-time index is not durable identity: hosts can prepend content after
* the step was emitted, and persisted reconstruction can compact sparse
* content. Tool-call ids are stable across both operations, so use them to
* relocate a step without mutating the stored object.
*/
type ResumableRunStep = {
  id: string;
  index: number;
  stepDetails: {
    type: string;
    tool_calls?: readonly {
      id?: string;
    }[];
  };
};
declare function normalizeResumeRunStepIndices<T extends ResumableRunStep>(runSteps: readonly T[], seedContent?: readonly ({
  type?: string;
  tool_call?: {
    id?: string;
  };
} | undefined)[]): T[];
/**
* Restore the streamed run-step sidecars that a fresh SDK Run cannot recover
* from the LangGraph checkpoint by itself.
*
* Human-review resume can happen in a later request or process. The checkpoint
* restarts directly inside ToolNode, so it does not replay ON_RUN_STEP before
* dispatching ON_RUN_STEP_COMPLETED. Seeding both maps lets the ToolNode emit
* the original step id and lets the content aggregator resolve that id back to
* the already-rendered tool card.
*/
declare function hydrateResumeRunSteps(runSteps: readonly RunStep[], stepMap: Map<string, RunStep | undefined> | undefined, graph: {
  toolCallStepIds?: Map<string, string>;
} | null | undefined, seedContent?: readonly ({
  type?: string;
  tool_call?: {
    id?: string;
  };
} | undefined)[]): void;
/**
* Wrap a resume run's event handlers so every content index the rebuilt graph
* emits is shifted past the pre-pause content.
*
* WHY: a resumed run rebuilds the graph from the checkpoint, and the fresh
* graph assigns content indices from its own empty `contentData` — starting at
* 0. The host, meanwhile, seeds the (also fresh) content aggregator with the
* pre-pause parts, which occupy exactly those low indices. Without an offset
* the resumed model turn collides with the seed: when the types match at an
* index the new text silently MERGES into a pre-pause part, and when they
* don't (e.g. a reasoning/`think` part at index 0 with Anthropic models) every
* delta is dropped with `Content type mismatch` — the entire post-resume
* output vanishes from both the live stream and the saved message.
*
* The index enters the pipeline at exactly one point: `ON_RUN_STEP`'s payload
* (the `RunStep`, whose `index` every subsequent delta resolves through the
* aggregator's `stepMap`). `ON_AGENT_UPDATE` carries its own inline index and
* is offset likewise. All other handlers pass through untouched — same object
* references, so stateful handler instances keep working.
*/
declare function createContentIndexOffsetHandlers(handlers: Record<string, EventHandler> | undefined, seedContent?: Array<{
  type?: string;
  tool_call?: {
    id?: string;
    output?: unknown;
  };
}>): Record<string, EventHandler> | undefined;
/** Locate the exact content slot used by pause-time question stamping. */
declare function findAskUserQuestionContentIndex<TPart extends {
  type?: string;
  tool_call?: {
    id?: string;
    name?: string;
    args?: unknown;
    output?: unknown;
  };
}>(content: TPart[], toolCallId?: string, request?: Agents.AskUserQuestionRequest | Agents.AskUserQuestionsRequest | string): number;
/**
* Stamp the answered question onto the paused `ask_user_question` tool-call part
* before the resume run seeds it back into the content pipeline.
*
* WHY the part is otherwise empty: the streamed arg CHUNKS carry no tool name, and
* the aggregator only accepts name-less arg updates on the completion event — which
* never fires for this tool (the first pass interrupts mid-execution, and the
* rebuilt resume run has no step id to complete against). Saved messages therefore
* showed `args: ""` and no `output`, and the client rendered a "cancelled" tool.
* The authoritative data exists anyway: the pendingAction payload carries the full
* question, and the resume request carries the user's answer.
*
* Targets the payload's `tool_call_id` part when present (exact attribution for
* multi-ask turns), else the LAST unanswered ask part. Pure — returns the input
* array when nothing matched.
*/
declare function attachAskUserQuestionAnswer<TPart extends {
  type?: string;
  tool_call?: {
    id?: unknown;
    name?: unknown;
    output?: unknown;
  };
}>(content: TPart[], request: Agents.AskUserQuestionRequest | Agents.AskUserQuestionsRequest, output: string, toolCallId?: string): TPart[];
/** Apply retained ask answers in one content pass for Redis reconstruction. */
declare function attachAskUserQuestionAnswers<TPart extends {
  type?: string;
  tool_call?: {
    id?: unknown;
    name?: unknown;
    output?: unknown;
  };
}>(content: TPart[], answers: readonly ResolvedAskUserQuestion[]): TPart[];
/**
* Stamp the question onto the paused `ask_user_question` tool-call part's args
* at PAUSE time (no answer yet). Companion to
* {@link attachAskUserQuestionAnswer}: an abandoned/expired/stopped pause never
* reaches the answer-resume stamp, and the streamed args were dropped by the
* aggregator (name-less chunks), so without this the persisted unfinished turn
* carries an empty ask part the record card can't render a question from.
* Targets the payload's `tool_call_id` part when present, else the newest ask
* part with empty args and no output. Pure.
*/
declare function attachAskUserQuestionArgs<TPart extends {
  type?: string;
  tool_call?: {
    id?: string;
    name?: string;
    args?: unknown;
    output?: unknown;
  };
}>(content: TPart[], request: Agents.AskUserQuestionRequest | Agents.AskUserQuestionsRequest, toolCallId?: string): TPart[];
//#endregion
//#region src/utils/identity.d.ts
/**
* Auth-boundary identity helpers for token/cache scoping.
* Do not use these as a blanket replacement for app ownership checks, and keep
* tenant/issuer data out of placeholder-visible safe user fields.
*/
type StringableId = string | number | {
  toString(): string;
};
type AuthIdentitySource = {
  id?: string | null;
  _id?: StringableId | null;
  openidId?: string | null;
  openidIssuer?: string | null;
  tenantId?: string | null;
};
type AuthIdentityContext = {
  appUserId?: string;
  openidSubject?: string;
  tenantId?: string;
  openidIssuer?: string;
};
type AuthIdentityTuple = {
  tenantId: string;
  openidIssuer: string;
  subject: string;
};
type RefreshTokenBridgeIdentity = {
  userId: string;
  tenantId?: string;
  openidIssuer?: string;
};
type OpenIDSessionIdentitySource = {
  appUserId?: string | null;
  openidSubject?: string | null;
  tenantId?: string | null;
  openidIssuer?: string | null;
};
declare function resolveAppUserId(...sources: Array<AuthIdentitySource | null | undefined>): string | undefined;
declare function resolveOpenIDSubject(source: AuthIdentitySource | null | undefined): string | undefined;
declare function resolveRefreshSubject(...sources: Array<AuthIdentitySource | null | undefined>): string | undefined;
declare function resolveTenantId({
  tenantId,
  user,
  requestUser
}: {
  tenantId?: string | null;
  user?: AuthIdentitySource | null;
  requestUser?: AuthIdentitySource | null;
}): string | undefined;
declare function resolveAuthOpenIDIssuer({
  openidIssuer,
  user,
  requestUser
}: {
  openidIssuer?: string | null;
  user?: AuthIdentitySource | null;
  requestUser?: AuthIdentitySource | null;
}): string | undefined;
declare function createAuthIdentityContext({
  user,
  requestUser,
  tenantId,
  openidIssuer
}: {
  user?: AuthIdentitySource | null;
  requestUser?: AuthIdentitySource | null;
  tenantId?: string | null;
  openidIssuer?: string | null;
}): AuthIdentityContext;
declare function createOpenIDSessionIdentity({
  user,
  requestUser,
  userId,
  openidSubject,
  tenantId,
  openidIssuer
}: {
  user?: AuthIdentitySource | null;
  requestUser?: AuthIdentitySource | null;
  userId?: string | null;
  openidSubject?: string | null;
  tenantId?: string | null;
  openidIssuer?: string | null;
}): AuthIdentityContext;
declare function isOpenIDSessionIdentityMatch(sessionIdentity: OpenIDSessionIdentitySource | null | undefined, expectedIdentity: OpenIDSessionIdentitySource | null | undefined): boolean;
declare function createRefreshTokenBridgeIdentity({
  user,
  requestUser,
  userId,
  tenantId,
  openidIssuer
}: {
  user?: AuthIdentitySource | null;
  requestUser?: AuthIdentitySource | null;
  userId?: string | null;
  tenantId?: string | null;
  openidIssuer?: string | null;
}): RefreshTokenBridgeIdentity | null;
declare function createOpenIDRefreshIdentityTuple({
  user,
  requestUser,
  tenantId,
  openidIssuer
}: {
  user?: AuthIdentitySource | null;
  requestUser?: AuthIdentitySource | null;
  tenantId?: string | null;
  openidIssuer?: string | null;
}): AuthIdentityTuple | null;
declare function createOpenIDOboIdentityTuple({
  user,
  identityContext,
  tenantId,
  openidIssuer
}: {
  user?: AuthIdentitySource | null;
  identityContext?: AuthIdentityContext | null;
  tenantId?: string | null;
  openidIssuer?: string | null;
}): AuthIdentityTuple | null;
declare function serializeAuthIdentityTuple(tuple: AuthIdentityTuple): string;
//#endregion
//#region src/flow/types.d.ts
type FlowStatus = "PENDING" | "COMPLETED" | "FAILED";
interface FlowMetadata {
  [key: string]: unknown;
}
interface FlowState<T = unknown> {
  type: string;
  status: FlowStatus;
  metadata: FlowMetadata;
  createdAt: number;
  result?: T;
  error?: string;
  completedAt?: number;
  failedAt?: number;
}
interface FlowManagerOptions {
  ttl: number;
  /** Maximum time a flow may remain PENDING. Defaults to the storage TTL. */
  monitorTimeout?: number;
  /** Flow types whose FAILED state should remain readable until the storage TTL expires. */
  retainedFailureTypes?: readonly string[];
  ci?: boolean;
  logger?: Logger;
  redisScriptExecutor?: (script: string, options: {
    keys: string[];
    arguments: string[];
  }) => Promise<unknown>;
}
//#endregion
//#region src/mcp/oauth/types.d.ts
interface OAuthMetadata {
  /** OAuth authorization endpoint */
  authorization_endpoint: string;
  /** OAuth token endpoint */
  token_endpoint: string;
  /** OAuth issuer */
  issuer?: string;
  /** Supported scopes */
  scopes_supported?: string[];
  /** Response types supported */
  response_types_supported?: string[];
  /** Grant types supported */
  grant_types_supported?: string[];
  /** Token endpoint auth methods supported */
  token_endpoint_auth_methods_supported?: string[];
  /** Code challenge methods supported */
  code_challenge_methods_supported?: string[];
  /** Dynamic client registration endpoint (RFC 7591) */
  registration_endpoint?: string;
  /** Revocation endpoint */
  revocation_endpoint?: string;
  /** Revocation endpoint auth methods supported */
  revocation_endpoint_auth_methods_supported?: string[];
}
/** How the OAuth client credentials associated with stored tokens were obtained. */
type OAuthClientSource = "configured" | "dynamic";
interface OAuthStoredClientMetadata extends OAuthMetadata {
  /** Random identifier shared by the access, refresh, and client records from one authorization. */
  credential_set_id?: string;
  /** Canonical MCP server URL the tokens and client registration are bound to. */
  server_url: string;
  /** Whether the client came from server configuration or dynamic client registration. */
  client_source: OAuthClientSource;
  /** Canonical OAuth resource indicator used when the authorization code was exchanged. */
  resource?: string;
}
interface OAuthProtectedResourceMetadata {
  /** Resource identifier */
  resource: string;
  /** Authorization servers */
  authorization_servers?: string[];
  /** Scopes supported by the resource */
  scopes_supported?: string[];
}
interface OAuthClientInformation$1 {
  /** Client ID */
  client_id: string;
  /** Client secret (optional for public clients) */
  client_secret?: string;
  /** Client name */
  client_name?: string;
  /** Redirect URIs */
  redirect_uris?: string[];
  /** Grant types */
  grant_types?: string[];
  /** Response types */
  response_types?: string[];
  /** Scope */
  scope?: string;
  /** Token endpoint auth method */
  token_endpoint_auth_method?: string;
}
interface MCPOAuthState {
  /** Current step in the OAuth flow */
  step: "discovery" | "registration" | "authorization" | "token_exchange" | "complete" | "error";
  /** Server name */
  serverName: string;
  /** User ID */
  userId: string;
  /** OAuth metadata from discovery */
  metadata?: OAuthMetadata;
  /** Resource metadata */
  resourceMetadata?: OAuthProtectedResourceMetadata;
  /** Client information */
  clientInfo?: OAuthClientInformation$1;
  /** Authorization URL */
  authorizationUrl?: string;
  /** Code verifier for PKCE */
  codeVerifier?: string;
  /** State parameter for OAuth flow */
  state?: string;
  /** Error information */
  error?: string;
  /** Timestamp */
  timestamp: number;
}
interface MCPOAuthFlowMetadata extends FlowMetadata {
  serverName: string;
  userId: string;
  serverUrl: string;
  /** Identity of the effective server definition that admitted this authorization attempt. */
  serverGeneration?: string;
  state: string;
  codeVerifier?: string;
  clientInfo?: OAuthClientInformation$1;
  /** Whether this flow uses a configured client or a dynamically registered client. */
  clientSource?: OAuthClientSource;
  metadata?: OAuthMetadata;
  resourceMetadata?: OAuthProtectedResourceMetadata;
  authorizationUrl?: string;
  /** Custom headers for OAuth token exchange, persisted at flow initiation for the callback. */
  oauthHeaders?: Record<string, string>;
  /** Domain allowlist captured at flow initiation for callback-time SSRF enforcement. */
  allowedDomains?: string[] | null;
  /** Address exemptions captured at flow initiation for callback-time SSRF enforcement. */
  allowedAddresses?: string[] | null;
  /** True when the flow reused a stored client registration from a prior successful OAuth flow */
  reusedStoredClient?: boolean;
  /** Credential generation of the reused client, used to scope stale-registration cleanup. */
  reusedClientCredentialSetId?: string;
  /** Tenant context captured at flow initiation for callback replay (SameSite cookies unavailable on cross-origin redirects) */
  tenantId?: string;
}
interface MCPOAuthTokens extends OAuthTokens {
  /** Internal identifier for the persisted credential set; never sent to the OAuth provider. */
  credential_set_id?: string;
  /** When the tokens were obtained */
  obtained_at: number;
  /** Calculated expiry time */
  expires_at?: number;
  /**
  * Tool-cache publication generation written when these tokens were persisted. Carried only by
  * tokens handed to the waiters of the authorization or refresh that stored them, never by a
  * stored row, so a connection built on them can lease under that generation.
  */
  publication_generation?: string;
}
/** Extended OAuth tokens that may include refresh token expiry */
interface ExtendedOAuthTokens extends OAuthTokens {
  /** Refresh token expiry in seconds (non-standard, some providers include this) */
  refresh_token_expires_in?: number;
}
//#endregion
//#region src/mcp/oauth/obo.d.ts
interface OboConfig {
  scopes: string;
}
/**
* Function type for performing OBO token exchange.
* Injected from the main API layer since it requires OpenID configuration and caching.
*/
type OboTokenResolver = (user: IUser, accessToken: string, scopes: string, fromCache?: boolean, identityContext?: AuthIdentityContext) => Promise<{
  access_token: string;
  expires_in?: number;
  expires_at?: number;
}>;
/**
* Provides the LIVE upstream OpenID tokens at OBO call time, refreshing the
* server-side session via the IdP refresh-token grant when the access token
* has expired. Closes over the active Express request so it can read/write
* `req.session.openidTokens` in place.
*
* Contract:
*   - non-null result: `access_token` MUST be populated; the closure enforces
*     this internally so callers do not defend against missing access_token.
*   - null: not applicable, or a bearer-authenticated remote-agent request whose
*     current upstream token can be read from `user.federatedTokens`.
*   - throws: refresh was attempted and the IdP rejected it. Caller wraps as
*     `session_refresh_failed`.
*/
type UpstreamTokenProvider = (options?: {
  forceRefresh?: boolean;
  signal?: AbortSignal;
}) => Promise<OIDCTokens | null>;
/** Target resolved from server configuration after the OBO trust check. Scopes are not an audience. */
interface UpstreamTokenTarget {
  readonly mcpServer: string;
  readonly scopes: string;
}
/** Lazily supplies a renewable upstream-token provider when an OBO server actually needs one. */
type UpstreamTokenProviderResolver = (options?: {
  signal?: AbortSignal;
  target?: UpstreamTokenTarget;
}) => UpstreamTokenProvider | undefined | Promise<UpstreamTokenProvider | undefined>;
/** Scheduled OBO credentials must not replace the browser's direct-bearer source. */
declare function selectMCPUpstreamTokenProvider({
  upstreamTokenProvider,
  upstreamTokenProviderResolver,
  createSessionProvider
}: {
  upstreamTokenProvider?: UpstreamTokenProvider | null;
  upstreamTokenProviderResolver?: UpstreamTokenProviderResolver | null;
  createSessionProvider: () => UpstreamTokenProvider;
}): UpstreamTokenProvider | null | undefined;
/** Detach cancelled callers and preserve cancellation for arbitrary AbortController reasons. */
declare function awaitOboOperation<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T>;
/** Keep lookup failures inside resolveOboToken's typed failure boundary. */
declare function createLazyOboUpstreamTokenProvider(resolver: UpstreamTokenProviderResolver, signal?: AbortSignal, target?: UpstreamTokenTarget): UpstreamTokenProvider;
type OboTokenResolutionReason = "missing_upstream_token" | "missing_upstream_access_token" | "empty_exchange_response" | "exchange_failed" | "session_refresh_failed";
declare class OboTokenResolutionError extends Error {
  readonly reason: OboTokenResolutionReason;
  readonly retryable: boolean;
  readonly userMessage: string;
  override readonly cause?: unknown;
  constructor(reason: OboTokenResolutionReason, userMessage: string, retryable?: boolean, cause?: unknown);
}
declare function isRetryableOboExchangeError(error: unknown): boolean;
/**
* Performs an OBO token exchange for the given user and MCP server OBO config.
* Returns MCPOAuthTokens suitable for injection into the MCP connection.
*
* The `upstreamTokenProvider` closure is the authoritative source of the user's
* upstream OpenID access token at call time — it reads from the live session and
* may inline-refresh via the IdP refresh-token grant when the token has expired.
* This avoids relying on a stale snapshot frozen onto `user.federatedTokens` at
* request validation, which is what previously caused the walk-away failure mode
* ("No valid OpenID access token is available for OBO exchange") on long-running
* tool calls. Required (not optional) so wiring bugs surface at compile time.
*
* When the provider yields no live session (it resolves to null), this falls
* back to `user.federatedTokens` so the OIDC remote-agent flow — whose request
* itself carries that verified upstream bearer — still works. Browser requests
* whose Express session was cleared reject in the provider instead of reaching
* this fallback with a stale strategy-time snapshot.
*
* @param forceRefresh Bypasses the resolver's token cache. Set it when the downstream
* server has rejected the current credential: a revoked or scope-invalidated token is
* still inside its cached lifetime, so a cached read would hand back the same rejected
* bearer instead of minting a replacement.
*/
declare function resolveOboToken(user: IUser, oboConfig: OboConfig, oboTokenResolver: OboTokenResolver, upstreamTokenProvider: UpstreamTokenProvider, identityContext?: AuthIdentityContext, forceRefresh?: boolean): Promise<MCPOAuthTokens>;
/**
* Re-evaluates whether the original author of a DB-stored OBO config still has
* permission to configure OBO. The connection layer calls this before performing
* an OBO token exchange so that retained configs fail closed if the author's role
* is downgraded after the server was created.
*
* Returns true when the author's role grants `MCP_SERVERS.CONFIGURE_OBO`. Any of
* the following degraded states return false (fail closed):
*   - missing author id
*   - user lookup miss / no role
*   - role lookup miss
*   - role missing the CONFIGURE_OBO bit
*/
type GetUserRoleByAuthorId = (authorId: string) => Promise<string | null | undefined>;
type RolePermissions = Partial<{ [K in keyof TRole["permissions"]]: Partial<TRole["permissions"][K]> }>;
type GetRolePermissions = (roleName: string) => Promise<RolePermissions | null | undefined>;
declare function isOboConfigStillTrusted({
  authorId,
  getUserRoleByAuthorId,
  getRolePermissions
}: {
  authorId: string | undefined;
  getUserRoleByAuthorId: GetUserRoleByAuthorId;
  getRolePermissions: GetRolePermissions;
}): Promise<boolean>;
/**
* Async predicate injected into MCP runtime to gate OBO exchanges per server.
* Returns true when OBO is allowed for the given config, false to fail closed.
*
* The runtime passes `source`, `author`, and `dbId` so the implementation can
* use the same `isUserSourced` semantics as the rest of the MCP layer (a
* missing `source` field on a legacy cached config still falls back to
* `dbId`-presence heuristics).
*/
type OboTrustChecker = (config: {
  source?: string;
  author?: string;
  dbId?: string;
}) => Promise<boolean>;
//#endregion
//#region src/utils/graph.d.ts
/**
* Response from a Graph API token exchange.
*/
interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}
/**
* Function type for resolving Graph API tokens via OBO flow.
* This function is injected from the main API layer since it requires
* access to OpenID configuration and caching services.
*/
type GraphTokenResolver = (user: IUser, accessToken: string, scopes: string, fromCache?: boolean) => Promise<GraphTokenResponse>;
/**
* Options for processing Graph token placeholders.
*/
interface GraphTokenOptions {
  user?: IUser;
  graphTokenResolver?: GraphTokenResolver;
  scopes?: string;
}
/**
* Checks if a string contains the Graph token placeholder.
* @param value - The string to check
* @returns True if the placeholder is present
*/
declare function containsGraphTokenPlaceholder(value: string): boolean;
/**
* Checks if any value in a record contains the Graph token placeholder.
* @param record - The record to check (e.g., headers, env vars)
* @returns True if any value contains the placeholder
*/
declare function recordContainsGraphTokenPlaceholder(record: Record<string, string> | undefined): boolean;
/**
* Checks if MCP options contain the Graph token placeholder in connection fields.
* @param options - The MCP options object
* @returns True if any field contains the placeholder
*/
declare function mcpOptionsContainGraphTokenPlaceholder(options: {
  args?: string[];
  headers?: Record<string, string>;
  env?: Record<string, string>;
  oauth?: Record<string, string | string[] | boolean | number | null | undefined>;
  oauth_headers?: Record<string, string>;
  url?: string;
}): boolean;
/**
* Asynchronously resolves Graph token placeholders in a string.
* This function must be called before the synchronous processMCPEnv pipeline.
*
* @param value - The string containing the placeholder
* @param options - Options including user and graph token resolver
* @returns The string with Graph token placeholder replaced
*/
declare function resolveGraphTokenPlaceholder(value: string, options: GraphTokenOptions): Promise<string>;
/**
* Asynchronously resolves Graph token placeholders in a record of string values.
*
* @param record - The record containing placeholders (e.g., headers)
* @param options - Options including user and graph token resolver
* @returns The record with Graph token placeholders replaced
*/
declare function resolveGraphTokensInRecord(record: Record<string, string> | undefined, options: GraphTokenOptions): Promise<Record<string, string> | undefined>;
/**
* Pre-processes MCP options to resolve Graph token placeholders.
* This must be called before processMCPEnv since Graph token resolution is async.
*
* @param options - The MCP options object
* @param graphOptions - Options for Graph token resolution
* @returns The options with Graph token placeholders resolved
*/
declare function preProcessGraphTokens<T extends {
  args?: string[];
  headers?: Record<string, string>;
  env?: Record<string, string>;
  oauth?: Record<string, string | string[] | boolean | number | null | undefined>;
  oauth_headers?: Record<string, string>;
  url?: string;
}>(options: T, graphOptions: GraphTokenOptions): Promise<T>;
//#endregion
//#region src/flow/manager.d.ts
type GuardedMutationResult = "updated" | "stale" | "missing";
interface FlowLease {
  generation: number;
  release: () => Promise<void>;
}
/** The flow a waiter was monitoring disappeared before it settled. */
declare class FlowStateNotFoundError extends Error {
  constructor(type: string);
}
/**
* Lifetime of a PENDING OAuth flow: how long the auth button stays valid and an
* in-flight flow can be reused before it is replaced. Mirrors
* `mcpConfig.OAUTH_HANDLING_TIMEOUT` (`MCP_OAUTH_HANDLING_TIMEOUT`) so the reuse
* window matches the wait the server grants the user. Default: 10 minutes.
*/
declare const PENDING_STALE_MS: number;
/**
* Normalizes an expiration timestamp to milliseconds.
* Timestamps below 10 billion are assumed to be in seconds (valid until ~2286).
*/
declare function normalizeExpiresAt(timestamp: number): number;
declare class FlowStateManager<T = unknown> {
  private static readonly inMemoryLeases;
  private static evictExpiredInMemoryLeases;
  private keyv;
  private ttl;
  private monitorTimeout;
  private retainedFailureTypes;
  private intervals;
  private redisScriptExecutor?;
  constructor(store: Keyv, options?: FlowManagerOptions);
  private setupCleanupHandlers;
  /**
  * Flow keys are intentionally NOT tenant-scoped. OAuth callbacks arrive
  * without tenant ALS context (the provider redirect doesn't carry
  * X-Tenant-Id). Flow IDs are random UUIDs with no collision risk, and
  * flow data is ephemeral (TTL-bounded, no sensitive user content).
  */
  private getFlowKey;
  /** Reads the generation used to reject work that crossed a teardown boundary. */
  getLeaseGeneration(leaseId: string): Promise<number | null>;
  /**
  * Acquires a cross-replica lease. `expectedGeneration` rejects an operation that started
  * before teardown; `advanceGeneration` is the teardown linearization point.
  */
  acquireLease(leaseId: string, options?: {
    expectedGeneration?: number;
    advanceGeneration?: boolean;
    leaseMs?: number;
    waitMs?: number;
  }): Promise<FlowLease | null>;
  private getRedisKey;
  private evalRedisScript;
  private static guardedResult;
  private static isCurrentAttempt;
  private getInMemoryEntry;
  /** Deletes a flow only while it still represents the caller's observed attempt. */
  deleteFlowIfCurrent(flowId: string, type: string, expectedCreatedAt: number, expectedState?: string): Promise<GuardedMutationResult>;
  /** Fails a flow only while it still represents the caller's observed attempt. */
  failFlowIfCurrent(flowId: string, type: string, expectedCreatedAt: number, expectedState: string, error: Error | string): Promise<GuardedMutationResult>;
  /** Completes a flow only while it still represents the caller's observed attempt. */
  completeFlowIfCurrent(flowId: string, type: string, expectedCreatedAt: number, expectedState: string, result: T): Promise<GuardedMutationResult>;
  /** Publishes an authoritative result for the exact observed attempt even if its handler settled
  * while the caller was committing a fresher durable value. A replacement attempt is untouched. */
  settleFlowIfCurrent(flowId: string, type: string, expectedCreatedAt: number, expectedState: string, result: T): Promise<GuardedMutationResult>;
  private isTokenExpired;
  /**
  * Stores initial PENDING flow state without starting the monitor loop.
  * Use this when you need to guarantee the state is persisted before
  * performing an action (e.g., an OAuth redirect), then call createFlow()
  * separately to start monitoring for completion.
  */
  initFlow(flowId: string, type: string, metadata?: FlowMetadata): Promise<void>;
  /**
  * Creates a new flow and waits for its completion
  */
  createFlow(flowId: string, type: string, metadata?: FlowMetadata, signal?: AbortSignal, createIfMissing?: boolean): Promise<T>;
  /**
  * Waits for the flow to settle. An owner that aborts takes its flow down with it; a joiner that
  * aborts leaves the flow to the attempt that owns it and to the other waiters.
  */
  private monitorFlow;
  /**
  * Completes a flow successfully
  */
  completeFlow(flowId: string, type: string, result: T): Promise<boolean>;
  /**
  * Checks if a flow is stale based on its age and status
  * @param flowId - The flow identifier
  * @param type - The flow type
  * @param staleThresholdMs - Age in milliseconds after which a non-pending flow is considered stale (default: 2 minutes)
  * @returns Object with isStale boolean and age in milliseconds
  */
  isFlowStale(flowId: string, type: string, staleThresholdMs?: number): Promise<{
    isStale: boolean;
    age: number;
    status?: string;
  }>;
  /**
  * Marks a flow as failed
  */
  failFlow(flowId: string, type: string, error: Error | string): Promise<boolean>;
  /**
  * Gets current flow state
  */
  getFlowState(flowId: string, type: string): Promise<StoredDataNoRaw<FlowState<T>> | null>;
  /**
  * Creates a new flow and waits for its completion, only executing the handler if no existing flow is found
  * @param flowId - The ID of the flow
  * @param type - The type of flow
  * @param handler - Async function to execute if no existing flow is found
  * @param signal - Optional AbortSignal to cancel the flow
  */
  createFlowWithHandler(flowId: string, type: string, handler: () => Promise<T>, signal?: AbortSignal): Promise<T>;
  /**
  * A completed result is served as it stands and a pending attempt is monitored, as is a failure
  * of a retained type. A failure of any other type only lingers because its own attempt already
  * returned it, so the next attempt replaces it instead of waiting on it.
  */
  private joinExistingFlow;
  /** Redis and the default in-memory store install an attempt atomically; other stores cannot. */
  private claimsAtomically;
  /**
  * Installs `initialState` only while the key is absent or still holds `observed`, the attempt
  * the caller read and decided to replace. A store without an atomic primitive installs it
  * unconditionally, as before.
  */
  private claimFlow;
  /**
  * Deletes a flow state
  */
  deleteFlow(flowId: string, type: string): Promise<boolean>;
}
//#endregion
//#region src/mcp/types/index.d.ts
type MCPRuntimeRequestBody = Required<Pick<RequestBody, "messageId" | "conversationId">> & Pick<RequestBody, "parentMessageId" | "codeEnvironmentMode" | "codeWorkspaces">;
type StdioOptions = z.infer<typeof StdioOptionsSchema>;
type WebSocketOptions = z.infer<typeof WebSocketOptionsSchema>;
type SSEOptions = z.infer<typeof SSEOptionsSchema>;
type StreamableHTTPOptions = z.infer<typeof StreamableHTTPOptionsSchema>;
type MCPOptions$1 = z.infer<typeof MCPOptionsSchema> & {
  customUserVars?: Record<string, {
    title: string;
    description: string;
  }>;
};
type MCPServers = z.infer<typeof MCPServersSchema>;
interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}
interface LCFunctionTool {
  type: "function";
  ["function"]: LCTool;
  /** Raw upstream tool name when the model-facing key stripped a redundant
  *  server-name prefix — tool calls must send THIS name to the server. */
  serverToolName?: string;
}
type LCAvailableTools = Record<string, LCFunctionTool>;
type LCManifestTool = TPlugin;
type LCToolManifest = TPlugin[];
interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
  }>;
}
type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
type OAuthHandledSource = "silent-refresh" | "interactive";
type MCPTool = Tool;
type MCPToolListResponse = ListToolsResult;
type ToolContentPart = TextContent | ImageContent | EmbeddedResource | ResourceLink | AudioContent;
type ResourceContents = EmbeddedResource["resource"];
type ResourceBody = {
  text?: string;
  image?: ImageContent;
  binaryBytes?: number;
};
type MCPToolCallResponse = undefined | {
  _meta?: Record<string, unknown>;
  content?: Array<ToolContentPart>;
  isError?: boolean;
};
type Provider = "google" | "anthropic" | "openai" | "azureopenai" | "openrouter" | "xai" | "deepseek" | "ollama" | "bedrock";
type FormattedContent = {
  type: "text";
  text: string;
} | {
  type: "image";
  inlineData: {
    mimeType: string;
    data: string;
  };
} | {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
} | {
  type: "image_url";
  image_url: {
    url: string;
  };
};
type FileSearchSource = {
  fileId: string;
  relevance: number;
  fileName?: string;
  metadata?: {
    storageType?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
type Artifacts = {
  content?: FormattedContent[];
  [Tools.ui_resources]?: {
    data: UIResource[];
  };
  [Tools.file_search]?: {
    sources: FileSearchSource[];
    fileCitations?: boolean;
  };
  [Tools.web_search]?: SearchResultData;
  files?: Array<{
    id: string;
    name: string;
  }>;
  session_id?: string;
  file_ids?: string[];
} | undefined;
type FormattedContentResult = [string, Artifacts | undefined];
type ImageFormatter = (item: ImageContent) => FormattedContent;
type FormattedToolResponse = FormattedContentResult;
/**
* Origin of an MCP server definition.
* - `'yaml'`   — operator-defined in librechat.yaml, full trust, boot-time init
* - `'config'` — admin-defined via Config override, full trust, lazy init
* - `'user'`   — user-provided via UI, sandboxed (restricted placeholder resolution)
* - `'plugin'` — contributed by an Agent Plugins package, no placeholder resolution
*
* This tag is load-bearing, not descriptive: `processMCPEnv` reads it to decide
* which placeholders may resolve. Code that stores a config must carry the tag
* through rather than re-deriving it from the storage tier.
*/
type MCPServerSource = "yaml" | "config" | "user" | "plugin";
type ParsedServerConfig = MCPOptions$1 & {
  url?: string;
  requiresOAuth?: boolean;
  oauthMetadata?: Record<string, unknown> | null;
  capabilities?: string;
  tools?: string;
  toolFunctions?: LCAvailableTools;
  /**
  * Instructions advertised by the server, fetched during inspection when
  * `serverInstructions` is enabled. Held separately so `serverInstructions`
  * always keeps the operator's declaration: overwriting it in place made a
  * re-inspected config compare unequal to its own YAML entry.
  */
  resolvedInstructions?: string;
  initDuration?: number;
  updatedAt?: number;
  dbId?: string; /** Origin of this server definition — determines trust level and placeholder resolution */
  source?: MCPServerSource; /** True if access is only via agent (not directly shared with user) */
  consumeOnly?: boolean; /** True when inspection failed at startup; the server is known but not fully initialized */
  inspectionFailed?: boolean;
  /**
  * User-id of the creating user (DB-sourced configs only). Used at runtime to gate
  * OBO token exchanges by re-checking the author's CONFIGURE_OBO permission, so a
  * stored config remains safe if the author's role is downgraded.
  */
  author?: string;
};
type AddServerResult = {
  serverName: string;
  config: ParsedServerConfig;
};
/** Mutable per-creation budget shared by every direct-bearer recovery layer. */
interface DirectBearerRecoveryState {
  attempted: boolean;
  /** Request-local credential snapshot shared with checkout joiners and the first tool call. */
  resolvedConfig?: MCPOptions$1;
}
interface BasicConnectionOptions {
  serverName: string;
  serverConfig: MCPOptions$1;
  /** Original unresolved definition retained across asynchronous credential preprocessing. */
  serverDefinition?: MCPOptions$1;
  /** Original trusted definition retained when serverConfig already contains request-resolved credentials. */
  directBearerSourceConfig?: ParsedServerConfig;
  /** Internal one-shot fence shared with the connection owner. */
  directBearerRecoveryState?: DirectBearerRecoveryState;
  useSSRFProtection?: boolean;
  allowedDomains?: string[] | null;
  /** Admin exemption list of host:port pairs that bypass the SSRF private-IP block */
  allowedAddresses?: string[] | null;
  /** When true, only resolve customUserVars in processMCPEnv (for DB-stored servers) */
  dbSourced?: boolean;
  /** When true, serverConfig has already gone through processMCPEnv for this request */
  skipEnvProcessing?: boolean;
  /** When true, the connection is intentionally short-lived for a single request/tool call */
  ephemeralConnection?: boolean;
}
/** User context for placeholder resolution in MCP connections (non-OAuth and OAuth alike) */
interface UserConnectionContext {
  user?: IUser;
  customUserVars?: Record<string, string>;
  requestBody?: RequestBody;
  requestScopedConnections?: RequestScopedMCPConnectionStore;
  graphTokenResolver?: GraphTokenResolver;
  /** Live OpenID session credential source for trusted direct bearer and OBO configurations. */
  upstreamTokenProvider?: UpstreamTokenProvider;
  /** Deferred credential source used only after a server is confirmed to require OBO. */
  upstreamTokenProviderResolver?: UpstreamTokenProviderResolver;
  connectionTimeout?: number;
  /** Cancels the connection's SDK requests when the caller itself is cancelled; previously only
  *  OAuth connections could carry a signal, leaving non-OAuth discovery uncancellable. */
  signal?: AbortSignal;
  /** Absolute epoch-ms bound on the whole connect-and-list operation. `connectionTimeout` bounds
  *  only a single `connect()`, so a caller that must return within a fixed budget sets this to
  *  cap every segment, including `tools/list` pagination and the unauthenticated fallback. */
  deadlineMs?: number;
  /** Advances application authorization state after OAuth token persistence succeeds. */
  onOAuthCredentialsChanged?: (scope: {
    userId: string;
    serverName: string;
  }) => Promise<void>;
  /**
  * Persists authorization-fence intent before OAuth token rows change and returns its publisher.
  * The publisher reports the generation it wrote, so a caller that fenced its own credential
  * change can adopt that generation instead of the one it captured beforehand.
  */
  onOAuthCredentialsChanging?: (scope: {
    userId: string;
    serverName: string;
  }) => Promise<() => Promise<string | undefined>>;
  /**
  * Receives discovery work the caller stopped waiting for at its deadline or abort, such as an
  * OAuth token flow still persisting a refresh. The work keeps running; the promise settles with it.
  */
  onDiscoveryDetached?: (work: Promise<unknown>) => void;
  /**
  * Reports the publication generation carried by credentials the factory adopted from an
  * authorization or refresh it did not perform. A caller leasing a generation captured before it
  * resolved credentials moves the lease to the reported one while that is the generation
  * currently stored: the build then leases under the publication that stored its credentials
  * and stays fenced by any rotation that followed them.
  */
  onOAuthCredentialsAdopted?: (publicationGeneration: string) => Promise<void>;
  /**
  * Runs before the factory re-reads credentials from storage because a credential change
  * invalidated its cached token flow. A caller leasing a generation captured earlier re-captures
  * it here, ahead of the read, so a rotation that follows the read still fences the build.
  */
  onOAuthCredentialsInvalidated?: () => Promise<void>;
}
interface RequestScopedMCPConnectionStore {
  connections: Map<string, unknown>;
  pending: Map<string, Promise<unknown>>;
  disposeConnection?: (connectionKey: string, connection: unknown) => Promise<void>;
  /** Set before cleanup snapshots pending work; new connection attempts must fail closed. */
  cleanupStarted?: boolean;
}
interface OAuthStartOptions {
  expiresAt?: number;
}
type OAuthStartHandler = (authURL: string, options?: OAuthStartOptions) => Promise<void>;
interface OAuthConnectionOptions extends UserConnectionContext {
  useOAuth: true;
  flowManager: FlowStateManager<MCPOAuthTokens | null>;
  tokenMethods?: TokenMethods;
  signal?: AbortSignal;
  oauthStart?: OAuthStartHandler;
  oauthEnd?: () => Promise<void>;
  returnOnOAuth?: boolean;
  oboTokenResolver?: OboTokenResolver;
  oboTrustChecker?: OboTrustChecker;
  oboIdentityContext?: AuthIdentityContext;
}
/** Options accepted by UserConnectionManager.getUserConnection. OAuth fields are optional. */
interface UserMCPConnectionOptions extends UserConnectionContext {
  serverName: string;
  forceNew?: boolean;
  ephemeralConnection?: boolean;
  serverConfig?: ParsedServerConfig;
  /** Internal one-shot fence shared across connection initialization and initial tools/list. */
  directBearerRecoveryState?: DirectBearerRecoveryState;
  flowManager?: FlowStateManager<MCPOAuthTokens | null>;
  /** Request-local resolved credentials; serverConfig remains the authoritative definition. */
  directBearerResolvedConfig?: MCPOptions$1;
  tokenMethods?: TokenMethods;
  signal?: AbortSignal;
  oauthStart?: OAuthStartHandler;
  oauthEnd?: () => Promise<void>;
  returnOnOAuth?: boolean;
  oboTokenResolver?: OboTokenResolver;
  oboTrustChecker?: OboTrustChecker;
  oboIdentityContext?: AuthIdentityContext;
}
interface ToolDiscoveryOptions {
  serverName: string;
  user?: IUser;
  flowManager?: FlowStateManager<MCPOAuthTokens | null>;
  tokenMethods?: TokenMethods;
  signal?: AbortSignal;
  oauthStart?: OAuthStartHandler;
  customUserVars?: Record<string, string>;
  requestBody?: RequestBody;
  graphTokenResolver?: GraphTokenResolver;
  connectionTimeout?: number;
  /** Absolute epoch-ms bound on the whole discovery operation; see `UserConnectionContext`. */
  deadlineMs?: number;
  onOAuthCredentialsChanged?: (scope: {
    userId: string;
    serverName: string;
  }) => Promise<void>;
  onOAuthCredentialsChanging?: UserConnectionContext["onOAuthCredentialsChanging"];
  onDiscoveryDetached?: UserConnectionContext["onDiscoveryDetached"];
  /** Pre-resolved config-source servers for tenant-scoped lookup */
  configServers?: Record<string, ParsedServerConfig>;
  oboTokenResolver?: OboTokenResolver;
  oboTrustChecker?: OboTrustChecker;
  upstreamTokenProvider?: UpstreamTokenProvider;
  upstreamTokenProviderResolver?: UpstreamTokenProviderResolver;
  oboIdentityContext?: AuthIdentityContext;
}
interface ToolDiscoveryResult {
  tools: Tool[] | null;
  oauthRequired: boolean;
  oauthUrl: string | null;
  authenticationKind?: "oauth" | "obo" | "server";
}
//#endregion
//#region src/types/stream.d.ts
interface GenerationJobMetadata {
  userId: string;
  tenantId?: string;
  conversationId?: string;
  /** Immutable per-generation saver scope. LangGraph's root `checkpoint_ns`
  * remains empty; the checkpointer adapter maps this scope into storage. */
  checkpointNamespace?: string;
  /** Immutable generation protocol. Missing on legacy records means v1. */
  generationProtocolVersion?: 1 | 2;
  earlyBufferOverflow?: EarlyBufferOverflowState;
  /** User message data for rebuilding submission on reconnect */
  userMessage?: Agents.UserMessageMeta;
  /** Response message ID for tracking */
  responseMessageId?: string;
  /** Whether this generation replaces an existing assistant branch. */
  isRegenerate?: boolean;
  /** Exact normalized MCP placeholder identity for this turn. Persisted so HITL
  * resume does not reconstruct a different parent or overridden conversation. */
  mcpRequestBody?: MCPRuntimeRequestBody;
  /** Exact assistant-message fields authored by the user during this running job. */
  userSubmittedPaths?: string[];
  /** Exact HITL message-filter fields embedded at those assistant-message paths. */
  userSubmittedMessageFieldPaths?: UserSubmittedMessageFieldPath[];
  /** Sender label for the response (e.g., "GPT-4.1", "Claude") */
  sender?: string;
  /** Endpoint identifier for abort handling */
  endpoint?: string;
  /** Icon URL for UI display */
  iconURL?: string;
  /** Model name for token tracking */
  model?: string;
  /** Prompt token count for abort token spending */
  promptTokens?: number;
  /** Agent that initiated the run; a HITL resume verifies it rebuilds the same agent. */
  agent_id?: string;
  /** Whether the originating turn was a temporary chat; a HITL resume keeps it so. */
  isTemporary?: boolean;
  /** Original server-authenticated retention deadline, serialized across replicas. */
  retentionExpiresAt?: string;
  /** Exact durable delivery whose accepted continuation created this generation. */
  agentEventDeliveryKey?: string;
  /** Original actor invocation when the current mailbox delivery is an internal completion. */
  agentEventInvocationKey?: string;
  /** Original actor invocation generation retained across completion HITL resumes. */
  agentEventInvocationGenerationCreatedAt?: number;
  /** This generation must resume on a durable detached-action producer. */
  agentEventDetachedActionProducerRequired?: boolean;
  /** Durable retry payload captured before detached terminal evidence reaches Mongo. */
  agentEventDetachedTerminalEvidence?: AgentEventDetachedTerminalEvidence;
  /** Trusted actor binding copied from the authenticated delivery envelope. */
  agentEventBindingId?: string;
  /** Optional action evidence contract declared by the authenticated event source. */
  agentEventExpectedAction?: AgentTriggerExpectedAction;
  /** Versioned pointer to the canonical signed suspension stored on the Conversation. */
  agentEventSuspension?: AgentEventSuspensionProjection;
  /** Exact durable legacy-turn fence carried across a HITL pause/resume. */
  agentEventLegacyTurnToken?: string;
  /** Trusted scheduled-occurrence identity. These fields are accepted only from a
  * verified agent-trigger request and let pause/resume/reconciliation keep the
  * occurrence attached to the exact generation that owns it. */
  scheduleId?: string;
  scheduledFor?: string;
  scheduleConfigRevision?: number;
  scheduleManual?: boolean;
  /** Intended terminal classification retained when Mongo outcome persistence
  * fails. The scheduler reconciler consumes this evidence before clearing the job. */
  scheduleOutcome?: "success" | "error" | "interrupted" | "skipped_balance";
  scheduleOutcomeError?: string;
  /** Prevent normal terminal cleanup until schedule reconciliation has consumed
  * the retained outcome evidence. */
  preserveForScheduleReconcile?: boolean;
  /**
  * Deferred-tool names discovered (via `tool_search`) before a HITL pause. A resume
  * replays these into `createRun` because the rebuilt graph uses `messages: []`, so
  * without them the rebuilt model would lose the discovered tool schemas.
  */
  discoveredTools?: string[];
  /** Bounded collector state for continuing a phase across HITL resume. */
  activityPhaseSnapshot?: ActivityPhaseSnapshot;
  /** Exact bounded compaction guidance captured atomically with a HITL pause. */
  compactionSemanticIndex?: ICompactionSemanticIndexProjection;
  /** Calibration and fading state captured atomically with a HITL pause, so a resume seeds its rebuilt pruner from the same tier. */
  contextMeta?: IAgentEventActorContextMeta;
  /** See `SerializableJobData.preemptCapable`. */
  preemptCapable?: boolean;
  /** See `SerializableJobData.steerQuotesCapable`. */
  steerQuotesCapable?: boolean;
  /** See `SerializableJobData.steerQuotesExecutionId`. */
  steerQuotesExecutionId?: string;
  /** Exact provider segment whose completion gates destructive user cleanup. */
  providerExecutionId?: string;
  /** Exact provider owner that crossed its start fence. */
  providerExecutionStartedId?: string;
  /** False only while that exact provider segment can still mutate user data. */
  providerDrained?: boolean;
  /** Terminal close has atomically stopped new steer acceptance, even if the
  * final status CAS has not yet run. */
  steersClosed?: boolean;
  /** Stable start-submission identity. Duplicate POSTs compare this with their
  * claim before attaching to a conversation-scoped stream. */
  idempotencyClientRequestId?: string;
  /** Normal FINAL publication is waiting on required durable abort work. */
  terminalPersistencePending?: boolean;
  terminalHostActionPending?: boolean;
  terminalPersistenceStartedAt?: number;
  /** Set when the job is paused for human review (status === 'requires_action') */
  pendingAction?: Agents.PendingAction;
  /** Accepted ask-user answer retained until this generation terminalizes. */
  resolvedAskUserQuestions?: ResolvedAskUserQuestion[];
}
type GenerationJobStatus = "running" | "complete" | "error" | "aborted" | "requires_action";
interface GenerationJob {
  streamId: string;
  emitter: EventEmitter;
  status: GenerationJobStatus;
  createdAt: number;
  completedAt?: number;
  abortController: AbortController;
  error?: string;
  metadata: GenerationJobMetadata;
  readyPromise: Promise<void>;
  resolveReady: () => void;
  /** Final event when job completes */
  finalEvent?: ServerSentEvent;
  /** Flag to indicate if a sync event was already sent (prevent duplicate replays) */
  syncSent?: boolean;
}
type ContentPart = Agents.ContentPart;
type ResumeState = Agents.ResumeState;
type ChunkHandler = (event: ServerSentEvent) => void;
type DoneHandler = (event: ServerSentEvent) => void;
type ErrorHandler = (error: string) => void;
type UnsubscribeFn = () => void;
/** Active event-stream subscription. */
interface StreamSubscription {
  unsubscribe: UnsubscribeFn;
}
/** Resume subscription whose live delivery starts after the caller writes its sync frame. */
interface ResumeSubscription extends StreamSubscription {
  activate: () => void;
}
/** Options for subscribing to a job event stream */
interface SubscribeOptions {
  /**
  * When true, skips replaying the earlyEventBuffer.
  * Use for resume connections after a sync event has been sent.
  */
  skipBufferReplay?: boolean;
  /** Cancels attachment work when the HTTP client disconnects. */
  signal?: AbortSignal;
  /** Exact generation epoch the caller intends to observe. Conversation ids
  * are reused by later turns, so a stale client must never attach to a
  * replacement job that now occupies the same stream id. */
  expectedCreatedAt?: number;
}
/** Result of an atomic subscribe-with-resume operation */
interface SubscribeWithResumeResult {
  subscription: ResumeSubscription | null;
  resumeState: ResumeState | null;
  /**
  * Events that arrived between the resume snapshot and the subscribe call.
  * In-memory mode: drained from earlyEventBuffer (only place they exist).
  * Redis mode: empty — chunks are persisted to the store and appear in aggregatedContent on next resume.
  */
  pendingEvents: ServerSentEvent[];
}
//#endregion
//#region src/types/principal.d.ts
interface ResolvedPrincipal {
  principalType: PrincipalType;
  principalId?: string | Types.ObjectId;
}
//#endregion
export { StreamableHTTPOptions as $, VertexAIClientOptions$1 as $i, ActivityLabelBatchMeta as $n, VideoResult as $r, OpenIDSessionIdentitySource as $t, LCManifestTool as A, TCustomEndpointsConfig as Ai, normalizeResumeRunStepIndices as An, GoogleConfigOptions as Ar, UpstreamTokenTarget as At, MCPToolListResponse as B, BedrockUserCredentials as Bi, AssistantTextPhase as Bn, DocumentResult as Br, MCPOAuthTokens as Bt, FormattedContent as C, EndpointDbMethods as Ci, findUndecidedToolCalls as Cn, MistralOCRUploadResult as Cr, OboConfig as Ct, ImageFormatter as D, InitializeResultBase as Di, mapAskUserAnswer as Dn, OCRResultPage as Dr, OboTrustChecker as Dt, ImageContent as E, GetUserKeyValuesFunction as Ei, hydrateResumeRunSteps as En, OCRResult as Er, OboTokenResolver as Et, MCPRuntimeRequestBody as F, RequestBody as Fi, ACTIVITY_PHASE_INSTRUCTION as Fn, AudioFileInfo as Fr, resolveOboToken as Ft, ParsedServerConfig as G, AnthropicCredentials as Gi, createAssistantPhaseStampingHandlers as Gn, OpenAIFileBlock as Gr, OAuthStoredClientMetadata as Gt, OAuthHandledSource as H, InferenceProfileConfig as Hi, GeneratedActivityPhase as Hn, GoogleAudioBlock as Hr, OAuthClientSource as Ht, MCPServerSource as I, ServerRequest as Ii, ActivityPhaseEntry as In, AudioProcessingResult as Ir, selectMCPUpstreamTokenProvider as It, ResourceBody as J, AnthropicParameters as Ji, captureActivityBlockContext as Jn, OpenRouterVideoBlock as Jr, FlowState as Jt, Provider as K, AnthropicLLMConfigResult as Ki, ActivityLabelHostDeps as Kn, OpenAIInputFileBlock as Kr, FlowManagerOptions as Kt, MCPServers as L, BedrockConfigOptions as Li, ActivityPhaseHostDeps as Ln, AudioResult as Lr, ExtendedOAuthTokens as Lt, MCPOptions$1 as M, resolveEndpointRuntime as Mi, resolveToolApprovalResume as Mn, GoogleParameters as Mr, createLazyOboUpstreamTokenProvider as Mt, MCPPrompt as N, EndpointTokenConfig as Ni, serializeAskUserAnswerVariants as Nn, AnthropicDocumentBlock as Nr, isOboConfigStillTrusted as Nt, LCAvailableTools as O, ProviderInitializeParams as Oi, mapAskUserAnswers as On, OCRUsageInfo as Or, UpstreamTokenProvider as Ot, MCPResource as P, TokenConfig as Pi, EarlyBufferOverflowState as Pn, AudioBlock as Pr, isRetryableOboExchangeError as Pt, StdioOptions as Q, ThinkingConfigParam as Qi, ACTIVITY_INSTRUCTION as Qn, VideoBlock as Qr, AuthIdentityTuple as Qt, MCPTool as R, BedrockCredentials as Ri, ActivityPhaseSnapshot as Rn, BedrockDocumentBlock as Rr, MCPOAuthFlowMetadata as Rt, FileSearchSource as S, BaseInitializeParams as Si, findIncompleteDecisions as Sn, MistralOCRRequest as Sr, GetUserRoleByAuthorId as St, FormattedToolResponse as T, GetUserKeyFunction as Ti, hasInvalidToolApprovalResolutions as Tn, OCRImage as Tr, OboTokenResolutionReason as Tt, OAuthStartHandler as U, BalanceUpdateFields as Ui, TrackedActivity as Un, GoogleDocumentBlock as Ur, OAuthMetadata as Ut, OAuthConnectionOptions as V, GuardrailConfiguration as Vi, GenerateActivityPhasePayload as Vn, FileObject as Vr, OAuthClientInformation$1 as Vt, OAuthStartOptions as W, AnthropicConfigOptions as Wi, createActivityPhaseWiring as Wn, GoogleVideoBlock as Wr, OAuthProtectedResourceMetadata as Wt, ResourceLink as X, ThinkingConfigDisabled as Xi, stripActivityLabelParts as Xn, STTService as Xr, AuthIdentityContext as Xt, ResourceContents as Y, ThinkingConfigAdaptive as Yi, createActivityLabelWiring as Yn, ProcessedFile as Yr, FlowStatus as Yt, SSEOptions as Z, ThinkingConfigEnabled as Zi, synthesizeActivityLabelGapEvents as Zn, StrategyFunctions as Zr, AuthIdentitySource as Zt, AudioContent as _, ServerSentEvent as _i, attachAskUserQuestionArgs as _n, AccessiblePromptGroupsResult as _r, preProcessGraphTokens as _t, ErrorHandler as a, OpenAIModelOptions as aa, S3FileRef as ai, createRefreshTokenBridgeIdentity as an, GenerateLabelPayload as ar, UserMCPConnectionOptions as at, DirectBearerRecoveryState as b, MongoServerError as bi, findAskUserQuestionContentIndex as bn, MistralFileUploadResponse as br, resolveGraphTokensInRecord as bt, GenerationJobStatus as c, GenericClient as ca, SaveURLParams as ci, resolveAuthOpenIDIssuer as cn, createActivityLabelHook as cr, FlowStateManager as ct, StreamSubscription as d, loadServiceKey as da, UploadImageParams as di, resolveTenantId as dn, AgentEventDetachedTerminalEvidence as dr, normalizeExpiresAt as dt, LLMConfigResult as ea, BatchUpdateFn as ei, RefreshTokenBridgeIdentity as en, ActivityLabelBlockContext as er, TextContent as et, SubscribeOptions as f, UploadResult as fi, serializeAuthIdentityTuple as fn, AgentEventSuspensionProjection as fr, GraphTokenOptions as ft, Artifacts as g, FinalMessageFields as gi, attachAskUserQuestionAnswers as gn, RunLLMConfig as gr, mcpOptionsContainGraphTokenPlaceholder as gt, AddServerResult as h, FinalEvent as hi, attachAskUserQuestionAnswer as hn, JsonValue as hr, containsGraphTokenPlaceholder as ht, DoneHandler as i, OpenAIConfiguration as ia, ProcessAvatarParams as ii, createOpenIDSessionIdentity as in, ActivityLabelSlot as ir, UserConnectionContext as it, LCToolManifest as j, UserKeyValues as ji, resolveAskUserQuestionResume as jn, GoogleCredentials as jr, awaitOboOperation as jt, LCFunctionTool as k, RuntimeInitializeParams as ki, mapToolApprovalResolutions as kn, PageDimensions as kr, UpstreamTokenProviderResolver as kt, ResumeState as l, GoogleServiceKey as la, SaveURLResult as li, resolveOpenIDSubject as ln, stringifyActivityEvidence as lr, FlowStateNotFoundError as lt, UnsubscribeFn as m, CreatedEvent as mi, appendResolvedAskUserQuestion as mn, JsonPrimitive as mr, GraphTokenResponse as mt, ChunkHandler as n, OpenAIConfigOptions as na, GetURLParams as ni, createOpenIDOboIdentityTuple as nn, ActivityLabelInvokeCallbacks as nr, ToolDiscoveryOptions as nt, GenerationJob as o, OpenAIParameters as oa, SaveBufferFn as oi, isOpenIDSessionIdentityMatch as on, buildPrompt as or, WebSocketOptions as ot, SubscribeWithResumeResult as p, UrlBuilder as pi, ResolvedAskUserQuestion as pn, AgentTriggerExpectedAction as pr, GraphTokenResolver as pt, RequestScopedMCPConnectionStore as q, AnthropicModelOptions as qi, LooseContentPart as qn, OpenRouterAudioBlock as qr, FlowMetadata as qt, ContentPart as r, OpenAIConfigResult as ra, ImageUploadResult as ri, createOpenIDRefreshIdentityTuple as rn, ActivityLabelLLM as rr, ToolDiscoveryResult as rt, GenerationJobMetadata as s, AzureOptions as sa, SaveBufferParams as si, resolveAppUserId as sn, classifyBatch as sr, FlowLease as st, ResolvedPrincipal as t, OAIClientOptions as ta, DownloadURLParams as ti, createAuthIdentityContext as tn, ActivityLabelHookOptions as tr, ToolContentPart as tt, ResumeSubscription as u, checkUserKeyExpiry as ua, UploadFileParams as ui, resolveRefreshSubject as un, AgentEventAppliedAction as ur, PENDING_STALE_MS as ut, BasicConnectionOptions as v, StreamEvent as vi, buildResolvedAskUserQuestion as vn, PromptGroupsAllResponse as vr, recordContainsGraphTokenPlaceholder as vt, FormattedContentResult as w, EndpointRuntimeContext as wi, getBoundedAskUserAnswerValues as wn, MistralSignedUrlResponse as wr, OboTokenResolutionError as wt, EmbeddedResource as x, ValidationError as xi, findDisallowedDecisions as xn, MistralOCRError as xr, GetRolePermissions as xt, ConnectionState as y, CustomError as yi, createContentIndexOffsetHandlers as yn, PromptGroupsListResponse as yr, resolveGraphTokenPlaceholder as yt, MCPToolCallResponse as z, BedrockLLMConfigResult as zi, ActivityPhaseWiring as zn, DocumentBlock as zr, MCPOAuthState as zt };
//# sourceMappingURL=index-B5TXk7G9.d.cts.map