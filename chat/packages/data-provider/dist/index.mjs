import { $ as permissionEntrySchema, $a as agentsBaseSchema, $i as setFileConfigRegexCompiler, $n as messageFilterPiiSchema, $o as openAISchema, $r as AuthorizationTypeEnum, $s as FEEDBACK_FILTER_FIELDS, $t as Time, Aa as MIN_BALANCE_RESERVATION_TTL_MS, Ac as hasActivePiiFields, Ai as fullMimeTypesList, An as defaultModels, Ao as getGoogleThinkingBudgetBounds, Ar as transactionsSchema, As as FEEDBACK_TAGS, At as LANGFUSE_TRACE_USER_ID_FIELDS, B as MutationKeys, Ba as MYTHOS_CLASS_FAMILIES, Bc as envVarRegex, Bi as isBedrockDocumentType, Bn as getEndpointField, Bo as inputTokensIncludesCache, Br as MCPServerUserInputSchema, Bs as CODE_WORKSPACE_ID_PATTERN, Bt as SKILL_SYNC_DEFAULT_DISCOVERY_DEPTH, Ca as MAX_CHAT_PROJECT_NAME_LENGTH, Cc as filterPiiActionSchema, Ci as defaultTextMimeTypes, Cn as codeEnvironmentUserConfigSchema, Co as eReasoningResponseKeySchema, Cr as summarizationTriggerSchema, Cs as CODE_APPROVAL_MODES, Ct as ErrorTypes, Da as getMaxSubagents, Dc as filtersConfigSchema, Di as excelMimeTypes, Dn as defaultAgentCapabilities, Do as eVerbositySchema, Dr as toolApprovalPolicySchema, Ds as resolveCodePermissionDecision, Dt as InfiniteCollections, Ea as MAX_SUBAGENTS_CEILING, Ec as filterPiiStarterPatternSchema, Ei as excelFileTypes, En as contextPruningSchema, Eo as eThinkingLevelSchema, Er as toolApprovalModeSchema, Es as resolveCodeApprovalMode, Et as ImageDetailCost, F as request_default, Fa as BedrockProviders, Fc as promptFilterFieldSchema, Fi as imageMimeTypes, Fn as fileSourceSchema, Fo as googleGenConfigSchema, Fr as vertexModelConfigSchema, Fs as getTagsForRating, Ft as MAX_SUBAGENT_RUN_CONFIGS, G as PrincipalType, Ga as ReasoningMode, Gi as mbToBytes, Gn as isRemoteOidcUrlAllowed, Go as isKnownProviderIdentifier, Gr as SSEOptionsSchema, Gs as isCodeWorkspaceEnvironment, Gt as SafeSearchTypes, H as AccessRoleIds, Ha as Providers, Hc as extractVariableName, Hi as isMessageFileUpload, Hn as imageGenTools, Ho as isAssistantsEndpoint, Hr as MCP_SERVER_TITLE_ERROR, Hs as CODE_WORKSPACE_OPERATIONS, Ht as SKILL_SYNC_MAX_INTERVAL_MINUTES, I as getTokenHeader, Ia as BedrockReasoningConfig, Ic as skillFilterFieldSchema, Ii as imageTypeMapping, In as fileStorageSchema, Io as googleSchema, Ir as visionModels, Is as toMinimalFeedback, It as OCRStrategy, J as accessRoleToPermBits, Ja as ReasoningSummary, Ji as mimeTypeAliases, Jn as langfuseConfigSchema, Jo as isOpenAILikeProvider, Jr as WebSocketOptionsSchema, Js as isCodeWorkspaceSelections, Jt as SearchProviders, K as ResourceType, Ka as ReasoningParameterFormat, Ki as megabyte, Kn as isSecureCodeEnvironmentControlURL, Ko as isMediaSupportedProvider, Kr as StdioOptionsSchema, Ks as isCodeWorkspaceSelection, Kt as ScraperProviders, L as setAcceptLanguageHeader, La as EModelEndpoint, Lc as toolArgumentFilterFieldSchema, Li as inferMimeType, Ln as fileStrategiesSchema, Lo as googleSettings, Lr as webSearchSchema, Ls as CODE_ENVIRONMENT_DECISION_VERSION, Lt as RateLimitPrefix, Ma as getRefillEligibilityDate, Mc as memoryFilterFieldSchema, Mi as getDocumentFileExtension, Mn as defaultSocialLogins, Mo as getModelKey, Mr as turnstileSchema, Ms as feedbackSchema, Mt as LocalStorageKeys, Na as AnthropicEffort, Nc as messageFilterFieldSchema, Ni as getEndpointFileConfig, Nn as endpointSchema, No as getSettingsKeys, Nr as validateVisionModel, Ns as feedbackTagKeySchema, Nt as MAX_SUBAGENT_DEPTH, Oa as setMaxSubagents, Oc as getPiiRegexProgramSize, Oi as fileConfig, On as defaultAssistantsVersion, Oo as endpointSettings, Or as traceViewerDefaults, Os as FEEDBACK_RATINGS, Ot as KnownEndpoints, Pa as AuthType, Pc as modelParameterFilterFieldSchema, Pi as imageExtRegex, Pn as excludedKeys, Po as googleBaseSchema, Pr as vertexAISchema, Ps as getTagByKey, Pt as MAX_SUBAGENT_GRAPH_NODES, Q as permBitsToAccessLevel, Qa as Verbosity, Qi as retrievalMimeTypesList, Qn as memorySchema, Qo as openAIBaseSchema, Qr as AuthTypeEnum, Qs as CONVERSATION_TITLE_FILTER_FIELDS, Qt as TTSProviders, R as setTokenHeader, Ra as ImageDetail, Rc as unattributedAssistantContentSchema, Ri as isAnthropicDocumentType, Rn as getConfigDefaults, Ro as imageDetailNumeric, Rr as MAX_MCP_ICON_PATH_LENGTH, Rs as CODE_ENVIRONMENT_MODES, Rt as RerankerTypes, Sa as MAX_CHAT_PROJECT_DESCRIPTION_LENGTH, Sc as fileFilterFieldSchema, Si as defaultSTTMimeTypes, Sn as codeEnvironmentPermissionDecisionSchema, So as eReasoningParameterFormatSchema, Sr as summarizationConfigSchema, Ss as isActionTool, St as EndpointURLs, Ta as MAX_SUBAGENTS, Tc as filterPiiRegexSchema, Ti as endpointFileConfigSchema, Tn as configSchema, To as eThinkingDisplaySchema, Tr as toolApprovalHookConfigSchema, Ts as getAllowedCodeApprovalModes, Tt as ForkOptions, U as PermissionBits, Ua as ReasoningContext, Uc as isSensitiveEnvVar, Ui as isPermissiveMimeConfig, Un as initialModelsConfig, Uo as isDocumentSupportedProvider, Ur as MCP_SERVER_TITLE_PATTERN, Us as CODE_WORKSPACE_SELECTION_ERROR_REASONS, Ut as SKILL_SYNC_MIN_INTERVAL_MINUTES, V as QueryKeys, Va as MemoryScope, Vc as extractEnvVariable, Vi as isExplicitMimeConfig, Vn as getSchemaDefaults, Vo as isAgentsEndpoint, Vr as MCPServersSchema, Vs as CODE_WORKSPACE_MAX_COUNT, Vt as SKILL_SYNC_MAX_DISCOVERY_DEPTH, W as PrincipalModel, Wa as ReasoningEffort, Wc as normalizeEndpointName, Wi as isResponsesApiUpload, Wn as interfaceSchema, Wo as isImageVisionTool, Wr as MCP_USER_INPUT_FIELDS, Ws as isCodeEnvironmentMode, Wt as STTProviders, X as getResourcePermissionsResponseSchema, Xa as ThinkingDisplay, Xi as resolveUseResponsesApi, Xn as listConfiguredSpeechProviders, Xo as isUUID, Xr as isProcessMCPServerConfig, Xs as AGENT_INSTRUCTION_FILTER_FIELDS, Xt as SettingsViews, Y as effectivePermissionsResponseSchema, Ya as SkillsScope, Yi as resolveSandboxFilename, Yn as langfuseTraceConfigSchema, Yo as isParamEndpoint, Yr as hasProcessMCPServerConfig, Ys as ACTION_METADATA_FILTER_FIELDS, Yt as SettingsTabValues, Z as hasPermissions, Za as ThinkingLevel, Zi as retrievalMimeTypes, Zn as mcpRefreshDefaults, Zo as mediaSupportedProviders, Zr as isProcessMCPServerField, Zs as CONVERSATION_STARTER_FILTER_FIELDS, Zt as SystemCategories, _a as generateGoogleSchema, _c as actionMetadataFilterFieldSchema, _i as codeInterpreterMimeTypesList, _n as bedrockModels, _o as eImageDetailSchema, _r as specialVariables, _s as tSharedLinkSchema, _t as CohereConstants, a as data_service_exports, aa as modelSpecSubagentsSchema, ac as MAX_PII_CUSTOM_REGEX_INSTRUCTIONS, ai as apiBaseUrl, an as anthropicEndpointSchema, ao as assistantSchema, ar as normalizeServerName, as as subagentThreadLineageSchema, at as FilePurpose, ba as DEFAULT_MAX_RETAINED_TOOL_COUNT_CHARS, bc as conversationTitleFilterFieldSchema, bi as defaultLLMDeliveryPathSchema, bn as checkpointerTypeSchema, bo as eReasoningEffortSchema, br as stripServerNamePrefix, bs as actionDelimiter, bt as DEFAULT_OAUTH_STATE_TTL_MS, ca as tModelSpecSchema, cc as MAX_PII_PATTERN_LABEL_LENGTH, ci as registerPage, cn as assistantEndpointSchema, co as coerceNumber, cr as paramDefinitionSchema, cs as tConversationTagSchema, ct as AUTH_USER_DOC_BY_ID_PREFIX, da as resolveStatefulCodeEnvironment, dc as MESSAGE_FILTER_FIELDS, di as applicationMimeTypes, dn as azureGroupConfigsSchema, do as compactAssistantSchema, dr as resolveEndpointType, ds as tMessageSchema, dt as BASE_ONLY_CONFIG_SECTIONS, ea as supportedMimeTypes, ec as FILE_FILTER_FIELDS, ei as TokenExchangeMethodEnum, en as ViolationTypes, eo as agentsSchema, er as messageFilterSchema, es as openAISettings, et as principalSchema, fa as ComponentTypes, fc as MODEL_PARAMETER_FILTER_FIELDS, fi as audioMimeTypes, fn as azureGroupSchema, fo as compactGoogleSchema, fr as resolveTraceViewerConfig, fs as tModelSpecPresetSchema, ft as BASE_PRINCIPAL_CONFIG_SECTIONS, ga as generateDynamicSchema, gc as TOOL_ARGUMENT_FILTER_FIELDS, gi as codeInterpreterMimeTypes, gn as bedrockGuardrailConfigSchema, go as eAnthropicEffortSchema, gr as skillSyncGitHubSourceSchema, gs as tQueryParamsSchema, gt as Capabilities, ha as clampSettingRange, hc as STORED_MESSAGE_FILTER_FIELDS, hi as bedrockDocumentMimeTypes, hn as bedrockEndpointSchema, ho as documentSupportedProviders, hr as skillSyncConfigSchema, hs as tPresetSchema, ht as CacheKeys, ia as materializeModelSpecEndpoints, ic as MAX_PII_CUSTOM_REGEX_CHARACTERS, ii as checkOpenAIStorage, in as alternateName, io as anthropicSettings, ir as normalizeSearxngEngines, is as resolveAgentSkillsScope, it as AssistantStreamEvents, ja as REFILL_INTERVAL_UNITS, jc as hasActivePiiPatterns, ji as getConfiguredMimeAccept, jn as defaultRetrievalModels, jo as getGoogleThinkingBudgetMax, jr as turnstileOptionsSchema, js as feedbackRatingSchema, jt as LANGFUSE_TRACE_USER_METADATA_FIELDS, ka as DEFAULT_BALANCE_RESERVATION_TTL_MS, kc as hasActiveFiltersConfig, ki as fileConfigSchema, kn as defaultEndpoints, ko as extendedModelEndpointSchema, kr as traceViewerLimits, ks as FEEDBACK_REASON_KEYS, kt as LANGFUSE_TRACE_CONVERSATION_METADATA_FIELDS, la as STATEFUL_CODE_ENVIRONMENTS, lc as MAX_PII_PATTERN_LENGTH, li as sharedFileDownload, ln as azureBaseSchema, lo as compactAgentsBaseSchema, lr as providerEndpointMap, ls as tConvoUpdateSchema, lt as AgentCapabilities, ma as SettingTypes, mc as SKILL_FILTER_FIELDS, mi as bedrockDocumentFormats, mn as baseEndpointSchema, mo as defaultAssistantFormValues, mr as setMessageFilterRegexValidator, ms as tPluginSchema, mt as CODE_ENVIRONMENT_COMMAND_TIMEOUT_HARD_MAX_MS, na as textMimeTypes, nc as HITL_MESSAGE_FILTER_FIELDS, ni as FileContext, nn as agentsEndpointSchema, no as anthropicBaseSchema, nr as modularEndpoints, ns as paramEndpoints, nt as updateResourcePermissionsRequestSchema, oa as resolveModelSpecEndpoint, oc as MAX_PII_PATTERNS_PER_SOURCE, oi as buildLoginRedirectUrl, on as askUserQuestionConfigSchema, oo as authTypeSchema, or as ocrSchema, os as tBannerSchema, ot as RunStatus, pa as OptionTypes, pc as PROMPT_FILTER_FIELDS, pi as bedrockDocumentExtensions, pn as balanceSchema, po as defaultAgentFormValues, pr as retainRecentConfigSchema, ps as tPluginAuthConfigSchema, pt as CODE_ENVIRONMENT_COMMAND_TIMEOUT_DEFAULT_MS, q as accessRoleSchema, qa as ReasoningResponseKey, qi as mergeFileConfig, qn as isSpeechProviderConfigured, qo as isMythosClassModel, qr as StreamableHTTPOptionsSchema, qs as isCodeWorkspaceSelectionErrorReason, qt as SearchCategories, ra as videoMimeTypes, rc as MAX_PII_CUSTOM_PATTERNS_TOTAL, ri as FileSources, rn as allowedAddressesSchema, ro as anthropicSchema, rr as normalizeMCPToolKey, rs as removeNullishValues, rt as updateResourcePermissionsResponseSchema, sa as specsConfigSchema, sc as MAX_PII_PATTERN_ID_LENGTH, si as loginPage, sn as askUserQuestionRetainedAnswersSchema, so as cacheSubsetProviders, sr as openIdDiscoverySchema, ss as tConversationSchema, st as defaultOrderQuery, ta as supportsFiles, tc as FILTER_PII_STARTER_PATTERNS, ti as agentGitIdentitySchema, tn as VisionModes, to as agentsSettings, tr as modelConfigSchema, ts as openRouterSchema, tt as resourcePermissionsResponseSchema, ua as resolveAllowedStatefulCodeEnvironments, uc as MEMORY_FILTER_FIELDS, ui as DefaultLLMDeliveryPath, un as azureEndpointSchema, uo as compactAgentsSchema, ur as rateLimitSchema, us as tExampleSchema, ut as AuthKeys, va as generateOpenAISchema, vc as agentInstructionFilterFieldSchema, vi as codeTypeMapping, vn as buildServerNameAliases, vo as eModelEndpointSchema, vr as splitMCPToolKey, vs as EToolResources, vt as Constants, wa as MAX_GRAPH_SUBAGENT_MEMBERS, wc as filterPiiCustomPatternSchema, wi as documentParserMimeTypes, wn as codeEnvironmentUserSettingsSchema, wo as eReasoningSummarySchema, wr as supportsBalanceCheck, ws as CodeApprovalModeError, wt as FetchTokenConfig, xa as DEFAULT_RETAINED_ANSWER_TOKENS, xc as feedbackFilterFieldSchema, xi as defaultOCRMimeTypes, xn as cloudfrontConfigSchema, xo as eReasoningModeSchema, xr as stripServerNamePrefixes, xs as actionDomainSeparator, xt as EImageOutputType, ya as validateSettingDefinitions, yc as conversationStarterFilterFieldSchema, yi as convertStringsToRegex, yn as checkpointerSchema, yo as eReasoningContextSchema, yr as splitToolCallName, ys as Tools, yt as DEFAULT_MEMORY_MAX_INPUT_TOKENS, z as DynamicQueryKeys, za as ImageVisionTool, zc as userSubmittedMessageFieldPathSchema, zi as isAnthropicTextDocumentType, zn as getDefaultParamsEndpoint, zo as imageDetailValue, zr as MCPOptionsSchema, zs as CODE_ENVIRONMENT_MOVE_VERSION, zt as RetentionMode } from "./data-service-BzAsUhph.mjs";
import { z } from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezonePlugin from "dayjs/plugin/timezone.js";
import { Cron } from "croner";
import axios from "axios";
import { URL } from "url";
import crypto from "crypto";
import { load } from "js-yaml";
//#region src/bedrock.ts
const DEFAULT_THINKING_BUDGET = 2e3;
const BEDROCK_CLAUDE_SONNET_4_6_MAX_OUTPUT = 64e3;
const BEDROCK_OUTPUT_128K_BETA = "output-128k-2025-02-19";
const BEDROCK_FINE_GRAINED_TOOL_STREAMING_BETA = "fine-grained-tool-streaming-2025-05-14";
/** Betas TerraMind injects itself, safe to strip from persisted AMRF when a
* model no longer supports them; anything else in `anthropic_beta` is a user opt-in. */
const GENERATED_BEDROCK_BETAS = new Set([BEDROCK_OUTPUT_128K_BETA, BEDROCK_FINE_GRAINED_TOOL_STREAMING_BETA]);
const bedrockReasoningConfigValues = new Set(Object.values(BedrockReasoningConfig));
/**
* Resolves the final `thinking.display` value for an adaptive-thinking request.
*
* Starting with Claude Opus 4.7, the Messages API returns empty `thinking`
* blocks unless the request sets `thinking.display`. This helper encodes the
* three user-facing modes — `'auto'` (TerraMind decides), `'summarized'`, and
* `'omitted'` — into the wire value (or `undefined` when the field should be
* left off).
*
* See https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7#thinking-content-omitted-by-default
*/
/**
* Safely extracts a nested `thinking.display` string from a persisted
* `additionalModelRequestFields` object, returning `undefined` if the shape
* isn't what we expect.
*/
function extractPersistedDisplay(amrf) {
	if (typeof amrf !== "object" || amrf === null) return;
	const thinking = amrf.thinking;
	if (typeof thinking !== "object" || thinking === null) return;
	const display = thinking.display;
	return typeof display === "string" ? display : void 0;
}
function resolveThinkingDisplay(model, explicit) {
	if (explicit === "summarized") return "summarized";
	if (explicit === "omitted") return "omitted";
	if (omitsThinkingByDefault(model)) return "summarized";
}
/** Extracts opus major/minor version from both naming formats */
function parseOpusVersion(model) {
	const nameFirst = model.match(/claude-opus[-.]?(\d+)(?:[-.](\d{1,2})(?!\d))?/);
	if (nameFirst) return {
		major: parseInt(nameFirst[1], 10),
		minor: nameFirst[2] != null ? parseInt(nameFirst[2], 10) : 0
	};
	const numFirst = model.match(/claude-(\d+)(?:[-.](\d{1,2})(?!\d))?-opus/);
	if (numFirst) return {
		major: parseInt(numFirst[1], 10),
		minor: numFirst[2] != null ? parseInt(numFirst[2], 10) : 0
	};
	return null;
}
/** Extracts sonnet major/minor version from both naming formats.
*  Uses bounded minor capture to avoid matching date suffixes (e.g., -20250514). */
function parseSonnetVersion(model) {
	const nameFirst = model.match(/claude-sonnet[-.]?(\d+)(?:[-.](\d{1,2})(?!\d))?/);
	if (nameFirst) return {
		major: parseInt(nameFirst[1], 10),
		minor: nameFirst[2] != null ? parseInt(nameFirst[2], 10) : 0
	};
	const numFirst = model.match(/claude-(\d+)(?:[-.](\d{1,2})(?!\d))?-sonnet/);
	if (numFirst) return {
		major: parseInt(numFirst[1], 10),
		minor: numFirst[2] != null ? parseInt(numFirst[2], 10) : 0
	};
	return null;
}
/**
* Mythos-class detection (Claude Fable / Mythos) lives in `schemas.ts` as
* `isMythosClassModel` — the single source of truth for the family names.
* The helpers below OR it in alongside the `opus`/`sonnet` version parsers.
*/
/** Checks if a model supports adaptive thinking (Opus 4.6+, Sonnet 4.6+, Fable/Mythos) */
function supportsAdaptiveThinking(model) {
	const opus = parseOpusVersion(model);
	if (opus && (opus.major > 4 || opus.major === 4 && opus.minor >= 6)) return true;
	const sonnet = parseSonnetVersion(model);
	if (sonnet != null && (sonnet.major > 4 || sonnet.major === 4 && sonnet.minor >= 6)) return true;
	if (isMythosClassModel(model)) return true;
	return false;
}
/**
* Checks if a model omits `thinking` content from responses by default.
*
* Starting with Claude Opus 4.7, the Messages API returns empty `thinking`
* blocks unless the request explicitly opts in via `thinking.display =
* "summarized"`. This helper narrows the opt-in to Opus 4.7+ (and any future
* major Opus version) so older adaptive-thinking models are left untouched.
*
* See https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7#thinking-content-omitted-by-default
*/
function omitsThinkingByDefault(model) {
	const opus = parseOpusVersion(model);
	if (opus && (opus.major > 4 || opus.major === 4 && opus.minor >= 7)) return true;
	const sonnet = parseSonnetVersion(model);
	if (sonnet != null && sonnet.major >= 5) return true;
	if (isMythosClassModel(model)) return true;
	return false;
}
function omitsSamplingParameters(model) {
	const opus = parseOpusVersion(model);
	if (opus && (opus.major > 4 || opus.major === 4 && opus.minor >= 7)) return true;
	const sonnet = parseSonnetVersion(model);
	if (sonnet != null && sonnet.major >= 5) return true;
	if (isMythosClassModel(model)) return true;
	return false;
}
/**
* Whether disabling thinking requires sending an explicit `{ type: 'disabled' }`
* config rather than simply omitting the `thinking` field.
*
* Sonnet 5 and Opus 5 treat an omitted `thinking` field as adaptive thinking ON
* by default, so honoring a user who turns thinking off means sending the
* disabled config explicitly. Opus 4.7/4.8 run without thinking when the field
* is omitted, and Fable/Mythos reject an explicit disabled config (400,
* thinking always on), so both are excluded.
*
* See https://platform.claude.com/docs/en/about-claude/models/migration-guide#migrating-to-claude-sonnet-5
*/
function requiresExplicitThinkingDisabled(model) {
	const sonnet = parseSonnetVersion(model);
	if (sonnet != null && sonnet.major >= 5) return true;
	const opus = parseOpusVersion(model);
	return opus != null && opus.major >= 5;
}
/** Effort levels Opus 5 rejects while thinking is explicitly disabled. */
const EFFORTS_REJECTED_WHEN_THINKING_DISABLED = new Set(["xhigh", "max"]);
/**
* Whether the model caps `output_config.effort` while thinking is disabled.
*
* Opus 5 rejects `xhigh`/`max` in that combination with a 400: "output_config
* .effort 'xhigh' is not supported when thinking is disabled on this model. Use
* effort 'high' or below, or enable thinking." Opus 4.7/4.8, Sonnet 5, and
* Sonnet 4.6 accept every effort level they otherwise support with thinking
* off, so the cap is Opus 5+ only.
*/
function capsEffortWhenThinkingDisabled(model) {
	const opus = parseOpusVersion(model);
	return opus != null && opus.major >= 5;
}
/**
* Lowers an effort level the model would reject while thinking is disabled to
* the highest accepted value (`high`, which is also the API default). Returns
* the effort unchanged when the combination is valid.
*/
function clampEffortForDisabledThinking(model, effort) {
	if (capsEffortWhenThinkingDisabled(model) && EFFORTS_REJECTED_WHEN_THINKING_DISABLED.has(effort)) return "high";
	return effort;
}
/** An `output_config` container carrying a usable effort level. */
function hasStringEffort(value) {
	if (typeof value !== "object" || value === null || !("effort" in value)) return false;
	return typeof value.effort === "string";
}
/**
* Clamps an `output_config.effort` in place when the model would reject it
* while thinking is disabled. No-op when the container carries no string
* effort, so callers can pass a possibly-absent config directly.
*/
function clampOutputConfigEffort(model, outputConfig) {
	if (!hasStringEffort(outputConfig)) return;
	outputConfig.effort = clampEffortForDisabledThinking(model, outputConfig.effort);
}
/** Whether a resolved thinking config is an explicit `{ type: 'disabled' }`. */
function isThinkingDisabled(thinking) {
	if (typeof thinking !== "object" || thinking === null || !("type" in thinking)) return false;
	return thinking.type === "disabled";
}
/** Checks if a model has a 1M context window (Sonnet 4.6+, Opus 4.6+, Opus 5+, Fable/Mythos) */
function supportsContext1m(model) {
	const sonnet = parseSonnetVersion(model);
	if (sonnet != null && (sonnet.major > 4 || sonnet.major === 4 && sonnet.minor >= 6)) return true;
	const opus = parseOpusVersion(model);
	if (opus && (opus.major > 4 || opus.major === 4 && opus.minor >= 6)) return true;
	if (isMythosClassModel(model)) return true;
	return false;
}
/**
* Checks whether a native Anthropic Claude model supports prompt caching.
*
* This uses the configured model ID directly. Resolving it through a token
* map first can collapse a newly released Claude model to the generic
* `claude-` fallback and incorrectly disable cache control.
*/
function supportsPromptCache(model) {
	if (model.includes("claude-3-5-sonnet-latest") || model.includes("claude-3.5-sonnet-latest")) return false;
	return /claude-3[-.]7/.test(model) || /claude-3[-.]5-(?:sonnet|haiku)/.test(model) || /claude-3-(?:sonnet|haiku|opus)?/.test(model) || /claude-(?:sonnet|opus|haiku)[-.]?(?:[4-9]|\d{2,})/.test(model) || /claude-(?:[4-9]|\d{2,})(?:[-.](?:sonnet|opus|haiku))?/.test(model) || isMythosClassModel(model);
}
/**
* A Bedrock Claude model ID may be prefixed (`anthropic.claude-*`,
* `us.anthropic.claude-*`, `global.anthropic.claude-*`) or bare (`claude-*`,
* used when the TerraMind model ID maps to an application inference profile).
* Match on the `claude` family token so every form is recognized — requiring
* the literal `anthropic.` prefix silently dropped thinking config, beta
* headers, and sampling handling for inference-profile deployments.
*/
const BEDROCK_CLAUDE_4PLUS_THINKING = /claude-(?:[4-9](?:\.\d+)?(?:-\d+)?-(?:sonnet|opus|haiku)|(?:sonnet|opus|haiku)-[4-9])/;
/** Whether a Bedrock model ID is an Anthropic Claude model (prefixed or bare). */
function isBedrockClaudeModel(model) {
	return model.includes("claude");
}
/**
* Gets the appropriate anthropic_beta headers for Bedrock Anthropic models.
* Bedrock uses `anthropic_beta` (with underscore) in additionalModelRequestFields.
*
* @param model - The Bedrock model identifier (e.g., "anthropic.claude-sonnet-4-6")
* @returns Array of beta header strings, or empty array if not applicable
*/
function getBedrockAnthropicBetaHeaders(model) {
	const betaHeaders = [];
	/** Mythos-class (Fable/Mythos) is intentionally not matched: these betas are built-in/no-op for the
	* 4.7+ generation (Fable has native 128K output), so omitting them on Bedrock is lossless. */
	const isClaude4PlusModel = BEDROCK_CLAUDE_4PLUS_THINKING.test(model);
	if (model.includes("claude-3-7-sonnet") || isClaude4PlusModel) betaHeaders.push(BEDROCK_OUTPUT_128K_BETA);
	if (isClaude4PlusModel) betaHeaders.push(BEDROCK_FINE_GRAINED_TOOL_STREAMING_BETA);
	return betaHeaders;
}
/** Flatten an anthropic_beta value (array, single string, or comma-delimited
* string) into trimmed, non-empty header tokens. */
function normalizeBetaHeaders(value) {
	let values = [];
	if (Array.isArray(value)) values = value;
	else if (typeof value === "string") values = [value];
	const headers = [];
	values.forEach((entry) => {
		if (typeof entry !== "string") return;
		entry.split(",").map((header) => header.trim()).filter(Boolean).forEach((header) => headers.push(header));
	});
	return headers;
}
function mergeBedrockAnthropicBetaHeaders(existing, generated) {
	const generatedSet = new Set(generated);
	const betaHeaders = /* @__PURE__ */ new Set();
	[...normalizeBetaHeaders(existing), ...generated].forEach((header) => {
		/** Drop a generated beta carried over from a prior model that the current
		* model does not generate (e.g. fine-grained-tool-streaming on a 3.7
		* profile); user opt-ins are always preserved. */
		if (GENERATED_BEDROCK_BETAS.has(header) && !generatedSet.has(header)) return;
		betaHeaders.add(header);
	});
	return Array.from(betaHeaders);
}
const bedrockInputSchema = tConversationSchema.pick({
	chatProjectId: true,
	modelLabel: true,
	promptPrefix: true,
	resendFiles: true,
	iconURL: true,
	greeting: true,
	spec: true,
	maxOutputTokens: true,
	maxContextTokens: true,
	artifacts: true,
	region: true,
	system: true,
	model: true,
	maxTokens: true,
	temperature: true,
	topP: true,
	stop: true,
	thinking: true,
	thinkingBudget: true,
	effort: true,
	thinkingDisplay: true,
	reasoning_effort: true,
	promptCache: true,
	promptCacheTtl: true,
	topK: true,
	additionalModelRequestFields: true
}).transform((obj) => {
	if (obj.additionalModelRequestFields?.thinking != null) {
		const thinking = obj.additionalModelRequestFields.thinking;
		obj.thinking = typeof thinking === "object" && thinking !== null && thinking.type === "disabled" ? false : !!thinking;
		obj.thinkingBudget = typeof thinking === "object" && "budget_tokens" in thinking ? thinking.budget_tokens : void 0;
		if (obj.thinkingDisplay == null) {
			const persistedDisplay = extractPersistedDisplay({ thinking });
			if (persistedDisplay === "summarized" || persistedDisplay === "omitted") obj.thinkingDisplay = persistedDisplay;
		}
		delete obj.additionalModelRequestFields;
	}
	return removeNullishValues(obj);
}).catch(() => ({}));
const bedrockInputParser = tConversationSchema.pick({
	chatProjectId: true,
	modelLabel: true,
	promptPrefix: true,
	resendFiles: true,
	iconURL: true,
	greeting: true,
	spec: true,
	artifacts: true,
	maxOutputTokens: true,
	maxContextTokens: true,
	region: true,
	model: true,
	maxTokens: true,
	temperature: true,
	topP: true,
	stop: true,
	thinking: true,
	thinkingBudget: true,
	effort: true,
	thinkingDisplay: true,
	reasoning_effort: true,
	promptCache: true,
	promptCacheTtl: true,
	topK: true,
	additionalModelRequestFields: true
}).catchall(z.any()).transform((data) => {
	const knownKeys = [
		"chatProjectId",
		"modelLabel",
		"promptPrefix",
		"resendFiles",
		"iconURL",
		"greeting",
		"spec",
		"maxOutputTokens",
		"artifacts",
		"additionalModelRequestFields",
		"region",
		"model",
		"maxTokens",
		"temperature",
		"topP",
		"stop",
		"promptCache",
		"promptCacheTtl"
	];
	const additionalFields = {};
	const typedData = data;
	const shouldOmitSamplingParameters = typeof typedData.model === "string" && omitsSamplingParameters(typedData.model);
	Object.entries(typedData).forEach(([key, value]) => {
		if (!knownKeys.includes(key)) {
			if (key === "topK") additionalFields["top_k"] = value;
			else additionalFields[key] = value;
			delete typedData[key];
		}
	});
	/**
	* Persisted `model_parameters` can carry a prior "thinking off" only inside
	* `additionalModelRequestFields.thinking = { type: 'disabled' }` (a known
	* key that isn't spread into `additionalFields`). `initializeBedrock` feeds
	* those params straight through this parser, so surface that as
	* `thinking: false` — otherwise the disabled branch is skipped and the
	* config rebuilds adaptive, flipping a user's Sonnet 5 setting back on.
	*/
	const persistedThinking = typedData.additionalModelRequestFields?.thinking;
	if (additionalFields.thinking === void 0 && typeof persistedThinking === "object" && persistedThinking !== null && persistedThinking.type === "disabled") additionalFields.thinking = false;
	/** Bedrock thinking-capable Claude models: 3.7 Sonnet, Claude 4+ (opus/sonnet/haiku), and Mythos-class (Fable/Mythos). */
	const isThinkingModel = typeof typedData.model === "string" && (typedData.model.includes("claude-3-7-sonnet") || BEDROCK_CLAUDE_4PLUS_THINKING.test(typedData.model) || isMythosClassModel(typedData.model));
	if (isThinkingModel) {
		if (supportsAdaptiveThinking(typedData.model)) {
			/** Persisted AMRF is spread into the final request, so clearing only
			* `additionalFields` leaves a stale value from a prior selection. */
			const persistedAmrf = typedData.additionalModelRequestFields;
			const thinkingDisabled = additionalFields.thinking === false;
			const effort = additionalFields.effort;
			if (typeof effort === "string" && effort !== "") additionalFields.output_config = { effort };
			else if (effort !== void 0 && persistedAmrf)
 /** Explicit unset ('' or null) clears the persisted effort. An absent
			* effort (agent resume, where the prior llmConfig persisted
			* `output_config` but no top-level `effort`) preserves it. */
			delete persistedAmrf.output_config;
			delete additionalFields.effort;
			/**
			* Opus 5 rejects `xhigh`/`max` effort while thinking is disabled, so
			* clamp both the effort derived above and any effort still carried in
			* persisted AMRF (agent resume sends `output_config` with no top-level
			* `effort`, so the branch above leaves it untouched).
			*/
			if (thinkingDisabled) [additionalFields, persistedAmrf].forEach((target) => clampOutputConfigEffort(typedData.model, target?.output_config));
			if (additionalFields.thinking === false) {
				delete additionalFields.thinkingBudget;
				delete additionalFields.thinkingDisplay;
				if (requiresExplicitThinkingDisabled(typedData.model)) additionalFields.thinking = { type: "disabled" };
				else {
					delete additionalFields.thinking;
					/** Disable-by-omission models (Opus 4.7+): drop the persisted
					* adaptive config so turning thinking off actually disables it. */
					if (persistedAmrf) delete persistedAmrf.thinking;
				}
			} else {
				/**
				* Persisted agent `model_parameters` round-trip back through this
				* parser with the prior `thinking.display` embedded in
				* `additionalModelRequestFields`. Surface it as the resolver's
				* explicit value when no top-level `thinkingDisplay` is set so the
				* prior user choice (e.g. 'omitted') survives instead of being
				* clobbered by the Opus 4.7+ auto → 'summarized' fallback.
				*/
				const topLevelDisplay = additionalFields.thinkingDisplay;
				const persistedDisplay = extractPersistedDisplay(typedData.additionalModelRequestFields);
				const thinkingConfig = { type: "adaptive" };
				const display = resolveThinkingDisplay(typedData.model, topLevelDisplay ?? persistedDisplay);
				if (display) thinkingConfig.display = display;
				additionalFields.thinking = thinkingConfig;
				delete additionalFields.thinkingBudget;
				delete additionalFields.thinkingDisplay;
			}
		} else {
			if (additionalFields.thinking === void 0) additionalFields.thinking = true;
			else if (additionalFields.thinking === false) {
				delete additionalFields.thinking;
				delete additionalFields.thinkingBudget;
			}
			if (additionalFields.thinking === true && additionalFields.thinkingBudget === void 0) additionalFields.thinkingBudget = DEFAULT_THINKING_BUDGET;
			delete additionalFields.effort;
			delete additionalFields.thinkingDisplay;
			/** A bare non-adaptive thinking profile (e.g. `claude-3-7-sonnet`) must
			* not inherit an adaptive/disabled thinking object or `output_config`
			* persisted from another model; this branch's own fields are authoritative. */
			const persistedAmrf = typedData.additionalModelRequestFields;
			if (persistedAmrf) {
				delete persistedAmrf.thinking;
				delete persistedAmrf.output_config;
			}
		}
		/** Anthropic uses 'effort' via output_config, not reasoning_config */
		delete additionalFields.reasoning_effort;
		if (isBedrockClaudeModel(typedData.model)) {
			const betaHeaders = getBedrockAnthropicBetaHeaders(typedData.model);
			if (betaHeaders.length > 0) {
				const existingBetaHeaders = typedData.additionalModelRequestFields?.anthropic_beta;
				additionalFields.anthropic_beta = mergeBedrockAnthropicBetaHeaders(existingBetaHeaders, betaHeaders);
			}
		}
	} else {
		delete additionalFields.thinking;
		delete additionalFields.thinkingBudget;
		delete additionalFields.effort;
		delete additionalFields.thinkingDisplay;
		delete additionalFields.output_config;
		delete additionalFields.anthropic_beta;
		const reasoningEffort = additionalFields.reasoning_effort;
		delete additionalFields.reasoning_effort;
		if (typeof reasoningEffort === "string" && bedrockReasoningConfigValues.has(reasoningEffort)) additionalFields.reasoning_config = reasoningEffort;
	}
	const isAnthropicModel = typeof typedData.model === "string" && isBedrockClaudeModel(typedData.model);
	/** Strip stale fields from previously-persisted additionalModelRequestFields */
	if (typeof typedData.additionalModelRequestFields === "object" && typedData.additionalModelRequestFields != null) {
		const amrf = typedData.additionalModelRequestFields;
		if (!isAnthropicModel) {
			delete amrf.anthropic_beta;
			delete amrf.thinking;
			delete amrf.thinkingBudget;
			delete amrf.effort;
			delete amrf.output_config;
			delete amrf.reasoning_config;
		} else {
			delete amrf.reasoning_config;
			delete amrf.reasoning_effort;
			/** A Claude model that does not support Bedrock thinking (e.g. a bare
			* `claude-3-5-sonnet` inference profile) must not carry stale thinking
			* fields from a previously-selected thinking model. Drop only the
			* TerraMind-generated betas (output-128k, fine-grained tool streaming);
			* user opt-ins in `anthropic_beta` are preserved. */
			if (!isThinkingModel) {
				delete amrf.thinking;
				delete amrf.thinkingBudget;
				delete amrf.effort;
				delete amrf.output_config;
				if (amrf.anthropic_beta !== void 0) {
					const kept = normalizeBetaHeaders(amrf.anthropic_beta).filter((header) => !GENERATED_BEDROCK_BETAS.has(header));
					if (kept.length > 0) amrf.anthropic_beta = kept;
					else delete amrf.anthropic_beta;
				}
			}
		}
		if (shouldOmitSamplingParameters) {
			delete amrf.temperature;
			delete amrf.topP;
			delete amrf.top_p;
			delete amrf.topK;
			delete amrf.top_k;
		}
	}
	if (shouldOmitSamplingParameters) {
		delete typedData.temperature;
		delete typedData.topP;
		delete additionalFields.temperature;
		delete additionalFields.topP;
		delete additionalFields.top_p;
		delete additionalFields.topK;
		delete additionalFields.top_k;
	}
	/** Default promptCache for claude and nova models, if not defined */
	if (typeof typedData.model === "string" && (typedData.model.includes("claude") || typedData.model.includes("nova"))) {
		if (typedData.promptCache === void 0) typedData.promptCache = true;
	} else if (typedData.promptCache === true) typedData.promptCache = void 0;
	/**
	* A cache TTL is meaningless without caching — tie it to promptCache. When
	* caching is off or unsupported for the model (cleared above), drop the TTL
	* so an unsupported `1h` is never sent on a non-caching Bedrock request.
	*/
	if (typedData.promptCache !== true) typedData.promptCacheTtl = void 0;
	if (Object.keys(additionalFields).length > 0) typedData.additionalModelRequestFields = {
		...typedData.additionalModelRequestFields || {},
		...additionalFields
	};
	if (typedData.maxOutputTokens !== void 0) typedData.maxTokens = typedData.maxOutputTokens;
	else if (typedData.maxTokens !== void 0) typedData.maxOutputTokens = typedData.maxTokens;
	return removeNullishValues(typedData);
}).catch(() => ({}));
/**
* Configures the "thinking" parameter based on given input and thinking options.
*
* @param data - The parsed Bedrock request options object
* @returns The object with thinking configured appropriately
*/
/**
* `anthropicSettings.maxOutputTokens.reset` only matches the canonical
* family-first id (`claude-sonnet-5`); Bedrock also accepts number-first
* aliases (`claude-5-sonnet`, `claude-4-7-sonnet`) that this file gates as
* thinking models. Canonicalize to family-first so those aliases resolve to the
* real ceiling instead of the 8192 fallback.
*/
function toFamilyFirstClaudeId(model) {
	return model.replace(/claude-(\d+(?:[-.]\d+)?)-(sonnet|opus|haiku)/, "claude-$2-$1");
}
function isBedrockClaudeSonnet46(model) {
	return /claude-sonnet[-.]?4[-.]?6(?=$|[^0-9])/.test(toFamilyFirstClaudeId(model));
}
/**
* Thinking tokens share the `maxTokens` output budget with tool-call arguments
* (e.g. a `create_file` `content`), so a low default truncates large authored
* files mid-argument. Mirror the direct-Anthropic path and default to the
* model's full max output when the request does not set one explicitly.
*/
function resolveThinkingMaxTokens(data) {
	const explicit = data.maxTokens ?? data.maxOutputTokens;
	if (typeof explicit === "number" && explicit > 0) return explicit;
	const model = typeof data.model === "string" ? data.model : "";
	if (isBedrockClaudeSonnet46(model)) return BEDROCK_CLAUDE_SONNET_4_6_MAX_OUTPUT;
	return anthropicSettings.maxOutputTokens.reset(toFamilyFirstClaudeId(model));
}
function configureThinking(data) {
	const updatedData = { ...data };
	const thinking = updatedData.additionalModelRequestFields?.thinking;
	if (thinking === true) {
		updatedData.maxTokens = resolveThinkingMaxTokens(updatedData);
		delete updatedData.maxOutputTokens;
		const thinkingConfig = {
			type: "enabled",
			budget_tokens: updatedData.additionalModelRequestFields?.thinkingBudget ?? DEFAULT_THINKING_BUDGET
		};
		if (thinkingConfig.budget_tokens > updatedData.maxTokens) thinkingConfig.budget_tokens = Math.floor(updatedData.maxTokens * .9);
		updatedData.additionalModelRequestFields.thinking = thinkingConfig;
		delete updatedData.additionalModelRequestFields.thinkingBudget;
	} else if (typeof thinking === "object" && thinking != null && thinking.type === "adaptive") {
		updatedData.maxTokens = resolveThinkingMaxTokens(updatedData);
		delete updatedData.maxOutputTokens;
		delete updatedData.additionalModelRequestFields.thinkingBudget;
	}
	return updatedData;
}
/** Top-level Converse request fields (issue #14029: `system` from a preset).
*  The input parser's catch-all routes unknown keys into
*  additionalModelRequestFields, and Bedrock rejects any that collide with a
*  field the request already sends (`messages`/`modelId` always,
*  `inferenceConfig` whenever maxTokens is set, `toolConfig` for agents). */
const RESERVED_CONVERSE_FIELDS = [
	"system",
	"messages",
	"modelId",
	"toolConfig",
	"inferenceConfig",
	"guardrailConfig",
	"promptVariables",
	"requestMetadata",
	"performanceConfig",
	"additionalModelRequestFields",
	"additionalModelResponseFieldPaths"
];
const bedrockOutputParser = (data) => {
	const knownKeys = [
		...Object.keys(tConversationSchema.shape),
		"topK",
		"top_k"
	];
	let result = {};
	Object.entries(data).forEach(([key, value]) => {
		if (knownKeys.includes(key)) result[key] = value;
	});
	if (typeof data.additionalModelRequestFields === "object" && data.additionalModelRequestFields !== null) Object.entries(data.additionalModelRequestFields).forEach(([key, value]) => {
		if (knownKeys.includes(key)) if (key === "top_k") result["topK"] = value;
		else if (key === "thinking" || key === "thinkingBudget") return;
		else result[key] = value;
	});
	if (result.maxTokens !== void 0 && result.maxOutputTokens === void 0) result.maxOutputTokens = result.maxTokens;
	else if (result.maxOutputTokens !== void 0 && result.maxTokens === void 0) result.maxTokens = result.maxOutputTokens;
	result = configureThinking(result);
	let amrf = result.additionalModelRequestFields;
	if (amrf && typeof amrf === "object") {
		const reserved = RESERVED_CONVERSE_FIELDS.filter((key) => key in (amrf ?? {}));
		if (reserved.length > 0) {
			amrf = { ...amrf };
			for (const key of reserved) delete amrf[key];
			result.additionalModelRequestFields = amrf;
		}
	}
	if (!amrf || Object.keys(amrf).length === 0) delete result.additionalModelRequestFields;
	return result;
};
//#endregion
//#region src/types/runs.ts
let ContentTypes = /* @__PURE__ */ function(ContentTypes) {
	ContentTypes["TEXT"] = "text";
	ContentTypes["THINK"] = "think";
	ContentTypes["TEXT_DELTA"] = "text_delta";
	ContentTypes["TOOL_CALL"] = "tool_call";
	ContentTypes["IMAGE_FILE"] = "image_file";
	ContentTypes["IMAGE_URL"] = "image_url";
	ContentTypes["VIDEO_URL"] = "video_url";
	ContentTypes["INPUT_AUDIO"] = "input_audio";
	ContentTypes["AGENT_UPDATE"] = "agent_update";
	ContentTypes["SUMMARY"] = "summary";
	ContentTypes["ACTIVITY_LABEL"] = "activity_label";
	ContentTypes["STEER"] = "steer";
	ContentTypes["ERROR"] = "error";
	return ContentTypes;
}({});
let StepTypes = /* @__PURE__ */ function(StepTypes) {
	StepTypes["TOOL_CALLS"] = "tool_calls";
	StepTypes["MESSAGE_CREATION"] = "message_creation";
	return StepTypes;
}({});
let ToolCallTypes = /* @__PURE__ */ function(ToolCallTypes) {
	ToolCallTypes["FUNCTION"] = "function";
	ToolCallTypes["RETRIEVAL"] = "retrieval";
	ToolCallTypes["FILE_SEARCH"] = "file_search";
	ToolCallTypes["CODE_INTERPRETER"] = "code_interpreter";
	ToolCallTypes["TOOL_CALL"] = "tool_call";
	return ToolCallTypes;
}({});
/** Event names dispatched by the agent graph and consumed by step handlers. */
let StepEvents = /* @__PURE__ */ function(StepEvents) {
	StepEvents["ON_RUN_STEP"] = "on_run_step";
	StepEvents["ON_AGENT_UPDATE"] = "on_agent_update";
	StepEvents["ON_MESSAGE_DELTA"] = "on_message_delta";
	StepEvents["ON_REASONING_DELTA"] = "on_reasoning_delta";
	StepEvents["ON_RUN_STEP_DELTA"] = "on_run_step_delta";
	StepEvents["ON_RUN_STEP_COMPLETED"] = "on_run_step_completed";
	/** Terminal signal for a run step: closed with a status and timestamps. */
	StepEvents["ON_RUN_STEP_CLOSED"] = "on_run_step_closed";
	StepEvents["ON_SUMMARIZE_START"] = "on_summarize_start";
	StepEvents["ON_SUMMARIZE_DELTA"] = "on_summarize_delta";
	StepEvents["ON_SUMMARIZE_COMPLETE"] = "on_summarize_complete";
	StepEvents["ON_SUBAGENT_UPDATE"] = "on_subagent_update";
	StepEvents["ON_SANDBOX_STARTING"] = "on_sandbox_starting";
	StepEvents["ON_PTC_TOOL_CALL"] = "on_ptc_tool_call";
	return StepEvents;
}({});
/** Token-tracking event names streamed to the client (separate from StepEvents dispatch). */
let UsageEvents = /* @__PURE__ */ function(UsageEvents) {
	UsageEvents["ON_CONTEXT_USAGE"] = "on_context_usage";
	UsageEvents["ON_TOKEN_USAGE"] = "on_token_usage";
	return UsageEvents;
}({});
/**
* Human-in-the-loop event names. Streamed to live clients when a run pauses for
* tool approval (or an ask-user question). Reconnecting clients instead read the
* same record from `resumeState.pendingAction` on the sync event / status route.
*/
let ApprovalEvents = /* @__PURE__ */ function(ApprovalEvents) {
	ApprovalEvents["ON_PENDING_ACTION"] = "on_pending_action";
	return ApprovalEvents;
}({});
/**
* Steering event names. `on_steer_applied` streams to live clients when a
* queued steer message is injected at a tool-batch boundary; reconnecting
* clients recover injected steers from `aggregatedContent` and still-queued
* ones from `resumeState.pendingSteers`. Steers that never reach a boundary
* ride the final/abort events as `pendingSteers`.
*/
let SteerEvents = /* @__PURE__ */ function(SteerEvents) {
	SteerEvents["ON_STEER_APPLIED"] = "on_steer_applied";
	/** Durable capability correction for queued steers after HITL handover. */
	SteerEvents["ON_STEER_UPDATED"] = "on_steer_updated";
	return SteerEvents;
}({});
/**
* Activity-label event names. `on_activity_label` streams to live clients
* when a tool-batch or parent-phase label part is claimed and again when the
* fast-model label resolves; reconnecting clients recover applied labels
* from `aggregatedContent` like any other content part.
*/
let ActivityLabelEvents = /* @__PURE__ */ function(ActivityLabelEvents) {
	ActivityLabelEvents["ON_ACTIVITY_LABEL"] = "on_activity_label";
	return ActivityLabelEvents;
}({});
/** Live title updates for an existing reasoning content part. */
let ReasoningLabelEvents = /* @__PURE__ */ function(ReasoningLabelEvents) {
	ReasoningLabelEvents["ON_REASONING_LABEL"] = "on_reasoning_label";
	/** Internal durable budget reservation; clients intentionally do not render it. */
	ReasoningLabelEvents["ON_REASONING_LABEL_ATTEMPT"] = "on_reasoning_label_attempt";
	return ReasoningLabelEvents;
}({});
const finiteNonNegativeInteger = (value) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return;
	return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));
};
/**
* Full prompt token count for one completed model call — the EXACT context the
* model saw, provider-aware: additive providers (Bedrock) report `input_tokens`
* excluding cache, so cache reads/writes are added back; subset providers
* (Anthropic, OpenAI, …) already fold cache into `input_tokens`. When the
* provider is absent (custom/OpenAI-compatible payloads), fall back to the same
* magnitude heuristic `normalizeUsageUnits` uses — cache ≤ input means it's
* already included — so cached events aren't re-inflated. The ground truth the
* gauge reconciles its calibrated estimate to.
*/
const promptTokensFromUsage = (event) => {
	const input = finiteNonNegativeInteger(event.input_tokens) ?? 0;
	const details = event.input_token_details ?? {};
	const cacheRead = finiteNonNegativeInteger(details.cache_read) ?? 0;
	const cacheCreation = finiteNonNegativeInteger(details.cache_creation) ?? 0;
	return (event.provider != null ? inputTokensIncludesCache(event.provider) : cacheRead + cacheCreation <= input) ? input : Math.min(Number.MAX_SAFE_INTEGER, input + cacheRead + cacheCreation);
};
/**
* Scales per-tool result-message counts while bounding both malformed input and
* rounding error. Null-prototype records keep tool names as ordinary data keys;
* cumulative apportionment preserves the scaled sum in one linear pass.
*/
const scaleToolMessageTokenCounts = (value, oldTotal, newTotal) => {
	if (value == null || typeof value !== "object" || Array.isArray(value)) return;
	const scaled = Object.create(null);
	let remaining = oldTotal;
	let cumulative = 0;
	let allocated = 0;
	let found = false;
	for (const [name, rawCount] of Object.entries(value)) {
		const count = finiteNonNegativeInteger(rawCount);
		if (count == null || count === 0) continue;
		const bounded = Math.min(count, remaining);
		remaining -= bounded;
		cumulative += bounded;
		const target = oldTotal > 0 ? Math.round(cumulative / oldTotal * newTotal) : 0;
		const apportioned = target - allocated;
		allocated = target;
		if (apportioned > 0) {
			scaled[name] = apportioned;
			found = true;
		}
	}
	return found ? scaled : void 0;
};
/**
* Reconciles a pre-invoke context snapshot's CALIBRATED estimate to a call's
* ACTUAL prompt tokens. The SDK's calibration multiplier scales only
* `messageTokens` (instructions/summary are raw tiktoken counts) and can
* over-shoot badly when a provider injects server-side content the SDK never
* counted (e.g. Anthropic web search) — pinning the gauge several× too high and
* persisting it. Trust the provider's own prompt count: keep the raw
* instruction/summary rows, set `messageTokens` to the remainder, recompute the
* free space, and rescale the `toolMessageTokens` share to the new message
* total. No-op when `promptTokens` is unusable.
*/
const reconcileContextUsage = (snapshot, promptTokens) => {
	if (!Number.isFinite(promptTokens) || promptTokens <= 0) return snapshot;
	const normalizedPromptTokens = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(promptTokens));
	if (normalizedPromptTokens <= 0) return snapshot;
	const { breakdown } = snapshot;
	const instructionTokens = finiteNonNegativeInteger(breakdown.instructionTokens) ?? 0;
	const summaryTokens = finiteNonNegativeInteger(breakdown.summaryTokens) ?? 0;
	const budget = finiteNonNegativeInteger(snapshot.contextBudget) ?? finiteNonNegativeInteger(breakdown.maxContextTokens);
	const nonMessageTokens = instructionTokens + summaryTokens;
	const messageTokens = Math.max(0, normalizedPromptTokens - nonMessageTokens);
	/** `toolMessageTokens` is a subset of the OLD (calibrated) `messageTokens`;
	* rescale it by the same proportion so the split tracks the provider's real
	* total. A supplied zero remains a known-zero split; absent fields stay absent
	* for older snapshots. */
	const priorMessageTokens = finiteNonNegativeInteger(breakdown.messageTokens) ?? 0;
	const priorToolMessageTokens = finiteNonNegativeInteger(breakdown.toolMessageTokens);
	let toolMessageTokens;
	if (priorToolMessageTokens != null) {
		toolMessageTokens = 0;
		if (priorMessageTokens > 0 && priorToolMessageTokens > 0) toolMessageTokens = Math.min(messageTokens, Math.round(Math.min(priorToolMessageTokens, priorMessageTokens) / priorMessageTokens * messageTokens));
	}
	const toolMessageTokenCounts = toolMessageTokens != null ? scaleToolMessageTokenCounts(breakdown.toolMessageTokenCounts, Math.min(priorToolMessageTokens ?? 0, priorMessageTokens), toolMessageTokens) : void 0;
	const nextBreakdown = {
		...breakdown,
		instructionTokens,
		summaryTokens,
		messageTokens
	};
	if (toolMessageTokens == null) {
		delete nextBreakdown.toolMessageTokens;
		delete nextBreakdown.toolMessageTokenCounts;
	} else {
		nextBreakdown.toolMessageTokens = toolMessageTokens;
		if (toolMessageTokenCounts == null) delete nextBreakdown.toolMessageTokenCounts;
		else nextBreakdown.toolMessageTokenCounts = toolMessageTokenCounts;
	}
	const result = {
		...snapshot,
		breakdown: nextBreakdown
	};
	if (budget != null) result.remainingContextTokens = Math.max(0, budget - normalizedPromptTokens);
	else {
		const remaining = finiteNonNegativeInteger(snapshot.remainingContextTokens);
		if (remaining == null) delete result.remainingContextTokens;
		else result.remainingContextTokens = remaining;
	}
	return result;
};
/** Provider output, including reasoning omitted from an under-reported output count. */
const outputTokensFromUsage = (event) => {
	const output = finiteNonNegativeInteger(event.output_tokens) ?? 0;
	const total = finiteNonNegativeInteger(event.total_tokens) ?? 0;
	return Math.max(output, total - promptTokensFromUsage(event));
};
/** Reconcile and retain the primary call details on live, saved, and resumable snapshots. */
const reconcileContextUsageFromEvent = (snapshot, event) => ({
	...reconcileContextUsage(snapshot, promptTokensFromUsage(event)),
	model: event.model,
	provider: event.provider,
	completedOutputTokens: outputTokensFromUsage(event),
	cacheRead: finiteNonNegativeInteger(event.input_token_details?.cache_read) ?? 0,
	cacheWrite: finiteNonNegativeInteger(event.input_token_details?.cache_creation) ?? 0
});
//#endregion
//#region src/parsers.ts
dayjs.extend(utc);
dayjs.extend(timezonePlugin);
const endpointSchemas = {
	["openAI"]: openAISchema,
	["azureOpenAI"]: openAISchema,
	["custom"]: openAISchema,
	["openrouter"]: openRouterSchema,
	["google"]: googleSchema,
	["anthropic"]: anthropicSchema,
	["assistants"]: assistantSchema,
	["azureAssistants"]: assistantSchema,
	["agents"]: compactAgentsSchema,
	["bedrock"]: bedrockInputSchema
};
const isEndpointSchemaLookupKey = (value) => value != null && Object.prototype.hasOwnProperty.call(endpointSchemas, value);
const getFallbackEndpointSchema = (schemas, endpointType, defaultParamsEndpoint) => {
	if (!endpointType) return;
	return (isEndpointSchemaLookupKey(defaultParamsEndpoint) ? schemas[defaultParamsEndpoint] : void 0) ?? schemas[endpointType];
};
/** Get the enabled endpoints from the `ENDPOINTS` environment variable */
function getEnabledEndpoints() {
	const defaultEndpoints = [
		"openAI",
		"agents",
		"assistants",
		"azureAssistants",
		"azureOpenAI",
		"google",
		"anthropic",
		"bedrock"
	];
	const endpointsEnv = process.env.ENDPOINTS ?? "";
	let enabledEndpoints = defaultEndpoints;
	if (endpointsEnv) enabledEndpoints = endpointsEnv.split(",").filter((endpoint) => endpoint.trim()).map((endpoint) => endpoint.trim());
	return enabledEndpoints;
}
/** Orders an existing EndpointsConfig object based on enabled endpoint/custom ordering */
function orderEndpointsConfig(endpointsConfig) {
	if (!endpointsConfig) return {};
	const enabledEndpoints = getEnabledEndpoints();
	const endpointKeys = Object.keys(endpointsConfig);
	const defaultCustomIndex = enabledEndpoints.indexOf("custom");
	return endpointKeys.reduce((accumulatedConfig, currentEndpointKey) => {
		const isCustom = !(currentEndpointKey in EModelEndpoint);
		if (!enabledEndpoints.includes(currentEndpointKey) && !isCustom) return accumulatedConfig;
		const index = enabledEndpoints.indexOf(currentEndpointKey);
		if (isCustom) accumulatedConfig[currentEndpointKey] = {
			order: defaultCustomIndex >= 0 ? defaultCustomIndex : 9999,
			...endpointsConfig[currentEndpointKey]
		};
		else if (endpointsConfig[currentEndpointKey]) accumulatedConfig[currentEndpointKey] = {
			...endpointsConfig[currentEndpointKey],
			order: index
		};
		return accumulatedConfig;
	}, {});
}
/** Converts an array of Zod issues into a string. */
function errorsToString(errors) {
	return errors.map((error) => {
		return `${error.path.join(".")}: ${error.message}`;
	}).join(" ");
}
function getFirstDefinedValue(possibleValues) {
	let returnValue;
	for (const value of possibleValues) if (value) {
		returnValue = value;
		break;
	}
	return returnValue;
}
function getNonEmptyValue(possibleValues) {
	for (const value of possibleValues) if (value && value.trim() !== "") return value;
}
const parseConvo = ({ endpoint, endpointType, conversation, possibleValues, defaultParamsEndpoint }) => {
	const primarySchema = endpointSchemas[endpoint];
	if (!primarySchema && !endpointType) throw new Error(`Unknown endpoint: ${endpoint}`);
	const convo = (primarySchema ?? getFallbackEndpointSchema(endpointSchemas, endpointType, defaultParamsEndpoint))?.parse(conversation);
	const { models } = possibleValues ?? {};
	if (models && convo) convo.model = getFirstDefinedValue(models) ?? convo.model;
	return convo;
};
/** Match GPT followed by digit, optional decimal, and optional suffix
*
* Examples: gpt-4, gpt-4o, gpt-4.5, gpt-5a, etc. */
const extractGPTVersion = (modelStr) => {
	const gptMatch = modelStr.match(/gpt-(\d+(?:\.\d+)?)([a-z])?/i);
	if (gptMatch) return `GPT-${gptMatch[1]}${gptMatch[2] || ""}`;
	return "";
};
/** Match omni models (o1, o3, etc.), "o" followed by a digit, possibly with decimal */
const extractOmniVersion = (modelStr) => {
	const omniMatch = modelStr.match(/\bo(\d+(?:\.\d+)?)\b/i);
	if (omniMatch) return `o${omniMatch[1]}`;
	return "";
};
const getResponseSender = (endpointOption) => {
	const { model: _m, endpoint: _e, endpointType, modelDisplayLabel: _mdl, chatGptLabel: _cgl, modelLabel: _ml } = endpointOption;
	const endpoint = _e;
	const model = _m ?? "";
	const modelDisplayLabel = _mdl ?? "";
	const chatGptLabel = _cgl ?? "";
	const modelLabel = _ml ?? "";
	if ([
		"openAI",
		"bedrock",
		"azureOpenAI"
	].includes(endpoint)) {
		if (modelLabel) return modelLabel;
		else if (chatGptLabel) return chatGptLabel;
		else if (model && extractOmniVersion(model)) return extractOmniVersion(model);
		else if (model && (model.includes("mistral") || model.includes("codestral"))) return "Mistral";
		else if (model && model.includes("deepseek")) return "Deepseek";
		else if (model && model.includes("kimi")) return "Kimi";
		else if (model && model.includes("moonshot")) return "Moonshot";
		else if (model && model.includes("gpt-")) return extractGPTVersion(model) || "GPT";
		return alternateName[endpoint] ?? "AI";
	}
	if (endpoint === "anthropic") return modelLabel || "Claude";
	if (endpoint === "bedrock") return modelLabel || alternateName[endpoint];
	if (endpoint === "google") {
		if (modelLabel) return modelLabel;
		else if (model?.toLowerCase().includes("gemma") === true) return "Gemma";
		return "Gemini";
	}
	if (endpoint === "custom" || endpointType === "custom") {
		if (modelLabel) return modelLabel;
		else if (chatGptLabel) return chatGptLabel;
		else if (model && extractOmniVersion(model)) return extractOmniVersion(model);
		else if (model && (model.includes("mistral") || model.includes("codestral"))) return "Mistral";
		else if (model && model.includes("deepseek")) return "Deepseek";
		else if (model && model.includes("kimi")) return "Kimi";
		else if (model && model.includes("moonshot")) return "Moonshot";
		else if (model && model.includes("gpt-")) return extractGPTVersion(model) || "GPT";
		else if (modelDisplayLabel) return modelDisplayLabel;
		return "AI";
	}
	return "";
};
const compactEndpointSchemas = {
	["openAI"]: openAISchema,
	["azureOpenAI"]: openAISchema,
	["custom"]: openAISchema,
	["openrouter"]: openRouterSchema,
	["assistants"]: compactAssistantSchema,
	["azureAssistants"]: compactAssistantSchema,
	["agents"]: compactAgentsSchema,
	["google"]: compactGoogleSchema,
	["bedrock"]: bedrockInputSchema,
	["anthropic"]: anthropicSchema
};
const parseCompactConvo = ({ endpoint, endpointType, conversation, possibleValues, defaultParamsEndpoint }) => {
	if (!endpoint) throw new Error(`undefined endpoint: ${endpoint}`);
	const primarySchema = compactEndpointSchemas[endpoint];
	if (!primarySchema && !endpointType) throw new Error(`Unknown endpoint: ${endpoint}`);
	const schema = primarySchema ?? getFallbackEndpointSchema(compactEndpointSchemas, endpointType, defaultParamsEndpoint);
	if (!schema) throw new Error(`Unknown endpointType: ${endpointType}`);
	const { iconURL: _clientIconURL, ...conversationWithoutIconURL } = conversation;
	const convo = schema.parse(conversationWithoutIconURL);
	const { models } = possibleValues ?? {};
	if (models && convo) convo.model = getFirstDefinedValue(models) ?? convo.model;
	return convo;
};
function parseTextParts(contentParts, skipReasoning = false, options) {
	let result = "";
	const append = (textValue) => {
		if (result.length > 0 && textValue.length > 0 && result[result.length - 1] !== " " && textValue[0] !== " ") result += " ";
		result += textValue;
	};
	for (const part of contentParts) {
		if (!part?.type) continue;
		if (part.type === "text") append((typeof part.text === "string" ? part.text : part.text?.value) || "");
		else if (part.type === "steer" && options?.includeSteer === true)
 /** Mid-run user speech: excluded by default so generic extraction (TTS
		*  reading assistant output) never speaks the user's own words — the
		*  full-record surfaces (search indexing, persisted abort text) opt in. */
		append(typeof part.steer === "string" ? part.steer : "");
		else if (part.type === "think" && !skipReasoning) append(typeof part.think === "string" ? part.think : "");
	}
	return result;
}
const SEPARATORS = [
	".",
	"?",
	"!",
	"۔",
	"。",
	"‥",
	";",
	"¡",
	"¿",
	"\n",
	"```"
];
function findLastSeparatorIndex(text, separators = SEPARATORS) {
	let lastIndex = -1;
	for (const separator of separators) {
		const index = text.lastIndexOf(separator);
		if (index > lastIndex) lastIndex = index;
	}
	return lastIndex;
}
/**
* Anchors a dayjs instant to the user's IANA timezone when one is supplied,
* so local-time special vars reflect the user's wall clock rather than the
* server's. Falls back to the original instant for missing or invalid zones.
*/
function applyTimezone(value, timezone) {
	if (!timezone) return value;
	try {
		const zoned = value.tz(timezone);
		return zoned.isValid() ? zoned : value;
	} catch {
		return value;
	}
}
function replaceSpecialVars({ text, user, now: inputNow, timezone }) {
	let result = text;
	if (!result) return result;
	const now = applyTimezone(inputNow != null ? dayjs(inputNow) : dayjs(), timezone);
	const weekdayName = now.format("dddd");
	const currentDate = now.format("YYYY-MM-DD");
	result = result.replace(/{{\s*current_date\s*}}/gi, `${currentDate} (${weekdayName})`);
	const currentDatetime = now.format("YYYY-MM-DD HH:mm:ss Z");
	result = result.replace(/{{\s*current_datetime\s*}}/gi, `${currentDatetime} (${weekdayName})`);
	const isoDatetime = now.toISOString();
	result = result.replace(/{{\s*iso_datetime\s*}}/gi, isoDatetime);
	if (user && user.name) result = result.replace(/{{\s*current_user\s*}}/gi, user.name);
	return result;
}
/**
* Resolves the display label ("sender") for an ephemeral agent:
* `modelLabel` (user/preset) → model spec's `label` → endpoint config's
* `modelDisplayLabel` → `''` (lets consumers fall back to the model name).
*/
function getEphemeralSender({ modelLabel, specLabel, modelDisplayLabel }) {
	return modelLabel ?? specLabel ?? modelDisplayLabel ?? "";
}
/** Built-in endpoints; anything else in `endpoint` is a custom endpoint's own name. */
const builtInEndpoints = new Set(Object.values(EModelEndpoint));
/**
* Whether a persisted `sender` is a label someone configured rather than the
* model-derived name `getResponseSender` produces.
*
* The sender is the one thing that records which it was: `resolveSender` writes an
* agent's name, then the `getEphemeralSender` chain (`modelLabel` → a model spec's
* `label` → an endpoint's `modelDisplayLabel`), and falls back to `getResponseSender`
* only when none of those is set. Asking the message rather than the conversation
* settles three things a settings lookup cannot: labels that live in config a caller
* may not hold, labels an endpoint ignores (Anthropic keeps reading `Claude` whatever
* `chatGptLabel` says, and matches here), and labels changed since the message was
* written — its header still shows the sender it was written under.
*
* Equality is the test, so the only way to be wrong is a stored name that no longer
* matches what the current heuristics produce, which withholds a model rather than
* revealing one.
*/
const isConfiguredSender = ({ sender, endpoint, endpointType, model, isCreatedByUser }) => {
	/** A user turn is headed by the person who wrote it, so it has no model to withhold
	*  and its `User` sender would never match a derived name. */
	if (isCreatedByUser === true) return false;
	/** Agents and assistants are named by whoever authored them: the header shows that
	*  name whether or not the response stored a sender, and `getResponseSender` has no
	*  branch to derive one. */
	if (isAgentsEndpoint(endpoint) || isAssistantsEndpoint(endpoint)) return true;
	if (sender == null || sender === "") return false;
	const derived = getResponseSender({
		endpoint,
		endpointType: endpointType ?? (endpoint != null && !builtInEndpoints.has(endpoint) ? "custom" : void 0),
		model
	});
	/** An endpoint this cannot name — an older message stored without one, say — says
	*  nothing either way, and reading that silence as "configured" would withhold the
	*  model from every unlabelled row it reached. */
	if (derived === "") return false;
	return sender !== derived;
};
/**
* Encodes an ephemeral agent ID from endpoint, model, optional sender, and optional index.
* Uses __ to replace : (reserved in graph node names) and ___ to separate sender.
*
* Format: endpoint__model___sender or endpoint__model___sender____index (if index provided)
*
* @example
* encodeEphemeralAgentId({ endpoint: 'openAI', model: 'gpt-4o', sender: 'GPT-4o' })
* // => 'openAI__gpt-4o___GPT-4o'
*
* @example
* encodeEphemeralAgentId({ endpoint: 'openAI', model: 'gpt-4o', sender: 'GPT-4o', index: 1 })
* // => 'openAI__gpt-4o___GPT-4o____1'
*/
function encodeEphemeralAgentId({ endpoint, model, sender, index }) {
	const base = `${endpoint}:${model}`.replace(/:/g, "__");
	let result = base;
	if (sender) result = `${base}___${sender.replace(/:/g, "__")}`;
	if (index != null) result = `${result}____${index}`;
	return result;
}
/**
* Parses an ephemeral agent ID back into its components.
* Returns undefined if the ID doesn't match the expected format.
*
* Format: endpoint__model___sender or endpoint__model___sender____index
* - ____ (4 underscores) separates optional index suffix
* - ___ (triple underscore) separates model from optional sender
* - __ (double underscore) replaces : in endpoint/model names
*
* @example
* parseEphemeralAgentId('openAI__gpt-4o___GPT-4o')
* // => { endpoint: 'openAI', model: 'gpt-4o', sender: 'GPT-4o' }
*
* @example
* parseEphemeralAgentId('openAI__gpt-4o___GPT-4o____1')
* // => { endpoint: 'openAI', model: 'gpt-4o', sender: 'GPT-4o', index: 1 }
*/
function parseEphemeralAgentId(agentId) {
	if (!agentId.includes("__")) return;
	let index;
	let workingId = agentId;
	if (agentId.includes("____")) {
		const lastIndexSep = agentId.lastIndexOf("____");
		const indexStr = agentId.slice(lastIndexSep + 4);
		const parsedIndex = parseInt(indexStr, 10);
		if (!isNaN(parsedIndex)) {
			index = parsedIndex;
			workingId = agentId.slice(0, lastIndexSep);
		}
	}
	let sender;
	let mainPart = workingId;
	if (workingId.includes("___")) {
		const [before, after] = workingId.split("___");
		mainPart = before;
		sender = after?.replace(/__/g, ":");
	}
	const [endpoint, ...modelParts] = mainPart.split("__");
	if (!endpoint || modelParts.length === 0) return;
	return {
		endpoint,
		model: modelParts.join(":"),
		sender,
		index
	};
}
/**
* Checks if an agent ID represents an ephemeral (non-saved) agent.
* Real agent IDs always start with "agent_", so anything else is ephemeral.
*/
function isEphemeralAgentId(agentId) {
	return !agentId?.startsWith("agent_");
}
/**
* Strips the index suffix (____N) from an agent ID if present.
* Works with both ephemeral and real agent IDs.
*
* @example
* stripAgentIdSuffix('agent_abc123____1') // => 'agent_abc123'
* stripAgentIdSuffix('openAI__gpt-4o___GPT-4o____1') // => 'openAI__gpt-4o___GPT-4o'
* stripAgentIdSuffix('agent_abc123') // => 'agent_abc123' (unchanged)
*/
function stripAgentIdSuffix(agentId) {
	return agentId.replace(/____\d+$/, "");
}
/**
* Appends an index suffix (____N) to an agent ID.
* Used to distinguish parallel agents with the same base ID.
*
* @example
* appendAgentIdSuffix('agent_abc123', 1) // => 'agent_abc123____1'
* appendAgentIdSuffix('openAI__gpt-4o___GPT-4o', 1) // => 'openAI__gpt-4o___GPT-4o____1'
*/
function appendAgentIdSuffix(agentId, index) {
	return `${agentId}____${index}`;
}
//#endregion
//#region src/azure.ts
function validateAzureGroups(configs) {
	let isValid = true;
	const modelNames = [];
	const modelGroupMap = {};
	const groupMap = {};
	const errors = [];
	const result = azureGroupConfigsSchema.safeParse(configs);
	if (!result.success) {
		isValid = false;
		errors.push(errorsToString(result.error.errors));
	} else for (const group of result.data) {
		const { group: groupName, apiKey, instanceName = "", deploymentName = "", version = "", baseURL = "", additionalHeaders, models, serverless = false, ...rest } = group;
		if (groupMap[groupName]) {
			errors.push(`Duplicate group name detected: "${groupName}". Group names must be unique.`);
			return {
				isValid: false,
				modelNames,
				modelGroupMap,
				groupMap,
				errors
			};
		}
		if (serverless && !baseURL) {
			errors.push(`Group "${groupName}" is serverless but missing mandatory "baseURL."`);
			return {
				isValid: false,
				modelNames,
				modelGroupMap,
				groupMap,
				errors
			};
		}
		if (!instanceName && !serverless) {
			errors.push(`Group "${groupName}" is missing an "instanceName" for non-serverless configuration.`);
			return {
				isValid: false,
				modelNames,
				modelGroupMap,
				groupMap,
				errors
			};
		}
		groupMap[groupName] = {
			apiKey,
			instanceName,
			deploymentName,
			version,
			baseURL,
			additionalHeaders,
			models,
			serverless,
			...rest
		};
		for (const modelName in group.models) {
			modelNames.push(modelName);
			const model = group.models[modelName];
			if (modelGroupMap[modelName]) {
				errors.push(`Duplicate model name detected: "${modelName}". Model names must be unique across groups.`);
				return {
					isValid: false,
					modelNames,
					modelGroupMap,
					groupMap,
					errors
				};
			}
			if (serverless) {
				modelGroupMap[modelName] = { group: groupName };
				continue;
			}
			const groupDeploymentName = group.deploymentName ?? "";
			const groupVersion = group.version ?? "";
			if (typeof model === "boolean") {
				if (!groupDeploymentName || !groupVersion) {
					errors.push(`Model "${modelName}" in group "${groupName}" is missing a deploymentName or version.`);
					return {
						isValid: false,
						modelNames,
						modelGroupMap,
						groupMap,
						errors
					};
				}
				modelGroupMap[modelName] = { group: groupName };
			} else {
				const modelDeploymentName = model.deploymentName ?? "";
				const modelVersion = model.version ?? "";
				if (!modelDeploymentName && !groupDeploymentName || !modelVersion && !groupVersion) {
					errors.push(`Model "${modelName}" in group "${groupName}" is missing a required deploymentName or version.`);
					return {
						isValid: false,
						modelNames,
						modelGroupMap,
						groupMap,
						errors
					};
				}
				modelGroupMap[modelName] = { group: groupName };
			}
		}
	}
	return {
		isValid,
		modelNames,
		modelGroupMap,
		groupMap,
		errors
	};
}
function mapModelToAzureConfig({ modelName, modelGroupMap, groupMap }) {
	const modelConfig = modelGroupMap[modelName];
	if (!modelConfig) throw new Error(`Model named "${modelName}" not found in configuration.`);
	const groupConfig = groupMap[modelConfig.group];
	if (!groupConfig) throw new Error(`Group "${modelConfig.group}" for model "${modelName}" not found in configuration.`);
	const instanceName = groupConfig.instanceName ?? "";
	if (!instanceName && groupConfig.serverless !== true) throw new Error(`Group "${modelConfig.group}" is missing an instanceName for non-serverless configuration.`);
	const baseURL = groupConfig.baseURL ?? "";
	if (groupConfig.serverless === true && !baseURL) throw new Error(`Group "${modelConfig.group}" is missing the required base URL for serverless configuration.`);
	if (groupConfig.serverless === true) {
		const result = {
			azureOptions: {
				azureOpenAIApiVersion: extractEnvVariable(groupConfig.version ?? ""),
				azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey)
			},
			baseURL: extractEnvVariable(baseURL),
			serverless: true
		};
		const apiKeyValue = result.azureOptions.azureOpenAIApiKey;
		if (typeof apiKeyValue === "string" && envVarRegex.test(apiKeyValue)) throw new Error(`Azure configuration environment variable "${apiKeyValue}" was not found.`);
		if (groupConfig.additionalHeaders) result.headers = groupConfig.additionalHeaders;
		return result;
	}
	if (!instanceName) throw new Error(`Group "${modelConfig.group}" is missing an instanceName for non-serverless configuration.`);
	const modelDetails = groupConfig.models[modelName];
	const { deploymentName = "", version = "" } = typeof modelDetails === "object" ? {
		deploymentName: modelDetails.deploymentName ?? groupConfig.deploymentName,
		version: modelDetails.version ?? groupConfig.version
	} : {
		deploymentName: groupConfig.deploymentName,
		version: groupConfig.version
	};
	if (!deploymentName || !version) throw new Error(`Model "${modelName}" in group "${modelConfig.group}" is missing a deploymentName ("${deploymentName}") or version ("${version}").`);
	const azureOptions = {
		azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
		azureOpenAIApiInstanceName: extractEnvVariable(instanceName),
		azureOpenAIApiDeploymentName: extractEnvVariable(deploymentName),
		azureOpenAIApiVersion: extractEnvVariable(version)
	};
	for (const value of Object.values(azureOptions)) if (typeof value === "string" && envVarRegex.test(value)) throw new Error(`Azure configuration environment variable "${value}" was not found.`);
	const result = { azureOptions };
	if (baseURL) result.baseURL = extractEnvVariable(baseURL);
	if (groupConfig.additionalHeaders) result.headers = groupConfig.additionalHeaders;
	return result;
}
function mapGroupToAzureConfig({ groupName, groupMap }) {
	const groupConfig = groupMap[groupName];
	if (!groupConfig) throw new Error(`Group named "${groupName}" not found in configuration.`);
	const instanceName = groupConfig.instanceName ?? "";
	const serverless = groupConfig.serverless ?? false;
	const baseURL = groupConfig.baseURL ?? "";
	if (!instanceName && !serverless) throw new Error(`Group "${groupName}" is missing an instanceName for non-serverless configuration.`);
	if (serverless && !baseURL) throw new Error(`Group "${groupName}" is missing the required base URL for serverless configuration.`);
	const models = Object.keys(groupConfig.models);
	if (models.length === 0) throw new Error(`Group "${groupName}" does not have any models configured.`);
	const firstModelName = models[0];
	const modelDetails = groupConfig.models[firstModelName];
	const azureOptions = {
		azureOpenAIApiVersion: extractEnvVariable(groupConfig.version ?? ""),
		azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
		azureOpenAIApiInstanceName: extractEnvVariable(instanceName)
	};
	if (serverless) return {
		azureOptions,
		baseURL: extractEnvVariable(baseURL),
		serverless: true,
		...groupConfig.additionalHeaders && { headers: groupConfig.additionalHeaders }
	};
	const { deploymentName = "", version = "" } = typeof modelDetails === "object" ? {
		deploymentName: modelDetails.deploymentName ?? groupConfig.deploymentName,
		version: modelDetails.version ?? groupConfig.version
	} : {
		deploymentName: groupConfig.deploymentName,
		version: groupConfig.version
	};
	if (!deploymentName || !version) throw new Error(`Model "${firstModelName}" in group "${groupName}" or the group itself is missing a deploymentName ("${deploymentName}") or version ("${version}").`);
	azureOptions.azureOpenAIApiDeploymentName = extractEnvVariable(deploymentName);
	azureOptions.azureOpenAIApiVersion = extractEnvVariable(version);
	const result = { azureOptions };
	if (baseURL) result.baseURL = extractEnvVariable(baseURL);
	if (groupConfig.additionalHeaders) result.headers = groupConfig.additionalHeaders;
	return result;
}
//#endregion
//#region src/footer.ts
/**
* Whether a deployment configured footer content of its own — a custom footer,
* a privacy policy or terms of service.
*
* The footer bar is absolutely positioned in a zero-height wrapper, so the
* composer above it is what reserves its band: this answer decides both the
* bar and the clearance. The client and the server share it because the two
* answering differently is exactly the layout correction it exists to remove.
*/
function hasConfiguredFooter(source) {
	return typeof source?.customFooter === "string" || source?.interface?.privacyPolicy?.externalUrl != null || source?.interface?.termsOfService?.externalUrl != null;
}
//#endregion
//#region src/langchain.ts
/**
* LangChain classifies a provider failure by mutating the error: it stamps `lc_error_code` and
* appends `\n\nTroubleshooting URL: <docs url>\n` to the message. Both halves are handled here
* because the server strips the URL before persisting the message, while the client still reads the
* code back out of messages persisted before it did.
*/
const LANGCHAIN = "langchain";
const ERROR_PATH = "/errors/";
const TROUBLESHOOTING_LABEL = "Troubleshooting URL:";
const WHITESPACE = /\s/;
/** Provider errors cross untyped boundaries, so a `message` is not guaranteed to be a string. */
function toMessageText(message) {
	if (typeof message === "string") return message;
	return message == null ? "" : String(message);
}
function isErrorCodeCharacter(character) {
	const code = character.charCodeAt(0);
	return character === "_" || code >= 65 && code <= 90 || code >= 97 && code <= 122;
}
function findTokenEnd(text, start, limit = text.length) {
	let end = start;
	while (end < limit && !WHITESPACE.test(text[end])) end += 1;
	return end;
}
function findErrorCode(text, searchableText, start, end) {
	const langChainIndex = searchableText.indexOf(LANGCHAIN, start);
	if (langChainIndex < 0 || langChainIndex >= end) return;
	let errorCode;
	let pathIndex = searchableText.indexOf(ERROR_PATH, langChainIndex + 9);
	while (pathIndex >= 0 && pathIndex < end) {
		const codeStart = pathIndex + 8;
		let codeEnd = codeStart;
		while (codeEnd < end && isErrorCodeCharacter(text[codeEnd])) codeEnd += 1;
		if (codeEnd > codeStart) errorCode = {
			start: codeStart,
			end: codeEnd
		};
		pathIndex = searchableText.indexOf(ERROR_PATH, Math.max(codeStart, codeEnd));
	}
	return errorCode;
}
/** Removes LangChain's appended docs URL so provider text carries no third-party attribution. */
function stripLangChainTroubleshootingUrl(message) {
	const text = toMessageText(message);
	const parts = [];
	let copiedUntil = 0;
	let searchFrom = 0;
	while (searchFrom < text.length) {
		const labelStart = text.indexOf(TROUBLESHOOTING_LABEL, searchFrom);
		if (labelStart < 0) break;
		let matchStart = labelStart;
		while (matchStart > copiedUntil && WHITESPACE.test(text[matchStart - 1])) matchStart -= 1;
		let urlStart = labelStart + 20;
		while (urlStart < text.length && WHITESPACE.test(text[urlStart])) urlStart += 1;
		if (!text.startsWith("https://", urlStart) && !text.startsWith("http://", urlStart)) {
			searchFrom = urlStart;
			continue;
		}
		const urlEnd = findTokenEnd(text, urlStart);
		const errorCode = findErrorCode(text, text, urlStart, urlEnd);
		if (errorCode == null) {
			searchFrom = urlEnd;
			continue;
		}
		let matchEnd = errorCode.end;
		if (text[matchEnd] === "/") matchEnd += 1;
		while (matchEnd < text.length && WHITESPACE.test(text[matchEnd])) matchEnd += 1;
		parts.push(text.slice(copiedUntil, matchStart), " ");
		copiedUntil = matchEnd;
		searchFrom = matchEnd;
	}
	parts.push(text.slice(copiedUntil));
	return parts.join("").trim();
}
/** The classification LangChain encoded in the docs URL it appended, when the text carries one. */
function parseLangChainErrorCode(message) {
	const text = toMessageText(message);
	const searchableText = text.toLowerCase();
	let searchFrom = 0;
	while (searchFrom < text.length) {
		const langChainIndex = searchableText.indexOf(LANGCHAIN, searchFrom);
		if (langChainIndex < 0) return;
		const tokenEnd = findTokenEnd(text, langChainIndex);
		const errorCode = findErrorCode(text, searchableText, langChainIndex, tokenEnd);
		if (errorCode != null) return text.slice(errorCode.start, errorCode.end).toUpperCase();
		searchFrom = tokenEnd + 1;
	}
}
//#endregion
//#region src/resolve-llm-delivery-path.ts
/**
* The native provider a custom endpoint declares, when it declares one. A custom endpoint
* speaks OpenAI's API unless its config names another dialect, and the upload route needs
* that answer for the same reason request initialization does: the media encoders emit
* OpenAI-format parts, so a custom endpoint running as Anthropic receives none.
*/
function getCustomEndpointProvider(customEndpoints, endpoint) {
	if (!customEndpoints || !endpoint) return;
	const normalized = normalizeEndpointName(endpoint);
	return customEndpoints.find((config) => normalizeEndpointName(config.name ?? "") === normalized)?.provider;
}
/** A custom endpoint emits OpenAI-format media parts only for the types the admin listed
*  in its `supportedMimeTypes`; the inherited default list is not an opt-in. A name that
*  is not a known provider is a custom endpoint. Mirrors `isConfiguredProviderMediaType`
*  on the encoder side, so the route and the encoder agree on which uploads the provider
*  actually receives; the built-in endpoints are left out because the client offers no
*  media for them. */
const isConfiguredMediaEndpoint = (mimeType, endpoint, supportedMimeTypes) => {
	if (!isExplicitMimeConfig(supportedMimeTypes) || isKnownProviderIdentifier(endpoint)) return false;
	return fileConfig.checkType(mimeType, supportedMimeTypes);
};
/** Audio and video reach the model only through the media encoders, which support a
*  narrower provider set than documents. Images use the broadly supported vision
*  path and are never gated here. */
const isProviderCapable = (mimeType, endpoint, useResponsesApi, supportedMimeTypes) => {
	if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return isMediaSupportedProvider(endpoint) || isConfiguredMediaEndpoint(mimeType, endpoint, supportedMimeTypes);
	if (mimeType === "application/pdf") return useResponsesApi === true || isDocumentSupportedProvider(endpoint);
	return true;
};
const SYSTEM_LLM_DELIVERY_DEFAULTS = {
	fallback: "text",
	overrides: {
		"image/*": "provider",
		"video/*": "provider",
		"audio/*": "provider",
		"application/pdf": "provider"
	}
};
/**
* Types some step in the upload pipeline can turn into text: natively readable text,
* documents a parser or OCR handles, images through OCR, and audio through transcription.
*
* Everything absent from this list, notably archives, tarballs, columnar data files and
* video, has no such step, and the default text matcher accepts any well-formed type, so
* routing them to text ends in their bytes being decoded as UTF-8.
*/
const TEXT_RECOVERABLE_MIME_TYPES = [
	/^text\//,
	/^image\//,
	/^audio\//,
	/^application\/(json|javascript|xml|sql|yaml|x-yaml|csv|typescript|x-sh|vnd\.coffeescript)$/,
	/^application\/pdf$/,
	/^application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet)$/,
	/^application\/vnd\.oasis\.opendocument\.(text|spreadsheet)$/,
	/^application\/(vnd\.ms-excel|x-msexcel|msexcel|x-ms-excel|x-excel|x-dos_ms_excel|xls|x-xls)$/,
	/^message\/rfc822$/
];
/**
* Types whose bytes are text already, so reading them directly is meaningful. Everything
* else needs a real extractor: decoding it as UTF-8 produces mojibake rather than content.
*/
/** Application types whose payload is text. Mirrors the set the content-protection code
*  treats as textual, plus the source and data formats this pipeline also accepts. */
const TEXTUAL_APPLICATION_MIME_TYPES = new Set([
	"application/json",
	"application/javascript",
	"application/sql",
	"application/xml",
	"application/x-yaml",
	"application/yaml",
	"application/csv",
	"application/typescript",
	"application/x-sh",
	"application/vnd.coffeescript"
]);
function isNativelyReadableText(mimeType) {
	const normalized = mimeType.split(";", 1)[0].trim().toLowerCase();
	return normalized.startsWith("text/") || TEXTUAL_APPLICATION_MIME_TYPES.has(normalized) || normalized === "message/rfc822";
}
function hasTextExtractionPath(mimeType) {
	return TEXT_RECOVERABLE_MIME_TYPES.some((pattern) => pattern.test(mimeType));
}
/**
* Resolves the default file path destination for a given mime type.
* Resolution chain: endpoint overrides -> endpoint fallback -> global overrides -> global fallback -> system defaults.
*/
function resolveDefaultLLMDeliveryPath(mimeType, endpointConfig, globalConfig, endpoint, useResponsesApi, sttConfigured, supportedMimeTypes) {
	const wildcard = mimeType.split("/")[0] + "/*";
	if (endpointConfig?.overrides) {
		if (endpointConfig.overrides[mimeType]) return endpointConfig.overrides[mimeType];
		if (endpointConfig.overrides[wildcard]) return endpointConfig.overrides[wildcard];
	}
	if (endpointConfig?.fallback) return endpointConfig.fallback;
	if (globalConfig?.overrides) {
		if (globalConfig.overrides[mimeType]) return globalConfig.overrides[mimeType];
		if (globalConfig.overrides[wildcard]) return globalConfig.overrides[wildcard];
	}
	if (globalConfig?.fallback) return globalConfig.fallback;
	const systemDefault = SYSTEM_LLM_DELIVERY_DEFAULTS.overrides[mimeType] ?? SYSTEM_LLM_DELIVERY_DEFAULTS.overrides[wildcard] ?? SYSTEM_LLM_DELIVERY_DEFAULTS.fallback;
	/** Only the system default is capability-gated: an explicit config above is the
	*  admin's decision. A known endpoint that cannot encode documents or media would
	*  otherwise accept the upload and hand the model nothing at all. */
	/** `agents` is a container, not a provider: it is what an upload reports when the
	*  agent's real provider could not be resolved, as for ephemeral agents. A custom
	*  endpoint name is likewise unresolvable here, since its real provider is chosen
	*  at request time and is usually OpenAI- or Anthropic-compatible. Judging
	*  capability from either would downgrade media the actual provider can deliver,
	*  so an unresolved provider keeps the system default. */
	const namedEndpoint = endpoint != null && endpoint !== "agents";
	const providerKnown = namedEndpoint && isKnownProviderIdentifier(endpoint);
	const isMedia = mimeType.startsWith("audio/") || mimeType.startsWith("video/");
	const canRecoverText = (type) => type.startsWith("audio/") && sttConfigured === false ? false : hasTextExtractionPath(type);
	if (systemDefault === "provider" && (isMedia ? namedEndpoint : providerKnown) && !isProviderCapable(mimeType, endpoint, useResponsesApi, supportedMimeTypes)) return canRecoverText(mimeType) ? "text" : "none";
	/** Bedrock's Converse document path natively accepts more than PDF, so on that
	*  endpoint its document types belong on the provider path rather than being
	*  extracted, which would drop non-text content and layout. */
	if (systemDefault !== "provider" && endpoint === "bedrock" && isBedrockDocumentType(mimeType)) return "provider";
	if (systemDefault === "text" && !canRecoverText(mimeType)) return "none";
	return systemDefault;
}
/**
* Delivery path for an upload that named no tool resource. The legacy chooser makes the
* destination explicit, so nothing is inferred there.
*/
function resolveDefaultUploadLLMDeliveryPath({ mimeType, endpointConfig, fileConfig, endpoint, endpointProvider, useResponsesApi, sttConfigured }) {
	if (endpointConfig?.legacyFileUploadUX === true) return "provider";
	const runsAsOpenAI = endpointProvider == null || isOpenAILikeProvider(endpointProvider);
	return resolveDefaultLLMDeliveryPath(mimeType, endpointConfig?.defaultLLMDeliveryPath, fileConfig?.defaultLLMDeliveryPath, endpoint, useResponsesApi, sttConfigured, runsAsOpenAI ? endpointConfig?.supportedMimeTypes : void 0);
}
/** Delivery path for an upload, honoring an explicitly chosen tool resource. */
function resolveUploadLLMDeliveryPath({ toolResource, mimeType, endpointConfig, fileConfig, endpoint, useResponsesApi, endpointProvider, sttConfigured }) {
	if (toolResource === "context" || toolResource === "ocr") return "text";
	if (toolResource === "file_search" || toolResource === "execute_code") return "none";
	return resolveDefaultUploadLLMDeliveryPath({
		mimeType,
		endpointConfig,
		fileConfig,
		endpoint,
		endpointProvider,
		useResponsesApi,
		sttConfigured
	});
}
/**
* Whether a file tool can do anything with this type. `file_search` indexes extracted
* text, so it needs a type some step can turn into text and cannot use media, whose
* extraction paths are OCR and speech rather than the vector store. Code execution is
* judged by the list the client offers it from. Shared by upload-time selection and
* deferred provisioning so the two cannot queue a file the other would refuse.
*/
function canToolResourceConsume(toolResource, mimeType) {
	if (toolResource === "file_search") return !mimeType.startsWith("image") && !mimeType.startsWith("audio") && !mimeType.startsWith("video") && (hasTextExtractionPath(mimeType) || matchesMimeList(mimeType, retrievalMimeTypes));
	if (toolResource === "execute_code") return matchesMimeList(mimeType, codeInterpreterMimeTypes);
	return true;
}
const matchesMimeList = (mimeType, patterns) => patterns.some((pattern) => pattern.test(mimeType));
/** Whether a tool this turn runs can read a file of this type. */
function hasTurnFileConsumer(mimeType, consumers) {
	return consumers.executeCode && canToolResourceConsume("execute_code", mimeType) || consumers.fileSearch && canToolResourceConsume("file_search", mimeType);
}
const isLLMDeliveryPath = (value) => value === "provider" || value === "text" || value === "none";
/** Whether a record's stored route was inferred at upload, so each turn resolves it again. */
function hasInferredLLMDeliveryPath(file) {
	return file.llmDeliveryPath != null && file.metadata?.destinationChosen !== true;
}
/**
* Delivery path for one attachment on one agent's turn.
*
* A record predating routing and a destination the user chose keep what they stored. An
* inferred route re-resolves against the endpoint handling the turn. A `none` route leaves
* the file for a tool; where the endpoint enables `textFallbackWithoutTools` and this turn
* runs no tool that can read the file, the text extracted at upload is delivered rather than
* the file reaching nothing. Consumers left undefined are unknown and not judged, as in
* {@link resolveUploadDestination}.
*/
function resolveTurnLLMDeliveryPath(routing, file, consumers) {
	if (routing == null || !hasInferredLLMDeliveryPath(file)) return isLLMDeliveryPath(file.llmDeliveryPath) ? file.llmDeliveryPath : void 0;
	const { endpointConfig } = routing;
	const mimeType = file.metadata?.routingMimeType ?? file.type ?? "";
	const path = resolveUploadLLMDeliveryPath({
		mimeType,
		...routing
	});
	const hasFallbackText = typeof file.text === "string" && file.text.length > 0;
	if (path === "none" && endpointConfig?.textFallbackWithoutTools === true && consumers != null && hasFallbackText && !hasTurnFileConsumer(mimeType, consumers)) return "text";
	return path;
}
/**
* Where a unified upload will end up, and whether it can be accepted at all.
*
* An upload has to be readable by something: the model, an extraction step, or a file
* tool. A permanent one has to land on an agent resource too, or storing it succeeds
* while leaving the agent no reference to it. Both outcomes are decided here rather than
* discovered later, so a request that would change nothing is refused with a reason.
*
* `agentTools` is undefined when no agent record backs the upload, as for an ephemeral
* agent that exists only for the request. An unknown tool set is not judged.
*/
function resolveUploadDestination(params) {
	const { toolResource, deliveryPath, mimeType, agentTools, hasAgent, isMessageAttachment, allowUnknownMessageConsumer = false, contextEnabled } = params;
	const refusesContext = (resource) => resource === "context" && hasAgent && !isMessageAttachment && contextEnabled === false;
	if (toolResource) {
		const resolved = toolResource === "ocr" ? "context" : toolResource;
		return refusesContext(resolved) ? { rejection: "context-disabled" } : { toolResource: resolved };
	}
	if (deliveryPath === "text") return refusesContext("context") ? { rejection: "context-disabled" } : { toolResource: "context" };
	const consumingTool = agentTools?.find((tool) => (tool === "execute_code" || tool === "file_search") && canToolResourceConsume(tool, mimeType));
	if (deliveryPath === "none" && consumingTool) return { toolResource: consumingTool };
	if (hasAgent && !isMessageAttachment) return { rejection: "no-agent-resource" };
	if (deliveryPath === "none" && (!isMessageAttachment || !allowUnknownMessageConsumer)) return { rejection: "no-consumer" };
	return {};
}
//#endregion
//#region src/messages.ts
/** A generated reasoning title describes the text as it existed at generation time.
*  Any manual edit or merge into a different reasoning step invalidates the entire
*  title revision domain while preserving unrelated content metadata. */
function stripReasoningLabelMetadata(part) {
	if (part.type !== "think") return part;
	const { reasoning_label: _label, reasoning_label_step_id: _stepId, reasoning_label_attempts: _attempts, reasoning_label_submitted_chars: _submittedChars, reasoning_label_revision: _revision, reasoning_label_status: _status, ...unlabeledPart } = part;
	return unlabeledPart;
}
const treeCache = /* @__PURE__ */ new WeakMap();
/**
* Builds the render tree from the flat messages array. Order-robust: live
* stream/steer/preempt cache writes can momentarily place a child before its
* parent, and a single-pass link would hoist such rows into phantom root
* branches — folding the visible thread to one dangling branch until a
* refetch restores creation order. Linking happens only after every message
* is indexed, so array order never changes the tree shape.
*/
function buildTree({ messages, fileMap }) {
	if (messages === null) return null;
	const cached = treeCache.get(messages);
	if (cached) {
		if (fileMap == null && cached.bare) return cached.bare;
		if (fileMap != null && cached.fileMap === fileMap && cached.hydrated) return cached.hydrated;
	}
	const messageMap = {};
	const orderedMessages = [];
	const rootMessages = [];
	const childrenCount = {};
	for (const message of messages) {
		if (!message) continue;
		/** A self-parented row can never link under itself (it becomes a root),
		*  so count it with the parentless group — charging its own id would
		*  inflate the sibling indices of its real children past
		*  `children.length`. */
		const parentId = message.parentMessageId === message.messageId ? "" : message.parentMessageId ?? "";
		childrenCount[parentId] = (childrenCount[parentId] || 0) + 1;
		const extendedMessage = {
			...message,
			children: [],
			depth: 0,
			siblingIndex: childrenCount[parentId] - 1
		};
		if (message.files && fileMap) extendedMessage.files = message.files.map((file) => fileMap[file.file_id ?? ""] ?? file);
		messageMap[message.messageId] = extendedMessage;
		orderedMessages.push(extendedMessage);
	}
	for (const extendedMessage of orderedMessages) {
		const parentMessage = messageMap[extendedMessage.parentMessageId ?? ""];
		if (parentMessage && parentMessage !== extendedMessage) parentMessage.children.push(extendedMessage);
		else rootMessages.push(extendedMessage);
	}
	/** Depth comes from a roots-down walk (a child linked before its parent
	*  can't inherit depth at link time). The `visited` set doubles as the
	*  cycle guard: nodes on a corrupt parent cycle are unreachable from any
	*  root, so they resurface as roots instead of disappearing. */
	const visited = /* @__PURE__ */ new Set();
	const assignDepths = (root) => {
		visited.add(root);
		const stack = [root];
		while (stack.length > 0) {
			const node = stack.pop();
			/** Every node has one parent, so this walk reaches each node once — an
			*  already-visited child is a cycle back-edge. Sever it (not just skip
			*  it) so consumers that recurse `children` terminate. */
			if (node.children.some((child) => visited.has(child))) node.children = node.children.filter((child) => !visited.has(child));
			for (const child of node.children) {
				child.depth = node.depth + 1;
				visited.add(child);
				stack.push(child);
			}
		}
	};
	for (const root of rootMessages) assignDepths(root);
	for (const extendedMessage of orderedMessages) if (!visited.has(extendedMessage)) {
		rootMessages.push(extendedMessage);
		assignDepths(extendedMessage);
	}
	const tree = rootMessages;
	const entry = cached ?? {};
	if (fileMap == null) entry.bare = tree;
	else {
		entry.fileMap = fileMap;
		entry.hydrated = tree;
	}
	if (!cached) treeCache.set(messages, entry);
	return tree;
}
/**
* Memoizes a messages array's id index. Every row that needs to look another
* message up (the hover controls resolving the turn a rerun would replay) would
* otherwise scan the whole array, which is quadratic in the conversation. A
* cache write replaces the array, so the index dies with the array it indexes
* and can never answer from stale rows.
*/
const indexCache = /* @__PURE__ */ new WeakMap();
/** The message with this id, resolved through the array's memoized index. */
function findMessageById(messages, messageId) {
	if (messages == null || messageId == null) return;
	let index = indexCache.get(messages);
	if (index == null) {
		index = /* @__PURE__ */ new Map();
		for (const message of messages) if (message?.messageId != null && !index.has(message.messageId)) index.set(message.messageId, message);
		indexCache.set(messages, index);
	}
	return index.get(messageId);
}
/**
* True when a turn carries the marker the server stamps on a manual compaction:
* `markCompactionOutcome` sets `initiatedBy: 'user'` on whichever part carries
* the outcome — the summary a Compact action produced, or the error part a run
* that produced none recorded instead — and nothing else writes it, so an
* automatic summary detour is not one. This is the compaction's own identity,
* independent of where it hangs: Compact runs on whatever leaf the branch ends
* with, so its response can parent onto a user message as easily as onto the
* answer it summarized. Redoing one is the context indicator's Compact action,
* never a rerun of the turn behind it.
*
* Compactions stored before the marker existed carry none, so callers keep
* their own ancestry test as the fallback.
*/
function isUserInitiatedCompaction(message) {
	const content = message?.content;
	if (!Array.isArray(content)) return false;
	return content.some((part) => (part?.type === "summary" || part?.type === "error") && part.initiatedBy === "user");
}
/**
* True when a message is a finished manual compaction: every content part is a
* summary and at least one of them carries text. A part that is still streaming
* or that failed contributes no text of its own, so an interrupted compaction
* can be retried.
*/
function isCompactedLeaf(message) {
	const content = message?.content;
	if (!Array.isArray(content) || content.length === 0) return false;
	let usable = false;
	for (const part of content) {
		if (part?.type !== "summary") return false;
		/** No `boundary` means the round never completed: only the final summary
		*  block carries one, so a part holding streamed deltas alone lacks it. */
		if (part.summarizing === true || part.failed === true || part.boundary == null) continue;
		const hasText = (part.content ?? []).some((block) => typeof block?.text === "string" && block.text.trim().length > 0);
		usable = usable || hasText;
	}
	return usable;
}
//#endregion
//#region src/errors.ts
const TOOL_CALL_ERROR_PREFIX = /^Error:\s*(?:\[[^\]]*\]\s*)*tool call failed:\s*/i;
function hasToolCallErrorPrefix(text) {
	return TOOL_CALL_ERROR_PREFIX.test(text);
}
function stripToolCallErrorPrefix(text) {
	return text.replace(TOOL_CALL_ERROR_PREFIX, "");
}
//#endregion
//#region src/runSteps.ts
/**
* Below this, a duration is noise rather than information: sub-second tool
* calls are the common case, and labelling every one of them `· 0.3s` adds a
* moving number to the end of most cards without telling the reader anything
* they could act on. Callers use {@link isReportableRunStepDuration} rather
* than comparing against this directly.
*/
const MIN_REPORTABLE_RUN_STEP_DURATION_MS = 1e3;
/**
* Wall-clock duration of a run step, derived from the terminal
* `on_run_step_closed` event.
*
* Returns `undefined` rather than a fallback whenever the value would be a
* guess, because a wrong duration is worse than an absent one — an absent one
* renders nothing, a wrong one is indistinguishable from a real measurement:
*
* - `created_at` is optional on the event; emitters that do not know when the
*   step opened cannot have their duration inferred from anything else.
* - A negative result means the two timestamps came from clocks that disagree.
*   That is not hypothetical: since `@librechat/agents` v3.6.0 a step can be
*   opened in one process and closed in another after a checkpoint resume, so
*   the two stamps can legitimately originate on different machines.
* - Non-finite input is treated as absent instead of propagating `NaN` into
*   rendering.
*
* Known limits, accepted rather than guessed at: only the negative direction
* of clock skew is detectable from a single stamp pair — positive skew
* inflates the result and cannot be distinguished from a genuinely long
* step. And the value is wall-clock elapsed between open and close, so a
* step held open across a suspension (a checkpoint resume, a HITL approval
* wait) includes that held-open time. Both are properties of the only data
* available, not derivation bugs.
*/
function getRunStepDurationMs(closed) {
	const { created_at: createdAt, closed_at: closedAt } = closed;
	if (typeof createdAt !== "number" || typeof closedAt !== "number") return;
	if (!Number.isFinite(createdAt) || !Number.isFinite(closedAt)) return;
	const durationMs = closedAt - createdAt;
	return durationMs >= 0 ? durationMs : void 0;
}
/**
* Whether a derived duration is worth showing to the reader.
*
* This is a presentation judgment, so it belongs at render time only. The
* stamp sites persist the raw {@link getRunStepDurationMs} value instead of
* pre-filtering through this — thresholding at write time would bake a
* display rule into stored data, making "fast" indistinguishable from "not
* derivable" and unrecoverable if the rule ever changes.
*/
function isReportableRunStepDuration(durationMs) {
	return typeof durationMs === "number" && durationMs >= 1e3;
}
//#endregion
//#region src/artifacts.ts
let ArtifactModes = /* @__PURE__ */ function(ArtifactModes) {
	ArtifactModes["DEFAULT"] = "default";
	ArtifactModes["SHADCNUI"] = "shadcnui";
	ArtifactModes["CUSTOM"] = "custom";
	return ArtifactModes;
}({});
const utils = `
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
const accordian = `import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
`;
const alertDialog = `import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-gray-800 dark:bg-gray-950",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
`;
const alert = `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border border-gray-200 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950 dark:border-gray-800 dark:[&>svg]:text-gray-50",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50",
        destructive:
          "border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 dark:border-red-900/50 dark:text-red-900 dark:dark:border-red-900 dark:[&>svg]:text-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

`;
const avatar = `import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "../../lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }

`;
const badge = `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:border-gray-800 dark:focus:ring-gray-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
        destructive:
          "border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/80",
        outline: "text-gray-950 dark:text-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

`;
const breadcrumb = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-gray-500 sm:gap-2.5 dark:text-gray-400",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-gray-950 dark:hover:text-gray-50", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-gray-950 dark:text-gray-50", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

`;
const button = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-gray-50 hover:bg-gray-900/90 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90",
        destructive:
          "bg-red-500 text-gray-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/90",
        outline:
          "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
        ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        link: "text-gray-900 underline-offset-4 hover:underline dark:text-gray-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`;
const calendar = `import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-gray-400",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-100/50 [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-gray-800/50 dark:[&:has([aria-selected])]:bg-gray-800",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gray-900 text-gray-50 hover:bg-gray-900 hover:text-gray-50 focus:bg-gray-900 focus:text-gray-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50 dark:hover:text-gray-900 dark:focus:bg-gray-50 dark:focus:text-gray-900",
        day_today: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
        day_outside:
          "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-100/50 aria-selected:text-gray-500 aria-selected:opacity-30 dark:text-gray-400 dark:aria-selected:bg-gray-800/50 dark:aria-selected:text-gray-400",
        day_disabled: "text-gray-500 opacity-50 dark:text-gray-400",
        day_range_middle:
          "aria-selected:bg-gray-100 aria-selected:text-gray-900 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

`;
const card = `import * as React from 'react';

import { cn } from '../../lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
`;
const carousel = `import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}

`;
const checkbox = `import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "../../lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-gray-200 dark:border-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gray-900 data-[state=checked]:text-gray-50  dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:data-[state=checked]:bg-gray-50 dark:data-[state=checked]:text-gray-900",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

`;
const collapsible = `import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

`;
const dialog = `import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-gray-800 dark:bg-gray-950",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 dark:ring-offset-gray-950 dark:focus:ring-gray-300 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

`;
const drawer = `import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "../../lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-gray-100 dark:bg-gray-800" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

`;
const dropdownMenu = `import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../../lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100 data-[state=open]:bg-gray-100 dark:focus:bg-gray-800 dark:data-[state=open]:bg-gray-800",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}

`;
const hoverCard = `import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "../../lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border border-gray-200 bg-white p-4 text-gray-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }

`;
const input = `import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
`;
const label = `import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
`;
const menuBar = `
import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../../lib/utils"

const MenubarMenu = MenubarPrimitive.Menu

const MenubarGroup = MenubarPrimitive.Group

const MenubarPortal = MenubarPrimitive.Portal

const MenubarSub = MenubarPrimitive.Sub

const MenubarRadioGroup = MenubarPrimitive.RadioGroup

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-950",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-50",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-50",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-gray-500 dark:text-gray-400",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}

`;
const navigationMenu = `import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{""}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)] dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-gray-200 shadow-md dark:bg-gray-800" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}

`;
const pagination = `import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
import { ButtonProps, buttonVariants } from "./button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}

`;
const popover = `import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../../lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }

`;
const progress = `import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gray-900 transition-all dark:bg-gray-50"
      style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
`;
const radioGroup = `import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "../../lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-gray-200 dark:border-gray-900 text-gray-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50  dark:text-gray-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }

`;
const select = `import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "../../lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus:ring-gray-300",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

`;
const separator = `import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "../../lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-gray-200 dark:bg-gray-800",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }

`;
const skeleton = `import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-gray-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
`;
const slider = `import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <SliderPrimitive.Range className="absolute h-full bg-gray-900 dark:bg-gray-50" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-gray-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-50 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

`;
const switchComponent = `import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "../../lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 dark:focus-visible:ring-gray-300 dark:focus-visible:ring-offset-gray-950 dark:data-[state=checked]:bg-gray-50 dark:data-[state=unchecked]:bg-gray-800",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:bg-gray-950"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

`;
const table = `import * as React from "react"

import { cn } from "../../lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-gray-100/50 font-medium [&>tr]:last:border-b-0 dark:bg-gray-800/50",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100 dark:hover:bg-gray-800/50 dark:data-[state=selected]:bg-gray-800",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 dark:text-gray-400",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

`;
const tabs = `import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-50",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

`;
const textarea = `import * as React from "react"

import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

`;
const toast = `import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-gray-200 p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full dark:border-gray-800",
  {
    variants: {
      variant: {
        default: "border bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50",
        destructive:
          "destructive group border-red-500 bg-red-500 text-gray-50 dark:border-red-900 dark:bg-red-900 dark:text-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-gray-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-gray-50 group-[.destructive]:focus:ring-red-500 dark:border-gray-800 dark:ring-offset-gray-950 dark:hover:bg-gray-800 dark:focus:ring-gray-300 dark:group-[.destructive]:border-gray-800/40 dark:group-[.destructive]:hover:border-red-900/30 dark:group-[.destructive]:hover:bg-red-900 dark:group-[.destructive]:hover:text-gray-50 dark:group-[.destructive]:focus:ring-red-900",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-gray-950/50 opacity-0 transition-opacity hover:text-gray-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:text-gray-50/50 dark:hover:text-gray-50",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

`;
const toaster = `import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

`;
const toggleGroup = `import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { toggleVariants } from "./toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }

`;
const toggle = `import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 hover:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:ring-offset-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-400 dark:focus-visible:ring-gray-300 dark:data-[state=on]:bg-gray-800 dark:data-[state=on]:text-gray-50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-gray-200 bg-transparent hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-50",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }

`;
const tooltip = `import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "../../lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

`;
const useToast = `import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "./toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
`;
const shadcnComponents = {
	utils,
	accordian,
	alertDialog,
	alert,
	avatar,
	badge,
	breadcrumb,
	button,
	calendar,
	card,
	carousel,
	checkbox,
	collapsible,
	dialog,
	drawer,
	dropdownMenu,
	hoverCard,
	input,
	label,
	menuBar,
	navigationMenu,
	pagination,
	popover,
	progress,
	radioGroup,
	select,
	separator,
	skeleton,
	slider,
	switchComponent,
	table,
	tabs,
	textarea,
	toast,
	toaster,
	toggleGroup,
	toggle,
	tooltip,
	useToast
};
const essentialShadcnComponents = {
	utils,
	avatar,
	button,
	card,
	checkbox,
	input,
	label,
	radioGroup,
	select,
	textarea
};
//#endregion
//#region src/permissions.ts
/**
* Enum for Permission Types
*/
let PermissionTypes = /* @__PURE__ */ function(PermissionTypes) {
	/**
	* Type for Prompt Permissions
	*/
	PermissionTypes["PROMPTS"] = "PROMPTS";
	/**
	* Type for Bookmark Permissions
	*/
	PermissionTypes["BOOKMARKS"] = "BOOKMARKS";
	/**
	* Type for Agent Permissions
	*/
	PermissionTypes["AGENTS"] = "AGENTS";
	/**
	* Type for Memory Permissions
	*/
	PermissionTypes["MEMORIES"] = "MEMORIES";
	/**
	* Type for Multi-Conversation Permissions
	*/
	PermissionTypes["MULTI_CONVO"] = "MULTI_CONVO";
	/**
	* Type for Temporary Chat
	*/
	PermissionTypes["TEMPORARY_CHAT"] = "TEMPORARY_CHAT";
	/**
	* Type for using the "Run Code" LC Code Interpreter API feature
	*/
	PermissionTypes["RUN_CODE"] = "RUN_CODE";
	/**
	* Type for using the "Web Search" feature
	*/
	PermissionTypes["WEB_SEARCH"] = "WEB_SEARCH";
	/**
	* Type for People Picker Permissions
	*/
	PermissionTypes["PEOPLE_PICKER"] = "PEOPLE_PICKER";
	/**
	* Type for Marketplace Permissions
	*/
	PermissionTypes["MARKETPLACE"] = "MARKETPLACE";
	/**
	* Type for using the "File Search" feature
	*/
	PermissionTypes["FILE_SEARCH"] = "FILE_SEARCH";
	/**
	* Type for using the "File Citations" feature in agents
	*/
	PermissionTypes["FILE_CITATIONS"] = "FILE_CITATIONS";
	/**
	* Type for MCP Server Permissions
	*/
	PermissionTypes["MCP_SERVERS"] = "MCP_SERVERS";
	/**
	* Type for Remote Agent (API) Permissions
	*/
	PermissionTypes["REMOTE_AGENTS"] = "REMOTE_AGENTS";
	/**
	* Type for Skill Permissions
	*/
	PermissionTypes["SKILLS"] = "SKILLS";
	/**
	* Type for Shared Link Permissions
	*/
	PermissionTypes["SHARED_LINKS"] = "SHARED_LINKS";
	/**
	* Type for Scheduled Chats Permissions
	*/
	PermissionTypes["SCHEDULES"] = "SCHEDULES";
	return PermissionTypes;
}({});
/**
* Maps PermissionTypes to their corresponding `interface` config field names.
* Used to identify which interface fields seed role permissions at startup
* and must NOT be overridden via DB config (use the role permissions editor instead).
*/
const PERMISSION_TYPE_INTERFACE_FIELDS = {
	["PROMPTS"]: "prompts",
	["AGENTS"]: "agents",
	["BOOKMARKS"]: "bookmarks",
	["MEMORIES"]: "memories",
	["MULTI_CONVO"]: "multiConvo",
	["TEMPORARY_CHAT"]: "temporaryChat",
	["RUN_CODE"]: "runCode",
	["WEB_SEARCH"]: "webSearch",
	["FILE_SEARCH"]: "fileSearch",
	["FILE_CITATIONS"]: "fileCitations",
	["PEOPLE_PICKER"]: "peoplePicker",
	["MARKETPLACE"]: "marketplace",
	["MCP_SERVERS"]: "mcpServers",
	["REMOTE_AGENTS"]: "remoteAgents",
	["SKILLS"]: "skills",
	["SHARED_LINKS"]: "sharedLinks",
	["SCHEDULES"]: "schedules"
};
/** Set of interface config field names that correspond to role permissions. */
const INTERFACE_PERMISSION_FIELDS = new Set(Object.values(PERMISSION_TYPE_INTERFACE_FIELDS));
/**
* Interface fields that seed a permission (use/create) BUT also carry runtime
* config that must survive DB/tenant/user overrides. For these, override
* sanitizers strip only the permission sub-keys (use/create) from the object
* form and PRESERVE the boolean form — for `schedules`, `interface.schedules: false`
* is the runtime feature disable that `getLimits` reads, not a permission toggle.
*/
const RUNTIME_CONFIG_INTERFACE_FIELDS = new Set(["schedules"]);
/**
* YAML sub-keys within composite interface permission fields that map to permission bits.
* When an interface permission field is an object, only these sub-keys are stripped from
* DB overrides — other sub-keys (like `placeholder`, `trustCheckbox`) are UI-only and pass through.
*
* Mapping to Permissions enum:
*   'use'           → Permissions.USE       (agents, prompts, mcpServers, remoteAgents, marketplace)
*   'create'        → Permissions.CREATE    (agents, prompts, mcpServers, remoteAgents)
*   'share'         → Permissions.SHARE     (agents, prompts, mcpServers, remoteAgents)
*   'public'        → Permissions.SHARE_PUBLIC (agents, prompts, mcpServers, remoteAgents)
*   'users'         → Permissions.VIEW_USERS   (peoplePicker only)
*   'groups'        → Permissions.VIEW_GROUPS  (peoplePicker only)
*   'roles'         → Permissions.VIEW_ROLES   (peoplePicker only)
*   'configureObo'  → Permissions.CONFIGURE_OBO (mcpServers only)
*/
const PERMISSION_SUB_KEYS = new Set([
	"use",
	"create",
	"share",
	"public",
	"users",
	"groups",
	"roles",
	"configureObo"
]);
/**
* Enum for Role-Based Access Control Constants
*/
let Permissions = /* @__PURE__ */ function(Permissions) {
	Permissions["USE"] = "USE";
	Permissions["CREATE"] = "CREATE";
	Permissions["UPDATE"] = "UPDATE";
	Permissions["READ"] = "READ";
	Permissions["READ_AUTHOR"] = "READ_AUTHOR";
	Permissions["SHARE"] = "SHARE";
	/** Can disable if desired */
	Permissions["OPT_OUT"] = "OPT_OUT";
	Permissions["VIEW_USERS"] = "VIEW_USERS";
	Permissions["VIEW_GROUPS"] = "VIEW_GROUPS";
	Permissions["VIEW_ROLES"] = "VIEW_ROLES";
	/** Can share resources publicly (with everyone) */
	Permissions["SHARE_PUBLIC"] = "SHARE_PUBLIC";
	/**
	* Can configure MCP server On-Behalf-Of (OBO) token exchange. Gates the
	* `obo` field on MCP server configs because OBO silently mints and forwards
	* per-user delegated tokens to whatever URL the server points at.
	*/
	Permissions["CONFIGURE_OBO"] = "CONFIGURE_OBO";
	return Permissions;
}({});
const promptPermissionsSchema = z.object({
	["USE"]: z.boolean().default(true),
	["CREATE"]: z.boolean().default(true),
	["SHARE"]: z.boolean().default(false),
	["SHARE_PUBLIC"]: z.boolean().default(false)
});
const bookmarkPermissionsSchema = z.object({ ["USE"]: z.boolean().default(true) });
const memoryPermissionsSchema = z.object({
	["USE"]: z.boolean().default(true),
	["CREATE"]: z.boolean().default(true),
	["UPDATE"]: z.boolean().default(true),
	["READ"]: z.boolean().default(true),
	["OPT_OUT"]: z.boolean().default(true)
});
const agentPermissionsSchema = z.object({
	["USE"]: z.boolean().default(true),
	["CREATE"]: z.boolean().default(true),
	["SHARE"]: z.boolean().default(false),
	["SHARE_PUBLIC"]: z.boolean().default(false)
});
const multiConvoPermissionsSchema = z.object({ ["USE"]: z.boolean().default(true) });
const temporaryChatPermissionsSchema = z.object({ ["USE"]: z.boolean().default(true) });
const runCodePermissionsSchema = z.object({ ["USE"]: z.boolean().default(true) });
const webSearchPermissionsSchema = z.object({ ["USE"]: z.boolean().default(true) });
const peoplePickerPermissionsSchema = z.object({
	["VIEW_USERS"]: z.boolean().default(true),
	["VIEW_GROUPS"]: z.boolean().default(true),
	["VIEW_ROLES"]: z.boolean().default(true)
});
const marketplacePermissionsSchema = z.object({ ["USE"]: z.boolean().default(false) });
const fileSearchPermissionsSchema = z.object({ ["USE"]: z.boolean().default(true) });
const fileCitationsPermissionsSchema = z.object({ ["USE"]: z.boolean().default(true) });
const mcpServersPermissionsSchema = z.object({
	["USE"]: z.boolean().default(true),
	["CREATE"]: z.boolean().default(true),
	["SHARE"]: z.boolean().default(false),
	["SHARE_PUBLIC"]: z.boolean().default(false),
	["CONFIGURE_OBO"]: z.boolean().default(false)
});
const remoteAgentsPermissionsSchema = z.object({
	["USE"]: z.boolean().default(false),
	["CREATE"]: z.boolean().default(false),
	["SHARE"]: z.boolean().default(false),
	["SHARE_PUBLIC"]: z.boolean().default(false)
});
const skillPermissionsSchema = z.object({
	["USE"]: z.boolean().default(true),
	["CREATE"]: z.boolean().default(true),
	["SHARE"]: z.boolean().default(false),
	["SHARE_PUBLIC"]: z.boolean().default(false)
});
const schedulesPermissionsSchema = z.object({
	["USE"]: z.boolean().default(true),
	["CREATE"]: z.boolean().default(true)
});
const sharedLinksPermissionsSchema = z.object({
	["CREATE"]: z.boolean().default(true),
	["SHARE"]: z.boolean().default(true),
	["SHARE_PUBLIC"]: z.boolean().default(false)
});
const permissionsSchema = z.object({
	["PROMPTS"]: promptPermissionsSchema,
	["BOOKMARKS"]: bookmarkPermissionsSchema,
	["MEMORIES"]: memoryPermissionsSchema,
	["AGENTS"]: agentPermissionsSchema,
	["MULTI_CONVO"]: multiConvoPermissionsSchema,
	["TEMPORARY_CHAT"]: temporaryChatPermissionsSchema,
	["RUN_CODE"]: runCodePermissionsSchema,
	["WEB_SEARCH"]: webSearchPermissionsSchema,
	["PEOPLE_PICKER"]: peoplePickerPermissionsSchema,
	["MARKETPLACE"]: marketplacePermissionsSchema,
	["FILE_SEARCH"]: fileSearchPermissionsSchema,
	["FILE_CITATIONS"]: fileCitationsPermissionsSchema,
	["MCP_SERVERS"]: mcpServersPermissionsSchema,
	["REMOTE_AGENTS"]: remoteAgentsPermissionsSchema,
	["SKILLS"]: skillPermissionsSchema,
	["SHARED_LINKS"]: sharedLinksPermissionsSchema,
	["SCHEDULES"]: schedulesPermissionsSchema
});
//#endregion
//#region src/roles.ts
/**
* Enum for System Defined Roles
*/
let SystemRoles = /* @__PURE__ */ function(SystemRoles) {
	/**
	* The Admin role
	*/
	SystemRoles["ADMIN"] = "ADMIN";
	/**
	* The default user role
	*/
	SystemRoles["USER"] = "USER";
	return SystemRoles;
}({});
const roleSchema = z.object({
	name: z.string(),
	permissions: permissionsSchema
});
const defaultRolesSchema = z.object({
	["ADMIN"]: roleSchema.extend({
		name: z.literal("ADMIN"),
		permissions: permissionsSchema.extend({
			["PROMPTS"]: promptPermissionsSchema.extend({
				["USE"]: z.boolean().default(true),
				["CREATE"]: z.boolean().default(true),
				["SHARE"]: z.boolean().default(true),
				["SHARE_PUBLIC"]: z.boolean().default(true)
			}),
			["BOOKMARKS"]: bookmarkPermissionsSchema.extend({ ["USE"]: z.boolean().default(true) }),
			["MEMORIES"]: memoryPermissionsSchema.extend({
				["USE"]: z.boolean().default(true),
				["CREATE"]: z.boolean().default(true),
				["UPDATE"]: z.boolean().default(true),
				["READ"]: z.boolean().default(true),
				["OPT_OUT"]: z.boolean().default(true)
			}),
			["AGENTS"]: agentPermissionsSchema.extend({
				["USE"]: z.boolean().default(true),
				["CREATE"]: z.boolean().default(true),
				["SHARE"]: z.boolean().default(true),
				["SHARE_PUBLIC"]: z.boolean().default(true)
			}),
			["MULTI_CONVO"]: multiConvoPermissionsSchema.extend({ ["USE"]: z.boolean().default(true) }),
			["TEMPORARY_CHAT"]: temporaryChatPermissionsSchema.extend({ ["USE"]: z.boolean().default(true) }),
			["RUN_CODE"]: runCodePermissionsSchema.extend({ ["USE"]: z.boolean().default(true) }),
			["WEB_SEARCH"]: webSearchPermissionsSchema.extend({ ["USE"]: z.boolean().default(true) }),
			["PEOPLE_PICKER"]: peoplePickerPermissionsSchema.extend({
				["VIEW_USERS"]: z.boolean().default(true),
				["VIEW_GROUPS"]: z.boolean().default(true),
				["VIEW_ROLES"]: z.boolean().default(true)
			}),
			["MARKETPLACE"]: z.object({ ["USE"]: z.boolean().default(false) }),
			["FILE_SEARCH"]: fileSearchPermissionsSchema.extend({ ["USE"]: z.boolean().default(true) }),
			["FILE_CITATIONS"]: fileCitationsPermissionsSchema.extend({ ["USE"]: z.boolean().default(true) }),
			["MCP_SERVERS"]: mcpServersPermissionsSchema.extend({
				["USE"]: z.boolean().default(true),
				["CREATE"]: z.boolean().default(true),
				["SHARE"]: z.boolean().default(true),
				["SHARE_PUBLIC"]: z.boolean().default(true),
				["CONFIGURE_OBO"]: z.boolean().default(true)
			}),
			["REMOTE_AGENTS"]: remoteAgentsPermissionsSchema.extend({
				["USE"]: z.boolean().default(true),
				["CREATE"]: z.boolean().default(true),
				["SHARE"]: z.boolean().default(true),
				["SHARE_PUBLIC"]: z.boolean().default(true)
			}),
			["SKILLS"]: skillPermissionsSchema.extend({
				["USE"]: z.boolean().default(true),
				["CREATE"]: z.boolean().default(true),
				["SHARE"]: z.boolean().default(true),
				["SHARE_PUBLIC"]: z.boolean().default(true)
			}),
			["SHARED_LINKS"]: sharedLinksPermissionsSchema.extend({
				["CREATE"]: z.boolean().default(true),
				["SHARE"]: z.boolean().default(true),
				["SHARE_PUBLIC"]: z.boolean().default(true)
			}),
			["SCHEDULES"]: schedulesPermissionsSchema.extend({
				["USE"]: z.boolean().default(true),
				["CREATE"]: z.boolean().default(true)
			})
		})
	}),
	["USER"]: roleSchema.extend({
		name: z.literal("USER"),
		permissions: permissionsSchema
	})
});
const systemRoleSet = new Set(Object.values(SystemRoles).map((r) => r.toUpperCase()));
/** Case-insensitive check for reserved system role names. */
function isSystemRoleName(name) {
	if (!name) return false;
	return systemRoleSet.has(name.toUpperCase());
}
const roleDefaults = defaultRolesSchema.parse({
	["ADMIN"]: {
		name: "ADMIN",
		permissions: {
			["PROMPTS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: true,
				["SHARE_PUBLIC"]: true
			},
			["BOOKMARKS"]: { ["USE"]: true },
			["MEMORIES"]: {
				["USE"]: true,
				["CREATE"]: true,
				["UPDATE"]: true,
				["READ"]: true,
				["OPT_OUT"]: true
			},
			["AGENTS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: true,
				["SHARE_PUBLIC"]: true
			},
			["MULTI_CONVO"]: { ["USE"]: true },
			["TEMPORARY_CHAT"]: { ["USE"]: true },
			["RUN_CODE"]: { ["USE"]: true },
			["WEB_SEARCH"]: { ["USE"]: true },
			["PEOPLE_PICKER"]: {
				["VIEW_USERS"]: true,
				["VIEW_GROUPS"]: true,
				["VIEW_ROLES"]: true
			},
			["MARKETPLACE"]: { ["USE"]: true },
			["FILE_SEARCH"]: { ["USE"]: true },
			["FILE_CITATIONS"]: { ["USE"]: true },
			["MCP_SERVERS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: true,
				["SHARE_PUBLIC"]: true,
				["CONFIGURE_OBO"]: true
			},
			["REMOTE_AGENTS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: true,
				["SHARE_PUBLIC"]: true
			},
			["SKILLS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: true,
				["SHARE_PUBLIC"]: true
			},
			["SHARED_LINKS"]: {
				["CREATE"]: true,
				["SHARE"]: true,
				["SHARE_PUBLIC"]: true
			},
			["SCHEDULES"]: {
				["USE"]: true,
				["CREATE"]: true
			}
		}
	},
	["USER"]: {
		name: "USER",
		permissions: {
			["PROMPTS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: false,
				["SHARE_PUBLIC"]: false
			},
			["BOOKMARKS"]: {},
			["MEMORIES"]: {},
			["AGENTS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: false,
				["SHARE_PUBLIC"]: false
			},
			["MULTI_CONVO"]: {},
			["TEMPORARY_CHAT"]: {},
			["RUN_CODE"]: {},
			["WEB_SEARCH"]: {},
			["PEOPLE_PICKER"]: {
				["VIEW_USERS"]: false,
				["VIEW_GROUPS"]: false,
				["VIEW_ROLES"]: false
			},
			["MARKETPLACE"]: { ["USE"]: true },
			["FILE_SEARCH"]: {},
			["FILE_CITATIONS"]: {},
			["MCP_SERVERS"]: {
				["USE"]: true,
				["CREATE"]: false,
				["SHARE"]: false,
				["SHARE_PUBLIC"]: false,
				["CONFIGURE_OBO"]: false
			},
			["REMOTE_AGENTS"]: {
				["USE"]: false,
				["CREATE"]: false,
				["SHARE"]: false,
				["SHARE_PUBLIC"]: false
			},
			["SKILLS"]: {
				["USE"]: true,
				["CREATE"]: true,
				["SHARE"]: false,
				["SHARE_PUBLIC"]: false
			},
			["SHARED_LINKS"]: {
				["CREATE"]: true,
				["SHARE"]: true,
				["SHARE_PUBLIC"]: true
			},
			["SCHEDULES"]: {
				["USE"]: true,
				["CREATE"]: true
			}
		}
	}
});
//#endregion
//#region src/types.ts
/**
* @deprecated Superseded by the persisted `userInvocable` /
* `disableModelInvocation` pair derived from frontmatter. Retained for the
* transition window so older UI forms and tests still type-check; the
* backend no longer reads or writes it.
*/
let InvocationMode = /* @__PURE__ */ function(InvocationMode) {
	InvocationMode["auto"] = "auto";
	InvocationMode["manual"] = "manual";
	InvocationMode["both"] = "both";
	return InvocationMode;
}({});
//#endregion
//#region src/types/content.ts
let AnnotationTypes = /* @__PURE__ */ function(AnnotationTypes) {
	AnnotationTypes["FILE_CITATION"] = "file_citation";
	AnnotationTypes["FILE_PATH"] = "file_path";
	return AnnotationTypes;
}({});
let StepStatus = /* @__PURE__ */ function(StepStatus) {
	StepStatus["IN_PROGRESS"] = "in_progress";
	StepStatus["CANCELLED"] = "cancelled";
	StepStatus["FAILED"] = "failed";
	StepStatus["COMPLETED"] = "completed";
	StepStatus["EXPIRED"] = "expired";
	return StepStatus;
}({});
let MessageContentTypes = /* @__PURE__ */ function(MessageContentTypes) {
	MessageContentTypes["TEXT"] = "text";
	MessageContentTypes["IMAGE_FILE"] = "image_file";
	return MessageContentTypes;
}({});
const hostImageIdSuffix = "_host_copy";
const hostImageNamePrefix = "host_copy_";
//#endregion
//#region src/types/schedules.ts
/** Cadences the dialog builds from structured pickers (hour, minute, weekday). */
const scheduleStructuredFrequencies = [
	"hourly",
	"daily",
	"weekdays",
	"weekly"
];
const scheduleFrequencies = [...scheduleStructuredFrequencies, "cron"];
/** Bounds a stored expression. Generous for five fields, because each one can hold a
*  list: an every-minute-of-the-hour cadence spelled out runs past two hundred chars. */
const SCHEDULE_CRON_MAX_LENGTH = 256;
const scheduleTargets = ["new"];
const structuredCadenceSchema = z.object({
	frequency: z.enum(scheduleStructuredFrequencies),
	hour: z.number().int().min(0).max(23),
	minute: z.number().int().min(0).max(59),
	daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7).transform((days) => Array.from(new Set(days))).optional()
});
/**
* A raw cron expression carries its own hour and minute, so it cannot share the
* structured shape: there is no single `hour` for `0 9,17 * * 1-5`. Syntax is
* validated server-side by croner, the same parser the engine fires from, rather
* than by a regex that would accept patterns croner then rejects at fire time.
*/
const cronCadenceSchema = z.object({
	frequency: z.literal("cron"),
	expression: z.string().trim().min(1).max(256)
});
const scheduleCadenceSchema = z.discriminatedUnion("frequency", [structuredCadenceSchema, cronCadenceSchema]);
const isCronCadence = (cadence) => cadence.frequency === "cron";
const createSchedulePayloadSchema = z.object({
	name: z.string().trim().min(1).max(256),
	prompt: z.string().trim().min(1).max(32e3),
	agent_id: z.string().trim().min(1),
	cadence: scheduleCadenceSchema,
	timezone: z.string().min(1),
	target: z.enum(scheduleTargets).default("new"),
	file_ids: z.array(z.string()).max(10).transform((ids) => Array.from(new Set(ids))).optional(),
	/**
	* Chat project each run's conversation is filed under. `null` clears the scope.
	* Ownership is checked server-side at write time and again at every fire, so a
	* deleted project disables the schedule instead of silently filing runs loose.
	*/
	chatProjectId: z.string().trim().min(1).nullable().optional(),
	enabled: z.boolean().default(true),
	/**
	* Client-generated key making creation idempotent across retries. Creation commits
	* the row and arms it in two writes, so a failure between them leaves the client
	* unable to tell whether anything persisted; retrying blind can produce two recurring
	* schedules. A retry carrying the same key resolves to the original row instead.
	* REQUIRED: an optional key preserves the keyless duplicate path for any client
	* that omits it, which is exactly the failure the key exists to close.
	*/
	clientRequestId: z.string().trim().min(1).max(128)
});
/** Idempotency is a property of the CREATE attempt, not of the schedule's config. */
const updateSchedulePayloadSchema = createSchedulePayloadSchema.omit({ clientRequestId: true }).partial().extend({ 
/**
* The configRevision the client's edit was computed from (captured when the
* dialog opened). The server fences the update on it, so a concurrent edit
* from another tab answers 409 instead of being silently overwritten by a
* payload rebuilt from a stale snapshot (cadence is sent whole, so the
* server-side fresh-read fence alone cannot detect this).
*/
expectedConfigRevision: z.number().int().min(0).optional() });
/** Only structured schedule preflight failures may request immediate suspension. */
function getScheduleMCPDisabledReason(outcomes) {
	const statuses = new Set(outcomes?.map((outcome) => outcome.status));
	if (statuses.has("mcp_permission_denied")) return "mcp_permission_denied";
	if (statuses.has("mcp_configuration_missing")) return "mcp_configuration_missing";
	if (statuses.has("mcp_reauth_required")) return "mcp_reauth_required";
}
const scheduleMCPOutcomeSchema = z.object({
	server: z.string(),
	/** Agent whose selected tool requires this server. Used to open the correct
	* recovery chat when the requirement belongs to a handoff or subagent. */
	agentId: z.string().optional(),
	status: z.enum([
		"ready",
		"mcp_reauth_required",
		"mcp_configuration_missing",
		"mcp_permission_denied",
		"mcp_unavailable"
	])
});
function readScheduleMCPOutcomes(error) {
	if (!error || !/^mcp_(reauth_required|configuration_missing|permission_denied|unavailable): \[/.test(error)) return [];
	try {
		const result = scheduleMCPOutcomeSchema.array().safeParse(JSON.parse(error.slice(error.indexOf(": ") + 2)));
		return result.success ? result.data : [];
	} catch {
		return [];
	}
}
//#endregion
//#region src/cadence.ts
/** Mirrors the server default when a weekly cadence omits `daysOfWeek`. */
const WEEKLY_DEFAULT_DAY = 1;
/**
* Minute, hour, day of month, month, day of week. croner also reads a six-field form
* carrying seconds and a seven-field form that pins a year, and both are refused.
* Seconds would promise a precision the runtime does not keep: the engine polls on a
* thirty-second tick and offsets each schedule by up to two minutes of jitter. A pinned
* year makes a cadence that runs out, and every caller here treats "no next occurrence"
* as a cadence it cannot read.
*/
const CRON_FIELD_COUNT = 5;
/**
* Spring-forward compresses consecutive wall-clock occurrences, so the ENFORCEABLE
* minimum for day-and-longer gaps is the nominal gap minus the largest real-world
* transition: two hours (Antarctica/Troll; every other zone shifts at most one).
* A floor set exactly at the nominal value would otherwise admit a schedule that
* genuinely violates it once a year. Hourly gaps are unaffected (the skipped hours
* lengthen, never shorten, the gap between occurrences).
*/
const DST_COMPRESSION_MINUTES = 120;
/**
* Occurrences sampled when measuring a cron expression's tightest gap. The floor
* exists to reject expressions that fire too OFTEN, and a dense pattern reveals
* its short gap within the first few occurrences, so a small window answers the
* question this guards. Known limit: this is a bounded probe, not the exhaustive
* proof the structured formulas give. An expression that is sparse for the next
* `CRON_PROBE_OCCURRENCES` runs and dense later would pass here and be caught by
* the fire-time recheck instead.
*/
const CRON_PROBE_OCCURRENCES = 32;
/** Enough to span four nominal gaps from an anchor two gaps before a transition,
*  which is what guarantees the straddling pair falls inside the window. */
const TRANSITION_PROBE_OCCURRENCES = 5;
/**
* Compiles a cadence to the cron expression the engine fires from. Shared rather
* than server-owned because the dialog previews the next runs, validates the
* interval floor, and disables its own submit from these same functions: a second
* client-side implementation would drift and either show run times the schedule
* does not keep or accept a cadence the server then rejects.
*/
function cadenceToCron(cadence) {
	if (cadence.frequency === "cron") return cadence.expression;
	const { frequency, hour, minute } = cadence;
	if (frequency === "hourly") return `${minute} * * * *`;
	if (frequency === "daily") return `${minute} ${hour} * * *`;
	if (frequency === "weekdays") return `${minute} ${hour} * * 1-5`;
	return `${minute} ${hour} * * ${[...cadence.daysOfWeek?.length ? cadence.daysOfWeek : [WEEKLY_DEFAULT_DAY]].sort((a, b) => a - b).join(",")}`;
}
/**
* Everything `cronCadenceSchema` will accept: exactly five fields, within the length
* the schema stores, and actually matching at some point. croner accepts syntactically
* valid patterns that can never match (`0 0 30 2 *`), and those would arm a schedule
* that never fires. Validated with croner rather than a regex, because a regex would
* accept patterns croner then rejects at fire time.
*
* A five-field expression that matches at all matches forever, which is what lets every
* caller keep reading "no next occurrence" as "this cadence is unreadable".
*/
function isValidCronExpression(expression, timezone) {
	const trimmed = expression.trim();
	if (trimmed.length > 256) return false;
	if (trimmed.split(/\s+/).length !== CRON_FIELD_COUNT) return false;
	try {
		return new Cron(trimmed, {
			timezone,
			paused: true
		}).nextRun() != null;
	} catch {
		return false;
	}
}
/**
* The next occurrences the engine would fire. Server-side jitter (up to two
* minutes) is deliberately not modelled: it is keyed off a schedule id that does
* not exist yet at create time, and showing 9:01 for a 9:00 schedule reads as a bug.
*/
function nextRunInstants(cadence, timezone, count) {
	try {
		const runs = new Cron(cadenceToCron(cadence), {
			timezone,
			paused: true
		}).nextRuns(count);
		return runs.filter((run, index) => index === 0 || run.getTime() !== runs[index - 1].getTime());
	} catch {
		return [];
	}
}
const MINUTE_MS = 6e4;
const DAY_MS = 1440 * MINUTE_MS;
/** A year and a bit, so a zone with a single yearly transition always shows one. */
const TRANSITION_SEARCH_DAYS = 400;
const offsetFormatters = /* @__PURE__ */ new Map();
/** Minutes east of UTC in `zone` at `instant`, read back from the wall clock the
*  zone renders. The only way to observe a zone's offset without a tz database. */
function zoneOffsetMinutes(zone, instant) {
	let formatter = offsetFormatters.get(zone);
	if (formatter == null) {
		formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: zone,
			hourCycle: "h23",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		});
		offsetFormatters.set(zone, formatter);
	}
	const parts = {};
	for (const part of formatter.formatToParts(instant)) parts[part.type] = part.value;
	const wallClock = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
	return Math.round((wallClock - instant.getTime()) / MINUTE_MS);
}
/** Zone transitions are asked for once per fire, and the scan below costs ~10ms.
*  Keyed by day because that is how far the answer stays put as the window slides,
*  and cleared wholesale at the cap so a long-lived worker cannot accumulate an
*  entry per zone per day forever. */
const transitionCache = /* @__PURE__ */ new Map();
const TRANSITION_CACHE_MAX = 512;
/**
* Every instant `zone` changes its UTC offset within the search window; empty for a
* fixed-offset zone. Both directions matter and only one of them shortens anything,
* so taking just the next one would usually find the harmless fall-back and miss the
* spring-forward six months behind it. Bracketed a day at a time, bisected to the
* minute.
*/
function offsetChanges(zone, from) {
	const day = Math.floor(from.getTime() / DAY_MS);
	const cacheKey = `${zone}:${day}`;
	const cached = transitionCache.get(cacheKey);
	if (cached != null) return cached;
	const changes = [];
	const start = /* @__PURE__ */ new Date((day - 1) * DAY_MS);
	let low = start.getTime();
	let baseOffset = zoneOffsetMinutes(zone, start);
	const end = low + TRANSITION_SEARCH_DAYS * DAY_MS;
	for (let probe = low + DAY_MS; probe <= end; probe += DAY_MS) {
		const offset = zoneOffsetMinutes(zone, new Date(probe));
		if (offset !== baseOffset) {
			let high = probe;
			let bracket = low;
			while (high - bracket > MINUTE_MS) {
				const mid = bracket + Math.floor((high - bracket) / 2);
				if (zoneOffsetMinutes(zone, new Date(mid)) === baseOffset) bracket = mid;
				else high = mid;
			}
			changes.push(new Date(high));
			baseOffset = offset;
		}
		low = probe;
	}
	if (transitionCache.size >= TRANSITION_CACHE_MAX) transitionCache.clear();
	transitionCache.set(cacheKey, changes);
	return changes;
}
function runsAfter(expression, from, zone, occurrences = CRON_PROBE_OCCURRENCES) {
	return new Cron(expression, {
		timezone: zone,
		paused: true
	}).nextRuns(occurrences, from);
}
/** Tightest gap, in minutes, across `runs`; null when there is no pair to measure. */
function minGapMinutes(runs) {
	if (runs.length < 2) return null;
	let minGapMs = Number.MAX_SAFE_INTEGER;
	for (let i = 1; i < runs.length; i++) {
		const gapMs = runs[i].getTime() - runs[i - 1].getTime();
		if (gapMs <= 0) continue;
		minGapMs = Math.min(minGapMs, gapMs);
	}
	if (minGapMs === Number.MAX_SAFE_INTEGER) return null;
	return Math.floor(minGapMs / MINUTE_MS);
}
function probeMinGapMinutes(expression, zone, from, occurrences = CRON_PROBE_OCCURRENCES) {
	return minGapMinutes(runsAfter(expression, from, zone, occurrences));
}
/**
* Smallest gap in minutes between occurrences. Returns 0 for an unparseable or
* never-matching expression so every floor rejects it, failing closed rather than
* admitting an expression the engine cannot fire.
*
* Measured twice, and the smaller wins:
*
* 1. Nominal, probed in UTC, then discounted by the same worst-case DST allowance
*    the structured branches assume. This keeps `0 9 * * *` reporting exactly what
*    the Daily preset reports, so the same schedule cannot be admitted in one form
*    and rejected in the other.
* 2. Real elapsed time in the schedule's own zone, across each of that zone's
*    transitions. Spring-forward compresses a gap that straddles one
*    (`0 0,12 * * *` in America/New_York is 11 hours that day, not 12), and step 1
*    only discounts gaps of a day or more, so a subdaily gap needs measuring rather
*    than estimating. Anchoring at the transition is what makes a bounded probe see
*    it at all: from today it is usually months outside any reasonable window.
*/
function cronIntervalMinutes(expression, timezone) {
	try {
		const now = /* @__PURE__ */ new Date();
		const nominal = probeMinGapMinutes(expression, "UTC", now);
		if (nominal == null) return 0;
		const estimate = nominal < 1440 ? nominal : Math.max(0, nominal - DST_COMPRESSION_MINUTES);
		if (timezone == null || estimate === 0) return estimate;
		const anchorBackMs = 2 * Math.max(nominal, 1) * MINUTE_MS;
		let smallest = estimate;
		for (const transition of offsetChanges(timezone, now)) {
			const measured = probeMinGapMinutes(expression, timezone, new Date(Math.max(now.getTime(), transition.getTime() - anchorBackMs)), TRANSITION_PROBE_OCCURRENCES);
			if (measured != null) smallest = Math.min(smallest, measured);
		}
		return smallest;
	} catch {
		return 0;
	}
}
/**
* Minimum minutes between occurrences, for the admin interval floor. `timezone` is
* the schedule's own; passing it lets the cron branch measure a DST-compressed gap
* instead of estimating one. The structured branches are zone-independent: their
* formulas already carry the worst-case allowance.
*/
function cadenceIntervalMinutes(cadence, timezone) {
	if (isCronCadence(cadence)) return cronIntervalMinutes(cadence.expression, timezone);
	if (cadence.frequency === "hourly") return 60;
	if (cadence.frequency === "daily" || cadence.frequency === "weekdays") return 1440 - DST_COMPRESSION_MINUTES;
	const days = cadence.daysOfWeek?.length ? Array.from(new Set(cadence.daysOfWeek)) : [WEEKLY_DEFAULT_DAY];
	if (days.length <= 1) return 10080 - DST_COMPRESSION_MINUTES;
	const sorted = [...days].sort((a, b) => a - b);
	let minGapDays = 7;
	for (let i = 0; i < sorted.length; i++) {
		const gap = i + 1 < sorted.length ? sorted[i + 1] - sorted[i] : 7 - sorted[i] + sorted[0];
		minGapDays = Math.min(minGapDays, gap);
	}
	return minGapDays * 24 * 60 - DST_COMPRESSION_MINUTES;
}
//#endregion
//#region src/types/skills.ts
/**
* Shared skill validation constants — the single source of truth for name,
* description, title, body, and file-path length limits. Mirrored by
* `packages/data-schemas/src/methods/skill.ts`; whenever those constants
* change, the DB-side validators MUST be updated to match.
*
* Exported from `librechat-data-provider` so both frontend form validators
* and backend Mongoose pre-save hooks use the same literals.
*/
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;
const SKILL_DESCRIPTION_SHORT_THRESHOLD = 20;
const SKILL_DISPLAY_TITLE_MAX_LENGTH = 128;
const SKILL_BODY_MAX_LENGTH = 1e5;
/**
* Kebab-case identifier pattern: must start with a lowercase letter or digit,
* and contain only lowercase letters, digits, and hyphens. Mirrors the
* backend `SKILL_NAME_PATTERN` in `packages/data-schemas/src/methods/skill.ts`.
*/
const SKILL_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
//#endregion
//#region src/types/web.ts
let DATE_RANGE = /* @__PURE__ */ function(DATE_RANGE) {
	DATE_RANGE["PAST_HOUR"] = "h";
	DATE_RANGE["PAST_24_HOURS"] = "d";
	DATE_RANGE["PAST_WEEK"] = "w";
	DATE_RANGE["PAST_MONTH"] = "m";
	DATE_RANGE["PAST_YEAR"] = "y";
	return DATE_RANGE;
}({});
//#endregion
//#region src/types/insights.ts
const INSIGHTS_MAX_RANGE_DAYS = 30;
const INSIGHTS_SEARCH_MIN_LENGTH = 3;
const INSIGHTS_SEARCH_MAX_LENGTH = 200;
const INSIGHTS_AGENT_ID_MAX_LENGTH = 256;
//#endregion
//#region src/types/traces.ts
const TRACE_CURSOR_MAX_LENGTH = 4096;
const TRACE_SOURCE_ID_MAX_LENGTH = 128;
const TRACE_RECORD_ID_MAX_LENGTH = 256;
//#endregion
//#region src/types/queuedTurns.ts
const agentQueuedTurnStatuses = [
	"queued",
	"claimed",
	"admitted",
	"cancelled",
	"dead"
];
const agentQueuedTurnDurability = ["process_local", "durable"];
const agentQueuedTurnFileRefSchema = z.object({
	file_id: z.string().trim().min(1),
	type: z.string().optional(),
	filepath: z.string().optional(),
	filename: z.string().optional(),
	height: z.number().optional(),
	width: z.number().optional(),
	bytes: z.number().nonnegative().optional(),
	llmDeliveryPath: z.enum([
		"provider",
		"text",
		"none"
	]).optional()
});
const enqueueAgentQueuedTurnSchema = z.object({
	conversationId: z.string().trim().min(1),
	parentMessageId: z.string().trim().min(1),
	clientRequestId: z.string().trim().min(1).max(128),
	text: z.string(),
	files: z.array(agentQueuedTurnFileRefSchema).optional(),
	quotes: z.array(z.string()).optional(),
	manualSkills: z.array(z.string().trim().min(1)).optional(),
	priority: z.boolean().optional(),
	expectedPredecessorCreatedAt: z.number().int().nonnegative().optional()
});
const listAgentQueuedTurnsSchema = z.object({
	conversationId: z.string().trim().min(1),
	clientRequestIds: z.array(z.string().trim().min(1).max(128)).max(100).transform((ids) => Array.from(new Set(ids))).optional()
});
const cancelAgentQueuedTurnSchema = z.object({ queuedTurnId: z.string().trim().min(1) });
const agentQueuedTurnReceiptSchema = enqueueAgentQueuedTurnSchema.extend({
	queuedTurnId: z.string().trim().min(1),
	status: z.enum(agentQueuedTurnStatuses),
	/** Effective generation boundary consumed by an admitted turn. This can
	* advance beyond the originally captured root as queued turns chain. */
	effectivePredecessorCreatedAt: z.number().int().nonnegative().optional(),
	/** Explicitly proves that this admission consumed no predecessor boundary. */
	rootPredecessor: z.literal(true).optional(),
	position: z.number().int().nonnegative().optional(),
	/** Immutable queue sequence retained as `revision` for wire compatibility. */
	revision: z.number().int().nonnegative(),
	failure: z.object({
		code: z.string().trim().min(1).max(128),
		message: z.string().max(2048).optional()
	}).optional(),
	createdAt: z.string(),
	updatedAt: z.string()
});
const agentQueuedTurnCapabilitySchema = z.discriminatedUnion("supported", [z.object({ supported: z.literal(false) }), z.object({
	supported: z.literal(true),
	durability: z.enum(agentQueuedTurnDurability)
})]);
const enqueueAgentQueuedTurnResponseSchema = z.object({
	receipt: agentQueuedTurnReceiptSchema,
	capability: agentQueuedTurnCapabilitySchema
});
const listAgentQueuedTurnsResponseSchema = z.object({
	queuedTurns: z.array(agentQueuedTurnReceiptSchema),
	capability: agentQueuedTurnCapabilitySchema,
	revision: z.number().int().nonnegative()
});
const cancelAgentQueuedTurnResponseSchema = z.object({ receipt: agentQueuedTurnReceiptSchema });
//#endregion
//#region src/providers.ts
/** Canonical provider identity used for branding across client and server. */
let ProviderId = /* @__PURE__ */ function(ProviderId) {
	ProviderId["openai"] = "openai";
	ProviderId["anthropic"] = "anthropic";
	ProviderId["google"] = "google";
	ProviderId["azure"] = "azure";
	ProviderId["bedrock"] = "bedrock";
	ProviderId["xai"] = "xai";
	ProviderId["moonshot"] = "moonshot";
	ProviderId["anyscale"] = "anyscale";
	ProviderId["apipie"] = "apipie";
	ProviderId["cohere"] = "cohere";
	ProviderId["deepseek"] = "deepseek";
	ProviderId["fireworks"] = "fireworks";
	ProviderId["groq"] = "groq";
	ProviderId["helicone"] = "helicone";
	ProviderId["huggingface"] = "huggingface";
	ProviderId["lemonade"] = "lemonade";
	ProviderId["mistral"] = "mistral";
	ProviderId["mlx"] = "mlx";
	ProviderId["ollama"] = "ollama";
	ProviderId["openrouter"] = "openrouter";
	ProviderId["perplexity"] = "perplexity";
	ProviderId["qwen"] = "qwen";
	ProviderId["shuttleai"] = "shuttleai";
	ProviderId["together"] = "together";
	ProviderId["unify"] = "unify";
	ProviderId["vercel"] = "vercel";
	return ProviderId;
}({});
const endpointToProvider = {
	["openAI"]: "openai",
	["azureOpenAI"]: "azure",
	["anthropic"]: "anthropic",
	["google"]: "google",
	["bedrock"]: "bedrock"
};
const knownEndpointToProvider = {
	["anyscale"]: "anyscale",
	["apipie"]: "apipie",
	["cohere"]: "cohere",
	["fireworks"]: "fireworks",
	["deepseek"]: "deepseek",
	["moonshot"]: "moonshot",
	["groq"]: "groq",
	["helicone"]: "helicone",
	["huggingface"]: "huggingface",
	["lemonade"]: "lemonade",
	["mistral"]: "mistral",
	["mlx"]: "mlx",
	["ollama"]: "ollama",
	["openrouter"]: "openrouter",
	["perplexity"]: "perplexity",
	["shuttleai"]: "shuttleai",
	["together.ai"]: "together",
	["unify"]: "unify",
	["vercel"]: "vercel",
	["xai"]: "xai"
};
const providerAliases = {
	chatgpt: "openai",
	gpt: "openai",
	azureopenai: "azure",
	claude: "anthropic",
	gemini: "google",
	gemma: "google",
	vertex: "google",
	vertexai: "google",
	palm: "google",
	awsbedrock: "bedrock",
	grok: "xai",
	kimi: "moonshot",
	moonshotai: "moonshot",
	amdlemonade: "lemonade",
	lemonadeserver: "lemonade",
	mistralai: "mistral",
	togetherai: "together"
};
const modelCatalogAliases = { ["vertexai"]: "google", Ollama: "ollama", ollama: "ollama", custom: "ollama" };
const normalize = (input) => input.toLowerCase().replace(/[\s._-]/g, "");
const providerByNormalizedId = Object.values(ProviderId).reduce((acc, id) => {
	acc[normalize(id)] = id;
	return acc;
}, {});
/** Resolves free-form provider text to a canonical id, ignoring case and separators. */
function resolveProviderId(input) {
	if (!input) return null;
	const key = normalize(input);
	return providerByNormalizedId[key] ?? providerAliases[key] ?? null;
}
/** Resolves a runtime provider to its model catalog, using a native alias only when needed. */
function resolveModelCatalogKey(provider, catalogs) {
	const key = provider ?? "";
	if (catalogs?.[key] != null) return key;
	const lower = key.toLowerCase();
	if (catalogs?.[lower] != null) return lower;
	const alias = modelCatalogAliases[key] ?? modelCatalogAliases[lower];
	if (alias && catalogs?.[alias] != null) return alias;
	return alias ?? key;
}
//#endregion
//#region src/svg.ts
/**
* DOMPurify policy for user-provided SVG icons, shared by the browser uploader and
* the server trust boundary so a preview and the persisted icon cannot disagree.
* `use` is re-added for self-contained `<defs>` references (targets restricted by
* `restrictSvgReferences`); every SMIL element is forbidden so a stored icon
* cannot animate forever wherever it renders.
*/
const SVG_SANITIZE_CONFIG = {
	USE_PROFILES: {
		svg: true,
		svgFilters: true
	},
	ADD_TAGS: ["use"],
	ADD_ATTR: ["fr"],
	FORBID_TAGS: [
		"script",
		"foreignObject",
		"style",
		"a",
		"image",
		"animate",
		"animateColor",
		"animateMotion",
		"animateTransform",
		"mpath",
		"set"
	],
	FORBID_ATTR: ["style"]
};
const URL_TOKEN_PREFIX = /url\(\s*['"]?\s*/gi;
/**
* True when every `url()` token targets a fragment. Backslashes reject the value
* outright: CSS unescapes idents before tokenizing, so `u\72l(...)` is a `url()`.
*/
function referencesOnlyFragments(value) {
	if (value.includes("\\")) return false;
	if (!value.toLowerCase().includes("url(")) return true;
	URL_TOKEN_PREFIX.lastIndex = 0;
	while (URL_TOKEN_PREFIX.exec(value) !== null) if (value[URL_TOKEN_PREFIX.lastIndex] !== "#") return false;
	return true;
}
/** DOMPurify hook that drops every attribute referencing outside the document. */
function restrictSvgReferences(node) {
	const names = [];
	for (let i = 0; i < node.attributes.length; i += 1) names.push(node.attributes[i].name);
	for (const name of names) {
		const value = node.getAttribute(name)?.trim();
		if (value == null) continue;
		if (name === "href" || name === "xlink:href") {
			if (!value.startsWith("#")) node.removeAttribute(name);
			continue;
		}
		if (!referencesOnlyFragments(value)) node.removeAttribute(name);
	}
}
/** SVG names the HTML parser lowercases and its adjustment table does not restore. */
const UNADJUSTED_SVG_TAGS = [[/(<\/?)fedropshadow\b/gi, "$1feDropShadow"]];
const SVG_ROOT_TAG = /<svg(\s[^>]*)?>/i;
/**
* Makes HTML-mode sanitizer output valid as a standalone `image/svg+xml`
* document: restores camelCase element names the HTML parser lowercased and
* declares the SVG namespace on the root, without which an XML parser puts the
* root in no namespace and the icon renders blank.
*/
function finalizeSvgMarkup(markup) {
	let restored = markup;
	for (const [pattern, canonical] of UNADJUSTED_SVG_TAGS) restored = restored.replace(pattern, canonical);
	return restored.replace(SVG_ROOT_TAG, (tag, attributes) => attributes != null && /\sxmlns\s*=/i.test(attributes) ? tag : `<svg xmlns="http://www.w3.org/2000/svg"${attributes ?? ""}>`);
}
//#endregion
//#region src/actions.ts
function sha1(input) {
	return crypto.createHash("sha1").update(input).digest("hex");
}
function createURL(domain, path) {
	return new URL(`${domain.replace(/\/$/, "")}/${path.replace(/^\//, "")}`).toString();
}
const schemaTypeHandlers = {
	string: (schema) => {
		if (schema.enum) return z.enum(schema.enum);
		let stringSchema = z.string();
		if (schema.minLength !== void 0) stringSchema = stringSchema.min(schema.minLength);
		if (schema.maxLength !== void 0) stringSchema = stringSchema.max(schema.maxLength);
		return stringSchema;
	},
	number: (schema) => {
		let numberSchema = z.number();
		if (schema.minimum !== void 0) numberSchema = numberSchema.min(schema.minimum);
		if (schema.maximum !== void 0) numberSchema = numberSchema.max(schema.maximum);
		return numberSchema;
	},
	integer: (schema) => schemaTypeHandlers.number(schema).int(),
	boolean: () => z.boolean(),
	array: (schema) => {
		if (schema.items) {
			const zodSchema = openAPISchemaToZod(schema.items);
			if (zodSchema) return z.array(zodSchema);
			return z.array(z.unknown());
		}
		return z.array(z.unknown());
	},
	object: (schema) => {
		const shape = {};
		if (schema.properties) Object.entries(schema.properties).forEach(([key, value]) => {
			shape[key] = openAPISchemaToZod(value) || z.unknown();
			if (schema.required && schema.required.includes(key)) shape[key] = shape[key].describe(value.description || "");
			else shape[key] = shape[key].optional().describe(value.description || "");
		});
		return z.object(shape);
	}
};
function openAPISchemaToZod(schema) {
	if (schema.type === "object" && Object.keys(schema.properties || {}).length === 0) return;
	return (schemaTypeHandlers[schema.type] || (() => z.unknown()))(schema);
}
/**
* Class representing a function signature.
*/
var FunctionSignature = class {
	constructor(name, description, parameters, strict) {
		this.name = name;
		this.description = description;
		this.parameters = parameters;
		this.strict = strict ?? false;
	}
	toObjectTool() {
		const parameters = {
			...this.parameters,
			additionalProperties: this.strict ? false : void 0
		};
		return {
			type: "function",
			function: {
				name: this.name,
				description: this.description,
				parameters,
				...this.strict ? { strict: this.strict } : {}
			}
		};
	}
};
var RequestConfig = class {
	constructor(domain, basePath, method, operation, isConsequential, contentType, parameterLocations) {
		this.domain = domain;
		this.basePath = basePath;
		this.method = method;
		this.operation = operation;
		this.isConsequential = isConsequential;
		this.contentType = contentType;
		this.parameterLocations = parameterLocations;
	}
};
var RequestExecutor = class {
	constructor(config) {
		this.config = config;
		this.authHeaders = {};
		this.path = config.basePath;
	}
	setParams(params) {
		this.operationHash = sha1(JSON.stringify(params));
		this.params = { ...params };
		if (this.config.parameterLocations) {
			for (const [key, value] of Object.entries(params)) if (this.config.parameterLocations[key] === "path") {
				const paramPattern = `{${key}}`;
				if (this.path.includes(paramPattern)) {
					this.path = this.path.replace(paramPattern, encodeURIComponent(String(value)));
					delete this.params[key];
				}
			}
		} else for (const [key, value] of Object.entries(params)) {
			const paramPattern = `{${key}}`;
			if (this.path.includes(paramPattern)) {
				this.path = this.path.replace(paramPattern, encodeURIComponent(String(value)));
				delete this.params[key];
			}
		}
		return this;
	}
	async setAuth(metadata) {
		if (!metadata.auth) return this;
		const { type, authorization_type, custom_auth_header, authorization_url, client_url, scope, token_exchange_method } = metadata.auth;
		const { api_key, oauth_client_id, oauth_client_secret, oauth_token_expires_at, oauth_access_token = "" } = metadata;
		const isApiKey = api_key != null && api_key.length > 0 && type === "service_http";
		const isOAuth = !!(oauth_client_id != null && oauth_client_id && oauth_client_secret != null && oauth_client_secret && type === "oauth" && authorization_url != null && authorization_url && client_url != null && client_url && scope != null && scope && token_exchange_method);
		if (isApiKey && authorization_type === "basic") {
			const basicToken = Buffer.from(api_key).toString("base64");
			this.authHeaders["Authorization"] = `Basic ${basicToken}`;
		} else if (isApiKey && authorization_type === "bearer") this.authHeaders["Authorization"] = `Bearer ${api_key}`;
		else if (isApiKey && authorization_type === "custom" && custom_auth_header != null && custom_auth_header) this.authHeaders[custom_auth_header] = api_key;
		else if (isOAuth) {
			const now = /* @__PURE__ */ new Date();
			if (!oauth_access_token) throw new Error("No access token found. Please log in first.");
			if (oauth_token_expires_at && now >= new Date(oauth_token_expires_at)) throw new Error("Access token is expired. Please re-login.");
			this.authToken = oauth_access_token;
			this.authHeaders["Authorization"] = `Bearer ${this.authToken}`;
		}
		return this;
	}
	async execute(options) {
		const url = createURL(this.config.domain, this.path);
		const headers = {
			...this.authHeaders,
			...this.config.contentType ? { "Content-Type": this.config.contentType } : {}
		};
		const method = this.config.method.toLowerCase();
		/**
		* SECURITY: Disable automatic redirects to prevent SSRF bypass.
		* Attackers could use redirects to access internal services:
		*   1. Set action URL to allowed external domain
		*   2. External domain redirects to internal service (e.g., 127.0.0.1, rag_api)
		*   3. Without this protection, axios would follow the redirect
		*
		* By setting maxRedirects: 0, we prevent this attack vector.
		* The action will receive the redirect response (3xx) instead of following it.
		*
		* SECURITY: When httpAgent/httpsAgent are provided (SSRF-safe agents), they validate
		* the DNS-resolved IP at TCP connect time, preventing TOCTOU DNS rebinding attacks.
		*/
		const axios$1 = axios.create({
			maxRedirects: 0,
			validateStatus: (status) => status >= 200 && status < 400,
			...options?.httpAgent != null ? { httpAgent: options.httpAgent } : {},
			...options?.httpsAgent != null ? { httpsAgent: options.httpsAgent } : {}
		});
		const queryParams = {};
		const bodyParams = {};
		if (this.config.parameterLocations && this.params) for (const key of Object.keys(this.params)) {
			const loc = this.config.parameterLocations[key] || (method === "get" ? "query" : "body");
			const val = this.params[key];
			if (loc === "query") queryParams[key] = val;
			else if (loc === "header") headers[key] = String(val);
			else if (loc === "body") bodyParams[key] = val;
		}
		else if (this.params) {
			Object.assign(queryParams, this.params);
			Object.assign(bodyParams, this.params);
		}
		if (method === "get") return axios$1.get(url, {
			headers,
			params: queryParams
		});
		else if (method === "post") return axios$1.post(url, bodyParams, {
			headers,
			params: queryParams
		});
		else if (method === "put") return axios$1.put(url, bodyParams, {
			headers,
			params: queryParams
		});
		else if (method === "delete") return axios$1.delete(url, {
			headers,
			data: bodyParams,
			params: queryParams
		});
		else if (method === "patch") return axios$1.patch(url, bodyParams, {
			headers,
			params: queryParams
		});
		else throw new Error(`Unsupported HTTP method: ${method}`);
	}
	getConfig() {
		return this.config;
	}
};
var ActionRequest = class {
	constructor(domain, path, method, operation, isConsequential, contentType, parameterLocations) {
		this.config = new RequestConfig(domain, path, method, operation, isConsequential, contentType, parameterLocations);
	}
	get domain() {
		return this.config.domain;
	}
	get path() {
		return this.config.basePath;
	}
	get method() {
		return this.config.method;
	}
	get operation() {
		return this.config.operation;
	}
	get isConsequential() {
		return this.config.isConsequential;
	}
	get contentType() {
		return this.config.contentType;
	}
	createExecutor() {
		return new RequestExecutor(this.config);
	}
	setParams(params) {
		const executor = this.createExecutor();
		executor.setParams(params);
		return executor;
	}
	async setAuth(metadata) {
		return this.createExecutor().setAuth(metadata);
	}
	async execute() {
		return this.createExecutor().execute();
	}
};
function resolveRef(obj, components) {
	if ("$ref" in obj && components) {
		const refPath = obj.$ref.replace(/^#\/components\//, "").split("/");
		let resolved = components;
		for (const segment of refPath) if (typeof resolved === "object" && resolved !== null && segment in resolved) resolved = resolved[segment];
		else throw new Error(`Could not resolve reference: ${obj.$ref}`);
		return resolveRef(resolved, components);
	}
	return obj;
}
function sanitizeOperationId(input) {
	return input.replace(/[^a-zA-Z0-9_-]/g, "");
}
/**
* Converts an OpenAPI spec to function signatures and request builders.
*/
function openapiToFunction(openapiSpec, generateZodSchemas = false) {
	const functionSignatures = [];
	const requestBuilders = {};
	const zodSchemas = {};
	const baseUrl = openapiSpec.servers?.[0]?.url ?? "";
	for (const [path, methods] of Object.entries(openapiSpec.paths)) for (const [method, operation] of Object.entries(methods)) {
		const paramLocations = {};
		const operationObj = operation;
		const defaultOperationId = `${method}_${path}`;
		const operationId = operationObj.operationId || sanitizeOperationId(defaultOperationId);
		const description = operationObj.summary || operationObj.description || "";
		const isStrict = operationObj["x-strict"] ?? false;
		const parametersSchema = {
			type: "object",
			properties: {},
			required: []
		};
		if (operationObj.parameters) for (const param of operationObj.parameters ?? []) {
			const resolvedParam = resolveRef(param, openapiSpec.components);
			const paramName = resolvedParam.name;
			if (!paramName || !resolvedParam.schema) continue;
			const paramSchema = resolveRef(resolvedParam.schema, openapiSpec.components);
			parametersSchema.properties[paramName] = paramSchema;
			if (resolvedParam.required) parametersSchema.required.push(paramName);
			paramLocations[paramName] = resolvedParam.in === "query" || resolvedParam.in === "path" || resolvedParam.in === "header" || resolvedParam.in === "body" ? resolvedParam.in : "query";
		}
		let contentType = "";
		if (operationObj.requestBody) {
			const content = operationObj.requestBody.content;
			contentType = Object.keys(content ?? {})[0];
			const schema = content?.[contentType]?.schema;
			const resolvedSchema = resolveRef(schema, openapiSpec.components);
			parametersSchema.properties = {
				...parametersSchema.properties,
				...resolvedSchema.properties
			};
			if (resolvedSchema.required) parametersSchema.required.push(...resolvedSchema.required);
			if (resolvedSchema.properties) for (const key in resolvedSchema.properties) paramLocations[key] = "body";
			contentType = contentType ?? "application/json";
		}
		const functionSignature = new FunctionSignature(operationId, description, parametersSchema, isStrict);
		functionSignatures.push(functionSignature);
		requestBuilders[operationId] = new ActionRequest(baseUrl, path, method, operationId, !!(operationObj["x-openai-isConsequential"] ?? false), contentType, paramLocations);
		if (generateZodSchemas && Object.keys(parametersSchema.properties).length > 0) {
			const schema = openAPISchemaToZod(parametersSchema);
			if (schema) zodSchemas[operationId] = schema;
		}
	}
	return {
		functionSignatures,
		requestBuilders,
		zodSchemas
	};
}
/**
* Cross-platform IP validation (works in Node.js and browser).
* @param input - String to check if it's an IP address
* @returns 0 if not IP, 4 for IPv4, 6 for IPv6
*/
function isIP(input) {
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input)) return 4;
	if (/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(input)) return 6;
	return 0;
}
/**
* Extracts domain from URL (protocol + hostname).
* @param url - URL to extract from
* @returns Protocol and hostname (e.g., "https://example.com")
*/
function extractDomainFromUrl(url) {
	try {
		/** Parsed URL object */
		const parsedUrl = new URL(url);
		const hostname = isIP(parsedUrl.hostname) === 6 ? `[${parsedUrl.hostname}]` : parsedUrl.hostname;
		return `${parsedUrl.protocol}//${hostname}`;
	} catch {
		throw new Error(`Invalid URL format: ${url}`);
	}
}
function getExplicitPort(value) {
	const normalizedValue = value.trim();
	const protocolSeparatorIndex = normalizedValue.indexOf("://");
	const hasProtocol = protocolSeparatorIndex !== -1;
	const authorityAndPath = hasProtocol ? normalizedValue.slice(protocolSeparatorIndex + 3) : normalizedValue;
	let port;
	try {
		const parsedUrl = new URL(hasProtocol ? normalizedValue : `https://${normalizedValue}`);
		port = parsedUrl.port;
		if (!port && (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:")) port = new URL(`${parsedUrl.protocol === "http:" ? "https:" : "http:"}//${authorityAndPath}`).port;
	} catch {
		return null;
	}
	if (!port) return null;
	const parsedPort = Number(port);
	if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) throw new Error(`Invalid port in domain: ${value}`);
	return String(parsedPort);
}
function getDefaultActionPort(protocol) {
	return protocol === "https:" ? "443" : "80";
}
/**
* Validates client domain matches OpenAPI spec server URL domain (SSRF prevention).
* @param clientProvidedDomain - Domain from client (with/without protocol)
* @param specServerUrl - Server URL from OpenAPI spec
* @returns Validation result with normalized domains
*/
function validateActionDomain(clientProvidedDomain, specServerUrl) {
	try {
		/** Parsed spec URL */
		const specUrl = new URL(specServerUrl);
		if (specUrl.protocol !== "http:" && specUrl.protocol !== "https:") return {
			isValid: false,
			message: `Invalid protocol: Only HTTP and HTTPS are allowed, got ${specUrl.protocol}`
		};
		/** Spec hostname only */
		const specHostname = specUrl.hostname;
		const normalizedSpecDomain = isIP(specHostname) === 6 ? `${specUrl.protocol}//[${specHostname}]` : `${specUrl.protocol}//${specHostname}`;
		/** Extract hostname from client domain if it's a full URL */
		let clientHostname = clientProvidedDomain;
		let clientHasProtocol = false;
		const clientExplicitPort = getExplicitPort(clientProvidedDomain);
		if (clientProvidedDomain.includes("://")) {
			if (!clientProvidedDomain.startsWith("http://") && !clientProvidedDomain.startsWith("https://")) return {
				isValid: false,
				message: `Invalid protocol: Only HTTP and HTTPS are allowed in client domain`
			};
			try {
				clientHostname = new URL(clientProvidedDomain).hostname;
				clientHasProtocol = true;
			} catch {
				clientHasProtocol = false;
			}
		} else if (clientExplicitPort !== null) clientHostname = new URL(`https://${clientProvidedDomain}`).hostname;
		/** Normalize IPv6 addresses by removing brackets for comparison */
		const normalizedClientHostname = clientHostname.replace(/^\[(.+)\]$/, "$1");
		const normalizedSpecHostname = specHostname.replace(/^\[(.+)\]$/, "$1");
		/** Check if hostname is valid IP using cross-platform isIP */
		const isIPAddress = isIP(normalizedClientHostname) !== 0;
		/** Normalized client domain */
		let normalizedClientDomain;
		if (clientHasProtocol) normalizedClientDomain = extractDomainFromUrl(clientProvidedDomain);
		else if (isIPAddress) {
			const hostname = isIP(normalizedClientHostname) === 6 && !clientHostname.startsWith("[") ? `[${normalizedClientHostname}]` : clientHostname;
			normalizedClientDomain = `${specUrl.protocol}//${hostname}`;
		} else normalizedClientDomain = `https://${clientHostname}`;
		if (!(normalizedSpecDomain === normalizedClientDomain || !clientHasProtocol && isIPAddress && normalizedClientHostname === normalizedSpecHostname)) return {
			isValid: false,
			message: `Domain mismatch: Client provided '${clientProvidedDomain}', but spec uses '${specHostname}'`,
			normalizedSpecDomain,
			normalizedClientDomain
		};
		if (clientExplicitPort !== null) {
			const specEffectivePort = specUrl.port || getDefaultActionPort(specUrl.protocol);
			if (clientExplicitPort !== specEffectivePort) return {
				isValid: false,
				message: `Port mismatch: Client provided '${clientProvidedDomain}', but spec uses effective port '${specEffectivePort}'`,
				normalizedSpecDomain,
				normalizedClientDomain
			};
		}
		return {
			isValid: true,
			normalizedSpecDomain,
			normalizedClientDomain
		};
	} catch (error) {
		return {
			isValid: false,
			message: `Failed to validate domain: ${error instanceof Error ? error.message : "Unknown error"}`
		};
	}
}
/**
* Validates and parses an OpenAPI spec.
*/
function validateAndParseOpenAPISpec(specString) {
	try {
		let parsedSpec;
		try {
			parsedSpec = JSON.parse(specString);
		} catch {
			parsedSpec = load(specString);
		}
		if (!parsedSpec.servers || !Array.isArray(parsedSpec.servers) || parsedSpec.servers.length === 0) return {
			status: false,
			message: "Could not find a valid URL in `servers`"
		};
		if (!parsedSpec.servers[0].url) return {
			status: false,
			message: "Could not find a valid URL in `servers`"
		};
		const paths = parsedSpec.paths;
		if (!paths || typeof paths !== "object" || Object.keys(paths).length === 0) return {
			status: false,
			message: "No paths found in the OpenAPI spec."
		};
		const components = parsedSpec.components?.schemas || {};
		const messages = [];
		for (const [path, methods] of Object.entries(paths)) for (const [httpMethod, operation] of Object.entries(methods)) {
			const { responses } = operation;
			if (typeof operation === "object" && responses) for (const [statusCode, response] of Object.entries(responses)) {
				const content = response.content;
				if (content && content["application/json"] && content["application/json"].schema) {
					const schema = content["application/json"].schema;
					if ("$ref" in schema && typeof schema.$ref === "string") {
						const refName = schema.$ref.split("/").pop();
						if (refName && !components[refName]) messages.push(`In context=('paths', '${path}', '${httpMethod}', '${statusCode}', 'response', 'content', 'application/json', 'schema'), reference to unknown component ${refName}; using empty schema`);
					}
				}
			}
		}
		return {
			status: true,
			message: messages.join("\n") || "OpenAPI spec is valid.",
			spec: parsedSpec,
			serverUrl: parsedSpec.servers[0].url
		};
	} catch (error) {
		console.error(error);
		return {
			status: false,
			message: "Error parsing OpenAPI spec."
		};
	}
}
//#endregion
//#region src/createPayload.ts
/** Resolves the browser's IANA timezone so the server can localize prompt variables. */
function getUserTimezone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || void 0;
	} catch {
		return;
	}
}
function createPayload(submission) {
	const { isEdited, addedConvo, userMessage, isContinued, isTemporary, isRegenerate, compact, conversation, editedContent, ephemeralAgent, endpointOption, manualSkills, codeApprovalMode, codeEnvironmentMode, codeWorkspaces, clientRequestId, recoverySteerId, expectedPredecessorCreatedAt } = submission;
	const { conversationId } = tConvoUpdateSchema.parse(conversation);
	const { endpoint: _e, endpointType } = endpointOption;
	const endpoint = _e;
	/** Custom endpoint names are user-defined and may contain `/`, which would
	* otherwise split into extra path segments and miss the `/:endpoint` route. */
	let server = `${EndpointURLs["agents"]}/${encodeURIComponent(endpoint)}`;
	if (isAssistantsEndpoint(endpoint)) server = EndpointURLs[endpointType ?? endpoint] + (isEdited ? "/modify" : "");
	const payload = {
		...userMessage,
		...endpointOption,
		endpoint,
		addedConvo,
		isTemporary,
		/** A compaction borrows the regenerate shape client-side only: the server
		*  must see it as a compaction, never as a regenerated user turn. */
		isRegenerate: compact === true ? void 0 : isRegenerate,
		...compact === true && { compact: true },
		editedContent,
		conversationId,
		isContinued: !!(isEdited && isContinued),
		ephemeralAgent: isAssistantsEndpoint(endpoint) ? void 0 : ephemeralAgent,
		manualSkills: isAssistantsEndpoint(endpoint) ? void 0 : manualSkills,
		codeApprovalMode: isAssistantsEndpoint(endpoint) ? void 0 : codeApprovalMode,
		codeEnvironmentMode: isAssistantsEndpoint(endpoint) ? void 0 : codeEnvironmentMode,
		codeWorkspaces: isAssistantsEndpoint(endpoint) ? void 0 : codeWorkspaces,
		timezone: getUserTimezone(),
		clientRequestId,
		recoverySteerId,
		expectedPredecessorCreatedAt
	};
	return {
		server,
		payload
	};
}
//#endregion
//#region src/parameterSettings.ts
const baseDefinitions = {
	model: {
		key: "model",
		label: "com_ui_model",
		labelCode: true,
		type: "string",
		component: "dropdown",
		optionType: "model",
		selectPlaceholder: "com_ui_select_model",
		searchPlaceholder: "com_ui_select_search_model",
		searchPlaceholderCode: true,
		selectPlaceholderCode: true,
		columnSpan: 4
	},
	temperature: {
		key: "temperature",
		label: "com_endpoint_temperature",
		labelCode: true,
		description: "com_endpoint_openai_temp",
		descriptionCode: true,
		type: "number",
		component: "slider",
		optionType: "model",
		columnSpan: 4
	},
	topP: {
		key: "topP",
		label: "com_endpoint_top_p",
		labelCode: true,
		description: "com_endpoint_anthropic_topp",
		descriptionCode: true,
		type: "number",
		component: "slider",
		optionType: "model",
		columnSpan: 4
	},
	stop: {
		key: "stop",
		label: "com_endpoint_stop",
		labelCode: true,
		description: "com_endpoint_openai_stop",
		descriptionCode: true,
		placeholder: "com_endpoint_stop_placeholder",
		placeholderCode: true,
		type: "array",
		default: [],
		component: "tags",
		optionType: "conversation",
		minTags: 0,
		maxTags: 4
	}
};
const createDefinition = (base, overrides) => {
	return {
		...base,
		...overrides
	};
};
const librechat = {
	modelLabel: {
		key: "modelLabel",
		label: "com_endpoint_custom_name",
		labelCode: true,
		type: "string",
		default: "",
		component: "input",
		placeholder: "com_endpoint_openai_custom_name_placeholder",
		placeholderCode: true,
		optionType: "conversation"
	},
	maxContextTokens: {
		key: "maxContextTokens",
		label: "com_endpoint_context_tokens",
		labelCode: true,
		type: "number",
		component: "input",
		placeholder: "com_endpoint_default",
		placeholderCode: true,
		description: "com_endpoint_context_info",
		descriptionCode: true,
		optionType: "model",
		columnSpan: 2
	},
	resendFiles: {
		key: "resendFiles",
		label: "com_endpoint_plug_resend_files",
		labelCode: true,
		description: "com_endpoint_openai_resend_files",
		descriptionCode: true,
		type: "boolean",
		default: true,
		component: "switch",
		optionType: "conversation",
		showDefault: false,
		columnSpan: 2
	},
	promptPrefix: {
		key: "promptPrefix",
		label: "com_endpoint_prompt_prefix",
		labelCode: true,
		type: "string",
		default: "",
		component: "textarea",
		placeholder: "com_endpoint_openai_prompt_prefix_placeholder",
		placeholderCode: true,
		optionType: "model"
	},
	/** Controls how TerraMind encodes image content blocks, not a provider request
	* parameter — so it belongs to this group and is stripped from model options. */
	imageDetail: {
		key: "imageDetail",
		label: "com_endpoint_plug_image_detail",
		labelCode: true,
		description: "com_endpoint_openai_detail",
		descriptionCode: true,
		type: "enum",
		default: "auto",
		component: "slider",
		options: [
			"low",
			"auto",
			"high"
		],
		enumMappings: {
			["low"]: "com_ui_low",
			["auto"]: "com_ui_auto",
			["high"]: "com_ui_high"
		},
		optionType: "conversation",
		columnSpan: 2
	},
	fileTokenLimit: {
		key: "fileTokenLimit",
		label: "com_ui_file_token_limit",
		labelCode: true,
		description: "com_ui_file_token_limit_desc",
		descriptionCode: true,
		placeholder: "com_endpoint_default",
		placeholderCode: true,
		type: "number",
		component: "input",
		columnSpan: 2
	}
};
const openAIParams = {
	chatGptLabel: {
		...librechat.modelLabel,
		key: "chatGptLabel"
	},
	promptPrefix: librechat.promptPrefix,
	temperature: createDefinition(baseDefinitions.temperature, {
		default: openAISettings.temperature.default,
		range: {
			min: openAISettings.temperature.min,
			max: openAISettings.temperature.max,
			step: openAISettings.temperature.step
		}
	}),
	top_p: createDefinition(baseDefinitions.topP, {
		key: "top_p",
		default: openAISettings.top_p.default,
		range: {
			min: openAISettings.top_p.min,
			max: openAISettings.top_p.max,
			step: openAISettings.top_p.step
		}
	}),
	frequency_penalty: {
		key: "frequency_penalty",
		label: "com_endpoint_frequency_penalty",
		labelCode: true,
		description: "com_endpoint_openai_freq",
		descriptionCode: true,
		type: "number",
		default: openAISettings.frequency_penalty.default,
		range: {
			min: openAISettings.frequency_penalty.min,
			max: openAISettings.frequency_penalty.max,
			step: openAISettings.frequency_penalty.step
		},
		component: "slider",
		optionType: "model",
		columnSpan: 4
	},
	presence_penalty: {
		key: "presence_penalty",
		label: "com_endpoint_presence_penalty",
		labelCode: true,
		description: "com_endpoint_openai_pres",
		descriptionCode: true,
		type: "number",
		default: openAISettings.presence_penalty.default,
		range: {
			min: openAISettings.presence_penalty.min,
			max: openAISettings.presence_penalty.max,
			step: openAISettings.presence_penalty.step
		},
		component: "slider",
		optionType: "model",
		columnSpan: 4
	},
	max_tokens: {
		key: "max_tokens",
		label: "com_endpoint_max_output_tokens",
		labelCode: true,
		type: "number",
		component: "input",
		description: "com_endpoint_openai_max_tokens",
		descriptionCode: true,
		placeholder: "com_endpoint_default",
		placeholderCode: true,
		optionType: "model",
		columnSpan: 2
	},
	reasoning_effort: {
		key: "reasoning_effort",
		label: "com_endpoint_reasoning_effort",
		labelCode: true,
		description: "com_endpoint_openai_reasoning_effort",
		descriptionCode: true,
		type: "enum",
		default: "",
		component: "slider",
		options: [
			"",
			"none",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		enumMappings: {
			[""]: "com_ui_auto",
			["none"]: "com_ui_none",
			["minimal"]: "com_ui_minimal",
			["low"]: "com_ui_low",
			["medium"]: "com_ui_medium",
			["high"]: "com_ui_high",
			["xhigh"]: "com_ui_xhigh",
			["max"]: "com_ui_max"
		},
		optionType: "model",
		columnSpan: 4
	},
	useResponsesApi: {
		key: "useResponsesApi",
		label: "com_endpoint_use_responses_api",
		labelCode: true,
		description: "com_endpoint_openai_use_responses_api",
		descriptionCode: true,
		type: "boolean",
		default: false,
		component: "switch",
		optionType: "model",
		showDefault: false,
		columnSpan: 2
	},
	web_search: {
		key: "web_search",
		label: "com_ui_web_search",
		labelCode: true,
		description: "com_endpoint_openai_use_web_search",
		descriptionCode: true,
		type: "boolean",
		default: false,
		component: "switch",
		optionType: "model",
		showDefault: false,
		columnSpan: 2
	},
	reasoning_summary: {
		key: "reasoning_summary",
		label: "com_endpoint_reasoning_summary",
		labelCode: true,
		description: "com_endpoint_openai_reasoning_summary",
		descriptionCode: true,
		type: "enum",
		default: "",
		component: "slider",
		options: [
			"",
			"auto",
			"concise",
			"detailed"
		],
		enumMappings: {
			[""]: "com_ui_unset",
			["auto"]: "com_ui_auto",
			["concise"]: "com_ui_concise",
			["detailed"]: "com_ui_detailed"
		},
		optionType: "model",
		columnSpan: 4
	},
	reasoning_mode: {
		key: "reasoning_mode",
		label: "com_endpoint_reasoning_mode",
		labelCode: true,
		description: "com_endpoint_openai_reasoning_mode",
		descriptionCode: true,
		type: "enum",
		default: "",
		component: "slider",
		options: [
			"",
			"standard",
			"pro"
		],
		enumMappings: {
			[""]: "com_ui_unset",
			["standard"]: "com_ui_standard",
			["pro"]: "com_ui_pro"
		},
		optionType: "model",
		columnSpan: 4
	},
	reasoning_context: {
		key: "reasoning_context",
		label: "com_endpoint_reasoning_context",
		labelCode: true,
		description: "com_endpoint_openai_reasoning_context",
		descriptionCode: true,
		type: "enum",
		default: "",
		component: "slider",
		options: [
			"",
			"auto",
			"current_turn",
			"all_turns"
		],
		enumMappings: {
			[""]: "com_ui_unset",
			["auto"]: "com_ui_auto",
			["current_turn"]: "com_ui_current_turn",
			["all_turns"]: "com_ui_all_turns"
		},
		optionType: "model",
		columnSpan: 4
	},
	verbosity: {
		key: "verbosity",
		label: "com_endpoint_verbosity",
		labelCode: true,
		description: "com_endpoint_openai_verbosity",
		descriptionCode: true,
		type: "enum",
		default: "",
		component: "slider",
		options: [
			"",
			"low",
			"medium",
			"high"
		],
		enumMappings: {
			[""]: "com_ui_none",
			["low"]: "com_ui_low",
			["medium"]: "com_ui_medium",
			["high"]: "com_ui_high"
		},
		optionType: "model",
		columnSpan: 4
	},
	disableStreaming: {
		key: "disableStreaming",
		label: "com_endpoint_disable_streaming_label",
		labelCode: true,
		description: "com_endpoint_disable_streaming",
		descriptionCode: true,
		type: "boolean",
		default: false,
		component: "switch",
		optionType: "model",
		showDefault: false,
		columnSpan: 2
	}
};
const anthropic = {
	maxOutputTokens: {
		key: "maxOutputTokens",
		label: "com_endpoint_max_output_tokens",
		labelCode: true,
		type: "number",
		component: "input",
		description: "com_endpoint_anthropic_maxoutputtokens",
		descriptionCode: true,
		placeholder: "com_endpoint_default",
		placeholderCode: true,
		range: {
			min: anthropicSettings.maxOutputTokens.min,
			max: anthropicSettings.maxOutputTokens.max,
			step: anthropicSettings.maxOutputTokens.step
		},
		optionType: "model",
		columnSpan: 2
	},
	temperature: createDefinition(baseDefinitions.temperature, {
		default: anthropicSettings.temperature.default,
		range: {
			min: anthropicSettings.temperature.min,
			max: anthropicSettings.temperature.max,
			step: anthropicSettings.temperature.step
		}
	}),
	topP: createDefinition(baseDefinitions.topP, {
		default: anthropicSettings.topP.default,
		range: {
			min: anthropicSettings.topP.min,
			max: anthropicSettings.topP.max,
			step: anthropicSettings.topP.step
		}
	}),
	topK: {
		key: "topK",
		label: "com_endpoint_top_k",
		labelCode: true,
		description: "com_endpoint_anthropic_topk",
		descriptionCode: true,
		type: "number",
		default: anthropicSettings.topK.default,
		range: {
			min: anthropicSettings.topK.min,
			max: anthropicSettings.topK.max,
			step: anthropicSettings.topK.step
		},
		component: "slider",
		optionType: "model",
		columnSpan: 4
	},
	promptCache: {
		key: "promptCache",
		label: "com_endpoint_prompt_cache",
		labelCode: true,
		description: "com_endpoint_anthropic_prompt_cache",
		descriptionCode: true,
		type: "boolean",
		default: anthropicSettings.promptCache.default,
		component: "switch",
		optionType: "conversation",
		showDefault: false,
		columnSpan: 2
	},
	promptCacheTtl: {
		key: "promptCacheTtl",
		label: "com_endpoint_prompt_cache_ttl",
		labelCode: true,
		description: "com_endpoint_anthropic_prompt_cache_ttl",
		descriptionCode: true,
		type: "enum",
		default: anthropicSettings.promptCacheTtl.default,
		options: ["5m", "1h"],
		component: "combobox",
		optionType: "conversation",
		showDefault: false,
		selectPlaceholder: "com_endpoint_prompt_cache_ttl_default",
		selectPlaceholderCode: true,
		columnSpan: 2
	},
	thinking: {
		key: "thinking",
		label: "com_endpoint_thinking",
		labelCode: true,
		description: "com_endpoint_anthropic_thinking",
		descriptionCode: true,
		type: "boolean",
		default: anthropicSettings.thinking.default,
		component: "switch",
		optionType: "conversation",
		showDefault: false,
		columnSpan: 2
	},
	thinkingBudget: {
		key: "thinkingBudget",
		label: "com_endpoint_thinking_budget",
		labelCode: true,
		description: "com_endpoint_anthropic_thinking_budget",
		descriptionCode: true,
		type: "number",
		component: "input",
		default: anthropicSettings.thinkingBudget.default,
		range: {
			min: anthropicSettings.thinkingBudget.min,
			max: anthropicSettings.thinkingBudget.max,
			step: anthropicSettings.thinkingBudget.step
		},
		optionType: "conversation",
		columnSpan: 2
	},
	web_search: {
		key: "web_search",
		label: "com_ui_web_search",
		labelCode: true,
		description: "com_endpoint_anthropic_use_web_search",
		descriptionCode: true,
		type: "boolean",
		default: anthropicSettings.web_search.default,
		component: "switch",
		optionType: "conversation",
		showDefault: false,
		columnSpan: 2
	},
	effort: {
		key: "effort",
		label: "com_endpoint_effort",
		labelCode: true,
		description: "com_endpoint_anthropic_effort",
		descriptionCode: true,
		type: "enum",
		default: anthropicSettings.effort.default,
		component: "slider",
		options: anthropicSettings.effort.options,
		enumMappings: {
			[""]: "com_ui_auto",
			["low"]: "com_ui_low",
			["medium"]: "com_ui_medium",
			["high"]: "com_ui_high",
			["xhigh"]: "com_ui_xhigh",
			["max"]: "com_ui_max"
		},
		optionType: "model",
		columnSpan: 4
	},
	thinkingDisplay: {
		key: "thinkingDisplay",
		label: "com_endpoint_anthropic_thinking_display",
		labelCode: true,
		description: "com_endpoint_anthropic_thinking_display_desc",
		descriptionCode: true,
		type: "enum",
		default: anthropicSettings.thinkingDisplay.default,
		component: "slider",
		options: anthropicSettings.thinkingDisplay.options,
		enumMappings: {
			["auto"]: "com_ui_auto",
			["summarized"]: "com_ui_summarized",
			["omitted"]: "com_ui_omitted"
		},
		optionType: "model",
		columnSpan: 4
	}
};
const bedrock = {
	system: {
		key: "system",
		label: "com_endpoint_prompt_prefix",
		labelCode: true,
		type: "string",
		default: "",
		component: "textarea",
		placeholder: "com_endpoint_openai_prompt_prefix_placeholder",
		placeholderCode: true,
		optionType: "model"
	},
	region: {
		key: "region",
		type: "string",
		label: "com_ui_region",
		labelCode: true,
		component: "combobox",
		optionType: "conversation",
		selectPlaceholder: "com_ui_select_region",
		searchPlaceholder: "com_ui_select_search_region",
		searchPlaceholderCode: true,
		selectPlaceholderCode: true,
		columnSpan: 2
	},
	maxTokens: {
		key: "maxTokens",
		label: "com_endpoint_max_output_tokens",
		labelCode: true,
		type: "number",
		component: "input",
		description: "com_endpoint_anthropic_maxoutputtokens",
		descriptionCode: true,
		placeholder: "com_endpoint_default",
		placeholderCode: true,
		optionType: "model",
		columnSpan: 2
	},
	temperature: createDefinition(baseDefinitions.temperature, {
		default: 1,
		range: {
			min: 0,
			max: 1,
			step: .01
		}
	}),
	topK: createDefinition(anthropic.topK, { range: {
		min: 0,
		max: 500,
		step: 1
	} }),
	topP: createDefinition(baseDefinitions.topP, {
		default: .999,
		range: {
			min: 0,
			max: 1,
			step: .01
		}
	}),
	promptCache: {
		key: "promptCache",
		label: "com_endpoint_prompt_cache",
		labelCode: true,
		type: "boolean",
		description: "com_endpoint_anthropic_prompt_cache",
		descriptionCode: true,
		default: true,
		component: "switch",
		optionType: "conversation",
		showDefault: false,
		columnSpan: 2
	},
	promptCacheTtl: {
		key: "promptCacheTtl",
		label: "com_endpoint_prompt_cache_ttl",
		labelCode: true,
		description: "com_endpoint_anthropic_prompt_cache_ttl",
		descriptionCode: true,
		type: "enum",
		default: void 0,
		options: ["5m", "1h"],
		component: "combobox",
		optionType: "conversation",
		showDefault: false,
		selectPlaceholder: "com_endpoint_prompt_cache_ttl_default",
		selectPlaceholderCode: true,
		columnSpan: 2
	},
	reasoning_effort: {
		key: "reasoning_effort",
		label: "com_endpoint_reasoning_effort",
		labelCode: true,
		description: "com_endpoint_bedrock_reasoning_effort",
		descriptionCode: true,
		type: "enum",
		default: "",
		component: "slider",
		options: [
			"",
			"low",
			"medium",
			"high"
		],
		enumMappings: {
			[""]: "com_ui_off",
			["low"]: "com_ui_low",
			["medium"]: "com_ui_medium",
			["high"]: "com_ui_high"
		},
		optionType: "model",
		columnSpan: 4
	}
};
const mistral = {
	temperature: createDefinition(baseDefinitions.temperature, {
		default: .7,
		range: {
			min: 0,
			max: 1,
			step: .01
		}
	}),
	topP: createDefinition(baseDefinitions.topP, { range: {
		min: 0,
		max: 1,
		step: .01
	} })
};
const cohere = {
	temperature: createDefinition(baseDefinitions.temperature, {
		default: .3,
		range: {
			min: 0,
			max: 1,
			step: .01
		}
	}),
	topP: createDefinition(baseDefinitions.topP, {
		default: .75,
		range: {
			min: .01,
			max: .99,
			step: .01
		}
	})
};
const meta = {
	temperature: createDefinition(baseDefinitions.temperature, {
		default: .5,
		range: {
			min: 0,
			max: 1,
			step: .01
		}
	}),
	topP: createDefinition(baseDefinitions.topP, {
		default: .9,
		range: {
			min: 0,
			max: 1,
			step: .01
		}
	})
};
const google = {
	/** Bounds the hand-rolled editor enforced through InputNumber, and they stay
	*  scoped to this endpoint: the shared definition is rendered by every other
	*  endpoint, whose own context windows may fall outside them. */
	maxContextTokens: createDefinition(librechat.maxContextTokens, { range: {
		min: googleSettings.maxContextTokens.min,
		max: googleSettings.maxContextTokens.max,
		step: googleSettings.maxContextTokens.step
	} }),
	temperature: createDefinition(baseDefinitions.temperature, {
		default: googleSettings.temperature.default,
		range: {
			min: googleSettings.temperature.min,
			max: googleSettings.temperature.max,
			step: googleSettings.temperature.step
		}
	}),
	topP: createDefinition(baseDefinitions.topP, {
		default: googleSettings.topP.default,
		range: {
			min: googleSettings.topP.min,
			max: googleSettings.topP.max,
			step: googleSettings.topP.step
		}
	}),
	topK: {
		key: "topK",
		label: "com_endpoint_top_k",
		labelCode: true,
		description: "com_endpoint_google_topk",
		descriptionCode: true,
		type: "number",
		default: googleSettings.topK.default,
		range: {
			min: googleSettings.topK.min,
			max: googleSettings.topK.max,
			step: googleSettings.topK.step
		},
		component: "slider",
		optionType: "model",
		columnSpan: 4
	},
	maxOutputTokens: {
		key: "maxOutputTokens",
		label: "com_endpoint_max_output_tokens",
		labelCode: true,
		type: "number",
		component: "input",
		description: "com_endpoint_google_maxoutputtokens",
		descriptionCode: true,
		placeholder: "com_endpoint_default",
		placeholderCode: true,
		default: googleSettings.maxOutputTokens.default,
		range: {
			min: googleSettings.maxOutputTokens.min,
			max: googleSettings.maxOutputTokens.max,
			step: googleSettings.maxOutputTokens.step
		},
		optionType: "model",
		columnSpan: 2
	},
	thinking: {
		key: "thinking",
		label: "com_endpoint_thinking",
		labelCode: true,
		description: "com_endpoint_google_thinking",
		descriptionCode: true,
		type: "boolean",
		default: googleSettings.thinking.default,
		component: "switch",
		optionType: "conversation",
		showDefault: false,
		columnSpan: 2
	},
	thinkingBudget: {
		key: "thinkingBudget",
		label: "com_endpoint_thinking_budget",
		labelCode: true,
		description: "com_endpoint_google_thinking_budget",
		descriptionCode: true,
		placeholder: "com_ui_auto",
		placeholderCode: true,
		type: "number",
		component: "input",
		range: {
			min: googleSettings.thinkingBudget.min,
			max: googleSettings.thinkingBudget.max,
			step: googleSettings.thinkingBudget.step
		},
		optionType: "conversation",
		columnSpan: 2
	},
	thinkingLevel: {
		key: "thinkingLevel",
		label: "com_endpoint_thinking_level",
		labelCode: true,
		description: "com_endpoint_google_thinking_level",
		descriptionCode: true,
		type: "enum",
		default: "",
		component: "slider",
		options: [
			"",
			"minimal",
			"low",
			"medium",
			"high"
		],
		enumMappings: {
			[""]: "com_ui_auto",
			["minimal"]: "com_ui_minimal",
			["low"]: "com_ui_low",
			["medium"]: "com_ui_medium",
			["high"]: "com_ui_high"
		},
		optionType: "conversation",
		columnSpan: 4
	},
	web_search: {
		key: "web_search",
		label: "com_endpoint_use_search_grounding",
		labelCode: true,
		description: "com_endpoint_google_use_search_grounding",
		descriptionCode: true,
		type: "boolean",
		default: false,
		component: "switch",
		optionType: "model",
		showDefault: false,
		columnSpan: 2
	},
	url_context: {
		key: "url_context",
		label: "com_endpoint_use_url_context",
		labelCode: true,
		description: "com_endpoint_google_use_url_context",
		descriptionCode: true,
		type: "boolean",
		default: false,
		component: "switch",
		optionType: "model",
		showDefault: false,
		columnSpan: 2
	}
};
const googleConfig = [
	librechat.modelLabel,
	librechat.promptPrefix,
	google.maxContextTokens,
	google.maxOutputTokens,
	google.temperature,
	google.topP,
	google.topK,
	librechat.resendFiles,
	google.thinking,
	google.thinkingBudget,
	google.thinkingLevel,
	google.web_search,
	google.url_context,
	librechat.fileTokenLimit
];
const googleCol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	librechat.promptPrefix
];
const googleCol2 = [
	google.maxContextTokens,
	google.maxOutputTokens,
	google.temperature,
	google.topP,
	google.topK,
	librechat.resendFiles,
	google.thinking,
	google.thinkingBudget,
	google.thinkingLevel,
	google.web_search,
	google.url_context,
	librechat.fileTokenLimit
];
const openAI = [
	librechat.modelLabel,
	librechat.promptPrefix,
	librechat.maxContextTokens,
	openAIParams.max_tokens,
	openAIParams.temperature,
	openAIParams.top_p,
	openAIParams.frequency_penalty,
	openAIParams.presence_penalty,
	baseDefinitions.stop,
	librechat.resendFiles,
	librechat.imageDetail,
	openAIParams.web_search,
	openAIParams.reasoning_effort,
	openAIParams.useResponsesApi,
	openAIParams.reasoning_summary,
	openAIParams.reasoning_mode,
	openAIParams.reasoning_context,
	openAIParams.verbosity,
	openAIParams.disableStreaming,
	librechat.fileTokenLimit
];
const openRouter = [
	...openAI,
	anthropic.promptCache,
	anthropic.promptCacheTtl
];
const openAICol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	librechat.promptPrefix
];
const openAICol2 = [
	librechat.maxContextTokens,
	openAIParams.max_tokens,
	openAIParams.temperature,
	openAIParams.top_p,
	openAIParams.frequency_penalty,
	openAIParams.presence_penalty,
	baseDefinitions.stop,
	librechat.resendFiles,
	librechat.imageDetail,
	openAIParams.reasoning_effort,
	openAIParams.reasoning_summary,
	openAIParams.reasoning_mode,
	openAIParams.reasoning_context,
	openAIParams.verbosity,
	openAIParams.useResponsesApi,
	openAIParams.web_search,
	openAIParams.disableStreaming,
	librechat.fileTokenLimit
];
const anthropicConfig = [
	librechat.modelLabel,
	librechat.promptPrefix,
	librechat.maxContextTokens,
	anthropic.maxOutputTokens,
	anthropic.temperature,
	anthropic.topP,
	anthropic.topK,
	librechat.resendFiles,
	anthropic.promptCache,
	anthropic.promptCacheTtl,
	anthropic.thinking,
	anthropic.thinkingBudget,
	anthropic.effort,
	anthropic.thinkingDisplay,
	anthropic.web_search,
	librechat.fileTokenLimit
];
const anthropicCol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	librechat.promptPrefix
];
const anthropicCol2 = [
	librechat.maxContextTokens,
	anthropic.maxOutputTokens,
	anthropic.temperature,
	anthropic.topP,
	anthropic.topK,
	librechat.resendFiles,
	anthropic.promptCache,
	anthropic.promptCacheTtl,
	anthropic.thinking,
	anthropic.thinkingBudget,
	anthropic.effort,
	anthropic.thinkingDisplay,
	anthropic.web_search,
	librechat.fileTokenLimit
];
const bedrockAnthropic = [
	librechat.modelLabel,
	bedrock.system,
	librechat.maxContextTokens,
	bedrock.maxTokens,
	bedrock.temperature,
	bedrock.topP,
	bedrock.topK,
	baseDefinitions.stop,
	librechat.resendFiles,
	bedrock.region,
	bedrock.promptCache,
	bedrock.promptCacheTtl,
	anthropic.thinking,
	anthropic.thinkingBudget,
	anthropic.effort,
	anthropic.thinkingDisplay,
	librechat.fileTokenLimit
];
const bedrockMistral = [
	librechat.modelLabel,
	librechat.promptPrefix,
	librechat.maxContextTokens,
	bedrock.maxTokens,
	mistral.temperature,
	mistral.topP,
	librechat.resendFiles,
	bedrock.region,
	librechat.fileTokenLimit
];
const bedrockCohere = [
	librechat.modelLabel,
	librechat.promptPrefix,
	librechat.maxContextTokens,
	bedrock.maxTokens,
	cohere.temperature,
	cohere.topP,
	librechat.resendFiles,
	bedrock.region,
	librechat.fileTokenLimit
];
const bedrockGeneral = [
	librechat.modelLabel,
	librechat.promptPrefix,
	librechat.maxContextTokens,
	meta.temperature,
	meta.topP,
	librechat.resendFiles,
	bedrock.region,
	bedrock.promptCache,
	bedrock.promptCacheTtl,
	librechat.fileTokenLimit
];
const bedrockAnthropicCol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	bedrock.system,
	baseDefinitions.stop
];
const bedrockAnthropicCol2 = [
	librechat.maxContextTokens,
	bedrock.maxTokens,
	bedrock.temperature,
	bedrock.topP,
	bedrock.topK,
	librechat.resendFiles,
	bedrock.region,
	bedrock.promptCache,
	bedrock.promptCacheTtl,
	anthropic.thinking,
	anthropic.thinkingBudget,
	anthropic.effort,
	anthropic.thinkingDisplay,
	librechat.fileTokenLimit
];
const bedrockMistralCol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	librechat.promptPrefix
];
const bedrockMistralCol2 = [
	librechat.maxContextTokens,
	bedrock.maxTokens,
	mistral.temperature,
	mistral.topP,
	librechat.resendFiles,
	bedrock.region,
	librechat.fileTokenLimit
];
const bedrockCohereCol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	librechat.promptPrefix
];
const bedrockCohereCol2 = [
	librechat.maxContextTokens,
	bedrock.maxTokens,
	cohere.temperature,
	cohere.topP,
	librechat.resendFiles,
	bedrock.region,
	librechat.fileTokenLimit
];
const bedrockGeneralCol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	librechat.promptPrefix
];
const bedrockGeneralCol2 = [
	librechat.maxContextTokens,
	meta.temperature,
	meta.topP,
	librechat.resendFiles,
	bedrock.region,
	bedrock.promptCache,
	bedrock.promptCacheTtl,
	librechat.fileTokenLimit
];
const bedrockZAI = [
	librechat.modelLabel,
	librechat.promptPrefix,
	librechat.maxContextTokens,
	meta.temperature,
	meta.topP,
	librechat.resendFiles,
	bedrock.region,
	bedrock.reasoning_effort,
	librechat.fileTokenLimit
];
const bedrockZAICol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	librechat.promptPrefix
];
const bedrockZAICol2 = [
	librechat.maxContextTokens,
	meta.temperature,
	meta.topP,
	librechat.resendFiles,
	bedrock.region,
	bedrock.reasoning_effort,
	librechat.fileTokenLimit
];
const bedrockMoonshot = [
	librechat.modelLabel,
	bedrock.system,
	librechat.maxContextTokens,
	createDefinition(bedrock.maxTokens, { default: 16384 }),
	bedrock.temperature,
	bedrock.topP,
	baseDefinitions.stop,
	librechat.resendFiles,
	bedrock.region,
	bedrock.reasoning_effort,
	librechat.fileTokenLimit
];
const bedrockMoonshotCol1 = [
	baseDefinitions.model,
	librechat.modelLabel,
	bedrock.system,
	baseDefinitions.stop
];
const bedrockMoonshotCol2 = [
	librechat.maxContextTokens,
	createDefinition(bedrock.maxTokens, { default: 16384 }),
	bedrock.temperature,
	bedrock.topP,
	librechat.resendFiles,
	bedrock.region,
	bedrock.reasoning_effort,
	librechat.fileTokenLimit
];
const paramSettings = {
	["openAI"]: openAI,
	["azureOpenAI"]: openAI,
	["custom"]: openAI,
	["openrouter"]: openRouter,
	["anthropic"]: anthropicConfig,
	[`bedrock-anthropic`]: bedrockAnthropic,
	[`bedrock-mistral`]: bedrockMistral,
	[`bedrock-cohere`]: bedrockCohere,
	[`bedrock-meta`]: bedrockGeneral,
	[`bedrock-ai21`]: bedrockGeneral,
	[`bedrock-amazon`]: bedrockGeneral,
	[`bedrock-deepseek`]: bedrockGeneral,
	[`bedrock-moonshot`]: bedrockMoonshot,
	[`bedrock-moonshotai`]: bedrockMoonshot,
	[`bedrock-openai`]: bedrockGeneral,
	[`bedrock-zai`]: bedrockZAI,
	["google"]: googleConfig
};
/**
* Maps effective backend param names for OpenAI-compatible/Azure endpoints (as deleted from
* `llmConfig` via `dropParams`, e.g. `maxTokens`) to their corresponding UI/conversation keys
* (e.g. `max_tokens`). Native providers (anthropic, google, bedrock, ...) already render these
* same camelCase names as their UI key (e.g. `topP`), so this alias must only be applied to
* OpenAI-compatible parameter sets — see `resolveDropParamsUIKeys`.
*/
const dropParamsBackendToUIKey = {
	maxTokens: "max_tokens",
	topP: "top_p",
	frequencyPenalty: "frequency_penalty",
	presencePenalty: "presence_penalty"
};
/** Endpoint keys whose parameter settings render the OpenAI-compatible (snake_case) UI keys. */
const openAILikeParamEndpointKeys = new Set([
	"openAI",
	"azureOpenAI",
	"custom",
	"openrouter"
]);
/**
* Normalizes an admin-configured `dropParams` list into the UI/conversation keys used to hide
* the matching controls in the settings panels. `endpointKey` should be the same key used to
* resolve the panel's parameter settings (e.g. `overriddenEndpointKey`); the backend-name alias
* is only applied for OpenAI-compatible endpoints, since native providers (anthropic, google,
* bedrock, ...) already use these backend names as their UI key.
*/
function resolveDropParamsUIKeys(dropParams, endpointKey) {
	if (!dropParams || dropParams.length === 0) return /* @__PURE__ */ new Set();
	if (!openAILikeParamEndpointKeys.has(endpointKey)) return new Set(dropParams);
	return new Set(dropParams.map((param) => dropParamsBackendToUIKey[param] ?? param));
}
const openAIColumns = {
	col1: openAICol1,
	col2: openAICol2
};
const bedrockGeneralColumns = {
	col1: bedrockGeneralCol1,
	col2: bedrockGeneralCol2
};
const presetSettings = {
	["openAI"]: openAIColumns,
	["azureOpenAI"]: openAIColumns,
	["custom"]: openAIColumns,
	["openrouter"]: {
		col1: openAICol1,
		col2: [
			...openAICol2,
			anthropic.promptCache,
			anthropic.promptCacheTtl
		]
	},
	["anthropic"]: {
		col1: anthropicCol1,
		col2: anthropicCol2
	},
	[`bedrock-anthropic`]: {
		col1: bedrockAnthropicCol1,
		col2: bedrockAnthropicCol2
	},
	[`bedrock-mistral`]: {
		col1: bedrockMistralCol1,
		col2: bedrockMistralCol2
	},
	[`bedrock-cohere`]: {
		col1: bedrockCohereCol1,
		col2: bedrockCohereCol2
	},
	[`bedrock-meta`]: bedrockGeneralColumns,
	[`bedrock-ai21`]: bedrockGeneralColumns,
	[`bedrock-amazon`]: bedrockGeneralColumns,
	[`bedrock-deepseek`]: bedrockGeneralColumns,
	[`bedrock-moonshot`]: {
		col1: bedrockMoonshotCol1,
		col2: bedrockMoonshotCol2
	},
	[`bedrock-moonshotai`]: {
		col1: bedrockMoonshotCol1,
		col2: bedrockMoonshotCol2
	},
	[`bedrock-openai`]: bedrockGeneralColumns,
	[`bedrock-zai`]: {
		col1: bedrockZAICol1,
		col2: bedrockZAICol2
	},
	["google"]: {
		col1: googleCol1,
		col2: googleCol2
	}
};
const agentParamSettings = Object.entries(presetSettings).reduce((acc, [key, value]) => {
	if (value) acc[key] = value.col2;
	return acc;
}, {});
/**
* Resolves model-aware defaults for a settings configuration before rendering.
* Google's `maxOutputTokens` default depends on the selected Gemini model so that
* current models (2.5 and 3+) surface their 64K output limit instead of the legacy 8K value.
* Anthropic prompt-cache controls are only surfaced for models that support them.
*/
function applyModelAwareDefaults(settings, endpoint, model) {
	if (!model) return settings;
	const modelAwareSettings = endpoint === "google" ? settings.map((setting) => {
		if (setting.key === "maxOutputTokens") return {
			...setting,
			default: googleSettings.maxOutputTokens.reset(model)
		};
		/** The shared thinking budget range is model-agnostic, so it caps Pro below
		*  its real ceiling and accepts Flash values the provider rejects. The
		*  maximum and the positive floor move together. `range.min` stays -1 so
		*  the "decide automatically" sentinel remains typeable. */
		if (setting.key === "thinkingBudget" && setting.range != null) {
			const bounds = getGoogleThinkingBudgetBounds(model);
			if (bounds != null) return {
				...setting,
				range: {
					...setting.range,
					max: bounds.max,
					positiveMin: bounds.min,
					modelSpecific: true
				}
			};
		}
		return setting;
	}) : settings;
	if (endpoint !== "anthropic" || supportsPromptCache(model)) return modelAwareSettings;
	return modelAwareSettings.filter((setting) => setting.key !== "promptCache" && setting.key !== "promptCacheTtl");
}
//#endregion
//#region src/agentToolOptions.ts
const actionDomainSeparatorRegex = /* @__PURE__ */ new RegExp("---", "g");
/**
* Collapses the encoded-domain suffix of an action tool name to the shape used
* by runtime tool definitions. The operation id is deliberately preserved.
*/
function normalizeActionToolName(toolName) {
	if (!isActionTool(toolName)) return toolName;
	const prefixEnd = toolName.lastIndexOf(actionDelimiter) + actionDelimiter.length;
	const encodedDomain = toolName.slice(prefixEnd);
	return toolName.slice(0, prefixEnd) + encodedDomain.replace(actionDomainSeparatorRegex, "_");
}
/**
* Removes Code Interpreter as an allowed caller without mutating the input.
* Tool entries and unrelated options are preserved; an empty entry is removed.
*/
function removeCodeExecutionCaller(toolOptions) {
	if (toolOptions == null) return toolOptions;
	const normalized = {};
	for (const [toolName, options] of Object.entries(toolOptions)) {
		const callers = options.allowed_callers;
		if (callers?.includes("code_execution") !== true) {
			normalized[toolName] = options;
			continue;
		}
		const allowedCallers = callers.filter((caller) => caller !== "code_execution");
		const { allowed_callers: _removed, ...remainingOptions } = options;
		const nextOptions = allowedCallers.length > 0 ? {
			...remainingOptions,
			allowed_callers: allowedCallers
		} : remainingOptions;
		if (Object.keys(nextOptions).length > 0) normalized[toolName] = nextOptions;
	}
	return normalized;
}
//#endregion
//#region src/codeEnvRef.ts
/**
* Closed set of resource kinds for sandbox file caching. Defined as a
* `as const` tuple so the runtime list and the TypeScript union can't
* drift on future additions — adding a new kind to the tuple updates
* both at once.
*
* - `skill`: shared per skill identity. Cross-user-within-tenant
*   sharing. Code API sessionKey omits the user dimension.
*   `version` is required (the skill's monotonic counter scopes the
*   cache per revision so any edit invalidates the prior cache
*   entry naturally).
* - `agent`: shared per agent identity. Same sharing semantic as
*   skills (agents are addressable resources accessible to a
*   permission-defined audience).
* - `user`: user-private. Code API sessionKey is keyed by the
*   requesting user from auth context. Used for chat attachments
*   and code-output artifacts.
*/
const CODE_ENV_KINDS = [
	"skill",
	"agent",
	"user"
];
function getCodeEnvRefForProfile(refs, routeKey) {
	const profileRef = refs?.codeEnvRefs?.[routeKey];
	if (profileRef) return profileRef;
	const legacyRef = refs?.codeEnvRef;
	if (legacyRef && (legacyRef.executionRouteKey ?? legacyRef.executionProfile ?? "default") === routeKey) return legacyRef;
}
/** Adds one profile pointer without discarding the other profile's storage object. */
function mergeCodeEnvRef(refs, ref) {
	const codeEnvRefs = { ...refs?.codeEnvRefs };
	const legacyRef = refs?.codeEnvRef;
	if (legacyRef) codeEnvRefs[legacyRef.executionRouteKey ?? legacyRef.executionProfile ?? "default"] ??= legacyRef;
	const routeKey = ref.executionRouteKey ?? ref.executionProfile ?? "default";
	codeEnvRefs[routeKey] = ref;
	return {
		codeEnvRef: codeEnvRefs.default ?? codeEnvRefs.stateful ?? ref,
		codeEnvRefs
	};
}
/** Enumerates every deployment-local pointer, including legacy single-pointer records. */
function getCodeEnvRefs(refs) {
	const merged = { ...refs?.codeEnvRefs };
	const legacyRef = refs?.codeEnvRef;
	if (legacyRef) merged[legacyRef.executionRouteKey ?? legacyRef.executionProfile ?? "default"] ??= legacyRef;
	return Object.entries(merged).flatMap(([routeKey, ref]) => ref ? [[routeKey, ref]] : []);
}
//#endregion
//#region src/code/worker.ts
function isCodeWorkerShell(value) {
	return value === "posix" || value === "powershell";
}
function quotePosix(value) {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}
function quotePowerShell(value) {
	return `'${value.replace(/'/g, "''")}'`;
}
function createCodeWorkerSetupCommand(pairing, shell, options = {}) {
	const quote = shell === "powershell" ? quotePowerShell : quotePosix;
	const pair = `librechat-code pair ${quote(pairing.endpoint)} ${quote(pairing.code)} --worker-id ${quote(pairing.workerId)}`;
	const run = ["librechat-code run", ...[
		options.defaultWorkspace === false ? null : "--default-workspace",
		options.allowWorkspaceWrites === true ? "--allow-workspace-writes" : null,
		options.allowWorkspaceCommands === true ? "--allow-workspace-commands" : null
	].filter((value) => value != null)].join(" ");
	if (shell === "powershell") return `${pair}\n$env:LIBRECHAT_CODE_WORKER_ID = ${quote(pairing.workerId)}\n${run}`;
	return `${pair}\nLIBRECHAT_CODE_WORKER_ID=${quote(pairing.workerId)} ${run}`;
}
//#endregion
export { ACTION_METADATA_FILTER_FIELDS, AGENT_INSTRUCTION_FILTER_FIELDS, AUTH_USER_DOC_BY_ID_PREFIX, AccessRoleIds, ActionRequest, ActivityLabelEvents, AgentCapabilities, AnnotationTypes, AnthropicEffort, ApprovalEvents, ArtifactModes, AssistantStreamEvents, AuthKeys, AuthType, AuthTypeEnum, AuthorizationTypeEnum, BASE_ONLY_CONFIG_SECTIONS, BASE_PRINCIPAL_CONFIG_SECTIONS, BEDROCK_FINE_GRAINED_TOOL_STREAMING_BETA, BEDROCK_OUTPUT_128K_BETA, BedrockProviders, BedrockReasoningConfig, CODE_APPROVAL_MODES, CODE_ENVIRONMENT_COMMAND_TIMEOUT_DEFAULT_MS, CODE_ENVIRONMENT_COMMAND_TIMEOUT_HARD_MAX_MS, CODE_ENVIRONMENT_DECISION_VERSION, CODE_ENVIRONMENT_MODES, CODE_ENVIRONMENT_MOVE_VERSION, CODE_ENV_KINDS, CODE_WORKSPACE_ID_PATTERN, CODE_WORKSPACE_MAX_COUNT, CODE_WORKSPACE_OPERATIONS, CODE_WORKSPACE_SELECTION_ERROR_REASONS, CONVERSATION_STARTER_FILTER_FIELDS, CONVERSATION_TITLE_FILTER_FIELDS, CacheKeys, Capabilities, CodeApprovalModeError, CohereConstants, ComponentTypes, Constants, ContentTypes, DATE_RANGE, DEFAULT_BALANCE_RESERVATION_TTL_MS, DEFAULT_MAX_RETAINED_TOOL_COUNT_CHARS, DEFAULT_MEMORY_MAX_INPUT_TOKENS, DEFAULT_OAUTH_STATE_TTL_MS, DEFAULT_RETAINED_ANSWER_TOKENS, DefaultLLMDeliveryPath, DynamicQueryKeys, EImageOutputType, EModelEndpoint, EToolResources, EndpointURLs, ErrorTypes, FEEDBACK_FILTER_FIELDS, FEEDBACK_RATINGS, FEEDBACK_REASON_KEYS, FEEDBACK_TAGS, FILE_FILTER_FIELDS, FILTER_PII_STARTER_PATTERNS, FetchTokenConfig, FileContext, FilePurpose, FileSources, ForkOptions, FunctionSignature, HITL_MESSAGE_FILTER_FIELDS, INSIGHTS_AGENT_ID_MAX_LENGTH, INSIGHTS_MAX_RANGE_DAYS, INSIGHTS_SEARCH_MAX_LENGTH, INSIGHTS_SEARCH_MIN_LENGTH, INTERFACE_PERMISSION_FIELDS, ImageDetail, ImageDetailCost, ImageVisionTool, InfiniteCollections, InvocationMode, KnownEndpoints, LANGFUSE_TRACE_CONVERSATION_METADATA_FIELDS, LANGFUSE_TRACE_USER_ID_FIELDS, LANGFUSE_TRACE_USER_METADATA_FIELDS, LocalStorageKeys, MAX_CHAT_PROJECT_DESCRIPTION_LENGTH, MAX_CHAT_PROJECT_NAME_LENGTH, MAX_GRAPH_SUBAGENT_MEMBERS, MAX_MCP_ICON_PATH_LENGTH, MAX_PII_CUSTOM_PATTERNS_TOTAL, MAX_PII_CUSTOM_REGEX_CHARACTERS, MAX_PII_CUSTOM_REGEX_INSTRUCTIONS, MAX_PII_PATTERNS_PER_SOURCE, MAX_PII_PATTERN_ID_LENGTH, MAX_PII_PATTERN_LABEL_LENGTH, MAX_PII_PATTERN_LENGTH, MAX_SUBAGENTS, MAX_SUBAGENTS_CEILING, MAX_SUBAGENT_DEPTH, MAX_SUBAGENT_GRAPH_NODES, MAX_SUBAGENT_RUN_CONFIGS, MCPOptionsSchema, MCPServerUserInputSchema, MCPServersSchema, MCP_SERVER_TITLE_ERROR, MCP_SERVER_TITLE_PATTERN, MCP_USER_INPUT_FIELDS, MEMORY_FILTER_FIELDS, MESSAGE_FILTER_FIELDS, MIN_BALANCE_RESERVATION_TTL_MS, MIN_REPORTABLE_RUN_STEP_DURATION_MS, MODEL_PARAMETER_FILTER_FIELDS, MYTHOS_CLASS_FAMILIES, MemoryScope, MessageContentTypes, MutationKeys, OCRStrategy, OptionTypes, PERMISSION_SUB_KEYS, PERMISSION_TYPE_INTERFACE_FIELDS, PROMPT_FILTER_FIELDS, PermissionBits, PermissionTypes, Permissions, PrincipalModel, PrincipalType, ProviderId, Providers, QueryKeys, REFILL_INTERVAL_UNITS, RUNTIME_CONFIG_INTERFACE_FIELDS, RateLimitPrefix, ReasoningContext, ReasoningEffort, ReasoningLabelEvents, ReasoningMode, ReasoningParameterFormat, ReasoningResponseKey, ReasoningSummary, RerankerTypes, ResourceType, RetentionMode, RunStatus, SCHEDULE_CRON_MAX_LENGTH, SEPARATORS, SKILL_BODY_MAX_LENGTH, SKILL_DESCRIPTION_MAX_LENGTH, SKILL_DESCRIPTION_SHORT_THRESHOLD, SKILL_DISPLAY_TITLE_MAX_LENGTH, SKILL_FILTER_FIELDS, SKILL_NAME_MAX_LENGTH, SKILL_NAME_PATTERN, SKILL_SYNC_DEFAULT_DISCOVERY_DEPTH, SKILL_SYNC_MAX_DISCOVERY_DEPTH, SKILL_SYNC_MAX_INTERVAL_MINUTES, SKILL_SYNC_MIN_INTERVAL_MINUTES, SSEOptionsSchema, STATEFUL_CODE_ENVIRONMENTS, STORED_MESSAGE_FILTER_FIELDS, STTProviders, SVG_SANITIZE_CONFIG, SYSTEM_LLM_DELIVERY_DEFAULTS, SafeSearchTypes, ScraperProviders, SearchCategories, SearchProviders, SettingTypes, SettingsTabValues, SettingsViews, SkillsScope, StdioOptionsSchema, SteerEvents, StepEvents, StepStatus, StepTypes, StreamableHTTPOptionsSchema, SystemCategories, SystemRoles, TOOL_ARGUMENT_FILTER_FIELDS, TRACE_CURSOR_MAX_LENGTH, TRACE_RECORD_ID_MAX_LENGTH, TRACE_SOURCE_ID_MAX_LENGTH, TTSProviders, ThinkingDisplay, ThinkingLevel, Time, TokenExchangeMethodEnum, ToolCallTypes, Tools, UsageEvents, Verbosity, ViolationTypes, VisionModes, WebSocketOptionsSchema, accessRoleSchema, accessRoleToPermBits, accordian, actionDelimiter, actionDomainSeparator, actionMetadataFilterFieldSchema, agentGitIdentitySchema, agentInstructionFilterFieldSchema, agentParamSettings, agentPermissionsSchema, agentQueuedTurnCapabilitySchema, agentQueuedTurnDurability, agentQueuedTurnFileRefSchema, agentQueuedTurnReceiptSchema, agentQueuedTurnStatuses, agentsBaseSchema, agentsEndpointSchema, agentsSchema, agentsSettings, alert, alertDialog, allowedAddressesSchema, alternateName, anthropicBaseSchema, anthropicEndpointSchema, anthropicSchema, anthropicSettings, apiBaseUrl, appendAgentIdSuffix, applicationMimeTypes, applyModelAwareDefaults, askUserQuestionConfigSchema, askUserQuestionRetainedAnswersSchema, assistantEndpointSchema, assistantSchema, audioMimeTypes, authTypeSchema, avatar, azureBaseSchema, azureEndpointSchema, azureGroupConfigsSchema, azureGroupSchema, badge, balanceSchema, baseEndpointSchema, bedrockDocumentExtensions, bedrockDocumentFormats, bedrockDocumentMimeTypes, bedrockEndpointSchema, bedrockGuardrailConfigSchema, bedrockInputParser, bedrockInputSchema, bedrockModels, bedrockOutputParser, bookmarkPermissionsSchema, breadcrumb, buildLoginRedirectUrl, buildServerNameAliases, buildTree, button, cacheSubsetProviders, cadenceIntervalMinutes, cadenceToCron, calendar, canToolResourceConsume, cancelAgentQueuedTurnResponseSchema, cancelAgentQueuedTurnSchema, capsEffortWhenThinkingDisabled, card, carousel, checkOpenAIStorage, checkbox, checkpointerSchema, checkpointerTypeSchema, clampEffortForDisabledThinking, clampOutputConfigEffort, clampSettingRange, cloudfrontConfigSchema, codeEnvironmentPermissionDecisionSchema, codeEnvironmentUserConfigSchema, codeEnvironmentUserSettingsSchema, codeInterpreterMimeTypes, codeInterpreterMimeTypesList, codeTypeMapping, coerceNumber, collapsible, compactAgentsBaseSchema, compactAgentsSchema, compactAssistantSchema, compactGoogleSchema, configSchema, contextPruningSchema, conversationStarterFilterFieldSchema, conversationTitleFilterFieldSchema, convertStringsToRegex, createCodeWorkerSetupCommand, createPayload, createSchedulePayloadSchema, createURL, cronCadenceSchema, data_service_exports as dataService, defaultAgentCapabilities, defaultAgentFormValues, defaultAssistantFormValues, defaultAssistantsVersion, defaultEndpoints, defaultLLMDeliveryPathSchema, defaultModels, defaultOCRMimeTypes, defaultOrderQuery, defaultRetrievalModels, defaultSTTMimeTypes, defaultSocialLogins, defaultTextMimeTypes, dialog, documentParserMimeTypes, documentSupportedProviders, drawer, dropdownMenu, eAnthropicEffortSchema, eImageDetailSchema, eModelEndpointSchema, eReasoningContextSchema, eReasoningEffortSchema, eReasoningModeSchema, eReasoningParameterFormatSchema, eReasoningResponseKeySchema, eReasoningSummarySchema, eThinkingDisplaySchema, eThinkingLevelSchema, eVerbositySchema, effectivePermissionsResponseSchema, encodeEphemeralAgentId, endpointFileConfigSchema, endpointSchema, endpointSettings, endpointToProvider, enqueueAgentQueuedTurnResponseSchema, enqueueAgentQueuedTurnSchema, envVarRegex, errorsToString, essentialShadcnComponents, excelFileTypes, excelMimeTypes, excludedKeys, extendedModelEndpointSchema, extractDomainFromUrl, extractEnvVariable, extractVariableName, feedbackFilterFieldSchema, feedbackRatingSchema, feedbackSchema, feedbackTagKeySchema, fileCitationsPermissionsSchema, fileConfig, fileConfigSchema, fileFilterFieldSchema, fileSearchPermissionsSchema, fileSourceSchema, fileStorageSchema, fileStrategiesSchema, filterPiiActionSchema, filterPiiCustomPatternSchema, filterPiiRegexSchema, filterPiiStarterPatternSchema, filtersConfigSchema, finalizeSvgMarkup, findLastSeparatorIndex, findMessageById, fullMimeTypesList, generateDynamicSchema, generateGoogleSchema, generateOpenAISchema, getAllowedCodeApprovalModes, getCodeEnvRefForProfile, getCodeEnvRefs, getConfigDefaults, getConfiguredMimeAccept, getCustomEndpointProvider, getDefaultParamsEndpoint, getDocumentFileExtension, getEnabledEndpoints, getEndpointField, getEndpointFileConfig, getEphemeralSender, getFirstDefinedValue, getGoogleThinkingBudgetBounds, getGoogleThinkingBudgetMax, getMaxSubagents, getModelKey, getNonEmptyValue, getPiiRegexProgramSize, getRefillEligibilityDate, getResourcePermissionsResponseSchema, getResponseSender, getRunStepDurationMs, getScheduleMCPDisabledReason, getSchemaDefaults, getSettingsKeys, getTagByKey, getTagsForRating, getTokenHeader, googleBaseSchema, googleGenConfigSchema, googleSchema, googleSettings, hasActiveFiltersConfig, hasActivePiiFields, hasActivePiiPatterns, hasConfiguredFooter, hasInferredLLMDeliveryPath, hasPermissions, hasProcessMCPServerConfig, hasTextExtractionPath, hasToolCallErrorPrefix, hasTurnFileConsumer, hostImageIdSuffix, hostImageNamePrefix, hoverCard, imageDetailNumeric, imageDetailValue, imageExtRegex, imageGenTools, imageMimeTypes, imageTypeMapping, inferMimeType, initialModelsConfig, input, inputTokensIncludesCache, interfaceSchema, isActionTool, isAgentsEndpoint, isAnthropicDocumentType, isAnthropicTextDocumentType, isAssistantsEndpoint, isBedrockDocumentType, isCodeEnvironmentMode, isCodeWorkerShell, isCodeWorkspaceEnvironment, isCodeWorkspaceSelection, isCodeWorkspaceSelectionErrorReason, isCodeWorkspaceSelections, isCompactedLeaf, isConfiguredSender, isCronCadence, isDocumentSupportedProvider, isEphemeralAgentId, isExplicitMimeConfig, isImageVisionTool, isKnownProviderIdentifier, isMediaSupportedProvider, isMessageFileUpload, isMythosClassModel, isNativelyReadableText, isOpenAILikeProvider, isParamEndpoint, isPermissiveMimeConfig, isProcessMCPServerConfig, isProcessMCPServerField, isRemoteOidcUrlAllowed, isReportableRunStepDuration, isResponsesApiUpload, isSecureCodeEnvironmentControlURL, isSensitiveEnvVar, isSpeechProviderConfigured, isSystemRoleName, isThinkingDisabled, isUUID, isUserInitiatedCompaction, isValidCronExpression, knownEndpointToProvider, label, langfuseConfigSchema, langfuseTraceConfigSchema, librechat, listAgentQueuedTurnsResponseSchema, listAgentQueuedTurnsSchema, listConfiguredSpeechProviders, loginPage, mapGroupToAzureConfig, mapModelToAzureConfig, marketplacePermissionsSchema, materializeModelSpecEndpoints, mbToBytes, mcpRefreshDefaults, mcpServersPermissionsSchema, mediaSupportedProviders, megabyte, memoryFilterFieldSchema, memoryPermissionsSchema, memorySchema, menuBar, mergeCodeEnvRef, mergeFileConfig, messageFilterFieldSchema, messageFilterPiiSchema, messageFilterSchema, mimeTypeAliases, modelConfigSchema, modelParameterFilterFieldSchema, modelSpecSubagentsSchema, modularEndpoints, multiConvoPermissionsSchema, navigationMenu, nextRunInstants, normalizeActionToolName, normalizeEndpointName, normalizeMCPToolKey, normalizeSearxngEngines, normalizeServerName, ocrSchema, omitsSamplingParameters, omitsThinkingByDefault, openAIBaseSchema, openAISchema, openAISettings, openIdDiscoverySchema, openRouterSchema, openapiToFunction, orderEndpointsConfig, outputTokensFromUsage, pagination, paramDefinitionSchema, paramEndpoints, paramSettings, parseCompactConvo, parseConvo, parseEphemeralAgentId, parseLangChainErrorCode, parseTextParts, peoplePickerPermissionsSchema, permBitsToAccessLevel, permissionEntrySchema, permissionsSchema, popover, presetSettings, principalSchema, progress, promptFilterFieldSchema, promptPermissionsSchema, promptTokensFromUsage, providerEndpointMap, radioGroup, rateLimitSchema, readScheduleMCPOutcomes, reconcileContextUsage, reconcileContextUsageFromEvent, registerPage, remoteAgentsPermissionsSchema, removeCodeExecutionCaller, removeNullishValues, replaceSpecialVars, request_default as request, requiresExplicitThinkingDisabled, resolveAgentSkillsScope, resolveAllowedStatefulCodeEnvironments, resolveCodeApprovalMode, resolveCodePermissionDecision, resolveDefaultLLMDeliveryPath, resolveDefaultUploadLLMDeliveryPath, resolveDropParamsUIKeys, resolveEndpointType, resolveModelCatalogKey, resolveModelSpecEndpoint, resolveProviderId, resolveRef, resolveSandboxFilename, resolveStatefulCodeEnvironment, resolveThinkingDisplay, resolveTraceViewerConfig, resolveTurnLLMDeliveryPath, resolveUploadDestination, resolveUploadLLMDeliveryPath, resolveUseResponsesApi, resourcePermissionsResponseSchema, restrictSvgReferences, retainRecentConfigSchema, retrievalMimeTypes, retrievalMimeTypesList, roleDefaults, roleSchema, runCodePermissionsSchema, scheduleCadenceSchema, scheduleFrequencies, scheduleMCPOutcomeSchema, scheduleStructuredFrequencies, scheduleTargets, schedulesPermissionsSchema, select, separator, setAcceptLanguageHeader, setFileConfigRegexCompiler, setMaxSubagents, setMessageFilterRegexValidator, setTokenHeader, sha1, shadcnComponents, sharedFileDownload, sharedLinksPermissionsSchema, skeleton, skillFilterFieldSchema, skillPermissionsSchema, skillSyncConfigSchema, skillSyncGitHubSourceSchema, slider, specialVariables, specsConfigSchema, splitMCPToolKey, splitToolCallName, stripAgentIdSuffix, stripLangChainTroubleshootingUrl, stripReasoningLabelMetadata, stripServerNamePrefix, stripServerNamePrefixes, stripToolCallErrorPrefix, structuredCadenceSchema, subagentThreadLineageSchema, summarizationConfigSchema, summarizationTriggerSchema, supportedMimeTypes, supportsAdaptiveThinking, supportsBalanceCheck, supportsContext1m, supportsFiles, supportsPromptCache, switchComponent, tBannerSchema, tConversationSchema, tConversationTagSchema, tConvoUpdateSchema, tExampleSchema, tMessageSchema, tModelSpecPresetSchema, tModelSpecSchema, tPluginAuthConfigSchema, tPluginSchema, tPresetSchema, tQueryParamsSchema, tSharedLinkSchema, table, tabs, temporaryChatPermissionsSchema, textMimeTypes, textarea, toMinimalFeedback, toast, toaster, toggle, toggleGroup, toolApprovalHookConfigSchema, toolApprovalModeSchema, toolApprovalPolicySchema, toolArgumentFilterFieldSchema, tooltip, traceViewerDefaults, traceViewerLimits, transactionsSchema, turnstileOptionsSchema, turnstileSchema, unattributedAssistantContentSchema, updateResourcePermissionsRequestSchema, updateResourcePermissionsResponseSchema, updateSchedulePayloadSchema, useToast, userSubmittedMessageFieldPathSchema, utils, validateActionDomain, validateAndParseOpenAPISpec, validateAzureGroups, validateSettingDefinitions, validateVisionModel, vertexAISchema, vertexModelConfigSchema, videoMimeTypes, visionModels, webSearchPermissionsSchema, webSearchSchema };

//# sourceMappingURL=index.mjs.map