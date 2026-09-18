import { ResourceType, TCustomConfig } from "librechat-data-provider";

//#region src/admin/capabilities.d.ts
/**
* The canonical set of base system capabilities.
*
* These are used by the admin panel and TerraMind API to gate access to
* admin features. Config-section-derived capabilities (e.g.
* `manage:configs:endpoints`) are built on top of these where the
* configSchema is available.
*/
declare const SystemCapabilities: {
  readonly ACCESS_ADMIN: "access:admin";
  readonly READ_USERS: "read:users";
  readonly MANAGE_USERS: "manage:users";
  readonly READ_GROUPS: "read:groups";
  readonly MANAGE_GROUPS: "manage:groups";
  readonly READ_ROLES: "read:roles";
  readonly MANAGE_ROLES: "manage:roles";
  readonly READ_CONFIGS: "read:configs";
  readonly MANAGE_CONFIGS: "manage:configs";
  readonly ASSIGN_CONFIGS: "assign:configs";
  readonly READ_USAGE: "read:usage";
  readonly READ_INSIGHTS: "read:insights";
  readonly READ_AGENTS: "read:agents";
  readonly MANAGE_AGENTS: "manage:agents";
  readonly MANAGE_MCP_SERVERS: "manage:mcpservers"; /** Enrolls and revokes deployment-owned Code API workers. */
  readonly MANAGE_CODE_ENVIRONMENTS: "manage:code_environments";
  readonly READ_PROMPTS: "read:prompts";
  readonly MANAGE_PROMPTS: "manage:prompts";
  readonly READ_SKILLS: "read:skills";
  readonly MANAGE_SKILLS: "manage:skills";
  readonly READ_SHARED_LINKS: "read:sharedlinks";
  readonly MANAGE_SHARED_LINKS: "manage:sharedlinks"; /** Reserved — not yet enforced by any middleware. */
  readonly READ_ASSISTANTS: "read:assistants";
  readonly MANAGE_ASSISTANTS: "manage:assistants";
  /**
  * Required to list, view, and CSV-export the SystemGrant audit log. Append-only
  * by design, so there is no MANAGE counterpart — modifying historical entries
  * would defeat the forensic guarantee.
  */
  readonly READ_AUDIT_LOG: "read:audit_log";
};
/** Base capabilities derived from the SystemCapabilities constant. */
type BaseSystemCapability = (typeof SystemCapabilities)[keyof typeof SystemCapabilities];
/** Principal types that can receive config overrides. */
type ConfigAssignTarget = "user" | "group" | "role";
/** Top-level keys of the configSchema from librechat.yaml. */
type ConfigSection = string & keyof TCustomConfig;
/** Section-level config capabilities derived from configSchema keys. */
type ConfigSectionCapability = `manage:configs:${ConfigSection}` | `read:configs:${ConfigSection}`;
/** Principal-scoped config assignment capabilities. */
type ConfigAssignCapability = `assign:configs:${ConfigAssignTarget}`;
/**
* Union of all valid capability strings:
* - Base capabilities from SystemCapabilities
* - Section-level config capabilities (manage:configs:<section>, read:configs:<section>)
* - Config assignment capabilities (assign:configs:<user|group|role>)
*/
type SystemCapability = BaseSystemCapability | ConfigSectionCapability | ConfigAssignCapability;
/** UI grouping of capabilities for the admin panel's capability editor. */
type CapabilityCategory = {
  key: string;
  labelKey: string;
  capabilities: BaseSystemCapability[];
};
/**
* Capabilities that are implied by holding a broader capability.
* e.g. `MANAGE_USERS` implies `READ_USERS`.
*/
declare const CapabilityImplications: Partial<Record<BaseSystemCapability, BaseSystemCapability[]>>;
/**
* Runtime validator for the full `SystemCapability` union:
* base capabilities, section-level config capabilities, and config assignment capabilities.
*/
declare function isValidCapability(value: string): boolean;
/**
* Check whether a set of held capabilities satisfies a required capability,
* accounting for the manage→read implication hierarchy.
*/
declare function hasImpliedCapability(held: string[], required: string): boolean;
/**
* Given a set of directly-held capabilities, compute the full set including
* all implied capabilities.
*/
declare function expandImplications(directCaps: string[]): string[];
/**
* Maps each ACL ResourceType to the SystemCapability that grants
* unrestricted management access. Typed as `Record<ResourceType, …>`
* so adding a new ResourceType variant causes a compile error until a
* capability is assigned here.
*/
declare const ResourceCapabilityMap: Record<ResourceType, SystemCapability>;
/**
* Derives a section-level config management capability from a configSchema key.
* @example configCapability('endpoints') → 'manage:configs:endpoints'
*
* TODO: Section-level config capabilities are scaffolded but not yet active.
* To activate delegated config management:
*  1. Expose POST/DELETE /api/admin/grants endpoints (wiring grantCapability/revokeCapability)
*  2. Seed section-specific grants for delegated admin roles via those endpoints
*  3. Guard config write handlers with hasConfigCapability(user, section)
*/
declare function configCapability(section: ConfigSection): `manage:configs:${ConfigSection}`;
/**
* Derives a section-level config read capability from a configSchema key.
* @example readConfigCapability('endpoints') → 'read:configs:endpoints'
*/
declare function readConfigCapability(section: ConfigSection): `read:configs:${ConfigSection}`;
/** Reserved principalId for the DB base config (overrides YAML defaults). */
declare const BASE_CONFIG_PRINCIPAL_ID = "__base__";
/** Pre-defined UI categories for grouping capabilities in the admin panel. */
declare const CAPABILITY_CATEGORIES: CapabilityCategory[];
//#endregion
export { CapabilityImplications as a, ResourceCapabilityMap as c, configCapability as d, expandImplications as f, readConfigCapability as h, CapabilityCategory as i, SystemCapabilities as l, isValidCapability as m, BaseSystemCapability as n, ConfigAssignTarget as o, hasImpliedCapability as p, CAPABILITY_CATEGORIES as r, ConfigSection as s, BASE_CONFIG_PRINCIPAL_ID as t, SystemCapability as u };
//# sourceMappingURL=capabilities-BX6jBhpR.d.cts.map