"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@multica/ui/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@multica/ui/components/ui/dropdown-menu";
import { useWorkspaceId } from "@multica/core/hooks";
import { useAuthStore } from "@multica/core/auth";
import { useCurrentWorkspace } from "@multica/core/paths";
import { agentListOptions, memberListOptions } from "@multica/core/workspace/queries";
import { canAssignAgent } from "@multica/views/issues/components";
import { api } from "@multica/core/api";
import { useAgentPresenceDetail, useWorkspaceAgentAvailability } from "@multica/core/agents";
import { ActorAvatar } from "../common/actor-avatar";
import { WorkspaceAvatar } from "../workspace/workspace-avatar";
import { OfflineBanner } from "./components/offline-banner";
import { NoAgentBanner } from "./components/no-agent-banner";
import {
  chatSessionsOptions,
  allChatSessionsOptions,
  chatMessagesOptions,
  pendingChatTaskOptions,
  pendingChatTasksOptions,
  chatKeys,
} from "@multica/core/chat/queries";
import { useCreateChatSession, useMarkChatSessionRead } from "@multica/core/chat/mutations";
import { useChatStore } from "@multica/core/chat";
import { ChatMessageList, ChatMessageSkeleton } from "./components/chat-message-list";
import { ChatInput } from "./components/chat-input";
import {
  ContextAnchorButton,
  ContextAnchorCard,
  buildAnchorMarkdown,
  useRouteAnchorCandidate,
} from "./components/context-anchor";
import { createLogger } from "@multica/core/logger";
import type { Agent, ChatMessage, ChatPendingTask, ChatSession } from "@multica/core/types";

const uiLogger = createLogger("chat.page");
const apiLogger = createLogger("chat.api");

/**
 * Full-height chat page — reuses the same data layer and store as the
 * floating `ChatWindow`, but rendered in a page container instead of an
 * absolute-positioned overlay.
 */
export function ChatPage() {
  const wsId = useWorkspaceId();
  const workspace = useCurrentWorkspace();
  const selectedAgentId = useChatStore((s) => s.selectedAgentId);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const setSelectedAgentId = useChatStore((s) => s.setSelectedAgentId);
  const user = useAuthStore((s) => s.user);
  const { data: agents = [] } = useQuery(agentListOptions(wsId));
  const { data: members = [] } = useQuery(memberListOptions(wsId));
  const { data: sessions = [] } = useQuery(chatSessionsOptions(wsId));
  const { data: allSessions = [] } = useQuery(allChatSessionsOptions(wsId));

  // Active session: page-level store. Falls back to store's activeSessionId
  // if the user already had a session open from the floating panel.
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);
  const activeSessionId = localSessionId ?? useChatStore((s) => s.activeSessionId);

  const { data: rawMessages, isLoading: messagesLoading } = useQuery(
    chatMessagesOptions(activeSessionId ?? ""),
  );
  const messages = activeSessionId ? rawMessages ?? [] : [];
  const showSkeleton = !!activeSessionId && messagesLoading;

  const { data: pendingTask } = useQuery(
    pendingChatTaskOptions(activeSessionId ?? ""),
  );
  const pendingTaskId = pendingTask?.task_id ?? null;

  const currentSession = activeSessionId
    ? allSessions.find((s) => s.id === activeSessionId)
    : null;
  const isSessionArchived = currentSession?.status === "archived";

  const qc = useQueryClient();
  const createSession = useCreateChatSession();
  const markRead = useMarkChatSessionRead();

  const currentMember = members.find((m) => m.user_id === user?.id);
  const memberRole = currentMember?.role;
  const availableAgents = agents.filter(
    (a) => !a.archived_at && canAssignAgent(a, user?.id, memberRole),
  );

  const activeAgent =
    availableAgents.find((a) => a.id === selectedAgentId) ??
    availableAgents[0] ??
    null;

  const agentAvailability = useWorkspaceAgentAvailability();
  const noAgent = agentAvailability === "none";

  const presenceDetail = useAgentPresenceDetail(wsId, activeAgent?.id);
  const availability =
    presenceDetail === "loading" ? undefined : presenceDetail.availability;

  const hasMessages = messages.length > 0 || !!pendingTaskId;

  const { candidate: anchorCandidate } = useRouteAnchorCandidate(wsId);

  useEffect(() => {
    uiLogger.info("ChatPage mount", { activeSessionId, pendingTaskId, wsId });
    return () => {
      uiLogger.info("ChatPage unmount", { activeSessionId, pendingTaskId });
    };
  }, []);

  // Auto mark-as-read (same as ChatWindow)
  const currentHasUnread =
    sessions.find((s) => s.id === activeSessionId)?.has_unread ?? false;
  useEffect(() => {
    if (!activeSessionId) return;
    if (!currentHasUnread) return;
    uiLogger.info("auto markRead", { sessionId: activeSessionId });
    markRead.mutate(activeSessionId);
  }, [activeSessionId, currentHasUnread]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeAgent) return;

      const focusOn = useChatStore.getState().focusMode;
      const finalContent = focusOn && anchorCandidate
        ? `${buildAnchorMarkdown(anchorCandidate)}\n\n${content}`
        : content;

      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createSession.mutateAsync({
          agent_id: activeAgent.id,
          title: finalContent.slice(0, 50),
        });
        sessionId = session.id;
        setLocalSessionId(sessionId);
        setActiveSession(sessionId);
      }

      const sentAt = new Date().toISOString();
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        chat_session_id: sessionId,
        role: "user",
        content: finalContent,
        task_id: null,
        created_at: sentAt,
      };
      qc.setQueryData<ChatMessage[]>(
        chatKeys.messages(sessionId),
        (old) => (old ? [...old, optimistic] : [optimistic]),
      );
      qc.setQueryData<ChatPendingTask>(chatKeys.pendingTask(sessionId), {
        task_id: `optimistic-${optimistic.id}`,
        status: "queued",
        created_at: sentAt,
      });

      const result = await api.sendChatMessage(sessionId, finalContent);
      qc.setQueryData<ChatPendingTask>(chatKeys.pendingTask(sessionId), {
        task_id: result.task_id,
        status: "queued",
        created_at: result.created_at,
      });
      qc.invalidateQueries({ queryKey: chatKeys.messages(sessionId) });
    },
    [activeSessionId, activeAgent, anchorCandidate, createSession, setActiveSession, qc],
  );

  const handleStop = useCallback(() => {
    if (!pendingTaskId || !activeSessionId) return;
    apiLogger.info("cancelTask.start", { taskId: pendingTaskId, sessionId: activeSessionId });
    qc.setQueryData(chatKeys.pendingTask(activeSessionId), {});
    qc.invalidateQueries({ queryKey: chatKeys.messages(activeSessionId) });
    api.cancelTaskById(pendingTaskId).then(
      () => apiLogger.info("cancelTask.success", { taskId: pendingTaskId }),
      (err) =>
        apiLogger.warn("cancelTask.error", {
          taskId: pendingTaskId,
          err,
        }),
    );
  }, [pendingTaskId, activeSessionId, qc]);

  const handleSelectAgent = useCallback(
    (agent: Agent) => {
      if (activeAgent && agent.id === activeAgent.id) return;
      uiLogger.info("selectAgent", { from: selectedAgentId, to: agent.id });
      setSelectedAgentId(agent.id);
      setActiveSession(null);
      setLocalSessionId(null);
    },
    [activeAgent, selectedAgentId, setSelectedAgentId, setActiveSession],
  );

  const handleNewChat = useCallback(() => {
    uiLogger.info("newChat", { previousSessionId: activeSessionId });
    setActiveSession(null);
    setLocalSessionId(null);
  }, [activeSessionId, setActiveSession]);

  const handleSelectSession = useCallback(
    (session: ChatSession) => {
      if (activeAgent && session.agent_id !== activeAgent.id) {
        uiLogger.info("selectSession (cross-agent)", {
          from: activeAgent.id,
          toAgent: session.agent_id,
        });
        setSelectedAgentId(session.agent_id);
      }
      setActiveSession(session.id);
      setLocalSessionId(session.id);
    },
    [activeAgent, setSelectedAgentId, setActiveSession],
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Page header: workspace + chat title */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b shrink-0">
        <WorkspaceAvatar name={workspace?.name ?? "W"} size="sm" />
        <span className="text-sm text-muted-foreground">{workspace?.name ?? "Workspace"}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm font-medium">Chat</span>
      </div>

      {/* Chat toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 gap-2 shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-muted-foreground"
                  onClick={handleNewChat}
                />
              }
            >
              <Plus />
            </TooltipTrigger>
            <TooltipContent side="top">New chat</TooltipContent>
          </Tooltip>
          <PageSessionDropdown
            sessions={sessions}
            agents={agents}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>
      </div>

      {/* Messages / skeleton / empty state */}
      {showSkeleton ? (
        <ChatMessageSkeleton />
      ) : hasMessages ? (
        <ChatMessageList
          messages={messages}
          pendingTask={pendingTask}
          availability={availability}
        />
      ) : (
        <PageEmptyState
          hasSessions={sessions.length > 0}
          agentName={activeAgent?.name}
          onPickPrompt={(text) => handleSend(text)}
        />
      )}

      {/* Status banners */}
      {noAgent ? (
        <NoAgentBanner />
      ) : (
        <OfflineBanner agentName={activeAgent?.name} availability={availability} />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isRunning={!!pendingTaskId}
        disabled={isSessionArchived}
        noAgent={noAgent}
        agentName={activeAgent?.name}
        topSlot={<ContextAnchorCard />}
        leftAdornment={
          <PageAgentDropdown
            agents={availableAgents}
            activeAgent={activeAgent}
            userId={user?.id}
            onSelect={handleSelectAgent}
          />
        }
        rightAdornment={<ContextAnchorButton />}
      />
    </div>
  );
}

/* ─── Inline dropdowns (adapted from ChatWindow) ─── */

function PageAgentDropdown({
  agents,
  activeAgent,
  userId,
  onSelect,
}: {
  agents: Agent[];
  activeAgent: Agent | null;
  userId: string | undefined;
  onSelect: (agent: Agent) => void;
}) {
  const { mine, others } = useMemo(() => {
    const mine: Agent[] = [];
    const others: Agent[] = [];
    for (const a of agents) {
      if (a.owner_id === userId) mine.push(a);
      else others.push(a);
    }
    return { mine, others };
  }, [agents, userId]);

  if (!activeAgent) {
    return <span className="text-xs text-muted-foreground">No agents</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-1.5 py-1 -ml-1 cursor-pointer outline-none transition-colors hover:bg-accent aria-expanded:bg-accent">
        <ActorAvatar
          actorType="agent"
          actorId={activeAgent.id}
          size={24}
          enableHoverCard
          showStatusDot
        />
        <span className="text-xs font-medium max-w-28 truncate">{activeAgent.name}</span>
        <ChevronDown className="size-3 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="max-h-80 w-auto max-w-64">
        {mine.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>My agents</DropdownMenuLabel>
            {mine.map((agent) => (
              <AgentMenuItem
                key={agent.id}
                agent={agent}
                isCurrent={agent.id === activeAgent.id}
                onSelect={onSelect}
              />
            ))}
          </DropdownMenuGroup>
        )}
        {mine.length > 0 && others.length > 0 && <DropdownMenuSeparator />}
        {others.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Others</DropdownMenuLabel>
            {others.map((agent) => (
              <AgentMenuItem
                key={agent.id}
                agent={agent}
                isCurrent={agent.id === activeAgent.id}
                onSelect={onSelect}
              />
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AgentMenuItem({
  agent,
  isCurrent,
  onSelect,
}: {
  agent: Agent;
  isCurrent: boolean;
  onSelect: (agent: Agent) => void;
}) {
  return (
    <DropdownMenuItem
      onClick={() => onSelect(agent)}
      className="flex min-w-0 items-center gap-2"
    >
      <ActorAvatar
        actorType="agent"
        actorId={agent.id}
        size={24}
        enableHoverCard
        showStatusDot
      />
      <span className="truncate flex-1">{agent.name}</span>
      {isCurrent && <Check className="size-3.5 text-muted-foreground shrink-0" />}
    </DropdownMenuItem>
  );
}

function PageSessionDropdown({
  sessions,
  agents,
  activeSessionId,
  onSelectSession,
}: {
  sessions: ChatSession[];
  agents: Agent[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
}) {
  const wsId = useWorkspaceId();
  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const title = activeSession?.title?.trim() || "New chat";
  const triggerAgent = activeSession ? agentById.get(activeSession.agent_id) ?? null : null;

  const { data: pending } = useQuery(pendingChatTasksOptions(wsId));
  const inFlightSessionIds = useMemo(
    () => new Set((pending?.tasks ?? []).map((t) => t.chat_session_id)),
    [pending],
  );

  const otherSessionRunning = sessions.some(
    (s) => s.id !== activeSessionId && inFlightSessionIds.has(s.id),
  );
  const otherSessionUnread = sessions.some(
    (s) => s.id !== activeSessionId && s.has_unread,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 min-w-0 rounded-md px-1.5 py-1 transition-colors hover:bg-accent aria-expanded:bg-accent">
        {triggerAgent && (
          <ActorAvatar
            actorType="agent"
            actorId={triggerAgent.id}
            size={24}
            enableHoverCard
            showStatusDot
          />
        )}
        <span className="truncate text-sm font-medium">{title}</span>
        {otherSessionRunning ? (
          <span aria-label="Another chat is running" title="Another chat is running" className="size-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
        ) : otherSessionUnread ? (
          <span aria-label="Another chat has unread replies" title="Another chat has unread replies" className="size-1.5 shrink-0 rounded-full bg-brand" />
        ) : null}
        <ChevronDown className="size-3 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-auto min-w-56 max-w-80">
        {sessions.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No previous chats</div>
        ) : (
          sessions.map((session) => {
            const isCurrent = session.id === activeSessionId;
            const agent = agentById.get(session.agent_id) ?? null;
            const isRunning = inFlightSessionIds.has(session.id);
            return (
              <DropdownMenuItem
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="flex min-w-0 items-center gap-2"
              >
                {agent ? (
                  <ActorAvatar actorType="agent" actorId={agent.id} size={24} enableHoverCard showStatusDot />
                ) : (
                  <span className="size-6 shrink-0" />
                )}
                <span className="truncate flex-1 text-sm">{session.title?.trim() || "New chat"}</span>
                {isRunning ? (
                  <span aria-label="Running" title="Running" className="size-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
                ) : session.has_unread ? (
                  <span aria-label="Unread" title="Unread" className="size-1.5 shrink-0 rounded-full bg-brand" />
                ) : null}
                {isCurrent && <Check className="size-3.5 text-muted-foreground shrink-0" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PageEmptyState({
  hasSessions,
  agentName,
  onPickPrompt,
}: {
  hasSessions: boolean;
  agentName?: string;
  onPickPrompt: (text: string) => void;
}) {
  if (!hasSessions) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8">
        <div className="text-center space-y-3">
          <h3 className="text-base font-semibold">Chat with your agents</h3>
          <p className="text-sm text-muted-foreground">
            They know your workspace —{" "}
            <span className="font-medium text-foreground">issues, projects, skills</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Ask for a summary, plan your day, or hand off a quick task.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-8">
      <div className="text-center space-y-1">
        <h3 className="text-base font-semibold">
          {agentName ? `Hi, I'm ${agentName}` : "Welcome to Multica"}
        </h3>
        <p className="text-sm text-muted-foreground">Try asking</p>
      </div>
      <StarterPrompts onPick={onPickPrompt} />
    </div>
  );
}

const STARTER_PROMPTS: { icon: string; text: string }[] = [
  { icon: "📋", text: "List my open tasks by priority" },
  { icon: "📝", text: "Summarize what I did today" },
  { icon: "💡", text: "Plan what to work on next" },
];

function StarterPrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="w-full max-w-xs space-y-2">
      {STARTER_PROMPTS.map((prompt) => (
        <button
          key={prompt.text}
          type="button"
          onClick={() => onPick(prompt.text)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent hover:border-brand/40"
        >
          <span className="mr-2">{prompt.icon}</span>
          {prompt.text}
        </button>
      ))}
    </div>
  );
}
