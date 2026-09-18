//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let zod = require("zod");
let re2js = require("re2js");
let axios = require("axios");
axios = __toESM(axios);
//#region src/utils.ts
const envVarRegex = /^\${(.+)}$/;
/**
* Infrastructure env vars that must never be resolved via placeholder expansion.
* These are internal secrets whose exposure would compromise the system —
* they have no legitimate reason to appear in outbound headers, MCP env/args, or OAuth config.
*
* Intentionally excludes API keys (operators reference them in config) and
* OAuth/session secrets (referenced in MCP OAuth config via processMCPEnv).
*/
const SENSITIVE_ENV_VARS = new Set([
	"JWT_SECRET",
	"JWT_REFRESH_SECRET",
	"CREDS_KEY",
	"CREDS_IV",
	"MEILI_MASTER_KEY",
	"MONGO_URI",
	"REDIS_URI",
	"REDIS_PASSWORD"
]);
/** Returns true when `varName` refers to an infrastructure secret that must not leak. */
function isSensitiveEnvVar(varName) {
	return SENSITIVE_ENV_VARS.has(varName);
}
/** Extracts the environment variable name from a template literal string */
function extractVariableName(value) {
	if (!value) return null;
	const match = value.trim().match(envVarRegex);
	return match ? match[1] : null;
}
/** Extracts the value of an environment variable from a string. */
function extractEnvVariable(value) {
	if (!value) return value;
	const trimmed = value.trim();
	const singleMatch = trimmed.match(envVarRegex);
	if (singleMatch) {
		const varName = singleMatch[1];
		if (isSensitiveEnvVar(varName)) return trimmed;
		return process.env[varName] || trimmed;
	}
	const regex = /\${([^}]+)}/g;
	let result = trimmed;
	const matches = [];
	let match;
	while ((match = regex.exec(trimmed)) !== null) matches.push({
		fullMatch: match[0],
		varName: match[1],
		index: match.index
	});
	for (let i = matches.length - 1; i >= 0; i--) {
		const { fullMatch, varName, index } = matches[i];
		if (isSensitiveEnvVar(varName)) continue;
		const envValue = process.env[varName] || fullMatch;
		result = result.substring(0, index) + envValue + result.substring(index + fullMatch.length);
	}
	return result;
}
/**
* Normalize the endpoint name to system-expected value.
* @param name
*/
function normalizeEndpointName(name = "") {
	return name.toLowerCase() === "ollama" ? "ollama" : name;
}
//#endregion
//#region src/filters.ts
const FILTER_PII_STARTER_PATTERNS = [
	"sk_prefix",
	"bearer_header",
	"api_key_header"
];
const MAX_PII_PATTERNS_PER_SOURCE = 256;
const MAX_PII_PATTERN_LENGTH = 512;
const MAX_PII_PATTERN_ID_LENGTH = 256;
const MAX_PII_PATTERN_LABEL_LENGTH = 512;
const MAX_PII_CUSTOM_REGEX_CHARACTERS = 8192;
const MAX_PII_CUSTOM_REGEX_INSTRUCTIONS = 8192;
const MAX_PII_CUSTOM_PATTERNS_TOTAL = 256;
const MAX_PII_REGEX_SIZE_CACHE_ENTRIES = 512;
const PII_REGEX_PROGRAM_SIZE_CACHE = /* @__PURE__ */ new Map();
function getPiiRegexProgramSize(pattern) {
	if (PII_REGEX_PROGRAM_SIZE_CACHE.has(pattern)) return PII_REGEX_PROGRAM_SIZE_CACHE.get(pattern) ?? null;
	let programSize = null;
	let compiled;
	try {
		compiled = re2js.RE2JS.compile(pattern);
		const candidate = compiled.programSize();
		if (Number.isSafeInteger(candidate) && candidate > 0) programSize = candidate;
	} catch {
		programSize = null;
	} finally {
		compiled?.reset();
	}
	if (PII_REGEX_PROGRAM_SIZE_CACHE.size >= MAX_PII_REGEX_SIZE_CACHE_ENTRIES) PII_REGEX_PROGRAM_SIZE_CACHE.clear();
	PII_REGEX_PROGRAM_SIZE_CACHE.set(pattern, programSize);
	return programSize;
}
const MESSAGE_FILTER_FIELDS = [
	"name",
	"text",
	"summary",
	"quote",
	"answer",
	"decision_response",
	"decision_reason",
	"content_part",
	"attachment_reference",
	"assembled_context"
];
const HITL_MESSAGE_FILTER_FIELDS = [
	"answer",
	"decision_response",
	"decision_reason"
];
const REQUEST_ONLY_MESSAGE_FILTER_FIELDS = new Set(HITL_MESSAGE_FILTER_FIELDS);
/** Message fields structurally recoverable without exact semantic provenance. */
const STORED_MESSAGE_FILTER_FIELDS = MESSAGE_FILTER_FIELDS.filter((field) => !REQUEST_ONLY_MESSAGE_FILTER_FIELDS.has(field));
const PROMPT_FILTER_FIELDS = [
	"name",
	"description",
	"oneliner",
	"category",
	"command",
	"text",
	"preset_text",
	"system",
	"context",
	"instructions",
	"additional_instructions",
	"greeting",
	"example_input",
	"example_output"
];
const AGENT_INSTRUCTION_FILTER_FIELDS = [
	"name",
	"category",
	"description",
	"instructions",
	"additional_instructions",
	"edge_description",
	"edge_prompt",
	"edge_prompt_key",
	"artifacts",
	"support_contact_name",
	"support_contact_email"
];
const CONVERSATION_STARTER_FILTER_FIELDS = ["text"];
const CONVERSATION_TITLE_FILTER_FIELDS = ["title"];
const FEEDBACK_FILTER_FIELDS = ["text"];
const SKILL_FILTER_FIELDS = [
	"name",
	"display_title",
	"description",
	"category",
	"frontmatter",
	"instructions",
	"imported_text",
	"file_name",
	"file_text"
];
const MEMORY_FILTER_FIELDS = [
	"key",
	"value",
	"summary"
];
const FILE_FILTER_FIELDS = [
	"name",
	"content",
	"extracted_text",
	"transcript",
	"uri"
];
const TOOL_ARGUMENT_FILTER_FIELDS = [
	"name",
	"arguments",
	"output"
];
const MODEL_PARAMETER_FILTER_FIELDS = [
	"stop",
	"request_fields",
	"response_format",
	"metadata"
];
const ACTION_METADATA_FILTER_FIELDS = [
	"raw_spec",
	"domain",
	"privacy_policy_url",
	"authorization_type",
	"custom_auth_header",
	"authorization_content_type",
	"authorization_url",
	"client_url",
	"scope",
	"token_exchange_method",
	"api_key",
	"oauth_client_id",
	"oauth_client_secret"
];
const messageFilterFieldSchema = zod.z.enum(MESSAGE_FILTER_FIELDS);
const promptFilterFieldSchema = zod.z.enum(PROMPT_FILTER_FIELDS);
const agentInstructionFilterFieldSchema = zod.z.enum(AGENT_INSTRUCTION_FILTER_FIELDS);
const conversationStarterFilterFieldSchema = zod.z.enum(CONVERSATION_STARTER_FILTER_FIELDS);
const conversationTitleFilterFieldSchema = zod.z.enum(CONVERSATION_TITLE_FILTER_FIELDS);
const feedbackFilterFieldSchema = zod.z.enum(FEEDBACK_FILTER_FIELDS);
const skillFilterFieldSchema = zod.z.enum(SKILL_FILTER_FIELDS);
const memoryFilterFieldSchema = zod.z.enum(MEMORY_FILTER_FIELDS);
const fileFilterFieldSchema = zod.z.enum(FILE_FILTER_FIELDS);
const toolArgumentFilterFieldSchema = zod.z.enum(TOOL_ARGUMENT_FILTER_FIELDS);
const modelParameterFilterFieldSchema = zod.z.enum(MODEL_PARAMETER_FILTER_FIELDS);
const filterPiiStarterPatternSchema = zod.z.enum(FILTER_PII_STARTER_PATTERNS);
const filterPiiActionSchema = zod.z.enum(["block", "audit"]);
const actionMetadataFilterFieldSchema = zod.z.enum(ACTION_METADATA_FILTER_FIELDS);
const unattributedAssistantContentSchema = zod.z.enum(["model_output", "inspect"]);
const userSubmittedMessageFieldPathSchema = zod.z.object({
	path: zod.z.string().startsWith("/").max(2048),
	field: zod.z.enum(HITL_MESSAGE_FILTER_FIELDS)
}).strict();
const UNINSPECTABLE_FILE_FIELDS = new Set([
	"content",
	"extracted_text",
	"transcript"
]);
/**
* An omitted starter selection enables the built-in catalog. An explicit
* empty selection disables it, so a source is active only when custom rules
* remain. This mirrors the documented filter semantics without compiling
* regular expressions.
*/
function hasActivePiiPatterns(config) {
	return config != null && (config.starterPatterns == null || config.starterPatterns.length > 0 || (config.customPatterns?.length ?? 0) > 0);
}
/** Returns whether an active PII rule can inspect at least one candidate field. */
function hasActivePiiFields(config, candidates) {
	return hasActivePiiPatterns(config) && (config?.fields == null || candidates.some((field) => config.fields?.includes(field)));
}
/**
* Returns whether a parsed source-aware config can enforce any rule. An
* explicit fail-close file policy remains active even without text patterns.
*/
function hasActiveFiltersConfig(filters) {
	if (filters == null) return false;
	if (filters.messages?.unattributedAssistantContent === "inspect") return true;
	if ([
		filters.messages?.pii,
		filters.prompts?.pii,
		filters.agentInstructions?.pii,
		filters.conversationStarters?.pii,
		filters.conversationTitles?.pii,
		filters.feedback?.pii,
		filters.skills?.pii,
		filters.memories?.pii,
		filters.files?.pii,
		filters.toolArguments?.pii,
		filters.modelParameters?.pii,
		filters.actionMetadata?.pii
	].some(hasActivePiiPatterns)) return true;
	const filePii = filters.files?.pii;
	return filePii?.uninspectable === "block" && (filePii.fields == null || filePii.fields.some((field) => UNINSPECTABLE_FILE_FIELDS.has(field)));
}
const filterPiiRegexSchema = zod.z.string().min(1).max(512).refine((value) => getPiiRegexProgramSize(value) != null, { message: "Regex must use supported linear-time syntax" });
const filterPiiCustomPatternSchema = zod.z.object({
	id: zod.z.string().min(1).max(256),
	label: zod.z.string().min(1).max(512),
	regex: filterPiiRegexSchema
}).strict();
function createPiiFilterSchema(fieldSchema) {
	return zod.z.object({
		action: filterPiiActionSchema.optional(),
		fields: zod.z.array(fieldSchema).min(1).max(256).optional(),
		starterPatterns: zod.z.array(filterPiiStarterPatternSchema).max(256).optional(),
		customPatterns: zod.z.array(filterPiiCustomPatternSchema).max(256).optional()
	}).strict();
}
function createSourceFilterSchema(fieldSchema) {
	return zod.z.object({ pii: createPiiFilterSchema(fieldSchema).optional() }).strict();
}
const messageSourceFilterSchema = zod.z.object({
	pii: createPiiFilterSchema(messageFilterFieldSchema).optional(),
	unattributedAssistantContent: unattributedAssistantContentSchema.optional()
}).strict();
const fileSourceFilterSchema = zod.z.object({ pii: createPiiFilterSchema(fileFilterFieldSchema).extend({ uninspectable: zod.z.enum(["allow", "block"]).optional() }).optional() }).strict();
const filtersConfigSchema = zod.z.object({
	messages: messageSourceFilterSchema.optional(),
	prompts: createSourceFilterSchema(promptFilterFieldSchema).optional(),
	agentInstructions: createSourceFilterSchema(agentInstructionFilterFieldSchema).optional(),
	conversationStarters: createSourceFilterSchema(conversationStarterFilterFieldSchema).optional(),
	conversationTitles: createSourceFilterSchema(conversationTitleFilterFieldSchema).optional(),
	feedback: createSourceFilterSchema(feedbackFilterFieldSchema).optional(),
	skills: createSourceFilterSchema(skillFilterFieldSchema).optional(),
	memories: createSourceFilterSchema(memoryFilterFieldSchema).optional(),
	files: fileSourceFilterSchema.optional(),
	toolArguments: createSourceFilterSchema(toolArgumentFilterFieldSchema).optional(),
	modelParameters: createSourceFilterSchema(modelParameterFilterFieldSchema).optional(),
	actionMetadata: createSourceFilterSchema(actionMetadataFilterFieldSchema).optional()
}).strict().superRefine((filters, context) => {
	let customPatterns = 0;
	let regexCharacters = 0;
	let regexInstructions = 0;
	for (const source of Object.values(filters)) for (const pattern of source?.pii?.customPatterns ?? []) {
		customPatterns++;
		regexCharacters += pattern.regex.length;
		regexInstructions += getPiiRegexProgramSize(pattern.regex) ?? 0;
	}
	if (customPatterns > 256) context.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: `At most 256 custom PII patterns may be configured in total`
	});
	if (regexCharacters > 8192) context.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: `Custom PII regexes may contain at most ${MAX_PII_CUSTOM_REGEX_CHARACTERS} characters in total`
	});
	if (regexInstructions > 8192) context.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: `Custom PII regexes may compile to at most ${MAX_PII_CUSTOM_REGEX_INSTRUCTIONS} instructions in total`
	});
});
//#endregion
//#region src/code/workspace.ts
const CODE_WORKSPACE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
/** Protocol-v1 ceiling enforced by the worker and Code API. */
const CODE_WORKSPACE_MAX_COUNT = 32;
/** API/client protocol for immutable conversation-owned environment decisions. */
const CODE_ENVIRONMENT_DECISION_VERSION = 1;
/** API/client protocol for an owner's explicit move of a sealed environment decision. */
const CODE_ENVIRONMENT_MOVE_VERSION = 1;
const CODE_WORKSPACE_OPERATIONS = [
	"read_file",
	"search_text",
	"list_files",
	"write_file",
	"preview_edit",
	"edit_file",
	"execute_command"
];
const CODE_WORKSPACE_SELECTION_ERROR_REASONS = [
	"required",
	"invalid",
	"worker_unavailable",
	"unsupported",
	"missing",
	"locked"
];
const CODE_ENVIRONMENT_MODES = ["attached", "without_attached"];
function isCodeWorkspaceEnvironment(value) {
	if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
	const environment = value;
	return Object.keys(environment).every((key) => [
		"fingerprint",
		"repo",
		"ref",
		"actions"
	].includes(key)) && typeof environment.fingerprint === "string" && /^[a-f0-9]{64}$/.test(environment.fingerprint) && (environment.repo === void 0 || typeof environment.repo === "string" && environment.repo.length <= 256 && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(environment.repo)) && (environment.ref === void 0 || typeof environment.ref === "string" && environment.ref.trim().length > 0 && environment.ref.length <= 256 && !/[\0\r\n]/.test(environment.ref)) && Array.isArray(environment.actions) && environment.actions.length <= 32 && environment.actions.every((name) => typeof name === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(name)) && new Set(environment.actions).size === environment.actions.length;
}
function isCodeEnvironmentMode(value) {
	return CODE_ENVIRONMENT_MODES.some((mode) => mode === value);
}
function isCodeWorkspaceSelectionErrorReason(value) {
	return CODE_WORKSPACE_SELECTION_ERROR_REASONS.some((reason) => reason === value);
}
function isCodeWorkspaceSelection(value) {
	if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
	const selection = value;
	return Object.keys(selection).every((key) => key === "environmentId" || key === "workspaceId") && typeof selection.environmentId === "string" && CODE_WORKSPACE_ID_PATTERN.test(selection.environmentId) && typeof selection.workspaceId === "string" && CODE_WORKSPACE_ID_PATTERN.test(selection.workspaceId);
}
/** One exact workspace per attached environment used by a conversation. */
function isCodeWorkspaceSelections(value) {
	if (!Array.isArray(value)) return false;
	const environmentIds = /* @__PURE__ */ new Set();
	return value.every((selection) => {
		if (!isCodeWorkspaceSelection(selection) || environmentIds.has(selection.environmentId)) return false;
		environmentIds.add(selection.environmentId);
		return true;
	});
}
//#endregion
//#region src/feedback.ts
const FEEDBACK_RATINGS = ["thumbsUp", "thumbsDown"];
const FEEDBACK_REASON_KEYS = [
	"not_matched",
	"inaccurate",
	"bad_style",
	"missing_image",
	"unjustified_refusal",
	"not_helpful",
	"other",
	"accurate_reliable",
	"creative_solution",
	"clear_well_written",
	"attention_to_detail"
];
const FEEDBACK_TAGS = [
	{
		key: "not_matched",
		label: "com_ui_feedback_tag_not_matched",
		direction: "thumbsDown",
		icon: "AlertCircle"
	},
	{
		key: "inaccurate",
		label: "com_ui_feedback_tag_inaccurate",
		direction: "thumbsDown",
		icon: "AlertCircle"
	},
	{
		key: "bad_style",
		label: "com_ui_feedback_tag_bad_style",
		direction: "thumbsDown",
		icon: "PenTool"
	},
	{
		key: "missing_image",
		label: "com_ui_feedback_tag_missing_image",
		direction: "thumbsDown",
		icon: "ImageOff"
	},
	{
		key: "unjustified_refusal",
		label: "com_ui_feedback_tag_unjustified_refusal",
		direction: "thumbsDown",
		icon: "Ban"
	},
	{
		key: "not_helpful",
		label: "com_ui_feedback_tag_not_helpful",
		direction: "thumbsDown",
		icon: "ThumbsDown"
	},
	{
		key: "other",
		label: "com_ui_feedback_tag_other",
		direction: "thumbsDown",
		icon: "HelpCircle"
	},
	{
		key: "accurate_reliable",
		label: "com_ui_feedback_tag_accurate_reliable",
		direction: "thumbsUp",
		icon: "CheckCircle"
	},
	{
		key: "creative_solution",
		label: "com_ui_feedback_tag_creative_solution",
		direction: "thumbsUp",
		icon: "Lightbulb"
	},
	{
		key: "clear_well_written",
		label: "com_ui_feedback_tag_clear_well_written",
		direction: "thumbsUp",
		icon: "PenTool"
	},
	{
		key: "attention_to_detail",
		label: "com_ui_feedback_tag_attention_to_detail",
		direction: "thumbsUp",
		icon: "Search"
	}
];
function getTagsForRating(rating) {
	return FEEDBACK_TAGS.filter((tag) => tag.direction === rating);
}
const feedbackTagKeySchema = zod.z.enum(FEEDBACK_REASON_KEYS);
const feedbackRatingSchema = zod.z.enum(FEEDBACK_RATINGS);
const feedbackSchema = zod.z.object({
	rating: feedbackRatingSchema,
	tag: feedbackTagKeySchema,
	text: zod.z.string().max(1024).optional()
}).refine(({ rating, tag }) => FEEDBACK_TAGS.some((feedbackTag) => feedbackTag.key === tag && feedbackTag.direction === rating), {
	message: "Feedback tag does not match rating",
	path: ["tag"]
});
function toMinimalFeedback(feedback) {
	if (!feedback?.rating || !feedback?.tag || !feedback.tag.key) return;
	return {
		rating: feedback.rating,
		tag: feedback.tag.key,
		text: feedback.text
	};
}
function getTagByKey(key) {
	if (!key) return;
	return FEEDBACK_TAGS.find((tag) => tag.key === key);
}
//#endregion
//#region src/code/approval.ts
const CODE_APPROVAL_MODES = [
	"ask",
	"acceptEdits",
	"fullAccess"
];
const MODE_PERMISSIONS = {
	ask: {
		fileWrite: "ask",
		commandExecution: "ask"
	},
	acceptEdits: {
		fileWrite: "allow",
		commandExecution: "ask"
	},
	fullAccess: {
		fileWrite: "allow",
		commandExecution: "allow"
	}
};
/** Omitted deployment configuration never grants unattended execution. */
function getAllowedCodeApprovalModes({ enabled, allowedModes, configSchema, settings, environment }) {
	if (enabled === false) return [];
	const permitted = new Set(allowedModes ?? ["ask"]);
	return CODE_APPROVAL_MODES.filter((mode) => {
		if (!permitted.has(mode)) return false;
		if (environment === "managed") return true;
		for (const category of ["fileWrite", "commandExecution"]) {
			if (MODE_PERMISSIONS[mode][category] !== "allow") continue;
			const field = configSchema?.permissions?.[category];
			const configured = settings?.permissions?.[category];
			if ((configured != null && field?.allowed.includes(configured) === true ? configured : field?.default ?? "ask") === "deny" || field?.allowed.includes("allow") !== true) return false;
		}
		return true;
	});
}
var CodeApprovalModeError = class extends Error {
	constructor() {
		super("The selected code approval mode is not permitted by the current policy.");
		this.code = "CODE_APPROVAL_MODE_NOT_ALLOWED";
		this.name = "CodeApprovalModeError";
	}
};
/** Validate untrusted request state again at admission, including after policy changes. */
function resolveCodeApprovalMode(requested, constraints) {
	if (requested == null) return void 0;
	const selected = getAllowedCodeApprovalModes(constraints).find((mode) => mode === requested);
	if (selected == null) throw new CodeApprovalModeError();
	return selected;
}
/** Apply a turn preference without modifying machine settings or overriding an existing deny. */
function resolveCodePermissionDecision({ mode, category, decision }) {
	if (mode == null || decision === "deny") return decision;
	if (MODE_PERMISSIONS[mode] == null) throw new CodeApprovalModeError();
	return MODE_PERMISSIONS[mode][category];
}
//#endregion
//#region src/types/tools.ts
let Tools = /* @__PURE__ */ function(Tools) {
	Tools["execute_code"] = "execute_code";
	Tools["code_interpreter"] = "code_interpreter";
	Tools["file_search"] = "file_search";
	Tools["web_search"] = "web_search";
	Tools["retrieval"] = "retrieval";
	Tools["function"] = "function";
	Tools["memory"] = "memory";
	Tools["ui_resources"] = "ui_resources";
	Tools["skill"] = "skill";
	Tools["read_file"] = "read_file";
	Tools["bash_tool"] = "bash_tool";
	return Tools;
}({});
let EToolResources = /* @__PURE__ */ function(EToolResources) {
	EToolResources["code_interpreter"] = "code_interpreter";
	EToolResources["execute_code"] = "execute_code";
	EToolResources["file_search"] = "file_search";
	EToolResources["image_edit"] = "image_edit";
	EToolResources["context"] = "context";
	EToolResources["ocr"] = "ocr";
	return EToolResources;
}({});
const actionDelimiter = "_action_";
const actionDomainSeparator = "---";
/** Mirrors `Constants.mcp_delimiter`; duplicated here to avoid a circular import from `config.ts`. */
const mcpDelimiter = "_mcp_";
/**
* Checks whether a tool name is an OpenAPI action tool.
*
* Action format: `operationId_action_normalizedDomain`
* MCP format:    `toolName_mcp_serverName`
*
* Cross-delimiter collision: an MCP tool like `get_action_mcp_srv` contains
* `_action_` as a false positive. Guarded by checking whether `_mcp_` appears
* after `_action_`. In the collision case the `_mcp_` suffix always follows
* `_action_`; in a valid action tool whose operationId contains `_mcp_`, the
* `_mcp_` precedes `_action_`.
*
* Theoretical limitation: a non-RFC-compliant domain containing literal
* underscores that form `_mcp_` (e.g. `api_mcp_internal.com`) would produce
* a false negative. RFC 952/1123 prohibit underscores in hostnames, so this
* is not expected in practice.
*/
function isActionTool(toolName) {
	const actionIdx = toolName.indexOf(actionDelimiter);
	if (actionIdx < 0) return false;
	const mcpIdx = toolName.indexOf(mcpDelimiter);
	return mcpIdx < 0 || mcpIdx < actionIdx;
}
//#endregion
//#region src/schemas.ts
const isUUID = zod.z.string().uuid();
let AuthType = /* @__PURE__ */ function(AuthType) {
	AuthType["OVERRIDE_AUTH"] = "override_auth";
	AuthType["USER_PROVIDED"] = "user_provided";
	AuthType["SYSTEM_DEFINED"] = "system_defined";
	return AuthType;
}({});
const authTypeSchema = zod.z.nativeEnum(AuthType);
let EModelEndpoint = /* @__PURE__ */ function(EModelEndpoint) {
	EModelEndpoint["azureOpenAI"] = "azureOpenAI";
	EModelEndpoint["openAI"] = "openAI";
	EModelEndpoint["google"] = "google";
	EModelEndpoint["anthropic"] = "anthropic";
	EModelEndpoint["assistants"] = "assistants";
	EModelEndpoint["azureAssistants"] = "azureAssistants";
	EModelEndpoint["agents"] = "agents";
	EModelEndpoint["custom"] = "custom";
	EModelEndpoint["bedrock"] = "bedrock";
	return EModelEndpoint;
}({});
/** Mirrors `@librechat/agents` providers */
let Providers = /* @__PURE__ */ function(Providers) {
	Providers["OPENAI"] = "openAI";
	Providers["ANTHROPIC"] = "anthropic";
	Providers["AZURE"] = "azureOpenAI";
	Providers["GOOGLE"] = "google";
	Providers["VERTEXAI"] = "vertexai";
	Providers["BEDROCK"] = "bedrock";
	Providers["MISTRALAI"] = "mistralai";
	Providers["MISTRAL"] = "mistral";
	Providers["DEEPSEEK"] = "deepseek";
	Providers["MOONSHOT"] = "moonshot";
	Providers["OPENROUTER"] = "openrouter";
	Providers["XAI"] = "xai";
	return Providers;
}({});
/**
* Endpoints that support direct PDF processing in the agent system
*/
const documentSupportedProviders = new Set([
	"anthropic",
	"openAI",
	"bedrock",
	"custom",
	"google",
	"vertexai",
	"mistralai",
	"mistral",
	"deepseek",
	"moonshot",
	"openrouter",
	"xai"
]);
const openAILikeProviders = new Set([
	"openAI",
	"azureOpenAI",
	"custom",
	"mistralai",
	"mistral",
	"deepseek",
	"moonshot",
	"openrouter",
	"xai"
]);
const isOpenAILikeProvider = (provider) => {
	return openAILikeProviders.has(provider ?? "");
};
/**
* Providers whose `usage_metadata.input_tokens` ALREADY INCLUDES cached tokens
* (`input_token_details.cache_*` is a subset, not an additional charge):
* Google/Vertex (`promptTokenCount`), OpenAI/Azure (`prompt_tokens`), and the
* OpenAI-compatible family. `@librechat/agents`' `getAnthropicUsageMetadata`
* folds `cache_creation` + `cache_read` into `input_tokens`, so Anthropic is a
* subset provider too; without this the cache portion is billed twice. Bedrock
* stays additive — its Converse path passes AWS `inputTokens` through unmodified.
* Single source of truth shared by the backend billing path
* (`packages/api/src/agents/usage.ts`) and the client usage normalization.
*/
const cacheSubsetProviders = new Set([
	"openAI",
	"azureOpenAI",
	"google",
	"vertexai",
	"xai",
	"deepseek",
	"openrouter",
	"moonshot",
	"anthropic"
]);
const inputTokensIncludesCache = (provider) => {
	return cacheSubsetProviders.has(provider ?? "");
};
const isDocumentSupportedProvider = (provider) => {
	const normalized = provider?.toLowerCase() ?? "";
	return Array.from(documentSupportedProviders).some((candidate) => candidate.toLowerCase() === normalized);
};
/**
* Endpoints whose encoders actually build native audio/video payloads. Narrower than
* `documentSupportedProviders`: a provider can accept PDFs and still emit nothing for
* media, in which case the upload has to fall back to text/STT.
*/
const mediaSupportedProviders = new Set([
	"google",
	"vertexai",
	"openrouter"
]);
const isMediaSupportedProvider = (provider) => {
	return mediaSupportedProviders.has(provider?.toLowerCase() ?? "");
};
/**
* Built-in endpoint and provider identifiers. A name outside this set is a custom
* endpoint whose real provider is resolved at request time, so its capabilities
* cannot be judged from the name alone.
*/
const knownProviderIdentifiers = new Set([
	...Object.values(EModelEndpoint),
	...Object.values(Providers),
	...Object.values(EModelEndpoint).map((provider) => provider.toLowerCase()),
	...Object.values(Providers).map((provider) => provider.toLowerCase())
]);
const isKnownProviderIdentifier = (provider) => {
	return knownProviderIdentifiers.has(provider?.toLowerCase() ?? "");
};
const paramEndpoints = new Set([
	"agents",
	"openAI",
	"bedrock",
	"azureOpenAI",
	"anthropic",
	"custom",
	"google"
]);
let BedrockProviders = /* @__PURE__ */ function(BedrockProviders) {
	BedrockProviders["AI21"] = "ai21";
	BedrockProviders["Amazon"] = "amazon";
	BedrockProviders["Anthropic"] = "anthropic";
	BedrockProviders["Cohere"] = "cohere";
	BedrockProviders["DeepSeek"] = "deepseek";
	BedrockProviders["Meta"] = "meta";
	BedrockProviders["MistralAI"] = "mistral";
	BedrockProviders["Moonshot"] = "moonshot";
	BedrockProviders["MoonshotAI"] = "moonshotai";
	BedrockProviders["OpenAI"] = "openai";
	BedrockProviders["StabilityAI"] = "stability";
	BedrockProviders["ZAI"] = "zai";
	return BedrockProviders;
}({});
const getModelKey = (endpoint, model) => {
	if (endpoint === "bedrock") {
		const parts = model.split(".");
		return [parts[0], parts[1]].find((part) => Object.values(BedrockProviders).includes(part)) ?? parts[0];
	}
	return model;
};
const getSettingsKeys = (endpoint, model) => {
	const endpointKey = endpoint;
	return [`${endpointKey}-${getModelKey(endpointKey, model)}`, endpointKey];
};
const isAssistantsEndpoint = (_endpoint) => {
	const endpoint = _endpoint ?? "";
	if (!endpoint) return false;
	return endpoint.toLowerCase().endsWith("assistants");
};
const isAgentsEndpoint = (_endpoint) => {
	const endpoint = _endpoint ?? "";
	if (!endpoint) return false;
	return endpoint === "agents";
};
const isParamEndpoint = (endpoint, endpointType) => {
	if (paramEndpoints.has(endpoint)) return true;
	if (endpointType != null) return paramEndpoints.has(endpointType);
	return false;
};
let ImageDetail = /* @__PURE__ */ function(ImageDetail) {
	ImageDetail["low"] = "low";
	ImageDetail["auto"] = "auto";
	ImageDetail["high"] = "high";
	return ImageDetail;
}({});
let ReasoningEffort = /* @__PURE__ */ function(ReasoningEffort) {
	ReasoningEffort["unset"] = "";
	ReasoningEffort["none"] = "none";
	ReasoningEffort["minimal"] = "minimal";
	ReasoningEffort["low"] = "low";
	ReasoningEffort["medium"] = "medium";
	ReasoningEffort["high"] = "high";
	ReasoningEffort["xhigh"] = "xhigh";
	ReasoningEffort["max"] = "max";
	return ReasoningEffort;
}({});
let ReasoningParameterFormat = /* @__PURE__ */ function(ReasoningParameterFormat) {
	ReasoningParameterFormat["disabled"] = "disabled";
	ReasoningParameterFormat["reasoningEffort"] = "reasoning_effort";
	ReasoningParameterFormat["reasoningObject"] = "reasoning_object";
	return ReasoningParameterFormat;
}({});
let ReasoningResponseKey = /* @__PURE__ */ function(ReasoningResponseKey) {
	ReasoningResponseKey["reasoning"] = "reasoning";
	ReasoningResponseKey["reasoningContent"] = "reasoning_content";
	return ReasoningResponseKey;
}({});
let AnthropicEffort = /* @__PURE__ */ function(AnthropicEffort) {
	AnthropicEffort["unset"] = "";
	AnthropicEffort["low"] = "low";
	AnthropicEffort["medium"] = "medium";
	AnthropicEffort["high"] = "high";
	AnthropicEffort["xhigh"] = "xhigh";
	AnthropicEffort["max"] = "max";
	return AnthropicEffort;
}({});
/**
* Controls whether the model's reasoning content is returned in responses.
*
* - `'auto'` - TerraMind decides: opt in to `'summarized'` for models that
*   omit by default (Opus 4.7+), leave the field off for older models.
* - `'summarized'` - always request a post-hoc summary of the reasoning.
* - `'omitted'` - always suppress reasoning content. Slightly lower latency.
*
* See https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7#thinking-content-omitted-by-default
*/
let ThinkingDisplay = /* @__PURE__ */ function(ThinkingDisplay) {
	ThinkingDisplay["auto"] = "auto";
	ThinkingDisplay["summarized"] = "summarized";
	ThinkingDisplay["omitted"] = "omitted";
	return ThinkingDisplay;
}({});
let BedrockReasoningConfig = /* @__PURE__ */ function(BedrockReasoningConfig) {
	BedrockReasoningConfig["low"] = "low";
	BedrockReasoningConfig["medium"] = "medium";
	BedrockReasoningConfig["high"] = "high";
	return BedrockReasoningConfig;
}({});
let ReasoningSummary = /* @__PURE__ */ function(ReasoningSummary) {
	ReasoningSummary["none"] = "";
	ReasoningSummary["auto"] = "auto";
	ReasoningSummary["concise"] = "concise";
	ReasoningSummary["detailed"] = "detailed";
	return ReasoningSummary;
}({});
let Verbosity = /* @__PURE__ */ function(Verbosity) {
	Verbosity["none"] = "";
	Verbosity["low"] = "low";
	Verbosity["medium"] = "medium";
	Verbosity["high"] = "high";
	return Verbosity;
}({});
let ThinkingLevel = /* @__PURE__ */ function(ThinkingLevel) {
	ThinkingLevel["unset"] = "";
	ThinkingLevel["minimal"] = "minimal";
	ThinkingLevel["low"] = "low";
	ThinkingLevel["medium"] = "medium";
	ThinkingLevel["high"] = "high";
	return ThinkingLevel;
}({});
/** OpenAI Responses API `reasoning.mode` (GPT-5.6+). */
let ReasoningMode = /* @__PURE__ */ function(ReasoningMode) {
	ReasoningMode["unset"] = "";
	ReasoningMode["standard"] = "standard";
	ReasoningMode["pro"] = "pro";
	return ReasoningMode;
}({});
/** OpenAI Responses API `reasoning.context` (GPT-5.6+). */
let ReasoningContext = /* @__PURE__ */ function(ReasoningContext) {
	ReasoningContext["unset"] = "";
	ReasoningContext["auto"] = "auto";
	ReasoningContext["current_turn"] = "current_turn";
	ReasoningContext["all_turns"] = "all_turns";
	return ReasoningContext;
}({});
const imageDetailNumeric = {
	["low"]: 0,
	["auto"]: 1,
	["high"]: 2
};
const imageDetailValue = {
	0: "low",
	1: "auto",
	2: "high"
};
const eImageDetailSchema = zod.z.nativeEnum(ImageDetail);
const eReasoningEffortSchema = zod.z.nativeEnum(ReasoningEffort);
const eReasoningParameterFormatSchema = zod.z.nativeEnum(ReasoningParameterFormat);
const eReasoningResponseKeySchema = zod.z.nativeEnum(ReasoningResponseKey);
const eAnthropicEffortSchema = zod.z.nativeEnum(AnthropicEffort);
const eThinkingDisplaySchema = zod.z.nativeEnum(ThinkingDisplay);
const eReasoningSummarySchema = zod.z.nativeEnum(ReasoningSummary);
const eVerbositySchema = zod.z.nativeEnum(Verbosity);
const eThinkingLevelSchema = zod.z.nativeEnum(ThinkingLevel);
const eReasoningModeSchema = zod.z.nativeEnum(ReasoningMode);
const eReasoningContextSchema = zod.z.nativeEnum(ReasoningContext);
const defaultAssistantFormValues = {
	assistant: "",
	id: "",
	name: "",
	description: "",
	instructions: "",
	conversation_starters: [],
	model: "",
	functions: [],
	code_interpreter: false,
	image_vision: false,
	retrieval: false,
	append_current_datetime: false
};
const defaultAgentFormValues = {
	agent: {},
	id: "",
	name: "",
	description: "",
	instructions: "",
	model: "",
	model_parameters: {},
	tools: [],
	tool_options: {},
	provider: {},
	edges: [],
	artifacts: "",
	recursion_limit: void 0,
	["execute_code"]: false,
	["file_search"]: false,
	["web_search"]: false,
	["memory"]: false,
	stateful_code_environment: "user",
	code_environment_id: void 0,
	code_workspace_id: void 0,
	category: "general",
	support_contact: {
		name: "",
		email: ""
	},
	/** Optional allowlist. Only applies when `skills_enabled === true`.
	*  Empty/undefined + enabled = full catalog; non-empty + enabled = narrow to ids. */
	skills: void 0,
	/** Master toggle for skill use on this agent. `true` activates skills
	*  (full catalog unless `skills` narrows it). Anything else = inactive. */
	skills_enabled: void 0,
	/** Enables runtime skill creation without exposing an existing skill catalog. */
	skill_authoring_enabled: void 0,
	/** Explicit catalog scope. Missing preserves the legacy enabled + empty = all behavior. */
	skills_scope: void 0,
	/** `undefined` = feature disabled by default (no subagent tool injected). */
	subagents: void 0,
	/** Memory partition: 'agent' isolates memories per (user, agent); default shared pool */
	memory_scope: void 0
};
const ImageVisionTool = {
	type: "function",
	["function"]: {
		name: "image_vision",
		description: "Get detailed text descriptions for all current image attachments.",
		parameters: {
			type: "object",
			properties: {},
			required: []
		}
	}
};
/** Structural on purpose: accepts assistants tools/tool calls and agents function tool
*  calls alike — the check only ever reads `type` and `function.name`. */
const isImageVisionTool = (tool) => tool.type === "function" && tool.function?.name === ImageVisionTool.function?.name;
const openAISettings = {
	model: { default: "gpt-4o-mini" },
	temperature: {
		min: 0,
		max: 2,
		step: .01,
		default: 1
	},
	top_p: {
		min: 0,
		max: 1,
		step: .01,
		default: 1
	},
	presence_penalty: {
		min: -2,
		max: 2,
		step: .01,
		default: 0
	},
	frequency_penalty: {
		min: -2,
		max: 2,
		step: .01,
		default: 0
	},
	resendFiles: { default: true },
	maxContextTokens: { default: void 0 },
	max_tokens: { default: void 0 },
	imageDetail: {
		default: "auto",
		min: 0,
		max: 2,
		step: 1
	}
};
/**
* `65535` (not 65536) is the value valid on both Google AI Studio and Vertex AI:
* Vertex caps current Gemini text models at 65,535 output tokens, so defaulting to
* 65,536 would make otherwise-default Vertex requests fail validation.
*/
const GOOGLE_MAX_OUTPUT = 65535;
const GOOGLE_IMAGE_MAX_OUTPUT = 32768;
const GOOGLE_LEGACY_MAX_OUTPUT = 8192;
/**
* Resolves the documented max output-token limit for a Google/Gemini model.
* Current Gemini text models (2.5 and 3+) support 64K output tokens; their image
* variants (e.g. `gemini-2.5-flash-image`) cap at 32K; legacy/deprecated models
* (2.0 and earlier, including legacy image models) and Gemma retain the 8K limit.
*/
const getGoogleMaxOutputTokens = (modelName) => {
	if (/gemini-(?:2\.5|[3-9]|\d{2,})/i.test(modelName)) {
		if (/image/i.test(modelName)) return GOOGLE_IMAGE_MAX_OUTPUT;
		return GOOGLE_MAX_OUTPUT;
	}
	return GOOGLE_LEGACY_MAX_OUTPUT;
};
/**
* Per-model thinking budget bounds, documented in
* `com_endpoint_google_thinking_budget`: Gemini 2.5 Pro accepts 128-32,768,
* Flash accepts 0-24,576, and Flash Lite accepts 512-24,576. The generic
* 32,000 in the shared definition both under-limits Pro and lets invalid
* Flash values through.
*
* `-1` remains the "decide automatically" sentinel and is not part of these
* floors. Callers must keep `range.min` at -1 and apply `min` only to
* non-negative values.
*/
const GOOGLE_THINKING_BUDGET_PRO_MAX = 32768;
const GOOGLE_THINKING_BUDGET_FLASH_MAX = 24576;
const GOOGLE_THINKING_BUDGET_PRO_MIN = 128;
const GOOGLE_THINKING_BUDGET_FLASH_MIN = 0;
const GOOGLE_THINKING_BUDGET_FLASH_LITE_MIN = 512;
const getGoogleThinkingBudgetBounds = (modelName) => {
	if (!/gemini-2\.5/i.test(modelName)) return;
	if (/flash[-_.]?lite/i.test(modelName)) return {
		min: GOOGLE_THINKING_BUDGET_FLASH_LITE_MIN,
		max: GOOGLE_THINKING_BUDGET_FLASH_MAX
	};
	if (/flash/i.test(modelName)) return {
		min: GOOGLE_THINKING_BUDGET_FLASH_MIN,
		max: GOOGLE_THINKING_BUDGET_FLASH_MAX
	};
	if (/pro/i.test(modelName)) return {
		min: GOOGLE_THINKING_BUDGET_PRO_MIN,
		max: GOOGLE_THINKING_BUDGET_PRO_MAX
	};
};
const getGoogleThinkingBudgetMax = (modelName) => getGoogleThinkingBudgetBounds(modelName)?.max;
const googleSettings = {
	model: { default: "gemini-1.5-flash-latest" },
	maxContextTokens: {
		min: 10,
		max: 2e6,
		step: 1e3
	},
	maxOutputTokens: {
		min: 1,
		max: GOOGLE_MAX_OUTPUT,
		step: 1,
		default: GOOGLE_LEGACY_MAX_OUTPUT,
		reset: (modelName) => getGoogleMaxOutputTokens(modelName),
		set: (value, modelName) => {
			const max = getGoogleMaxOutputTokens(modelName);
			return value > max ? max : value;
		}
	},
	temperature: {
		min: 0,
		max: 2,
		step: .01,
		default: 1
	},
	topP: {
		min: 0,
		max: 1,
		step: .01,
		default: .95
	},
	topK: {
		min: 1,
		max: 40,
		step: 1,
		default: 40
	},
	thinking: { default: true },
	thinkingBudget: {
		min: -1,
		max: 32e3,
		step: 1,
		/** `-1` = Dynamic Thinking, meaning the model will adjust
		* the budget based on the complexity of the request.
		*/
		default: -1
	},
	thinkingLevel: { default: "" }
};
const ANTHROPIC_MAX_OUTPUT = 128e3;
const CLAUDE_4_64K_MAX_OUTPUT = 64e3;
const CLAUDE_32K_MAX_OUTPUT = 32e3;
const DEFAULT_MAX_OUTPUT = 8192;
const LEGACY_ANTHROPIC_MAX_OUTPUT = 4096;
const CLAUDE_SONNET_128K_OUTPUT_PATTERN = /claude-sonnet[-.]?(?:4[-.]?(?:[6-9]|\d{2})|[5-9]|\d{2,})(?=$|[^0-9])/;
/**
* Claude "Mythos-class" model families — new top-level classes (peers of
* `opus`/`sonnet`/`haiku`) that ship with the post-Opus-4.7 modern profile:
* adaptive thinking always on, raw thinking omitted by default (summarized
* opt-in), sampling parameters rejected, and a 1M context window. The tier
* word is the class name itself, so the `opus`/`sonnet` version parsers don't
* cover them.
*
* Single source of truth: add a future sibling class name here and every
* Mythos-class gate (adaptive thinking, sampling omission, prompt caching, 1M
* context, 128K output) picks it up.
*/
const MYTHOS_CLASS_FAMILIES = ["fable", "mythos"];
const MYTHOS_CLASS_PATTERN = new RegExp(`claude-(?:${MYTHOS_CLASS_FAMILIES.join("|")})[-.]?\\d`);
/** Whether the model is a Claude Mythos-class model (e.g. `claude-fable-5`). */
function isMythosClassModel(model) {
	return MYTHOS_CLASS_PATTERN.test(model);
}
const anthropicSettings = {
	model: { default: "claude-3-5-sonnet-latest" },
	temperature: {
		min: 0,
		max: 1,
		step: .01,
		default: 1
	},
	promptCache: { default: true },
	promptCacheTtl: { default: void 0 },
	thinking: { default: true },
	thinkingBudget: {
		min: 1024,
		step: 100,
		max: 2e5,
		default: 2e3
	},
	maxOutputTokens: {
		min: 1,
		max: ANTHROPIC_MAX_OUTPUT,
		step: 1,
		default: DEFAULT_MAX_OUTPUT,
		reset: (modelName) => {
			if (isMythosClassModel(modelName)) return ANTHROPIC_MAX_OUTPUT;
			if (/claude-opus[-.]?(?:4[-.]?(?:[6-9]|\d{2,})|[5-9]|\d{2,})/.test(modelName)) return ANTHROPIC_MAX_OUTPUT;
			if (CLAUDE_SONNET_128K_OUTPUT_PATTERN.test(modelName)) return ANTHROPIC_MAX_OUTPUT;
			if (/claude-(?:sonnet|haiku)[-.]?[4-9]/.test(modelName)) return CLAUDE_4_64K_MAX_OUTPUT;
			if (/claude-opus[-.]?(?:[5-9]|4[-.]?([5-9]|\d{2,}))/.test(modelName)) return CLAUDE_4_64K_MAX_OUTPUT;
			if (/claude-opus[-.]?[4-9]/.test(modelName)) return CLAUDE_32K_MAX_OUTPUT;
			return DEFAULT_MAX_OUTPUT;
		},
		set: (value, modelName) => {
			if (isMythosClassModel(modelName)) {
				if (value > ANTHROPIC_MAX_OUTPUT) return ANTHROPIC_MAX_OUTPUT;
				return value;
			}
			if (/claude-opus[-.]?(?:4[-.]?(?:[6-9]|\d{2,})|[5-9]|\d{2,})/.test(modelName)) {
				if (value > ANTHROPIC_MAX_OUTPUT) return ANTHROPIC_MAX_OUTPUT;
				return value;
			}
			if (CLAUDE_SONNET_128K_OUTPUT_PATTERN.test(modelName)) {
				if (value > ANTHROPIC_MAX_OUTPUT) return ANTHROPIC_MAX_OUTPUT;
				return value;
			}
			if (/claude-(?:sonnet|haiku)[-.]?[4-9]/.test(modelName) && value > CLAUDE_4_64K_MAX_OUTPUT) return CLAUDE_4_64K_MAX_OUTPUT;
			if (/claude-opus[-.]?(?:[5-9]|4[-.]?([5-9]|\d{2,}))/.test(modelName)) {
				if (value > CLAUDE_4_64K_MAX_OUTPUT) return CLAUDE_4_64K_MAX_OUTPUT;
				return value;
			}
			if (/claude-opus[-.]?[4-9]/.test(modelName) && value > CLAUDE_32K_MAX_OUTPUT) return CLAUDE_32K_MAX_OUTPUT;
			if (value > ANTHROPIC_MAX_OUTPUT) return ANTHROPIC_MAX_OUTPUT;
			return value;
		}
	},
	topP: {
		min: 0,
		max: 1,
		step: .01,
		default: .7
	},
	topK: {
		min: 1,
		max: 40,
		step: 1,
		default: 5
	},
	resendFiles: { default: true },
	maxContextTokens: { default: void 0 },
	legacy: { maxOutputTokens: {
		min: 1,
		max: LEGACY_ANTHROPIC_MAX_OUTPUT,
		step: 1,
		default: LEGACY_ANTHROPIC_MAX_OUTPUT
	} },
	effort: {
		default: "",
		options: [
			"",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		]
	},
	thinkingDisplay: {
		default: "auto",
		options: [
			"auto",
			"summarized",
			"omitted"
		]
	},
	web_search: { default: false }
};
const agentsSettings = {
	model: { default: "gpt-3.5-turbo-test" },
	temperature: {
		min: 0,
		max: 1,
		step: .01,
		default: 1
	},
	top_p: {
		min: 0,
		max: 1,
		step: .01,
		default: 1
	},
	presence_penalty: {
		min: -2,
		max: 2,
		step: .01,
		default: 0
	},
	frequency_penalty: {
		min: -2,
		max: 2,
		step: .01,
		default: 0
	},
	resendFiles: { default: true },
	maxContextTokens: { default: void 0 },
	max_tokens: { default: void 0 },
	imageDetail: { default: "auto" }
};
const endpointSettings = {
	["openAI"]: openAISettings,
	["google"]: googleSettings,
	["anthropic"]: anthropicSettings,
	["agents"]: agentsSettings,
	["bedrock"]: agentsSettings
};
const google = endpointSettings["google"];
const eModelEndpointSchema = zod.z.nativeEnum(EModelEndpoint);
const extendedModelEndpointSchema = zod.z.union([eModelEndpointSchema, zod.z.string()]);
const tPluginAuthConfigSchema = zod.z.object({
	authField: zod.z.string(),
	label: zod.z.string(),
	description: zod.z.string(),
	optional: zod.z.boolean().optional(),
	/** Whether the field holds a secret and should be masked in the UI (defaults to masked when omitted). */
	sensitive: zod.z.boolean().optional()
});
const tPluginSchema = zod.z.object({
	name: zod.z.string(),
	pluginKey: zod.z.string(),
	description: zod.z.string().optional(),
	icon: zod.z.string().optional(),
	authConfig: zod.z.array(tPluginAuthConfigSchema).optional(),
	authenticated: zod.z.boolean().optional(),
	chatMenu: zod.z.boolean().optional(),
	isButton: zod.z.boolean().optional(),
	toolkit: zod.z.boolean().optional(),
	/** Raw upstream tool name when the model-facing key stripped a redundant
	*  server-name prefix — proves upstream identity for legacy id migration. */
	serverToolName: zod.z.string().optional()
});
const tExampleSchema = zod.z.object({
	input: zod.z.object({ content: zod.z.string() }),
	output: zod.z.object({ content: zod.z.string() })
});
/** Compact context-fading tier persisted beside a message's calibration ratio. */
const agentFadingTierSchema = zod.z.object({
	v: zod.z.literal(1),
	budgetTokens: zod.z.number().positive(),
	masked: zod.z.boolean()
});
const tMessageSchema = zod.z.object({
	messageId: zod.z.string(),
	endpoint: zod.z.string().optional(),
	clientId: zod.z.string().nullable().optional(),
	conversationId: zod.z.string().nullable(),
	parentMessageId: zod.z.string().nullable(),
	responseMessageId: zod.z.string().nullable().optional(),
	overrideParentMessageId: zod.z.string().nullable().optional(),
	bg: zod.z.string().nullable().optional(),
	model: zod.z.string().nullable().optional(),
	title: zod.z.string().nullable().or(zod.z.literal("New Chat")).default("New Chat"),
	sender: zod.z.string().optional(),
	text: zod.z.string(),
	/** @deprecated */
	generation: zod.z.string().nullable().optional(),
	isCreatedByUser: zod.z.boolean(),
	/** True when the complete stored row came from outside the model. */
	isUserSubmitted: zod.z.boolean().optional(),
	/** JSON pointers to caller-authored fields in an otherwise mixed model response. */
	userSubmittedPaths: zod.z.array(zod.z.string().startsWith("/")).optional(),
	/** Exact HITL message-field identity for caller-authored values stored in mixed responses. */
	userSubmittedMessageFieldPaths: zod.z.array(userSubmittedMessageFieldPathSchema).optional(),
	isTemporary: zod.z.boolean().optional(),
	expiredAt: zod.z.string().nullable().optional(),
	error: zod.z.boolean().optional(),
	clientTimestamp: zod.z.string().optional(),
	createdAt: zod.z.string().optional().default(() => (/* @__PURE__ */ new Date()).toISOString()),
	updatedAt: zod.z.string().optional().default(() => (/* @__PURE__ */ new Date()).toISOString()),
	current: zod.z.boolean().optional(),
	unfinished: zod.z.boolean().optional(),
	searchResult: zod.z.boolean().optional(),
	finish_reason: zod.z.string().optional(),
	thread_id: zod.z.string().optional(),
	iconURL: zod.z.string().nullable().optional(),
	feedback: feedbackSchema.optional(),
	/** metadata */
	metadata: zod.z.record(zod.z.unknown()).optional(),
	/** Output tokens for assistant messages, calibrated prompt-side estimate for user messages */
	tokenCount: zod.z.number().optional(),
	contextMeta: zod.z.object({
		calibrationRatio: zod.z.number().optional().describe("EMA ratio of provider-reported vs local token estimates; seeds the pruner on subsequent runs"),
		encoding: zod.z.string().optional().describe("Tokenizer encoding used when this ratio was computed (e.g. \"claude\", \"o200k_base\")"),
		fading: agentFadingTierSchema.optional().describe("Latched context-fading tier of the default agent; seeds the next run so the provider projection of history keeps the same bytes"),
		fadingTiers: zod.z.array(agentFadingTierSchema.extend({ agentId: zod.z.string().min(1) })).optional().describe("Latched context-fading tiers keyed by agent ID, stored as entries")
	}).optional(),
	/**
	* Skill names the user invoked manually via the `$` popover on this turn.
	* Purely UI metadata — `SkillPills` renders these above the message
	* bubble so users can see which skills they asked for in history and on
	* reload. Runtime resolution uses the top-level payload field with the
	* same name. Empty / absent for model-invoked skills (shown as tool_call
	* content parts on the assistant message instead).
	*/
	manualSkills: zod.z.array(zod.z.string()).optional(),
	/**
	* Skill names auto-primed on this turn because their `always-apply`
	* frontmatter flag is set. Persisted at turn time so the pinned-variant
	* pills on the user bubble survive reload and stay stable across later
	* edits to the skill's `alwaysApply` flag (the user bubble reflects
	* what actually ran, not the current catalog).
	*/
	alwaysAppliedSkills: zod.z.array(zod.z.string()).optional(),
	/**
	* Verbatim excerpts the user quoted (via the "Add to chat" selection
	* popup) to reference on this turn. UI metadata that `MessageQuotes`
	* renders above the user bubble so the references persist on reload. The
	* excerpts are merged into the user message text sent to the model at
	* request time and counted in the user message token count.
	*/
	quotes: zod.z.array(zod.z.string()).optional()
});
/**
* Which memory partition an agent reads/writes.
* `user` = the shared personal pool (default); `agent` = a partition
* isolated per (user, agent) so the agent only sees its own memories.
*/
let MemoryScope = /* @__PURE__ */ function(MemoryScope) {
	MemoryScope["user"] = "user";
	MemoryScope["agent"] = "agent";
	return MemoryScope;
}({});
/** Catalog exposure for a persisted agent with skills enabled. */
let SkillsScope = /* @__PURE__ */ function(SkillsScope) {
	SkillsScope["all"] = "all";
	SkillsScope["selected"] = "selected";
	SkillsScope["none"] = "none";
	return SkillsScope;
}({});
/** Resolves explicit and legacy persisted-agent skill catalog states. */
function resolveAgentSkillsScope(skills, enabled, scope) {
	if (enabled !== true) return "none";
	if (scope !== void 0) return scope;
	return (skills ?? []).length > 0 ? "selected" : "all";
}
const coerceNumber = zod.z.union([zod.z.number(), zod.z.string()]).transform((val) => {
	if (typeof val === "string") return val.trim() === "" ? void 0 : parseFloat(val);
	return val;
});
const DocumentType = zod.z.lazy(() => zod.z.union([
	zod.z.null(),
	zod.z.boolean(),
	zod.z.number(),
	zod.z.string(),
	zod.z.array(zod.z.lazy(() => DocumentType)),
	zod.z.record(zod.z.lazy(() => DocumentType))
]));
const subagentThreadLineageSchema = zod.z.object({
	rootConversationId: zod.z.string().min(1),
	parentConversationId: zod.z.string().min(1),
	parentMessageId: zod.z.string().min(1),
	parentToolCallId: zod.z.string().min(1),
	parentAgentId: zod.z.string().min(1).optional(),
	subagentType: zod.z.string().min(1),
	subagentKind: zod.z.enum(["agent", "graph"]),
	depth: zod.z.number().int().positive()
});
const tConversationSchema = zod.z.object({
	conversationId: zod.z.string().nullable(),
	endpoint: eModelEndpointSchema.nullable(),
	endpointType: eModelEndpointSchema.nullable().optional(),
	isArchived: zod.z.boolean().optional(),
	/** When the chat was archived; absent on chats archived before this was recorded. */
	archivedAt: zod.z.string().nullable().optional(),
	pinned: zod.z.boolean().optional(),
	/** Server-derived: an active shared link exists for this conversation. Not persisted. */
	isShared: zod.z.boolean().optional(),
	codeApprovalMode: zod.z.enum(CODE_APPROVAL_MODES).optional(),
	codeEnvironmentMode: zod.z.enum(CODE_ENVIRONMENT_MODES).optional(),
	codeWorkspaces: zod.z.array(zod.z.object({
		environmentId: zod.z.string().regex(CODE_WORKSPACE_ID_PATTERN),
		workspaceId: zod.z.string().regex(CODE_WORKSPACE_ID_PATTERN)
	}).strict()).optional(),
	title: zod.z.string().nullable().or(zod.z.literal("New Chat")).default("New Chat"),
	user: zod.z.string().optional(),
	messages: zod.z.array(zod.z.string()).optional(),
	tools: zod.z.union([zod.z.array(tPluginSchema), zod.z.array(zod.z.string())]).optional(),
	modelLabel: zod.z.string().nullable().optional(),
	userLabel: zod.z.string().optional(),
	model: zod.z.string().nullable().optional(),
	promptPrefix: zod.z.string().nullable().optional(),
	temperature: zod.z.number().nullable().optional(),
	topP: zod.z.number().optional(),
	topK: zod.z.number().optional(),
	top_p: zod.z.number().optional(),
	frequency_penalty: zod.z.number().optional(),
	presence_penalty: zod.z.number().optional(),
	parentMessageId: zod.z.string().optional(),
	maxOutputTokens: coerceNumber.nullable().optional(),
	maxContextTokens: coerceNumber.optional(),
	max_tokens: coerceNumber.optional(),
	promptCache: zod.z.boolean().optional(),
	promptCacheTtl: zod.z.enum(["5m", "1h"]).optional(),
	system: zod.z.string().optional(),
	thinking: zod.z.boolean().optional(),
	thinkingBudget: coerceNumber.optional(),
	thinkingLevel: eThinkingLevelSchema.optional(),
	stream: zod.z.boolean().optional(),
	artifacts: zod.z.string().optional(),
	context: zod.z.string().nullable().optional(),
	examples: zod.z.array(tExampleSchema).optional(),
	tags: zod.z.array(zod.z.string()).optional(),
	chatProjectId: zod.z.string().nullable().optional(),
	createdAt: zod.z.string(),
	updatedAt: zod.z.string(),
	resendFiles: zod.z.boolean().optional(),
	file_ids: zod.z.array(zod.z.string()).optional(),
	imageDetail: eImageDetailSchema.optional(),
	reasoning_effort: eReasoningEffortSchema.optional().nullable(),
	reasoning_summary: eReasoningSummarySchema.optional().nullable(),
	reasoning_mode: eReasoningModeSchema.optional().nullable(),
	reasoning_context: eReasoningContextSchema.optional().nullable(),
	verbosity: eVerbositySchema.optional().nullable(),
	useResponsesApi: zod.z.boolean().optional(),
	effort: eAnthropicEffortSchema.optional().nullable(),
	thinkingDisplay: eThinkingDisplaySchema.optional().nullable(),
	web_search: zod.z.boolean().optional(),
	url_context: zod.z.boolean().optional(),
	disableStreaming: zod.z.boolean().optional(),
	assistant_id: zod.z.string().optional(),
	agent_id: zod.z.string().optional(),
	/** Durable parent/child navigation for a subagent thread. */
	subagentThread: subagentThreadLineageSchema.optional(),
	region: zod.z.string().optional(),
	maxTokens: coerceNumber.optional(),
	additionalModelRequestFields: DocumentType.optional(),
	instructions: zod.z.string().optional(),
	additional_instructions: zod.z.string().optional(),
	append_current_datetime: zod.z.boolean().optional(),
	/** Used to overwrite active conversation settings when saving a Preset */
	presetOverride: zod.z.record(zod.z.unknown()).optional(),
	stop: zod.z.array(zod.z.string()).optional(),
	greeting: zod.z.string().optional(),
	spec: zod.z.string().nullable().optional(),
	iconURL: zod.z.string().nullable().optional(),
	expiredAt: zod.z.string().nullable().optional(),
	isTemporary: zod.z.boolean().optional(),
	fileTokenLimit: coerceNumber.optional(),
	/** @deprecated */
	resendImages: zod.z.boolean().optional(),
	/** @deprecated Prefer `modelLabel` over `chatGptLabel` */
	chatGptLabel: zod.z.string().nullable().optional()
});
const tPresetSchema = tConversationSchema.omit({
	conversationId: true,
	chatProjectId: true,
	createdAt: true,
	updatedAt: true,
	title: true
}).merge(zod.z.object({
	conversationId: zod.z.string().nullable().optional(),
	presetId: zod.z.string().nullable().optional(),
	title: zod.z.string().nullable().optional(),
	defaultPreset: zod.z.boolean().optional(),
	order: zod.z.number().optional(),
	endpoint: extendedModelEndpointSchema.nullable()
}));
const tConvoUpdateSchema = tConversationSchema.merge(zod.z.object({
	endpoint: extendedModelEndpointSchema.nullable(),
	createdAt: zod.z.string().optional(),
	updatedAt: zod.z.string().optional()
}));
const tQueryParamsSchema = tConversationSchema.pick({
	/** The model spec to be used */
	spec: true,
	/** The AI context window, overrides the system-defined window as determined by `model` value */
	maxContextTokens: true,
	/**
	* Whether or not to re-submit files from previous messages on subsequent messages
	* */
	resendFiles: true,
	/**
	* @endpoints openAI, custom, azureOpenAI
	*
	* System parameter that only affects the above endpoints.
	* Image detail for re-sizing according to OpenAI spec, defaults to `auto`
	* */
	imageDetail: true,
	/**
	* AKA Custom Instructions, dynamically added to chat history as a system message;
	* for `bedrock` endpoint, this is used as the `system` model param if the provider uses it;
	* for `assistants` endpoint, this is used as the `additional_instructions` model param:
	* https://platform.openai.com/docs/api-reference/runs/createRun#runs-createrun-additional_instructions
	* ; otherwise, a message with `system` role is added to the chat history
	*/
	promptPrefix: true,
	/** @endpoints openAI, custom, azureOpenAI, google, anthropic, assistants, azureAssistants, bedrock */
	model: true,
	/** @endpoints openAI, custom, azureOpenAI, google, anthropic, bedrock */
	temperature: true,
	/** @endpoints openAI, custom, azureOpenAI */
	presence_penalty: true,
	/** @endpoints openAI, custom, azureOpenAI */
	frequency_penalty: true,
	/** @endpoints openAI, custom, azureOpenAI */
	stop: true,
	/** @endpoints openAI, custom, azureOpenAI */
	top_p: true,
	/** @endpoints openAI, custom, azureOpenAI */
	max_tokens: true,
	/** @endpoints openAI, custom, azureOpenAI */
	reasoning_effort: true,
	/** @endpoints openAI, custom, azureOpenAI */
	reasoning_summary: true,
	/** @endpoints openAI, custom, azureOpenAI */
	reasoning_mode: true,
	/** @endpoints openAI, custom, azureOpenAI */
	reasoning_context: true,
	/** @endpoints openAI, custom, azureOpenAI */
	verbosity: true,
	/** @endpoints openAI, custom, azureOpenAI */
	useResponsesApi: true,
	/** @endpoints openAI, anthropic, google */
	web_search: true,
	/** @endpoints google */
	url_context: true,
	/** @endpoints openAI, custom, azureOpenAI */
	disableStreaming: true,
	/** @endpoints google, anthropic, bedrock */
	topP: true,
	/** @endpoints google, anthropic */
	topK: true,
	/** @endpoints google, anthropic */
	maxOutputTokens: true,
	/** @endpoints anthropic */
	promptCache: true,
	promptCacheTtl: true,
	thinking: true,
	thinkingBudget: true,
	thinkingLevel: true,
	effort: true,
	thinkingDisplay: true,
	/** @endpoints bedrock */
	region: true,
	/** @endpoints bedrock */
	maxTokens: true,
	/** @endpoints agents */
	agent_id: true,
	/** @endpoints assistants, azureAssistants */
	assistant_id: true,
	/** @endpoints assistants, azureAssistants */
	append_current_datetime: true,
	/**
	* @endpoints assistants, azureAssistants
	*
	* Overrides existing assistant instructions, only used for the current run:
	* https://platform.openai.com/docs/api-reference/runs/createRun#runs-createrun-instructions
	* */
	instructions: true,
	/** @endpoints openAI, google, anthropic */
	fileTokenLimit: true
}).merge(zod.z.object({ 
/** @endpoints openAI, custom, azureOpenAI, google, anthropic, assistants, azureAssistants, bedrock, agents */
endpoint: extendedModelEndpointSchema.nullable() }));
/** Narrowed preset schema for use in model specs — omits system/DB/deprecated fields.
*
* `greeting` and `iconURL` are admin-configurable display fields on a model spec's
* preset (landing greeting, preset-level icon fallback) and must be preserved.
* `spec` is set by the client from `modelSpec.name` via `getModelSpecPreset` and is
* omitted to avoid duplicate configuration surface.
*/
const tModelSpecPresetSchema = tPresetSchema.omit({
	conversationId: true,
	presetId: true,
	title: true,
	defaultPreset: true,
	order: true,
	isArchived: true,
	user: true,
	messages: true,
	tags: true,
	file_ids: true,
	expiredAt: true,
	parentMessageId: true,
	resendImages: true,
	chatGptLabel: true,
	presetOverride: true,
	spec: true
}).merge(zod.z.object({ 
/**
* Optional here, unlike `tPresetSchema`, where the key is required (though
* nullable). A preset naming an `agent_id` has an unambiguous endpoint, so
* config may omit it and `resolveModelSpecEndpoint` infers `agents` when
* specs are materialized at config load.
*/
endpoint: extendedModelEndpointSchema.nullish() })).superRefine((preset, ctx) => {
	/**
	* Omission is only legal when the endpoint is inferable, which requires a
	* NON-EMPTY `agent_id` — form-backed writers persist untouched fields as
	* `''`, which names no agent. An explicit `endpoint: null` stays accepted:
	* it validated before the key became optional, so rejecting it now would
	* break previously valid configs.
	*/
	if (preset.endpoint === void 0 && !preset.agent_id) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["endpoint"],
		message: "endpoint is required unless the preset names a non-empty agent_id (the agents endpoint is then inferred)"
	});
});
const tSharedLinkSchema = zod.z.object({
	conversationId: zod.z.string(),
	shareId: zod.z.string(),
	targetMessageId: zod.z.string().optional(),
	messages: zod.z.array(zod.z.string()),
	title: zod.z.string(),
	createdAt: zod.z.string(),
	updatedAt: zod.z.string()
});
const tConversationTagSchema = zod.z.object({
	_id: zod.z.string(),
	user: zod.z.string(),
	tag: zod.z.string(),
	description: zod.z.string().optional(),
	createdAt: zod.z.string(),
	updatedAt: zod.z.string(),
	count: zod.z.number(),
	position: zod.z.number()
});
const googleBaseSchema = tConversationSchema.pick({
	chatProjectId: true,
	model: true,
	modelLabel: true,
	promptPrefix: true,
	examples: true,
	temperature: true,
	maxOutputTokens: true,
	resendFiles: true,
	artifacts: true,
	topP: true,
	topK: true,
	thinking: true,
	thinkingBudget: true,
	thinkingLevel: true,
	web_search: true,
	url_context: true,
	fileTokenLimit: true,
	iconURL: true,
	greeting: true,
	spec: true,
	maxContextTokens: true
});
const googleSchema = googleBaseSchema.transform((obj) => removeNullishValues(obj, true)).catch(() => ({}));
/**
* TODO: Map the following fields:
- presence_penalty -> presencePenalty
- frequency_penalty -> frequencyPenalty
- stop -> stopSequences
*/
const googleGenConfigSchema = zod.z.object({
	maxOutputTokens: coerceNumber.optional(),
	temperature: coerceNumber.optional(),
	topP: coerceNumber.optional(),
	topK: coerceNumber.optional(),
	presencePenalty: coerceNumber.optional(),
	frequencyPenalty: coerceNumber.optional(),
	stopSequences: zod.z.array(zod.z.string()).optional(),
	thinkingConfig: zod.z.object({
		includeThoughts: zod.z.boolean().optional(),
		thinkingBudget: coerceNumber.optional(),
		thinkingLevel: zod.z.string().optional()
	}).optional(),
	web_search: zod.z.boolean().optional(),
	url_context: zod.z.boolean().optional()
}).strip().optional();
function removeNullishValues(obj, removeEmptyStrings) {
	const newObj = { ...obj };
	Object.keys(newObj).forEach((key) => {
		const value = newObj[key];
		if (value === void 0 || value === null) delete newObj[key];
		if (removeEmptyStrings && typeof value === "string" && value === "") delete newObj[key];
	});
	return newObj;
}
const assistantSchema = tConversationSchema.pick({
	chatProjectId: true,
	model: true,
	assistant_id: true,
	instructions: true,
	artifacts: true,
	promptPrefix: true,
	iconURL: true,
	greeting: true,
	spec: true,
	append_current_datetime: true
}).transform((obj) => ({
	...obj,
	model: obj.model ?? openAISettings.model.default,
	assistant_id: obj.assistant_id ?? void 0,
	instructions: obj.instructions ?? void 0,
	promptPrefix: obj.promptPrefix ?? null,
	iconURL: obj.iconURL ?? void 0,
	greeting: obj.greeting ?? void 0,
	spec: obj.spec ?? void 0,
	append_current_datetime: obj.append_current_datetime ?? false
})).catch(() => ({
	model: openAISettings.model.default,
	assistant_id: void 0,
	instructions: void 0,
	promptPrefix: null,
	iconURL: void 0,
	greeting: void 0,
	spec: void 0,
	append_current_datetime: false
}));
const compactAssistantSchema = tConversationSchema.pick({
	chatProjectId: true,
	model: true,
	assistant_id: true,
	instructions: true,
	promptPrefix: true,
	artifacts: true,
	iconURL: true,
	greeting: true,
	spec: true
}).transform((obj) => removeNullishValues(obj)).catch(() => ({}));
const agentsBaseSchema = tConversationSchema.pick({
	chatProjectId: true,
	model: true,
	modelLabel: true,
	temperature: true,
	top_p: true,
	presence_penalty: true,
	frequency_penalty: true,
	resendFiles: true,
	imageDetail: true,
	agent_id: true,
	instructions: true,
	promptPrefix: true,
	iconURL: true,
	greeting: true,
	maxContextTokens: true
});
const agentsSchema = agentsBaseSchema.transform((obj) => ({
	...obj,
	model: obj.model ?? agentsSettings.model.default,
	modelLabel: obj.modelLabel ?? null,
	temperature: obj.temperature ?? 1,
	top_p: obj.top_p ?? 1,
	presence_penalty: obj.presence_penalty ?? 0,
	frequency_penalty: obj.frequency_penalty ?? 0,
	resendFiles: typeof obj.resendFiles === "boolean" ? obj.resendFiles : agentsSettings.resendFiles.default,
	imageDetail: obj.imageDetail ?? "auto",
	agent_id: obj.agent_id ?? void 0,
	instructions: obj.instructions ?? void 0,
	promptPrefix: obj.promptPrefix ?? null,
	iconURL: obj.iconURL ?? void 0,
	greeting: obj.greeting ?? void 0,
	maxContextTokens: obj.maxContextTokens ?? void 0
})).catch(() => ({
	model: agentsSettings.model.default,
	modelLabel: null,
	temperature: 1,
	top_p: 1,
	presence_penalty: 0,
	frequency_penalty: 0,
	resendFiles: agentsSettings.resendFiles.default,
	imageDetail: "auto",
	agent_id: void 0,
	instructions: void 0,
	promptPrefix: null,
	iconURL: void 0,
	greeting: void 0,
	maxContextTokens: void 0
}));
const openAIBaseSchema = tConversationSchema.pick({
	chatProjectId: true,
	model: true,
	modelLabel: true,
	chatGptLabel: true,
	promptPrefix: true,
	temperature: true,
	top_p: true,
	presence_penalty: true,
	frequency_penalty: true,
	resendFiles: true,
	artifacts: true,
	imageDetail: true,
	stop: true,
	iconURL: true,
	greeting: true,
	spec: true,
	maxContextTokens: true,
	max_tokens: true,
	reasoning_effort: true,
	reasoning_summary: true,
	reasoning_mode: true,
	reasoning_context: true,
	verbosity: true,
	useResponsesApi: true,
	web_search: true,
	disableStreaming: true,
	fileTokenLimit: true
});
const openAISchema = openAIBaseSchema.transform((obj) => removeNullishValues(obj, true)).catch(() => ({}));
const openRouterSchema = openAIBaseSchema.merge(tConversationSchema.pick({
	promptCache: true,
	promptCacheTtl: true
})).transform((obj) => removeNullishValues(obj, true)).catch(() => ({}));
const compactGoogleSchema = googleBaseSchema.transform((obj) => {
	const newObj = { ...obj };
	if (newObj.temperature === google.temperature.default) delete newObj.temperature;
	if (newObj.maxOutputTokens === google.maxOutputTokens.reset(newObj.model ?? "")) delete newObj.maxOutputTokens;
	if (newObj.topP === google.topP.default) delete newObj.topP;
	if (newObj.topK === google.topK.default) delete newObj.topK;
	return removeNullishValues(newObj, true);
}).catch(() => ({}));
const anthropicBaseSchema = tConversationSchema.pick({
	chatProjectId: true,
	model: true,
	modelLabel: true,
	promptPrefix: true,
	temperature: true,
	maxOutputTokens: true,
	topP: true,
	topK: true,
	resendFiles: true,
	promptCache: true,
	promptCacheTtl: true,
	thinking: true,
	thinkingBudget: true,
	effort: true,
	thinkingDisplay: true,
	artifacts: true,
	iconURL: true,
	greeting: true,
	spec: true,
	maxContextTokens: true,
	web_search: true,
	fileTokenLimit: true,
	stop: true,
	stream: true
});
const anthropicSchema = anthropicBaseSchema.transform((obj) => removeNullishValues(obj)).catch(() => ({}));
const tBannerSchema = zod.z.object({
	bannerId: zod.z.string(),
	message: zod.z.string(),
	displayFrom: zod.z.string(),
	displayTo: zod.z.string(),
	createdAt: zod.z.string(),
	updatedAt: zod.z.string(),
	isPublic: zod.z.boolean(),
	persistable: zod.z.boolean().default(false)
});
const compactAgentsBaseSchema = tConversationSchema.pick({
	chatProjectId: true,
	spec: true,
	iconURL: true,
	greeting: true,
	agent_id: true,
	instructions: true,
	additional_instructions: true
});
const compactAgentsSchema = compactAgentsBaseSchema.transform((obj) => removeNullishValues(obj)).catch(() => ({}));
//#endregion
//#region src/balance.ts
const REFILL_INTERVAL_UNITS = [
	"seconds",
	"minutes",
	"hours",
	"days",
	"weeks",
	"months"
];
/** How long an unreleased in-flight balance reservation keeps counting against the balance. */
const DEFAULT_BALANCE_RESERVATION_TTL_MS = 1800 * 1e3;
/** Shortest reservation TTL; a live reservation is renewed every half TTL. */
const MIN_BALANCE_RESERVATION_TTL_MS = 10 * 1e3;
function getRefillEligibilityDate(lastRefill, value, unit) {
	const result = new Date(lastRefill);
	switch (unit) {
		case "seconds":
			result.setSeconds(result.getSeconds() + value);
			return result;
		case "minutes":
			result.setMinutes(result.getMinutes() + value);
			return result;
		case "hours":
			result.setHours(result.getHours() + value);
			return result;
		case "days":
			result.setDate(result.getDate() + value);
			return result;
		case "weeks":
			result.setDate(result.getDate() + value * 7);
			return result;
		case "months":
			result.setMonth(result.getMonth() + value);
			return result;
		default: return result;
	}
}
//#endregion
//#region src/limits.ts
/** Maximum number of explicit subagents per parent agent. UI + Zod schema share this. */
const MAX_SUBAGENTS = 10;
/** Hard upper bound for `endpoints.agents.maxSubagents`, keeping the request-validation
*  cap bounded no matter what the config file says. */
const MAX_SUBAGENTS_CEILING = 50;
let maxSubagents = 10;
/** Effective subagents-per-agent cap; initialized from `endpoints.agents.maxSubagents` at startup. */
const getMaxSubagents = () => maxSubagents;
/** Applies a configured cap; any missing or out-of-range value resets to the default. */
const setMaxSubagents = (value) => {
	maxSubagents = typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 50 ? value : 10;
};
/** Chat project field limits. The dialogs and the persistence layer share these,
*  so the inputs stop at the same point the server would otherwise truncate. */
const MAX_CHAT_PROJECT_NAME_LENGTH = 100;
const MAX_CHAT_PROJECT_DESCRIPTION_LENGTH = 1e3;
/** Mirrors the bounded graph-child member limit in `@librechat/agents`. */
const MAX_GRAPH_SUBAGENT_MEMBERS = 32;
/** Characters of retained tool output one stopped turn may be tokenized for, so the
*  context gauge can add an exact figure instead of an estimate. The schema default
*  and the save path share it; tokenizing runs ~60 ms/MB, once per stopped turn. */
const DEFAULT_MAX_RETAINED_TOOL_COUNT_CHARS = 8 * 1024 * 1024;
/** Token ceiling for the block of Ask User answers carried verbatim in an agent's
*  user context (`endpoints.agents.askUserQuestion.retainedAnswers.maxTokens`).
*  Older answers drop first once the block exceeds it; the newest set is always kept. */
const DEFAULT_RETAINED_ANSWER_TOKENS = 4096;
//#endregion
//#region src/generate.ts
let ComponentTypes = /* @__PURE__ */ function(ComponentTypes) {
	ComponentTypes["Input"] = "input";
	ComponentTypes["Textarea"] = "textarea";
	ComponentTypes["Slider"] = "slider";
	ComponentTypes["Checkbox"] = "checkbox";
	ComponentTypes["Switch"] = "switch";
	ComponentTypes["Dropdown"] = "dropdown";
	ComponentTypes["Combobox"] = "combobox";
	ComponentTypes["Tags"] = "tags";
	return ComponentTypes;
}({});
let SettingTypes = /* @__PURE__ */ function(SettingTypes) {
	SettingTypes["Number"] = "number";
	SettingTypes["Boolean"] = "boolean";
	SettingTypes["String"] = "string";
	SettingTypes["Enum"] = "enum";
	SettingTypes["Array"] = "array";
	return SettingTypes;
}({});
let OptionTypes = /* @__PURE__ */ function(OptionTypes) {
	OptionTypes["Conversation"] = "conversation";
	OptionTypes["Model"] = "model";
	OptionTypes["Custom"] = "custom";
	return OptionTypes;
}({});
const requiredSettingFields = [
	"key",
	"type",
	"component"
];
function clampSettingRange(value, range) {
	if (range.positiveMin != null) {
		/** The minimum carries its own meaning here (Google's -1 for automatic),
		*  and the schema admits it outright, so it survives rather than being
		*  lifted to the floor. It need not be negative to be the sentinel. */
		if (value === range.min) return range.min;
		/** Below the sentinel there is nothing admissible to lift to, so the value
		*  resolves to it. Between the sentinel and the floor, the floor is the
		*  nearest value the generated schema accepts. */
		if (value < Math.max(range.min, 0)) return range.min;
		return Math.min(Math.max(value, range.positiveMin), range.max);
	}
	return Math.min(Math.max(value, range.min), range.max);
}
function generateDynamicSchema(settings) {
	const schemaFields = {};
	for (const setting of settings) {
		const { key, type, default: defaultValue, range, options, minText, maxText, minTags, maxTags } = setting;
		if (type === "number") {
			let numberSchema = zod.z.number();
			if (range) {
				numberSchema = numberSchema.min(range.min);
				numberSchema = numberSchema.max(range.max);
			}
			/** Widened deliberately: refine returns ZodEffects, not ZodNumber, and
			*  the number-specific chaining is already done above. */
			let schema = numberSchema;
			if (range?.positiveMin != null) {
				/** Mirrors clampSettingRange so the generated schema and the clamp
				*  agree: `min` only admits the sentinel, and any non-negative value
				*  must clear the documented floor. */
				const { positiveMin, min } = range;
				schema = numberSchema.refine((value) => value === min || value >= positiveMin, `Expected ${min} or a value of at least ${positiveMin}`);
			}
			if (typeof defaultValue === "number") schemaFields[key] = schema.default(defaultValue);
			else schemaFields[key] = schema;
			continue;
		}
		if (type === "boolean") {
			const schema = zod.z.boolean();
			if (typeof defaultValue === "boolean") schemaFields[key] = schema.default(defaultValue);
			else schemaFields[key] = schema;
			continue;
		}
		if (type === "string") {
			let schema = zod.z.string();
			if (minText) schema = schema.min(minText);
			if (maxText) schema = schema.max(maxText);
			if (typeof defaultValue === "string") schemaFields[key] = schema.default(defaultValue);
			else schemaFields[key] = schema;
			continue;
		}
		if (type === "enum") {
			if (!options || options.length === 0) {
				console.warn(`Missing or empty 'options' for enum setting '${key}'.`);
				continue;
			}
			const schema = zod.z.enum(options);
			if (typeof defaultValue === "string") schemaFields[key] = schema.default(defaultValue);
			else schemaFields[key] = schema;
			continue;
		}
		if (type === "array") {
			let schema = zod.z.array(zod.z.string().or(zod.z.number()));
			if (minTags && schema instanceof zod.ZodArray) schema = schema.min(minTags);
			if (maxTags && schema instanceof zod.ZodArray) schema = schema.max(maxTags);
			if (defaultValue && Array.isArray(defaultValue)) schema = schema.default(defaultValue);
			schemaFields[key] = schema;
			continue;
		}
		console.warn(`Unsupported setting type: ${type}`);
	}
	return zod.z.object(schemaFields);
}
const ZodTypeToSettingType = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBoolean: "boolean"
};
const minColumns = 1;
const maxColumns = 4;
const minSliderOptions = 2;
const minDropdownOptions = 2;
const minComboboxOptions = 2;
/**
* Validates the provided setting using the constraints unique to each component type.
* @throws {ZodError} Throws a ZodError if any validation fails.
*/
function validateSettingDefinitions(settings) {
	const errors = [];
	const columnsSet = /* @__PURE__ */ new Set();
	for (const setting of settings) if (setting.columns !== void 0) if (setting.columns < minColumns || setting.columns > maxColumns) errors.push({
		code: zod.ZodIssueCode.custom,
		message: `Invalid columns value for setting ${setting.key}. Must be between ${minColumns} and ${maxColumns}.`,
		path: ["columns"]
	});
	else columnsSet.add(setting.columns);
	const columns = columnsSet.size === 1 ? columnsSet.values().next().value : 2;
	for (const setting of settings) {
		for (const field of requiredSettingFields) if (setting[field] === void 0) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Missing required field ${field} for setting ${setting.key}.`,
			path: [field]
		});
		const settingTypes = Object.values(SettingTypes);
		if (!settingTypes.includes(setting.type)) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid type for setting ${setting.key}. Must be one of ${settingTypes.join(", ")}.`,
			path: ["type"]
		});
		if (setting.component === "tags" && setting.type !== "array" || setting.component !== "tags" && setting.type === "array") errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Tags component for setting ${setting.key} must have type array.`,
			path: ["type"]
		});
		if (setting.component === "tags") {
			if (setting.minTags !== void 0 && setting.minTags < 0) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Invalid minTags value for setting ${setting.key}. Must be non-negative.`,
				path: ["minTags"]
			});
			if (setting.maxTags !== void 0 && setting.maxTags < 0) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Invalid maxTags value for setting ${setting.key}. Must be non-negative.`,
				path: ["maxTags"]
			});
			if (setting.default && !Array.isArray(setting.default)) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Invalid default value for setting ${setting.key}. Must be an array.`,
				path: ["default"]
			});
			if (setting.default && setting.maxTags && setting.default.length > setting.maxTags) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Invalid default value for setting ${setting.key}. Must have at most ${setting.maxTags} tags.`,
				path: ["default"]
			});
			if (setting.default && setting.minTags && setting.default.length < setting.minTags) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Invalid default value for setting ${setting.key}. Must have at least ${setting.minTags} tags.`,
				path: ["default"]
			});
			if (!setting.default) setting.default = [];
		}
		if (setting.component === "input" || setting.component === "textarea") {
			if (setting.type === "number" && setting.component === "textarea") errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Textarea component for setting ${setting.key} must have type string.`,
				path: ["type"]
			});
			if (setting.minText !== void 0 && setting.maxText !== void 0 && setting.minText > setting.maxText) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `For setting ${setting.key}, minText cannot be greater than maxText.`,
				path: [
					setting.key,
					"minText",
					"maxText"
				]
			});
			if (!setting.placeholder) setting.placeholder = "";
		}
		if (setting.component === "slider") {
			if (setting.type === "number" && !setting.range) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Slider component for setting ${setting.key} must have a range if type is number.`,
				path: ["range"]
			});
			if (setting.type === "enum" && (!setting.options || setting.options.length < minSliderOptions)) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Slider component for setting ${setting.key} requires at least ${minSliderOptions} options for enum type.`,
				path: ["options"]
			});
			setting.includeInput = setting.type === "number" ? setting.includeInput ?? true : false;
		}
		if (setting.component === "slider" && setting.type === "number") {
			if (setting.default === void 0 && setting.range) {
				/** The midpoint of the admissible interval, which a positive floor
				*  narrows: the span between the sentinel and that floor holds no value
				*  the generated schema accepts, so a midpoint taken across it would
				*  fail the validation below. */
				const floor = Math.max(setting.range.min, setting.range.positiveMin ?? setting.range.min);
				setting.default = Math.round((floor + setting.range.max) / 2);
			}
		}
		if (setting.component === "checkbox" || setting.component === "switch") {
			if (setting.options && setting.options.length > 2) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Checkbox/Switch component for setting ${setting.key} must have 1-2 options.`,
				path: ["options"]
			});
			if (!setting.default && setting.type === "boolean") setting.default = false;
		}
		if (setting.component === "dropdown") {
			if (!setting.options || setting.options.length < minDropdownOptions) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Dropdown component for setting ${setting.key} requires at least ${minDropdownOptions} options.`,
				path: ["options"]
			});
			if (!setting.default && setting.options && setting.options.length > 0) setting.default = setting.options[0];
		}
		if (setting.component === "combobox") {
			if (!setting.options || setting.options.length < minComboboxOptions) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Combobox component for setting ${setting.key} requires at least ${minComboboxOptions} options.`,
				path: ["options"]
			});
			if (!setting.default && setting.options && setting.options.length > 0) setting.default = setting.options[0];
		}
		if (!setting.columnSpan) setting.columnSpan = Math.floor((columns ?? 0) / 2);
		if (!setting.label) setting.label = setting.key;
		if (setting.component === "input" || setting.component === "textarea") {
			if (setting.minText !== void 0 && setting.minText < 0) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Invalid minText value for setting ${setting.key}. Must be non-negative.`,
				path: ["minText"]
			});
			if (setting.maxText !== void 0 && setting.maxText < 0) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Invalid maxText value for setting ${setting.key}. Must be non-negative.`,
				path: ["maxText"]
			});
		}
		if (setting.optionType !== "custom") {
			const conversationSchema = tConversationSchema.shape[setting.key];
			if (!conversationSchema) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Setting ${setting.key} with optionType "${setting.optionType}" must be defined in tConversationSchema.`,
				path: ["optionType"]
			});
			else if ((ZodTypeToSettingType[conversationSchema._def.typeName] || null) !== setting.type) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Setting ${setting.key} with optionType "${setting.optionType}" must match the type defined in tConversationSchema.`,
				path: ["optionType"]
			});
		}
		if (setting.type === "number" && isNaN(setting.default) && setting.default != null) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid default value for setting ${setting.key}. Must be a number.`,
			path: ["default"]
		});
		if (setting.type === "boolean" && typeof setting.default !== "boolean" && setting.default != null) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid default value for setting ${setting.key}. Must be a boolean.`,
			path: ["default"]
		});
		if ((setting.type === "string" || setting.type === "enum") && typeof setting.default !== "string" && setting.default != null) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid default value for setting ${setting.key}. Must be a string.`,
			path: ["default"]
		});
		if (setting.type === "enum" && setting.options && !setting.options.includes(setting.default)) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid default value for setting ${setting.key}. Must be one of the options: [${setting.options.join(", ")}].`,
			path: ["default"]
		});
		if (setting.type === "number" && setting.range && typeof setting.default === "number" && (setting.default < setting.range.min || setting.default > setting.range.max)) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid default value for setting ${setting.key}. Must be within the range [${setting.range.min}, ${setting.range.max}].`,
			path: ["default"]
		});
		if (setting.type === "number" && setting.range?.positiveMin != null && setting.range.positiveMin > setting.range.max) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid range for setting ${setting.key}. positiveMin (${setting.range.positiveMin}) cannot exceed max (${setting.range.max}).`,
			path: ["range"]
		});
		if (setting.type === "number" && setting.range?.positiveMin != null && typeof setting.default === "number" && setting.default !== setting.range.min && setting.default < setting.range.positiveMin) errors.push({
			code: zod.ZodIssueCode.custom,
			message: `Invalid default value for setting ${setting.key}. Must be ${setting.range.min} or at least ${setting.range.positiveMin}.`,
			path: ["default"]
		});
		if (setting.enumMappings && setting.type === "enum" && setting.options) {
			for (const option of setting.options) if (!(option in setting.enumMappings)) errors.push({
				code: zod.ZodIssueCode.custom,
				message: `Missing enumMapping for option "${option}" in setting ${setting.key}.`,
				path: ["enumMappings"]
			});
		}
	}
	if (errors.length > 0) throw new zod.ZodError(errors);
}
const generateOpenAISchema = (customOpenAI) => {
	const defaults = {
		...openAISettings,
		...customOpenAI
	};
	return tConversationSchema.pick({
		model: true,
		chatGptLabel: true,
		promptPrefix: true,
		temperature: true,
		top_p: true,
		presence_penalty: true,
		frequency_penalty: true,
		resendFiles: true,
		imageDetail: true,
		maxContextTokens: true
	}).transform((obj) => ({
		...obj,
		model: obj.model ?? defaults.model.default,
		chatGptLabel: obj.chatGptLabel ?? null,
		promptPrefix: obj.promptPrefix ?? null,
		temperature: obj.temperature ?? defaults.temperature.default,
		top_p: obj.top_p ?? defaults.top_p.default,
		presence_penalty: obj.presence_penalty ?? defaults.presence_penalty.default,
		frequency_penalty: obj.frequency_penalty ?? defaults.frequency_penalty.default,
		resendFiles: typeof obj.resendFiles === "boolean" ? obj.resendFiles : defaults.resendFiles.default,
		imageDetail: obj.imageDetail ?? defaults.imageDetail.default,
		maxContextTokens: obj.maxContextTokens ?? void 0
	})).catch(() => ({
		model: defaults.model.default,
		chatGptLabel: null,
		promptPrefix: null,
		temperature: defaults.temperature.default,
		top_p: defaults.top_p.default,
		presence_penalty: defaults.presence_penalty.default,
		frequency_penalty: defaults.frequency_penalty.default,
		resendFiles: defaults.resendFiles.default,
		imageDetail: defaults.imageDetail.default,
		maxContextTokens: void 0
	}));
};
const generateGoogleSchema = (customGoogle) => {
	const defaults = {
		...googleSettings,
		...customGoogle
	};
	return tConversationSchema.pick({
		model: true,
		modelLabel: true,
		promptPrefix: true,
		examples: true,
		temperature: true,
		maxOutputTokens: true,
		topP: true,
		topK: true,
		maxContextTokens: true
	}).transform((obj) => {
		return {
			...obj,
			model: obj.model ?? defaults.model.default,
			modelLabel: obj.modelLabel ?? null,
			promptPrefix: obj.promptPrefix ?? null,
			examples: obj.examples ?? [{
				input: { content: "" },
				output: { content: "" }
			}],
			temperature: obj.temperature ?? defaults.temperature.default,
			maxOutputTokens: obj.maxOutputTokens ?? defaults.maxOutputTokens.reset(obj.model ?? defaults.model.default),
			topP: obj.topP ?? defaults.topP.default,
			topK: obj.topK ?? defaults.topK.default,
			maxContextTokens: obj.maxContextTokens ?? void 0
		};
	}).catch(() => ({
		model: defaults.model.default,
		modelLabel: null,
		promptPrefix: null,
		examples: [{
			input: { content: "" },
			output: { content: "" }
		}],
		temperature: defaults.temperature.default,
		maxOutputTokens: defaults.maxOutputTokens.default,
		topP: defaults.topP.default,
		topK: defaults.topK.default,
		maxContextTokens: void 0
	}));
};
//#endregion
//#region src/stateful-code.ts
const STATEFUL_CODE_ENVIRONMENTS = [
	"user",
	"agent-user",
	"conversation"
];
/** Resolve a deployment allowlist in stable UI order. An omitted value preserves
* the backward-compatible behavior where every environment is available. */
function resolveAllowedStatefulCodeEnvironments(configured) {
	if (configured == null) return [...STATEFUL_CODE_ENVIRONMENTS];
	const configuredSet = new Set(configured);
	return STATEFUL_CODE_ENVIRONMENTS.filter((environment) => configuredSet.has(environment));
}
/** Keep an allowed preference, otherwise select the first deployment-allowed scope. */
function resolveStatefulCodeEnvironment(preferred, configured) {
	const allowed = resolveAllowedStatefulCodeEnvironments(configured);
	return preferred != null && allowed.includes(preferred) ? preferred : allowed[0];
}
//#endregion
//#region src/models.ts
const modelSpecSubagentsSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	allowSelf: zod.z.boolean().optional(),
	shareFiles: zod.z.boolean().optional(),
	agent_ids: zod.z.array(zod.z.string()).optional()
}).superRefine((subagents, ctx) => {
	const maxSubagents = getMaxSubagents();
	if ((subagents.agent_ids?.length ?? 0) > maxSubagents) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["agent_ids"],
		message: `agent_ids must contain at most ${maxSubagents} item(s)`
	});
});
function resolveModelSpecEndpoint(modelSpec) {
	const preset = modelSpec?.preset;
	if (preset?.endpoint != null) return preset.endpoint;
	/**
	* An explicit `endpoint: null` is a statement, not an omission — such specs
	* validated (and were skipped downstream) before inference existed, so
	* inferring here would silently activate them. Only an absent key infers,
	* and only from a non-empty `agent_id`: form-backed writers persist
	* untouched fields as `''`, which names no agent.
	*/
	if (preset?.endpoint === null) return;
	return preset?.agent_id ? "agents" : void 0;
}
/**
* Writes each spec's resolved endpoint back onto its preset so every consumer —
* endpoint matching, the selector, access filters, startup presets, provider-key
* reachability — reads a complete spec instead of re-deriving it. Apply once
* where the effective config is assembled (YAML load and DB-override merge);
* downstream code then needs no awareness of inference.
*
* Returns the original object, and the original spec objects, when nothing
* needs filling in, so cached configs and memoized consumers see no new
* identities.
*/
function materializeModelSpecEndpoints(modelSpecs) {
	const list = modelSpecs?.list;
	if (!list?.length) return modelSpecs;
	let changed = false;
	const materialized = list.map((spec) => {
		if (spec?.preset == null || spec.preset.endpoint != null) return spec;
		const endpoint = resolveModelSpecEndpoint(spec);
		if (endpoint == null) return spec;
		changed = true;
		return {
			...spec,
			preset: {
				...spec.preset,
				endpoint
			}
		};
	});
	if (!changed) return modelSpecs;
	return {
		...modelSpecs,
		list: materialized
	};
}
const tModelSpecSchema = zod.z.object({
	name: zod.z.string(),
	label: zod.z.string(),
	preset: tModelSpecPresetSchema,
	order: zod.z.number().optional(),
	default: zod.z.boolean().optional(),
	softDefault: zod.z.boolean().optional(),
	description: zod.z.string().optional(),
	group: zod.z.string().optional(),
	groupIcon: zod.z.union([zod.z.string(), eModelEndpointSchema]).optional(),
	showIconInMenu: zod.z.boolean().optional(),
	showIconInHeader: zod.z.boolean().optional(),
	showOnLanding: zod.z.boolean().optional(),
	conversation_starters: zod.z.array(zod.z.string()).optional(),
	showInMenu: zod.z.boolean().optional(),
	iconURL: zod.z.union([zod.z.string(), eModelEndpointSchema]).optional(),
	authType: authTypeSchema.optional(),
	hideBadgeRow: zod.z.boolean().optional(),
	webSearch: zod.z.boolean().optional(),
	fileSearch: zod.z.boolean().optional(),
	executeCode: zod.z.boolean().optional(),
	memory: zod.z.boolean().optional(),
	askUserQuestion: zod.z.boolean().optional(),
	runInBackground: zod.z.union([zod.z.boolean(), zod.z.array(zod.z.string())]).optional(),
	describeIntent: zod.z.union([zod.z.boolean(), zod.z.array(zod.z.string())]).optional(),
	artifacts: zod.z.union([zod.z.string(), zod.z.boolean()]).optional(),
	mcpServers: zod.z.array(zod.z.string()).optional(),
	skills: zod.z.union([zod.z.boolean(), zod.z.array(zod.z.string())]).optional(),
	subagents: modelSpecSubagentsSchema.optional()
});
const specsConfigSchema = zod.z.object({
	enforce: zod.z.boolean().default(false),
	prioritize: zod.z.boolean().default(true),
	list: zod.z.array(tModelSpecSchema).default([]),
	addedEndpoints: zod.z.array(zod.z.union([zod.z.string(), eModelEndpointSchema])).optional()
});
//#endregion
//#region src/file-config.ts
const supportsFiles = {
	["openAI"]: true,
	["google"]: true,
	["assistants"]: true,
	["azureAssistants"]: true,
	["agents"]: true,
	["azureOpenAI"]: true,
	["anthropic"]: true,
	["custom"]: true,
	["bedrock"]: true
};
const excelFileTypes = [
	"application/vnd.ms-excel",
	"application/msexcel",
	"application/x-msexcel",
	"application/x-ms-excel",
	"application/x-excel",
	"application/x-dos_ms_excel",
	"application/xls",
	"application/x-xls",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];
const fullMimeTypesList = [
	"text/x-c",
	"text/x-c++",
	"application/csv",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"text/html",
	"text/x-java",
	"application/json",
	"text/markdown",
	"application/pdf",
	"text/x-php",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.openxmlformats-officedocument.presentationml.template",
	"text/x-python",
	"text/x-script.python",
	"text/x-ruby",
	"text/x-tex",
	"text/plain",
	"text/css",
	"text/calendar",
	"text/vtt",
	"image/jpeg",
	"text/javascript",
	"image/gif",
	"image/png",
	"image/heic",
	"image/heif",
	"application/x-tar",
	"application/x-sh",
	"application/typescript",
	"application/sql",
	"application/yaml",
	"application/vnd.coffeescript",
	"application/xml",
	"application/zip",
	"application/x-zip-compressed",
	"application/x-parquet",
	"application/vnd.oasis.opendocument.text",
	"application/vnd.oasis.opendocument.spreadsheet",
	"application/vnd.oasis.opendocument.presentation",
	"application/vnd.oasis.opendocument.graphics",
	"image/svg",
	"image/svg+xml",
	"message/rfc822",
	"video/mp4",
	"video/avi",
	"video/mov",
	"video/wmv",
	"video/flv",
	"video/webm",
	"video/mkv",
	"video/m4v",
	"video/3gp",
	"video/ogv",
	"audio/mp3",
	"audio/wav",
	"audio/ogg",
	"audio/m4a",
	"audio/aac",
	"audio/flac",
	"audio/wma",
	"audio/opus",
	"audio/mpeg",
	...excelFileTypes
];
const codeInterpreterMimeTypesList = [
	"text/x-c",
	"text/x-c++",
	"application/csv",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"text/html",
	"text/x-java",
	"application/json",
	"text/markdown",
	"application/pdf",
	"text/x-php",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.openxmlformats-officedocument.presentationml.template",
	"text/x-python",
	"text/x-script.python",
	"text/x-ruby",
	"text/x-tex",
	"text/plain",
	"text/css",
	"text/calendar",
	"image/jpeg",
	"text/javascript",
	"image/gif",
	"image/png",
	"image/heic",
	"image/heif",
	"application/x-tar",
	"application/typescript",
	"application/xml",
	"application/zip",
	"application/x-zip-compressed",
	"application/x-parquet",
	...excelFileTypes
];
const retrievalMimeTypesList = [
	"text/x-c",
	"text/x-c++",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"text/html",
	"text/x-java",
	"application/json",
	"text/markdown",
	"application/pdf",
	"text/x-php",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.openxmlformats-officedocument.presentationml.template",
	"text/x-python",
	"text/x-script.python",
	"text/x-ruby",
	"text/x-tex",
	"text/plain"
];
const imageExtRegex = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i;
/** Maps MIME types to Bedrock Converse API document format values */
const bedrockDocumentFormats = {
	"application/pdf": "pdf",
	"text/csv": "csv",
	"application/csv": "csv",
	"application/msword": "doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
	"application/vnd.ms-excel": "xls",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
	"text/html": "html",
	"text/plain": "txt",
	"text/markdown": "md"
};
/**
* Whether an upload belongs to the conversation rather than to the agent. The value
* arrives from multipart form data, so it can be the string "false", which is truthy.
* Shared so the route, the authorization check and processing cannot disagree about it.
*/
const isMessageFileUpload = (value) => value === true || value === "true";
/**
* Whether the upload's conversation uses the Responses API, which decides whether Azure
* can carry a document natively. Multipart form data has no booleans, so it arrives as
* the string "true".
*/
const isResponsesApiUpload = (value) => value === true || value === "true";
/**
* The name a file carries inside the code sandbox.
*
* Image uploads are converted to the configured output type while the record keeps the
* original filename, so the extension has to follow the stored bytes or the sandbox
* decoder is handed a mismatch. Provisioning and priming both resolve the mount path
* from here: deriving it twice under different rules leaves a later turn advertising a
* path that does not exist in the sandbox.
*/
const resolveSandboxFilename = (filename, mimeType) => {
	if (!mimeType?.startsWith("image/")) return filename;
	const subtype = mimeType.slice(6);
	if (![
		"webp",
		"png",
		"jpeg",
		"gif"
	].includes(subtype)) return filename;
	const accepted = subtype === "jpeg" ? [".jpg", ".jpeg"] : [`.${subtype}`];
	const lastDot = filename.lastIndexOf(".");
	const currentExt = lastDot > 0 ? filename.slice(lastDot).toLowerCase() : "";
	if (accepted.includes(currentExt)) return filename;
	return `${lastDot > 0 ? filename.slice(0, lastDot) : filename}${accepted[0]}`;
};
/**
* The Responses setting a turn actually runs on. A saved agent's own record wins, since
* execution reads its model parameters; a conversation only answers for itself. Upload
* and delivery must agree here, or a document is stored as raw provider content and then
* re-resolved to text it has no extraction for.
*/
const resolveUseResponsesApi = (agentValue, conversationValue) => agentValue ?? conversationValue ?? void 0;
const isBedrockDocumentType = (mimeType) => mimeType != null && mimeType in bedrockDocumentFormats;
/** MIME types Bedrock's Converse document path can send to the model (mirrors `bedrockDocumentFormats`). */
const bedrockDocumentMimeTypes = Object.keys(bedrockDocumentFormats);
/** File extensions accepted by Bedrock document uploads (for input accept attributes) */
const bedrockDocumentExtensions = ".pdf,.csv,.doc,.docx,.xls,.xlsx,.html,.htm,.txt,.md,application/pdf,text/csv,application/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html,text/plain,text/markdown";
/** Textual `application/*` MIME types that can be decoded and sent as plain text */
const textualApplicationTypes = new Set([
	"application/json",
	"application/xml",
	"application/yaml",
	"application/sql",
	"application/typescript",
	"application/x-sh",
	"application/csv"
]);
/**
* MIME types the Anthropic Messages API accepts as a plain-text document source
* (`source.type: 'text'`)
*/
const isAnthropicTextDocumentType = (mimeType) => mimeType != null && (mimeType.startsWith("text/") || textualApplicationTypes.has(mimeType));
/**
* MIME types the Anthropic Messages API document path can send to the model
* (mirrors `isBedrockDocumentType`): PDF via base64, textual types via a
* plain-text document source. All other types are rejected with a provider 400.
*/
const isAnthropicDocumentType = (mimeType) => mimeType === "application/pdf" || isAnthropicTextDocumentType(mimeType);
const excelMimeTypes = /^application\/(vnd\.ms-excel|msexcel|x-msexcel|x-ms-excel|x-excel|x-dos_ms_excel|xls|x-xls|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/;
const textMimeTypes = /^(text\/(x-c|x-csharp|tab-separated-values|x-c\+\+|x-h|x-java|html|markdown|x-php|x-python|x-script\.python|x-ruby|x-tex|plain|css|vtt|javascript|csv|xml|calendar))$/;
const applicationMimeTypes = /^(application\/(epub\+zip|csv|json|msword|pdf|x-tar|x-sh|x-zip-compressed|typescript|sql|yaml|x-parquet|vnd\.apache\.parquet|vnd\.coffeescript|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|presentationml\.(presentation|template)|spreadsheetml\.sheet)|vnd\.oasis\.opendocument\.(text|spreadsheet|presentation|graphics)|xml|zip))$/;
const imageMimeTypes = /^image\/(jpeg|gif|png|webp|heic|heif)$/;
const audioMimeTypes = /^audio\/(mp3|mpeg|mpeg3|wav|wave|x-wav|ogg|vorbis|mp4|m4a|x-m4a|flac|x-flac|webm|aac|wma|opus)$/;
const videoMimeTypes = /^video\/(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|ogv)$/;
const defaultOCRMimeTypes = [
	imageMimeTypes,
	excelMimeTypes,
	/^application\/pdf$/,
	/^application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|presentationml\.presentation)$/,
	/^application\/vnd\.openxmlformats-officedocument\.presentationml\.template$/,
	/^application\/vnd\.ms-(word|powerpoint)$/,
	/^application\/epub\+zip$/,
	/^application\/vnd\.oasis\.opendocument\.(text|spreadsheet|presentation|graphics)$/
];
/** MIME types handled by the built-in document parser (pdf, docx, excel variants, ods/odt) */
const documentParserMimeTypes = [
	excelMimeTypes,
	/^application\/pdf$/,
	/^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
	/^application\/vnd\.oasis\.opendocument\.spreadsheet$/,
	/^application\/vnd\.oasis\.opendocument\.text$/
];
const defaultTextMimeTypes = [/^[\w.-]+\/[\w.-]+$/];
const defaultSTTMimeTypes = [audioMimeTypes];
const supportedMimeTypes = [
	textMimeTypes,
	excelMimeTypes,
	applicationMimeTypes,
	imageMimeTypes,
	videoMimeTypes,
	audioMimeTypes,
	/^image\/(svg|svg\+xml)$/,
	/^message\/rfc822$/
];
const codeInterpreterMimeTypes = [
	textMimeTypes,
	excelMimeTypes,
	applicationMimeTypes,
	imageMimeTypes
];
const codeTypeMapping = {
	c: "text/x-c",
	cs: "text/x-csharp",
	cpp: "text/x-c++",
	h: "text/x-h",
	md: "text/markdown",
	php: "text/x-php",
	py: "text/x-python",
	rb: "text/x-ruby",
	tex: "text/x-tex",
	java: "text/x-java",
	js: "text/javascript",
	sh: "application/x-sh",
	ts: "application/typescript",
	tar: "application/x-tar",
	zip: "application/zip",
	txt: "text/plain",
	log: "text/plain",
	csv: "text/csv",
	tsv: "text/tab-separated-values",
	parquet: "application/x-parquet",
	json: "application/json",
	xml: "application/xml",
	html: "text/html",
	htm: "text/html",
	css: "text/css",
	yml: "application/yaml",
	yaml: "application/yaml",
	sql: "application/sql",
	dart: "text/plain",
	coffee: "application/vnd.coffeescript",
	go: "text/plain",
	rs: "text/plain",
	swift: "text/plain",
	kt: "text/plain",
	kts: "text/plain",
	scala: "text/plain",
	lua: "text/plain",
	r: "text/plain",
	pl: "text/plain",
	pm: "text/plain",
	groovy: "text/plain",
	gradle: "text/plain",
	clj: "text/plain",
	cljs: "text/plain",
	cljc: "text/plain",
	elm: "text/plain",
	eml: "message/rfc822",
	erl: "text/plain",
	hrl: "text/plain",
	ex: "text/plain",
	exs: "text/plain",
	hs: "text/plain",
	lhs: "text/plain",
	ml: "text/plain",
	mli: "text/plain",
	fs: "text/plain",
	fsx: "text/plain",
	lisp: "text/plain",
	cl: "text/plain",
	scm: "text/plain",
	rkt: "text/plain",
	jsx: "text/plain",
	tsx: "text/plain",
	vue: "text/plain",
	svelte: "text/plain",
	astro: "text/plain",
	scss: "text/plain",
	sass: "text/plain",
	less: "text/plain",
	styl: "text/plain",
	toml: "text/plain",
	ini: "text/plain",
	cfg: "text/plain",
	conf: "text/plain",
	env: "text/plain",
	properties: "text/plain",
	graphql: "text/plain",
	gql: "text/plain",
	proto: "text/plain",
	dockerfile: "text/plain",
	makefile: "text/plain",
	cmake: "text/plain",
	rake: "text/plain",
	gemspec: "text/plain",
	bash: "text/plain",
	zsh: "text/plain",
	fish: "text/plain",
	ps1: "text/plain",
	psm1: "text/plain",
	bat: "text/plain",
	cmd: "text/plain",
	asm: "text/plain",
	s: "text/plain",
	v: "text/plain",
	zig: "text/plain",
	nim: "text/plain",
	cr: "text/plain",
	d: "text/plain",
	pas: "text/plain",
	pp: "text/plain",
	f90: "text/plain",
	f95: "text/plain",
	f03: "text/plain",
	jl: "text/plain",
	m: "text/plain",
	mm: "text/plain",
	ada: "text/plain",
	adb: "text/plain",
	ads: "text/plain",
	cob: "text/plain",
	cbl: "text/plain",
	tcl: "text/plain",
	awk: "text/plain",
	sed: "text/plain",
	odt: "application/vnd.oasis.opendocument.text",
	ods: "application/vnd.oasis.opendocument.spreadsheet",
	odp: "application/vnd.oasis.opendocument.presentation",
	odg: "application/vnd.oasis.opendocument.graphics",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	ppt: "application/vnd.ms-powerpoint",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	potx: "application/vnd.openxmlformats-officedocument.presentationml.template",
	ics: "text/calendar",
	ical: "text/calendar",
	ifb: "text/calendar",
	icalendar: "text/calendar"
};
/** Maps image extensions to MIME types for formats browsers may not recognize */
const imageTypeMapping = {
	heic: "image/heic",
	heif: "image/heif"
};
/** Normalizes non-standard MIME types that browsers may report to their canonical forms */
const mimeTypeAliases = {
	"application/x-zip-compressed": "application/zip",
	"text/x-python-script": "text/x-python",
	"text/x-markdown": "text/markdown",
	/** freedesktop shared-mime-info (Chrome on Linux) */
	"application/x-shellscript": "application/x-sh",
	/** libmagic, i.e. `file --mime-type` */
	"text/x-shellscript": "application/x-sh"
};
/**
* Infers the MIME type from a file's extension when the browser doesn't recognize it,
* and normalizes known non-standard MIME type aliases to their canonical forms.
* @param fileName - The file name including its extension
* @param currentType - The MIME type reported by the browser (may be empty string)
* @returns The normalized or inferred MIME type; empty string if unresolvable
*/
function inferMimeType(fileName, currentType) {
	if (currentType) return mimeTypeAliases[currentType] ?? currentType;
	const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
	return codeTypeMapping[extension] || imageTypeMapping[extension] || currentType;
}
const retrievalMimeTypes = [/^(text\/(x-c|x-c\+\+|x-h|html|x-java|markdown|x-php|x-python|x-script\.python|x-ruby|x-tex|plain|vtt|xml))$/, /^(application\/(json|pdf|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|presentationml\.(presentation|template))))$/];
const megabyte = 1024 * 1024;
/** Helper function to get megabytes value */
const mbToBytes = (mb) => mb * megabyte;
const defaultSizeLimit = mbToBytes(512);
const defaultSkillImportSizeLimit = mbToBytes(50);
const defaultTokenLimit = 1e5;
const defaultContextSizeLimit = mbToBytes(128);
const defaultContextCharLimit = 1e6;
const assistantsFileConfig = {
	fileLimit: 10,
	fileSizeLimit: defaultSizeLimit,
	totalSizeLimit: defaultSizeLimit,
	supportedMimeTypes,
	disabled: false
};
const fileConfig = {
	endpoints: {
		["assistants"]: assistantsFileConfig,
		["azureAssistants"]: assistantsFileConfig,
		["agents"]: assistantsFileConfig,
		["anthropic"]: {
			fileLimit: 10,
			fileSizeLimit: defaultSizeLimit,
			totalSizeLimit: defaultSizeLimit,
			supportedMimeTypes,
			disabled: false
		},
		default: {
			fileLimit: 10,
			fileSizeLimit: defaultSizeLimit,
			totalSizeLimit: defaultSizeLimit,
			supportedMimeTypes,
			disabled: false
		}
	},
	skills: { fileSizeLimit: defaultSkillImportSizeLimit },
	serverFileSizeLimit: defaultSizeLimit,
	avatarSizeLimit: mbToBytes(2),
	fileTokenLimit: defaultTokenLimit,
	fileContextSizeLimit: defaultContextSizeLimit,
	fileContextCharLimit: defaultContextCharLimit,
	clientImageResize: {
		enabled: false,
		maxWidth: 1900,
		maxHeight: 1900,
		quality: .92,
		enforced: false
	},
	ocr: { supportedMimeTypes: defaultOCRMimeTypes },
	text: { supportedMimeTypes: defaultTextMimeTypes },
	stt: { supportedMimeTypes: defaultSTTMimeTypes },
	checkType: function(fileType, supportedTypes = supportedMimeTypes) {
		return supportedTypes.some((regex) => regex.test(fileType));
	}
};
const supportedMimeTypesSchema = zod.z.array(zod.z.string()).optional();
const DefaultLLMDeliveryPath = zod.z.enum([
	"provider",
	"text",
	"none"
]);
const defaultLLMDeliveryPathSchema = zod.z.object({
	fallback: DefaultLLMDeliveryPath.optional(),
	overrides: zod.z.record(DefaultLLMDeliveryPath).optional()
});
const endpointFileConfigSchema = zod.z.object({
	disabled: zod.z.boolean().optional(),
	fileLimit: zod.z.number().min(0).optional(),
	fileSizeLimit: zod.z.number().min(0).optional(),
	totalSizeLimit: zod.z.number().min(0).optional(),
	supportedMimeTypes: supportedMimeTypesSchema.optional(),
	defaultLLMDeliveryPath: defaultLLMDeliveryPathSchema.optional(),
	legacyFileUploadUX: zod.z.boolean().optional(),
	textFallbackWithoutTools: zod.z.boolean().optional()
});
const skillFileConfigSchema = zod.z.object({ fileSizeLimit: zod.z.number().min(0).optional() });
const fileConfigSchema = zod.z.object({
	endpoints: zod.z.record(endpointFileConfigSchema).optional(),
	skills: skillFileConfigSchema.optional(),
	serverFileSizeLimit: zod.z.number().min(0).optional(),
	avatarSizeLimit: zod.z.number().min(0).optional(),
	fileTokenLimit: zod.z.number().min(0).optional(),
	fileContextSizeLimit: zod.z.number().min(0).optional(),
	fileContextCharLimit: zod.z.number().min(0).optional(),
	codeEnvLivenessSafeWindowMs: zod.z.number().min(0).optional(),
	imageGeneration: zod.z.object({
		percentage: zod.z.number().min(0).max(100).optional(),
		px: zod.z.number().min(0).optional()
	}).optional(),
	clientImageResize: zod.z.object({
		enabled: zod.z.boolean().optional(),
		maxWidth: zod.z.number().min(1).optional(),
		maxHeight: zod.z.number().min(1).optional(),
		quality: zod.z.number().min(0).max(1).optional()
	}).optional(),
	ocr: zod.z.object({ supportedMimeTypes: supportedMimeTypesSchema.optional() }).optional(),
	text: zod.z.object({ supportedMimeTypes: supportedMimeTypesSchema.optional() }).optional(),
	defaultLLMDeliveryPath: defaultLLMDeliveryPathSchema.optional(),
	legacyFileUploadUX: zod.z.boolean().optional(),
	textFallbackWithoutTools: zod.z.boolean().optional()
});
/**
* Compiler for admin-supplied MIME patterns. Defaults to native `RegExp`, which browser
* builds keep so no extra dependency is bundled. The server swaps in a linear-time engine
* via `setFileConfigRegexCompiler` so an admin-authored catastrophic-backtracking pattern
* cannot ReDoS the shared event loop when tested against an uploaded file's MIME type.
*/
let compileMimeRegex = (pattern) => new RegExp(pattern);
/** Override the MIME-pattern compiler; the server injects a linear-time engine at startup. */
const setFileConfigRegexCompiler = (compile) => {
	compileMimeRegex = compile;
};
/** Returned when every configured pattern fails to compile, so consumers that read an empty
*  allowlist as "no restriction" fail closed instead of allowing every file. */
const rejectAllMimeMatcher = { test: () => false };
/** Helper function to safely convert string patterns to matcher objects */
const convertStringsToRegex = (patterns) => {
	const compiled = patterns.reduce((acc, pattern) => {
		try {
			acc.push(compileMimeRegex(pattern));
		} catch (error) {
			console.error(`Invalid regex pattern "${pattern}" skipped.`, error);
		}
		return acc;
	}, []);
	if (patterns.length > 0 && compiled.length === 0) {
		console.error(`All ${patterns.length} MIME type pattern(s) were invalid and skipped; the resulting allowlist rejects every file.`);
		return [rejectAllMimeMatcher];
	}
	return compiled;
};
/** Detects whether the given MIME type patterns accept all file types (e.g., `.*` or `.+`). */
const isPermissiveMimeConfig = (types) => {
	if (!types || types.length === 0) return false;
	return types.some((regex) => regex.test("x-librechat/x-probe"));
};
/**
* Detects whether an endpoint's `supportedMimeTypes` were set by the admin rather than inherited
* from the built-in default list. Inheritance is signaled by referential identity with
* `supportedMimeTypes`, which `mergeWithDefault` preserves for unconfigured endpoints.
*/
const isExplicitMimeConfig = (types) => {
	if (!types || types.length === 0) return false;
	return types !== supportedMimeTypes;
};
/** Media categories that collapse to a wildcard `accept` token when any member type is allowed. */
const mimeAcceptCategories = [
	{
		/** Mirrors `imageMimeTypes` (+ the code-interpreter svg variants) so every accepted type is known. */
		category: "image",
		token: "image/*",
		samples: [
			"image/jpeg",
			"image/gif",
			"image/png",
			"image/webp",
			"image/heic",
			"image/heif",
			"image/svg",
			"image/svg+xml"
		],
		extras: [".heif", ".heic"]
	},
	{
		/** Mirrors `audioMimeTypes`. */
		category: "audio",
		token: "audio/*",
		samples: [
			"audio/mp3",
			"audio/mpeg",
			"audio/mpeg3",
			"audio/wav",
			"audio/wave",
			"audio/x-wav",
			"audio/ogg",
			"audio/vorbis",
			"audio/mp4",
			"audio/m4a",
			"audio/x-m4a",
			"audio/flac",
			"audio/x-flac",
			"audio/webm",
			"audio/aac",
			"audio/wma",
			"audio/opus"
		]
	},
	{
		/** Mirrors `videoMimeTypes`. */
		category: "video",
		token: "video/*",
		samples: [
			"video/mp4",
			"video/avi",
			"video/mov",
			"video/wmv",
			"video/flv",
			"video/webm",
			"video/mkv",
			"video/m4v",
			"video/3gp",
			"video/ogv"
		]
	}
];
/** Document/text MIME types paired with the extension(s) browsers filter on in the file picker. */
const documentMimeExtensions = [
	["application/pdf", [".pdf"]],
	["application/msword", [".doc"]],
	["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [".docx"]],
	["application/vnd.ms-excel", [".xls"]],
	["application/msexcel", [".xls"]],
	["application/x-msexcel", [".xls"]],
	["application/x-ms-excel", [".xls"]],
	["application/x-excel", [".xls"]],
	["application/x-dos_ms_excel", [".xls"]],
	["application/xls", [".xls"]],
	["application/x-xls", [".xls"]],
	["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [".xlsx"]],
	["application/vnd.ms-powerpoint", [".ppt"]],
	["application/vnd.openxmlformats-officedocument.presentationml.presentation", [".pptx"]],
	["application/vnd.openxmlformats-officedocument.presentationml.template", [".potx"]],
	["application/vnd.oasis.opendocument.text", [".odt"]],
	["application/vnd.oasis.opendocument.spreadsheet", [".ods"]],
	["application/vnd.oasis.opendocument.presentation", [".odp"]],
	["application/vnd.oasis.opendocument.graphics", [".odg"]],
	["application/rtf", [".rtf"]],
	["application/json", [".json"]],
	["application/xml", [".xml"]],
	["application/yaml", [".yaml", ".yml"]],
	["application/zip", [".zip"]],
	["application/x-zip-compressed", [".zip"]],
	["application/epub+zip", [".epub"]],
	["application/x-parquet", [".parquet"]],
	["application/vnd.apache.parquet", [".parquet"]],
	["text/csv", [".csv"]],
	["application/csv", [".csv"]],
	["text/tab-separated-values", [".tsv"]],
	["text/plain", [".txt"]],
	["text/markdown", [".md"]],
	["text/html", [".html", ".htm"]],
	["text/calendar", [".ics"]],
	["message/rfc822", [".eml"]]
];
/** Preferred extension for a known document MIME type, including its leading dot. */
function getDocumentFileExtension(mimeType) {
	const normalized = mimeType?.split(";", 1)[0].trim().toLowerCase();
	const canonical = normalized === "text/comma-separated-values" ? "text/csv" : normalized;
	return documentMimeExtensions.find(([type]) => type === canonical)?.[1][0];
}
const documentMimeSet = new Set(documentMimeExtensions.map(([mimeType]) => mimeType));
/** Every MIME type TerraMind may accept, used to detect patterns that reach beyond the representable set. */
const knownMimeUniverse = Array.from(new Set([
	...fullMimeTypesList,
	...documentMimeExtensions.map(([mimeType]) => mimeType),
	...mimeAcceptCategories.flatMap((category) => category.samples)
]));
const categoryOf = (mimeType) => {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("audio/")) return "audio";
	if (mimeType.startsWith("video/")) return "video";
	return "document";
};
/** Media types are covered by their `<cat>/*` wildcard token; document types need an explicit entry. */
const isRepresentable = (mimeType) => categoryOf(mimeType) !== "document" || documentMimeSet.has(mimeType);
/**
* Translates a finite MIME allowlist into a file-input `accept` string, intersected with what the
* provider upload path can actually send. Returns `undefined` (keep the provider filter) when a
* configured pattern matches a supported, path-handleable type that cannot be represented, so the
* picker never hides a file the path would have accepted.
*/
const buildMimeAccept = (types, { categories, documentMimeTypes }) => {
	const permittedSet = new Set(categories);
	const documentAllowSet = documentMimeTypes ? new Set(documentMimeTypes) : null;
	const emittedMedia = /* @__PURE__ */ new Set();
	const emittedDocuments = /* @__PURE__ */ new Set();
	if (!types.every((regex) => knownMimeUniverse.some((mimeType) => regex.test(mimeType)))) return;
	for (const regex of types) for (const mimeType of knownMimeUniverse) {
		if (!regex.test(mimeType)) continue;
		const category = categoryOf(mimeType);
		if (!permittedSet.has(category)) continue;
		/** The path handles documents but drops this specific type (e.g. Bedrock ignores pptx/ODF). */
		if (category === "document" && documentAllowSet && !documentAllowSet.has(mimeType)) continue;
		if (!isRepresentable(mimeType)) return;
		if (category === "document") emittedDocuments.add(mimeType);
		else emittedMedia.add(category);
	}
	const tokens = [];
	const seen = /* @__PURE__ */ new Set();
	const push = (token) => {
		if (!seen.has(token)) {
			seen.add(token);
			tokens.push(token);
		}
	};
	for (const category of mimeAcceptCategories) if (emittedMedia.has(category.category)) {
		push(category.token);
		category.extras?.forEach(push);
	}
	for (const [mimeType, extensions] of documentMimeExtensions) if (emittedDocuments.has(mimeType)) {
		extensions.forEach(push);
		push(mimeType);
	}
	return tokens.length > 0 ? tokens.join(",") : void 0;
};
/**
* Resolves the file-input `accept` value for a configured `supportedMimeTypes` allowlist, scoped to
* what the current upload path (`capability`) can send to the model.
* - `undefined` for the built-in default or a config that can't be represented safely, so callers
*   keep their provider-specific filter.
* - `''` for permissive configs (e.g. `.*`), leaving the picker unrestricted.
* - a translated `accept` string for a recognized finite allowlist (images, PDFs, Office docs, etc.).
*
* The picker `accept` is a UX convenience, not a security boundary: the backend still enforces
* `supportedMimeTypes` on upload.
*/
const getConfiguredMimeAccept = (types, capability) => {
	/** Referential identity with the built-in list signals an unconfigured endpoint (keep provider filter). */
	if (!types || types.length === 0 || types === supportedMimeTypes) return;
	if (isPermissiveMimeConfig(types)) return "";
	return buildMimeAccept(types, capability);
};
/**
* Gets the appropriate endpoint file configuration with standardized lookup logic.
*
* @param params - Object containing fileConfig, endpoint, and optional conversationEndpoint
* @param params.fileConfig - The merged file configuration
* @param params.endpoint - The endpoint name to look up
* @param params.conversationEndpoint - Optional conversation endpoint for additional context
* @returns The endpoint file configuration or undefined
*/
/**
* Merges an endpoint config with the default config to ensure all fields are populated.
* For document-supported providers, uses the comprehensive MIME type list (includes videos/audio).
*/
function mergeWithDefault(endpointConfig, defaultConfig, endpoint) {
	/** Use comprehensive MIME types for document-supported providers */
	const defaultMimeTypes = isDocumentSupportedProvider(endpoint) ? supportedMimeTypes : defaultConfig.supportedMimeTypes;
	return {
		disabled: endpointConfig.disabled ?? defaultConfig.disabled,
		fileLimit: endpointConfig.fileLimit ?? defaultConfig.fileLimit,
		fileSizeLimit: endpointConfig.fileSizeLimit ?? defaultConfig.fileSizeLimit,
		totalSizeLimit: endpointConfig.totalSizeLimit ?? defaultConfig.totalSizeLimit,
		supportedMimeTypes: endpointConfig.supportedMimeTypes ?? defaultMimeTypes,
		defaultLLMDeliveryPath: mergeDeliveryPathConfig(endpointConfig.defaultLLMDeliveryPath, defaultConfig.defaultLLMDeliveryPath),
		legacyFileUploadUX: endpointConfig.legacyFileUploadUX ?? defaultConfig.legacyFileUploadUX,
		textFallbackWithoutTools: endpointConfig.textFallbackWithoutTools ?? defaultConfig.textFallbackWithoutTools
	};
}
/**
* Deep-merges delivery-path config so an endpoint that supplies only one override
* still inherits the default's fallback and shared overrides. Whole-object
* replacement would silently drop the inherited routing.
*/
function mergeDeliveryPathConfig(endpointValue, defaultValue) {
	if (!endpointValue) return defaultValue;
	if (!defaultValue) return endpointValue;
	if (endpointValue.fallback != null) return endpointValue;
	const hasOverrides = endpointValue.overrides != null || defaultValue.overrides != null;
	return {
		...defaultValue.fallback != null ? { fallback: defaultValue.fallback } : {},
		...hasOverrides ? { overrides: { ...shadowByWildcard(defaultValue.overrides, endpointValue.overrides) } } : {}
	};
}
/**
* Flattens two override layers into one map that still resolves like the layered chain.
* Resolution reads exact keys before wildcards, so a plain spread would let a lower
* layer's `image/png` outrank the upper layer's `image/*`. Dropping the entries an
* upper wildcard covers restores precedence without changing how lookups work.
*/
function shadowByWildcard(lower, upper) {
	if (!lower) return { ...upper };
	const upperWildcards = /* @__PURE__ */ new Set();
	for (const key in upper) if (key.endsWith("/*")) upperWildcards.add(key.slice(0, -1));
	if (upperWildcards.size === 0) return {
		...lower,
		...upper
	};
	const retained = {};
	for (const key in lower) if (!(!key.endsWith("/*") && upperWildcards.has(key.slice(0, key.indexOf("/") + 1)) && upper?.[key] == null)) retained[key] = lower[key];
	return {
		...retained,
		...upper
	};
}
function getEndpointFileConfig(params) {
	const { fileConfig: mergedFileConfig, endpoint, endpointType } = params;
	if (!mergedFileConfig?.endpoints) return fileConfig.endpoints.default;
	/** Compute an effective default by merging user-configured default over the base default */
	const baseDefaultConfig = fileConfig.endpoints.default;
	const globalDefaultConfig = {
		...baseDefaultConfig,
		defaultLLMDeliveryPath: mergeDeliveryPathConfig(mergedFileConfig.defaultLLMDeliveryPath, baseDefaultConfig.defaultLLMDeliveryPath),
		legacyFileUploadUX: mergedFileConfig.legacyFileUploadUX ?? baseDefaultConfig.legacyFileUploadUX,
		textFallbackWithoutTools: mergedFileConfig.textFallbackWithoutTools ?? baseDefaultConfig.textFallbackWithoutTools
	};
	const userDefaultConfig = mergedFileConfig.endpoints.default;
	const defaultConfig = userDefaultConfig ? mergeWithDefault(userDefaultConfig, globalDefaultConfig, "default") : globalDefaultConfig;
	const normalizedEndpoint = normalizeEndpointName(endpoint ?? "");
	const standardEndpoints = new Set([
		"default",
		"agents",
		"assistants",
		"azureAssistants",
		"openAI",
		"azureOpenAI",
		"anthropic",
		"google",
		"bedrock"
	]);
	const normalizedEndpointType = normalizeEndpointName(endpointType ?? "");
	if (endpointType === "custom" || !standardEndpoints.has(normalizedEndpointType) && normalizedEndpoint && !standardEndpoints.has(normalizedEndpoint)) {
		/** 1. Check direct endpoint lookup (could be normalized or not) */
		if (endpoint && mergedFileConfig.endpoints[endpoint]) return mergeWithDefault(mergedFileConfig.endpoints[endpoint], defaultConfig, endpoint);
		/** 2. Check normalized endpoint lookup (skip standard endpoint keys) */
		for (const key in mergedFileConfig.endpoints) if (!standardEndpoints.has(key) && normalizeEndpointName(key) === normalizedEndpoint) return mergeWithDefault(mergedFileConfig.endpoints[key], defaultConfig, key);
		/** 3. Fallback to generic 'custom' config if any */
		if (mergedFileConfig.endpoints["custom"]) return mergeWithDefault(mergedFileConfig.endpoints["custom"], defaultConfig, endpoint);
		/** 4. Fallback to 'agents' (all custom endpoints are non-assistants) */
		if (mergedFileConfig.endpoints["agents"]) return mergeWithDefault(mergedFileConfig.endpoints["agents"], defaultConfig, endpoint);
		/** 5. Fallback to default */
		return defaultConfig;
	}
	/** Check endpointType first (most reliable for standard endpoints) */
	if (endpointType && mergedFileConfig.endpoints[endpointType]) return mergeWithDefault(mergedFileConfig.endpoints[endpointType], defaultConfig, endpointType);
	/** Check direct endpoint lookup */
	if (endpoint && mergedFileConfig.endpoints[endpoint]) return mergeWithDefault(mergedFileConfig.endpoints[endpoint], defaultConfig, endpoint);
	/** Check normalized endpoint */
	if (normalizedEndpoint && mergedFileConfig.endpoints[normalizedEndpoint]) return mergeWithDefault(mergedFileConfig.endpoints[normalizedEndpoint], defaultConfig, normalizedEndpoint);
	if (isAgentsEndpoint(normalizedEndpointType || normalizedEndpoint) && mergedFileConfig.endpoints["agents"]) return mergeWithDefault(mergedFileConfig.endpoints["agents"], defaultConfig, "agents");
	/** Return default config */
	return defaultConfig;
}
function mergeFileConfig(dynamic) {
	const mergedConfig = {
		...fileConfig,
		endpoints: { ...fileConfig.endpoints },
		skills: { ...fileConfig.skills },
		ocr: {
			...fileConfig.ocr,
			supportedMimeTypes: fileConfig.ocr?.supportedMimeTypes || []
		},
		text: {
			...fileConfig.text,
			supportedMimeTypes: fileConfig.text?.supportedMimeTypes || []
		},
		stt: {
			...fileConfig.stt,
			supportedMimeTypes: fileConfig.stt?.supportedMimeTypes || []
		}
	};
	if (!dynamic) return mergedConfig;
	if (dynamic.defaultLLMDeliveryPath !== void 0) mergedConfig.defaultLLMDeliveryPath = dynamic.defaultLLMDeliveryPath;
	if (dynamic.legacyFileUploadUX !== void 0) mergedConfig.legacyFileUploadUX = dynamic.legacyFileUploadUX;
	if (dynamic.textFallbackWithoutTools !== void 0) mergedConfig.textFallbackWithoutTools = dynamic.textFallbackWithoutTools;
	if (dynamic.serverFileSizeLimit !== void 0) mergedConfig.serverFileSizeLimit = mbToBytes(dynamic.serverFileSizeLimit);
	if (dynamic.avatarSizeLimit !== void 0) mergedConfig.avatarSizeLimit = mbToBytes(dynamic.avatarSizeLimit);
	if (dynamic.fileTokenLimit !== void 0) mergedConfig.fileTokenLimit = dynamic.fileTokenLimit;
	if (dynamic.fileContextSizeLimit !== void 0) mergedConfig.fileContextSizeLimit = mbToBytes(dynamic.fileContextSizeLimit);
	if (dynamic.fileContextCharLimit !== void 0) mergedConfig.fileContextCharLimit = dynamic.fileContextCharLimit;
	if (dynamic.skills?.fileSizeLimit !== void 0) mergedConfig.skills = {
		...mergedConfig.skills,
		fileSizeLimit: mbToBytes(dynamic.skills.fileSizeLimit)
	};
	if (dynamic.clientImageResize !== void 0) mergedConfig.clientImageResize = {
		...mergedConfig.clientImageResize,
		...dynamic.clientImageResize,
		enforced: dynamic.clientImageResize.enabled !== void 0
	};
	if (dynamic.ocr !== void 0) {
		const { supportedMimeTypes: ocrMimeTypes, ...ocrRest } = dynamic.ocr;
		mergedConfig.ocr = {
			...mergedConfig.ocr,
			...ocrRest
		};
		if (ocrMimeTypes) mergedConfig.ocr.supportedMimeTypes = convertStringsToRegex(ocrMimeTypes);
	}
	if (dynamic.text !== void 0) {
		const { supportedMimeTypes: textMimeTypes, ...textRest } = dynamic.text;
		mergedConfig.text = {
			...mergedConfig.text,
			...textRest
		};
		if (textMimeTypes) mergedConfig.text.supportedMimeTypes = convertStringsToRegex(textMimeTypes);
	}
	if (!dynamic.endpoints) return mergedConfig;
	for (const key in dynamic.endpoints) {
		const dynamicEndpoint = dynamic.endpoints[key];
		/** Deep copy the base endpoint config if it exists to prevent mutation */
		if (!mergedConfig.endpoints[key]) mergedConfig.endpoints[key] = {};
		else mergedConfig.endpoints[key] = { ...mergedConfig.endpoints[key] };
		const mergedEndpoint = mergedConfig.endpoints[key];
		if (dynamicEndpoint.disabled === true) {
			mergedEndpoint.disabled = true;
			mergedEndpoint.fileLimit = 0;
			mergedEndpoint.fileSizeLimit = 0;
			mergedEndpoint.totalSizeLimit = 0;
			mergedEndpoint.supportedMimeTypes = [];
			continue;
		}
		if (dynamicEndpoint.fileSizeLimit !== void 0) mergedEndpoint.fileSizeLimit = mbToBytes(dynamicEndpoint.fileSizeLimit);
		if (dynamicEndpoint.totalSizeLimit !== void 0) mergedEndpoint.totalSizeLimit = mbToBytes(dynamicEndpoint.totalSizeLimit);
		["fileLimit"].forEach((field) => {
			if (dynamicEndpoint[field] !== void 0) mergedEndpoint[field] = dynamicEndpoint[field];
		});
		if (dynamicEndpoint.disabled !== void 0) mergedEndpoint.disabled = dynamicEndpoint.disabled;
		if (dynamicEndpoint.supportedMimeTypes) mergedEndpoint.supportedMimeTypes = convertStringsToRegex(dynamicEndpoint.supportedMimeTypes);
		if (dynamicEndpoint.defaultLLMDeliveryPath !== void 0) mergedEndpoint.defaultLLMDeliveryPath = dynamicEndpoint.defaultLLMDeliveryPath;
		if (dynamicEndpoint.legacyFileUploadUX !== void 0) mergedEndpoint.legacyFileUploadUX = dynamicEndpoint.legacyFileUploadUX;
		if (dynamicEndpoint.textFallbackWithoutTools !== void 0) mergedEndpoint.textFallbackWithoutTools = dynamicEndpoint.textFallbackWithoutTools;
	}
	return mergedConfig;
}
//#endregion
//#region src/api-endpoints.ts
let BASE_URL = "";
if (typeof process === "undefined" || process.browser === true) BASE_URL = document.querySelector("base")?.getAttribute("href") || "/";
if (BASE_URL && BASE_URL.endsWith("/")) BASE_URL = BASE_URL.slice(0, -1);
const apiBaseUrl = () => BASE_URL;
const buildQuery = (params) => {
	const query = Object.entries(params).filter(([, value]) => {
		if (Array.isArray(value)) return value.length > 0;
		return value !== void 0 && value !== null && value !== "";
	}).map(([key, value]) => {
		if (Array.isArray(value)) return value.map((v) => `${key}=${encodeURIComponent(v)}`).join("&");
		return `${key}=${encodeURIComponent(String(value))}`;
	}).join("&");
	return query ? `?${query}` : "";
};
const health = () => `${BASE_URL}/health`;
const user = () => `${BASE_URL}/api/user`;
const userPreferences = () => `${user()}/preferences`;
const balance = () => `${BASE_URL}/api/balance`;
const userPlugins = () => `${BASE_URL}/api/user/plugins`;
const deleteUser$1 = () => `${BASE_URL}/api/user/delete`;
const codeEnvironments = () => `${BASE_URL}/api/code-environments`;
const codeEnvironmentPairings = () => `${codeEnvironments()}/pairings`;
const codeEnvironmentById = (id) => `${codeEnvironments()}/${encodeURIComponent(id)}`;
const codeEnvironmentSettings = (id) => `${codeEnvironmentById(id)}/settings`;
const codeEnvironmentStatus = (id) => `${codeEnvironmentById(id)}/status`;
const codeEnvironmentConversationDecision = (conversationId) => `${codeEnvironments()}/conversations/${encodeURIComponent(conversationId)}/decision`;
const messagesRoot = `${BASE_URL}/api/messages`;
const messages = (params) => {
	const { conversationId, messageId, ...rest } = params;
	if (conversationId && messageId) return `${messagesRoot}/${conversationId}/${messageId}`;
	if (conversationId) return `${messagesRoot}/${conversationId}`;
	return `${messagesRoot}${buildQuery(rest)}`;
};
const messagesArtifacts = (messageId) => `${messagesRoot}/artifact/${messageId}`;
const messagesBranch = () => `${messagesRoot}/branch`;
const shareRoot = `${BASE_URL}/api/share`;
const shareMessages = (shareId) => `${shareRoot}/${shareId}`;
const forkSharedMessages = (shareId) => `${shareRoot}/${shareId}/fork`;
const sharedStartupConfig = (shareId) => `${shareMessages(shareId)}/config`;
const getSharedLink$1 = (conversationId) => `${shareRoot}/link/${conversationId}`;
const getSharedLinks = (pageSize, sortBy, sortDirection, search, cursor) => `${shareRoot}${buildQuery({
	pageSize,
	sortBy,
	sortDirection,
	search,
	cursor
})}`;
const createSharedLink$1 = (conversationId) => `${shareRoot}/${conversationId}`;
const updateSharedLink$1 = (shareId) => `${shareRoot}/${shareId}`;
/** Share-scoped file routes: serve snapshotted files via shared-link permission. */
const sharedFile = (shareId, fileId) => `${shareRoot}/${shareId}/files/${encodeURIComponent(fileId)}`;
const sharedFileDownload = (shareId, fileId) => `${sharedFile(shareId, fileId)}/download`;
const sharedFilePreview = (shareId, fileId) => `${sharedFile(shareId, fileId)}/preview`;
const keysEndpoint = `${BASE_URL}/api/keys`;
const keys = () => keysEndpoint;
const userKeyQuery$1 = (name) => `${keysEndpoint}?name=${name}`;
const revokeUserKey$1 = (name) => `${keysEndpoint}/${name}`;
const revokeAllUserKeys$1 = () => `${keysEndpoint}?all=true`;
const apiKeysEndpoint = `${BASE_URL}/api/api-keys`;
const apiKeys = () => apiKeysEndpoint;
const apiKeyById = (id) => `${apiKeysEndpoint}/${id}`;
const conversationsRoot = `${BASE_URL}/api/convos`;
const conversations = (params) => {
	return `${conversationsRoot}${buildQuery(params)}`;
};
const conversationById = (id) => `${conversationsRoot}/${id}`;
const parentSubagents = (parentConversationId) => `${conversationsRoot}/${encodeURIComponent(parentConversationId)}/subagents`;
const subagentThread = (parentConversationId, threadId, taskId, cursor) => {
	const endpoint = `${conversationsRoot}/${encodeURIComponent(parentConversationId)}/subagents/${encodeURIComponent(threadId)}`;
	if (taskId != null) return `${endpoint}?taskId=${encodeURIComponent(taskId)}`;
	return cursor == null ? endpoint : `${endpoint}?cursor=${encodeURIComponent(cursor)}`;
};
const subagentControl = (parentConversationId, threadId) => `${conversationsRoot}/${encodeURIComponent(parentConversationId)}/subagents/${encodeURIComponent(threadId)}/control`;
const genTitle$1 = (conversationId) => `${conversationsRoot}/gen_title/${encodeURIComponent(conversationId)}`;
const updateConversation$1 = () => `${conversationsRoot}/update`;
const archiveConversation$1 = () => `${conversationsRoot}/archive`;
const archiveAllConversations$1 = () => `${conversationsRoot}/archive/all`;
const pinConversation$1 = () => `${conversationsRoot}/pin`;
const deleteConversation$1 = () => `${conversationsRoot}`;
const deleteAllConversation = () => `${conversationsRoot}/all`;
const importConversation = () => `${conversationsRoot}/import`;
const forkConversation$1 = () => `${conversationsRoot}/fork`;
const duplicateConversation$1 = () => `${conversationsRoot}/duplicate`;
const projectsRoot = `${BASE_URL}/api/projects`;
const projects = (params = {}) => {
	return `${projectsRoot}${buildQuery(params)}`;
};
const projectById = (id) => `${projectsRoot}/${encodeURIComponent(id)}`;
const projectConversation = (conversationId) => `${projectsRoot}/conversations/${encodeURIComponent(conversationId)}`;
const searchEnabled = () => `${BASE_URL}/api/search/enable`;
const presets = () => `${BASE_URL}/api/presets`;
const deletePreset$1 = () => `${BASE_URL}/api/presets/delete`;
const aiEndpoints = () => `${BASE_URL}/api/endpoints`;
const tokenConfig = () => `${BASE_URL}/api/endpoints/token-config`;
const models = () => `${BASE_URL}/api/models`;
const tokenizer = () => `${BASE_URL}/api/tokenizer`;
const login$1 = () => `${BASE_URL}/api/auth/login`;
const logout$1 = () => `${BASE_URL}/api/auth/logout`;
const register$1 = () => `${BASE_URL}/api/auth/register`;
const loginGoogle = () => `${BASE_URL}/api/auth/google`;
const refreshToken$1 = (retry) => `${BASE_URL}/api/auth/refresh${retry === true ? "?retry=true" : ""}`;
const requestPasswordReset$1 = () => `${BASE_URL}/api/auth/requestPasswordReset`;
const resetPassword$1 = () => `${BASE_URL}/api/auth/resetPassword`;
const verifyEmail$1 = () => `${BASE_URL}/api/user/verify`;
const loginPage = () => `${BASE_URL}/login`;
const registerPage = () => `${BASE_URL}/register`;
const REDIRECT_PARAM = "redirect_to";
const LOGIN_PATH_RE = /(?:^|\/)login(?:\/|$)/;
/**
* Builds a `/login?redirect_to=...` URL from the given or current location.
* Returns plain `/login` (no param) when already on a login route to prevent recursive nesting.
*/
function buildLoginRedirectUrl(pathname, search, hash) {
	const p = pathname ?? window.location.pathname;
	if (LOGIN_PATH_RE.test(p)) return "/login";
	const s = search ?? window.location.search;
	const h = hash ?? window.location.hash;
	const currentPath = `${BASE_URL && (p === BASE_URL || p.startsWith(BASE_URL + "/")) ? p.slice(BASE_URL.length) || "/" : p}${s}${h}`;
	if (!currentPath || currentPath === "/") return "/login";
	return `/login?${REDIRECT_PARAM}=${encodeURIComponent(currentPath)}`;
}
const resendVerificationEmail$1 = () => `${BASE_URL}/api/user/verify/resend`;
const plugins = () => `${BASE_URL}/api/plugins`;
const mcpReinitialize = (serverName) => `${BASE_URL}/api/mcp/${serverName}/reinitialize`;
const mcpConnectionStatus = () => `${BASE_URL}/api/mcp/connection/status`;
const mcpServerConnectionStatus = (serverName) => `${BASE_URL}/api/mcp/connection/status/${serverName}`;
const mcpAuthValues = (serverName) => {
	return `${BASE_URL}/api/mcp/${serverName}/auth-values`;
};
const cancelMCPOAuth$1 = (serverName) => {
	return `${BASE_URL}/api/mcp/oauth/cancel/${serverName}`;
};
const mcpOAuthStatus = (flowId) => `${BASE_URL}/api/mcp/oauth/status/${encodeURIComponent(flowId)}`;
const mcpOAuthBind = (serverName) => `${BASE_URL}/api/mcp/${serverName}/oauth/bind`;
const actionOAuthBind = (actionId) => `${BASE_URL}/api/actions/${actionId}/oauth/bind`;
const config = (context) => `${BASE_URL}/api/config${buildQuery({ context })}`;
const prompts = () => `${BASE_URL}/api/prompts`;
const addPromptToGroup$1 = (groupId) => `${BASE_URL}/api/prompts/groups/${groupId}/prompts`;
const assistants = ({ path = "", options, version, endpoint, isAvatar }) => {
	let url = isAvatar === true ? `${images()}/assistants` : `${BASE_URL}/api/assistants/v${version}`;
	if (path && path !== "") url += `/${path}`;
	if (endpoint) options = {
		...options ?? {},
		endpoint
	};
	if (options && Object.keys(options).length > 0) {
		const queryParams = new URLSearchParams(options).toString();
		url += `?${queryParams}`;
	}
	return url;
};
const agents = ({ path = "", options }) => {
	let url = `${BASE_URL}/api/agents`;
	if (path && path !== "") url += `/${path}`;
	if (options && Object.keys(options).length > 0) {
		const queryParams = new URLSearchParams(options).toString();
		url += `?${queryParams}`;
	}
	return url;
};
const activeJobs = () => `${BASE_URL}/api/agents/chat/active`;
const agentQueuedTurnsRoot = `${BASE_URL}/api/agents/chat/queued-turns`;
const agentQueuedTurns = () => agentQueuedTurnsRoot;
const agentQueuedTurnsByConversation = (conversationId, clientRequestIds = []) => {
	const uniqueIds = Array.from(new Set(clientRequestIds)).slice(0, 100);
	const knownIds = uniqueIds.length > 0 ? `&${uniqueIds.map((id) => `clientRequestIds=${encodeURIComponent(id)}`).join("&")}` : "";
	return `${agentQueuedTurnsRoot}?conversationId=${encodeURIComponent(conversationId)}${knownIds}`;
};
const agentQueuedTurn = (queuedTurnId) => `${agentQueuedTurnsRoot}/${encodeURIComponent(queuedTurnId)}`;
const mcp = {
	tools: `${BASE_URL}/api/mcp/tools`,
	servers: `${BASE_URL}/api/mcp/servers`
};
const mcpServer = (serverName) => `${BASE_URL}/api/mcp/servers/${serverName}`;
const revertAgentVersion$1 = (agent_id) => `${agents({ path: `${agent_id}/revert` })}`;
const files = () => `${BASE_URL}/api/files`;
const filePreview = (fileId) => `${BASE_URL}/api/files/${encodeURIComponent(fileId)}/preview`;
/** Owner-scoped usage touch so queued attachments outlive the upload-window TTL. */
const fileUsage = () => `${BASE_URL}/api/files/usage`;
const agentFiles = (agentId) => `${BASE_URL}/api/files/agent/${agentId}`;
const images = () => `${files()}/images`;
const avatar = () => `${images()}/avatar`;
const speech = () => `${files()}/speech`;
const speechToText$1 = () => `${speech()}/stt`;
const textToSpeech$1 = () => `${speech()}/tts`;
const textToSpeechManual = () => `${textToSpeech$1()}/manual`;
const textToSpeechVoices = () => `${textToSpeech$1()}/voices`;
const getCustomConfigSpeech$1 = () => `${speech()}/config/get`;
const getPromptGroup$1 = (_id) => `${prompts()}/groups/${_id}`;
const getPromptGroupsWithFilters = (filter) => {
	let url = `${prompts()}/groups`;
	const cleanedFilter = Object.entries(filter).reduce((acc, [key, value]) => {
		if (value !== void 0 && value !== null && value !== "") acc[key] = value;
		return acc;
	}, {});
	if (Object.keys(cleanedFilter).length > 0) {
		const queryParams = new URLSearchParams(cleanedFilter).toString();
		url += `?${queryParams}`;
	}
	return url;
};
const getPromptsWithFilters = (filter) => {
	let url = prompts();
	if (Object.keys(filter).length > 0) {
		const queryParams = new URLSearchParams(filter).toString();
		url += `?${queryParams}`;
	}
	return url;
};
const getPrompt$1 = (_id) => `${prompts()}/${_id}`;
const getRandomPrompts$1 = (limit, skip) => `${prompts()}/random?limit=${limit}&skip=${skip}`;
const postPrompt = prompts;
const updatePromptGroup$1 = getPromptGroup$1;
const recordPromptGroupUsage$1 = (groupId) => `${prompts()}/groups/${groupId}/use`;
const updatePromptLabels$1 = (_id) => `${getPrompt$1(_id)}/labels`;
const updatePromptTag = (_id) => `${getPrompt$1(_id)}/tags/production`;
const deletePromptGroup$1 = getPromptGroup$1;
const deletePrompt$1 = ({ _id, groupId }) => {
	return `${prompts()}/${_id}?groupId=${groupId}`;
};
const getCategories$1 = () => `${BASE_URL}/api/categories`;
const getAllPromptGroups$1 = () => `${prompts()}/all`;
const schedules = () => `${BASE_URL}/api/schedules`;
const schedule = (id) => `${schedules()}/${encodeURIComponent(id)}`;
const runSchedule = (id) => `${schedule(id)}/run`;
const skills = () => `${BASE_URL}/api/skills`;
const importSkill$1 = () => `${skills()}/import`;
const getSkill$1 = (id) => `${skills()}/${encodeURIComponent(id)}`;
const listSkillsWithFilters = (filter) => {
	const cleaned = Object.entries(filter).reduce((acc, [key, value]) => {
		if (value !== void 0 && value !== null && value !== "") acc[key] = String(value);
		return acc;
	}, {});
	const query = Object.keys(cleaned).length > 0 ? `?${new URLSearchParams(cleaned).toString()}` : "";
	return `${skills()}${query}`;
};
const skillFiles = (id) => `${getSkill$1(id)}/files`;
const skillFile = (id, relativePath) => `${skillFiles(id)}/${encodeURIComponent(relativePath)}`;
const insights = () => `${BASE_URL}/api/insights`;
const insightsAccess = () => `${insights()}/access`;
const conversationTrace = (conversationId) => `${BASE_URL}/api/traces/${encodeURIComponent(conversationId)}`;
const conversationTraceAvailability = (conversationId) => `${conversationTrace(conversationId)}/availability`;
const conversationTraceRecords = (conversationId, cursor) => `${conversationTrace(conversationId)}/records${cursor ? `?${new URLSearchParams({ cursor }).toString()}` : ""}`;
const conversationTraceRecord = (conversationId, recordId, messageId, sourceId) => `${conversationTrace(conversationId)}/records/${encodeURIComponent(recordId)}?${new URLSearchParams({
	message: messageId,
	...sourceId ? { source: sourceId } : {}
}).toString()}`;
const adminSkillsSync = () => `${BASE_URL}/api/admin/skills/sync`;
const adminSkillsSyncStatus = () => `${adminSkillsSync()}/status`;
const adminSkillsSyncRun = () => `${adminSkillsSync()}/run`;
const adminSkillsSyncCredential = (credentialKey) => `${adminSkillsSync()}/credentials/${encodeURIComponent(credentialKey)}`;
const skillStates = () => `${BASE_URL}/api/user/settings/skills/active`;
const adminLangfuseConnection = () => `${BASE_URL}/api/admin/langfuse/connection`;
const adminLangfuseConnectionTest = () => `${adminLangfuseConnection()}/test`;
const adminLangfuseSessionLink = (conversationId) => `${adminLangfuseConnection()}/session/${encodeURIComponent(conversationId)}`;
const pinnedOrder = () => `${BASE_URL}/api/user/settings/pinned-order`;
const toolFavorites = () => `${BASE_URL}/api/user/settings/favorites/tools`;
const toolFavorite = (itemType, itemId) => `${toolFavorites()}/${itemType}/${encodeURIComponent(itemId)}`;
const roles = () => `${BASE_URL}/api/roles`;
const adminRoles = () => `${BASE_URL}/api/admin/roles`;
const getRole$1 = (roleName) => `${roles()}/${encodeURIComponent(roleName)}`;
const updatePromptPermissions$1 = (roleName) => `${getRole$1(roleName)}/prompts`;
const updateMemoryPermissions$1 = (roleName) => `${getRole$1(roleName)}/memories`;
const updateAgentPermissions$1 = (roleName) => `${getRole$1(roleName)}/agents`;
const updatePeoplePickerPermissions$1 = (roleName) => `${getRole$1(roleName)}/people-picker`;
const updateMCPServersPermissions$1 = (roleName) => `${getRole$1(roleName)}/mcp-servers`;
const updateRemoteAgentsPermissions$1 = (roleName) => `${getRole$1(roleName)}/remote-agents`;
const updateMarketplacePermissions$1 = (roleName) => `${getRole$1(roleName)}/marketplace`;
const updateSkillPermissions$1 = (roleName) => `${getRole$1(roleName)}/skills`;
const conversationTags = (tag) => `${BASE_URL}/api/tags${tag != null && tag ? `/${encodeURIComponent(tag)}` : ""}`;
const addTagToConversation$1 = (conversationId) => `${conversationTags()}/convo/${conversationId}`;
const userTerms = () => `${BASE_URL}/api/user/terms`;
const acceptUserTerms = () => `${BASE_URL}/api/user/terms/accept`;
const banner = () => `${BASE_URL}/api/banner`;
const feedback = (conversationId, messageId) => `${BASE_URL}/api/messages/${conversationId}/${messageId}/feedback`;
const enableTwoFactor$1 = () => `${BASE_URL}/api/auth/2fa/enable`;
const verifyTwoFactor$1 = () => `${BASE_URL}/api/auth/2fa/verify`;
const confirmTwoFactor$1 = () => `${BASE_URL}/api/auth/2fa/confirm`;
const disableTwoFactor$1 = () => `${BASE_URL}/api/auth/2fa/disable`;
const regenerateBackupCodes$1 = () => `${BASE_URL}/api/auth/2fa/backup/regenerate`;
const verifyTwoFactorTemp$1 = () => `${BASE_URL}/api/auth/2fa/verify-temp`;
const memories = () => `${BASE_URL}/api/memories`;
const memory = (key, agentId) => `${memories()}/${encodeURIComponent(key)}${agentId ? `?agentId=${encodeURIComponent(agentId)}` : ""}`;
const memoryById = (id, agentId) => `${memories()}/id/${encodeURIComponent(id)}${agentId ? `?agentId=${encodeURIComponent(agentId)}` : ""}`;
const memoryPreferences = () => `${memories()}/preferences`;
const searchPrincipals$1 = (params) => {
	const { q: query, limit, types } = params;
	let url = `${BASE_URL}/api/permissions/search-principals?q=${encodeURIComponent(query)}`;
	if (limit !== void 0) url += `&limit=${limit}`;
	if (types && types.length > 0) url += `&types=${types.join(",")}`;
	return url;
};
const getAccessRoles$1 = (resourceType) => `${BASE_URL}/api/permissions/${resourceType}/roles`;
const getResourcePermissions$1 = (resourceType, resourceId) => `${BASE_URL}/api/permissions/${resourceType}/${resourceId}`;
const updateResourcePermissions$1 = (resourceType, resourceId) => `${BASE_URL}/api/permissions/${resourceType}/${resourceId}`;
const getEffectivePermissions$1 = (resourceType, resourceId) => `${BASE_URL}/api/permissions/${resourceType}/${resourceId}/effective`;
const getAllEffectivePermissions$1 = (resourceType) => `${BASE_URL}/api/permissions/${resourceType}/effective/all`;
const graphToken = (scopes) => `${BASE_URL}/api/auth/graph-token?scopes=${encodeURIComponent(scopes)}`;
//#endregion
//#region src/types/files.ts
let FileSources = /* @__PURE__ */ function(FileSources) {
	FileSources["local"] = "local";
	FileSources["firebase"] = "firebase";
	FileSources["azure"] = "azure";
	FileSources["azure_blob"] = "azure_blob";
	FileSources["openai"] = "openai";
	FileSources["s3"] = "s3";
	FileSources["cloudfront"] = "cloudfront";
	FileSources["vectordb"] = "vectordb";
	FileSources["execute_code"] = "execute_code";
	FileSources["mistral_ocr"] = "mistral_ocr";
	FileSources["azure_mistral_ocr"] = "azure_mistral_ocr";
	FileSources["vertexai_mistral_ocr"] = "vertexai_mistral_ocr";
	FileSources["text"] = "text";
	FileSources["document_parser"] = "document_parser";
	return FileSources;
}({});
const checkOpenAIStorage = (source) => source === "openai" || source === "azure";
let FileContext = /* @__PURE__ */ function(FileContext) {
	FileContext["avatar"] = "avatar";
	FileContext["unknown"] = "unknown";
	FileContext["agents"] = "agents";
	FileContext["assistants"] = "assistants";
	FileContext["execute_code"] = "execute_code";
	FileContext["image_generation"] = "image_generation";
	FileContext["assistants_output"] = "assistants_output";
	FileContext["message_attachment"] = "message_attachment";
	FileContext["run_artifact"] = "run_artifact";
	FileContext["skill_file"] = "skill_file";
	FileContext["filename"] = "filename";
	FileContext["updatedAt"] = "updatedAt";
	FileContext["source"] = "source";
	FileContext["filterSource"] = "filterSource";
	FileContext["context"] = "context";
	FileContext["bytes"] = "bytes";
	return FileContext;
}({});
//#endregion
//#region src/types/agents.ts
let AuthTypeEnum = /* @__PURE__ */ function(AuthTypeEnum) {
	AuthTypeEnum["ServiceHttp"] = "service_http";
	AuthTypeEnum["OAuth"] = "oauth";
	AuthTypeEnum["None"] = "none";
	return AuthTypeEnum;
}({});
let AuthorizationTypeEnum = /* @__PURE__ */ function(AuthorizationTypeEnum) {
	AuthorizationTypeEnum["Bearer"] = "bearer";
	AuthorizationTypeEnum["Basic"] = "basic";
	AuthorizationTypeEnum["Custom"] = "custom";
	return AuthorizationTypeEnum;
}({});
let TokenExchangeMethodEnum = /* @__PURE__ */ function(TokenExchangeMethodEnum) {
	TokenExchangeMethodEnum["DefaultPost"] = "default_post";
	TokenExchangeMethodEnum["BasicAuthHeader"] = "basic_auth_header";
	return TokenExchangeMethodEnum;
}({});
const agentGitIdentitySchema = zod.z.object({
	name: zod.z.string().trim().min(1).max(128).refine((value) => !/[\0\r\n]/.test(value)),
	email: zod.z.string().trim().email().max(254).refine((value) => !/[\0\r\n]/.test(value))
}).optional();
//#endregion
//#region src/mcp.ts
/**
* Upper bound on a stored MCP `iconPath` (URL or data URI). Enforced by
* `sanitizeMcpIconPath`, not a schema `.max()`, so re-submitting a server whose
* stored icon predates the cap clears the icon instead of rejecting the update.
*/
const MAX_MCP_ICON_PATH_LENGTH = 256 * 1024;
const validateOAuthClientCredentials = (oauth, ctx) => {
	if (oauth.client_secret && !oauth.client_id) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["client_secret"],
		message: "OAuth client_secret requires client_id"
	});
	if (oauth.client_id && oauth.client_secret && (!oauth.authorization_url || !oauth.token_url)) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["client_secret"],
		message: "OAuth client_secret with client_id requires both authorization_url and token_url"
	});
};
const OAuthOptionsBaseSchema = zod.z.object({
	/** OAuth authorization endpoint (optional - can be auto-discovered) */
	authorization_url: zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).optional(),
	/** OAuth token endpoint (optional - can be auto-discovered) */
	token_url: zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).optional(),
	/** OAuth client ID (optional - can use dynamic registration) */
	client_id: zod.z.string().optional(),
	/** OAuth client secret (requires explicit authorization and token endpoints) */
	client_secret: zod.z.string().optional(),
	/** OAuth scopes to request */
	scope: zod.z.string().optional(),
	/** OAuth redirect URI (defaults to /api/mcp/{serverName}/oauth/callback) */
	redirect_uri: zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).optional(),
	/** Token exchange method */
	token_exchange_method: zod.z.nativeEnum(TokenExchangeMethodEnum).optional(),
	/** Supported grant types (defaults to ['authorization_code', 'refresh_token']) */
	grant_types_supported: zod.z.array(zod.z.string()).optional(),
	/** Supported token endpoint authentication methods (defaults to ['client_secret_basic', 'client_secret_post']) */
	token_endpoint_auth_methods_supported: zod.z.array(zod.z.string()).optional(),
	/** Supported response types (defaults to ['code']) */
	response_types_supported: zod.z.array(zod.z.string()).optional(),
	/** Supported code challenge methods (defaults to ['S256', 'plain']) */
	code_challenge_methods_supported: zod.z.array(zod.z.string()).optional(),
	/** Skip code challenge validation and force S256 (useful for providers like AWS Cognito that support S256 but don't advertise it) */
	skip_code_challenge_check: zod.z.boolean().optional(),
	/**
	* Auth0/Cognito-style `audience` parameter. Authorization servers that pre-date
	* RFC 8707 — most prominently Auth0 — issue API-scoped access tokens only when
	* the `/authorize` request advertises an `audience`. RFC 8707 `resource` (set
	* automatically from Protected Resource Metadata) is the standards-conformant
	* route; `audience` covers the providers that ignore it.
	*
	* When set, the value is forwarded as-is on `/authorize` (both pre-configured
	* and DCR-discovered paths). Whether it is also forwarded on the
	* `refresh_token` grant is controlled by `forward_audience_on_refresh` below.
	*
	* The `authorization_code` exchange intentionally never receives `audience` —
	* Auth0 binds audience from the original `/authorize` request and embeds it
	* in the issued access token; sending it again is redundant.
	*
	* No canonicalization is applied — the audience identifier is provider-defined
	* and may differ from the MCP server URL. This field is only accepted from
	* trusted/admin MCP configuration and is rejected from user-managed servers.
	*/
	audience: zod.z.string().min(1).optional(),
	/**
	* Whether to also forward `audience` on the `refresh_token` grant body.
	*
	* Default: `true`. Required for Auth0, which strips the API audience from
	* refreshed access tokens unless `audience` is re-supplied on every refresh
	* — without it the next MCP call 401s once the initial access token expires.
	*
	* Set to `false` for providers that document refresh requests as
	* `grant_type` + `client_id` + `refresh_token` only (Cognito and other
	* strict OAuth 2.0 token endpoints). Those providers maintain the original
	* `aud` claim across refreshes when the initial token was resource-bound,
	* so the extra parameter is redundant and may be rejected as
	* `invalid_request`.
	*
	* Ignored when `audience` itself is not configured.
	*/
	forward_audience_on_refresh: zod.z.boolean().optional(),
	/** OAuth revocation endpoint (optional - can be auto-discovered) */
	revocation_endpoint: zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).optional(),
	/** OAuth revocation endpoint authentication methods supported (optional - can be auto-discovered) */
	revocation_endpoint_auth_methods_supported: zod.z.array(zod.z.string()).optional()
});
const OAuthOptionsSchema = OAuthOptionsBaseSchema.superRefine(validateOAuthClientCredentials);
const BLOCKED_USER_OAUTH_ENDPOINT_PARAMS = ["audience", "resource"];
const envVarPattern = /\$\{[^}]+\}/;
const userOAuthEndpointUrlSchema = zod.z.string().refine((val) => !envVarPattern.test(val), { message: "Environment variable references are not allowed in URLs" }).pipe(zod.z.string().url()).refine((value) => {
	try {
		const { searchParams } = new URL(value);
		return BLOCKED_USER_OAUTH_ENDPOINT_PARAMS.every((param) => !searchParams.has(param));
	} catch {
		return true;
	}
}, { message: "OAuth endpoint URLs cannot include audience or resource query parameters" });
const UserOAuthOptionsSchema = OAuthOptionsBaseSchema.omit({
	audience: true,
	forward_audience_on_refresh: true
}).extend({
	authorization_url: userOAuthEndpointUrlSchema.optional(),
	token_url: userOAuthEndpointUrlSchema.optional(),
	redirect_uri: userOAuthEndpointUrlSchema.optional(),
	revocation_endpoint: userOAuthEndpointUrlSchema.optional(),
	audience: zod.z.never().optional(),
	forward_audience_on_refresh: zod.z.never().optional()
}).superRefine(validateOAuthClientCredentials);
const OboOptionsSchema = zod.z.object({ 
/** Scopes to request for the downstream MCP server (e.g., "api://<client-id>/Mcp.Tools.ReadWrite") */
scopes: zod.z.string().min(1) });
const MCP_SERVER_TITLE_PATTERN = /* @__PURE__ */ new RegExp("^[\\p{L}\\p{N}][\\p{L}\\p{N}\\p{M}'’ -]*$", "u");
const MCP_SERVER_TITLE_ERROR = "Title must start with a letter or number and can include spaces, hyphens, and apostrophes";
const BaseOptionsSchema = zod.z.object({
	/** Display name for the MCP server */
	title: zod.z.string().regex(MCP_SERVER_TITLE_PATTERN, MCP_SERVER_TITLE_ERROR).optional(),
	/** Description of the MCP server */
	description: zod.z.string().optional(),
	/**
	* Controls whether the MCP server is initialized during application startup.
	* - true (default): Server is initialized during app startup and included in app-level connections
	* - false: Skips initialization at startup and excludes from app-level connections - useful for servers
	*   requiring manual authentication (e.g., GitHub PAT tokens) that need to be configured through the UI after startup
	*/
	startup: zod.z.boolean().optional(),
	iconPath: zod.z.string().optional(),
	timeout: zod.z.number().int().nonnegative().optional(),
	/** Timeout (ms) for the long-lived SSE GET stream body before undici aborts it. Default: 300_000 (5 min). */
	sseReadTimeout: zod.z.number().int().positive().optional(),
	initTimeout: zod.z.number().int().nonnegative().optional(),
	/**
	* Whether the server is offered in chat.
	*
	* `false` hides it from the chat dropdown (MCPSelect) AND bars it from the
	* chat selection a request carries, so a stale or hand-written request cannot
	* reach it either. It does not restrict agents, nor a server a model spec
	* pins through `mcpServers` — both are the operator's own choice.
	*/
	chatMenu: zod.z.boolean().optional(),
	/**
	* Controls server instruction behavior:
	* - undefined/not set: No instructions included (default)
	* - true: Use server-provided instructions
	* - string: Use custom instructions (overrides server-provided)
	*/
	serverInstructions: zod.z.union([zod.z.boolean(), zod.z.string()]).optional(),
	/**
	* Whether this server requires OAuth authentication
	* If not specified, will be auto-detected during construction
	*/
	requiresOAuth: zod.z.boolean().optional(),
	/**
	* OAuth configuration for SSE and Streamable HTTP transports
	* - Optional: OAuth can be auto-discovered on 401 responses
	* - Pre-configured confidential clients must pin both OAuth endpoints
	*/
	oauth: OAuthOptionsSchema.optional(),
	/** Custom headers to send with OAuth requests (registration, discovery, token exchange, etc.) */
	oauth_headers: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	/**
	* API Key authentication configuration for SSE and Streamable HTTP transports
	* - source: 'admin' means the key is provided by admin and shared by all users
	* - source: 'user' means each user provides their own key via customUserVars
	*/
	apiKey: zod.z.object({
		/** API key value (only for admin-provided mode, stored encrypted) */
		key: zod.z.string().optional(),
		/** Whether key is provided by admin or each user */
		source: zod.z.enum(["admin", "user"]),
		/** How to format the authorization header */
		authorization_type: zod.z.enum([
			"basic",
			"bearer",
			"custom"
		]),
		/** Custom header name when authorization_type is 'custom' */
		custom_header: zod.z.string().optional()
	}).optional(),
	customUserVars: zod.z.record(zod.z.string(), zod.z.object({
		title: zod.z.string(),
		description: zod.z.string(),
		/**
		* Whether the field holds a secret and should be masked in the UI.
		* Defaults to masked when omitted; set to `false` for non-secret setup
		* values (e.g. username, project key, base URL) to render as plain text.
		*/
		sensitive: zod.z.boolean().optional()
	})).optional()
});
const ProxyUrlSchema = zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).refine((val) => {
	const protocol = new URL(val).protocol;
	return protocol === "http:" || protocol === "https:" || protocol === "socks:" || protocol === "socks5:";
}, { message: "Proxy URL must use http://, https://, socks://, or socks5://" });
const PROCESS_MCP_SERVER_FIELDS = new Set([
	"command",
	"args",
	"env",
	"cwd",
	"stderr"
]);
function isProcessMCPServerField(field) {
	return PROCESS_MCP_SERVER_FIELDS.has(field);
}
function isProcessMCPServerConfig(value) {
	if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
	const config = value;
	if (config.type === "stdio") return true;
	return Object.keys(config).some(isProcessMCPServerField);
}
function hasProcessMCPServerConfig(value) {
	if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
	return Object.values(value).some(isProcessMCPServerConfig);
}
const StdioOptionsSchema = BaseOptionsSchema.extend({
	type: zod.z.literal("stdio").default("stdio"),
	obo: zod.z.undefined().optional(),
	/**
	* The executable to run to start the server.
	*/
	command: zod.z.string(),
	/**
	* Command line arguments to pass to the executable.
	*/
	args: zod.z.array(zod.z.string()),
	/**
	* The environment to use when spawning the process.
	*
	* If not specified, the result of getDefaultEnvironment() will be used.
	* Environment variables can be referenced using ${VAR_NAME} syntax.
	*/
	env: zod.z.record(zod.z.string(), zod.z.string()).optional().transform((env) => {
		if (!env) return env;
		const processedEnv = {};
		for (const [key, value] of Object.entries(env)) processedEnv[key] = extractEnvVariable(value);
		return processedEnv;
	}),
	/**
	* How to handle stderr of the child process.
	* Accepts: 'pipe' | 'ignore' | 'inherit' | file descriptor number.
	* Defaults to "inherit".
	*/
	stderr: zod.z.union([zod.z.enum([
		"pipe",
		"ignore",
		"inherit"
	]), zod.z.number().int().nonnegative()]).optional(),
	/**
	* Working directory for the spawned process. Supplied by Agent Plugins
	* packages, which resolve and contain the path before it reaches this schema.
	*/
	cwd: zod.z.string().optional()
});
const WebSocketOptionsSchema = BaseOptionsSchema.extend({
	type: zod.z.literal("websocket").default("websocket"),
	obo: zod.z.undefined().optional(),
	url: zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).refine((val) => {
		const protocol = new URL(val).protocol;
		return protocol === "ws:" || protocol === "wss:";
	}, { message: "WebSocket URL must start with ws:// or wss://" })
});
const SSEOptionsSchema = BaseOptionsSchema.extend({
	type: zod.z.literal("sse").default("sse"),
	headers: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	/**
	* On-Behalf-Of (OBO) token exchange configuration.
	* When configured, TerraMind exchanges the logged-in user's federated access token
	* for a token scoped to this MCP server via the OAuth 2.0 OBO flow (jwt-bearer grant).
	* The exchanged token is injected as a Bearer Authorization header automatically.
	* Requires the user to be authenticated via OpenID Connect (e.g., Entra ID).
	*/
	obo: OboOptionsSchema.optional(),
	/** Optional outbound proxy URL for this remote MCP transport */
	proxy: ProxyUrlSchema.optional(),
	url: zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).refine((val) => {
		const protocol = new URL(val).protocol;
		return protocol !== "ws:" && protocol !== "wss:";
	}, { message: "SSE URL must not start with ws:// or wss://" })
});
const StreamableHTTPOptionsSchema = BaseOptionsSchema.extend({
	type: zod.z.union([zod.z.literal("streamable-http"), zod.z.literal("http")]),
	headers: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	/**
	* On-Behalf-Of (OBO) token exchange configuration.
	* When configured, TerraMind exchanges the logged-in user's federated access token
	* for a token scoped to this MCP server via the OAuth 2.0 OBO flow (jwt-bearer grant).
	* The exchanged token is injected as a Bearer Authorization header automatically.
	* Requires the user to be authenticated via OpenID Connect (e.g., Entra ID).
	*/
	obo: OboOptionsSchema.optional(),
	/** Optional outbound proxy URL for this remote MCP transport */
	proxy: ProxyUrlSchema.optional(),
	url: zod.z.string().transform((val) => extractEnvVariable(val)).pipe(zod.z.string().url()).refine((val) => {
		const protocol = new URL(val).protocol;
		return protocol !== "ws:" && protocol !== "wss:";
	}, { message: "Streamable HTTP URL must not start with ws:// or wss://" })
});
const MCPOptionsSchema = zod.z.union([
	StdioOptionsSchema,
	WebSocketOptionsSchema,
	SSEOptionsSchema,
	StreamableHTTPOptionsSchema
]);
const MCPServersSchema = zod.z.record(zod.z.string(), MCPOptionsSchema);
/**
* Helper to omit server-managed fields that should not come from UI
*/
const omitServerManagedFields = (schema) => schema.omit({
	startup: true,
	timeout: true,
	sseReadTimeout: true,
	initTimeout: true,
	chatMenu: true,
	serverInstructions: true,
	requiresOAuth: true,
	customUserVars: true,
	oauth_headers: true
});
const userManagedServerFields = (schema) => omitServerManagedFields(schema).extend({ oauth: UserOAuthOptionsSchema.optional() });
const isWsProtocol = (val) => /^wss?:/i.test(val);
const isHttpProtocol = (val) => /^https?:/i.test(val);
/**
* Builds a URL schema for user input that rejects ${VAR} env variable patterns
* and validates protocol constraints without resolving environment variables.
*/
const userUrlSchema = (protocolCheck, message) => zod.z.string().refine((val) => !envVarPattern.test(val), { message: "Environment variable references are not allowed in URLs" }).pipe(zod.z.string().url()).refine(protocolCheck, { message });
/**
* MCP Server configuration that comes from UI/API input only.
* Omits server-managed fields like startup, timeout, customUserVars, etc.
* Allows: title, description, url, iconPath, oauth (user credentials).
* Admin-only OAuth audience fields are rejected for user-managed servers.
*
* SECURITY: Stdio transport is intentionally excluded from user input.
* Stdio allows arbitrary command execution and should only be configured
* by administrators via the YAML config file (librechat.yaml).
* Only remote transports (SSE, HTTP, WebSocket) are allowed via the API.
*
* SECURITY: URL fields use userUrlSchema instead of the admin schemas'
* extractEnvVariable transform to prevent env variable exfiltration
* through user-controlled URLs (e.g. http://attacker.com/?k=${JWT_SECRET}).
* Protocol checks use positive allowlists (http(s) / ws(s)) to block
* file://, ftp://, javascript:, and other non-network schemes.
*/
const MCPServerUserInputSchema = zod.z.union([
	userManagedServerFields(WebSocketOptionsSchema).extend({ url: userUrlSchema(isWsProtocol, "WebSocket URL must use ws:// or wss://") }),
	userManagedServerFields(SSEOptionsSchema).extend({
		proxy: zod.z.never().optional(),
		url: userUrlSchema(isHttpProtocol, "SSE URL must use http:// or https://")
	}),
	userManagedServerFields(StreamableHTTPOptionsSchema).extend({
		proxy: zod.z.never().optional(),
		url: userUrlSchema(isHttpProtocol, "Streamable HTTP URL must use http:// or https://")
	})
]);
/**
* Set of every field name that may appear in a user-submitted MCP server config,
* derived from `MCPServerUserInputSchema`'s union members. Used as the comparison
* surface for the OBO lockdown check in `updateMCPServerController` so that
* server-managed fields on the existing config (`dbId`, `source`, `author`,
* `requiresOAuth`, `oauthMetadata`, etc.) don't show up as differences and
* cause spurious 403s on legitimate saves.
*
* Schema-derived rather than hand-maintained: when a new field is added to
* `BaseOptionsSchema` or any transport variant, it flows into this set
* automatically. The OBO lockdown then locks the new field by default
* (since it won't be in the hand-curated `OBO_USER_EDITABLE_FIELDS`
* allowlist), preventing a silent privilege regression.
*/
const MCP_USER_INPUT_FIELDS = (() => {
	const fields = /* @__PURE__ */ new Set();
	for (const variant of MCPServerUserInputSchema.options) {
		const shape = variant.shape;
		for (const key of Object.keys(shape)) fields.add(key);
	}
	return fields;
})();
//#endregion
//#region src/config.ts
const defaultSocialLogins = [
	"google",
	"facebook",
	"openid",
	"github",
	"discord",
	"saml"
];
/** How long a started social login may take to return to its callback before its `state` expires. */
const DEFAULT_OAUTH_STATE_TTL_MS = 600 * 1e3;
const BASE_ONLY_CONFIG_SECTIONS = ["filters"];
/** Sections that may be stored in the tenant's base config document but must
* not be overridden or tombstoned by role, group, or user config documents. */
const BASE_PRINCIPAL_CONFIG_SECTIONS = ["langfuse"];
const defaultRetrievalModels = [
	"gpt-4o",
	"o1-preview-2024-09-12",
	"o1-preview",
	"o1-mini-2024-09-12",
	"o1-mini",
	"o3-mini",
	"chatgpt-4o-latest",
	"gpt-4o-2024-05-13",
	"gpt-4o-2024-08-06",
	"gpt-4o-mini",
	"gpt-4o-mini-2024-07-18",
	"gpt-4-turbo-preview",
	"gpt-3.5-turbo-0125",
	"gpt-4-0125-preview",
	"gpt-4-1106-preview",
	"gpt-3.5-turbo-1106",
	"gpt-3.5-turbo-0125",
	"gpt-4-turbo",
	"gpt-4-0125",
	"gpt-4-1106"
];
const excludedKeys = new Set([
	"conversationId",
	"agentEventBinding",
	"agentEventActor",
	"agentEventActorCleanup",
	"agentEventActorSuspension",
	"agentEventActorReconciliations",
	"agentEventActorEpoch",
	"agentEventActorLegacyTurn",
	"subagentThread",
	"title",
	"iconURL",
	"greeting",
	"endpoint",
	"endpointType",
	"createdAt",
	"updatedAt",
	"expiredAt",
	"isTemporary",
	"messages",
	"isArchived",
	"pinned",
	"archivedAt",
	"tags",
	"user",
	"__v",
	"_id",
	"tools",
	"model",
	"files",
	"spec",
	"disableParams",
	"chatProjectId"
]);
let SettingsViews = /* @__PURE__ */ function(SettingsViews) {
	SettingsViews["default"] = "default";
	SettingsViews["advanced"] = "advanced";
	return SettingsViews;
}({});
/** Validates any FileSources value — use for file metadata, DB records, and upload routing. */
const fileSourceSchema = zod.z.nativeEnum(FileSources);
/**
* `allowedAddresses` is an SSRF exemption list scoped to private IP space.
* Validate at config-load time:
*  - Reject URLs, paths, CIDR ranges, bare host/IP forms, and whitespace.
*  - Require `host:port` or `[ipv6]:port` entries so an exemption is scoped
*    to one service port instead of every port on a private host.
*  - Reject IPv4 literals that fall outside the private/loopback/link-local
*    ranges. Public IPs are never SSRF targets, so listing one has no
*    defensive purpose and must not silently grant trust.
*  - Hostnames pass through; their resolved IP is checked at runtime by
*    `resolveHostnameSSRF` and only a private resolved IP is meaningful.
*
* Mirrors a minimal subset of `isPrivateIP` from `@librechat/api` to avoid a
* circular package dependency. The runtime helper is the authoritative check;
* this refinement is a UX guardrail.
*/
function isPrivateIPv4Literal(value) {
	const match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (!match) return false;
	const [a, b, c] = match.slice(1).map(Number);
	if (a === 0 || a === 10 || a === 127) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;
	if (a === 192 && b === 0 && c === 0) return true;
	if (a === 100 && b >= 64 && b <= 127) return true;
	if (a === 198 && (b === 18 || b === 19)) return true;
	if (a >= 224) return true;
	return false;
}
/**
* Mirrors `hasPrivateEmbeddedIPv4` in `@librechat/api`'s ip helpers: 6to4, NAT64, and Teredo
* carry an IPv4 address inside the IPv6 one, and the runtime guard blocks those when the
* embedded address is private. Kept in sync so an operator can exempt what the runtime blocks.
*/
function hasPrivateEmbeddedIPv4Literal(value) {
	const is6to4 = value.startsWith("2002:");
	const isNat64 = value.startsWith("64:ff9b::");
	const isTeredo = value.startsWith("2001::");
	if (!is6to4 && !isNat64 && !isTeredo) return false;
	const segments = value.split(":").filter((segment) => segment !== "");
	const pair = is6to4 ? segments.slice(1, 3) : segments.slice(-2);
	if (pair.length !== 2) return false;
	const hi = parseInt(pair[0], 16);
	const lo = parseInt(pair[1], 16);
	if (isNaN(hi) || isNaN(lo)) return false;
	/** RFC 4380: Teredo stores the external IPv4 as a bitwise complement. */
	const high = isTeredo ? ~hi : hi;
	const low = isTeredo ? ~lo : lo;
	return isPrivateIPv4Literal([
		high >> 8 & 255,
		high & 255,
		low >> 8 & 255,
		low & 255
	].join("."));
}
function isPrivateIPv6Literal(value) {
	if (!value.includes(":")) return false;
	if (value === "::1" || value === "::") return true;
	if (value.startsWith("fc") || value.startsWith("fd")) return true;
	const firstHextet = value.split(":", 1)[0];
	if (/^[0-9a-f]{1,4}$/.test(firstHextet ?? "")) {
		if ((parseInt(firstHextet, 16) & 65472) === 65152) return true;
	}
	const mappedMatch = value.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
	if (mappedMatch) return isPrivateIPv4Literal(mappedMatch[1]);
	return hasPrivateEmbeddedIPv4Literal(value);
}
/**
* Mirrors the allowedAddresses parser in `@librechat/api`'s auth helpers.
* Kept as a local copy because the data-provider package cannot import from
* `@librechat/api` without creating a circular dependency. Keep the two
* implementations in sync.
*/
function normalizePort(port) {
	if (typeof port !== "string" && typeof port !== "number") return "";
	const portString = String(port).trim();
	if (!/^\d+$/.test(portString)) return "";
	const parsed = Number(portString);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) return "";
	return String(parsed);
}
function parseAllowedAddressEntry(entry) {
	const trimmed = entry.toLowerCase().trim();
	const bracketedIPv6 = trimmed.match(/^\[([^\]]+)\]:(\d+)$/);
	const hostPort = bracketedIPv6 ? null : trimmed.match(/^([^:]+):(\d+)$/);
	const address = (bracketedIPv6?.[1] ?? hostPort?.[1] ?? "").replace(/^\[|\]$/g, "");
	const port = normalizePort(bracketedIPv6?.[2] ?? hostPort?.[2] ?? "");
	if (!address || !port) return null;
	return {
		address,
		port
	};
}
const allowedAddressEntrySchema = zod.z.string().refine((entry) => entry.length > 0 && entry.trim().length > 0, { message: "allowedAddresses entries must be non-empty" }).refine((entry) => !entry.includes("://") && !entry.includes("/") && !/\s/.test(entry), { message: "allowedAddresses entries must be host:port pairs — no URLs, paths, CIDR ranges, or whitespace" }).refine((entry) => parseAllowedAddressEntry(entry) != null, { message: "allowedAddresses entries must include a port, for example localhost:11434 or [::1]:11434" }).refine((entry) => {
	const parsed = parseAllowedAddressEntry(entry);
	if (!parsed) return false;
	const stripped = parsed.address;
	const isIPv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(stripped);
	const isIPv6 = !isIPv4 && stripped.includes(":");
	if (!isIPv4 && !isIPv6) return true;
	return isIPv4 ? isPrivateIPv4Literal(stripped) : isPrivateIPv6Literal(stripped);
}, { message: "allowedAddresses is scoped to private IP space — public IP literals are not permitted (use hostname:port if it resolves to a private IP)" });
const allowedAddressesSchema = zod.z.array(allowedAddressEntrySchema).optional();
const fileStorageSchema = zod.z.enum([
	"local",
	"firebase",
	"s3",
	"azure_blob",
	"cloudfront"
]);
const fileStrategiesSchema = zod.z.object({
	default: fileStorageSchema.optional(),
	avatar: fileStorageSchema.optional(),
	image: fileStorageSchema.optional(),
	document: fileStorageSchema.optional(),
	skills: fileStorageSchema.optional()
}).optional();
const cloudfrontSigningSchema = zod.z.enum([
	"none",
	"cookies",
	"url"
]);
const cloudfrontConfigSchema = zod.z.object({
	domain: zod.z.string().url(),
	distributionId: zod.z.string().optional(),
	invalidateOnDelete: zod.z.boolean().default(false),
	imageSigning: cloudfrontSigningSchema.default("none"),
	urlExpiry: zod.z.number().positive().default(3600),
	cookieExpiry: zod.z.number().positive().max(604800).default(1800),
	cookieDomain: zod.z.string().min(1).refine((d) => d.startsWith("."), { message: "cookieDomain must start with a dot (e.g., \".example.com\") to apply to subdomains" }).optional(),
	storageRegion: zod.z.string().min(1).optional(),
	includeRegionInPath: zod.z.boolean().default(false),
	requireSignedAccess: zod.z.boolean().default(false)
}).refine((data) => !data.invalidateOnDelete || !!data.distributionId, {
	message: "distributionId is required when invalidateOnDelete is true",
	path: ["distributionId"]
}).refine((data) => data.imageSigning !== "cookies" || !!data.cookieDomain, {
	message: "cookieDomain is required when imageSigning is \"cookies\" (e.g., \".example.com\" for API at api.example.com and CDN at cdn.example.com)",
	path: ["cookieDomain"]
}).refine((data) => !data.requireSignedAccess || data.imageSigning === "cookies", {
	message: "cloudfront.requireSignedAccess=true requires cloudfront.imageSigning=\"cookies\" (signed URL mode is not yet implemented)",
	path: ["requireSignedAccess"]
}).optional();
const skillSyncIdentifierSchema = zod.z.string().min(1).max(64).regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, { message: "must start with a letter or digit and contain only letters, digits, underscores, or hyphens" });
const SKILL_SYNC_MIN_INTERVAL_MINUTES = 5;
const SKILL_SYNC_MAX_INTERVAL_MINUTES = Math.floor(2147483647 / 6e4);
const SKILL_SYNC_DEFAULT_DISCOVERY_DEPTH = 2;
const SKILL_SYNC_MAX_DISCOVERY_DEPTH = 10;
const skillSyncGitHubOwnerSchema = zod.z.string().min(1).max(39).regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/, { message: "must be a valid GitHub owner name" });
const skillSyncGitHubRepoSchema = zod.z.string().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/, { message: "must be a valid GitHub repository name" });
const invalidGitRefChars = new Set([
	"~",
	"^",
	":",
	"?",
	"*",
	"["
]);
function hasInvalidGitRefCharacter(value) {
	for (const char of value) {
		const code = char.charCodeAt(0);
		if (code <= 32 || code === 127 || invalidGitRefChars.has(char)) return true;
	}
	return false;
}
const skillSyncGitHubRefSchema = zod.z.string().min(1).max(255).refine((value) => !value.startsWith("/") && !value.endsWith("/"), { message: "must not start or end with a slash" }).refine((value) => !value.includes("..") && !value.includes("//") && !value.includes("\\"), { message: "must not contain traversal segments, empty path segments, or backslashes" }).refine((value) => !value.includes("@{") && value !== "@", { message: "must not contain invalid Git ref syntax" }).refine((value) => !value.endsWith("."), { message: "must not end with a dot" }).refine((value) => !hasInvalidGitRefCharacter(value), { message: "must not contain invalid Git ref characters" }).refine((value) => value.split("/").every((segment) => segment && !segment.startsWith(".") && !segment.endsWith(".lock")), { message: "must contain valid Git ref path segments" });
const skillSyncPathSchema = zod.z.string().max(500).refine((value) => value.trim().length > 0, { message: "must not be empty" }).transform((value) => {
	const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
	return trimmed === "." ? "" : trimmed;
}).refine((value) => !value.includes("\\") && !value.includes(".."), { message: "must not contain traversal segments or backslashes" }).refine((value) => value === "" || /^[a-zA-Z0-9._\-/]+$/.test(value), { message: "must contain only letters, digits, dots, underscores, hyphens, and slashes" }).refine((value) => value === "" || value.split("/").every((segment) => segment.length > 0 && segment !== "."), { message: "must not contain empty or dot path segments" });
const skillSyncTokenReferenceSchema = zod.z.string().trim().regex(/^\$\{[A-Za-z_][A-Za-z0-9_]*\}$/, { message: "must be an environment variable reference like ${GITHUB_SKILLS_TOKEN}" });
/**
* Tenant that owns the skills mirrored from a source. When set, the sync runner
* executes that source's database writes inside the tenant's async context so
* synced skills are created, listed, and shared within the tenant under strict
* tenant isolation. Mirrors the request tenant-id contract: no reserved system id.
*/
const skillSyncTenantIdSchema = zod.z.string().max(128).refine((value) => /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(value), { message: "must be a valid tenant id" }).refine((value) => value !== "__SYSTEM__", { message: "must not be the reserved system tenant id" });
const skillSyncGitHubSourceSchema = zod.z.object({
	id: skillSyncIdentifierSchema,
	owner: skillSyncGitHubOwnerSchema,
	repo: skillSyncGitHubRepoSchema,
	ref: skillSyncGitHubRefSchema.default("main"),
	paths: zod.z.array(skillSyncPathSchema).min(1),
	skillDiscoveryDepth: zod.z.number().int().min(0).max(10).optional(),
	credentialKey: skillSyncIdentifierSchema.optional(),
	token: skillSyncTokenReferenceSchema.optional(),
	tenantId: skillSyncTenantIdSchema.optional()
}).superRefine((source, ctx) => {
	if (!source.credentialKey && !source.token) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["credentialKey"],
		message: "Either credentialKey or token is required"
	});
	if (source.credentialKey && source.token) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["token"],
		message: "Use either credentialKey or token, not both"
	});
});
const skillSyncConfigSchema = zod.z.object({ github: zod.z.object({
	enabled: zod.z.boolean().default(false),
	intervalMinutes: zod.z.number().int().min(5).max(SKILL_SYNC_MAX_INTERVAL_MINUTES).default(60),
	runOnStartup: zod.z.boolean().default(false),
	sources: zod.z.array(skillSyncGitHubSourceSchema).default([])
}).superRefine((github, ctx) => {
	if (github.enabled && github.sources.length === 0) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["sources"],
		message: "At least one GitHub source is required when skill sync is enabled"
	});
	const seen = /* @__PURE__ */ new Set();
	for (const source of github.sources) {
		if (seen.has(source.id)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: ["sources"],
			message: `Duplicate GitHub skill sync source id "${source.id}"`
		});
		seen.add(source.id);
	}
}).optional() }).optional();
function getSchemaDefaults(schema) {
	const shape = schema.shape;
	const entries = Object.entries(shape).map(([key, value]) => {
		if (value instanceof zod.z.ZodDefault) return [key, value._def.defaultValue()];
		return [key, void 0];
	});
	return Object.fromEntries(entries);
}
const modelConfigSchema = zod.z.object({
	deploymentName: zod.z.string().optional(),
	version: zod.z.string().optional(),
	assistants: zod.z.boolean().optional()
}).or(zod.z.boolean());
const paramValueSchema = zod.z.lazy(() => zod.z.union([
	zod.z.string(),
	zod.z.number(),
	zod.z.boolean(),
	zod.z.null(),
	zod.z.array(paramValueSchema),
	zod.z.record(zod.z.string(), paramValueSchema)
]));
/** Validates addParams while keeping web_search aligned with current runtime boolean handling. */
const addParamsSchema = zod.z.record(zod.z.string(), paramValueSchema).superRefine((params, ctx) => {
	if (params.web_search === void 0 || typeof params.web_search === "boolean") return;
	ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["web_search"],
		message: "`web_search` must be a boolean in addParams"
	});
});
const azureBaseSchema = zod.z.object({
	apiKey: zod.z.string(),
	serverless: zod.z.boolean().optional(),
	instanceName: zod.z.string().optional(),
	deploymentName: zod.z.string().optional(),
	assistants: zod.z.boolean().optional(),
	addParams: addParamsSchema.optional(),
	dropParams: zod.z.array(zod.z.string()).optional(),
	version: zod.z.string().optional(),
	baseURL: zod.z.string().optional(),
	additionalHeaders: zod.z.record(zod.z.string()).optional()
});
const azureGroupSchema = zod.z.object({
	group: zod.z.string(),
	models: zod.z.record(zod.z.string(), modelConfigSchema)
}).required().and(azureBaseSchema);
const azureGroupConfigsSchema = zod.z.array(azureGroupSchema).min(1);
let Capabilities = /* @__PURE__ */ function(Capabilities) {
	Capabilities["code_interpreter"] = "code_interpreter";
	Capabilities["image_vision"] = "image_vision";
	Capabilities["retrieval"] = "retrieval";
	Capabilities["actions"] = "actions";
	Capabilities["tools"] = "tools";
	return Capabilities;
}({});
let AgentCapabilities = /* @__PURE__ */ function(AgentCapabilities) {
	AgentCapabilities["hide_sequential_outputs"] = "hide_sequential_outputs";
	AgentCapabilities["programmatic_tools"] = "programmatic_tools";
	AgentCapabilities["end_after_tools"] = "end_after_tools";
	AgentCapabilities["deferred_tools"] = "deferred_tools";
	AgentCapabilities["execute_code"] = "execute_code";
	AgentCapabilities["stateful_code_sessions"] = "stateful_code_sessions";
	AgentCapabilities["file_search"] = "file_search";
	AgentCapabilities["web_search"] = "web_search";
	AgentCapabilities["artifacts"] = "artifacts";
	AgentCapabilities["subagents"] = "subagents";
	AgentCapabilities["actions"] = "actions";
	AgentCapabilities["context"] = "context";
	AgentCapabilities["skills"] = "skills";
	AgentCapabilities["memory"] = "memory";
	AgentCapabilities["ask_user_question"] = "ask_user_question";
	AgentCapabilities["tools"] = "tools";
	AgentCapabilities["chain"] = "chain";
	AgentCapabilities["ocr"] = "ocr";
	AgentCapabilities["run_in_background"] = "run_in_background";
	AgentCapabilities["tool_intents"] = "tool_intents";
	return AgentCapabilities;
}({});
const defaultAssistantsVersion = {
	["assistants"]: 2,
	["azureAssistants"]: 1
};
const baseEndpointSchema = zod.z.object({
	/**
	* Milliseconds between visible streamed chunks. Agents SDK-backed
	* providers (openAI, custom, anthropic, google, bedrock, agents) smooth
	* adaptively at 25ms by default; set to override the cadence, 0 to
	* disable smoothing. Legacy Assistants and Ollama paths instead sleep
	* this long per provider chunk (default 1ms), with no adaptive smoothing.
	*/
	streamRate: zod.z.number().min(0).optional(),
	baseURL: zod.z.string().optional(),
	/**
	* Custom request headers forwarded to the provider on every request. Values
	* support the same placeholder resolution as custom endpoints — env vars
	* (`${VAR}`), user fields (`{{LIBRECHAT_USER_*}}`), and request-body fields
	* (`{{LIBRECHAT_BODY_CONVERSATIONID}}`). Primarily for routing built-in
	* providers through an AI gateway / reverse proxy that consumes metadata
	* headers (provider-native request shaping is preserved).
	*/
	headers: zod.z.record(zod.z.string()).optional(),
	titlePrompt: zod.z.string().optional(),
	titleModel: zod.z.string().optional(),
	titleConvo: zod.z.boolean().optional(),
	titleMethod: zod.z.union([
		zod.z.literal("completion"),
		zod.z.literal("functions"),
		zod.z.literal("structured")
	]).optional(),
	titleEndpoint: zod.z.string().optional(),
	titlePromptTemplate: zod.z.string().optional(),
	/**
	* When conversation titles are generated. `immediate` (default) generates the
	* title as soon as the request is made, in parallel with the response, from the
	* user's first message. `final` defers generation until the full response
	* completes (legacy behavior).
	*/
	titleTiming: zod.z.union([zod.z.literal("immediate"), zod.z.literal("final")]).optional(),
	/**
	* Agent activity groups: collapse each contiguous block of reasoning and
	* tool calls under a generated one-line header. Mirrors the title options
	* above — `activityLabel` enables it (like `titleConvo`), the rest tune
	* the fast model that writes the label.
	*
	* NOTE: fields added here reach `endpoints.all` automatically (that schema
	* is `baseEndpointSchema.omit({ baseURL })`), but NOT Azure — see the
	* enumerated `.pick()` in `azureEndpointSchema` below.
	*/
	activityLabel: zod.z.boolean().optional(),
	/** Model used to write activity labels. Defaults to `titleModel`, then the agent's model. */
	activityModel: zod.z.string().optional(),
	/** Endpoint whose credentials the label model runs on. Defaults to the agent's endpoint. */
	activityEndpoint: zod.z.string().optional(),
	/** Overrides the system prompt used to write activity labels. */
	activityPrompt: zod.z.string().optional(),
	/** Cost cap: maximum labels generated per run. Default 20. */
	activityMaxPerRun: zod.z.number().int().positive().optional(),
	/** Per-entry truncation of tool input/output in the label prompt. Default 600. */
	activityCharLimit: zod.z.number().int().positive().optional(),
	/** Generates one parent summary for each run phase containing 2+ activities. */
	activityPhaseLabel: zod.z.boolean().optional(),
	/** Model used for phase summaries. Defaults to activityModel, titleModel, then the run model. */
	activityPhaseModel: zod.z.string().optional(),
	/** Endpoint whose credentials the phase summary model uses. Defaults to activityEndpoint. */
	activityPhaseEndpoint: zod.z.string().optional(),
	/** Overrides the dedicated phase-summary system prompt. */
	activityPhasePrompt: zod.z.string().optional(),
	/** Cost cap: maximum phase summaries generated per run. Default 5. */
	activityPhaseMaxPerRun: zod.z.number().int().positive().optional(),
	/** Generates a live orientation label for sufficiently long top-level response reasoning. */
	reasoningLabel: zod.z.boolean().optional(),
	/** Model used for reasoning labels. Defaults to activityModel, titleModel, then run model. */
	reasoningLabelModel: zod.z.string().optional(),
	/** Endpoint receiving the bounded visible-reasoning snapshot. Defaults to activityEndpoint. */
	reasoningLabelEndpoint: zod.z.string().optional(),
	/** Overrides the dedicated reasoning-label system prompt. */
	reasoningLabelPrompt: zod.z.string().optional(),
	/** Characters required before the first reasoning label. Default 500. */
	reasoningLabelMinChars: zod.z.number().int().positive().optional(),
	/** New characters required between streaming revisions. Default 400. */
	reasoningLabelUpdateChars: zod.z.number().int().positive().optional(),
	/** Minimum milliseconds between streaming revisions. Default 3000. */
	reasoningLabelUpdateIntervalMs: zod.z.number().int().nonnegative().optional(),
	/** Cost cap: maximum reasoning-label provider calls attempted per run. Default 8. */
	reasoningLabelMaxPerRun: zod.z.number().int().positive().optional(),
	/** Maximum characters allowed in a single tool result before truncation. */
	maxToolResultChars: zod.z.number().positive().optional()
});
const bedrockGuardrailConfigSchema = zod.z.object({
	guardrailIdentifier: zod.z.string(),
	guardrailVersion: zod.z.string(),
	trace: zod.z.enum([
		"enabled",
		"disabled",
		"enabled_full"
	]).optional(),
	streamProcessingMode: zod.z.enum(["sync", "async"]).optional()
});
const bedrockEndpointSchema = baseEndpointSchema.merge(zod.z.object({
	availableRegions: zod.z.array(zod.z.string()).optional(),
	models: zod.z.array(zod.z.string()).optional(),
	guardrailConfig: bedrockGuardrailConfigSchema.optional(),
	inferenceProfiles: zod.z.record(zod.z.string(), zod.z.string()).optional()
}));
const modelItemSchema = zod.z.union([zod.z.string(), zod.z.object({
	name: zod.z.string(),
	description: zod.z.string().optional()
})]);
const assistantEndpointSchema = baseEndpointSchema.merge(zod.z.object({
	disableBuilder: zod.z.boolean().optional(),
	pollIntervalMs: zod.z.number().optional(),
	timeoutMs: zod.z.number().optional(),
	version: zod.z.union([zod.z.string(), zod.z.number()]).default(2),
	supportedIds: zod.z.array(zod.z.string()).min(1).optional(),
	excludedIds: zod.z.array(zod.z.string()).min(1).optional(),
	privateAssistants: zod.z.boolean().optional(),
	retrievalModels: zod.z.array(zod.z.string()).min(1).optional().default(defaultRetrievalModels),
	capabilities: zod.z.array(zod.z.nativeEnum(Capabilities)).optional().default([
		"code_interpreter",
		"image_vision",
		"retrieval",
		"actions",
		"tools"
	]),
	apiKey: zod.z.string().optional(),
	/** Masked preview of the API key, stored at write time so admin
	* reads can show which key is configured without returning the secret.
	* Shared by both `endpoints.assistants` and `endpoints.azureAssistants`,
	* which both use this schema. */
	apiKeyPreview: zod.z.string().optional(),
	models: zod.z.object({
		default: zod.z.array(modelItemSchema).min(1),
		fetch: zod.z.boolean().optional(),
		userIdQuery: zod.z.boolean().optional()
	}).optional(),
	headers: zod.z.record(zod.z.string()).optional()
}));
const defaultAgentCapabilities = [
	"deferred_tools",
	"execute_code",
	"file_search",
	"web_search",
	"artifacts",
	"subagents",
	"actions",
	"context",
	"skills",
	"memory",
	"ask_user_question",
	"tools",
	"chain",
	"ocr"
];
const LOCAL_REMOTE_OIDC_HOSTS = new Set([
	"localhost",
	"127.0.0.1",
	"[::1]"
]);
function isRemoteOidcUrlAllowed(value) {
	try {
		const url = new URL(value);
		if (url.protocol === "https:") return true;
		if (url.protocol !== "http:") return false;
		const hostname = url.hostname.toLowerCase();
		return LOCAL_REMOTE_OIDC_HOSTS.has(hostname) || hostname.endsWith(".localhost");
	} catch {
		return false;
	}
}
const remoteApiOidcUrlSchema = zod.z.string().url().refine(isRemoteOidcUrlAllowed, { message: "must use https:// unless targeting localhost" });
const remoteApiOidcScopeSchema = zod.z.string().refine((scope) => !scope.includes(","), { message: "scopes must be space-separated" });
const oidcAccessTokenSchema = zod.z.object({
	enabled: zod.z.boolean().default(false),
	issuer: remoteApiOidcUrlSchema.optional(),
	audience: zod.z.string().min(1).optional(),
	jwksUri: remoteApiOidcUrlSchema.optional()
});
function validateEnabledOidc(oidc, ctx) {
	if (oidc.enabled === true && !oidc.issuer) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["issuer"],
		message: "issuer is required when OIDC auth is enabled"
	});
	if (oidc.enabled === true && !oidc.audience) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["audience"],
		message: "audience is required when OIDC auth is enabled"
	});
}
const remoteApiOidcSchema = oidcAccessTokenSchema.extend({ scope: remoteApiOidcScopeSchema.optional() }).superRefine(validateEnabledOidc);
const remoteApiAuthSchema = zod.z.object({
	apiKey: zod.z.object({ enabled: zod.z.boolean().default(true) }).optional(),
	oidc: remoteApiOidcSchema.optional()
});
const remoteApiSchema = zod.z.object({ auth: remoteApiAuthSchema.optional() });
const managementClientBindingSchema = zod.z.object({
	clientId: zod.z.string().trim().min(1).max(128),
	subject: zod.z.string().trim().min(1).max(512).optional(),
	userId: zod.z.string().trim().regex(/^[a-f\d]{24}$/i, "must be a MongoDB ObjectId").transform((userId) => userId.toLowerCase()),
	tenantId: zod.z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, "must be a valid tenant id").refine((tenantId) => tenantId !== "__SYSTEM__", "system tenant is not allowed"),
	enabled: zod.z.boolean().default(true)
}).strict();
const managementApiOidcSchema = oidcAccessTokenSchema.strict().superRefine(validateEnabledOidc);
const managementApiAuthSchema = zod.z.object({
	oidc: managementApiOidcSchema,
	clients: zod.z.array(managementClientBindingSchema).max(100).default([])
}).strict().superRefine((auth, ctx) => {
	if (auth.oidc.enabled === true && auth.clients.length === 0) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["clients"],
		message: "at least one client binding is required when management auth is enabled"
	});
	const clientIds = /* @__PURE__ */ new Set();
	for (let index = 0; index < auth.clients.length; index++) {
		const client = auth.clients[index];
		if (clientIds.has(client.clientId)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [
				"clients",
				index,
				"clientId"
			],
			message: "client IDs must be unique"
		});
		clientIds.add(client.clientId);
	}
});
const managementApiSchema = zod.z.object({ auth: managementApiAuthSchema.optional() }).strict();
/**
* Permission mode applied to a tool call. Mirrors `@librechat/agents`'s
* `ToolPolicyMode` 1:1.
*
* - `default`: ask the user about anything not explicitly allowed (default-on).
* - `dontAsk`: deny anything not explicitly allowed (headless / API-key flows).
* - `bypass`: auto-approve everything that isn't explicitly denied
*   (the user-facing "stop asking me" toggle).
*
* Subagents inherit the parent's mode; this is enforced by the SDK and not
* overridable per-subagent.
*/
const toolApprovalModeSchema = zod.z.enum([
	"default",
	"dontAsk",
	"bypass"
]);
/**
* Per-endpoint tool-approval policy.
*
* Shape mirrors `@librechat/agents`'s `ToolPolicyConfig` so the host can map it
* directly into `createToolPolicyHook(config)`. The SDK does the evaluation
* (`deny → ask → allow → bypass → dontAsk → fallthrough(ask)`); this config
* just describes the surface.
*
* Conventions:
* - All list entries are matched as globs (`*`). Use `mcp:server:*` to scope
*   a rule to every tool from a single MCP server.
* - `deny` always wins, including under `bypass`.
* - `enabled: false` is a TerraMind-only kill switch that disables the entire
*   HITL machinery for this endpoint (no checkpointer, no hooks, no prompts).
*   This is admin-level; users toggle prompting via `mode: 'bypass'` instead.
*/
/**
* A programmatic tool-approval hook loaded from a module at startup.
*
* The referenced module's default export must be a builder
* `(options?) => ToolApprovalHookFactory` (see `@librechat/api`'s `registerToolApprovalHook`).
* Hooks compose with the static `allow`/`deny`/`ask` policy above and can only TIGHTEN it
* (the SDK folds decisions `deny → ask → allow`). This is admin-level config — the module is
* dynamically imported and executed in-process, so only reference trusted code.
*/
const toolApprovalHookConfigSchema = zod.z.object({
	/**
	* Module specifier to import: a bare package name (e.g. `@acme/approval-hooks`) or a path —
	* absolute, or relative to the app root. Its default export is the hook builder.
	*/
	module: zod.z.string().min(1),
	/** Optional regex matched against the tool name; omit to run for every tool. */
	matcher: zod.z.string().optional(),
	/** Static options forwarded to the module's builder; the hook's own per-call config. */
	options: zod.z.record(zod.z.unknown()).optional()
});
const toolApprovalPolicySchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	mode: toolApprovalModeSchema.optional(),
	allow: zod.z.array(zod.z.string()).optional(),
	deny: zod.z.array(zod.z.string()).optional(),
	ask: zod.z.array(zod.z.string()).optional(),
	/** Optional reason template surfaced in the prompt; `{tool}` is interpolated. */
	reason: zod.z.string().optional(),
	/**
	* Programmatic policy hooks loaded from modules at startup. They layer on top of the
	* static lists above for dynamic, context-aware decisions the lists can't express
	* (per-args, per-agent, per-user). See {@link toolApprovalHookConfigSchema}.
	*
	* BASE-CONFIG ONLY: hooks are imported + registered once, process-wide, at server
	* startup — they are NOT reloaded from per-role/user/tenant admin overrides. Encode
	* per-user/tenant behavior INSIDE the hook (via its runtime context), not by varying the
	* module list per override. Honored only when `enabled` is true.
	*/
	hooks: zod.z.array(toolApprovalHookConfigSchema).optional()
}).optional();
const askUserQuestionRetainedAnswersSchema = zod.z.object({
	/** `false` stops carrying answers forward; they then live only in the messages. */
	enabled: zod.z.boolean().optional(),
	/** Token ceiling for the carried block. Older answers drop first once it is
	*  exceeded; the newest set is always kept. Defaults to
	*  `DEFAULT_RETAINED_ANSWER_TOKENS` (4096). */
	maxTokens: zod.z.number().int().positive().optional()
});
/**
* Behavior of the `ask_user_question` tool beyond the admin kill switch
* (`filteredTools` / `includedTools`).
*
* `retainedAnswers`: every answer the user gave to an agent's question is
* quoted verbatim in the run's user context, so it survives after the
* messages that carried it were summarized, pruned or dropped from the context
* window. On by default.
*/
const askUserQuestionConfigSchema = zod.z.object({ retainedAnswers: askUserQuestionRetainedAnswersSchema.optional() }).optional();
/**
* Durable checkpointer backing human-in-the-loop resume.
*
* When `toolApproval.enabled` is true, a run that pauses for review suspends its
* LangGraph state to a checkpoint; resuming rebuilds that state on a *fresh* `Run`
* — possibly on a different replica, or the same worker after a restart. That only
* works if the checkpoint outlives the original request, so HITL needs a durable
* saver, not the SDK's process-local `MemorySaver` fallback.
*
* Defaults are zero-config: with `toolApproval.enabled` on and no `checkpointer`
* block, TerraMind persists checkpoints to its primary MongoDB, so resume works
* across replicas out of the box.
*
* - `type: 'mongo'` (default) — persist to the app database; survives restarts and
*   resolves on any replica. A TTL index reclaims runs that are never resolved.
* - `type: 'memory'` — process-local only. Paused runs do NOT survive a restart and
*   can only be resolved on the originating worker. Single-process / dev only.
*/
const checkpointerTypeSchema = zod.z.enum(["mongo", "memory"]);
const checkpointerSchema = zod.z.object({
	type: checkpointerTypeSchema.optional(),
	/**
	* Approval window, in seconds: how long a paused run waits for a decision
	* before it is reclaimed. Drives both the Mongo TTL index on checkpoints and
	* the pending-action expiry, keeping the two layers in lockstep. Defaults to
	* 86400 (24h). Raise it for longer review windows.
	*/
	ttl: zod.z.number().int().positive().optional(),
	/** Advanced: override the Mongo collection names used for checkpoints. */
	checkpointCollectionName: zod.z.string().optional(),
	checkpointWritesCollectionName: zod.z.string().optional()
}).optional();
const codeEnvironmentBaseURLSchema = zod.z.string().trim().url().refine((value) => {
	try {
		const url = new URL(value);
		return (url.protocol === "http:" || url.protocol === "https:") && !value.includes("?") && !value.includes("#") && url.search.length === 0 && url.hash.length === 0;
	} catch {
		return false;
	}
}, { message: "Code environment baseURL must be an HTTP(S) base URL without query or fragment" });
function isSecureCodeEnvironmentControlURL(baseURL) {
	try {
		const url = new URL(baseURL.trim());
		if (url.protocol === "https:") return true;
		if (url.protocol !== "http:") return false;
		return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
	} catch {
		return false;
	}
}
const codeEnvironmentPermissionDecisionSchema = zod.z.enum([
	"allow",
	"ask",
	"deny"
]);
const codeEnvironmentPermissionFieldSchema = zod.z.object({
	allowed: zod.z.array(codeEnvironmentPermissionDecisionSchema).min(1),
	default: codeEnvironmentPermissionDecisionSchema.optional().default("ask")
}).strict().superRefine((field, context) => {
	if (!field.allowed.includes(field.default)) context.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["default"],
		message: "Permission default must be included in allowed values"
	});
});
/** Existing attached commands used a fixed 30-second execution budget. */
const CODE_ENVIRONMENT_COMMAND_TIMEOUT_DEFAULT_MS = 3e4;
/** Protocol-level ceiling; deployments may only lower this value. */
const CODE_ENVIRONMENT_COMMAND_TIMEOUT_HARD_MAX_MS = 5 * 6e4;
/**
* Typed user-tunable surface for one attached code environment. Omitted fields
* remain fixed at TerraMind's safe baseline. Isolation, networking, mounts,
* privileged execution, and secrets are deliberately not representable here.
*/
const codeEnvironmentUserConfigSchema = zod.z.object({
	permissions: zod.z.object({
		fileWrite: codeEnvironmentPermissionFieldSchema.optional(),
		commandExecution: codeEnvironmentPermissionFieldSchema.optional()
	}).strict().optional(),
	limits: zod.z.object({ 
	/** Maximum timeout a Bash invocation may request. Omission preserves
	* the historical 30-second command budget. */
maxCommandTimeoutMs: zod.z.number().int().min(1).max(CODE_ENVIRONMENT_COMMAND_TIMEOUT_HARD_MAX_MS).optional() }).strict().optional()
}).strict();
const codeEnvironmentUserSettingsSchema = zod.z.object({ permissions: zod.z.object({
	fileWrite: codeEnvironmentPermissionDecisionSchema.optional(),
	commandExecution: codeEnvironmentPermissionDecisionSchema.optional()
}).strict().optional() }).strict();
const agentsEndpointSchema = baseEndpointSchema.omit({ baseURL: true }).merge(zod.z.object({
	recursionLimit: zod.z.number().optional(),
	disableBuilder: zod.z.boolean().optional().default(false),
	maxRecursionLimit: zod.z.number().optional(),
	/** Max cumulative bytes a single streamed tool call's arguments may reach before the run
	* aborts. Defaults to 64 KiB in the agents SDK; `0` disables the guard. */
	maxToolCallArgBytes: zod.z.number().optional(),
	/** Max streamed chunk events per model generation before the run aborts. Off by default. */
	maxDeltaEventsPerTurn: zod.z.number().optional(),
	/** Per-tool overrides of `maxToolCallArgBytes`, keyed by model-facing tool name; `0`
	* disables the guard for that tool only. Merged over TerraMind's shipped default of
	* `{ create_file: 131072 }`. */
	maxToolCallArgBytesByTool: zod.z.record(zod.z.number()).optional(),
	/** Characters of retained tool output the save path may tokenize exactly for the
	* context gauge when a turn stops at the tool-call limit (see
	* `retainedToolTokens`). Tokenizing costs ~60 ms/MB and runs once per stopped
	* turn; past this ceiling the figure is withdrawn rather than estimated, so the
	* gauge under-reports that turn instead of blocking the save. Raise it for
	* deployments whose tools legitimately return more, lower it on slow hardware. */
	maxRetainedToolCountChars: zod.z.number().int().min(0).optional().default(DEFAULT_MAX_RETAINED_TOOL_COUNT_CHARS),
	maxCitations: zod.z.number().min(1).max(50).optional().default(30),
	maxCitationsPerFile: zod.z.number().min(1).max(10).optional().default(7),
	minRelevanceScore: zod.z.number().min(0).max(1).optional().default(.45),
	/** Maximum explicit subagents per agent (`agent_ids` and `graphs`); raised from
	* the shipped default of 10 for orchestration-heavy deployments, bounded by
	* `MAX_SUBAGENTS_CEILING`. */
	maxSubagents: zod.z.number().int().min(1).max(50).optional().default(10),
	/** Run-scoped file access for explicitly opted-in subagent delegations. */
	fileSharing: zod.z.object({
		enabled: zod.z.boolean().optional().default(false),
		allowSiblingSharing: zod.z.boolean().optional().default(false),
		maxFiles: zod.z.number().int().min(1).max(1e3).optional().default(100),
		/** Aggregate disk budget for private output versions retained during a run. */
		maxPrivateBytes: zod.z.number().int().min(1).max(10737418240).optional().default(268435456),
		ttlMs: zod.z.number().int().min(1).max(864e5).optional().default(36e5)
	}).optional(),
	/** Maximum concurrent Code API uploads per route and authenticated principal. */
	codeApiUploadConcurrency: zod.z.number().int().min(1).max(100).optional().default(3),
	/** Maximum wall-clock time spent waiting on Code API rate limits per operation. */
	codeApiMaxRetryWaitMs: zod.z.number().int().min(0).max(3e5).optional().default(2e4),
	allowedProviders: zod.z.array(zod.z.union([zod.z.string(), eModelEndpointSchema])).optional(),
	capabilities: zod.z.array(zod.z.nativeEnum(AgentCapabilities)).optional().default(defaultAgentCapabilities),
	/** Controls which workspace-sharing scopes users may select for stateful code sessions.
	*  Omit this block to preserve the legacy behavior of allowing every scope. */
	statefulCodeSessions: zod.z.object({
		allowedEnvironments: zod.z.array(zod.z.enum(STATEFUL_CODE_ENVIRONMENTS)).min(1),
		/** Server-only personal worker enrollment policy. Effective principal
		* policy may tighten, but never raise, the deployment ceiling. */
		principalWorkers: zod.z.object({
			enabled: zod.z.boolean().optional(),
			/** Defaults to five. Zero disables enrollment; existing machines remain usable. */
			maxPerUser: zod.z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional()
		}).optional(),
		/** Server-only policy letting a conversation's owner move its sealed attached decision
		* onto the environments its agents now use. Omit to keep sealed decisions immovable. */
		conversationMoves: zod.z.object({ enabled: zod.z.boolean().optional() }).optional(),
		/** Operator-managed execution environments. Attached entries route to a
		* Code API deployment backed by an outbound librechat-code worker. */
		environments: zod.z.array(zod.z.object({
			id: zod.z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
			name: zod.z.string().min(1).max(100),
			type: zod.z.enum(["managed", "attached"]),
			baseURL: codeEnvironmentBaseURLSchema,
			default: zod.z.boolean().optional(),
			/** Server-only outbound worker route. Removed from public config. */
			workerId: zod.z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/).optional(),
			/** Distinguishes operator policy from a principal-authorized
			* environment merged into request-scoped server config. */
			owner: zod.z.enum(["deployment", "principal"]).optional().default("deployment"),
			/** Administrator-controlled user-tunable settings. Only fields
			* represented here may be changed by a principal. */
			configSchema: codeEnvironmentUserConfigSchema.optional(),
			/** Request-scoped effective settings for a principal-owned environment.
			* Deployment config should define defaults through configSchema instead. */
			settings: codeEnvironmentUserSettingsSchema.optional(),
			/** Server-only enrollment metadata. `tokenEnv` names an
			* environment variable and never contains the token itself. */
			pairing: zod.z.object({
				workerId: zod.z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/).optional(),
				allowPrincipalWorkers: zod.z.boolean().optional().default(false),
				tokenEnv: zod.z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
			}).superRefine((pairing, pairingContext) => {
				if (pairing.workerId != null || pairing.allowPrincipalWorkers === true) return;
				pairingContext.addIssue({
					code: zod.z.ZodIssueCode.custom,
					message: "Pairing requires a workerId or principal workers"
				});
			}).optional()
		})).optional()
	}).superRefine((value, context) => {
		if (!value?.environments) return;
		const ids = /* @__PURE__ */ new Set();
		let defaults = 0;
		let executableEnvironments = 0;
		for (const environment of value.environments) {
			const pairingOnly = environment.pairing?.allowPrincipalWorkers === true && environment.pairing.workerId == null && environment.workerId == null;
			if (environment.pairing != null && environment.type !== "attached") context.addIssue({
				code: zod.z.ZodIssueCode.custom,
				message: "Only attached code environments may configure pairing",
				path: [
					"environments",
					environment.id,
					"pairing"
				]
			});
			if (environment.pairing != null && environment.owner !== "deployment") context.addIssue({
				code: zod.z.ZodIssueCode.custom,
				message: "Only deployment-owned code environments may configure pairing",
				path: [
					"environments",
					environment.id,
					"pairing"
				]
			});
			if (environment.pairing != null && !isSecureCodeEnvironmentControlURL(environment.baseURL)) context.addIssue({
				code: zod.z.ZodIssueCode.custom,
				message: "Paired code environments require HTTPS outside loopback development",
				path: [
					"environments",
					environment.id,
					"baseURL"
				]
			});
			if (environment.workerId != null && environment.pairing?.workerId != null && environment.workerId !== environment.pairing.workerId) context.addIssue({
				code: zod.z.ZodIssueCode.custom,
				message: "Code environment workerId must match pairing.workerId",
				path: [
					"environments",
					environment.id,
					"workerId"
				]
			});
			if (pairingOnly && environment.default === true) context.addIssue({
				code: zod.z.ZodIssueCode.custom,
				message: "Pairing-only code control planes cannot be execution defaults",
				path: [
					"environments",
					environment.id,
					"default"
				]
			});
			if (ids.has(environment.id)) context.addIssue({
				code: zod.z.ZodIssueCode.custom,
				message: `Duplicate code environment id: ${environment.id}`,
				path: ["environments"]
			});
			ids.add(environment.id);
			if (!pairingOnly) {
				executableEnvironments += 1;
				if (environment.default === true) defaults += 1;
			}
		}
		if (executableEnvironments > 0 && defaults !== 1) context.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "Exactly one stateful code environment must be the default",
			path: ["environments"]
		});
	}).optional(),
	/** Optional trusted origin for in-process agent event delivery. */
	eventDriven: zod.z.object({ selfUrl: zod.z.string().url().optional() }).optional(),
	/** Conversational background-task delivery policy. Automatic completion wakeups are
	* enabled unless an administrator explicitly restores poll-only behavior. */
	backgroundTasks: zod.z.object({
		completionWakeups: zod.z.boolean().optional().default(true),
		/** Cooperative cancellation for process-local ordinary tools. Off
		* by default so existing deployments opt into the new control. */
		ordinaryToolCancellation: zod.z.boolean().optional().default(false)
	}).optional(),
	skills: zod.z.object({ maxCatalogSkills: zod.z.number().int().min(1).max(100).optional() }).optional(),
	managementApi: managementApiSchema.optional(),
	remoteApi: remoteApiSchema.optional(),
	/** Human-in-the-loop tool approval policy. Off by default. */
	toolApproval: toolApprovalPolicySchema,
	/** Ask User question behavior; see {@link askUserQuestionConfigSchema}. */
	askUserQuestion: askUserQuestionConfigSchema,
	/** Durable checkpointer backing tool-approval and Ask User resume.
	*  Defaults to the app's MongoDB when either flow needs it. */
	checkpointer: checkpointerSchema
})).default({
	disableBuilder: false,
	capabilities: defaultAgentCapabilities,
	maxCitations: 30,
	maxCitationsPerFile: 7,
	minRelevanceScore: .45,
	maxSubagents: 10
});
const paramDefinitionSchema = zod.z.object({
	key: zod.z.string(),
	description: zod.z.string().optional(),
	type: zod.z.nativeEnum(SettingTypes).optional(),
	default: zod.z.union([
		zod.z.number(),
		zod.z.boolean(),
		zod.z.string(),
		zod.z.array(zod.z.string())
	]).optional(),
	showLabel: zod.z.boolean().optional(),
	showDefault: zod.z.boolean().optional(),
	options: zod.z.array(zod.z.string()).optional(),
	range: zod.z.object({
		min: zod.z.number(),
		max: zod.z.number(),
		step: zod.z.number().optional(),
		positiveMin: zod.z.number().optional()
	}).refine((value) => value.positiveMin == null || value.positiveMin <= value.max, {
		message: "range.positiveMin cannot exceed range.max",
		path: ["positiveMin"]
	}).optional(),
	enumMappings: zod.z.record(zod.z.union([
		zod.z.number(),
		zod.z.boolean(),
		zod.z.string()
	])).optional(),
	component: zod.z.nativeEnum(ComponentTypes).optional(),
	optionType: zod.z.nativeEnum(OptionTypes).optional(),
	columnSpan: zod.z.number().int().nonnegative().optional(),
	columns: zod.z.number().int().min(1).max(4).optional(),
	label: zod.z.string().optional(),
	placeholder: zod.z.string().optional(),
	labelCode: zod.z.boolean().optional(),
	placeholderCode: zod.z.boolean().optional(),
	descriptionCode: zod.z.boolean().optional(),
	minText: zod.z.number().optional(),
	maxText: zod.z.number().optional(),
	minTags: zod.z.number().min(0).optional(),
	maxTags: zod.z.number().min(0).optional(),
	includeInput: zod.z.boolean().optional(),
	descriptionSide: zod.z.enum([
		"top",
		"right",
		"bottom",
		"left"
	]).optional(),
	searchPlaceholder: zod.z.string().optional(),
	selectPlaceholder: zod.z.string().optional(),
	searchPlaceholderCode: zod.z.boolean().optional(),
	selectPlaceholderCode: zod.z.boolean().optional()
});
const endpointSchema = baseEndpointSchema.merge(zod.z.object({
	name: zod.z.string().refine((value) => !eModelEndpointSchema.safeParse(value).success, { message: `Value cannot be one of the default endpoint (EModelEndpoint) values: ${Object.values(EModelEndpoint).join(", ")}` }),
	apiKey: zod.z.string(),
	/** Masked preview of the API key, stored at write time so admin
	* reads can show which key is configured without returning the secret. */
	apiKeyPreview: zod.z.string().optional(),
	baseURL: zod.z.string(),
	models: zod.z.object({
		default: zod.z.array(modelItemSchema).min(1),
		fetch: zod.z.boolean().optional(),
		userIdQuery: zod.z.boolean().optional()
	}),
	iconURL: zod.z.string().optional(),
	modelDisplayLabel: zod.z.string().optional(),
	/**
	* Forces the endpoint to use a provider's native client / request format
	* instead of the default OpenAI-compatible client. Currently supports
	* `anthropic`, for endpoints that speak the Anthropic `/v1/messages` API
	* (Anthropic itself or Anthropic-compatible gateways). Omit for
	* OpenAI-compatible endpoints.
	*/
	provider: zod.z.literal("anthropic").optional(),
	headers: zod.z.record(zod.z.string()).optional(),
	addParams: addParamsSchema.optional(),
	dropParams: zod.z.array(zod.z.string()).optional(),
	customParams: zod.z.object({
		defaultParamsEndpoint: zod.z.string().default("custom"),
		reasoningFormat: eReasoningParameterFormatSchema.optional(),
		reasoningKey: eReasoningResponseKeySchema.optional(),
		/** Replays `reasoning_content` within a run's tool-call turns (e.g. Xiaomi MiMo, Kimi). */
		includeReasoningContent: zod.z.boolean().optional(),
		/** Also reconstructs `reasoning_content` from persisted history across turns (implies `includeReasoningContent`). */
		includeReasoningHistory: zod.z.boolean().optional(),
		paramDefinitions: zod.z.array(paramDefinitionSchema).optional()
	}).strict().optional(),
	directEndpoint: zod.z.boolean().optional(),
	titleMessageRole: zod.z.enum([
		"system",
		"user",
		"assistant"
	]).optional(),
	/** Static per-model token config: context window and per-million-token rates */
	tokenConfig: zod.z.record(zod.z.object({
		prompt: zod.z.number(),
		completion: zod.z.number(),
		context: zod.z.number(),
		cacheRead: zod.z.number().optional(),
		cacheWrite: zod.z.number().optional()
	})).optional()
}));
const azureEndpointSchema = zod.z.object({
	groups: azureGroupConfigsSchema,
	assistants: zod.z.boolean().optional()
}).and(
	/**
	* Azure carries only the base-endpoint fields enumerated here. This is a
	* `.pick()`, NOT an omit, so a field added to `baseEndpointSchema` is
	* silently unavailable on Azure endpoints until it is listed below —
	* unlike `endpoints.all`, which omits and therefore inherits new fields
	* automatically. Keep this list in sync when adding endpoint options.
	*/
	endpointSchema.pick({
		streamRate: true,
		titleConvo: true,
		titleMethod: true,
		titleModel: true,
		titlePrompt: true,
		titleTiming: true,
		titlePromptTemplate: true,
		activityLabel: true,
		activityModel: true,
		activityEndpoint: true,
		activityPrompt: true,
		activityMaxPerRun: true,
		activityCharLimit: true,
		activityPhaseLabel: true,
		activityPhaseModel: true,
		activityPhaseEndpoint: true,
		activityPhasePrompt: true,
		activityPhaseMaxPerRun: true,
		reasoningLabel: true,
		reasoningLabelModel: true,
		reasoningLabelEndpoint: true,
		reasoningLabelPrompt: true,
		reasoningLabelMinChars: true,
		reasoningLabelUpdateChars: true,
		reasoningLabelUpdateIntervalMs: true,
		reasoningLabelMaxPerRun: true
	}).partial()
);
/**
* Vertex AI model configuration - similar to Azure model config
* Allows specifying deployment name for each model
*/
const vertexModelConfigSchema = zod.z.object({ 
/** The actual model ID/deployment name used by Vertex AI API */
deploymentName: zod.z.string().optional() }).or(zod.z.boolean());
/**
* Vertex AI configuration schema for Anthropic models served via Google Cloud Vertex AI.
* Similar to Azure configuration, this allows running Anthropic models through Google Cloud.
*/
const vertexAISchema = zod.z.object({
	/** Enable Vertex AI mode for Anthropic (defaults to true when vertex config is present) */
	enabled: zod.z.boolean().optional(),
	/** Google Cloud Project ID (optional - auto-detected from service key file if not provided) */
	projectId: zod.z.string().optional(),
	/** Vertex AI region (e.g., 'us-east5', 'europe-west1') */
	region: zod.z.string().default("us-east5"),
	/** Optional: Path to service account key file */
	serviceKeyFile: zod.z.string().optional(),
	/** Optional: Default deployment name for all models (can be overridden per model) */
	deploymentName: zod.z.string().optional(),
	/** Optional: Available models - can be string array or object with deploymentName mapping */
	models: zod.z.union([zod.z.array(zod.z.string()), zod.z.record(zod.z.string(), vertexModelConfigSchema)]).optional()
});
/**
* Anthropic endpoint schema with optional Vertex AI configuration.
* Extends baseEndpointSchema with Vertex AI support.
*/
const anthropicEndpointSchema = baseEndpointSchema.merge(zod.z.object({
	/** Vertex AI configuration for running Anthropic models on Google Cloud */
	vertex: vertexAISchema.optional(),
	/** Optional: List of available models */
	models: zod.z.array(zod.z.string()).optional()
}));
/** Masked preview of the API key, stored at write time so admin
* reads can show which key is configured without returning the secret. */
const apiKeyPreviewSchema = zod.z.string().optional();
const ttsOpenaiSchema = zod.z.object({
	url: zod.z.string().optional(),
	apiKey: zod.z.string(),
	apiKeyPreview: apiKeyPreviewSchema,
	model: zod.z.string(),
	voices: zod.z.array(zod.z.string())
});
const ttsAzureOpenAISchema = zod.z.object({
	instanceName: zod.z.string(),
	apiKey: zod.z.string(),
	apiKeyPreview: apiKeyPreviewSchema,
	deploymentName: zod.z.string(),
	apiVersion: zod.z.string(),
	model: zod.z.string(),
	voices: zod.z.array(zod.z.string())
});
const ttsElevenLabsSchema = zod.z.object({
	url: zod.z.string().optional(),
	websocketUrl: zod.z.string().optional(),
	apiKey: zod.z.string(),
	apiKeyPreview: apiKeyPreviewSchema,
	model: zod.z.string(),
	voices: zod.z.array(zod.z.string()),
	voice_settings: zod.z.object({
		similarity_boost: zod.z.number().optional(),
		stability: zod.z.number().optional(),
		style: zod.z.number().optional(),
		use_speaker_boost: zod.z.boolean().optional()
	}).optional(),
	pronunciation_dictionary_locators: zod.z.array(zod.z.string()).optional()
});
const ttsLocalaiSchema = zod.z.object({
	url: zod.z.string(),
	apiKey: zod.z.string().optional(),
	apiKeyPreview: apiKeyPreviewSchema,
	voices: zod.z.array(zod.z.string()),
	backend: zod.z.string()
});
const ttsSchema = zod.z.object({
	allowedAddresses: allowedAddressesSchema,
	openai: ttsOpenaiSchema.optional(),
	azureOpenAI: ttsAzureOpenAISchema.optional(),
	elevenlabs: ttsElevenLabsSchema.optional(),
	localai: ttsLocalaiSchema.optional()
});
const sttOpenaiSchema = zod.z.object({
	url: zod.z.string().optional(),
	apiKey: zod.z.string(),
	apiKeyPreview: apiKeyPreviewSchema,
	model: zod.z.string()
});
const sttAzureOpenAISchema = zod.z.object({
	instanceName: zod.z.string(),
	apiKey: zod.z.string(),
	apiKeyPreview: apiKeyPreviewSchema,
	deploymentName: zod.z.string(),
	apiVersion: zod.z.string()
});
const sttSchema = zod.z.object({
	allowedAddresses: allowedAddressesSchema,
	openai: sttOpenaiSchema.optional(),
	azureOpenAI: sttAzureOpenAISchema.optional()
});
/**
* The speech providers a schema actually configures. `allowedAddresses` is transport
* policy rather than a provider, and a provider key present but empty configures
* nothing. The speech services accept a schema only when exactly one survives here, so
* the upload router reads availability from the same list and never routes audio to a
* transcription that cannot run.
*/
function listConfiguredSpeechProviders(schema) {
	if (schema == null) return [];
	return Object.entries(schema).filter(([key, value]) => key !== "allowedAddresses" && value != null && typeof value === "object" && Object.keys(value).length > 0);
}
/** Whether a speech schema names exactly one usable provider. */
function isSpeechProviderConfigured(schema) {
	return listConfiguredSpeechProviders(schema).length === 1;
}
const speechTab = zod.z.object({
	conversationMode: zod.z.boolean().optional(),
	advancedMode: zod.z.boolean().optional(),
	speechToText: zod.z.boolean().optional().or(zod.z.object({
		/** Provider names remain valid for backward compatibility and are normalized for clients. */
		engineSTT: zod.z.enum([
			"browser",
			"external",
			"openai",
			"azureOpenAI"
		]).optional(),
		languageSTT: zod.z.string().optional(),
		autoTranscribeAudio: zod.z.boolean().optional(),
		decibelValue: zod.z.number().optional(),
		autoSendText: zod.z.number().optional()
	})).optional(),
	textToSpeech: zod.z.boolean().optional().or(zod.z.object({
		/** Provider names remain valid for backward compatibility and are normalized for clients. */
		engineTTS: zod.z.enum([
			"browser",
			"external",
			"openai",
			"azureOpenAI",
			"elevenlabs",
			"localai"
		]).optional(),
		voice: zod.z.string().optional(),
		languageTTS: zod.z.string().optional(),
		automaticPlayback: zod.z.boolean().optional(),
		playbackRate: zod.z.number().min(.25).max(4).optional(),
		cacheTTS: zod.z.boolean().optional()
	})).optional()
}).optional();
let RateLimitPrefix = /* @__PURE__ */ function(RateLimitPrefix) {
	RateLimitPrefix["FILE_UPLOAD"] = "FILE_UPLOAD";
	RateLimitPrefix["IMPORT"] = "IMPORT";
	RateLimitPrefix["TTS"] = "TTS";
	RateLimitPrefix["STT"] = "STT";
	return RateLimitPrefix;
}({});
const rateLimitSchema = zod.z.object({
	agentEvents: zod.z.object({
		userMax: zod.z.number().int().positive().optional(),
		userWindowInMinutes: zod.z.number().positive().optional()
	}).optional(),
	fileUploads: zod.z.object({
		ipMax: zod.z.number().optional(),
		ipWindowInMinutes: zod.z.number().optional(),
		userMax: zod.z.number().optional(),
		userWindowInMinutes: zod.z.number().optional()
	}).optional(),
	conversationsImport: zod.z.object({
		ipMax: zod.z.number().optional(),
		ipWindowInMinutes: zod.z.number().optional(),
		userMax: zod.z.number().optional(),
		userWindowInMinutes: zod.z.number().optional()
	}).optional(),
	tts: zod.z.object({
		ipMax: zod.z.number().optional(),
		ipWindowInMinutes: zod.z.number().optional(),
		userMax: zod.z.number().optional(),
		userWindowInMinutes: zod.z.number().optional()
	}).optional(),
	stt: zod.z.object({
		ipMax: zod.z.number().optional(),
		ipWindowInMinutes: zod.z.number().optional(),
		userMax: zod.z.number().optional(),
		userWindowInMinutes: zod.z.number().optional()
	}).optional()
});
let EImageOutputType = /* @__PURE__ */ function(EImageOutputType) {
	EImageOutputType["PNG"] = "png";
	EImageOutputType["WEBP"] = "webp";
	EImageOutputType["JPEG"] = "jpeg";
	return EImageOutputType;
}({});
const termsOfServiceSchema = zod.z.object({
	externalUrl: zod.z.string().optional(),
	openNewTab: zod.z.boolean().optional(),
	modalAcceptance: zod.z.boolean().optional(),
	modalTitle: zod.z.string().optional(),
	modalContent: zod.z.string().or(zod.z.array(zod.z.string())).optional()
});
const localizedStringSchema = zod.z.union([zod.z.string(), zod.z.record(zod.z.string())]);
const mcpRefreshDefaults = {
	toolsRefreshInterval: 300 * 1e3,
	statusRefreshInterval: 30 * 1e3
};
const mcpServersSchema = zod.z.object({
	/** Foreground polling intervals in milliseconds; 0 disables polling. */
	toolsRefreshInterval: zod.z.number().int().nonnegative().max(2147483647).optional(),
	statusRefreshInterval: zod.z.number().int().nonnegative().max(2147483647).optional(),
	placeholder: zod.z.string().optional(),
	use: zod.z.boolean().optional(),
	create: zod.z.boolean().optional(),
	share: zod.z.boolean().optional(),
	public: zod.z.boolean().optional(),
	configureObo: zod.z.boolean().optional(),
	trustCheckbox: zod.z.object({
		label: localizedStringSchema.optional(),
		subLabel: localizedStringSchema.optional()
	}).optional()
}).optional();
/** Values the trace viewer uses for any `interface.traceViewer` field left unset. */
const traceViewerDefaults = {
	enabled: false,
	showInputOutput: false,
	maxRecords: 1e3,
	maxContentLength: 5e4,
	requestsPerMinute: 30,
	requestTimeoutMs: 1e4
};
/** Inclusive bounds for the numeric `interface.traceViewer` fields. */
const traceViewerLimits = {
	maxRecords: {
		min: 1,
		max: 1e4
	},
	maxContentLength: {
		min: 1,
		max: 1e6
	},
	requestsPerMinute: {
		min: 1,
		max: 1e3
	},
	requestTimeoutMs: {
		min: 1e3,
		max: 3e5
	}
};
const boundedIntegerSchema = (field) => zod.z.number().int().min(traceViewerLimits[field].min).max(traceViewerLimits[field].max).optional();
const traceViewerSchema = zod.z.object({
	/** Shows the conversation trace control for traces this deployment exported. */
	enabled: zod.z.boolean().optional(),
	/** Returns observation input, output and metadata in the record inspector. */
	showInputOutput: zod.z.boolean().optional(),
	/** Observations read from the tracing backend per request. */
	maxRecords: boundedIntegerSchema("maxRecords"),
	/** Characters kept from each input, output and metadata value before truncation. */
	maxContentLength: boundedIntegerSchema("maxContentLength"),
	/** Trace reads one user may start per minute. */
	requestsPerMinute: boundedIntegerSchema("requestsPerMinute"),
	/** Budget for each round trip to the tracing backend, in milliseconds. */
	requestTimeoutMs: boundedIntegerSchema("requestTimeoutMs")
});
function boundedInteger(value, field) {
	const { min, max } = traceViewerLimits[field];
	return typeof value === "number" && Number.isSafeInteger(value) && value >= min ? Math.min(value, max) : traceViewerDefaults[field];
}
/**
* Fills unset or invalid `interface.traceViewer` fields from
* {@link traceViewerDefaults}. Admin config overrides reach runtime without
* schema validation, so every consumer reads the section through this.
*/
function resolveTraceViewerConfig(config) {
	return {
		enabled: config?.enabled === true,
		showInputOutput: config?.showInputOutput === true,
		maxRecords: boundedInteger(config?.maxRecords, "maxRecords"),
		maxContentLength: boundedInteger(config?.maxContentLength, "maxContentLength"),
		requestsPerMinute: boundedInteger(config?.requestsPerMinute, "requestsPerMinute"),
		requestTimeoutMs: boundedInteger(config?.requestTimeoutMs, "requestTimeoutMs")
	};
}
let RetentionMode = /* @__PURE__ */ function(RetentionMode) {
	RetentionMode["ALL"] = "all";
	RetentionMode["TEMPORARY"] = "temporary";
	return RetentionMode;
}({});
const interfaceSchema = zod.z.object({
	privacyPolicy: zod.z.object({
		externalUrl: zod.z.string().optional(),
		openNewTab: zod.z.boolean().optional()
	}).optional(),
	termsOfService: termsOfServiceSchema.optional(),
	customWelcome: zod.z.string().optional(),
	mcpServers: mcpServersSchema.optional(),
	modelSelect: zod.z.boolean().optional(),
	parameters: zod.z.boolean().optional(),
	multiConvo: zod.z.boolean().optional(),
	bookmarks: zod.z.boolean().optional(),
	memories: zod.z.boolean().optional(),
	presets: zod.z.boolean().optional(),
	prompts: zod.z.union([zod.z.boolean(), zod.z.object({
		use: zod.z.boolean().optional(),
		create: zod.z.boolean().optional(),
		share: zod.z.boolean().optional(),
		public: zod.z.boolean().optional()
	})]).optional(),
	agents: zod.z.union([zod.z.boolean(), zod.z.object({
		use: zod.z.boolean().optional(),
		create: zod.z.boolean().optional(),
		share: zod.z.boolean().optional(),
		public: zod.z.boolean().optional()
	})]).optional(),
	temporaryChat: zod.z.boolean().optional(),
	temporaryChatRetention: zod.z.number().min(1).max(8760).optional(),
	generalChatRetention: zod.z.number().min(1).max(8760).optional(),
	autoSubmitFromUrl: zod.z.boolean().optional(),
	retentionMode: zod.z.nativeEnum(RetentionMode).default("temporary"),
	retainAgentFiles: zod.z.boolean().optional(),
	runCode: zod.z.boolean().optional(),
	webSearch: zod.z.boolean().optional(),
	contextUsage: zod.z.boolean().optional(),
	contextCost: zod.z.boolean().optional(),
	feedback: zod.z.boolean().optional(),
	currency: zod.z.object({
		code: zod.z.string(),
		rate: zod.z.number().positive()
	}).optional(),
	peoplePicker: zod.z.object({
		users: zod.z.boolean().optional(),
		groups: zod.z.boolean().optional(),
		roles: zod.z.boolean().optional()
	}).optional(),
	marketplace: zod.z.object({ use: zod.z.boolean().optional() }).optional(),
	fileSearch: zod.z.boolean().optional(),
	fileCitations: zod.z.boolean().optional(),
	traceViewer: traceViewerSchema.optional(),
	/** Tool keys (and `'mcp'` or an MCP server name) pinned to the prompt bar by default */
	defaultPinnedTools: zod.z.array(zod.z.string()).optional(),
	buildInfo: zod.z.boolean().optional(),
	remoteAgents: zod.z.object({
		use: zod.z.boolean().optional(),
		create: zod.z.boolean().optional(),
		share: zod.z.boolean().optional(),
		public: zod.z.boolean().optional()
	}).optional(),
	skills: zod.z.union([zod.z.boolean(), zod.z.object({
		use: zod.z.boolean().optional(),
		create: zod.z.boolean().optional(),
		share: zod.z.boolean().optional(),
		public: zod.z.boolean().optional(),
		defaultActiveOnShare: zod.z.boolean().optional()
	})]).optional(),
	sharedLinks: zod.z.union([zod.z.boolean(), zod.z.object({
		create: zod.z.boolean().optional(),
		share: zod.z.boolean().optional(),
		public: zod.z.boolean().optional(),
		snapshotFiles: zod.z.boolean().optional()
	})]).optional(),
	schedules: zod.z.union([zod.z.boolean(), zod.z.object({
		use: zod.z.boolean().optional(),
		create: zod.z.boolean().optional(),
		maxPerUser: zod.z.number().int().min(0).optional(),
		minIntervalMinutes: zod.z.number().int().min(1).optional(),
		autoDisableAfterFailures: zod.z.number().int().min(1).optional(),
		admissionConcurrency: zod.z.number().int().min(1).max(100).optional(),
		fireConcurrency: zod.z.number().int().min(1).optional(),
		mcpPreflightConcurrency: zod.z.number().int().min(1).max(10).optional(),
		mcpPreflightTimeoutMs: zod.z.number().int().min(1e3).max(6e5).optional(),
		/** Refuse schedules that are not filed under a chat project. Enforced on
		*  create/update AND at every fire, so raising it later stops schedules
		*  that predate the policy instead of grandfathering them. */
		requireProject: zod.z.boolean().optional(),
		/** Pins every scheduled run to ONE chat project, ignoring any client
		*  choice. Implies `requireProject`. The project must belong to the
		*  schedule's owner, so a deployment-wide value only makes sense with a
		*  per-user/per-role config override. */
		projectId: zod.z.string().trim().min(1).optional()
	})]).optional()
}).default({
	modelSelect: true,
	parameters: true,
	presets: true,
	multiConvo: true,
	bookmarks: true,
	memories: true,
	prompts: {
		use: true,
		create: true,
		share: false,
		public: false
	},
	agents: {
		use: true,
		create: true,
		share: false,
		public: false
	},
	temporaryChat: true,
	autoSubmitFromUrl: true,
	runCode: true,
	webSearch: true,
	contextUsage: true,
	contextCost: false,
	feedback: true,
	peoplePicker: {
		users: true,
		groups: true,
		roles: true
	},
	marketplace: { use: true },
	mcpServers: {
		use: true,
		create: true,
		share: false,
		public: false
	},
	fileSearch: true,
	fileCitations: true,
	buildInfo: true,
	remoteAgents: {
		use: false,
		create: false,
		share: false,
		public: false
	},
	skills: {
		use: true,
		create: true,
		share: false,
		public: false,
		defaultActiveOnShare: false
	},
	sharedLinks: {
		create: true,
		share: true,
		public: true,
		snapshotFiles: true
	}
});
const turnstileOptionsSchema = zod.z.object({
	language: zod.z.string().default("auto"),
	size: zod.z.enum([
		"normal",
		"compact",
		"flexible",
		"invisible"
	]).default("normal")
}).default({
	language: "auto",
	size: "normal"
});
const turnstileSchema = zod.z.object({
	siteKey: zod.z.string(),
	options: turnstileOptionsSchema.optional()
});
let OCRStrategy = /* @__PURE__ */ function(OCRStrategy) {
	OCRStrategy["MISTRAL_OCR"] = "mistral_ocr";
	OCRStrategy["CUSTOM_OCR"] = "custom_ocr";
	OCRStrategy["AZURE_MISTRAL_OCR"] = "azure_mistral_ocr";
	OCRStrategy["VERTEXAI_MISTRAL_OCR"] = "vertexai_mistral_ocr";
	OCRStrategy["DOCUMENT_PARSER"] = "document_parser";
	return OCRStrategy;
}({});
let SearchCategories = /* @__PURE__ */ function(SearchCategories) {
	SearchCategories["PROVIDERS"] = "providers";
	SearchCategories["SCRAPERS"] = "scrapers";
	SearchCategories["RERANKERS"] = "rerankers";
	return SearchCategories;
}({});
let SearchProviders = /* @__PURE__ */ function(SearchProviders) {
	SearchProviders["SERPER"] = "serper";
	SearchProviders["SEARXNG"] = "searxng";
	SearchProviders["TAVILY"] = "tavily";
	SearchProviders["KEENABLE"] = "keenable";
	return SearchProviders;
}({});
let ScraperProviders = /* @__PURE__ */ function(ScraperProviders) {
	ScraperProviders["FIRECRAWL"] = "firecrawl";
	ScraperProviders["SERPER"] = "serper";
	ScraperProviders["TAVILY"] = "tavily";
	ScraperProviders["KEENABLE"] = "keenable";
	return ScraperProviders;
}({});
let RerankerTypes = /* @__PURE__ */ function(RerankerTypes) {
	RerankerTypes["JINA"] = "jina";
	RerankerTypes["COHERE"] = "cohere";
	RerankerTypes["NONE"] = "none";
	return RerankerTypes;
}({});
let SafeSearchTypes = /* @__PURE__ */ function(SafeSearchTypes) {
	SafeSearchTypes[SafeSearchTypes["OFF"] = 0] = "OFF";
	SafeSearchTypes[SafeSearchTypes["MODERATE"] = 1] = "MODERATE";
	SafeSearchTypes[SafeSearchTypes["STRICT"] = 2] = "STRICT";
	return SafeSearchTypes;
}({});
/**
* Normalizes a SearXNG engine list into the comma-separated form the API expects.
* Accepts the YAML list or comma-separated string an operator may write, and is
* applied both at the schema boundary and when loading the runtime config, since
* `loadCustomConfig` returns the raw YAML object rather than the parsed result.
*/
function normalizeSearxngEngines(engines) {
	if (engines == null) return;
	const normalized = (Array.isArray(engines) ? engines : engines.split(",")).map((engine) => engine.trim()).filter(Boolean);
	return normalized.length ? normalized.join(",") : void 0;
}
const webSearchSchema = zod.z.object({
	allowedAddresses: allowedAddressesSchema,
	serperApiKey: zod.z.string().optional().default("${SERPER_API_KEY}"),
	serperApiKeyPreview: apiKeyPreviewSchema,
	searxngInstanceUrl: zod.z.string().optional().default("${SEARXNG_INSTANCE_URL}"),
	searxngApiKey: zod.z.string().optional().default("${SEARXNG_API_KEY}"),
	searxngApiKeyPreview: apiKeyPreviewSchema,
	firecrawlApiKey: zod.z.string().optional().default("${FIRECRAWL_API_KEY}"),
	firecrawlApiKeyPreview: apiKeyPreviewSchema,
	firecrawlApiUrl: zod.z.string().optional().default("${FIRECRAWL_API_URL}"),
	firecrawlVersion: zod.z.string().optional().default("${FIRECRAWL_VERSION}"),
	tavilyApiKey: zod.z.string().optional().default("${TAVILY_API_KEY}"),
	tavilyApiKeyPreview: apiKeyPreviewSchema,
	tavilySearchUrl: zod.z.string().optional().default("${TAVILY_SEARCH_URL}"),
	tavilyExtractUrl: zod.z.string().optional().default("${TAVILY_EXTRACT_URL}"),
	keenableApiKey: zod.z.string().optional().default("${KEENABLE_API_KEY}"),
	keenableApiUrl: zod.z.string().optional().default("${KEENABLE_API_URL}"),
	jinaApiKey: zod.z.string().optional().default("${JINA_API_KEY}"),
	jinaApiKeyPreview: apiKeyPreviewSchema,
	jinaApiUrl: zod.z.string().optional().default("${JINA_API_URL}"),
	cohereApiKey: zod.z.string().optional().default("${COHERE_API_KEY}"),
	cohereApiKeyPreview: apiKeyPreviewSchema,
	searchProvider: zod.z.nativeEnum(SearchProviders).optional(),
	scraperProvider: zod.z.nativeEnum(ScraperProviders).optional(),
	rerankerType: zod.z.nativeEnum(RerankerTypes).optional(),
	scraperTimeout: zod.z.number().int().nonnegative().optional(),
	safeSearch: zod.z.nativeEnum(SafeSearchTypes).default(1),
	firecrawlOptions: zod.z.object({
		formats: zod.z.array(zod.z.string()).optional(),
		includeTags: zod.z.array(zod.z.string()).optional(),
		excludeTags: zod.z.array(zod.z.string()).optional(),
		headers: zod.z.record(zod.z.string()).optional(),
		waitFor: zod.z.number().optional(),
		timeout: zod.z.number().int().nonnegative().optional(),
		maxAge: zod.z.number().optional(),
		mobile: zod.z.boolean().optional(),
		skipTlsVerification: zod.z.boolean().optional(),
		blockAds: zod.z.boolean().optional(),
		removeBase64Images: zod.z.boolean().optional(),
		parsePDF: zod.z.boolean().optional(),
		storeInCache: zod.z.boolean().optional(),
		zeroDataRetention: zod.z.boolean().optional(),
		location: zod.z.object({
			country: zod.z.string().optional(),
			languages: zod.z.array(zod.z.string()).optional()
		}).optional(),
		onlyMainContent: zod.z.boolean().optional(),
		changeTrackingOptions: zod.z.object({
			modes: zod.z.array(zod.z.string()).optional(),
			schema: zod.z.record(zod.z.unknown()).optional(),
			prompt: zod.z.string().optional(),
			tag: zod.z.string().nullable().optional()
		}).optional()
	}).optional(),
	searxngSearchOptions: zod.z.object({
		engines: zod.z.union([zod.z.string(), zod.z.array(zod.z.string())]).transform(normalizeSearxngEngines).optional(),
		language: zod.z.string().optional(),
		timeRange: zod.z.enum([
			"day",
			"month",
			"year"
		]).optional(),
		timeout: zod.z.number().int().positive().max(12e4).optional()
	}).optional(),
	tavilySearchOptions: zod.z.object({
		searchDepth: zod.z.enum([
			"basic",
			"advanced",
			"fast",
			"ultra-fast"
		]).optional(),
		maxResults: zod.z.number().int().min(1).max(20).optional(),
		includeImages: zod.z.boolean().optional(),
		includeAnswer: zod.z.union([zod.z.boolean(), zod.z.enum(["basic", "advanced"])]).optional(),
		includeRawContent: zod.z.union([zod.z.boolean(), zod.z.enum(["markdown", "text"])]).optional(),
		includeDomains: zod.z.array(zod.z.string()).optional(),
		excludeDomains: zod.z.array(zod.z.string()).optional(),
		topic: zod.z.enum([
			"general",
			"news",
			"finance"
		]).optional(),
		timeRange: zod.z.enum([
			"day",
			"week",
			"month",
			"year",
			"d",
			"w",
			"m",
			"y"
		]).optional(),
		includeImageDescriptions: zod.z.boolean().optional(),
		includeFavicon: zod.z.boolean().optional(),
		chunksPerSource: zod.z.number().int().min(1).max(3).optional(),
		safeSearch: zod.z.boolean().optional(),
		timeout: zod.z.number().int().nonnegative().max(12e4).optional()
	}).optional(),
	tavilyScraperOptions: zod.z.object({
		extractDepth: zod.z.enum(["basic", "advanced"]).optional(),
		includeImages: zod.z.boolean().optional(),
		includeFavicon: zod.z.boolean().optional(),
		format: zod.z.enum(["markdown", "text"]).optional(),
		timeout: zod.z.number().int().nonnegative().max(12e4).optional()
	}).optional(),
	keenableSearchOptions: zod.z.object({
		maxResults: zod.z.number().int().min(1).max(20).optional(),
		site: zod.z.string().optional(),
		attributionTitle: zod.z.string().optional(),
		timeout: zod.z.number().int().nonnegative().max(12e4).optional()
	}).optional(),
	keenableScraperOptions: zod.z.object({
		attributionTitle: zod.z.string().optional(),
		timeout: zod.z.number().int().nonnegative().max(12e4).optional()
	}).optional()
});
const ocrSchema = zod.z.object({
	allowedAddresses: allowedAddressesSchema,
	mistralModel: zod.z.string().optional(),
	apiKey: zod.z.string().optional().default("${OCR_API_KEY}"),
	apiKeyPreview: apiKeyPreviewSchema,
	baseURL: zod.z.string().optional().default("${OCR_BASEURL}"),
	strategy: zod.z.nativeEnum(OCRStrategy).default("mistral_ocr")
});
const balanceSchema = zod.z.object({
	enabled: zod.z.boolean().optional().default(false),
	startBalance: zod.z.number().optional().default(2e4),
	autoRefillEnabled: zod.z.boolean().optional().default(false),
	refillIntervalValue: zod.z.number().optional().default(30),
	refillIntervalUnit: zod.z.enum(REFILL_INTERVAL_UNITS).optional().default("days"),
	refillAmount: zod.z.number().optional().default(1e4),
	reservationTtlMs: zod.z.number().int().min(MIN_BALANCE_RESERVATION_TTL_MS).optional().default(DEFAULT_BALANCE_RESERVATION_TTL_MS)
});
const transactionsSchema = zod.z.object({ enabled: zod.z.boolean().optional().default(true) });
const DEFAULT_MEMORY_MAX_INPUT_TOKENS = 12e3;
const memorySchema = zod.z.object({
	disabled: zod.z.boolean().optional(),
	validKeys: zod.z.array(zod.z.string()).optional(),
	tokenLimit: zod.z.number().optional(),
	charLimit: zod.z.number().optional().default(1e4),
	maxInputTokens: zod.z.number().int().positive().optional().default(DEFAULT_MEMORY_MAX_INPUT_TOKENS),
	personalize: zod.z.boolean().default(true),
	messageWindowSize: zod.z.number().optional().default(5),
	agent: zod.z.union([zod.z.object({
		enabled: zod.z.boolean().optional(),
		id: zod.z.string()
	}), zod.z.object({
		enabled: zod.z.boolean().optional(),
		provider: zod.z.string(),
		model: zod.z.string(),
		instructions: zod.z.string().optional(),
		model_parameters: zod.z.record(zod.z.union([
			zod.z.string(),
			zod.z.number(),
			zod.z.boolean()
		])).optional()
	})]).optional()
});
const summarizationTriggerSchema = zod.z.discriminatedUnion("type", [
	zod.z.object({
		type: zod.z.literal("token_ratio"),
		value: zod.z.number().finite().min(0).max(1)
	}),
	zod.z.object({
		type: zod.z.literal("remaining_tokens"),
		value: zod.z.number().finite().int().positive()
	}),
	zod.z.object({
		type: zod.z.literal("messages_to_refine"),
		value: zod.z.number().finite().int().positive()
	})
]);
const contextPruningSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	keepLastAssistants: zod.z.number().min(0).max(10).optional(),
	softTrimRatio: zod.z.number().min(0).max(1).optional(),
	hardClearRatio: zod.z.number().min(0).max(1).optional(),
	minPrunableToolChars: zod.z.number().min(0).optional()
});
const retainRecentConfigSchema = zod.z.object({
	turns: zod.z.number().min(0).max(20).optional(),
	tokens: zod.z.number().positive().optional()
});
const summarizationConfigSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	provider: zod.z.string().optional(),
	model: zod.z.string().optional(),
	parameters: zod.z.record(zod.z.union([
		zod.z.string(),
		zod.z.number(),
		zod.z.boolean(),
		zod.z.null()
	])).optional(),
	trigger: summarizationTriggerSchema.optional(),
	prompt: zod.z.string().optional(),
	updatePrompt: zod.z.string().optional(),
	reserveRatio: zod.z.number().min(0).max(1).optional(),
	maxSummaryTokens: zod.z.number().positive().optional(),
	contextPruning: contextPruningSchema.optional(),
	retainRecent: retainRecentConfigSchema.optional()
});
const customEndpointsSchema = zod.z.array(endpointSchema.partial()).optional();
let messageFilterRegexValidator = (value) => {
	try {
		new RegExp(value, "g");
		return true;
	} catch {
		return false;
	}
};
const setMessageFilterRegexValidator = (validate) => {
	messageFilterRegexValidator = validate;
};
const messageFilterPiiCustomPatternSchema = zod.z.object({
	id: zod.z.string().min(1).max(256),
	label: zod.z.string().min(1).max(512),
	regex: zod.z.string().min(1).max(512)
});
const messageFilterPiiSchema = zod.z.object({
	starterPatterns: zod.z.array(zod.z.string().max(256)).max(256).optional(),
	customPatterns: zod.z.array(messageFilterPiiCustomPatternSchema).max(256).optional()
}).superRefine((pii, context) => {
	let regexCharacters = 0;
	let regexInstructions = 0;
	for (let index = 0; index < (pii.customPatterns?.length ?? 0); index++) {
		const pattern = pii.customPatterns?.[index];
		if (pattern == null) continue;
		regexCharacters += pattern.regex.length;
		const result = messageFilterRegexValidator(pattern.regex);
		if (!(typeof result === "boolean" ? result : result.supported)) {
			context.addIssue({
				code: zod.z.ZodIssueCode.custom,
				path: [
					"customPatterns",
					index,
					"regex"
				],
				message: "Unsupported regex: not compatible with the RE2 engine (no backreferences, lookaround, or control escapes)"
			});
			continue;
		}
		if (typeof result !== "boolean" && result.programSize != null) regexInstructions += result.programSize;
	}
	if (regexCharacters > 8192) context.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["customPatterns"],
		message: `Custom PII regexes may contain at most ${MAX_PII_CUSTOM_REGEX_CHARACTERS} characters in total`
	});
	if (regexInstructions > 8192) context.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["customPatterns"],
		message: `Custom PII regexes may compile to at most ${MAX_PII_CUSTOM_REGEX_INSTRUCTIONS} instructions in total`
	});
});
const messageFilterSchema = zod.z.object({ pii: messageFilterPiiSchema.optional() });
/** User fields a deployment may select as the Langfuse trace `userId`. */
const LANGFUSE_TRACE_USER_ID_FIELDS = [
	"id",
	"email",
	"username",
	"name",
	"openidId",
	"samlId",
	"ldapId",
	"googleId",
	"githubId",
	"discordId",
	"appleId",
	"facebookId"
];
/** User fields a deployment may copy into Langfuse trace metadata. */
const LANGFUSE_TRACE_USER_METADATA_FIELDS = [
	...LANGFUSE_TRACE_USER_ID_FIELDS,
	"role",
	"provider"
];
/** Request fields a deployment may copy into Langfuse trace metadata. */
const LANGFUSE_TRACE_CONVERSATION_METADATA_FIELDS = [
	"conversationId",
	"endpoint",
	"endpointType",
	"provider",
	"model",
	"modelLabel",
	"spec"
];
/**
* What a deployment attaches to every Langfuse trace beyond the defaults.
* Nothing here is exported unless explicitly listed, so the default trace
* carries only the internal user id and no user or request metadata.
*/
const langfuseTraceConfigSchema = zod.z.object({
	/**
	* Which user field becomes the trace `userId`. Defaults to the internal user
	* id; a user with no value for the chosen field keeps the internal id.
	*/
	userIdField: zod.z.enum(LANGFUSE_TRACE_USER_ID_FIELDS).optional(),
	/** User fields exported as `librechat.user.<field>` trace metadata. */
	userMetadataFields: zod.z.array(zod.z.enum(LANGFUSE_TRACE_USER_METADATA_FIELDS)).optional(),
	/**
	* Request fields exported as trace metadata: `librechat.conversation.id`,
	* `librechat.endpoint`, `librechat.endpoint.type`, `librechat.provider`,
	* `librechat.model`, `librechat.model.label`, and `librechat.spec`.
	*/
	conversationMetadataFields: zod.z.array(zod.z.enum(LANGFUSE_TRACE_CONVERSATION_METADATA_FIELDS)).optional()
});
const langfuseConfigSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	publicKey: zod.z.string().optional(),
	secretKey: zod.z.string().optional(),
	/** Stable Langfuse project identity returned when credentials are verified. */
	projectId: zod.z.string().optional(),
	/** Masked preview of the secret key, stored at write time so
	* admin reads can show which secret key is configured without returning the secret. */
	secretKeyPreview: zod.z.string().optional(),
	/** Routing key for one of the deployment-configured tenant Langfuse destinations. */
	destination: zod.z.string().optional(),
	/**
	* Custom request headers sent on every outbound Langfuse request — trace and
	* media export, feedback scores, and credential verification — for
	* self-hosted instances behind an authenticating proxy or gateway. Values
	* support `${ENV_VAR}` interpolation.
	*
	* Deployment-level only. Trace export batches spans from every user through
	* one exporter, so unlike endpoint headers these cannot carry per-user
	* placeholders. Headers referencing an unset variable, naming an
	* infrastructure secret, or carrying an invalid HTTP field name are dropped
	* with a warning rather than sent.
	*
	* Sent only when the deployment configures exactly one Langfuse origin, and
	* only to that origin. The map cannot say which endpoint it authenticates
	* to, so with several configured origins any choice of recipient would risk
	* disclosing a gateway credential to the others; a warning is logged instead.
	* Multi-destination deployments need per-destination headers, which this
	* schema does not yet express — and note the fanout collector forwards only
	* `Authorization` upstream regardless.
	*/
	headers: zod.z.record(zod.z.string()).optional(),
	/** Trace user identity and allowlisted user/request metadata. */
	trace: langfuseTraceConfigSchema.optional()
});
const openIdDiscoverySchema = zod.z.object({
	/** Discovery attempts made before startup continues; `0` retries only in the background. */
	startupAttempts: zod.z.number().int().min(0).max(100).default(1),
	/** Milliseconds between startup and background discovery attempts. */
	retryDelayMs: zod.z.number().int().min(100).max(36e5).default(5e3)
});
const configSchema = zod.z.object({
	version: zod.z.string(),
	cache: zod.z.boolean().default(true),
	ocr: ocrSchema.optional(),
	webSearch: webSearchSchema.optional(),
	langfuse: langfuseConfigSchema.optional(),
	memory: memorySchema.optional(),
	summarization: summarizationConfigSchema.optional(),
	skillSync: skillSyncConfigSchema,
	secureImageLinks: zod.z.boolean().optional(),
	imageOutputType: zod.z.nativeEnum(EImageOutputType).default("png"),
	includedTools: zod.z.array(zod.z.string()).optional(),
	filteredTools: zod.z.array(zod.z.string()).optional(),
	mcpServers: MCPServersSchema.optional(),
	mcpSettings: zod.z.object({
		allowedDomains: zod.z.array(zod.z.string()).optional(),
		allowedAddresses: allowedAddressesSchema,
		catalogRecovery: zod.z.object({
			discoveryBackoffMs: zod.z.array(zod.z.number().int().positive().max(1440 * 6e4)).min(1).max(8).default([
				5 * 6e4,
				10 * 6e4,
				20 * 6e4,
				30 * 6e4
			]),
			discoveryTimeoutMs: zod.z.number().int().positive().max(5 * 6e4).default(3e3),
			/** How long past `discoveryTimeoutMs` a stalled discovery may hold its catalog slot and
			* coalesced requests. It is never cancelled, so OAuth tokens it redeemed still persist,
			* and no other discovery for the same server state starts until it settles. */
			discoverySettleGraceMs: zod.z.number().int().nonnegative().max(5 * 6e4).default(1e4),
			reauthRetryMs: zod.z.number().int().positive().max(1440 * 6e4).default(30 * 6e4),
			maxStateEntries: zod.z.number().int().positive().max(1e6).default(1e4),
			/** Process-wide: how many discoveries released past `discoverySettleGraceMs` may still be
			* running before recovery starts no new discovery until one settles. The default matches
			* the three catalog slots a stalled dependency could hold before discoveries were released. */
			maxDetachedDiscoveries: zod.z.number().int().positive().max(1e3).default(3),
			generationReadTimeoutMs: zod.z.number().int().positive().max(1e4).default(500),
			authorizationFenceRetryMs: zod.z.array(zod.z.number().int().nonnegative().max(6e4)).min(1).max(8).default([
				0,
				50,
				200
			]),
			authorizationFenceTimeoutMs: zod.z.number().int().positive().max(3e4).default(1e3),
			authorizationFenceRetryIntervalMs: zod.z.number().int().positive().max(60 * 6e4).default(3e4),
			authorizationFenceRetryBatchSize: zod.z.number().int().positive().max(1e4).default(100)
		}).default({})
	}).optional(),
	interface: interfaceSchema,
	turnstile: turnstileSchema.optional(),
	fileStrategy: fileStorageSchema.default("local"),
	fileStrategies: fileStrategiesSchema,
	cloudfront: cloudfrontConfigSchema,
	actions: zod.z.object({
		allowedDomains: zod.z.array(zod.z.string()).optional(),
		allowedAddresses: allowedAddressesSchema
	}).optional(),
	registration: zod.z.object({
		socialLogins: zod.z.array(zod.z.string()).optional(),
		allowedDomains: zod.z.array(zod.z.string()).optional(),
		/** Milliseconds a started social login may take to reach its callback; defaults to `DEFAULT_OAUTH_STATE_TTL_MS`. */
		oauthStateTtlMs: zod.z.number().int().min(6e4).max(36e5).optional(),
		/** OpenID discovery retries; an unset field falls back to its `OPENID_DISCOVERY_RETRY_*` env var, then the schema default. */
		openidDiscovery: openIdDiscoverySchema.partial().optional()
	}).default({ socialLogins: defaultSocialLogins }),
	balance: balanceSchema.optional(),
	transactions: transactionsSchema.optional(),
	speech: zod.z.object({
		tts: ttsSchema.optional(),
		stt: sttSchema.optional(),
		speechTab: speechTab.optional()
	}).optional(),
	rateLimits: rateLimitSchema.optional(),
	fileConfig: fileConfigSchema.optional(),
	modelSpecs: specsConfigSchema.optional(),
	filters: filtersConfigSchema.optional(),
	messageFilter: messageFilterSchema.optional(),
	endpoints: zod.z.object({
		allowedAddresses: allowedAddressesSchema,
		/**
		* Defaults applied to every endpoint. Omit-based, so options added to
		* `baseEndpointSchema` are inherited here automatically — no list to
		* maintain (contrast `azureEndpointSchema`, which enumerates via
		* `.pick()`). Resolution order at read sites is `all` > the named
		* endpoint > a custom endpoint's own config.
		*/
		all: baseEndpointSchema.omit({ baseURL: true }).optional(),
		["openAI"]: baseEndpointSchema.optional(),
		["google"]: baseEndpointSchema.optional(),
		["anthropic"]: anthropicEndpointSchema.optional(),
		["azureOpenAI"]: azureEndpointSchema.optional(),
		["azureAssistants"]: assistantEndpointSchema.optional(),
		["assistants"]: assistantEndpointSchema.optional(),
		["agents"]: agentsEndpointSchema.optional(),
		["custom"]: customEndpointsSchema.optional(),
		["bedrock"]: bedrockEndpointSchema.optional()
	}).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one `endpoints` field must be provided." }).optional()
});
const getConfigDefaults = () => getSchemaDefaults(configSchema);
let KnownEndpoints = /* @__PURE__ */ function(KnownEndpoints) {
	KnownEndpoints["anyscale"] = "anyscale";
	KnownEndpoints["apipie"] = "apipie";
	KnownEndpoints["cohere"] = "cohere";
	KnownEndpoints["fireworks"] = "fireworks";
	KnownEndpoints["deepseek"] = "deepseek";
	KnownEndpoints["moonshot"] = "moonshot";
	KnownEndpoints["groq"] = "groq";
	KnownEndpoints["helicone"] = "helicone";
	KnownEndpoints["huggingface"] = "huggingface";
	KnownEndpoints["lemonade"] = "lemonade";
	KnownEndpoints["mistral"] = "mistral";
	KnownEndpoints["mlx"] = "mlx";
	KnownEndpoints["ollama"] = "ollama";
	KnownEndpoints["openrouter"] = "openrouter";
	KnownEndpoints["perplexity"] = "perplexity";
	KnownEndpoints["shuttleai"] = "shuttleai";
	KnownEndpoints["together.ai"] = "together.ai";
	KnownEndpoints["unify"] = "unify";
	KnownEndpoints["vercel"] = "vercel";
	KnownEndpoints["xai"] = "xai";
	return KnownEndpoints;
}({});
let FetchTokenConfig = /* @__PURE__ */ function(FetchTokenConfig) {
	FetchTokenConfig["openrouter"] = "openrouter";
	FetchTokenConfig["helicone"] = "helicone";
	return FetchTokenConfig;
}({});
const defaultEndpoints = [
	"openAI",
	"assistants",
	"azureAssistants",
	"azureOpenAI",
	"agents",
	"google",
	"anthropic",
	"custom",
	"bedrock"
];
const alternateName = {
	["openAI"]: "OpenAI",
	["assistants"]: "Assistants",
	["agents"]: "My Agents",
	["azureAssistants"]: "Azure Assistants",
	["azureOpenAI"]: "Azure OpenAI",
	["google"]: "Google",
	["anthropic"]: "Anthropic",
	["custom"]: "Custom",
	["bedrock"]: "AWS Bedrock",
	["lemonade"]: "AMD Lemonade",
	["ollama"]: "Ollama",
	["deepseek"]: "DeepSeek",
	["moonshot"]: "Moonshot",
	["xai"]: "xAI",
	["vercel"]: "Vercel",
	["helicone"]: "Helicone"
};
/**
* Models the Assistants endpoints cannot run. GPT-6 Astra serves tool calls only
* from the Responses API, and the Assistants surface does not route through
* `getOpenAILLMConfig`, so listing it there would offer a configuration the
* provider rejects. Kept out of `sharedOpenAIModels`, which both Assistants
* catalogs consume.
*/
const responsesOnlyOpenAIModels = ["gpt-6-astra"];
const sharedOpenAIModels = [
	"gpt-5.6",
	"gpt-5.6-terra",
	"gpt-5.6-luna",
	"gpt-5.5",
	"gpt-5.5-pro",
	"chat-latest",
	"gpt-5.4",
	"gpt-5.4-pro",
	"gpt-5.4-mini",
	"gpt-5.4-nano",
	"gpt-5.3-codex",
	"gpt-5.2",
	"gpt-5.1",
	"gpt-5.1-codex",
	"gpt-5.1-codex-max",
	"gpt-5.1-codex-mini",
	"gpt-5",
	"gpt-5-mini",
	"gpt-5-nano",
	"gpt-4.1",
	"gpt-4.1-mini",
	"gpt-4.1-nano",
	"gpt-4o-mini",
	"gpt-4o"
];
const sharedAnthropicModels = [
	"claude-fable-5-1",
	"claude-fable-5",
	"claude-opus-5",
	"claude-opus-4-8",
	"claude-opus-4-7",
	"claude-sonnet-5",
	"claude-sonnet-4-6",
	"claude-opus-4-6",
	"claude-sonnet-4-5",
	"claude-sonnet-4-5-20250929",
	"claude-haiku-4-5",
	"claude-haiku-4-5-20251001",
	"claude-opus-4-1",
	"claude-opus-4-1-20250805",
	"claude-opus-4-5",
	"claude-sonnet-4-20250514",
	"claude-sonnet-4-0",
	"claude-opus-4-20250514",
	"claude-opus-4-0",
	"claude-3-7-sonnet-latest",
	"claude-3-7-sonnet-20250219",
	"claude-3-5-haiku-20241022",
	"claude-3-5-sonnet-20241022",
	"claude-3-5-sonnet-20240620",
	"claude-3-5-sonnet-latest"
];
/**
* Claude 4+ models are not invocable on-demand by their bare foundation-model
* ID on the Converse path — Bedrock rejects those with "Invocation of model ID
* ... with on-demand throughput isn't supported. Retry your request with the ID
* or ARN of an inference profile that contains this model." Default to the
* `global.` cross-region profile (no regional pricing premium, widest
* availability); Opus 4.1 has no global profile, so it uses `us.`.
*/
const bedrockModels = [
	"global.anthropic.claude-fable-5-1",
	"global.anthropic.claude-fable-5",
	"global.anthropic.claude-opus-5",
	"global.anthropic.claude-opus-4-8",
	"global.anthropic.claude-opus-4-7",
	"global.anthropic.claude-sonnet-5",
	"global.anthropic.claude-sonnet-4-6",
	"global.anthropic.claude-opus-4-6-v1",
	"global.anthropic.claude-sonnet-4-5-20250929-v1:0",
	"global.anthropic.claude-haiku-4-5-20251001-v1:0",
	"us.anthropic.claude-opus-4-1-20250805-v1:0",
	"cohere.command-r-v1:0",
	"cohere.command-r-plus-v1:0",
	"meta.llama2-13b-chat-v1",
	"meta.llama2-70b-chat-v1",
	"meta.llama3-8b-instruct-v1:0",
	"meta.llama3-70b-instruct-v1:0",
	"meta.llama3-1-8b-instruct-v1:0",
	"meta.llama3-1-70b-instruct-v1:0",
	"meta.llama3-1-405b-instruct-v1:0",
	"mistral.mistral-7b-instruct-v0:2",
	"mistral.mixtral-8x7b-instruct-v0:1",
	"mistral.mistral-large-2402-v1:0",
	"mistral.mistral-large-2407-v1:0",
	"mistral.mistral-small-2402-v1:0",
	"ai21.jamba-instruct-v1:0",
	"amazon.titan-text-lite-v1",
	"amazon.titan-text-express-v1",
	"amazon.titan-text-premier-v1:0"
];
const defaultModels = {
	["azureAssistants"]: sharedOpenAIModels,
	["assistants"]: [...sharedOpenAIModels, "chatgpt-4o-latest"],
	["agents"]: [...responsesOnlyOpenAIModels, ...sharedOpenAIModels],
	["google"]: [
		"gemini-3.8-flash",
		"gemini-3.7-flash",
		"gemini-3.6-flash",
		"gemini-3.5-flash",
		"gemini-3.5-flash-lite",
		"gemini-3.1-pro-preview",
		"gemini-3.1-pro-preview-customtools",
		"gemini-3.1-flash-lite-preview",
		"gemini-3-pro-preview",
		"gemini-3-flash-preview",
		"gemini-2.5-pro",
		"gemini-2.5-flash",
		"gemini-2.5-flash-lite"
	],
	["anthropic"]: sharedAnthropicModels,
	["openAI"]: [
		...responsesOnlyOpenAIModels,
		...sharedOpenAIModels,
		"chatgpt-4o-latest",
		"gpt-4-vision-preview",
		"gpt-3.5-turbo-instruct-0914",
		"gpt-3.5-turbo-instruct"
	],
	["bedrock"]: bedrockModels
};
const fitlerAssistantModels = (str) => {
	return /gpt-4|gpt-3\\.5/i.test(str) && !/vision|instruct/i.test(str);
};
const openAIModels = defaultModels["openAI"];
/**
* Preserve Azure's fallback default selection when the OpenAI catalog gains
* Responses-preferred models. Configured Azure deployments supply their own
* model list, including Astra when deployed.
*/
const nonResponsesOnlyOpenAIModels = openAIModels.filter((model) => !responsesOnlyOpenAIModels.includes(model));
const initialModelsConfig = {
	initial: [],
	["openAI"]: openAIModels,
	["assistants"]: openAIModels.filter(fitlerAssistantModels),
	["agents"]: openAIModels,
	["azureOpenAI"]: nonResponsesOnlyOpenAIModels,
	["google"]: defaultModels["google"],
	["anthropic"]: defaultModels["anthropic"],
	["bedrock"]: defaultModels["bedrock"]
};
const EndpointURLs = {
	["assistants"]: `${apiBaseUrl()}/api/assistants/v2/chat`,
	["azureAssistants"]: `${apiBaseUrl()}/api/assistants/v1/chat`,
	["agents"]: `${apiBaseUrl()}/api/agents/chat`
};
const modularEndpoints = new Set([
	"anthropic",
	"google",
	"openAI",
	"azureOpenAI",
	"custom",
	"agents",
	"bedrock"
]);
const supportsBalanceCheck = {
	["custom"]: true,
	["openAI"]: true,
	["anthropic"]: true,
	["assistants"]: true,
	["agents"]: true,
	["azureAssistants"]: true,
	["azureOpenAI"]: true,
	["bedrock"]: true,
	["google"]: true
};
const visionModels = [
	"qwen-vl",
	"grok-vision",
	"grok-2-vision",
	"grok-3",
	"gpt-4o-mini",
	"gpt-4o",
	"gpt-4-turbo",
	"gpt-4-vision",
	"o4-mini",
	"o3",
	"o1",
	"gpt-5",
	"gpt-4.1",
	"gpt-4.5",
	"llava",
	"llava-13b",
	"gemini-pro-vision",
	"claude-3",
	"gemma",
	"gemini-exp",
	"gemini-1.5",
	"gemini-2",
	"gemini-2.5",
	"gemini-3",
	"moondream",
	"llama3.2-vision",
	"llama-3.2-11b-vision",
	"llama-3-2-11b-vision",
	"llama-3.2-90b-vision",
	"llama-3-2-90b-vision",
	"llama-4",
	"claude-opus-4",
	"claude-sonnet-4",
	"claude-haiku-4"
];
let VisionModes = /* @__PURE__ */ function(VisionModes) {
	VisionModes["generative"] = "generative";
	VisionModes["agents"] = "agents";
	return VisionModes;
}({});
function validateVisionModel({ model, additionalModels = [], availableModels }) {
	if (!model) return false;
	if (model.includes("gpt-4-turbo-preview") || model.includes("o1-mini")) return false;
	if (availableModels && !availableModels.includes(model)) return false;
	return visionModels.concat(additionalModels).some((visionModel) => model.includes(visionModel));
}
const imageGenTools = new Set([
	"dalle",
	"dall-e",
	"stable-diffusion",
	"flux",
	"gemini_image_gen"
]);
/**
* Enum for collections using infinite queries
*/
let InfiniteCollections = /* @__PURE__ */ function(InfiniteCollections) {
	/**
	* Collection for Prompt Groups
	*/
	InfiniteCollections["PROMPT_GROUPS"] = "promptGroups";
	/**
	* Collection for Shared Links
	*/
	InfiniteCollections["SHARED_LINKS"] = "sharedLinks";
	return InfiniteCollections;
}({});
/**
* Enum for time intervals
*/
let Time = /* @__PURE__ */ function(Time) {
	Time[Time["ONE_DAY"] = 864e5] = "ONE_DAY";
	Time[Time["TWELVE_HOURS"] = 432e5] = "TWELVE_HOURS";
	Time[Time["ONE_HOUR"] = 36e5] = "ONE_HOUR";
	Time[Time["THIRTY_MINUTES"] = 18e5] = "THIRTY_MINUTES";
	Time[Time["TEN_MINUTES"] = 6e5] = "TEN_MINUTES";
	Time[Time["FIVE_MINUTES"] = 3e5] = "FIVE_MINUTES";
	Time[Time["THREE_MINUTES"] = 18e4] = "THREE_MINUTES";
	Time[Time["TWO_MINUTES"] = 12e4] = "TWO_MINUTES";
	Time[Time["ONE_MINUTE"] = 6e4] = "ONE_MINUTE";
	Time[Time["THIRTY_SECONDS"] = 3e4] = "THIRTY_SECONDS";
	return Time;
}({});
/**
* Enum for cache keys.
*/
let CacheKeys = /* @__PURE__ */ function(CacheKeys) {
	/**
	* Key for the config store namespace.
	*/
	CacheKeys["CONFIG_STORE"] = "CONFIG_STORE";
	/**
	* Key for the tool cache namespace (plugins, MCP tools, tool definitions).
	*/
	CacheKeys["TOOL_CACHE"] = "TOOL_CACHE";
	/**
	* Key for the roles cache.
	*/
	CacheKeys["ROLES"] = "ROLES";
	/**
	* Key for cached group memberships used to resolve ACL user principals.
	*/
	CacheKeys["USER_PRINCIPALS"] = "USER_PRINCIPALS";
	/**
	* Key for cached prompt group access ID sets (accessible, public, owned).
	*/
	CacheKeys["PROMPT_GROUPS_ACCESS"] = "PROMPT_GROUPS_ACCESS";
	/**
	* Key for per-conversation stateful code sandbox prewarm/warm state.
	*/
	CacheKeys["SANDBOX_PREWARM"] = "SANDBOX_PREWARM";
	/**
	* Key for the title generation cache.
	*/
	CacheKeys["GEN_TITLE"] = "GEN_TITLE";
	/**
	* Key for the tools cache.
	*/
	CacheKeys["TOOLS"] = "TOOLS";
	/**
	* Key for the model config cache.
	*/
	CacheKeys["MODELS_CONFIG"] = "MODELS_CONFIG";
	/**
	* Key for the model queries cache.
	*/
	CacheKeys["MODEL_QUERIES"] = "MODEL_QUERIES";
	/**
	* Key for the default startup config cache.
	*/
	CacheKeys["STARTUP_CONFIG"] = "STARTUP_CONFIG";
	/**
	* Key for the default endpoint config cache.
	*/
	CacheKeys["ENDPOINT_CONFIG"] = "ENDPOINT_CONFIG";
	/**
	* Key for accessing the model token config cache.
	*/
	CacheKeys["TOKEN_CONFIG"] = "TOKEN_CONFIG";
	/**
	* Key for the app config namespace.
	*/
	CacheKeys["APP_CONFIG"] = "APP_CONFIG";
	/**
	* Key for accessing Abort Keys
	*/
	CacheKeys["ABORT_KEYS"] = "ABORT_KEYS";
	/**
	* Key for the bans cache.
	*/
	CacheKeys["BANS"] = "BANS";
	/**
	* Key for the encoded domains cache.
	* Used by Azure OpenAI Assistants.
	*/
	CacheKeys["ENCODED_DOMAINS"] = "ENCODED_DOMAINS";
	/**
	* Key for the cached audio run Ids.
	*/
	CacheKeys["AUDIO_RUNS"] = "AUDIO_RUNS";
	/**
	* Key for in-progress messages.
	*/
	CacheKeys["MESSAGES"] = "MESSAGES";
	/**
	* Key for in-progress flow states.
	*/
	CacheKeys["FLOWS"] = "FLOWS";
	/**
	* Key for pending chat requests (concurrency check)
	*/
	CacheKeys["PENDING_REQ"] = "PENDING_REQ";
	/**
	* Key for s3 check intervals per user
	*/
	CacheKeys["S3_EXPIRY_INTERVAL"] = "S3_EXPIRY_INTERVAL";
	/**
	* key for open id exchanged tokens
	*/
	CacheKeys["OPENID_EXCHANGED_TOKENS"] = "OPENID_EXCHANGED_TOKENS";
	/**
	* Key for cached authenticated user documents.
	*/
	CacheKeys["AUTH_USER_DOC"] = "AUTH_USER_DOC";
	/**
	* Key for OpenID session.
	*/
	CacheKeys["OPENID_SESSION"] = "OPENID_SESSION";
	/**
	* Key for SAML session.
	*/
	CacheKeys["SAML_SESSION"] = "SAML_SESSION";
	/**
	* Key for admin panel OAuth exchange codes (one-time-use, short TTL).
	*/
	CacheKeys["ADMIN_OAUTH_EXCHANGE"] = "ADMIN_OAUTH_EXCHANGE";
	return CacheKeys;
}({});
const AUTH_USER_DOC_BY_ID_PREFIX = "auth-user-doc-byid";
/**
* Enum for violation types, used to identify, log, and cache violations.
*/
let ViolationTypes = /* @__PURE__ */ function(ViolationTypes) {
	/**
	* File Upload Violations (exceeding limit).
	*/
	ViolationTypes["FILE_UPLOAD_LIMIT"] = "file_upload_limit";
	/**
	* Illegal Model Request (not available).
	*/
	ViolationTypes["ILLEGAL_MODEL_REQUEST"] = "illegal_model_request";
	/**
	* Token Limit Violation.
	*/
	ViolationTypes["TOKEN_BALANCE"] = "token_balance";
	/**
	* An issued ban.
	*/
	ViolationTypes["BAN"] = "ban";
	/**
	* TTS Request Limit Violation.
	*/
	ViolationTypes["TTS_LIMIT"] = "tts_limit";
	/**
	* STT Request Limit Violation.
	*/
	ViolationTypes["STT_LIMIT"] = "stt_limit";
	/**
	* Reset Password Limit Violation.
	*/
	ViolationTypes["RESET_PASSWORD_LIMIT"] = "reset_password_limit";
	/**
	* Verify Email Limit Violation.
	*/
	ViolationTypes["VERIFY_EMAIL_LIMIT"] = "verify_email_limit";
	/**
	* Verify Conversation Access violation.
	*/
	ViolationTypes["CONVO_ACCESS"] = "convo_access";
	/**
	* Tool Call Limit Violation.
	*/
	ViolationTypes["TOOL_CALL_LIMIT"] = "tool_call_limit";
	/**
	* General violation (catch-all).
	*/
	ViolationTypes["GENERAL"] = "general";
	/**
	* Login attempt violations.
	*/
	ViolationTypes["LOGINS"] = "logins";
	/**
	* Concurrent request violations.
	*/
	ViolationTypes["CONCURRENT"] = "concurrent";
	/**
	* Non-browser access violations.
	*/
	ViolationTypes["NON_BROWSER"] = "non_browser";
	/**
	* Message limit violations.
	*/
	ViolationTypes["MESSAGE_LIMIT"] = "message_limit";
	/**
	* Registration violations.
	*/
	ViolationTypes["REGISTRATIONS"] = "registrations";
	/**
	* Shared link retrieval limit violations.
	*/
	ViolationTypes["SHARE_LIMIT"] = "share_limit";
	return ViolationTypes;
}({});
/**
* Enum for error message types that are not "violations" as above, used to identify client-facing errors.
*/
let ErrorTypes = /* @__PURE__ */ function(ErrorTypes) {
	/**
	* No User-provided Key.
	*/
	ErrorTypes["NO_USER_KEY"] = "no_user_key";
	/**
	* Expired User-provided Key.
	*/
	ErrorTypes["EXPIRED_USER_KEY"] = "expired_user_key";
	/**
	* Invalid User-provided Key.
	*/
	ErrorTypes["INVALID_USER_KEY"] = "invalid_user_key";
	/**
	* No Base URL Provided.
	*/
	ErrorTypes["NO_BASE_URL"] = "no_base_url";
	/**
	* Base URL targets a restricted or invalid address (SSRF protection).
	*/
	ErrorTypes["INVALID_BASE_URL"] = "invalid_base_url";
	/**
	* Moderation error
	*/
	ErrorTypes["MODERATION"] = "moderation";
	/**
	* Prompt exceeds max length
	*/
	ErrorTypes["INPUT_LENGTH"] = "INPUT_LENGTH";
	/**
	* Invalid request error, API rejected request
	*/
	ErrorTypes["INVALID_REQUEST"] = "invalid_request_error";
	/**
	* Invalid action request error, likely not on list of allowed domains
	*/
	ErrorTypes["INVALID_ACTION"] = "invalid_action_error";
	/**
	* Invalid request error, API rejected request
	*/
	ErrorTypes["NO_SYSTEM_MESSAGES"] = "no_system_messages";
	/**
	* Google provider returned an error
	*/
	ErrorTypes["GOOGLE_ERROR"] = "google_error";
	/**
	* Google provider does not allow custom tools with built-in tools
	*/
	ErrorTypes["GOOGLE_TOOL_CONFLICT"] = "google_tool_conflict";
	/**
	* Google provider could not process a linked video (most often longer than the model accepts)
	*/
	ErrorTypes["GOOGLE_VIDEO_UNPROCESSABLE"] = "google_video_unprocessable";
	/**
	* Required CodeAPI resources could not be restored before model invocation.
	*/
	ErrorTypes["RESOURCE_RECOVERY_REQUIRED"] = "resource_recovery_required";
	/**
	* Agent selected a stateful Code API workspace scope disabled by the deployment.
	*/
	ErrorTypes["STATEFUL_CODE_ENVIRONMENT_NOT_ALLOWED"] = "stateful_code_environment_not_allowed";
	/**
	* A conversation's selected attached workspace cannot be used as requested.
	*/
	ErrorTypes["CODE_WORKSPACE_UNAVAILABLE"] = "code_workspace_unavailable";
	/**
	* Invalid Agent Provider (excluded by Admin)
	*/
	ErrorTypes["INVALID_AGENT_PROVIDER"] = "invalid_agent_provider";
	/**
	* Missing model selection
	*/
	ErrorTypes["MISSING_MODEL"] = "missing_model";
	/**
	* Models configuration not loaded
	*/
	ErrorTypes["MODELS_NOT_LOADED"] = "models_not_loaded";
	/**
	* Endpoint models not loaded
	*/
	ErrorTypes["ENDPOINT_MODELS_NOT_LOADED"] = "endpoint_models_not_loaded";
	/**
	* Generic Authentication failure
	*/
	ErrorTypes["AUTH_FAILED"] = "auth_failed";
	/**
	* Authentication rejected by a rate limiter
	*/
	ErrorTypes["AUTH_RATE_LIMITED"] = "auth_rate_limited";
	/**
	* Authentication rejected because the account or IP is banned
	*/
	ErrorTypes["AUTH_BANNED"] = "auth_banned";
	/**
	* Authentication request was not sent from this application's origin
	*/
	ErrorTypes["AUTH_CROSS_ORIGIN"] = "auth_cross_origin";
	/**
	* Model refused to respond (content policy violation)
	*/
	ErrorTypes["REFUSAL"] = "refusal";
	/**
	* SSE stream 404 — job completed, expired, or was deleted before the subscriber connected
	*/
	ErrorTypes["STREAM_EXPIRED"] = "stream_expired";
	/**
	* Provider does not serve the requested model
	*/
	ErrorTypes["MODEL_NOT_FOUND"] = "model_not_found";
	/**
	* Provider throttled or refused the request for exceeding a rate/spend allowance
	*/
	ErrorTypes["MODEL_RATE_LIMIT"] = "model_rate_limit";
	/**
	* An agent model provider failed and the run could not recover.
	*/
	ErrorTypes["UPSTREAM_MODEL_ERROR"] = "upstream_model_error";
	/**
	* Context pruning removed every message; nothing fits the configured context window
	*/
	ErrorTypes["EMPTY_MESSAGES"] = "empty_messages";
	/**
	* Formatted provider payload exceeded the context budget before invocation
	*/
	ErrorTypes["FINAL_CONTEXT_OVERFLOW"] = "final_context_overflow";
	/**
	* A manual compaction the graph could not attempt; `reason` says why
	*/
	ErrorTypes["COMPACTION_SKIPPED"] = "compaction_skipped";
	/**
	* A manual compaction whose summarizer produced nothing; history is untouched
	*/
	ErrorTypes["COMPACTION_FAILED"] = "compaction_failed";
	return ErrorTypes;
}({});
/**
* Enum for authentication keys.
*/
let AuthKeys = /* @__PURE__ */ function(AuthKeys) {
	/**
	* Key for the Service Account to use Vertex AI.
	*/
	AuthKeys["GOOGLE_SERVICE_KEY"] = "GOOGLE_SERVICE_KEY";
	/**
	* API key to use Google Generative AI.
	*
	* Note: this is not for Environment Variables, but to access encrypted object values.
	*/
	AuthKeys["GOOGLE_API_KEY"] = "GOOGLE_API_KEY";
	/**
	* API key to use Anthropic.
	*
	* Note: this is not for Environment Variables, but to access encrypted object values.
	*/
	AuthKeys["ANTHROPIC_API_KEY"] = "ANTHROPIC_API_KEY";
	return AuthKeys;
}({});
/**
* Enum for Image Detail Cost.
*
* **Low Res Fixed Cost:** `85`
*
* **High Res Calculation:**
*
* Number of `512px` Tiles * `170` + `85` (Additional Cost)
*/
let ImageDetailCost = /* @__PURE__ */ function(ImageDetailCost) {
	/**
	* Low resolution is a fixed value.
	*/
	ImageDetailCost[ImageDetailCost["LOW"] = 85] = "LOW";
	/**
	* High resolution Cost Per Tile
	*/
	ImageDetailCost[ImageDetailCost["HIGH"] = 170] = "HIGH";
	/**
	* Additional Cost added to High Resolution Total Cost
	*/
	ImageDetailCost[ImageDetailCost["ADDITIONAL"] = 85] = "ADDITIONAL";
	return ImageDetailCost;
}({});
/**
* Tab values for Settings Dialog
*/
let SettingsTabValues = /* @__PURE__ */ function(SettingsTabValues) {
	/**
	* Tab for General Settings
	*/
	SettingsTabValues["GENERAL"] = "general";
	/**
	* Tab for Chat Settings
	*/
	SettingsTabValues["CHAT"] = "chat";
	/**
	* Tab for Speech Settings
	*/
	SettingsTabValues["SPEECH"] = "speech";
	/**
	* Tab for Langfuse Settings
	*/
	SettingsTabValues["LANGFUSE"] = "langfuse";
	/**
	* Tab for Beta Features
	*/
	SettingsTabValues["BETA"] = "beta";
	/**
	* Tab for Data Controls
	*/
	SettingsTabValues["DATA"] = "data";
	/**
	* Tab for Balance Settings
	*/
	SettingsTabValues["BALANCE"] = "balance";
	/**
	* Tab for Account Settings
	*/
	SettingsTabValues["ACCOUNT"] = "account";
	/**
	* Chat input commands
	*/
	SettingsTabValues["COMMANDS"] = "commands";
	/**
	* Tab for Personalization Settings
	*/
	SettingsTabValues["PERSONALIZATION"] = "personalization";
	/**
	* Tab for About / Build Info
	*/
	SettingsTabValues["ABOUT"] = "about";
	return SettingsTabValues;
}({});
let STTProviders = /* @__PURE__ */ function(STTProviders) {
	/**
	* Provider for OpenAI STT
	*/
	STTProviders["OPENAI"] = "openai";
	/**
	* Provider for Microsoft Azure STT
	*/
	STTProviders["AZURE_OPENAI"] = "azureOpenAI";
	return STTProviders;
}({});
let TTSProviders = /* @__PURE__ */ function(TTSProviders) {
	/**
	* Provider for OpenAI TTS
	*/
	TTSProviders["OPENAI"] = "openai";
	/**
	* Provider for Microsoft Azure OpenAI TTS
	*/
	TTSProviders["AZURE_OPENAI"] = "azureOpenAI";
	/**
	* Provider for ElevenLabs TTS
	*/
	TTSProviders["ELEVENLABS"] = "elevenlabs";
	/**
	* Provider for LocalAI TTS
	*/
	TTSProviders["LOCALAI"] = "localai";
	return TTSProviders;
}({});
/** Enum for app-wide constants */
let Constants = /* @__PURE__ */ function(Constants) {
	/**
	* Key for the app's version. The placeholder `v0.8.8-rc3` is
	* swapped in by `@rollup/plugin-replace` during `npm run build:data-provider`
	* using the value of the root `package.json`'s `version` field. Consumers
	* always import this via the built dist bundle (see `main` field in
	* `packages/data-provider/package.json`), so production and UI code get the
	* substituted value. Only tests that import the TypeScript source directly
	* would observe the raw placeholder.
	*/
	Constants["VERSION"] = "v0.8.8-rc3";
	/** Key for the Custom Config's version (librechat.yaml). */
	Constants["CONFIG_VERSION"] = "1.3.16";
	/** Standard value for the first message's `parentMessageId` value, to indicate no parent exists. */
	Constants["NO_PARENT"] = "00000000-0000-0000-0000-000000000000";
	/** Standard value to use whatever the submission prelim. `responseMessageId` is */
	Constants["USE_PRELIM_RESPONSE_MESSAGE_ID"] = "USE_PRELIM_RESPONSE_MESSAGE_ID";
	/** Standard value for the initial conversationId before a request is sent */
	Constants["NEW_CONVO"] = "new";
	/** Standard value for the temporary conversationId after a request is sent and before the server responds */
	Constants["PENDING_CONVO"] = "PENDING";
	/** Standard value for the conversationId used for search queries */
	Constants["SEARCH"] = "search";
	/** Fixed, encoded domain length for Azure OpenAI Assistants Function name parsing. */
	Constants[Constants["ENCODED_DOMAIN_LENGTH"] = 10] = "ENCODED_DOMAIN_LENGTH";
	/** Identifier for using current_model in multi-model requests. */
	Constants["CURRENT_MODEL"] = "current_model";
	/** Common divider for text values */
	Constants["COMMON_DIVIDER"] = "__";
	/** Max length for commands */
	Constants[Constants["COMMANDS_MAX_LENGTH"] = 56] = "COMMANDS_MAX_LENGTH";
	/** Default Stream Rate (ms) */
	Constants[Constants["DEFAULT_STREAM_RATE"] = 1] = "DEFAULT_STREAM_RATE";
	/** Saved Tag */
	Constants["SAVED_TAG"] = "Saved";
	/** Max number of Conversation starters for Agents/Assistants */
	Constants[Constants["MAX_CONVO_STARTERS"] = 4] = "MAX_CONVO_STARTERS";
	/** Delimiter for MCP tools */
	Constants["mcp_delimiter"] = "_mcp_";
	/** Prefix for MCP plugins */
	Constants["mcp_prefix"] = "mcp_";
	/** Unique value to indicate all MCP servers. For backend use only. */
	Constants["mcp_all"] = "sys__all__sys";
	/** Unique value to indicate clearing MCP servers from UI state. For frontend use only. */
	Constants["mcp_clear"] = "sys__clear__sys";
	/** Key suffix for non-spec user default tool storage */
	Constants["spec_defaults_key"] = "__defaults__";
	/**
	* Unique value to indicate the MCP tool was added to an agent.
	* This helps inform the UI if the mcp server was previously added.
	* */
	Constants["mcp_server"] = "sys__server__sys";
	/**
	* Handoff Tool Name Prefix
	*/
	Constants["LC_TRANSFER_TO_"] = "lc_transfer_to_";
	/** Placeholder Agent ID for Ephemeral Agents */
	Constants["EPHEMERAL_AGENT_ID"] = "ephemeral";
	/** Programmatic Tool Calling tool name */
	Constants["PROGRAMMATIC_TOOL_CALLING"] = "run_tools_with_code";
	/** Bash Programmatic Tool Calling tool name */
	Constants["BASH_PROGRAMMATIC_TOOL_CALLING"] = "run_tools_with_bash";
	/** Subagent spawn tool name (must match `@librechat/agents` `Constants.SUBAGENT`). */
	Constants["SUBAGENT"] = "subagent";
	/** Poll tool for retrieving the status/result of a backgrounded tool call. */
	Constants["CHECK_BACKGROUND_TASK"] = "check_background_task";
	/**
	* `finish_reason` stamped on an assistant message whose turn ended because the
	* agent exhausted its per-turn graph step budget (`recursionLimit`) rather than
	* because the model chose to stop. Distinct from a user abort: nothing failed and
	* nothing was cancelled, the turn simply ran out of room. The UI keys its
	* "tool call limit reached" notice off this value. The hover Continue control
	* is withheld for this reason because the notice already offers the way forward.
	*/
	Constants["TOOL_CALL_LIMIT_FINISH_REASON"] = "tool_call_limit";
	return Constants;
}({});
/**
* Normalizes a server name into the character set tool keys are built from.
* Tool keys embed this output, so any candidate list matched against a key must
* be normalized the same way.
*/
function normalizeServerName(serverName) {
	if (/^[a-zA-Z0-9_.-]+$/.test(serverName)) return serverName;
	const normalized = serverName.replace(/[^a-zA-Z0-9_.-]/g, "_").replace(/^_+|_+$/g, "");
	if (normalized) return normalized;
	/** All characters were stripped; hash the original so the name stays unique. */
	let hash = 0;
	for (let i = 0; i < serverName.length; i++) {
		hash = (hash << 5) - hash + serverName.charCodeAt(i);
		hash |= 0;
	}
	return `server_${Math.abs(hash)}`;
}
/**
* Splits a combined MCP tool key (`${rawToolName}${mcp_delimiter}${serverName}`)
* back into its two parts.
*
* Both halves can legitimately contain the delimiter, so position alone cannot
* identify the boundary. Raw tool names come from the upstream server and are
* untrusted (`get_mcp_server_version`, or a gateway-prefixed
* `gitlab-get_mcp_server_version`), and `normalizeServerName` preserves
* underscores, so a configured server may be named `Google_mcp_Workspace`.
*
* When `knownServerNames` is supplied the boundary is resolved against it: the
* longest configured name the key actually ends with wins. Otherwise this falls
* back to the last delimiter, which is correct whenever only the tool half
* contains one and matches `.split()` when neither does.
*
* One case stays undecidable from the key alone: if both `bar` and `foo_mcp_bar`
* are configured, `tool_mcp_foo_mcp_bar` is a valid key for either. Longest match
* is the deterministic tiebreak; resolving it properly needs the tool/server
* mapping carried alongside the key rather than re-derived from the string.
*/
/**
* Maps each configured server name's normalized form back to the raw config
* name. Model-facing tool keys embed `normalizeServerName(server)`, while the
* registry, config maps, tool cache, and plugin-auth rows are keyed by the raw
* name — any consumer that parses a server out of a tool key must resolve it
* through this map before those lookups. Identity entries are included so
* `aliases.get(name) ?? name` works uniformly.
*
* When two configured names normalize to the same value their tool keys are
* inherently ambiguous; the FIRST configured name wins deterministically here,
* and `resolveMCPServerContext` warns about the collision so the operator can
* rename one server.
*/
function buildServerNameAliases(rawServerNames) {
	const aliases = /* @__PURE__ */ new Map();
	/** Identity entries claim their slot FIRST regardless of configuration
	*  order: a server literally named `foo` must never have its keys rerouted
	*  to a `foo!` whose normalized form collides with it. */
	for (const raw of rawServerNames) if (raw && normalizeServerName(raw) === raw) aliases.set(raw, raw);
	for (const raw of rawServerNames) {
		if (!raw) continue;
		const normalized = normalizeServerName(raw);
		if (!aliases.has(normalized)) aliases.set(normalized, raw);
	}
	return aliases;
}
/**
* Rewrites a tool key's server segment into the normalized form model-facing
* keys carry, resolving the boundary against the configured raw names (longest
* suffix wins, mirroring {@link splitMCPToolKey}). Returns the key unchanged
* when no configured raw name matches — already-normalized keys, placeholder
* tokens, and keys for servers that are no longer configured all pass through.
* Idempotent: a normalized segment never matches a raw candidate that needs
* rewriting.
*/
function normalizeMCPToolKey(toolKey, rawServerNames) {
	let matched;
	for (let i = 0; i < rawServerNames.length; i++) {
		const raw = rawServerNames[i];
		if (!raw || raw.length <= (matched?.length ?? 0)) continue;
		if (toolKey.endsWith(`_mcp_${raw}`)) matched = raw;
	}
	if (matched == null) return toolKey;
	const normalized = normalizeServerName(matched);
	if (normalized === matched) return toolKey;
	return `${toolKey.slice(0, toolKey.length - matched.length)}${normalized}`;
}
/**
* Strips a redundant leading server-name prefix from a raw upstream tool name
* before it is embedded into a model-facing key, so the key doesn't carry the
* server twice (`acme_trace_..._mcp_acme`) and push long tool names
* past provider function-name limits (64 chars). The match is case-insensitive
* because display-cased server names ("Acme") conventionally prefix their
* tools in lowercase. Ingestion that strips must record the original name
* (`serverToolName` on the cached definition) — tool calls send THAT name back
* to the server, never the stripped one. Catalog producers must not call this
* directly: only {@link stripServerNamePrefixes} sees the whole sibling set and
* can keep colliding results apart.
*/
function stripServerNamePrefix(toolName, normalizedServerName) {
	const prefixLength = normalizedServerName.length + 1;
	if (toolName.length <= prefixLength) return toolName;
	if (toolName.slice(0, prefixLength).toLowerCase() !== `${normalizedServerName.toLowerCase()}_`) return toolName;
	const stripped = toolName.slice(prefixLength);
	if (isReservedMCPToolName(stripped)) return toolName;
	/** `isActionTool` classifies keys by the RELATIVE position of `_action_`
	*  and `_mcp_`; stripping moves the first `_mcp_` earlier, so a server
	*  whose normalized name contains `_action_` could see a real MCP tool
	*  reclassified as an OpenAPI action (bypassing MCP authorization). Never
	*  produce a key whose classification differs from the raw key's. */
	const keySuffix = `_mcp_${normalizedServerName}`;
	if (isActionTool(`${stripped}${keySuffix}`) !== isActionTool(`${toolName}${keySuffix}`)) return toolName;
	return stripped;
}
/**
* Synthetic markers consumed by prefix (`isMCPAllPlaceholder`, the server-pin
* skip, the client's OAuth stream classification), so each reserves BOTH its
* exact name and its `${marker}${mcp_delimiter}` namespace: a stripped
* remainder inside any of them would turn a real upstream tool into the
* server-wide wildcard, the UI pin placeholder, or a synthetic OAuth call.
*/
const RESERVED_MCP_TOOL_MARKERS = [
	`sys__all__sys`,
	`sys__server__sys`,
	"oauth"
];
function isReservedMCPToolName(toolName) {
	/** `mcp_` opens the server-scoped pluginKey namespace (`mcp_${serverName}`),
	*  and `lc_transfer_to_` opens the agent-handoff namespace (the client
	*  renders such calls as handoffs; the background and intent passes exclude
	*  them) — pre-strip tool keys could never enter either, since they always
	*  began with the server name itself. */
	if (toolName.startsWith(`mcp_`) || toolName.startsWith(`lc_transfer_to_`)) return true;
	return RESERVED_MCP_TOOL_MARKERS.some((marker) => toolName === marker || toolName.startsWith(`${marker}_mcp_`));
}
/**
* Maps every raw tool name in a server's catalog to its model-facing name,
* stripping redundant server-name prefixes collision-free: when two names
* yield the same result — a bare `foo` next to `<server>_foo`, or the
* case-variant pair `<server>_Foo` / `<Server>_Foo` under the case-insensitive
* prefix match — every collider keeps its raw name, so two distinct upstream
* tools can never collapse onto one key. Unprefixed names count against the
* result set through their identity mapping, which is what makes the bare-name
* case fall out of the same counter.
*/
function stripServerNamePrefixes(toolNames, normalizedServerName) {
	const rawNames = new Set(toolNames);
	const finalNames = new Map(toolNames.map((name) => {
		const stripped = stripServerNamePrefix(name, normalizedServerName);
		/** Every sibling's RAW name is reserved even when that sibling itself
		*  strips away: keys persisted BEFORE stripping embed raw names, so a
		*  stripped result landing on another sibling's raw name would route
		*  that sibling's legacy references to the wrong upstream tool. */
		return [name, stripped !== name && rawNames.has(stripped) ? name : stripped];
	}));
	/** Reverting a collider to its raw name can itself collide with ANOTHER
	*  sibling's stripped result (`foo` / `acme_foo` / `acme_acme_foo`), so the
	*  guard iterates to a fixpoint. Each pass converts at least one stripped
	*  result back to its unique raw name, so it terminates within the catalog
	*  size. */
	let changed = true;
	while (changed) {
		changed = false;
		const counts = /* @__PURE__ */ new Map();
		finalNames.forEach((result) => {
			counts.set(result, (counts.get(result) ?? 0) + 1);
		});
		finalNames.forEach((result, raw) => {
			if (result !== raw && (counts.get(result) ?? 0) > 1) {
				finalNames.set(raw, raw);
				changed = true;
			}
		});
	}
	return finalNames;
}
function splitMCPToolKey(toolKey, knownServerNames) {
	if (knownServerNames?.length) {
		let matched;
		for (let i = 0; i < knownServerNames.length; i++) {
			const serverName = knownServerNames[i];
			if (!serverName || serverName.length <= (matched?.length ?? 0)) continue;
			if (toolKey.endsWith(`_mcp_${serverName}`)) matched = serverName;
		}
		if (matched != null) return [toolKey.slice(0, toolKey.length - matched.length - 5), matched];
	}
	const idx = toolKey.lastIndexOf("_mcp_");
	if (idx === -1) return [toolKey, void 0];
	return [toolKey.slice(0, idx), toolKey.slice(idx + 5)];
}
/**
* Splits a tool-call name for display, where the key may be a synthetic MCP OAuth
* call (`oauth${mcp_delimiter}${serverName}`) rather than a real tool key.
*
* A configured server name is authoritative when one matches, because a real tool key
* always ends in its server. Only when none matches does the `oauth` prefix decide,
* which keeps a genuine upstream tool named `oauth${mcp_delimiter}...` from being read
* as a synthetic call while still resolving OAuth prompts for unconfigured servers.
*/
function splitToolCallName(toolCallName, knownServerNames) {
	if (knownServerNames?.length) {
		const [toolName, serverName] = splitMCPToolKey(toolCallName, knownServerNames);
		if (serverName != null && knownServerNames.includes(serverName)) return [toolName, serverName];
	}
	const oauthPrefix = `oauth_mcp_`;
	if (toolCallName.startsWith(oauthPrefix)) return ["oauth", toolCallName.slice(oauthPrefix.length)];
	return splitMCPToolKey(toolCallName, knownServerNames);
}
/** Maximum explicit subagent hops allowed from any root agent at runtime. */
const MAX_SUBAGENT_DEPTH = 5;
/** Maximum unique explicit subagent targets that may be loaded at runtime. */
const MAX_SUBAGENT_GRAPH_NODES = 50;
/** Maximum expanded SubagentConfig entries embedded into one run request. */
const MAX_SUBAGENT_RUN_CONFIGS = 100;
let LocalStorageKeys = /* @__PURE__ */ function(LocalStorageKeys) {
	/** Key for the admin defined App Title */
	LocalStorageKeys["APP_TITLE"] = "appTitle";
	/** Key for the last conversation setup. */
	LocalStorageKeys["LAST_CONVO_SETUP"] = "lastConversationSetup";
	/** Key for the last selected model. */
	LocalStorageKeys["LAST_MODEL"] = "lastSelectedModel";
	/** Key for the last selected tools. */
	LocalStorageKeys["LAST_TOOLS"] = "lastSelectedTools";
	/** Key for the last selected spec by name*/
	LocalStorageKeys["LAST_SPEC"] = "lastSelectedSpec";
	/** Key for temporary files to delete */
	LocalStorageKeys["FILES_TO_DELETE"] = "filesToDelete";
	/** Prefix key for the last selected assistant ID by index */
	LocalStorageKeys["ASST_ID_PREFIX"] = "assistant_id__";
	/** Prefix key for the last selected agent ID by index */
	LocalStorageKeys["AGENT_ID_PREFIX"] = "agent_id__";
	/** Key for the last selected fork setting */
	LocalStorageKeys["FORK_SETTING"] = "forkSetting";
	/** Key for remembering the last selected option, instead of manually selecting */
	LocalStorageKeys["REMEMBER_FORK_OPTION"] = "rememberDefaultFork";
	/** Key for remembering the split at target fork option modifier */
	LocalStorageKeys["FORK_SPLIT_AT_TARGET"] = "splitAtTarget";
	/** Key for saving text drafts */
	LocalStorageKeys["TEXT_DRAFT"] = "textDraft_";
	/** Key for saving file drafts */
	LocalStorageKeys["FILES_DRAFT"] = "filesDraft_";
	/** Key for last Selected Prompt Category */
	LocalStorageKeys["LAST_PROMPT_CATEGORY"] = "lastPromptCategory";
	/** Key for rendering User Messages as Markdown */
	LocalStorageKeys["ENABLE_USER_MSG_MARKDOWN"] = "enableUserMsgMarkdown";
	/** Key for auto-expanding tool call details */
	LocalStorageKeys["AUTO_EXPAND_TOOLS"] = "autoExpandTools";
	/** Last selected MCP values per conversation ID */
	LocalStorageKeys["LAST_MCP_"] = "LAST_MCP_";
	/** Last checked toggle for Code Interpreter API per conversation ID */
	LocalStorageKeys["LAST_CODE_TOGGLE_"] = "LAST_CODE_TOGGLE_";
	/** Last checked toggle for Web Search per conversation ID */
	LocalStorageKeys["LAST_WEB_SEARCH_TOGGLE_"] = "LAST_WEB_SEARCH_TOGGLE_";
	/** Last checked toggle for File Search per conversation ID */
	LocalStorageKeys["LAST_FILE_SEARCH_TOGGLE_"] = "LAST_FILE_SEARCH_TOGGLE_";
	/** Last checked toggle for Artifacts per conversation ID */
	LocalStorageKeys["LAST_ARTIFACTS_TOGGLE_"] = "LAST_ARTIFACTS_TOGGLE_";
	/** Last checked toggle for Skills per conversation ID */
	LocalStorageKeys["LAST_SKILLS_TOGGLE_"] = "LAST_SKILLS_TOGGLE_";
	/** Last checked toggle for Memory per conversation ID */
	LocalStorageKeys["LAST_MEMORY_TOGGLE_"] = "LAST_MEMORY_TOGGLE_";
	/** Key for the last selected agent provider */
	LocalStorageKeys["LAST_AGENT_PROVIDER"] = "lastAgentProvider";
	/** Key for the last selected agent model */
	LocalStorageKeys["LAST_AGENT_MODEL"] = "lastAgentModel";
	/** Pin state for MCP tools per conversation ID */
	LocalStorageKeys["PIN_MCP_"] = "PIN_MCP_";
	/** Pin state for Web Search per conversation ID */
	LocalStorageKeys["PIN_WEB_SEARCH_"] = "PIN_WEB_SEARCH_";
	/** Pin state for Code Interpreter per conversation ID */
	LocalStorageKeys["PIN_CODE_INTERPRETER_"] = "PIN_CODE_INTERPRETER_";
	/** Key for the last selected code approval mode */
	LocalStorageKeys["LAST_CODE_APPROVAL_MODE"] = "lastCodeApprovalMode";
	return LocalStorageKeys;
}({});
let ForkOptions = /* @__PURE__ */ function(ForkOptions) {
	/** Key for direct path option */
	ForkOptions["DIRECT_PATH"] = "directPath";
	/** Key for including branches */
	ForkOptions["INCLUDE_BRANCHES"] = "includeBranches";
	/** Key for target level fork (default) */
	ForkOptions["TARGET_LEVEL"] = "targetLevel";
	/** Default option */
	ForkOptions["DEFAULT"] = "default";
	return ForkOptions;
}({});
/**
* Enum for Cohere related constants
*/
let CohereConstants = /* @__PURE__ */ function(CohereConstants) {
	/**
	* Cohere API Endpoint, for special handling
	*/
	CohereConstants["API_URL"] = "https://api.cohere.ai/v1";
	/**
	* Role for "USER" messages
	*/
	CohereConstants["ROLE_USER"] = "USER";
	/**
	* Role for "SYSTEM" messages
	*/
	CohereConstants["ROLE_SYSTEM"] = "SYSTEM";
	/**
	* Role for "CHATBOT" messages
	*/
	CohereConstants["ROLE_CHATBOT"] = "CHATBOT";
	/**
	* Title message as required by Cohere
	*/
	CohereConstants["TITLE_MESSAGE"] = "TITLE:";
	return CohereConstants;
}({});
let SystemCategories = /* @__PURE__ */ function(SystemCategories) {
	SystemCategories["ALL"] = "sys__all__sys";
	SystemCategories["MY_PROMPTS"] = "sys__my__prompts__sys";
	SystemCategories["NO_CATEGORY"] = "sys__no__category__sys";
	SystemCategories["SHARED_PROMPTS"] = "sys__shared__prompts__sys";
	return SystemCategories;
}({});
const providerEndpointMap = {
	["openAI"]: "openAI",
	["bedrock"]: "bedrock",
	["anthropic"]: "anthropic",
	["azureOpenAI"]: "azureOpenAI"
};
const specialVariables = {
	current_date: true,
	current_user: true,
	iso_datetime: true,
	current_datetime: true
};
/**
* Retrieves a specific field from the endpoints configuration for a given endpoint key.
* Does not infer or default any endpoint type when absent.
*/
function getEndpointField(endpointsConfig, endpoint, property) {
	if (!endpointsConfig || endpoint === null || endpoint === void 0) return;
	const config = endpointsConfig[endpoint];
	if (!config) return;
	return config[property];
}
/**
* Resolves the effective endpoint type:
* - Non-agents endpoint: config.type || endpoint
* - Agents + provider: config[provider].type || provider
* - Agents, no provider: EModelEndpoint.agents
*
* Returns `undefined` when endpoint is null/undefined.
*/
function resolveEndpointType(endpointsConfig, endpoint, agentProvider) {
	if (!endpoint) return;
	if (!isAgentsEndpoint(endpoint)) return getEndpointField(endpointsConfig, endpoint, "type") || endpoint;
	if (agentProvider) {
		const providerType = getEndpointField(endpointsConfig, agentProvider, "type");
		if (providerType) return providerType;
		return agentProvider;
	}
	return "agents";
}
/** Resolves the `defaultParamsEndpoint` for a given endpoint from its custom params config */
function getDefaultParamsEndpoint(endpointsConfig, endpoint) {
	if (!endpointsConfig || !endpoint) return;
	return endpointsConfig[endpoint]?.customParams?.defaultParamsEndpoint;
}
//#endregion
//#region src/types/assistants.ts
let RunStatus = /* @__PURE__ */ function(RunStatus) {
	RunStatus["QUEUED"] = "queued";
	RunStatus["IN_PROGRESS"] = "in_progress";
	RunStatus["REQUIRES_ACTION"] = "requires_action";
	RunStatus["CANCELLING"] = "cancelling";
	RunStatus["CANCELLED"] = "cancelled";
	RunStatus["FAILED"] = "failed";
	RunStatus["COMPLETED"] = "completed";
	RunStatus["EXPIRED"] = "expired";
	return RunStatus;
}({});
let FilePurpose = /* @__PURE__ */ function(FilePurpose) {
	FilePurpose["Vision"] = "vision";
	FilePurpose["FineTune"] = "fine-tune";
	FilePurpose["FineTuneResults"] = "fine-tune-results";
	FilePurpose["Assistants"] = "assistants";
	FilePurpose["AssistantsOutput"] = "assistants_output";
	return FilePurpose;
}({});
const defaultOrderQuery = {
	order: "desc",
	limit: 100
};
let AssistantStreamEvents = /* @__PURE__ */ function(AssistantStreamEvents) {
	AssistantStreamEvents["ThreadCreated"] = "thread.created";
	AssistantStreamEvents["ThreadRunCreated"] = "thread.run.created";
	AssistantStreamEvents["ThreadRunQueued"] = "thread.run.queued";
	AssistantStreamEvents["ThreadRunInProgress"] = "thread.run.in_progress";
	AssistantStreamEvents["ThreadRunRequiresAction"] = "thread.run.requires_action";
	AssistantStreamEvents["ThreadRunCompleted"] = "thread.run.completed";
	AssistantStreamEvents["ThreadRunFailed"] = "thread.run.failed";
	AssistantStreamEvents["ThreadRunCancelling"] = "thread.run.cancelling";
	AssistantStreamEvents["ThreadRunCancelled"] = "thread.run.cancelled";
	AssistantStreamEvents["ThreadRunExpired"] = "thread.run.expired";
	AssistantStreamEvents["ThreadRunStepCreated"] = "thread.run.step.created";
	AssistantStreamEvents["ThreadRunStepInProgress"] = "thread.run.step.in_progress";
	AssistantStreamEvents["ThreadRunStepCompleted"] = "thread.run.step.completed";
	AssistantStreamEvents["ThreadRunStepFailed"] = "thread.run.step.failed";
	AssistantStreamEvents["ThreadRunStepCancelled"] = "thread.run.step.cancelled";
	AssistantStreamEvents["ThreadRunStepExpired"] = "thread.run.step.expired";
	AssistantStreamEvents["ThreadRunStepDelta"] = "thread.run.step.delta";
	AssistantStreamEvents["ThreadMessageCreated"] = "thread.message.created";
	AssistantStreamEvents["ThreadMessageInProgress"] = "thread.message.in_progress";
	AssistantStreamEvents["ThreadMessageCompleted"] = "thread.message.completed";
	AssistantStreamEvents["ThreadMessageIncomplete"] = "thread.message.incomplete";
	AssistantStreamEvents["ThreadMessageDelta"] = "thread.message.delta";
	AssistantStreamEvents["ErrorEvent"] = "error";
	return AssistantStreamEvents;
}({});
//#endregion
//#region src/accessPermissions.ts
/**
* Granular Permission System Types for Agent Sharing
*
* This file contains TypeScript interfaces and Zod schemas for the enhanced
* agent permission system that supports sharing with specific users/groups
* and Entra ID integration.
*/
/**
* Principal types for permission system
*/
let PrincipalType = /* @__PURE__ */ function(PrincipalType) {
	PrincipalType["USER"] = "user";
	PrincipalType["GROUP"] = "group";
	PrincipalType["PUBLIC"] = "public";
	PrincipalType["ROLE"] = "role";
	return PrincipalType;
}({});
/**
* Principal model types for MongoDB references
*/
let PrincipalModel = /* @__PURE__ */ function(PrincipalModel) {
	PrincipalModel["USER"] = "User";
	PrincipalModel["GROUP"] = "Group";
	PrincipalModel["ROLE"] = "Role";
	return PrincipalModel;
}({});
/**
* Resource types for permission system
*/
let ResourceType = /* @__PURE__ */ function(ResourceType) {
	ResourceType["AGENT"] = "agent";
	ResourceType["CODE_ENVIRONMENT"] = "codeEnvironment";
	ResourceType["PROMPTGROUP"] = "promptGroup";
	ResourceType["MCPSERVER"] = "mcpServer";
	ResourceType["REMOTE_AGENT"] = "remoteAgent";
	ResourceType["SKILL"] = "skill";
	ResourceType["SHARED_LINK"] = "sharedLink";
	return ResourceType;
}({});
/**
* Permission bit constants for bitwise operations
*/
let PermissionBits = /* @__PURE__ */ function(PermissionBits) {
	/** 001 - Can view and use agent */
	PermissionBits[PermissionBits["VIEW"] = 1] = "VIEW";
	/**  010 - Can modify agent settings */
	PermissionBits[PermissionBits["EDIT"] = 2] = "EDIT";
	/**  100 - Can delete agent */
	PermissionBits[PermissionBits["DELETE"] = 4] = "DELETE";
	/**  1000 - Can share agent with others (future) */
	PermissionBits[PermissionBits["SHARE"] = 8] = "SHARE";
	/** 10000 - Can view Insights data for an agent when VIEW is also present */
	PermissionBits[PermissionBits["VIEW_INSIGHTS"] = 16] = "VIEW_INSIGHTS";
	return PermissionBits;
}({});
/**
* Standard access role IDs
*/
let AccessRoleIds = /* @__PURE__ */ function(AccessRoleIds) {
	AccessRoleIds["AGENT_VIEWER"] = "agent_viewer";
	AccessRoleIds["AGENT_EDITOR"] = "agent_editor";
	AccessRoleIds["AGENT_OWNER"] = "agent_owner";
	AccessRoleIds["CODE_ENVIRONMENT_VIEWER"] = "codeEnvironment_viewer";
	AccessRoleIds["CODE_ENVIRONMENT_EDITOR"] = "codeEnvironment_editor";
	AccessRoleIds["CODE_ENVIRONMENT_OWNER"] = "codeEnvironment_owner";
	AccessRoleIds["PROMPTGROUP_VIEWER"] = "promptGroup_viewer";
	AccessRoleIds["PROMPTGROUP_EDITOR"] = "promptGroup_editor";
	AccessRoleIds["PROMPTGROUP_OWNER"] = "promptGroup_owner";
	AccessRoleIds["MCPSERVER_VIEWER"] = "mcpServer_viewer";
	AccessRoleIds["MCPSERVER_EDITOR"] = "mcpServer_editor";
	AccessRoleIds["MCPSERVER_OWNER"] = "mcpServer_owner";
	AccessRoleIds["REMOTE_AGENT_VIEWER"] = "remoteAgent_viewer";
	AccessRoleIds["REMOTE_AGENT_EDITOR"] = "remoteAgent_editor";
	AccessRoleIds["REMOTE_AGENT_OWNER"] = "remoteAgent_owner";
	AccessRoleIds["SKILL_VIEWER"] = "skill_viewer";
	AccessRoleIds["SKILL_EDITOR"] = "skill_editor";
	AccessRoleIds["SKILL_OWNER"] = "skill_owner";
	AccessRoleIds["SHARED_LINK_VIEWER"] = "sharedLink_viewer";
	AccessRoleIds["SHARED_LINK_OWNER"] = "sharedLink_owner";
	return AccessRoleIds;
}({});
/**
* Principal schema - represents a user, group, role, or public access
*/
const principalSchema = zod.z.object({
	type: zod.z.nativeEnum(PrincipalType),
	id: zod.z.string().optional(),
	name: zod.z.string().optional(),
	email: zod.z.string().optional(),
	source: zod.z.enum(["local", "entra"]).optional(),
	avatar: zod.z.string().optional(),
	description: zod.z.string().optional(),
	idOnTheSource: zod.z.string().optional(),
	accessRoleId: zod.z.nativeEnum(AccessRoleIds).optional(),
	viewInsights: zod.z.boolean().optional(),
	isAdmin: zod.z.boolean().optional(),
	memberCount: zod.z.number().optional()
});
/**
* Access role schema - defines named permission sets
*/
const accessRoleSchema = zod.z.object({
	accessRoleId: zod.z.nativeEnum(AccessRoleIds),
	name: zod.z.string(),
	description: zod.z.string().optional(),
	resourceType: zod.z.nativeEnum(ResourceType).default("agent"),
	permBits: zod.z.number()
});
/**
* Permission entry schema - represents a single ACL entry
*/
const permissionEntrySchema = zod.z.object({
	id: zod.z.string(),
	principalType: zod.z.nativeEnum(PrincipalType),
	principalId: zod.z.string().optional(),
	principalName: zod.z.string().optional(),
	role: accessRoleSchema,
	grantedBy: zod.z.string(),
	grantedAt: zod.z.string(),
	inheritedFrom: zod.z.string().optional(),
	source: zod.z.enum(["local", "entra"]).optional()
});
/**
* Resource permissions response schema
*/
const resourcePermissionsResponseSchema = zod.z.object({
	resourceType: zod.z.nativeEnum(ResourceType),
	resourceId: zod.z.string(),
	permissions: zod.z.array(permissionEntrySchema)
});
/**
* Update resource permissions request schema
* This matches the user's requirement for the frontend DTO structure
*/
const updateResourcePermissionsRequestSchema = zod.z.object({
	updated: principalSchema.array(),
	removed: principalSchema.array(),
	public: zod.z.boolean().optional(),
	publicAccessRoleId: zod.z.string().optional()
});
/**
* Update resource permissions response schema
* Returns the updated permissions with accessRoleId included
*/
const updateResourcePermissionsResponseSchema = zod.z.object({
	message: zod.z.string(),
	results: zod.z.object({
		principals: principalSchema.array(),
		public: zod.z.boolean().optional(),
		publicAccessRoleId: zod.z.string().optional()
	})
});
/**
* Get resource permissions response schema
* This matches the enhanced aggregation-based endpoint response format
*/
const getResourcePermissionsResponseSchema = zod.z.object({
	resourceType: zod.z.nativeEnum(ResourceType),
	resourceId: zod.z.nativeEnum(AccessRoleIds),
	principals: zod.z.array(principalSchema),
	public: zod.z.boolean(),
	publicAccessRoleId: zod.z.nativeEnum(AccessRoleIds).optional()
});
/**
* Effective permissions response schema
* Returns just the permission bitmask for a user on a resource
*/
const effectivePermissionsResponseSchema = zod.z.object({ permissionBits: zod.z.number() });
/**
* Convert permission bits to access level
*/
function permBitsToAccessLevel(permBits) {
	if ((permBits & 4) > 0) return "owner";
	if ((permBits & 2) > 0) return "editor";
	if ((permBits & 1) > 0) return "viewer";
	return "none";
}
/**
* Convert access role ID to permission bits
*/
function accessRoleToPermBits(accessRoleId) {
	switch (accessRoleId) {
		case "agent_viewer":
		case "codeEnvironment_viewer":
		case "promptGroup_viewer":
		case "mcpServer_viewer":
		case "remoteAgent_viewer":
		case "skill_viewer":
		case "sharedLink_viewer": return 1;
		case "agent_editor":
		case "codeEnvironment_editor":
		case "promptGroup_editor":
		case "mcpServer_editor":
		case "remoteAgent_editor":
		case "skill_editor": return 3;
		case "agent_owner":
		case "codeEnvironment_owner":
		case "promptGroup_owner":
		case "mcpServer_owner":
		case "remoteAgent_owner":
		case "skill_owner":
		case "sharedLink_owner": return 15;
		default: return 1;
	}
}
/**
* Check if permission bitmask contains other bitmask
* @param permissions - The permission bitmask to check
* @param requiredPermission - The required permission bit(s)
* @returns {boolean} Whether permissions contains requiredPermission
*/
function hasPermissions(permissions, requiredPermission) {
	return (permissions & requiredPermission) === requiredPermission;
}
//#endregion
//#region src/keys.ts
let QueryKeys = /* @__PURE__ */ function(QueryKeys) {
	QueryKeys["messages"] = "messages";
	QueryKeys["sharedMessages"] = "sharedMessages";
	QueryKeys["sharedStartupConfig"] = "sharedStartupConfig";
	QueryKeys["sharedLinks"] = "sharedLinks";
	QueryKeys["allConversations"] = "allConversations";
	QueryKeys["archivedConversations"] = "archivedConversations";
	QueryKeys["pinnedConversations"] = "pinnedConversations";
	QueryKeys["searchConversations"] = "searchConversations";
	QueryKeys["conversation"] = "conversation";
	QueryKeys["searchEnabled"] = "searchEnabled";
	QueryKeys["langfuseConnection"] = "langfuseConnection";
	QueryKeys["langfuseSessionLink"] = "langfuseSessionLink";
	QueryKeys["conversationTraceAvailability"] = "conversationTraceAvailability";
	QueryKeys["conversationTraceRecords"] = "conversationTraceRecords";
	QueryKeys["conversationTraceRecord"] = "conversationTraceRecord";
	QueryKeys["user"] = "user";
	QueryKeys["name"] = "name";
	QueryKeys["models"] = "models";
	QueryKeys["balance"] = "balance";
	QueryKeys["endpoints"] = "endpoints";
	QueryKeys["tokenConfig"] = "tokenConfig";
	QueryKeys["presets"] = "presets";
	QueryKeys["searchResults"] = "searchResults";
	QueryKeys["tokenCount"] = "tokenCount";
	QueryKeys["availablePlugins"] = "availablePlugins";
	QueryKeys["startupConfig"] = "startupConfig";
	QueryKeys["insights"] = "insights";
	QueryKeys["insightsAccess"] = "insightsAccess";
	QueryKeys["assistants"] = "assistants";
	QueryKeys["assistant"] = "assistant";
	QueryKeys["agents"] = "agents";
	QueryKeys["agent"] = "agent";
	QueryKeys["files"] = "files";
	QueryKeys["fileConfig"] = "fileConfig";
	QueryKeys["tools"] = "tools";
	QueryKeys["toolAuth"] = "toolAuth";
	QueryKeys["toolCalls"] = "toolCalls";
	QueryKeys["mcpTools"] = "mcpTools";
	QueryKeys["mcpConnectionStatus"] = "mcpConnectionStatus";
	QueryKeys["mcpAuthValues"] = "mcpAuthValues";
	QueryKeys["agentTools"] = "agentTools";
	QueryKeys["actions"] = "actions";
	QueryKeys["assistantDocs"] = "assistantDocs";
	QueryKeys["agentDocs"] = "agentDocs";
	QueryKeys["fileDownload"] = "fileDownload";
	QueryKeys["filePreview"] = "filePreview";
	QueryKeys["voices"] = "voices";
	QueryKeys["customConfigSpeech"] = "customConfigSpeech";
	QueryKeys["prompts"] = "prompts";
	QueryKeys["prompt"] = "prompt";
	QueryKeys["promptGroups"] = "promptGroups";
	QueryKeys["allPromptGroups"] = "allPromptGroups";
	QueryKeys["promptGroup"] = "promptGroup";
	QueryKeys["projects"] = "projects";
	QueryKeys["project"] = "project";
	QueryKeys["projectConversations"] = "projectConversations";
	QueryKeys["categories"] = "categories";
	QueryKeys["randomPrompts"] = "randomPrompts";
	QueryKeys["agentCategories"] = "agentCategories";
	QueryKeys["marketplaceAgents"] = "marketplaceAgents";
	QueryKeys["roles"] = "roles";
	QueryKeys["rolesList"] = "rolesList";
	QueryKeys["conversationTags"] = "conversationTags";
	QueryKeys["health"] = "health";
	QueryKeys["userTerms"] = "userTerms";
	QueryKeys["banner"] = "banner";
	QueryKeys["memories"] = "memories";
	QueryKeys["principalSearch"] = "principalSearch";
	QueryKeys["accessRoles"] = "accessRoles";
	QueryKeys["resourcePermissions"] = "resourcePermissions";
	QueryKeys["effectivePermissions"] = "effectivePermissions";
	QueryKeys["graphToken"] = "graphToken";
	QueryKeys["mcpServers"] = "mcpServers";
	QueryKeys["mcpServer"] = "mcpServer";
	QueryKeys["activeJobs"] = "activeJobs";
	QueryKeys["agentApiKeys"] = "agentApiKeys";
	QueryKeys["skills"] = "skills";
	QueryKeys["skill"] = "skill";
	QueryKeys["skillFiles"] = "skillFiles";
	QueryKeys["skillFileContent"] = "skillFileContent";
	QueryKeys["skillTree"] = "skillTree";
	QueryKeys["skillNodeContent"] = "skillNodeContent";
	QueryKeys["toolFavorites"] = "toolFavorites";
	QueryKeys["skillStates"] = "skillStates";
	QueryKeys["favorites"] = "favorites";
	QueryKeys["schedules"] = "schedules";
	QueryKeys["schedule"] = "schedule";
	QueryKeys["parentSubagents"] = "parentSubagents";
	QueryKeys["subagentThread"] = "subagentThread";
	QueryKeys["codeEnvironments"] = "codeEnvironments";
	QueryKeys["agentQueuedTurns"] = "agentQueuedTurns";
	QueryKeys["pinnedOrder"] = "pinnedOrder";
	return QueryKeys;
}({});
const DynamicQueryKeys = {
	agentFiles: (agentId) => ["agentFiles", agentId],
	codeEnvironmentStatus: (id) => [
		"codeEnvironments",
		id,
		"status"
	]
};
let MutationKeys = /* @__PURE__ */ function(MutationKeys) {
	MutationKeys["subagentControl"] = "subagentControl";
	MutationKeys["enqueueAgentQueuedTurn"] = "enqueueAgentQueuedTurn";
	MutationKeys["cancelAgentQueuedTurn"] = "cancelAgentQueuedTurn";
	/** Whole-array favorites write, keyed so every hook instance's write is
	*  visible to the others through the query client. */
	MutationKeys["updateFavorites"] = "updateFavorites";
	/** Pinned-section display order write, keyed for the same reason. */
	MutationKeys["updatePinnedOrder"] = "updatePinnedOrder";
	MutationKeys["updateLangfuseConnection"] = "updateLangfuseConnection";
	MutationKeys["testLangfuseConnection"] = "testLangfuseConnection";
	MutationKeys["createAgentApiKey"] = "createAgentApiKey";
	MutationKeys["deleteAgentApiKey"] = "deleteAgentApiKey";
	MutationKeys["fileUpload"] = "fileUpload";
	MutationKeys["fileDelete"] = "fileDelete";
	MutationKeys["fileUsage"] = "fileUsage";
	MutationKeys["updatePreset"] = "updatePreset";
	MutationKeys["deletePreset"] = "deletePreset";
	MutationKeys["loginUser"] = "loginUser";
	MutationKeys["logoutUser"] = "logoutUser";
	MutationKeys["refreshToken"] = "refreshToken";
	MutationKeys["avatarUpload"] = "avatarUpload";
	MutationKeys["speechToText"] = "speechToText";
	MutationKeys["textToSpeech"] = "textToSpeech";
	MutationKeys["assistantAvatarUpload"] = "assistantAvatarUpload";
	MutationKeys["agentAvatarUpload"] = "agentAvatarUpload";
	MutationKeys["updateAction"] = "updateAction";
	MutationKeys["updateAgentAction"] = "updateAgentAction";
	MutationKeys["deleteAction"] = "deleteAction";
	MutationKeys["deleteAgentAction"] = "deleteAgentAction";
	MutationKeys["revertAgentVersion"] = "revertAgentVersion";
	MutationKeys["deleteUser"] = "deleteUser";
	MutationKeys["updateUserPreferences"] = "updateUserPreferences";
	MutationKeys["updateRole"] = "updateRole";
	MutationKeys["enableTwoFactor"] = "enableTwoFactor";
	MutationKeys["verifyTwoFactor"] = "verifyTwoFactor";
	MutationKeys["updateMemoryPreferences"] = "updateMemoryPreferences";
	MutationKeys["createProject"] = "createProject";
	MutationKeys["updateProject"] = "updateProject";
	MutationKeys["deleteProject"] = "deleteProject";
	MutationKeys["assignConversationToProject"] = "assignConversationToProject";
	MutationKeys["createSkillNode"] = "createSkillNode";
	MutationKeys["updateSkillNode"] = "updateSkillNode";
	MutationKeys["deleteSkillNode"] = "deleteSkillNode";
	MutationKeys["updateSkillNodeContent"] = "updateSkillNodeContent";
	MutationKeys["convoPin"] = "convoPin";
	MutationKeys["archiveAllConversations"] = "archiveAllConversations";
	MutationKeys["createSchedule"] = "createSchedule";
	MutationKeys["updateSchedule"] = "updateSchedule";
	MutationKeys["deleteSchedule"] = "deleteSchedule";
	MutationKeys["runSchedule"] = "runSchedule";
	MutationKeys["pairCodeEnvironment"] = "pairCodeEnvironment";
	MutationKeys["updateCodeEnvironmentSettings"] = "updateCodeEnvironmentSettings";
	MutationKeys["deleteCodeEnvironment"] = "deleteCodeEnvironment";
	MutationKeys["moveConversationCodeEnvironment"] = "moveConversationCodeEnvironment";
	return MutationKeys;
}({});
//#endregion
//#region src/headers-helpers.ts
function setAcceptLanguageHeader(value) {
	axios.default.defaults.headers.common["Accept-Language"] = value;
}
function setTokenHeader(token) {
	if (token === void 0) delete axios.default.defaults.headers.common["Authorization"];
	else axios.default.defaults.headers.common["Authorization"] = "Bearer " + token;
}
function getTokenHeader() {
	const authorization = axios.default.defaults.headers.common["Authorization"];
	return typeof authorization === "string" ? authorization : void 0;
}
//#endregion
//#region src/request.ts
async function _get(url, options) {
	return (await axios.default.get(url, { ...options })).data;
}
async function _getResponse(url, options) {
	return await axios.default.get(url, { ...options });
}
async function _post(url, data) {
	return (await axios.default.post(url, JSON.stringify(data), { headers: { "Content-Type": "application/json" } })).data;
}
async function _postMultiPart(url, formData, options) {
	return (await axios.default.post(url, formData, {
		...options,
		headers: { "Content-Type": "multipart/form-data" }
	})).data;
}
async function _postTTS(url, formData, options) {
	return (await axios.default.post(url, formData, {
		...options,
		headers: { "Content-Type": "multipart/form-data" },
		responseType: "arraybuffer"
	})).data;
}
async function _put(url, data) {
	return (await axios.default.put(url, JSON.stringify(data), { headers: { "Content-Type": "application/json" } })).data;
}
async function _delete(url) {
	return (await axios.default.delete(url)).data;
}
async function _deleteWithOptions(url, options) {
	return (await axios.default.delete(url, { ...options })).data;
}
async function _patch(url, data) {
	return (await axios.default.patch(url, JSON.stringify(data), { headers: { "Content-Type": "application/json" } })).data;
}
const AUTH_RECOVERY_EVENT = "authRecovery";
const AUTH_REDIRECT_EVENT = "authRedirectStarted";
const AUTH_REDIRECT_STORAGE_KEY = "librechat.auth.redirect.startedAt";
const AUTH_REDIRECT_DEDUPE_MS = 15e3;
const TOKEN_REFRESH_BUFFER_MS = 120 * 1e3;
const refreshToken = (retry) => _post(refreshToken$1(retry));
const SHARE_PAGE_PATH_REGEX = /^\/share\/[^/]+\/?$/;
const SHARED_MESSAGES_PATH_REGEX = /^\/api\/share\/[^/]+$/;
const SHARE_FORK_PATH_REGEX = /^\/api\/share\/[^/]+\/fork$/;
const normalizePathname = (pathname) => pathname.startsWith("/") ? pathname : `/${pathname}`;
const stripBasePath = (pathname) => {
	const normalizedPathname = normalizePathname(pathname);
	const baseUrl = apiBaseUrl();
	if (!baseUrl) return normalizedPathname;
	const normalizedBaseUrl = normalizePathname(baseUrl);
	if (normalizedPathname === normalizedBaseUrl || normalizedPathname.startsWith(`${normalizedBaseUrl}/`)) return normalizedPathname.slice(normalizedBaseUrl.length) || "/";
	return normalizedPathname;
};
const isSharePage = () => SHARE_PAGE_PATH_REGEX.test(stripBasePath(window.location.pathname));
const getRequestPathname = (url) => {
	if (typeof url !== "string") return "";
	try {
		return new URL(url, window.location.origin).pathname;
	} catch {
		return url.split(/[?#]/)[0] ?? "";
	}
};
const isSharedMessagesRequest = (url, method) => method?.toLowerCase() === "get" && SHARED_MESSAGES_PATH_REGEX.test(stripBasePath(getRequestPathname(url)));
/** The "continue this chat" fork is a deliberate authenticated action initiated
*  from a share page, so it must reach auth recovery/redirect like the shared
*  data request — otherwise a logged-out (or cold-loaded) viewer's 401 is
*  rejected silently instead of routing them through login. */
const isShareForkRequest = (url, method) => method?.toLowerCase() === "post" && SHARE_FORK_PATH_REGEX.test(stripBasePath(getRequestPathname(url)));
const dispatchTokenUpdatedEvent = (token) => {
	setTokenHeader(token);
	clearAuthRedirectStartedAt();
	window.dispatchEvent(new CustomEvent("tokenUpdated", { detail: token }));
};
const getAuthRecoveryState = () => {
	const browserWindow = window;
	browserWindow.__librechatAuthRecovery ??= {
		lastRedirectStartedAt: 0,
		refreshPromise: null
	};
	return browserWindow.__librechatAuthRecovery;
};
const getAuthRedirectStartedAt = () => {
	const state = getAuthRecoveryState();
	try {
		const startedAt = window.localStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
		const storedStartedAt = startedAt != null ? Number(startedAt) : 0;
		return Math.max(Number.isFinite(storedStartedAt) ? storedStartedAt : 0, state.lastRedirectStartedAt);
	} catch {
		return state.lastRedirectStartedAt;
	}
};
const setAuthRedirectStartedAt = () => {
	const state = getAuthRecoveryState();
	state.lastRedirectStartedAt = Date.now();
	try {
		window.localStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, String(state.lastRedirectStartedAt));
	} catch {}
};
const clearAuthRedirectStartedAt = () => {
	const state = getAuthRecoveryState();
	state.lastRedirectStartedAt = 0;
	try {
		window.localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
	} catch {}
};
const isAuthRedirectInProgress = () => {
	const startedAt = getAuthRedirectStartedAt();
	return Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < AUTH_REDIRECT_DEDUPE_MS;
};
const dispatchAuthRecoveryEvent = (state) => {
	window.dispatchEvent(new CustomEvent(AUTH_RECOVERY_EVENT, { detail: { state } }));
};
const setRequestAuthorizationHeader = (config, token) => {
	const headers = config.headers ?? {};
	headers["Authorization"] = `Bearer ${token}`;
	config.headers = headers;
};
const isAuthRecoveryEndpoint = (url) => url?.includes("/api/auth/2fa") === true || url?.includes("/api/auth/logout") === true || url?.includes("/api/auth/refresh") === true;
const startAuthRecovery = (retryRefresh) => {
	const state = getAuthRecoveryState();
	if (state.refreshPromise) return state.refreshPromise;
	dispatchAuthRecoveryEvent("started");
	state.refreshPromise = refreshToken(retryRefresh).then((response) => {
		const token = response?.token ?? "";
		if (!token) return null;
		dispatchTokenUpdatedEvent(token);
		return token;
	}).finally(() => {
		state.refreshPromise = null;
		dispatchAuthRecoveryEvent("finished");
	});
	return state.refreshPromise;
};
const redirectToLoginOnce = () => {
	if (isAuthRedirectInProgress()) return;
	const href = apiBaseUrl() + buildLoginRedirectUrl();
	setAuthRedirectStartedAt();
	window.dispatchEvent(new CustomEvent(AUTH_REDIRECT_EVENT, { detail: { href } }));
	window.location.href = href;
};
const getBearerToken = () => {
	const authorization = axios.default.defaults.headers.common["Authorization"];
	if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return null;
	return authorization.slice(7);
};
const getJwtExpiryMs = (token) => {
	const payload = token.split(".")[1];
	if (!payload) return null;
	try {
		const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
		const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + (4 - normalizedPayload.length % 4) % 4, "=");
		const decodedPayload = JSON.parse(window.atob(paddedPayload));
		return typeof decodedPayload.exp === "number" ? decodedPayload.exp * 1e3 : null;
	} catch {
		return null;
	}
};
const shouldRefreshBeforeRequest = (url) => {
	if (isAuthRecoveryEndpoint(url) || isAuthRedirectInProgress()) return false;
	const token = getBearerToken();
	if (!token) return false;
	const expiresAt = getJwtExpiryMs(token);
	if (expiresAt == null) return false;
	const timeUntilExpiry = expiresAt - Date.now();
	return timeUntilExpiry > 0 && timeUntilExpiry <= TOKEN_REFRESH_BUFFER_MS;
};
const refreshBeforeRequest = async (url) => {
	const state = getAuthRecoveryState();
	if (state.refreshPromise && !isAuthRecoveryEndpoint(url)) return state.refreshPromise.catch(() => null);
	if (!shouldRefreshBeforeRequest(url)) return null;
	return startAuthRecovery(false).catch(() => null);
};
const withAuthorization = (options, token) => {
	const headers = new Headers(options?.headers);
	if (token) headers.set("Authorization", `Bearer ${token}`);
	return {
		...options,
		headers
	};
};
async function _authenticatedFetch(url, options) {
	if (typeof window === "undefined") return fetch(url, options);
	const token = await refreshBeforeRequest(url) ?? getBearerToken();
	const response = await fetch(url, withAuthorization(options, token));
	if (response.status !== 401 || isAuthRecoveryEndpoint(url) || isAuthRedirectInProgress() || !getBearerToken()) return response;
	let refreshedToken;
	try {
		refreshedToken = await startAuthRecovery(false);
	} catch {
		redirectToLoginOnce();
		return response;
	}
	if (!refreshedToken) {
		redirectToLoginOnce();
		return response;
	}
	await response.body?.cancel().catch(() => void 0);
	return fetch(url, withAuthorization(options, refreshedToken));
}
if (typeof window !== "undefined") {
	axios.default.interceptors.request.use(async (config) => {
		const token = await refreshBeforeRequest(config.url);
		if (token) setRequestAuthorizationHeader(config, token);
		return config;
	});
	axios.default.interceptors.response.use((response) => response, async (error) => {
		const originalRequest = error.config;
		if (!error.response) return Promise.reject(error);
		if (!originalRequest) return Promise.reject(error);
		const isRefreshRequest = originalRequest.url?.includes("/api/auth/refresh") === true;
		if (isAuthRecoveryEndpoint(originalRequest.url) && !isRefreshRequest) return Promise.reject(error);
		if (isRefreshRequest && getAuthRecoveryState().refreshPromise) return Promise.reject(error);
		/** Skip refresh when the Authorization header has been cleared (e.g. during logout),
		*  but allow the shared link data request to proceed so private shares can still
		*  recover auth/redirect without unrelated share-page queries forcing login. */
		if (!axios.default.defaults.headers.common["Authorization"] && !(isSharePage() && (isSharedMessagesRequest(originalRequest.url, originalRequest.method) || isShareForkRequest(originalRequest.url, originalRequest.method)))) return Promise.reject(error);
		if (isAuthRedirectInProgress()) return Promise.reject(error);
		if (error.response.status === 401 && !originalRequest._retry) {
			if (!(getAuthRecoveryState().refreshPromise != null)) console.warn("401 error, refreshing token");
			originalRequest._retry = true;
			try {
				const token = await startAuthRecovery(isRefreshRequest);
				if (token) {
					setRequestAuthorizationHeader(originalRequest, token);
					return await (0, axios.default)(originalRequest);
				}
				redirectToLoginOnce();
				return Promise.reject(error);
			} catch {
				/** A rejected refresh (stale/invalid session → 401/403) must route to
				*  login just like an empty-token refresh, otherwise the original 401
				*  surfaces to the caller (e.g. the share fork button) with no redirect. */
				redirectToLoginOnce();
				return Promise.reject(error);
			}
		}
		return Promise.reject(error);
	});
}
var request_default = {
	get: _get,
	getResponse: _getResponse,
	post: _post,
	postMultiPart: _postMultiPart,
	postTTS: _postTTS,
	put: _put,
	delete: _delete,
	deleteWithOptions: _deleteWithOptions,
	patch: _patch,
	authenticatedFetch: _authenticatedFetch,
	refreshToken,
	dispatchTokenUpdatedEvent
};
//#endregion
//#region src/upload.ts
const EVENT_STREAM_MEDIA_TYPE = "text/event-stream";
const HEARTBEAT_TIMEOUT_MS = 15e3;
var FileUploadError = class extends Error {
	constructor(message, fileId, toolResource, displayToUser = false, code = 0) {
		super(message);
		this.name = "CustomAppError";
		this.code = code;
		this.file_id = fileId;
		this.tool_resource = toolResource;
		this.display_to_user = displayToUser;
		this.response = { data: { message: displayToUser ? message : "" } };
	}
};
var UploadCanceledError = class extends Error {
	constructor(..._args) {
		super(..._args);
		this.code = "ERR_CANCELED";
	}
};
const getFileId = (formData) => String(formData.get("file_id") ?? "");
const getToolResource = (formData) => formData.get("tool_resource") ?? void 0;
const parseEvent = (message) => {
	let type = "message";
	const data = [];
	for (const line of message.split(/\r?\n/)) {
		if (line.startsWith("event:")) {
			type = line.slice(6).trim();
			continue;
		}
		if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
	}
	return {
		type,
		data: data.join("\n")
	};
};
const createHttpError = async (response, formData) => {
	let message = `Server responded with status: ${response.status}`;
	try {
		message = (await response.json()).message || message;
	} catch {}
	return new FileUploadError(message, getFileId(formData), getToolResource(formData), true, response.status);
};
const createStreamError = (data, formData) => {
	let error;
	try {
		error = JSON.parse(data);
	} catch {
		error = { message: data };
	}
	return new FileUploadError(error.message || "File upload failed.", error.temp_file_id || getFileId(formData), error.tool_resource || getToolResource(formData), error.display_to_user ?? false, error.code ?? 0);
};
const readEventStream = async (stream, formData) => {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let result = null;
	let streamEnded = false;
	let timeoutError = null;
	let heartbeatTimer;
	const resetHeartbeatTimer = () => {
		clearTimeout(heartbeatTimer);
		heartbeatTimer = setTimeout(() => {
			timeoutError = /* @__PURE__ */ new Error("Upload connection timed out waiting for a heartbeat.");
			reader.cancel(timeoutError);
		}, HEARTBEAT_TIMEOUT_MS);
	};
	resetHeartbeatTimer();
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				streamEnded = true;
				if (timeoutError) throw timeoutError;
				if (result) return result;
				throw new Error("Upload connection closed before completion.");
			}
			buffer += decoder.decode(value, { stream: true });
			const messages = buffer.split(/\r?\n\r?\n/);
			buffer = messages.pop() ?? "";
			for (const message of messages) {
				const event = parseEvent(message);
				if (event.type === "heartbeat") {
					resetHeartbeatTimer();
					continue;
				}
				if (event.type === "error") throw createStreamError(event.data, formData);
				if (event.type === "data") {
					result = JSON.parse(event.data);
					continue;
				}
				if (event.type === "close") {
					if (result) return result;
					throw new Error("Upload stream closed without a result.");
				}
			}
		}
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") throw new UploadCanceledError("Upload canceled.");
		throw error;
	} finally {
		clearTimeout(heartbeatTimer);
		if (!streamEnded) await reader.cancel().catch(() => void 0);
		reader.releaseLock();
	}
};
async function uploadEventStream(url, formData, signal) {
	try {
		const response = await request_default.authenticatedFetch(url, {
			method: "POST",
			body: formData,
			headers: { Accept: EVENT_STREAM_MEDIA_TYPE },
			signal: signal ?? void 0
		});
		if (!response.ok) throw await createHttpError(response, formData);
		if (!(response.headers.get("Content-Type")?.toLowerCase() ?? "").includes(EVENT_STREAM_MEDIA_TYPE)) return await response.json();
		if (!response.body) throw new Error("No upload response body received.");
		return await readEventStream(response.body, formData);
	} catch (error) {
		if (signal?.aborted || error instanceof Error && error.name === "AbortError") throw new UploadCanceledError("Upload canceled.");
		throw error;
	}
}
//#endregion
//#region src/data-service.ts
var data_service_exports = /* @__PURE__ */ __exportAll({
	acceptTerms: () => acceptTerms,
	addPromptToGroup: () => addPromptToGroup,
	addTagToConversation: () => addTagToConversation,
	addToolFavorite: () => addToolFavorite,
	archiveAllConversations: () => archiveAllConversations,
	archiveConversation: () => archiveConversation,
	assignConversationToProject: () => assignConversationToProject,
	bindActionOAuth: () => bindActionOAuth,
	bindMCPOAuth: () => bindMCPOAuth,
	branchMessage: () => branchMessage,
	callTool: () => callTool,
	cancelAgentQueuedTurn: () => cancelAgentQueuedTurn,
	cancelMCPOAuth: () => cancelMCPOAuth,
	clearAllConversations: () => clearAllConversations,
	confirmTwoFactor: () => confirmTwoFactor,
	controlSubagentTask: () => controlSubagentTask,
	createAgent: () => createAgent,
	createAgentApiKey: () => createAgentApiKey,
	createAssistant: () => createAssistant,
	createConversationTag: () => createConversationTag,
	createMCPServer: () => createMCPServer,
	createMemory: () => createMemory,
	createPreset: () => createPreset,
	createProject: () => createProject,
	createPrompt: () => createPrompt,
	createSchedule: () => createSchedule,
	createSharedLink: () => createSharedLink,
	createSkill: () => createSkill,
	createSkillNode: () => createSkillNode,
	deleteAction: () => deleteAction,
	deleteAgent: () => deleteAgent,
	deleteAgentAction: () => deleteAgentAction,
	deleteAgentApiKey: () => deleteAgentApiKey,
	deleteAssistant: () => deleteAssistant,
	deleteCodeEnvironment: () => deleteCodeEnvironment,
	deleteConversation: () => deleteConversation,
	deleteConversationTag: () => deleteConversationTag,
	deleteFiles: () => deleteFiles,
	deleteGitHubSkillSyncCredential: () => deleteGitHubSkillSyncCredential,
	deleteMCPServer: () => deleteMCPServer,
	deleteMemory: () => deleteMemory,
	deleteMemoryById: () => deleteMemoryById,
	deletePreset: () => deletePreset,
	deleteProject: () => deleteProject,
	deletePrompt: () => deletePrompt,
	deletePromptGroup: () => deletePromptGroup,
	deleteSchedule: () => deleteSchedule,
	deleteSharedLink: () => deleteSharedLink,
	deleteSkill: () => deleteSkill,
	deleteSkillFile: () => deleteSkillFile,
	deleteSkillNode: () => deleteSkillNode,
	deleteUser: () => deleteUser,
	disableTwoFactor: () => disableTwoFactor,
	duplicateAgent: () => duplicateAgent,
	duplicateConversation: () => duplicateConversation,
	editArtifact: () => editArtifact,
	enableTwoFactor: () => enableTwoFactor,
	enqueueAgentQueuedTurn: () => enqueueAgentQueuedTurn,
	forkConversation: () => forkConversation,
	forkSharedConversation: () => forkSharedConversation,
	genTitle: () => genTitle,
	getAIEndpoints: () => getAIEndpoints,
	getAccessRoles: () => getAccessRoles,
	getActions: () => getActions,
	getActiveJobs: () => getActiveJobs,
	getAgentApiKeys: () => getAgentApiKeys,
	getAgentById: () => getAgentById,
	getAgentCategories: () => getAgentCategories,
	getAgentFiles: () => getAgentFiles,
	getAgentVersions: () => getAgentVersions,
	getAllEffectivePermissions: () => getAllEffectivePermissions,
	getAllPromptGroups: () => getAllPromptGroups,
	getAssistantById: () => getAssistantById,
	getAssistantDocs: () => getAssistantDocs,
	getAvailableAgentTools: () => getAvailableAgentTools,
	getAvailablePlugins: () => getAvailablePlugins,
	getAvailableTools: () => getAvailableTools,
	getBanner: () => getBanner,
	getCategories: () => getCategories,
	getCodeEnvironmentStatus: () => getCodeEnvironmentStatus,
	getCodeEnvironments: () => getCodeEnvironments,
	getCodeOutputDownload: () => getCodeOutputDownload,
	getConversationById: () => getConversationById,
	getConversationTags: () => getConversationTags,
	getConversationTraceAvailability: () => getConversationTraceAvailability,
	getConversationTraceRecord: () => getConversationTraceRecord,
	getConversationTraceRecords: () => getConversationTraceRecords,
	getConversations: () => getConversations,
	getCustomConfigSpeech: () => getCustomConfigSpeech,
	getDomainServerBaseUrl: () => getDomainServerBaseUrl,
	getEffectivePermissions: () => getEffectivePermissions,
	getExpandedAgentById: () => getExpandedAgentById,
	getFavorites: () => getFavorites,
	getFileConfig: () => getFileConfig,
	getFileDownload: () => getFileDownload,
	getFileDownloadURL: () => getFileDownloadURL,
	getFilePreview: () => getFilePreview,
	getFiles: () => getFiles,
	getGitHubSkillSyncStatus: () => getGitHubSkillSyncStatus,
	getGraphApiToken: () => getGraphApiToken,
	getInsights: () => getInsights,
	getInsightsAccess: () => getInsightsAccess,
	getLangfuseConnection: () => getLangfuseConnection,
	getLangfuseSessionLink: () => getLangfuseSessionLink,
	getLoginGoogle: () => getLoginGoogle,
	getMCPAuthValues: () => getMCPAuthValues,
	getMCPConnectionStatus: () => getMCPConnectionStatus,
	getMCPOAuthStatus: () => getMCPOAuthStatus,
	getMCPServer: () => getMCPServer,
	getMCPServerConnectionStatus: () => getMCPServerConnectionStatus,
	getMCPServers: () => getMCPServers,
	getMCPTools: () => getMCPTools,
	getMarketplaceAgents: () => getMarketplaceAgents,
	getMemories: () => getMemories,
	getMessageById: () => getMessageById,
	getMessagesByConvoId: () => getMessagesByConvoId,
	getModels: () => getModels,
	getParentSubagents: () => getParentSubagents,
	getPinnedOrder: () => getPinnedOrder,
	getPresets: () => getPresets,
	getProjectById: () => getProjectById,
	getPrompt: () => getPrompt,
	getPromptGroup: () => getPromptGroup,
	getPromptGroups: () => getPromptGroups,
	getPrompts: () => getPrompts,
	getRandomPrompts: () => getRandomPrompts,
	getResourcePermissions: () => getResourcePermissions,
	getRole: () => getRole,
	getSchedule: () => getSchedule,
	getSchedules: () => getSchedules,
	getSearchEnabled: () => getSearchEnabled,
	getSharedFileDownload: () => getSharedFileDownload,
	getSharedFilePreview: () => getSharedFilePreview,
	getSharedLink: () => getSharedLink,
	getSharedMessages: () => getSharedMessages,
	getSharedStartupConfig: () => getSharedStartupConfig,
	getSkill: () => getSkill,
	getSkillFileContent: () => getSkillFileContent,
	getSkillNodeContent: () => getSkillNodeContent,
	getSkillStates: () => getSkillStates,
	getSkillTree: () => getSkillTree,
	getStartupConfig: () => getStartupConfig,
	getSubagentThread: () => getSubagentThread,
	getTokenConfig: () => getTokenConfig,
	getToolCalls: () => getToolCalls,
	getToolFavorites: () => getToolFavorites,
	getUser: () => getUser,
	getUserBalance: () => getUserBalance,
	getUserTerms: () => getUserTerms,
	getVerifyAgentToolAuth: () => getVerifyAgentToolAuth,
	getVoices: () => getVoices,
	healthCheck: () => healthCheck,
	importConversationsFile: () => importConversationsFile,
	importSkill: () => importSkill,
	listAgentQueuedTurns: () => listAgentQueuedTurns,
	listAgents: () => listAgents,
	listAssistants: () => listAssistants,
	listConversations: () => listConversations,
	listMessages: () => listMessages,
	listProjects: () => listProjects,
	listRoles: () => listRoles,
	listSharedLinks: () => listSharedLinks,
	listSkillFiles: () => listSkillFiles,
	listSkills: () => listSkills,
	login: () => login,
	logout: () => logout,
	makePromptProduction: () => makePromptProduction,
	markFilesUsage: () => markFilesUsage,
	moveConversationCodeEnvironment: () => moveConversationCodeEnvironment,
	pairCodeEnvironment: () => pairCodeEnvironment,
	pinConversation: () => pinConversation,
	rebuildConversationTags: () => rebuildConversationTags,
	recordPromptGroupUsage: () => recordPromptGroupUsage,
	regenerateBackupCodes: () => regenerateBackupCodes,
	register: () => register,
	reinitializeMCPServer: () => reinitializeMCPServer,
	removeToolFavorite: () => removeToolFavorite,
	requestPasswordReset: () => requestPasswordReset,
	resendVerificationEmail: () => resendVerificationEmail,
	resetPassword: () => resetPassword,
	revertAgentVersion: () => revertAgentVersion,
	revokeAllUserKeys: () => revokeAllUserKeys,
	revokeUserKey: () => revokeUserKey,
	runGitHubSkillSync: () => runGitHubSkillSync,
	runScheduleNow: () => runScheduleNow,
	searchPrincipals: () => searchPrincipals,
	setGitHubSkillSyncCredential: () => setGitHubSkillSyncCredential,
	speechToText: () => speechToText,
	testLangfuseConnection: () => testLangfuseConnection,
	textToSpeech: () => textToSpeech,
	updateAction: () => updateAction,
	updateAgent: () => updateAgent,
	updateAgentAction: () => updateAgentAction,
	updateAgentPermissions: () => updateAgentPermissions,
	updateAssistant: () => updateAssistant,
	updateCodeEnvironmentSettings: () => updateCodeEnvironmentSettings,
	updateConversation: () => updateConversation,
	updateConversationTag: () => updateConversationTag,
	updateFavorites: () => updateFavorites,
	updateFeedback: () => updateFeedback,
	updateLangfuseConnection: () => updateLangfuseConnection,
	updateMCPServer: () => updateMCPServer,
	updateMCPServersPermissions: () => updateMCPServersPermissions,
	updateMarketplacePermissions: () => updateMarketplacePermissions,
	updateMemory: () => updateMemory,
	updateMemoryById: () => updateMemoryById,
	updateMemoryPermissions: () => updateMemoryPermissions,
	updateMemoryPreferences: () => updateMemoryPreferences,
	updateMessage: () => updateMessage,
	updateMessageContent: () => updateMessageContent,
	updatePeoplePickerPermissions: () => updatePeoplePickerPermissions,
	updatePinnedOrder: () => updatePinnedOrder,
	updatePreset: () => updatePreset,
	updateProject: () => updateProject,
	updatePromptGroup: () => updatePromptGroup,
	updatePromptLabels: () => updatePromptLabels,
	updatePromptPermissions: () => updatePromptPermissions,
	updateRemoteAgentsPermissions: () => updateRemoteAgentsPermissions,
	updateResourcePermissions: () => updateResourcePermissions,
	updateSchedule: () => updateSchedule,
	updateSharedLink: () => updateSharedLink,
	updateSkill: () => updateSkill,
	updateSkillNode: () => updateSkillNode,
	updateSkillNodeContent: () => updateSkillNodeContent,
	updateSkillPermissions: () => updateSkillPermissions,
	updateSkillStates: () => updateSkillStates,
	updateTokenCount: () => updateTokenCount,
	updateUserKey: () => updateUserKey,
	updateUserPlugins: () => updateUserPlugins,
	updateUserPreferences: () => updateUserPreferences,
	uploadAgentAvatar: () => uploadAgentAvatar,
	uploadAssistantAvatar: () => uploadAssistantAvatar,
	uploadAvatar: () => uploadAvatar,
	uploadFile: () => uploadFile,
	uploadImage: () => uploadImage,
	uploadSkillFile: () => uploadSkillFile,
	userKeyQuery: () => userKeyQuery,
	verifyEmail: () => verifyEmail,
	verifyTwoFactor: () => verifyTwoFactor,
	verifyTwoFactorTemp: () => verifyTwoFactorTemp
});
function getInsights(params = {}) {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
	else if (value !== void 0 && value !== null && value !== "") query.set(key, String(value));
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return request_default.get(`${insights()}${suffix}`);
}
function getInsightsAccess() {
	return request_default.get(insightsAccess());
}
function getConversationTraceAvailability(conversationId) {
	return request_default.get(conversationTraceAvailability(conversationId));
}
function getConversationTraceRecords({ conversationId, cursor }, signal) {
	return request_default.get(conversationTraceRecords(conversationId, cursor), signal ? { signal } : void 0);
}
function getConversationTraceRecord({ conversationId, recordId, messageId, sourceId }, signal) {
	return request_default.get(conversationTraceRecord(conversationId, recordId, messageId, sourceId), signal ? { signal } : void 0);
}
function getLangfuseConnection() {
	return request_default.get(adminLangfuseConnection());
}
function updateLangfuseConnection(payload) {
	return request_default.put(adminLangfuseConnection(), payload);
}
function testLangfuseConnection(payload) {
	return request_default.post(adminLangfuseConnectionTest(), payload);
}
function getLangfuseSessionLink(conversationId) {
	return request_default.get(adminLangfuseSessionLink(conversationId));
}
function revokeUserKey(name) {
	return request_default.delete(revokeUserKey$1(name));
}
function revokeAllUserKeys() {
	return request_default.delete(revokeAllUserKeys$1());
}
function deleteUser(payload) {
	return request_default.deleteWithOptions(deleteUser$1(), { data: payload });
}
function getCodeEnvironments() {
	return request_default.get(codeEnvironments());
}
function getCodeEnvironmentStatus(id) {
	return request_default.get(codeEnvironmentStatus(id));
}
function moveConversationCodeEnvironment({ conversationId, from, to }) {
	return request_default.patch(codeEnvironmentConversationDecision(conversationId), {
		from,
		to
	});
}
function pairCodeEnvironment(payload) {
	return request_default.post(codeEnvironmentPairings(), payload);
}
function deleteCodeEnvironment(id) {
	return request_default.delete(codeEnvironmentById(id));
}
function updateCodeEnvironmentSettings({ id, settings }) {
	return request_default.patch(codeEnvironmentSettings(id), { settings });
}
function getFavorites() {
	return request_default.get(`${apiBaseUrl()}/api/user/settings/favorites`);
}
function updateFavorites(favorites) {
	return request_default.post(`${apiBaseUrl()}/api/user/settings/favorites`, { favorites });
}
/** Combined Pinned-section display order: favorite and pinned-chat entry keys interleaved. */
function getPinnedOrder() {
	return request_default.get(pinnedOrder());
}
function updatePinnedOrder(pinnedOrder$1) {
	return request_default.post(pinnedOrder(), { pinnedOrder: pinnedOrder$1 });
}
/** Tool favorites — starred marketplace items (builtins, tools, MCP servers, skills). */
function getToolFavorites() {
	return request_default.get(toolFavorites());
}
function addToolFavorite(favorite) {
	return request_default.put(toolFavorite(favorite.itemType, favorite.itemId));
}
function removeToolFavorite(favorite) {
	return request_default.delete(toolFavorite(favorite.itemType, favorite.itemId));
}
/** Per-user skill active/inactive overrides. */
function getSkillStates() {
	return request_default.get(skillStates());
}
function updateSkillStates(skillStates$1) {
	return request_default.post(skillStates(), { skillStates: skillStates$1 });
}
function getSharedMessages(shareId) {
	return request_default.get(shareMessages(shareId));
}
function getSharedStartupConfig(shareId) {
	return request_default.get(sharedStartupConfig(shareId));
}
const listSharedLinks = async (params) => {
	const { pageSize, sortBy, sortDirection, search, cursor } = params;
	return request_default.get(getSharedLinks(pageSize, sortBy, sortDirection, search, cursor));
};
function getSharedLink(conversationId) {
	return request_default.get(getSharedLink$1(conversationId));
}
function createSharedLink(conversationId, targetMessageId, snapshotFiles) {
	return request_default.post(createSharedLink$1(conversationId), {
		targetMessageId,
		snapshotFiles
	});
}
function updateSharedLink(shareId, targetMessageId, snapshotFiles) {
	return request_default.patch(updateSharedLink$1(shareId), {
		targetMessageId,
		snapshotFiles
	});
}
function deleteSharedLink(shareId) {
	return request_default.delete(shareMessages(shareId));
}
function updateUserKey(payload) {
	const { value } = payload;
	if (!value) throw new Error("value is required");
	return request_default.put(keys(), payload);
}
function getAgentApiKeys() {
	return request_default.get(apiKeys());
}
function createAgentApiKey(payload) {
	return request_default.post(apiKeys(), payload);
}
function deleteAgentApiKey(id) {
	return request_default.delete(apiKeyById(id));
}
function getPresets() {
	return request_default.get(presets());
}
function createPreset(payload) {
	return request_default.post(presets(), payload);
}
function updatePreset(payload) {
	return request_default.post(presets(), payload);
}
function deletePreset(arg) {
	return request_default.post(deletePreset$1(), arg);
}
function getSearchEnabled() {
	return request_default.get(searchEnabled());
}
function getUser() {
	return request_default.get(user());
}
function updateUserPreferences(preferences) {
	return request_default.patch(userPreferences(), preferences);
}
function getUserBalance() {
	return request_default.get(balance());
}
const updateTokenCount = (text) => {
	return request_default.post(tokenizer(), { arg: text });
};
const login = (payload) => {
	return request_default.post(login$1(), payload);
};
const logout = () => {
	return request_default.post(logout$1());
};
const register = (payload) => {
	return request_default.post(register$1(), payload);
};
const userKeyQuery = (name) => request_default.get(userKeyQuery$1(name));
const getLoginGoogle = () => {
	return request_default.get(loginGoogle());
};
const requestPasswordReset = (payload) => {
	return request_default.post(requestPasswordReset$1(), payload);
};
const resetPassword = (payload) => {
	return request_default.post(resetPassword$1(), payload);
};
const verifyEmail = (payload) => {
	return request_default.post(verifyEmail$1(), payload);
};
const resendVerificationEmail = (payload) => {
	return request_default.post(resendVerificationEmail$1(), payload);
};
const getAvailablePlugins = () => {
	return request_default.get(plugins());
};
const updateUserPlugins = (payload) => {
	return request_default.post(userPlugins(), payload);
};
const reinitializeMCPServer = (serverName) => {
	return request_default.post(mcpReinitialize(serverName));
};
const bindMCPOAuth = (serverName) => {
	return request_default.post(mcpOAuthBind(serverName));
};
const bindActionOAuth = (actionId) => {
	return request_default.post(actionOAuthBind(actionId));
};
const getMCPConnectionStatus = () => {
	return request_default.get(mcpConnectionStatus());
};
const getMCPServerConnectionStatus = (serverName) => {
	return request_default.get(mcpServerConnectionStatus(serverName));
};
const getMCPAuthValues = (serverName) => {
	return request_default.get(mcpAuthValues(serverName));
};
function cancelMCPOAuth(serverName) {
	return request_default.post(cancelMCPOAuth$1(serverName), {});
}
function getMCPOAuthStatus(flowId) {
	return request_default.get(mcpOAuthStatus(flowId));
}
const getStartupConfig = (options) => {
	return request_default.get(config(options?.context));
};
const getAIEndpoints = () => {
	return request_default.get(aiEndpoints());
};
const getTokenConfig = () => {
	return request_default.get(tokenConfig());
};
const getModels = async () => {
	return request_default.get(models());
};
const createAssistant = ({ version, ...data }) => {
	return request_default.post(assistants({ version }), data);
};
const getAssistantById = ({ endpoint, assistant_id, version }) => {
	return request_default.get(assistants({
		path: assistant_id,
		endpoint,
		version
	}));
};
const updateAssistant = ({ assistant_id, data, version }) => {
	return request_default.patch(assistants({
		path: assistant_id,
		version
	}), data);
};
const deleteAssistant = ({ assistant_id, model, endpoint, version }) => {
	return request_default.delete(assistants({
		path: assistant_id,
		options: {
			model,
			endpoint
		},
		version
	}));
};
const listAssistants = (params, version) => {
	return request_default.get(assistants({
		version,
		options: params
	}));
};
function getAssistantDocs({ endpoint, version }) {
	if (!isAssistantsEndpoint(endpoint)) return Promise.resolve([]);
	return request_default.get(assistants({
		path: "documents",
		version,
		options: { endpoint },
		endpoint
	}));
}
const getAvailableTools = (_endpoint, version) => {
	let path = "";
	if (isAssistantsEndpoint(_endpoint)) {
		const endpoint = _endpoint;
		path = assistants({
			path: "tools",
			endpoint,
			version: version ?? defaultAssistantsVersion[endpoint]
		});
	} else path = agents({ path: "tools" });
	return request_default.get(path);
};
const getMCPTools = () => {
	return request_default.get(mcp.tools);
};
const getVerifyAgentToolAuth = (params) => {
	return request_default.get(agents({ path: `tools/${params.toolId}/auth` }));
};
const callTool = ({ toolId, toolParams }) => {
	return request_default.post(agents({ path: `tools/${toolId}/call` }), toolParams);
};
const getToolCalls = (params) => {
	return request_default.get(agents({
		path: "tools/calls",
		options: params
	}));
};
const getFiles = () => {
	return request_default.get(files());
};
/**
* Poll the lifecycle of an inline file preview. Returns the smallest
* shape needed to drive the UI:
*   - `status` always present (defaults to `'ready'` server-side for
*     legacy records that pre-date the field).
*   - `text` and `textFormat` only when `status === 'ready'` and text
*     was extracted (preserves the HTML-or-null security contract).
*   - `previewError` only when `status === 'failed'`.
*
* Called from `useFilePreview`; React Query's `refetchInterval`
* polls while `status === 'pending'` and stops on terminal status.
*/
const getFilePreview = (fileId) => {
	return request_default.get(filePreview(fileId));
};
/** Preview status for a snapshotted file served through a shared link. */
const getSharedFilePreview = (shareId, fileId) => {
	return request_default.get(sharedFilePreview(shareId, fileId));
};
const getAgentFiles = (agentId) => {
	return request_default.get(agentFiles(agentId));
};
const getFileConfig = () => {
	return request_default.get(`${files()}/config`);
};
const uploadImage = (data, signal, sseEnabled = false) => {
	const requestConfig = signal ? { signal } : void 0;
	if (sseEnabled) return uploadEventStream(images(), data, signal);
	return request_default.postMultiPart(images(), data, requestConfig);
};
const uploadFile = (data, signal, sseEnabled = false) => {
	const requestConfig = signal ? { signal } : void 0;
	if (sseEnabled) return uploadEventStream(files(), data, signal);
	return request_default.postMultiPart(files(), data, requestConfig);
};
/**
* Marks uploaded files as used (owner-scoped TTL touch) so the upload-window
* TTL cannot reap attachments held in a client-side queue during a long run.
* Best-effort: callers fire-and-forget — send-time marking is the backstop.
*/
const markFilesUsage = (body) => {
	return request_default.post(fileUsage(), body);
};
const updateAction = (data) => {
	const { assistant_id, version, ...body } = data;
	return request_default.post(assistants({
		path: `actions/${assistant_id}`,
		version
	}), body);
};
function getActions() {
	return request_default.get(agents({ path: "actions" }));
}
const deleteAction = async ({ assistant_id, action_id, model, version, endpoint }) => request_default.delete(assistants({
	path: `actions/${assistant_id}/${action_id}/${model}`,
	version,
	endpoint
}));
/**
* Agents
*/
const createAgent = ({ ...data }) => {
	return request_default.post(agents({}), data);
};
const getAgentById = ({ agent_id }) => {
	return request_default.get(agents({ path: agent_id }));
};
const getExpandedAgentById = ({ agent_id }) => {
	return request_default.get(agents({ path: `${agent_id}/expanded` }));
};
const getAgentVersions = ({ agent_id }) => {
	return request_default.get(agents({ path: `${agent_id}/versions` }));
};
const updateAgent = ({ agent_id, data }) => {
	return request_default.patch(agents({ path: agent_id }), data);
};
const duplicateAgent = ({ agent_id }) => {
	return request_default.post(agents({ path: `${agent_id}/duplicate` }));
};
const deleteAgent = ({ agent_id }) => {
	return request_default.delete(agents({ path: agent_id }));
};
const listAgents = (params) => {
	return request_default.get(agents({ options: params }));
};
const revertAgentVersion = ({ agent_id, version_index }) => request_default.post(revertAgentVersion$1(agent_id), { version_index });
/**
* Get agent categories with counts for marketplace tabs
*/
const getAgentCategories = () => {
	return request_default.get(agents({ path: "categories" }));
};
/**
* Unified marketplace agents endpoint with query string controls
*/
const getMarketplaceAgents = (params) => {
	return request_default.get(agents({ options: params }));
};
const getAvailableAgentTools = () => {
	return request_default.get(agents({ path: "tools" }));
};
const updateAgentAction = (data) => {
	const { agent_id, ...body } = data;
	return request_default.post(agents({ path: `actions/${agent_id}` }), body);
};
const deleteAgentAction = async ({ agent_id, action_id }) => request_default.delete(agents({ path: `actions/${agent_id}/${action_id}` }));
/**
* MCP Servers
*/
/**
*
* Ensure and List loaded mcp server configs from the cache Enriched with effective permissions.
*/
const getMCPServers = async () => {
	return request_default.get(mcp.servers);
};
/**
* Get a single MCP server by ID
*/
const getMCPServer = async (serverName) => {
	return request_default.get(mcpServer(serverName));
};
/**
* Create a new MCP server
*/
const createMCPServer = async (data) => {
	return request_default.post(mcp.servers, data);
};
/**
* Update an existing MCP server
*/
const updateMCPServer = async (serverName, data) => {
	return request_default.patch(mcpServer(serverName), data);
};
/**
* Delete an MCP server
*/
const deleteMCPServer = async (serverName) => {
	return request_default.delete(mcpServer(serverName));
};
/**
* Imports a conversations file.
*
* @param data - The FormData containing the file to import.
* @returns A Promise that resolves to the import start response.
*/
const importConversationsFile = (data) => {
	return request_default.postMultiPart(importConversation(), data);
};
const uploadAvatar = (data) => {
	return request_default.postMultiPart(avatar(), data);
};
const uploadAssistantAvatar = (data) => {
	return request_default.postMultiPart(assistants({
		isAvatar: true,
		path: `${data.assistant_id}/avatar`,
		options: {
			model: data.model,
			endpoint: data.endpoint
		},
		version: data.version
	}), data.formData);
};
const uploadAgentAvatar = (data) => {
	return request_default.postMultiPart(`${images()}/agents/${data.agent_id}/avatar`, data.formData);
};
const getFileDownload = async (userId, file_id) => {
	return request_default.getResponse(`${files()}/download/${userId}/${file_id}`, {
		responseType: "blob",
		headers: { Accept: "application/octet-stream" }
	});
};
const getFileDownloadURL = async (userId, file_id) => {
	return request_default.get(`${files()}/download-url/${userId}/${file_id}`);
};
/** Blob download for a snapshotted file served through a shared link. */
const getSharedFileDownload = async (shareId, file_id) => {
	return request_default.getResponse(sharedFileDownload(shareId, file_id), {
		responseType: "blob",
		headers: { Accept: "application/octet-stream" }
	});
};
const getCodeOutputDownload = async (url) => {
	return request_default.getResponse(url, {
		responseType: "blob",
		headers: { Accept: "application/octet-stream" }
	});
};
const deleteFiles = async (payload) => request_default.deleteWithOptions(files(), { data: payload });
const speechToText = (data) => {
	return request_default.postMultiPart(speechToText$1(), data);
};
const textToSpeech = (data) => {
	return request_default.postTTS(textToSpeechManual(), data);
};
const getVoices = () => {
	return request_default.get(textToSpeechVoices());
};
const getCustomConfigSpeech = () => {
	return request_default.get(getCustomConfigSpeech$1());
};
function duplicateConversation(payload) {
	return request_default.post(duplicateConversation$1(), payload);
}
function forkConversation(payload) {
	return request_default.post(forkConversation$1(), payload);
}
function forkSharedConversation(shareId, targetMessageIndex, shareRevision) {
	return request_default.post(forkSharedMessages(shareId), {
		targetMessageIndex,
		shareRevision
	});
}
function deleteConversation(payload) {
	return request_default.deleteWithOptions(deleteConversation$1(), { data: { arg: payload } });
}
function clearAllConversations() {
	return request_default.delete(deleteAllConversation());
}
const listConversations = (params) => {
	return request_default.get(conversations(params ?? {}));
};
function getConversations(cursor) {
	return request_default.get(conversations({ cursor }));
}
function getConversationById(id) {
	return request_default.get(conversationById(id));
}
function updateConversation(payload) {
	return request_default.post(updateConversation$1(), { arg: payload });
}
function archiveConversation(payload) {
	return request_default.post(archiveConversation$1(), { arg: payload });
}
function archiveAllConversations() {
	return request_default.post(archiveAllConversations$1(), {});
}
function listProjects(params) {
	return request_default.get(projects(params ?? {}));
}
function createProject(payload) {
	return request_default.post(projects(), payload);
}
function getProjectById(projectId) {
	return request_default.get(projectById(projectId));
}
function updateProject(payload) {
	const { projectId, ...data } = payload;
	return request_default.patch(projectById(projectId), data);
}
function deleteProject(projectId) {
	return request_default.delete(projectById(projectId));
}
function assignConversationToProject(payload) {
	const { conversationId, projectId } = payload;
	return request_default.put(projectConversation(conversationId), { projectId });
}
function pinConversation(payload) {
	return request_default.post(pinConversation$1(), { arg: payload });
}
function genTitle(payload) {
	return request_default.get(genTitle$1(payload.conversationId));
}
const listMessages = (params) => {
	return request_default.get(messages(params ?? {}));
};
function updateMessage(payload) {
	const { conversationId, messageId, text } = payload;
	if (!conversationId) throw new Error("conversationId is required");
	return request_default.put(messages({
		conversationId,
		messageId
	}), { text });
}
function updateMessageContent(payload) {
	const { conversationId, messageId, index, text } = payload;
	if (!conversationId) throw new Error("conversationId is required");
	return request_default.put(messages({
		conversationId,
		messageId
	}), {
		text,
		index
	});
}
const editArtifact = async ({ messageId, ...params }) => {
	return request_default.post(messagesArtifacts(messageId), params);
};
const branchMessage = async (payload) => {
	return request_default.post(messagesBranch(), payload);
};
function getMessagesByConvoId(conversationId) {
	if (conversationId === "new" || conversationId === "PENDING") return Promise.resolve([]);
	return request_default.get(messages({ conversationId }));
}
function getMessageById(conversationId, messageId) {
	return request_default.get(messages({
		conversationId,
		messageId
	}));
}
function getParentSubagents(parentConversationId) {
	return request_default.get(parentSubagents(parentConversationId));
}
function getSubagentThread(parentConversationId, threadId, taskId, cursor) {
	return request_default.get(subagentThread(parentConversationId, threadId, taskId, cursor));
}
function controlSubagentTask(parentConversationId, threadId, body) {
	return request_default.post(subagentControl(parentConversationId, threadId), body);
}
function getPrompt(id) {
	return request_default.get(getPrompt$1(id));
}
function getPrompts(filter) {
	return request_default.get(getPromptsWithFilters(filter));
}
function getAllPromptGroups() {
	return request_default.get(getAllPromptGroups$1());
}
function getPromptGroups(filter) {
	return request_default.get(getPromptGroupsWithFilters(filter));
}
function getPromptGroup(id) {
	return request_default.get(getPromptGroup$1(id));
}
function createPrompt(payload) {
	return request_default.post(postPrompt(), payload);
}
function addPromptToGroup(groupId, payload) {
	return request_default.post(addPromptToGroup$1(groupId), payload);
}
function updatePromptGroup(variables) {
	return request_default.patch(updatePromptGroup$1(variables.id), variables.payload);
}
function recordPromptGroupUsage(groupId) {
	return request_default.post(recordPromptGroupUsage$1(groupId));
}
function deletePrompt(payload) {
	return request_default.delete(deletePrompt$1(payload));
}
function makePromptProduction(id) {
	return request_default.patch(updatePromptTag(id));
}
function updatePromptLabels(variables) {
	return request_default.patch(updatePromptLabels$1(variables.id), variables.payload);
}
function deletePromptGroup(id) {
	return request_default.delete(deletePromptGroup$1(id));
}
function getCategories() {
	return request_default.get(getCategories$1());
}
function getRandomPrompts(variables) {
	return request_default.get(getRandomPrompts$1(variables.limit, variables.skip));
}
function listSkills(params) {
	return request_default.get(listSkillsWithFilters(params ?? {}));
}
function getSchedules() {
	return request_default.get(schedules());
}
function enqueueAgentQueuedTurn(payload) {
	return request_default.post(agentQueuedTurns(), payload);
}
function listAgentQueuedTurns(conversationId, clientRequestIds) {
	return request_default.get(agentQueuedTurnsByConversation(conversationId, clientRequestIds));
}
function cancelAgentQueuedTurn(queuedTurnId) {
	return request_default.delete(agentQueuedTurn(queuedTurnId));
}
function getSchedule(id) {
	return request_default.get(schedule(id));
}
function createSchedule(payload) {
	return request_default.post(schedules(), payload);
}
function updateSchedule(id, payload) {
	return request_default.patch(schedule(id), payload);
}
function deleteSchedule(id) {
	return request_default.delete(schedule(id));
}
function runScheduleNow(id) {
	return request_default.post(runSchedule(id), {});
}
function getSkill(id) {
	return request_default.get(getSkill$1(id));
}
function createSkill(payload) {
	return request_default.post(skills(), payload);
}
function updateSkill(variables) {
	return request_default.patch(getSkill$1(variables.id), {
		expectedVersion: variables.expectedVersion,
		...variables.payload
	});
}
function deleteSkill(id) {
	return request_default.delete(getSkill$1(id));
}
function listSkillFiles(skillId) {
	return request_default.get(skillFiles(skillId));
}
function uploadSkillFile(skillId, formData) {
	return request_default.postMultiPart(skillFiles(skillId), formData);
}
/**
* Import a skill from a .md, .zip, or .skill file. The backend extracts the
* archive, creates the skill from SKILL.md, and persists all additional files.
* Single HTTP request — no client-side zip processing needed.
*/
function importSkill(formData) {
	return request_default.postMultiPart(importSkill$1(), formData);
}
function getSkillFileContent(skillId, relativePath) {
	return request_default.get(skillFile(skillId, relativePath));
}
function deleteSkillFile(skillId, relativePath) {
	return request_default.delete(skillFile(skillId, relativePath));
}
const getSkillTree = (_skillId) => {
	return Promise.resolve({ nodes: [] });
};
const createSkillNode = (skillId, data) => {
	const name = data instanceof FormData ? data.get("name") || "untitled" : data.name;
	const type = data instanceof FormData ? "file" : data.type;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	return Promise.resolve({
		_id: `pending-${now}`,
		skillId,
		parentId: null,
		type,
		name,
		order: 0,
		author: "",
		createdAt: now,
		updatedAt: now
	});
};
const updateSkillNode = (variables) => {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	return Promise.resolve({
		_id: variables.nodeId,
		skillId: variables.skillId,
		parentId: variables.data.parentId ?? null,
		type: "file",
		name: variables.data.name ?? "",
		order: variables.data.order ?? 0,
		author: "",
		createdAt: now,
		updatedAt: now
	});
};
const deleteSkillNode = (_variables) => {
	return Promise.resolve();
};
const getSkillNodeContent = (_variables) => {
	return Promise.resolve({
		content: "",
		mimeType: "text/plain"
	});
};
const updateSkillNodeContent = (variables) => {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	return Promise.resolve({
		_id: variables.nodeId,
		skillId: variables.skillId,
		parentId: null,
		type: "file",
		name: "",
		order: 0,
		author: "",
		createdAt: now,
		updatedAt: now
	});
};
function getGitHubSkillSyncStatus() {
	return request_default.get(adminSkillsSyncStatus());
}
function runGitHubSkillSync() {
	return request_default.post(adminSkillsSyncRun());
}
function setGitHubSkillSyncCredential(variables) {
	return request_default.put(adminSkillsSyncCredential(variables.credentialKey), { token: variables.token });
}
function deleteGitHubSkillSyncCredential(credentialKey) {
	return request_default.delete(adminSkillsSyncCredential(credentialKey));
}
function listRoles() {
	return request_default.get(`${adminRoles()}?limit=200`);
}
function getRole(roleName) {
	return request_default.get(getRole$1(roleName));
}
function updatePromptPermissions(variables) {
	return request_default.put(updatePromptPermissions$1(variables.roleName), variables.updates);
}
function updateAgentPermissions(variables) {
	return request_default.put(updateAgentPermissions$1(variables.roleName), variables.updates);
}
function updateMemoryPermissions(variables) {
	return request_default.put(updateMemoryPermissions$1(variables.roleName), variables.updates);
}
function updatePeoplePickerPermissions(variables) {
	return request_default.put(updatePeoplePickerPermissions$1(variables.roleName), variables.updates);
}
function updateMCPServersPermissions(variables) {
	return request_default.put(updateMCPServersPermissions$1(variables.roleName), variables.updates);
}
function updateRemoteAgentsPermissions(variables) {
	return request_default.put(updateRemoteAgentsPermissions$1(variables.roleName), variables.updates);
}
function updateMarketplacePermissions(variables) {
	return request_default.put(updateMarketplacePermissions$1(variables.roleName), variables.updates);
}
function updateSkillPermissions(variables) {
	return request_default.put(updateSkillPermissions$1(variables.roleName), variables.updates);
}
function getConversationTags() {
	return request_default.get(conversationTags());
}
function createConversationTag(payload) {
	return request_default.post(conversationTags(), payload);
}
function updateConversationTag(tag, payload) {
	return request_default.put(conversationTags(tag), payload);
}
function deleteConversationTag(tag) {
	return request_default.delete(conversationTags(tag));
}
function addTagToConversation(conversationId, payload) {
	return request_default.put(addTagToConversation$1(conversationId), payload);
}
function rebuildConversationTags() {
	return request_default.post(conversationTags("rebuild"));
}
function healthCheck() {
	return request_default.get(health());
}
function getUserTerms() {
	return request_default.get(userTerms());
}
function acceptTerms() {
	return request_default.post(acceptUserTerms());
}
function getBanner() {
	return request_default.get(banner());
}
function updateFeedback(conversationId, messageId, payload) {
	return request_default.put(feedback(conversationId, messageId), payload);
}
function enableTwoFactor(payload) {
	return request_default.post(enableTwoFactor$1(), payload);
}
function verifyTwoFactor(payload) {
	return request_default.post(verifyTwoFactor$1(), payload);
}
function confirmTwoFactor(payload) {
	return request_default.post(confirmTwoFactor$1(), payload);
}
function disableTwoFactor(payload) {
	return request_default.post(disableTwoFactor$1(), payload);
}
function regenerateBackupCodes(payload) {
	return request_default.post(regenerateBackupCodes$1(), payload);
}
function verifyTwoFactorTemp(payload) {
	return request_default.post(verifyTwoFactorTemp$1(), payload);
}
const getMemories = () => {
	return request_default.get(memories());
};
const deleteMemory = (key, agentId) => {
	return request_default.delete(memory(key, agentId));
};
const deleteMemoryById = (id, agentId) => {
	return request_default.delete(memoryById(id, agentId));
};
const updateMemory = (key, value, originalKey, agentId) => {
	return request_default.patch(memory(originalKey || key, agentId), {
		key,
		value
	});
};
const updateMemoryById = (id, value, key, agentId) => {
	return request_default.patch(memoryById(id, agentId), {
		value,
		...key ? { key } : {}
	});
};
const updateMemoryPreferences = (preferences) => {
	return request_default.patch(memoryPreferences(), preferences);
};
const createMemory = (data) => {
	return request_default.post(memories(), data);
};
function searchPrincipals(params) {
	return request_default.get(searchPrincipals$1(params));
}
function getAccessRoles(resourceType) {
	return request_default.get(getAccessRoles$1(resourceType));
}
function getResourcePermissions(resourceType, resourceId) {
	return request_default.get(getResourcePermissions$1(resourceType, resourceId));
}
function updateResourcePermissions(resourceType, resourceId, data) {
	return request_default.put(updateResourcePermissions$1(resourceType, resourceId), data);
}
function getEffectivePermissions(resourceType, resourceId) {
	return request_default.get(getEffectivePermissions$1(resourceType, resourceId));
}
function getAllEffectivePermissions(resourceType) {
	return request_default.get(getAllEffectivePermissions$1(resourceType));
}
function getGraphApiToken(params) {
	return request_default.get(graphToken(params.scopes));
}
function getDomainServerBaseUrl() {
	return `${apiBaseUrl()}/api`;
}
const getActiveJobs = () => {
	return request_default.get(activeJobs());
};
//#endregion
Object.defineProperty(exports, "ACTION_METADATA_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return ACTION_METADATA_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "AGENT_INSTRUCTION_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return AGENT_INSTRUCTION_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "AUTH_USER_DOC_BY_ID_PREFIX", {
	enumerable: true,
	get: function() {
		return AUTH_USER_DOC_BY_ID_PREFIX;
	}
});
Object.defineProperty(exports, "AccessRoleIds", {
	enumerable: true,
	get: function() {
		return AccessRoleIds;
	}
});
Object.defineProperty(exports, "AgentCapabilities", {
	enumerable: true,
	get: function() {
		return AgentCapabilities;
	}
});
Object.defineProperty(exports, "AnthropicEffort", {
	enumerable: true,
	get: function() {
		return AnthropicEffort;
	}
});
Object.defineProperty(exports, "AssistantStreamEvents", {
	enumerable: true,
	get: function() {
		return AssistantStreamEvents;
	}
});
Object.defineProperty(exports, "AuthKeys", {
	enumerable: true,
	get: function() {
		return AuthKeys;
	}
});
Object.defineProperty(exports, "AuthType", {
	enumerable: true,
	get: function() {
		return AuthType;
	}
});
Object.defineProperty(exports, "AuthTypeEnum", {
	enumerable: true,
	get: function() {
		return AuthTypeEnum;
	}
});
Object.defineProperty(exports, "AuthorizationTypeEnum", {
	enumerable: true,
	get: function() {
		return AuthorizationTypeEnum;
	}
});
Object.defineProperty(exports, "BASE_ONLY_CONFIG_SECTIONS", {
	enumerable: true,
	get: function() {
		return BASE_ONLY_CONFIG_SECTIONS;
	}
});
Object.defineProperty(exports, "BASE_PRINCIPAL_CONFIG_SECTIONS", {
	enumerable: true,
	get: function() {
		return BASE_PRINCIPAL_CONFIG_SECTIONS;
	}
});
Object.defineProperty(exports, "BedrockProviders", {
	enumerable: true,
	get: function() {
		return BedrockProviders;
	}
});
Object.defineProperty(exports, "BedrockReasoningConfig", {
	enumerable: true,
	get: function() {
		return BedrockReasoningConfig;
	}
});
Object.defineProperty(exports, "CODE_APPROVAL_MODES", {
	enumerable: true,
	get: function() {
		return CODE_APPROVAL_MODES;
	}
});
Object.defineProperty(exports, "CODE_ENVIRONMENT_COMMAND_TIMEOUT_DEFAULT_MS", {
	enumerable: true,
	get: function() {
		return CODE_ENVIRONMENT_COMMAND_TIMEOUT_DEFAULT_MS;
	}
});
Object.defineProperty(exports, "CODE_ENVIRONMENT_COMMAND_TIMEOUT_HARD_MAX_MS", {
	enumerable: true,
	get: function() {
		return CODE_ENVIRONMENT_COMMAND_TIMEOUT_HARD_MAX_MS;
	}
});
Object.defineProperty(exports, "CODE_ENVIRONMENT_DECISION_VERSION", {
	enumerable: true,
	get: function() {
		return CODE_ENVIRONMENT_DECISION_VERSION;
	}
});
Object.defineProperty(exports, "CODE_ENVIRONMENT_MODES", {
	enumerable: true,
	get: function() {
		return CODE_ENVIRONMENT_MODES;
	}
});
Object.defineProperty(exports, "CODE_ENVIRONMENT_MOVE_VERSION", {
	enumerable: true,
	get: function() {
		return CODE_ENVIRONMENT_MOVE_VERSION;
	}
});
Object.defineProperty(exports, "CODE_WORKSPACE_ID_PATTERN", {
	enumerable: true,
	get: function() {
		return CODE_WORKSPACE_ID_PATTERN;
	}
});
Object.defineProperty(exports, "CODE_WORKSPACE_MAX_COUNT", {
	enumerable: true,
	get: function() {
		return CODE_WORKSPACE_MAX_COUNT;
	}
});
Object.defineProperty(exports, "CODE_WORKSPACE_OPERATIONS", {
	enumerable: true,
	get: function() {
		return CODE_WORKSPACE_OPERATIONS;
	}
});
Object.defineProperty(exports, "CODE_WORKSPACE_SELECTION_ERROR_REASONS", {
	enumerable: true,
	get: function() {
		return CODE_WORKSPACE_SELECTION_ERROR_REASONS;
	}
});
Object.defineProperty(exports, "CONVERSATION_STARTER_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return CONVERSATION_STARTER_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "CONVERSATION_TITLE_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return CONVERSATION_TITLE_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "CacheKeys", {
	enumerable: true,
	get: function() {
		return CacheKeys;
	}
});
Object.defineProperty(exports, "Capabilities", {
	enumerable: true,
	get: function() {
		return Capabilities;
	}
});
Object.defineProperty(exports, "CodeApprovalModeError", {
	enumerable: true,
	get: function() {
		return CodeApprovalModeError;
	}
});
Object.defineProperty(exports, "CohereConstants", {
	enumerable: true,
	get: function() {
		return CohereConstants;
	}
});
Object.defineProperty(exports, "ComponentTypes", {
	enumerable: true,
	get: function() {
		return ComponentTypes;
	}
});
Object.defineProperty(exports, "Constants", {
	enumerable: true,
	get: function() {
		return Constants;
	}
});
Object.defineProperty(exports, "DEFAULT_BALANCE_RESERVATION_TTL_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_BALANCE_RESERVATION_TTL_MS;
	}
});
Object.defineProperty(exports, "DEFAULT_MAX_RETAINED_TOOL_COUNT_CHARS", {
	enumerable: true,
	get: function() {
		return DEFAULT_MAX_RETAINED_TOOL_COUNT_CHARS;
	}
});
Object.defineProperty(exports, "DEFAULT_MEMORY_MAX_INPUT_TOKENS", {
	enumerable: true,
	get: function() {
		return DEFAULT_MEMORY_MAX_INPUT_TOKENS;
	}
});
Object.defineProperty(exports, "DEFAULT_OAUTH_STATE_TTL_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_OAUTH_STATE_TTL_MS;
	}
});
Object.defineProperty(exports, "DEFAULT_RETAINED_ANSWER_TOKENS", {
	enumerable: true,
	get: function() {
		return DEFAULT_RETAINED_ANSWER_TOKENS;
	}
});
Object.defineProperty(exports, "DefaultLLMDeliveryPath", {
	enumerable: true,
	get: function() {
		return DefaultLLMDeliveryPath;
	}
});
Object.defineProperty(exports, "DynamicQueryKeys", {
	enumerable: true,
	get: function() {
		return DynamicQueryKeys;
	}
});
Object.defineProperty(exports, "EImageOutputType", {
	enumerable: true,
	get: function() {
		return EImageOutputType;
	}
});
Object.defineProperty(exports, "EModelEndpoint", {
	enumerable: true,
	get: function() {
		return EModelEndpoint;
	}
});
Object.defineProperty(exports, "EToolResources", {
	enumerable: true,
	get: function() {
		return EToolResources;
	}
});
Object.defineProperty(exports, "EndpointURLs", {
	enumerable: true,
	get: function() {
		return EndpointURLs;
	}
});
Object.defineProperty(exports, "ErrorTypes", {
	enumerable: true,
	get: function() {
		return ErrorTypes;
	}
});
Object.defineProperty(exports, "FEEDBACK_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return FEEDBACK_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "FEEDBACK_RATINGS", {
	enumerable: true,
	get: function() {
		return FEEDBACK_RATINGS;
	}
});
Object.defineProperty(exports, "FEEDBACK_REASON_KEYS", {
	enumerable: true,
	get: function() {
		return FEEDBACK_REASON_KEYS;
	}
});
Object.defineProperty(exports, "FEEDBACK_TAGS", {
	enumerable: true,
	get: function() {
		return FEEDBACK_TAGS;
	}
});
Object.defineProperty(exports, "FILE_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return FILE_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "FILTER_PII_STARTER_PATTERNS", {
	enumerable: true,
	get: function() {
		return FILTER_PII_STARTER_PATTERNS;
	}
});
Object.defineProperty(exports, "FetchTokenConfig", {
	enumerable: true,
	get: function() {
		return FetchTokenConfig;
	}
});
Object.defineProperty(exports, "FileContext", {
	enumerable: true,
	get: function() {
		return FileContext;
	}
});
Object.defineProperty(exports, "FilePurpose", {
	enumerable: true,
	get: function() {
		return FilePurpose;
	}
});
Object.defineProperty(exports, "FileSources", {
	enumerable: true,
	get: function() {
		return FileSources;
	}
});
Object.defineProperty(exports, "ForkOptions", {
	enumerable: true,
	get: function() {
		return ForkOptions;
	}
});
Object.defineProperty(exports, "HITL_MESSAGE_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return HITL_MESSAGE_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "ImageDetail", {
	enumerable: true,
	get: function() {
		return ImageDetail;
	}
});
Object.defineProperty(exports, "ImageDetailCost", {
	enumerable: true,
	get: function() {
		return ImageDetailCost;
	}
});
Object.defineProperty(exports, "ImageVisionTool", {
	enumerable: true,
	get: function() {
		return ImageVisionTool;
	}
});
Object.defineProperty(exports, "InfiniteCollections", {
	enumerable: true,
	get: function() {
		return InfiniteCollections;
	}
});
Object.defineProperty(exports, "KnownEndpoints", {
	enumerable: true,
	get: function() {
		return KnownEndpoints;
	}
});
Object.defineProperty(exports, "LANGFUSE_TRACE_CONVERSATION_METADATA_FIELDS", {
	enumerable: true,
	get: function() {
		return LANGFUSE_TRACE_CONVERSATION_METADATA_FIELDS;
	}
});
Object.defineProperty(exports, "LANGFUSE_TRACE_USER_ID_FIELDS", {
	enumerable: true,
	get: function() {
		return LANGFUSE_TRACE_USER_ID_FIELDS;
	}
});
Object.defineProperty(exports, "LANGFUSE_TRACE_USER_METADATA_FIELDS", {
	enumerable: true,
	get: function() {
		return LANGFUSE_TRACE_USER_METADATA_FIELDS;
	}
});
Object.defineProperty(exports, "LocalStorageKeys", {
	enumerable: true,
	get: function() {
		return LocalStorageKeys;
	}
});
Object.defineProperty(exports, "MAX_CHAT_PROJECT_DESCRIPTION_LENGTH", {
	enumerable: true,
	get: function() {
		return MAX_CHAT_PROJECT_DESCRIPTION_LENGTH;
	}
});
Object.defineProperty(exports, "MAX_CHAT_PROJECT_NAME_LENGTH", {
	enumerable: true,
	get: function() {
		return MAX_CHAT_PROJECT_NAME_LENGTH;
	}
});
Object.defineProperty(exports, "MAX_GRAPH_SUBAGENT_MEMBERS", {
	enumerable: true,
	get: function() {
		return MAX_GRAPH_SUBAGENT_MEMBERS;
	}
});
Object.defineProperty(exports, "MAX_MCP_ICON_PATH_LENGTH", {
	enumerable: true,
	get: function() {
		return MAX_MCP_ICON_PATH_LENGTH;
	}
});
Object.defineProperty(exports, "MAX_PII_CUSTOM_PATTERNS_TOTAL", {
	enumerable: true,
	get: function() {
		return MAX_PII_CUSTOM_PATTERNS_TOTAL;
	}
});
Object.defineProperty(exports, "MAX_PII_CUSTOM_REGEX_CHARACTERS", {
	enumerable: true,
	get: function() {
		return MAX_PII_CUSTOM_REGEX_CHARACTERS;
	}
});
Object.defineProperty(exports, "MAX_PII_CUSTOM_REGEX_INSTRUCTIONS", {
	enumerable: true,
	get: function() {
		return MAX_PII_CUSTOM_REGEX_INSTRUCTIONS;
	}
});
Object.defineProperty(exports, "MAX_PII_PATTERNS_PER_SOURCE", {
	enumerable: true,
	get: function() {
		return MAX_PII_PATTERNS_PER_SOURCE;
	}
});
Object.defineProperty(exports, "MAX_PII_PATTERN_ID_LENGTH", {
	enumerable: true,
	get: function() {
		return MAX_PII_PATTERN_ID_LENGTH;
	}
});
Object.defineProperty(exports, "MAX_PII_PATTERN_LABEL_LENGTH", {
	enumerable: true,
	get: function() {
		return MAX_PII_PATTERN_LABEL_LENGTH;
	}
});
Object.defineProperty(exports, "MAX_PII_PATTERN_LENGTH", {
	enumerable: true,
	get: function() {
		return MAX_PII_PATTERN_LENGTH;
	}
});
Object.defineProperty(exports, "MAX_SUBAGENTS", {
	enumerable: true,
	get: function() {
		return MAX_SUBAGENTS;
	}
});
Object.defineProperty(exports, "MAX_SUBAGENTS_CEILING", {
	enumerable: true,
	get: function() {
		return MAX_SUBAGENTS_CEILING;
	}
});
Object.defineProperty(exports, "MAX_SUBAGENT_DEPTH", {
	enumerable: true,
	get: function() {
		return MAX_SUBAGENT_DEPTH;
	}
});
Object.defineProperty(exports, "MAX_SUBAGENT_GRAPH_NODES", {
	enumerable: true,
	get: function() {
		return MAX_SUBAGENT_GRAPH_NODES;
	}
});
Object.defineProperty(exports, "MAX_SUBAGENT_RUN_CONFIGS", {
	enumerable: true,
	get: function() {
		return MAX_SUBAGENT_RUN_CONFIGS;
	}
});
Object.defineProperty(exports, "MCPOptionsSchema", {
	enumerable: true,
	get: function() {
		return MCPOptionsSchema;
	}
});
Object.defineProperty(exports, "MCPServerUserInputSchema", {
	enumerable: true,
	get: function() {
		return MCPServerUserInputSchema;
	}
});
Object.defineProperty(exports, "MCPServersSchema", {
	enumerable: true,
	get: function() {
		return MCPServersSchema;
	}
});
Object.defineProperty(exports, "MCP_SERVER_TITLE_ERROR", {
	enumerable: true,
	get: function() {
		return MCP_SERVER_TITLE_ERROR;
	}
});
Object.defineProperty(exports, "MCP_SERVER_TITLE_PATTERN", {
	enumerable: true,
	get: function() {
		return MCP_SERVER_TITLE_PATTERN;
	}
});
Object.defineProperty(exports, "MCP_USER_INPUT_FIELDS", {
	enumerable: true,
	get: function() {
		return MCP_USER_INPUT_FIELDS;
	}
});
Object.defineProperty(exports, "MEMORY_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return MEMORY_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "MESSAGE_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return MESSAGE_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "MIN_BALANCE_RESERVATION_TTL_MS", {
	enumerable: true,
	get: function() {
		return MIN_BALANCE_RESERVATION_TTL_MS;
	}
});
Object.defineProperty(exports, "MODEL_PARAMETER_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return MODEL_PARAMETER_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "MYTHOS_CLASS_FAMILIES", {
	enumerable: true,
	get: function() {
		return MYTHOS_CLASS_FAMILIES;
	}
});
Object.defineProperty(exports, "MemoryScope", {
	enumerable: true,
	get: function() {
		return MemoryScope;
	}
});
Object.defineProperty(exports, "MutationKeys", {
	enumerable: true,
	get: function() {
		return MutationKeys;
	}
});
Object.defineProperty(exports, "OCRStrategy", {
	enumerable: true,
	get: function() {
		return OCRStrategy;
	}
});
Object.defineProperty(exports, "OptionTypes", {
	enumerable: true,
	get: function() {
		return OptionTypes;
	}
});
Object.defineProperty(exports, "PROMPT_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return PROMPT_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "PermissionBits", {
	enumerable: true,
	get: function() {
		return PermissionBits;
	}
});
Object.defineProperty(exports, "PrincipalModel", {
	enumerable: true,
	get: function() {
		return PrincipalModel;
	}
});
Object.defineProperty(exports, "PrincipalType", {
	enumerable: true,
	get: function() {
		return PrincipalType;
	}
});
Object.defineProperty(exports, "Providers", {
	enumerable: true,
	get: function() {
		return Providers;
	}
});
Object.defineProperty(exports, "QueryKeys", {
	enumerable: true,
	get: function() {
		return QueryKeys;
	}
});
Object.defineProperty(exports, "REFILL_INTERVAL_UNITS", {
	enumerable: true,
	get: function() {
		return REFILL_INTERVAL_UNITS;
	}
});
Object.defineProperty(exports, "RateLimitPrefix", {
	enumerable: true,
	get: function() {
		return RateLimitPrefix;
	}
});
Object.defineProperty(exports, "ReasoningContext", {
	enumerable: true,
	get: function() {
		return ReasoningContext;
	}
});
Object.defineProperty(exports, "ReasoningEffort", {
	enumerable: true,
	get: function() {
		return ReasoningEffort;
	}
});
Object.defineProperty(exports, "ReasoningMode", {
	enumerable: true,
	get: function() {
		return ReasoningMode;
	}
});
Object.defineProperty(exports, "ReasoningParameterFormat", {
	enumerable: true,
	get: function() {
		return ReasoningParameterFormat;
	}
});
Object.defineProperty(exports, "ReasoningResponseKey", {
	enumerable: true,
	get: function() {
		return ReasoningResponseKey;
	}
});
Object.defineProperty(exports, "ReasoningSummary", {
	enumerable: true,
	get: function() {
		return ReasoningSummary;
	}
});
Object.defineProperty(exports, "RerankerTypes", {
	enumerable: true,
	get: function() {
		return RerankerTypes;
	}
});
Object.defineProperty(exports, "ResourceType", {
	enumerable: true,
	get: function() {
		return ResourceType;
	}
});
Object.defineProperty(exports, "RetentionMode", {
	enumerable: true,
	get: function() {
		return RetentionMode;
	}
});
Object.defineProperty(exports, "RunStatus", {
	enumerable: true,
	get: function() {
		return RunStatus;
	}
});
Object.defineProperty(exports, "SKILL_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return SKILL_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "SKILL_SYNC_DEFAULT_DISCOVERY_DEPTH", {
	enumerable: true,
	get: function() {
		return SKILL_SYNC_DEFAULT_DISCOVERY_DEPTH;
	}
});
Object.defineProperty(exports, "SKILL_SYNC_MAX_DISCOVERY_DEPTH", {
	enumerable: true,
	get: function() {
		return SKILL_SYNC_MAX_DISCOVERY_DEPTH;
	}
});
Object.defineProperty(exports, "SKILL_SYNC_MAX_INTERVAL_MINUTES", {
	enumerable: true,
	get: function() {
		return SKILL_SYNC_MAX_INTERVAL_MINUTES;
	}
});
Object.defineProperty(exports, "SKILL_SYNC_MIN_INTERVAL_MINUTES", {
	enumerable: true,
	get: function() {
		return SKILL_SYNC_MIN_INTERVAL_MINUTES;
	}
});
Object.defineProperty(exports, "SSEOptionsSchema", {
	enumerable: true,
	get: function() {
		return SSEOptionsSchema;
	}
});
Object.defineProperty(exports, "STATEFUL_CODE_ENVIRONMENTS", {
	enumerable: true,
	get: function() {
		return STATEFUL_CODE_ENVIRONMENTS;
	}
});
Object.defineProperty(exports, "STORED_MESSAGE_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return STORED_MESSAGE_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "STTProviders", {
	enumerable: true,
	get: function() {
		return STTProviders;
	}
});
Object.defineProperty(exports, "SafeSearchTypes", {
	enumerable: true,
	get: function() {
		return SafeSearchTypes;
	}
});
Object.defineProperty(exports, "ScraperProviders", {
	enumerable: true,
	get: function() {
		return ScraperProviders;
	}
});
Object.defineProperty(exports, "SearchCategories", {
	enumerable: true,
	get: function() {
		return SearchCategories;
	}
});
Object.defineProperty(exports, "SearchProviders", {
	enumerable: true,
	get: function() {
		return SearchProviders;
	}
});
Object.defineProperty(exports, "SettingTypes", {
	enumerable: true,
	get: function() {
		return SettingTypes;
	}
});
Object.defineProperty(exports, "SettingsTabValues", {
	enumerable: true,
	get: function() {
		return SettingsTabValues;
	}
});
Object.defineProperty(exports, "SettingsViews", {
	enumerable: true,
	get: function() {
		return SettingsViews;
	}
});
Object.defineProperty(exports, "SkillsScope", {
	enumerable: true,
	get: function() {
		return SkillsScope;
	}
});
Object.defineProperty(exports, "StdioOptionsSchema", {
	enumerable: true,
	get: function() {
		return StdioOptionsSchema;
	}
});
Object.defineProperty(exports, "StreamableHTTPOptionsSchema", {
	enumerable: true,
	get: function() {
		return StreamableHTTPOptionsSchema;
	}
});
Object.defineProperty(exports, "SystemCategories", {
	enumerable: true,
	get: function() {
		return SystemCategories;
	}
});
Object.defineProperty(exports, "TOOL_ARGUMENT_FILTER_FIELDS", {
	enumerable: true,
	get: function() {
		return TOOL_ARGUMENT_FILTER_FIELDS;
	}
});
Object.defineProperty(exports, "TTSProviders", {
	enumerable: true,
	get: function() {
		return TTSProviders;
	}
});
Object.defineProperty(exports, "ThinkingDisplay", {
	enumerable: true,
	get: function() {
		return ThinkingDisplay;
	}
});
Object.defineProperty(exports, "ThinkingLevel", {
	enumerable: true,
	get: function() {
		return ThinkingLevel;
	}
});
Object.defineProperty(exports, "Time", {
	enumerable: true,
	get: function() {
		return Time;
	}
});
Object.defineProperty(exports, "TokenExchangeMethodEnum", {
	enumerable: true,
	get: function() {
		return TokenExchangeMethodEnum;
	}
});
Object.defineProperty(exports, "Tools", {
	enumerable: true,
	get: function() {
		return Tools;
	}
});
Object.defineProperty(exports, "Verbosity", {
	enumerable: true,
	get: function() {
		return Verbosity;
	}
});
Object.defineProperty(exports, "ViolationTypes", {
	enumerable: true,
	get: function() {
		return ViolationTypes;
	}
});
Object.defineProperty(exports, "VisionModes", {
	enumerable: true,
	get: function() {
		return VisionModes;
	}
});
Object.defineProperty(exports, "WebSocketOptionsSchema", {
	enumerable: true,
	get: function() {
		return WebSocketOptionsSchema;
	}
});
Object.defineProperty(exports, "__toESM", {
	enumerable: true,
	get: function() {
		return __toESM;
	}
});
Object.defineProperty(exports, "accessRoleSchema", {
	enumerable: true,
	get: function() {
		return accessRoleSchema;
	}
});
Object.defineProperty(exports, "accessRoleToPermBits", {
	enumerable: true,
	get: function() {
		return accessRoleToPermBits;
	}
});
Object.defineProperty(exports, "actionDelimiter", {
	enumerable: true,
	get: function() {
		return actionDelimiter;
	}
});
Object.defineProperty(exports, "actionDomainSeparator", {
	enumerable: true,
	get: function() {
		return actionDomainSeparator;
	}
});
Object.defineProperty(exports, "actionMetadataFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return actionMetadataFilterFieldSchema;
	}
});
Object.defineProperty(exports, "agentGitIdentitySchema", {
	enumerable: true,
	get: function() {
		return agentGitIdentitySchema;
	}
});
Object.defineProperty(exports, "agentInstructionFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return agentInstructionFilterFieldSchema;
	}
});
Object.defineProperty(exports, "agentsBaseSchema", {
	enumerable: true,
	get: function() {
		return agentsBaseSchema;
	}
});
Object.defineProperty(exports, "agentsEndpointSchema", {
	enumerable: true,
	get: function() {
		return agentsEndpointSchema;
	}
});
Object.defineProperty(exports, "agentsSchema", {
	enumerable: true,
	get: function() {
		return agentsSchema;
	}
});
Object.defineProperty(exports, "agentsSettings", {
	enumerable: true,
	get: function() {
		return agentsSettings;
	}
});
Object.defineProperty(exports, "allowedAddressesSchema", {
	enumerable: true,
	get: function() {
		return allowedAddressesSchema;
	}
});
Object.defineProperty(exports, "alternateName", {
	enumerable: true,
	get: function() {
		return alternateName;
	}
});
Object.defineProperty(exports, "anthropicBaseSchema", {
	enumerable: true,
	get: function() {
		return anthropicBaseSchema;
	}
});
Object.defineProperty(exports, "anthropicEndpointSchema", {
	enumerable: true,
	get: function() {
		return anthropicEndpointSchema;
	}
});
Object.defineProperty(exports, "anthropicSchema", {
	enumerable: true,
	get: function() {
		return anthropicSchema;
	}
});
Object.defineProperty(exports, "anthropicSettings", {
	enumerable: true,
	get: function() {
		return anthropicSettings;
	}
});
Object.defineProperty(exports, "apiBaseUrl", {
	enumerable: true,
	get: function() {
		return apiBaseUrl;
	}
});
Object.defineProperty(exports, "applicationMimeTypes", {
	enumerable: true,
	get: function() {
		return applicationMimeTypes;
	}
});
Object.defineProperty(exports, "askUserQuestionConfigSchema", {
	enumerable: true,
	get: function() {
		return askUserQuestionConfigSchema;
	}
});
Object.defineProperty(exports, "askUserQuestionRetainedAnswersSchema", {
	enumerable: true,
	get: function() {
		return askUserQuestionRetainedAnswersSchema;
	}
});
Object.defineProperty(exports, "assistantEndpointSchema", {
	enumerable: true,
	get: function() {
		return assistantEndpointSchema;
	}
});
Object.defineProperty(exports, "assistantSchema", {
	enumerable: true,
	get: function() {
		return assistantSchema;
	}
});
Object.defineProperty(exports, "audioMimeTypes", {
	enumerable: true,
	get: function() {
		return audioMimeTypes;
	}
});
Object.defineProperty(exports, "authTypeSchema", {
	enumerable: true,
	get: function() {
		return authTypeSchema;
	}
});
Object.defineProperty(exports, "azureBaseSchema", {
	enumerable: true,
	get: function() {
		return azureBaseSchema;
	}
});
Object.defineProperty(exports, "azureEndpointSchema", {
	enumerable: true,
	get: function() {
		return azureEndpointSchema;
	}
});
Object.defineProperty(exports, "azureGroupConfigsSchema", {
	enumerable: true,
	get: function() {
		return azureGroupConfigsSchema;
	}
});
Object.defineProperty(exports, "azureGroupSchema", {
	enumerable: true,
	get: function() {
		return azureGroupSchema;
	}
});
Object.defineProperty(exports, "balanceSchema", {
	enumerable: true,
	get: function() {
		return balanceSchema;
	}
});
Object.defineProperty(exports, "baseEndpointSchema", {
	enumerable: true,
	get: function() {
		return baseEndpointSchema;
	}
});
Object.defineProperty(exports, "bedrockDocumentExtensions", {
	enumerable: true,
	get: function() {
		return bedrockDocumentExtensions;
	}
});
Object.defineProperty(exports, "bedrockDocumentFormats", {
	enumerable: true,
	get: function() {
		return bedrockDocumentFormats;
	}
});
Object.defineProperty(exports, "bedrockDocumentMimeTypes", {
	enumerable: true,
	get: function() {
		return bedrockDocumentMimeTypes;
	}
});
Object.defineProperty(exports, "bedrockEndpointSchema", {
	enumerable: true,
	get: function() {
		return bedrockEndpointSchema;
	}
});
Object.defineProperty(exports, "bedrockGuardrailConfigSchema", {
	enumerable: true,
	get: function() {
		return bedrockGuardrailConfigSchema;
	}
});
Object.defineProperty(exports, "bedrockModels", {
	enumerable: true,
	get: function() {
		return bedrockModels;
	}
});
Object.defineProperty(exports, "buildLoginRedirectUrl", {
	enumerable: true,
	get: function() {
		return buildLoginRedirectUrl;
	}
});
Object.defineProperty(exports, "buildServerNameAliases", {
	enumerable: true,
	get: function() {
		return buildServerNameAliases;
	}
});
Object.defineProperty(exports, "cacheSubsetProviders", {
	enumerable: true,
	get: function() {
		return cacheSubsetProviders;
	}
});
Object.defineProperty(exports, "cancelMCPOAuth", {
	enumerable: true,
	get: function() {
		return cancelMCPOAuth;
	}
});
Object.defineProperty(exports, "checkOpenAIStorage", {
	enumerable: true,
	get: function() {
		return checkOpenAIStorage;
	}
});
Object.defineProperty(exports, "checkpointerSchema", {
	enumerable: true,
	get: function() {
		return checkpointerSchema;
	}
});
Object.defineProperty(exports, "checkpointerTypeSchema", {
	enumerable: true,
	get: function() {
		return checkpointerTypeSchema;
	}
});
Object.defineProperty(exports, "clampSettingRange", {
	enumerable: true,
	get: function() {
		return clampSettingRange;
	}
});
Object.defineProperty(exports, "clearAllConversations", {
	enumerable: true,
	get: function() {
		return clearAllConversations;
	}
});
Object.defineProperty(exports, "cloudfrontConfigSchema", {
	enumerable: true,
	get: function() {
		return cloudfrontConfigSchema;
	}
});
Object.defineProperty(exports, "codeEnvironmentPermissionDecisionSchema", {
	enumerable: true,
	get: function() {
		return codeEnvironmentPermissionDecisionSchema;
	}
});
Object.defineProperty(exports, "codeEnvironmentUserConfigSchema", {
	enumerable: true,
	get: function() {
		return codeEnvironmentUserConfigSchema;
	}
});
Object.defineProperty(exports, "codeEnvironmentUserSettingsSchema", {
	enumerable: true,
	get: function() {
		return codeEnvironmentUserSettingsSchema;
	}
});
Object.defineProperty(exports, "codeInterpreterMimeTypes", {
	enumerable: true,
	get: function() {
		return codeInterpreterMimeTypes;
	}
});
Object.defineProperty(exports, "codeInterpreterMimeTypesList", {
	enumerable: true,
	get: function() {
		return codeInterpreterMimeTypesList;
	}
});
Object.defineProperty(exports, "codeTypeMapping", {
	enumerable: true,
	get: function() {
		return codeTypeMapping;
	}
});
Object.defineProperty(exports, "coerceNumber", {
	enumerable: true,
	get: function() {
		return coerceNumber;
	}
});
Object.defineProperty(exports, "compactAgentsBaseSchema", {
	enumerable: true,
	get: function() {
		return compactAgentsBaseSchema;
	}
});
Object.defineProperty(exports, "compactAgentsSchema", {
	enumerable: true,
	get: function() {
		return compactAgentsSchema;
	}
});
Object.defineProperty(exports, "compactAssistantSchema", {
	enumerable: true,
	get: function() {
		return compactAssistantSchema;
	}
});
Object.defineProperty(exports, "compactGoogleSchema", {
	enumerable: true,
	get: function() {
		return compactGoogleSchema;
	}
});
Object.defineProperty(exports, "configSchema", {
	enumerable: true,
	get: function() {
		return configSchema;
	}
});
Object.defineProperty(exports, "contextPruningSchema", {
	enumerable: true,
	get: function() {
		return contextPruningSchema;
	}
});
Object.defineProperty(exports, "conversationStarterFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return conversationStarterFilterFieldSchema;
	}
});
Object.defineProperty(exports, "conversationTitleFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return conversationTitleFilterFieldSchema;
	}
});
Object.defineProperty(exports, "convertStringsToRegex", {
	enumerable: true,
	get: function() {
		return convertStringsToRegex;
	}
});
Object.defineProperty(exports, "createAgentApiKey", {
	enumerable: true,
	get: function() {
		return createAgentApiKey;
	}
});
Object.defineProperty(exports, "createPreset", {
	enumerable: true,
	get: function() {
		return createPreset;
	}
});
Object.defineProperty(exports, "data_service_exports", {
	enumerable: true,
	get: function() {
		return data_service_exports;
	}
});
Object.defineProperty(exports, "defaultAgentCapabilities", {
	enumerable: true,
	get: function() {
		return defaultAgentCapabilities;
	}
});
Object.defineProperty(exports, "defaultAgentFormValues", {
	enumerable: true,
	get: function() {
		return defaultAgentFormValues;
	}
});
Object.defineProperty(exports, "defaultAssistantFormValues", {
	enumerable: true,
	get: function() {
		return defaultAssistantFormValues;
	}
});
Object.defineProperty(exports, "defaultAssistantsVersion", {
	enumerable: true,
	get: function() {
		return defaultAssistantsVersion;
	}
});
Object.defineProperty(exports, "defaultEndpoints", {
	enumerable: true,
	get: function() {
		return defaultEndpoints;
	}
});
Object.defineProperty(exports, "defaultLLMDeliveryPathSchema", {
	enumerable: true,
	get: function() {
		return defaultLLMDeliveryPathSchema;
	}
});
Object.defineProperty(exports, "defaultModels", {
	enumerable: true,
	get: function() {
		return defaultModels;
	}
});
Object.defineProperty(exports, "defaultOCRMimeTypes", {
	enumerable: true,
	get: function() {
		return defaultOCRMimeTypes;
	}
});
Object.defineProperty(exports, "defaultOrderQuery", {
	enumerable: true,
	get: function() {
		return defaultOrderQuery;
	}
});
Object.defineProperty(exports, "defaultRetrievalModels", {
	enumerable: true,
	get: function() {
		return defaultRetrievalModels;
	}
});
Object.defineProperty(exports, "defaultSTTMimeTypes", {
	enumerable: true,
	get: function() {
		return defaultSTTMimeTypes;
	}
});
Object.defineProperty(exports, "defaultSocialLogins", {
	enumerable: true,
	get: function() {
		return defaultSocialLogins;
	}
});
Object.defineProperty(exports, "defaultTextMimeTypes", {
	enumerable: true,
	get: function() {
		return defaultTextMimeTypes;
	}
});
Object.defineProperty(exports, "deleteAgentApiKey", {
	enumerable: true,
	get: function() {
		return deleteAgentApiKey;
	}
});
Object.defineProperty(exports, "deletePreset", {
	enumerable: true,
	get: function() {
		return deletePreset;
	}
});
Object.defineProperty(exports, "documentParserMimeTypes", {
	enumerable: true,
	get: function() {
		return documentParserMimeTypes;
	}
});
Object.defineProperty(exports, "documentSupportedProviders", {
	enumerable: true,
	get: function() {
		return documentSupportedProviders;
	}
});
Object.defineProperty(exports, "eAnthropicEffortSchema", {
	enumerable: true,
	get: function() {
		return eAnthropicEffortSchema;
	}
});
Object.defineProperty(exports, "eImageDetailSchema", {
	enumerable: true,
	get: function() {
		return eImageDetailSchema;
	}
});
Object.defineProperty(exports, "eModelEndpointSchema", {
	enumerable: true,
	get: function() {
		return eModelEndpointSchema;
	}
});
Object.defineProperty(exports, "eReasoningContextSchema", {
	enumerable: true,
	get: function() {
		return eReasoningContextSchema;
	}
});
Object.defineProperty(exports, "eReasoningEffortSchema", {
	enumerable: true,
	get: function() {
		return eReasoningEffortSchema;
	}
});
Object.defineProperty(exports, "eReasoningModeSchema", {
	enumerable: true,
	get: function() {
		return eReasoningModeSchema;
	}
});
Object.defineProperty(exports, "eReasoningParameterFormatSchema", {
	enumerable: true,
	get: function() {
		return eReasoningParameterFormatSchema;
	}
});
Object.defineProperty(exports, "eReasoningResponseKeySchema", {
	enumerable: true,
	get: function() {
		return eReasoningResponseKeySchema;
	}
});
Object.defineProperty(exports, "eReasoningSummarySchema", {
	enumerable: true,
	get: function() {
		return eReasoningSummarySchema;
	}
});
Object.defineProperty(exports, "eThinkingDisplaySchema", {
	enumerable: true,
	get: function() {
		return eThinkingDisplaySchema;
	}
});
Object.defineProperty(exports, "eThinkingLevelSchema", {
	enumerable: true,
	get: function() {
		return eThinkingLevelSchema;
	}
});
Object.defineProperty(exports, "eVerbositySchema", {
	enumerable: true,
	get: function() {
		return eVerbositySchema;
	}
});
Object.defineProperty(exports, "effectivePermissionsResponseSchema", {
	enumerable: true,
	get: function() {
		return effectivePermissionsResponseSchema;
	}
});
Object.defineProperty(exports, "endpointFileConfigSchema", {
	enumerable: true,
	get: function() {
		return endpointFileConfigSchema;
	}
});
Object.defineProperty(exports, "endpointSchema", {
	enumerable: true,
	get: function() {
		return endpointSchema;
	}
});
Object.defineProperty(exports, "endpointSettings", {
	enumerable: true,
	get: function() {
		return endpointSettings;
	}
});
Object.defineProperty(exports, "envVarRegex", {
	enumerable: true,
	get: function() {
		return envVarRegex;
	}
});
Object.defineProperty(exports, "excelFileTypes", {
	enumerable: true,
	get: function() {
		return excelFileTypes;
	}
});
Object.defineProperty(exports, "excelMimeTypes", {
	enumerable: true,
	get: function() {
		return excelMimeTypes;
	}
});
Object.defineProperty(exports, "excludedKeys", {
	enumerable: true,
	get: function() {
		return excludedKeys;
	}
});
Object.defineProperty(exports, "extendedModelEndpointSchema", {
	enumerable: true,
	get: function() {
		return extendedModelEndpointSchema;
	}
});
Object.defineProperty(exports, "extractEnvVariable", {
	enumerable: true,
	get: function() {
		return extractEnvVariable;
	}
});
Object.defineProperty(exports, "extractVariableName", {
	enumerable: true,
	get: function() {
		return extractVariableName;
	}
});
Object.defineProperty(exports, "feedbackFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return feedbackFilterFieldSchema;
	}
});
Object.defineProperty(exports, "feedbackRatingSchema", {
	enumerable: true,
	get: function() {
		return feedbackRatingSchema;
	}
});
Object.defineProperty(exports, "feedbackSchema", {
	enumerable: true,
	get: function() {
		return feedbackSchema;
	}
});
Object.defineProperty(exports, "feedbackTagKeySchema", {
	enumerable: true,
	get: function() {
		return feedbackTagKeySchema;
	}
});
Object.defineProperty(exports, "fileConfig", {
	enumerable: true,
	get: function() {
		return fileConfig;
	}
});
Object.defineProperty(exports, "fileConfigSchema", {
	enumerable: true,
	get: function() {
		return fileConfigSchema;
	}
});
Object.defineProperty(exports, "fileFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return fileFilterFieldSchema;
	}
});
Object.defineProperty(exports, "fileSourceSchema", {
	enumerable: true,
	get: function() {
		return fileSourceSchema;
	}
});
Object.defineProperty(exports, "fileStorageSchema", {
	enumerable: true,
	get: function() {
		return fileStorageSchema;
	}
});
Object.defineProperty(exports, "fileStrategiesSchema", {
	enumerable: true,
	get: function() {
		return fileStrategiesSchema;
	}
});
Object.defineProperty(exports, "filterPiiActionSchema", {
	enumerable: true,
	get: function() {
		return filterPiiActionSchema;
	}
});
Object.defineProperty(exports, "filterPiiCustomPatternSchema", {
	enumerable: true,
	get: function() {
		return filterPiiCustomPatternSchema;
	}
});
Object.defineProperty(exports, "filterPiiRegexSchema", {
	enumerable: true,
	get: function() {
		return filterPiiRegexSchema;
	}
});
Object.defineProperty(exports, "filterPiiStarterPatternSchema", {
	enumerable: true,
	get: function() {
		return filterPiiStarterPatternSchema;
	}
});
Object.defineProperty(exports, "filtersConfigSchema", {
	enumerable: true,
	get: function() {
		return filtersConfigSchema;
	}
});
Object.defineProperty(exports, "fullMimeTypesList", {
	enumerable: true,
	get: function() {
		return fullMimeTypesList;
	}
});
Object.defineProperty(exports, "generateDynamicSchema", {
	enumerable: true,
	get: function() {
		return generateDynamicSchema;
	}
});
Object.defineProperty(exports, "generateGoogleSchema", {
	enumerable: true,
	get: function() {
		return generateGoogleSchema;
	}
});
Object.defineProperty(exports, "generateOpenAISchema", {
	enumerable: true,
	get: function() {
		return generateOpenAISchema;
	}
});
Object.defineProperty(exports, "getAccessRoles", {
	enumerable: true,
	get: function() {
		return getAccessRoles;
	}
});
Object.defineProperty(exports, "getAgentApiKeys", {
	enumerable: true,
	get: function() {
		return getAgentApiKeys;
	}
});
Object.defineProperty(exports, "getAllEffectivePermissions", {
	enumerable: true,
	get: function() {
		return getAllEffectivePermissions;
	}
});
Object.defineProperty(exports, "getAllowedCodeApprovalModes", {
	enumerable: true,
	get: function() {
		return getAllowedCodeApprovalModes;
	}
});
Object.defineProperty(exports, "getAvailablePlugins", {
	enumerable: true,
	get: function() {
		return getAvailablePlugins;
	}
});
Object.defineProperty(exports, "getConfigDefaults", {
	enumerable: true,
	get: function() {
		return getConfigDefaults;
	}
});
Object.defineProperty(exports, "getConfiguredMimeAccept", {
	enumerable: true,
	get: function() {
		return getConfiguredMimeAccept;
	}
});
Object.defineProperty(exports, "getConversationById", {
	enumerable: true,
	get: function() {
		return getConversationById;
	}
});
Object.defineProperty(exports, "getCustomConfigSpeech", {
	enumerable: true,
	get: function() {
		return getCustomConfigSpeech;
	}
});
Object.defineProperty(exports, "getDefaultParamsEndpoint", {
	enumerable: true,
	get: function() {
		return getDefaultParamsEndpoint;
	}
});
Object.defineProperty(exports, "getDocumentFileExtension", {
	enumerable: true,
	get: function() {
		return getDocumentFileExtension;
	}
});
Object.defineProperty(exports, "getEffectivePermissions", {
	enumerable: true,
	get: function() {
		return getEffectivePermissions;
	}
});
Object.defineProperty(exports, "getEndpointField", {
	enumerable: true,
	get: function() {
		return getEndpointField;
	}
});
Object.defineProperty(exports, "getEndpointFileConfig", {
	enumerable: true,
	get: function() {
		return getEndpointFileConfig;
	}
});
Object.defineProperty(exports, "getGoogleThinkingBudgetBounds", {
	enumerable: true,
	get: function() {
		return getGoogleThinkingBudgetBounds;
	}
});
Object.defineProperty(exports, "getGoogleThinkingBudgetMax", {
	enumerable: true,
	get: function() {
		return getGoogleThinkingBudgetMax;
	}
});
Object.defineProperty(exports, "getMCPServerConnectionStatus", {
	enumerable: true,
	get: function() {
		return getMCPServerConnectionStatus;
	}
});
Object.defineProperty(exports, "getMaxSubagents", {
	enumerable: true,
	get: function() {
		return getMaxSubagents;
	}
});
Object.defineProperty(exports, "getModelKey", {
	enumerable: true,
	get: function() {
		return getModelKey;
	}
});
Object.defineProperty(exports, "getModels", {
	enumerable: true,
	get: function() {
		return getModels;
	}
});
Object.defineProperty(exports, "getPiiRegexProgramSize", {
	enumerable: true,
	get: function() {
		return getPiiRegexProgramSize;
	}
});
Object.defineProperty(exports, "getRefillEligibilityDate", {
	enumerable: true,
	get: function() {
		return getRefillEligibilityDate;
	}
});
Object.defineProperty(exports, "getResourcePermissions", {
	enumerable: true,
	get: function() {
		return getResourcePermissions;
	}
});
Object.defineProperty(exports, "getResourcePermissionsResponseSchema", {
	enumerable: true,
	get: function() {
		return getResourcePermissionsResponseSchema;
	}
});
Object.defineProperty(exports, "getSchemaDefaults", {
	enumerable: true,
	get: function() {
		return getSchemaDefaults;
	}
});
Object.defineProperty(exports, "getSettingsKeys", {
	enumerable: true,
	get: function() {
		return getSettingsKeys;
	}
});
Object.defineProperty(exports, "getSharedLink", {
	enumerable: true,
	get: function() {
		return getSharedLink;
	}
});
Object.defineProperty(exports, "getSharedMessages", {
	enumerable: true,
	get: function() {
		return getSharedMessages;
	}
});
Object.defineProperty(exports, "getTagByKey", {
	enumerable: true,
	get: function() {
		return getTagByKey;
	}
});
Object.defineProperty(exports, "getTagsForRating", {
	enumerable: true,
	get: function() {
		return getTagsForRating;
	}
});
Object.defineProperty(exports, "getTokenHeader", {
	enumerable: true,
	get: function() {
		return getTokenHeader;
	}
});
Object.defineProperty(exports, "googleBaseSchema", {
	enumerable: true,
	get: function() {
		return googleBaseSchema;
	}
});
Object.defineProperty(exports, "googleGenConfigSchema", {
	enumerable: true,
	get: function() {
		return googleGenConfigSchema;
	}
});
Object.defineProperty(exports, "googleSchema", {
	enumerable: true,
	get: function() {
		return googleSchema;
	}
});
Object.defineProperty(exports, "googleSettings", {
	enumerable: true,
	get: function() {
		return googleSettings;
	}
});
Object.defineProperty(exports, "hasActiveFiltersConfig", {
	enumerable: true,
	get: function() {
		return hasActiveFiltersConfig;
	}
});
Object.defineProperty(exports, "hasActivePiiFields", {
	enumerable: true,
	get: function() {
		return hasActivePiiFields;
	}
});
Object.defineProperty(exports, "hasActivePiiPatterns", {
	enumerable: true,
	get: function() {
		return hasActivePiiPatterns;
	}
});
Object.defineProperty(exports, "hasPermissions", {
	enumerable: true,
	get: function() {
		return hasPermissions;
	}
});
Object.defineProperty(exports, "hasProcessMCPServerConfig", {
	enumerable: true,
	get: function() {
		return hasProcessMCPServerConfig;
	}
});
Object.defineProperty(exports, "imageDetailNumeric", {
	enumerable: true,
	get: function() {
		return imageDetailNumeric;
	}
});
Object.defineProperty(exports, "imageDetailValue", {
	enumerable: true,
	get: function() {
		return imageDetailValue;
	}
});
Object.defineProperty(exports, "imageExtRegex", {
	enumerable: true,
	get: function() {
		return imageExtRegex;
	}
});
Object.defineProperty(exports, "imageGenTools", {
	enumerable: true,
	get: function() {
		return imageGenTools;
	}
});
Object.defineProperty(exports, "imageMimeTypes", {
	enumerable: true,
	get: function() {
		return imageMimeTypes;
	}
});
Object.defineProperty(exports, "imageTypeMapping", {
	enumerable: true,
	get: function() {
		return imageTypeMapping;
	}
});
Object.defineProperty(exports, "inferMimeType", {
	enumerable: true,
	get: function() {
		return inferMimeType;
	}
});
Object.defineProperty(exports, "initialModelsConfig", {
	enumerable: true,
	get: function() {
		return initialModelsConfig;
	}
});
Object.defineProperty(exports, "inputTokensIncludesCache", {
	enumerable: true,
	get: function() {
		return inputTokensIncludesCache;
	}
});
Object.defineProperty(exports, "interfaceSchema", {
	enumerable: true,
	get: function() {
		return interfaceSchema;
	}
});
Object.defineProperty(exports, "isActionTool", {
	enumerable: true,
	get: function() {
		return isActionTool;
	}
});
Object.defineProperty(exports, "isAgentsEndpoint", {
	enumerable: true,
	get: function() {
		return isAgentsEndpoint;
	}
});
Object.defineProperty(exports, "isAnthropicDocumentType", {
	enumerable: true,
	get: function() {
		return isAnthropicDocumentType;
	}
});
Object.defineProperty(exports, "isAnthropicTextDocumentType", {
	enumerable: true,
	get: function() {
		return isAnthropicTextDocumentType;
	}
});
Object.defineProperty(exports, "isAssistantsEndpoint", {
	enumerable: true,
	get: function() {
		return isAssistantsEndpoint;
	}
});
Object.defineProperty(exports, "isBedrockDocumentType", {
	enumerable: true,
	get: function() {
		return isBedrockDocumentType;
	}
});
Object.defineProperty(exports, "isCodeEnvironmentMode", {
	enumerable: true,
	get: function() {
		return isCodeEnvironmentMode;
	}
});
Object.defineProperty(exports, "isCodeWorkspaceEnvironment", {
	enumerable: true,
	get: function() {
		return isCodeWorkspaceEnvironment;
	}
});
Object.defineProperty(exports, "isCodeWorkspaceSelection", {
	enumerable: true,
	get: function() {
		return isCodeWorkspaceSelection;
	}
});
Object.defineProperty(exports, "isCodeWorkspaceSelectionErrorReason", {
	enumerable: true,
	get: function() {
		return isCodeWorkspaceSelectionErrorReason;
	}
});
Object.defineProperty(exports, "isCodeWorkspaceSelections", {
	enumerable: true,
	get: function() {
		return isCodeWorkspaceSelections;
	}
});
Object.defineProperty(exports, "isDocumentSupportedProvider", {
	enumerable: true,
	get: function() {
		return isDocumentSupportedProvider;
	}
});
Object.defineProperty(exports, "isExplicitMimeConfig", {
	enumerable: true,
	get: function() {
		return isExplicitMimeConfig;
	}
});
Object.defineProperty(exports, "isImageVisionTool", {
	enumerable: true,
	get: function() {
		return isImageVisionTool;
	}
});
Object.defineProperty(exports, "isKnownProviderIdentifier", {
	enumerable: true,
	get: function() {
		return isKnownProviderIdentifier;
	}
});
Object.defineProperty(exports, "isMediaSupportedProvider", {
	enumerable: true,
	get: function() {
		return isMediaSupportedProvider;
	}
});
Object.defineProperty(exports, "isMessageFileUpload", {
	enumerable: true,
	get: function() {
		return isMessageFileUpload;
	}
});
Object.defineProperty(exports, "isMythosClassModel", {
	enumerable: true,
	get: function() {
		return isMythosClassModel;
	}
});
Object.defineProperty(exports, "isOpenAILikeProvider", {
	enumerable: true,
	get: function() {
		return isOpenAILikeProvider;
	}
});
Object.defineProperty(exports, "isParamEndpoint", {
	enumerable: true,
	get: function() {
		return isParamEndpoint;
	}
});
Object.defineProperty(exports, "isPermissiveMimeConfig", {
	enumerable: true,
	get: function() {
		return isPermissiveMimeConfig;
	}
});
Object.defineProperty(exports, "isProcessMCPServerConfig", {
	enumerable: true,
	get: function() {
		return isProcessMCPServerConfig;
	}
});
Object.defineProperty(exports, "isProcessMCPServerField", {
	enumerable: true,
	get: function() {
		return isProcessMCPServerField;
	}
});
Object.defineProperty(exports, "isRemoteOidcUrlAllowed", {
	enumerable: true,
	get: function() {
		return isRemoteOidcUrlAllowed;
	}
});
Object.defineProperty(exports, "isResponsesApiUpload", {
	enumerable: true,
	get: function() {
		return isResponsesApiUpload;
	}
});
Object.defineProperty(exports, "isSecureCodeEnvironmentControlURL", {
	enumerable: true,
	get: function() {
		return isSecureCodeEnvironmentControlURL;
	}
});
Object.defineProperty(exports, "isSensitiveEnvVar", {
	enumerable: true,
	get: function() {
		return isSensitiveEnvVar;
	}
});
Object.defineProperty(exports, "isSpeechProviderConfigured", {
	enumerable: true,
	get: function() {
		return isSpeechProviderConfigured;
	}
});
Object.defineProperty(exports, "isUUID", {
	enumerable: true,
	get: function() {
		return isUUID;
	}
});
Object.defineProperty(exports, "langfuseConfigSchema", {
	enumerable: true,
	get: function() {
		return langfuseConfigSchema;
	}
});
Object.defineProperty(exports, "langfuseTraceConfigSchema", {
	enumerable: true,
	get: function() {
		return langfuseTraceConfigSchema;
	}
});
Object.defineProperty(exports, "listConfiguredSpeechProviders", {
	enumerable: true,
	get: function() {
		return listConfiguredSpeechProviders;
	}
});
Object.defineProperty(exports, "loginPage", {
	enumerable: true,
	get: function() {
		return loginPage;
	}
});
Object.defineProperty(exports, "materializeModelSpecEndpoints", {
	enumerable: true,
	get: function() {
		return materializeModelSpecEndpoints;
	}
});
Object.defineProperty(exports, "mbToBytes", {
	enumerable: true,
	get: function() {
		return mbToBytes;
	}
});
Object.defineProperty(exports, "mcpRefreshDefaults", {
	enumerable: true,
	get: function() {
		return mcpRefreshDefaults;
	}
});
Object.defineProperty(exports, "mediaSupportedProviders", {
	enumerable: true,
	get: function() {
		return mediaSupportedProviders;
	}
});
Object.defineProperty(exports, "megabyte", {
	enumerable: true,
	get: function() {
		return megabyte;
	}
});
Object.defineProperty(exports, "memoryFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return memoryFilterFieldSchema;
	}
});
Object.defineProperty(exports, "memorySchema", {
	enumerable: true,
	get: function() {
		return memorySchema;
	}
});
Object.defineProperty(exports, "mergeFileConfig", {
	enumerable: true,
	get: function() {
		return mergeFileConfig;
	}
});
Object.defineProperty(exports, "messageFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return messageFilterFieldSchema;
	}
});
Object.defineProperty(exports, "messageFilterPiiSchema", {
	enumerable: true,
	get: function() {
		return messageFilterPiiSchema;
	}
});
Object.defineProperty(exports, "messageFilterSchema", {
	enumerable: true,
	get: function() {
		return messageFilterSchema;
	}
});
Object.defineProperty(exports, "mimeTypeAliases", {
	enumerable: true,
	get: function() {
		return mimeTypeAliases;
	}
});
Object.defineProperty(exports, "modelConfigSchema", {
	enumerable: true,
	get: function() {
		return modelConfigSchema;
	}
});
Object.defineProperty(exports, "modelParameterFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return modelParameterFilterFieldSchema;
	}
});
Object.defineProperty(exports, "modelSpecSubagentsSchema", {
	enumerable: true,
	get: function() {
		return modelSpecSubagentsSchema;
	}
});
Object.defineProperty(exports, "modularEndpoints", {
	enumerable: true,
	get: function() {
		return modularEndpoints;
	}
});
Object.defineProperty(exports, "normalizeEndpointName", {
	enumerable: true,
	get: function() {
		return normalizeEndpointName;
	}
});
Object.defineProperty(exports, "normalizeMCPToolKey", {
	enumerable: true,
	get: function() {
		return normalizeMCPToolKey;
	}
});
Object.defineProperty(exports, "normalizeSearxngEngines", {
	enumerable: true,
	get: function() {
		return normalizeSearxngEngines;
	}
});
Object.defineProperty(exports, "normalizeServerName", {
	enumerable: true,
	get: function() {
		return normalizeServerName;
	}
});
Object.defineProperty(exports, "ocrSchema", {
	enumerable: true,
	get: function() {
		return ocrSchema;
	}
});
Object.defineProperty(exports, "openAIBaseSchema", {
	enumerable: true,
	get: function() {
		return openAIBaseSchema;
	}
});
Object.defineProperty(exports, "openAISchema", {
	enumerable: true,
	get: function() {
		return openAISchema;
	}
});
Object.defineProperty(exports, "openAISettings", {
	enumerable: true,
	get: function() {
		return openAISettings;
	}
});
Object.defineProperty(exports, "openIdDiscoverySchema", {
	enumerable: true,
	get: function() {
		return openIdDiscoverySchema;
	}
});
Object.defineProperty(exports, "openRouterSchema", {
	enumerable: true,
	get: function() {
		return openRouterSchema;
	}
});
Object.defineProperty(exports, "paramDefinitionSchema", {
	enumerable: true,
	get: function() {
		return paramDefinitionSchema;
	}
});
Object.defineProperty(exports, "paramEndpoints", {
	enumerable: true,
	get: function() {
		return paramEndpoints;
	}
});
Object.defineProperty(exports, "permBitsToAccessLevel", {
	enumerable: true,
	get: function() {
		return permBitsToAccessLevel;
	}
});
Object.defineProperty(exports, "permissionEntrySchema", {
	enumerable: true,
	get: function() {
		return permissionEntrySchema;
	}
});
Object.defineProperty(exports, "principalSchema", {
	enumerable: true,
	get: function() {
		return principalSchema;
	}
});
Object.defineProperty(exports, "promptFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return promptFilterFieldSchema;
	}
});
Object.defineProperty(exports, "providerEndpointMap", {
	enumerable: true,
	get: function() {
		return providerEndpointMap;
	}
});
Object.defineProperty(exports, "rateLimitSchema", {
	enumerable: true,
	get: function() {
		return rateLimitSchema;
	}
});
Object.defineProperty(exports, "register", {
	enumerable: true,
	get: function() {
		return register;
	}
});
Object.defineProperty(exports, "registerPage", {
	enumerable: true,
	get: function() {
		return registerPage;
	}
});
Object.defineProperty(exports, "reinitializeMCPServer", {
	enumerable: true,
	get: function() {
		return reinitializeMCPServer;
	}
});
Object.defineProperty(exports, "removeNullishValues", {
	enumerable: true,
	get: function() {
		return removeNullishValues;
	}
});
Object.defineProperty(exports, "requestPasswordReset", {
	enumerable: true,
	get: function() {
		return requestPasswordReset;
	}
});
Object.defineProperty(exports, "request_default", {
	enumerable: true,
	get: function() {
		return request_default;
	}
});
Object.defineProperty(exports, "resetPassword", {
	enumerable: true,
	get: function() {
		return resetPassword;
	}
});
Object.defineProperty(exports, "resolveAgentSkillsScope", {
	enumerable: true,
	get: function() {
		return resolveAgentSkillsScope;
	}
});
Object.defineProperty(exports, "resolveAllowedStatefulCodeEnvironments", {
	enumerable: true,
	get: function() {
		return resolveAllowedStatefulCodeEnvironments;
	}
});
Object.defineProperty(exports, "resolveCodeApprovalMode", {
	enumerable: true,
	get: function() {
		return resolveCodeApprovalMode;
	}
});
Object.defineProperty(exports, "resolveCodePermissionDecision", {
	enumerable: true,
	get: function() {
		return resolveCodePermissionDecision;
	}
});
Object.defineProperty(exports, "resolveEndpointType", {
	enumerable: true,
	get: function() {
		return resolveEndpointType;
	}
});
Object.defineProperty(exports, "resolveModelSpecEndpoint", {
	enumerable: true,
	get: function() {
		return resolveModelSpecEndpoint;
	}
});
Object.defineProperty(exports, "resolveSandboxFilename", {
	enumerable: true,
	get: function() {
		return resolveSandboxFilename;
	}
});
Object.defineProperty(exports, "resolveStatefulCodeEnvironment", {
	enumerable: true,
	get: function() {
		return resolveStatefulCodeEnvironment;
	}
});
Object.defineProperty(exports, "resolveTraceViewerConfig", {
	enumerable: true,
	get: function() {
		return resolveTraceViewerConfig;
	}
});
Object.defineProperty(exports, "resolveUseResponsesApi", {
	enumerable: true,
	get: function() {
		return resolveUseResponsesApi;
	}
});
Object.defineProperty(exports, "resourcePermissionsResponseSchema", {
	enumerable: true,
	get: function() {
		return resourcePermissionsResponseSchema;
	}
});
Object.defineProperty(exports, "retainRecentConfigSchema", {
	enumerable: true,
	get: function() {
		return retainRecentConfigSchema;
	}
});
Object.defineProperty(exports, "retrievalMimeTypes", {
	enumerable: true,
	get: function() {
		return retrievalMimeTypes;
	}
});
Object.defineProperty(exports, "retrievalMimeTypesList", {
	enumerable: true,
	get: function() {
		return retrievalMimeTypesList;
	}
});
Object.defineProperty(exports, "revokeAllUserKeys", {
	enumerable: true,
	get: function() {
		return revokeAllUserKeys;
	}
});
Object.defineProperty(exports, "revokeUserKey", {
	enumerable: true,
	get: function() {
		return revokeUserKey;
	}
});
Object.defineProperty(exports, "searchPrincipals", {
	enumerable: true,
	get: function() {
		return searchPrincipals;
	}
});
Object.defineProperty(exports, "setAcceptLanguageHeader", {
	enumerable: true,
	get: function() {
		return setAcceptLanguageHeader;
	}
});
Object.defineProperty(exports, "setFileConfigRegexCompiler", {
	enumerable: true,
	get: function() {
		return setFileConfigRegexCompiler;
	}
});
Object.defineProperty(exports, "setMaxSubagents", {
	enumerable: true,
	get: function() {
		return setMaxSubagents;
	}
});
Object.defineProperty(exports, "setMessageFilterRegexValidator", {
	enumerable: true,
	get: function() {
		return setMessageFilterRegexValidator;
	}
});
Object.defineProperty(exports, "setTokenHeader", {
	enumerable: true,
	get: function() {
		return setTokenHeader;
	}
});
Object.defineProperty(exports, "sharedFileDownload", {
	enumerable: true,
	get: function() {
		return sharedFileDownload;
	}
});
Object.defineProperty(exports, "skillFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return skillFilterFieldSchema;
	}
});
Object.defineProperty(exports, "skillSyncConfigSchema", {
	enumerable: true,
	get: function() {
		return skillSyncConfigSchema;
	}
});
Object.defineProperty(exports, "skillSyncGitHubSourceSchema", {
	enumerable: true,
	get: function() {
		return skillSyncGitHubSourceSchema;
	}
});
Object.defineProperty(exports, "specialVariables", {
	enumerable: true,
	get: function() {
		return specialVariables;
	}
});
Object.defineProperty(exports, "specsConfigSchema", {
	enumerable: true,
	get: function() {
		return specsConfigSchema;
	}
});
Object.defineProperty(exports, "splitMCPToolKey", {
	enumerable: true,
	get: function() {
		return splitMCPToolKey;
	}
});
Object.defineProperty(exports, "splitToolCallName", {
	enumerable: true,
	get: function() {
		return splitToolCallName;
	}
});
Object.defineProperty(exports, "stripServerNamePrefix", {
	enumerable: true,
	get: function() {
		return stripServerNamePrefix;
	}
});
Object.defineProperty(exports, "stripServerNamePrefixes", {
	enumerable: true,
	get: function() {
		return stripServerNamePrefixes;
	}
});
Object.defineProperty(exports, "subagentThreadLineageSchema", {
	enumerable: true,
	get: function() {
		return subagentThreadLineageSchema;
	}
});
Object.defineProperty(exports, "summarizationConfigSchema", {
	enumerable: true,
	get: function() {
		return summarizationConfigSchema;
	}
});
Object.defineProperty(exports, "summarizationTriggerSchema", {
	enumerable: true,
	get: function() {
		return summarizationTriggerSchema;
	}
});
Object.defineProperty(exports, "supportedMimeTypes", {
	enumerable: true,
	get: function() {
		return supportedMimeTypes;
	}
});
Object.defineProperty(exports, "supportsBalanceCheck", {
	enumerable: true,
	get: function() {
		return supportsBalanceCheck;
	}
});
Object.defineProperty(exports, "supportsFiles", {
	enumerable: true,
	get: function() {
		return supportsFiles;
	}
});
Object.defineProperty(exports, "tBannerSchema", {
	enumerable: true,
	get: function() {
		return tBannerSchema;
	}
});
Object.defineProperty(exports, "tConversationSchema", {
	enumerable: true,
	get: function() {
		return tConversationSchema;
	}
});
Object.defineProperty(exports, "tConversationTagSchema", {
	enumerable: true,
	get: function() {
		return tConversationTagSchema;
	}
});
Object.defineProperty(exports, "tConvoUpdateSchema", {
	enumerable: true,
	get: function() {
		return tConvoUpdateSchema;
	}
});
Object.defineProperty(exports, "tExampleSchema", {
	enumerable: true,
	get: function() {
		return tExampleSchema;
	}
});
Object.defineProperty(exports, "tMessageSchema", {
	enumerable: true,
	get: function() {
		return tMessageSchema;
	}
});
Object.defineProperty(exports, "tModelSpecPresetSchema", {
	enumerable: true,
	get: function() {
		return tModelSpecPresetSchema;
	}
});
Object.defineProperty(exports, "tModelSpecSchema", {
	enumerable: true,
	get: function() {
		return tModelSpecSchema;
	}
});
Object.defineProperty(exports, "tPluginAuthConfigSchema", {
	enumerable: true,
	get: function() {
		return tPluginAuthConfigSchema;
	}
});
Object.defineProperty(exports, "tPluginSchema", {
	enumerable: true,
	get: function() {
		return tPluginSchema;
	}
});
Object.defineProperty(exports, "tPresetSchema", {
	enumerable: true,
	get: function() {
		return tPresetSchema;
	}
});
Object.defineProperty(exports, "tQueryParamsSchema", {
	enumerable: true,
	get: function() {
		return tQueryParamsSchema;
	}
});
Object.defineProperty(exports, "tSharedLinkSchema", {
	enumerable: true,
	get: function() {
		return tSharedLinkSchema;
	}
});
Object.defineProperty(exports, "textMimeTypes", {
	enumerable: true,
	get: function() {
		return textMimeTypes;
	}
});
Object.defineProperty(exports, "toMinimalFeedback", {
	enumerable: true,
	get: function() {
		return toMinimalFeedback;
	}
});
Object.defineProperty(exports, "toolApprovalHookConfigSchema", {
	enumerable: true,
	get: function() {
		return toolApprovalHookConfigSchema;
	}
});
Object.defineProperty(exports, "toolApprovalModeSchema", {
	enumerable: true,
	get: function() {
		return toolApprovalModeSchema;
	}
});
Object.defineProperty(exports, "toolApprovalPolicySchema", {
	enumerable: true,
	get: function() {
		return toolApprovalPolicySchema;
	}
});
Object.defineProperty(exports, "toolArgumentFilterFieldSchema", {
	enumerable: true,
	get: function() {
		return toolArgumentFilterFieldSchema;
	}
});
Object.defineProperty(exports, "traceViewerDefaults", {
	enumerable: true,
	get: function() {
		return traceViewerDefaults;
	}
});
Object.defineProperty(exports, "traceViewerLimits", {
	enumerable: true,
	get: function() {
		return traceViewerLimits;
	}
});
Object.defineProperty(exports, "transactionsSchema", {
	enumerable: true,
	get: function() {
		return transactionsSchema;
	}
});
Object.defineProperty(exports, "turnstileOptionsSchema", {
	enumerable: true,
	get: function() {
		return turnstileOptionsSchema;
	}
});
Object.defineProperty(exports, "turnstileSchema", {
	enumerable: true,
	get: function() {
		return turnstileSchema;
	}
});
Object.defineProperty(exports, "unattributedAssistantContentSchema", {
	enumerable: true,
	get: function() {
		return unattributedAssistantContentSchema;
	}
});
Object.defineProperty(exports, "updateFeedback", {
	enumerable: true,
	get: function() {
		return updateFeedback;
	}
});
Object.defineProperty(exports, "updateMessage", {
	enumerable: true,
	get: function() {
		return updateMessage;
	}
});
Object.defineProperty(exports, "updateMessageContent", {
	enumerable: true,
	get: function() {
		return updateMessageContent;
	}
});
Object.defineProperty(exports, "updateResourcePermissions", {
	enumerable: true,
	get: function() {
		return updateResourcePermissions;
	}
});
Object.defineProperty(exports, "updateResourcePermissionsRequestSchema", {
	enumerable: true,
	get: function() {
		return updateResourcePermissionsRequestSchema;
	}
});
Object.defineProperty(exports, "updateResourcePermissionsResponseSchema", {
	enumerable: true,
	get: function() {
		return updateResourcePermissionsResponseSchema;
	}
});
Object.defineProperty(exports, "updateTokenCount", {
	enumerable: true,
	get: function() {
		return updateTokenCount;
	}
});
Object.defineProperty(exports, "updateUserKey", {
	enumerable: true,
	get: function() {
		return updateUserKey;
	}
});
Object.defineProperty(exports, "updateUserPlugins", {
	enumerable: true,
	get: function() {
		return updateUserPlugins;
	}
});
Object.defineProperty(exports, "userKeyQuery", {
	enumerable: true,
	get: function() {
		return userKeyQuery;
	}
});
Object.defineProperty(exports, "userSubmittedMessageFieldPathSchema", {
	enumerable: true,
	get: function() {
		return userSubmittedMessageFieldPathSchema;
	}
});
Object.defineProperty(exports, "validateSettingDefinitions", {
	enumerable: true,
	get: function() {
		return validateSettingDefinitions;
	}
});
Object.defineProperty(exports, "validateVisionModel", {
	enumerable: true,
	get: function() {
		return validateVisionModel;
	}
});
Object.defineProperty(exports, "vertexAISchema", {
	enumerable: true,
	get: function() {
		return vertexAISchema;
	}
});
Object.defineProperty(exports, "vertexModelConfigSchema", {
	enumerable: true,
	get: function() {
		return vertexModelConfigSchema;
	}
});
Object.defineProperty(exports, "videoMimeTypes", {
	enumerable: true,
	get: function() {
		return videoMimeTypes;
	}
});
Object.defineProperty(exports, "visionModels", {
	enumerable: true,
	get: function() {
		return visionModels;
	}
});
Object.defineProperty(exports, "webSearchSchema", {
	enumerable: true,
	get: function() {
		return webSearchSchema;
	}
});

//# sourceMappingURL=data-service-JEzr78Li.js.map