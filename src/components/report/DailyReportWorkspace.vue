<template>
  <section class="daily-report">
    <header class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">{{ drText("Sales Ops Journal") }}</p>
        <div class="hero-headline">
          <h1>{{ drText("Daily report") }}</h1>
          <span class="hero-pill">{{ heroStatus }}</span>
        </div>
        <p class="hero-description">
          {{ drText("Generate a manager-ready workday report with the same warm-neutral visual system used by the frontend API document.") }}
        </p>
      </div>

      <div class="hero-actions">
        <el-button @click="setToday">{{ drText("Today") }}</el-button>
        <el-button :loading="aggregateLoading" @click="handleRefreshAggregate">
          <el-icon><RefreshRight /></el-icon>
          {{ drText("Refresh data") }}
        </el-button>
        <el-button v-if="streaming" @click="handleStopGeneration">{{ drText("Stop stream") }}</el-button>
        <el-button type="primary" :loading="streaming" @click="handleGenerateReport">
          <el-icon><DataAnalysis /></el-icon>
          {{ report ? drText("Regenerate report") : drText("Generate report") }}
        </el-button>
      </div>
    </header>

    <section class="toolbar-card">
      <label class="field-block">
        <span class="toolbar-label">{{ drText("Report date") }}</span>
        <el-date-picker v-model="queryState.date" type="date" value-format="YYYY-MM-DD" format="MMM DD, YYYY" :clearable="false" />
      </label>

      <label class="field-block">
        <span class="toolbar-label">{{ drText("Timezone") }}</span>
        <el-select v-model="queryState.timezone" filterable allow-create default-first-option :placeholder="drText('Timezone')">
          <el-option v-for="item in timeZoneOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </label>

      <label class="field-block">
        <span class="toolbar-label">{{ drText("Provider") }}</span>
        <el-input v-model="queryState.provider" :placeholder="drText('Default provider')" clearable />
      </label>

      <label class="field-block">
        <span class="toolbar-label">{{ drText("Model") }}</span>
        <el-input v-model="queryState.model" :placeholder="drText('Default model')" clearable />
      </label>

      <label class="field-block field-block--switch">
        <span class="toolbar-label">{{ drText("12h cache") }}</span>
        <div class="switch-row">
          <span>{{ queryState.useCache ? drText("Enabled") : drText("Bypass cache") }}</span>
          <el-switch v-model="queryState.useCache" />
        </div>
      </label>
    </section>

    <div class="strip-row">
      <span class="strip-pill">{{ selectedDateLabel }}</span>
      <span class="strip-pill">{{ timeZoneLabel }}</span>
      <span class="strip-pill">{{ cacheModeLabel }}</span>
      <span v-if="aggregate?.reportWindow.generatedAt" class="strip-pill">
        {{ drText("Context") }} {{ formatDateTime(aggregate.reportWindow.generatedAt, aggregate.reportWindow.timeZone) }}
      </span>
      <span v-if="reportMeta.generatedAt" class="strip-pill">
        {{ drText("Report") }} {{ formatDateTime(reportMeta.generatedAt, queryState.timezone) }}
      </span>
      <span v-if="reportMeta.cached" class="strip-pill strip-pill--success">{{ drText("Loaded from cache") }}</span>
      <span v-if="aggregateIsStale" class="strip-pill strip-pill--warning">{{ drText("Context needs refresh") }}</span>
    </div>

    <div v-if="pageWarning" class="warning-banner">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ pageWarning }}</span>
    </div>

    <PageLoadingSkeleton v-if="aggregateLoading && !aggregate" variant="report" />

    <section v-else-if="aggregateError && !aggregate" class="state-card">
      <div class="state-icon">
        <el-icon><WarningFilled /></el-icon>
      </div>
      <h2>{{ drText("Daily report data is unavailable") }}</h2>
      <p>{{ aggregateError }}</p>
      <el-button type="primary" @click="handleRefreshAggregate">{{ drText("Try again") }}</el-button>
    </section>

    <template v-else>
      <section class="summary-grid">
        <article v-for="card in summaryCards" :key="card.label" class="summary-card" :class="`summary-card--${card.tone}`">
          <div class="summary-icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <div>
            <span class="summary-label">{{ card.label }}</span>
            <strong class="summary-value">{{ card.value }}</strong>
            <p class="summary-description">{{ card.description }}</p>
          </div>
        </article>
      </section>

      <section class="content-grid">
        <article class="panel-card panel-card--main">
          <header class="panel-head">
            <div>
              <p class="eyebrow">{{ drText("Generated Briefing") }}</p>
              <h2>{{ drText("AI daily report") }}</h2>
            </div>

            <div class="panel-tools">
              <div class="chip-row">
                <span class="meta-chip meta-chip--soft">{{ reportStateLabel }}</span>
                <span v-if="reportMeta.totalTokens !== null" class="meta-chip meta-chip--outline">
                  {{ compactNumber(reportMeta.totalTokens) }} {{ drText("tokens") }}
                </span>
                <span v-if="report" class="meta-chip meta-chip--outline">{{ confidence(report.confidence) }} {{ drText("confidence") }}</span>
              </div>
              <div class="chip-row">
                <el-button size="small" :disabled="!copyableReportText" @click="handleCopyReport">
                  <el-icon><CopyDocument /></el-icon>
                  {{ drText("Copy report") }}
                </el-button>
                <el-button size="small" :disabled="!copyableReportText" @click="handleOpenShareDialog">
                  <el-icon><Promotion /></el-icon>
                  {{ drText("Share") }}
                </el-button>
                <el-button v-if="activeRawReport" size="small" @click="handleCopyRaw">
                  <el-icon><CopyDocument /></el-icon>
                  {{ drText("Copy raw") }}
                </el-button>
              </div>
            </div>
          </header>

          <p v-if="streamMessage" class="stream-caption">{{ streamMessage }}</p>

          <div v-if="report" class="report-layout">
            <section class="report-block report-block--hero">
              <span class="report-block-label">{{ drText("Executive summary") }}</span>
              <p>{{ report.summary }}</p>
            </section>

            <div class="report-section-grid">
              <section v-for="section in reportSections" :key="section.key" class="report-block">
                <div class="report-block-head">
                  <span class="report-block-label">{{ section.label }}</span>
                  <span class="meta-chip" :class="section.tone === 'warning' ? 'meta-chip--warning' : 'meta-chip--success'">
                    {{ section.items.length }}
                  </span>
                </div>
                <ul class="report-list">
                  <li v-for="item in section.items" :key="item">{{ item }}</li>
                </ul>
              </section>
            </div>

            <section class="report-block">
              <div class="report-block-head">
                <span class="report-block-label">{{ drText("Manager brief") }}</span>
                <span v-if="report.missingData.length" class="meta-chip meta-chip--warning">
                  {{ report.missingData.length }} {{ drText("data gaps") }}
                </span>
              </div>
              <p>{{ report.managerBrief }}</p>
              <ul v-if="report.missingData.length" class="report-list">
                <li v-for="item in report.missingData" :key="item">{{ item }}</li>
              </ul>
            </section>
          </div>

          <div v-else-if="showTypingPreview" class="typing-card">
            <div class="typing-head">
              <span class="report-block-label">{{ reportMeta.cached ? drText("Cached replay") : drText("Live generation") }}</span>
              <span class="meta-chip meta-chip--soft">{{ showTypingCursor ? drText("Typing...") : drText("Replay complete") }}</span>
            </div>
            <p class="typing-description">
              {{ streamMessage || drText("Waiting for the first streamed tokens from the report generator.") }}
            </p>
            <div class="typing-shell">
              <pre class="typing-pre">{{ typedContent || " " }}</pre>
              <span v-if="showTypingCursor" class="typing-cursor" aria-hidden="true"></span>
            </div>
          </div>

          <div v-else class="empty-card">
            <div class="state-icon state-icon--small">
              <el-icon><Document /></el-icon>
            </div>
            <h3>{{ drText("No AI report yet") }}</h3>
            <p>{{ drText("Run generation to get the executive summary, follow-up focus, risk watch, and next-day plan.") }}</p>
          </div>

          <section v-if="activeRawReport" class="raw-card">
            <div class="raw-head">
              <span class="toolbar-label">{{ drText("Live output") }}</span>
              <el-button size="small" @click="handleCopyRaw">
                <el-icon><CopyDocument /></el-icon>
                {{ drText("Copy raw") }}
              </el-button>
            </div>
            <div class="typing-shell typing-shell--raw">
              <pre class="raw-pre">{{ displayedRawContent }}</pre>
              <span v-if="showTypingCursor" class="typing-cursor" aria-hidden="true"></span>
            </div>
          </section>
        </article>

        <article class="panel-card">
          <header class="panel-head">
            <div>
              <p class="eyebrow">{{ drText("Context Signals") }}</p>
              <h2>{{ drText("Source summary") }}</h2>
            </div>
            <span class="meta-chip meta-chip--outline">
              {{ confidence(aggregate?.contextSummary.confidence ?? 0) }} {{ drText("source confidence") }}
            </span>
          </header>

          <div class="signal-group">
            <span class="meta-chip meta-chip--success">{{ drText("Positive") }}</span>
            <ul class="report-list">
              <li v-for="item in aggregate?.contextSummary.highlights.positives || []" :key="item">{{ item }}</li>
              <li v-if="!aggregate?.contextSummary.highlights.positives.length">{{ drText("No strong positive signal was highlighted.") }}</li>
            </ul>
          </div>

          <div class="signal-group">
            <span class="meta-chip meta-chip--warning">{{ drText("Risk") }}</span>
            <ul class="report-list">
              <li v-for="item in aggregate?.contextSummary.highlights.risks || []" :key="item">{{ item }}</li>
              <li v-if="!aggregate?.contextSummary.highlights.risks.length">{{ drText("No urgent risk signal was found in the source data.") }}</li>
            </ul>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <span class="summary-label">{{ drText("Actor") }}</span>
              <strong>{{ aggregate?.actor.username || drText("Unknown") }}</strong>
              <p>{{ aggregate?.actor.userrole || drText("Workspace member") }}</p>
            </div>
            <div class="meta-card">
              <span class="summary-label">{{ drText("Workspace") }}</span>
              <strong>{{ aggregate?.workspace.companyName || drText("Unknown company") }}</strong>
              <p>{{ aggregate?.workspace.plan || drText("No plan info") }}</p>
            </div>
          </div>
        </article>
      </section>

      <section class="records-head">
        <div>
          <p class="eyebrow">{{ drText("Source Records") }}</p>
          <h2>{{ drText("What fed the report") }}</h2>
        </div>
        <span class="hero-pill">{{ sourceSections.length }} {{ drText("sections") }}</span>
      </section>

      <section class="records-grid">
        <article v-for="section in sourceSections" :key="section.key" class="record-card" :class="`record-card--${section.tone}`">
          <header class="record-head">
            <div>
              <span class="summary-label">{{ section.label }}</span>
              <strong class="summary-value summary-value--compact">{{ compactNumber(section.count) }}</strong>
            </div>
            <div class="summary-icon summary-icon--small">
              <el-icon><component :is="section.icon" /></el-icon>
            </div>
          </header>
          <p class="summary-description">{{ section.description }}</p>
          <div v-if="section.items.length" class="record-list">
            <article v-for="item in section.items" :key="item.id" class="record-item">
              <div class="record-copy">
                <strong>{{ item.title }}</strong>
                <p>{{ item.subtitle }}</p>
                <span>{{ item.meta }}</span>
              </div>
              <router-link v-if="item.href" :to="item.href" class="record-link">{{ drText("Customer") }}</router-link>
            </article>
          </div>
          <div v-else class="record-empty">{{ section.emptyText }}</div>
        </article>
      </section>
    </template>

    <el-dialog v-model="shareDialogVisible" class="share-dialog" width="min(980px, 92vw)">
      <template #header>
        <div class="share-dialog-head">
          <div>
            <p class="eyebrow">{{ drText("Report Share") }}</p>
            <h2>{{ drText("Share to DingTalk / WeChat Work") }}</h2>
          </div>
          <span class="hero-pill">{{ shareDialogStatus }}</span>
        </div>
      </template>

      <div class="share-note">
        <el-icon><Promotion /></el-icon>
        <span>
          {{ drText("Direct send uses official robot webhooks. The webhook config is stored only in this browser, and copy/system-share fallback remains available for manual forwarding.") }}
        </span>
      </div>

      <div class="share-grid">
        <article class="share-card share-card--dingtalk">
          <div class="share-card-head">
            <div class="chip-row">
              <span class="meta-chip meta-chip--outline">DingTalk</span>
              <span class="meta-chip meta-chip--soft">{{ isShareConfigReady("dingtalk") ? drText("Webhook configured") : drText("Webhook required") }}</span>
            </div>
            <p class="share-helper">{{ resolveSharePlatformDescription("dingtalk") }}</p>
          </div>

          <pre class="share-pre">{{ dingTalkShareText || shareEmptyStateText }}</pre>

          <div class="share-config">
            <span class="toolbar-label">{{ drText("Robot webhook") }}</span>
            <el-input
              v-model="shareConfig.dingtalk.webhookUrl"
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
              clearable
            />
            <el-input
              v-model="shareConfig.dingtalk.secret"
              type="password"
              show-password
              placeholder="Optional DingTalk robot secret"
              clearable
            />
          </div>

          <div class="share-actions">
            <el-button
              type="primary"
              :loading="shareInFlight === 'dingtalk'"
              :disabled="!dingTalkShareText"
              @click="handleSharePlatform('dingtalk')"
            >
              <el-icon><Promotion /></el-icon>
              {{ drText("Send directly") }}
            </el-button>
            <el-button :disabled="!dingTalkShareText" @click="handleCopyPlatform('dingtalk')">
              <el-icon><CopyDocument /></el-icon>
              {{ drText("Copy text") }}
            </el-button>
            <el-button v-if="supportsNativeShare" :disabled="!dingTalkShareText" @click="handleSystemSharePlatform('dingtalk')">
              {{ drText("System share") }}
            </el-button>
            <el-button @click="handleSaveShareConfig('dingtalk')">{{ drText("Save config") }}</el-button>
            <el-button text @click="handleClearShareConfig('dingtalk')">{{ drText("Clear") }}</el-button>
          </div>
        </article>

        <article class="share-card share-card--wechat">
          <div class="share-card-head">
            <div class="chip-row">
              <span class="meta-chip meta-chip--outline">WeChat Work</span>
              <span class="meta-chip meta-chip--soft">{{ isShareConfigReady("wechat") ? drText("Webhook configured") : drText("Webhook required") }}</span>
            </div>
            <p class="share-helper">{{ resolveSharePlatformDescription("wechat") }}</p>
          </div>

          <pre class="share-pre">{{ wechatShareText || shareEmptyStateText }}</pre>

          <div class="share-config">
            <span class="toolbar-label">{{ drText("Group robot webhook") }}</span>
            <el-input
              v-model="shareConfig.wechat.webhookUrl"
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              clearable
            />
          </div>

          <div class="share-actions">
            <el-button
              type="primary"
              :loading="shareInFlight === 'wechat'"
              :disabled="!wechatShareText"
              @click="handleSharePlatform('wechat')"
            >
              <el-icon><ChatDotRound /></el-icon>
              {{ drText("Send directly") }}
            </el-button>
            <el-button :disabled="!wechatShareText" @click="handleCopyPlatform('wechat')">
              <el-icon><CopyDocument /></el-icon>
              {{ drText("Copy text") }}
            </el-button>
            <el-button v-if="supportsNativeShare" :disabled="!wechatShareText" @click="handleSystemSharePlatform('wechat')">
              {{ drText("System share") }}
            </el-button>
            <el-button @click="handleSaveShareConfig('wechat')">{{ drText("Save config") }}</el-button>
            <el-button text @click="handleClearShareConfig('wechat')">{{ drText("Clear") }}</el-button>
          </div>
        </article>
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { Component } from "vue";
import { ElMessage } from "element-plus";
import { Bell, Calendar, ChatDotRound, CircleCheckFilled, CopyDocument, DataAnalysis, Document, Promotion, RefreshRight, User, WarningFilled } from "@element-plus/icons-vue";
import PageLoadingSkeleton from "@/components/layout/PageLoadingSkeleton.vue";
import { getDailyReportAggregate, shareDailyReport } from "@/api/report";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { useSSE } from "@/composables/useSSE";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import type {
  DailyReportAggregateResult,
  DailyReportGeneratedMetrics,
  DailyReportGeneratedResult,
  DailyReportQueryParams,
  DailyReportSharePayload,
} from "@/types/report";

defineOptions({ name: "DailyReportWorkspace" });

type Tone = "dark" | "light" | "warning" | "success";
type SharePlatform = "dingtalk" | "wechat";

interface ShareBotConfig {
  webhookUrl: string;
  secret: string;
}

interface StoredShareBotConfig {
  dingtalk?: Partial<ShareBotConfig>;
  wechat?: Partial<ShareBotConfig>;
}

interface SummaryCard {
  label: string;
  value: string;
  description: string;
  tone: Tone;
  icon: Component;
}

interface SectionCard {
  key: string;
  label: string;
  count: number;
  description: string;
  tone: Tone;
  icon: Component;
  emptyText: string;
  items: Array<{ id: string; title: string; subtitle: string; meta: string; href?: string }>;
}

const timeZoneOptions = ["Asia/Shanghai", "UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Tokyo"];
const { text: localizedText, isChinese } = useLocalizedText();
const DR_ZH: Record<string, string> = {
  "Sales Ops Journal": "销售运营日志",
  "Daily report": "AI 日报",
  "Generate a manager-ready workday report with the same warm-neutral visual system used by the frontend API document.": "生成面向管理者的工作日报，汇总客户、跟进、商机、订单和通知。",
  Today: "今天",
  "Refresh data": "刷新数据",
  "Stop stream": "停止生成",
  "Generate report": "生成日报",
  "Regenerate report": "重新生成日报",
  "Report date": "日报日期",
  Timezone: "时区",
  Provider: "服务商",
  Model: "模型",
  "Default provider": "默认服务商",
  "Default model": "默认模型",
  "12h cache": "12 小时缓存",
  Enabled: "已启用",
  "Bypass cache": "绕过缓存",
  Streaming: "生成中",
  "Cached report": "缓存日报",
  "Report ready": "日报已就绪",
  "Loading context": "加载上下文",
  "Context ready": "上下文已就绪",
  "Awaiting generation": "等待生成",
  For: "日期",
  "12h cache enabled": "12 小时缓存已启用",
  "Fresh run only": "仅本次重新生成",
  "Streaming output": "流式输出",
  "Structured result": "结构化结果",
  "No output": "暂无输出",
  Context: "上下文",
  Report: "日报",
  "Loaded from cache": "已从缓存加载",
  "Context needs refresh": "上下文需要刷新",
  "Daily report data is unavailable": "AI 日报数据不可用",
  "Try again": "重试",
  "Generated Briefing": "生成简报",
  "AI daily report": "AI 日报",
  tokens: "tokens",
  confidence: "置信度",
  "Copy report": "复制日报",
  Share: "分享",
  "Copy raw": "复制原文",
  "Executive summary": "执行摘要",
  "Manager brief": "管理简报",
  "data gaps": "个数据缺口",
  "Cached replay": "缓存回放",
  "Live generation": "实时生成",
  "Typing...": "生成中...",
  "Replay complete": "回放完成",
  "Waiting for the first streamed tokens from the report generator.": "等待日报生成器返回第一段内容。",
  "No AI report yet": "还没有 AI 日报",
  "Run generation to get the executive summary, follow-up focus, risk watch, and next-day plan.": "点击生成后获取执行摘要、跟进重点、风险观察和明日计划。",
  "Live output": "实时输出",
  "Context Signals": "上下文信号",
  "Source summary": "来源摘要",
  "source confidence": "来源置信度",
  Positive: "正向信号",
  Risk: "风险",
  "No strong positive signal was highlighted.": "暂无明显正向信号。",
  "No urgent risk signal was found in the source data.": "来源数据中暂无紧急风险。",
  Actor: "操作者",
  Unknown: "未知",
  "Workspace member": "工作区成员",
  Workspace: "工作区",
  "Unknown company": "未知公司",
  "No plan info": "暂无套餐信息",
  "Source Records": "来源记录",
  "What fed the report": "日报数据来源",
  sections: "个分区",
  Customer: "客户",
  "New customers": "新增客户",
  Activities: "活动",
  "Completed follow-ups": "已完成跟进",
  "Overdue follow-ups": "逾期跟进",
  "Opportunity movement": "商机变化",
  "Order value": "订单金额",
  "Fresh records created during the selected workday.": "选定工作日内新建的客户记录。",
  "Calls, meetings, and tasks logged during the day.": "当天记录的电话、会议和任务。",
  "Scheduled actions closed in the same report window.": "同一日报窗口内已完成的计划动作。",
  "Items already behind schedule and likely to show up as risk.": "已经逾期且可能形成风险的事项。",
  "Pipeline records updated inside the selected window.": "选定窗口内更新过的销售管道记录。",
  "Orders logged during the workday.": "当天记录的订单。",
  Achievements: "完成事项",
  "Pipeline changes": "管道变化",
  "Follow-up focus": "跟进重点",
  "Risk watch": "风险观察",
  "Next-day plan": "明日计划",
  "Customer changes": "客户变化",
  "New and updated customers that influenced the selected report.": "影响本次日报的新增和更新客户。",
  "No customer profile was created or updated in this workday.": "该工作日没有新建或更新客户档案。",
  Followups: "跟进",
  "Follow-ups": "跟进",
  "Meetings, calls, or tasks captured in the report window.": "日报窗口内捕获的会议、电话或任务。",
  "No activity record was logged for the selected day.": "选定日期没有记录活动。",
  "Completed, scheduled, and overdue follow-up workload for the same date.": "同一日期的已完成、计划中和逾期跟进工作量。",
  "No follow-up activity is attached to this workday.": "该工作日没有关联跟进活动。",
  Pipeline: "销售管道",
  "Opportunity movement that fed the AI summary.": "进入 AI 摘要的商机变化。",
  "No opportunity record moved during the selected workday.": "选定工作日没有商机变化记录。",
  Orders: "订单",
  "Orders and payment state captured in the same day window.": "同一日报窗口内记录的订单和付款状态。",
  "No order was recorded for the selected workday.": "选定工作日没有订单记录。",
  Notifications: "通知",
  "Warning and system signals raised during the same workday.": "同一工作日产生的预警和系统信号。",
  "No notification was generated in the selected window.": "选定窗口内没有通知记录。",
  "Report Share": "日报分享",
  "Share to DingTalk / WeChat Work": "分享到钉钉 / 企业微信",
  "Direct send uses official robot webhooks. The webhook config is stored only in this browser, and copy/system-share fallback remains available for manual forwarding.": "直接发送使用官方群机器人 Webhook，配置只保存在当前浏览器，也可复制或系统分享后手动转发。",
  "Webhook configured": "Webhook 已配置",
  "Webhook required": "需要 Webhook",
  "Robot webhook": "机器人 Webhook",
  "Group robot webhook": "群机器人 Webhook",
  "Send directly": "直接发送",
  "Copy text": "复制文本",
  "System share": "系统分享",
  "Save config": "保存配置",
  Clear: "清除",
  "Generate or stream a report first to prepare the platform share message.": "请先生成或流式生成日报，再准备平台分享内容。",
  "Direct bot send ready": "机器人直发已就绪",
  "Copy fallback always available": "可随时复制转发",
};
const drText = (value: string) => localizedText(DR_ZH[value] || "", value);
const relativeTimeFormatter = computed(() => new Intl.RelativeTimeFormat(isChinese.value ? "zh-CN" : "en", { numeric: "auto" }));
const numberFormatter = computed(() => new Intl.NumberFormat(isChinese.value ? "zh-CN" : "en-US"));
const SHARE_CONFIG_STORAGE_KEY = "daily_report_share_config_v1";

const text = (value: unknown) => (value === undefined || value === null ? "" : String(value).trim());
const titleCase = (value: string) => text(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const compactNumber = (value: unknown) => (Number.isFinite(Number(value)) ? numberFormatter.value.format(Number(value)) : "0");
const confidence = (value: number) => `${Math.round(Math.max(0, Math.min(value, 1)) * 100)}%`;
const joinMeta = (items: Array<string | undefined | null>) => items.map((item) => text(item)).filter(Boolean).join(" · ");
const hrefForCustomer = (id?: string | null) => (id ? `/customer/${id}` : undefined);

const resolveTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
  } catch {
    return "Asia/Shanghai";
  }
};

const formatDateKey = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((item) => item.type === "year")?.value || "0000";
  const month = parts.find((item) => item.type === "month")?.value || "01";
  const day = parts.find((item) => item.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value?: string | null, timeZone?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(isChinese.value ? "zh-CN" : "en-US", {
    timeZone: timeZone || undefined,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No timestamp";
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.value.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.value.format(diffHours, "hour");
  return relativeTimeFormatter.value.format(Math.round(diffHours / 24), "day");
};

const extractJsonObject = (value: string) => {
  const match = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = match?.[1]?.trim() || value.trim();
  const startIndex = source.indexOf("{");
  if (startIndex === -1) return "";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, index + 1);
    }
  }
  return source;
};

const parseReport = (raw: string): DailyReportGeneratedResult | null => {
  const candidate = extractJsonObject(raw);
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const metricsSource = (parsed.metrics && typeof parsed.metrics === "object" && !Array.isArray(parsed.metrics) ? parsed.metrics : {}) as Record<string, unknown>;
    const metrics: DailyReportGeneratedMetrics = {
      newCustomers: Number(metricsSource.newCustomers) || 0,
      updatedCustomers: Number(metricsSource.updatedCustomers) || 0,
      activitiesToday: Number(metricsSource.activitiesToday) || 0,
      completedActivities: Number(metricsSource.completedActivities) || 0,
      scheduledFollowups: Number(metricsSource.scheduledFollowups) || 0,
      completedFollowups: Number(metricsSource.completedFollowups) || 0,
      overdueFollowups: Number(metricsSource.overdueFollowups) || 0,
      opportunitiesTouched: Number(metricsSource.opportunitiesTouched) || 0,
      opportunitiesWon: Number(metricsSource.opportunitiesWon) || 0,
      opportunitiesLost: Number(metricsSource.opportunitiesLost) || 0,
      ordersCreated: Number(metricsSource.ordersCreated) || 0,
      orderAmount: Number(metricsSource.orderAmount) || 0,
    };
    const summary = text(parsed.summary);
    const managerBrief = text(parsed.managerBrief);
    if (!summary || !managerBrief) return null;
    const list = (value: unknown) => (Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : []);
    return {
      summary,
      achievements: list(parsed.achievements),
      pipelineChanges: list(parsed.pipelineChanges),
      followupFocus: list(parsed.followupFocus),
      risks: list(parsed.risks),
      nextDayPlan: list(parsed.nextDayPlan),
      managerBrief,
      metrics,
      confidence: Math.max(0, Math.min(Number(parsed.confidence) || 0, 1)),
      missingData: list(parsed.missingData),
    };
  } catch {
    return null;
  }
};

const requestParams = (query: { date: string; timezone: string; provider: string; model: string }): DailyReportQueryParams => ({
  date: query.date,
  timezone: query.timezone,
  provider: text(query.provider) || undefined,
  model: text(query.model) || undefined,
});

const defaultTimeZone = resolveTimeZone();
const queryState = reactive({
  date: formatDateKey(new Date(), defaultTimeZone),
  timezone: defaultTimeZone,
  provider: "",
  model: "",
  useCache: true,
});

const aggregate = ref<DailyReportAggregateResult | null>(null);
const aggregateLoading = ref(false);
const aggregateError = ref("");
const report = ref<DailyReportGeneratedResult | null>(null);
const reportRaw = ref("");
const reportError = ref("");
const streamMessage = ref("");
const typedContent = ref("");
const shareDialogVisible = ref(false);
const shareInFlight = ref<SharePlatform | "">("");
const shareConfig = reactive<Record<SharePlatform, ShareBotConfig>>({
  dingtalk: {
    webhookUrl: "",
    secret: "",
  },
  wechat: {
    webhookUrl: "",
    secret: "",
  },
});
const reportMeta = reactive({ cached: false, generatedAt: "", totalTokens: null as number | null });
const { streaming, content, error: streamError, start, stop } = useSSE();
let requestId = 0;
let typingTimer: ReturnType<typeof setTimeout> | null = null;
let typingTarget = "";

const aggregateIsStale = computed(() =>
  aggregate.value
    ? aggregate.value.reportWindow.reportDate !== queryState.date || aggregate.value.reportWindow.timeZone !== queryState.timezone
    : false,
);

const heroStatus = computed(() => {
  if (streaming.value) return drText("Streaming");
  if (report.value && reportMeta.cached) return drText("Cached report");
  if (report.value) return drText("Report ready");
  if (aggregateLoading.value) return drText("Loading context");
  if (aggregate.value) return drText("Context ready");
  return drText("Awaiting generation");
});

const selectedDateLabel = computed(() => `${drText("For")} ${queryState.date}`);
const timeZoneLabel = computed(() => `${drText("Timezone")} ${queryState.timezone}`);
const cacheModeLabel = computed(() => (queryState.useCache ? drText("12h cache enabled") : drText("Fresh run only")));
const pageWarning = computed(() => reportError.value || (aggregate.value ? aggregateError.value : ""));
const reportStateLabel = computed(() => (streaming.value ? drText("Streaming output") : reportMeta.cached ? drText("Cached replay") : report.value ? drText("Structured result") : drText("No output")));
const activeRawReport = computed(() => (streaming.value ? content.value : reportRaw.value));
const showTypingPreview = computed(() => Boolean(streaming.value || typedContent.value || content.value) && !report.value);
const showTypingCursor = computed(() => streaming.value || typedContent.value.length < content.value.length);
const displayedRawContent = computed(() => (showTypingCursor.value ? typedContent.value : activeRawReport.value));
const reportHeadingLabel = computed(() => `${queryState.date} (${queryState.timezone})`);
const copyableRawText = computed(() => text(activeRawReport.value));
const supportsNativeShare = computed(() => typeof navigator !== "undefined" && typeof navigator.share === "function");
const shareEmptyStateText = computed(() => drText("Generate or stream a report first to prepare the platform share message."));
const shareDialogStatus = computed(() =>
  isShareConfigReady("dingtalk") || isShareConfigReady("wechat") ? drText("Direct bot send ready") : drText("Copy fallback always available"),
);
const copyableReportText = computed(() => {
  if (report.value) {
    const sections = [
      `Daily Report`,
      `Date: ${reportHeadingLabel.value}`,
      "",
      `Executive Summary`,
      report.value.summary,
      "",
      `Achievements`,
      ...(report.value.achievements.length ? report.value.achievements.map((item) => `- ${item}`) : ["- None"]),
      "",
      `Pipeline Changes`,
      ...(report.value.pipelineChanges.length ? report.value.pipelineChanges.map((item) => `- ${item}`) : ["- None"]),
      "",
      `Follow-up Focus`,
      ...(report.value.followupFocus.length ? report.value.followupFocus.map((item) => `- ${item}`) : ["- None"]),
      "",
      `Risk Watch`,
      ...(report.value.risks.length ? report.value.risks.map((item) => `- ${item}`) : ["- None"]),
      "",
      `Next-day Plan`,
      ...(report.value.nextDayPlan.length ? report.value.nextDayPlan.map((item) => `- ${item}`) : ["- None"]),
      "",
      `Manager Brief`,
      report.value.managerBrief,
      "",
      `Metrics`,
      `- Activities: ${compactNumber(report.value.metrics.activitiesToday)}`,
      `- Completed follow-ups: ${compactNumber(report.value.metrics.completedFollowups)}`,
      `- Overdue follow-ups: ${compactNumber(report.value.metrics.overdueFollowups)}`,
      `- Opportunities touched: ${compactNumber(report.value.metrics.opportunitiesTouched)}`,
      `- Orders created: ${compactNumber(report.value.metrics.ordersCreated)}`,
      `- Order amount: ${compactNumber(report.value.metrics.orderAmount)}`,
      `- Confidence: ${confidence(report.value.confidence)}`,
    ];

    if (report.value.missingData.length) {
      sections.push("", "Data Gaps", ...report.value.missingData.map((item) => `- ${item}`));
    }

    return sections.join("\n");
  }

  if (copyableRawText.value) {
    return copyableRawText.value;
  }

  return "";
});

const formatShareList = (items: string[], limit: number, fallback: string) =>
  items.length ? items.slice(0, limit).map((item) => `- ${item}`) : [`- ${fallback}`];

const dingTalkShareText = computed(() => {
  if (report.value) {
    return [
      `【销售日报】${queryState.date}`,
      `时区：${queryState.timezone}`,
      "",
      "今日摘要",
      report.value.summary,
      "",
      "关键进展",
      ...formatShareList(report.value.achievements, 4, "暂无关键进展"),
      "",
      "风险提醒",
      ...formatShareList(report.value.risks, 3, "暂无重点风险"),
      "",
      "明日计划",
      ...formatShareList(report.value.nextDayPlan, 4, "暂无明确计划"),
      "",
      "管理简报",
      report.value.managerBrief,
    ].join("\n");
  }

  return copyableRawText.value;
});

const wechatShareText = computed(() => {
  if (report.value) {
    return [
      `【日报速递】${queryState.date}`,
      report.value.summary,
      "",
      "进展",
      ...formatShareList(report.value.achievements, 3, "暂无关键进展"),
      "",
      "风险",
      ...formatShareList(report.value.risks, 2, "暂无重点风险"),
      "",
      "明日安排",
      ...formatShareList(report.value.nextDayPlan, 3, "暂无明确安排"),
    ].join("\n");
  }

  return copyableRawText.value;
});

const resolveSharePlatformDescription = (platform: SharePlatform) =>
  platform === "dingtalk"
    ? "Direct-send to a DingTalk group robot webhook. Add the robot secret only when the robot enables signature security."
    : "Direct-send to an Enterprise WeChat group robot webhook. Personal WeChat still uses system share or copy forwarding.";

const resolveShareConfig = (platform: SharePlatform) => shareConfig[platform];

const isShareConfigReady = (platform: SharePlatform) => Boolean(text(resolveShareConfig(platform).webhookUrl));

const loadStoredShareConfig = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawValue = window.localStorage.getItem(SHARE_CONFIG_STORAGE_KEY);
    if (!rawValue) {
      return;
    }

    const parsedValue = JSON.parse(rawValue) as StoredShareBotConfig;
    shareConfig.dingtalk.webhookUrl = text(parsedValue?.dingtalk?.webhookUrl);
    shareConfig.dingtalk.secret = text(parsedValue?.dingtalk?.secret);
    shareConfig.wechat.webhookUrl = text(parsedValue?.wechat?.webhookUrl);
    shareConfig.wechat.secret = text(parsedValue?.wechat?.secret);
  } catch (error) {
    console.error("Failed to restore direct-share config:", error);
  }
};

const persistShareConfig = () => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredShareBotConfig = {
    dingtalk: {
      webhookUrl: text(shareConfig.dingtalk.webhookUrl),
      secret: text(shareConfig.dingtalk.secret),
    },
    wechat: {
      webhookUrl: text(shareConfig.wechat.webhookUrl),
    },
  };

  window.localStorage.setItem(SHARE_CONFIG_STORAGE_KEY, JSON.stringify(payload));
};

const handleSaveShareConfig = (platform: SharePlatform) => {
  const webhookUrl = text(resolveShareConfig(platform).webhookUrl);

  if (!webhookUrl) {
    ElMessage.warning(
      platform === "dingtalk"
        ? "Paste a DingTalk robot webhook before saving."
        : "Paste a WeChat Work group robot webhook before saving.",
    );
    return;
  }

  persistShareConfig();
  ElMessage.success(
    platform === "dingtalk"
      ? "DingTalk direct-share config saved in this browser."
      : "WeChat Work direct-share config saved in this browser.",
  );
};

const handleClearShareConfig = (platform: SharePlatform) => {
  resolveShareConfig(platform).webhookUrl = "";
  resolveShareConfig(platform).secret = "";
  persistShareConfig();
  ElMessage.success(
    platform === "dingtalk"
      ? "DingTalk direct-share config cleared."
      : "WeChat Work direct-share config cleared.",
  );
};

const resolveDirectSharePayload = (platform: SharePlatform): DailyReportSharePayload => ({
  platform: platform === "dingtalk" ? "dingtalk" : "wechat_work",
  webhookUrl: text(resolveShareConfig(platform).webhookUrl),
  secret: platform === "dingtalk" ? text(resolveShareConfig(platform).secret) || undefined : undefined,
  title: resolveShareTitle(platform),
  content: resolveShareText(platform),
});

const clearTypingTimer = () => {
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
};

const writeToClipboard = async (value: string) => {
  const normalizedValue = text(value);

  if (!normalizedValue) {
    throw new Error("There is no report content to copy yet.");
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(normalizedValue);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = normalizedValue;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const pumpTypingFrame = () => {
  const remaining = typingTarget.length - typedContent.value.length;

  if (remaining <= 0) {
    typedContent.value = typingTarget;
    clearTypingTimer();
    return;
  }

  const step = remaining > 320 ? 20 : remaining > 160 ? 12 : remaining > 72 ? 8 : 3;
  typedContent.value = typingTarget.slice(0, typedContent.value.length + step);
  const delay = remaining > 220 ? 10 : remaining > 120 ? 14 : remaining > 48 ? 18 : 26;
  typingTimer = setTimeout(pumpTypingFrame, delay);
};

const syncTypingContent = (nextValue: string) => {
  typingTarget = nextValue;

  if (!nextValue) {
    typedContent.value = "";
    clearTypingTimer();
    return;
  }

  if (!typingTimer) {
    pumpTypingFrame();
  }
};

const summaryCards = computed<SummaryCard[]>(() => {
  const metrics = aggregate.value?.metrics;
  if (!metrics) return [];
  return [
    { label: drText("New customers"), value: compactNumber(metrics.newCustomers), description: drText("Fresh records created during the selected workday."), tone: "dark", icon: User },
    { label: drText("Activities"), value: compactNumber(metrics.activitiesToday), description: drText("Calls, meetings, and tasks logged during the day."), tone: "light", icon: Calendar },
    { label: drText("Completed follow-ups"), value: compactNumber(metrics.completedFollowups), description: drText("Scheduled actions closed in the same report window."), tone: "success", icon: CircleCheckFilled },
    { label: drText("Overdue follow-ups"), value: compactNumber(metrics.overdueFollowups), description: drText("Items already behind schedule and likely to show up as risk."), tone: metrics.overdueFollowups > 0 ? "warning" : "light", icon: WarningFilled },
    { label: drText("Opportunity movement"), value: compactNumber(metrics.opportunitiesTouched), description: drText("Pipeline records updated inside the selected window."), tone: "light", icon: DataAnalysis },
    { label: drText("Order value"), value: metrics.orderAmountLabel, description: `${compactNumber(metrics.ordersCreated)} ${drText("Orders logged during the workday.")}`, tone: "success", icon: Document },
  ];
});

const reportSections = computed(() => {
  if (!report.value) return [];
  return [
    { key: "achievements", label: drText("Achievements"), tone: "success", items: report.value.achievements },
    { key: "pipelineChanges", label: drText("Pipeline changes"), tone: "light", items: report.value.pipelineChanges },
    { key: "followupFocus", label: drText("Follow-up focus"), tone: "light", items: report.value.followupFocus },
    { key: "risks", label: drText("Risk watch"), tone: "warning", items: report.value.risks },
    { key: "nextDayPlan", label: drText("Next-day plan"), tone: "success", items: report.value.nextDayPlan },
  ];
});

const sourceSections = computed<SectionCard[]>(() => {
  const records = aggregate.value?.dailyRecords;
  if (!records) return [];
  const customerItems = [...records.newCustomers, ...records.updatedCustomers].slice(0, 5).map((item) => ({
    id: item._id,
    title: item.name || "Untitled customer",
    subtitle: joinMeta([titleCase(item.status), titleCase(item.level), titleCase(item.source)]) || "Customer detail is sparse.",
    meta: joinMeta([item.aiScore !== null ? `AI score ${Math.round(item.aiScore)}` : "", item.updatedAt ? `Updated ${formatRelativeTime(item.updatedAt)}` : item.createdAt ? formatDateTime(item.createdAt, queryState.timezone) : ""]),
    href: hrefForCustomer(item._id),
  }));
  const followupItems = [...records.completedFollowups, ...records.scheduledFollowups, ...records.overdueFollowups]
    .slice(0, 5)
    .map((item) => ({
      id: item._id,
      title: item.title || "Untitled follow-up",
      subtitle: joinMeta([item.customer?.name, titleCase(item.channel), item.contactName]) || "Follow-up without full customer detail.",
      meta: joinMeta([titleCase(item.priority), item.scheduledAt ? formatDateTime(item.scheduledAt, queryState.timezone) : item.completedAt ? formatDateTime(item.completedAt, queryState.timezone) : "", item.nextStep || item.outcome]),
      href: hrefForCustomer(item.customer?._id),
    }));
  return [
    {
      key: "customers",
      label: drText("Customer changes"),
      count: records.newCustomers.length + records.updatedCustomers.length,
      description: drText("New and updated customers that influenced the selected report."),
      tone: "dark",
      icon: User,
      emptyText: drText("No customer profile was created or updated in this workday."),
      items: customerItems,
    },
    {
      key: "activities",
      label: drText("Activities"),
      count: records.activitiesToday.length,
      description: drText("Meetings, calls, or tasks captured in the report window."),
      tone: "light",
      icon: Calendar,
      emptyText: drText("No activity record was logged for the selected day."),
      items: records.activitiesToday.slice(0, 5).map((item) => ({
        id: item._id,
        title: item.title || "Untitled activity",
        subtitle: joinMeta([item.customer?.name, titleCase(item.type), titleCase(item.status)]) || "Activity without linked customer detail.",
        meta: joinMeta([titleCase(item.priority), item.startTime ? formatDateTime(item.startTime, queryState.timezone) : "", item.nextStep || item.result]),
        href: hrefForCustomer(item.customer?._id),
      })),
    },
    {
      key: "followups",
      label: drText("Follow-ups"),
      count: records.completedFollowups.length + records.scheduledFollowups.length + records.overdueFollowups.length,
      description: drText("Completed, scheduled, and overdue follow-up workload for the same date."),
      tone: records.overdueFollowups.length > 0 ? "warning" : "success",
      icon: CircleCheckFilled,
      emptyText: drText("No follow-up activity is attached to this workday."),
      items: followupItems,
    },
    {
      key: "pipeline",
      label: drText("Pipeline"),
      count: records.opportunitiesToday.length,
      description: drText("Opportunity movement that fed the AI summary."),
      tone: "light",
      icon: DataAnalysis,
      emptyText: drText("No opportunity record moved during the selected workday."),
      items: records.opportunitiesToday.slice(0, 5).map((item) => ({
        id: item._id,
        title: item.name || "Untitled opportunity",
        subtitle: joinMeta([item.customer?.name, titleCase(item.stage), titleCase(item.priority)]) || "Opportunity without descriptive tags.",
        meta: joinMeta([item.estimatedAmountLabel, item.expectedCloseDate ? `Close ${formatDateTime(item.expectedCloseDate, queryState.timezone)}` : "", item.nextStep || item.remark]),
        href: hrefForCustomer(item.customer?._id),
      })),
    },
    {
      key: "orders",
      label: drText("Orders"),
      count: records.ordersToday.length,
      description: drText("Orders and payment state captured in the same day window."),
      tone: "success",
      icon: Document,
      emptyText: drText("No order was recorded for the selected workday."),
      items: records.ordersToday.slice(0, 5).map((item) => ({
        id: item._id,
        title: item.orderNo || "Untitled order",
        subtitle: joinMeta([item.customer?.name, titleCase(item.status), titleCase(item.paymentStatus)]) || "Order without linked customer detail.",
        meta: joinMeta([item.totalAmountLabel, item.orderDate ? formatDateTime(item.orderDate, queryState.timezone) : "", item.remark]),
        href: hrefForCustomer(item.customer?._id),
      })),
    },
    {
      key: "notifications",
      label: drText("Notifications"),
      count: records.notificationsToday.length,
      description: drText("Warning and system signals raised during the same workday."),
      tone: records.notificationsToday.length > 0 ? "warning" : "light",
      icon: Bell,
      emptyText: drText("No notification was generated in the selected window."),
      items: records.notificationsToday.slice(0, 5).map((item) => ({
        id: item._id,
        title: item.title || "Untitled notification",
        subtitle: joinMeta([titleCase(item.level), titleCase(item.category), item.actionLabel]) || "Notification without category metadata.",
        meta: joinMeta([item.createdAt ? formatDateTime(item.createdAt, queryState.timezone) : "", item.message]),
      })),
    },
  ];
});

const loadAggregate = async ({ silent = false } = {}) => {
  requestId += 1;
  const currentRequestId = requestId;
  aggregateLoading.value = true;
  try {
    if (currentRequestId !== requestId) return;
    aggregate.value = unwrapApiResponseData(
      await getDailyReportAggregate(requestParams(queryState)),
      "Failed to load daily report aggregate.",
    );
    aggregateError.value = "";
  } catch (error) {
    if (currentRequestId !== requestId) return;
    aggregateError.value = getRequestErrorMessage(error, "Daily report aggregate could not be loaded.");
    if (!silent) ElMessage.error(aggregateError.value);
  } finally {
    if (currentRequestId === requestId) aggregateLoading.value = false;
  }
};

const setToday = () => {
  queryState.date = formatDateKey(new Date(), queryState.timezone);
};

const handleRefreshAggregate = () => {
  void loadAggregate();
};

const handleStopGeneration = () => {
  stop();
  streamMessage.value = "Report streaming stopped.";
  ElMessage.info("Daily report stream stopped.");
};

const resolveShareText = (platform: SharePlatform) => (platform === "dingtalk" ? dingTalkShareText.value : wechatShareText.value);

const resolveShareTitle = (platform: SharePlatform) =>
  platform === "dingtalk" ? `Daily report for DingTalk ${queryState.date}` : `Daily report for WeChat Work ${queryState.date}`;

const handleOpenShareDialog = () => {
  if (!copyableReportText.value) {
    ElMessage.warning("Generate or stream a report before sharing it.");
    return;
  }

  shareDialogVisible.value = true;
};

const handleCopyPlatform = async (platform: SharePlatform) => {
  try {
    await writeToClipboard(resolveShareText(platform));
    ElMessage.success(platform === "dingtalk" ? "DingTalk share text copied." : "WeChat Work share text copied.");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "Share text could not be copied."));
  }
};

const handleSharePlatform = async (platform: SharePlatform) => {
  const shareText = resolveShareText(platform);

  if (!shareText) {
    ElMessage.warning("Generate or stream a report before sharing it.");
    return;
  }

  const webhookUrl = text(resolveShareConfig(platform).webhookUrl);
  if (!webhookUrl) {
    ElMessage.warning(
      platform === "dingtalk"
        ? "Add a DingTalk robot webhook before direct sending."
        : "Add a WeChat Work group robot webhook before direct sending.",
    );
    return;
  }

  shareInFlight.value = platform;

  try {
    const result = unwrapApiResponseData(
      await shareDailyReport(resolveDirectSharePayload(platform)),
      platform === "dingtalk" ? "Failed to send the report to DingTalk." : "Failed to send the report to WeChat Work.",
    );
    persistShareConfig();
    ElMessage.success(
      platform === "dingtalk"
        ? `Daily report sent to DingTalk via ${result.webhookHost}.`
        : `Daily report sent to WeChat Work via ${result.webhookHost}.`,
    );
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "Direct share could not be completed."));
  } finally {
    shareInFlight.value = "";
  }
};

const handleSystemSharePlatform = async (platform: SharePlatform) => {
  const shareText = resolveShareText(platform);

  if (!shareText) {
    ElMessage.warning("Generate or stream a report before sharing it.");
    return;
  }

  shareInFlight.value = platform;

  try {
    if (!supportsNativeShare.value || !navigator.share) {
      await handleCopyPlatform(platform);
      return;
    }

    try {
      await navigator.share({
        title: resolveShareTitle(platform),
        text: shareText,
      });
      ElMessage.success(
        platform === "dingtalk"
          ? "DingTalk system share sheet opened."
          : "WeChat Work system share sheet opened.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      throw error;
    }
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "System share could not be completed."));
  } finally {
    shareInFlight.value = "";
  }
};

const handleCopyReport = async () => {
  try {
    await writeToClipboard(copyableReportText.value);
    ElMessage.success(report.value ? "Daily report copied." : "Current streamed content copied.");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "Report content could not be copied."));
  }
};

const handleCopyRaw = async () => {
  try {
    await writeToClipboard(copyableRawText.value);
    ElMessage.success("Raw stream copied.");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "Raw output could not be copied."));
  }
};

const handleGenerateReport = async () => {
  reportError.value = "";
  streamMessage.value = "";
  report.value = null;
  reportRaw.value = "";
  typedContent.value = "";
  typingTarget = "";
  clearTypingTimer();
  reportMeta.cached = false;
  reportMeta.generatedAt = "";
  reportMeta.totalTokens = null;
  if (!aggregate.value || aggregateIsStale.value) await loadAggregate({ silent: true });
  await start(
    "/reports/daily/generate",
    { ...requestParams(queryState), useCache: queryState.useCache },
    {
      method: "POST",
      timeoutMs: 180000,
      loadingLabel: reportMeta.cached ? "Replaying cached daily report" : "Generating daily report",
      onMessage: (payload) => {
        if (payload.type === "start") {
          streamMessage.value = payload.message;
          reportMeta.cached = Boolean(payload.cached);
        }
        if (payload.type === "done") {
          reportMeta.totalTokens = payload.totalTokens ?? null;
          reportMeta.cached = Boolean(payload.cached);
          reportMeta.generatedAt = new Date().toISOString();
        }
        if (payload.type === "error") reportError.value = payload.message;
      },
    },
  );
  reportRaw.value = content.value.trim();
  if (streamError.value) {
    reportError.value = streamError.value;
    ElMessage.error(reportError.value);
    return;
  }
  if (!reportRaw.value) {
    reportError.value = "The report stream finished without returning any content.";
    ElMessage.error(reportError.value);
    return;
  }
  const parsed = parseReport(reportRaw.value);
  if (!parsed) {
    reportError.value = "The AI response finished, but the payload could not be parsed as the daily-report schema.";
    ElMessage.warning("Daily report stream completed, but the payload could not be parsed.");
    return;
  }
  report.value = parsed;
  ElMessage.success(reportMeta.cached ? "Cached daily report loaded." : "Daily report generated successfully.");
};

watch(
  content,
  (nextValue) => {
    syncTypingContent(nextValue);
  },
  { flush: "sync" },
);

watch(
  () => [queryState.date, queryState.timezone],
  () => {
    reportError.value = "";
    void loadAggregate({ silent: true });
  },
);

onMounted(() => {
  loadStoredShareConfig();
  void loadAggregate({ silent: true });
});

onUnmounted(() => {
  clearTypingTimer();
});
</script>

<style scoped>
.daily-report{display:flex;flex-direction:column;gap:22px;color:var(--text-primary)}
.hero-card,.toolbar-card,.panel-card,.summary-card,.record-card,.state-card{border:1px solid var(--border-light);background:rgba(255,255,255,.92);box-shadow:0 14px 32px rgba(26,25,23,.04)}
.hero-card{display:flex;justify-content:space-between;gap:24px;padding:30px 32px;border-radius:28px;background:radial-gradient(circle at top right,rgba(195,192,180,.24),transparent 28%),linear-gradient(145deg,rgba(255,255,255,.95),rgba(244,242,236,.96))}
.hero-copy{display:flex;flex-direction:column;gap:12px}
.eyebrow,.toolbar-label,.summary-label,.report-block-label{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-tertiary)}
.eyebrow,.hero-description,.summary-description,.state-card p,.empty-card p,.report-block p{margin:0}
.hero-headline,.hero-actions,.strip-row,.chip-row,.report-block-head,.record-head{display:flex;align-items:center;flex-wrap:wrap;gap:12px}
.hero-headline h1,.panel-head h2,.records-head h2{margin:0;line-height:1.04;letter-spacing:-.05em}
.hero-headline h1{font-size:clamp(30px,4vw,46px)}
.hero-description,.summary-description,.record-copy p,.record-copy span,.state-card p,.empty-card p,.report-block p{color:var(--text-secondary);line-height:1.7}
.hero-pill,.strip-pill,.meta-chip,.record-link{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-weight:700}
.hero-pill{padding:8px 14px;border:1px solid rgba(26,25,23,.08);background:rgba(255,255,255,.76);color:var(--text-secondary);font-size:13px}
.toolbar-card{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;padding:20px 22px;border-radius:22px;background:rgba(244,242,236,.82)}
.field-block{display:flex;flex-direction:column;gap:10px}
.field-block--switch{justify-content:flex-end}
.switch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px;padding:0 12px;border-radius:14px;background:rgba(255,255,255,.88);border:1px solid var(--border-light);color:var(--text-secondary);font-weight:600}
.strip-pill{padding:9px 14px;background:rgba(255,255,255,.84);border:1px solid var(--border-light);color:var(--text-secondary);font-size:13px}
.strip-pill--warning{background:rgba(250,233,206,.92);border-color:rgba(168,114,59,.18);color:rgb(124,79,34)}
.strip-pill--success{background:rgba(222,231,216,.92);border-color:rgba(86,120,78,.16);color:rgb(71,102,64)}
.warning-banner{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:18px;background:rgba(168,114,59,.12);border:1px solid rgba(168,114,59,.18);color:rgb(124,79,34);font-weight:600}
.state-card,.empty-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;min-height:220px;padding:36px 24px;border-radius:24px;text-align:center}
.state-icon,.summary-icon{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.state-icon{width:66px;height:66px;border-radius:22px;background:var(--surface-secondary);color:var(--text-primary);font-size:28px}
.state-icon--small{width:52px;height:52px;border-radius:18px;font-size:24px}
.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.summary-card{position:relative;display:block;min-height:178px;padding:76px 22px 20px;border-radius:22px}
.summary-icon{width:46px;height:46px;border-radius:16px;font-size:20px}
.summary-icon--small{width:40px;height:40px;font-size:18px}
.summary-card>.summary-icon{position:absolute;top:20px;left:22px}
.summary-card--dark .summary-icon,.record-card--dark .summary-icon{background:var(--text-primary);color:var(--surface-white)}
.summary-card--light .summary-icon,.record-card--light .summary-icon{background:var(--surface-secondary);color:var(--text-primary)}
.summary-card--warning .summary-icon,.record-card--warning .summary-icon{background:rgba(168,114,59,.14);color:rgb(124,79,34)}
.summary-card--success .summary-icon,.record-card--success .summary-icon{background:rgba(222,231,216,.92);color:rgb(71,102,64)}
.summary-value{display:block;margin:8px 0 0;font-size:28px;line-height:1}
.summary-value--compact{font-size:24px}
.content-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(320px,.95fr);gap:18px}
.panel-card{display:flex;flex-direction:column;gap:18px;padding:24px;border-radius:24px}
.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.panel-tools,.raw-head{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.panel-head h2,.records-head h2{font-size:28px}
.share-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.share-dialog-head h2{margin:8px 0 0;font-size:28px;line-height:1.05;letter-spacing:-.04em;color:var(--text-primary)}
.share-note{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;margin-bottom:16px;border-radius:18px;background:rgba(244,242,236,.84);border:1px solid var(--border-light);color:var(--text-secondary);line-height:1.7}
.share-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.share-card{display:flex;flex-direction:column;gap:14px;padding:18px 20px;border-radius:22px;border:1px solid var(--border-light);background:rgba(250,249,245,.92)}
.share-card--dingtalk{background:linear-gradient(180deg,rgba(250,249,245,.96),rgba(244,242,236,.92))}
.share-card--wechat{background:linear-gradient(180deg,rgba(246,250,245,.96),rgba(240,246,236,.92))}
.share-card-head{display:flex;flex-direction:column;gap:10px}
.share-helper{margin:0;color:var(--text-secondary);line-height:1.7}
.share-pre{margin:0;padding:16px 18px;border-radius:18px;border:1px solid rgba(26,25,23,.08);background:rgba(255,255,255,.88);color:var(--text-primary);line-height:1.75;white-space:pre-wrap;word-break:break-word;min-height:250px;max-height:360px;overflow:auto}
.share-config{display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:18px;border:1px solid var(--border-light);background:rgba(255,255,255,.72)}
.share-actions{display:flex;flex-wrap:wrap;gap:10px}
.meta-chip{padding:7px 11px;font-size:12px;letter-spacing:.04em;border:1px solid transparent}
.meta-chip--soft{background:rgba(255,255,255,.84);border-color:var(--border-light);color:var(--text-secondary)}
.meta-chip--outline{background:transparent;border-color:var(--border-default);color:var(--text-primary)}
.meta-chip--success{background:rgba(222,231,216,.92);color:rgb(71,102,64)}
.meta-chip--warning{background:rgba(250,233,206,.92);color:rgb(124,79,34)}
.report-layout,.signal-group{display:flex;flex-direction:column;gap:14px}
.report-block,.raw-card,.meta-card,.typing-card{display:flex;flex-direction:column;gap:12px;padding:18px 20px;border-radius:20px;background:rgba(250,249,245,.9);border:1px solid var(--border-light)}
.report-block--hero{background:radial-gradient(circle at top right,rgba(195,192,180,.16),transparent 28%),rgba(250,249,245,.98)}
.report-section-grid,.meta-grid,.records-grid{display:grid;gap:16px}
.report-section-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.report-list{margin:0;padding-left:18px;color:var(--text-secondary);line-height:1.7}
.typing-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.typing-description{margin:0;color:var(--text-secondary);line-height:1.7}
.typing-shell{position:relative;padding:18px 20px;border-radius:18px;border:1px solid rgba(26,25,23,.08);background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(244,242,236,.95));min-height:200px}
.typing-shell--raw{min-height:0}
.typing-pre,.raw-pre{margin:0;color:var(--text-primary);line-height:1.75;white-space:pre-wrap;word-break:break-word}
.typing-pre{padding-right:16px;min-height:160px}
.typing-cursor{position:absolute;right:18px;bottom:18px;width:10px;height:1.2em;border-radius:999px;background:var(--text-primary);animation:blinkCursor .9s steps(1,end) infinite}
.raw-pre{margin:0;padding:16px 18px;border-radius:18px;border:1px solid rgba(26,25,23,.08);background:rgb(248,247,241);color:var(--text-primary);line-height:1.7;white-space:pre-wrap;word-break:break-word;max-height:320px;overflow:auto}
.meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.meta-card strong{display:block;margin-top:8px;font-size:17px}
.meta-card p{margin:8px 0 0;color:var(--text-secondary)}
.records-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
.records-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.record-card{position:relative;display:flex;flex-direction:column;gap:16px;min-height:220px;padding:76px 22px 20px;border-radius:22px}
.record-head .summary-icon{position:absolute;top:20px;left:22px}
.record-list{display:grid;gap:12px}
.record-item{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 0;border-top:1px solid rgba(220,217,207,.72)}
.record-item:first-child{border-top:none;padding-top:0}
.record-copy strong,.record-copy p,.record-copy span{display:block}
.record-copy strong{color:var(--text-primary);line-height:1.4}
.record-copy p{margin:6px 0 0}
.record-copy span{margin-top:8px;color:var(--text-tertiary);font-size:13px;line-height:1.5}
.record-link{flex-shrink:0;padding:8px 12px;border:1px solid var(--border-default);color:var(--text-primary);text-decoration:none;background:rgba(255,255,255,.9)}
.record-link:hover{background:var(--surface-secondary)}
.record-empty{padding:18px;border-radius:18px;border:1px dashed var(--border-default);background:rgba(250,249,245,.9);color:var(--text-secondary);line-height:1.7}
@keyframes blinkCursor{0%,45%{opacity:1}46%,100%{opacity:0}}
@media (max-width:1240px){.toolbar-card,.summary-grid,.records-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.content-grid{grid-template-columns:1fr}}
@media (max-width:880px){.hero-card,.records-head,.share-dialog-head{flex-direction:column;align-items:stretch}.toolbar-card,.summary-grid,.report-section-grid,.records-grid,.meta-grid,.share-grid{grid-template-columns:1fr}.panel-tools,.raw-head{align-items:stretch}}
@media (max-width:640px){.daily-report{gap:18px}.hero-card,.toolbar-card,.panel-card,.summary-card,.record-card{padding:18px}.hero-headline h1{font-size:32px}.panel-head h2,.records-head h2{font-size:24px}.record-item{flex-direction:column}}
</style>
