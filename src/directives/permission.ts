import { watch, type Directive, type DirectiveBinding } from "vue";
import { useAuthStore } from "@/stores/auth";
import { pinia } from "@/stores/pinia";
import {
  resolvePermissionAccess,
  type PermissionCheckOptions,
  type PermissionRequirement,
} from "@/composables/usePermissions";

type PermissionDirectiveAction = "hide" | "disable";

export interface PermissionDirectiveValue extends PermissionCheckOptions {
  permission: PermissionRequirement;
  action?: PermissionDirectiveAction;
}

type PermissionBindingValue = PermissionRequirement | PermissionDirectiveValue;

interface PermissionElement extends HTMLElement {
  __permissionStop?: () => void;
  __permissionConfig?: PermissionDirectiveValue;
  __permissionOriginalDisplay?: string;
  __permissionOriginalDisabled?: string | null;
  __permissionOriginalPointerEvents?: string;
  __permissionOriginalOpacity?: string;
  __permissionOriginalTabIndex?: string | null;
}

const isDirectiveConfig = (value: PermissionBindingValue): value is PermissionDirectiveValue => {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return false;
  }

  return "permission" in value || "action" in value || "fallbackRoles" in value || "mode" in value;
};

const resolveDirectiveConfig = (binding: DirectiveBinding<PermissionBindingValue>): PermissionDirectiveValue => {
  if (isDirectiveConfig(binding.value)) {
    return {
      permission: binding.value.permission,
      fallbackRoles: binding.value.fallbackRoles,
      mode: binding.value.mode,
      action: binding.value.action || (binding.modifiers.disable ? "disable" : "hide"),
    };
  }

  return {
    permission: binding.value,
    mode: binding.modifiers.all ? "all" : "any",
    action: binding.modifiers.disable ? "disable" : "hide",
  };
};

const applyHiddenState = (el: PermissionElement, hidden: boolean) => {
  if (hidden) {
    if (typeof el.__permissionOriginalDisplay === "undefined") {
      el.__permissionOriginalDisplay = el.style.display;
    }

    el.style.setProperty("display", "none", "important");
    return;
  }

  if (typeof el.__permissionOriginalDisplay !== "undefined") {
    if (el.__permissionOriginalDisplay) {
      el.style.display = el.__permissionOriginalDisplay;
    } else {
      el.style.removeProperty("display");
    }
  } else {
    el.style.removeProperty("display");
  }
};

const applyDisabledState = (el: PermissionElement, disabled: boolean) => {
  if (disabled) {
    if (typeof el.__permissionOriginalDisabled === "undefined") {
      el.__permissionOriginalDisabled = el.getAttribute("disabled");
    }

    if (typeof el.__permissionOriginalPointerEvents === "undefined") {
      el.__permissionOriginalPointerEvents = el.style.pointerEvents;
    }

    if (typeof el.__permissionOriginalOpacity === "undefined") {
      el.__permissionOriginalOpacity = el.style.opacity;
    }

    if (typeof el.__permissionOriginalTabIndex === "undefined") {
      el.__permissionOriginalTabIndex = el.getAttribute("tabindex");
    }

    el.setAttribute("disabled", "disabled");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("tabindex", "-1");
    el.classList.add("is-disabled", "v-permission-disabled");
    el.style.pointerEvents = "none";
    el.style.opacity = "0.58";
    return;
  }

  if (el.__permissionOriginalDisabled === null) {
    el.removeAttribute("disabled");
  } else if (typeof el.__permissionOriginalDisabled !== "undefined") {
    el.setAttribute("disabled", el.__permissionOriginalDisabled);
  }

  el.removeAttribute("aria-disabled");

  if (el.__permissionOriginalTabIndex === null) {
    el.removeAttribute("tabindex");
  } else if (typeof el.__permissionOriginalTabIndex !== "undefined") {
    el.setAttribute("tabindex", el.__permissionOriginalTabIndex);
  }

  el.classList.remove("is-disabled", "v-permission-disabled");
  el.style.pointerEvents = el.__permissionOriginalPointerEvents || "";
  el.style.opacity = el.__permissionOriginalOpacity || "";
};

const applyPermission = (el: PermissionElement) => {
  const config = el.__permissionConfig;
  if (!config) {
    return;
  }

  const authStore = useAuthStore(pinia);
  const allowed = resolvePermissionAccess(
    {
      role: authStore.userrole || localStorage.getItem("user_role"),
      permissions: authStore.permissions,
    },
    config.permission,
    {
      fallbackRoles: config.fallbackRoles,
      mode: config.mode,
    },
  );

  if (config.action === "disable") {
    applyHiddenState(el, false);
    applyDisabledState(el, !allowed);
    return;
  }

  applyDisabledState(el, false);
  applyHiddenState(el, !allowed);
};

const bindPermissionDirective = (el: PermissionElement, binding: DirectiveBinding<PermissionBindingValue>) => {
  const authStore = useAuthStore(pinia);
  el.__permissionConfig = resolveDirectiveConfig(binding);
  applyPermission(el);

  if (!el.__permissionStop) {
    el.__permissionStop = watch(
      () => JSON.stringify({
        userrole: authStore.userrole,
        permissions: authStore.permissions,
      }),
      () => {
        applyPermission(el);
      },
      { immediate: false },
    );
  }
};

export const permissionDirective: Directive<HTMLElement, PermissionBindingValue> = {
  mounted(el, binding) {
    bindPermissionDirective(el as PermissionElement, binding);
  },
  updated(el, binding) {
    bindPermissionDirective(el as PermissionElement, binding);
  },
  unmounted(el) {
    const permissionElement = el as PermissionElement;
    permissionElement.__permissionStop?.();
    delete permissionElement.__permissionStop;
    delete permissionElement.__permissionConfig;
  },
};
