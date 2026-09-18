Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_data_service = require("../data-service-JEzr78Li.js");
let _tanstack_react_query = require("@tanstack/react-query");
//#region src/react-query/react-query-service.ts
const useGetSharedMessages = (shareId, config) => {
	return (0, _tanstack_react_query.useQuery)(["sharedMessages", shareId], () => require_data_service.getSharedMessages(shareId), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useGetSharedLinkQuery = (conversationId, config) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useQuery)(["sharedLinks", conversationId], () => require_data_service.getSharedLink(conversationId), {
		enabled: !!conversationId && conversationId !== "new" && conversationId !== "PENDING",
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		onSuccess: (data) => {
			queryClient.setQueryData(["sharedLinks", conversationId], data);
		},
		...config
	});
};
const useGetConversationByIdQuery = (id, config) => {
	return (0, _tanstack_react_query.useQuery)(["conversation", id], () => require_data_service.getConversationById(id), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useGetConversationByIdMutation = (id) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)(() => require_data_service.getConversationById(id), { onSuccess: () => {
		queryClient.invalidateQueries(["conversation", id]);
	} });
};
const useUpdateMessageMutation = (id) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.updateMessage(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["messages", id]);
	} });
};
const useUpdateMessageContentMutation = (conversationId) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.updateMessageContent(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["messages", conversationId]);
	} });
};
const useUpdateUserKeysMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.updateUserKey(payload), { onSuccess: (data, variables) => {
		queryClient.invalidateQueries(["name", variables.name]);
		queryClient.invalidateQueries(["models"]);
		/** token-config is derived from the same per-user model fetch */
		queryClient.invalidateQueries(["tokenConfig"]);
	} });
};
const useClearConversationsMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)(() => require_data_service.clearAllConversations(), { onSuccess: () => {
		queryClient.invalidateQueries(["allConversations"]);
		queryClient.invalidateQueries(["pinnedConversations"]);
		queryClient.invalidateQueries(["conversationTags"]);
	} });
};
const useRevokeUserKeyMutation = (name) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)(() => require_data_service.revokeUserKey(name), { onSuccess: () => {
		queryClient.invalidateQueries(["name", name]);
		queryClient.invalidateQueries(["models"]);
		queryClient.invalidateQueries(["tokenConfig"]);
		if (require_data_service.isAssistantsEndpoint(name)) {
			queryClient.invalidateQueries([
				"assistants",
				name,
				require_data_service.defaultOrderQuery
			]);
			queryClient.invalidateQueries(["assistantDocs"]);
			queryClient.invalidateQueries(["assistants"]);
			queryClient.invalidateQueries(["assistant"]);
			queryClient.invalidateQueries(["mcpTools"]);
			queryClient.invalidateQueries(["actions"]);
			queryClient.invalidateQueries(["tools"]);
		}
	} });
};
const useRevokeAllUserKeysMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)(() => require_data_service.revokeAllUserKeys(), { onSuccess: () => {
		queryClient.invalidateQueries(["name"]);
		queryClient.invalidateQueries(["tokenConfig"]);
		queryClient.invalidateQueries([
			"assistants",
			"assistants",
			require_data_service.defaultOrderQuery
		]);
		queryClient.invalidateQueries([
			"assistants",
			"azureAssistants",
			require_data_service.defaultOrderQuery
		]);
		queryClient.invalidateQueries(["assistantDocs"]);
		queryClient.invalidateQueries(["assistants"]);
		queryClient.invalidateQueries(["assistant"]);
		queryClient.invalidateQueries(["mcpTools"]);
		queryClient.invalidateQueries(["actions"]);
		queryClient.invalidateQueries(["tools"]);
		queryClient.invalidateQueries(["models"]);
	} });
};
const useGetModelsQuery = (config) => {
	return (0, _tanstack_react_query.useQuery)(["models"], () => require_data_service.getModels(), {
		initialData: require_data_service.initialModelsConfig,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: Infinity,
		...config
	});
};
const useCreatePresetMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.createPreset(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["presets"]);
	} });
};
const useDeletePresetMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.deletePreset(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["presets"]);
	} });
};
const useUpdateTokenCountMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)(({ text }) => require_data_service.updateTokenCount(text), { onSuccess: () => {
		queryClient.invalidateQueries(["tokenCount"]);
	} });
};
const useRegisterUserMutation = (options) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.register(payload), {
		...options,
		onSuccess: (...args) => {
			queryClient.invalidateQueries(["user"]);
			if (options?.onSuccess) options.onSuccess(...args);
		}
	});
};
const useUserKeyQuery = (name, config) => {
	return (0, _tanstack_react_query.useQuery)(["name", name], () => {
		if (!name) return Promise.resolve({ expiresAt: "" });
		return require_data_service.userKeyQuery(name);
	}, {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		retry: false,
		...config
	});
};
const useRequestPasswordResetMutation = () => {
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.requestPasswordReset(payload));
};
const useResetPasswordMutation = () => {
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.resetPassword(payload));
};
const useAvailablePluginsQuery = (config) => {
	return (0, _tanstack_react_query.useQuery)(["availablePlugins"], () => require_data_service.getAvailablePlugins(), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useUpdateUserPluginsMutation = (_options) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	const { onSuccess, ...options } = _options ?? {};
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.updateUserPlugins(payload), {
		...options,
		onSuccess: (...args) => {
			queryClient.invalidateQueries(["user"]);
			onSuccess?.(...args);
			if (args[1]?.action === "uninstall" && args[1]?.pluginKey?.startsWith("mcp_")) {
				const serverName = args[1]?.pluginKey?.substring(4);
				queryClient.invalidateQueries(["mcpAuthValues", serverName]);
			}
		}
	});
};
const useReinitializeMCPServerMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((serverName) => require_data_service.reinitializeMCPServer(serverName), { onSuccess: () => {
		queryClient.invalidateQueries(["mcpTools"]);
	} });
};
const useCancelMCPOAuthMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((serverName) => require_data_service.cancelMCPOAuth(serverName), { onSuccess: () => {
		queryClient.invalidateQueries(["mcpConnectionStatus"]);
	} });
};
const useGetCustomConfigSpeechQuery = (config) => {
	return (0, _tanstack_react_query.useQuery)(["customConfigSpeech"], () => require_data_service.getCustomConfigSpeech(), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useUpdateFeedbackMutation = (conversationId, messageId) => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.updateFeedback(conversationId, messageId, payload), { onSuccess: () => {
		queryClient.invalidateQueries(["messages", messageId]);
	} });
};
const useSearchPrincipalsQuery = (params, config) => {
	return (0, _tanstack_react_query.useQuery)(["principalSearch", params], () => require_data_service.searchPrincipals(params), {
		enabled: !!params.q && params.q.length >= 2,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 3e4,
		...config
	});
};
const useGetAccessRolesQuery = (resourceType, config) => {
	return (0, _tanstack_react_query.useQuery)(["accessRoles", resourceType], () => require_data_service.getAccessRoles(resourceType), {
		enabled: !!resourceType,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 300 * 1e3,
		...config
	});
};
const useGetResourcePermissionsQuery = (resourceType, resourceId, config) => {
	return (0, _tanstack_react_query.useQuery)([
		"resourcePermissions",
		resourceType,
		resourceId
	], () => require_data_service.getResourcePermissions(resourceType, resourceId), {
		enabled: !!resourceType && !!resourceId,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 120 * 1e3,
		...config
	});
};
const useUpdateResourcePermissionsMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)({
		mutationFn: ({ resourceType, resourceId, data }) => require_data_service.updateResourcePermissions(resourceType, resourceId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["accessRoles", variables.resourceType] });
			queryClient.invalidateQueries({ queryKey: [
				"resourcePermissions",
				variables.resourceType,
				variables.resourceId
			] });
			queryClient.invalidateQueries({ queryKey: [
				"effectivePermissions",
				variables.resourceType,
				variables.resourceId
			] });
		}
	});
};
const useGetEffectivePermissionsQuery = (resourceType, resourceId, config) => {
	return (0, _tanstack_react_query.useQuery)({
		queryKey: [
			"effectivePermissions",
			resourceType,
			resourceId
		],
		queryFn: () => require_data_service.getEffectivePermissions(resourceType, resourceId),
		enabled: !!resourceType && !!resourceId,
		refetchOnWindowFocus: false,
		staleTime: 3e4,
		...config
	});
};
const useGetAllEffectivePermissionsQuery = (resourceType, config) => {
	return (0, _tanstack_react_query.useQuery)({
		queryKey: [
			"effectivePermissions",
			"all",
			resourceType
		],
		queryFn: () => require_data_service.getAllEffectivePermissions(resourceType),
		enabled: !!resourceType,
		refetchOnWindowFocus: false,
		staleTime: 3e4,
		...config
	});
};
const useMCPServerConnectionStatusQuery = (serverName, config) => {
	return (0, _tanstack_react_query.useQuery)(["mcpConnectionStatus", serverName], () => require_data_service.getMCPServerConnectionStatus(serverName), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 1e4,
		enabled: !!serverName,
		...config
	});
};
const useGetAgentApiKeysQuery = (config) => {
	return (0, _tanstack_react_query.useQuery)(["agentApiKeys"], () => require_data_service.getAgentApiKeys(), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useCreateAgentApiKeyMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((payload) => require_data_service.createAgentApiKey(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["agentApiKeys"]);
	} });
};
const useDeleteAgentApiKeyMutation = () => {
	const queryClient = (0, _tanstack_react_query.useQueryClient)();
	return (0, _tanstack_react_query.useMutation)((id) => require_data_service.deleteAgentApiKey(id), { onSuccess: () => {
		queryClient.invalidateQueries(["agentApiKeys"]);
	} });
};
//#endregion
exports.hasPermissions = require_data_service.hasPermissions;
exports.useAvailablePluginsQuery = useAvailablePluginsQuery;
exports.useCancelMCPOAuthMutation = useCancelMCPOAuthMutation;
exports.useClearConversationsMutation = useClearConversationsMutation;
exports.useCreateAgentApiKeyMutation = useCreateAgentApiKeyMutation;
exports.useCreatePresetMutation = useCreatePresetMutation;
exports.useDeleteAgentApiKeyMutation = useDeleteAgentApiKeyMutation;
exports.useDeletePresetMutation = useDeletePresetMutation;
exports.useGetAccessRolesQuery = useGetAccessRolesQuery;
exports.useGetAgentApiKeysQuery = useGetAgentApiKeysQuery;
exports.useGetAllEffectivePermissionsQuery = useGetAllEffectivePermissionsQuery;
exports.useGetConversationByIdMutation = useGetConversationByIdMutation;
exports.useGetConversationByIdQuery = useGetConversationByIdQuery;
exports.useGetCustomConfigSpeechQuery = useGetCustomConfigSpeechQuery;
exports.useGetEffectivePermissionsQuery = useGetEffectivePermissionsQuery;
exports.useGetModelsQuery = useGetModelsQuery;
exports.useGetResourcePermissionsQuery = useGetResourcePermissionsQuery;
exports.useGetSharedLinkQuery = useGetSharedLinkQuery;
exports.useGetSharedMessages = useGetSharedMessages;
exports.useMCPServerConnectionStatusQuery = useMCPServerConnectionStatusQuery;
exports.useRegisterUserMutation = useRegisterUserMutation;
exports.useReinitializeMCPServerMutation = useReinitializeMCPServerMutation;
exports.useRequestPasswordResetMutation = useRequestPasswordResetMutation;
exports.useResetPasswordMutation = useResetPasswordMutation;
exports.useRevokeAllUserKeysMutation = useRevokeAllUserKeysMutation;
exports.useRevokeUserKeyMutation = useRevokeUserKeyMutation;
exports.useSearchPrincipalsQuery = useSearchPrincipalsQuery;
exports.useUpdateFeedbackMutation = useUpdateFeedbackMutation;
exports.useUpdateMessageContentMutation = useUpdateMessageContentMutation;
exports.useUpdateMessageMutation = useUpdateMessageMutation;
exports.useUpdateResourcePermissionsMutation = useUpdateResourcePermissionsMutation;
exports.useUpdateTokenCountMutation = useUpdateTokenCountMutation;
exports.useUpdateUserKeysMutation = useUpdateUserKeysMutation;
exports.useUpdateUserPluginsMutation = useUpdateUserPluginsMutation;
exports.useUserKeyQuery = useUserKeyQuery;

//# sourceMappingURL=index.js.map