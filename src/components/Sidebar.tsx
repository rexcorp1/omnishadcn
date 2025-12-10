import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Trans, useTranslation } from 'react-i18next';
import {
  LuDownload,
  LuEllipsisVertical, // GANTI DARI LuMoreVertical KE LuEllipsisVertical
  LuPencil,
  LuSquarePen,
  LuTrash,
} from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { useChatContext } from '../context/chat';
import { useModals } from '../context/modal';
import IndexedDB from '../database/indexedDB';
import { Conversation } from '../types';
import { downloadAsFile } from './common';

// Import komponen Shadcn UI
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

export default function AppSidebar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    const handleConversationChange = async () => {
      setConversations(await IndexedDB.getAllConversations());
    };
    IndexedDB.onConversationChanged(handleConversationChange);
    handleConversationChange();
    return () => {
      IndexedDB.offConversationChanged(handleConversationChange);
    };
  }, []);

  const groupedConv = useMemo(
    () => groupConversationsByDate(conversations, i18n.language),
    [i18n.language, conversations]
  );

  const handleSelect = useCallback(() => {
    setOpenMobile(false); // Tutup sidebar di mobile saat item dipilih
  }, [setOpenMobile]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-2">
          <span
            className="font-bold tracking-wider cursor-pointer text-foreground"
            onClick={() => navigate('/')}
          >
            {import.meta.env.VITE_APP_NAME}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            title={t('header.buttons.newConv')}
          >
            <LuSquarePen className="w-5 h-5" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groupedConv.map((group) => (
          <ConversationGroup
            key={group.title}
            group={group}
            onItemSelect={handleSelect}
          />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="text-center text-xs opacity-75 p-4">
          <Trans i18nKey="sidebar.storageNote" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

const ConversationGroup = memo(
  ({
    group,
    onItemSelect,
  }: {
    group: GroupedConversations;
    onItemSelect: () => void;
  }) => {
    const { t } = useTranslation();

    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          <Trans
            i18nKey={`sidebar.groups.${group.title}`}
            defaults={group.title}
          />
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {group.conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                onSelect={onItemSelect}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }
);

const ConversationItem = memo(
  ({ conv, onSelect }: { conv: Conversation; onSelect: () => void }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { viewingChat, isGenerating } = useChatContext();
    const { showConfirm, showPrompt } = useModals();

    const isCurrent = useMemo(
      () => viewingChat?.conv?.id === conv.id,
      [conv.id, viewingChat?.conv?.id]
    );

    const isPending = useMemo(
      () => isGenerating(conv.id),
      [conv.id, isGenerating]
    );

    const handleSelect = () => {
      onSelect();
      navigate(`/chat/${conv.id}`);
    };

    const handleRename = async () => {
      if (isPending) return toast.error(t('sidebar.errors.renameOnGenerate'));
      const newName = await showPrompt(t('sidebar.actions.newName'), conv.name);
      if (newName && newName.trim().length > 0) {
        IndexedDB.updateConversationName(conv.id, newName);
      }
    };

    const handleDownload = async () => {
      if (isPending) return toast.error(t('sidebar.errors.downloadOnGenerate'));
      return IndexedDB.exportDB(conv.id).then((data) =>
        downloadAsFile(
          [JSON.stringify(data, null, 2)],
          `conversation_${conv.id}.json`
        )
      );
    };

    const handleDelete = async () => {
      if (isPending) return toast.error(t('sidebar.errors.deleteOnGenerate'));
      if (await showConfirm(t('sidebar.actions.deleteConfirm'))) {
        toast.success(t('sidebar.actions.deleteSuccess'));
        IndexedDB.deleteConversation(conv.id);
        navigate('/');
      }
    };

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isCurrent}
          onClick={handleSelect}
          className="group justify-between h-auto py-2"
        >
          <span className="truncate">{conv.name}</span>
          
          {/* Dropdown Menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer">
                  {/* Gunakan LuEllipsisVertical di sini */}
                  <LuEllipsisVertical className="w-4 h-4" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRename}>
                  <LuPencil className="mr-2 w-4 h-4" />
                  <Trans i18nKey="sidebar.buttons.rename" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <LuDownload className="mr-2 w-4 h-4" />
                  <Trans i18nKey="sidebar.buttons.download" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <LuTrash className="mr-2 w-4 h-4" />
                  <Trans i18nKey="sidebar.buttons.delete" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
);

export interface GroupedConversations {
  title?: string;
  conversations: Conversation[];
}

export function groupConversationsByDate(
  conversations: Conversation[],
  language: string = 'default'
): GroupedConversations[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
  };
  const monthlyGroups: { [key: string]: Conversation[] } = {};

  const sortedConversations = [...conversations].sort(
    (a, b) => b.lastModified - a.lastModified
  );

  for (const conv of sortedConversations) {
    const convDate = new Date(conv.lastModified);
    if (convDate >= today) groups['Today'].push(conv);
    else if (convDate >= yesterday) groups['Yesterday'].push(conv);
    else if (convDate >= sevenDaysAgo) groups['Previous 7 Days'].push(conv);
    else if (convDate >= thirtyDaysAgo) groups['Previous 30 Days'].push(conv);
    else {
      const monthName = convDate.toLocaleString(language, { month: 'long' });
      const year = convDate.getFullYear();
      const monthYearKey = `${monthName} ${year}`;
      if (!monthlyGroups[monthYearKey]) monthlyGroups[monthYearKey] = [];
      monthlyGroups[monthYearKey].push(conv);
    }
  }

  const result: GroupedConversations[] = [];
  if (groups['Today'].length > 0) result.push({ title: 'Today', conversations: groups['Today'] });
  if (groups['Yesterday'].length > 0) result.push({ title: 'Yesterday', conversations: groups['Yesterday'] });
  if (groups['Previous 7 Days'].length > 0) result.push({ title: 'Previous 7 Days', conversations: groups['Previous 7 Days'] });
  if (groups['Previous 30 Days'].length > 0) result.push({ title: 'Previous 30 Days', conversations: groups['Previous 30 Days'] });

  const sortedMonthKeys = Object.keys(monthlyGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  for (const monthKey of sortedMonthKeys) {
    if (monthlyGroups[monthKey].length > 0) result.push({ title: monthKey, conversations: monthlyGroups[monthKey] });
  }
  return result;
}