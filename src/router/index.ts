import { createRouter, createWebHistory } from "vue-router";
import type { RouteLocationNormalized } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import { useLoadingStore } from "@/stores/loading";
import { pinia } from "@/stores/pinia";
import { usePermissions } from "@/composables/usePermissions";
import {
  buildLoginRedirectPath,
  createAuthSessionNotice,
  saveAuthSessionNotice,
} from "@/utils/authSession";
import {
  FRONTEND_ONLY_MODE,
  FRONTEND_ONLY_WORKSPACE_ROUTE,
} from "@/utils/frontendOnly";
import { applyRouteSeo } from "@/utils/seo";

const loadAppLayout = () => import("@/components/layout/AppLayout.vue");
const loadGuestLayout = () => import("@/components/layout/GuestLayout.vue");

const routes = [
  {
    path: "/",
    component: loadGuestLayout,
    children: [
      {
        path: "",
        redirect: "/home",
      },
      {
        path: "home",
        name: "Home",
        meta: {
          guestOnly: true,
          seo: {
            title: "AI Sales Workspace",
            description:
              "Manage customers, follow-ups, AI analysis, notifications, daily reports, and sales dashboards in one workspace.",
            keywords:
              "SalePilot, AI sales workspace, CRM dashboard, customer management, sales analytics",
          },
        },
        component: () => import("@/static page/views/Home.vue"),
      },
      {
        path: "developers",
        name: "Developers",
        meta: {
          guestOnly: true,
          seo: {
            title: "Developers",
            description:
              "Meet the SalePilot developer profile and product engineering focus behind the AI sales workspace.",
          },
        },
        component: () => import("@/static page/views/Developers.vue"),
      },
      {
        path: "pricing",
        name: "Pricing",
        meta: {
          guestOnly: true,
          seo: {
            title: "Pricing",
            description:
              "Review SalePilot pricing tiers and workspace limits for seats, customers, and AI call quotas.",
          },
        },
        component: () => import("@/static page/views/Pricing.vue"),
      },
      {
        path: "auth/register",
        name: "Register",
        meta: {
          guestOnly: true,
          seo: {
            title: "Create Workspace",
            description:
              "Create a SalePilot workspace and start managing customers, reports, and AI sales analysis.",
            noindex: true,
          },
        },
        component: () => import("@/static page/views/Register.vue"),
      },
      {
        path: "auth/login",
        name: "Login",
        meta: {
          guestOnly: true,
          seo: {
            title: "Sign In",
            description:
              "Sign in to SalePilot to continue with customer follow-ups, AI analysis, notifications, and sales reporting.",
            noindex: true,
          },
        },
        component: () => import("@/static page/views/Login.vue"),
      },
    ],
  },
  {
    path: FRONTEND_ONLY_WORKSPACE_ROUTE,
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      allowPendingIdentity: true,
      seo: {
        description:
          "Frontend-only static workspace for product demos without backend dependencies.",
      },
    },
    children: [
      {
        path: "",
        name: "StaticWorkbench",
        meta: {
          allowPendingIdentity: true,
          seo: {
            title: "Static Workspace",
          },
        },
        component: () => import("@/static page/views/Workbench.vue"),
      },
    ],
  },
  {
    path: "/403",
    name: "Forbidden",
    meta: {
      seo: {
        title: "Access Denied",
        description:
          "This SalePilot page is unavailable because your current account does not have access.",
        noindex: true,
      },
    },
    component: () => import("@/static page/views/Forbidden.vue"),
  },
  {
    path: "/admin",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      requiresPermission: "admin.access",
      permissionFallbackRoles: ["manager", "admin"],
      seo: {
        description:
          "Manage workspace users, roles, and administrator controls inside SalePilot.",
      },
    },
    children: [
      {
        path: "",
        name: "Admin",
        meta: {
          seo: {
            title: "Admin Console",
          },
        },
        component: () => import("@/static page/views/Admin.vue"),
      },
    ],
  },
  {
    path: "/user",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      allowPendingIdentity: true,
      seo: {
        description:
          "Review your profile, role permissions, session state, and workspace account settings.",
      },
    },
    children: [
      {
        path: "",
        name: "User",
        meta: {
          seo: {
            title: "Account Center",
          },
        },
        component: () => import("@/static page/views/User.vue"),
      },
      {
        path: ":id",
        name: "UserProfile",
        meta: {
          requiresAuth: true,
          requiresPermission: "users.manage",
          seo: {
            title: "用户资料",
            description: "查看和管理用户自定义字段、心情记录等信息",
          },
        },
        component: () => import("@/static page/views/user/UserProfile.vue"),
      },
    ],
  },
  {
    path: "/company",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      allowPendingIdentity: true,
      seo: {
        description:
          "Verify your company identity and complete workspace access approval.",
      },
    },
    children: [
      {
        path: "verify",
        name: "CompanyVerify",
        meta: {
          allowPendingIdentity: true,
          seo: {
            title: "Company Verification",
          },
        },
        component: () => import("@/static page/views/CompanyVerify.vue"),
      },
    ],
  },
  {
    path: "/groups",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      requiresPermission: "groups.view",
      permissionFallbackRoles: ["user", "manager", "admin"],
      seo: {
        description:
          "Coordinate workspace groups, chat streams, invite rules, and approval requests.",
      },
    },
    children: [
      {
        path: "",
        name: "Groups",
        meta: {
          seo: {
            title: "Groups",
          },
        },
        component: () => import("@/static page/views/Groups.vue"),
      },
    ],
  },
  {
    path: "/notifications",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      allowPendingIdentity: true,
      requiresPermission: "notifications.view",
      permissionFallbackRoles: ["user", "manager", "admin"],
      seo: {
        description:
          "Track unread alerts, risk warnings, and AI-generated reminders from your sales workspace.",
      },
    },
    children: [
      {
        path: "",
        name: "NotificationCenter",
        meta: {
          seo: {
            title: "Notification Center",
          },
        },
        component: () =>
          import("@/static page/views/notification/NotificationCenter.vue"),
      },
    ],
  },
  {
    path: "/reports",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      requiresPermission: "reports.view",
      permissionFallbackRoles: ["user", "manager", "admin"],
      seo: {
        description:
          "Analyze revenue trends, funnel performance, team rankings, and AI daily reports in SalePilot.",
      },
    },
    children: [
      {
        path: "sales",
        name: "SalesDashboard",
        meta: {
          seo: {
            title: "Sales Dashboard",
            keywords:
              "sales dashboard, revenue trend, conversion funnel, customer source distribution, team ranking",
          },
        },
        component: () =>
          import("@/static page/views/report/SalesDashboard.vue"),
      },
      {
        path: "daily",
        name: "DailyReport",
        meta: {
          seo: {
            title: "AI Daily Report",
            keywords:
              "daily sales report, AI report, report generation, SSE report streaming, sales summary",
          },
        },
        component: () => import("@/static page/views/report/DailyReport.vue"),
      },
    ],
  },
  {
    path: "/customer",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      requiresPermission: "customers.view",
      permissionFallbackRoles: ["user", "manager", "admin"],
      seo: {
        description:
          "Manage customer records, follow-ups, AI analysis, tags, and deleted items from one customer workspace.",
      },
    },
    children: [
      {
        path: "",
        name: "CustomerList",
        meta: {
          seo: {
            title: "Customer Workspace",
            keywords:
              "customer list, CRM workspace, sales customers, follow-up management, customer pipeline",
          },
        },
        component: () =>
          import("@/static page/views/customer/CustomerList.vue"),
      },
      {
        path: "board",
        name: "CustomerBoard",
        meta: {
          seo: {
            title: "Customer Board",
          },
        },
        component: () =>
          import("@/static page/views/customer/CustomerBoard.vue"),
      },
      {
        path: "deleted",
        name: "DeletedCustomers",
        meta: {
          requiresPermission: "customers.restore",
          permissionFallbackRoles: ["manager", "admin"],
          seo: {
            title: "Deleted Customers",
          },
        },
        component: () =>
          import("@/static page/views/customer/DeletedCustomers.vue"),
      },
      {
        path: "tags",
        name: "CustomerTags",
        meta: {
          requiresPermission: "customers.tags.manage",
          permissionFallbackRoles: ["manager", "admin"],
          seo: {
            title: "Customer Tags",
          },
        },
        component: () =>
          import("@/static page/views/customer/CustomerTags.vue"),
      },
      {
        path: "form/:id?",
        name: "CustomerForm",
        meta: {
          requiresPermission: "customers.create",
          permissionFallbackRoles: ["user", "manager", "admin"],
          seo: {
            title: "Customer Form",
          },
        },
        component: () =>
          import("@/static page/views/customer/CustomerForm.vue"),
      },
      {
        path: ":id/followups/new",
        name: "CustomerFollowupForm",
        meta: {
          requiresPermission: "followups.create",
          permissionFallbackRoles: ["user", "manager", "admin"],
          seo: {
            title: "New Follow-up",
          },
        },
        component: () =>
          import("@/static page/views/customer/CustomerFollowupForm.vue"),
      },
      {
        path: ":id/ai",
        name: "CustomerAiResult",
        meta: {
          requiresPermission: "ai.analysis.run",
          permissionFallbackRoles: ["user", "manager", "admin"],
          seo: {
            title: "Customer AI Analysis",
          },
        },
        component: () =>
          import("@/static page/views/customer/CustomerAiResult.vue"),
      },
      {
        path: ":id",
        name: "CustomerDetail",
        meta: {
          seo: {
            title: "Customer Detail",
          },
        },
        component: () =>
          import("@/static page/views/customer/CustomerDetail.vue"),
      },
    ],
  },
  {
    path: "/project",
    component: loadAppLayout,
    meta: {
      requiresAuth: true,
      requiresPermission: "customers.view",
      permissionFallbackRoles: ["user", "manager", "admin"],
      seo: {
        description:
          "Manage projects, import transaction records, and analyze sales data.",
      },
    },
    children: [
      {
        path: "",
        name: "ProjectList",
        meta: {
          seo: {
            title: "项目列表",
          },
        },
        component: () => import("@/static page/views/project/ProjectList.vue"),
      },
      {
        path: ":id",
        name: "ProjectDetail",
        meta: {
          seo: {
            title: "项目详情",
          },
        },
        component: () =>
          import("@/static page/views/project/ProjectDetail.vue"),
      },
      {
        path: "form/:id?",
        name: "ProjectForm",
        meta: {
          requiresPermission: "customers.create",
          permissionFallbackRoles: ["user", "manager", "admin"],
          seo: {
            title: "项目表单",
          },
        },
        component: () => import("@/static page/views/project/ProjectForm.vue"),
      },
      {
        path: ":id/import",
        name: "ProjectImport",
        meta: {
          requiresPermission: "customers.create",
          permissionFallbackRoles: ["user", "manager", "admin"],
          seo: {
            title: "导入订单",
          },
        },
        component: () =>
          import("@/static page/views/project/ProjectImport.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const resolveRouteLoadingLabel = (to: RouteLocationNormalized) => {
  const metaLabel =
    typeof to.meta.loadingLabel === "string" ? to.meta.loadingLabel.trim() : "";
  if (metaLabel) {
    return metaLabel;
  }

  if (typeof to.name === "string" && to.name.trim()) {
    const title = to.name
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();

    return `Opening ${title}`;
  }

  return "Opening workspace";
};

const getRouteFallbackRoles = (to: RouteLocationNormalized) => {
  const fallbackRoles = to.meta.permissionFallbackRoles;
  return Array.isArray(fallbackRoles)
    ? fallbackRoles.filter(
        (role): role is string =>
          typeof role === "string" && Boolean(role.trim()),
      )
    : [];
};

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore(pinia);
  const loadingStore = useLoadingStore(pinia);
  const permissions = usePermissions();
  const hadRefreshToken = Boolean(authStore.getRefreshToken());
  loadingStore.startRouteLoading(resolveRouteLoadingLabel(to));
  await authStore.bootstrapAuthSession();

  let token = authStore.getAccessToken();
  if (to.meta.requiresAuth) {
    token = await authStore.ensureValidAccessToken(30_000);
  }

  if (to.meta.requiresAuth && !token) {
    if (FRONTEND_ONLY_MODE) {
      await authStore.enableFrontendOnlySession({});
      token = authStore.getAccessToken();
    } else {
      const reason = hadRefreshToken ? "session-expired" : "auth-required";
      saveAuthSessionNotice(createAuthSessionNotice(reason, to.fullPath));
      next(buildLoginRedirectPath(reason, to.fullPath));
      return;
    }
  }

  if (to.meta.guestOnly && token && !FRONTEND_ONLY_MODE) {
    next("/customer");
    return;
  }

  const allowPendingIdentity = Boolean(to.meta.allowPendingIdentity);
  if (
    to.meta.requiresAuth &&
    authStore.needsCompanyVerification &&
    !allowPendingIdentity
  ) {
    ElMessage.error(
      "未获得授权进入公司/销售组，请先完成公司认证或等待审批通过。",
    );
    next({
      path: "/company/verify",
      query: {
        reason: "company-unverified",
        redirect: to.fullPath,
      },
    });
    return;
  }

  if (to.path === "/company/verify" && authStore.companyIdentityVerified) {
    next(FRONTEND_ONLY_MODE ? FRONTEND_ONLY_WORKSPACE_ROUTE : "/customer");
    return;
  }

  const requiredPermission = to.meta.requiresPermission;
  const requiredPermissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : typeof requiredPermission === "string"
      ? [requiredPermission]
      : [];

  if (
    requiredPermissions.length &&
    !permissions.hasAnyPermission(
      requiredPermissions,
      getRouteFallbackRoles(to),
    )
  ) {
    ElMessage.error(
      `未获得该模块权限：${requiredPermissions.join("、")}，请检查公司身份、销售组或角色设置。`,
    );
    next({
      path: "/403",
      query: {
        reason: "permission",
        permission: requiredPermissions.join(","),
        from: to.fullPath,
      },
    });
    return;
  }

  const userRole = authStore.userrole || localStorage.getItem("user_role");
  if (to.meta.requiresRole && userRole !== to.meta.requiresRole) {
    ElMessage.error("当前身份不符合该页面要求，请切换身份或联系管理员。");
    next({
      path: "/403",
      query: {
        reason: "role",
        from: to.fullPath,
      },
    });
    return;
  }

  next();
});

router.afterEach((to) => {
  applyRouteSeo(to);
  const loadingStore = useLoadingStore(pinia);
  loadingStore.finishRouteLoading();
});

router.onError(() => {
  const loadingStore = useLoadingStore(pinia);
  loadingStore.finishRouteLoading();
});

export default router;
