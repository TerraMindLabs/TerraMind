import * as React$2 from "react";
import React$1, { ButtonHTMLAttributes, ComponentProps, ComponentType, Context, Dispatch, ForwardRefExoticComponent, KeyboardEvent, MemoExoticComponent, NamedExoticComponent, ReactElement, ReactNode, RefAttributes, RefObject, SVGProps, SetStateAction } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as Ariakit from "@ariakit/react";
import { JSX as JSX$1 } from "react/jsx-runtime";
import { ClassProp } from "class-variance-authority/types";
import { VariantProps } from "class-variance-authority";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import * as InputNumberPrimitive from "rc-input-number";
import { ValueType } from "@rc-component/mini-decimal";
import * as LabelPrimitive from "@radix-ui/react-label";
import { IconInput, IconNode, MorphHandle, MorphIcon, MorphIconProps } from "morphicons/react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { TextareaAutosizeProps } from "react-textarea-autosize";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { RenderProps } from "input-otp";
import { Group, Panel, Separator as Separator$1 } from "react-resizable-panels";
import * as SelectPrimitive from "@radix-ui/react-select";
import { LucideIcon } from "lucide-react";
import { ProviderId, TFile, TStartupConfig, TUser } from "librechat-data-provider";
import { ColumnDef, SortingState, Table as Table$1 } from "@tanstack/react-table";
import { SpringConfig } from "@react-spring/web";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { TOptions } from "i18next";
import { PrimitiveAtom, WritableAtom } from "jotai";
import { ClassValue } from "clsx";
import { RESET } from "jotai/utils";

//#region src/components/Accordion.d.ts
declare const Accordion: React$2.ForwardRefExoticComponent<(AccordionPrimitive.AccordionSingleProps | AccordionPrimitive.AccordionMultipleProps) & React$2.RefAttributes<HTMLDivElement>>;
declare const AccordionItem: React$2.ForwardRefExoticComponent<Omit<AccordionPrimitive.AccordionItemProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const AccordionTrigger: React$2.ForwardRefExoticComponent<Omit<AccordionPrimitive.AccordionTriggerProps & React$2.RefAttributes<HTMLButtonElement>, "ref"> & React$2.RefAttributes<HTMLButtonElement>>;
declare const AccordionContent: React$2.ForwardRefExoticComponent<Omit<AccordionPrimitive.AccordionContentProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/AnimatedTabs.d.ts
interface TabItem {
  id?: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}
interface AnimatedTabsProps {
  tabs: TabItem[];
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  tabPanelClassName?: string;
  tabListProps?: Ariakit.TabListProps;
  containerClassName?: string;
  defaultSelectedId?: string;
}
declare function AnimatedTabs({
  tabs,
  className,
  tabListClassName,
  tabClassName,
  tabPanelClassName,
  containerClassName,
  tabListProps,
  defaultSelectedId
}: AnimatedTabsProps): JSX$1.Element;
//#endregion
//#region src/components/Alert.d.ts
declare const alertVariants: (props?: ({
  variant?: "info" | "success" | "warning" | "error" | "neutral" | null | undefined;
} & ClassProp) | undefined) => string;
interface AlertProps extends React$2.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  /** Override the default per-variant icon, or pass `false` to hide it. */
  icon?: React$2.ReactNode | false;
}
declare const Alert: React$2.ForwardRefExoticComponent<AlertProps & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/AlertDialog.d.ts
declare const AlertDialog: React$2.FC<AlertDialogPrimitive.AlertDialogProps>;
declare const AlertDialogTrigger: React$2.ForwardRefExoticComponent<AlertDialogPrimitive.AlertDialogTriggerProps & React$2.RefAttributes<HTMLButtonElement>>;
declare const AlertDialogContent: React$2.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogContentProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const AlertDialogHeader: {
  ({
    className,
    ...props
  }: React$2.HTMLAttributes<HTMLDivElement>): JSX$1.Element;
  displayName: string;
};
declare const AlertDialogFooter: {
  ({
    className,
    ...props
  }: React$2.HTMLAttributes<HTMLDivElement>): JSX$1.Element;
  displayName: string;
};
declare const AlertDialogTitle: React$2.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogTitleProps & React$2.RefAttributes<HTMLHeadingElement>, "ref"> & React$2.RefAttributes<HTMLHeadingElement>>;
declare const AlertDialogDescription: React$2.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogDescriptionProps & React$2.RefAttributes<HTMLParagraphElement>, "ref"> & React$2.RefAttributes<HTMLParagraphElement>>;
declare const AlertDialogAction: React$2.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogActionProps & React$2.RefAttributes<HTMLButtonElement>, "ref"> & React$2.RefAttributes<HTMLButtonElement>>;
declare const AlertDialogCancel: React$2.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogCancelProps & React$2.RefAttributes<HTMLButtonElement>, "ref"> & React$2.RefAttributes<HTMLButtonElement>>;
//#endregion
//#region src/components/Breadcrumb.d.ts
declare const Breadcrumb: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.HTMLAttributes<HTMLElement>, HTMLElement>, "ref"> & {
  separator?: React$2.ReactNode;
} & React$2.RefAttributes<HTMLElement>>;
declare const BreadcrumbList: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>, "ref"> & React$2.RefAttributes<HTMLOListElement>>;
declare const BreadcrumbItem: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & React$2.RefAttributes<HTMLLIElement>>;
declare const BreadcrumbLink: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, "ref"> & {
  asChild?: boolean;
} & React$2.RefAttributes<HTMLAnchorElement>>;
declare const BreadcrumbPage: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & React$2.RefAttributes<HTMLSpanElement>>;
declare const BreadcrumbSeparator: {
  ({
    children,
    className,
    ...props
  }: React$2.ComponentProps<"li">): JSX$1.Element;
  displayName: string;
};
declare const BreadcrumbEllipsis: {
  ({
    className,
    ...props
  }: React$2.ComponentProps<"span">): JSX$1.Element;
  displayName: string;
};
//#endregion
//#region src/components/Button.d.ts
type ButtonVariantOptions = ({
  variant?: "default" | "link" | "submit" | "outline" | "choice" | "subtle" | "destructive" | "secondary" | "ghost" | "row-action" | "section-header" | "section-action" | "header-action" | null | undefined;
  size?: "default" | "icon" | "icon-sm" | "icon-xs" | "icon-theme" | "sm" | "lg" | "theme" | null | undefined;
  shape?: "default" | "theme" | "round" | null | undefined;
} & ClassProp) | undefined;
declare const buttonVariants: (props?: ButtonVariantOptions) => string;
interface ButtonProps extends React$2.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
declare const Button: React$2.ForwardRefExoticComponent<ButtonProps & React$2.RefAttributes<HTMLButtonElement>>;
//#endregion
//#region src/components/Chip.d.ts
type ChipVariantProps = {
  tone?: "neutral" | "info" | "success" | "warning" | "error" | null;
  size?: "sm" | "md" | "theme" | null;
  shape?: "round" | "theme" | null;
};
declare const chipVariants: (props?: ChipVariantProps & ClassProp) => string;
interface ChipProps extends Omit<React$2.HTMLAttributes<HTMLSpanElement>, "children">, ChipVariantProps {
  children: React$2.ReactNode;
  onRemove?: (event: React$2.MouseEvent<HTMLButtonElement>) => void;
  removeLabel?: string;
  leading?: React$2.ReactNode;
  trailing?: React$2.ReactNode;
}
declare const Chip: React$2.ForwardRefExoticComponent<ChipProps & React$2.RefAttributes<HTMLSpanElement>>;
//#endregion
//#region src/components/Checkbox.d.ts
type BaseCheckboxProps = Omit<React$2.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "aria-label" | "aria-labelledby"> & {
  asChild?: boolean;
};
type CheckboxProps = (BaseCheckboxProps & {
  "aria-label": string;
  "aria-labelledby"?: never;
}) | (BaseCheckboxProps & {
  "aria-labelledby": string;
  "aria-label"?: never;
});
declare const Checkbox: React$2.ForwardRefExoticComponent<CheckboxProps & React$2.RefAttributes<HTMLButtonElement>>;
//#endregion
//#region src/components/DisclosureChevron.d.ts
type DisclosureChevronVariantOptions = ({
  expanded?: boolean;
} & ClassProp) | undefined;
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
declare const disclosureChevronVariants: (props?: DisclosureChevronVariantOptions) => string;
//#endregion
//#region src/components/Dialog.d.ts
declare const Dialog: React$2.FC<DialogPrimitive.DialogProps>;
declare const DialogTrigger: React$2.ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & React$2.RefAttributes<HTMLButtonElement>>;
declare const DialogContent: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogContentProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & {
  showCloseButton?: boolean;
  disableScroll?: boolean;
} & React$2.RefAttributes<HTMLDivElement>>;
declare const DialogHeader: {
  ({
    className,
    ...props
  }: React$2.HTMLAttributes<HTMLDivElement>): JSX$1.Element;
  displayName: string;
};
declare const DialogFooter: {
  ({
    className,
    ...props
  }: React$2.HTMLAttributes<HTMLDivElement>): JSX$1.Element;
  displayName: string;
};
declare const DialogTitle: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & React$2.RefAttributes<HTMLHeadingElement>, "ref"> & React$2.RefAttributes<HTMLHeadingElement>>;
declare const DialogDescription: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & React$2.RefAttributes<HTMLParagraphElement>, "ref"> & React$2.RefAttributes<HTMLParagraphElement>>;
declare const DialogClose: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogCloseProps & React$2.RefAttributes<HTMLButtonElement>, "ref"> & React$2.RefAttributes<HTMLButtonElement>>;
declare const DialogButton: React$2.ForwardRefExoticComponent<Omit<ButtonProps & React$2.RefAttributes<HTMLButtonElement>, "ref"> & React$2.RefAttributes<HTMLButtonElement>>;
//#endregion
//#region src/components/DropdownMenu.d.ts
declare function DropdownMenu({
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Root>): JSX$1.Element;
declare function DropdownMenuPortal({
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Portal>): JSX$1.Element;
declare function DropdownMenuTrigger({
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Trigger>): JSX$1.Element;
declare function DropdownMenuContent({
  className,
  sideOffset,
  style,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Content>): JSX$1.Element;
declare function DropdownMenuGroup({
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Group>): JSX$1.Element;
declare function DropdownMenuItem({
  className,
  inset,
  variant,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}): JSX$1.Element;
declare function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>): JSX$1.Element;
declare function DropdownMenuRadioGroup({
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>): JSX$1.Element;
declare function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>): JSX$1.Element;
declare function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}): JSX$1.Element;
declare function DropdownMenuSeparator({
  className,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Separator>): JSX$1.Element;
declare function DropdownMenuShortcut({
  className,
  ...props
}: React$2.ComponentProps<"span">): JSX$1.Element;
declare function DropdownMenuSub({
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.Sub>): JSX$1.Element;
declare function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}): JSX$1.Element;
declare function DropdownMenuSubContent({
  className,
  style,
  ...props
}: React$2.ComponentProps<typeof DropdownMenuPrimitive.SubContent>): JSX$1.Element;
//#endregion
//#region src/components/HoverCard.d.ts
declare const HoverCard: React$2.FC<HoverCardPrimitive.HoverCardProps>;
declare const HoverCardTrigger: React$2.ForwardRefExoticComponent<HoverCardPrimitive.HoverCardTriggerProps & React$2.RefAttributes<HTMLAnchorElement>>;
declare const HoverCardPortal: React$2.FC<HoverCardPrimitive.HoverCardPortalProps>;
declare const HoverCardContent: React$2.ForwardRefExoticComponent<Omit<HoverCardPrimitive.HoverCardContentProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & {
  disabled?: boolean;
} & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/Field.d.ts
/**
* The shared appearance of a form control — border, radius, type scale and focus
* treatment. Owned here so `Input`, `Textarea`, and the select/combobox triggers
* that have to sit beside them in a form cannot drift apart as the theme evolves.
* Callers compose a variant rather than restating these classes locally.
*/
declare const fieldBase: string;
/** A single-line control sized to sit in a form row, matching `Input`. */
declare const fieldControl: string;
//#endregion
//#region src/components/Input.d.ts
type InputProps = React$2.InputHTMLAttributes<HTMLInputElement>;
declare const Input: React$2.ForwardRefExoticComponent<InputProps & React$2.RefAttributes<HTMLInputElement>>;
//#endregion
//#region src/components/InputNumber.d.ts
declare const InputNumber: React$2.ForwardRefExoticComponent<InputNumberPrimitive.InputNumberProps<ValueType> & React$2.RefAttributes<HTMLInputElement>>;
//#endregion
//#region src/components/SecretInput.d.ts
interface SecretInputProps extends Omit<React$2.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Show the built-in copy button */
  showCopy?: boolean;
  /** Custom copy control rendered inside the input, in place of the built-in one */
  copyButton?: React$2.ReactNode;
  /** Callback when value is copied */
  onCopy?: () => void;
  /** Duration in ms to show checkmark after copy (default: 2000) */
  copyFeedbackDuration?: number;
  label?: React$2.ReactNode;
  labelClassName?: string;
  containerClassName?: string;
  controlsClassName?: string;
  buttonClassName?: string;
  controlsOnHover?: boolean;
}
declare const SecretInput: React$2.ForwardRefExoticComponent<SecretInputProps & React$2.RefAttributes<HTMLInputElement>>;
//#endregion
//#region src/components/FilterInput.d.ts
interface FilterInputProps extends Omit<React$2.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  /** The label text shown in the floating label */
  label: string;
  /** Unique identifier for the input - used to link label */
  inputId: string;
  /** Container className for custom styling */
  containerClassName?: string;
}
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
declare const FilterInput: React$2.ForwardRefExoticComponent<FilterInputProps & React$2.RefAttributes<HTMLInputElement>>;
//#endregion
//#region src/components/FieldMessage.d.ts
/** Reserved helper heights, keyed by the number of `leading-4` lines. */
declare const reservedLines: {
  readonly 1: "min-h-4";
  readonly 2: "min-h-8";
  readonly 3: "min-h-12";
};
interface FieldMessageProps {
  id: string;
  /** Validation failure text; takes precedence over the hint */
  message?: string | null;
  /** Resting helper text shown while the field is valid */
  hint?: string | null;
  /** Helper lines to reserve; raise it when the longest message wraps */
  lines?: keyof typeof reservedLines;
  className?: string;
}
/**
* Helper line rendered under a form field. It reserves `lines` worth of vertical
* space up front, so swapping between the hint, an error, and nothing never
* shifts the surrounding layout. Fields whose longest message wraps at the
* narrowest supported width should reserve the height that message needs.
*/
declare function FieldMessage({
  id,
  message,
  hint,
  lines,
  className
}: FieldMessageProps): React$2.JSX.Element;
//#endregion
//#region src/components/Label.d.ts
type LabelVariantOptions = ({
  variant?: "default" | "section" | null | undefined;
} & ClassProp) | undefined;
/**
* Typography only, so a non-label element that heads a settings row can reuse a
* variant without inheriting the label's block layout. Each variant carries its
* own size, leading and color rather than overriding a shared base: the raw
* recipe output is not merged for those consumers, and a font size declared
* after `leading-none` would drop it.
*/
declare const labelVariants: (props?: LabelVariantOptions) => string;
declare const Label: React$2.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React$2.RefAttributes<HTMLLabelElement>, "ref"> & {
  className?: string;
} & VariantProps<typeof labelVariants> & React$2.RefAttributes<HTMLLabelElement>>;
//#endregion
//#region src/components/OriginalDialog.d.ts
/** Current OGDialog nesting depth (0 when rendered outside any dialog). */
declare const useDialogDepth: () => number;
/**
* z-index for a portaled popover so it renders above the dialog it lives in.
* Outside any dialog (depth 0) it falls back to a low default (50).
*/
declare const usePopoverZIndex: () => number;
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
declare const useNestedPopoverStyle: () => React$2.CSSProperties | undefined;
interface OGDialogProps extends DialogPrimitive.DialogProps {
  triggerRef?: React$2.RefObject<HTMLButtonElement | HTMLInputElement | HTMLDivElement | null>;
  triggerRefs?: React$2.RefObject<HTMLButtonElement | HTMLInputElement | HTMLDivElement | null>[];
}
declare const Dialog$1: React$2.ForwardRefExoticComponent<OGDialogProps & React$2.RefAttributes<HTMLDivElement>>;
declare const DialogTrigger$1: React$2.ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & React$2.RefAttributes<HTMLButtonElement>>;
declare const DialogPortal: React$2.FC<DialogPrimitive.DialogPortalProps>;
declare const DialogClose$1: React$2.ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & React$2.RefAttributes<HTMLButtonElement>>;
declare const DialogOverlay: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogOverlayProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const DialogContent$1: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogContentProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & {
  showCloseButton?: boolean;
  disableScroll?: boolean;
  overlayClassName?: string;
} & React$2.RefAttributes<HTMLDivElement>>;
declare const DialogHeader$1: {
  ({
    className,
    ...props
  }: React$2.HTMLAttributes<HTMLDivElement>): JSX$1.Element;
  displayName: string;
};
declare const DialogFooter$1: {
  ({
    className,
    ...props
  }: React$2.HTMLAttributes<HTMLDivElement>): JSX$1.Element;
  displayName: string;
};
declare const DialogTitle$1: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & React$2.RefAttributes<HTMLHeadingElement>, "ref"> & React$2.RefAttributes<HTMLHeadingElement>>;
declare const DialogDescription$1: React$2.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & React$2.RefAttributes<HTMLParagraphElement>, "ref"> & React$2.RefAttributes<HTMLParagraphElement>>;
//#endregion
//#region src/components/QuestionMark.d.ts
declare const QuestionMark: ({
  className
}: {
  className?: string | undefined;
}) => JSX$1.Element;
//#endregion
//#region src/components/Slider.d.ts
type SliderProps = React$2.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  className?: string;
  onDoubleClick?: () => void;
  "aria-describedby"?: string;
} & ({
  "aria-label": string;
  "aria-labelledby"?: never;
} | {
  "aria-labelledby": string;
  "aria-label"?: never;
} | {
  "aria-label": string;
  "aria-labelledby": string;
});
declare const Slider: React$2.ForwardRefExoticComponent<SliderProps & React$2.RefAttributes<HTMLSpanElement>>;
//#endregion
//#region src/components/Separator.d.ts
declare const Separator: React$2.ForwardRefExoticComponent<Omit<SeparatorPrimitive.SeparatorProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & {
  className?: string;
} & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/common/enum.d.ts
declare enum ESide {
  Top = "top",
  Right = "right",
  Bottom = "bottom",
  Left = "left"
}
declare enum NotificationSeverity {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error"
}
//#endregion
//#region src/common/types.d.ts
type TShowToast = {
  message: string;
  severity?: NotificationSeverity;
  showIcon?: boolean;
  duration?: number;
  status?: "error" | "success" | "warning" | "info";
};
type Option = Record<string, unknown> & {
  label?: string;
  value: string | number | null;
};
type OptionWithIcon = Option & {
  icon?: React.ReactNode;
};
type DropdownValueSetter = (value: string | Option | OptionWithIcon) => void;
type MentionOption = OptionWithIcon & {
  type: string;
  value: string;
  description?: string;
};
interface SelectedValues {
  endpoint: string | null;
  model: string | null;
  modelSpec: string | null;
}
//#endregion
//#region src/common/menus.d.ts
type RenderProp<P = React.HTMLAttributes<any> & {
  ref?: React.Ref<any>;
}> = (props: P) => React.ReactNode;
interface MenuItemProps {
  id?: string;
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  icon?: React.ReactNode;
  kbd?: string;
  show?: boolean;
  disabled?: boolean;
  separate?: boolean;
  hideOnClick?: boolean;
  dialog?: React.ReactElement;
  ariaHasPopup?: boolean | "dialog" | "menu" | "true" | "false" | "listbox" | "tree" | "grid" | undefined;
  ariaControls?: string;
  ariaLabel?: string;
  ariaChecked?: boolean;
  ref?: React.Ref<any>;
  className?: string;
  render?: RenderProp<React.HTMLAttributes<any> & {
    ref?: React.Ref<any> | undefined;
  }> | React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
  subItems?: MenuItemProps[];
}
//#endregion
//#region src/components/InputCombobox.d.ts
type ComboboxProps = {
  label?: string;
  placeholder?: string;
  options: OptionWithIcon[] | string[];
  className?: string;
  labelClassName?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};
declare const InputCombobox: React$1.FC<ComboboxProps>;
//#endregion
//#region src/components/Skeleton.d.ts
declare function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX$1.Element;
//#endregion
//#region src/components/Switch.d.ts
type BaseSwitchProps = Omit<React$2.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, "aria-label" | "aria-labelledby">;
type SwitchProps = (BaseSwitchProps & {
  "aria-label": string;
  "aria-labelledby"?: never;
}) | (BaseSwitchProps & {
  "aria-labelledby": string;
  "aria-label"?: never;
});
declare const Switch: React$2.ForwardRefExoticComponent<SwitchProps & React$2.RefAttributes<HTMLButtonElement>>;
//#endregion
//#region src/components/Table.d.ts
interface TableProps extends React$2.HTMLAttributes<HTMLTableElement> {
  unwrapped?: boolean;
}
declare const Table: React$2.ForwardRefExoticComponent<TableProps & React$2.RefAttributes<HTMLTableElement>>;
declare const TableHeader: React$2.ForwardRefExoticComponent<React$2.HTMLAttributes<HTMLTableSectionElement> & React$2.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React$2.ForwardRefExoticComponent<React$2.HTMLAttributes<HTMLTableSectionElement> & React$2.RefAttributes<HTMLTableSectionElement>>;
declare const TableFooter: React$2.ForwardRefExoticComponent<React$2.HTMLAttributes<HTMLTableSectionElement> & React$2.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React$2.ForwardRefExoticComponent<React$2.HTMLAttributes<HTMLTableRowElement> & React$2.RefAttributes<HTMLTableRowElement>>;
declare const TableHead: React$2.ForwardRefExoticComponent<React$2.ThHTMLAttributes<HTMLTableCellElement> & React$2.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React$2.ForwardRefExoticComponent<React$2.TdHTMLAttributes<HTMLTableCellElement> & React$2.RefAttributes<HTMLTableCellElement>>;
declare const TableRowHeader: React$2.ForwardRefExoticComponent<React$2.ThHTMLAttributes<HTMLTableCellElement> & React$2.RefAttributes<HTMLTableCellElement>>;
declare const TableCaption: React$2.ForwardRefExoticComponent<React$2.HTMLAttributes<HTMLTableCaptionElement> & React$2.RefAttributes<HTMLTableCaptionElement>>;
//#endregion
//#region src/components/Tabs.d.ts
declare const Tabs: React$2.ForwardRefExoticComponent<TabsPrimitive.TabsProps & React$2.RefAttributes<HTMLDivElement>>;
declare const TabsList: React$2.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsListProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const TabsTrigger: React$2.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsTriggerProps & React$2.RefAttributes<HTMLButtonElement>, "ref"> & React$2.RefAttributes<HTMLButtonElement>>;
declare const TabsContent: React$2.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsContentProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/Tag.d.ts
type TagVariant = "neutral" | "info" | "success" | "warning" | "error";
declare const Tag: React$2.MemoExoticComponent<React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
  label: string;
  labelClassName?: string;
  CancelButton?: React$2.ReactNode;
  LabelNode?: React$2.ReactNode;
  variant?: TagVariant;
  onRemove?: (e: React$2.MouseEvent<HTMLButtonElement>) => void;
} & React$2.RefAttributes<HTMLDivElement>>>;
//#endregion
//#region src/components/Textarea.d.ts
interface TextareaProps extends React$2.TextareaHTMLAttributes<HTMLTextAreaElement> {}
declare const Textarea: React$2.ForwardRefExoticComponent<TextareaProps & React$2.RefAttributes<HTMLTextAreaElement>>;
//#endregion
//#region src/components/TextareaAutosize.d.ts
type BaseTextareaAutosizeProps = Omit<TextareaAutosizeProps, "aria-label" | "aria-labelledby">;
type TextareaAutosizePropsWithAria = (BaseTextareaAutosizeProps & {
  "aria-label": string;
  "aria-labelledby"?: never;
}) | (BaseTextareaAutosizeProps & {
  "aria-labelledby": string;
  "aria-label"?: never;
});
declare const TextareaAutosize: ForwardRefExoticComponent<TextareaAutosizePropsWithAria & RefAttributes<HTMLTextAreaElement>>;
//#endregion
//#region src/components/Toast.d.ts
declare function Toast(): JSX$1.Element;
//#endregion
//#region src/components/Tooltip.d.ts
interface TooltipAnchorProps extends Ariakit.TooltipAnchorProps {
  role?: string;
  className?: string;
  description: string;
  enableHTML?: boolean;
  portalElement?: Ariakit.TooltipProps["portalElement"];
  side?: "top" | "bottom" | "left" | "right";
}
declare const TooltipAnchor: ForwardRefExoticComponent<Omit<TooltipAnchorProps, "ref"> & RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/Pagination.d.ts
declare const Pagination: {
  ({
    className,
    ...props
  }: React$2.ComponentProps<"nav">): JSX$1.Element;
  displayName: string;
};
declare const PaginationContent: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & React$2.RefAttributes<HTMLUListElement>>;
declare const PaginationItem: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & React$2.RefAttributes<HTMLLIElement>>;
type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> & React$2.ComponentProps<"a">;
declare const PaginationLink: {
  ({
    className,
    isActive,
    size,
    children,
    ...props
  }: PaginationLinkProps): JSX$1.Element;
  displayName: string;
};
declare const PaginationPrevious: {
  ({
    className,
    ...props
  }: React$2.ComponentProps<typeof PaginationLink>): JSX$1.Element;
  displayName: string;
};
declare const PaginationNext: {
  ({
    className,
    ...props
  }: React$2.ComponentProps<typeof PaginationLink>): JSX$1.Element;
  displayName: string;
};
declare const PaginationEllipsis: {
  ({
    className,
    ...props
  }: React$2.ComponentProps<"span">): JSX$1.Element;
  displayName: string;
};
//#endregion
//#region src/components/Progress.d.ts
declare const Progress: React$2.ForwardRefExoticComponent<Omit<ProgressPrimitive.ProgressProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/SegmentedMeter.d.ts
declare const SERIES_SLOT_COUNT: number;
interface MeterSegment {
  /** Stable identity for keys; also the legend key's pairing id */
  id: string;
  value: number;
  /** 1-based slot in the categorical series scale */
  slot: number;
  /** Same hue, hatched — present but held out of the active set */
  hatched?: boolean;
  /** Translucent fill with a solid edge, for the one segment that grows */
  outlined?: boolean;
}
declare function seriesSwatchClass(segment: Pick<MeterSegment, "slot" | "outlined">): string;
/** The legend key. Lives beside the meter so a row and its segment cannot drift. */
interface MeterSwatchProps extends React$2.ComponentPropsWithoutRef<"span"> {
  segment: Pick<MeterSegment, "slot" | "hatched" | "outlined">;
}
declare function MeterSwatch({
  segment,
  className,
  ...props
}: MeterSwatchProps): React$2.ReactElement;
interface SegmentedMeterProps extends React$2.ComponentPropsWithoutRef<"div"> {
  segments: MeterSegment[];
  /** Denominator for every segment width; the shortfall renders as free track */
  max: number;
  /** Segment id the caller considers active; every other segment recedes.
  *  Pairs a legend row with its slice of the bar on hover. */
  highlightId?: string | null;
}
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
declare const SegmentedMeter: React$2.ForwardRefExoticComponent<SegmentedMeterProps & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/Collapsible.d.ts
declare const Collapsible: ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleProps & RefAttributes<HTMLDivElement>>;
declare const CollapsibleTrigger: ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleTriggerProps & RefAttributes<HTMLButtonElement>>;
declare const CollapsibleContent: ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleContentProps & RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/InputOTP.d.ts
declare const InputOTP: React$2.ForwardRefExoticComponent<(Omit<Omit<React$2.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "maxLength" | "containerClassName" | "textAlign" | "onComplete" | "pushPasswordManagerStrategy" | "pasteTransformer" | "noScriptCSSFallback"> & {
  value?: string;
  onChange?: (newValue: string) => unknown;
  maxLength: number;
  textAlign?: "left" | "center" | "right";
  onComplete?: (...args: unknown[]) => unknown;
  pushPasswordManagerStrategy?: "increase-width" | "none";
  pasteTransformer?: (pasted: string) => string;
  containerClassName?: string;
  noScriptCSSFallback?: string | null;
} & {
  render: (props: RenderProps) => React$2.ReactNode;
  children?: never;
} & React$2.RefAttributes<HTMLInputElement>, "ref"> | Omit<Omit<React$2.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "maxLength" | "containerClassName" | "textAlign" | "onComplete" | "pushPasswordManagerStrategy" | "pasteTransformer" | "noScriptCSSFallback"> & {
  value?: string;
  onChange?: (newValue: string) => unknown;
  maxLength: number;
  textAlign?: "left" | "center" | "right";
  onComplete?: (...args: unknown[]) => unknown;
  pushPasswordManagerStrategy?: "increase-width" | "none";
  pasteTransformer?: (pasted: string) => string;
  containerClassName?: string;
  noScriptCSSFallback?: string | null;
} & {
  render?: never;
  children: React$2.ReactNode;
} & React$2.RefAttributes<HTMLInputElement>, "ref">) & React$2.RefAttributes<HTMLInputElement>>;
declare const InputOTPGroup: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const InputOTPSlot: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
  index: number;
} & React$2.RefAttributes<HTMLDivElement>>;
declare const InputOTPSeparator: React$2.ForwardRefExoticComponent<Omit<React$2.DetailedHTMLProps<React$2.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/IconButton.d.ts
type IconButtonVariantProps = {
  variant?: "default" | "secondary" | "ghost" | "destructive" | null;
  size?: "xs" | "sm" | "md" | "lg" | "theme" | null;
  shape?: "round" | "square" | "theme" | null;
};
declare const iconButtonVariants: (props?: IconButtonVariantProps & ClassProp) => string;
interface IconButtonProps extends Omit<React$2.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">, IconButtonVariantProps {
  label: string;
}
declare const IconButton: React$2.ForwardRefExoticComponent<IconButtonProps & React$2.RefAttributes<HTMLButtonElement>>;
//#endregion
//#region src/components/MultiSearch.d.ts
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
declare function useMultiSearch<OptionsType extends unknown[]>({
  availableOptions,
  placeholder,
  getTextKeyOverride,
  className,
  disabled
}: {
  availableOptions?: OptionsType;
  placeholder?: string;
  getTextKeyOverride?: (node: OptionsType[0]) => string;
  className?: string;
  disabled?: boolean;
}): [OptionsType, React$1.ReactNode];
//#endregion
//#region src/components/Resizable.d.ts
declare const ResizablePanelGroup: ({
  className,
  ...props
}: ComponentProps<typeof Group>) => JSX$1.Element;
declare const ResizablePanel: typeof Panel;
declare const ResizableHandle: ({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof Separator$1> & {
  withHandle?: boolean;
}) => JSX$1.Element;
declare const ResizableHandleAlt: ({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof Separator$1> & {
  withHandle?: boolean;
}) => JSX$1.Element;
//#endregion
//#region src/components/Select.d.ts
declare const Select: React$2.FC<SelectPrimitive.SelectProps>;
declare const SelectGroup: React$2.ForwardRefExoticComponent<SelectPrimitive.SelectGroupProps & React$2.RefAttributes<HTMLDivElement>>;
declare const SelectValue: React$2.ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & React$2.RefAttributes<HTMLSpanElement>>;
declare const SelectTrigger: React$2.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectTriggerProps & React$2.RefAttributes<HTMLButtonElement>, "ref"> & React$2.RefAttributes<HTMLButtonElement>>;
declare const SelectScrollUpButton: React$2.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollUpButtonProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const SelectScrollDownButton: React$2.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollDownButtonProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const SelectContent: React$2.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectContentProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const SelectLabel: React$2.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectLabelProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const SelectItem: React$2.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectItemProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
declare const SelectSeparator: React$2.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectSeparatorProps & React$2.RefAttributes<HTMLDivElement>, "ref"> & React$2.RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/Radio.d.ts
interface Option$1 {
  value: string;
  label: string;
  icon?: React$1.ReactNode;
}
interface RadioProps {
  options: Option$1[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  fullWidth?: boolean;
  /** Lets the segments flow onto a second row instead of overflowing their
  *  container. A `whitespace-nowrap` label plus `px-4` gives every segment a hard
  *  minimum width, so five of them (translated labels are longer still) push past a
  *  dialog's width on a phone and the choices past the edge become unreachable.
  *  The moving indicator follows across rows; the single-row default is untouched. */
  wrap?: boolean;
  "aria-labelledby"?: string;
}
declare const Radio: React$1.NamedExoticComponent<RadioProps>;
//#endregion
//#region src/components/Badge.d.ts
interface BadgeProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  icon?: LucideIcon;
  label: string;
  id?: string;
  isActive?: boolean;
  isEditing?: boolean;
  isDragging?: boolean;
  isAvailable: boolean;
  isInChat?: boolean;
  onBadgeAction?: () => void;
  onToggle?: () => void;
}
declare function Badge({
  icon: Icon,
  label,
  id,
  isActive,
  isEditing,
  isDragging,
  isAvailable,
  isInChat,
  onBadgeAction,
  onToggle,
  className,
  ...props
}: BadgeProps): JSX$1.Element;
//#endregion
//#region src/components/Avatar.d.ts
interface AvatarProps {
  user?: TUser;
  size?: number;
  className?: string;
  alt?: string;
  showDefaultWhenEmpty?: boolean;
}
declare const Avatar: React$1.FC<AvatarProps>;
//#endregion
//#region src/components/Combobox.d.ts
declare function ComboboxComponent({
  selectedValue,
  displayValue,
  items,
  setValue,
  ariaLabel,
  searchPlaceholder,
  selectPlaceholder,
  isCollapsed,
  SelectIcon
}: {
  ariaLabel: string;
  displayValue?: string;
  selectedValue: string;
  searchPlaceholder?: string;
  selectPlaceholder?: string;
  items: OptionWithIcon[] | string[];
  setValue: (value: string) => void;
  isCollapsed: boolean;
  SelectIcon?: React.ReactNode;
}): JSX$1.Element;
//#endregion
//#region src/components/SendActions.d.ts
/** One alternate way to submit, offered from the send control rather than
*  standing beside the field. */
interface SendAction {
  key: string;
  label: string;
  /** The chord that still reaches this action, when one does. Omitted rather
  *  than guessed: advertising a key that has been rebound, yielded to a global
  *  shortcut, or disabled is worse than advertising none. */
  kbd?: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick: () => void;
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
declare function SendActions({
  anchor,
  actions,
  label
}: {
  anchor: ReactElement;
  actions: SendAction[];
  label: string;
}): JSX$1.Element;
//#endregion
//#region src/components/Composer.d.ts
/** What a key press means to the composer. Mirrors the main chat form's own
*  verdicts: `block` is "swallow it, do nothing", `newline` and `none` both
*  leave the key to the field. */
type ComposerKeyVerdict = "submit" | "block" | "newline" | "none";
interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Given the key event that asked for the submission, or nothing when a
  *  pointer asked. Hosts that vary the action by chord resolve it from this
  *  event rather than from state left behind by an earlier keypress. */
  onSubmit: (event?: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Blocks submission without disabling the field, so a reader can still type
  *  and read back a draft the surface is not ready to accept. */
  canSubmit: boolean;
  submitLabel: string;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  /** Secondary controls, laid out inline-start of the send button. */
  actions?: ReactNode;
  /**
  * Alternate submissions, revealed from the send control on hover or focus —
  * the same trade main chat's during-run send button makes, so the field is
  * never lined with controls that repeat what submitting already does. The
  * primary submission stays the button's own click.
  */
  submitActions?: SendAction[];
  submitActionsLabel?: string;
  /**
  * The reader's "Press Enter to send" preference. When false, Enter inserts a
  * newline and ⌘/Ctrl+Enter submits — the same bargain the main chat composer
  * strikes, so a reader who turned the preference off cannot steer a run or
  * leave for a continued chat by reaching for a line break.
  */
  submitOnEnter?: boolean;
  /**
  * The host's own key policy, so a reader who rebound (or unbound) the submit
  * shortcut gets the same contract they get in the main chat form, and chords
  * claimed by global shortcuts are left for the window handler. Given the
  * event and whether an IME is mid-composition. Without it, `submitOnEnter`
  * drives a plain Enter / ⌘-Ctrl+Enter contract.
  */
  resolveKeyVerdict?: (event: KeyboardEvent<HTMLTextAreaElement>, isComposing: boolean) => ComposerKeyVerdict;
  className?: string;
}
/**
* Stops whatever this surface is running. When supplied, an empty field shows
* main chat's Stop in the send button's place — the same trade the main
* composer makes, so "nothing to send" and "stop what is running" never need
* two separate controls. The label travels with the handler so the control can
* never render without an accessible name.
*/
type ComposerStopProps = {
  onStop: () => void;
  stopLabel: string;
} | {
  onStop?: undefined;
  stopLabel?: undefined;
};
type ComposerPropsWithStop = ComposerProps & ComposerStopProps;
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
declare const Composer: ForwardRefExoticComponent<ComposerPropsWithStop & RefAttributes<HTMLTextAreaElement>>;
//#endregion
//#region src/components/Dropdown.d.ts
interface DropdownProps$1 {
  value?: string;
  label?: string;
  onChange: (value: string) => void;
  options: (string | Option | {
    divider: true;
  })[];
  /** Applied to the positioning wrapper */
  className?: string;
  /** Applied to the trigger button */
  triggerClassName?: string;
  /** Applied to the popover */
  sizeClasses?: string;
  testId?: string;
  icon?: React$1.ReactNode;
  iconOnly?: boolean;
  renderValue?: (option: Option) => React$1.ReactNode;
  ariaLabel?: string;
  "aria-labelledby"?: string;
  portal?: boolean;
  /** `field` matches the `Input` primitive so this can sit in a form row. */
  variant?: "default" | "field";
  /** Renders the popover into this element instead of document.body */
  portalElement?: ((element: HTMLElement) => HTMLElement | null) | HTMLElement | null;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchEmptyText?: string;
}
declare const Dropdown: React$1.FC<DropdownProps$1>;
//#endregion
//#region src/components/DataTable.d.ts
type TableColumn$1<TData, TValue> = ColumnDef<TData, TValue> & {
  meta?: {
    size?: string | number;
    mobileSize?: string | number;
    minWidth?: string | number;
  };
};
interface DataTableProps$1<TData, TValue> {
  columns: TableColumn$1<TData, TValue>[];
  data: TData[];
  onDelete?: (selectedRows: TData[]) => Promise<void>;
  filterColumn?: string;
  defaultSort?: SortingState;
  columnVisibilityMap?: Record<string, string>;
  className?: string;
  pageSize?: number;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: (options?: unknown) => Promise<unknown>;
  enableRowSelection?: boolean;
  showCheckboxes?: boolean;
  onFilterChange?: (value: string) => void;
  filterValue?: string;
  isLoading?: boolean;
  enableSearch?: boolean;
}
declare function DataTable<TData, TValue>({
  columns,
  data,
  onDelete,
  filterColumn,
  defaultSort,
  className,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  enableRowSelection,
  showCheckboxes,
  onFilterChange,
  filterValue,
  isLoading,
  enableSearch
}: DataTableProps$1<TData, TValue>): JSX$1.Element;
//#endregion
//#region src/components/SplitText.d.ts
interface SegmenterOptions {
  granularity?: "grapheme" | "word" | "sentence";
  localeMatcher?: "lookup" | "best fit";
}
interface SegmentData {
  segment: string;
  index: number;
  input: string;
  isWordLike?: boolean;
}
interface Segments {
  [Symbol.iterator](): IterableIterator<SegmentData>;
}
interface IntlSegmenter {
  segment(input: string): Segments;
}
interface IntlSegmenterConstructor {
  new (locales?: string | string[], options?: SegmenterOptions): IntlSegmenter;
}
declare global {
  interface Intl {
    Segmenter: IntlSegmenterConstructor;
  }
}
interface SplitTextProps {
  text?: string;
  className?: string;
  delay?: number;
  animationFrom?: {
    opacity: number;
    transform: string;
  };
  animationTo?: {
    opacity: number;
    transform: string;
  };
  easing?: SpringConfig["easing"];
  threshold?: number;
  rootMargin?: string;
  textAlign?: "left" | "right" | "center" | "justify" | "start" | "end";
  onLetterAnimationComplete?: () => void;
  onLineCountChange?: (lineCount: number) => void;
}
declare const SplitText: React.FC<SplitTextProps>;
//#endregion
//#region src/components/FormInput.d.ts
declare function FormInput<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({
  field,
  label,
  labelClass,
  inputClass,
  containerClass,
  labelAdjacent,
  placeholder,
  type
}: {
  field: ControllerRenderProps<TFieldValues, TName>;
  label: string;
  labelClass?: string;
  inputClass?: string;
  placeholder?: string;
  containerClass?: string;
  type?: "string" | "number";
  labelAdjacent?: React$1.ReactNode;
}): JSX$1.Element;
//#endregion
//#region src/components/PixelCard.d.ts
declare const VARIANTS: {
  readonly default: {
    readonly gap: 5;
    readonly speed: 35;
    readonly colors: "#f8fafc,#f1f5f9,#cbd5e1";
    readonly noFocus: false;
  };
  readonly blue: {
    readonly gap: 10;
    readonly speed: 25;
    readonly colors: "#e0f2fe,#7dd3fc,#0ea5e9";
    readonly noFocus: false;
  };
  readonly yellow: {
    readonly gap: 3;
    readonly speed: 20;
    readonly colors: "#fef08a,#fde047,#eab308";
    readonly noFocus: false;
  };
  readonly pink: {
    readonly gap: 6;
    readonly speed: 80;
    readonly colors: "#fecdd3,#fda4af,#e11d48";
    readonly noFocus: true;
  };
};
interface PixelCardProps {
  variant?: keyof typeof VARIANTS;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  progress?: number;
  randomness?: number;
  width?: string;
  height?: string;
}
declare function PixelCard({
  variant,
  gap,
  speed,
  colors,
  noFocus,
  className,
  progress,
  randomness,
  width,
  height
}: PixelCardProps): JSX$1.Element;
//#endregion
//#region src/components/FileUpload.d.ts
type FileUploadProps = {
  className?: string;
  onClick?: () => void;
  children: React$1.ReactNode;
  handleFileChange: (event: React$1.ChangeEvent<HTMLInputElement>) => void;
};
declare const FileUpload: React$1.ForwardRefExoticComponent<FileUploadProps & React$1.RefAttributes<HTMLInputElement>>;
//#endregion
//#region src/components/MultiSelect.d.ts
type MultiSelectItem<T extends string> = T | {
  label: string;
  value: T;
};
interface MultiSelectProps<T extends string> {
  items: MultiSelectItem<T>[];
  label?: string;
  placeholder?: string;
  onSelectedValuesChange?: (values: T[]) => void;
  renderSelectedValues?: (values: T[], placeholder?: string, items?: MultiSelectItem<T>[]) => React$1.ReactNode;
  className?: string;
  itemClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  selectIcon?: React$1.ReactNode;
  popoverClassName?: string;
  selectItemsClassName?: string;
  selectedValues: T[];
  setSelectedValues: (values: T[]) => void;
  renderItemContent?: (value: T, defaultContent: React$1.ReactNode, isSelected: boolean) => React$1.ReactNode;
  popoverHeader?: React$1.ReactNode;
  searchPlaceholder?: string;
  searchEmptyText?: string;
  disabled?: boolean;
  showSelectedValues?: boolean;
  showItemCheckboxes?: boolean;
  onOpenChange?: (open: boolean) => void;
}
declare function MultiSelect<T extends string>({
  items,
  label,
  placeholder,
  onSelectedValuesChange,
  renderSelectedValues,
  className,
  selectIcon,
  itemClassName,
  labelClassName,
  selectClassName,
  popoverClassName,
  selectItemsClassName,
  selectedValues,
  setSelectedValues,
  renderItemContent,
  popoverHeader,
  searchPlaceholder,
  searchEmptyText,
  disabled,
  showSelectedValues,
  showItemCheckboxes,
  onOpenChange
}: MultiSelectProps<T>): JSX$1.Element;
//#endregion
//#region src/components/DropdownPopup.d.ts
interface DropdownProps {
  keyPrefix?: string;
  trigger: React$1.ReactNode;
  items: MenuItemProps[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  className?: string;
  iconClassName?: string;
  itemClassName?: string;
  sameWidth?: boolean;
  anchor?: {
    x: string;
    y: string;
  };
  gutter?: number;
  modal?: boolean;
  portal?: boolean;
  portalElement?: Ariakit.MenuProps["portalElement"];
  preserveTabOrder?: boolean;
  focusLoop?: boolean;
  menuId: string;
  mountByState?: boolean;
  unmountOnHide?: boolean;
  finalFocus?: React$1.RefObject<HTMLElement>;
}
declare const DropdownPopup: React$1.FC<DropdownProps>;
//#endregion
//#region src/components/DelayedRender.d.ts
interface DelayedRenderProps {
  delay: number;
  children: React$1.ReactNode;
}
declare const DelayedRender: ({
  delay,
  children
}: DelayedRenderProps) => React$1.ReactNode;
//#endregion
//#region src/components/ThemeSelector.d.ts
declare global {
  interface Window {
    /** Last accepted change per appearance control. Global rather than a ref so
    *  the throttle survives the selector remounting, which the auth routes do
    *  on every navigation between login, register and verification. */
    lastThemeChange?: Record<string, number>;
  }
}
declare const ThemeSelector: ({
  returnThemeOnly
}: {
  returnThemeOnly?: boolean;
}) => JSX$1.Element;
//#endregion
//#region src/components/InfoHoverCard.d.ts
type InfoHoverCardProps = {
  side?: ESide;
  text: string;
  icon?: "help" | "info";
  /** Custom trigger content replacing the stock icon (e.g. a status glyph);
  *  the hover text stays the trigger's accessible name either way. */
  children?: ReactNode;
};
declare const InfoHoverCard: ({
  side,
  text,
  icon,
  children
}: InfoHoverCardProps) => JSX$1.Element;
//#endregion
//#region src/components/CheckboxButton.d.ts
declare const CheckboxButton: React$2.ForwardRefExoticComponent<{
  icon?: React$2.ReactNode;
  label: string;
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  isCheckedClassName?: string;
  setValue?: (values: {
    e?: React$2.ChangeEvent<HTMLInputElement>;
    value: boolean | string;
  }) => void;
} & React$2.RefAttributes<HTMLInputElement>>;
//#endregion
//#region src/components/DialogTemplate.d.ts
type SelectionProps$1 = {
  selectHandler?: () => void;
  selectClasses?: string;
  selectText?: string;
};
type DialogTemplateProps$1 = {
  title: string;
  description?: string;
  main?: ReactNode;
  buttons?: ReactNode;
  leftButtons?: ReactNode;
  selection?: SelectionProps$1;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  showCloseButton?: boolean;
  showCancelButton?: boolean;
};
declare const DialogTemplate: ForwardRefExoticComponent<DialogTemplateProps$1 & RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/SelectDropDown.d.ts
type SelectDropDownProps = {
  id?: string;
  title?: string;
  disabled?: boolean;
  value: string | null | Option | OptionWithIcon;
  setValue: DropdownValueSetter | ((value: string) => void);
  tabIndex?: number;
  availableValues?: string[] | Option[] | OptionWithIcon[];
  emptyTitle?: boolean;
  showAbove?: boolean;
  showLabel?: boolean;
  iconSide?: "left" | "right";
  optionIconSide?: "left" | "right";
  renderOption?: () => React$1.ReactNode;
  containerClassName?: string;
  currentValueClass?: string;
  optionsListClass?: string;
  optionsClass?: string;
  subContainerClassName?: string;
  className?: string;
  placeholder?: string;
  searchClassName?: string;
  searchPlaceholder?: string;
  showOptionIcon?: boolean;
};
declare function SelectDropDown({
  title: _title,
  value,
  disabled,
  setValue,
  availableValues,
  showAbove,
  showLabel,
  emptyTitle,
  iconSide,
  optionIconSide,
  placeholder,
  containerClassName,
  optionsListClass,
  optionsClass,
  currentValueClass,
  subContainerClassName,
  className,
  renderOption,
  searchClassName,
  searchPlaceholder,
  showOptionIcon
}: SelectDropDownProps): JSX$1.Element;
//#endregion
//#region src/components/ControlCombobox.d.ts
interface ControlComboboxProps {
  selectedValue: string;
  displayValue?: string;
  items: OptionWithIcon[];
  setValue: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  ariaLabel: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  searchPlaceholder?: string;
  selectPlaceholder?: string;
  isCollapsed: boolean;
  SelectIcon?: React.ReactNode;
  containerClassName?: string;
  iconClassName?: string;
  showCarat?: boolean;
  className?: string;
  disabled?: boolean;
  iconSide?: "left" | "right";
  selectId?: string;
  placement?: Ariakit.SelectStoreProps["placement"];
  popoverClassName?: string;
  matchTriggerWidth?: boolean;
  /** `field` matches the `Input` primitive so this can sit in a form row. */
  variant?: "default" | "field";
  gutter?: number;
  /**
  * Radix dialogs trap focus, so a portaled popover rendered outside the dialog
  * cannot receive typing in its search field. Pass `false` from inside a dialog
  * to keep the list in the dialog, and give that dialog `overflow-visible` so
  * the popover is not clipped.
  */
  portal?: boolean;
  /** Told when the popover opens and closes, for hosts that must behave
  *  differently while it is up — e.g. a focus-trapped panel whose own Escape
  *  handler must not fire while an open popover owns the key. */
  onOpenChange?: (open: boolean) => void;
}
declare function ControlCombobox({
  selectedValue,
  displayValue,
  items,
  setValue,
  onBlur,
  ariaLabel,
  ariaInvalid,
  ariaDescribedBy,
  searchPlaceholder,
  selectPlaceholder,
  containerClassName,
  isCollapsed,
  SelectIcon,
  showCarat,
  className,
  disabled,
  iconClassName,
  iconSide,
  selectId,
  placement,
  popoverClassName,
  matchTriggerWidth,
  variant,
  gutter,
  portal,
  onOpenChange
}: ControlComboboxProps): JSX$1.Element;
declare const ControlComboboxMemo: MemoExoticComponent<typeof ControlCombobox>;
//#endregion
//#region src/components/EmptyState.d.ts
interface EmptyStateProps {
  /** Decorative, rendered inside the circular surface at a fixed size. */
  icon: LucideIcon;
  /** Omitted for the "nothing matched your filter" shape, which is a line on its own. */
  title?: string;
  description?: string;
  /** A single call to action, e.g. a retry button. */
  action?: ReactNode;
  className?: string;
}
/**
* The panel empty state: a bordered card with a circular icon, a title and a line of
* explanation. Owned here because bookmarks, memories and schedules each render the
* same card, and three copies of one appearance means a theme or spacing change has
* to be made three times and will eventually be made twice.
*/
declare function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps): JSX.Element;
//#endregion
//#region src/components/TimePicker.d.ts
interface TimeColumnProps {
  label: string;
  values: number[];
  selected: number;
  format: (value: number) => string;
  onSelect: (value: number) => void;
}
/**
* One scrolling column of the picker. Radio semantics rather than a listbox of
* buttons: the options are mutually exclusive values, and a roving tabindex keeps
* the column a single tab stop that arrow keys move within, which is what a
* keyboard user expects from a set of 60 minutes.
*/
declare function TimeColumn({
  label,
  values,
  selected,
  format,
  onSelect
}: TimeColumnProps): JSX.Element;
interface TimePickerLabels {
  hour: string;
  minute: string;
  meridiem: string;
  am: string;
  pm: string;
}
interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (next: {
    hour: number;
    minute: number;
  }) => void;
  /** Column headings and the meridiem option names. Passed in rather than looked
  *  up here so this primitive carries no translation keys of its own. */
  labels: TimePickerLabels;
  id?: string;
  labelledBy?: string;
  className?: string;
  locale?: string;
  /** Required rather than guessed from `locale`. The host app resolves its "Clock
  *  format" setting once and passes the answer down; deriving a second answer here
  *  would let the picker and the summary beside it disagree about the same time. */
  hour12: boolean;
}
/**
* Hour, minute and (where the locale uses one) meridiem columns behind a single
* trigger. Replaces `<input type="time">`, whose rendering the browser owns and
* which cannot be brought in line with the rest of the form.
*/
declare function TimePicker({
  hour,
  minute,
  onChange,
  labels,
  id,
  labelledBy,
  className,
  locale,
  hour12
}: TimePickerProps): JSX.Element;
interface MinutePickerProps {
  minute: number;
  onChange: (minute: number) => void;
  label: string;
  id?: string;
  labelledBy?: string;
  className?: string;
}
/**
* A single minutes column behind the same trigger, so an hour-less cadence reads
* as the same picker with its other columns dropped rather than a different widget.
*/
declare function MinutePicker({
  minute,
  onChange,
  label,
  id,
  labelledBy,
  className
}: MinutePickerProps): JSX.Element;
//#endregion
//#region src/components/OGDialogTemplate.d.ts
type SelectionProps = {
  selectHandler?: () => void;
  selectClasses?: string;
  selectText?: string | ReactNode;
  isLoading?: boolean;
};
type DialogTemplateProps = {
  title: string;
  description?: string;
  main?: ReactNode;
  buttons?: ReactNode;
  leftButtons?: ReactNode;
  /**
  * Selection button configuration. Can be either:
  * - An object with selectHandler, selectClasses, selectText, isLoading (legacy)
  * - A ReactNode for custom selection component
  * @example
  * // Legacy usage
  * selection={{ selectHandler: () => {}, selectText: 'Confirm' }}
  * @example
  * // Custom component
  * selection={<Button onClick={handleConfirm}>Confirm</Button>}
  */
  selection?: SelectionProps | ReactNode;
  className?: string;
  overlayClassName?: string;
  headerClassName?: string;
  mainClassName?: string;
  footerClassName?: string;
  showCloseButton?: boolean;
  showCancelButton?: boolean;
  onClose?: () => void;
};
declare const OGDialogTemplate: ForwardRefExoticComponent<DialogTemplateProps & RefAttributes<HTMLDivElement>>;
//#endregion
//#region src/components/InputWithDropDown.d.ts
declare const InputWithDropdown: React$2.ForwardRefExoticComponent<React$2.InputHTMLAttributes<HTMLInputElement> & {
  options: string[];
  onSelect?: (value: string) => void;
} & React$2.RefAttributes<HTMLInputElement>>;
//#endregion
//#region src/components/AnimatedSearchInput.d.ts
declare const AnimatedSearchInput: ({
  value,
  onChange,
  isSearching: searching,
  placeholder
}: {
  value?: string;
  onChange: (e: React$1.ChangeEvent<HTMLInputElement>) => void;
  isSearching?: boolean;
  placeholder: string;
}) => JSX$1.Element;
//#endregion
//#region src/components/DataTable/DataTable.types.d.ts
type ProcessedDataRow<TData> = TData & {
  _id: string;
  _index: number;
};
type TableColumnDef<TData, TValue> = ColumnDef<ProcessedDataRow<TData>, TValue>;
type TableColumn<TData, TValue> = ColumnDef<TData, TValue> & {
  accessorKey?: string | number;
  meta?: {
    /** Column width as a percentage (1-100). Used for proportional column sizing. */width?: number; /** Fixed column size in pixels (e.g., '150px'). Takes precedence over width percentage. */
    size?: string | number; /** Fixed column size for mobile screens. Falls back to size if not specified. */
    mobileSize?: string | number; /** Minimum width for the column (e.g., '80px'). */
    minWidth?: string | number; /** Priority for flexible column width distribution. Higher priority = more space. Default is 1. */
    priority?: number; /** Additional CSS classes to apply to the column cells and header. */
    className?: string;
    /**
    * When true, this column will be hidden on mobile devices (viewport < 768px).
    * This is useful for hiding less critical information on smaller screens.
    *
    * **Usage Example:**
    * ```typescript
    * {
    *   accessorKey: 'createdAt',
    *   header: 'Date Created',
    *   cell: ({ row }) => formatDate(row.original.createdAt),
    *   meta: {
    *     desktopOnly: true,  // Hide this column on mobile
    *     width: 20,
    *     className: 'min-w-[6rem]'
    *   }
    * }
    * ```
    *
    * The column will be completely hidden including:
    * - Header cell
    * - Data cells
    * - Skeleton loading cells
    */
    desktopOnly?: boolean;
    /**
    * When true, this column's cells will use `<th scope="row">` instead of `<td>`.
    * This is important for accessibility as it marks the cell as a row header,
    * providing context for screen readers about what each row represents.
    *
    * Typically the first column (e.g., name, title) should be marked as a row header.
    *
    * **Usage Example:**
    * ```typescript
    * {
    *   accessorKey: 'title',
    *   header: 'Conversation Name',
    *   cell: ({ row }) => row.original.title,
    *   meta: {
    *     isRowHeader: true  // Mark this column as row headers
    *   }
    * }
    * ```
    */
    isRowHeader?: boolean;
  };
};
interface DataTableConfig {
  selection?: {
    enableRowSelection?: boolean;
    showCheckboxes?: boolean;
  };
  search?: {
    enableSearch?: boolean;
    debounce?: number;
    filterColumn?: string;
  };
  skeleton?: {
    count?: number;
  };
  virtualization?: {
    overscan?: number;
    minRows?: number;
    rowHeight?: number;
    fastOverscanMultiplier?: number;
  };
  pinning?: {
    enableColumnPinning?: boolean;
  };
}
interface DataTableProps<TData extends Record<string, unknown>, TValue> {
  columns: TableColumn<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  className?: string;
  isLoading?: boolean;
  isFetching?: boolean;
  config?: DataTableConfig;
  onDelete?: (selectedRows: TData[]) => Promise<void>;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  defaultSort?: SortingState;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => Promise<unknown>;
  sorting?: SortingState;
  onSortingChange?: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
  conversationIndex?: number;
  customActionsRenderer?: (params: {
    selectedCount: number;
    selectedRows: TData[];
    table: Table$1<ProcessedDataRow<TData>>;
  }) => React$1.ReactNode;
}
interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}
//#endregion
//#region src/components/DataTable/DataTable.d.ts
declare function DataTable$1<TData extends Record<string, unknown>, TValue>({
  columns,
  data,
  getRowId: getRowIdProp,
  className,
  isLoading,
  isFetching,
  config,
  filterValue,
  onFilterChange,
  defaultSort,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  sorting,
  onSortingChange,
  customActionsRenderer
}: DataTableProps<TData, TValue>): JSX$1.Element;
//#endregion
//#region src/hooks/useLocalize.d.ts
type TranslationKeys = string;
/** Language lifecycle is managed by the host app — do not add i18n.changeLanguage() calls here. */
declare function useLocalize(): (phraseKey: TranslationKeys, options?: TOptions) => string;
//#endregion
//#region src/store.d.ts
declare const chatDirectionAtom: PrimitiveAtom<string> & {
  init: string;
};
declare const fontSizeAtom: PrimitiveAtom<string> & {
  init: string;
};
type ToastState = {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
  showIcon: boolean; /** Milliseconds until the toast closes itself, or `Infinity` to require a dismissal. */
  duration: number; /** Increments per shown toast, so each one gets its own close deadline. */
  id: number;
};
declare const toastState: PrimitiveAtom<ToastState> & {
  init: ToastState;
};
//#endregion
//#region src/hooks/useToast.d.ts
declare function useToast(showDelay?: number): {
  toast: ToastState;
  onOpenChange: (open: boolean, id: number) => void;
  showToast: ({
    message,
    severity,
    showIcon,
    duration,
    status
  }: TShowToast) => void;
};
//#endregion
//#region src/hooks/useAvatar.d.ts
declare const useAvatar: (user: TUser | undefined) => string;
//#endregion
//#region src/hooks/useCombobox.d.ts
declare function useCombobox({
  value,
  options
}: {
  value: string;
  options: Array<OptionWithIcon | MentionOption>;
}): {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  matches: (OptionWithIcon | MentionOption)[];
};
//#endregion
//#region src/hooks/useMediaQuery.d.ts
/**
* Resolves the query on the FIRST render rather than after a passive effect.
* Callers that branch once at mount — freezing an entrance animation, picking
* a layout before paint — read the deferred value as "no match" and never see
* the correction, which is how `prefers-reduced-motion` came to be ignored.
*/
declare function useMediaQuery(query: string): boolean;
//#endregion
//#region src/hooks/useDelayedRender.d.ts
declare const useDelayedRender: (delay: number) => (fn: () => ReactNode) => ReactNode;
//#endregion
//#region src/hooks/useInputModality.d.ts
/**
* Tracks whether the user is currently interacting via pointer or keyboard and
* reflects it on `document.documentElement` as `data-input-modality`. Lets CSS
* gate focus styling so text inputs only show a focus ring for keyboard users
* (text inputs match `:focus-visible` on pointer focus too, which CSS alone
* cannot distinguish). Ref-counted so concurrent mounts share one listener set.
*/
declare function useInputModality(): void;
//#endregion
//#region src/hooks/useOnClickOutside.d.ts
type Handler = () => void;
declare function useOnClickOutside(ref: RefObject<HTMLElement>, handler: Handler, excludeIds: string[], customCondition?: (target: EventTarget | Element | null) => boolean): void;
//#endregion
//#region src/svgs/ArchiveIcon.d.ts
declare function ArchiveIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/Blocks.d.ts
declare function Blocks({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/Plugin.d.ts
declare function Plugin({
  className,
  ...props
}: SVGProps<SVGSVGElement>): JSX$1.Element;
//#endregion
//#region src/svgs/GPTIcon.d.ts
declare function GPTIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/EditIcon.d.ts
type IconProps = {
  className?: string;
  size?: string;
};
declare const EditIcon: React$1.ForwardRefExoticComponent<IconProps & React$1.RefAttributes<SVGSVGElement>>;
//#endregion
//#region src/svgs/DataIcon.d.ts
declare function DataIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/Sidebar.d.ts
declare function Sidebar({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/MobileSidebar.d.ts
declare function MobileSidebar({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/Spinner.d.ts
interface SpinnerProps {
  className?: string;
  size?: string | number;
  color?: string;
  bgOpacity?: number;
  speed?: number;
}
/**
* Accessible loading spinner.
*
* Animation is defined in Spinner.css (extracted into the package style bundle),
* never an embedded <style> tag: stylesheet text inside the SVG becomes part of
* the ancestor's textContent, leaking raw CSS into label readouts of any control
* that wraps a spinner.
*/
declare function Spinner({
  className,
  size,
  color,
  bgOpacity,
  speed
}: SpinnerProps): JSX$1.Element;
//#endregion
//#region src/svgs/Clipboard.d.ts
declare function Clipboard({
  className,
  size
}: {
  className?: string | undefined;
  size?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/CheckMark.d.ts
declare function CheckMark({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/VerifiedIcon.d.ts
/** Verified mark for a first-party item: a scalloped badge filled with
*  `currentColor` (pair it with `text-status-verified`) carrying a check in
*  `text-on-status`. The badge is painted, never stroked — an outline would
*  read as a light halo against the card it sits on. */
declare function VerifiedIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>): JSX$1.Element;
//#endregion
//#region src/svgs/CrossIcon.d.ts
declare function CrossIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/LogOutIcon.d.ts
declare function LogOutIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/CustomMinimalIcon.d.ts
declare function CustomMinimalIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/LightningIcon.d.ts
declare function LightningIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/AttachmentIcon.d.ts
declare function AttachmentIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/MessagesSquared.d.ts
declare function MessagesSquared({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/StopGeneratingIcon.d.ts
declare function StopGeneratingIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/RegenerateIcon.d.ts
declare function RegenerateIcon({
  className,
  size
}: {
  className?: string | undefined;
  size?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/ContinueIcon.d.ts
declare function ContinueIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/GoogleIcon.d.ts
declare function GoogleIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/FacebookIcon.d.ts
declare function FacebookIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/OpenIDIcon.d.ts
declare function OpenIDIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/GithubIcon.d.ts
declare function GithubIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/DiscordIcon.d.ts
declare function DiscordIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/AppleIcon.d.ts
declare function AppleIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/SamlIcon.d.ts
declare function SamlIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/AnthropicIcon.d.ts
declare function AnthropicIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/SendIcon.d.ts
declare function SendIcon({
  size,
  className
}: {
  size?: number | undefined;
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/LinkIcon.d.ts
declare function LinkIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/DotsIcon.d.ts
declare function DotsIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/GearIcon.d.ts
interface GearIconProps {
  className?: string;
}
declare const GearIcon: React$1.FC<GearIconProps>;
//#endregion
//#region src/svgs/PinIcon.d.ts
declare function PinIcon({
  unpin
}: {
  unpin?: boolean;
}): JSX$1.Element;
//#endregion
//#region src/svgs/TrashIcon.d.ts
type TrashIconProps = {
  className?: string;
};
declare function TrashIcon({
  className
}: TrashIconProps): JSX$1.Element;
//#endregion
//#region src/svgs/MinimalPlugin.d.ts
declare function MinimalPlugin({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/AzureMinimalIcon.d.ts
declare function AzureMinimalIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/OpenAIMinimalIcon.d.ts
declare function OpenAIMinimalIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/ChatGPTMinimalIcon.d.ts
declare function ChatGPTMinimalIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/PaLMinimalIcon.d.ts
declare function PaLMinimalIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/PaLMIcon.d.ts
declare function PaLMIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/CodeyIcon.d.ts
declare function CodeyIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/GeminiIcon.d.ts
declare function GeminiIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/GoogleMinimalIcon.d.ts
declare function GoogleMinimalIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/AnthropicMinimalIcon.d.ts
declare function AnthropicMinimalIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/ListeningIcon.d.ts
type ListeningIconProps = {
  className?: string;
};
declare function ListeningIcon({
  className
}: ListeningIconProps): JSX$1.Element;
//#endregion
//#region src/svgs/VolumeIcon.d.ts
declare function VolumeIcon({
  className,
  size
}: {
  className?: string | undefined;
  size?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/VolumeMuteIcon.d.ts
declare function VolumeMuteIcon({
  className,
  size
}: {
  className?: string | undefined;
  size?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/SendMessageIcon.d.ts
declare function SendMessageIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/UserIcon.d.ts
declare function UserIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/LockIcon.d.ts
declare function LockIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/NewChatIcon.d.ts
declare function NewChatIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/ExperimentIcon.d.ts
declare function ExperimentIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/GoogleIconChat.d.ts
declare function Google({
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/BirthdayIcon.d.ts
declare function BirthdayIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/AssistantIcon.d.ts
declare function AssistantIcon({
  className,
  size
}: {
  className?: string;
  size?: string | number;
}): JSX$1.Element;
//#endregion
//#region src/svgs/Sparkles.d.ts
declare function Sparkles({
  className,
  size
}: {
  className?: string | undefined;
  size?: number | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/SpeechIcon.d.ts
type SpeechIconProps = {
  className?: string;
};
declare function SpeechIcon({
  className
}: SpeechIconProps): JSX$1.Element;
//#endregion
//#region src/svgs/SaveIcon.d.ts
type SaveIconProps = {
  size?: string | number;
  className?: string;
};
declare function SaveIcon({
  size,
  className
}: SaveIconProps): JSX$1.Element;
//#endregion
//#region src/svgs/CircleHelpIcon.d.ts
declare function CircleHelpIcon({
  className,
  size
}: {
  className?: string | undefined;
  size?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/BedrockIcon.d.ts
declare function BedrockIcon({
  size,
  className
}: {
  size?: number;
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/ThumbUpIcon.d.ts
declare function ThumbUpIcon({
  className,
  size,
  bold
}: {
  className?: string | undefined;
  size?: string | undefined;
  bold?: boolean | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/ThumbDownIcon.d.ts
declare function ThumbDownIcon({
  className,
  size,
  bold
}: {
  className?: string | undefined;
  size?: string | undefined;
  bold?: boolean | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/XAIcon.d.ts
declare function XAIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/PersonalizationIcon.d.ts
declare function PersonalizationIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/MCPIcon.d.ts
declare function MCPIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/VectorIcon.d.ts
declare function VectorIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/svgs/SquirclePlusIcon.d.ts
declare function SquirclePlusIcon(): JSX$1.Element;
//#endregion
//#region src/svgs/AudioPaths.d.ts
declare function AudioPaths(): JSX$1.Element;
//#endregion
//#region src/svgs/CodePaths.d.ts
declare function CodePaths(): JSX$1.Element;
//#endregion
//#region src/svgs/FileIcon.d.ts
declare function FileIcon({
  file,
  fileType
}: {
  file?: Partial<TFile> & {
    progress?: number;
  };
  fileType: {
    fill: string;
    paths: React.FC;
    title: string;
  };
}): JSX$1.Element;
//#endregion
//#region src/svgs/FilePaths.d.ts
declare function FilePaths(): JSX$1.Element;
//#endregion
//#region src/svgs/SheetPaths.d.ts
declare function SheetPaths(): JSX$1.Element;
//#endregion
//#region src/svgs/TextPaths.d.ts
declare function TextPaths(): JSX$1.Element;
//#endregion
//#region src/svgs/VideoPaths.d.ts
declare function VideoPaths(): JSX$1.Element;
//#endregion
//#region src/svgs/SharePointIcon.d.ts
declare function SharePointIcon({
  className
}: {
  className?: string | undefined;
}): JSX$1.Element;
//#endregion
//#region src/svgs/MoonshotIcon.d.ts
declare function MoonshotIcon({
  className
}: {
  className?: string;
}): JSX$1.Element;
//#endregion
//#region src/icons/provider/Icon.d.ts
interface ProviderIconProps {
  provider?: ProviderId | null;
  model?: string | null;
  size?: number;
  className?: string;
}
declare const ProviderIcon: NamedExoticComponent<ProviderIconProps>;
//#endregion
//#region src/icons/provider/Avatar.d.ts
interface ProviderAvatarProps {
  provider?: ProviderId | null;
  model?: string | null;
  size?: number;
  className?: string;
  /** Overlay content positioned against the tile, such as an error badge. */
  children?: ReactNode;
}
declare const ProviderAvatar: NamedExoticComponent<ProviderAvatarProps>;
//#endregion
//#region src/icons/provider/registry.d.ts
type ProviderArtComponent = ComponentType<SVGProps<SVGSVGElement> & {
  size?: number;
}>;
type ProviderArt = {
  kind: "component";
  Component: ProviderArtComponent;
} | {
  kind: "asset";
  src: string;
};
interface ProviderIconDef {
  art: ProviderArt;
  label: string;
  /** Avatar tile background. Absent means the tile renders with no background. */
  brandColor?: string;
  /** Art inherits currentColor and follows the active theme. */
  mono?: boolean;
  /** Per provider layout correction, replacing the old knownEndpointClasses map. */
  className?: string;
  /** Model level refinement merged over the base definition. */
  byModel?: (model: string) => Partial<ProviderIconDef> | undefined;
}
declare const providerIcons: Record<ProviderId, ProviderIconDef>;
/** Merges any model level refinement over the base definition for a provider. */
declare function getProviderIconDef(provider?: ProviderId | null, model?: string | null): ProviderIconDef;
//#endregion
//#region src/utils/utils.d.ts
declare const cn: (...inputs: ClassValue[]) => string;
//#endregion
//#region src/utils/theme.d.ts
declare const applyFontSize: (val: string) => void;
declare const getInitialTheme: () => string;
//#endregion
//#region src/utils/composer.d.ts
/**
* Shared composer-surface appearance: every input surface that should read as
* "the composer" (main chat form, subagent control footer) draws its border,
* background, and text colors from this one semantic decision. Layout, radius,
* padding, and feature-specific overrides stay with each owner.
*/
declare const composerSurfaceClasses: () => string;
/** Elevation states for the composer surface. `within` is the CSS-only
*  equivalent of the managed focused/blurred pair for surfaces that do not
*  track focus in state. */
declare const composerSurfaceShadow: {
  readonly focused: "shadow-lg";
  readonly blurred: "shadow-md";
  readonly within: "shadow-md focus-within:shadow-lg";
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
declare const composerSubmitClasses: () => string;
/**
* Shared appearance for a labeled control in the composer's action row — the
* capability checkboxes, the MCP selector, the code-approval selector. Border,
* radius, height, spacing and elevation are one decision here so a row of them
* reads as a single set of controls no matter which primitive each is built
* from. Width, responsive label collapsing and selected/open fills stay with
* each owner.
*/
declare const composerControlClasses: () => string;
//#endregion
//#region src/utils/cloudfront.d.ts
type CloudFrontCookieRefreshOptions = {
  getAuthorizationHeader?: () => string | undefined;
};
declare function configureCloudFrontCookieRefresh(startupConfig?: Pick<TStartupConfig, "cloudFront"> | null, options?: CloudFrontCookieRefreshOptions): void;
declare function isCloudFrontMediaUrl(url: string | null | undefined, startupConfig?: Pick<TStartupConfig, "cloudFront"> | null): boolean;
declare function withCloudFrontCacheBuster(url: string): string;
declare function refreshCloudFrontCookiesOnce(): Promise<boolean>;
declare function installCloudFrontImageRetry(startupConfig?: Pick<TStartupConfig, "cloudFront"> | null, options?: CloudFrontCookieRefreshOptions): () => void;
//#endregion
//#region src/utils/logger.d.ts
type LogFunction = (...args: unknown[]) => void;
declare const logger: {
  log: LogFunction;
  dir: LogFunction;
  warn: LogFunction;
  info: LogFunction;
  error: LogFunction;
  debug: LogFunction;
};
//#endregion
//#region src/Providers/ToastContext.d.ts
type ToastContextType = {
  showToast: ({
    message,
    severity,
    showIcon,
    duration
  }: TShowToast) => void;
};
declare const ToastContext: Context<ToastContextType>;
declare function useToastContext(): ToastContextType;
declare function ToastProvider({
  children
}: {
  children: ReactNode;
}): JSX$1.Element;
//#endregion
//#region src/theme/types/index.d.ts
/**
* Defines the color channels. Passed to the context from each app.
* RGB values should be in format "255 255 255" (space-separated)
*/
interface IThemeRGB {
  "rgb-text-primary"?: string;
  "rgb-text-secondary"?: string;
  "rgb-text-secondary-alt"?: string;
  "rgb-text-tertiary"?: string;
  "rgb-text-muted"?: string;
  "rgb-text-warning"?: string;
  "rgb-text-destructive"?: string;
  /** Bright and dipped stops of the in-flight label sweep (`.shimmer`). Their
  *  opacities stay in CSS as `--shimmer-*-alpha`, the way the border roles
  *  keep `--border-*-alpha`. */
  "rgb-shimmer-base"?: string;
  "rgb-shimmer-dip"?: string;
  "rgb-link"?: string;
  "rgb-link-hover"?: string;
  "rgb-link-visited"?: string;
  "rgb-accent-primary"?: string;
  "rgb-accent-primary-hover"?: string;
  "rgb-ring-primary"?: string;
  "rgb-header-primary"?: string;
  "rgb-header-hover"?: string;
  "rgb-header-button-hover"?: string;
  "rgb-surface-active"?: string;
  "rgb-surface-active-alt"?: string;
  "rgb-surface-hover"?: string;
  "rgb-surface-hover-alt"?: string;
  "rgb-surface-composer-hover"?: string;
  "rgb-surface-primary"?: string;
  "rgb-chart-widget-surface"?: string;
  "rgb-chart-widget-stroke"?: string;
  "rgb-surface-primary-alt"?: string;
  "rgb-surface-primary-contrast"?: string;
  "rgb-surface-secondary"?: string;
  "rgb-surface-secondary-alt"?: string;
  "rgb-surface-tertiary"?: string;
  "rgb-surface-tertiary-alt"?: string;
  "rgb-surface-dialog"?: string;
  "rgb-surface-overlay"?: string;
  "rgb-surface-submit"?: string;
  "rgb-surface-submit-hover"?: string;
  "rgb-surface-destructive"?: string;
  "rgb-surface-destructive-hover"?: string;
  "rgb-surface-chat"?: string;
  "rgb-surface-code"?: string;
  "rgb-surface-inverted"?: string;
  "rgb-surface-inverted-hover"?: string;
  "rgb-text-inverted"?: string;
  "rgb-surface-fixed"?: string;
  "rgb-surface-fixed-hover"?: string;
  "rgb-text-fixed"?: string;
  "rgb-border-light"?: string;
  "rgb-border-medium"?: string;
  "rgb-border-medium-alt"?: string;
  "rgb-border-heavy"?: string;
  "rgb-border-xheavy"?: string;
  "rgb-border-destructive"?: string;
  "rgb-status-success"?: string;
  "rgb-status-success-subtle"?: string;
  "rgb-status-success-border"?: string;
  "rgb-status-success-strong"?: string;
  "rgb-status-info"?: string;
  "rgb-status-info-subtle"?: string;
  "rgb-status-info-border"?: string;
  "rgb-status-info-strong"?: string;
  "rgb-status-warning"?: string;
  "rgb-status-warning-subtle"?: string;
  "rgb-status-warning-border"?: string;
  "rgb-status-warning-strong"?: string;
  "rgb-status-error"?: string;
  "rgb-status-error-subtle"?: string;
  "rgb-status-error-border"?: string;
  "rgb-status-error-strong"?: string;
  "rgb-status-neutral"?: string;
  "rgb-status-neutral-subtle"?: string;
  "rgb-status-neutral-border"?: string;
  /**
  * Solid fill of the verified mark — the badge a first-party item carries next
  * to its name. The one status with no family around it: the mark is the only
  * thing it paints, so there is no subtle fill, border or text weight to go
  * with it. Blue rather than a reuse of `status-success-strong`, because a
  * green check is the selected/complete cue everywhere else in the product
  * (including the selected-tool check on the very same card) while blue is the
  * cross-product convention for provenance. It carries `text-on-status`.
  * A theme that repaints the mark's surroundings — the old
  * `status-success-strong` fill, the check, or the card surfaces — keeps the
  * mark on that success fill, which is what it wore before this token existed.
  */
  "rgb-status-verified"?: string;
  "rgb-text-on-status"?: string;
  "rgb-brand-purple"?: string;
  /**
  * Code syntax highlighting. Declared here rather than left as literals in the
  * stylesheet so a palette stays in one place, is covered by the registry's
  * completeness check, and can be contrast-tested.
  */
  "rgb-syntax-text"?: string;
  "rgb-syntax-comment"?: string;
  "rgb-syntax-meta"?: string;
  "rgb-syntax-builtin"?: string;
  "rgb-syntax-keyword"?: string;
  "rgb-syntax-string"?: string;
  "rgb-syntax-attr"?: string;
  "rgb-syntax-title"?: string;
  /**
  * Categorical data-visualisation scale. Slots carry series identity only — the
  * order is the colour-vision-deficiency safety mechanism and must not be
  * reshuffled. Reserved status colors never appear here.
  */
  "rgb-series-1"?: string;
  "rgb-series-2"?: string;
  "rgb-series-3"?: string;
  "rgb-series-4"?: string;
  "rgb-series-5"?: string;
  "rgb-series-6"?: string;
  "rgb-series-7"?: string;
  "rgb-series-8"?: string;
  /**
  * Unchecked track of the shared `Switch`. A control state rather than a
  * palette entry, but it lives here because the package's own control renders
  * it: left in the application stylesheet, a consumer of `@librechat/client`
  * got a switch with no track at all.
  */
  "rgb-switch-unchecked"?: string;
  "rgb-presentation"?: string;
}
/**
* Name of the CSS variables used in tailwind.config
*/
interface IThemeVariables {
  "--text-primary": string;
  "--text-secondary": string;
  "--text-secondary-alt": string;
  "--text-tertiary": string;
  "--text-muted": string;
  "--text-warning": string;
  "--text-destructive": string;
  "--shimmer-base": string;
  "--shimmer-dip": string;
  "--link": string;
  "--link-hover": string;
  "--link-visited": string;
  "--accent-primary": string;
  "--accent-primary-hover": string;
  "--ring-primary": string;
  "--header-primary": string;
  "--header-hover": string;
  "--header-button-hover": string;
  "--surface-active": string;
  "--surface-active-alt": string;
  "--surface-hover": string;
  "--surface-hover-alt": string;
  "--surface-composer-hover": string;
  "--surface-primary": string;
  "--chart-widget-surface": string;
  "--chart-widget-stroke": string;
  "--surface-primary-alt": string;
  "--surface-primary-contrast": string;
  "--surface-secondary": string;
  "--surface-secondary-alt": string;
  "--surface-tertiary": string;
  "--surface-tertiary-alt": string;
  "--surface-dialog": string;
  "--surface-overlay": string;
  "--surface-submit": string;
  "--surface-submit-hover": string;
  "--surface-destructive": string;
  "--surface-destructive-hover": string;
  "--surface-chat": string;
  "--surface-code": string;
  "--surface-inverted": string;
  "--surface-inverted-hover": string;
  "--text-inverted": string;
  "--surface-fixed": string;
  "--surface-fixed-hover": string;
  "--text-fixed": string;
  "--border-light": string;
  "--border-light-alpha": string;
  "--border-medium": string;
  "--border-medium-alpha": string;
  "--border-medium-alt": string;
  "--border-heavy": string;
  "--border-heavy-alpha": string;
  "--border-xheavy": string;
  "--border-xheavy-alpha": string;
  "--border-destructive": string;
  "--status-success": string;
  "--status-success-subtle": string;
  "--status-success-border": string;
  "--status-success-strong": string;
  "--status-info": string;
  "--status-info-subtle": string;
  "--status-info-border": string;
  "--status-info-strong": string;
  "--status-warning": string;
  "--status-warning-subtle": string;
  "--status-warning-border": string;
  "--status-warning-strong": string;
  "--status-error": string;
  "--status-error-subtle": string;
  "--status-error-border": string;
  "--status-error-strong": string;
  "--status-neutral": string;
  "--status-neutral-subtle": string;
  "--status-neutral-border": string;
  "--status-verified": string;
  "--text-on-status": string;
  "--brand-purple": string;
  "--syntax-text": string;
  "--syntax-comment": string;
  "--syntax-meta": string;
  "--syntax-builtin": string;
  "--syntax-keyword": string;
  "--syntax-string": string;
  "--syntax-attr": string;
  "--syntax-title": string;
  "--series-1": string;
  "--series-2": string;
  "--series-3": string;
  "--series-4": string;
  "--series-5": string;
  "--series-6": string;
  "--series-7": string;
  "--series-8": string;
  "--switch-unchecked": string;
  "--presentation": string;
}
/**
* Name of the defined colors in the Tailwind theme
*/
interface IThemeColors {
  "text-primary"?: string;
  "text-secondary"?: string;
  "text-secondary-alt"?: string;
  "text-tertiary"?: string;
  "text-muted"?: string;
  "text-warning"?: string;
  "text-destructive"?: string;
  link?: string;
  "link-hover"?: string;
  "link-visited"?: string;
  "accent-primary"?: string;
  "accent-primary-hover"?: string;
  "ring-primary"?: string;
  "header-primary"?: string;
  "header-hover"?: string;
  "header-button-hover"?: string;
  "surface-active"?: string;
  "surface-active-alt"?: string;
  "surface-hover"?: string;
  "surface-hover-alt"?: string;
  "surface-composer-hover"?: string;
  "surface-primary"?: string;
  "chart-widget-surface"?: string;
  "chart-widget-stroke"?: string;
  "surface-primary-alt"?: string;
  "surface-primary-contrast"?: string;
  "surface-secondary"?: string;
  "surface-secondary-alt"?: string;
  "surface-tertiary"?: string;
  "surface-tertiary-alt"?: string;
  "surface-dialog"?: string;
  "surface-overlay"?: string;
  "surface-submit"?: string;
  "surface-submit-hover"?: string;
  "surface-destructive"?: string;
  "surface-destructive-hover"?: string;
  "surface-chat"?: string;
  "surface-code"?: string;
  "surface-inverted"?: string;
  "surface-inverted-hover"?: string;
  "text-inverted"?: string;
  "surface-fixed"?: string;
  "surface-fixed-hover"?: string;
  "text-fixed"?: string;
  "border-light"?: string;
  "border-medium"?: string;
  "border-medium-alt"?: string;
  "border-heavy"?: string;
  "border-xheavy"?: string;
  "border-destructive"?: string;
  "status-success"?: string;
  "status-success-subtle"?: string;
  "status-success-border"?: string;
  "status-success-strong"?: string;
  "status-info"?: string;
  "status-info-subtle"?: string;
  "status-info-border"?: string;
  "status-info-strong"?: string;
  "status-warning"?: string;
  "status-warning-subtle"?: string;
  "status-warning-border"?: string;
  "status-warning-strong"?: string;
  "status-error"?: string;
  "status-error-subtle"?: string;
  "status-error-border"?: string;
  "status-error-strong"?: string;
  "status-neutral"?: string;
  "status-neutral-subtle"?: string;
  "status-neutral-border"?: string;
  "status-verified"?: string;
  "text-on-status"?: string;
  "brand-purple"?: string;
  "series-1"?: string;
  "series-2"?: string;
  "series-3"?: string;
  "series-4"?: string;
  "series-5"?: string;
  "series-6"?: string;
  "series-7"?: string;
  "switch-unchecked"?: string;
  "series-8"?: string;
  presentation?: string;
  background?: string;
  primary?: string;
  "primary-foreground"?: string;
  ring?: string;
}
interface Theme {
  name: string;
  colors: IThemeRGB;
}
type ThemeMode = "light" | "dark";
interface IThemeAppearance {
  controlRadius: string;
  roundControlRadius: string;
  surfaceRadius: string;
  largeSurfaceRadius: string;
  controlHeight: string;
  spaceCompact: string;
  spaceNormal: string;
  fontFamily: string;
  elevationSurface: string;
  motionFast: string;
  motionNormal: string;
}
interface ThemeModeDefinition {
  colors?: IThemeRGB;
  appearance?: Partial<IThemeAppearance>;
  /**
  * Brand overrides for this mode only, applied over the theme-wide `brands`.
  * A brand fill carries a glyph and has to stand out from the canvas, and both
  * of those flip between light and dark, so a single set cannot serve both at
  * enhanced contrast.
  */
  brands?: Partial<IThemeBrands>;
}
interface IThemeBrands {
  "provider-openai": string;
  "provider-openai-gpt4": string;
  "provider-openai-reasoning": string;
  "provider-anthropic": string;
  "provider-azure": string;
  "provider-bedrock": string;
  "provider-foreground": string;
}
/** Versioned, data-only theme input. Missing values resolve against TerraMind defaults. */
interface ThemeDefinition {
  version: 1;
  name: string;
  modes: Partial<Record<ThemeMode, ThemeModeDefinition>>;
  brands?: Partial<IThemeBrands>;
}
interface ResolvedThemeDefinition {
  version: 1;
  name: string;
  mode: ThemeMode;
  colors: Required<IThemeRGB>;
  appearance: IThemeAppearance;
  brands: IThemeBrands;
}
//#endregion
//#region src/theme/context/ThemeProvider.d.ts
declare const themeModes: readonly ["light", "dark", "system", "high-contrast-light", "high-contrast-dark"];
type AppearanceMode = (typeof themeModes)[number];
type ThemeContextType = {
  theme: AppearanceMode;
  setTheme: (theme: string) => void;
  /**
  * The scheme and contrast actually in effect. Both are published as state
  * rather than derived by consumers, because under `system` they come from
  * media queries React cannot observe: `theme` stays `'system'` when an OS
  * preference flips, so anything deriving from `theme` alone never rerenders
  * and keeps whatever it computed on its last render.
  */
  resolvedMode: ThemeMode;
  highContrast: boolean;
  themeRGB?: IThemeRGB;
  setThemeRGB: (colors?: IThemeRGB) => void;
  themeDefinition?: ThemeDefinition;
  setThemeDefinition: (definition?: ThemeDefinition) => void;
  themeName?: string;
  setThemeName: (name?: string) => void;
  resetTheme: () => void;
};
declare const ThemeContext: React$1.Context<ThemeContextType>;
interface ThemeProviderProps {
  children: React$1.ReactNode;
  themeRGB?: IThemeRGB;
  themeDefinition?: ThemeDefinition;
  /** Whether theme definition, color, name, and source changes should be persisted. */
  persistThemeDefinition?: boolean;
  themeName?: string;
  initialTheme?: string;
}
declare const isDark: (theme: string) => boolean;
/**
* Whether the appearance mode explicitly asks for high contrast. `system` is
* excluded here and resolved separately through `prefers-contrast`, because
* this predicate answers "what did the user pick", which is what the theme
* toggle has to preserve when it flips the colour scheme.
*/
declare const isHighContrast: (theme: string) => boolean;
/** The resolved contrast for an appearance mode, explicit choice or OS request. */
declare const resolvesToHighContrast: (theme: string) => boolean;
declare function ThemeProvider({
  children,
  themeRGB: propThemeRGB,
  themeDefinition: propThemeDefinition,
  persistThemeDefinition,
  themeName: propThemeName,
  initialTheme
}: ThemeProviderProps): JSX$1.Element;
declare function useTheme(): ThemeContextType;
//#endregion
//#region src/theme/utils/applyTheme.d.ts
declare const themeOwnedProperties: readonly string[];
declare function clearAppliedTheme(root?: HTMLElement): void;
declare function applyResolvedTheme(theme: ResolvedThemeDefinition, root?: HTMLElement): void;
/**
* Backward-compatible adapter for the original partial RGB theme interface.
* New theme implementations should resolve a ThemeDefinition and use applyResolvedTheme.
*/
declare function applyTheme(themeRGB?: IThemeRGB, root?: HTMLElement, base?: IThemeRGB): void;
//#endregion
//#region src/theme/registry.d.ts
declare const THEME_VERSION: 1;
declare const themeColorTokens: readonly (keyof IThemeRGB)[];
declare const themeAppearanceProperties: Readonly<Record<keyof IThemeAppearance, `--theme-${string}`>>;
declare const defaultAppearance: IThemeAppearance;
declare const themeBrandTokens: readonly (keyof IThemeBrands)[];
declare const defaultBrands: IThemeBrands;
declare const libreChatTheme: ThemeDefinition;
/**
* Built-in accessibility theme behind the `high-contrast-light` and
* `high-contrast-dark` appearance modes. `HIGH_CONTRAST_THEME_NAME` is what
* `applyResolvedTheme` stamps onto `data-theme`, and what the `high-contrast`
* class on `<html>` mirrors for the CSS-only variables the token layer cannot
* reach (see the `html.high-contrast` block in `client/src/style.css`).
*/
declare const HIGH_CONTRAST_THEME_NAME: "high-contrast";
declare const highContrastTheme: ThemeDefinition;
declare function validateThemeDefinition(theme: ThemeDefinition): string[];
declare function resolveTheme(theme: ThemeDefinition, mode: ThemeMode): ResolvedThemeDefinition;
declare function fromLegacyTheme(colors: IThemeRGB, name?: string): ThemeDefinition;
//#endregion
//#region src/theme/atoms/themeAtoms.d.ts
/**
* @deprecated Use ThemeContext instead. This atom is no longer used internally.
*/
declare const themeModeAtom: WritableAtom<string, [string | typeof RESET | ((prev: string) => string | typeof RESET)], void>;
/**
* @deprecated Use ThemeContext instead. This atom is no longer used internally.
*/
declare const themeColorsAtom: WritableAtom<IThemeRGB | undefined, [IThemeRGB | typeof RESET | ((prev: IThemeRGB | undefined) => IThemeRGB | typeof RESET | undefined) | undefined], void>;
/**
* @deprecated Use ThemeContext instead. This atom is no longer used internally.
*/
declare const themeNameAtom: WritableAtom<string | undefined, [string | typeof RESET | ((prev: string | undefined) => string | typeof RESET | undefined) | undefined], void>;
//#endregion
//#region src/theme/themes/default.d.ts
/**
* Default light theme
* RGB values extracted from the existing CSS variables
*/
declare const defaultTheme: IThemeRGB;
//#endregion
//#region src/theme/themes/dark.d.ts
/**
* Dark theme
* RGB values extracted from the existing dark mode CSS variables
*/
declare const darkTheme: IThemeRGB;
//#endregion
//#region src/theme/themes/highContrast.d.ts
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
declare const highContrastLightTheme: IThemeRGB;
/**
* White ink on a black canvas with white borders, and accents bright enough
* (relative luminance >= 0.3) that they clear 7:1 both against the canvas and
* against the black `text-on-status` label placed on them.
*/
declare const highContrastDarkTheme: IThemeRGB;
//#endregion
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertProps, AnimatedSearchInput, AnimatedTabs, AnimatedTabsProps, AnthropicIcon, AnthropicMinimalIcon, AppleIcon, ArchiveIcon, AssistantIcon, AttachmentIcon, AudioPaths, Avatar, AzureMinimalIcon, Badge, BedrockIcon, BirthdayIcon, Blocks, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, ButtonProps, ChatGPTMinimalIcon, CheckMark, Checkbox, CheckboxButton, CheckboxProps, Chip, ChipProps, CircleHelpIcon, Clipboard, CodePaths, CodeyIcon, Collapsible, CollapsibleContent, CollapsibleTrigger, ComboboxComponent as Combobox, Composer, type ComposerKeyVerdict, type ComposerProps, type ComposerPropsWithStop, type ComposerStopProps, ContinueIcon, ControlComboboxMemo as ControlCombobox, CrossIcon, CustomMinimalIcon, DataIcon, DataTable, type DataTableConfig, type DataTableSearchProps, DelayedRender, Dialog, DialogButton, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogOverlay as OGDialogOverlay, DialogTemplate, DialogTitle, DialogTrigger, DiscordIcon, DotsIcon, Dropdown, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownPopup, DropdownValueSetter, ESide, EditIcon, EmptyState, type EmptyStateProps, ExperimentIcon, FacebookIcon, FieldMessage, FieldMessageProps, FileIcon, FilePaths, FileUpload, FilterInput, FilterInputProps, FormInput, GPTIcon, GearIcon, GeminiIcon, GithubIcon, GoogleIcon, Google as GoogleIconChat, GoogleMinimalIcon, HIGH_CONTRAST_THEME_NAME, HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger, IThemeAppearance, IThemeBrands, IThemeColors, IThemeRGB, IThemeVariables, IconButton, IconButtonProps, type IconInput, type IconNode, InfoHoverCard, Input, InputCombobox, InputNumber, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, InputProps, InputWithDropdown, Label, LightningIcon, LinkIcon, ListeningIcon, LockIcon, LogOutIcon, MCPIcon, MentionOption, type MenuItemProps, MessagesSquared, MeterSegment, MeterSwatch, MeterSwatchProps, MinimalPlugin, MinutePicker, type MinutePickerProps, MobileSidebar, MoonshotIcon, type MorphHandle, MorphIcon, type MorphIconProps, MultiSelect, NewChatIcon, NotificationSeverity, Dialog$1 as OGDialog, DialogClose$1 as OGDialogClose, DialogContent$1 as OGDialogContent, DialogDescription$1 as OGDialogDescription, DialogFooter$1 as OGDialogFooter, DialogHeader$1 as OGDialogHeader, DialogPortal as OGDialogPortal, OGDialogTemplate, DialogTitle$1 as OGDialogTitle, DialogTrigger$1 as OGDialogTrigger, OpenAIMinimalIcon, OpenIDIcon, Option, OptionWithIcon, PaLMIcon, PaLMinimalIcon, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PersonalizationIcon, PinIcon, PixelCard, Plugin, type ProcessedDataRow, Progress, type ProviderArt, ProviderAvatar, type ProviderAvatarProps, ProviderIcon, type ProviderIconDef, type ProviderIconProps, QuestionMark, Radio, RegenerateIcon, ResizableHandle, ResizableHandleAlt, ResizablePanel, ResizablePanelGroup, ResolvedThemeDefinition, SERIES_SLOT_COUNT, SamlIcon, SaveIcon, SecretInput, SecretInputProps, SegmentedMeter, SegmentedMeterProps, Select, SelectContent, SelectDropDown, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, SelectedValues, type SendAction, SendActions, SendIcon, SendMessageIcon, Separator, SharePointIcon, SheetPaths, Sidebar, Skeleton, Slider, Sparkles, SpeechIcon, Spinner, SplitText, SquirclePlusIcon, StopGeneratingIcon, Switch, THEME_VERSION, TShowToast, TabItem, Table, TableBody, TableCaption, TableCell, type TableColumn, type TableColumnDef, TableFooter, TableHead, TableHeader, TableRow, TableRowHeader, Tabs, TabsContent, TabsList, TabsTrigger, Tag, TextPaths, Textarea, TextareaAutosize, TextareaAutosizePropsWithAria, TextareaProps, Theme, ThemeContext, ThemeDefinition, ThemeMode, ThemeModeDefinition, ThemeProvider, ThemeSelector, ThumbDownIcon, ThumbUpIcon, TimeColumn, type TimeColumnProps, TimePicker, type TimePickerLabels, type TimePickerProps, Toast, ToastContext, ToastProvider, ToastState, TooltipAnchor, type TranslationKeys, TrashIcon, UserIcon, VectorIcon, VerifiedIcon, VideoPaths, DataTable$1 as VirtualizedDataTable, type DataTableProps as VirtualizedDataTableProps, VolumeIcon, VolumeMuteIcon, XAIcon, alertVariants, applyFontSize, applyResolvedTheme, applyTheme, buttonVariants, chatDirectionAtom, chipVariants, clearAppliedTheme, cn, composerControlClasses, composerSubmitClasses, composerSurfaceClasses, composerSurfaceShadow, configureCloudFrontCookieRefresh, darkTheme, defaultAppearance, defaultBrands, defaultTheme, disclosureChevronVariants, fieldBase, fieldControl, fontSizeAtom, fromLegacyTheme, getInitialTheme, getProviderIconDef, highContrastDarkTheme, highContrastLightTheme, highContrastTheme, iconButtonVariants, installCloudFrontImageRetry, isCloudFrontMediaUrl, isDark, isHighContrast, labelVariants, libreChatTheme, logger, providerIcons, refreshCloudFrontCookiesOnce, resolveTheme, resolvesToHighContrast, seriesSwatchClass, themeAppearanceProperties, themeBrandTokens, themeColorTokens, themeColorsAtom, themeModeAtom, themeNameAtom, themeOwnedProperties, toastState, useAvatar, useCombobox, useDelayedRender, useDialogDepth, useInputModality, useLocalize, useMediaQuery, useMultiSearch, useNestedPopoverStyle, useOnClickOutside, usePopoverZIndex, useTheme, useToast, useToastContext, validateThemeDefinition, withCloudFrontCacheBuster };
//# sourceMappingURL=index.d.cts.map