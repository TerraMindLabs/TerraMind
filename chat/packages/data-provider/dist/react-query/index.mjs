import { A as updateResourcePermissions, C as resetPassword, D as updateFeedback, E as searchPrincipals, Ho as isAssistantsEndpoint, M as updateUserKey, N as updateUserPlugins, O as updateMessage, P as userKeyQuery, S as requestPasswordReset, T as revokeUserKey, Un as initialModelsConfig, Z as hasPermissions, _ as getResourcePermissions, b as register, c as getAccessRoles, d as getAvailablePlugins, f as getConversationById, g as getModels, h as getMCPServerConnectionStatus, i as createPreset, j as updateTokenCount, k as updateMessageContent, l as getAgentApiKeys, m as getEffectivePermissions, n as clearAllConversations, o as deleteAgentApiKey, p as getCustomConfigSpeech, r as createAgentApiKey, s as deletePreset, st as defaultOrderQuery, t as cancelMCPOAuth, u as getAllEffectivePermissions, v as getSharedLink, w as revokeAllUserKeys, x as reinitializeMCPServer, y as getSharedMessages } from "../data-service-BzAsUhph.mjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
//#region src/react-query/react-query-service.ts
const useGetSharedMessages = (shareId, config) => {
	return useQuery(["sharedMessages", shareId], () => getSharedMessages(shareId), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useGetSharedLinkQuery = (conversationId, config) => {
	const queryClient = useQueryClient();
	return useQuery(["sharedLinks", conversationId], () => getSharedLink(conversationId), {
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
	return useQuery(["conversation", id], () => getConversationById(id), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useGetConversationByIdMutation = (id) => {
	const queryClient = useQueryClient();
	return useMutation(() => getConversationById(id), { onSuccess: () => {
		queryClient.invalidateQueries(["conversation", id]);
	} });
};
const useUpdateMessageMutation = (id) => {
	const queryClient = useQueryClient();
	return useMutation((payload) => updateMessage(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["messages", id]);
	} });
};
const useUpdateMessageContentMutation = (conversationId) => {
	const queryClient = useQueryClient();
	return useMutation((payload) => updateMessageContent(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["messages", conversationId]);
	} });
};
const useUpdateUserKeysMutation = () => {
	const queryClient = useQueryClient();
	return useMutation((payload) => updateUserKey(payload), { onSuccess: (data, variables) => {
		queryClient.invalidateQueries(["name", variables.name]);
		queryClient.invalidateQueries(["models"]);
		/** token-config is derived from the same per-user model fetch */
		queryClient.invalidateQueries(["tokenConfig"]);
	} });
};
const useClearConversationsMutation = () => {
	const queryClient = useQueryClient();
	return useMutation(() => clearAllConversations(), { onSuccess: () => {
		queryClient.invalidateQueries(["allConversations"]);
		queryClient.invalidateQueries(["pinnedConversations"]);
		queryClient.invalidateQueries(["conversationTags"]);
	} });
};
const useRevokeUserKeyMutation = (name) => {
	const queryClient = useQueryClient();
	return useMutation(() => revokeUserKey(name), { onSuccess: () => {
		queryClient.invalidateQueries(["name", name]);
		queryClient.invalidateQueries(["models"]);
		queryClient.invalidateQueries(["tokenConfig"]);
		if (isAssistantsEndpoint(name)) {
			queryClient.invalidateQueries([
				"assistants",
				name,
				defaultOrderQuery
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
	const queryClient = useQueryClient();
	return useMutation(() => revokeAllUserKeys(), { onSuccess: () => {
		queryClient.invalidateQueries(["name"]);
		queryClient.invalidateQueries(["tokenConfig"]);
		queryClient.invalidateQueries([
			"assistants",
			"assistants",
			defaultOrderQuery
		]);
		queryClient.invalidateQueries([
			"assistants",
			"azureAssistants",
			defaultOrderQuery
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
	return useQuery(["models"], () => getModels(), {
		initialData: initialModelsConfig,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: Infinity,
		...config
	});
};
const useCreatePresetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation((payload) => createPreset(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["presets"]);
	} });
};
const useDeletePresetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation((payload) => deletePreset(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["presets"]);
	} });
};
const useUpdateTokenCountMutation = () => {
	const queryClient = useQueryClient();
	return useMutation(({ text }) => updateTokenCount(text), { onSuccess: () => {
		queryClient.invalidateQueries(["tokenCount"]);
	} });
};
const useRegisterUserMutation = (options) => {
	const queryClient = useQueryClient();
	return useMutation((payload) => register(payload), {
		...options,
		onSuccess: (...args) => {
			queryClient.invalidateQueries(["user"]);
			if (options?.onSuccess) options.onSuccess(...args);
		}
	});
};
const useUserKeyQuery = (name, config) => {
	return useQuery(["name", name], () => {
		if (!name) return Promise.resolve({ expiresAt: "" });
		return userKeyQuery(name);
	}, {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		retry: false,
		...config
	});
};
const useRequestPasswordResetMutation = () => {
	return useMutation((payload) => requestPasswordReset(payload));
};
const useResetPasswordMutation = () => {
	return useMutation((payload) => resetPassword(payload));
};
const useAvailablePluginsQuery = (config) => {
	return useQuery(["availablePlugins"], () => getAvailablePlugins(), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useUpdateUserPluginsMutation = (_options) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...options } = _options ?? {};
	return useMutation((payload) => updateUserPlugins(payload), {
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
	const queryClient = useQueryClient();
	return useMutation((serverName) => reinitializeMCPServer(serverName), { onSuccess: () => {
		queryClient.invalidateQueries(["mcpTools"]);
	} });
};
const useCancelMCPOAuthMutation = () => {
	const queryClient = useQueryClient();
	return useMutation((serverName) => cancelMCPOAuth(serverName), { onSuccess: () => {
		queryClient.invalidateQueries(["mcpConnectionStatus"]);
	} });
};
const useGetCustomConfigSpeechQuery = (config) => {
	return useQuery(["customConfigSpeech"], () => getCustomConfigSpeech(), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useUpdateFeedbackMutation = (conversationId, messageId) => {
	const queryClient = useQueryClient();
	return useMutation((payload) => updateFeedback(conversationId, messageId, payload), { onSuccess: () => {
		queryClient.invalidateQueries(["messages", messageId]);
	} });
};
const useSearchPrincipalsQuery = (params, config) => {
	return useQuery(["principalSearch", params], () => searchPrincipals(params), {
		enabled: !!params.q && params.q.length >= 2,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 3e4,
		...config
	});
};
const useGetAccessRolesQuery = (resourceType, config) => {
	return useQuery(["accessRoles", resourceType], () => getAccessRoles(resourceType), {
		enabled: !!resourceType,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 300 * 1e3,
		...config
	});
};
const useGetResourcePermissionsQuery = (resourceType, resourceId, config) => {
	return useQuery([
		"resourcePermissions",
		resourceType,
		resourceId
	], () => getResourcePermissions(resourceType, resourceId), {
		enabled: !!resourceType && !!resourceId,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 120 * 1e3,
		...config
	});
};
const useUpdateResourcePermissionsMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ resourceType, resourceId, data }) => updateResourcePermissions(resourceType, resourceId, data),
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
	return useQuery({
		queryKey: [
			"effectivePermissions",
			resourceType,
			resourceId
		],
		queryFn: () => getEffectivePermissions(resourceType, resourceId),
		enabled: !!resourceType && !!resourceId,
		refetchOnWindowFocus: false,
		staleTime: 3e4,
		...config
	});
};
const useGetAllEffectivePermissionsQuery = (resourceType, config) => {
	return useQuery({
		queryKey: [
			"effectivePermissions",
			"all",
			resourceType
		],
		queryFn: () => getAllEffectivePermissions(resourceType),
		enabled: !!resourceType,
		refetchOnWindowFocus: false,
		staleTime: 3e4,
		...config
	});
};
const useMCPServerConnectionStatusQuery = (serverName, config) => {
	return useQuery(["mcpConnectionStatus", serverName], () => getMCPServerConnectionStatus(serverName), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: 1e4,
		enabled: !!serverName,
		...config
	});
};
const useGetAgentApiKeysQuery = (config) => {
	return useQuery(["agentApiKeys"], () => getAgentApiKeys(), {
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		...config
	});
};
const useCreateAgentApiKeyMutation = () => {
	const queryClient = useQueryClient();
	return useMutation((payload) => createAgentApiKey(payload), { onSuccess: () => {
		queryClient.invalidateQueries(["agentApiKeys"]);
	} });
};
const useDeleteAgentApiKeyMutation = () => {
	const queryClient = useQueryClient();
	return useMutation((id) => deleteAgentApiKey(id), { onSuccess: () => {
		queryClient.invalidateQueries(["agentApiKeys"]);
	} });
};
//#endregion
export { hasPermissions, useAvailablePluginsQuery, useCancelMCPOAuthMutation, useClearConversationsMutation, useCreateAgentApiKeyMutation, useCreatePresetMutation, useDeleteAgentApiKeyMutation, useDeletePresetMutation, useGetAccessRolesQuery, useGetAgentApiKeysQuery, useGetAllEffectivePermissionsQuery, useGetConversationByIdMutation, useGetConversationByIdQuery, useGetCustomConfigSpeechQuery, useGetEffectivePermissionsQuery, useGetModelsQuery, useGetResourcePermissionsQuery, useGetSharedLinkQuery, useGetSharedMessages, useMCPServerConnectionStatusQuery, useRegisterUserMutation, useReinitializeMCPServerMutation, useRequestPasswordResetMutation, useResetPasswordMutation, useRevokeAllUserKeysMutation, useRevokeUserKeyMutation, useSearchPrincipalsQuery, useUpdateFeedbackMutation, useUpdateMessageContentMutation, useUpdateMessageMutation, useUpdateResourcePermissionsMutation, useUpdateTokenCountMutation, useUpdateUserKeysMutation, useUpdateUserPluginsMutation, useUserKeyQuery };

//# sourceMappingURL=index.mjs.map