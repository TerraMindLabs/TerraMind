import * as React$1 from "react";
import React, { createContext, forwardRef, isValidElement, memo, startTransition, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CaretSortIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProviderId, apiBaseUrl } from "librechat-data-provider";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as Ariakit from "@ariakit/react";
import { Checkbox as Checkbox$1, Combobox, ComboboxCancel, ComboboxItem, ComboboxList, ComboboxProvider, Select as Select$1, SelectArrow, SelectItem as SelectItem$1, SelectItemCheck, SelectLabel as SelectLabel$1, SelectList, SelectPopover, SelectProvider, useCheckboxStore, useStoreState } from "@ariakit/react";
import { cva } from "class-variance-authority";
import { AlertCircle, AlertTriangle, Check, CheckCircle2, CheckIcon as CheckIcon$1, ChevronDown, ChevronLeft, ChevronRight, ChevronRightIcon, CircleHelpIcon as CircleHelpIcon$1, CircleIcon, Clock, GripVertical, Inbox, Info, InfoIcon, Minus, MoreHorizontal, Search, SearchX, X } from "lucide-react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Slot } from "@radix-ui/react-slot";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { atom, useAtom, useAtomValue } from "jotai";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { matchSorter } from "match-sorter";
import { useTranslation } from "react-i18next";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import RCInputNumber from "rc-input-number";
import { ArrowDown, ArrowDownUp, ArrowUp, Check as Check$1, Contrast, Copy, Eye, EyeOff, Monitor, Moon, Plus, Sun, X as X$1 } from "lucide";
import { MorphIcon } from "morphicons/react";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import ReactTextareaAutosize from "react-textarea-autosize";
import * as RadixToast from "@radix-ui/react-toast";
import DOMPurify from "dompurify";
import { AnimatePresence, motion } from "framer-motion";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { OTPInput, OTPInputContext } from "input-otp";
import { Group, Panel, Separator as Separator$1 } from "react-resizable-panels";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as Select$2 from "@ariakit/react/select";
import * as Combobox$1 from "@ariakit/react/combobox";
import { useVirtualizer } from "@tanstack/react-virtual";
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { animated, useSprings } from "@react-spring/web";
import { atomWithStorage } from "jotai/utils";
import { Label as Label$1, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { SelectRenderer } from "@ariakit/react-components/select/select-renderer";
import { Content, Root, Trigger } from "@radix-ui/react-popover";
//#region src/utils/utils.ts
const cn = (...inputs) => {
	return twMerge(clsx(inputs));
};
//#endregion
//#region src/utils/theme.ts
const applyFontSize = (val) => {
	const root = document.documentElement;
	switch (val.split("-")[1]) {
		case "xs":
			root.style.setProperty("--markdown-font-size", "0.75rem");
			break;
		case "sm":
			root.style.setProperty("--markdown-font-size", "0.875rem");
			break;
		case "base":
			root.style.setProperty("--markdown-font-size", "1rem");
			break;
		case "lg":
			root.style.setProperty("--markdown-font-size", "1.125rem");
			break;
		case "xl":
			root.style.setProperty("--markdown-font-size", "1.25rem");
			break;
	}
};
const getInitialTheme = () => {
	if (typeof window !== "undefined" && window.localStorage) {
		const storedPrefs = window.localStorage.getItem("color-theme");
		if (typeof storedPrefs === "string") return storedPrefs;
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
	}
	return "light";
};
//#endregion
//#region src/utils/composer.ts
/**
* Shared composer-surface appearance: every input surface that should read as
* "the composer" (main chat form, subagent control footer) draws its border,
* background, and text colors from this one semantic decision. Layout, radius,
* padding, and feature-specific overrides stay with each owner.
*/
const composerSurfaceClasses = () => cn("border border-border-light bg-surface-chat text-text-primary transition-all duration-200");
/** Elevation states for the composer surface. `within` is the CSS-only
*  equivalent of the managed focused/blurred pair for surfaces that do not
*  track focus in state. */
const composerSurfaceShadow = {
	focused: "shadow-lg",
	blurred: "shadow-md",
	within: "shadow-md focus-within:shadow-lg"
};
/**
* The composer's submit slot: send, stop, and the during-run send button that
* takes their place while a run generates. One recipe because all three swap
* into the same position and must be indistinguishable in everything but the
* icon they carry.
*
* Wherever touch is reachable it is the row's one 44px target. `size-theme-control` is
* 36px, which a thumb aimed at the bottom corner of a phone clips or misses
* outright, and below `sm` the composer surface runs to the viewport floor by
* design, so the target has to grow upward instead of gaining a band of padding
* beneath it. Centering is `flex` rather than the icon's fit inside
* `p-theme-compact`, which only held while the box was exactly icon-sized.
*/
const composerSubmitClasses = () => cn("flex items-center justify-center", "size-theme-control touch:size-theme-control-touch", "rounded-theme-control-round bg-text-primary p-theme-compact text-text-primary", "outline-offset-4 transition-all duration-theme-normal", "disabled:cursor-not-allowed disabled:text-text-secondary disabled:opacity-10");
/**
* Shared appearance for a labeled control in the composer's action row — the
* capability checkboxes, the MCP selector, the code-approval selector. Border,
* radius, height, spacing and elevation are one decision here so a row of them
* reads as a single set of controls no matter which primitive each is built
* from. Width, responsive label collapsing and selected/open fills stay with
* each owner.
*/
const composerControlClasses = () => cn("group relative inline-flex items-center justify-center gap-theme-compact", "h-theme-control rounded-theme-control-round border border-border-medium", "bg-transparent text-sm font-medium text-text-primary shadow-sm transition-all", "hover:bg-surface-hover hover:shadow-md active:shadow-inner");
//#endregion
//#region src/utils/cloudfront.ts
let cookieRefreshConfig;
let getAuthorizationHeader;
let refreshPromise = null;
let removeImageErrorListener = null;
const retriedImageSources = /* @__PURE__ */ new WeakMap();
const pendingImageRefreshes = /* @__PURE__ */ new WeakMap();
const forwardedImageErrors = /* @__PURE__ */ new WeakSet();
function getRefreshConfig(startupConfig) {
	return startupConfig?.cloudFront?.cookieRefresh ?? cookieRefreshConfig;
}
function getBaseUrl() {
	return typeof window === "undefined" ? "http://localhost" : window.location.origin;
}
function parseUrl(value) {
	try {
		return new URL(value, getBaseUrl());
	} catch {
		return null;
	}
}
function configureCloudFrontCookieRefresh(startupConfig, options = {}) {
	cookieRefreshConfig = startupConfig?.cloudFront?.cookieRefresh;
	getAuthorizationHeader = options.getAuthorizationHeader;
}
function isCloudFrontMediaUrl(url, startupConfig) {
	const config = getRefreshConfig(startupConfig);
	if (!url || !config?.domain) return false;
	const mediaUrl = parseUrl(url);
	const cloudFrontUrl = parseUrl(config.domain);
	return mediaUrl?.origin === cloudFrontUrl?.origin;
}
function withCloudFrontCacheBuster(url) {
	const parsed = parseUrl(url);
	if (!parsed) return url;
	parsed.searchParams.set("_cf_refresh", Date.now().toString());
	return parsed.toString();
}
function getRetryKey(url) {
	const parsed = parseUrl(url);
	if (!parsed) return url;
	parsed.searchParams.delete("_cf_refresh");
	return parsed.toString();
}
function dispatchImageError(img) {
	forwardedImageErrors.add(img);
	img.dispatchEvent(new Event("error"));
}
function getRefreshEndpoint(endpoint) {
	if (/^https?:\/\//i.test(endpoint)) return endpoint;
	const baseUrl = apiBaseUrl();
	if (!baseUrl || endpoint === baseUrl || endpoint.startsWith(`${baseUrl}/`)) return endpoint;
	return `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}
async function postCloudFrontCookieRefresh(endpoint) {
	const authorization = getAuthorizationHeader?.();
	const headers = {
		Accept: "application/json",
		"Content-Type": "application/json"
	};
	if (authorization) headers.Authorization = authorization;
	const response = await fetch(endpoint, {
		method: "POST",
		credentials: "include",
		headers,
		body: "{}"
	});
	if (!response.ok) return false;
	return (await response.json()).ok === true;
}
function refreshCloudFrontCookiesOnce() {
	const config = getRefreshConfig();
	if (!config?.endpoint) return Promise.resolve(false);
	if (refreshPromise) return refreshPromise;
	refreshPromise = postCloudFrontCookieRefresh(getRefreshEndpoint(config.endpoint)).catch(() => false).finally(() => {
		refreshPromise = null;
	});
	return refreshPromise;
}
function installCloudFrontImageRetry(startupConfig, options = {}) {
	configureCloudFrontCookieRefresh(startupConfig, options);
	removeImageErrorListener?.();
	removeImageErrorListener = null;
	const config = getRefreshConfig();
	if (typeof window === "undefined" || !config?.endpoint || !config.domain) return () => void 0;
	const handleImageError = (event) => {
		const img = event.target;
		if (!(img instanceof HTMLImageElement)) return;
		if (forwardedImageErrors.has(img)) {
			forwardedImageErrors.delete(img);
			return;
		}
		const failedSrc = img.currentSrc || img.src || img.getAttribute("src") || "";
		if (!isCloudFrontMediaUrl(failedSrc)) return;
		const retryKey = getRetryKey(failedSrc);
		if (retriedImageSources.get(img) === retryKey) return;
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		if (pendingImageRefreshes.get(img) === retryKey) return;
		pendingImageRefreshes.set(img, retryKey);
		refreshCloudFrontCookiesOnce().then((refreshed) => {
			pendingImageRefreshes.delete(img);
			if (!refreshed || !img.isConnected) {
				dispatchImageError(img);
				return;
			}
			retriedImageSources.set(img, retryKey);
			img.src = withCloudFrontCacheBuster(failedSrc);
		});
	};
	window.addEventListener("error", handleImageError, true);
	const cleanup = () => {
		window.removeEventListener("error", handleImageError, true);
		if (removeImageErrorListener === cleanup) removeImageErrorListener = null;
	};
	removeImageErrorListener = cleanup;
	return cleanup;
}
//#endregion
//#region src/utils/logger.ts
const createLogFunction = (consoleMethod, type) => {
	return (...args) => {};
};
const logger = {
	log: createLogFunction(console.log, "log"),
	dir: createLogFunction(console.dir, "dir"),
	warn: createLogFunction(console.warn, "warn"),
	info: createLogFunction(console.info, "info"),
	error: createLogFunction(console.error, "error"),
	debug: createLogFunction(console.debug, "debug")
};
//#endregion
//#region src/components/Accordion.tsx
const Accordion = AccordionPrimitive.Root;
const AccordionItem = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Item, {
	ref,
	className: cn("border-b", className),
	...props
}));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = React$1.forwardRef(({ className = "", children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, {
	className: "flex",
	children: /* @__PURE__ */ jsxs(AccordionPrimitive.Trigger, {
		ref,
		className: cn("flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", className),
		...props,
		children: [children, /* @__PURE__ */ jsx(ChevronDownIcon, { className: "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200" })]
	})
}));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
const AccordionContent = React$1.forwardRef(({ className = "", children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Content, {
	ref,
	className: "overflow-y-hidden overflow-x-visible text-sm transition-opacity data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
	...props,
	children: /* @__PURE__ */ jsx("div", {
		className: cn("pb-4 pt-0", className),
		children
	})
}));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
//#endregion
//#region src/components/AnimatedTabs.tsx
function usePrevious(value) {
	const ref = useRef(void 0);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref.current;
}
const Tab = forwardRef(function Tab(props, ref) {
	const tabRef = useRef(null);
	useEffect(() => {
		const tabElement = tabRef.current;
		if (!tabElement) return;
		const updateState = () => {
			const isSelected = tabElement.getAttribute("aria-selected") === "true";
			tabElement.setAttribute("data-state", isSelected ? "active" : "inactive");
		};
		updateState();
		const observer = new MutationObserver(updateState);
		observer.observe(tabElement, {
			attributes: true,
			attributeFilter: ["aria-selected"]
		});
		return () => observer.disconnect();
	}, []);
	return /* @__PURE__ */ jsx(Ariakit.Tab, {
		ref: (node) => {
			tabRef.current = node;
			if (typeof ref === "function") ref(node);
			else if (ref) ref.current = node;
		},
		...props,
		className: `animated-tab aria-selected:text-token-text-primary flex select-none items-center justify-center gap-2 whitespace-nowrap border-none text-sm font-medium outline-none transition-colors aria-disabled:opacity-50 ${props.className || ""}`
	});
});
const TabPanel = forwardRef(function TabPanel(props, ref) {
	const tab = Ariakit.useTabContext();
	const previousTabId = usePrevious(Ariakit.useStoreState(tab, "selectedId"));
	const wasOpen = props.tabId && previousTabId === props.tabId;
	return /* @__PURE__ */ jsx(Ariakit.TabPanel, {
		ref,
		...props,
		"data-was-open": wasOpen || void 0,
		className: `animated-tab-panel max-w-full ${props.className || ""}`
	});
});
function AnimatedTabs({ tabs, className = "", tabListClassName = "", tabClassName = "", tabPanelClassName = "", containerClassName = "", tabListProps = {}, defaultSelectedId }) {
	const tabIds = tabs.map((tab, index) => tab.id || `tab-${index}`);
	const firstTabId = defaultSelectedId || tabIds[0];
	const tabListRef = useRef(null);
	useEffect(() => {
		const tabList = tabListRef.current;
		if (!tabList) return;
		const updateUnderline = () => {
			const activeTab = tabList.querySelector("[data-state=\"active\"]");
			if (!activeTab) return;
			tabList.style.setProperty("--tab-left", `${activeTab.offsetLeft}px`);
			tabList.style.setProperty("--tab-width", `${activeTab.offsetWidth}px`);
		};
		updateUnderline();
		const observer = new MutationObserver(updateUnderline);
		observer.observe(tabList, {
			attributes: true,
			subtree: true,
			attributeFilter: ["data-state"]
		});
		return () => observer.disconnect();
	}, [tabs]);
	return /* @__PURE__ */ jsx("div", {
		className: `w-full ${className}`,
		children: /* @__PURE__ */ jsxs(Ariakit.TabProvider, {
			defaultSelectedId: firstTabId,
			children: [/* @__PURE__ */ jsx(Ariakit.TabList, {
				ref: tabListRef,
				"aria-label": "Tabs",
				className: `animated-tab-list flex py-1 ${tabListClassName}`,
				...tabListProps,
				children: tabs.map((tab, index) => /* @__PURE__ */ jsx(Tab, {
					id: tabIds[index],
					disabled: tab.disabled,
					className: tabClassName,
					"data-state": tabIds[index] === firstTabId ? "active" : "inactive",
					children: tab.label
				}, tabIds[index]))
			}), /* @__PURE__ */ jsx("div", {
				className: cn("animated-panels relative flex w-full flex-col items-center overflow-hidden p-0", containerClassName),
				children: tabs.map((tab, index) => /* @__PURE__ */ jsx(TabPanel, {
					id: `panel-${tabIds[index]}`,
					tabId: tabIds[index],
					className: tabPanelClassName,
					children: tab.content
				}, `panel-${tabIds[index]}`))
			})]
		})
	});
}
//#endregion
//#region src/components/Alert.tsx
const alertVariants = cva("relative flex gap-3 rounded-xl border px-4 py-3 text-sm", {
	variants: { variant: {
		info: "border-status-info-border bg-status-info-subtle text-status-info",
		success: "border-status-success-border bg-status-success-subtle text-status-success",
		warning: "border-status-warning-border bg-status-warning-subtle text-status-warning",
		error: "border-status-error-border bg-status-error-subtle text-status-error",
		neutral: "border-status-neutral-border bg-status-neutral-subtle text-status-neutral"
	} },
	defaultVariants: { variant: "info" }
});
const defaultIcons = {
	info: Info,
	success: CheckCircle2,
	warning: AlertTriangle,
	error: AlertCircle,
	neutral: Info
};
const Alert = React$1.forwardRef(({ className, variant = "info", icon, role = "alert", children, ...props }, ref) => {
	const DefaultIcon = defaultIcons[variant ?? "info"];
	return /* @__PURE__ */ jsxs("div", {
		ref,
		role,
		className: cn(alertVariants({ variant }), className),
		...props,
		children: [icon !== false && /* @__PURE__ */ jsx("span", {
			className: "mt-0.5 shrink-0",
			"aria-hidden": "true",
			children: icon ?? /* @__PURE__ */ jsx(DefaultIcon, { className: "size-4" })
		}), /* @__PURE__ */ jsx("div", {
			className: "min-w-0 flex-1",
			children
		})]
	});
});
Alert.displayName = "Alert";
//#endregion
//#region src/components/AlertDialog.tsx
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = ({ className = "", children, ...props }) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Portal, {
	className: cn(className),
	...props,
	children: /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center",
		children
	})
});
AlertDialogPortal.displayName = AlertDialogPrimitive.Portal.displayName;
const AlertDialogOverlay = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Overlay, {
	className: cn("fixed inset-0 z-50 bg-surface-overlay/90 transition-opacity animate-in fade-in", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [/* @__PURE__ */ jsx(AlertDialogOverlay, {}), /* @__PURE__ */ jsx(AlertDialogPrimitive.Content, {
	ref,
	className: cn(
		/** The dialog surface is otherwise borderless: in high contrast it sits on
		*  a canvas of its own colour, so it needs a drawn edge. */
		"fixed z-50 grid w-full max-w-lg scale-100 gap-4 bg-surface-dialog p-6 opacity-100 animate-in fade-in-90 slide-in-from-bottom-10 high-contrast:border high-contrast:border-solid high-contrast:border-border-medium sm:rounded-lg sm:zoom-in-90 sm:slide-in-from-bottom-0 md:w-full",
		className
	),
	...props
})] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
const AlertDialogHeader = ({ className = "", ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({ className = "", ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold text-text-primary", className),
	...props
}));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Description, {
	ref,
	className: cn("text-sm text-text-secondary", className),
	...props
}));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Action, {
	ref,
	className: cn("inline-flex h-10 items-center justify-center rounded-md bg-surface-inverted px-4 py-2 text-sm font-semibold text-text-inverted transition-colors hover:bg-surface-inverted-hover focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className),
	...props
}));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Cancel, {
	ref,
	className: cn("mt-2 inline-flex h-10 items-center justify-center rounded-md border border-border-light bg-transparent px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
//#endregion
//#region src/components/Breadcrumb.tsx
const Breadcrumb = React$1.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsx("nav", {
	ref,
	"aria-label": "breadcrumb",
	...props
}));
Breadcrumb.displayName = "Breadcrumb";
const BreadcrumbList = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("ol", {
	ref,
	className: cn("flex flex-wrap items-center gap-1.5 break-words text-sm text-text-secondary sm:gap-2.5", className),
	...props
}));
BreadcrumbList.displayName = "BreadcrumbList";
const BreadcrumbItem = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("li", {
	ref,
	className: cn("inline-flex items-center gap-1.5", className),
	...props
}));
BreadcrumbItem.displayName = "BreadcrumbItem";
const BreadcrumbLink = React$1.forwardRef(({ asChild, className, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "a", {
		ref,
		className: cn("transition-colors hover:text-text-primary", className),
		...props
	});
});
BreadcrumbLink.displayName = "BreadcrumbLink";
const BreadcrumbPage = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("span", {
	ref,
	role: "link",
	"aria-disabled": "true",
	"aria-current": "page",
	className: cn("font-normal text-text-primary", className),
	...props
}));
BreadcrumbPage.displayName = "BreadcrumbPage";
const BreadcrumbSeparator = ({ children, className, ...props }) => /* @__PURE__ */ jsx("li", {
	role: "presentation",
	"aria-hidden": "true",
	className: cn("[&>svg]:size-3.5", className),
	...props,
	children: children ?? /* @__PURE__ */ jsx(ChevronRight, {})
});
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
const BreadcrumbEllipsis = ({ className, ...props }) => /* @__PURE__ */ jsxs("span", {
	role: "presentation",
	"aria-hidden": "true",
	className: cn("flex h-9 w-9 items-center justify-center", className),
	...props,
	children: [/* @__PURE__ */ jsx(MoreHorizontal, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
		className: "sr-only",
		children: "More"
	})]
});
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";
//#endregion
//#region src/components/Button.tsx
const buttonVariantRecipe = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-surface-primary transition-colors duration-theme-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
	variants: {
		variant: {
			default: "bg-surface-inverted text-text-inverted hover:bg-surface-inverted-hover",
			destructive: "bg-surface-destructive text-text-on-status hover:bg-surface-destructive-hover",
			outline: "text-text-primary border border-border-light bg-transparent hover:bg-surface-hover hover:text-text-primary",
			/**
			* A selectable answer inside a question card. `outline` is wrong here:
			* its `border-light` edge measures ~1.2:1 against the panel these sit
			* on, well under WCAG 1.4.11's 3:1 for a UI component boundary, so a
			* column of choices reads as flat text rather than as controls. Carries
			* its own fill so the answers are a different colour from the prompt,
			* and drops to `font-normal` so the question above stays the heading.
			*/
			choice: "border border-border-xheavy bg-surface-tertiary font-normal text-text-primary hover:bg-surface-hover hover:text-text-primary",
			subtle: "border border-border-light bg-transparent text-text-primary hover:bg-surface-secondary focus-visible:ring-text-primary focus-visible:ring-offset-0",
			secondary: "bg-surface-secondary text-text-primary hover:bg-surface-hover",
			ghost: "hover:bg-surface-hover hover:text-text-primary",
			/**
			* A compact action living inside a list row — a pinned row's unpin
			* badge, a conversation's overflow trigger, a table row's controls. The
			* rows stay `rounded-lg`; this sits one step inside them, so it
			* overrides the base radius rather than matching its host.
			*/
			"row-action": "rounded-md hover:bg-surface-hover-alt hover:text-text-primary",
			link: "text-text-primary underline-offset-4 hover:underline",
			submit: "bg-surface-submit text-text-on-status hover:bg-surface-submit-hover",
			/**
			* The toggle that heads a collapsible sidebar section, such as Chats,
			* Projects and Pinned. It stays a quiet label rather than a control:
			* no hover fill, because a heading that lights up competes with the
			* rows it heads. Its ring is inset because these sit flush against the
			* section body, and it carries its own metrics through the compound
			* below, since a section heading is sized by its text.
			*/
			"section-header": "justify-start gap-1 rounded-lg px-1 py-2 text-xs font-bold text-text-secondary focus-visible:ring-inset focus-visible:ring-offset-0",
			/**
			* A quiet icon action sitting beside a section heading in the sidebar.
			* Unlike `row-action`, it recedes until hovered so the heading stays
			* the thing being read, and its ring sits inside the control because
			* these sit close enough that an offset one would cross a neighbour.
			* One radius step inside the heading row, like every other control that
			* sits on one.
			*/
			"section-action": "rounded-md text-text-secondary hover:bg-surface-active-alt hover:text-text-primary focus-visible:ring-inset focus-visible:ring-offset-0",
			/**
			* A control floating on the presentation surface — the sidebar
			* toggle in the chat header and its mirror in the mobile drawer
			* header, so the pair reads as one persistent button across views.
			* The fill is opaque and not transparent: the chat header is a
			* gradient that fades to nothing while the conversation scrolls
			* underneath, so a see-through control has message text moving
			* through it, and every neighbour in that row — model selector, new
			* chat, overflow menu — already sits on `bg-presentation`.
			* `duration-0` makes the hover fill instant: these sit over a
			* scrolling gradient, where the shared color transition reads as
			* lag rather than polish.
			*/
			"header-action": "rounded-xl border border-border-light bg-presentation text-text-primary duration-0 hover:bg-surface-active-alt hover:text-text-primary"
		},
		size: {
			default: "h-10 px-4 py-2",
			sm: "h-9 rounded-lg px-3",
			lg: "h-11 rounded-lg px-8",
			icon: "size-10",
			"icon-sm": "size-8 p-0",
			"icon-xs": "size-7",
			/**
			* A square icon control on the theme's control height — the size of
			* every button in the composer's action row, for a control that has to
			* line up with them.
			*/
			"icon-theme": "size-theme-control p-0",
			theme: "h-theme-control gap-theme-compact px-theme-normal"
		},
		shape: {
			default: "rounded-lg",
			theme: "rounded-theme-control",
			round: "rounded-theme-control-round",
			unset: ""
		}
	},
	compoundVariants: [
		{
			variant: "subtle",
			shape: "unset",
			class: "rounded-xl"
		},
		{
			variant: "section-header",
			size: "default",
			class: "h-auto px-1 py-2"
		},
		{
			variant: "header-action",
			size: "sm",
			shape: "unset",
			class: "rounded-xl"
		}
	],
	defaultVariants: {
		variant: "default",
		size: "default",
		shape: "unset"
	}
});
const buttonVariants = (props) => buttonVariantRecipe(props == null ? props : {
	...props,
	shape: props.shape == null ? "unset" : props.shape
});
const Button = React$1.forwardRef(({ className, variant, size, shape, asChild = false, type = "button", ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		type: asChild ? void 0 : type,
		className: cn(buttonVariants({
			variant,
			size,
			shape,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
//#endregion
//#region src/components/IconButton.tsx
const iconButtonVariants = cva("inline-flex shrink-0 items-center justify-center text-text-primary transition-colors duration-theme-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:pointer-events-none disabled:opacity-50", {
	variants: {
		variant: {
			default: "bg-surface-secondary hover:bg-surface-hover",
			secondary: "border border-border-light bg-surface-secondary hover:bg-surface-hover",
			ghost: "bg-transparent hover:bg-surface-hover",
			destructive: "bg-surface-destructive text-text-on-status hover:bg-surface-destructive-hover"
		},
		size: {
			xs: "size-6",
			sm: "size-8",
			md: "size-9",
			lg: "size-10",
			theme: "size-theme-control"
		},
		shape: {
			round: "rounded-full",
			square: "rounded-lg",
			theme: "rounded-theme-control-round"
		}
	},
	defaultVariants: {
		variant: "ghost",
		size: "md",
		shape: "round"
	}
});
const IconButton = React$1.forwardRef(({ className, label, type = "button", variant, size, shape, ...props }, ref) => /* @__PURE__ */ jsx("button", {
	ref,
	type,
	"aria-label": label,
	className: cn(iconButtonVariants({
		variant,
		size,
		shape,
		className
	})),
	...props
}));
IconButton.displayName = "IconButton";
//#endregion
//#region src/components/Chip.tsx
const chipVariants = cva("inline-flex max-w-full items-center gap-1 border text-xs font-medium transition-colors duration-theme-fast", {
	variants: {
		tone: {
			neutral: "border-status-neutral-border bg-status-neutral-subtle text-status-neutral",
			info: "border-status-info-border bg-status-info-subtle text-status-info",
			success: "border-status-success-border bg-status-success-subtle text-status-success",
			warning: "border-status-warning-border bg-status-warning-subtle text-status-warning",
			error: "border-status-error-border bg-status-error-subtle text-status-error"
		},
		size: {
			sm: "min-h-6 px-2 py-0.5",
			md: "min-h-8 px-2.5 py-1",
			theme: "h-theme-control gap-theme-compact px-theme-normal"
		},
		shape: {
			round: "rounded-full",
			theme: "rounded-theme-control"
		}
	},
	defaultVariants: {
		tone: "neutral",
		size: "sm",
		shape: "round"
	}
});
const Chip = React$1.forwardRef(({ children, className, leading, onRemove, removeLabel = "Remove", shape, size, tone, trailing, ...props }, ref) => /* @__PURE__ */ jsxs("span", {
	ref,
	className: cn(chipVariants({
		tone,
		size,
		shape,
		className
	})),
	...props,
	children: [
		leading,
		/* @__PURE__ */ jsx("span", {
			className: "min-w-0 truncate",
			children
		}),
		trailing,
		onRemove && /* @__PURE__ */ jsx(IconButton, {
			label: removeLabel,
			size: "xs",
			shape: shape === "theme" ? "theme" : "round",
			className: "-mr-1 text-current hover:bg-surface-hover/50",
			onClick: (event) => {
				event.stopPropagation();
				onRemove(event);
			},
			children: /* @__PURE__ */ jsx(X, {
				className: "size-3",
				"aria-hidden": "true"
			})
		})
	]
}));
Chip.displayName = "Chip";
//#endregion
//#region src/components/Checkbox.tsx
const Checkbox = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(CheckboxPrimitive.Root, {
	ref,
	className: cn("peer h-4 w-4 shrink-0 rounded-sm border border-border-xheavy ring-offset-surface-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-surface-inverted data-[state=checked]:text-text-inverted", className),
	...props,
	children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, {
		className: cn("flex items-center justify-center"),
		children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
//#endregion
//#region src/components/DisclosureChevron.tsx
/**
* Appearance for the chevron that opens a disclosure row: it stays invisible
* until the row (`group/disclosure`) is hovered or holds focus, then rotates
* once the panel is open.
*
* Owned here rather than in the feature so a change to the reveal, the focus
* behaviour, the motion, or the theme role reaches every disclosure surface at
* once. Callers keep only geometry (the icon size and any optical offset),
* which legitimately differs per row.
*/
const disclosureChevronVariants = cva("shrink-0 text-text-secondary opacity-0 transition-transform duration-200 ease-out group-focus-within/disclosure:opacity-100 group-hover/disclosure:opacity-100 motion-reduce:transition-none", {
	variants: { expanded: {
		true: "rotate-180",
		false: ""
	} },
	defaultVariants: { expanded: false }
});
//#endregion
//#region src/common/enum.ts
let ESide = /* @__PURE__ */ function(ESide) {
	ESide["Top"] = "top";
	ESide["Right"] = "right";
	ESide["Bottom"] = "bottom";
	ESide["Left"] = "left";
	return ESide;
}({});
let NotificationSeverity = /* @__PURE__ */ function(NotificationSeverity) {
	NotificationSeverity["INFO"] = "info";
	NotificationSeverity["SUCCESS"] = "success";
	NotificationSeverity["WARNING"] = "warning";
	NotificationSeverity["ERROR"] = "error";
	return NotificationSeverity;
}({});
//#endregion
//#region src/store.ts
const chatDirectionAtom = atom("ltr");
const fontSizeAtom = atom("text-base");
const toastState = atom({
	open: false,
	message: "",
	severity: "success",
	showIcon: true,
	duration: 3e3,
	id: 0
});
//#endregion
//#region src/hooks/useToast.ts
function useToast(showDelay = 100) {
	const [toast, setToast] = useAtom(toastState);
	const showTimerRef = useRef(null);
	useEffect(() => {
		return () => {
			if (showTimerRef.current !== null) clearTimeout(showTimerRef.current);
		};
	}, []);
	const showToast = ({ message, severity = "success", showIcon = true, duration = 3e3, status }) => {
		if (showTimerRef.current !== null) clearTimeout(showTimerRef.current);
		const closeAfter = Number.isFinite(duration) && duration > 0 ? duration : Infinity;
		showTimerRef.current = window.setTimeout(() => {
			/** A new `id` gives the toast its own Radix lifecycle, so its close deadline
			*  starts now even when it replaces a toast that is still open. */
			setToast((prevToast) => ({
				open: true,
				message,
				severity: status ?? severity,
				showIcon,
				duration: closeAfter,
				id: prevToast.id + 1
			}));
		}, showDelay);
	};
	return {
		toast,
		/** Radix keeps a superseded toast's close timer alive past unmount, so it can
		*  otherwise close the toast that replaced it; the id makes that a no-op. */
		onOpenChange: (open, id) => setToast((prevToast) => prevToast.id === id ? {
			...prevToast,
			open
		} : prevToast),
		showToast
	};
}
//#endregion
//#region src/hooks/useAvatar.ts
const avatarCache = {};
const useAvatar = (user) => {
	return useMemo(() => {
		const { username, name } = user ?? {};
		const seed = name || username;
		if (!seed) return "";
		if (user?.avatar && user?.avatar !== "") return user.avatar;
		if (avatarCache[seed]) return avatarCache[seed];
		const avatar = createAvatar(initials, {
			seed,
			fontFamily: ["Verdana"],
			fontSize: 36,
			backgroundType: ["solid"],
			backgroundColor: [
				"d81b60",
				"8e24aa",
				"5e35b1",
				"3949ab",
				"DB3733",
				"1B79CC",
				"027CB8",
				"008291",
				"008577",
				"58802F",
				"8A761D",
				"9C6D00",
				"B06200",
				"D1451A"
			],
			textColor: ["ffffff"]
		});
		let avatarDataUri = "";
		try {
			avatarDataUri = avatar.toDataUri();
			if (avatarDataUri) avatarCache[seed] = avatarDataUri;
		} catch (error) {
			console.error("Failed to generate avatar:", error);
		}
		return avatarDataUri;
	}, [user]);
};
//#endregion
//#region src/hooks/useCombobox.ts
function useCombobox({ value, options }) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	return {
		open,
		setOpen,
		searchValue,
		setSearchValue,
		matches: useMemo(() => {
			if (!searchValue) return options;
			const matches = matchSorter(options, searchValue, { keys: ["label", "value"] });
			const selectedItem = options.find((currentItem) => currentItem.value === value);
			if (selectedItem && !matches.includes(selectedItem)) matches.push(selectedItem);
			return matches;
		}, [
			searchValue,
			value,
			options
		])
	};
}
//#endregion
//#region src/hooks/useLocalize.ts
/** Language lifecycle is managed by the host app — do not add i18n.changeLanguage() calls here. */
function useLocalize() {
	const { t } = useTranslation();
	return useCallback((phraseKey, options) => t(phraseKey, options), [t]);
}
//#endregion
//#region src/hooks/useMediaQuery.tsx
function readMatches(query) {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
	return window.matchMedia(query).matches;
}
/**
* Resolves the query on the FIRST render rather than after a passive effect.
* Callers that branch once at mount — freezing an entrance animation, picking
* a layout before paint — read the deferred value as "no match" and never see
* the correction, which is how `prefers-reduced-motion` came to be ignored.
*/
function useMediaQuery(query) {
	const [matches, setMatches] = useState(() => readMatches(query));
	useEffect(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
		const media = window.matchMedia(query);
		if (media.matches !== matches) setMatches(media.matches);
		const listener = () => setMatches(media.matches);
		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	}, [matches, query]);
	return matches;
}
//#endregion
//#region src/hooks/useDelayedRender.tsx
const useDelayedRender = (delay) => {
	const [delayed, setDelayed] = useState(true);
	const timerPromiseRef = useRef(null);
	useEffect(() => {
		if (delayed) timerPromiseRef.current = new Promise((resolve) => {
			const timeout = setTimeout(() => {
				setDelayed(false);
				resolve();
			}, delay);
			return () => {
				clearTimeout(timeout);
			};
		});
		return () => {
			timerPromiseRef.current = null;
		};
	}, [delay, delayed]);
	return (fn) => {
		if (delayed && timerPromiseRef.current) throw timerPromiseRef.current;
		return fn();
	};
};
//#endregion
//#region src/hooks/useInputModality.ts
let refCount = 0;
let current = null;
function apply(modality) {
	if (current === modality) return;
	current = modality;
	document.documentElement.dataset.inputModality = modality;
}
function handlePointer() {
	apply("pointer");
}
function handleKeydown(event) {
	if (event.key === "Tab") apply("keyboard");
}
/**
* Tracks whether the user is currently interacting via pointer or keyboard and
* reflects it on `document.documentElement` as `data-input-modality`. Lets CSS
* gate focus styling so text inputs only show a focus ring for keyboard users
* (text inputs match `:focus-visible` on pointer focus too, which CSS alone
* cannot distinguish). Ref-counted so concurrent mounts share one listener set.
*/
function useInputModality() {
	useEffect(() => {
		if (typeof document === "undefined") return;
		if (refCount === 0) {
			apply("pointer");
			window.addEventListener("pointerdown", handlePointer, true);
			window.addEventListener("keydown", handleKeydown, true);
		}
		refCount += 1;
		return () => {
			refCount -= 1;
			if (refCount === 0) {
				window.removeEventListener("pointerdown", handlePointer, true);
				window.removeEventListener("keydown", handleKeydown, true);
				delete document.documentElement.dataset.inputModality;
				current = null;
			}
		};
	}, []);
}
//#endregion
//#region src/hooks/useOnClickOutside.ts
function useOnClickOutside(ref, handler, excludeIds, customCondition) {
	useEffect(() => {
		const handleClickOutside = (event) => {
			const target = event.target;
			if (target && "id" in target && excludeIds.includes(target.id)) return;
			if (target?.parentNode && "id" in target.parentNode && excludeIds.includes(target.parentNode.id)) return;
			if (customCondition && customCondition(target)) return;
			if (ref.current && !ref.current.contains(target)) handler();
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [ref, handler]);
}
//#endregion
//#region src/components/Dialog.tsx
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal$1 = ({ className = "", children, ...props }) => /* @__PURE__ */ jsx(DialogPrimitive.Portal, {
	className: cn(className),
	...props,
	children: /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-[999] flex items-start justify-center sm:items-center",
		children
	})
});
DialogPortal$1.displayName = DialogPrimitive.Portal.displayName;
const DialogOverlay$1 = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Overlay, {
	className: cn("fixed inset-0 z-[999] bg-surface-overlay/65 transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in", className ?? ""),
	...props,
	ref
}));
DialogOverlay$1.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React$1.forwardRef(({ className, children = true, showCloseButton = true, disableScroll = false, ...props }, ref) => {
	const isSmallScreen = useMediaQuery("(max-width: 768px)");
	return /* @__PURE__ */ jsxs(DialogPortal$1, { children: [/* @__PURE__ */ jsx(DialogOverlay$1, {}), /* @__PURE__ */ jsxs(DialogPrimitive.Content, {
		ref,
		className: cn(
			/** The dialog surface is otherwise borderless: in high contrast it sits
			*  on a canvas of its own colour, so it needs a drawn edge. */
			"fixed z-[999] grid w-full gap-4 rounded-b-lg bg-surface-dialog pb-6 animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 high-contrast:border high-contrast:border-solid high-contrast:border-border-medium sm:rounded-lg",
			isSmallScreen ? "fixed left-1/2 top-1/2 z-[999] m-auto grid w-11/12 -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-surface-dialog pb-6" : "",
			disableScroll ? "overflow-hidden" : "",
			className ?? ""
		),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ jsxs(DialogPrimitive.Close, {
			className: "absolute right-6 top-[1.6rem] rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-hover",
			children: [/* @__PURE__ */ jsx(X, {
				className: "h-5 w-5 text-text-primary",
				"aria-hidden": "true"
			}), /* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
});
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-2 border-b border-border-light p-6 pb-4 text-left", className ?? ""),
	...props
});
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-row justify-between space-x-2 px-6 py-4", className ?? ""),
	...props
});
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold text-text-primary", className ?? ""),
	...props
}));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Description, {
	ref,
	className: cn("text-sm text-text-secondary", className ?? ""),
	...props
}));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const DialogClose = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Close, {
	ref,
	className: cn("mt-2 inline-flex h-10 items-center justify-center rounded-lg border border-border-light bg-transparent px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0", className ?? "", "focus:ring-2 focus:ring-text-primary focus:ring-offset-2"),
	...props
}));
DialogClose.displayName = DialogPrimitive.Title.displayName;
const DialogButton = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Button, {
	ref,
	variant: "outline",
	className: cn("mt-2 inline-flex h-10 items-center justify-center rounded-lg border border-border-light bg-transparent px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0", className ?? "", "focus:ring-2 focus:ring-text-primary focus:ring-offset-2"),
	...props
}));
DialogButton.displayName = DialogPrimitive.Title.displayName;
//#endregion
//#region src/components/OriginalDialog.tsx
const DialogDepthContext = React$1.createContext(0);
/** Current OGDialog nesting depth (0 when rendered outside any dialog). */
const useDialogDepth = () => React$1.useContext(DialogDepthContext);
/**
* z-index for a portaled popover so it renders above the dialog it lives in.
* Outside any dialog (depth 0) it falls back to a low default (50).
*/
const usePopoverZIndex = () => {
	const depth = useDialogDepth();
	if (depth <= 0) return 50;
	return 140 + (depth - 1) * 60 + 10;
};
/**
* What a body-portaled Radix popover needs to survive a modal dialog, or
* `undefined` outside one — so a popover's own CSS layer (and any consumer
* override of it) is left untouched everywhere else.
*
* Radix coordinates nested layers through module-level state, so it only
* coordinates layers from the *same copy* of `react-dismissable-layer`. This
* app has three: `react-dialog` is pinned at 1.0.2 (see PR 11023) while `react-select`
* and `react-hover-card` resolve to their own newer copies. A popover therefore
* never learns that the dialog disabled body pointer events, and never lifts
* itself over the dialog — it opens behind an opaque overlay, inert.
*
* `pointer-events` mirrors what `DropdownPopup` already does for Ariakit menus
* in the same situation; a click inside still reaches the dialog's own
* "inside" check, because React portals bubble through the React tree.
*/
const useNestedPopoverStyle = () => {
	const depth = useDialogDepth();
	const zIndex = usePopoverZIndex();
	return depth > 0 ? {
		zIndex,
		pointerEvents: "auto"
	} : void 0;
};
/**
* Whether Escape belongs to something inside the dialog rather than the dialog
* itself: a trigger whose popover is open, focus inside a menu/listbox/combobox,
* or a tooltip. WCAG 2.1.1 wants those dismissable on their own, so the first
* Escape closes them and the dialog stays put.
*/
const escapeBelongsToPopup = (ownerDocument) => {
	const activeElement = ownerDocument.activeElement;
	if (activeElement?.getAttribute("aria-expanded") === "true") return true;
	const popovers = ownerDocument.querySelectorAll("[role=\"menu\"], [role=\"listbox\"], [role=\"combobox\"]");
	for (const popover of popovers) if (popover.contains(activeElement)) return true;
	const tooltips = ownerDocument.querySelectorAll(".tooltip");
	for (const tooltip of tooltips) if (tooltip.contains(activeElement)) return true;
	return false;
};
const Dialog$1 = React$1.forwardRef(({ children, triggerRef, triggerRefs, onOpenChange, ...props }, ref) => {
	const currentDepth = React$1.useContext(DialogDepthContext) + 1;
	const handleOpenChange = (open) => {
		if (!open && triggerRef?.current) setTimeout(() => {
			triggerRef.current?.focus();
		}, 0);
		if (triggerRefs?.length) triggerRefs.forEach((ref) => {
			if (ref?.current) setTimeout(() => {
				ref.current?.focus();
			}, 0);
		});
		onOpenChange?.(open);
	};
	return /* @__PURE__ */ jsx(DialogDepthContext.Provider, {
		value: currentDepth,
		children: /* @__PURE__ */ jsx(DialogPrimitive.Root, {
			...props,
			onOpenChange: handleOpenChange,
			children
		})
	});
});
const DialogTrigger$1 = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose$1 = DialogPrimitive.Close;
const DialogOverlay = React$1.forwardRef(({ className, style, ...props }, ref) => {
	const overlayZIndex = 130 + (React$1.useContext(DialogDepthContext) - 1) * 60;
	return /* @__PURE__ */ jsx(DialogPrimitive.Overlay, {
		ref,
		style: {
			...style,
			zIndex: overlayZIndex
		},
		className: cn("fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
		...props
	});
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent$1 = React$1.forwardRef(({ className, overlayClassName, showCloseButton = true, children, style, onEscapeKeyDown: propsOnEscapeKeyDown, ...props }, ref) => {
	const contentZIndex = 140 + (React$1.useContext(DialogDepthContext) - 1) * 60;
	const contentRef = React$1.useRef(null);
	const composedRef = React$1.useCallback((node) => {
		contentRef.current = node;
		if (typeof ref !== "function") {
			if (ref) ref.current = node;
			return;
		}
		/** React 19 lets a callback ref return a teardown, and swallowing it
		*  here would strand a consumer's observers and listeners on a replaced
		*  node. Only a real function is passed on: React 18 warns about any
		*  other return value. */
		const cleanup = ref(node);
		if (typeof cleanup !== "function") return;
		return () => {
			contentRef.current = null;
			cleanup();
		};
	}, [ref]);
	/**
	* Radix routes Escape to the highest dismissable layer only, and a toast
	* registers one *above* whatever dialog is already open — so a status toast
	* on screen swallows the Escape that should have closed the dialog under
	* it, and the reader has to press it twice.
	*
	* A toast is transient status, not something the reader is working in, so
	* the dialog takes Escape back while one is up. Scoped to exactly that
	* case: with no toast on screen Radix's own arbitration is untouched, and
	* only the frontmost dialog acts, so an inner dialog still closes alone.
	* Closing goes through a hidden `Dialog.Close`, which drives Radix's own
	* close path and therefore works for controlled and uncontrolled dialogs
	* alike.
	*/
	const escapeFallbackRef = React$1.useRef(null);
	React$1.useEffect(() => {
		const handleKeyDown = (event) => {
			const content = contentRef.current;
			if (content == null || event.key !== "Escape" || event.isComposing) return;
			/** Another layer already answered this Escape — a select inside the
			*  dialog closing its own listbox, say. Forcing the dialog shut on top
			*  of that would take the reader's work with it. */
			if (event.defaultPrevented) return;
			const ownerDocument = content.ownerDocument;
			if (escapeBelongsToPopup(ownerDocument)) return;
			if (ownerDocument.querySelector("li[data-radix-collection-item]") == null) return;
			/** Read the RESOLVED z-index: dialogs outside this primitive carry
			*  theirs in a class (`ImagePreview` is `z-[250]`), and an inline-only
			*  reading scores those zero and mistakes the dialog underneath for the
			*  frontmost one. Ties fall to the later element, which is the one
			*  painted on top. */
			const stackOrder = (element) => {
				const zIndex = Number(ownerDocument.defaultView?.getComputedStyle(element).zIndex);
				return Number.isNaN(zIndex) ? 0 : zIndex;
			};
			if (Array.from(ownerDocument.querySelectorAll("[role=\"dialog\"][data-state=\"open\"], [role=\"alertdialog\"][data-state=\"open\"]")).reduce((highest, candidate) => highest == null || stackOrder(candidate) >= stackOrder(highest) ? candidate : highest, null) !== content) return;
			/** Only now, with this dialog established as the one the Escape belongs
			*  to. Every mounted dialog runs this listener, and calling a consumer's
			*  handler from the ones underneath would fire their side effects for
			*  someone else's keystroke — and a `preventDefault()` there would stop
			*  the frontmost dialog from closing at all.
			*
			*  The consumer's own `onEscapeKeyDown` never ran: Radix calls it only
			*  for the highest layer, which the toast is. Give it the say it would
			*  have had, so a dialog that refuses to close on Escape still does. */
			propsOnEscapeKeyDown?.(event);
			if (event.defaultPrevented) return;
			escapeFallbackRef.current?.click();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [propsOnEscapeKeyDown]);
	const handleEscapeKeyDown = React$1.useCallback((event) => {
		if (escapeBelongsToPopup(document)) {
			event.preventDefault();
			return;
		}
		propsOnEscapeKeyDown?.(event);
	}, [propsOnEscapeKeyDown]);
	return /* @__PURE__ */ jsxs(DialogPortal, { children: [/* @__PURE__ */ jsx(DialogOverlay, { className: overlayClassName }), /* @__PURE__ */ jsxs(DialogPrimitive.Content, {
		ref: composedRef,
		style: {
			...style,
			zIndex: contentZIndex
		},
		onEscapeKeyDown: handleEscapeKeyDown,
		className: cn(
			/** `shadow-lg` is a black shadow, which carries no separation against
			*  a pure black surface, so high contrast trades it for a real edge. */
			"max-w-11/12 fixed left-[50%] top-[50%] grid max-h-[90vh] w-full translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-2xl bg-surface-dialog p-6 text-text-primary shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] high-contrast:border high-contrast:border-solid high-contrast:border-border-medium high-contrast:shadow-none",
			className
		),
		...props,
		children: [
			children,
			/* @__PURE__ */ jsx(DialogPrimitive.Close, {
				ref: escapeFallbackRef,
				className: "sr-only",
				tabIndex: -1,
				"aria-hidden": "true"
			}),
			showCloseButton && /* @__PURE__ */ jsxs(DialogPrimitive.Close, {
				className: "absolute right-4 top-4 rounded-sm opacity-70 ring-ring-primary ring-offset-surface-dialog transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-hover data-[state=open]:text-text-secondary",
				children: [/* @__PURE__ */ jsx(X, {
					className: "h-6 w-6",
					"aria-hidden": "true"
				}), /* @__PURE__ */ jsx("span", {
					className: "sr-only",
					children: "Close"
				})]
			})
		]
	})] });
});
DialogContent$1.displayName = DialogPrimitive.Content.displayName;
const DialogHeader$1 = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader$1.displayName = "DialogHeader";
const DialogFooter$1 = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter$1.displayName = "DialogFooter";
const DialogTitle$1 = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle$1.displayName = DialogPrimitive.Title.displayName;
const DialogDescription$1 = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Description, {
	ref,
	className: cn("text-sm text-text-secondary", className),
	...props
}));
DialogDescription$1.displayName = DialogPrimitive.Description.displayName;
//#endregion
//#region src/components/DropdownMenu.tsx
function DropdownMenu({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, {
		"data-slot": "dropdown-menu",
		...props
	});
}
function DropdownMenuPortal({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, {
		"data-slot": "dropdown-menu-portal",
		...props
	});
}
function DropdownMenuTrigger({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...props
	});
}
function DropdownMenuContent({ className, sideOffset = 4, style, ...props }) {
	const zIndex = usePopoverZIndex();
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.Content, {
		"data-slot": "dropdown-menu-content",
		sideOffset,
		style: {
			zIndex,
			...style
		},
		className: cn("max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border border-border-medium bg-surface-primary p-1 text-text-primary shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
		...props
	}) });
}
function DropdownMenuGroup({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Group, {
		"data-slot": "dropdown-menu-group",
		...props
	});
}
function DropdownMenuItem({ className, inset, variant = "default", ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Item, {
		"data-slot": "dropdown-menu-item",
		"data-inset": inset,
		"data-variant": variant,
		className: cn("data-[variant=destructive]:*:[svg]:!text-text-destructive relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-surface-hover focus:text-text-primary data-[disabled]:pointer-events-none data-[inset]:pl-8 data-[variant=destructive]:text-text-destructive data-[disabled]:opacity-50 data-[variant=destructive]:focus:bg-status-error-subtle data-[variant=destructive]:focus:text-text-destructive [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-text-secondary [&_svg]:pointer-events-none [&_svg]:shrink-0", className),
		...props
	});
}
function DropdownMenuCheckboxItem({ className, children, checked, ...props }) {
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.CheckboxItem, {
		"data-slot": "dropdown-menu-checkbox-item",
		className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-surface-hover focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0", className),
		checked,
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon$1, { className: "size-4" }) })
		}), children]
	});
}
function DropdownMenuRadioGroup({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.RadioGroup, {
		"data-slot": "dropdown-menu-radio-group",
		...props
	});
}
function DropdownMenuRadioItem({ className, children, ...props }) {
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.RadioItem, {
		"data-slot": "dropdown-menu-radio-item",
		className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-surface-hover focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0", className),
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CircleIcon, { className: "size-2 fill-current" }) })
		}), children]
	});
}
function DropdownMenuLabel({ className, inset, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Label, {
		"data-slot": "dropdown-menu-label",
		"data-inset": inset,
		className: cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className),
		...props
	});
}
function DropdownMenuSeparator({ className, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Separator, {
		"data-slot": "dropdown-menu-separator",
		className: cn("-mx-1 my-1 h-px bg-surface-hover", className),
		...props
	});
}
function DropdownMenuShortcut({ className, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "dropdown-menu-shortcut",
		className: cn("ml-auto text-xs tracking-widest text-text-secondary", className),
		...props
	});
}
function DropdownMenuSub({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Sub, {
		"data-slot": "dropdown-menu-sub",
		...props
	});
}
function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.SubTrigger, {
		"data-slot": "dropdown-menu-sub-trigger",
		"data-inset": inset,
		className: cn("flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-surface-hover focus:text-text-primary data-[state=open]:bg-surface-hover data-[inset]:pl-8 data-[state=open]:text-text-primary", className),
		...props,
		children: [children, /* @__PURE__ */ jsx(ChevronRightIcon, { className: "ml-auto size-4" })]
	});
}
function DropdownMenuSubContent({ className, style, ...props }) {
	const zIndex = usePopoverZIndex();
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.SubContent, {
		"data-slot": "dropdown-menu-sub-content",
		style: {
			zIndex,
			...style
		},
		className: cn("origin-(--radix-dropdown-menu-content-transform-origin) min-w-[8rem] overflow-hidden rounded-md border border-border-medium bg-surface-primary p-1 text-text-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
		...props
	});
}
//#endregion
//#region src/components/HoverCard.tsx
const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;
const HoverCardPortal = HoverCardPrimitive.Portal;
const HoverCardContent = React$1.forwardRef(({ className = "", align = "center", sideOffset = 6, disabled = false, style, ...props }, ref) => {
	const nestedStyle = useNestedPopoverStyle();
	if (disabled) return null;
	return /* @__PURE__ */ jsx(HoverCardPrimitive.Content, {
		ref,
		align,
		sideOffset,
		style: {
			...nestedStyle,
			...style
		},
		className: cn("z-50 w-64 origin-[--radix-hover-card-content-transform-origin] rounded-xl border border-border-light bg-surface-secondary p-4 text-text-primary shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
		...props
	});
});
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
//#endregion
//#region src/components/Field.ts
/**
* The shared appearance of a form control — border, radius, type scale and focus
* treatment. Owned here so `Input`, `Textarea`, and the select/combobox triggers
* that have to sit beside them in a form cannot drift apart as the theme evolves.
* Callers compose a variant rather than restating these classes locally.
*/
const fieldBase = "lc-field flex w-full rounded-lg border border-border-light px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:border-border-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary disabled:cursor-not-allowed disabled:opacity-50";
/** A single-line control sized to sit in a form row, matching `Input`. */
const fieldControl = `${fieldBase} h-10 bg-transparent`;
//#endregion
//#region src/components/Input.tsx
const Input = React$1.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("input", {
		className: cn(fieldControl, "ring-offset-surface-primary", className ?? ""),
		ref,
		...props
	});
});
Input.displayName = "Input";
//#endregion
//#region src/components/InputNumber.tsx
const InputNumber = React$1.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx(RCInputNumber, {
		className: cn("flex max-h-5 w-full rounded-md border border-border-medium bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50", className ?? ""),
		ref,
		...props
	});
});
InputNumber.displayName = "Input";
//#endregion
//#region src/components/SecretInput.tsx
const SecretInput = React$1.forwardRef(({ id, label, className, showCopy = false, copyButton, labelClassName, containerClassName, controlsClassName, buttonClassName, controlsOnHover = false, onCopy, copyFeedbackDuration = 2e3, disabled, value, ...props }, ref) => {
	const [isVisible, setIsVisible] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const toggleVisibility = useCallback(() => {
		setIsVisible((prev) => !prev);
	}, []);
	const handleCopy = useCallback(async () => {
		if (isCopied || disabled) return;
		const textToCopy = typeof value === "string" ? value : "";
		if (!textToCopy) return;
		try {
			await navigator.clipboard.writeText(textToCopy);
			setIsCopied(true);
			onCopy?.();
			setTimeout(() => {
				setIsCopied(false);
			}, copyFeedbackDuration);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, [
		value,
		isCopied,
		disabled,
		onCopy,
		copyFeedbackDuration
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: cn("group/secret-input relative", containerClassName),
		children: [
			/* @__PURE__ */ jsx("input", {
				id,
				type: isVisible ? "text" : "password",
				className: cn("flex h-10 w-full rounded-lg border border-border-light bg-transparent py-2 pl-3 text-sm placeholder:text-text-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", className ?? "", copyButton != null || showCopy ? "pr-20" : "pr-11"),
				ref,
				disabled,
				value,
				autoComplete: "off",
				spellCheck: false,
				...props
			}),
			label != null && /* @__PURE__ */ jsx("label", {
				htmlFor: id,
				className: cn(labelClassName ?? ""),
				children: label
			}),
			/* @__PURE__ */ jsxs("div", {
				className: cn("pointer-events-none absolute inset-y-0 right-1.5 flex items-center gap-0.5 [&_button]:pointer-events-auto", controlsOnHover && "opacity-0 transition-opacity duration-150 group-focus-within/secret-input:opacity-100 group-hover/secret-input:opacity-100", controlsClassName),
				children: [
					copyButton,
					showCopy && copyButton == null && /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: handleCopy,
						disabled: disabled || !value,
						className: cn("inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary [&>svg]:block", disabled || !value ? "cursor-not-allowed opacity-50" : "hover:bg-surface-hover hover:text-text-primary", buttonClassName),
						"aria-label": isCopied ? "Copied" : "Copy to clipboard",
						children: /* @__PURE__ */ jsx(MorphIcon, {
							icon: isCopied ? Check$1 : Copy,
							className: "size-4"
						})
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: toggleVisibility,
						disabled,
						className: cn("inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary [&>svg]:block", disabled ? "cursor-not-allowed opacity-50" : "hover:bg-surface-hover hover:text-text-primary", buttonClassName),
						"aria-label": isVisible ? "Hide secret" : "Show secret",
						children: /* @__PURE__ */ jsx(MorphIcon, {
							icon: isVisible ? EyeOff : Eye,
							className: "size-4"
						})
					})
				]
			})
		]
	});
});
SecretInput.displayName = "SecretInput";
//#endregion
//#region src/components/FilterInput.tsx
/**
* A standardized filter/search input component with a floating label
* that animates up when focused or has a value.
*
* @example
* <FilterInput
*   inputId="bookmarks-filter"
*   label={localize('com_ui_bookmarks_filter')}
*   value={searchQuery}
*   onChange={(e) => setSearchQuery(e.target.value)}
* />
*/
const FilterInput = React$1.forwardRef(({ className, label, inputId, containerClassName, ...props }, ref) => {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("relative", containerClassName),
		children: [/* @__PURE__ */ jsx("input", {
			id: inputId,
			ref,
			placeholder: " ",
			"aria-label": label,
			className: cn("peer flex h-9 w-full rounded-lg border border-border-light bg-transparent px-3 py-2 text-sm ring-offset-surface-primary placeholder:text-text-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", className),
			...props
		}), /* @__PURE__ */ jsx("label", {
			htmlFor: inputId,
			className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary transition-all duration-200 peer-focus:top-0 peer-focus:bg-surface-primary peer-focus:px-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:bg-surface-primary peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:text-xs",
			children: label
		})]
	});
});
FilterInput.displayName = "FilterInput";
//#endregion
//#region src/components/FieldMessage.tsx
/** Reserved helper heights, keyed by the number of `leading-4` lines. */
const reservedLines = {
	1: "min-h-4",
	2: "min-h-8",
	3: "min-h-12"
};
/**
* Helper line rendered under a form field. It reserves `lines` worth of vertical
* space up front, so swapping between the hint, an error, and nothing never
* shifts the surrounding layout. Fields whose longest message wraps at the
* narrowest supported width should reserve the height that message needs.
*/
function FieldMessage({ id, message, hint, lines = 1, className }) {
	return /* @__PURE__ */ jsx("p", {
		id,
		role: message ? "alert" : void 0,
		className: cn(reservedLines[lines], "text-xs leading-4", message ? "text-text-destructive" : "text-text-secondary", className),
		children: message || hint || ""
	});
}
//#endregion
//#region src/components/Label.tsx
/**
* Typography only, so a non-label element that heads a settings row can reuse a
* variant without inheriting the label's block layout. Each variant carries its
* own size, leading and color rather than overriding a shared base: the raw
* recipe output is not merged for those consumers, and a font size declared
* after `leading-none` would drop it.
*/
const labelVariants = cva("", {
	variants: { variant: {
		default: "text-sm leading-none text-text-primary",
		/** Eyebrow above a field or settings group. */
		section: "text-[11px] font-medium uppercase tracking-wide text-text-secondary"
	} },
	defaultVariants: { variant: "default" }
});
const Label = React$1.forwardRef(({ className = "", variant, ...props }, ref) => /* @__PURE__ */ jsx(LabelPrimitive.Root, {
	ref,
	...props,
	className: cn("block w-full break-all peer-disabled:cursor-not-allowed peer-disabled:opacity-70", labelVariants({ variant }), className)
}));
Label.displayName = LabelPrimitive.Root.displayName;
//#endregion
//#region src/components/QuestionMark.tsx
const QuestionMark = ({ className = "" }) => {
	return /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("div", {
		className: cn("border-token-border-medium text-token-text-tertiary ml-2 flex h-3.5 w-3.5 cursor-default items-center justify-center rounded-full border text-[0.5rem] font-medium leading-none", className),
		children: "?"
	}) });
};
//#endregion
//#region src/components/Slider.tsx
const Slider = React$1.forwardRef(({ className, onDoubleClick, "aria-labelledby": ariaLabelledBy, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, ...props }, ref) => /* @__PURE__ */ jsxs(SliderPrimitive.Root, {
	ref,
	...props,
	className: cn("relative flex w-full cursor-pointer touch-none select-none items-center", className),
	onDoubleClick,
	children: [/* @__PURE__ */ jsx(SliderPrimitive.Track, {
		className: "relative h-2 w-full grow overflow-hidden rounded-full bg-surface-tertiary",
		children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: "absolute h-full bg-surface-inverted" })
	}), /* @__PURE__ */ jsx(SliderPrimitive.Thumb, {
		className: "block h-5 w-5 rounded-full border-2 border-border-xheavy bg-surface-primary ring-offset-surface-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
		"aria-labelledby": ariaLabelledBy,
		"aria-label": ariaLabel,
		"aria-describedby": ariaDescribedBy
	})]
}));
Slider.displayName = SliderPrimitive.Root.displayName;
//#endregion
//#region src/components/Separator.tsx
const Separator = React$1.forwardRef(({ className = "", orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(SeparatorPrimitive.Root, {
	ref,
	...props,
	decorative,
	orientation,
	className: cn("shrink-0 bg-border-light", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)
}));
Separator.displayName = SeparatorPrimitive.Root.displayName;
//#endregion
//#region src/components/InputCombobox.tsx
const InputCombobox = ({ label, labelClassName, placeholder = "Select an option", options, className, value, onChange, onBlur }) => {
	const isOptionObject = (option) => {
		return option != null && typeof option === "object" && "value" in option;
	};
	const [isOpen, setIsOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState(value);
	const [isKeyboardFocus, setIsKeyboardFocus] = React.useState(false);
	React.useEffect(() => {
		setInputValue(value);
	}, [value]);
	const handleChange = (newValue) => {
		setInputValue(newValue);
		onChange(newValue);
	};
	return /* @__PURE__ */ jsxs(Ariakit.ComboboxProvider, {
		value: inputValue,
		setValue: handleChange,
		children: [
			label != null && /* @__PURE__ */ jsx(Ariakit.ComboboxLabel, {
				className: cn("mb-2 block text-sm font-medium text-text-primary", labelClassName ?? ""),
				children: label
			}),
			/* @__PURE__ */ jsx("div", {
				className: cn("relative", isKeyboardFocus ? "rounded-md ring-2 ring-ring-primary" : ""),
				children: /* @__PURE__ */ jsx(Ariakit.Combobox, {
					placeholder,
					className: cn("h-10 w-full rounded-md border border-border-light bg-surface-primary px-3 py-2 text-sm", "placeholder-text-secondary hover:bg-surface-hover", "focus:outline-none", className),
					onChange: (event) => handleChange(event.target.value),
					onBlur: () => {
						setIsKeyboardFocus(false);
						onBlur();
					},
					onFocusVisible: () => {
						setIsKeyboardFocus(true);
						setIsOpen(true);
					},
					onMouseDown: () => {
						setIsKeyboardFocus(false);
					}
				})
			}),
			/* @__PURE__ */ jsx(Ariakit.ComboboxPopover, {
				gutter: 4,
				sameWidth: true,
				open: isOpen,
				onClose: () => setIsOpen(false),
				className: cn("z-50 max-h-60 w-full overflow-auto rounded-md bg-surface-primary p-1 shadow-lg", "animate-in fade-in-0 zoom-in-95"),
				children: options.map((option, index) => /* @__PURE__ */ jsxs(Ariakit.ComboboxItem, {
					className: cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none", "cursor-pointer hover:bg-surface-tertiary hover:text-text-primary", "data-[active-item]:bg-surface-tertiary data-[active-item]:text-text-primary"),
					value: isOptionObject(option) ? `${option.value ?? ""}` : option,
					children: [isOptionObject(option) && option.icon != null && /* @__PURE__ */ jsx("span", {
						className: "mr-2 flex-shrink-0",
						children: option.icon
					}), isOptionObject(option) ? option.label : option]
				}, index))
			})
		]
	});
};
//#endregion
//#region src/components/Skeleton.tsx
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn("animate-pulse rounded-md bg-surface-tertiary opacity-50 dark:opacity-25", className),
		...props
	});
}
//#endregion
//#region src/components/Switch.tsx
const Switch = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SwitchPrimitives.Root, {
	className: cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-surface-inverted data-[state=unchecked]:bg-switch-unchecked", className),
	...props,
	ref,
	children: /* @__PURE__ */ jsx(SwitchPrimitives.Thumb, { className: cn("pointer-events-none block h-5 w-5 rounded-full bg-surface-primary shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = SwitchPrimitives.Root.displayName;
//#endregion
//#region src/components/Table.tsx
const Table = React$1.forwardRef(({ className, unwrapped = false, ...props }, ref) => {
	const tableElement = /* @__PURE__ */ jsx("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	});
	if (unwrapped) return tableElement;
	return /* @__PURE__ */ jsx("div", {
		className: "relative w-full overflow-auto",
		children: tableElement
	});
});
Table.displayName = "Table";
const TableHeader = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
const TableBody = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
const TableFooter = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("tfoot", {
	ref,
	className: cn("border-t bg-surface-tertiary font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
const TableRow = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("tr", {
	ref,
	className: cn("border-b border-border-light transition-colors hover:bg-surface-tertiary data-[state=selected]:bg-surface-tertiary", className),
	...props
}));
TableRow.displayName = "TableRow";
const TableHead = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("th", {
	ref,
	className: cn("h-12 px-4 text-left align-middle font-medium text-text-secondary [&:has([role=checkbox])]:pr-0", className),
	...props
}));
TableHead.displayName = "TableHead";
const TableCell = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("td", {
	ref,
	className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
	...props
}));
TableCell.displayName = "TableCell";
const TableRowHeader = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("th", {
	ref,
	scope: "row",
	className: cn("p-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0", className),
	...props
}));
TableRowHeader.displayName = "TableRowHeader";
const TableCaption = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("caption", {
	ref,
	className: cn("mt-4 text-sm text-text-secondary", className),
	...props
}));
TableCaption.displayName = "TableCaption";
//#endregion
//#region src/components/Tabs.tsx
const Tabs = TabsPrimitive.Root;
const TabsList = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(TabsPrimitive.List, {
	ref,
	className: cn("inline-flex items-center justify-center rounded-md bg-surface-primary", className),
	...props
}));
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(TabsPrimitive.Trigger, {
	className: cn("inline-flex min-w-[100px] items-center justify-center rounded-[0.185rem] px-3 py-1.5 text-sm font-medium text-text-secondary transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-surface-primary data-[state=active]:text-text-primary data-[state=active]:shadow-sm", className),
	...props,
	ref
}));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(TabsPrimitive.Content, {
	className: cn("mt-2 rounded-md p-6", className),
	...props,
	ref
}));
TabsContent.displayName = TabsPrimitive.Content.displayName;
//#endregion
//#region src/components/Tag.tsx
const TagPrimitiveRoot = React$1.forwardRef(({ CancelButton, LabelNode, label, onRemove, className = "", labelClassName = "", variant = "success", ...props }, ref) => {
	const variantClassName = {
		neutral: "border-status-neutral-border bg-status-neutral-subtle text-status-neutral",
		info: "border-status-info-border bg-status-info-subtle text-status-info",
		success: "border-status-success-border bg-status-success-subtle text-status-success",
		warning: "border-status-warning-border bg-status-warning-subtle text-status-warning",
		error: "border-status-error-border bg-status-error-subtle text-status-error"
	}[variant];
	return /* @__PURE__ */ jsxs("div", {
		ref,
		...props,
		className: cn("flex max-h-8 items-center overflow-y-hidden rounded-3xl border-2 text-xs", variantClassName, className),
		children: [/* @__PURE__ */ jsxs("div", {
			className: cn("ml-1 whitespace-pre-wrap px-2 py-1", labelClassName),
			children: [LabelNode ? /* @__PURE__ */ jsxs(Fragment, { children: [LabelNode, " "] }) : null, label]
		}), CancelButton ? CancelButton : onRemove && /* @__PURE__ */ jsx(IconButton, {
			label: `Remove ${label}`,
			size: "xs",
			className: "mr-0.5 text-current hover:bg-surface-hover/50",
			onClick: (e) => {
				e.stopPropagation();
				onRemove(e);
			},
			children: /* @__PURE__ */ jsx(X, {
				className: "size-3",
				"aria-hidden": "true"
			})
		})]
	});
});
TagPrimitiveRoot.displayName = "Tag";
const Tag = React$1.memo(TagPrimitiveRoot);
//#endregion
//#region src/components/Textarea.tsx
const Textarea = React$1.forwardRef(({ className = "", ...props }, ref) => {
	return /* @__PURE__ */ jsx("textarea", {
		className: cn(fieldBase, "min-h-20 resize-none bg-surface-secondary", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
//#endregion
//#region src/components/TextareaAutosize.tsx
const TextareaAutosize = forwardRef((props, ref) => {
	const [, setIsRerendered] = useState(false);
	const chatDirection = useAtomValue(chatDirectionAtom).toLowerCase();
	useLayoutEffect(() => setIsRerendered(true), []);
	return /* @__PURE__ */ jsx(ReactTextareaAutosize, {
		dir: chatDirection,
		...props,
		ref
	});
});
//#endregion
//#region src/components/Toast.tsx
function Toast() {
	const { toast, onOpenChange } = useToast();
	const localize = useLocalize();
	const persistent = toast.duration === Infinity;
	return /* @__PURE__ */ jsx(RadixToast.Root, {
		open: toast.open,
		onOpenChange: (open) => onOpenChange(open, toast.id),
		duration: toast.duration,
		className: "toast-root",
		style: {
			minHeight: "74px",
			marginBottom: "0px"
		},
		children: /* @__PURE__ */ jsx("div", {
			className: "w-full p-1 text-center md:w-auto md:text-justify",
			children: /* @__PURE__ */ jsxs("div", {
				className: `alert-root pointer-events-auto inline-flex flex-row gap-2 rounded-md border px-3 py-2 font-bold text-text-on-status ${{
					["info"]: "border-status-info-strong bg-status-info-strong",
					["success"]: "border-status-success-strong bg-status-success-strong",
					["warning"]: "border-status-warning-strong bg-status-warning-strong",
					["error"]: "border-status-error-strong bg-status-error-strong"
				}[toast.severity]}`,
				children: [
					toast.showIcon && /* @__PURE__ */ jsx("div", {
						className: "mt-1 flex-shrink-0 flex-grow-0",
						children: /* @__PURE__ */ jsxs("svg", {
							stroke: "currentColor",
							fill: "none",
							strokeWidth: "2",
							viewBox: "0 0 24 24",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							className: "icon-sm",
							height: "1em",
							width: "1em",
							xmlns: "http://www.w3.org/2000/svg",
							children: [
								/* @__PURE__ */ jsx("polygon", { points: "7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" }),
								/* @__PURE__ */ jsx("line", {
									x1: "12",
									y1: "8",
									x2: "12",
									y2: "12"
								}),
								/* @__PURE__ */ jsx("line", {
									x1: "12",
									y1: "16",
									x2: "12.01",
									y2: "16"
								})
							]
						})
					}),
					/* @__PURE__ */ jsx(RadixToast.Description, {
						className: "flex-1 justify-center gap-2",
						children: /* @__PURE__ */ jsx("div", {
							className: "whitespace-pre-wrap text-left",
							children: toast.message
						})
					}),
					persistent && /* @__PURE__ */ jsx(RadixToast.Close, {
						"aria-label": localize("com_ui_close"),
						className: "ml-2 inline-flex flex-shrink-0 flex-grow-0 items-center justify-center self-center rounded-sm opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current",
						children: /* @__PURE__ */ jsx(X, {
							className: "h-4 w-4",
							strokeWidth: 3
						})
					})
				]
			})
		})
	}, toast.id);
}
//#endregion
//#region src/components/Tooltip.tsx
/**
* Isolated component that subscribes to tooltip store state independently,
* so the anchor element never re-renders when the tooltip mounts/unmounts.
*/
const TooltipPopup = memo(function TooltipPopup({ store, description, enableHTML, portalElement }) {
	const mounted = Ariakit.useStoreState(store, (state) => state.mounted);
	const placement = Ariakit.useStoreState(store, (state) => state.placement);
	/** Tooltips portal to body at z-150, which nested dialogs (z 200+) cover —
	* inside a dialog, borrow the popover's depth-aware z-index; outside, keep
	* the stylesheet default so tooltips never outrank freshly opened dialogs. */
	const dialogDepth = useDialogDepth();
	const popoverZIndex = usePopoverZIndex();
	const sanitizer = useMemo(() => {
		const instance = DOMPurify();
		instance.addHook("afterSanitizeAttributes", (node) => {
			if (node.tagName && node.tagName === "A") {
				node.setAttribute("target", "_blank");
				node.setAttribute("rel", "noopener noreferrer");
			}
		});
		return instance;
	}, []);
	const sanitizedHTML = useMemo(() => {
		if (!enableHTML) return "";
		try {
			return sanitizer.sanitize(description, {
				ALLOWED_TAGS: [
					"a",
					"strong",
					"b",
					"em",
					"i",
					"br",
					"code"
				],
				ALLOWED_ATTR: [
					"href",
					"class",
					"target",
					"rel"
				],
				ALLOW_DATA_ATTR: false,
				ALLOW_ARIA_ATTR: false
			});
		} catch (error) {
			console.error("Sanitization failed", error);
			return description;
		}
	}, [
		enableHTML,
		description,
		sanitizer
	]);
	const { x, y } = useMemo(() => {
		switch (placement.split("-")[0]) {
			case "top": return {
				x: 0,
				y: -8
			};
			case "bottom": return {
				x: 0,
				y: 8
			};
			case "left": return {
				x: -8,
				y: 0
			};
			case "right": return {
				x: 8,
				y: 0
			};
			default: return {
				x: 0,
				y: 0
			};
		}
	}, [placement]);
	return /* @__PURE__ */ jsx(AnimatePresence, { children: mounted === true && /* @__PURE__ */ jsxs(Ariakit.Tooltip, {
		gutter: 4,
		alwaysVisible: true,
		portalElement,
		className: "tooltip",
		render: /* @__PURE__ */ jsx(motion.div, {
			style: dialogDepth > 0 ? { zIndex: popoverZIndex } : void 0,
			initial: {
				opacity: 0,
				x,
				y
			},
			animate: {
				opacity: 1,
				x: 0,
				y: 0
			},
			exit: {
				opacity: 0,
				x,
				y
			}
		}),
		children: [/* @__PURE__ */ jsx(Ariakit.TooltipArrow, {}), enableHTML ? /* @__PURE__ */ jsx("div", { dangerouslySetInnerHTML: { __html: sanitizedHTML } }) : description]
	}) });
});
const TooltipAnchor = forwardRef(function TooltipAnchor({ description, side = "top", className, role, enableHTML = false, portalElement, onKeyDown, tabIndex, ...props }, ref) {
	const tooltip = Ariakit.useTooltipStore({ placement: side });
	/**
	* `role="button"` renders a plain element with no native activation, so Enter and
	* Space must both be handled to match a real button (WCAG 2.1.1). Space is always
	* preventDefault'd (including key-repeat) to suppress page scroll. Activation
	* ignores event.repeat so a held Space does not fire click() repeatedly.
	*
	* Default tabIndex to 0 for role="button" so keyboard users can reach consumers
	* that forget an explicit tabIndex (e.g. MCP card actions). Explicit values win.
	*/
	const resolvedTabIndex = role === "button" ? tabIndex ?? 0 : tabIndex;
	const handleKeyDown = useCallback((event) => {
		onKeyDown?.(event);
		if (role !== "button" || event.defaultPrevented) return;
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		if (event.repeat) return;
		event.currentTarget.click();
	}, [role, onKeyDown]);
	return /* @__PURE__ */ jsxs(Ariakit.TooltipProvider, {
		store: tooltip,
		hideTimeout: 0,
		children: [/* @__PURE__ */ jsx(Ariakit.TooltipAnchor, {
			...props,
			ref,
			role,
			tabIndex: resolvedTabIndex,
			onKeyDown: handleKeyDown,
			className: cn("cursor-pointer", className)
		}), /* @__PURE__ */ jsx(TooltipPopup, {
			store: tooltip,
			description,
			enableHTML,
			portalElement
		})]
	});
});
//#endregion
//#region src/components/Pagination.tsx
const Pagination = ({ className, ...props }) => /* @__PURE__ */ jsx("nav", {
	role: "navigation",
	"aria-label": "pagination",
	className: cn("mx-auto flex w-full justify-center", className),
	...props
});
Pagination.displayName = "Pagination";
const PaginationContent = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("ul", {
	ref,
	className: cn("flex flex-row items-center gap-1", className),
	...props
}));
PaginationContent.displayName = "PaginationContent";
const PaginationItem = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("li", {
	ref,
	className: cn("", className),
	...props
}));
PaginationItem.displayName = "PaginationItem";
const PaginationLink = ({ className, isActive = false, size = "icon", children, ...props }) => /* @__PURE__ */ jsx("a", {
	"aria-current": isActive ? "page" : void 0,
	className: cn(buttonVariants({
		variant: isActive ? "outline" : "ghost",
		size
	}), className),
	...props,
	children: children || /* @__PURE__ */ jsx("span", {
		className: "sr-only",
		children: "Page link"
	})
});
PaginationLink.displayName = "PaginationLink";
const PaginationPrevious = ({ className, ...props }) => /* @__PURE__ */ jsxs(PaginationLink, {
	"aria-label": "Go to previous page",
	size: "default",
	className: cn("gap-1 pl-2.5", className),
	...props,
	children: [/* @__PURE__ */ jsx(ChevronLeft, {
		className: "h-4 w-4",
		"aria-hidden": "true"
	}), /* @__PURE__ */ jsx("span", { children: "Previous" })]
});
PaginationPrevious.displayName = "PaginationPrevious";
const PaginationNext = ({ className, ...props }) => /* @__PURE__ */ jsxs(PaginationLink, {
	"aria-label": "Go to next page",
	size: "default",
	className: cn("gap-1 pr-2.5", className),
	...props,
	children: [/* @__PURE__ */ jsx("span", { children: "Next" }), /* @__PURE__ */ jsx(ChevronRight, {
		className: "h-4 w-4",
		"aria-hidden": "true"
	})]
});
PaginationNext.displayName = "PaginationNext";
const PaginationEllipsis = ({ className, ...props }) => /* @__PURE__ */ jsxs("span", {
	"aria-hidden": true,
	className: cn("flex h-9 w-9 items-center justify-center", className),
	...props,
	children: [/* @__PURE__ */ jsx(MoreHorizontal, {
		className: "h-4 w-4",
		"aria-hidden": "true"
	}), /* @__PURE__ */ jsx("span", {
		className: "sr-only",
		children: "More pages"
	})]
});
PaginationEllipsis.displayName = "PaginationEllipsis";
//#endregion
//#region src/components/Progress.tsx
const Progress = React$1.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ jsx(ProgressPrimitive.Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-surface-tertiary", className),
	...props,
	children: /* @__PURE__ */ jsx(ProgressPrimitive.Indicator, {
		className: "h-full w-full flex-1 bg-surface-inverted transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = ProgressPrimitive.Root.displayName;
//#endregion
//#region src/components/SegmentedMeter.tsx
/** Static class lookups — Tailwind cannot see an interpolated `bg-series-${n}`. */
const SERIES_FILL = [
	"bg-series-1",
	"bg-series-2",
	"bg-series-3",
	"bg-series-4",
	"bg-series-5",
	"bg-series-6",
	"bg-series-7",
	"bg-series-8"
];
const SERIES_TINT = [
	"bg-series-1/25",
	"bg-series-2/25",
	"bg-series-3/25",
	"bg-series-4/25",
	"bg-series-5/25",
	"bg-series-6/25",
	"bg-series-7/25",
	"bg-series-8/25"
];
const SERIES_EDGE = [
	"ring-series-1",
	"ring-series-2",
	"ring-series-3",
	"ring-series-4",
	"ring-series-5",
	"ring-series-6",
	"ring-series-7",
	"ring-series-8"
];
const SERIES_SLOT_COUNT = SERIES_FILL.length;
/** Wraps out-of-range slots so a caller can never render an untinted segment. */
const slotIndex = (slot) => ((Math.trunc(slot) - 1) % SERIES_SLOT_COUNT + SERIES_SLOT_COUNT) % SERIES_SLOT_COUNT;
/** A hatch can't be expressed with semantic utilities; the stripe colour is
*  still read from the theme at paint time so it follows every theme. */
const hatchStyle = (spacing) => ({ backgroundImage: `repeating-linear-gradient(135deg, transparent 0 ${spacing}, rgb(var(--surface-tertiary)) ${spacing} calc(${spacing} + 2px))` });
function seriesSwatchClass(segment) {
	const index = slotIndex(segment.slot);
	return segment.outlined ? cn(SERIES_TINT[index], "ring-1 ring-inset", SERIES_EDGE[index]) : SERIES_FILL[index];
}
function MeterSwatch({ segment, className, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: cn("size-2 flex-none rounded-sm", seriesSwatchClass(segment), className),
		style: segment.hatched ? hatchStyle("1.5px") : void 0,
		...props
	});
}
/** Surface gap between touching fills, and the floor that keeps a present
*  category from rendering as nothing. Both in px. */
const SEGMENT_GAP = 2;
const SEGMENT_MIN = 2;
/**
* A part-to-whole meter: one tinted segment per series, free space left as
* bare track.
*
* Each segment surrenders its share of the gap budget, so the fills and the
* gaps between them together span exactly the used fraction — a bar reading
* half full means half the window is used, however many categories are in it.
*
* The one deliberate overshoot is the {@link SEGMENT_MIN} floor: a category
* present but too small to see is rounded up, and that rounding comes out of
* free space, never out of a neighbouring category. It is bounded by
* `SEGMENT_MIN` per sub-pixel category — on a 288px meter, five such categories
* read about 3 percentage points fuller than the window actually is, and the
* exact figures stay in the legend beside the bar.
*/
const SegmentedMeter = React$1.forwardRef(({ segments, max, highlightId, className, ...props }, ref) => {
	const rendered = segments.filter((segment) => segment.value > 0);
	const gapBudget = Math.max(rendered.length - 1, 0) * SEGMENT_GAP;
	const fractions = rendered.map((segment) => Math.min(segment.value / max, 1));
	const filled = Math.min(fractions.reduce((sum, fraction) => sum + fraction, 0), 1);
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: cn("flex h-2 w-full gap-[2px] overflow-hidden rounded-full bg-surface-tertiary", className),
		...props,
		children: rendered.map((segment, index) => {
			const fraction = fractions[index];
			/** Each segment gives up its share of the gap budget, so the fills and
			*  the gaps between them together span exactly `filled` of the track. */
			const gapShare = filled > 0 ? gapBudget * fraction / filled : 0;
			return /* @__PURE__ */ jsx("div", {
				"aria-hidden": "true",
				className: cn("h-full transition-[width,opacity] duration-300 motion-reduce:transition-none", seriesSwatchClass(segment), highlightId != null && segment.id !== highlightId && "opacity-40"),
				style: {
					width: `calc(${fraction} * 100% - ${gapShare.toFixed(3)}px)`,
					minWidth: `${SEGMENT_MIN}px`,
					...segment.hatched ? hatchStyle("2.5px") : void 0
				}
			}, segment.id);
		})
	});
});
SegmentedMeter.displayName = "SegmentedMeter";
//#endregion
//#region src/components/Collapsible.tsx
const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;
//#endregion
//#region src/components/InputOTP.tsx
const InputOTP = React$1.forwardRef(({ className, containerClassName, ...props }, ref) => /* @__PURE__ */ jsx(OTPInput, {
	ref,
	containerClassName: cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName),
	className: cn("disabled:cursor-not-allowed", className),
	...props
}));
InputOTP.displayName = "InputOTP";
const InputOTPGroup = React$1.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("flex items-center", className),
	...props
}));
InputOTPGroup.displayName = "InputOTPGroup";
const InputOTPSlot = React$1.forwardRef(({ index, className, ...props }, ref) => {
	const inputOTPContext = React$1.useContext(OTPInputContext);
	if (!inputOTPContext) throw new Error("InputOTPSlot must be used within an OTPInput");
	const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: cn("relative flex h-11 w-11 items-center justify-center border-y border-r border-border-medium text-base shadow-sm transition-all first:rounded-l-xl first:border-l last:rounded-r-xl", isActive && "z-10 ring-1 ring-text-primary", className),
		...props,
		children: [char, hasFakeCaret && /* @__PURE__ */ jsx("div", {
			className: "pointer-events-none absolute inset-0 flex items-center justify-center",
			children: /* @__PURE__ */ jsx("div", { className: "animate-caret-blink h-4 w-px bg-text-primary duration-1000" })
		})]
	});
});
InputOTPSlot.displayName = "InputOTPSlot";
const InputOTPSeparator = React$1.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	role: "separator",
	...props,
	children: /* @__PURE__ */ jsx(Minus, {})
}));
InputOTPSeparator.displayName = "InputOTPSeparator";
//#endregion
//#region src/components/MultiSearch.tsx
/** This is a generic that can be added to Menu and Select components */
function MultiSearch({ value, onChange, placeholder, className = "" }) {
	const inputRef = useRef(null);
	const onChangeHandler = useCallback((e) => onChange(e.target.value), [onChange]);
	const clearSearch = () => {
		onChange("");
		setTimeout(() => {
			inputRef.current?.focus();
		}, 0);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cn("focus:to-surface-primary/50 group sticky left-0 top-0 z-10 flex h-12 items-center gap-2 bg-gradient-to-b from-surface-tertiary-alt from-65% to-transparent px-3 py-2 text-text-primary transition-colors duration-300 focus:bg-gradient-to-b focus:from-surface-primary", className),
		children: [
			/* @__PURE__ */ jsx(Search, {
				className: "h-4 w-4 text-text-secondary-alt transition-colors duration-300",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ jsx("input", {
				ref: inputRef,
				type: "text",
				value: value ?? "",
				onChange: onChangeHandler,
				placeholder: String(placeholder ?? "Search..."),
				"aria-label": "Search Model",
				className: "flex-1 rounded-md border-none bg-transparent px-2.5 py-2 text-sm placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-ring-primary"
			}),
			/* @__PURE__ */ jsx("button", {
				className: cn("relative flex h-5 w-5 items-center justify-end rounded-md text-text-secondary-alt", value?.length ?? 0 ? "cursor-pointer opacity-100" : "hidden"),
				"aria-label": "Clear search",
				onClick: clearSearch,
				tabIndex: 0,
				children: /* @__PURE__ */ jsx(X, {
					"aria-hidden": "true",
					className: cn("text-text-secondary-alt", value?.length ?? 0 ? "cursor-pointer opacity-100" : "opacity-0")
				})
			})
		]
	});
}
/**
* Helper function that will take a multiSearch input
* @param node
*/
function defaultGetStringKey(node) {
	if (typeof node === "string") {
		if (node.startsWith("---") && node.endsWith("---")) return "";
		return node.toUpperCase();
	}
	return "";
}
/**
* Hook for conditionally making a multi-element list component into a sortable component
* Returns a RenderNode for search input when search functionality is available
* @param availableOptions
* @param placeholder
* @param getTextKeyOverride
* @param className - Additional classnames to add to the search container
* @param disabled - If the search should be disabled
* @returns
*/
function useMultiSearch({ availableOptions = [], placeholder, getTextKeyOverride, className, disabled = false }) {
	const [filterValue, setFilterValue] = useState(null);
	const shouldShowSearch = availableOptions.length > 10 && !disabled;
	const getTextKeyHelper = getTextKeyOverride || defaultGetStringKey;
	const filteredOptions = useMemo(() => {
		const currentFilter = filterValue ?? "";
		if (!shouldShowSearch || !currentFilter || !availableOptions.length) return availableOptions;
		const upperFilterValue = currentFilter.toUpperCase();
		return availableOptions.filter((value) => getTextKeyHelper(value).includes(upperFilterValue));
	}, [
		availableOptions,
		getTextKeyHelper,
		filterValue,
		shouldShowSearch
	]);
	const onSearchChange = useCallback((nextFilterValue) => setFilterValue(nextFilterValue), []);
	return [filteredOptions, shouldShowSearch ? /* @__PURE__ */ jsx(MultiSearch, {
		value: filterValue,
		className,
		onChange: onSearchChange,
		placeholder
	}) : null];
}
//#endregion
//#region src/components/Resizable.tsx
const ResizablePanelGroup = ({ className = "", ...props }) => /* @__PURE__ */ jsx(Group, {
	className: cn("h-full w-full", className),
	...props
});
const ResizablePanel = Panel;
const ResizableHandle = ({ withHandle, className = "", ...props }) => /* @__PURE__ */ jsx(Separator$1, {
	className: cn("relative flex w-px items-center justify-center bg-border-medium after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary focus-visible:ring-offset-1", className),
	...props,
	children: withHandle && /* @__PURE__ */ jsx("div", {
		className: "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border-medium",
		children: /* @__PURE__ */ jsx(GripVertical, { className: "h-2.5 w-2.5" })
	})
});
const ResizableHandleAlt = ({ withHandle, className = "", ...props }) => /* @__PURE__ */ jsx(Separator$1, {
	className: cn("group relative flex w-px items-center justify-center bg-border-medium after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary focus-visible:ring-offset-1", className),
	...props,
	children: withHandle && /* @__PURE__ */ jsx("div", {
		className: "invisible z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border-medium group-hover:visible group-active:visible group-data-[separator=active]:visible",
		children: /* @__PURE__ */ jsx(GripVertical, { className: "h-2.5 w-2.5" })
	})
});
//#endregion
//#region src/components/Select.tsx
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React$1.forwardRef(({ className = "", children, ...props }, ref) => /* @__PURE__ */ jsxs(SelectPrimitive.Trigger, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-border-medium bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-surface-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", "rounded-lg hover:bg-surface-hover", className),
	...props,
	children: [children, /* @__PURE__ */ jsx(SelectPrimitive.Icon, {
		asChild: true,
		children: /* @__PURE__ */ jsx(CaretSortIcon, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.ScrollUpButton, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ jsx(ChevronUpIcon, {})
}));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.ScrollDownButton, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ jsx(ChevronDownIcon, {})
}));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React$1.forwardRef(({ className = "", children, position = "popper", style, ...props }, ref) => {
	const nestedStyle = useNestedPopoverStyle();
	return /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(SelectPrimitive.Content, {
		ref,
		style: {
			...nestedStyle,
			...style
		},
		className: cn("relative z-40 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border-light bg-surface-secondary text-text-primary shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" ? "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1" : "", className),
		position,
		...props,
		children: [
			/* @__PURE__ */ jsx(SelectScrollUpButton, {}),
			/* @__PURE__ */ jsx(SelectPrimitive.Viewport, {
				className: cn("p-1", position === "popper" ? "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]" : ""),
				children
			}),
			/* @__PURE__ */ jsx(SelectScrollDownButton, {})
		]
	}) });
});
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Label, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React$1.forwardRef(({ className = "", children, ...props }, ref) => /* @__PURE__ */ jsxs(SelectPrimitive.Item, {
	ref,
	className: cn("relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-surface-hover focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50", "rounded-lg hover:bg-surface-hover", className),
	...props,
	children: [/* @__PURE__ */ jsx("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })]
}));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React$1.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Separator, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-surface-tertiary", className),
	...props
}));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
//#endregion
//#region src/components/Radio.tsx
/** Matches the `inset-y-1` the single-row indicator uses. */
const INDICATOR_INSET = 4;
const Radio = memo(function Radio({ options, value, onChange, disabled = false, className = "", buttonClassName = "", fullWidth = false, wrap = false, "aria-labelledby": ariaLabelledBy }) {
	const localize = useLocalize();
	const containerRef = useRef(null);
	const buttonRefs = useRef([]);
	const [isMounted, setIsMounted] = useState(false);
	const [currentValue, setCurrentValue] = useState(value ?? "");
	const [backgroundStyle, setBackgroundStyle] = useState({});
	const handleChange = (newValue) => {
		setCurrentValue(newValue);
		onChange?.(newValue);
	};
	/** A radiogroup is a single tab stop: the roving `tabIndex` puts focus on the
	*  checked segment and the arrows move the selection, per WAI-ARIA. Without
	*  this every segment was its own tab stop and keyboard users could focus a
	*  segment but never reach the others' selection behavior. */
	const handleKeyDown = (event, index) => {
		if (disabled || options.length < 2) return;
		const target = {
			ArrowRight: index + 1,
			ArrowDown: index + 1,
			ArrowLeft: index - 1,
			ArrowUp: index - 1,
			Home: 0,
			End: options.length - 1
		}[event.key];
		if (target == null) return;
		event.preventDefault();
		const next = (target + options.length) % options.length;
		const nextValue = options[next].value;
		buttonRefs.current[next]?.focus();
		if (nextValue === currentValue) return;
		handleChange(nextValue);
	};
	const updateBackgroundStyle = useCallback(() => {
		const selectedIndex = options.findIndex((opt) => opt.value === currentValue);
		const selectedButton = buttonRefs.current[selectedIndex];
		if (selectedIndex < 0 || !selectedButton) return;
		if (!wrap) {
			setBackgroundStyle({
				width: `${selectedButton.offsetWidth}px`,
				transform: `translateX(${selectedButton.offsetLeft}px)`
			});
			return;
		}
		setBackgroundStyle({
			width: `${selectedButton.offsetWidth}px`,
			height: `${selectedButton.offsetHeight - INDICATOR_INSET * 2}px`,
			transform: `translate(${selectedButton.offsetLeft}px, ${selectedButton.offsetTop + INDICATOR_INSET}px)`
		});
	}, [
		currentValue,
		options,
		wrap
	]);
	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		updateBackgroundStyle();
		setIsMounted(true);
		const observer = new ResizeObserver(() => updateBackgroundStyle());
		observer.observe(container);
		return () => observer.disconnect();
	}, [updateBackgroundStyle]);
	useLayoutEffect(() => {
		if (value !== void 0) setCurrentValue(value);
	}, [value]);
	if (options.length === 0) return /* @__PURE__ */ jsx("div", {
		className: "relative inline-flex items-center rounded-lg bg-surface-tertiary p-1 opacity-50",
		role: "radiogroup",
		"aria-labelledby": ariaLabelledBy,
		children: /* @__PURE__ */ jsx("span", {
			className: "px-4 py-2 text-xs text-text-secondary",
			children: localize("com_ui_no_options")
		})
	});
	const selectedIndex = options.findIndex((opt) => opt.value === currentValue);
	return /* @__PURE__ */ jsxs("div", {
		ref: containerRef,
		className: `relative ${fullWidth ? "flex" : "inline-flex"} ${wrap ? "flex-wrap" : ""} items-center rounded-lg bg-surface-tertiary px-1 ${className}`,
		role: "radiogroup",
		"aria-labelledby": ariaLabelledBy,
		children: [selectedIndex >= 0 && isMounted && /* @__PURE__ */ jsx("div", {
			className: `pointer-events-none absolute left-0 rounded-md border border-border-light bg-surface-primary shadow-sm transition-all duration-300 ease-out ${wrap ? "top-0" : "inset-y-1"}`,
			style: backgroundStyle
		}), options.map((option, index) => /* @__PURE__ */ jsxs("button", {
			ref: (el) => {
				buttonRefs.current[index] = el;
			},
			type: "button",
			role: "radio",
			"aria-checked": currentValue === option.value,
			tabIndex: selectedIndex === index || selectedIndex < 0 && index === 0 ? 0 : -1,
			onClick: () => handleChange(option.value),
			onKeyDown: (event) => handleKeyDown(event, index),
			disabled,
			className: `relative z-10 flex h-[34px] items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${currentValue === option.value ? "text-text-primary" : "text-text-secondary"} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${fullWidth ? "flex-1" : ""} ${buttonClassName}`,
			children: [option.icon && /* @__PURE__ */ jsx("span", {
				className: "flex-shrink-0",
				"aria-hidden": "true",
				children: option.icon
			}), /* @__PURE__ */ jsx("span", {
				className: "whitespace-nowrap",
				children: option.label
			})]
		}, option.value))]
	});
});
//#endregion
//#region src/components/Badge.tsx
function Badge({ icon: Icon, label, id, isActive = false, isEditing = false, isDragging = false, isAvailable = true, isInChat = false, onBadgeAction, onToggle, className, ...props }) {
	const isMoveable = isEditing && isAvailable;
	const isDisabled = id === "1" && isInChat;
	const handleClick = (e) => {
		if (isDisabled) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		if (!isEditing && onToggle) {
			e.preventDefault();
			e.stopPropagation();
			onToggle();
		}
	};
	const getWhileTapScale = () => {
		if (isDragging) return 1.1;
		if (isDisabled) return 1;
		return .97;
	};
	const { type: buttonType, onClick: customOnClick, ...buttonProps } = props;
	const handleRootClick = customOnClick ? (event) => customOnClick(event) : handleClick;
	const badgeClassName = cn("group relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5", "border border-border-medium text-sm font-medium transition-shadow", "@container-[600px]:w-full size-9 p-2", isActive ? "bg-surface-active shadow-md" : "bg-surface-chat shadow-sm hover:bg-surface-hover hover:shadow-md", "active:scale-95 active:shadow-inner", isMoveable && "cursor-move", isDisabled && "cursor-not-allowed opacity-50 hover:shadow-sm", className);
	const badgeContent = /* @__PURE__ */ jsxs(Fragment, { children: [
		Icon && /* @__PURE__ */ jsx(Icon, {
			className: cn("@container-[600px]:h-4 @container-[600px]:w-4 relative h-5 w-5", !label && "mx-auto"),
			"aria-hidden": "true"
		}),
		/* @__PURE__ */ jsx("span", {
			className: "@container-[600px]:inline relative hidden",
			children: label
		}),
		isEditing && !isDragging && /* @__PURE__ */ jsx(motion.button, {
			type: "button",
			className: "@container-[600px]:h-5 @container-[600px]:w-5 absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-secondary-alt text-text-primary shadow-sm",
			"aria-label": isAvailable ? `Remove ${label}` : `Restore ${label}`,
			initial: {
				opacity: 0,
				scale: .8
			},
			animate: {
				opacity: 1,
				scale: 1
			},
			exit: {
				opacity: 0,
				scale: .8
			},
			whileTap: { scale: .9 },
			onMouseDown: (e) => e.stopPropagation(),
			onClick: (e) => {
				e.stopPropagation();
				onBadgeAction?.();
			},
			children: /* @__PURE__ */ jsx(MorphIcon, {
				icon: isAvailable ? X$1 : Plus,
				className: "h-3 w-3"
			})
		})
	] });
	if (isEditing) return /* @__PURE__ */ jsx(motion.div, {
		...buttonProps,
		onClick: handleRootClick,
		className: badgeClassName,
		animate: {
			scale: isDragging ? 1.1 : 1,
			boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.1)" : void 0
		},
		whileTap: { scale: getWhileTapScale() },
		transition: {
			type: "tween",
			duration: .1,
			ease: "easeOut"
		},
		children: badgeContent
	});
	return /* @__PURE__ */ jsx(motion.button, {
		type: buttonType ?? "button",
		onClick: handleRootClick,
		className: badgeClassName,
		animate: {
			scale: isDragging ? 1.1 : 1,
			boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.1)" : void 0
		},
		whileTap: { scale: getWhileTapScale() },
		transition: {
			type: "tween",
			duration: .1,
			ease: "easeOut"
		},
		...buttonProps,
		children: badgeContent
	});
}
//#endregion
//#region src/svgs/ArchiveIcon.tsx
function ArchiveIcon({ className = "icon-md" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 18 18",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M3.62188 3.07918C3.87597 2.571 4.39537 2.25 4.96353 2.25H13.0365C13.6046 2.25 14.124 2.571 14.3781 3.07918L15.75 5.82295V13.5C15.75 14.7426 14.7426 15.75 13.5 15.75H4.5C3.25736 15.75 2.25 14.7426 2.25 13.5V5.82295L3.62188 3.07918ZM13.0365 3.75H4.96353L4.21353 5.25H13.7865L13.0365 3.75ZM14.25 6.75H3.75V13.5C3.75 13.9142 4.08579 14.25 4.5 14.25H13.5C13.9142 14.25 14.25 13.9142 14.25 13.5V6.75ZM6.75 9C6.75 8.58579 7.08579 8.25 7.5 8.25H10.5C10.9142 8.25 11.25 8.58579 11.25 9C11.25 9.41421 10.9142 9.75 10.5 9.75H7.5C7.08579 9.75 6.75 9.41421 6.75 9Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/Blocks.tsx
function Blocks({ className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		xmlns: "http://www.w3.org/2000/svg",
		className: cn("lucide lucide-blocks", className),
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("rect", {
			width: "7",
			height: "7",
			x: "14",
			y: "3",
			rx: "1"
		}), /* @__PURE__ */ jsx("path", { d: "M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3" })]
	});
}
//#endregion
//#region src/svgs/Plugin.tsx
function Plugin({ className = "", ...props }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 16 16",
		fill: "none",
		className: cn("h-4 w-4", className),
		width: "16",
		height: "16",
		strokeWidth: "2",
		"aria-hidden": "true",
		...props,
		children: /* @__PURE__ */ jsxs("g", {
			fill: "currentColor",
			children: [/* @__PURE__ */ jsx("path", { d: "M13.164.98a.7.7 0 0 0-1.328 0l-.478 1.435a.7.7 0 0 1-.443.443l-1.436.478a.7.7 0 0 0 0 1.328l1.436.479a.7.7 0 0 1 .443.442l.478 1.436a.7.7 0 0 0 1.328 0l.478-1.436a.7.7 0 0 1 .443-.443l1.436-.478a.7.7 0 0 0 0-1.328l-1.436-.478a.7.7 0 0 1-.443-.443L13.164.979Z" }), /* @__PURE__ */ jsx("path", { d: "M13.237 10.534c-.228-.245-.513-.46-.847-.46a.823.823 0 0 0-.828.849c.04 1.04.128 2.067.263 3.08a.619.619 0 0 1-.528.695c-.872.121-1.748.208-2.626.262a.8.8 0 0 1-.845-.805c0-.325.21-.602.45-.82.235-.215.375-.488.375-.787 0-.683-.738-1.237-1.65-1.237-.911 0-1.65.554-1.65 1.237 0 .294.137.563.364.775.245.229.461.513.461.848a.823.823 0 0 1-.85.829 33.809 33.809 0 0 1-3.266-.278.619.619 0 0 1-.532-.532 34.099 34.099 0 0 1-.278-3.267.823.823 0 0 1 .83-.85c.333 0 .619.216.846.461.212.228.482.364.776.364.683 0 1.237-.738 1.237-1.65 0-.91-.554-1.65-1.237-1.65-.299 0-.572.142-.786.376-.219.24-.496.45-.821.45a.8.8 0 0 1-.805-.845c.054-.885.142-1.76.262-2.626a.619.619 0 0 1 .695-.528c1.022.136 2.05.224 3.08.263a.822.822 0 0 0 .85-.828c0-.334-.217-.62-.462-.847-.227-.212-.363-.482-.363-.776C5.352 1.554 6.09 1 7.002 1c.91 0 1.649.554 1.649 1.237 0 .173-.012.327-.029.473C8.258 3 8 3.41 8 4c0 1.5 1.667 1.833 2.5 2 .167.833.5 2.5 2 2.5.732 0 1.186-.397 1.479-.9l.034-.001c.683 0 1.237.738 1.237 1.65 0 .911-.554 1.65-1.237 1.65-.294 0-.564-.137-.776-.364Z" })]
		})
	});
}
//#endregion
//#region src/svgs/GPTIcon.tsx
function GPTIcon({ size = 25, className = "" }) {
	const unit = "41";
	return /* @__PURE__ */ jsx("svg", {
		width: size,
		height: size,
		viewBox: `0 0 ${unit} ${unit}`,
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		strokeWidth: "1.5",
		className: cn(className, ""),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			d: "M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/EditIcon.tsx
const EditIcon = React.forwardRef((props, ref) => {
	const { className = "icon-md", size = "1.2em" } = props;
	return /* @__PURE__ */ jsx("svg", {
		ref,
		fill: "none",
		strokeWidth: "2",
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		height: size,
		width: size,
		className: cn(className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M13.2929 4.29291C15.0641 2.52167 17.9359 2.52167 19.7071 4.2929C21.4783 6.06414 21.4783 8.93588 19.7071 10.7071L18.7073 11.7069L11.1603 19.2539C10.7182 19.696 10.1489 19.989 9.53219 20.0918L4.1644 20.9864C3.84584 21.0395 3.52125 20.9355 3.29289 20.7071C3.06453 20.4788 2.96051 20.1542 3.0136 19.8356L3.90824 14.4678C4.01103 13.8511 4.30396 13.2818 4.7461 12.8397L13.2929 4.29291ZM13 7.41422L6.16031 14.2539C6.01293 14.4013 5.91529 14.591 5.88102 14.7966L5.21655 18.7835L9.20339 18.119C9.40898 18.0847 9.59872 17.9871 9.7461 17.8397L16.5858 11L13 7.41422ZM18 9.5858L14.4142 6.00001L14.7071 5.70712C15.6973 4.71693 17.3027 4.71693 18.2929 5.70712C19.2831 6.69731 19.2831 8.30272 18.2929 9.29291L18 9.5858Z",
			fill: "currentColor"
		})
	});
});
//#endregion
//#region src/svgs/DataIcon.tsx
function DataIcon({ className = "icon-sm" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M6.00633 5.5C6.02321 5.53319 6.07042 5.60366 6.19525 5.70906C6.42458 5.9027 6.81573 6.12215 7.38659 6.32603C8.5196 6.73067 10.1506 7 12 7C13.8494 7 15.4804 6.73067 16.6134 6.32603C17.1843 6.12215 17.5754 5.9027 17.8048 5.70906C17.9296 5.60366 17.9768 5.53319 17.9937 5.5C17.9768 5.46681 17.9296 5.39634 17.8048 5.29094C17.5754 5.0973 17.1843 4.87785 16.6134 4.67397C15.4804 4.26933 13.8494 4 12 4C10.1506 4 8.5196 4.26933 7.38659 4.67397C6.81573 4.87785 6.42458 5.0973 6.19525 5.29094C6.07042 5.39634 6.02321 5.46681 6.00633 5.5ZM18 7.91726C17.7726 8.02403 17.5333 8.12123 17.2861 8.20951C15.8856 8.70968 14.0166 9 12 9C9.98341 9 8.1144 8.70968 6.71392 8.20951C6.46674 8.12123 6.22738 8.02403 6 7.91726V11.9866C6.00813 12.0073 6.03931 12.0661 6.14259 12.1624C6.31976 12.3277 6.63181 12.5252 7.10609 12.7189C8.04837 13.1039 9.43027 13.3932 11.051 13.476C11.6026 13.5042 12.0269 13.9741 11.9987 14.5257C11.9705 15.0773 11.5005 15.5016 10.949 15.4734C9.17744 15.3829 7.55934 15.0646 6.34969 14.5704C6.23097 14.5219 6.11419 14.4709 6 14.4173V18.4866C6.00813 18.5073 6.03931 18.5661 6.14259 18.6624C6.31976 18.8277 6.63181 19.0252 7.10609 19.2189C8.04837 19.6039 9.43027 19.8932 11.051 19.976C11.6026 20.0042 12.0269 20.4741 11.9987 21.0257C11.9705 21.5773 11.5005 22.0016 10.949 21.9734C9.17744 21.8829 7.55934 21.5646 6.34969 21.0704C5.74801 20.8246 5.19611 20.5146 4.77833 20.1249C4.35948 19.7341 4 19.1866 4 18.5V5.5C4 4.74631 4.43048 4.16346 4.90494 3.76283C5.38405 3.35829 6.01803 3.03902 6.71392 2.79049C8.1144 2.29032 9.98341 2 12 2C14.0166 2 15.8856 2.29032 17.2861 2.79049C17.982 3.03902 18.616 3.35829 19.0951 3.76283C19.5695 4.16346 20 4.74631 20 5.5V10C20 10.5523 19.5523 11 19 11C18.4477 11 18 10.5523 18 10V7.91726ZM17.5 13C18.0523 13 18.5 13.4477 18.5 14V14.6707C18.851 14.7948 19.172 14.9823 19.4492 15.2195L20.0308 14.8837C20.5091 14.6075 21.1207 14.7714 21.3968 15.2497C21.673 15.728 21.5091 16.3396 21.0308 16.6157L20.4499 16.9511C20.4828 17.1291 20.5 17.3125 20.5 17.5C20.5 17.6873 20.4828 17.8707 20.45 18.0485L21.0308 18.3838C21.5091 18.6599 21.6729 19.2715 21.3968 19.7498C21.1206 20.2281 20.5091 20.392 20.0308 20.1158L19.4495 19.7803C19.1722 20.0176 18.8511 20.2052 18.5 20.3293V21C18.5 21.5523 18.0523 22 17.5 22C16.9477 22 16.5 21.5523 16.5 21V20.3293C16.1489 20.2052 15.8277 20.0176 15.5504 19.7802L14.969 20.1159C14.4907 20.392 13.8791 20.2282 13.603 19.7499C13.3269 19.2716 13.4907 18.66 13.969 18.3839L14.55 18.0484C14.5172 17.8706 14.5 17.6873 14.5 17.5C14.5 17.3127 14.5172 17.1294 14.55 16.9515L13.9691 16.6161C13.4908 16.34 13.3269 15.7284 13.6031 15.2501C13.8792 14.7718 14.4908 14.608 14.9691 14.8841L15.5504 15.2197C15.8278 14.9824 16.1489 14.7948 16.5 14.6707V14C16.5 13.4477 16.9477 13 17.5 13ZM16.624 17.0174C16.6274 17.0117 16.6308 17.0059 16.6342 17.0001C16.6374 16.9946 16.6405 16.989 16.6436 16.9834C16.8187 16.6937 17.1367 16.5 17.5 16.5C17.8645 16.5 18.1835 16.6951 18.3583 16.9865C18.3607 16.9909 18.3632 16.9953 18.3658 16.9997C18.3685 17.0044 18.3713 17.0091 18.3741 17.0138C18.4543 17.1577 18.5 17.3235 18.5 17.5C18.5 17.6737 18.4557 17.8371 18.3778 17.9794C18.3737 17.9861 18.3697 17.9929 18.3657 17.9998C18.3619 18.0064 18.3581 18.0131 18.3545 18.0198C18.1789 18.3077 17.8619 18.5 17.5 18.5C17.1362 18.5 16.8178 18.3058 16.6428 18.0154C16.64 18.0102 16.6371 18.005 16.6341 17.9999C16.631 17.9945 16.6278 17.9891 16.6246 17.9838C16.5452 17.8404 16.5 17.6755 16.5 17.5C16.5 17.325 16.545 17.1605 16.624 17.0174Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/Sidebar.tsx
function Sidebar({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M8.85719 3H15.1428C16.2266 2.99999 17.1007 2.99998 17.8086 3.05782C18.5375 3.11737 19.1777 3.24318 19.77 3.54497C20.7108 4.02433 21.4757 4.78924 21.955 5.73005C22.2568 6.32234 22.3826 6.96253 22.4422 7.69138C22.5 8.39925 22.5 9.27339 22.5 10.3572V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118ZM11.5 5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V10.4C20.5 9.26339 20.4992 8.47108 20.4488 7.85424C20.3994 7.24907 20.3072 6.90138 20.173 6.63803C19.8854 6.07354 19.4265 5.6146 18.862 5.32698C18.5986 5.19279 18.2509 5.10062 17.6458 5.05118C17.0289 5.00078 16.2366 5 15.1 5H11.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 7.94772 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/MobileSidebar.tsx
function MobileSidebar({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8C21 8.55228 20.5523 9 20 9H4C3.44772 9 3 8.55228 3 8ZM3 16C3 15.4477 3.44772 15 4 15H14C14.5523 15 15 15.4477 15 16C15 16.5523 14.5523 17 14 17H4C3.44772 17 3 16.5523 3 16Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/Spinner.tsx
/**
* Accessible loading spinner.
*
* Animation is defined in Spinner.css (extracted into the package style bundle),
* never an embedded <style> tag: stylesheet text inside the SVG becomes part of
* the ancestor's textContent, leaking raw CSS into label readouts of any control
* that wraps a spinner.
*/
function Spinner({ className = "m-auto", size = 20, color = "currentColor", bgOpacity = .1, speed = .75 }) {
	const cssVars = { "--spinner-speed": `${speed}s` };
	return /* @__PURE__ */ jsxs("svg", {
		className: cn(className, "spinner"),
		width: size,
		height: size,
		viewBox: "0 0 40 40",
		xmlns: "http://www.w3.org/2000/svg",
		style: cssVars,
		"aria-hidden": "true",
		focusable: "false",
		role: "presentation",
		children: [/* @__PURE__ */ jsx("circle", {
			cx: "20",
			cy: "20",
			r: "14.5",
			pathLength: "100",
			strokeWidth: "5",
			fill: "none",
			stroke: color,
			strokeOpacity: bgOpacity
		}), /* @__PURE__ */ jsx("circle", {
			cx: "20",
			cy: "20",
			r: "14.5",
			pathLength: "100",
			strokeWidth: "5",
			fill: "none",
			stroke: color,
			strokeDasharray: "25 75",
			strokeLinecap: "round"
		})]
	});
}
//#endregion
//#region src/svgs/Clipboard.tsx
function Clipboard({ className = "icon-md-heavy", size = "1em" }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		fill: "none",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn(className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fill: "currentColor",
			fillRule: "evenodd",
			d: "M7 5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h2zm2 2h5a3 3 0 0 1 3 3v5h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1zM5 9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1z",
			clipRule: "evenodd"
		})
	});
}
//#endregion
//#region src/svgs/CheckMark.tsx
function CheckMark({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		fill: "none",
		strokeWidth: "2",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("h-4 w-4", className),
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M18.0633 5.67375C18.5196 5.98487 18.6374 6.607 18.3262 7.06331L10.8262 18.0633C10.6585 18.3093 10.3898 18.4678 10.0934 18.4956C9.79688 18.5234 9.50345 18.4176 9.29289 18.2071L4.79289 13.7071C4.40237 13.3166 4.40237 12.6834 4.79289 12.2929C5.18342 11.9023 5.81658 11.9023 6.20711 12.2929L9.85368 15.9394L16.6738 5.93664C16.9849 5.48033 17.607 5.36263 18.0633 5.67375Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/VerifiedIcon.tsx
/** Verified mark for a first-party item: a scalloped badge filled with
*  `currentColor` (pair it with `text-status-verified`) carrying a check in
*  `text-on-status`. The badge is painted, never stroked — an outline would
*  read as a light halo against the card it sits on. */
function VerifiedIcon({ className, ...props }) {
	const labelled = props["aria-label"] != null || props["aria-labelledby"] != null;
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 24",
		fill: "none",
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		role: labelled ? "img" : void 0,
		"aria-hidden": labelled ? void 0 : true,
		focusable: "false",
		className: cn("h-4 w-4", className),
		...props,
		children: [/* @__PURE__ */ jsx("path", {
			d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("path", {
			d: "m8.4 12.3 2.5 2.5 4.7-4.7",
			className: "stroke-text-on-status",
			strokeWidth: "2.5",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})]
	});
}
//#endregion
//#region src/svgs/CrossIcon.tsx
function CrossIcon({ className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "2",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn(className, "h-4 w-4"),
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ jsx("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		})]
	});
}
//#endregion
//#region src/svgs/LogOutIcon.tsx
function LogOutIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: "icon-md",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			d: "M11 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H11",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round"
		}), /* @__PURE__ */ jsx("path", {
			d: "M20 12H11M20 12L16 16M20 12L16 8",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})]
	});
}
//#endregion
//#region src/svgs/CustomMinimalIcon.tsx
function CustomMinimalIcon({ size = 25, className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("lucide lucide-bot", className),
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", { d: "M12 8V4H8" }),
			/* @__PURE__ */ jsx("rect", {
				width: "16",
				height: "12",
				x: "4",
				y: "8",
				rx: "2"
			}),
			/* @__PURE__ */ jsx("path", { d: "M2 14h2" }),
			/* @__PURE__ */ jsx("path", { d: "M20 14h2" }),
			/* @__PURE__ */ jsx("path", { d: "M15 13v2" }),
			/* @__PURE__ */ jsx("path", { d: "M9 13v2" })
		]
	});
}
//#endregion
//#region src/svgs/LightningIcon.tsx
function LightningIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		fill: "none",
		viewBox: "0 0 24 24",
		strokeWidth: "1.5",
		stroke: "currentColor",
		"aria-hidden": "true",
		className: cn("h-6 w-6", className),
		children: /* @__PURE__ */ jsx("path", {
			strokeLinecap: "round",
			strokeLinejoin: "round",
			d: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
		})
	});
}
//#endregion
//#region src/svgs/AttachmentIcon.tsx
function AttachmentIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M9 7C9 4.23858 11.2386 2 14 2C16.7614 2 19 4.23858 19 7V15C19 18.866 15.866 22 12 22C8.13401 22 5 18.866 5 15V9C5 8.44772 5.44772 8 6 8C6.55228 8 7 8.44772 7 9V15C7 17.7614 9.23858 20 12 20C14.7614 20 17 17.7614 17 15V7C17 5.34315 15.6569 4 14 4C12.3431 4 11 5.34315 11 7V15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15V9C13 8.44772 13.4477 8 14 8C14.5523 8 15 8.44772 15 9V15C15 16.6569 13.6569 18 12 18C10.3431 18 9 16.6569 9 15V7Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/MessagesSquared.tsx
function MessagesSquared({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn(className ?? "", "lucide lucide-messages-square"),
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", { d: "M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" }), /* @__PURE__ */ jsx("path", { d: "M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" })]
	});
}
//#endregion
//#region src/svgs/StopGeneratingIcon.tsx
function StopGeneratingIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "2.5",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("h-3 w-3 text-text-secondary", className),
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("rect", {
			x: "3",
			y: "3",
			width: "18",
			height: "18",
			rx: "2",
			ry: "2"
		})
	});
}
//#endregion
//#region src/svgs/RegenerateIcon.tsx
function RegenerateIcon({ className = "", size = "1em" }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		fill: "none",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("icon-md-heavy", className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fill: "currentColor",
			d: "M3.07 10.876C3.623 6.436 7.41 3 12 3a9.15 9.15 0 0 1 6.012 2.254V4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1H15a1 1 0 1 1 0-2h1.957A7.15 7.15 0 0 0 12 5a7 7 0 0 0-6.946 6.124 1 1 0 1 1-1.984-.248m16.992 1.132a1 1 0 0 1 .868 1.116C20.377 17.564 16.59 21 12 21a9.15 9.15 0 0 1-6-2.244V20a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H7.043A7.15 7.15 0 0 0 12 19a7 7 0 0 0 6.946-6.124 1 1 0 0 1 1.116-.868"
		})
	});
}
//#endregion
//#region src/svgs/ContinueIcon.tsx
function ContinueIcon({ className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "2",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("h-3 w-3 -rotate-180", className),
		height: "19",
		width: "19",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("polygon", { points: "11 19 2 12 11 5 11 19" }), /* @__PURE__ */ jsx("polygon", { points: "22 19 13 12 22 5 22 19" })]
	});
}
//#endregion
//#region src/svgs/GoogleIcon.tsx
function GoogleIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 512 512",
		id: "google",
		className: "h-5 w-5",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", {
				fill: "#fbbb00",
				d: "M113.47 309.408 95.648 375.94l-65.139 1.378C11.042 341.211 0 299.9 0 256c0-42.451 10.324-82.483 28.624-117.732h.014L86.63 148.9l25.404 57.644c-5.317 15.501-8.215 32.141-8.215 49.456.002 18.792 3.406 36.797 9.651 53.408z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#518ef8",
				d: "M507.527 208.176C510.467 223.662 512 239.655 512 256c0 18.328-1.927 36.206-5.598 53.451-12.462 58.683-45.025 109.925-90.134 146.187l-.014-.014-73.044-3.727-10.338-64.535c29.932-17.554 53.324-45.025 65.646-77.911h-136.89V208.176h245.899z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#28b446",
				d: "m416.253 455.624.014.014C372.396 490.901 316.666 512 256 512c-97.491 0-182.252-54.491-225.491-134.681l82.961-67.91c21.619 57.698 77.278 98.771 142.53 98.771 28.047 0 54.323-7.582 76.87-20.818l83.383 68.262z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#f14336",
				d: "m419.404 58.936-82.933 67.896C313.136 112.246 285.552 103.82 256 103.82c-66.729 0-123.429 42.957-143.965 102.724l-83.397-68.276h-.014C71.23 56.123 157.06 0 256 0c62.115 0 119.068 22.126 163.404 58.936z"
			})
		]
	});
}
//#endregion
//#region src/svgs/FacebookIcon.tsx
function FacebookIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 40 40",
		width: "25",
		height: "25",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsxs("linearGradient", {
				id: "a",
				x1: -277.375,
				x2: -277.375,
				y1: 406.602,
				y2: 407.573,
				gradientTransform: "matrix(40 0 0 -39.7778 11115.001 16212.334)",
				gradientUnits: "userSpaceOnUse",
				children: [/* @__PURE__ */ jsx("stop", {
					offset: 0,
					stopColor: "#0062e0"
				}), /* @__PURE__ */ jsx("stop", {
					offset: 1,
					stopColor: "#19afff"
				})]
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "url(#a)",
				d: "M16.7 39.8C7.2 38.1 0 29.9 0 20 0 9 9 0 20 0s20 9 20 20c0 9.9-7.2 18.1-16.7 19.8l-1.1-.9h-4.4l-1.1.9z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#fff",
				d: "m27.8 25.6.9-5.6h-5.3v-3.9c0-1.6.6-2.8 3-2.8H29V8.2c-1.4-.2-3-.4-4.4-.4-4.6 0-7.8 2.8-7.8 7.8V20h-5v5.6h5v14.1c1.1.2 2.2.3 3.3.3 1.1 0 2.2-.1 3.3-.3V25.6h4.4z"
			})
		]
	});
}
//#endregion
//#region src/svgs/OpenIDIcon.tsx
function OpenIDIcon() {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 448 512",
		id: "openid",
		className: "h-5 w-5",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fill: "currentColor",
			d: "M271.5 432l-68 32C88.5 453.7 0 392.5 0 318.2c0-71.5 82.5-131 191.7-144.3v43c-71.5 12.5-124 53-124 101.3 0 51 58.5 93.3 135.7 103v-340l68-33.2v384zM448 291l-131.3-28.5 36.8-20.7c-19.5-11.5-43.5-20-70-24.8v-43c46.2 5.5 87.7 19.5 120.3 39.3l35-19.8L448 291z"
		})
	});
}
//#endregion
//#region src/svgs/GithubIcon.tsx
function GithubIcon() {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "25",
		height: "25",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fill: "currentColor",
			d: "M12 0a12 12 0 0 0-3.84 23.399c.608.112.832-.256.832-.576v-2.015c-3.395.736-4.115-1.632-4.115-1.632a3.241 3.241 0 0 0-1.359-1.792c-1.104-.736.064-.736.064-.736a2.566 2.566 0 0 1 1.824 1.216a2.638 2.638 0 0 0 3.616 1.024a2.607 2.607 0 0 1 .768-1.6c-2.688-.32-5.504-1.344-5.504-5.984a4.677 4.677 0 0 1 1.216-3.168a4.383 4.383 0 0 1 .128-3.136s1.024-.32 3.36 1.216a11.66 11.66 0 0 1 6.112 0c2.336-1.536 3.36-1.216 3.36-1.216a4.354 4.354 0 0 1 .128 3.136a4.628 4.628 0 0 1 1.216 3.168c0 4.672-2.848 5.664-5.536 5.952a2.881 2.881 0 0 1 .832 2.24v3.36c0 .32.224.672.832.576A12 12 0 0 0 12 0z"
		})
	});
}
//#endregion
//#region src/svgs/DiscordIcon.tsx
function DiscordIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 1024 1024",
		id: "discord",
		className: "h-6 w-6",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("circle", {
			cx: "512",
			cy: "512",
			r: "512",
			fill: "#5865f2"
		}), /* @__PURE__ */ jsx("path", {
			fill: "#fff",
			d: "M689.43 349a422.21 422.21 0 0 0-104.22-32.32 1.58 1.58 0 0 0-1.68.79 294.11 294.11 0 0 0-13 26.66 389.78 389.78 0 0 0-117.05 0 269.75 269.75 0 0 0-13.18-26.66 1.64 1.64 0 0 0-1.68-.79A421 421 0 0 0 334.44 349a1.49 1.49 0 0 0-.69.59c-66.37 99.17-84.55 195.9-75.63 291.41a1.76 1.76 0 0 0 .67 1.2 424.58 424.58 0 0 0 127.85 64.63 1.66 1.66 0 0 0 1.8-.59 303.45 303.45 0 0 0 26.15-42.54 1.62 1.62 0 0 0-.89-2.25 279.6 279.6 0 0 1-39.94-19 1.64 1.64 0 0 1-.16-2.72c2.68-2 5.37-4.1 7.93-6.22a1.58 1.58 0 0 1 1.65-.22c83.79 38.26 174.51 38.26 257.31 0a1.58 1.58 0 0 1 1.68.2c2.56 2.11 5.25 4.23 8 6.24a1.64 1.64 0 0 1-.14 2.72 262.37 262.37 0 0 1-40 19 1.63 1.63 0 0 0-.87 2.28 340.72 340.72 0 0 0 26.13 42.52 1.62 1.62 0 0 0 1.8.61 423.17 423.17 0 0 0 128-64.63 1.64 1.64 0 0 0 .67-1.18c10.68-110.44-17.88-206.38-75.7-291.42a1.3 1.3 0 0 0-.63-.63zM427.09 582.85c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.02 28.44-20.37 51.6-46 51.6zm170.13 0c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.01 28.44-20.17 51.6-46 51.6z"
		})]
	});
}
//#endregion
//#region src/svgs/AppleIcon.tsx
function AppleIcon() {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		xmlSpace: "preserve",
		viewBox: "0 0 814 1000",
		id: "apple",
		className: "h-6 w-6",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			d: "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/SamlIcon.tsx
function SamlIcon() {
	return /* @__PURE__ */ jsx("svg", {
		width: "800px",
		height: "800px",
		viewBox: "0 0 16 16",
		xmlns: "http://www.w3.org/2000/svg",
		fill: "none",
		className: "h-5 w-5",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsxs("g", {
			fill: "#000000",
			children: [
				/* @__PURE__ */ jsx("path", { d: "M7.754 2l.463.41c.343.304.687.607 1.026.915C11.44 5.32 13.3 7.565 14.7 10.149c.072.132.137.268.202.403l.098.203-.108.057-.081-.115-.21-.299-.147-.214c-1.019-1.479-2.04-2.96-3.442-4.145a6.563 6.563 0 00-1.393-.904c-1.014-.485-1.916-.291-2.69.505-.736.757-1.118 1.697-1.463 2.653-.045.123-.092.245-.139.367l-.082.215-.172-.055c.1-.348.192-.698.284-1.049.21-.795.42-1.59.712-2.356.31-.816.702-1.603 1.093-2.39.169-.341.338-.682.5-1.025h.092z" }),
				/* @__PURE__ */ jsx("path", { d: "M8.448 11.822c-1.626.77-5.56 1.564-7.426 1.36C.717 11.576 3.71 4.05 5.18 2.91l-.095.218a4.638 4.638 0 01-.138.303l-.066.129c-.76 1.462-1.519 2.926-1.908 4.53a7.482 7.482 0 00-.228 1.689c-.01 1.34.824 2.252 2.217 2.309.67.027 1.347-.043 2.023-.114.294-.03.587-.061.88-.084.108-.008.214-.021.352-.039l.231-.028z" }),
				/* @__PURE__ */ jsx("path", { d: "M3.825 14.781c-.445.034-.89.068-1.333.108 4.097.39 8.03-.277 11.91-1.644-1.265-2.23-2.97-3.991-4.952-5.522.026.098.084.169.141.239l.048.06c.17.226.348.448.527.67.409.509.818 1.018 1.126 1.578.778 1.42.356 2.648-1.168 3.296-1.002.427-2.097.718-3.18.892-1.03.164-2.075.243-3.119.323z" })
			]
		})
	});
}
//#endregion
//#region src/svgs/AnthropicIcon.tsx
function AnthropicIcon({ size = 25, className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 16",
		overflow: "visible",
		width: size,
		height: size,
		className: cn("fill-current", className),
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("g", {
			style: {
				transform: "translateX(13px) rotateZ(0deg)",
				transformOrigin: "4.775px 7.73501px"
			},
			children: /* @__PURE__ */ jsx("path", {
				shapeRendering: "geometricPrecision",
				fillOpacity: "1",
				d: " M0,0 C0,0 6.1677093505859375,15.470022201538086 6.1677093505859375,15.470022201538086 C6.1677093505859375,15.470022201538086 9.550004005432129,15.470022201538086 9.550004005432129,15.470022201538086 C9.550004005432129,15.470022201538086 3.382294178009033,0 3.382294178009033,0 C3.382294178009033,0 0,0 0,0 C0,0 0,0 0,0z"
			})
		}), /* @__PURE__ */ jsx("g", {
			style: {
				transform: "none",
				transformOrigin: "7.935px 7.73501px"
			},
			opacity: "1",
			children: /* @__PURE__ */ jsx("path", {
				shapeRendering: "geometricPrecision",
				fillOpacity: "1",
				d: " M5.824605464935303,9.348296165466309 C5.824605464935303,9.348296165466309 7.93500280380249,3.911694288253784 7.93500280380249,3.911694288253784 C7.93500280380249,3.911694288253784 10.045400619506836,9.348296165466309 10.045400619506836,9.348296165466309 C10.045400619506836,9.348296165466309 5.824605464935303,9.348296165466309 5.824605464935303,9.348296165466309 C5.824605464935303,9.348296165466309 5.824605464935303,9.348296165466309 5.824605464935303,9.348296165466309z M6.166755199432373,0 C6.166755199432373,0 0,15.470022201538086 0,15.470022201538086 C0,15.470022201538086 3.4480772018432617,15.470022201538086 3.4480772018432617,15.470022201538086 C3.4480772018432617,15.470022201538086 4.709278583526611,12.22130012512207 4.709278583526611,12.22130012512207 C4.709278583526611,12.22130012512207 11.16093635559082,12.22130012512207 11.16093635559082,12.22130012512207 C11.16093635559082,12.22130012512207 12.421928405761719,15.470022201538086 12.421928405761719,15.470022201538086 C12.421928405761719,15.470022201538086 15.87000560760498,15.470022201538086 15.87000560760498,15.470022201538086 C15.87000560760498,15.470022201538086 9.703250885009766,0 9.703250885009766,0 C9.703250885009766,0 6.166755199432373,0 6.166755199432373,0 C6.166755199432373,0 6.166755199432373,0 6.166755199432373,0z"
			})
		})]
	});
}
//#endregion
//#region src/svgs/SendIcon.tsx
function SendIcon({ size = 24, className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		className: cn("text-text-inverted", className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			d: "M7 11L12 6L17 11M12 18V7",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	});
}
//#endregion
//#region src/svgs/LinkIcon.tsx
function LinkIcon() {
	return /* @__PURE__ */ jsx("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: "icon-md",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M15 5C14.4477 5 14 4.55228 14 4C14 3.44772 14.4477 3 15 3H20C20.5523 3 21 3.44772 21 4V9C21 9.55228 20.5523 10 20 10C19.4477 10 19 9.55228 19 9V6.41421L13.7071 11.7071C13.3166 12.0976 12.6834 12.0976 12.2929 11.7071C11.9024 11.3166 11.9024 10.6834 12.2929 10.2929L17.5858 5H15ZM4 7C4 5.34315 5.34315 4 7 4H10C10.5523 4 11 4.44772 11 5C11 5.55228 10.5523 6 10 6H7C6.44772 6 6 6.44772 6 7V17C6 17.5523 6.44772 18 7 18H17C17.5523 18 18 17.5523 18 17V14C18 13.4477 18.4477 13 19 13C19.5523 13 20 13.4477 20 14V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V7Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/DotsIcon.tsx
function DotsIcon({ className = "h-4 w-4 flex-shrink-0 text-text-secondary" }) {
	return /* @__PURE__ */ jsxs("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "2",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className,
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "1"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "19",
				cy: "12",
				r: "1"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "5",
				cy: "12",
				r: "1"
			})
		]
	});
}
//#endregion
//#region src/svgs/GearIcon.tsx
const GearIcon = ({ className = "" }) => {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		width: "17",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			d: "M11.6439 3C10.9352 3 10.2794 3.37508 9.92002 3.98596L9.49644 4.70605C8.96184 5.61487 7.98938 6.17632 6.93501 6.18489L6.09967 6.19168C5.39096 6.19744 4.73823 6.57783 4.38386 7.19161L4.02776 7.80841C3.67339 8.42219 3.67032 9.17767 4.01969 9.7943L4.43151 10.5212C4.95127 11.4386 4.95127 12.5615 4.43151 13.4788L4.01969 14.2057C3.67032 14.8224 3.67339 15.5778 4.02776 16.1916L4.38386 16.8084C4.73823 17.4222 5.39096 17.8026 6.09966 17.8083L6.93502 17.8151C7.98939 17.8237 8.96185 18.3851 9.49645 19.294L9.92002 20.014C10.2794 20.6249 10.9352 21 11.6439 21H12.3561C13.0648 21 13.7206 20.6249 14.08 20.014L14.5035 19.294C15.0381 18.3851 16.0106 17.8237 17.065 17.8151L17.9004 17.8083C18.6091 17.8026 19.2618 17.4222 19.6162 16.8084L19.9723 16.1916C20.3267 15.5778 20.3298 14.8224 19.9804 14.2057L19.5686 13.4788C19.0488 12.5615 19.0488 11.4386 19.5686 10.5212L19.9804 9.7943C20.3298 9.17767 20.3267 8.42219 19.9723 7.80841L19.6162 7.19161C19.2618 6.57783 18.6091 6.19744 17.9004 6.19168L17.065 6.18489C16.0106 6.17632 15.0382 5.61487 14.5036 4.70605L14.08 3.98596C13.7206 3.37508 13.0648 3 12.3561 3H11.6439Z",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinejoin: "round"
		}), /* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "2.5",
			stroke: "currentColor",
			strokeWidth: "2"
		})]
	});
};
//#endregion
//#region src/svgs/PinIcon.tsx
function PinIcon({ unpin = false }) {
	if (unpin) return /* @__PURE__ */ jsxs("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: "icon-sm",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", {
				d: "M15 15V17.5585C15 18.4193 14.4491 19.1836 13.6325 19.4558L13.1726 19.6091C12.454 19.8487 11.6616 19.6616 11.126 19.126L4.87403 12.874C4.33837 12.3384 4.15132 11.546 4.39088 10.8274L4.54415 10.3675C4.81638 9.55086 5.58066 9 6.44152 9H9M12 6.2L13.6277 3.92116C14.3461 2.91549 15.7955 2.79552 16.6694 3.66942L20.3306 7.33058C21.2045 8.20448 21.0845 9.65392 20.0788 10.3723L18 11.8571",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M8 16L3 21",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M4 4L20 20",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})
		]
	});
	return /* @__PURE__ */ jsx("svg", {
		className: "icon-sm",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M17.4845 2.8798C16.1773 1.57258 14.0107 1.74534 12.9272 3.24318L9.79772 7.56923C9.60945 7.82948 9.30775 7.9836 8.98654 7.9836H6.44673C3.74061 7.9836 2.27414 11.6759 4.16948 13.5713L6.59116 15.993L2.29324 20.2909C1.90225 20.6819 1.90225 21.3158 2.29324 21.7068C2.68422 22.0977 3.31812 22.0977 3.70911 21.7068L8.00703 17.4088L10.4287 19.8305C12.3241 21.7259 16.0164 20.2594 16.0164 17.5533V15.0135C16.0164 14.6923 16.1705 14.3906 16.4308 14.2023L20.7568 11.0728C22.2547 9.98926 22.4274 7.8227 21.1202 6.51549L17.4845 2.8798ZM11.8446 18.4147C12.4994 19.0694 14.0141 18.4928 14.0141 17.5533V15.0135C14.0141 14.0499 14.4764 13.1447 15.2572 12.58L19.5832 9.45047C20.0825 9.08928 20.1401 8.3671 19.7043 7.93136L16.0686 4.29567C15.6329 3.85993 14.9107 3.91751 14.5495 4.4168L11.4201 8.74285C10.8553 9.52359 9.95016 9.98594 8.98654 9.98594H6.44673C5.5072 9.98594 4.93059 11.5006 5.58535 12.1554L11.8446 18.4147Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/TrashIcon.tsx
function TrashIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		fill: "none",
		strokeWidth: "2",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("icon-md h-4 w-4", className),
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M10.5555 4C10.099 4 9.70052 4.30906 9.58693 4.75114L9.29382 5.8919H14.715L14.4219 4.75114C14.3083 4.30906 13.9098 4 13.4533 4H10.5555ZM16.7799 5.8919L16.3589 4.25342C16.0182 2.92719 14.8226 2 13.4533 2H10.5555C9.18616 2 7.99062 2.92719 7.64985 4.25342L7.22886 5.8919H4C3.44772 5.8919 3 6.33961 3 6.8919C3 7.44418 3.44772 7.8919 4 7.8919H4.10069L5.31544 19.3172C5.47763 20.8427 6.76455 22 8.29863 22H15.7014C17.2354 22 18.5224 20.8427 18.6846 19.3172L19.8993 7.8919H20C20.5523 7.8919 21 7.44418 21 6.8919C21 6.33961 20.5523 5.8919 20 5.8919H16.7799ZM17.888 7.8919H6.11196L7.30423 19.1057C7.3583 19.6142 7.78727 20 8.29863 20H15.7014C16.2127 20 16.6417 19.6142 16.6958 19.1057L17.888 7.8919ZM10 10C10.5523 10 11 10.4477 11 11V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V11C9 10.4477 9.44772 10 10 10ZM14 10C14.5523 10 15 10.4477 15 11V16C15 16.5523 14.5523 17 14 17C13.4477 17 13 16.5523 13 16V11C13 10.4477 13.4477 10 14 10Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/MinimalPlugin.tsx
function MinimalPlugin({ size, className = "icon-md" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M15.4646 19C15.2219 20.6961 13.7632 22 12 22C10.2368 22 8.77806 20.6961 8.53544 19H6C4.34315 19 3 17.6569 3 16V13.5C3 12.9477 3.44772 12.5 4 12.5H4.5C5.32843 12.5 6 11.8284 6 11C6 10.1716 5.32843 9.5 4.5 9.5H4C3.44772 9.5 3 9.05229 3 8.5L3 6C3 4.34315 4.34315 3 6 3L18 3C19.6569 3 21 4.34315 21 6L21 16C21 17.6569 19.6569 19 18 19H15.4646ZM12 20C12.8284 20 13.5 19.3284 13.5 18.5V18C13.5 17.4477 13.9477 17 14.5 17H18C18.5523 17 19 16.5523 19 16L19 6C19 5.44772 18.5523 5 18 5L6 5C5.44772 5 5 5.44772 5 6V7.53544C6.69615 7.77806 8 9.23676 8 11C8 12.7632 6.69615 14.2219 5 14.4646L5 16C5 16.5523 5.44771 17 6 17H9.5C10.0523 17 10.5 17.4477 10.5 18V18.5C10.5 19.3284 11.1716 20 12 20Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/AzureMinimalIcon.tsx
function AzureMinimalIcon({ size = 25, className = "h-4 w-4" }) {
	const height = size;
	const width = size;
	return /* @__PURE__ */ jsxs("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "2",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn(className, ""),
		width,
		height,
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", { d: "m8.0458 0.81981a1.1197 1.1197 0 0 0-1.0608 0.76184l-6.7912 20.123a1.1178 1.1178 0 0 0 1.0592 1.4751h5.4647a1.1197 1.1197 0 0 0 1.0608-0.7615l1.3528-4.0084-2.3684-2.2107a0.51536 0.51536 0 0 1 0.35193-0.8923h3.0639l1.8213-5.3966-2.8111-8.3294a1.1181 1.1181 0 0 0-1.0595-0.76049h-0.0836z" }),
			/* @__PURE__ */ jsx("path", { d: "m7.1147 15.307a0.51536 0.51536 0 0 0-0.35193 0.8923l7.1552 6.6782a1.1248 1.1248 0 0 0 0.76724 0.30238h0.2417a1.1181 1.1181 0 0 0 1.0534-1.4755l-2.1591-6.3974z" }),
			/* @__PURE__ */ jsx("path", { d: "m17.015 1.5807a1.1178 1.1178 0 0 0-1.0593-0.76049h-7.8258a1.1181 1.1181 0 0 1 1.0593 0.76049l6.7916 20.123a1.1181 1.1181 0 0 1-1.0593 1.4757h7.8261a1.1181 1.1181 0 0 0 1.059-1.4757z" })
		]
	});
}
//#endregion
//#region src/svgs/OpenAIMinimalIcon.tsx
function OpenAIMinimalIcon({ className = "h-4 w-4" }) {
	return /* @__PURE__ */ jsx("svg", {
		stroke: "currentColor",
		fill: "currentColor",
		strokeWidth: "1",
		viewBox: "0 0 40 40",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className,
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", { d: "M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" })
	});
}
//#endregion
//#region src/svgs/ChatGPTMinimalIcon.tsx
function ChatGPTMinimalIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		className: "lucide lucide-bot",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("rect", {
				width: "18",
				height: "10",
				x: "3",
				y: "11",
				rx: "2"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "5",
				r: "2"
			}),
			/* @__PURE__ */ jsx("path", { d: "M12 7v4" }),
			/* @__PURE__ */ jsx("line", {
				x1: "8",
				x2: "8",
				y1: "16",
				y2: "16"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "16",
				x2: "16",
				y1: "16",
				y2: "16"
			})
		]
	});
}
//#endregion
//#region src/svgs/PaLMinimalIcon.tsx
function PaLMinimalIcon({ className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "1",
		viewBox: "0 0 32 32",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("h-4 w-4", className),
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", { d: "m16 30.238c1.2298 0 2.2259-0.99608 2.2259-2.2259v-11.46c-0.63513-0.56429-1.6553-1.6805-2.2259-2.251-0.79858 0.83793-1.3599 1.3599-2.2259 2.251v11.46c0 1.2298 0.99608 2.2259 2.2259 2.2259z" }),
			/* @__PURE__ */ jsx("path", { d: "m24.868 15.761c-0.61691-0.61643-1.3121-1.1065-2.0536-1.4703-6.8147 0.010467 0.13304 0.031026-6.8147 0.010467l9.5286 9.5286c0.39324 0.39324 1.0703 0.23743 1.2372-0.29122 0.83841-2.6544 0.20589-5.6723-1.8976-7.7776z" }),
			/* @__PURE__ */ jsx("path", { d: "m7.1318 15.761c0.5902-0.58975 1.2521-1.0639 1.9575-1.4224 6.9107-0.037427-0.11812-0.057288 6.9107-0.037427l-9.5286 9.5286c-0.39324 0.39324-1.0703 0.23743-1.2372-0.29122-0.83841-2.6543-0.20589-5.6723 1.8976-7.7776z" }),
			/* @__PURE__ */ jsx("path", { d: "m24.162 8.3655c-0.93169 0-1.8288 0.15009-2.6691 0.42772-5.4924 5.5079 0 0-5.4924 5.5079h15.069c0.61767 0 1.0295-0.65292 0.74938-1.2038-1.432-2.8102-4.3219-4.7318-7.657-4.7318z" }),
			/* @__PURE__ */ jsx("path", { d: "m17.575 4.333c-0.62613 0.62613-1.1343 1.3257-1.5248 2.0718 1.6767 4.1174 0.53518 6.3909-0.05003 7.8964l10.656-10.656c0.43775-0.43775 0.2671-1.1908-0.3209-1.3819-3.0012-0.97382-6.4031-0.28751-8.7607 2.0701z" }),
			/* @__PURE__ */ jsx("path", { d: "m14.425 4.333c2.6822 2.6822 3.1997 6.7129 1.5748 9.9682l-10.656-10.656c-0.43775-0.43775-0.2671-1.1908 0.3209-1.3819 3.0012-0.97382 6.4031-0.28751 8.7607 2.0701z" }),
			/* @__PURE__ */ jsx("path", { d: "m7.8385 8.3655c0.9121 0 1.791 0.14385 2.616 0.41037 5.5455 5.5253-0.061773 0.011675 5.5455 5.5253h-15.069c-0.61768 0-1.0295-0.65292-0.74938-1.2038 1.432-2.8102 4.3219-4.7318 7.657-4.7318z" })
		]
	});
}
//#endregion
//#region src/svgs/PaLMIcon.tsx
function PaLMIcon({ size = 25, className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		width: size,
		height: size,
		className,
		viewBox: "0 0 19 17",
		fill: "none",
		preserveAspectRatio: "xMidYMid meet",
		focusable: "false",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", {
				d: "M9.62674 16.2202H9.7049C10.4225 16.2202 11.0016 15.6412 11.0016 14.9236V4.04224H8.33008V14.92C8.33008 15.6376 8.90914 16.2202 9.62674 16.2202Z",
				fill: "#F9AB00"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M14.6819 8.02813C13.3249 6.66752 11.2964 6.39398 9.66577 7.2004L15.0585 12.5931C15.2823 12.8169 15.6624 12.7281 15.7583 12.4297C16.2308 10.927 15.8756 9.21822 14.6819 8.02813Z",
				fill: "#5BB974"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M4.64953 8.02813C6.00659 6.66752 8.03507 6.39398 9.66567 7.2004L4.27297 12.5931C4.04916 12.8169 3.66904 12.7281 3.57312 12.4297C3.10064 10.927 3.45589 9.21822 4.64953 8.02813Z",
				fill: "#129EAF"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M14.284 3.84326C12.1383 3.84326 10.3159 5.25005 9.66577 7.20038H18.1918C18.5399 7.20038 18.7744 6.83092 18.6145 6.5183C17.8081 4.93033 16.1704 3.84326 14.284 3.84326Z",
				fill: "#AF5CF7"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M10.5574 1.55901C9.04053 3.07593 8.74567 5.36019 9.66577 7.20039L15.6944 1.17179C15.943 0.923113 15.8436 0.496814 15.5132 0.390239C13.8151 -0.1604 11.8896 0.226822 10.5574 1.55901Z",
				fill: "#FF8BCB"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M8.77408 1.55901C10.291 3.07593 10.5859 5.36019 9.66576 7.20039L3.63716 1.17179C3.38848 0.923113 3.48795 0.496814 3.81833 0.390239C5.51643 -0.1604 7.44189 0.226822 8.77408 1.55901Z",
				fill: "#FA7B17"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M5.04752 3.84326C7.19323 3.84326 9.01566 5.25005 9.66577 7.20038H1.13976C0.791616 7.20038 0.55715 6.83092 0.717013 6.5183C1.52343 4.93033 3.16114 3.84326 5.04752 3.84326Z",
				fill: "#4285F4"
			})
		]
	});
}
//#endregion
//#region src/svgs/CodeyIcon.tsx
function CodeyIcon({ size = 25, className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: size,
		height: size,
		className: cn("dark:fill-white", className),
		viewBox: "0 0 18 18",
		preserveAspectRatio: "xMidYMid meet",
		focusable: "false",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			d: "M2 4.006C2 2.898 2.897 2 4.006 2h9.988C15.102 2 16 2.897 16 4.006v9.988A2.005 2.005 0 0 1 13.994 16H4.006A2.005 2.005 0 0 1 2 13.994V4.006zM13.992 9l.003-.003L10.997 6 9.75 7.247 11.503 9 9.75 10.753 10.997 12l2.997-2.997L13.992 9zm-9.99 0L4 8.997 6.997 6l1.247 1.247L6.492 9l1.753 1.753L6.997 12 4 9.003 4.003 9z",
			fillRule: "evenodd"
		})
	});
}
//#endregion
//#region src/svgs/GeminiIcon.tsx
function GeminiIcon({ size = 25, className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		width: size,
		height: size,
		className,
		viewBox: "0 0 18 18",
		preserveAspectRatio: "xMidYMid meet",
		focusable: "false",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			fill: "url(#_4rif_paint0_radial_897_42)",
			d: "M9 18c0-1.245-.24-2.415-.72-3.51a8.934 8.934 0 00-1.912-2.857A8.934 8.934 0 003.51 9.72 8.646 8.646 0 000 9a8.886 8.886 0 003.51-.697 9.247 9.247 0 002.857-1.936A8.934 8.934 0 008.28 3.51C8.76 2.415 9 1.245 9 0c0 1.245.232 2.415.697 3.51a9.247 9.247 0 001.936 2.857 9.247 9.247 0 002.857 1.936A8.886 8.886 0 0018 9c-1.245 0-2.415.24-3.51.72a8.934 8.934 0 00-2.857 1.912 9.247 9.247 0 00-1.935 2.858A8.886 8.886 0 009 18z"
		}), /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("radialGradient", {
			id: "_4rif_paint0_radial_897_42",
			cx: "0",
			cy: "0",
			r: "1",
			gradientUnits: "userSpaceOnUse",
			gradientTransform: "rotate(135 9 3.728) scale(25.4558 12.7279)",
			children: [/* @__PURE__ */ jsx("stop", {
				offset: ".325",
				stopColor: "#FFDDB7"
			}), /* @__PURE__ */ jsx("stop", {
				offset: ".706",
				stopColor: "#076EFF"
			})]
		}) })]
	});
}
//#endregion
//#region src/svgs/GoogleMinimalIcon.tsx
function GoogleMinimalIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		fill: "currentColor",
		width: "800px",
		height: "800px",
		viewBox: "0 0 512 512",
		className: cn("h-4 w-4", className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", { d: "M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z" })
	});
}
//#endregion
//#region src/svgs/AnthropicMinimalIcon.tsx
function AnthropicMinimalIcon() {
	return /* @__PURE__ */ jsx("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "1",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: "h-4 w-4",
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", { d: "m17.304 3.5472h-3.6718l6.6959 16.906h3.6718zm-10.608 0-6.6959 16.906h3.7442l1.3693-3.5502h7.0052l1.3693 3.5502h3.7442l-6.6959-16.906zm-0.37114 10.216 2.2914-5.9413 2.2914 5.9413z" })
	});
}
//#endregion
//#region src/svgs/ListeningIcon.tsx
function ListeningIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		className: cn(className),
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" }),
			/* @__PURE__ */ jsx("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
			/* @__PURE__ */ jsx("line", {
				x1: "12",
				x2: "12",
				y1: "19",
				y2: "22"
			})
		]
	});
}
//#endregion
//#region src/svgs/VolumeIcon.tsx
function VolumeIcon({ className = "", size = "1em" }) {
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		className: cn(className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M11 4.9099C11 4.47485 10.4828 4.24734 10.1621 4.54132L6.67572 7.7372C6.49129 7.90626 6.25019 8.00005 6 8.00005H4C3.44772 8.00005 3 8.44776 3 9.00005V15C3 15.5523 3.44772 16 4 16H6C6.25019 16 6.49129 16.0938 6.67572 16.2629L10.1621 19.4588C10.4828 19.7527 11 19.5252 11 19.0902V4.9099ZM8.81069 3.06701C10.4142 1.59714 13 2.73463 13 4.9099V19.0902C13 21.2655 10.4142 22.403 8.81069 20.9331L5.61102 18H4C2.34315 18 1 16.6569 1 15V9.00005C1 7.34319 2.34315 6.00005 4 6.00005H5.61102L8.81069 3.06701ZM20.3166 6.35665C20.8019 6.09313 21.409 6.27296 21.6725 6.75833C22.5191 8.3176 22.9996 10.1042 22.9996 12.0001C22.9996 13.8507 22.5418 15.5974 21.7323 17.1302C21.4744 17.6185 20.8695 17.8054 20.3811 17.5475C19.8927 17.2896 19.7059 16.6846 19.9638 16.1962C20.6249 14.9444 20.9996 13.5175 20.9996 12.0001C20.9996 10.4458 20.6064 8.98627 19.9149 7.71262C19.6514 7.22726 19.8312 6.62017 20.3166 6.35665ZM15.7994 7.90049C16.241 7.5688 16.8679 7.65789 17.1995 8.09947C18.0156 9.18593 18.4996 10.5379 18.4996 12.0001C18.4996 13.3127 18.1094 14.5372 17.4385 15.5604C17.1357 16.0222 16.5158 16.1511 16.0539 15.8483C15.5921 15.5455 15.4632 14.9255 15.766 14.4637C16.2298 13.7564 16.4996 12.9113 16.4996 12.0001C16.4996 10.9859 16.1653 10.0526 15.6004 9.30063C15.2687 8.85905 15.3578 8.23218 15.7994 7.90049Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/VolumeMuteIcon.tsx
function VolumeMuteIcon({ className = "", size = "1em" }) {
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		className: cn(className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM9.5 8.5C8.94772 8.5 8.5 8.94772 8.5 9.5V14.5C8.5 15.0523 8.94772 15.5 9.5 15.5H14.5C15.0523 15.5 15.5 15.0523 15.5 14.5V9.5C15.5 8.94772 15.0523 8.5 14.5 8.5H9.5Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/SendMessageIcon.tsx
function SendMessageIcon() {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 16 16",
		fill: "none",
		className: "icon-sm m-1 md:m-0",
		style: {
			width: "1em",
			height: "1em",
			verticalAlign: "middle"
		},
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			d: "M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/UserIcon.tsx
function UserIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "7",
			r: "4"
		})]
	});
}
//#endregion
//#region src/svgs/LockIcon.tsx
function LockIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: "lucide lucide-lock",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("rect", {
			width: "18",
			height: "11",
			x: "3",
			y: "11",
			rx: "2",
			ry: "2"
		}), /* @__PURE__ */ jsx("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
	});
}
//#endregion
//#region src/svgs/NewChatIcon.tsx
function NewChatIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: cn("text-text-primary", className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M16.7929 2.79289C18.0118 1.57394 19.9882 1.57394 21.2071 2.79289C22.4261 4.01184 22.4261 5.98815 21.2071 7.20711L12.7071 15.7071C12.5196 15.8946 12.2652 16 12 16H9C8.44772 16 8 15.5523 8 15V12C8 11.7348 8.10536 11.4804 8.29289 11.2929L16.7929 2.79289ZM19.7929 4.20711C19.355 3.7692 18.645 3.7692 18.2071 4.2071L10 12.4142V14H11.5858L19.7929 5.79289C20.2308 5.35499 20.2308 4.64501 19.7929 4.20711ZM6 5C5.44772 5 5 5.44771 5 6V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V14C19 13.4477 19.4477 13 20 13C20.5523 13 21 13.4477 21 14V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6C3 4.34314 4.34315 3 6 3H10C10.5523 3 11 3.44771 11 4C11 4.55228 10.5523 5 10 5H6Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/ExperimentIcon.tsx
function ExperimentIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: "icon-sm",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			d: "M9 3H15M9 3V9.2759C9 9.74377 8.83597 10.1968 8.53644 10.5563L4.85085 14.979C4.30108 15.6387 4 16.4703 4 17.3291V17.3291C4 19.3565 5.64353 21 7.67094 21H16.3291C18.3565 21 20 19.3565 20 17.3291V17.3291C20 16.4703 19.6989 15.6387 19.1492 14.979L15.4636 10.5563C15.164 10.1968 15 9.74377 15 9.2759V3M9 3H8M15 3H16",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}), /* @__PURE__ */ jsx("path", {
			d: "M5 14.774C11.5 12.839 12.15 16.7089 18 14",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})]
	});
}
//#endregion
//#region src/svgs/GoogleIconChat.tsx
function Google({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		fill: "currentColor",
		width: "24px",
		height: "24px",
		viewBox: "0 0 512 512",
		strokeWidth: "1.5",
		className: cn(className, ""),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", { d: "M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z" })
	});
}
//#endregion
//#region src/svgs/BirthdayIcon.tsx
function BirthdayIcon({ className = "" }) {
	return /* @__PURE__ */ jsxs("svg", {
		version: "1.1",
		viewBox: "0 0 233.33 290",
		xmlns: "http://www.w3.org/2000/svg",
		xmlnsXlink: "http://www.w3.org/1999/xlink",
		className: cn("h-9 w-9", className),
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", {
			id: "linearGradient1842",
			x1: "163.92",
			x2: "173.66",
			y1: "22.212",
			y2: "-6.5784",
			gradientTransform: "translate(.10391 .050143)",
			gradientUnits: "userSpaceOnUse",
			children: [
				/* @__PURE__ */ jsx("stop", {
					stopColor: "#640a62",
					offset: "0"
				}),
				/* @__PURE__ */ jsx("stop", {
					stopColor: "#852283",
					offset: ".49917"
				}),
				/* @__PURE__ */ jsx("stop", {
					stopColor: "#640a62",
					offset: "1"
				})
			]
		}) }), /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("path", {
				transform: "matrix(.43416 .90084 -.89966 .4366 0 0)",
				d: "m259.29-126.03a232.2 237.56 0 0 1-17.412 231.34l-193.32-131.59z",
				fill: "url(#linearGradient1842)"
			}),
			/* @__PURE__ */ jsx("path", {
				transform: "matrix(.6967 .051926 -.051926 .6967 35.578 23.196)",
				d: "m50.818 31.415c-1.4654 2.4749-10.838 2.4195-12.997 4.3204-2.1584 1.9009-3.288 11.206-5.9282 12.347-2.6402 1.1409-10.191-4.4132-13.054-4.1441-2.8636 0.26917-9.2466 7.133-12.053 6.5041-2.8066-0.62889-5.6503-9.5602-8.1252-11.026-2.4749-1.4654-11.673 0.33572-13.574-1.8227s1.0482-11.056-0.0927-13.696c-1.1409-2.6402-9.6412-6.5898-9.9104-9.4533-0.26917-2.8636 7.3463-8.328 7.9752-11.135 0.62889-2.8066-3.9265-10.998-2.4612-13.473 1.4654-2.4749 10.838-2.4195 12.997-4.3204 2.1584-1.9009 3.288-11.206 5.9282-12.347 2.6402-1.1409 10.191 4.4132 13.054 4.1441 2.8636-0.26917 9.2466-7.133 12.053-6.5041 2.8066 0.62889 5.6503 9.5602 8.1252 11.026s11.673-0.33572 13.574 1.8227c1.9009 2.1584-1.0482 11.056 0.0927 13.696 1.1409 2.6402 9.6412 6.5898 9.9104 9.4533 0.26917 2.8635-7.3463 8.328-7.9752 11.135-0.62889 2.8066 3.9265 10.998 2.4612 13.473z",
				fill: "#ff9d78",
				stroke: "#f29472",
				strokeWidth: "4.7877"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "170.36",
				cy: "215.76",
				r: "12.903",
				fill: "#cfffff"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "m220.77 174.77c-88.526 101.03-191.21 85.731-209.5 82.142-2.2101-2e-5 -2.6686 0.42426-3.437 2.0021l-1.7042 7.5028c0.056197 2.3603 0.37544 2.6428 1.9121 3.5409 18.396 3.3746 130.27 19.488 223.46-86.881 0.64011-1.5095 0.46653-3.1324-0.59137-4.7337l-5.1558-3.6482c-1.586-0.8743-3.9524-0.94332-4.9837 0.0751z",
				color: "#000000",
				fill: "#ff9d78",
				stroke: "#f29472",
				strokeLinejoin: "round",
				strokeWidth: "2.8913"
			}),
			/* @__PURE__ */ jsxs("g", {
				fill: "#cfffff",
				children: [
					/* @__PURE__ */ jsx("circle", {
						cx: "72.684",
						cy: "99.47",
						r: "12.903"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: "99.144",
						cy: "172.32",
						r: "12.903"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: "59.617",
						cy: "214.78",
						r: "12.903"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: "135.4",
						cy: "118.42",
						r: "12.903"
					}),
					/* @__PURE__ */ jsx("path", {
						transform: "rotate(38.66)",
						d: "m254.21-1.9608a12.903 12.903 0 0 1-6.4852 11.194 12.903 12.903 0 0 1-12.937-0.0582 12.903 12.903 0 0 1-6.3843-11.252l12.903 0.1161z"
					}),
					/* @__PURE__ */ jsx("path", { d: "m29.476 158.16a12.903 12.903 0 0 0-3.6562 0.5293l-3.3691 23.189a12.903 12.903 0 0 0 7.0254 2.0879 12.903 12.903 0 0 0 12.904-12.904 12.903 12.903 0 0 0-12.904-12.902z" })
				]
			})
		] })]
	});
}
//#endregion
//#region src/svgs/AssistantIcon.tsx
function AssistantIcon({ className = "", size = "1em" }) {
	const unit = 24;
	return /* @__PURE__ */ jsxs("svg", {
		width: size,
		height: size,
		viewBox: `0 0 ${unit} ${unit}`,
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn("h-2/3 w-2/3 text-text-secondary", className),
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
			/* @__PURE__ */ jsx("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
			/* @__PURE__ */ jsx("line", {
				x1: "12",
				y1: "22.08",
				x2: "12",
				y2: "12"
			})
		]
	});
}
//#endregion
//#region src/svgs/Sparkles.tsx
function Sparkles({ className = "", size = 24 }) {
	return /* @__PURE__ */ jsxs("svg", {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: cn("icon-md shrink-0", className),
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			d: "M19.3975 1.35498C19.3746 1.15293 19.2037 1.00021 19.0004 1C18.7971 0.999793 18.6259 1.15217 18.6026 1.35417C18.4798 2.41894 18.1627 3.15692 17.6598 3.65983C17.1569 4.16274 16.4189 4.47983 15.3542 4.60264C15.1522 4.62593 14.9998 4.79707 15 5.00041C15.0002 5.20375 15.1529 5.37457 15.355 5.39746C16.4019 5.51605 17.1562 5.83304 17.6716 6.33906C18.1845 6.84269 18.5078 7.57998 18.6016 8.63539C18.6199 8.84195 18.7931 9.00023 19.0005 9C19.2078 8.99977 19.3806 8.84109 19.3985 8.6345C19.4883 7.59673 19.8114 6.84328 20.3273 6.32735C20.8433 5.81142 21.5967 5.48834 22.6345 5.39851C22.8411 5.38063 22.9998 5.20782 23 5.00045C23.0002 4.79308 22.842 4.61992 22.6354 4.60157C21.58 4.50782 20.8427 4.18447 20.3391 3.67157C19.833 3.15623 19.516 2.40192 19.3975 1.35498Z",
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M11 3C11.4833 3 11.8974 3.34562 11.9839 3.82111C12.4637 6.46043 13.279 8.23983 14.5196 9.48039C15.7602 10.721 17.5396 11.5363 20.1789 12.0161C20.6544 12.1026 21 12.5167 21 13C21 13.4833 20.6544 13.8974 20.1789 13.9839C17.5396 14.4637 15.7602 15.279 14.5196 16.5196C13.279 17.7602 12.4637 19.5396 11.9839 22.1789C11.8974 22.6544 11.4833 23 11 23C10.5167 23 10.1026 22.6544 10.0161 22.1789C9.53625 19.5396 8.72096 17.7602 7.48039 16.5196C6.23983 15.279 4.46043 14.4637 1.82111 13.9839C1.34562 13.8974 1 13.4833 1 13C1 12.5167 1.34562 12.1026 1.82111 12.0161C4.46043 11.5363 6.23983 10.721 7.48039 9.48039C8.72096 8.23983 9.53625 6.46043 10.0161 3.82111C10.1026 3.34562 10.5167 3 11 3ZM5.66618 13C6.9247 13.5226 7.99788 14.2087 8.89461 15.1054C9.79134 16.0021 10.4774 17.0753 11 18.3338C11.5226 17.0753 12.2087 16.0021 13.1054 15.1054C14.0021 14.2087 15.0753 13.5226 16.3338 13C15.0753 12.4774 14.0021 11.7913 13.1054 10.8946C12.2087 9.99788 11.5226 8.9247 11 7.66618C10.4774 8.9247 9.79134 9.99788 8.89461 10.8946C7.99788 11.7913 6.9247 12.4774 5.66618 13Z",
			fill: "currentColor"
		})]
	});
}
//#endregion
//#region src/svgs/SpeechIcon.tsx
function SpeechIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn(className),
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", { d: "M2 10v3" }),
			/* @__PURE__ */ jsx("path", { d: "M6 6v11" }),
			/* @__PURE__ */ jsx("path", { d: "M10 3v18" }),
			/* @__PURE__ */ jsx("path", { d: "M14 8v7" }),
			/* @__PURE__ */ jsx("path", { d: "M18 5v13" }),
			/* @__PURE__ */ jsx("path", { d: "M22 10v3" })
		]
	});
}
//#endregion
//#region src/svgs/SaveIcon.tsx
function SaveIcon({ size = "1em", className }) {
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "64 64 896 896",
		strokeWidth: "2.5",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className,
		width: size,
		height: size,
		fill: "currentColor",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", { d: "M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z" })
	});
}
//#endregion
//#region src/svgs/CircleHelpIcon.tsx
function CircleHelpIcon({ className = "icon-md-heavy", size = "1em" }) {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: cn(className),
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "10"
			}),
			/* @__PURE__ */ jsx("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
			/* @__PURE__ */ jsx("path", { d: "M12 17h.01" })
		]
	});
}
//#endregion
//#region src/svgs/BedrockIcon.tsx
function BedrockIcon({ size = 25, className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		xmlns: "http://www.w3.org/2000/svg",
		className: cn("fill-current", className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("g", {
			fill: "currentColor",
			children: /* @__PURE__ */ jsx("path", { d: "M12,18.1397014 L9.574,18.9487014 L8.628,18.3177014 L9.658,17.9737014 L9.342,17.0257014 L7.574,17.6147014 L7,17.2327014 L7,14.4997014 C7,14.3107014 6.893,14.1377014 6.724,14.0527014 L5,13.1907014 L5,10.8087014 L6.5,10.0587014 L8,10.8087014 L8,12.4997014 C8,12.6897014 8.107,12.8627014 8.276,12.9477014 L10.276,13.9477014 L10.724,13.0527014 L9,12.1907014 L9,10.8087014 L10.724,9.94770136 C10.893,9.86270136 11,9.68970136 11,9.49970136 L11,7.99970136 L10,7.99970136 L10,9.19070136 L8.5,9.94070136 L7,9.19070136 L7,6.76770136 L8,6.10070136 L8,7.99970136 L9,7.99970136 L9,5.43470136 L9.574,5.05170136 L12,5.86070136 L12,18.1397014 Z M17.5,16.9997014 C17.775,16.9997014 18,17.2237014 18,17.4997014 C18,17.7757014 17.775,17.9997014 17.5,17.9997014 C17.225,17.9997014 17,17.7757014 17,17.4997014 C17,17.2237014 17.225,16.9997014 17.5,16.9997014 L17.5,16.9997014 Z M16.5,5.99970136 C16.775,5.99970136 17,6.22370136 17,6.49970136 C17,6.77570136 16.775,6.99970136 16.5,6.99970136 C16.225,6.99970136 16,6.77570136 16,6.49970136 C16,6.22370136 16.225,5.99970136 16.5,5.99970136 L16.5,5.99970136 Z M18.5,11.9997014 C18.775,11.9997014 19,12.2237014 19,12.4997014 C19,12.7757014 18.775,12.9997014 18.5,12.9997014 C18.225,12.9997014 18,12.7757014 18,12.4997014 C18,12.2237014 18.225,11.9997014 18.5,11.9997014 L18.5,11.9997014 Z M17.092,12.9997014 C17.299,13.5807014 17.849,13.9997014 18.5,13.9997014 C19.327,13.9997014 20,13.3277014 20,12.4997014 C20,11.6727014 19.327,10.9997014 18.5,10.9997014 C17.849,10.9997014 17.299,11.4197014 17.092,11.9997014 L13,11.9997014 L13,9.99970136 L16.5,9.99970136 C16.776,9.99970136 17,9.77670136 17,9.49970136 L17,7.90770136 C17.581,7.70070136 18,7.15070136 18,6.49970136 C18,5.67270136 17.327,4.99970136 16.5,4.99970136 C15.673,4.99970136 15,5.67270136 15,6.49970136 C15,7.15070136 15.419,7.70070136 16,7.90770136 L16,8.99970136 L13,8.99970136 L13,5.49970136 C13,5.28470136 12.862,5.09370136 12.658,5.02570136 L9.658,4.02570136 C9.511,3.97670136 9.351,3.99870136 9.223,4.08370136 L6.223,6.08370136 C6.084,6.17670136 6,6.33270136 6,6.49970136 L6,9.19070136 L4.276,10.0527014 C4.107,10.1377014 4,10.3107014 4,10.4997014 L4,13.4997014 C4,13.6897014 4.107,13.8627014 4.276,13.9477014 L6,14.8087014 L6,17.4997014 C6,17.6667014 6.084,17.8237014 6.223,17.9157014 L9.223,19.9157014 C9.306,19.9717014 9.402,19.9997014 9.5,19.9997014 C9.553,19.9997014 9.606,19.9917014 9.658,19.9737014 L12.658,18.9737014 C12.862,18.9067014 13,18.7157014 13,18.4997014 L13,15.9997014 L15.293,15.9997014 L16.146,16.8537014 L16.159,16.8407014 C16.061,17.0407014 16,17.2627014 16,17.4997014 C16,18.3267014 16.673,18.9997014 17.5,18.9997014 C18.327,18.9997014 19,18.3267014 19,17.4997014 C19,16.6727014 18.327,15.9997014 17.5,15.9997014 C17.262,15.9997014 17.04,16.0607014 16.841,16.1597014 L16.854,16.1467014 L15.854,15.1467014 C15.76,15.0527014 15.633,14.9997014 15.5,14.9997014 L13,14.9997014 L13,12.9997014 L17.092,12.9997014 Z" })
		})
	});
}
//#endregion
//#region src/svgs/ThumbUpIcon.tsx
function ThumbUpIcon({ className = "", size = "1em", bold = false }) {
	return bold ? /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		fill: "none",
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			d: "M12.592 2.50386C12.8047 2.13014 13.2317 1.935 13.652 2.01942C15.5627 2.40314 16.7246 4.36079 16.1516 6.23085L15.303 9L17.0142 9C19.6409 9 21.5485 11.5079 20.8574 14.0525L19.4994 19.0525C19.0267 20.7927 17.4526 22 15.6562 22H9.96721C8.869 21.9979 7.97939 21.1033 7.97939 20V9H8.31734C8.67472 9 9.0047 8.80771 9.18201 8.49613L12.592 2.50386Z",
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("path", {
			d: "M5.98763 9C4.33761 9 3 10.3431 3 12V19C3 20.6569 4.33761 22 5.98763 22H6.52055C6.18162 21.4116 5.98763 20.7286 5.98763 20V9Z",
			fill: "currentColor"
		})]
	}) : /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		fill: "none",
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M12.1318 2.50389C12.3321 2.15338 12.7235 1.95768 13.124 2.00775L13.5778 2.06447C16.0449 2.37286 17.636 4.83353 16.9048 7.20993L16.354 8.99999H17.0722C19.7097 8.99999 21.6253 11.5079 20.9313 14.0525L19.5677 19.0525C19.0931 20.7927 17.5124 22 15.7086 22H6C4.34315 22 3 20.6568 3 19V12C3 10.3431 4.34315 8.99999 6 8.99999H8C8.25952 8.99999 8.49914 8.86094 8.6279 8.63561L12.1318 2.50389ZM10 20H15.7086C16.6105 20 17.4008 19.3964 17.6381 18.5262L19.0018 13.5262C19.3488 12.2539 18.391 11 17.0722 11H15C14.6827 11 14.3841 10.8494 14.1956 10.5941C14.0071 10.3388 13.9509 10.0092 14.0442 9.70591L14.9932 6.62175C15.3384 5.49984 14.6484 4.34036 13.5319 4.08468L10.3644 9.62789C10.0522 10.1742 9.56691 10.5859 9 10.8098V19C9 19.5523 9.44772 20 10 20ZM7 11V19C7 19.3506 7.06015 19.6872 7.17071 20H6C5.44772 20 5 19.5523 5 19V12C5 11.4477 5.44772 11 6 11H7Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/ThumbDownIcon.tsx
function ThumbDownIcon({ className = "", size = "1em", bold = false }) {
	return bold ? /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		fill: "none",
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			d: "M11.4079 21.4961C11.1953 21.8698 10.7683 22.0649 10.348 21.9805C8.4373 21.5968 7.27541 19.6391 7.84844 17.7691L8.69697 14.9999L6.98577 14.9999C4.35915 14.9999 2.45151 12.492 3.14262 9.94747L4.50063 4.94747C4.97329 3.20722 6.54741 1.99994 8.34378 1.99994H14.0328C15.131 2.00207 16.0206 2.89668 16.0206 3.99994V14.9999H15.6827C15.3253 14.9999 14.9953 15.1922 14.818 15.5038L11.4079 21.4961Z",
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("path", {
			d: "M18.0124 14.9999C19.6624 14.9999 21 13.6568 21 11.9999V4.99994C21 3.34308 19.6624 1.99994 18.0124 1.99994H17.4794C17.8184 2.58829 18.0124 3.27136 18.0124 3.99994V14.9999Z",
			fill: "currentColor"
		})]
	}) : /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		height: size,
		width: size,
		fill: "none",
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M11.8727 21.4961C11.6725 21.8466 11.2811 22.0423 10.8805 21.9922L10.4267 21.9355C7.95958 21.6271 6.36855 19.1665 7.09975 16.7901L7.65054 15H6.93226C4.29476 15 2.37923 12.4921 3.0732 9.94753L4.43684 4.94753C4.91145 3.20728 6.49209 2 8.29589 2H18.0045C19.6614 2 21.0045 3.34315 21.0045 5V12C21.0045 13.6569 19.6614 15 18.0045 15H16.0045C15.745 15 15.5054 15.1391 15.3766 15.3644L11.8727 21.4961ZM14.0045 4H8.29589C7.39399 4 6.60367 4.60364 6.36637 5.47376L5.00273 10.4738C4.65574 11.746 5.61351 13 6.93226 13H9.00451C9.32185 13 9.62036 13.1506 9.8089 13.4059C9.99743 13.6612 10.0536 13.9908 9.96028 14.2941L9.01131 17.3782C8.6661 18.5002 9.35608 19.6596 10.4726 19.9153L13.6401 14.3721C13.9523 13.8258 14.4376 13.4141 15.0045 13.1902V5C15.0045 4.44772 14.5568 4 14.0045 4ZM17.0045 13V5C17.0045 4.64937 16.9444 4.31278 16.8338 4H18.0045C18.5568 4 19.0045 4.44772 19.0045 5V12C19.0045 12.5523 18.5568 13 18.0045 13H17.0045Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/XAIcon.tsx
function XAIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		focusable: "false",
		fill: "currentColor",
		className,
		children: /* @__PURE__ */ jsx("path", { d: "m3.005 8.858 8.783 12.544h3.904L6.908 8.858zM6.905 15.825 3 21.402h3.907l1.951-2.788zM16.585 2l-6.75 9.64 1.953 2.79L20.492 2zM17.292 7.965v13.437h3.2V3.395z" })
	});
}
//#endregion
//#region src/svgs/PersonalizationIcon.tsx
function PersonalizationIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: `icon-sm ${className}`,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", {
			fillRule: "evenodd",
			clipRule: "evenodd",
			d: "M12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4ZM7 7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7C17 9.76142 14.7614 12 12 12C9.23858 12 7 9.76142 7 7ZM19.0277 15.6255C18.6859 15.5646 18.1941 15.6534 17.682 16.1829C17.4936 16.3777 17.2342 16.4877 16.9632 16.4877C16.6922 16.4877 16.4328 16.3777 16.2444 16.1829C15.7322 15.6534 15.2405 15.5646 14.8987 15.6255C14.5381 15.6897 14.2179 15.9384 14.0623 16.3275C13.8048 16.9713 13.9014 18.662 16.9632 20.4617C20.0249 18.662 20.1216 16.9713 19.864 16.3275C19.7084 15.9384 19.3882 15.6897 19.0277 15.6255ZM21.721 15.5847C22.5748 17.7191 21.2654 20.429 17.437 22.4892C17.1412 22.6484 16.7852 22.6484 16.4893 22.4892C12.6609 20.4291 11.3516 17.7191 12.2053 15.5847C12.6117 14.5689 13.4917 13.8446 14.5481 13.6565C15.3567 13.5125 16.2032 13.6915 16.9632 14.1924C17.7232 13.6915 18.5697 13.5125 19.3783 13.6565C20.4347 13.8446 21.3147 14.5689 21.721 15.5847ZM9.92597 14.2049C10.1345 14.7163 9.889 15.2999 9.3776 15.5084C7.06131 16.453 5.5 18.5813 5.5 20.9999C5.5 21.5522 5.05228 21.9999 4.5 21.9999C3.94772 21.9999 3.5 21.5522 3.5 20.9999C3.5 17.6777 5.641 14.8723 8.6224 13.6565C9.1338 13.448 9.71743 13.6935 9.92597 14.2049Z",
			fill: "currentColor"
		})
	});
}
//#endregion
//#region src/svgs/MCPIcon.tsx
function MCPIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		width: "195",
		height: "195",
		viewBox: "0 2 195 195",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", {
				d: "M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177",
				stroke: "currentColor",
				strokeWidth: "16",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52",
				stroke: "currentColor",
				strokeWidth: "16",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822",
				stroke: "currentColor",
				strokeWidth: "16",
				strokeLinecap: "round"
			})
		]
	});
}
//#endregion
//#region src/svgs/VectorIcon.tsx
function VectorIcon({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "20",
		height: "20",
		viewBox: "0 0 20 20",
		fill: "currentColor",
		xmlns: "http://www.w3.org/2000/svg",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", { d: "M7.45996 14.375C7.45996 13.3616 6.63844 12.54 5.625 12.54C4.61156 12.54 3.79004 13.3616 3.79004 14.375C3.79004 15.3884 4.61156 16.21 5.625 16.21C6.63844 16.21 7.45996 15.3884 7.45996 14.375ZM16.21 14.375C16.21 13.3616 15.3884 12.54 14.375 12.54C13.3616 12.54 12.54 13.3616 12.54 14.375C12.54 15.3884 13.3616 16.21 14.375 16.21C15.3884 16.21 16.21 15.3884 16.21 14.375ZM7.45996 5.625C7.45996 4.61156 6.63844 3.79004 5.625 3.79004C4.61156 3.79004 3.79004 4.61156 3.79004 5.625C3.79004 6.63844 4.61156 7.45996 5.625 7.45996C6.63844 7.45996 7.45996 6.63844 7.45996 5.625ZM16.21 5.625C16.21 4.61156 15.3884 3.79004 14.375 3.79004C13.3616 3.79004 12.54 4.61156 12.54 5.625C12.54 6.63844 13.3616 7.45996 14.375 7.45996C15.3884 7.45996 16.21 6.63844 16.21 5.625ZM17.54 14.375C17.54 16.123 16.123 17.54 14.375 17.54C12.627 17.54 11.21 16.123 11.21 14.375C11.21 12.627 12.627 11.21 14.375 11.21C16.123 11.21 17.54 12.627 17.54 14.375ZM8.79004 5.625C8.79004 7.37298 7.37298 8.79004 5.625 8.79004C3.87702 8.79004 2.45996 7.37298 2.45996 5.625C2.45996 3.87702 3.87702 2.45996 5.625 2.45996C7.37298 2.45996 8.79004 3.87702 8.79004 5.625ZM17.54 5.625C17.54 7.37298 16.123 8.79004 14.375 8.79004C13.7416 8.79004 13.153 8.60173 12.6582 8.28125L8.28125 12.6582C8.60173 13.153 8.79004 13.7416 8.79004 14.375C8.79004 16.123 7.37298 17.54 5.625 17.54C3.87702 17.54 2.45996 16.123 2.45996 14.375C2.45996 12.627 3.87702 11.21 5.625 11.21C6.25794 11.21 6.84623 11.3977 7.34082 11.7178L11.7178 7.34082C11.3977 6.84623 11.21 6.25794 11.21 5.625C11.21 3.87702 12.627 2.45996 14.375 2.45996C16.123 2.45996 17.54 3.87702 17.54 5.625Z" })
	});
}
//#endregion
//#region src/svgs/SquirclePlusIcon.tsx
function SquirclePlusIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		stroke: "currentColor",
		fill: "none",
		strokeWidth: "2",
		viewBox: "0 0 24 24",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: "text-3xl",
		height: "1em",
		width: "1em",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("line", {
			x1: "12",
			y1: "5",
			x2: "12",
			y2: "19"
		}), /* @__PURE__ */ jsx("line", {
			x1: "5",
			y1: "12",
			x2: "19",
			y2: "12"
		})]
	});
}
//#endregion
//#region src/svgs/AudioPaths.tsx
function AudioPaths() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("path", {
			d: "M8 15v6",
			stroke: "white",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M13 8v20",
			stroke: "white",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M18 10v16",
			stroke: "white",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M23 6v24",
			stroke: "white",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M28 12v12",
			stroke: "white",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	] });
}
//#endregion
//#region src/svgs/CodePaths.tsx
function CodePaths() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", {
		d: "M21.333 23L26.333 18L21.333 13",
		stroke: "white",
		strokeWidth: "1.66667",
		strokeLinecap: "round",
		strokeLinejoin: "round"
	}), /* @__PURE__ */ jsx("path", {
		d: "M14.667 13L9.66699 18L14.667 23",
		stroke: "white",
		strokeWidth: "1.66667",
		strokeLinecap: "round",
		strokeLinejoin: "round"
	})] });
}
//#endregion
//#region src/svgs/FileIcon.tsx
function FileIcon({ file, fileType }) {
	return /* @__PURE__ */ jsxs("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 36 36",
		fill: "none",
		className: "h-10 w-10 flex-shrink-0",
		width: "36",
		height: "36",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("rect", {
			width: "36",
			height: "36",
			rx: "6",
			fill: fileType.fill
		}), (file?.["progress"] ?? 1) >= 1 && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(fileType.paths, {}) })]
	});
}
//#endregion
//#region src/svgs/FilePaths.tsx
function FilePaths() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", {
		d: "M18.833 9.66663H12.9997C12.5576 9.66663 12.1337 9.84222 11.8212 10.1548C11.5086 10.4673 11.333 10.8913 11.333 11.3333V24.6666C11.333 25.1087 11.5086 25.5326 11.8212 25.8451C12.1337 26.1577 12.5576 26.3333 12.9997 26.3333H22.9997C23.4417 26.3333 23.8656 26.1577 24.1782 25.8451C24.4907 25.5326 24.6663 25.1087 24.6663 24.6666V15.5L18.833 9.66663Z",
		stroke: "white",
		strokeWidth: "1.66667",
		strokeLinecap: "round",
		strokeLinejoin: "round"
	}), /* @__PURE__ */ jsx("path", {
		d: "M18.833 9.66663V15.5H24.6663",
		stroke: "white",
		strokeWidth: "1.66667",
		strokeLinecap: "round",
		strokeLinejoin: "round"
	})] });
}
//#endregion
//#region src/svgs/SheetPaths.tsx
function SheetPaths() {
	return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("path", {
		d: "M15.5 10.5H12.1667C11.2462 10.5 10.5 11.2462 10.5 12.1667V13.5V18M15.5 10.5H23.8333C24.7538 10.5 25.5 11.2462 25.5 12.1667V13.5V18M15.5 10.5V25.5M15.5 25.5H18H23.8333C24.7538 25.5 25.5 24.7538 25.5 23.8333V18M15.5 25.5H12.1667C11.2462 25.5 10.5 24.7538 10.5 23.8333V18M10.5 18H25.5",
		stroke: "white",
		strokeWidth: "1.66667",
		strokeLinecap: "round",
		strokeLinejoin: "round"
	}) });
}
//#endregion
//#region src/svgs/TextPaths.tsx
function TextPaths() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("path", {
			d: "M19.6663 9.66663H12.9997C12.5576 9.66663 12.1337 9.84222 11.8212 10.1548C11.5086 10.4673 11.333 10.8913 11.333 11.3333V24.6666C11.333 25.1087 11.5086 25.5326 11.8212 25.8451C12.1337 26.1577 12.5576 26.3333 12.9997 26.3333H22.9997C23.4417 26.3333 23.8656 26.1577 24.1782 25.8451C24.4907 25.5326 24.6663 25.1087 24.6663 24.6666V14.6666L19.6663 9.66663Z",
			stroke: "white",
			strokeWidth: "1.66667",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M19.667 9.66663V14.6666H24.667",
			stroke: "white",
			strokeWidth: "1.66667",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M21.3337 18.8334H14.667",
			stroke: "white",
			strokeWidth: "1.66667",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M21.3337 22.1666H14.667",
			stroke: "white",
			strokeWidth: "1.66667",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: "M16.3337 15.5H15.5003H14.667",
			stroke: "white",
			strokeWidth: "1.66667",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	] });
}
//#endregion
//#region src/svgs/VideoPaths.tsx
function VideoPaths() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("rect", {
		x: "8",
		y: "10",
		width: "20",
		height: "16",
		rx: "3",
		stroke: "white",
		strokeWidth: "2",
		fill: "none"
	}), /* @__PURE__ */ jsx("path", {
		d: "M22 18l-6 4v-8L22 18z",
		fill: "white"
	})] });
}
//#endregion
//#region src/svgs/SharePointIcon.tsx
function SharePointIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		fill: "currentColor",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("path", { d: "M24 13.5q0 1.242-.475 2.332-.474 1.09-1.289 1.904-.814.815-1.904 1.29-1.09.474-2.332.474-.762 0-1.523-.2-.106.997-.557 1.858-.451.862-1.154 1.494-.704.633-1.606.99-.902.358-1.91.358-1.09 0-2.045-.416-.955-.416-1.664-1.125-.709-.709-1.125-1.664Q6 19.84 6 18.75q0-.188.018-.375.017-.188.04-.375H.997q-.41 0-.703-.293T0 17.004V6.996q0-.41.293-.703T.996 6h3.54q.14-1.277.726-2.373.586-1.096 1.488-1.904Q7.652.914 8.807.457 9.96 0 11.25 0q1.395 0 2.625.533T16.02 1.98q.914.915 1.447 2.145T18 6.75q0 .188-.012.375-.011.188-.035.375 1.242 0 2.344.469 1.101.468 1.928 1.277.826.809 1.3 1.904Q24 12.246 24 13.5zm-12.75-12q-.973 0-1.857.34-.885.34-1.577.943-.691.604-1.154 1.43Q6.2 5.039 6.06 6h4.945q.41 0 .703.293t.293.703v4.945l.21-.035q.212-.75.61-1.424.399-.673.944-1.218.545-.545 1.213-.944.668-.398 1.43-.61.093-.503.093-.96 0-1.09-.416-2.045-.416-.955-1.125-1.664-.709-.709-1.664-1.125Q12.34 1.5 11.25 1.5zM6.117 15.902q.54 0 1.06-.111.522-.111.932-.37.41-.257.662-.679.252-.422.252-1.055 0-.632-.263-1.054-.264-.422-.662-.703-.399-.282-.856-.463l-.855-.34q-.399-.158-.662-.334-.264-.176-.264-.445 0-.2.14-.323.141-.123.335-.193.193-.07.404-.094.21-.023.351-.023.598 0 1.055.152.457.153.95.457V8.543q-.282-.082-.522-.14-.24-.06-.475-.1-.234-.041-.486-.059-.252-.017-.557-.017-.515 0-1.054.117-.54.117-.979.375-.44.258-.715.68-.275.421-.275 1.03 0 .598.263.997.264.398.663.68.398.28.855.474l.856.363q.398.17.662.358.263.187.263.457 0 .222-.123.351-.123.13-.31.2-.188.07-.393.087-.205.018-.369.018-.703 0-1.248-.234-.545-.235-1.107-.621v1.875q1.195.468 2.472.468zM11.25 22.5q.773 0 1.453-.293t1.19-.803q.51-.51.808-1.195.299-.686.299-1.459 0-.668-.223-1.277-.222-.61-.62-1.096-.4-.486-.95-.826-.55-.34-1.207-.48v1.933q0 .41-.293.703t-.703.293H7.57q-.07.375-.07.75 0 .773.293 1.459t.803 1.195q.51.51 1.195.803.686.293 1.459.293zM18 18q.926 0 1.746-.352.82-.351 1.436-.966.615-.616.966-1.43.352-.815.352-1.752 0-.926-.352-1.746-.351-.82-.966-1.436-.616-.615-1.436-.966Q18.926 9 18 9t-1.74.357q-.815.358-1.43.973t-.973 1.43q-.357.814-.357 1.74 0 .129.006.258t.017.258q.551.27 1.02.65t.838.855q.369.475.627 1.026.258.55.387 1.148Q17.18 18 18 18Z" })
	});
}
//#endregion
//#region src/svgs/MoonshotIcon.tsx
function MoonshotIcon({ className = "" }) {
	return /* @__PURE__ */ jsx("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		focusable: "false",
		fill: "currentColor",
		className,
		children: /* @__PURE__ */ jsx("path", { d: "M1.052 16.916l9.539 2.552a21.007 21.007 0 00.06 2.033l5.956 1.593a11.997 11.997 0 01-5.586.865l-.18-.016-.044-.004-.084-.009-.094-.01a11.605 11.605 0 01-.157-.02l-.107-.014-.11-.016a11.962 11.962 0 01-.32-.051l-.042-.008-.075-.013-.107-.02-.07-.015-.093-.019-.075-.016-.095-.02-.097-.023-.094-.022-.068-.017-.088-.022-.09-.024-.095-.025-.082-.023-.109-.03-.062-.02-.084-.025-.093-.028-.105-.034-.058-.019-.08-.026-.09-.031-.066-.024a6.293 6.293 0 01-.044-.015l-.068-.025-.101-.037-.057-.022-.08-.03-.087-.035-.088-.035-.079-.032-.095-.04-.063-.028-.063-.027a5.655 5.655 0 01-.041-.018l-.066-.03-.103-.047-.052-.024-.096-.046-.062-.03-.084-.04-.086-.044-.093-.047-.052-.027-.103-.055-.057-.03-.058-.032a6.49 6.49 0 01-.046-.026l-.094-.053-.06-.034-.051-.03-.072-.041-.082-.05-.093-.056-.052-.032-.084-.053-.061-.039-.079-.05-.07-.047-.053-.035a7.785 7.785 0 01-.054-.036l-.044-.03-.044-.03a6.066 6.066 0 01-.04-.028l-.057-.04-.076-.054-.069-.05-.074-.054-.056-.042-.076-.057-.076-.059-.086-.067-.045-.035-.064-.052-.074-.06-.089-.073-.046-.039-.046-.039a7.516 7.516 0 01-.043-.037l-.045-.04-.061-.053-.07-.062-.068-.06-.062-.058-.067-.062-.053-.05-.088-.084a13.28 13.28 0 01-.099-.097l-.029-.028-.041-.042-.069-.07-.05-.051-.05-.053a6.457 6.457 0 01-.168-.179l-.08-.088-.062-.07-.071-.08-.042-.049-.053-.062-.058-.068-.046-.056a7.175 7.175 0 01-.027-.033l-.045-.055-.066-.082-.041-.052-.05-.064-.02-.025a11.99 11.99 0 01-1.44-2.402zm-1.02-5.794l11.353 3.037a20.468 20.468 0 00-.469 2.011l10.817 2.894a12.076 12.076 0 01-1.845 2.005L.657 15.923l-.016-.046-.035-.104a11.965 11.965 0 01-.05-.153l-.007-.023a11.896 11.896 0 01-.207-.741l-.03-.126-.018-.08-.021-.097-.018-.081-.018-.09-.017-.084-.018-.094c-.026-.141-.05-.283-.071-.426l-.017-.118-.011-.083-.013-.102a12.01 12.01 0 01-.019-.161l-.005-.047a12.12 12.12 0 01-.034-2.145zm1.593-5.15l11.948 3.196c-.368.605-.705 1.231-1.01 1.875l11.295 3.022c-.142.82-.368 1.612-.668 2.365l-11.55-3.09L.124 10.26l.015-.1.008-.049.01-.067.015-.087.018-.098c.026-.148.056-.295.088-.442l.028-.124.02-.085.024-.097c.022-.09.045-.18.07-.268l.028-.102.023-.083.03-.1.025-.082.03-.096.026-.082.031-.095a11.896 11.896 0 011.01-2.232zm4.442-4.4L17.352 4.59a20.77 20.77 0 00-1.688 1.721l7.823 2.093c.267.852.442 1.744.513 2.665L2.106 5.213l.045-.065.027-.04.04-.055.046-.065.055-.076.054-.072.064-.086.05-.065.057-.073.055-.07.06-.074.055-.069.065-.077.054-.066.066-.077.053-.06.072-.082.053-.06.067-.074.054-.058.073-.078.058-.06.063-.067.168-.17.1-.098.059-.056.076-.071a12.084 12.084 0 012.272-1.677zM12.017 0h.097l.082.001.069.001.054.002.068.002.046.001.076.003.047.002.06.003.054.002.087.005.105.007.144.011.088.007.044.004.077.008.082.008.047.005.102.012.05.006.108.014.081.01.042.006.065.01.207.032.07.012.065.011.14.026.092.018.11.022.046.01.075.016.041.01L14.7.3l.042.01.065.015.049.012.071.017.096.024.112.03.113.03.113.032.05.015.07.02.078.024.073.023.05.016.05.016.076.025.099.033.102.036.048.017.064.023.093.034.11.041.116.045.1.04.047.02.06.024.041.018.063.026.04.018.057.025.11.048.1.046.074.035.075.036.06.028.092.046.091.045.102.052.053.028.049.026.046.024.06.033.041.022.052.029.088.05.106.06.087.051.057.034.053.032.096.059.088.055.098.062.036.024.064.041.084.056.04.027.062.042.062.043.023.017c.054.037.108.075.161.114l.083.06.065.048.056.043.086.065.082.064.04.03.05.041.086.069.079.065.085.071c.712.6 1.353 1.283 1.909 2.031L7.222.994l.062-.027.065-.028.081-.034.086-.035c.113-.045.227-.09.341-.131l.096-.035.093-.033.084-.03.096-.031c.087-.03.176-.058.264-.085l.091-.027.086-.025.102-.03.085-.023.1-.026L9.04.37l.09-.023.091-.022.095-.022.09-.02.098-.021.091-.02.095-.018.092-.018.1-.018.091-.016.098-.017.092-.014.097-.015.092-.013.102-.013.091-.012.105-.012.09-.01.105-.01c.093-.01.186-.018.28-.024l.106-.008.09-.005.11-.006.093-.004.1-.004.097-.002.099-.002.197-.002z" })
	});
}
//#endregion
//#region src/components/Avatar.tsx
const Avatar = ({ user, size = 32, className = "", alt, showDefaultWhenEmpty = true }) => {
	const avatarSrc = useAvatar(user);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);
	const avatarSeed = useMemo(() => user?.avatar || user?.username || user?.email || "", [
		user?.avatar,
		user?.username,
		user?.email
	]);
	const altText = useMemo(() => alt || `${user?.name || user?.username || user?.email || ""}'s avatar`, [
		alt,
		user?.name,
		user?.username,
		user?.email
	]);
	const imageSrc = useMemo(() => {
		if (!avatarSeed || imageError) return "";
		return (user?.avatar ?? "") || avatarSrc || "";
	}, [
		user?.avatar,
		avatarSrc,
		avatarSeed,
		imageError
	]);
	const handleImageLoad = useCallback(() => {
		setImageLoaded(true);
	}, []);
	const handleImageError = useCallback(() => {
		setImageError(true);
		setImageLoaded(false);
	}, []);
	const DefaultAvatar = useCallback(() => /* @__PURE__ */ jsx("div", {
		style: {
			backgroundColor: "rgb(121, 137, 255)",
			width: `${size}px`,
			height: `${size}px`,
			boxShadow: "rgba(240, 246, 252, 0.1) 0px 0px 0px 1px"
		},
		className: `relative flex items-center justify-center rounded-full p-1 text-text-primary ${className}`,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx(UserIcon, {})
	}), [size, className]);
	if (avatarSeed.length === 0 && showDefaultWhenEmpty) return /* @__PURE__ */ jsx(DefaultAvatar, {});
	if (avatarSeed.length > 0 && !imageError) return /* @__PURE__ */ jsxs("div", {
		className: "relative",
		style: {
			width: `${size}px`,
			height: `${size}px`
		},
		children: [!imageLoaded && /* @__PURE__ */ jsx(Skeleton, {
			className: "rounded-full",
			style: {
				width: `${size}px`,
				height: `${size}px`
			}
		}), /* @__PURE__ */ jsx("img", {
			style: {
				width: `${size}px`,
				height: `${size}px`,
				display: imageLoaded ? "block" : "none"
			},
			className: `rounded-full ${className}`,
			src: imageSrc,
			alt: altText,
			onLoad: handleImageLoad,
			onError: handleImageError
		})]
	});
	if (imageError && showDefaultWhenEmpty) return /* @__PURE__ */ jsx(DefaultAvatar, {});
	return null;
};
//#endregion
//#region src/components/Combobox.tsx
function ComboboxComponent({ selectedValue, displayValue, items, setValue, ariaLabel, searchPlaceholder, selectPlaceholder, isCollapsed, SelectIcon }) {
	const { open, setOpen, setSearchValue, matches } = useCombobox({
		value: selectedValue,
		options: (items ?? []).map((option) => {
			if (typeof option === "string") return {
				label: option,
				value: option
			};
			return option;
		})
	});
	const nestedStyle = useNestedPopoverStyle();
	return /* @__PURE__ */ jsx(SelectPrimitive.Root, {
		value: selectedValue,
		onValueChange: setValue,
		open,
		/** Hacky fix for radix-ui Android issue: https://github.com/radix-ui/primitives/issues/1658  */
		onOpenChange: () => {
			if (open === true) {
				setOpen(false);
				return;
			}
			setTimeout(() => {
				setOpen(!open);
			}, 75);
		},
		children: /* @__PURE__ */ jsxs(ComboboxProvider, {
			open,
			setOpen,
			resetValueOnHide: true,
			includesBaseElement: false,
			setValue: (value) => {
				startTransition(() => {
					setSearchValue(value);
				});
			},
			children: [/* @__PURE__ */ jsx(SelectTrigger, {
				"aria-label": ariaLabel,
				className: cn("flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0", isCollapsed ? "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden" : "", "bg-surface-secondary text-text-primary hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-text-primary"),
				children: /* @__PURE__ */ jsxs(SelectValue, {
					placeholder: selectPlaceholder,
					children: [/* @__PURE__ */ jsx("div", {
						className: "assistant-item flex items-center justify-center overflow-hidden rounded-full",
						children: SelectIcon ? SelectIcon : /* @__PURE__ */ jsx(ChevronDownIcon, {})
					}), /* @__PURE__ */ jsx("span", {
						className: cn("ml-2", isCollapsed ? "hidden" : ""),
						style: { userSelect: "none" },
						children: selectedValue ? displayValue ?? selectedValue : selectPlaceholder && selectPlaceholder
					})]
				})
			}), /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(SelectPrimitive.Content, {
				role: "dialog",
				"aria-label": ariaLabel + "s",
				position: "popper",
				style: nestedStyle,
				className: cn("relative z-40 max-h-[52vh] min-w-[8rem] overflow-hidden rounded-md border border-border-light bg-surface-secondary text-text-primary shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", "bg-surface-secondary"),
				children: [/* @__PURE__ */ jsxs(SelectPrimitive.Viewport, {
					className: "mb-5 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "group sticky left-0 top-0 z-10 flex h-12 items-center gap-2 bg-surface-secondary px-3 py-2 text-text-primary duration-300",
						children: [
							/* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-text-secondary transition-colors duration-300 group-focus-within:text-text-primary group-hover:text-text-primary" }),
							/* @__PURE__ */ jsx(Combobox, {
								autoSelect: true,
								placeholder: searchPlaceholder,
								className: "flex-1 rounded-md border-none bg-transparent px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-border-medium",
								onBlurCapture: (event) => {
									event.preventDefault();
									event.stopPropagation();
								}
							}),
							/* @__PURE__ */ jsx(ComboboxCancel, {
								hideWhenEmpty: true,
								className: "relative flex h-5 w-5 items-center justify-end text-text-secondary transition-colors duration-300 group-focus-within:text-text-primary group-hover:text-text-primary"
							})
						]
					}), /* @__PURE__ */ jsx(ComboboxList, {
						className: "overflow-y-auto p-1 py-2",
						children: matches.map(({ label, value, icon }) => /* @__PURE__ */ jsx(SelectPrimitive.Item, {
							value: `${value ?? ""}`,
							asChild: true,
							children: /* @__PURE__ */ jsxs(ComboboxItem, {
								className: cn("relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-surface-hover focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50", "rounded-lg hover:bg-surface-hover"),
								/** Hacky fix for radix-ui Android issue: https://github.com/radix-ui/primitives/issues/1658  */
								onTouchEnd: () => {
									setValue(`${value ?? ""}`);
									setOpen(false);
								},
								children: [/* @__PURE__ */ jsx("span", {
									className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
									children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "h-4 w-4" }) })
								}), /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children: /* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-text-primary",
									children: [/* @__PURE__ */ jsx("div", {
										className: "assistant-item overflow-hidden rounded-full",
										children: icon && icon
									}), label]
								}) })]
							})
						}, value))
					})]
				}), /* @__PURE__ */ jsx(SelectScrollDownButton, { className: "absolute bottom-0 left-0 right-0" })]
			}) })]
		})
	});
}
//#endregion
//#region src/components/SendActions.tsx
const ROW_CLASS = "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-text-primary hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-xheavy aria-disabled:cursor-not-allowed aria-disabled:opacity-50";
function Kbd({ children }) {
	return /* @__PURE__ */ jsx("kbd", {
		className: "ml-auto rounded-md bg-surface-tertiary px-1.5 py-0.5 font-sans text-xs text-text-secondary",
		children
	});
}
/**
* The alternate submissions a send control offers on hover or focus.
*
* Every chat surface that can submit more than one way shows the same list in
* the same place — hung off the send control, never lined up beside the field,
* where a row would repeat what submitting already does. The anchor is passed
* in whole so each host keeps its own button: its ref (Enter's synthetic click
* routes through it), its submit type, and its own identifying attributes.
*
* With no actions the anchor renders alone, so a host can pass a list that is
* sometimes empty without branching.
*/
function SendActions({ anchor, actions, label }) {
	if (actions.length === 0) return anchor;
	return /* @__PURE__ */ jsxs(Ariakit.HovercardProvider, {
		placement: "top-end",
		showTimeout: 100,
		hideTimeout: 150,
		children: [/* @__PURE__ */ jsx(Ariakit.HovercardAnchor, { render: anchor }), /* @__PURE__ */ jsx(Ariakit.Hovercard, {
			portal: true,
			gutter: 8,
			unmountOnHide: true,
			"aria-label": label,
			className: "z-50 min-w-[12rem] rounded-xl border border-border-light bg-surface-secondary p-1.5 text-text-primary shadow-lg outline-none",
			children: actions.map((action) => /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: ROW_CLASS,
				"aria-disabled": action.disabled === true,
				onClick: action.disabled === true ? void 0 : action.onClick,
				children: [
					action.icon,
					action.label,
					action.kbd != null && action.disabled !== true && /* @__PURE__ */ jsx(Kbd, { children: action.kbd })
				]
			}, action.key))
		})]
	});
}
//#endregion
//#region src/components/Composer.tsx
/** Main chat's send/stop button shape, shared by both states of the slot. */
const CONTROL_CLASS = composerSubmitClasses();
/**
* The chat composer at panel scale: one persistent surface with a text field, a
* stable action row, and the same send affordance the main chat form uses.
*
* It is deliberately state-free. Every surface that hosts a conversation beside
* the main thread (a subagent thread, a side chat) owns what Enter means for it
* and passes that in as `onSubmit`, so the affordance never has to be swapped
* out for a different control when a run settles — which is what makes the
* footer shift under the reader.
*/
const Composer = forwardRef(function Composer({ value, onChange, onSubmit, canSubmit, submitLabel, ariaLabel, placeholder, disabled = false, maxLength, minRows = 1, maxRows = 6, actions, submitActions, submitActionsLabel, onStop, stopLabel, submitOnEnter = true, resolveKeyVerdict, className }, ref) {
	const [isComposing, setIsComposing] = useState(false);
	/** Nothing to send and something to stop: main chat swaps the same slot
	*  rather than standing a second control beside it. */
	const showStop = onStop != null && value.trim() === "";
	const offeredActions = canSubmit ? submitActions ?? [] : [];
	const sendButton = /* @__PURE__ */ jsx("button", {
		type: "button",
		"aria-label": submitLabel,
		disabled: disabled || !canSubmit,
		onClick: () => onSubmit(),
		"data-testid": "composer-send-button",
		className: cn(CONTROL_CLASS, offeredActions.length > 0 && "ml-auto"),
		children: /* @__PURE__ */ jsx(SendIcon, { size: 24 })
	});
	const handleKeyDown = (event) => {
		/**
		* `isComposing` alone does not settle the IME question: Safari reports it
		* as false on the very Enter that commits a candidate, so the tracked
		* composition state and the legacy `Process`/229 signals stand in for it,
		* as the main chat composer's own guard does. Committed here rather than
		* left to the host so every caller inherits it.
		*/
		const composing = isComposing || event.nativeEvent.isComposing || event.key === "Process" || event.keyCode === 229;
		const defaultVerdict = () => {
			if (composing || event.key !== "Enter" || event.shiftKey) return "none";
			if (!submitOnEnter && !(event.metaKey || event.ctrlKey)) return "newline";
			return "submit";
		};
		const verdict = resolveKeyVerdict?.(event, composing) ?? defaultVerdict();
		if (verdict === "newline" || verdict === "none") return;
		event.preventDefault();
		/** An empty field never submits, even where the surface would accept it:
		*  a caller whose action needs no text (continuing a settled thread)
		*  still wants that to be a deliberate press of the button, not a stray
		*  Enter that navigates the reader somewhere. */
		if (verdict === "block" || !canSubmit || value.trim() === "") return;
		onSubmit(event);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex w-full flex-col gap-1.5 rounded-3xl p-2.5", composerSurfaceClasses(), composerSurfaceShadow.within, className),
		children: [/* @__PURE__ */ jsx(TextareaAutosize, {
			ref,
			value,
			onChange: (event) => onChange(event.target.value),
			onKeyDown: handleKeyDown,
			onCompositionStart: () => setIsComposing(true),
			onCompositionEnd: () => setIsComposing(false),
			placeholder,
			"aria-label": ariaLabel,
			maxLength,
			minRows,
			maxRows,
			disabled,
			/** Main chat's own field metrics (`ChatForm`'s `baseClasses`), so the
			*  two composers stand the same height and their surfaces line up
			*  when this panel is open beside the thread. */
			className: "m-0 w-full resize-none bg-transparent px-3 py-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:cursor-not-allowed md:py-3.5"
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex min-h-9 flex-wrap items-center gap-1.5",
			children: [actions, showStop ? /* @__PURE__ */ jsx(TooltipAnchor, {
				description: stopLabel,
				className: "ml-auto",
				render: /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": stopLabel,
					onClick: onStop,
					"data-testid": "composer-stop-button",
					className: CONTROL_CLASS,
					children: /* @__PURE__ */ jsx("svg", {
						width: "24",
						height: "24",
						viewBox: "0 0 24 24",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						className: "icon-lg text-surface-primary",
						"aria-hidden": "true",
						children: /* @__PURE__ */ jsx("rect", {
							x: "7",
							y: "7",
							width: "10",
							height: "10",
							rx: "1.25",
							fill: "currentColor"
						})
					})
				})
			}) : /* @__PURE__ */ jsx(SendActions, {
				actions: offeredActions,
				label: submitActionsLabel ?? submitLabel,
				anchor: offeredActions.length > 0 ? sendButton : /* @__PURE__ */ jsx(TooltipAnchor, {
					description: submitLabel,
					className: "ml-auto",
					render: sendButton
				})
			})]
		})]
	});
});
//#endregion
//#region src/components/Dropdown.tsx
const isDivider = (item) => typeof item === "object" && "divider" in item;
const isOption = (item) => typeof item === "object" && "value" in item && "label" in item;
const normalizeOption = (item) => typeof item === "string" ? {
	value: item,
	label: item
} : item;
const Dropdown = ({ value: selectedValue, label = "", onChange, options, className = "", triggerClassName, sizeClasses, testId = "dropdown-menu", icon, iconOnly = false, renderValue, ariaLabel, "aria-labelledby": ariaLabelledBy, portal = true, variant = "default", portalElement, disabled = false, searchable = false, searchPlaceholder, searchEmptyText }) => {
	const valueId = `${useId()}value`;
	const [searchValue, setSearchValue] = useState("");
	const handleChange = (value) => {
		onChange(value);
	};
	const comboboxStore = Combobox$1.useComboboxStore({
		resetValueOnHide: true,
		value: searchValue,
		setValue: setSearchValue
	});
	const selectProps = Select$2.useSelectStore({
		combobox: searchable ? comboboxStore : void 0,
		value: selectedValue,
		setValue: handleChange
	});
	const getOptionObject = (val) => {
		if (val == null || val === "") return;
		return options.filter((o) => !isDivider(o)).map((o) => normalizeOption(o)).find((o) => o.value === val);
	};
	const getOptionLabel = (currentValue) => {
		if (currentValue == null || currentValue === "") return "";
		const option = getOptionObject(currentValue);
		return option ? option.label : currentValue;
	};
	const matches = useMemo(() => {
		if (!searchable) return [];
		return matchSorter(options.filter((o) => !isDivider(o)).map((o) => normalizeOption(o)), searchValue, {
			keys: ["label", "value"],
			baseSort: (a, b) => a.index < b.index ? -1 : 1
		});
	}, [
		searchable,
		options,
		searchValue
	]);
	const renderOptionContent = (option) => /* @__PURE__ */ jsxs("div", {
		className: "flex w-full items-center gap-2",
		children: [
			option.icon != null && /* @__PURE__ */ jsx("span", { children: option.icon }),
			/* @__PURE__ */ jsx("span", {
				className: "block truncate",
				children: option.label
			}),
			selectedValue === option.value && /* @__PURE__ */ jsx("span", {
				className: "ml-auto pl-2",
				children: /* @__PURE__ */ jsx("svg", {
					width: "24",
					height: "24",
					viewBox: "0 0 24 24",
					fill: "none",
					xmlns: "http://www.w3.org/2000/svg",
					className: "icon-md block group-hover:hidden",
					"aria-hidden": "true",
					children: /* @__PURE__ */ jsx("path", {
						fillRule: "evenodd",
						clipRule: "evenodd",
						d: "M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM16.0755 7.93219C16.5272 8.25003 16.6356 8.87383 16.3178 9.32549L11.5678 16.0755C11.3931 16.3237 11.1152 16.4792 10.8123 16.4981C10.5093 16.517 10.2142 16.3973 10.0101 16.1727L7.51006 13.4227C7.13855 13.014 7.16867 12.3816 7.57733 12.0101C7.98598 11.6386 8.61843 11.6687 8.98994 12.0773L10.6504 13.9039L14.6822 8.17451C15 7.72284 15.6238 7.61436 16.0755 7.93219Z",
						fill: "currentColor"
					})
				})
			})
		]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: cn("relative", variant === "field" && "w-full", className),
		children: [/* @__PURE__ */ jsxs(Select$2.Select, {
			store: selectProps,
			disabled,
			className: cn(
				"relative inline-flex items-center justify-between rounded-xl border border-border-light bg-transparent py-2 text-sm text-text-primary transition-all duration-200 ease-in-out hover:bg-surface-hover hover:text-text-primary",
				"disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-primary",
				/** Horizontal padding would squeeze the icon, which flex-shrinks to fit */
				iconOnly ? "size-10 justify-center px-0" : "w-fit gap-2 px-3",
				variant === "field" && fieldControl,
				triggerClassName
			),
			"data-testid": testId,
			"aria-label": ariaLabel,
			"aria-labelledby": ariaLabelledBy == null || iconOnly ? ariaLabelledBy : `${ariaLabelledBy} ${valueId}`,
			children: [/* @__PURE__ */ jsxs("div", {
				className: cn("flex items-center gap-2", iconOnly ? "shrink-0" : "w-full"),
				children: [icon, !iconOnly && /* @__PURE__ */ jsxs("span", {
					id: valueId,
					className: "block truncate",
					children: [label, (() => {
						const matchedOption = getOptionObject(selectedValue);
						if (matchedOption && renderValue) return renderValue(matchedOption);
						return getOptionLabel(selectedValue);
					})()]
				})]
			}), !iconOnly && /* @__PURE__ */ jsx(Select$2.SelectArrow, {})]
		}), /* @__PURE__ */ jsx(Select$2.SelectPopover, {
			portal,
			portalElement,
			store: selectProps,
			className: cn("popover-ui z-40 text-sm", "[pointer-events:auto]", sizeClasses),
			children: searchable ? /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsx("div", {
					className: "sticky -top-2 z-10 -mx-2 -mt-2 mb-1 bg-inherit px-2 pb-1.5 pt-2",
					children: /* @__PURE__ */ jsxs("div", {
						className: "relative",
						children: [/* @__PURE__ */ jsx(Search, {
							className: "pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary",
							"aria-hidden": "true"
						}), /* @__PURE__ */ jsx(Combobox$1.Combobox, {
							store: comboboxStore,
							autoSelect: true,
							placeholder: searchPlaceholder,
							"aria-label": searchPlaceholder,
							className: "w-full rounded-lg border border-border-light bg-inherit py-1.5 pl-8 pr-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
						})]
					})
				}),
				/* @__PURE__ */ jsx(Combobox$1.ComboboxList, {
					store: comboboxStore,
					"aria-label": ariaLabel,
					"aria-labelledby": ariaLabelledBy,
					className: "flex flex-col",
					children: matches.map((option) => /* @__PURE__ */ jsx(Combobox$1.ComboboxItem, {
						value: String(option.value),
						className: "select-item",
						render: /* @__PURE__ */ jsx(Select$2.SelectItem, {
							value: String(option.value),
							"data-theme": option.value
						}),
						children: renderOptionContent(option)
					}, `option-${String(option.value)}`))
				}),
				matches.length === 0 && /* @__PURE__ */ jsx("div", {
					className: "px-2 py-6 text-center text-sm text-text-secondary",
					"aria-hidden": "true",
					children: searchEmptyText
				}),
				/* @__PURE__ */ jsx("div", {
					role: "status",
					"aria-live": "polite",
					className: "sr-only",
					children: matches.length === 0 ? searchEmptyText : ""
				})
			] }) : options.map((item, index) => {
				if (isDivider(item)) return /* @__PURE__ */ jsx("div", { className: "my-1 border-t border-border-heavy" }, `divider-${index}`);
				const option = normalizeOption(item);
				if (!isOption(option)) return null;
				return /* @__PURE__ */ jsx(Select$2.SelectItem, {
					value: String(option.value),
					className: "select-item",
					"data-theme": option.value,
					children: renderOptionContent(option)
				}, `option-${index}`);
			})
		})]
	});
};
//#endregion
//#region src/components/AnimatedSearchInput.tsx
const AnimatedSearchInput = ({ value, onChange, isSearching: searching, placeholder }) => {
	const isSearching = searching === true;
	const hasValue = value != null && value.length > 0;
	const localize = useLocalize();
	return /* @__PURE__ */ jsxs("div", {
		className: "relative w-full",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "relative rounded-lg transition-all duration-500 ease-in-out",
				children: /* @__PURE__ */ jsxs("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "absolute left-3 top-1/2 z-50 -translate-y-1/2",
							children: /* @__PURE__ */ jsx(Search, { className: cn(`h-4 w-4 transition-all duration-500 ease-in-out`, isSearching && hasValue ? "text-accent-primary" : "text-text-secondary") })
						}),
						/* @__PURE__ */ jsx("input", {
							type: "text",
							value,
							onChange,
							placeholder,
							"aria-label": localize("com_ui_search"),
							className: `peer relative z-20 w-full rounded-lg bg-surface-secondary py-2 pl-10 outline-none backdrop-blur-sm transition-all duration-500 ease-in-out placeholder:text-text-secondary focus:ring-text-primary`
						}),
						/* @__PURE__ */ jsx("div", { className: `pointer-events-none absolute inset-0 z-20 rounded-lg bg-gradient-to-r from-accent-primary/20 via-accent-primary/10 to-accent-primary/20 transition-all duration-500 ease-in-out ${isSearching && hasValue ? "opacity-100 blur-sm" : "opacity-0 blur-none"} ` }),
						/* @__PURE__ */ jsx("div", {
							className: `absolute right-3 top-1/2 z-20 -translate-y-1/2 transition-all duration-500 ease-in-out ${isSearching && hasValue ? "scale-100 opacity-100" : "scale-0 opacity-0"} `,
							children: /* @__PURE__ */ jsxs("div", {
								className: "relative h-2 w-2",
								children: [/* @__PURE__ */ jsx("div", { className: "absolute inset-0 animate-ping rounded-full bg-accent-primary/60" }), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-accent-primary" })]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ jsx("div", {
				className: `absolute -inset-8 -z-10 transition-all duration-700 ease-in-out ${isSearching && hasValue ? "scale-105 opacity-100" : "scale-100 opacity-0"} `,
				children: /* @__PURE__ */ jsxs("div", {
					className: "absolute inset-0",
					children: [/* @__PURE__ */ jsx("div", { className: `bg-gradient-radial absolute inset-0 from-accent-primary/10 to-transparent transition-opacity duration-700 ease-in-out ${isSearching && hasValue ? "animate-pulse-slow opacity-100" : "opacity-0"} ` }), /* @__PURE__ */ jsx("div", { className: `absolute inset-0 bg-gradient-to-r from-accent-primary/5 via-accent-primary/10 to-accent-primary/5 blur-xl transition-all duration-700 ease-in-out ${isSearching && hasValue ? "animate-gradient-x opacity-100" : "opacity-0"} ` })]
				})
			}),
			/* @__PURE__ */ jsx("div", { className: `absolute inset-0 -z-20 scale-100 bg-gradient-to-r from-accent-primary/10 via-accent-primary/10 to-accent-primary/10 opacity-0 blur-xl transition-all duration-500 ease-in-out peer-focus:scale-105 peer-focus:opacity-100` })
		]
	});
};
//#endregion
//#region src/components/DataTable.tsx
const SelectionCheckbox$1 = memo(({ checked, onChange, ariaLabel }) => /* @__PURE__ */ jsx("div", {
	role: "button",
	tabIndex: 0,
	onKeyDown: (e) => e.stopPropagation(),
	className: "flex h-full w-[30px] items-center justify-center",
	onClick: (e) => e.stopPropagation(),
	children: /* @__PURE__ */ jsx(Checkbox, {
		checked,
		onCheckedChange: onChange,
		"aria-label": ariaLabel
	})
}));
SelectionCheckbox$1.displayName = "SelectionCheckbox";
const TableRowComponent$1 = ({ row, isSmallScreen, onSelectionChange, index, isSearching }) => {
	const handleSelection = useCallback((value) => {
		row.toggleSelected(value);
		onSelectionChange?.(row.id, value);
	}, [row, onSelectionChange]);
	return /* @__PURE__ */ jsx(TableRow, {
		"data-state": row.getIsSelected() ? "selected" : void 0,
		className: "motion-safe:animate-fadeIn border-b border-border-light transition-all duration-300 ease-out hover:bg-surface-secondary",
		style: {
			animationDelay: `${index * 20}ms`,
			transform: `translateY(${isSearching ? "4px" : "0"})`,
			opacity: isSearching ? .5 : 1
		},
		children: row.getVisibleCells().map((cell) => {
			if (cell.column.id === "select") return /* @__PURE__ */ jsx(TableCell, {
				className: "px-2 py-1 transition-all duration-300",
				children: /* @__PURE__ */ jsx(SelectionCheckbox$1, {
					checked: row.getIsSelected(),
					onChange: handleSelection,
					ariaLabel: "Select row"
				})
			}, cell.id);
			if (cell.column.id === "title") return /* @__PURE__ */ jsx(TableHead, {
				className: "w-0 max-w-0 px-2 py-1 align-middle text-xs transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm",
				style: getColumnStyle(cell.column.columnDef, isSmallScreen),
				scope: "row",
				children: /* @__PURE__ */ jsx("div", {
					className: "overflow-visible text-ellipsis",
					children: flexRender(cell.column.columnDef.cell, cell.getContext())
				})
			}, cell.id);
			return /* @__PURE__ */ jsx(TableCell, {
				className: "w-0 max-w-0 overflow-visible px-2 py-1 align-middle text-xs transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm",
				style: getColumnStyle(cell.column.columnDef, isSmallScreen),
				children: /* @__PURE__ */ jsx("div", {
					className: "overflow-visible text-ellipsis",
					children: flexRender(cell.column.columnDef.cell, cell.getContext())
				})
			}, cell.id);
		})
	});
};
const MemoizedTableRow$1 = memo(TableRowComponent$1);
function getColumnStyle(column, isSmallScreen) {
	return {
		width: isSmallScreen ? column.meta?.mobileSize : column.meta?.size,
		minWidth: column.meta?.minWidth,
		maxWidth: column.meta?.size
	};
}
const DeleteButton = memo(({ onDelete, isDeleting, disabled, isSmallScreen, ariaLabel }) => {
	if (!onDelete) return null;
	return /* @__PURE__ */ jsx(Button, {
		variant: "outline",
		onClick: onDelete,
		disabled,
		className: cn("min-w-[40px] transition-all duration-200", isSmallScreen && "px-2 py-1"),
		"aria-label": ariaLabel,
		children: isDeleting ? /* @__PURE__ */ jsx(Spinner, { className: "size-4" }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TrashIcon, { className: "size-3.5 text-text-destructive sm:size-4" }), !isSmallScreen && /* @__PURE__ */ jsx("span", {
			className: "ml-2",
			children: "Delete"
		})] })
	});
});
function DataTable({ columns, data, onDelete, filterColumn, defaultSort = [], className = "", isFetchingNextPage = false, hasNextPage = false, fetchNextPage, enableRowSelection = true, showCheckboxes = true, onFilterChange, filterValue, isLoading, enableSearch = true }) {
	const localize = useLocalize();
	const isSmallScreen = useMediaQuery("(max-width: 768px)");
	const tableContainerRef = useRef(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [rowSelection, setRowSelection] = useState({});
	const [sorting, setSorting] = useState(defaultSort);
	const [columnFilters, setColumnFilters] = useState([]);
	const [columnVisibility, setColumnVisibility] = useState({});
	const [searchTerm, setSearchTerm] = useState(filterValue ?? "");
	const [isSearching, setIsSearching] = useState(false);
	const [searchResultsAnnouncement, setSearchResultsAnnouncement] = useState("");
	const tableColumns = useMemo(() => {
		if (!enableRowSelection || !showCheckboxes) return columns;
		return [{
			id: "select",
			header: ({ table }) => /* @__PURE__ */ jsx("div", {
				className: "flex h-full w-[30px] items-center justify-center",
				children: /* @__PURE__ */ jsx(Checkbox, {
					checked: table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(Boolean(value)),
					"aria-label": "Select all"
				})
			}),
			cell: ({ row }) => /* @__PURE__ */ jsx(SelectionCheckbox$1, {
				checked: row.getIsSelected(),
				onChange: (value) => row.toggleSelected(value),
				ariaLabel: "Select row"
			}),
			meta: { size: "50px" }
		}, ...columns];
	}, [
		columns,
		enableRowSelection,
		showCheckboxes
	]);
	const table = useReactTable({
		data,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection,
		enableMultiRowSelection: true,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection
	});
	const { rows } = table.getRowModel();
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => tableContainerRef.current,
		estimateSize: useCallback(() => 48, []),
		overscan: 10
	});
	const virtualRows = rowVirtualizer.getVirtualItems();
	const totalSize = rowVirtualizer.getTotalSize();
	const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
	const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;
	useEffect(() => {
		const scrollElement = tableContainerRef.current;
		if (!scrollElement) return;
		const handleScroll = async () => {
			if (!hasNextPage || isFetchingNextPage) return;
			const { scrollTop, scrollHeight, clientHeight } = scrollElement;
			if (scrollHeight - scrollTop <= clientHeight * 1.5) try {
				await fetchNextPage?.();
			} catch (error) {
				console.error("Unable to fetch next page:", error);
			}
		};
		scrollElement.addEventListener("scroll", handleScroll, { passive: true });
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage
	]);
	useEffect(() => {
		setIsSearching(true);
		const timeout = setTimeout(() => {
			onFilterChange?.(searchTerm);
			setIsSearching(false);
		}, 300);
		return () => clearTimeout(timeout);
	}, [searchTerm, onFilterChange]);
	useEffect(() => {
		if (!searchTerm.trim() || isSearching) {
			setSearchResultsAnnouncement("");
			return;
		}
		const resultCount = rows.length;
		const announcement = resultCount === 1 ? localize("com_ui_result_found", { count: resultCount }) : localize("com_ui_results_found", { count: resultCount });
		const timeout = setTimeout(() => {
			setSearchResultsAnnouncement(announcement);
		}, 300);
		return () => clearTimeout(timeout);
	}, [
		rows.length,
		searchTerm,
		isSearching,
		localize
	]);
	const handleDelete = useCallback(async () => {
		if (!onDelete) return;
		setIsDeleting(true);
		try {
			await onDelete(table.getFilteredSelectedRowModel().rows.map((r) => r.original));
			setRowSelection({});
		} finally {
			setIsDeleting(false);
		}
	}, [onDelete, table]);
	const getRandomWidth = () => Math.floor(Math.random() * 241) + 170;
	const skeletons = Array.from({ length: 13 }, (_, index) => {
		const randomWidth = getRandomWidth();
		const firstDataColumnIndex = tableColumns[0]?.id === "select" ? 1 : 0;
		return /* @__PURE__ */ jsx(TableRow, {
			className: "motion-safe:animate-fadeIn border-b border-border-light",
			children: tableColumns.map((column, columnIndex) => {
				return /* @__PURE__ */ jsx(TableCell, {
					className: "px-2 py-1 sm:px-4 sm:py-2",
					style: getColumnStyle(column, isSmallScreen),
					children: /* @__PURE__ */ jsx(Skeleton, {
						className: "h-6",
						style: columnIndex === firstDataColumnIndex ? { width: `${randomWidth}px` } : { width: "100%" }
					})
				}, column.id);
			})
		}, index);
	});
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex h-full flex-col gap-4", className),
		children: [
			/* @__PURE__ */ jsx("div", {
				"aria-live": "assertive",
				"aria-atomic": "true",
				className: "sr-only",
				children: searchResultsAnnouncement
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 sm:gap-4",
				children: [enableRowSelection && showCheckboxes && /* @__PURE__ */ jsx(DeleteButton, {
					onDelete: handleDelete,
					isDeleting,
					disabled: !table.getFilteredSelectedRowModel().rows.length || isDeleting,
					isSmallScreen,
					ariaLabel: localize("com_ui_delete_selected_items")
				}), filterColumn !== void 0 && table.getColumn(filterColumn) && enableSearch && /* @__PURE__ */ jsx("div", {
					className: "relative flex-1",
					children: /* @__PURE__ */ jsx(AnimatedSearchInput, {
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						isSearching,
						placeholder: "Search..."
					})
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				ref: tableContainerRef,
				className: cn("relative min-h-0 max-w-full flex-1 overflow-x-auto overflow-y-auto rounded-md border border-border-light", "transition-all duration-300 ease-out", isSearching && "bg-surface-secondary/50", className),
				children: /* @__PURE__ */ jsxs(Table, {
					unwrapped: true,
					className: "w-full min-w-[300px] table-fixed border-separate border-spacing-0",
					children: [/* @__PURE__ */ jsx(TableHeader, {
						className: "sticky top-0 z-50 bg-surface-secondary",
						children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ jsx(TableRow, {
							className: "border-b border-border-light",
							children: headerGroup.headers.map((header) => /* @__PURE__ */ jsx(TableHead, {
								className: "whitespace-nowrap bg-surface-secondary px-2 py-2 text-left text-sm font-medium text-text-secondary sm:px-4",
								style: getColumnStyle(header.column.columnDef, isSmallScreen),
								onClick: header.column.getCanSort() ? header.column.getToggleSortingHandler() : void 0,
								scope: "col",
								children: header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())
							}, header.id))
						}, headerGroup.id))
					}), /* @__PURE__ */ jsxs(TableBody, { children: [
						paddingTop > 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style: { height: `${paddingTop}px` } }) }),
						isLoading && skeletons,
						virtualRows.map((virtualRow) => {
							const row = rows[virtualRow.index];
							return /* @__PURE__ */ jsx(MemoizedTableRow$1, {
								row,
								isSmallScreen,
								index: virtualRow.index,
								isSearching
							}, row.id);
						}),
						!virtualRows.length && /* @__PURE__ */ jsx(TableRow, {
							className: "hover:bg-transparent",
							children: /* @__PURE__ */ jsx(TableCell, {
								colSpan: columns.length,
								className: "p-4 text-center",
								children: "No data available"
							})
						}),
						paddingBottom > 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style: { height: `${paddingBottom}px` } }) }),
						(isFetchingNextPage || hasNextPage) && /* @__PURE__ */ jsx(TableRow, {
							className: "hover:bg-transparent",
							children: /* @__PURE__ */ jsx(TableCell, {
								colSpan: columns.length,
								className: "p-4",
								children: /* @__PURE__ */ jsx("div", {
									className: "flex h-full items-center justify-center",
									children: isFetchingNextPage ? /* @__PURE__ */ jsx(Spinner, { className: "size-4" }) : hasNextPage && /* @__PURE__ */ jsx("div", { className: "h-6" })
								})
							})
						})
					] })]
				})
			})
		]
	});
}
//#endregion
//#region src/components/SplitText.tsx
const splitGraphemes = (text) => {
	if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
		const segments = new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text);
		return Array.from(segments).map((s) => s.segment);
	} else return [...text];
};
const SplitText = ({ text = "", className = "", delay = 100, animationFrom = {
	opacity: 0,
	transform: "translate3d(0,40px,0)"
}, animationTo = {
	opacity: 1,
	transform: "translate3d(0,0,0)"
}, easing = (t) => t, threshold = .1, rootMargin = "-100px", textAlign = "center", onLetterAnimationComplete, onLineCountChange }) => {
	const words = text.split(" ").map(splitGraphemes);
	const letters = words.flat();
	const [inView, setInView] = useState(false);
	const ref = useRef(null);
	const animatedCount = useRef(0);
	const [springs] = useSprings(letters.length, (i) => ({
		from: animationFrom,
		to: inView ? async (next) => {
			await next(animationTo);
			animatedCount.current += 1;
			if (animatedCount.current === letters.length && onLetterAnimationComplete) onLetterAnimationComplete();
		} : animationFrom,
		delay: i * delay,
		config: { easing }
	}), [
		inView,
		text,
		delay,
		animationFrom,
		animationTo,
		easing,
		onLetterAnimationComplete
	]);
	useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				if (ref.current) observer.unobserve(ref.current);
			}
		}, {
			threshold,
			rootMargin
		});
		if (ref.current) observer.observe(ref.current);
		return () => observer.disconnect();
	}, [threshold, rootMargin]);
	useEffect(() => {
		if (ref.current && inView) {
			const element = ref.current;
			setTimeout(() => {
				const lineHeight = parseInt(getComputedStyle(element).lineHeight) || parseInt(getComputedStyle(element).fontSize) * 1.2;
				const height = element.offsetHeight;
				const lines = Math.round(height / lineHeight);
				if (onLineCountChange) onLineCountChange(lines);
			}, 100);
		}
	}, [
		inView,
		text,
		onLineCountChange
	]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
		className: "sr-only",
		children: text
	}), /* @__PURE__ */ jsx("p", {
		ref,
		className: `split-parent inline overflow-hidden ${className}`,
		style: {
			textAlign,
			whiteSpace: "normal",
			wordWrap: "break-word"
		},
		"aria-hidden": "true",
		children: words.map((word, wordIndex) => /* @__PURE__ */ jsxs("span", {
			style: {
				display: "inline-block",
				whiteSpace: "nowrap"
			},
			children: [word.map((letter, letterIndex) => {
				const index = words.slice(0, wordIndex).reduce((acc, w) => acc + w.length, 0) + letterIndex;
				return /* @__PURE__ */ jsx(animated.span, {
					style: springs[index],
					className: "inline-block transform transition-opacity will-change-transform",
					children: letter
				}, index);
			}), wordIndex < words.length - 1 && /* @__PURE__ */ jsx("span", {
				style: {
					display: "inline-block",
					width: "0.3em"
				},
				children: "\xA0"
			})]
		}, wordIndex))
	})] });
};
//#endregion
//#region src/components/FormInput.tsx
function FormInput({ field, label, labelClass, inputClass, containerClass, labelAdjacent, placeholder = "", type = "string" }) {
	const handleChange = (e) => {
		const value = e.target.value;
		if (type !== "number") {
			field.onChange(value);
			return;
		}
		if (value === "") field.onChange(value);
		else if (!isNaN(Number(value))) field.onChange(Number(value));
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex w-full flex-col items-center gap-2", containerClass),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex w-full items-center justify-start gap-2",
			children: [/* @__PURE__ */ jsx(Label, {
				htmlFor: `${field.name}-input`,
				className: cn("text-left text-sm font-semibold text-text-primary", labelClass),
				children: label
			}), labelAdjacent]
		}), /* @__PURE__ */ jsx(Input, {
			id: `${field.name}-input`,
			value: field.value ?? "",
			onChange: handleChange,
			placeholder,
			className: cn("flex h-10 max-h-10 w-full resize-none border-none bg-surface-secondary px-3 py-2", inputClass)
		})]
	});
}
//#endregion
//#region src/components/PixelCard.tsx
var Pixel = class {
	constructor(canvas, context, x, y, color, speed, delay, activationThreshold) {
		this.width = canvas.width;
		this.height = canvas.height;
		this.ctx = context;
		this.x = x;
		this.y = y;
		this.color = color;
		this.speed = this.random(.1, .9) * speed;
		this.size = 0;
		this.sizeStep = Math.random() * .4;
		this.minSize = .5;
		this.maxSizeInteger = 2;
		this.maxSize = this.random(this.minSize, this.maxSizeInteger);
		this.delay = delay;
		this.counter = 0;
		this.counterStep = Math.random() * 4 + (this.width + this.height) * .01;
		this.isIdle = false;
		this.isReverse = false;
		this.isShimmer = false;
		this.activationThreshold = activationThreshold;
	}
	random(min, max) {
		return Math.random() * (max - min) + min;
	}
	draw() {
		const offset = this.maxSizeInteger * .5 - this.size * .5;
		this.ctx.fillStyle = this.color;
		this.ctx.fillRect(this.x + offset, this.y + offset, this.size, this.size);
	}
	appear() {
		this.isIdle = false;
		if (this.counter <= this.delay) {
			this.counter += this.counterStep;
			return;
		}
		if (this.size >= this.maxSize) this.isShimmer = true;
		if (this.isShimmer) this.shimmer();
		else this.size += this.sizeStep;
		this.draw();
	}
	appearWithProgress(progress) {
		if (progress - this.activationThreshold <= 0) {
			this.isIdle = true;
			return;
		}
		if (this.counter <= this.delay) {
			this.counter += this.counterStep;
			this.isIdle = false;
			return;
		}
		if (this.size >= this.maxSize) this.isShimmer = true;
		if (this.isShimmer) this.shimmer();
		else this.size += this.sizeStep;
		this.isIdle = false;
		this.draw();
	}
	disappear() {
		this.isShimmer = false;
		this.counter = 0;
		if (this.size <= 0) {
			this.isIdle = true;
			return;
		}
		this.size -= .1;
		this.draw();
	}
	shimmer() {
		if (this.size >= this.maxSize) this.isReverse = true;
		else if (this.size <= this.minSize) this.isReverse = false;
		this.size += this.isReverse ? -this.speed : this.speed;
	}
};
const getEffectiveSpeed = (value, reducedMotion) => {
	const parsed = parseInt(String(value), 10);
	const throttle = .001;
	if (parsed <= 0 || reducedMotion) return 0;
	if (parsed >= 100) return 100 * throttle;
	return parsed * throttle;
};
const clamp = (n, min = 0, max = 1) => Math.min(Math.max(n, min), max);
const VARIANTS = {
	default: {
		gap: 5,
		speed: 35,
		colors: "#f8fafc,#f1f5f9,#cbd5e1",
		noFocus: false
	},
	blue: {
		gap: 10,
		speed: 25,
		colors: "#e0f2fe,#7dd3fc,#0ea5e9",
		noFocus: false
	},
	yellow: {
		gap: 3,
		speed: 20,
		colors: "#fef08a,#fde047,#eab308",
		noFocus: false
	},
	pink: {
		gap: 6,
		speed: 80,
		colors: "#fecdd3,#fda4af,#e11d48",
		noFocus: true
	}
};
function PixelCard({ variant = "default", gap, speed, colors, noFocus, className = "", progress, randomness = .3, width, height }) {
	const containerRef = useRef(null);
	const canvasRef = useRef(null);
	const pixelsRef = useRef([]);
	const animationRef = useRef(void 0);
	const timePrevRef = useRef(performance.now());
	const progressRef = useRef(progress);
	const reducedMotion = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches).current;
	const cfg = VARIANTS[variant];
	const g = gap ?? cfg.gap;
	const s = speed ?? cfg.speed;
	const palette = colors ?? cfg.colors;
	const disableFocus = noFocus ?? cfg.noFocus;
	const updateCanvasOpacity = useCallback(() => {
		if (!canvasRef.current) return;
		if (progressRef.current === void 0) {
			canvasRef.current.style.opacity = "1";
			return;
		}
		const fadeStart = .9;
		const alpha = progressRef.current >= fadeStart ? 1 - (progressRef.current - fadeStart) / .1 : 1;
		canvasRef.current.style.opacity = String(clamp(alpha));
	}, []);
	const animate = useCallback((method) => {
		animationRef.current = requestAnimationFrame(() => animate(method));
		const now = performance.now();
		const elapsed = now - timePrevRef.current;
		if (elapsed < 1e3 / 60) return;
		timePrevRef.current = now - elapsed % (1e3 / 60);
		const ctx = canvasRef.current?.getContext("2d");
		if (!ctx || !canvasRef.current) return;
		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
		let idle = true;
		for (const p of pixelsRef.current) {
			if (method === "appearWithProgress") if (progressRef.current !== void 0) p.appearWithProgress(progressRef.current);
			else p.isIdle = true;
			else p[method]();
			if (!p.isIdle) idle = false;
		}
		updateCanvasOpacity();
		if (idle) cancelAnimationFrame(animationRef.current);
	}, [updateCanvasOpacity]);
	const startAnim = useCallback((m) => {
		cancelAnimationFrame(animationRef.current);
		animationRef.current = requestAnimationFrame(() => animate(m));
	}, [animate]);
	const initPixels = useCallback(() => {
		if (!containerRef.current || !canvasRef.current) return;
		const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
		const ctx = canvasRef.current.getContext("2d");
		canvasRef.current.width = Math.floor(cw);
		canvasRef.current.height = Math.floor(ch);
		const cols = palette.split(",");
		const px = [];
		const cx = cw / 2;
		const cy = ch / 2;
		const maxDist = Math.hypot(cx, cy);
		for (let x = 0; x < cw; x += g) for (let y = 0; y < ch; y += g) {
			const color = cols[Math.floor(Math.random() * cols.length)];
			const distNorm = Math.hypot(x - cx, y - cy) / maxDist;
			const threshold = clamp(distNorm * (1 - randomness) + Math.random() * randomness);
			const delay = reducedMotion ? 0 : distNorm * maxDist;
			if (!ctx) continue;
			px.push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(s, reducedMotion), delay, threshold));
		}
		pixelsRef.current = px;
		if (progressRef.current !== void 0) startAnim("appearWithProgress");
	}, [
		g,
		palette,
		s,
		randomness,
		reducedMotion,
		startAnim
	]);
	useEffect(() => {
		progressRef.current = progress;
		if (progress !== void 0) startAnim("appearWithProgress");
	}, [progress, startAnim]);
	useEffect(() => {
		if (progress === void 0) cancelAnimationFrame(animationRef.current);
	}, [progress]);
	useEffect(() => {
		initPixels();
		const obs = new ResizeObserver(initPixels);
		if (containerRef.current) obs.observe(containerRef.current);
		return () => {
			obs.disconnect();
			cancelAnimationFrame(animationRef.current);
		};
	}, [initPixels]);
	const hoverIn = () => progressRef.current === void 0 && startAnim("appear");
	const hoverOut = () => progressRef.current === void 0 && startAnim("disappear");
	const focusIn = (e) => {
		if (!disableFocus && !e.currentTarget.contains(e.relatedTarget) && progressRef.current === void 0) startAnim("appear");
	};
	const focusOut = (e) => {
		if (!disableFocus && !e.currentTarget.contains(e.relatedTarget) && progressRef.current === void 0) startAnim("disappear");
	};
	return /* @__PURE__ */ jsx("div", {
		ref: containerRef,
		style: {
			width: width || "100%",
			height: height || "100%"
		},
		children: /* @__PURE__ */ jsx("div", {
			className: cn("relative isolate grid select-none place-items-center overflow-hidden rounded-lg border border-border-light shadow-md transition-colors duration-200 ease-in-out", className),
			style: {
				width: "100%",
				height: "100%",
				transitionTimingFunction: "cubic-bezier(0.5, 1, 0.89, 1)"
			},
			onMouseEnter: hoverIn,
			onMouseLeave: hoverOut,
			onFocus: disableFocus ? void 0 : focusIn,
			onBlur: disableFocus ? void 0 : focusOut,
			tabIndex: disableFocus ? -1 : 0,
			children: /* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				className: "pointer-events-none absolute inset-0 block",
				width: width && width !== "auto" ? parseInt(String(width)) : void 0,
				height: height && height !== "auto" ? parseInt(String(height)) : void 0
			})
		})
	});
}
//#endregion
//#region src/components/FileUpload.tsx
const FileUpload = forwardRef(({ children, handleFileChange }, ref) => {
	return /* @__PURE__ */ jsxs(Fragment, { children: [children, /* @__PURE__ */ jsx("input", {
		ref,
		multiple: true,
		type: "file",
		style: { display: "none" },
		onChange: handleFileChange
	})] });
});
FileUpload.displayName = "FileUpload";
//#endregion
//#region src/components/MultiSelect.tsx
function getItemValue(item) {
	return typeof item === "string" ? item : item.value;
}
function getItemLabel(item) {
	return typeof item === "string" ? item : item.label;
}
function defaultRender(values, placeholder, items) {
	if (values.length === 0) return placeholder || "Select...";
	if (values.length === 1) {
		if (items) {
			const item = items.find((item) => getItemValue(item) === values[0]);
			if (item) return getItemLabel(item);
		}
		return values[0];
	}
	return `${values.length} items selected`;
}
function MultiSelect({ items, label, placeholder = "Select...", onSelectedValuesChange, renderSelectedValues = defaultRender, className, selectIcon, itemClassName, labelClassName, selectClassName, popoverClassName, selectItemsClassName, selectedValues = [], setSelectedValues, renderItemContent, popoverHeader, searchPlaceholder, searchEmptyText, disabled = false, showSelectedValues = false, showItemCheckboxes = false, onOpenChange }) {
	const selectRef = useRef(null);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [search, setSearch] = useState("");
	const visibleItems = items.filter((item) => getItemLabel(item).toLowerCase().includes(search.trim().toLowerCase()));
	const handleValueChange = (values) => {
		setSelectedValues(values);
		if (onSelectedValuesChange) onSelectedValuesChange(values);
	};
	const handleOpenChange = (open) => {
		setIsPopoverOpen(open);
		if (!open) setSearch("");
		if (onOpenChange) onOpenChange(open);
	};
	return /* @__PURE__ */ jsx("div", {
		className,
		children: /* @__PURE__ */ jsxs(SelectProvider, {
			value: selectedValues,
			setValue: handleValueChange,
			open: isPopoverOpen,
			setOpen: handleOpenChange,
			children: [
				label && /* @__PURE__ */ jsx(SelectLabel$1, {
					className: cn("mb-1 block text-sm text-text-primary", labelClassName),
					children: label
				}),
				/* @__PURE__ */ jsxs(Select$1, {
					ref: selectRef,
					disabled,
					"data-state": isPopoverOpen ? "open" : "closed",
					className: cn("flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm", "bg-surface-tertiary text-text-primary shadow-sm hover:cursor-pointer hover:bg-surface-hover", "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-surface-tertiary", "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary", selectClassName, selectedValues.length > 0 && selectItemsClassName != null && selectItemsClassName),
					onChange: (e) => e.stopPropagation(),
					children: [
						selectIcon && /* @__PURE__ */ jsx("span", { children: selectIcon }),
						/* @__PURE__ */ jsx("span", {
							className: cn("mr-auto truncate", !showSelectedValues && "hidden md:block"),
							children: renderSelectedValues(selectedValues, placeholder, items)
						}),
						/* @__PURE__ */ jsx(SelectArrow, { className: cn("ml-1 stroke-1 text-base opacity-75 transition-transform duration-300", !showSelectedValues && "hidden md:block", isPopoverOpen && "rotate-180") })
					]
				}),
				/* @__PURE__ */ jsxs(SelectPopover, {
					role: "dialog",
					"aria-label": label || placeholder,
					gutter: 4,
					sameWidth: true,
					modal: true,
					unmountOnHide: true,
					finalFocus: selectRef,
					className: cn("animate-popover z-40 flex max-h-[300px]", "flex-col overflow-hidden rounded-xl", "bg-surface-secondary px-1.5 py-1 text-text-primary shadow-lg", "border border-border-light", "outline-none", popoverClassName),
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "shrink-0",
							children: [searchPlaceholder && /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 border-b border-border-light px-4 py-2",
								children: [/* @__PURE__ */ jsx(Search, {
									"aria-hidden": "true",
									className: "size-4 shrink-0 text-text-secondary"
								}), /* @__PURE__ */ jsx("input", {
									"aria-label": searchPlaceholder,
									placeholder: searchPlaceholder,
									value: search,
									onChange: (event) => setSearch(event.target.value),
									className: "min-w-0 flex-1 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
								})]
							}), popoverHeader]
						}),
						/* @__PURE__ */ jsx(SelectList, {
							className: "min-h-0 overflow-y-auto overscroll-contain",
							children: visibleItems.map((item) => {
								const value = getItemValue(item);
								const label = getItemLabel(item);
								const isCurrentItemSelected = selectedValues.includes(value);
								const defaultContent = /* @__PURE__ */ jsxs(Fragment, { children: [showItemCheckboxes ? /* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									className: cn("flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-xheavy", isCurrentItemSelected && "bg-surface-inverted text-text-inverted"),
									children: isCurrentItemSelected && /* @__PURE__ */ jsx(Check, {
										className: "size-3.5",
										strokeWidth: 2
									})
								}) : /* @__PURE__ */ jsx(SelectItemCheck, { className: "mr-0.5 text-text-primary" }), /* @__PURE__ */ jsx("span", {
									className: "truncate",
									children: label
								})] });
								return /* @__PURE__ */ jsx(SelectItem$1, {
									value,
									"aria-label": label,
									className: cn("flex items-center gap-2 rounded-lg px-2 py-1.5 hover:cursor-pointer", "scroll-m-1 outline-none transition-colors", "hover:bg-surface-hover", "data-[active-item]:bg-surface-active", "w-full min-w-0 text-sm", itemClassName),
									children: renderItemContent ? renderItemContent(value, defaultContent, isCurrentItemSelected) : defaultContent
								}, value);
							})
						}),
						visibleItems.length === 0 && searchEmptyText && /* @__PURE__ */ jsx("div", {
							role: "status",
							className: "px-4 py-3 text-sm text-text-secondary",
							children: searchEmptyText
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/components/DropdownPopup.tsx
const DropdownPopup = ({ trigger, isOpen, setIsOpen, focusLoop, mountByState, ...props }) => {
	const menu = Ariakit.useMenuStore({
		open: isOpen,
		setOpen: setIsOpen,
		focusLoop
	});
	if (mountByState) return /* @__PURE__ */ jsxs(Ariakit.MenuProvider, {
		store: menu,
		children: [trigger, isOpen && /* @__PURE__ */ jsx(Menu, { ...props })]
	});
	return /* @__PURE__ */ jsxs(Ariakit.MenuProvider, {
		store: menu,
		children: [trigger, /* @__PURE__ */ jsx(Menu, { ...props })]
	});
};
const Menu = ({ items, menuId, keyPrefix, className, iconClassName, itemClassName, modal, portal, sameWidth, gutter = 8, finalFocus, unmountOnHide, preserveTabOrder, style, ...props }) => {
	const menuStore = Ariakit.useMenuStore();
	const menu = Ariakit.useMenuContext();
	const zIndex = usePopoverZIndex();
	return /* @__PURE__ */ jsx(Ariakit.Menu, {
		id: menuId,
		modal,
		gutter,
		portal,
		sameWidth,
		finalFocus,
		unmountOnHide,
		preserveTabOrder,
		style: {
			zIndex,
			pointerEvents: "auto",
			...style
		},
		className: cn("popover-ui", className),
		...props,
		children: items.filter((item) => item.show !== false).map((item, index) => {
			const { subItems } = item;
			if (item.separate === true) return /* @__PURE__ */ jsx(Ariakit.MenuSeparator, { className: "my-1 h-px border-border-medium" }, index);
			if (subItems && subItems.length > 0) return /* @__PURE__ */ jsxs(Ariakit.MenuProvider, {
				store: menuStore,
				children: [/* @__PURE__ */ jsxs(Ariakit.MenuButton, {
					className: cn("group flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-3.5 text-sm text-text-primary outline-none hover:bg-surface-hover focus:bg-surface-hover md:px-2.5 md:py-2", itemClassName),
					disabled: item.disabled,
					id: item.id,
					render: item.render,
					ref: item.ref,
					children: [/* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-2",
						children: [item.icon != null && /* @__PURE__ */ jsx("span", {
							className: cn("mr-2 size-4", iconClassName),
							"aria-hidden": "true",
							children: item.icon
						}), item.label]
					}), /* @__PURE__ */ jsx(Ariakit.MenuButtonArrow, { className: "stroke-1 text-base opacity-75" })]
				}), /* @__PURE__ */ jsx(Menu, {
					items: subItems,
					menuId: `${menuId}-${index}`,
					gutter: 12,
					portal: true
				}, `${keyPrefix ?? ""}${index}-${item.id ?? ""}`)]
			}, `${keyPrefix ?? ""}${index}-${item.id ?? ""}-provider`);
			return /* @__PURE__ */ jsxs(Ariakit.MenuItem, {
				id: item.id,
				className: cn("group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-3.5 text-sm text-text-primary outline-none hover:bg-surface-hover focus:bg-surface-hover md:px-2.5 md:py-2", itemClassName, item.className),
				disabled: item.disabled,
				render: item.render,
				ref: item.ref,
				hideOnClick: item.hideOnClick,
				"aria-haspopup": item.ariaHasPopup,
				"aria-controls": item.ariaControls,
				"aria-label": item.ariaLabel,
				"aria-checked": item.ariaChecked,
				...item.ariaChecked !== void 0 ? { role: "menuitemcheckbox" } : {},
				onClick: (event) => {
					event.preventDefault();
					if (item.onClick) item.onClick(event);
					if (item.hideOnClick === false) return;
					menu?.hide();
				},
				children: [
					item.icon != null && /* @__PURE__ */ jsx("span", {
						className: cn("mr-2 size-4", iconClassName),
						"aria-hidden": "true",
						children: item.icon
					}),
					item.label,
					item.kbd != null && /* @__PURE__ */ jsxs("kbd", {
						className: "ml-auto hidden font-sans text-xs text-text-tertiary group-hover:inline group-focus:inline",
						children: ["⌘", item.kbd]
					})
				]
			}, `${keyPrefix ?? ""}${index}-${item.id ?? ""}`);
		})
	});
};
//#endregion
//#region src/components/DelayedRender.tsx
const DelayedRender = ({ delay, children }) => useDelayedRender(delay)(() => children);
//#endregion
//#region src/theme/themes/highContrast.ts
/**
* High contrast accessibility themes.
*
* Selected through the appearance modes `high-contrast-light` and
* `high-contrast-dark`, and by `system` when the OS reports
* `prefers-contrast: more`. They resolve as a built-in `ThemeDefinition`
* (`highContrastTheme`) that outranks a deployment's custom theme, because a
* contrast choice is an accessibility need rather than a branding preference.
*
* Both maps are complete rather than partial overrides: a token left to fall
* back to `defaultTheme`/`darkTheme` would silently reintroduce a mid-grey the
* mode exists to eliminate.
*
* Contrast contract, enforced by `highContrast.spec.ts`:
* - text clears WCAG AAA (7:1) on every surface it can render on, including the
*   hover and active fills;
* - solid fills (`surface-submit`, `surface-destructive`, `status-*-strong`)
*   clear AAA against `text-on-status` AND AAA against the page. The label and
*   the silhouette are the same ratio here, because each mode paints its fills
*   on the far side of its own canvas: dark fills under a white label on white,
*   bright fills under a black label on black. That is the whole reason
*   `text-on-status` is a per-mode token rather than a literal white;
* - borders, rings and series marks clear the 3:1 non-text floor (WCAG 1.4.11).
*/
/**
* Black ink on a white canvas, black borders on every edge, and accents dark
* enough (relative luminance <= 0.1) that they clear 7:1 both against the canvas
* and against white text placed on them.
*/
const highContrastLightTheme = {
	"rgb-text-primary": "0 0 0",
	"rgb-text-secondary": "0 0 0",
	"rgb-text-secondary-alt": "0 0 0",
	"rgb-text-tertiary": "0 0 0",
	"rgb-text-muted": "0 0 0",
	"rgb-text-warning": "122 61 0",
	"rgb-text-destructive": "161 0 0",
	"rgb-shimmer-base": "0 0 0",
	"rgb-shimmer-dip": "77 77 77",
	"rgb-link": "0 0 204",
	"rgb-link-hover": "0 0 128",
	"rgb-link-visited": "107 0 179",
	"rgb-accent-primary": "0 80 77",
	"rgb-accent-primary-hover": "0 51 48",
	"rgb-ring-primary": "0 0 0",
	"rgb-header-primary": "255 255 255",
	"rgb-header-hover": "212 212 212",
	"rgb-header-button-hover": "212 212 212",
	/** Selected state. The fill does not carry WCAG 1.4.11 on its own: the
	*  contrast block in `client/src/style.css` rings every selected row and
	*  navigated menu item in `text-primary`, which is 21:1 against either canvas.
	*  That perimeter is what frees these fills to stay light, so a selected row's
	*  black label clears AAA (15.8:1 and 14.6:1) instead of the 6.25:1 a fill
	*  dark enough to mark itself used to cap it at. `-alt` meets `surface-hover`,
	*  the same place the standard light palette puts it. */
	"rgb-surface-active": "227 227 227",
	"rgb-surface-active-alt": "212 212 212",
	"rgb-surface-hover": "212 212 212",
	"rgb-surface-hover-alt": "184 184 184",
	"rgb-surface-composer-hover": "212 212 212",
	"rgb-surface-primary": "255 255 255",
	/** The chart widget canvas and its edge, which default to `surface-primary`
	*  and `border-light` elsewhere: here the panel is the plain canvas and its
	*  outline is pure ink, so a widget stays legible without a grey wash. */
	"rgb-chart-widget-surface": "255 255 255",
	"rgb-chart-widget-stroke": "0 0 0",
	"rgb-surface-primary-alt": "255 255 255",
	"rgb-surface-primary-contrast": "255 255 255",
	"rgb-surface-secondary": "255 255 255",
	"rgb-surface-secondary-alt": "255 255 255",
	"rgb-surface-tertiary": "255 255 255",
	"rgb-surface-tertiary-alt": "255 255 255",
	"rgb-surface-dialog": "255 255 255",
	"rgb-surface-overlay": "0 0 0",
	"rgb-surface-submit": "0 92 46",
	"rgb-surface-submit-hover": "0 61 30",
	"rgb-surface-destructive": "161 0 0",
	"rgb-surface-destructive-hover": "122 0 0",
	"rgb-surface-chat": "255 255 255",
	"rgb-surface-code": "255 255 255",
	"rgb-surface-inverted": "0 0 0",
	"rgb-surface-inverted-hover": "51 51 51",
	"rgb-text-inverted": "255 255 255",
	"rgb-surface-fixed": "255 255 255",
	"rgb-surface-fixed-hover": "212 212 212",
	"rgb-text-fixed": "0 0 0",
	"rgb-border-light": "0 0 0",
	"rgb-border-medium": "0 0 0",
	"rgb-border-medium-alt": "0 0 0",
	"rgb-border-heavy": "0 0 0",
	"rgb-border-xheavy": "0 0 0",
	"rgb-border-destructive": "161 0 0",
	"rgb-status-success": "0 92 46",
	"rgb-status-success-subtle": "255 255 255",
	"rgb-status-success-border": "0 92 46",
	"rgb-status-success-strong": "0 92 46",
	"rgb-status-info": "0 65 122",
	"rgb-status-info-subtle": "255 255 255",
	"rgb-status-info-border": "0 65 122",
	"rgb-status-info-strong": "0 65 122",
	"rgb-status-warning": "122 61 0",
	"rgb-status-warning-subtle": "255 255 255",
	"rgb-status-warning-border": "122 61 0",
	"rgb-status-warning-strong": "122 61 0",
	"rgb-status-error": "161 0 0",
	"rgb-status-error-subtle": "255 255 255",
	"rgb-status-error-border": "161 0 0",
	"rgb-status-error-strong": "161 0 0",
	"rgb-status-neutral": "0 0 0",
	"rgb-status-neutral-subtle": "255 255 255",
	"rgb-status-neutral-border": "0 0 0",
	/** Verified mark: the mode's one blue, 10.31:1 under the white check and the
	*  same against the canvas. */
	"rgb-status-verified": "0 65 122",
	"rgb-text-on-status": "255 255 255",
	"rgb-brand-purple": "107 0 179",
	/** Code syntax highlighting at AAA on the white code surface. */
	"rgb-syntax-text": "0 0 0",
	"rgb-syntax-comment": "77 77 77",
	"rgb-syntax-meta": "77 77 77",
	"rgb-syntax-builtin": "107 61 0",
	"rgb-syntax-keyword": "0 61 153",
	"rgb-syntax-string": "0 86 61",
	"rgb-syntax-attr": "122 20 82",
	"rgb-syntax-title": "143 26 16",
	/** Categorical series scale. Every slot clears 7:1 on the white canvas and no
	*  two adjacent chromatic slots sit closer than CIE76 dE 50 under normal
	*  vision or dE 45 under simulated deuteranopia. Seven saturated hues is all
	*  this canvas affords at that separation, so slot 8 is the palette's own
	*  neutral text — the stop `resolveTheme` also derives for a theme that
	*  paints its own scale — separated by lightness (21:1 on the canvas, dE 22.9
	*  from its neighbour under deuteranopia) rather than by hue. */
	"rgb-series-1": "11 79 160",
	"rgb-series-2": "143 59 0",
	"rgb-series-3": "0 82 79",
	"rgb-series-4": "92 74 0",
	"rgb-series-5": "148 0 92",
	"rgb-series-6": "77 26 153",
	"rgb-series-7": "15 92 15",
	"rgb-series-8": "0 0 0",
	/** Unchecked switch track. The stock 58%/40% greys land at 2.9:1 and 2.2:1
	*  against these canvases. This clears 3:1 three ways at once: 5.74:1 against
	*  the page and the `surface-primary` thumb, 3.66:1 against the checked
	*  `surface-inverted` track. */
	"rgb-switch-unchecked": "102 102 102",
	"rgb-presentation": "255 255 255"
};
/**
* White ink on a black canvas with white borders, and accents bright enough
* (relative luminance >= 0.3) that they clear 7:1 both against the canvas and
* against the black `text-on-status` label placed on them.
*/
const highContrastDarkTheme = {
	"rgb-text-primary": "255 255 255",
	"rgb-text-secondary": "255 255 255",
	"rgb-text-secondary-alt": "255 255 255",
	"rgb-text-tertiary": "255 255 255",
	"rgb-text-muted": "255 255 255",
	"rgb-text-warning": "255 201 77",
	"rgb-text-destructive": "255 143 143",
	"rgb-shimmer-base": "255 255 255",
	"rgb-shimmer-dip": "179 179 179",
	"rgb-link": "140 200 255",
	"rgb-link-hover": "194 224 255",
	"rgb-link-visited": "224 179 255",
	"rgb-accent-primary": "92 230 219",
	"rgb-accent-primary-hover": "163 242 236",
	"rgb-ring-primary": "255 255 255",
	"rgb-header-primary": "0 0 0",
	"rgb-header-hover": "61 61 61",
	"rgb-header-button-hover": "61 61 61",
	/** Selected state, the mirror of the light note: the perimeter marks the row,
	*  so these step off the canvas only as far as an AAA white label allows —
	*  14.2:1 and 10.9:1, against the 6.69:1 and 5.49:1 a self-marking fill used
	*  to force. `-alt` meets `surface-hover`, as it does in the light palette. */
	"rgb-surface-active": "43 43 43",
	"rgb-surface-active-alt": "61 61 61",
	"rgb-surface-hover": "61 61 61",
	"rgb-surface-hover-alt": "87 87 87",
	"rgb-surface-composer-hover": "61 61 61",
	"rgb-surface-primary": "0 0 0",
	/** See the light mode note: the widget takes the plain canvas and a pure-ink
	*  edge rather than the dimmed panel the standard themes use. */
	"rgb-chart-widget-surface": "0 0 0",
	"rgb-chart-widget-stroke": "255 255 255",
	"rgb-surface-primary-alt": "0 0 0",
	"rgb-surface-primary-contrast": "0 0 0",
	"rgb-surface-secondary": "0 0 0",
	"rgb-surface-secondary-alt": "0 0 0",
	"rgb-surface-tertiary": "0 0 0",
	"rgb-surface-tertiary-alt": "0 0 0",
	"rgb-surface-dialog": "0 0 0",
	"rgb-surface-overlay": "0 0 0",
	"rgb-surface-submit": "127 240 179",
	"rgb-surface-submit-hover": "163 245 204",
	"rgb-surface-destructive": "255 143 143",
	"rgb-surface-destructive-hover": "255 179 179",
	"rgb-surface-chat": "0 0 0",
	"rgb-surface-code": "0 0 0",
	"rgb-surface-inverted": "255 255 255",
	"rgb-surface-inverted-hover": "212 212 212",
	"rgb-text-inverted": "0 0 0",
	"rgb-surface-fixed": "255 255 255",
	"rgb-surface-fixed-hover": "212 212 212",
	"rgb-text-fixed": "0 0 0",
	"rgb-border-light": "255 255 255",
	"rgb-border-medium": "255 255 255",
	"rgb-border-medium-alt": "255 255 255",
	"rgb-border-heavy": "255 255 255",
	"rgb-border-xheavy": "255 255 255",
	"rgb-border-destructive": "255 143 143",
	"rgb-status-success": "127 240 179",
	"rgb-status-success-subtle": "0 0 0",
	"rgb-status-success-border": "127 240 179",
	"rgb-status-success-strong": "127 240 179",
	"rgb-status-info": "140 200 255",
	"rgb-status-info-subtle": "0 0 0",
	"rgb-status-info-border": "140 200 255",
	"rgb-status-info-strong": "140 200 255",
	"rgb-status-warning": "255 201 77",
	"rgb-status-warning-subtle": "0 0 0",
	"rgb-status-warning-border": "255 201 77",
	"rgb-status-warning-strong": "255 201 77",
	"rgb-status-error": "255 143 143",
	"rgb-status-error-subtle": "0 0 0",
	"rgb-status-error-border": "255 143 143",
	"rgb-status-error-strong": "255 143 143",
	"rgb-status-neutral": "255 255 255",
	"rgb-status-neutral-subtle": "0 0 0",
	"rgb-status-neutral-border": "255 255 255",
	/** Verified mark: the mode's one blue, 11.82:1 under the black check and the
	*  same against the canvas. */
	"rgb-status-verified": "140 200 255",
	"rgb-text-on-status": "0 0 0",
	"rgb-brand-purple": "224 179 255",
	/** Code syntax highlighting at AAA on the black code surface. */
	"rgb-syntax-text": "255 255 255",
	"rgb-syntax-comment": "179 179 179",
	"rgb-syntax-meta": "179 179 179",
	"rgb-syntax-builtin": "255 201 77",
	"rgb-syntax-keyword": "140 200 255",
	"rgb-syntax-string": "127 240 179",
	"rgb-syntax-attr": "255 153 194",
	"rgb-syntax-title": "255 143 143",
	/** Categorical series scale. Every slot clears 9.9:1 on the black canvas and
	*  no two adjacent chromatic slots sit closer than CIE76 dE 37 under normal
	*  vision or dE 42 under simulated deuteranopia. As in the light palette,
	*  slot 8 is the neutral text stop rather than an eighth pastel this canvas
	*  cannot separate: 21:1 on the canvas and dE 26.8 from the nearest slot
	*  under deuteranopia, distinguished by lightness rather than hue. */
	"rgb-series-1": "107 184 255",
	"rgb-series-2": "255 179 102",
	"rgb-series-3": "92 230 219",
	"rgb-series-4": "255 224 102",
	"rgb-series-5": "255 153 194",
	"rgb-series-6": "200 163 255",
	"rgb-series-7": "140 230 140",
	"rgb-series-8": "255 255 255",
	/** Unchecked switch track: 5.32:1 against the page and the `surface-primary`
	*  thumb, 3.95:1 against the checked `surface-inverted` track. */
	"rgb-switch-unchecked": "128 128 128",
	"rgb-presentation": "0 0 0"
};
//#endregion
//#region src/theme/themes/default.ts
/**
* Default light theme
* RGB values extracted from the existing CSS variables
*/
const defaultTheme = {
	"rgb-text-primary": "33 33 33",
	"rgb-text-secondary": "66 66 66",
	"rgb-text-secondary-alt": "89 89 89",
	"rgb-text-tertiary": "89 89 89",
	"rgb-text-muted": "105 110 121",
	"rgb-text-warning": "180 83 9",
	"rgb-text-destructive": "220 38 38",
	"rgb-shimmer-base": "33 33 33",
	"rgb-shimmer-dip": "129 130 134",
	"rgb-link": "37 99 235",
	"rgb-link-hover": "29 78 216",
	"rgb-link-visited": "147 51 234",
	"rgb-accent-primary": "18 110 107",
	"rgb-accent-primary-hover": "10 79 83",
	"rgb-ring-primary": "89 89 89",
	"rgb-header-primary": "255 255 255",
	"rgb-header-hover": "247 247 248",
	"rgb-header-button-hover": "247 247 248",
	"rgb-surface-active": "236 236 236",
	"rgb-surface-active-alt": "227 227 227",
	"rgb-surface-hover": "227 227 227",
	"rgb-surface-hover-alt": "205 205 205",
	"rgb-surface-composer-hover": "227 227 227",
	"rgb-surface-primary": "255 255 255",
	"rgb-chart-widget-surface": "255 255 255",
	"rgb-chart-widget-stroke": "230 231 233",
	"rgb-surface-primary-alt": "247 247 248",
	"rgb-surface-primary-contrast": "236 236 236",
	"rgb-surface-secondary": "247 247 248",
	"rgb-surface-secondary-alt": "227 227 227",
	"rgb-surface-tertiary": "236 236 236",
	"rgb-surface-tertiary-alt": "255 255 255",
	"rgb-surface-dialog": "255 255 255",
	"rgb-surface-overlay": "89 89 89",
	"rgb-surface-submit": "4 120 87",
	"rgb-surface-submit-hover": "6 95 70",
	"rgb-surface-destructive": "185 28 28",
	"rgb-surface-destructive-hover": "153 27 27",
	"rgb-surface-chat": "255 255 255",
	"rgb-surface-code": "247 247 248",
	"rgb-surface-inverted": "23 23 23",
	"rgb-surface-inverted-hover": "47 47 47",
	"rgb-text-inverted": "255 255 255",
	"rgb-surface-fixed": "255 255 255",
	"rgb-surface-fixed-hover": "236 236 236",
	"rgb-text-fixed": "33 33 33",
	"rgb-border-light": "227 227 227",
	"rgb-border-medium": "205 205 205",
	"rgb-border-medium-alt": "205 205 205",
	"rgb-border-heavy": "153 150 150",
	"rgb-border-xheavy": "89 89 89",
	"rgb-border-destructive": "220 38 38",
	"rgb-status-success": "4 120 87",
	"rgb-status-success-subtle": "236 253 245",
	"rgb-status-success-border": "110 231 183",
	"rgb-status-success-strong": "2 133 94",
	"rgb-status-info": "37 99 235",
	"rgb-status-info-subtle": "239 246 255",
	"rgb-status-info-border": "147 197 253",
	"rgb-status-info-strong": "89 89 89",
	"rgb-status-warning": "180 83 9",
	"rgb-status-warning-subtle": "255 251 235",
	"rgb-status-warning-border": "252 211 77",
	"rgb-status-warning-strong": "199 82 9",
	"rgb-status-error": "185 28 28",
	"rgb-status-error-subtle": "254 242 242",
	"rgb-status-error-border": "252 165 165",
	"rgb-status-error-strong": "224 47 31",
	"rgb-status-neutral": "66 66 66",
	"rgb-status-neutral-subtle": "236 236 236",
	"rgb-status-neutral-border": "205 205 205",
	/** Verified mark. `blue-600` doubles as `status-info` here, and that is the
	*  point: one blue for "this is informational/first-party", 5.17:1 under the
	*  white label and 4.83:1 against the panel. */
	"rgb-status-verified": "37 99 235",
	"rgb-text-on-status": "255 255 255",
	"rgb-brand-purple": "126 34 206",
	/** Code syntax highlighting, measured against the `surface-code` fill. */
	"rgb-syntax-text": "33 33 33",
	"rgb-syntax-comment": "89 89 89",
	"rgb-syntax-meta": "66 66 66",
	"rgb-syntax-builtin": "154 103 0",
	"rgb-syntax-keyword": "5 80 174",
	"rgb-syntax-string": "10 123 98",
	"rgb-syntax-attr": "154 47 106",
	"rgb-syntax-title": "180 35 24",
	/** Categorical series scale. Steps clear 3:1 against BOTH the popover surface
	*  and the #ececec meter track, with worst adjacent CVD ΔE 12.4 and worst
	*  adjacent normal-vision ΔE 19.0. Slot order is the CVD-safety mechanism:
	*  indigo(8) sits beside green(7) because blue separates from green under
	*  protanopia/deuteranopia where red would not. */
	"rgb-series-1": "5 110 189",
	"rgb-series-2": "233 86 13",
	"rgb-series-3": "0 148 142",
	"rgb-series-4": "182 123 5",
	"rgb-series-5": "216 90 142",
	"rgb-series-6": "126 35 205",
	"rgb-series-7": "1 131 1",
	"rgb-series-8": "63 81 181",
	/** Unchecked switch track. 3.03:1 against the white page and the
	*  `surface-primary` thumb, 5.91:1 against the checked `surface-inverted`
	*  track, so the control reads in either state. */
	"rgb-switch-unchecked": "148 148 148",
	"rgb-presentation": "255 255 255"
};
//#endregion
//#region src/theme/themes/dark.ts
/**
* Dark theme
* RGB values extracted from the existing dark mode CSS variables
*/
const darkTheme = {
	"rgb-text-primary": "236 236 236",
	"rgb-text-secondary": "205 205 205",
	"rgb-text-secondary-alt": "153 150 150",
	"rgb-text-tertiary": "153 150 150",
	"rgb-text-muted": "179 182 189",
	"rgb-text-warning": "245 158 11",
	"rgb-text-destructive": "248 113 113",
	"rgb-shimmer-base": "255 255 255",
	"rgb-shimmer-dip": "179 179 179",
	"rgb-link": "96 165 250",
	"rgb-link-hover": "147 197 253",
	"rgb-link-visited": "192 132 252",
	"rgb-accent-primary": "65 167 157",
	"rgb-accent-primary-hover": "109 200 185",
	"rgb-ring-primary": "89 89 89",
	"rgb-header-primary": "47 47 47",
	"rgb-header-hover": "66 66 66",
	"rgb-header-button-hover": "47 47 47",
	"rgb-surface-active": "89 89 89",
	"rgb-surface-active-alt": "47 47 47",
	"rgb-surface-hover": "57 57 57",
	"rgb-surface-hover-alt": "66 66 66",
	"rgb-surface-composer-hover": "66 66 66",
	"rgb-surface-primary": "13 13 13",
	"rgb-chart-widget-surface": "40 40 40",
	"rgb-chart-widget-stroke": "50 50 50",
	"rgb-surface-primary-alt": "23 23 23",
	"rgb-surface-primary-contrast": "23 23 23",
	"rgb-surface-secondary": "33 33 33",
	"rgb-surface-secondary-alt": "33 33 33",
	"rgb-surface-tertiary": "47 47 47",
	"rgb-surface-tertiary-alt": "47 47 47",
	"rgb-surface-dialog": "18 18 18",
	"rgb-surface-overlay": "0 0 0",
	"rgb-surface-submit": "4 120 87",
	"rgb-surface-submit-hover": "6 95 70",
	"rgb-surface-destructive": "153 27 27",
	"rgb-surface-destructive-hover": "127 29 29",
	"rgb-surface-chat": "47 47 47",
	"rgb-surface-code": "33 33 33",
	"rgb-surface-inverted": "255 255 255",
	"rgb-surface-inverted-hover": "236 236 236",
	"rgb-text-inverted": "23 23 23",
	"rgb-surface-fixed": "255 255 255",
	"rgb-surface-fixed-hover": "236 236 236",
	"rgb-text-fixed": "33 33 33",
	"rgb-border-light": "47 47 47",
	"rgb-border-medium": "66 66 66",
	"rgb-border-medium-alt": "66 66 66",
	"rgb-border-heavy": "89 89 89",
	"rgb-border-xheavy": "153 150 150",
	"rgb-border-destructive": "239 68 68",
	"rgb-status-success": "110 231 183",
	"rgb-status-success-subtle": "2 44 34",
	"rgb-status-success-border": "6 95 70",
	/** Not `green-800` like its border twin: this fill also paints bare marks
	*  (selection checks, the version timeline rail, prompt chips) that have to
	*  clear 3:1 against the #212121 panel, and green-800 reached only 2.10:1
	*  there. Balanced instead, the same way light's `#02855e` is: 4.55:1 under
	*  the white `text-on-status` label and 3.54:1 against the panel. */
	"rgb-status-success-strong": "8 135 89",
	"rgb-status-info": "147 197 253",
	"rgb-status-info-subtle": "23 37 84",
	"rgb-status-info-border": "30 64 175",
	"rgb-status-info-strong": "66 66 66",
	"rgb-status-warning": "252 211 77",
	"rgb-status-warning-subtle": "69 26 3",
	"rgb-status-warning-border": "146 64 14",
	"rgb-status-warning-strong": "146 64 14",
	"rgb-status-error": "252 165 165",
	"rgb-status-error-subtle": "69 10 10",
	"rgb-status-error-border": "153 27 27",
	"rgb-status-error-strong": "153 27 27",
	"rgb-status-neutral": "205 205 205",
	"rgb-status-neutral-subtle": "33 33 33",
	"rgb-status-neutral-border": "47 47 47",
	/** Verified mark. Not `status-info`'s `blue-300`, which is a text hue and
	*  leaves a white check at 1.35:1. The card it sits on is `surface-dialog`
	*  at rest and `surface-tertiary` (#2f2f2f) on hover, and that hover is the
	*  binding constraint: `#0b74d4` held the panel at 3.42:1 but fell to 2.85:1
	*  there. Both relationships are graphical (WCAG 1.4.11): 3.23:1 against the
	*  hover surface, 4.52:1 against the resting dialog, and 4.14:1 under the
	*  white `text-on-status` check. No hue clears 3:1 on #2f2f2f and 4.5:1
	*  under a white check at once — the check would have to stop being white. */
	"rgb-status-verified": "26 127 216",
	"rgb-text-on-status": "255 255 255",
	"rgb-brand-purple": "171 104 255",
	/** Code syntax highlighting, measured against the `surface-code` fill. The
	*  comment and meta values are the flattened equivalents of the alpha-blended
	*  whites this palette used before it was tokenized: 50% and 60% white over
	*  the #212121 code surface. */
	"rgb-syntax-text": "255 255 255",
	"rgb-syntax-comment": "144 144 144",
	"rgb-syntax-meta": "166 166 166",
	"rgb-syntax-builtin": "233 149 12",
	"rgb-syntax-keyword": "46 149 211",
	"rgb-syntax-string": "0 166 125",
	"rgb-syntax-attr": "223 48 121",
	"rgb-syntax-title": "242 44 61",
	/** Categorical series scale — the same eight hues stepped for the #212121
	*  surface: worst adjacent CVD ΔE 13.0, normal-vision ΔE 19.0, all ≥ 3:1.
	*  Slot 8 is muted rather than the light mode's saturated indigo because a
	*  slot also fills a badge chip under `text-on-status` white: #8c98e6 carried
	*  that glyph at only 2.71:1, this reads 3.66:1 and still clears 3.66:1 on
	*  every series surface. */
	"rgb-series-1": "9 140 238",
	"rgb-series-2": "217 87 35",
	"rgb-series-3": "6 158 152",
	"rgb-series-4": "200 133 12",
	"rgb-series-5": "213 82 130",
	"rgb-series-6": "171 104 254",
	"rgb-series-7": "80 167 49",
	"rgb-series-8": "120 130 190",
	/** Unchecked switch track. 3.38:1 against the page and the `surface-primary`
	*  thumb, 5.74:1 against the checked `surface-inverted` track. */
	"rgb-switch-unchecked": "102 102 102",
	"rgb-presentation": "33 33 33"
};
//#endregion
//#region src/theme/registry.ts
const THEME_VERSION = 1;
const themeColorTokens = Object.freeze(Object.keys(defaultTheme));
/**
* What the verified mark is measured against: the fill it wore before it had a
* token, the check it carries, and the backgrounds `ToolCard` takes at rest and
* on hover. A theme naming any of these coordinated the mark; one naming none
* of them never looked at it.
*/
const MARK_NEIGHBOURHOOD = Object.freeze([
	"rgb-status-success-strong",
	"rgb-text-on-status",
	"rgb-surface-dialog",
	"rgb-surface-secondary",
	"rgb-surface-tertiary"
]);
const themeAppearanceProperties = Object.freeze({
	controlRadius: "--theme-control-radius",
	roundControlRadius: "--theme-round-control-radius",
	surfaceRadius: "--theme-surface-radius",
	largeSurfaceRadius: "--theme-large-surface-radius",
	controlHeight: "--theme-control-height",
	spaceCompact: "--theme-space-compact",
	spaceNormal: "--theme-space-normal",
	fontFamily: "--theme-font-family",
	elevationSurface: "--theme-elevation-surface",
	motionFast: "--theme-motion-fast",
	motionNormal: "--theme-motion-normal"
});
const defaultAppearance = Object.freeze({
	controlRadius: "0.75rem",
	roundControlRadius: "9999px",
	surfaceRadius: "1rem",
	largeSurfaceRadius: "1.5rem",
	controlHeight: "2.25rem",
	spaceCompact: "0.375rem",
	spaceNormal: "0.75rem",
	fontFamily: "Inter, sans-serif",
	elevationSurface: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
	motionFast: "150ms",
	motionNormal: "200ms"
});
const themeBrandTokens = Object.freeze([
	"provider-openai",
	"provider-openai-gpt4",
	"provider-openai-reasoning",
	"provider-anthropic",
	"provider-azure",
	"provider-bedrock",
	"provider-foreground"
]);
const defaultBrands = Object.freeze({
	"provider-openai": "#19C37D",
	"provider-openai-gpt4": "#AB68FF",
	"provider-openai-reasoning": "#000000",
	"provider-anthropic": "#d09a74",
	"provider-azure": "linear-gradient(0.375turn, #61bde2, #4389d0)",
	"provider-bedrock": "#268672",
	"provider-foreground": "#ffffff"
});
const libreChatTheme = Object.freeze({
	version: 1,
	name: "librechat",
	modes: {
		light: { colors: defaultTheme },
		dark: { colors: darkTheme }
	},
	brands: defaultBrands
});
/**
* Built-in accessibility theme behind the `high-contrast-light` and
* `high-contrast-dark` appearance modes. `HIGH_CONTRAST_THEME_NAME` is what
* `applyResolvedTheme` stamps onto `data-theme`, and what the `high-contrast`
* class on `<html>` mirrors for the CSS-only variables the token layer cannot
* reach (see the `html.high-contrast` block in `client/src/style.css`).
*/
const HIGH_CONTRAST_THEME_NAME = "high-contrast";
/**
* A brand fill carries a glyph and has to stand out from the canvas, and both
* flip between the modes, so the brands are declared per mode: dark tints under
* a white glyph on white, bright tints under a black glyph on black. Hue is kept
* so a provider stays recognisable; the worst pair measures 8.76:1 for both the
* glyph and the silhouette, against 2.30:1 for the standard brand set.
*/
const highContrastLightBrands = Object.freeze({
	"provider-openai": "#00563d",
	"provider-openai-gpt4": "#4d1a99",
	"provider-openai-reasoning": "#000000",
	"provider-anthropic": "#6b3d00",
	"provider-azure": "#00417a",
	"provider-bedrock": "#00504d",
	"provider-foreground": "#ffffff"
});
const highContrastDarkBrands = Object.freeze({
	"provider-openai": "#7ff0b3",
	"provider-openai-gpt4": "#c8a3ff",
	"provider-openai-reasoning": "#ffffff",
	"provider-anthropic": "#ffc94d",
	"provider-azure": "#8cc8ff",
	"provider-bedrock": "#5ce6db",
	"provider-foreground": "#000000"
});
const highContrastTheme = Object.freeze({
	version: 1,
	name: HIGH_CONTRAST_THEME_NAME,
	modes: {
		light: {
			colors: highContrastLightTheme,
			brands: highContrastLightBrands
		},
		dark: {
			colors: highContrastDarkTheme,
			brands: highContrastDarkBrands
		}
	}
});
const rgbPattern$1 = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/;
const cssLengthPattern = /^(0|\d*\.?\d+(px|rem|em))$/;
const cssDurationPattern = /^\d*\.?\d+(ms|s)$/;
const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function isLinearGradient(value) {
	if (!value.startsWith("linear-gradient(") || /url\s*\(|image-set/i.test(value)) return false;
	let depth = 0;
	for (let i = 0; i < value.length; i++) {
		const char = value[i];
		if (char === "(") depth += 1;
		else if (char === ")") {
			depth -= 1;
			if (depth === 0) return i === value.length - 1;
			if (depth < 0) return false;
		}
	}
	return false;
}
const isRGB = (value) => {
	if (typeof value !== "string") return false;
	const match = value.match(rgbPattern$1);
	return match !== null && match.slice(1).every((channel) => Number(channel) <= 255);
};
const isLength = (value) => typeof value === "string" && cssLengthPattern.test(value);
const isDuration = (value) => typeof value === "string" && cssDurationPattern.test(value);
const isPlainRecord = (value) => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	try {
		const prototype = Object.getPrototypeOf(value);
		return prototype === null || prototype.constructor?.name === "Object";
	} catch {
		return false;
	}
};
const appearanceValidators = {
	controlRadius: isLength,
	roundControlRadius: isLength,
	surfaceRadius: isLength,
	largeSurfaceRadius: isLength,
	controlHeight: isLength,
	spaceCompact: isLength,
	spaceNormal: isLength,
	fontFamily: (value) => typeof value === "string" && value.trim().length > 0 && !/[;{}]/.test(value),
	elevationSurface: (value) => typeof value === "string" && value.trim().length > 0 && !/[;{}]|url\s*\(/i.test(value),
	motionFast: isDuration,
	motionNormal: isDuration
};
/** Shared by the theme-wide `brands` and each mode's override block. */
function collectBrandErrors(brands) {
	if (!isPlainRecord(brands)) return [];
	return Object.entries(brands).flatMap(([key, value]) => {
		if (!themeBrandTokens.includes(key)) return [`Unknown brand token: ${key}`];
		const isValidBrand = typeof value === "string" && (key === "provider-foreground" ? hexColorPattern.test(value) : hexColorPattern.test(value) || isLinearGradient(value));
		return value !== void 0 && !isValidBrand ? [`Invalid brand value for ${key}: ${value}`] : [];
	});
}
function validateThemeDefinition(theme) {
	const errors = [];
	if (!isPlainRecord(theme)) return ["Theme definition must be an object"];
	Object.keys(theme).forEach((key) => {
		if (key !== "version" && key !== "name" && key !== "modes" && key !== "brands") errors.push(`Unknown theme field: ${key}`);
	});
	if (theme.version !== 1) errors.push(`Unsupported theme version: ${theme.version}`);
	if (typeof theme.name !== "string" || !theme.name.trim()) errors.push("Theme name is required");
	if (!isPlainRecord(theme.modes)) {
		errors.push("Theme modes must be an object");
		return errors;
	}
	Object.keys(theme.modes).forEach((mode) => {
		if (mode !== "light" && mode !== "dark") errors.push(`Unknown theme mode: ${mode}`);
	});
	["light", "dark"].forEach((mode) => {
		const definition = theme.modes[mode];
		if (definition === void 0) return;
		if (!isPlainRecord(definition)) {
			errors.push(`Theme mode ${mode} must be an object`);
			return;
		}
		Object.keys(definition).forEach((key) => {
			if (key !== "colors" && key !== "appearance" && key !== "brands") errors.push(`Unknown ${mode} theme field: ${key}`);
		});
		if (definition.colors !== void 0 && !isPlainRecord(definition.colors)) errors.push(`Theme colors for ${mode} must be an object`);
		else Object.entries(definition.colors ?? {}).forEach(([key, value]) => {
			if (!themeColorTokens.includes(key)) {
				errors.push(`Unknown color token: ${key}`);
				return;
			}
			if (value !== void 0 && !isRGB(value)) errors.push(`Invalid RGB value for ${key}: ${value}`);
		});
		if (definition.appearance !== void 0 && !isPlainRecord(definition.appearance)) errors.push(`Theme appearance for ${mode} must be an object`);
		else Object.entries(definition.appearance ?? {}).forEach(([key, value]) => {
			const validator = appearanceValidators[key];
			if (!validator) {
				errors.push(`Unknown appearance token: ${key}`);
				return;
			}
			if (value !== void 0 && !validator(value)) errors.push(`Invalid appearance value for ${key}: ${value}`);
		});
		if (definition.brands !== void 0 && !isPlainRecord(definition.brands)) errors.push(`Theme brands for ${mode} must be an object`);
		else errors.push(...collectBrandErrors(definition.brands));
	});
	if (theme.brands !== void 0 && !isPlainRecord(theme.brands)) errors.push("Theme brands must be an object");
	else errors.push(...collectBrandErrors(theme.brands));
	return errors;
}
/**
* A partial theme promises that an omitted value falls back, and
* `Partial<IThemeBrands>` lets a key be present with `undefined`. Spreading
* that would overwrite the inherited brand with nothing, and unlike colors,
* which `mapColors` skips when undefined, every brand token is written to the
* DOM unconditionally, so the avatar would lose its fill entirely.
*/
function definedBrands(brands) {
	if (!brands) return {};
	return Object.fromEntries(Object.entries(brands).filter(([, value]) => value !== void 0));
}
function resolveTheme(theme, mode) {
	const errors = validateThemeDefinition(theme);
	if (errors.length > 0) throw new TypeError(errors.join("\n"));
	const baseColors = mode === "dark" ? darkTheme : defaultTheme;
	const definition = theme.modes[mode];
	const customColors = definition?.colors;
	const composerHoverFallback = customColors?.["rgb-surface-composer-hover"] === void 0 && customColors?.["rgb-surface-hover"] !== void 0 ? { "rgb-surface-composer-hover": customColors["rgb-surface-hover"] } : {};
	/**
	* Code blocks are tied to the same mode-specific surfaces by the legacy CSS:
	* `surface-primary-alt` in light and `presentation` in dark. Keep that
	* relationship for themes created before `surface-code` was registered,
	* rather than pinning their syntax colours to the bundled code surface.
	*/
	const codeSurfaceSource = mode === "dark" ? customColors?.["rgb-presentation"] : customColors?.["rgb-surface-primary-alt"];
	const codeSurfaceFallback = customColors?.["rgb-surface-code"] === void 0 && codeSurfaceSource !== void 0 ? { "rgb-surface-code": codeSurfaceSource } : {};
	/**
	* Themes written before the shimmer stops existed cannot name them, and
	* filling the omission from the bundled base would pin their in-flight labels
	* to TerraMind's own sweep — a theme that restates its text as white would
	* light every label in the stock near-black. A theme that wants the bundled
	* sweep alongside custom text still gets it by naming the stop, the way
	* `rgb-surface-composer-hover` opts out of its own fallback above.
	*/
	const shimmerBaseFallback = customColors?.["rgb-shimmer-base"] === void 0 && customColors?.["rgb-text-primary"] !== void 0 ? { "rgb-shimmer-base": customColors["rgb-text-primary"] } : {};
	const textMutedFallback = customColors?.["rgb-text-muted"] === void 0 && customColors?.["rgb-text-tertiary"] !== void 0 ? { "rgb-text-muted": customColors["rgb-text-tertiary"] } : {};
	const chartWidgetSurfaceFallback = customColors?.["rgb-chart-widget-surface"] === void 0 && customColors?.["rgb-surface-primary"] !== void 0 ? { "rgb-chart-widget-surface": customColors["rgb-surface-primary"] } : {};
	const chartWidgetStrokeFallback = customColors?.["rgb-chart-widget-stroke"] === void 0 && customColors?.["rgb-border-light"] !== void 0 ? { "rgb-chart-widget-stroke": customColors["rgb-border-light"] } : {};
	/**
	* Slot 8 arrived after the seven-slot scale shipped, so a stored or
	* environment theme that paints its own scale cannot name it. Filling the
	* omission from the bundled base would drop TerraMind's indigo onto that
	* theme's own surfaces — the one pairing it never checked, since the stop's
	* 3:1 mark contrast is a claim about the bundled surfaces only. The RESOLVED
	* secondary text is the one colour that tracks whatever the theme reads its
	* body copy against, whether it names its own or inherits ours, so slot 8
	* stays exactly as visible as that text; hue-neutral, it cannot collide with
	* a custom slot 1–7 under protanopia/deuteranopia either. A theme that wants
	* a hue for slot 8 names it, the way `rgb-surface-composer-hover` opts out of
	* its own fallback.
	*/
	const ownsSeriesScale = customColors != null && [
		1,
		2,
		3,
		4,
		5,
		6,
		7
	].some((slot) => customColors[`rgb-series-${slot}`] !== void 0);
	const seriesEightFallback = customColors?.["rgb-series-8"] === void 0 && ownsSeriesScale ? { "rgb-series-8": customColors?.["rgb-text-secondary"] ?? baseColors["rgb-text-secondary"] } : {};
	const verifiedFallback = customColors != null && MARK_NEIGHBOURHOOD.some((token) => customColors[token] !== void 0) && customColors?.["rgb-status-verified"] === void 0 ? { "rgb-status-verified": customColors?.["rgb-status-success-strong"] ?? baseColors["rgb-status-success-strong"] } : {};
	return {
		version: 1,
		name: theme.name,
		mode,
		colors: {
			...baseColors,
			...customColors,
			...codeSurfaceFallback,
			...composerHoverFallback,
			...shimmerBaseFallback,
			...textMutedFallback,
			...chartWidgetSurfaceFallback,
			...chartWidgetStrokeFallback,
			...seriesEightFallback,
			...verifiedFallback
		},
		appearance: {
			...defaultAppearance,
			...definition?.appearance
		},
		/** Mode last: a mode override is more specific than the theme-wide set. */
		brands: {
			...defaultBrands,
			...definedBrands(theme.brands),
			...definedBrands(definition?.brands)
		}
	};
}
function fromLegacyTheme(colors, name = "custom") {
	const legacyName = name.trim() || "custom";
	const sanitizedColors = themeColorTokens.reduce((result, token) => {
		const value = colors[token];
		if (isRGB(value)) result[token] = value;
		return result;
	}, {});
	return {
		version: 1,
		name: legacyName,
		modes: {
			light: { colors: sanitizedColors },
			dark: { colors: sanitizedColors }
		}
	};
}
//#endregion
//#region src/theme/utils/applyTheme.ts
const colorProperty = (token) => `--${token.slice(4)}`;
const brandProperty = (token) => `--${token}`;
const themeOwnedProperties = Object.freeze([
	...themeColorTokens.map(colorProperty),
	...Object.values(themeAppearanceProperties),
	...themeBrandTokens.map(brandProperty)
]);
const rgbPattern = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/;
function validateRGB(rgb) {
	const match = rgb.match(rgbPattern);
	return match !== null && match.slice(1).every((channel) => Number(channel) <= 255);
}
/** `base` is the bundled palette for the mode being applied. The adapter writes
*  only the keys a theme names, so a derivation whose source the theme inherits
*  rather than restates has nothing to read without it. */
function mapColors(colors, base) {
	const variables = themeColorTokens.reduce((result, token) => {
		const value = colors[token];
		if (value !== void 0) result.push([colorProperty(token), value]);
		return result;
	}, []);
	if (colors["rgb-surface-composer-hover"] === void 0 && colors["rgb-surface-hover"] !== void 0) variables.push(["--surface-composer-hover", colors["rgb-surface-hover"]]);
	/**
	* Stored and environment themes predate the shimmer stops, and this adapter
	* applies only the keys a theme names — so without this they would keep the
	* stock sweep while every other color moved, and in dark mode the CSS cannot
	* recover: `.dark` declares a base outright, so the `--text-primary` fallback
	* never runs. The bright stop follows the theme's primary text color, which
	* is what it already resolves to in light. The dip has no legacy counterpart
	* and stays at its default: it is the faded half of the sweep, carried at low
	* alpha, so it reads as dimmed against any base.
	*/
	if (colors["rgb-shimmer-base"] === void 0 && colors["rgb-text-primary"] !== void 0) variables.push(["--shimmer-base", colors["rgb-text-primary"]]);
	if (colors["rgb-text-muted"] === void 0 && colors["rgb-text-tertiary"] !== void 0) variables.push(["--text-muted", colors["rgb-text-tertiary"]]);
	if (colors["rgb-chart-widget-surface"] === void 0 && colors["rgb-surface-primary"] !== void 0) variables.push(["--chart-widget-surface", colors["rgb-surface-primary"]]);
	if (colors["rgb-chart-widget-stroke"] === void 0 && colors["rgb-border-light"] !== void 0) variables.push(["--chart-widget-stroke", colors["rgb-border-light"]]);
	/**
	* Same rule as `resolveTheme`: a theme that paints what the mark is measured
	* against coordinated the `status-success-strong` the mark wore before it had
	* a token, so it keeps that fill rather than taking TerraMind's stock blue.
	* This adapter writes only the keys a theme names, so the inherited value
	* arrives through `base`, the bundled palette for the mode being applied.
	*/
	const ownsMarkSurroundings = MARK_NEIGHBOURHOOD.some((token) => colors[token] !== void 0);
	const inheritedSuccess = colors["rgb-status-success-strong"] ?? base?.["rgb-status-success-strong"];
	if (ownsMarkSurroundings && colors["rgb-status-verified"] === void 0 && inheritedSuccess !== void 0) variables.push(["--status-verified", inheritedSuccess]);
	return variables;
}
function mapAppearance(appearance) {
	return Object.entries(themeAppearanceProperties).map(([key, property]) => [property, appearance[key]]);
}
function clearAppliedTheme(root = document.documentElement) {
	themeOwnedProperties.forEach((property) => root.style.removeProperty(property));
	root.removeAttribute("data-theme");
}
function applyResolvedTheme(theme, root = document.documentElement) {
	[
		...mapColors(theme.colors),
		...mapAppearance(theme.appearance),
		...themeBrandTokens.map((token) => [brandProperty(token), theme.brands[token]])
	].forEach(([property, value]) => root.style.setProperty(property, value));
	root.dataset.theme = theme.name;
}
/**
* Backward-compatible adapter for the original partial RGB theme interface.
* New theme implementations should resolve a ThemeDefinition and use applyResolvedTheme.
*/
function applyTheme(themeRGB, root = document.documentElement, base) {
	if (!themeRGB) return;
	mapColors(themeRGB, base).forEach(([property, value]) => {
		if (!validateRGB(value)) {
			console.error(`Invalid RGB value for ${property}: ${value}`);
			return;
		}
		root.style.setProperty(property, value);
	});
}
//#endregion
//#region src/theme/context/ThemeProvider.tsx
const THEME_KEY = "color-theme";
const THEME_COLORS_KEY = "theme-colors";
const THEME_NAME_KEY = "theme-name";
const THEME_DEFINITION_KEY = "theme-definition";
const THEME_SOURCE_KEY = "theme-source";
const HIGH_CONTRAST_CLASS = "high-contrast";
const themeModes = [
	"light",
	"dark",
	"system",
	"high-contrast-light",
	"high-contrast-dark"
];
const ThemeContext = createContext({
	theme: "system",
	setTheme: () => void 0,
	resolvedMode: "light",
	highContrast: false,
	setThemeRGB: () => void 0,
	setThemeDefinition: () => void 0,
	setThemeName: () => void 0,
	resetTheme: () => void 0
});
/**
* Media queries are read during render by the provider's state initializers and
* by consumers, so they have to tolerate the absence of a window the same way
* the storage helpers do. On the server both preferences resolve to false, which
* renders the light palette with no contrast override; the effects that apply
* the real values run on hydration.
*/
const matchesMedia = (query) => typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false;
const isDark = (theme) => {
	if (theme === "system") return matchesMedia("(prefers-color-scheme: dark)");
	return theme === "dark" || theme === "high-contrast-dark";
};
/**
* Whether the appearance mode explicitly asks for high contrast. `system` is
* excluded here and resolved separately through `prefers-contrast`, because
* this predicate answers "what did the user pick", which is what the theme
* toggle has to preserve when it flips the colour scheme.
*/
const isHighContrast = (theme) => theme === "high-contrast-light" || theme === "high-contrast-dark";
/**
* The media queries that mean "the OS asked for more contrast". Windows Contrast
* Themes are the reason there are three: the browser turns them into
* `forced-colors: active` and reports `prefers-contrast: custom` for a palette
* whose own ratio is neither clearly more nor less, so keying off
* `prefers-contrast: more` alone misses the platform the README names.
*/
const CONTRAST_QUERIES = [
	"(prefers-contrast: more)",
	"(prefers-contrast: custom)",
	"(forced-colors: active)"
];
/**
* `system` follows the OS for contrast the same way it already follows it for
* the colour scheme, so a user who has switched on "Increase contrast" gets the
* accessible palette without first discovering this setting.
*/
const prefersMoreContrast = () => CONTRAST_QUERIES.some(matchesMedia);
/** The resolved contrast for an appearance mode, explicit choice or OS request. */
const resolvesToHighContrast = (theme) => isHighContrast(theme) || theme === "system" && prefersMoreContrast();
const isAppearanceMode = (value) => themeModes.includes(value);
const isValidThemeColors = (value) => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	try {
		return validateThemeDefinition(fromLegacyTheme(value)).length === 0;
	} catch {
		return false;
	}
};
const isValidThemeDefinition = (value) => {
	try {
		if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
		const definition = value;
		if (definition.version !== 1 || typeof definition.name !== "string" || typeof definition.modes !== "object" || definition.modes === null) return false;
		return validateThemeDefinition(definition).length === 0;
	} catch {
		return false;
	}
};
const readStorage = (key) => {
	if (typeof window === "undefined") return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};
const writeStorage = (key, value) => {
	if (typeof window === "undefined") return;
	try {
		if (value === void 0) {
			localStorage.removeItem(key);
			return;
		}
		localStorage.setItem(key, value);
	} catch {}
};
const getInitialTheme$1 = () => {
	const stored = readStorage(THEME_KEY);
	return stored && isAppearanceMode(stored) ? stored : "system";
};
const getStoredThemeState = () => {
	let legacyColors;
	const storedSource = readStorage(THEME_SOURCE_KEY);
	const storedColors = readStorage(THEME_COLORS_KEY);
	if (storedColors) try {
		const parsed = JSON.parse(storedColors);
		if (isValidThemeColors(parsed)) legacyColors = fromLegacyTheme(parsed).modes.light?.colors;
	} catch {}
	const storedDefinition = readStorage(THEME_DEFINITION_KEY);
	if (storedDefinition) try {
		const parsed = JSON.parse(storedDefinition);
		if (isValidThemeDefinition(parsed)) return {
			definition: parsed,
			legacyColors: storedSource === "legacy" ? parsed.modes.light?.colors : void 0
		};
	} catch {}
	if (!legacyColors) return {};
	return {
		definition: fromLegacyTheme(legacyColors, readStorage(THEME_NAME_KEY) ?? "custom"),
		legacyColors
	};
};
const getInitialThemeName = () => readStorage(THEME_NAME_KEY) ?? void 0;
const captureThemeDOM = (root) => ({
	properties: new Map(themeOwnedProperties.map((property) => [property, {
		value: root.style.getPropertyValue(property),
		priority: root.style.getPropertyPriority(property)
	}])),
	colorScheme: {
		value: root.style.getPropertyValue("color-scheme"),
		priority: root.style.getPropertyPriority("color-scheme")
	},
	dataTheme: root.getAttribute("data-theme")
});
const restoreThemeDOM = (snapshot, root) => {
	snapshot.properties.forEach(({ value, priority }, property) => {
		if (!value) {
			root.style.removeProperty(property);
			return;
		}
		root.style.setProperty(property, value, priority);
	});
	if (snapshot.colorScheme.value) root.style.setProperty("color-scheme", snapshot.colorScheme.value, snapshot.colorScheme.priority);
	else root.style.removeProperty("color-scheme");
	if (snapshot.dataTheme === null) root.removeAttribute("data-theme");
	else root.setAttribute("data-theme", snapshot.dataTheme);
};
function ThemeProvider({ children, themeRGB: propThemeRGB, themeDefinition: propThemeDefinition, persistThemeDefinition = true, themeName: propThemeName, initialTheme }) {
	const initialThemeState = useRef(void 0);
	if (!initialThemeState.current) if (propThemeDefinition && isValidThemeDefinition(propThemeDefinition)) initialThemeState.current = { definition: propThemeDefinition };
	else if (!propThemeDefinition && propThemeRGB) {
		const definition = fromLegacyTheme(propThemeRGB, propThemeName);
		initialThemeState.current = {
			definition,
			legacyColors: definition.modes.light?.colors
		};
	} else {
		const storedThemeState = getStoredThemeState();
		initialThemeState.current = propThemeName !== void 0 && storedThemeState.definition ? {
			...storedThemeState,
			definition: {
				...storedThemeState.definition,
				name: propThemeName.trim() || "custom"
			}
		} : storedThemeState;
	}
	const initialAppearance = initialTheme && isAppearanceMode(initialTheme) ? initialTheme : getInitialTheme$1();
	const [theme, setThemeState] = useState(initialAppearance);
	/**
	* Seeded from the mode string alone, never from a media query, so a server
	* render and the first client render agree. `system` therefore starts at the
	* light palette with no contrast override on both sides, and `applyThemeMode`
	* publishes the OS-resolved values in its effect, after hydration.
	*/
	const [resolvedMode, setResolvedMode] = useState(initialAppearance !== "system" && isDark(initialAppearance) ? "dark" : "light");
	const [highContrast, setHighContrast] = useState(isHighContrast(initialAppearance));
	const [themeDefinition, setThemeDefinitionState] = useState(initialThemeState.current.definition);
	const [legacyThemeRGB, setLegacyThemeRGB] = useState(initialThemeState.current.legacyColors);
	const legacyThemeRGBRef = useRef(legacyThemeRGB);
	legacyThemeRGBRef.current = legacyThemeRGB;
	const themeDefinitionRef = useRef(themeDefinition);
	themeDefinitionRef.current = themeDefinition;
	const [themeName, setThemeNameState] = useState(themeDefinition?.name ?? propThemeName ?? getInitialThemeName);
	const themeNameRef = useRef(themeName);
	themeNameRef.current = themeName;
	const persistedInitialProps = useRef(false);
	const previousThemeProps = useRef({
		initialTheme,
		themeDefinition: propThemeDefinition,
		themeName: propThemeName,
		themeRGB: propThemeRGB
	});
	const controlledThemeActive = useRef(Boolean(propThemeDefinition && isValidThemeDefinition(propThemeDefinition) || !propThemeDefinition && propThemeRGB));
	const synchronizedThemeProps = useRef(false);
	const themeDOMSnapshot = useRef(void 0);
	const themeClassSnapshot = useRef(void 0);
	const writeThemeStorage = useCallback((key, value) => {
		if (!persistThemeDefinition) return;
		writeStorage(key, value);
	}, [persistThemeDefinition]);
	const restoreAppliedTheme = useCallback((root = window.document.documentElement) => {
		if (!themeDOMSnapshot.current) return;
		restoreThemeDOM(themeDOMSnapshot.current, root);
		themeDOMSnapshot.current = void 0;
	}, []);
	const prepareThemeDOM = useCallback((root) => {
		if (!themeDOMSnapshot.current) {
			themeDOMSnapshot.current = captureThemeDOM(root);
			return;
		}
		restoreThemeDOM(themeDOMSnapshot.current, root);
	}, []);
	useEffect(() => {
		if (persistedInitialProps.current) return;
		persistedInitialProps.current = true;
		if (initialTheme && isAppearanceMode(initialTheme)) writeStorage(THEME_KEY, initialTheme);
		const validPropDefinition = propThemeDefinition && isValidThemeDefinition(propThemeDefinition) ? propThemeDefinition : void 0;
		if (propThemeDefinition && !validPropDefinition) return;
		const legacyDefinition = !propThemeDefinition && propThemeRGB ? fromLegacyTheme(propThemeRGB, propThemeName) : void 0;
		const definition = validPropDefinition ?? legacyDefinition;
		if (!definition) {
			if (propThemeName !== void 0 && themeDefinition) {
				writeThemeStorage(THEME_DEFINITION_KEY, JSON.stringify(themeDefinition));
				writeThemeStorage(THEME_NAME_KEY, themeDefinition.name);
				writeThemeStorage(THEME_SOURCE_KEY, legacyThemeRGB ? "legacy" : "definition");
			} else if (propThemeName && !themeDefinition) writeThemeStorage(THEME_NAME_KEY, propThemeName);
			return;
		}
		writeThemeStorage(THEME_DEFINITION_KEY, JSON.stringify(definition));
		writeThemeStorage(THEME_NAME_KEY, definition.name);
		writeThemeStorage(THEME_SOURCE_KEY, legacyDefinition ? "legacy" : "definition");
		writeThemeStorage(THEME_COLORS_KEY, !propThemeDefinition && legacyDefinition ? JSON.stringify(legacyDefinition.modes.light?.colors ?? {}) : void 0);
	}, [
		initialTheme,
		legacyThemeRGB,
		propThemeDefinition,
		propThemeName,
		propThemeRGB,
		themeDefinition,
		writeThemeStorage
	]);
	const setTheme = useCallback((newTheme) => {
		if (!isAppearanceMode(newTheme)) return;
		setThemeState(newTheme);
		writeStorage(THEME_KEY, newTheme);
	}, []);
	const setThemeDefinition = useCallback((definition) => {
		const errors = definition ? validateThemeDefinition(definition) : [];
		if (errors.length > 0) throw new TypeError(errors.join("\n"));
		themeDefinitionRef.current = definition;
		setThemeDefinitionState(definition);
		legacyThemeRGBRef.current = void 0;
		setLegacyThemeRGB(void 0);
		writeThemeStorage(THEME_DEFINITION_KEY, definition ? JSON.stringify(definition) : void 0);
		writeThemeStorage(THEME_COLORS_KEY);
		writeThemeStorage(THEME_SOURCE_KEY, definition ? "definition" : void 0);
		setThemeNameState(definition?.name);
		themeNameRef.current = definition?.name;
		writeThemeStorage(THEME_NAME_KEY, definition?.name);
	}, [writeThemeStorage]);
	const setThemeRGB = useCallback((colors) => {
		const definition = colors ? fromLegacyTheme(colors, themeDefinitionRef.current?.name ?? themeNameRef.current) : void 0;
		const legacyColors = definition?.modes.light?.colors;
		themeDefinitionRef.current = definition;
		setThemeDefinitionState(definition);
		legacyThemeRGBRef.current = legacyColors;
		setLegacyThemeRGB(legacyColors);
		setThemeNameState(definition?.name);
		themeNameRef.current = definition?.name;
		writeThemeStorage(THEME_DEFINITION_KEY, definition ? JSON.stringify(definition) : void 0);
		writeThemeStorage(THEME_NAME_KEY, definition?.name);
		writeThemeStorage(THEME_COLORS_KEY, legacyColors ? JSON.stringify(legacyColors) : void 0);
		writeThemeStorage(THEME_SOURCE_KEY, definition ? "legacy" : void 0);
	}, [writeThemeStorage]);
	const setThemeName = useCallback((name) => {
		const currentDefinition = themeDefinitionRef.current;
		const nextName = name?.trim() || (currentDefinition ? "custom" : void 0);
		setThemeNameState(nextName);
		themeNameRef.current = nextName;
		writeThemeStorage(THEME_NAME_KEY, nextName);
		if (!nextName || !currentDefinition) return;
		const renamedDefinition = {
			...currentDefinition,
			name: nextName
		};
		themeDefinitionRef.current = renamedDefinition;
		setThemeDefinitionState(renamedDefinition);
		writeThemeStorage(THEME_DEFINITION_KEY, JSON.stringify(renamedDefinition));
		writeThemeStorage(THEME_SOURCE_KEY, legacyThemeRGBRef.current ? "legacy" : "definition");
	}, [writeThemeStorage]);
	useEffect(() => {
		if (!synchronizedThemeProps.current) {
			synchronizedThemeProps.current = true;
			return;
		}
		const previous = previousThemeProps.current;
		const definitionChanged = propThemeDefinition !== previous.themeDefinition;
		const legacyColorsChanged = propThemeRGB !== previous.themeRGB;
		const switchedToLegacyColors = definitionChanged && !propThemeDefinition && propThemeRGB !== void 0;
		let clearedControlledDefinition = false;
		if (definitionChanged || legacyColorsChanged) {
			if (propThemeDefinition) {
				if (isValidThemeDefinition(propThemeDefinition)) {
					setThemeDefinition(propThemeDefinition);
					controlledThemeActive.current = true;
				}
			} else if (propThemeRGB) {
				setThemeRGB(propThemeRGB);
				controlledThemeActive.current = true;
			} else if (controlledThemeActive.current) {
				setThemeDefinition(void 0);
				controlledThemeActive.current = false;
				clearedControlledDefinition = true;
			}
		}
		if (!propThemeDefinition && (propThemeName !== previous.themeName || switchedToLegacyColors || clearedControlledDefinition)) setThemeName(propThemeName);
		if (initialTheme !== previous.initialTheme && initialTheme && isAppearanceMode(initialTheme)) setTheme(initialTheme);
		previousThemeProps.current = {
			initialTheme,
			themeDefinition: propThemeDefinition,
			themeName: propThemeName,
			themeRGB: propThemeRGB
		};
	}, [
		initialTheme,
		propThemeDefinition,
		propThemeName,
		propThemeRGB,
		setTheme,
		setThemeDefinition,
		setThemeName,
		setThemeRGB
	]);
	const applyThemeMode = useCallback((currentTheme) => {
		const root = window.document.documentElement;
		const mode = isDark(currentTheme) ? "dark" : "light";
		const highContrast = resolvesToHighContrast(currentTheme);
		/** Publish both so consumers rerender when an OS preference flips under
		*  `system`, where `theme` itself never changes. */
		setResolvedMode(mode);
		setHighContrast(highContrast);
		if (!themeClassSnapshot.current) themeClassSnapshot.current = {
			dark: root.classList.contains("dark"),
			light: root.classList.contains("light"),
			highContrast: root.classList.contains(HIGH_CONTRAST_CLASS)
		};
		root.classList.toggle("dark", mode === "dark");
		root.classList.toggle("light", mode === "light");
		root.classList.toggle(HIGH_CONTRAST_CLASS, highContrast);
		/** A contrast mode is an accessibility need, so it outranks both a
		*  deployment's custom definition and the legacy RGB colors. */
		const definition = highContrast ? highContrastTheme : themeDefinition;
		if (!definition) {
			restoreAppliedTheme(root);
			return;
		}
		prepareThemeDOM(root);
		if (highContrast) root.style.setProperty("color-scheme", mode);
		if (!highContrast && legacyThemeRGB) {
			applyTheme(legacyThemeRGB, root, mode === "dark" ? darkTheme : defaultTheme);
			root.dataset.theme = definition.name;
			return;
		}
		try {
			applyResolvedTheme(resolveTheme(definition, mode), root);
		} catch (error) {
			restoreAppliedTheme(root);
			console.error("Unable to apply theme definition", error);
		}
	}, [
		legacyThemeRGB,
		prepareThemeDOM,
		restoreAppliedTheme,
		themeDefinition
	]);
	useEffect(() => {
		applyThemeMode(theme);
	}, [applyThemeMode, theme]);
	useEffect(() => {
		if (theme !== "system") return;
		/** `system` tracks both OS preferences it resolves against, when the host
		*  provides matchMedia at all. */
		if (typeof window.matchMedia !== "function") return;
		const queries = [window.matchMedia("(prefers-color-scheme: dark)"), ...CONTRAST_QUERIES.map((query) => window.matchMedia(query))];
		const handleChange = () => applyThemeMode("system");
		queries.forEach((query) => query.addEventListener("change", handleChange));
		return () => queries.forEach((query) => query.removeEventListener("change", handleChange));
	}, [applyThemeMode, theme]);
	useEffect(() => () => {
		const root = window.document.documentElement;
		restoreAppliedTheme(root);
		if (themeClassSnapshot.current) {
			root.classList.toggle("dark", themeClassSnapshot.current.dark);
			root.classList.toggle("light", themeClassSnapshot.current.light);
			root.classList.toggle(HIGH_CONTRAST_CLASS, themeClassSnapshot.current.highContrast);
			themeClassSnapshot.current = void 0;
		}
	}, [restoreAppliedTheme]);
	const resetTheme = useCallback(() => {
		setTheme("system");
		setThemeDefinition(void 0);
		writeThemeStorage(THEME_COLORS_KEY);
		restoreAppliedTheme();
	}, [
		restoreAppliedTheme,
		setTheme,
		setThemeDefinition,
		writeThemeStorage
	]);
	const themeRGB = legacyThemeRGB ?? themeDefinition?.modes.light?.colors;
	const value = useMemo(() => ({
		theme,
		setTheme,
		resolvedMode,
		highContrast,
		themeRGB,
		setThemeRGB,
		themeDefinition,
		setThemeDefinition,
		themeName,
		setThemeName,
		resetTheme
	}), [
		resetTheme,
		setTheme,
		setThemeDefinition,
		setThemeName,
		setThemeRGB,
		resolvedMode,
		highContrast,
		theme,
		themeDefinition,
		themeName,
		themeRGB
	]);
	return /* @__PURE__ */ jsx(ThemeContext.Provider, {
		value,
		children
	});
}
function useTheme() {
	return useContext(ThemeContext);
}
//#endregion
//#region src/theme/atoms/themeAtoms.ts
/**
* @deprecated Use ThemeContext instead. This atom is no longer used internally.
*/
const themeModeAtom = atomWithStorage("color-theme", "system", void 0, { getOnInit: true });
/**
* @deprecated Use ThemeContext instead. This atom is no longer used internally.
*/
const themeColorsAtom = atomWithStorage("theme-colors", void 0, void 0, { getOnInit: true });
/**
* @deprecated Use ThemeContext instead. This atom is no longer used internally.
*/
const themeNameAtom = atomWithStorage("theme-name", void 0, void 0, { getOnInit: true });
//#endregion
//#region src/components/ThemeSelector.tsx
/** Ctrl+Shift+T auto-repeats while held, which is what this throttle is for.
*  Keyed per control, because the scheme and contrast toggles are independent
*  settings: going from plain light to high-contrast dark is one flip of each,
*  and a shared window would silently swallow the second click. */
const CHANGE_THROTTLE_MS = 500;
/** Each control shows what it controls: the scheme toggle shows the scheme it
*  is currently on, and the contrast toggle below owns the `Contrast` glyph. */
const themeIcons = {
	system: Monitor,
	dark: Moon,
	light: Sun,
	"high-contrast-light": Sun,
	"high-contrast-dark": Moon
};
const Theme = ({ theme, highContrast, onChange }) => {
	const localize = useLocalize();
	const nextScheme = isDark(theme) ? "light" : "dark";
	/** The toggle flips the colour scheme without discarding a contrast choice.
	*  Resolved contrast rather than `isHighContrast(theme)`: under `system` the
	*  contrast comes from `prefers-contrast`, which the stored mode never names,
	*  so keying off the mode alone would silently drop an OS-requested need. */
	const nextTheme = highContrast ? `high-contrast-${nextScheme}` : nextScheme;
	useEffect(() => {
		const handleKeyPress = (e) => {
			if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
				e.preventDefault();
				onChange(nextTheme);
			}
		};
		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [nextTheme, onChange]);
	return /* @__PURE__ */ jsx(Button, {
		variant: "ghost",
		size: "icon",
		className: "h-auto w-auto p-2 text-text-primary",
		"aria-label": localize("com_ui_toggle_theme"),
		"aria-keyshortcuts": "Ctrl+Shift+T",
		onClick: (e) => {
			e.preventDefault();
			onChange(nextTheme);
		},
		children: /* @__PURE__ */ jsx(MorphIcon, {
			icon: themeIcons[theme],
			size: 24
		})
	});
};
/**
* Contrast toggle, rendered beside the scheme toggle. On the login,
* registration and email-verification routes this selector is the only
* appearance control, and the scheme toggle above preserves a contrast choice
* but can never introduce one — the full appearance dropdown lives behind auth.
* Without this button a logged-out user who needs the high contrast palette
* could reach it only by editing local storage or turning on an OS-wide
* preference.
*/
const ContrastToggle = ({ theme, highContrast, onChange }) => {
	const localize = useLocalize();
	const scheme = isDark(theme) ? "dark" : "light";
	/** Turning contrast off lands on the plain mode for the scheme currently
	*  rendered, so `system` under an OS contrast request becomes an explicit
	*  opt-out rather than silently snapping back on. */
	const nextTheme = highContrast ? scheme : `high-contrast-${scheme}`;
	return /* @__PURE__ */ jsx(Button, {
		variant: "ghost",
		size: "icon",
		className: "h-auto w-auto p-2 text-text-primary",
		"aria-label": localize("com_ui_toggle_high_contrast"),
		"aria-pressed": highContrast,
		onClick: (e) => {
			e.preventDefault();
			onChange(nextTheme);
		},
		children: /* @__PURE__ */ jsx(MorphIcon, {
			icon: Contrast,
			size: 24
		})
	});
};
const ThemeSelector = ({ returnThemeOnly }) => {
	const { theme, highContrast, setTheme } = useContext(ThemeContext);
	const [announcement, setAnnouncement] = useState("");
	const localize = useLocalize();
	const changeTheme = useCallback((value, control) => {
		const now = Date.now();
		const changes = window.lastThemeChange ?? {};
		const last = changes[control];
		if (typeof last === "number" && now - last < CHANGE_THROTTLE_MS) return;
		window.lastThemeChange = {
			...changes,
			[control]: now
		};
		setTheme(value);
		if (isHighContrast(value)) {
			setAnnouncement(isDark(value) ? localize("com_ui_high_contrast_dark_theme_enabled") : localize("com_ui_high_contrast_light_theme_enabled"));
			return;
		}
		setAnnouncement(isDark(value) ? localize("com_ui_dark_theme_enabled") : localize("com_ui_light_theme_enabled"));
	}, [setTheme, localize]);
	const changeScheme = useCallback((value) => changeTheme(value, "scheme"), [changeTheme]);
	const changeContrast = useCallback((value) => changeTheme(value, "contrast"), [changeTheme]);
	useEffect(() => {
		if (announcement) {
			const timeout = setTimeout(() => setAnnouncement(""), 1e3);
			return () => clearTimeout(timeout);
		}
	}, [announcement]);
	if (returnThemeOnly === true) return /* @__PURE__ */ jsx(Theme, {
		theme,
		highContrast,
		onChange: changeScheme
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col items-center justify-center bg-surface-primary pt-6 sm:pt-0",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "absolute bottom-0 left-0 m-4 flex items-center",
			children: [/* @__PURE__ */ jsx(Theme, {
				theme,
				highContrast,
				onChange: changeScheme
			}), /* @__PURE__ */ jsx(ContrastToggle, {
				theme,
				highContrast,
				onChange: changeContrast
			})]
		}), /* @__PURE__ */ jsx("div", {
			role: "alert",
			"aria-live": "assertive",
			"aria-atomic": "true",
			className: "sr-only",
			children: announcement
		})]
	});
};
//#endregion
//#region src/components/InfoHoverCard.tsx
const InfoHoverCard = ({ side, text, icon = "help", children }) => {
	const [isOpen, setIsOpen] = useState(false);
	return /* @__PURE__ */ jsxs(HoverCard, {
		openDelay: 50,
		open: isOpen,
		onOpenChange: setIsOpen,
		children: [/* @__PURE__ */ jsx(HoverCardTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "inline-flex cursor-help items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2",
				onFocus: () => setIsOpen(true),
				onBlur: () => setIsOpen(false),
				"aria-label": text,
				children: children ?? /* @__PURE__ */ jsx(icon === "info" ? InfoIcon : CircleHelpIcon$1, {
					className: "h-5 w-5 text-text-tertiary",
					"aria-hidden": "true"
				})
			})
		}), /* @__PURE__ */ jsx(HoverCardPortal, { children: /* @__PURE__ */ jsx(HoverCardContent, {
			side,
			className: "z-[999] w-80",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-h-[80vh] space-y-2 overflow-y-auto",
				children: /* @__PURE__ */ jsx("span", {
					className: "text-sm text-text-secondary",
					children: text
				})
			})
		}) })]
	});
};
//#endregion
//#region src/components/CheckboxButton.tsx
const CheckboxButton = React$1.forwardRef(({ icon, label, setValue, className, checked, defaultChecked, isCheckedClassName }, ref) => {
	const checkbox = useCheckboxStore();
	const isChecked = useStoreState(checkbox, (state) => state?.value);
	const onChange = (e) => {
		e.stopPropagation();
		if (typeof isChecked !== "boolean") return;
		setValue?.({
			e,
			value: !isChecked
		});
	};
	useEffect(() => {
		if (checked !== void 0) checkbox.setValue(checked);
	}, [checked, checkbox]);
	useEffect(() => {
		if (defaultChecked !== void 0 && checked === void 0) checkbox.setValue(defaultChecked);
	}, [
		defaultChecked,
		checked,
		checkbox
	]);
	return /* @__PURE__ */ jsxs(Checkbox$1, {
		ref,
		store: checkbox,
		onChange,
		className: cn(composerControlClasses(), "w-theme-control max-w-fit p-theme-compact md:w-full md:px-theme-normal", isChecked && isCheckedClassName && isCheckedClassName, className),
		render: /* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": label
		}),
		children: [icon && /* @__PURE__ */ jsx("span", {
			className: "icon-md text-text-primary",
			children: icon
		}), /* @__PURE__ */ jsx("span", {
			className: "hidden truncate md:block",
			children: label
		})]
	});
});
CheckboxButton.displayName = "CheckboxButton";
//#endregion
//#region src/components/DialogTemplate.tsx
const DialogTemplate = forwardRef((props, ref) => {
	const { title, description, main, buttons, leftButtons, selection, className, headerClassName, footerClassName, showCloseButton, showCancelButton = true } = props;
	const { selectHandler, selectClasses, selectText } = selection || {};
	return /* @__PURE__ */ jsxs(DialogContent, {
		showCloseButton,
		ref,
		className: cn("bg-surface-dialog shadow-2xl high-contrast:border high-contrast:border-solid high-contrast:border-border-medium high-contrast:shadow-none", className || ""),
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ jsxs(DialogHeader, {
				className: cn(headerClassName ?? ""),
				children: [/* @__PURE__ */ jsx(DialogTitle, {
					className: "text-lg font-medium leading-6 text-text-primary",
					children: title
				}), description && /* @__PURE__ */ jsx(DialogDescription, {
					className: "text-text-secondary",
					children: description
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "px-6",
				children: main ? main : null
			}),
			/* @__PURE__ */ jsxs(DialogFooter, {
				className: footerClassName,
				children: [/* @__PURE__ */ jsx("div", { children: leftButtons ? leftButtons : null }), /* @__PURE__ */ jsxs("div", {
					className: "flex h-auto gap-3",
					children: [
						showCancelButton && /* @__PURE__ */ jsx(DialogClose, {
							className: "border-border-light hover:bg-surface-hover",
							children: "cancel"
						}),
						buttons ? buttons : null,
						selection ? /* @__PURE__ */ jsx(DialogClose, {
							onClick: selectHandler,
							className: `${selectClasses || "bg-surface-inverted text-text-inverted transition-colors hover:bg-surface-inverted-hover disabled:cursor-not-allowed disabled:opacity-50"} inline-flex h-10 items-center justify-center rounded-lg border-none px-4 py-2 text-sm`,
							children: selectText
						}) : null
					]
				})]
			})
		]
	});
});
//#endregion
//#region src/components/SelectDropDown.tsx
function getOptionText(option) {
	if (typeof option === "string") return option;
	if ("label" in option) return option.label ?? "";
	if ("value" in option) return (option.value ?? "") + "";
	return "";
}
function SelectDropDown({ title: _title, value, disabled, setValue, availableValues, showAbove = false, showLabel = true, emptyTitle = false, iconSide = "right", optionIconSide = "left", placeholder, containerClassName, optionsListClass, optionsClass, currentValueClass, subContainerClassName, className, renderOption, searchClassName, searchPlaceholder, showOptionIcon = false }) {
	const transitionProps = { className: "top-full mt-3" };
	if (showAbove) transitionProps.className = "bottom-full mb-3";
	let title = _title;
	if (emptyTitle) title = "";
	const values = availableValues ?? [];
	const [filteredValues, searchRender] = useMultiSearch({
		availableOptions: values,
		placeholder: searchPlaceholder,
		getTextKeyOverride: (option) => getOptionText(option).toUpperCase(),
		className: searchClassName,
		disabled
	});
	const options = searchRender != null ? filteredValues : values;
	const renderIcon = showOptionIcon && value != null && value.icon != null;
	const buttonRef = useRef(null);
	return /* @__PURE__ */ jsx("div", {
		className: cn("flex items-center justify-center gap-2", containerClassName ?? ""),
		children: /* @__PURE__ */ jsx("div", {
			className: cn("relative w-full", subContainerClassName ?? ""),
			children: /* @__PURE__ */ jsx(Listbox, {
				value,
				onChange: setValue,
				disabled,
				children: ({ open }) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs(ListboxButton, {
					ref: buttonRef,
					"data-testid": "select-dropdown-button",
					onKeyDown: (e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							if (!open && buttonRef.current) buttonRef.current.click();
						}
					},
					className: cn("relative flex w-full cursor-default flex-col rounded-md border border-border-light bg-surface-secondary py-2 pl-3 pr-10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 disabled:bg-surface-secondary sm:text-sm", className ?? ""),
					children: [
						showLabel && /* @__PURE__ */ jsx(Label$1, {
							className: "block text-xs text-text-secondary",
							id: "headlessui-listbox-label-:r1:",
							"data-headlessui-state": "",
							children: title
						}),
						/* @__PURE__ */ jsx("span", {
							className: "inline-flex w-full truncate",
							children: /* @__PURE__ */ jsxs("span", {
								className: cn("flex h-6 items-center gap-1 truncate text-sm text-text-primary", !showLabel ? "text-xs" : "", currentValueClass ?? ""),
								children: [
									!showLabel && !emptyTitle && /* @__PURE__ */ jsxs("span", {
										className: "text-xs text-text-secondary",
										children: [title, ":"]
									}),
									renderIcon && optionIconSide !== "right" && /* @__PURE__ */ jsx("span", {
										className: "icon-md flex items-center",
										children: value.icon
									}),
									renderIcon && /* @__PURE__ */ jsx("span", {
										className: "icon-md absolute right-0 mr-8 flex items-center",
										children: value.icon
									}),
									(() => {
										if (!value) return /* @__PURE__ */ jsx("span", {
											className: "text-text-secondary",
											children: placeholder
										});
										if (typeof value !== "string") return value.label ?? "";
										return value;
									})()
								]
							})
						}),
						/* @__PURE__ */ jsx("span", {
							className: "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2",
							children: /* @__PURE__ */ jsx("svg", {
								stroke: "currentColor",
								fill: "none",
								strokeWidth: "2",
								viewBox: "0 0 24 24",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								className: "h-4 w-4 text-text-tertiary",
								height: "1em",
								width: "1em",
								xmlns: "http://www.w3.org/2000/svg",
								style: showAbove ? { transform: "scaleY(-1)" } : {},
								children: /* @__PURE__ */ jsx("polyline", { points: "6 9 12 15 18 9" })
							})
						})
					]
				}), /* @__PURE__ */ jsx(Transition, {
					show: open,
					as: "div",
					leave: "transition ease-in duration-100",
					leaveFrom: "opacity-100",
					leaveTo: "opacity-0",
					...transitionProps,
					children: /* @__PURE__ */ jsxs(ListboxOptions, {
						className: cn("absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded border border-border-light bg-surface-secondary text-xs md:w-[100%]", optionsListClass ?? ""),
						children: [
							renderOption && /* @__PURE__ */ jsx(ListboxOption, {
								value: null,
								className: cn("group relative flex h-[42px] cursor-pointer select-none items-center overflow-hidden pl-3 pr-9 text-text-primary hover:bg-surface-hover", optionsClass ?? ""),
								children: renderOption()
							}, "listbox-render-option"),
							searchRender,
							options.map((option, i) => {
								if (!option) return null;
								const currentLabel = typeof option === "string" ? option : option.label ?? option.value ?? "";
								const currentValue = typeof option === "string" ? option : option.value ?? "";
								const currentIcon = typeof option === "string" ? null : option.icon ?? null;
								let activeValue = value;
								if (typeof activeValue !== "string") activeValue = activeValue?.value ?? "";
								return /* @__PURE__ */ jsx(ListboxOption, {
									value: option,
									className: ({ active }) => cn("group relative flex h-[42px] cursor-pointer select-none items-center overflow-hidden pl-3 pr-9 text-text-primary hover:bg-surface-hover", active ? "bg-surface-active text-text-primary" : "", optionsClass ?? ""),
									children: /* @__PURE__ */ jsxs("span", {
										className: "flex items-center gap-1.5 truncate",
										children: [/* @__PURE__ */ jsxs("span", {
											className: cn("flex h-6 items-center gap-1 text-text-primary", option === value ? "font-semibold" : "", iconSide === "left" ? "ml-4" : ""),
											children: [currentIcon != null && /* @__PURE__ */ jsx("span", {
												className: cn("mr-1", optionIconSide === "right" ? "absolute right-0 pr-2" : ""),
												children: currentIcon
											}), currentLabel]
										}), currentValue === activeValue && /* @__PURE__ */ jsx("span", {
											className: cn("absolute inset-y-0 flex items-center text-text-primary", iconSide === "left" ? "left-0 pl-2" : "right-0 pr-3"),
											children: /* @__PURE__ */ jsx(CheckMark, {})
										})]
									})
								}, i);
							})
						]
					})
				})] })
			})
		})
	});
}
//#endregion
//#region src/components/ControlCombobox.tsx
const ROW_HEIGHT = 36;
function ControlCombobox({ selectedValue, displayValue, items, setValue, onBlur, ariaLabel, ariaInvalid, ariaDescribedBy, searchPlaceholder, selectPlaceholder, containerClassName, isCollapsed, SelectIcon, showCarat, className, disabled, iconClassName, iconSide = "left", selectId, placement, popoverClassName, matchTriggerWidth = true, variant = "default", gutter = 4, portal = true, onOpenChange }) {
	const [searchValue, setSearchValue] = useState("");
	const buttonRef = useRef(null);
	const [buttonWidth, setButtonWidth] = useState(null);
	const popoverZIndex = usePopoverZIndex();
	const getItem = (option) => ({
		id: `item-${option.value}`,
		value: option.value,
		label: option.label,
		icon: option.icon
	});
	const combobox = Ariakit.useComboboxStore({
		defaultItems: items.map(getItem),
		resetValueOnHide: true,
		value: searchValue,
		setValue: setSearchValue
	});
	const select = Ariakit.useSelectStore({
		combobox,
		defaultItems: items.map(getItem),
		value: selectedValue,
		setValue,
		setOpen: onOpenChange,
		placement
	});
	const matches = useMemo(() => {
		return matchSorter(items, searchValue, {
			keys: ["value", "label"],
			baseSort: (a, b) => a.index < b.index ? -1 : 1
		}).map(getItem);
	}, [searchValue, items]);
	useEffect(() => {
		const button = buttonRef.current;
		if (!button || isCollapsed) return;
		setButtonWidth(button.offsetWidth);
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const width = entry.borderBoxSize?.[0]?.inlineSize ?? button.offsetWidth;
			if (width > 0) setButtonWidth(width);
		});
		observer.observe(button);
		return () => observer.disconnect();
	}, [isCollapsed]);
	const selectIconClassName = cn("flex h-5 w-5 items-center justify-center overflow-hidden rounded-full", iconClassName);
	const optionIconClassName = cn("mr-2 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full", iconClassName);
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex w-full items-center justify-center px-1", variant === "field" && "px-0", containerClassName),
		children: [
			/* @__PURE__ */ jsx(Ariakit.SelectLabel, {
				store: select,
				className: "sr-only",
				children: ariaLabel
			}),
			/* @__PURE__ */ jsxs(Ariakit.Select, {
				ref: buttonRef,
				store: select,
				id: selectId,
				disabled,
				onBlur,
				"aria-invalid": ariaInvalid || void 0,
				"aria-describedby": ariaDescribedBy,
				className: cn("flex items-center justify-center gap-2 rounded-full bg-surface-secondary", "text-text-primary hover:bg-surface-tertiary", "border border-border-light", isCollapsed ? "h-9 w-9" : "h-9 w-full rounded-xl px-3 py-2 text-sm", variant === "field" && cn(fieldControl, "justify-start hover:bg-surface-hover"), className),
				children: [SelectIcon != null && iconSide === "left" && /* @__PURE__ */ jsx("div", {
					className: selectIconClassName,
					children: SelectIcon
				}), !isCollapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx("span", {
						className: "flex-grow truncate text-left",
						title: (displayValue != null ? displayValue : selectedValue) || void 0,
						children: displayValue != null ? displayValue || selectPlaceholder : selectedValue || selectPlaceholder
					}),
					SelectIcon != null && iconSide === "right" && /* @__PURE__ */ jsx("div", {
						className: selectIconClassName,
						children: SelectIcon
					}),
					showCarat && /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 text-text-secondary" })
				] })]
			}),
			/* @__PURE__ */ jsxs(Ariakit.SelectPopover, {
				store: select,
				gutter,
				portal,
				className: cn("overflow-hidden rounded-xl border border-border-light bg-surface-secondary shadow-lg", popoverClassName ?? "animate-popover"),
				style: {
					zIndex: popoverZIndex,
					...matchTriggerWidth ? { width: isCollapsed ? "300px" : buttonWidth ?? "300px" } : { minWidth: "16rem" }
				},
				children: [/* @__PURE__ */ jsx("div", {
					className: "py-1.5",
					children: /* @__PURE__ */ jsxs("div", {
						className: "relative",
						children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary" }), /* @__PURE__ */ jsx(Ariakit.Combobox, {
							store: combobox,
							autoSelect: true,
							placeholder: searchPlaceholder,
							className: "w-full rounded-md bg-surface-secondary py-2 pl-9 pr-3 text-sm text-text-primary focus:outline-none"
						})]
					})
				}), /* @__PURE__ */ jsx("div", {
					className: "max-h-[300px] overflow-auto",
					children: /* @__PURE__ */ jsx(Ariakit.ComboboxList, {
						store: combobox,
						children: /* @__PURE__ */ jsx(SelectRenderer, {
							store: select,
							items: matches,
							itemSize: ROW_HEIGHT,
							overscan: 5,
							children: ({ value, icon, label, ...item }) => /* @__PURE__ */ jsxs(Ariakit.ComboboxItem, {
								...item,
								className: cn("flex w-full cursor-pointer items-center px-3 text-sm", "text-text-primary hover:bg-surface-tertiary", "data-[active-item]:bg-surface-tertiary"),
								render: /* @__PURE__ */ jsx(Ariakit.SelectItem, { value }),
								children: [
									icon != null && iconSide === "left" && /* @__PURE__ */ jsx("div", {
										className: optionIconClassName,
										children: icon
									}),
									/* @__PURE__ */ jsx("span", {
										className: "flex-grow truncate text-left",
										children: label
									}),
									icon != null && iconSide === "right" && /* @__PURE__ */ jsx("div", {
										className: optionIconClassName,
										children: icon
									})
								]
							}, item.id)
						})
					})
				})]
			})
		]
	});
}
const ControlComboboxMemo = memo(ControlCombobox);
//#endregion
//#region src/components/EmptyState.tsx
/**
* The panel empty state: a bordered card with a circular icon, a title and a line of
* explanation. Owned here because bookmarks, memories and schedules each render the
* same card, and three copies of one appearance means a theme or spacing change has
* to be made three times and will eventually be made twice.
*/
function EmptyState({ icon: Icon, title, description, action, className }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex flex-col items-center justify-center rounded-lg border border-border-light bg-transparent p-6 text-center", className),
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "mb-2 flex size-10 items-center justify-center rounded-full bg-surface-tertiary",
				children: /* @__PURE__ */ jsx(Icon, {
					className: "size-5 text-text-secondary",
					"aria-hidden": true
				})
			}),
			title != null && /* @__PURE__ */ jsx("p", {
				className: "text-sm font-medium text-text-primary",
				children: title
			}),
			description != null && /* @__PURE__ */ jsx("p", {
				className: cn(title == null ? "text-sm" : "mt-0.5 text-xs", "text-text-secondary"),
				children: description
			}),
			action != null && /* @__PURE__ */ jsx("div", {
				className: "mt-3",
				children: action
			})
		]
	});
}
//#endregion
//#region src/components/TimePicker.tsx
const HOURS_24 = Array.from({ length: 24 }, (_, value) => value);
const HOURS_12 = Array.from({ length: 12 }, (_, index) => index === 0 ? 12 : index);
const MINUTES = Array.from({ length: 60 }, (_, value) => value);
const pad = (value) => String(value).padStart(2, "0");
const formatTime = (hour, minute, locale, hour12) => new Intl.DateTimeFormat(locale, {
	hour: "numeric",
	minute: "2-digit",
	hour12
}).format(new Date(2e3, 0, 1, hour, minute));
/**
* One scrolling column of the picker. Radio semantics rather than a listbox of
* buttons: the options are mutually exclusive values, and a roving tabindex keeps
* the column a single tab stop that arrow keys move within, which is what a
* keyboard user expects from a set of 60 minutes.
*/
function TimeColumn({ label, values, selected, format, onSelect }) {
	const listRef = useRef(null);
	/** The value to centre on, frozen at mount. Centering runs once per open, not on
	*  every re-render: re-centering as the user clicks down a column would yank the
	*  row they just aimed at back to the middle. */
	const initialSelected = useRef(selected);
	/**
	* Opening on 9:00 must not strand the user at 00:00 in a 60-row list. In a layout
	* effect rather than a ref callback because React attaches descendant refs BEFORE
	* the parent's: from the button's callback `listRef` is still null on the mount
	* that matters, so the scroll never happened. Scrolled by hand rather than with
	* `scrollIntoView`, which also scrolls every scrollable ancestor and would shove
	* the surrounding dialog around the page.
	*/
	useLayoutEffect(() => {
		const list = listRef.current;
		const node = list?.querySelector(`[data-value="${initialSelected.current}"]`);
		if (list == null || node == null) return;
		list.scrollTop = node.offsetTop - (list.clientHeight - node.clientHeight) / 2;
	}, []);
	const focusValue = (value) => {
		const node = listRef.current?.querySelector(`[data-value="${value}"]`);
		node?.focus();
		node?.scrollIntoView?.({ block: "nearest" });
	};
	const handleKeyDown = (event, index) => {
		const target = {
			ArrowDown: index + 1,
			ArrowRight: index + 1,
			ArrowUp: index - 1,
			ArrowLeft: index - 1,
			Home: 0,
			End: values.length - 1
		}[event.key];
		if (target == null) return;
		event.preventDefault();
		const next = values[(target + values.length) % values.length];
		onSelect(next);
		focusValue(next);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-w-0 flex-1 flex-col",
		children: [/* @__PURE__ */ jsx("span", {
			className: "px-1 pb-1 text-xs font-medium text-text-secondary",
			children: label
		}), /* @__PURE__ */ jsx("div", {
			ref: listRef,
			role: "radiogroup",
			"aria-label": label,
			className: "relative max-h-52 overflow-y-auto rounded-lg border border-border-light p-1",
			children: values.map((value, index) => {
				const isSelected = value === selected;
				return /* @__PURE__ */ jsx("button", {
					type: "button",
					role: "radio",
					"data-value": value,
					"aria-checked": isSelected,
					tabIndex: isSelected ? 0 : -1,
					onClick: () => onSelect(value),
					onKeyDown: (event) => handleKeyDown(event, index),
					className: cn("w-full rounded-md px-2 py-1 text-center text-sm tabular-nums transition-colors", isSelected ? "bg-surface-active font-medium text-text-primary" : "text-text-secondary hover:bg-surface-hover"),
					children: format(value)
				}, value);
			})
		})]
	});
}
/**
* The trigger and popover surface both pickers share: a `fieldControl` button that
* reads as an Input beside one, and the same enter/exit motion as the other Radix
* primitives. Held in one place so a theme or interaction fix lands on both.
*/
function PickerShell({ id, labelledBy, className, display, contentClassName, children }) {
	const [open, setOpen] = useState(false);
	const valueId = `${useId()}value`;
	return /* @__PURE__ */ jsxs(Root, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(Trigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs("button", {
				id,
				type: "button",
				"aria-labelledby": labelledBy == null ? valueId : `${labelledBy} ${valueId}`,
				className: cn(fieldControl, "items-center justify-between gap-2 text-text-primary", "hover:bg-surface-hover radix-state-open:bg-surface-hover", className),
				children: [/* @__PURE__ */ jsx("span", {
					id: valueId,
					className: "tabular-nums",
					children: display
				}), /* @__PURE__ */ jsx(Clock, {
					className: "size-4 shrink-0 text-text-secondary",
					"aria-hidden": "true"
				})]
			})
		}), /* @__PURE__ */ jsx(Content, {
			side: "bottom",
			align: "start",
			sideOffset: 6,
			className: cn("z-[999] rounded-xl border border-border-light bg-surface-secondary p-2 shadow-lg outline-none", "origin-[--radix-popover-content-transform-origin]", "data-[state=open]:animate-in data-[state=closed]:animate-out", "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2", "motion-reduce:animate-none", contentClassName),
			children
		})]
	});
}
/**
* Hour, minute and (where the locale uses one) meridiem columns behind a single
* trigger. Replaces `<input type="time">`, whose rendering the browser owns and
* which cannot be brought in line with the rest of the form.
*/
function TimePicker({ hour, minute, onChange, labels, id, labelledBy, className, locale, hour12 }) {
	const isPm = hour >= 12;
	const displayHour = hour12 ? HOURS_12[hour % 12] : hour;
	const setHour = (value) => {
		if (!hour12) {
			onChange({
				hour: value,
				minute
			});
			return;
		}
		const base = value % 12;
		onChange({
			hour: isPm ? base + 12 : base,
			minute
		});
	};
	return /* @__PURE__ */ jsx(PickerShell, {
		id,
		labelledBy,
		className,
		display: formatTime(hour, minute, locale, hour12),
		contentClassName: "w-64",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex gap-2",
			children: [
				/* @__PURE__ */ jsx(TimeColumn, {
					label: labels.hour,
					values: hour12 ? HOURS_12 : HOURS_24,
					selected: displayHour,
					format: hour12 ? String : pad,
					onSelect: setHour
				}),
				/* @__PURE__ */ jsx(TimeColumn, {
					label: labels.minute,
					values: MINUTES,
					selected: minute,
					format: pad,
					onSelect: (value) => onChange({
						hour,
						minute: value
					})
				}),
				hour12 && /* @__PURE__ */ jsx(TimeColumn, {
					label: labels.meridiem,
					values: [0, 1],
					selected: isPm ? 1 : 0,
					format: (value) => value === 1 ? labels.pm : labels.am,
					onSelect: (value) => {
						const base = hour % 12;
						onChange({
							hour: value === 1 ? base + 12 : base,
							minute
						});
					}
				})
			]
		})
	});
}
/**
* A single minutes column behind the same trigger, so an hour-less cadence reads
* as the same picker with its other columns dropped rather than a different widget.
*/
function MinutePicker({ minute, onChange, label, id, labelledBy, className }) {
	return /* @__PURE__ */ jsx(PickerShell, {
		id,
		labelledBy,
		className,
		display: pad(minute),
		contentClassName: "w-36",
		children: /* @__PURE__ */ jsx(TimeColumn, {
			label,
			values: MINUTES,
			selected: minute,
			format: pad,
			onSelect: onChange
		})
	});
}
//#endregion
//#region src/components/OGDialogTemplate.tsx
/**
* Type guard to check if selection is a legacy SelectionProps object
*/
function isSelectionProps(selection) {
	return typeof selection === "object" && selection !== null && !isValidElement(selection) && ("selectHandler" in selection || "selectClasses" in selection || "selectText" in selection || "isLoading" in selection);
}
const OGDialogTemplate = forwardRef((props, ref) => {
	const localize = useLocalize();
	const { title, main, buttons, selection, className, leftButtons, description = "", mainClassName, headerClassName, footerClassName, showCloseButton = false, overlayClassName, showCancelButton = true } = props;
	const isLegacySelection = isSelectionProps(selection);
	const { selectHandler, selectClasses, selectText, isLoading } = (isLegacySelection ? selection : null) ?? {};
	const defaultSelect = "bg-surface-inverted text-text-inverted transition-colors hover:bg-surface-inverted-hover disabled:cursor-not-allowed disabled:opacity-50";
	let selectionContent = null;
	if (isLegacySelection) selectionContent = /* @__PURE__ */ jsx(DialogClose$1, {
		onClick: selectHandler,
		disabled: isLoading,
		className: `${selectClasses ?? defaultSelect} flex h-10 items-center justify-center rounded-lg border-none px-4 py-2 text-sm disabled:opacity-80 max-sm:order-first max-sm:w-full sm:order-none`,
		children: isLoading === true ? /* @__PURE__ */ jsx(Spinner, { className: "size-4 text-text-primary" }) : selectText
	});
	else if (selection) selectionContent = selection;
	return /* @__PURE__ */ jsxs(DialogContent$1, {
		overlayClassName,
		showCloseButton,
		ref,
		className: cn(
			/** `border-none` clears the default edge; the contrast variant has to
			*  restore the style as well as the width to survive it. */
			"w-11/12 border-none bg-surface-dialog text-text-primary high-contrast:border high-contrast:border-solid high-contrast:border-border-medium high-contrast:shadow-none",
			className ?? ""
		),
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ jsxs(DialogHeader$1, {
				className: cn(headerClassName ?? ""),
				children: [/* @__PURE__ */ jsx(DialogTitle$1, { children: title }), description && /* @__PURE__ */ jsx(DialogDescription$1, {
					className: "items-center justify-center",
					children: description
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: cn("px-0 py-2", mainClassName),
				children: main != null ? main : null
			}),
			/* @__PURE__ */ jsxs(DialogFooter$1, {
				className: footerClassName,
				children: [
					leftButtons != null ? /* @__PURE__ */ jsx("div", {
						className: "mr-auto flex flex-row gap-2",
						children: leftButtons
					}) : null,
					showCancelButton && /* @__PURE__ */ jsx(DialogClose$1, {
						asChild: true,
						children: /* @__PURE__ */ jsx(Button, {
							variant: "outline",
							"aria-label": localize("com_ui_cancel"),
							children: localize("com_ui_cancel")
						})
					}),
					buttons != null ? buttons : null,
					selectionContent
				]
			})
		]
	});
});
//#endregion
//#region src/components/InputWithDropDown.tsx
const InputWithDropdown = React$1.forwardRef(({ className, options, onSelect, ...props }, ref) => {
	const [isOpen, setIsOpen] = React$1.useState(false);
	const [inputValue, setInputValue] = React$1.useState(props.value || "");
	const [highlightedIndex, setHighlightedIndex] = React$1.useState(-1);
	const inputRef = React$1.useRef(null);
	const handleSelect = (value) => {
		setInputValue(value);
		setIsOpen(false);
		setHighlightedIndex(-1);
		if (onSelect) onSelect(value);
		if (props.onChange) props.onChange({ target: { value } });
	};
	const handleInputChange = (e) => {
		setInputValue(e.target.value);
		if (props.onChange) props.onChange(e);
	};
	const handleKeyDown = (e) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				if (!isOpen) setIsOpen(true);
				else setHighlightedIndex((prevIndex) => prevIndex < options.length - 1 ? prevIndex + 1 : prevIndex);
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prevIndex) => prevIndex > 0 ? prevIndex - 1 : 0);
				break;
			case "Enter":
				e.preventDefault();
				if (isOpen && highlightedIndex !== -1) handleSelect(options[highlightedIndex]);
				setIsOpen(false);
				break;
			case "Escape":
				setIsOpen(false);
				setHighlightedIndex(-1);
				break;
		}
	};
	React$1.useEffect(() => {
		const handleClickOutside = (event) => {
			if (inputRef.current && !inputRef.current.contains(event.target)) {
				setIsOpen(false);
				setHighlightedIndex(-1);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "relative",
		ref: inputRef,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "relative",
			children: [/* @__PURE__ */ jsx(Input, {
				...props,
				value: inputValue,
				onChange: handleInputChange,
				onKeyDown: handleKeyDown,
				"aria-haspopup": "listbox",
				"aria-controls": "dropdown-list",
				className: cn("bg-surface-secondary", className ?? ""),
				ref
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "absolute inset-y-0 right-0 flex items-center rounded-md px-2 text-text-tertiary hover:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring-primary",
				onClick: () => setIsOpen(!isOpen),
				"aria-label": isOpen ? "Close dropdown" : "Open dropdown",
				children: /* @__PURE__ */ jsx("svg", {
					className: "h-5 w-5",
					fill: "none",
					stroke: "currentColor",
					viewBox: "0 0 24 24",
					xmlns: "http://www.w3.org/2000/svg",
					children: /* @__PURE__ */ jsx("path", {
						strokeLinecap: "round",
						strokeLinejoin: "round",
						strokeWidth: 2,
						d: "M19 9l-7 7-7-7"
					})
				})
			})]
		}), isOpen && /* @__PURE__ */ jsx("ul", {
			id: "dropdown-list",
			role: "listbox",
			className: "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border-medium bg-surface-secondary shadow-lg focus:ring-1 focus:ring-inset focus:ring-ring-primary",
			children: options.map((option, index) => /* @__PURE__ */ jsx("li", {
				role: "option",
				"aria-selected": index === highlightedIndex,
				className: cn("cursor-pointer rounded-md px-3 py-2", "focus:bg-surface-tertiary focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring-primary", index === highlightedIndex ? "bg-surface-active text-text-primary" : "text-text-secondary hover:bg-surface-tertiary"),
				onClick: () => handleSelect(option),
				onKeyDown: (e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleSelect(option);
					}
				},
				tabIndex: 0,
				children: option
			}, index))
		})]
	});
});
InputWithDropdown.displayName = "InputWithDropdown";
//#endregion
//#region src/components/DataTable/DataTableComponents.tsx
const SelectionCheckbox = memo(({ checked, onChange, ariaLabel }) => /* @__PURE__ */ jsx("div", {
	className: "flex h-full w-8 items-center justify-center",
	onClick: (e) => e.stopPropagation(),
	onKeyDown: (e) => e.stopPropagation(),
	children: /* @__PURE__ */ jsx(Checkbox, {
		checked,
		onCheckedChange: onChange,
		"aria-label": ariaLabel
	})
}));
SelectionCheckbox.displayName = "SelectionCheckbox";
const TableRowComponent = ({ row, virtualIndex, style, selected }, ref) => {
	return /* @__PURE__ */ jsx(TableRow, {
		ref,
		"data-state": selected ? "selected" : void 0,
		"data-index": virtualIndex,
		className: "group border-0 hover:bg-transparent [&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg",
		style,
		children: row.getVisibleCells().map((cell) => {
			const meta = cell.column.columnDef.meta;
			const isDesktopOnly = meta?.desktopOnly;
			const isRowHeader = meta?.isRowHeader;
			const percent = meta?.width;
			let widthStyle;
			if (cell.column.id === "select") widthStyle = {
				width: "32px",
				maxWidth: "32px",
				minWidth: "32px"
			};
			else if (percent) widthStyle = {
				width: `${percent}%`,
				maxWidth: `${percent}%`,
				minWidth: `${percent}%`
			};
			return /* @__PURE__ */ jsx(isRowHeader ? TableRowHeader : TableCell, {
				className: cn("max-w-0 truncate px-3 py-1 text-sm transition-colors", "group-hover:bg-surface-secondary-alt group-data-[state=selected]:bg-surface-active", cell.column.id === "select" && "w-8 p-1", meta?.className, isDesktopOnly && "hidden md:table-cell"),
				style: widthStyle,
				children: flexRender(cell.column.columnDef.cell, cell.getContext())
			}, cell.id);
		})
	});
};
const MemoizedTableRow = memo(forwardRef(TableRowComponent), (prev, next) => prev.row.original === next.row.original && prev.selected === next.selected && prev.cellsVersion === next.cellsVersion);
const SkeletonRows = memo(({ count = 10, columns, rowHeight = 40 }) => /* @__PURE__ */ jsx(Fragment, { children: Array.from({ length: count }, (_, index) => /* @__PURE__ */ jsx(TableRow, {
	className: "border-0 hover:bg-transparent",
	style: { height: rowHeight },
	children: columns.map((column) => {
		const columnKey = String(column.id ?? ("accessorKey" in column && column.accessorKey) ?? "");
		const meta = column.meta;
		return /* @__PURE__ */ jsx(TableCell, {
			className: cn("px-3 py-1", meta?.className, meta?.desktopOnly && "hidden md:table-cell"),
			children: /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-full" })
		}, columnKey);
	})
}, `skeleton-${index}`)) }));
SkeletonRows.displayName = "SkeletonRows";
//#endregion
//#region src/components/DataTable/DataTable.hooks.ts
function useDebounced(value, delay) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return debounced;
}
const useOptimizedRowSelection = (initialSelection = {}) => {
	const [selection, setSelection] = useState(initialSelection);
	return [selection, setSelection];
};
//#endregion
//#region src/components/DataTable/DataTableSearch.tsx
const DataTableSearch = memo(({ value, onChange, placeholder, className, disabled = false }) => {
	const localize = useLocalize();
	const searchId = useId();
	const descriptionId = `${searchId}-description`;
	return /* @__PURE__ */ jsxs("div", {
		className: "relative flex-1",
		children: [
			/* @__PURE__ */ jsx("label", {
				htmlFor: searchId,
				className: "sr-only",
				children: localize("com_ui_search_table")
			}),
			/* @__PURE__ */ jsx(Search, {
				className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ jsx(Input, {
				id: searchId,
				value,
				onChange: (e) => {
					startTransition(() => onChange(e.target.value));
				},
				disabled,
				"aria-label": localize("com_ui_search_table"),
				"aria-describedby": descriptionId,
				placeholder: placeholder || localize("com_ui_search"),
				className: cn("h-11 rounded-none border-0 bg-transparent pl-9 text-sm placeholder:text-text-tertiary focus-visible:ring-inset", className)
			}),
			/* @__PURE__ */ jsx("span", {
				id: descriptionId,
				className: "sr-only",
				children: localize("com_ui_search_table_description")
			})
		]
	});
});
DataTableSearch.displayName = "DataTableSearch";
//#endregion
//#region src/components/DataTable/DataTable.tsx
const MAX_AUTO_FILL_ATTEMPTS = 3;
const isFailedFetchResult = (result) => typeof result === "object" && result !== null && result.isError === true;
function DataTable$1({ columns, data, getRowId: getRowIdProp, className = "", isLoading = false, isFetching = false, config, filterValue = "", onFilterChange, defaultSort = [], isFetchingNextPage = false, hasNextPage = false, fetchNextPage, sorting, onSortingChange, customActionsRenderer }) {
	const localize = useLocalize();
	const isSmallScreen = useMediaQuery("(max-width: 768px)");
	const tableContainerRef = useRef(null);
	const scrollTimeoutRef = useRef(null);
	const scrollRAFRef = useRef(null);
	const { selection: { enableRowSelection = true, showCheckboxes = true } = {}, search: { enableSearch = true, debounce: debounceDelay = 300 } = {}, skeleton: { count: skeletonCount = 10 } = {}, virtualization: { overscan = 10, minRows = 50, rowHeight = 40, fastOverscanMultiplier = 4 } = {} } = config || {};
	const virtualizationActive = data.length >= minRows;
	const [dynamicOverscan, setDynamicOverscan] = useState(overscan);
	const lastScrollTopRef = useRef(0);
	const lastScrollTimeRef = useRef(performance.now());
	const fastScrollTimeoutRef = useRef(null);
	const autoFillRowCountRef = useRef(-1);
	const cellsVersionRef = useRef(0);
	const renderedColumnsRef = useRef(columns);
	if (renderedColumnsRef.current !== columns) {
		renderedColumnsRef.current = columns;
		cellsVersionRef.current += 1;
	}
	const [autoFillAttempt, setAutoFillAttempt] = useState(0);
	useEffect(() => {
		setDynamicOverscan(overscan);
	}, [overscan]);
	useEffect(() => {
		return () => {
			if (fastScrollTimeoutRef.current) clearTimeout(fastScrollTimeoutRef.current);
		};
	}, []);
	const [columnVisibility, setColumnVisibility] = useState({});
	const [optimizedRowSelection, setOptimizedRowSelection] = useOptimizedRowSelection();
	const [searchTerm, setSearchTerm] = useState(filterValue);
	const [internalSorting, setInternalSorting] = useState(defaultSort);
	const selectedCount = Object.keys(optimizedRowSelection).length;
	const isAllSelected = useMemo(() => data.length > 0 && selectedCount === data.length, [data.length, selectedCount]);
	const isIndeterminate = selectedCount > 0 && !isAllSelected;
	const getRowId = useCallback((row, index) => getRowIdProp?.(row, index ?? 0) ?? String(row.id ?? row._id ?? `row-${index ?? 0}`), [getRowIdProp]);
	const selectedRows = useMemo(() => {
		if (Object.keys(optimizedRowSelection).length === 0) return [];
		const dataMap = new Map(data.map((item, index) => [getRowId(item, index), item]));
		return Object.keys(optimizedRowSelection).map((id) => dataMap.get(id)).filter(Boolean);
	}, [
		optimizedRowSelection,
		data,
		getRowId
	]);
	const cleanupTimers = useCallback(() => {
		if (scrollRAFRef.current) {
			cancelAnimationFrame(scrollRAFRef.current);
			scrollRAFRef.current = null;
		}
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
			scrollTimeoutRef.current = null;
		}
	}, []);
	const debouncedTerm = useDebounced(searchTerm, debounceDelay);
	const finalSorting = sorting ?? internalSorting;
	const sortKey = useMemo(() => finalSorting.map((sort) => `${sort.id}:${sort.desc ? "desc" : "asc"}`).join(","), [finalSorting]);
	const calculatedVisibility = useMemo(() => {
		const newVisibility = {};
		columns.forEach((col) => {
			if (!col.meta?.desktopOnly) return;
			const rawId = col.id ?? col.accessorKey;
			if ((typeof rawId === "string" || typeof rawId === "number") && String(rawId).length > 0) newVisibility[String(rawId)] = true;
			else logger.warn("DataTable: A desktopOnly column is missing id/accessorKey; cannot control header visibility automatically.", col);
		});
		return newVisibility;
	}, [isSmallScreen, columns]);
	useEffect(() => {
		setColumnVisibility((prev) => ({
			...prev,
			...calculatedVisibility
		}));
	}, [calculatedVisibility]);
	const hasWarnedAboutMissingIds = useRef(false);
	useEffect(() => {
		if (data.length > 0 && !getRowIdProp && !hasWarnedAboutMissingIds.current) {
			const missing = data.filter((item) => (item.id === null || item.id === void 0) && (item._id === null || item._id === void 0));
			if (missing.length > 0) {
				logger.warn(`DataTable Warning: ${missing.length} data rows are missing a unique "id" property. Using index as a fallback. This can lead to unexpected behavior with selection and sorting.`, {
					missingCount: missing.length,
					sample: missing.slice(0, 3)
				});
				hasWarnedAboutMissingIds.current = true;
			}
		}
	}, [data, getRowIdProp]);
	const tableColumns = useMemo(() => {
		if (!enableRowSelection || !showCheckboxes) return columns.map((col) => col);
		return [{
			id: "select",
			enableResizing: false,
			header: () => {
				const extraCheckboxProps = isIndeterminate ? { indeterminate: true } : {};
				return /* @__PURE__ */ jsx("div", {
					className: "flex h-full items-center justify-center",
					"aria-label": localize("com_ui_select_all"),
					children: /* @__PURE__ */ jsx(SelectionCheckbox, {
						checked: isAllSelected,
						onChange: (value) => {
							if (isAllSelected || !value) setOptimizedRowSelection({});
							else setOptimizedRowSelection(data.reduce((acc, item, index) => {
								acc[getRowId(item, index)] = true;
								return acc;
							}, {}));
						},
						ariaLabel: localize("com_ui_select_all"),
						...extraCheckboxProps
					})
				});
			},
			cell: ({ row }) => {
				const rowDescription = row.original.name ? `named ${row.original.name}` : `at position ${row.index + 1}`;
				return /* @__PURE__ */ jsx("div", {
					className: "flex h-full items-center justify-center",
					children: /* @__PURE__ */ jsx(SelectionCheckbox, {
						checked: row.getIsSelected(),
						onChange: (value) => row.toggleSelected(value),
						ariaLabel: localize(`com_ui_select_row`, { 0: rowDescription })
					})
				});
			},
			meta: { className: "max-w-[20px] flex-1" }
		}, ...columns.map((col) => col)];
	}, [
		columns,
		enableRowSelection,
		showCheckboxes,
		localize,
		data,
		getRowId,
		isAllSelected,
		isIndeterminate,
		setOptimizedRowSelection
	]);
	const table = useReactTable({
		data,
		columns: tableColumns,
		getRowId,
		getCoreRowModel: getCoreRowModel(),
		enableRowSelection,
		enableMultiRowSelection: true,
		manualSorting: true,
		manualFiltering: true,
		enableSortingRemoval: false,
		state: {
			sorting: finalSorting,
			columnVisibility,
			rowSelection: optimizedRowSelection
		},
		onSortingChange: onSortingChange ?? setInternalSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setOptimizedRowSelection
	});
	const getItemKey = useCallback((index) => getRowId(data[index], index), [data, getRowId]);
	const estimateSize = useCallback(() => rowHeight, [rowHeight]);
	const rowVirtualizer = useVirtualizer({
		enabled: virtualizationActive,
		count: data.length,
		getScrollElement: () => tableContainerRef.current,
		getItemKey,
		estimateSize,
		overscan: dynamicOverscan
	});
	const virtualRows = virtualizationActive ? rowVirtualizer.getVirtualItems() : [];
	const totalSize = virtualizationActive ? rowVirtualizer.getTotalSize() : 0;
	const paddingTop = virtualRows[0]?.start ?? 0;
	const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;
	const { rows } = table.getRowModel();
	const headerGroups = table.getHeaderGroups();
	const showSkeletons = isLoading || isFetching && !isFetchingNextPage;
	const shouldShowSearch = enableSearch && onFilterChange;
	const showToolbar = Boolean(shouldShowSearch || customActionsRenderer);
	let tableBodyContent;
	if (showSkeletons) tableBodyContent = /* @__PURE__ */ jsx(SkeletonRows, {
		count: skeletonCount,
		rowHeight,
		columns: tableColumns
	});
	else if (virtualizationActive) tableBodyContent = /* @__PURE__ */ jsxs(Fragment, { children: [
		paddingTop > 0 && /* @__PURE__ */ jsx(TableRow, {
			"aria-hidden": "true",
			children: /* @__PURE__ */ jsx(TableCell, {
				colSpan: tableColumns.length,
				style: {
					height: paddingTop,
					padding: 0,
					border: 0
				}
			})
		}),
		virtualRows.map((virtualRow) => {
			const row = rows[virtualRow.index];
			if (!row) return null;
			return /* @__PURE__ */ jsx(MemoizedTableRow, {
				row,
				virtualIndex: virtualRow.index,
				selected: row.getIsSelected(),
				cellsVersion: cellsVersionRef.current,
				style: { height: rowHeight }
			}, virtualRow.key);
		}),
		paddingBottom > 0 && /* @__PURE__ */ jsx(TableRow, {
			"aria-hidden": "true",
			children: /* @__PURE__ */ jsx(TableCell, {
				colSpan: tableColumns.length,
				style: {
					height: paddingBottom,
					padding: 0,
					border: 0
				}
			})
		})
	] });
	else tableBodyContent = rows.map((row) => /* @__PURE__ */ jsx(MemoizedTableRow, {
		row,
		virtualIndex: row.index,
		selected: row.getIsSelected(),
		cellsVersion: cellsVersionRef.current,
		style: { height: rowHeight }
	}, getRowId(row.original, row.index)));
	useEffect(() => {
		setSearchTerm(filterValue);
	}, [filterValue]);
	useEffect(() => {
		autoFillRowCountRef.current = -1;
		setAutoFillAttempt(0);
		if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
	}, [filterValue, sortKey]);
	useEffect(() => {
		if (debouncedTerm !== filterValue && onFilterChange) {
			onFilterChange(debouncedTerm);
			setOptimizedRowSelection({});
		}
	}, [
		debouncedTerm,
		filterValue,
		onFilterChange,
		setOptimizedRowSelection
	]);
	useEffect(() => {
		if (!virtualizationActive) return;
		rowVirtualizer.calculateRange();
	}, [
		data.length,
		finalSorting,
		columnVisibility,
		virtualizationActive,
		rowVirtualizer
	]);
	useEffect(() => {
		if (!virtualizationActive) return;
		const container = tableContainerRef.current;
		if (!container) return;
		const ro = new ResizeObserver(() => {
			rowVirtualizer.calculateRange();
		});
		ro.observe(container);
		return () => ro.disconnect();
	}, [virtualizationActive, rowVirtualizer]);
	const handleScroll = useCallback(() => {
		if (scrollRAFRef.current) cancelAnimationFrame(scrollRAFRef.current);
		scrollRAFRef.current = requestAnimationFrame(() => {
			const container = tableContainerRef.current;
			if (container) {
				const now = performance.now();
				const delta = Math.abs(container.scrollTop - lastScrollTopRef.current);
				const dt = now - lastScrollTimeRef.current;
				if (dt > 0) {
					if (delta / dt > 2 && virtualizationActive && dynamicOverscan === overscan) {
						if (fastScrollTimeoutRef.current) window.clearTimeout(fastScrollTimeoutRef.current);
						setDynamicOverscan(Math.min(overscan * fastOverscanMultiplier, overscan * 8));
						fastScrollTimeoutRef.current = window.setTimeout(() => {
							setDynamicOverscan((current) => current !== overscan ? overscan : current);
						}, 160);
					}
				}
				lastScrollTopRef.current = container.scrollTop;
				lastScrollTimeRef.current = now;
			}
			if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
			scrollTimeoutRef.current = window.setTimeout(() => {
				const loaderContainer = tableContainerRef.current;
				if (!loaderContainer || !fetchNextPage || !hasNextPage || isFetchingNextPage || isFetching) return;
				const { scrollTop, scrollHeight, clientHeight } = loaderContainer;
				if (scrollTop + clientHeight >= scrollHeight - 200) fetchNextPage().then((result) => {
					if (isFailedFetchResult(result)) logger.error("DataTable: Unable to fetch the next page", result.error);
				}).catch((error) => {
					logger.error("DataTable: Unable to fetch the next page", error);
				});
			}, 100);
			scrollRAFRef.current = null;
		});
	}, [
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		overscan,
		fastOverscanMultiplier,
		virtualizationActive,
		dynamicOverscan
	]);
	useEffect(() => {
		const scrollElement = tableContainerRef.current;
		if (!scrollElement) return;
		scrollElement.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			scrollElement.removeEventListener("scroll", handleScroll);
			cleanupTimers();
		};
	}, [handleScroll, cleanupTimers]);
	/**
	* Pagination is driven by the scroll handler, so a first page too short to
	* overflow a tall container would strand the table on page one. Keep pulling
	* pages until the rows overflow or the source runs dry; the row-count guard
	* stops the loop when a page adds nothing. A rejected fetch is retried, since
	* an unscrollable table offers no other way back, but only a bounded number of
	* times so a failing endpoint can't be hammered.
	*/
	useEffect(() => {
		const container = tableContainerRef.current;
		if (!container || !fetchNextPage || !hasNextPage || isFetchingNextPage || isLoading) return;
		if (isFetching) return;
		if (autoFillAttempt >= MAX_AUTO_FILL_ATTEMPTS) return;
		if (container.clientHeight === 0 || container.scrollHeight > container.clientHeight) return;
		if (autoFillRowCountRef.current === data.length) return;
		autoFillRowCountRef.current = data.length;
		const rearmAfterFailure = (error) => {
			logger.error("DataTable: Unable to fetch the next page", error);
			autoFillRowCountRef.current = -1;
			setAutoFillAttempt((attempt) => attempt + 1);
		};
		fetchNextPage().then((result) => {
			if (isFailedFetchResult(result)) rearmAfterFailure(result.error);
		}).catch(rearmAfterFailure);
	}, [
		data.length,
		sortKey,
		autoFillAttempt,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		isLoading
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: cn("relative flex w-full flex-col overflow-hidden", "max-h-[80vh]", className),
		role: "region",
		"aria-label": localize("com_ui_data_table"),
		children: [showToolbar && /* @__PURE__ */ jsxs("div", {
			className: "flex w-full shrink-0 items-center gap-2 border-b border-border-light pr-2 md:gap-3",
			children: [shouldShowSearch && /* @__PURE__ */ jsx(DataTableSearch, {
				value: searchTerm,
				onChange: setSearchTerm
			}), customActionsRenderer && customActionsRenderer({
				selectedCount,
				selectedRows,
				table
			})]
		}), /* @__PURE__ */ jsxs("div", {
			ref: tableContainerRef,
			className: "overflow-anchor-none relative flex min-h-0 flex-1 flex-col overflow-auto will-change-scroll",
			style: {
				WebkitOverflowScrolling: "touch",
				overscrollBehavior: "contain"
			},
			role: "region",
			"aria-label": localize("com_ui_data_table_scroll_area"),
			"aria-describedby": showSkeletons ? "loading-status" : void 0,
			children: [/* @__PURE__ */ jsxs(Table, {
				role: "table",
				"aria-label": localize("com_ui_data_table"),
				"aria-rowcount": data.length,
				className: "shrink-0 table-auto border-separate border-spacing-0",
				unwrapped: true,
				children: [/* @__PURE__ */ jsx(TableHeader, { children: headerGroups.map((headerGroup) => /* @__PURE__ */ jsx(TableRow, {
					className: "border-0 hover:bg-transparent",
					children: headerGroup.headers.map((header) => {
						const isDesktopOnly = header.column.columnDef.meta?.desktopOnly ?? false;
						if (!header.column.getIsVisible()) return null;
						const isSelectHeader = header.id === "select";
						const meta = header.column.columnDef.meta;
						const canSort = header.column.getCanSort();
						const metaWidth = header.column.columnDef.meta?.width;
						let widthStyle = {};
						if (isSelectHeader) widthStyle = {
							width: "32px",
							maxWidth: "32px",
							minWidth: "32px"
						};
						else if (metaWidth != null && metaWidth >= 1 && metaWidth <= 100) widthStyle = {
							width: `${metaWidth}%`,
							maxWidth: `${metaWidth}%`,
							minWidth: `${metaWidth}%`
						};
						const sortDirection = header.column.getIsSorted();
						let ariaSort;
						if (sortDirection === "asc") ariaSort = "ascending";
						else if (sortDirection === "desc") ariaSort = "descending";
						else if (canSort) ariaSort = "none";
						const renderedHeader = header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext());
						let headerContent;
						if (isSelectHeader) headerContent = renderedHeader;
						else if (canSort) headerContent = /* @__PURE__ */ jsxs(Button, {
							type: "button",
							variant: "ghost",
							className: "group h-auto w-full justify-start gap-1 px-0 py-0 text-xs font-medium uppercase tracking-wide text-text-secondary hover:bg-transparent hover:text-text-primary md:gap-1.5",
							onClick: header.column.getToggleSortingHandler(),
							children: [renderedHeader, /* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx(MorphIcon, {
									icon: {
										asc: ArrowUp,
										desc: ArrowDown
									}[header.column.getIsSorted()] ?? ArrowDownUp,
									className: cn("size-3.5", !sortDirection && "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100")
								})
							})]
						});
						else headerContent = /* @__PURE__ */ jsx("div", {
							className: "flex items-center text-xs font-medium uppercase tracking-wide text-text-secondary",
							children: renderedHeader
						});
						return /* @__PURE__ */ jsx(TableHead, {
							scope: "col",
							className: cn("sticky top-0 z-10 h-9 border-b border-border-light bg-surface-dialog px-3 py-2 md:px-4", isSelectHeader && "px-0 text-center", canSort && "cursor-pointer", meta?.className, header.column.getIsResizing() && "bg-surface-tertiary/60", isDesktopOnly && "hidden md:table-cell"),
							style: widthStyle,
							"aria-sort": ariaSort,
							children: headerContent
						}, header.id);
					})
				}, headerGroup.id)) }), /* @__PURE__ */ jsxs(TableBody, { children: [tableBodyContent, isFetchingNextPage && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
					colSpan: tableColumns.length,
					className: "p-4 text-center",
					id: "loading-status",
					role: "status",
					"aria-live": "polite",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-center gap-2",
						children: [/* @__PURE__ */ jsx(Spinner, {
							className: "h-5 w-5",
							"aria-hidden": "true"
						}), /* @__PURE__ */ jsx("span", {
							className: "sr-only",
							children: localize("com_ui_loading_more_data")
						})]
					})
				}) })] })]
			}), !isLoading && !showSkeletons && rows.length === 0 && /* @__PURE__ */ jsxs("div", {
				className: "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12",
				role: "status",
				"aria-live": "polite",
				children: [/* @__PURE__ */ jsx("span", {
					className: "flex size-11 items-center justify-center rounded-full bg-surface-tertiary text-text-tertiary",
					children: searchTerm ? /* @__PURE__ */ jsx(SearchX, {
						className: "size-5",
						"aria-hidden": "true"
					}) : /* @__PURE__ */ jsx(Inbox, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ jsx(Label, {
					className: "text-center text-sm text-text-secondary",
					children: searchTerm ? localize("com_ui_no_search_results") : localize("com_ui_no_data")
				})]
			})]
		})]
	});
}
//#endregion
//#region src/icons/provider/registry.ts
const asset = (src) => ({
	kind: "asset",
	src
});
const component = (Component) => ({
	kind: "component",
	Component
});
const openAIBrandColor = (model) => {
	const value = model.toLowerCase();
	if (/\b(o\d)\b/.test(value) || /\bgpt-[5-9](?:\.\d+)?\b/.test(value)) return "var(--provider-openai-reasoning, #000000)";
	return value.includes("gpt-4") ? "var(--provider-openai-gpt4, #AB68FF)" : "var(--provider-openai, #19C37D)";
};
const googleByModel = (model) => {
	const value = model.toLowerCase();
	if (/gemini|learnlm/.test(value)) return {
		art: component(GeminiIcon),
		mono: false,
		label: "Gemini"
	};
	if (value.includes("gemma")) return {
		art: component(GeminiIcon),
		mono: false,
		label: "Gemma"
	};
};
const providerIcons = {
	[ProviderId.openai]: {
		art: component(GPTIcon),
		label: "OpenAI",
		mono: true,
		brandColor: "var(--provider-openai, #19C37D)",
		byModel: (model) => ({ brandColor: openAIBrandColor(model) })
	},
	[ProviderId.anthropic]: {
		art: component(AnthropicIcon),
		label: "Anthropic",
		mono: true,
		brandColor: "var(--provider-anthropic, #d09a74)"
	},
	[ProviderId.google]: {
		art: component(GoogleMinimalIcon),
		label: "Google",
		mono: true,
		byModel: googleByModel
	},
	[ProviderId.azure]: {
		art: component(AzureMinimalIcon),
		label: "Azure OpenAI",
		mono: true,
		brandColor: "var(--provider-azure, linear-gradient(0.375turn, #61bde2, #4389d0))"
	},
	[ProviderId.bedrock]: {
		art: component(BedrockIcon),
		label: "AWS Bedrock",
		mono: true,
		brandColor: "var(--provider-bedrock, #268672)"
	},
	[ProviderId.xai]: {
		art: component(XAIcon),
		label: "xAI",
		mono: true
	},
	[ProviderId.moonshot]: {
		art: component(MoonshotIcon),
		label: "Moonshot",
		mono: true
	},
	[ProviderId.anyscale]: {
		art: asset("assets/anyscale.png"),
		label: "Anyscale"
	},
	[ProviderId.apipie]: {
		art: asset("assets/apipie.png"),
		label: "APIpie"
	},
	[ProviderId.cohere]: {
		art: asset("assets/cohere.png"),
		label: "Cohere"
	},
	[ProviderId.deepseek]: {
		art: asset("assets/deepseek.svg"),
		label: "DeepSeek"
	},
	[ProviderId.fireworks]: {
		art: asset("assets/fireworks.png"),
		label: "Fireworks"
	},
	[ProviderId.groq]: {
		art: asset("assets/groq.png"),
		label: "Groq"
	},
	[ProviderId.helicone]: {
		art: asset("assets/helicone.svg"),
		label: "Helicone"
	},
	[ProviderId.huggingface]: {
		art: asset("assets/huggingface.svg"),
		label: "Hugging Face"
	},
	[ProviderId.lemonade]: {
		art: asset("assets/lemonade.png"),
		label: "AMD Lemonade"
	},
	[ProviderId.mistral]: {
		art: asset("assets/mistral.png"),
		label: "Mistral"
	},
	[ProviderId.mlx]: {
		art: asset("assets/mlx.png"),
		label: "MLX"
	},
	[ProviderId.ollama]: {
		art: asset("assets/ollama.png"),
		label: "Ollama"
	},
	[ProviderId.openrouter]: {
		art: asset("assets/openrouter.png"),
		label: "OpenRouter"
	},
	[ProviderId.perplexity]: {
		art: asset("assets/perplexity.png"),
		label: "Perplexity"
	},
	[ProviderId.qwen]: {
		art: asset("assets/qwen.svg"),
		label: "Qwen"
	},
	[ProviderId.shuttleai]: {
		art: asset("assets/shuttleai.png"),
		label: "ShuttleAI"
	},
	[ProviderId.together]: {
		art: asset("assets/together.png"),
		label: "Together AI"
	},
	[ProviderId.unify]: {
		art: asset("assets/unify.webp"),
		label: "Unify"
	},
	[ProviderId.vercel]: {
		art: component(CustomMinimalIcon),
		label: "Vercel",
		mono: true
	}
};
/** Merges any model level refinement over the base definition for a provider. */
function getProviderIconDef(provider, model) {
	const base = provider ? providerIcons[provider] : void 0;
	if (!base) return {
		art: component(CustomMinimalIcon),
		label: "Custom",
		mono: true
	};
	const refinement = model ? base.byModel?.(model) : void 0;
	return refinement ? {
		...base,
		...refinement
	} : base;
}
//#endregion
//#region src/icons/provider/Icon.tsx
function ProviderIconComponent({ provider, model, size = 20, className }) {
	const def = getProviderIconDef(provider, model);
	const classes = cn(def.mono === true && className == null ? "text-text-primary" : "", def.className, className);
	if (def.art.kind === "component") {
		const { Component } = def.art;
		return /* @__PURE__ */ jsx("span", {
			role: "img",
			"aria-label": def.label,
			style: {
				width: size,
				height: size
			},
			className: cn("inline-flex items-center justify-center", classes),
			children: /* @__PURE__ */ jsx(Component, {
				size,
				className: cn(classes, "h-full w-full")
			})
		});
	}
	return /* @__PURE__ */ jsx("img", {
		src: def.art.src,
		alt: def.label,
		width: size,
		height: size,
		className: cn("object-contain", classes)
	});
}
const ProviderIcon = memo(ProviderIconComponent);
//#endregion
//#region src/icons/provider/Avatar.tsx
const artScale = 5 / 9;
function ProviderAvatarComponent({ provider, model, size = 30, className, children }) {
	const def = getProviderIconDef(provider, model);
	const hasBrand = typeof def.brandColor === "string" && def.brandColor.length > 0;
	return /* @__PURE__ */ jsxs("span", {
		title: def.label,
		style: {
			background: hasBrand ? def.brandColor : "transparent",
			width: size,
			height: size,
			color: hasBrand ? "var(--provider-foreground, #ffffff)" : void 0
		},
		className: cn("relative flex items-center justify-center rounded-sm p-1", hasBrand ? void 0 : "text-text-primary", className),
		children: [/* @__PURE__ */ jsx(ProviderIcon, {
			provider,
			model,
			size: size * artScale,
			className: hasBrand ? "[color:inherit]" : void 0
		}), children]
	});
}
const ProviderAvatar = memo(ProviderAvatarComponent);
//#endregion
//#region src/Providers/ToastContext.tsx
const ToastContext = createContext({ showToast: () => ({}) });
function useToastContext() {
	return useContext(ToastContext);
}
function ToastProvider({ children }) {
	const { showToast } = useToast();
	return /* @__PURE__ */ jsx(ToastContext.Provider, {
		value: { showToast },
		children
	});
}
//#endregion
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AnimatedSearchInput, AnimatedTabs, AnthropicIcon, AnthropicMinimalIcon, AppleIcon, ArchiveIcon, AssistantIcon, AttachmentIcon, AudioPaths, Avatar, AzureMinimalIcon, Badge, BedrockIcon, BirthdayIcon, Blocks, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, ChatGPTMinimalIcon, CheckMark, Checkbox, CheckboxButton, Chip, CircleHelpIcon, Clipboard, CodePaths, CodeyIcon, Collapsible, CollapsibleContent, CollapsibleTrigger, ComboboxComponent as Combobox, Composer, ContinueIcon, ControlComboboxMemo as ControlCombobox, CrossIcon, CustomMinimalIcon, DataIcon, DataTable, DelayedRender, Dialog, DialogButton, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogOverlay as OGDialogOverlay, DialogTemplate, DialogTitle, DialogTrigger, DiscordIcon, DotsIcon, Dropdown, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownPopup, ESide, EditIcon, EmptyState, ExperimentIcon, FacebookIcon, FieldMessage, FileIcon, FilePaths, FileUpload, FilterInput, FormInput, GPTIcon, GearIcon, GeminiIcon, GithubIcon, GoogleIcon, Google as GoogleIconChat, GoogleMinimalIcon, HIGH_CONTRAST_THEME_NAME, HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger, IconButton, InfoHoverCard, Input, InputCombobox, InputNumber, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, InputWithDropdown, Label, LightningIcon, LinkIcon, ListeningIcon, LockIcon, LogOutIcon, MCPIcon, MessagesSquared, MeterSwatch, MinimalPlugin, MinutePicker, MobileSidebar, MoonshotIcon, MorphIcon, MultiSelect, NewChatIcon, NotificationSeverity, Dialog$1 as OGDialog, DialogClose$1 as OGDialogClose, DialogContent$1 as OGDialogContent, DialogDescription$1 as OGDialogDescription, DialogFooter$1 as OGDialogFooter, DialogHeader$1 as OGDialogHeader, DialogPortal as OGDialogPortal, OGDialogTemplate, DialogTitle$1 as OGDialogTitle, DialogTrigger$1 as OGDialogTrigger, OpenAIMinimalIcon, OpenIDIcon, PaLMIcon, PaLMinimalIcon, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PersonalizationIcon, PinIcon, PixelCard, Plugin, Progress, ProviderAvatar, ProviderIcon, QuestionMark, Radio, RegenerateIcon, ResizableHandle, ResizableHandleAlt, ResizablePanel, ResizablePanelGroup, SERIES_SLOT_COUNT, SamlIcon, SaveIcon, SecretInput, SegmentedMeter, Select, SelectContent, SelectDropDown, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, SendActions, SendIcon, SendMessageIcon, Separator, SharePointIcon, SheetPaths, Sidebar, Skeleton, Slider, Sparkles, SpeechIcon, Spinner, SplitText, SquirclePlusIcon, StopGeneratingIcon, Switch, THEME_VERSION, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, TableRowHeader, Tabs, TabsContent, TabsList, TabsTrigger, Tag, TextPaths, Textarea, TextareaAutosize, ThemeContext, ThemeProvider, ThemeSelector, ThumbDownIcon, ThumbUpIcon, TimeColumn, TimePicker, Toast, ToastContext, ToastProvider, TooltipAnchor, TrashIcon, UserIcon, VectorIcon, VerifiedIcon, VideoPaths, DataTable$1 as VirtualizedDataTable, VolumeIcon, VolumeMuteIcon, XAIcon, alertVariants, applyFontSize, applyResolvedTheme, applyTheme, buttonVariants, chatDirectionAtom, chipVariants, clearAppliedTheme, cn, composerControlClasses, composerSubmitClasses, composerSurfaceClasses, composerSurfaceShadow, configureCloudFrontCookieRefresh, darkTheme, defaultAppearance, defaultBrands, defaultTheme, disclosureChevronVariants, fieldBase, fieldControl, fontSizeAtom, fromLegacyTheme, getInitialTheme, getProviderIconDef, highContrastDarkTheme, highContrastLightTheme, highContrastTheme, iconButtonVariants, installCloudFrontImageRetry, isCloudFrontMediaUrl, isDark, isHighContrast, labelVariants, libreChatTheme, logger, providerIcons, refreshCloudFrontCookiesOnce, resolveTheme, resolvesToHighContrast, seriesSwatchClass, themeAppearanceProperties, themeBrandTokens, themeColorTokens, themeColorsAtom, themeModeAtom, themeNameAtom, themeOwnedProperties, toastState, useAvatar, useCombobox, useDelayedRender, useDialogDepth, useInputModality, useLocalize, useMediaQuery, useMultiSearch, useNestedPopoverStyle, useOnClickOutside, usePopoverZIndex, useTheme, useToast, useToastContext, validateThemeDefinition, withCloudFrontCacheBuster };

//# sourceMappingURL=index.mjs.map