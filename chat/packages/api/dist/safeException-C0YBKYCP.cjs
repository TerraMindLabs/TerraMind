let librechat_data_provider = require("librechat-data-provider");
let _librechat_data_schemas = require("@librechat/data-schemas");
let express = require("express");
let crypto = require("crypto");
let prom_client = require("prom-client");
let async_hooks = require("async_hooks");
//#region src/agents/phases.ts
const agentStartupMilestones = [
	"request_admitted",
	"job_created",
	"ack_sent",
	"conversation_resolved",
	"metadata_persisted",
	"client_initialized",
	"history_loaded",
	"messages_built",
	"run_input_prepared",
	"run_created",
	"stream_processing_started",
	"request_message_queued",
	"first_response_event_queued",
	"first_content_delta_queued"
];
const agentStartupResults = [
	"content_queued",
	"completed_without_delta",
	"deduplicated",
	"rejected",
	"paused",
	"replaced",
	"aborted",
	"error"
];
//#endregion
//#region src/app/metrics.ts
const PATH_NORMALIZATIONS = [
	[/^\/api\/agents\/chat\/stream\/[^/]+(?=\/|$)/, "/api/agents/chat/stream/#id"],
	[/^\/api\/agents\/chat\/status\/[^/]+(?=\/|$)/, "/api/agents/chat/status/#id"],
	[/^\/api\/files\/code\/download\/[^/]+\/[^/]+(?=\/|$)/, "/api/files/code/download/#id/#id"],
	[/^\/api\/files\/download-url\/[^/]+\/[^/]+(?=\/|$)/, "/api/files/download-url/#id/#id"],
	[/^\/api\/files\/download\/[^/]+\/[^/]+(?=\/|$)/, "/api/files/download/#id/#id"],
	[/^\/api\/files\/[^/]+\/preview(?=\/|$)/, "/api/files/#id/preview"],
	[/^\/api\/skills\/[^/]+\/files(?:\/.*)?(?=\/|$)/, "/api/skills/#id/files"],
	[/^\/api\/messages\/artifact\/[^/]+(?=\/|$)/, "/api/messages/artifact/#id"],
	[/^\/api\/messages\/[^/]+\/[^/]+(?=\/|$)/, "/api/messages/#id/#id"],
	[/^\/api\/convos\/[^/]+\/messages\/[^/]+(?=\/|$)/, "/api/convos/#id/messages/#id"],
	[/^\/api\/messages\/[^/]+(?=\/|$)/, "/api/messages/#id"],
	[/^\/api\/convos\/[^/]+(?=\/|$)/, "/api/convos/#id"],
	[/^\/api\/files\/[^/]+(?=\/|$)/, "/api/files/#id"],
	[/^\/api\/agents\/[^/]+(?=\/|$)/, "/api/agents/#id"],
	[/^\/api\/assistants\/[^/]+(?=\/|$)/, "/api/assistants/#id"],
	[/^\/api\/share\/[^/]+(?=\/|$)/, "/api/share/#token"],
	[/^\/share\/[^/]+(?=\/|$)/, "/share/#id"],
	[/^\/api\/(tags|tools|runs|sessions)\/[0-9a-f]{24}(?=\/|$)/i, "/api/$1/#id"],
	[/^\/api\/(tools|sessions)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i, "/api/$1/#id"]
];
const STATIC_PATHS = new Set([
	"/",
	"/health",
	"/metrics",
	"/api/auth/login",
	"/api/config",
	"/api/agents/chat/abort",
	"/api/agents/chat/active",
	"/api/agents/v1/chat/completions",
	"/api/agents/v1/responses",
	"/api/files",
	"/api/files/config",
	"/api/files/images",
	"/api/files/images/avatar",
	"/api/files/speech/stt"
]);
const UPLOAD_PATHS = new Set([
	"/api/files",
	"/api/files/images",
	"/api/files/images/avatar",
	"/api/files/speech/stt",
	"/api/skills/#id/files"
]);
const UPLOAD_METHODS = new Set([
	"POST",
	"PUT",
	"PATCH"
]);
const LOW_CARDINALITY_PATHS = [
	/^\/api\/agents\/chat\/stream\/#id$/,
	/^\/api\/agents\/chat\/status\/#id$/,
	/^\/api\/files\/#id\/preview$/,
	/^\/api\/files\/(code\/download|download-url|download)\/#id\/#id$/,
	/^\/api\/skills\/#id\/files$/,
	/^\/api\/messages\/#id$/,
	/^\/api\/messages\/#id\/#id$/,
	/^\/api\/messages\/artifact\/#id$/,
	/^\/api\/convos\/#id$/,
	/^\/api\/convos\/#id\/messages\/#id$/,
	/^\/api\/(files|agents|assistants|tags|tools|runs|sessions)\/#id$/,
	/^\/api\/share\/#token$/,
	/^\/share\/#id(?:\/edit)?$/
];
const isLowCardinalityPath = (path) => STATIC_PATHS.has(path) || LOW_CARDINALITY_PATHS.some((pattern) => pattern.test(path));
const normalizeKnownPath = (path) => {
	for (const [pattern, replacement] of PATH_NORMALIZATIONS) if (pattern.test(path)) return path.replace(pattern, replacement);
	return path;
};
const normalizeUnknownPath = (path) => {
	if (STATIC_PATHS.has(path)) return path;
	if (path === "/api" || path.startsWith("/api/")) return "/api/#path";
	if (path === "/images" || path.startsWith("/images/")) return "/images/#path";
	if (path === "/avatars" || path.startsWith("/avatars/")) return "/avatars/#path";
	if (path === "/t" || path.startsWith("/t/")) return "/t/#path";
	return "/#path";
};
const normalizePath = (rawPath) => {
	const [pathWithoutQuery] = rawPath.split("?");
	const path = pathWithoutQuery.startsWith("/") ? pathWithoutQuery : `/${pathWithoutQuery}`;
	const normalized = normalizeKnownPath(path || "/");
	if (isLowCardinalityPath(normalized)) return normalized;
	return normalizeUnknownPath(path);
};
const AGENT_EVENT_ACTOR_STORAGE_METRICS_CACHE_MS = 6e4;
let openIDUserLookupMetrics = { recordLookup: () => void 0 };
function recordOpenIDUserLookup(result, durationSeconds) {
	openIDUserLookupMetrics.recordLookup(result, durationSeconds);
}
let mongooseQueryMetrics = { recordQuery: () => void 0 };
let generationJobMetrics = {
	recordJob: () => void 0,
	setJobsInFlight: () => void 0,
	recordSubscription: () => void 0,
	recordResumePendingEvents: () => void 0,
	recordEarlyBufferOverflow: () => void 0,
	recordRecovery: () => void 0,
	recordAttachment: () => void 0
};
const agentStartupMilestoneSet = new Set(agentStartupMilestones);
const agentStartupResultSet = new Set(agentStartupResults);
let agentStartupMetrics = {
	recordMilestone: () => void 0,
	recordResult: () => void 0
};
let rumProxyMetrics = { recordRequest: () => void 0 };
let shareLinkMetrics = { recordRejection: () => void 0 };
let redisOperationMetrics = { recordOperation: () => void 0 };
let observeLocatorTraversal = () => void 0;
/** Application sink supplied explicitly to content inspection callers. */
function reportLocatorTraversalFailure(failure) {
	_librechat_data_schemas.logger.warn(`[content-filter] Locator traversal incomplete ${JSON.stringify(failure)}`, failure);
	observeLocatorTraversal(failure);
}
const resetMetricRecorders = () => {
	observeLocatorTraversal = () => void 0;
	openIDUserLookupMetrics = { recordLookup: () => void 0 };
	mongooseQueryMetrics = { recordQuery: () => void 0 };
	generationJobMetrics = {
		recordJob: () => void 0,
		setJobsInFlight: () => void 0,
		recordSubscription: () => void 0,
		recordResumePendingEvents: () => void 0,
		recordEarlyBufferOverflow: () => void 0,
		recordRecovery: () => void 0,
		recordAttachment: () => void 0
	};
	agentStartupMetrics = {
		recordMilestone: () => void 0,
		recordResult: () => void 0
	};
	rumProxyMetrics = { recordRequest: () => void 0 };
	shareLinkMetrics = { recordRejection: () => void 0 };
	redisOperationMetrics = { recordOperation: () => void 0 };
	(0, _librechat_data_schemas.setAgentEventActorReceiptMetricObserver)();
};
function recordGenerationJob(store, result) {
	generationJobMetrics.recordJob(store, result);
}
function setGenerationJobsInFlight(store, count) {
	generationJobMetrics.setJobsInFlight(store, count);
}
function recordGenerationStreamSubscription(store, type, result) {
	generationJobMetrics.recordSubscription(store, type, result);
}
function recordGenerationStreamResumePendingEvents(store, count) {
	generationJobMetrics.recordResumePendingEvents(store, count);
}
function recordGenerationStreamEarlyBufferOverflow(store) {
	generationJobMetrics.recordEarlyBufferOverflow(store);
}
function recordGenerationStreamRecovery(store, method, outcome, durationSeconds, reconstructedEvents, reconstructedContent) {
	generationJobMetrics.recordRecovery(store, method, outcome, durationSeconds, reconstructedEvents, reconstructedContent);
}
function recordGenerationStreamAttachment(store, outcome, delaySeconds) {
	generationJobMetrics.recordAttachment(store, outcome, delaySeconds);
}
function recordAgentStartupMilestone(milestone, durationSeconds) {
	if (!agentStartupMilestoneSet.has(milestone) || !Number.isFinite(durationSeconds) || durationSeconds < 0) return;
	agentStartupMetrics.recordMilestone(milestone, durationSeconds);
}
function recordAgentStartupResult(result) {
	if (!agentStartupResultSet.has(result)) return;
	agentStartupMetrics.recordResult(result);
}
function recordRumProxyRequest(endpoint, result) {
	rumProxyMetrics.recordRequest(endpoint, result);
}
function recordShareLinkRejection(operation, code) {
	shareLinkMetrics.recordRejection(operation, code);
}
function recordRedisOperation(client, useCase, operation, status, durationSeconds) {
	redisOperationMetrics.recordOperation(client, useCase, operation, status, durationSeconds);
}
const getElapsedSeconds = (startedAt) => Number(process.hrtime.bigint() - startedAt) / 1e9;
const isMetricsConfigured = () => Boolean(process.env.METRICS_SECRET);
const createUnauthorizedMetricsRouter = () => {
	const metricsRouter = (0, express.Router)();
	metricsRouter.get("/", (_req, res) => {
		res.status(401).end();
	});
	return metricsRouter;
};
const normalizeMongooseLabel = (value) => {
	if (typeof value !== "string" || !value) return "unknown";
	return value.replace(/[^a-zA-Z0-9_:-]/g, "_").slice(0, 64) || "unknown";
};
const getHeader = (headers, name) => {
	const lowerName = name.toLowerCase();
	for (const [key, value] of Object.entries(headers)) if (key.toLowerCase() === lowerName) return value;
};
const headerIncludes = (value, expected) => {
	if (Array.isArray(value)) return value.some((entry) => headerIncludes(entry, expected));
	return typeof value === "string" && value.toLowerCase().includes(expected);
};
const isEventStreamContentType = (value) => headerIncludes(value, "text/event-stream");
const isMultipartContentType = (value) => headerIncludes(value, "multipart/form-data");
const getRequestContentLength = (req) => {
	const contentLength = req.headers["content-length"];
	const rawContentLength = Array.isArray(contentLength) ? contentLength[0] : contentLength;
	const bodyBytes = rawContentLength == null ? NaN : Number(rawContentLength);
	return Number.isFinite(bodyBytes) && bodyBytes >= 0 ? bodyBytes : null;
};
const isUploadRequest = (req, normalizedPath) => {
	if (!UPLOAD_METHODS.has(req.method)) return false;
	if (isMultipartContentType(req.headers["content-type"])) return true;
	return UPLOAD_PATHS.has(normalizedPath);
};
function recordMongooseQuery(model, operation, status, durationSeconds) {
	mongooseQueryMetrics.recordQuery(normalizeMongooseLabel(model), normalizeMongooseLabel(operation), normalizeMongooseLabel(status), durationSeconds);
}
function instrumentMongooseQueryMetrics(mongoose) {
	if (!isMetricsConfigured()) return;
	const instrumented = Symbol.for("librechat.mongooseQueryMetrics.instrumented");
	const queryPrototype = mongoose.Query?.prototype;
	if (!queryPrototype || queryPrototype[instrumented]) return;
	const originalExec = queryPrototype.exec;
	queryPrototype.exec = function instrumentedExec(...args) {
		const startedAt = process.hrtime.bigint();
		const model = normalizeMongooseLabel(this.model?.modelName);
		const operation = normalizeMongooseLabel(this.op);
		let result;
		try {
			result = originalExec.apply(this, args);
		} catch (error) {
			recordMongooseQuery(model, operation, "error", getElapsedSeconds(startedAt));
			throw error;
		}
		return Promise.resolve(result).then((result) => {
			recordMongooseQuery(model, operation, "success", getElapsedSeconds(startedAt));
			return result;
		}, (error) => {
			recordMongooseQuery(model, operation, "error", getElapsedSeconds(startedAt));
			throw error;
		});
	};
	queryPrototype[instrumented] = true;
}
function createMetrics(options = {}) {
	if (!isMetricsConfigured()) {
		resetMetricRecorders();
		return {
			metricsMiddleware: (_req, _res, next) => next(),
			metricsRouter: createUnauthorizedMetricsRouter()
		};
	}
	const registry = new prom_client.Registry();
	(0, prom_client.collectDefaultMetrics)({ register: registry });
	observeLocatorTraversal = () => void 0;
	const locatorTraversalFailuresTotal = new prom_client.Counter({
		name: "content_filter_locator_traversal_failures_total",
		help: "Incomplete resolved file locator traversals",
		labelNames: ["operation", "reason"],
		registers: [registry]
	});
	const locatorTraversalSize = new prom_client.Histogram({
		name: "content_filter_locator_traversal_size",
		help: "Structural counts at an incomplete resolved file locator traversal",
		labelNames: [
			"operation",
			"reason",
			"dimension"
		],
		buckets: [
			0,
			1,
			8,
			24,
			64,
			256,
			1024,
			4096,
			16384
		],
		registers: [registry]
	});
	observeLocatorTraversal = (failure) => {
		const labels = {
			operation: failure.operation,
			reason: failure.reason
		};
		locatorTraversalFailuresTotal.inc(labels);
		for (const dimension of [
			"visitedNodes",
			"depth",
			"messageCount",
			"resolvedFileCount"
		]) locatorTraversalSize.observe({
			...labels,
			dimension
		}, failure[dimension]);
	};
	const httpRequests = new prom_client.Counter({
		name: "http_requests_total",
		help: "Total HTTP requests",
		labelNames: [
			"method",
			"path",
			"status"
		],
		registers: [registry]
	});
	const httpDuration = new prom_client.Histogram({
		name: "http_request_duration_seconds",
		help: "HTTP request latency in seconds",
		labelNames: [
			"method",
			"path",
			"status"
		],
		buckets: [
			.05,
			.1,
			.3,
			.5,
			1,
			2,
			5
		],
		registers: [registry]
	});
	const httpRequestsInFlight = new prom_client.Gauge({
		name: "http_requests_in_flight",
		help: "HTTP requests currently being handled",
		labelNames: ["method", "path"],
		registers: [registry]
	});
	const httpRequestBodyBytes = new prom_client.Histogram({
		name: "http_request_body_bytes",
		help: "HTTP request body size in bytes from the Content-Length header",
		labelNames: ["method", "path"],
		buckets: [
			1e3,
			1e4,
			1e5,
			1e6,
			5e6,
			1e7,
			25e6,
			5e7
		],
		registers: [registry]
	});
	const sseStreams = new prom_client.Counter({
		name: "sse_streams_total",
		help: "Total SSE streams opened",
		labelNames: [
			"method",
			"path",
			"status"
		],
		registers: [registry]
	});
	const sseStreamsInFlight = new prom_client.Gauge({
		name: "sse_streams_in_flight",
		help: "SSE streams currently open",
		labelNames: ["method", "path"],
		registers: [registry]
	});
	const sseStreamDuration = new prom_client.Histogram({
		name: "sse_stream_duration_seconds",
		help: "SSE stream open duration in seconds",
		labelNames: [
			"method",
			"path",
			"status"
		],
		buckets: [
			1,
			5,
			10,
			30,
			60,
			120,
			300,
			600,
			1200,
			1800
		],
		registers: [registry]
	});
	const uploadRequests = new prom_client.Counter({
		name: "upload_requests_total",
		help: "Total upload requests",
		labelNames: [
			"method",
			"path",
			"status"
		],
		registers: [registry]
	});
	const uploadRequestsInFlight = new prom_client.Gauge({
		name: "upload_requests_in_flight",
		help: "Upload requests currently being handled",
		labelNames: ["method", "path"],
		registers: [registry]
	});
	const uploadRequestDuration = new prom_client.Histogram({
		name: "upload_request_duration_seconds",
		help: "Upload request duration in seconds",
		labelNames: [
			"method",
			"path",
			"status"
		],
		buckets: [
			.1,
			.3,
			.5,
			1,
			2,
			5,
			10,
			30,
			60,
			120,
			300
		],
		registers: [registry]
	});
	const uploadBytes = new prom_client.Counter({
		name: "upload_bytes_total",
		help: "Upload request bytes from the Content-Length header",
		labelNames: ["method", "path"],
		registers: [registry]
	});
	const openIDUserLookupTotal = new prom_client.Counter({
		name: "openid_user_lookup_total",
		help: "OpenID user lookup attempts",
		labelNames: ["result"],
		registers: [registry]
	});
	const openIDUserLookupDuration = new prom_client.Histogram({
		name: "openid_user_lookup_duration_seconds",
		help: "OpenID user lookup latency in seconds",
		labelNames: ["result"],
		buckets: [
			.005,
			.01,
			.025,
			.05,
			.1,
			.25,
			.5,
			1,
			2.5,
			5,
			10,
			30,
			60
		],
		registers: [registry]
	});
	openIDUserLookupMetrics = { recordLookup: (result, durationSeconds) => {
		openIDUserLookupTotal.inc({ result });
		openIDUserLookupDuration.observe({ result }, durationSeconds);
	} };
	const mongooseQueries = new prom_client.Counter({
		name: "mongoose_queries_total",
		help: "Mongoose queries by model, operation, and status",
		labelNames: [
			"model",
			"operation",
			"status"
		],
		registers: [registry]
	});
	const mongooseQueryDuration = new prom_client.Histogram({
		name: "mongoose_query_duration_seconds",
		help: "Mongoose query duration in seconds by model, operation, and status",
		labelNames: [
			"model",
			"operation",
			"status"
		],
		buckets: [
			.001,
			.003,
			.005,
			.01,
			.025,
			.05,
			.1,
			.25,
			.5,
			1,
			2.5,
			5,
			10,
			30,
			60
		],
		registers: [registry]
	});
	mongooseQueryMetrics = { recordQuery: (model, operation, status, durationSeconds) => {
		const labels = {
			model,
			operation,
			status
		};
		mongooseQueries.inc(labels);
		mongooseQueryDuration.observe(labels, durationSeconds);
	} };
	const generationJobs = new prom_client.Counter({
		name: "generation_jobs_total",
		help: "Generation jobs by backing store and result",
		labelNames: ["store", "result"],
		registers: [registry]
	});
	const generationJobsInFlight = new prom_client.Gauge({
		name: "generation_jobs_in_flight",
		help: "Generation jobs currently running in this process",
		labelNames: ["store"],
		registers: [registry]
	});
	const generationStreamSubscriptions = new prom_client.Counter({
		name: "generation_stream_subscriptions_total",
		help: "Generation stream subscription attempts by backing store, type, and result",
		labelNames: [
			"store",
			"type",
			"result"
		],
		registers: [registry]
	});
	const generationStreamResumePendingEvents = new prom_client.Counter({
		name: "generation_stream_resume_pending_events_total",
		help: "Pending events delivered while resuming generation streams",
		labelNames: ["store"],
		registers: [registry]
	});
	const generationStreamEarlyBufferOverflows = new prom_client.Counter({
		name: "generation_stream_early_buffer_overflows_total",
		help: "Early event replay buffers discarded after exceeding hard size bounds",
		labelNames: ["store"],
		registers: [registry]
	});
	const generationStreamRecoveries = new prom_client.Counter({
		name: "generation_stream_recoveries_total",
		help: "Early buffer recovery attempts by backing store, source, and outcome",
		labelNames: [
			"store",
			"method",
			"outcome"
		],
		registers: [registry]
	});
	const generationStreamRecoveryDuration = new prom_client.Histogram({
		name: "generation_stream_recovery_duration_seconds",
		help: "Time spent reconstructing an overflowed early generation stream",
		labelNames: [
			"store",
			"method",
			"outcome"
		],
		buckets: [
			.005,
			.01,
			.025,
			.05,
			.1,
			.25,
			.5,
			1,
			2.5,
			5,
			10,
			30
		],
		registers: [registry]
	});
	const generationStreamRecoveryEvents = new prom_client.Histogram({
		name: "generation_stream_recovery_events",
		help: "Event count reconstructed during early buffer recovery",
		labelNames: [
			"store",
			"method",
			"outcome"
		],
		buckets: [
			1,
			10,
			100,
			1e3,
			5e3,
			1e4,
			5e4
		],
		registers: [registry]
	});
	const generationStreamRecoveryContent = new prom_client.Histogram({
		name: "generation_stream_recovery_content_parts",
		help: "Content part count reconstructed during early buffer recovery",
		labelNames: [
			"store",
			"method",
			"outcome"
		],
		buckets: [
			1,
			5,
			10,
			25,
			50,
			100,
			500,
			1e3
		],
		registers: [registry]
	});
	const generationStreamAttachments = new prom_client.Counter({
		name: "generation_stream_attachment_outcomes_total",
		help: "Generation stream attachment lifecycle outcomes",
		labelNames: ["store", "outcome"],
		registers: [registry]
	});
	const generationStreamFirstAttachmentDelay = new prom_client.Histogram({
		name: "generation_stream_first_attachment_delay_seconds",
		help: "Time from generation creation to its first subscriber attachment",
		labelNames: ["store"],
		buckets: [
			.01,
			.025,
			.05,
			.1,
			.25,
			.5,
			1,
			2.5,
			5,
			10,
			30,
			60,
			120,
			300
		],
		registers: [registry]
	});
	const agentStartupMilestoneDuration = new prom_client.Histogram({
		name: "agent_startup_milestone_duration_seconds",
		help: "Cumulative agent chat startup latency from request ingress to each milestone",
		labelNames: ["milestone"],
		buckets: [
			.005,
			.01,
			.025,
			.05,
			.1,
			.25,
			.5,
			1,
			2.5,
			5,
			10,
			30,
			60,
			120,
			300
		],
		registers: [registry]
	});
	const agentStartups = new prom_client.Counter({
		name: "agent_startups_total",
		help: "Agent chat startup attempts by terminal result",
		labelNames: ["result"],
		registers: [registry]
	});
	const rumProxyRequests = new prom_client.Counter({
		name: "rum_proxy_requests_total",
		help: "RUM proxy requests by endpoint and result",
		labelNames: ["endpoint", "result"],
		registers: [registry]
	});
	const shareLinkRejections = new prom_client.Counter({
		name: "share_link_rejections_total",
		help: "Shared link publication rejections by operation and bounded domain code",
		labelNames: ["operation", "code"],
		registers: [registry]
	});
	const redisOperations = new prom_client.Counter({
		name: "redis_operations_total",
		help: "Logical Redis operations by client, use case, operation, and status",
		labelNames: [
			"client",
			"use_case",
			"operation",
			"status"
		],
		registers: [registry]
	});
	const redisOperationDuration = new prom_client.Histogram({
		name: "redis_operation_duration_seconds",
		help: "Logical Redis operation latency in seconds",
		labelNames: [
			"client",
			"use_case",
			"operation",
			"status"
		],
		buckets: [
			5e-4,
			.001,
			.0025,
			.005,
			.01,
			.025,
			.05,
			.1,
			.25,
			.5,
			1,
			2.5,
			5
		],
		registers: [registry]
	});
	const agentEventActorReceiptOperations = new prom_client.Counter({
		name: "agent_event_actor_receipt_operations_total",
		help: "Event actor receipt storage operations by bounded outcome and resolution",
		labelNames: [
			"operation",
			"outcome",
			"resolution"
		],
		registers: [registry]
	});
	const agentEventActorReceiptsRetained = new prom_client.Gauge({
		name: "agent_event_actor_receipts_retained",
		help: "Delivery-owned event actor receipts currently retained for replay",
		labelNames: ["resolution"],
		registers: [registry]
	});
	const agentEventActorReceiptsExpiryEligible = new prom_client.Gauge({
		name: "agent_event_actor_receipts_expiry_eligible",
		help: "Retained event actor receipts whose Mongo TTL deadline has elapsed",
		registers: [registry]
	});
	const agentEventActorReconciliationsPending = new prom_client.Gauge({
		name: "agent_event_actor_reconciliations_pending",
		help: "Active event actor reconciliation markers awaiting a terminal delivery receipt",
		registers: [registry]
	});
	const agentEventActorOldestReconciliationAge = new prom_client.Gauge({
		name: "agent_event_actor_oldest_reconciliation_age_seconds",
		help: "Age in seconds of the oldest active event actor reconciliation marker",
		registers: [registry]
	});
	const agentEventActorDeliveries = new prom_client.Gauge({
		name: "agent_event_actor_deliveries",
		help: "Current retrying and dead delivery rows visible to the receipt ledger",
		labelNames: ["state"],
		registers: [registry]
	});
	(0, _librechat_data_schemas.setAgentEventActorReceiptMetricObserver)(({ operation, outcome, resolution }) => {
		agentEventActorReceiptOperations.inc({
			operation,
			outcome,
			resolution: resolution ?? "none"
		});
	});
	let actorStorageMetricsCache;
	let actorStorageMetricsCollection = null;
	const collectActorStorageMetrics = async () => {
		const now = Date.now();
		if (actorStorageMetricsCache != null && actorStorageMetricsCache.expiresAt > now) return actorStorageMetricsCache.snapshot;
		actorStorageMetricsCollection ??= Promise.resolve(options.collectAgentEventActorStorageMetrics?.()).then((snapshot) => {
			if (snapshot != null) actorStorageMetricsCache = {
				snapshot,
				expiresAt: Date.now() + AGENT_EVENT_ACTOR_STORAGE_METRICS_CACHE_MS
			};
			return snapshot;
		}).finally(() => {
			actorStorageMetricsCollection = null;
		});
		return actorStorageMetricsCollection;
	};
	generationJobMetrics = {
		recordJob: (store, result) => generationJobs.inc({
			store,
			result
		}),
		setJobsInFlight: (store, count) => generationJobsInFlight.set({ store }, count),
		recordSubscription: (store, type, result) => generationStreamSubscriptions.inc({
			store,
			type,
			result
		}),
		recordResumePendingEvents: (store, count) => generationStreamResumePendingEvents.inc({ store }, count),
		recordEarlyBufferOverflow: (store) => generationStreamEarlyBufferOverflows.inc({ store }),
		recordRecovery: (store, method, outcome, durationSeconds, reconstructedEvents, reconstructedContent) => {
			const labels = {
				store,
				method,
				outcome
			};
			generationStreamRecoveries.inc(labels);
			generationStreamRecoveryDuration.observe(labels, durationSeconds);
			generationStreamRecoveryEvents.observe(labels, reconstructedEvents);
			generationStreamRecoveryContent.observe(labels, reconstructedContent);
		},
		recordAttachment: (store, outcome, delaySeconds) => {
			generationStreamAttachments.inc({
				store,
				outcome
			});
			if (outcome === "attached" && delaySeconds != null) generationStreamFirstAttachmentDelay.observe({ store }, delaySeconds);
		}
	};
	agentStartupMetrics = {
		recordMilestone: (milestone, durationSeconds) => agentStartupMilestoneDuration.observe({ milestone }, durationSeconds),
		recordResult: (result) => agentStartups.inc({ result })
	};
	rumProxyMetrics = { recordRequest: (endpoint, result) => rumProxyRequests.inc({
		endpoint,
		result
	}) };
	shareLinkMetrics = { recordRejection: (operation, code) => shareLinkRejections.inc({
		operation,
		code
	}) };
	redisOperationMetrics = { recordOperation: (client, useCase, operation, status, durationSeconds) => {
		const labels = {
			client,
			use_case: useCase,
			operation,
			status
		};
		redisOperations.inc(labels);
		redisOperationDuration.observe(labels, durationSeconds);
	} };
	const metricsMiddleware = (req, res, next) => {
		const end = httpDuration.startTimer();
		const labels = {
			method: req.method,
			path: normalizePath(req.path)
		};
		const uploadTracked = isUploadRequest(req, labels.path);
		const uploadStartedAt = uploadTracked ? process.hrtime.bigint() : null;
		let sseTracked = false;
		let sseStartedAt = null;
		let completed = false;
		const markSSEStream = () => {
			if (completed || res.writableEnded || res.destroyed) return;
			if (sseTracked) return;
			sseTracked = true;
			sseStartedAt = process.hrtime.bigint();
			sseStreamsInFlight.inc(labels);
		};
		const originalSetHeader = res.setHeader;
		res.setHeader = function setHeader(...args) {
			const [name, value] = args;
			const result = originalSetHeader.apply(this, args);
			if (String(name).toLowerCase() === "content-type" && isEventStreamContentType(value)) markSSEStream();
			return result;
		};
		const originalWriteHead = res.writeHead;
		res.writeHead = function writeHead(...args) {
			const [, reasonPhrase, headers] = args;
			if (isEventStreamContentType(getHeader((typeof reasonPhrase === "object" && reasonPhrase != null ? reasonPhrase : headers) ?? {}, "content-type")) || isEventStreamContentType(res.getHeader("content-type"))) markSSEStream();
			return originalWriteHead.apply(this, args);
		};
		httpRequestsInFlight.inc(labels);
		if (uploadTracked) uploadRequestsInFlight.inc(labels);
		const complete = (completedBy) => {
			if (completed) return;
			completed = true;
			const requestLabels = {
				...labels,
				status: completedBy === "close" ? 499 : res.statusCode
			};
			httpRequests.inc(requestLabels);
			end(requestLabels);
			httpRequestsInFlight.dec(labels);
			const bodyBytes = getRequestContentLength(req);
			if (bodyBytes != null) httpRequestBodyBytes.observe(labels, bodyBytes);
			if (sseTracked) {
				sseStreams.inc(requestLabels);
				sseStreamsInFlight.dec(labels);
				if (sseStartedAt) sseStreamDuration.observe(requestLabels, getElapsedSeconds(sseStartedAt));
			}
			if (uploadTracked) {
				uploadRequests.inc(requestLabels);
				uploadRequestsInFlight.dec(labels);
				if (uploadStartedAt) uploadRequestDuration.observe(requestLabels, getElapsedSeconds(uploadStartedAt));
				if (bodyBytes != null) uploadBytes.inc(labels, bodyBytes);
			}
		};
		res.once("finish", () => complete("finish"));
		res.once("close", () => complete("close"));
		next();
	};
	const metricsRouter = (0, express.Router)();
	const metricsHandler = (req, res) => {
		const secret = process.env.METRICS_SECRET;
		const auth = req.headers["authorization"];
		if (!secret || !auth) {
			res.status(401).end();
			return;
		}
		const bearerToken = auth.match(/^bearer\s+(.+)$/i);
		if (!bearerToken) {
			res.status(401).end();
			return;
		}
		const token = bearerToken[1];
		const encode = (s) => new TextEncoder().encode(s);
		const expected = encode(secret);
		const actual = encode(token);
		if (expected.byteLength !== actual.byteLength || !(0, crypto.timingSafeEqual)(expected, actual)) {
			res.status(401).end();
			return;
		}
		Promise.resolve().then(async () => {
			const snapshot = await collectActorStorageMetrics();
			if (snapshot == null) return;
			for (const [resolution, count] of Object.entries(snapshot.retainedByResolution)) agentEventActorReceiptsRetained.set({ resolution }, count);
			agentEventActorReceiptsExpiryEligible.set(snapshot.expiryEligible);
			agentEventActorReconciliationsPending.set(snapshot.pendingReconciliations);
			agentEventActorOldestReconciliationAge.set(snapshot.oldestPendingAgeSeconds);
			agentEventActorDeliveries.set({ state: "retry" }, snapshot.retryDeliveries);
			agentEventActorDeliveries.set({ state: "dead" }, snapshot.deadDeliveries);
		}).then(() => registry.metrics()).then((metrics) => {
			res.set("Content-Type", registry.contentType);
			res.end(metrics);
		}).catch((err) => {
			_librechat_data_schemas.logger.error("[metrics] Failed to collect metrics:", err);
			res.status(500).end();
		});
	};
	metricsRouter.get("/", metricsHandler);
	return {
		metricsMiddleware,
		metricsRouter
	};
}
//#endregion
//#region src/app/shutdown.ts
const SHUTDOWN_TIMEOUT_MS = 6e4;
const SIGNALS = [
	"SIGTERM",
	"SIGINT",
	"SIGQUIT",
	"SIGHUP"
];
const tasks = [];
let nextRegistrationOrder = 0;
let isShuttingDown = false;
let httpServer = null;
let forceExitTimer = null;
let shutdownStartedAt = null;
/**
* Register a cleanup task for graceful shutdown. Post-drain is the default phase.
* Higher-priority tasks run first; tasks at the same priority retain registration order.
* If one throws, subsequent tasks and the final exit are not blocked. Use this instead of
* attaching `process.on('SIGTERM', ...)` handlers directly — multiple competing signal
* handlers race with the HTTP drain because Node dispatches listeners in registration order
* and any one of them can call `process.exit` before the HTTP server has finished closing.
*/
function registerShutdownTask(name, fn, options = {}) {
	const phase = options.phase === "pre-drain" ? "pre-drain" : "post-drain";
	const priority = Number.isFinite(options.priority) ? options.priority ?? 0 : 0;
	tasks.push({
		name,
		fn,
		phase,
		priority,
		registrationOrder: nextRegistrationOrder++
	});
}
/** Whether graceful shutdown has started, for admission paths that must fail closed. */
/**
* Milliseconds left before graceful shutdown force-exits, or `null` when not shutting down.
* Lets a shutdown task spend the budget it actually has instead of guessing at a fixed cutoff.
*/
/**
* Milliseconds since graceful shutdown began, or `null` when not shutting down. For a task whose
* real deadline is imposed from outside this process — a cluster primary that force-exits the
* whole group on its own timer — this is what lets it measure against that deadline instead.
*/
function getShutdownElapsedMs() {
	if (shutdownStartedAt == null) return null;
	return Math.max(0, Date.now() - shutdownStartedAt);
}
function getRemainingShutdownMs() {
	if (shutdownStartedAt == null) return null;
	return Math.max(0, SHUTDOWN_TIMEOUT_MS - (Date.now() - shutdownStartedAt));
}
function isShutdownInProgress() {
	return isShuttingDown;
}
/**
* Wires SIGTERM, SIGINT, SIGQUIT, and SIGHUP to a graceful shutdown
* sequence: initiate HTTP server close to stop accepting new connections,
* run pre-drain tasks while in-flight requests settle, await the HTTP drain,
* run post-drain tasks, then `process.exit(0)`. After
* SHUTDOWN_TIMEOUT_MS the process is force-exited with code 1 — a
* safety net for long-lived connections such as SSE streams that may
* not finish in time.
*/
function setupGracefulShutdown(server) {
	httpServer = server;
	for (const signal of SIGNALS) process.on(signal, () => {
		shutdown(signal);
	});
}
/**
* @internal Reset module state for tests. Not part of the public API.
*/
function __resetShutdownStateForTests() {
	tasks.length = 0;
	nextRegistrationOrder = 0;
	isShuttingDown = false;
	shutdownStartedAt = null;
	httpServer = null;
	/** A drain that never settles leaves this armed. It is `unref`'d, so it does
	*  not hold the process open — but it does fire if anything else keeps the
	*  process alive past the timeout, exiting a suite that had long since moved
	*  on with code 1 and no attributable failure. */
	clearForceExitTimer();
}
async function runShutdownTasks(phase) {
	const orderedTasks = tasks.filter((task) => task.phase === phase).sort((left, right) => right.priority - left.priority || left.registrationOrder - right.registrationOrder);
	let failed = false;
	for (const task of orderedTasks) try {
		_librechat_data_schemas.logger.info(`Running ${phase} shutdown task: ${task.name}`);
		await task.fn();
	} catch (err) {
		failed = true;
		_librechat_data_schemas.logger.error(`Shutdown task "${task.name}" failed:`, err);
	}
	return failed;
}
function clearForceExitTimer() {
	if (forceExitTimer) {
		clearTimeout(forceExitTimer);
		forceExitTimer = null;
	}
}
async function shutdown(signal) {
	if (isShuttingDown) return;
	isShuttingDown = true;
	shutdownStartedAt = Date.now();
	_librechat_data_schemas.logger.info(`Received ${signal}, draining HTTP server...`);
	/** Owned locally so a late `finally` from a superseded drain cannot clear the
	*  safety net belonging to a shutdown that started after it. */
	const forceExit = setTimeout(() => {
		_librechat_data_schemas.logger.warn(`Graceful shutdown exceeded ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`);
		process.exit(1);
	}, SHUTDOWN_TIMEOUT_MS);
	forceExit.unref();
	forceExitTimer = forceExit;
	let exitCode = 0;
	try {
		const serverClosePromise = closeHttpServer().catch((err) => {
			_librechat_data_schemas.logger.error("Error closing HTTP server during graceful shutdown:", err);
			exitCode = 1;
		});
		if (await runShutdownTasks("pre-drain")) exitCode = 1;
		await serverClosePromise;
		if (await runShutdownTasks("post-drain")) exitCode = 1;
	} finally {
		clearTimeout(forceExit);
		if (forceExitTimer === forceExit) forceExitTimer = null;
	}
	_librechat_data_schemas.logger.info("Graceful shutdown complete, exiting");
	process.exit(exitCode);
}
function closeHttpServer() {
	return new Promise((resolve, reject) => {
		if (!httpServer || !httpServer.listening) {
			resolve();
			return;
		}
		httpServer.close((err) => {
			if (!err || err.code === "ERR_SERVER_NOT_RUNNING") {
				resolve();
				return;
			}
			reject(err);
		});
	});
}
//#endregion
//#region src/cache/redisTelemetry.ts
const REDIS_CACHE_METHODS = [
	"clear",
	"delete",
	"deleteMany",
	"get",
	"getMany",
	"getManyRaw",
	"getRaw",
	"has",
	"hasMany",
	"set",
	"setMany"
];
/** Keep this list aligned with direct commands used by instrumented ioredis clients. */
const IOREDIS_COMMANDS = new Set([
	"call",
	"del",
	"eval",
	"evalsha",
	"exists",
	"expire",
	"get",
	"hgetall",
	"incr",
	"lrange",
	"mget",
	"publish",
	"psubscribe",
	"punsubscribe",
	"sadd",
	"scan",
	"scard",
	"set",
	"smembers",
	"srem",
	"subscribe",
	"unsubscribe",
	"xack",
	"xgroup",
	"xrange",
	"xreadgroup"
]);
const INSTRUMENTED_CACHE = Symbol("librechat.redisTelemetry.instrumentedCache");
const MAX_DETAILED_TRACE_USE_CASES = 10;
const instrumentedClients = /* @__PURE__ */ new WeakMap();
const RedisUseCases = {
	GENERATION_STREAM: "generation_stream",
	LEADER_ELECTION: "leader_election",
	MCP_REGISTRY: "mcp_registry",
	RATE_LIMIT: "rate_limit",
	VIOLATIONS: "violations"
};
const requestTelemetry = new async_hooks.AsyncLocalStorage();
const activeRedisObservation = new async_hooks.AsyncLocalStorage();
const normalizeLabel = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64) || "unknown";
const cacheUseCases = new Set(Object.values(librechat_data_provider.CacheKeys).map((value) => normalizeLabel(value)));
const explicitUseCases = new Set(Object.values(RedisUseCases));
function normalizeRedisUseCase(namespace) {
	const normalized = normalizeLabel(namespace.replace(/:+$/, ""));
	if (cacheUseCases.has(normalized) || explicitUseCases.has(normalized)) return normalized;
	if (normalized.startsWith("mcp_serversregistry")) return RedisUseCases.MCP_REGISTRY;
	if (normalized.startsWith("violations_")) return RedisUseCases.VIOLATIONS;
	return "other";
}
function createRedisRequestTelemetry(span) {
	return {
		calls: 0,
		durationMs: 0,
		ended: false,
		errors: 0,
		maxCallMs: 0,
		operations: /* @__PURE__ */ new Set(),
		span,
		useCases: /* @__PURE__ */ new Map()
	};
}
function runWithRedisRequestTelemetry(telemetry, callback) {
	return requestTelemetry.run(telemetry, callback);
}
const roundedMilliseconds = (value) => Math.round(value * 1e3) / 1e3;
function finishRedisRequestTelemetry(telemetry) {
	if (telemetry.ended) return;
	telemetry.ended = true;
	if (telemetry.calls === 0) return;
	telemetry.span.setAttributes({
		"librechat.redis.calls": telemetry.calls,
		"librechat.redis.duration_ms": roundedMilliseconds(telemetry.durationMs),
		"librechat.redis.errors": telemetry.errors,
		"librechat.redis.max_call_ms": roundedMilliseconds(telemetry.maxCallMs),
		"librechat.redis.operations": [...telemetry.operations].sort(),
		"librechat.redis.use_cases": [...telemetry.useCases.keys()].sort()
	});
	const detailedUseCases = [...telemetry.useCases.entries()].sort(([, left], [, right]) => right.durationMs - left.durationMs).slice(0, MAX_DETAILED_TRACE_USE_CASES);
	for (const [useCase, summary] of detailedUseCases) {
		const prefix = `librechat.redis.${useCase}`;
		telemetry.span.setAttributes({
			[`${prefix}.calls`]: summary.calls,
			[`${prefix}.duration_ms`]: roundedMilliseconds(summary.durationMs),
			[`${prefix}.errors`]: summary.errors,
			[`${prefix}.max_call_ms`]: roundedMilliseconds(summary.maxCallMs)
		});
	}
}
function addRequestObservation(telemetry, useCase, operation, status, durationMs) {
	if (!telemetry || telemetry.ended) return;
	telemetry.calls += 1;
	telemetry.durationMs += durationMs;
	telemetry.maxCallMs = Math.max(telemetry.maxCallMs, durationMs);
	telemetry.operations.add(operation);
	if (status === "error") telemetry.errors += 1;
	const summary = telemetry.useCases.get(useCase) ?? {
		calls: 0,
		durationMs: 0,
		errors: 0,
		maxCallMs: 0
	};
	summary.calls += 1;
	summary.durationMs += durationMs;
	summary.maxCallMs = Math.max(summary.maxCallMs, durationMs);
	if (status === "error") summary.errors += 1;
	telemetry.useCases.set(useCase, summary);
}
async function observeRedisOperation(client, namespace, operationName, operation, isErrorResult) {
	if (activeRedisObservation.getStore()) return await operation();
	const telemetry = requestTelemetry.getStore();
	if ((!telemetry || telemetry.ended) && !isMetricsConfigured()) return await operation();
	const useCase = normalizeRedisUseCase(namespace);
	const redisOperation = normalizeLabel(operationName);
	const startedAt = process.hrtime.bigint();
	let status = "success";
	try {
		const result = await activeRedisObservation.run(true, operation);
		if (isErrorResult?.(result)) status = "error";
		return result;
	} catch (error) {
		status = "error";
		throw error;
	} finally {
		const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
		addRequestObservation(telemetry, useCase, redisOperation, status, durationSeconds * 1e3);
		recordRedisOperation(client, useCase, redisOperation, status, durationSeconds);
	}
}
function instrumentRedisCache(cache, namespace, client = "keyv") {
	const instrumented = cache;
	if (instrumented[INSTRUMENTED_CACHE]) return cache;
	for (const method of REDIS_CACHE_METHODS) {
		const original = instrumented[method];
		if (typeof original !== "function") continue;
		instrumented[method] = (...args) => observeRedisOperation(client, namespace, method, () => Reflect.apply(original, cache, args));
	}
	instrumented[INSTRUMENTED_CACHE] = true;
	return cache;
}
function instrumentPipeline(pipeline, namespace) {
	return new Proxy(pipeline, { get(target, property, receiver) {
		const value = Reflect.get(target, property, receiver);
		if (property !== "exec" || typeof value !== "function") {
			if (typeof value !== "function") return value;
			return (...args) => {
				const result = Reflect.apply(value, target, args);
				return result === target ? receiver : result;
			};
		}
		return (...args) => observeRedisOperation("ioredis", namespace, "pipeline", () => Reflect.apply(value, target, args), pipelineResultHasErrors);
	} });
}
function pipelineResultHasErrors(result) {
	return Array.isArray(result) && result.some((entry) => Array.isArray(entry) && entry.length > 0 && entry[0] != null);
}
function instrumentIORedisClient(client, namespace) {
	const useCase = normalizeRedisUseCase(namespace);
	const existing = instrumentedClients.get(client)?.get(useCase);
	if (existing) return existing;
	const proxy = new Proxy(client, { get(target, property, receiver) {
		const value = Reflect.get(target, property, receiver);
		if (property === "constructor") return value;
		if (typeof property !== "string" || typeof value !== "function") return value;
		if (property === "pipeline" || property === "multi") return (...args) => instrumentPipeline(Reflect.apply(value, target, args), useCase);
		if (!IOREDIS_COMMANDS.has(property)) return (...args) => {
			const result = Reflect.apply(value, target, args);
			return result === target ? receiver : result;
		};
		return (...args) => {
			return observeRedisOperation("ioredis", useCase, property === "call" && typeof args[0] === "string" ? args[0] : property, () => Reflect.apply(value, target, args));
		};
	} });
	const byUseCase = instrumentedClients.get(client) ?? /* @__PURE__ */ new Map();
	byUseCase.set(useCase, proxy);
	instrumentedClients.set(client, byUseCase);
	return proxy;
}
//#endregion
//#region src/telemetry/safeException.ts
const SAFE_EXCEPTION_MESSAGE = "Error details withheld";
const TRUSTED_ERROR_TYPES = new Map([
	[Error.prototype, "Error"],
	[EvalError.prototype, "EvalError"],
	[RangeError.prototype, "RangeError"],
	[ReferenceError.prototype, "ReferenceError"],
	[SyntaxError.prototype, "SyntaxError"],
	[TypeError.prototype, "TypeError"],
	[URIError.prototype, "URIError"]
]);
function getErrorConstructorName(error) {
	try {
		return TRUSTED_ERROR_TYPES.get(Object.getPrototypeOf(error)) ?? "Error";
	} catch {
		return "Error";
	}
}
function getErrorType(error) {
	try {
		if (error instanceof Error) return getErrorConstructorName(error);
	} catch {
		return "object";
	}
	if (error === null) return "null";
	return typeof error;
}
function getSafeSpanException(error) {
	return {
		message: SAFE_EXCEPTION_MESSAGE,
		name: getErrorType(error)
	};
}
//#endregion
Object.defineProperty(exports, "RedisUseCases", {
	enumerable: true,
	get: function() {
		return RedisUseCases;
	}
});
Object.defineProperty(exports, "__resetShutdownStateForTests", {
	enumerable: true,
	get: function() {
		return __resetShutdownStateForTests;
	}
});
Object.defineProperty(exports, "agentStartupMilestones", {
	enumerable: true,
	get: function() {
		return agentStartupMilestones;
	}
});
Object.defineProperty(exports, "agentStartupResults", {
	enumerable: true,
	get: function() {
		return agentStartupResults;
	}
});
Object.defineProperty(exports, "createMetrics", {
	enumerable: true,
	get: function() {
		return createMetrics;
	}
});
Object.defineProperty(exports, "createRedisRequestTelemetry", {
	enumerable: true,
	get: function() {
		return createRedisRequestTelemetry;
	}
});
Object.defineProperty(exports, "finishRedisRequestTelemetry", {
	enumerable: true,
	get: function() {
		return finishRedisRequestTelemetry;
	}
});
Object.defineProperty(exports, "getErrorType", {
	enumerable: true,
	get: function() {
		return getErrorType;
	}
});
Object.defineProperty(exports, "getRemainingShutdownMs", {
	enumerable: true,
	get: function() {
		return getRemainingShutdownMs;
	}
});
Object.defineProperty(exports, "getSafeSpanException", {
	enumerable: true,
	get: function() {
		return getSafeSpanException;
	}
});
Object.defineProperty(exports, "getShutdownElapsedMs", {
	enumerable: true,
	get: function() {
		return getShutdownElapsedMs;
	}
});
Object.defineProperty(exports, "instrumentIORedisClient", {
	enumerable: true,
	get: function() {
		return instrumentIORedisClient;
	}
});
Object.defineProperty(exports, "instrumentMongooseQueryMetrics", {
	enumerable: true,
	get: function() {
		return instrumentMongooseQueryMetrics;
	}
});
Object.defineProperty(exports, "instrumentRedisCache", {
	enumerable: true,
	get: function() {
		return instrumentRedisCache;
	}
});
Object.defineProperty(exports, "isMetricsConfigured", {
	enumerable: true,
	get: function() {
		return isMetricsConfigured;
	}
});
Object.defineProperty(exports, "isShutdownInProgress", {
	enumerable: true,
	get: function() {
		return isShutdownInProgress;
	}
});
Object.defineProperty(exports, "normalizePath", {
	enumerable: true,
	get: function() {
		return normalizePath;
	}
});
Object.defineProperty(exports, "normalizeRedisUseCase", {
	enumerable: true,
	get: function() {
		return normalizeRedisUseCase;
	}
});
Object.defineProperty(exports, "observeRedisOperation", {
	enumerable: true,
	get: function() {
		return observeRedisOperation;
	}
});
Object.defineProperty(exports, "recordAgentStartupMilestone", {
	enumerable: true,
	get: function() {
		return recordAgentStartupMilestone;
	}
});
Object.defineProperty(exports, "recordAgentStartupResult", {
	enumerable: true,
	get: function() {
		return recordAgentStartupResult;
	}
});
Object.defineProperty(exports, "recordGenerationJob", {
	enumerable: true,
	get: function() {
		return recordGenerationJob;
	}
});
Object.defineProperty(exports, "recordGenerationStreamAttachment", {
	enumerable: true,
	get: function() {
		return recordGenerationStreamAttachment;
	}
});
Object.defineProperty(exports, "recordGenerationStreamEarlyBufferOverflow", {
	enumerable: true,
	get: function() {
		return recordGenerationStreamEarlyBufferOverflow;
	}
});
Object.defineProperty(exports, "recordGenerationStreamRecovery", {
	enumerable: true,
	get: function() {
		return recordGenerationStreamRecovery;
	}
});
Object.defineProperty(exports, "recordGenerationStreamResumePendingEvents", {
	enumerable: true,
	get: function() {
		return recordGenerationStreamResumePendingEvents;
	}
});
Object.defineProperty(exports, "recordGenerationStreamSubscription", {
	enumerable: true,
	get: function() {
		return recordGenerationStreamSubscription;
	}
});
Object.defineProperty(exports, "recordMongooseQuery", {
	enumerable: true,
	get: function() {
		return recordMongooseQuery;
	}
});
Object.defineProperty(exports, "recordOpenIDUserLookup", {
	enumerable: true,
	get: function() {
		return recordOpenIDUserLookup;
	}
});
Object.defineProperty(exports, "recordRedisOperation", {
	enumerable: true,
	get: function() {
		return recordRedisOperation;
	}
});
Object.defineProperty(exports, "recordRumProxyRequest", {
	enumerable: true,
	get: function() {
		return recordRumProxyRequest;
	}
});
Object.defineProperty(exports, "recordShareLinkRejection", {
	enumerable: true,
	get: function() {
		return recordShareLinkRejection;
	}
});
Object.defineProperty(exports, "registerShutdownTask", {
	enumerable: true,
	get: function() {
		return registerShutdownTask;
	}
});
Object.defineProperty(exports, "reportLocatorTraversalFailure", {
	enumerable: true,
	get: function() {
		return reportLocatorTraversalFailure;
	}
});
Object.defineProperty(exports, "runWithRedisRequestTelemetry", {
	enumerable: true,
	get: function() {
		return runWithRedisRequestTelemetry;
	}
});
Object.defineProperty(exports, "setGenerationJobsInFlight", {
	enumerable: true,
	get: function() {
		return setGenerationJobsInFlight;
	}
});
Object.defineProperty(exports, "setupGracefulShutdown", {
	enumerable: true,
	get: function() {
		return setupGracefulShutdown;
	}
});

//# sourceMappingURL=safeException-C0YBKYCP.cjs.map