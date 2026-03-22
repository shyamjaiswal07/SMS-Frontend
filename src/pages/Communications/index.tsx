import { BellOutlined, MessageOutlined, NotificationOutlined, PlusOutlined, PushpinOutlined, ReloadOutlined, SendOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Tooltip, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BulkCampaignCenter from "@/features/communications/BulkCampaignCenter";
import NotificationPreferencesPanel from "@/features/communications/NotificationPreferencesPanel";
import { communicationsApi } from "@/features/communications/communicationsApi";
import { useGetAdminUsersQuery } from "@/features/admin/adminApiSlice";
import { rowsOf } from "@/utils/platform";

type Role =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "PARENT"
  | "STUDENT"
  | "ACCOUNTANT"
  | "HR_MANAGER"
  | "LIBRARIAN"
  | "TRANSPORT_COORDINATOR";

type Paginated<T> = { results?: T[] };
type User = { id: number; email?: string; username?: string; first_name?: string; last_name?: string; role?: string };
type Announcement = { id: number; title: string; body: string; target_roles?: string[]; publish_at?: string | null; expire_at?: string | null; is_pinned?: boolean; created_at?: string };
type Thread = { id: number; subject?: string; is_group?: boolean; created_at?: string };
type Participant = { id: number; thread: number; user: number };
type MessageRow = { id: number; thread: number; sender?: number | null; body: string; attachment_url?: string; status?: string; created_at?: string };
type NotificationRow = { id: number; user: number; title: string; channel?: string; status?: string; scheduled_at?: string | null };
type Unread = { unread: number; by_channel: Array<{ channel: string; total: number }> };

type ThreadForm = { subject?: string; is_group?: boolean; participant_ids?: number[]; initial_message?: string };
type ReplyForm = { body: string; attachment_url?: string; status: string };
type AnnouncementForm = { title: string; body: string; target_roles?: string[]; publish_at?: string; expire_at?: string; is_pinned?: boolean };
type NotificationForm = { user: number; title: string; body?: string; channel: string; status: string; scheduled_at?: string; payload?: string };
type ParticipantForm = { user: number };

const dt = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");

function getRole(): Role | undefined {
  try {
    const raw = sessionStorage.getItem("tenant");
    return raw ? (JSON.parse(raw)?.role as Role | undefined) : undefined;
  } catch {
    return undefined;
  }
}

export default function CommunicationsPage() {
  const [params, setParams] = useSearchParams();
  const role = useMemo(() => getRole(), []);
  const canAnnounce = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "TEACHER";
  const canThread = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "TEACHER" || role === "PARENT" || role === "STUDENT";
  const canNotify = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "TEACHER" || role === "ACCOUNTANT" || role === "HR_MANAGER";

  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messagesData, setMessagesData] = useState<MessageRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState<Unread>({ unread: 0, by_channel: [] });
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [participantOpen, setParticipantOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [threadForm] = Form.useForm<ThreadForm>();
  const [replyForm] = Form.useForm<ReplyForm>();
  const [announcementForm] = Form.useForm<AnnouncementForm>();
  const [notificationForm] = Form.useForm<NotificationForm>();
  const [participantForm] = Form.useForm<ParticipantForm>();
  const {
    data: usersData,
    isFetching: usersLoading,
    refetch: refetchUsers,
  } = useGetAdminUsersQuery({ page: 1, page_size: 200 });
  const users = rowsOf(usersData) as User[];

  const loadAll = async () => {
    setLoading(true);
    try {
      const {
        announcementsData,
        threadsData,
        participantsData,
        messagesData: nextMessagesData,
        notificationsData,
        unreadData,
      } = await communicationsApi.loadWorkspace();

      setAnnouncements(rowsOf<Announcement>(announcementsData as Paginated<Announcement> | Announcement[]));
      setThreads(rowsOf<Thread>(threadsData as Paginated<Thread> | Thread[]));
      setParticipants(rowsOf<Participant>(participantsData as Paginated<Participant> | Participant[]));
      setMessagesData(rowsOf<MessageRow>(nextMessagesData as Paginated<MessageRow> | MessageRow[]));
      setNotifications(rowsOf<NotificationRow>(notificationsData as Paginated<NotificationRow> | NotificationRow[]));
      setUnread(unreadData as Unread);
    } catch (error) {
      message.error("Failed to load communications workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!threads.length) {
      setSelectedThreadId(null);
      return;
    }
    if (!selectedThreadId || !threads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(threads[0].id);
    }
  }, [selectedThreadId, threads]);

  const userMap = useMemo(
    () =>
      new Map(
        users.map((user) => [
          user.id,
          `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || user.username || `User #${user.id}`,
        ]),
      ),
    [users],
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${userMap.get(user.id)}${user.role ? ` (${user.role})` : ""}`,
      })),
    [userMap, users],
  );

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedThreadId) ?? null, [selectedThreadId, threads]);
  const threadParticipants = useMemo(() => participants.filter((item) => item.thread === selectedThreadId), [participants, selectedThreadId]);
  const threadMessages = useMemo(
    () => messagesData.filter((item) => item.thread === selectedThreadId).sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()),
    [messagesData, selectedThreadId],
  );

  const availableParticipants = useMemo(() => {
    const existing = new Set(threadParticipants.map((item) => item.user));
    return userOptions.filter((item) => !existing.has(Number(item.value)));
  }, [threadParticipants, userOptions]);

  const threadCards = useMemo(
    () =>
      threads.map((thread) => {
        const items = messagesData.filter((item) => item.thread === thread.id);
        const last = [...items].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())[0];
        return { ...thread, count: items.length, lastBody: last?.body ?? "No messages yet", lastAt: last?.created_at ?? thread.created_at };
      }),
    [messagesData, threads],
  );

  const notificationColumns: ColumnsType<NotificationRow> = [
    { title: "Title", dataIndex: "title", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "User", dataIndex: "user", render: (value) => <span className="text-white/65">{userMap.get(value) ?? `User #${value}`}</span> },
    { title: "Channel", dataIndex: "channel", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "READ" ? "green" : value === "FAILED" ? "red" : "orange"}>{value}</Tag> },
    { title: "Scheduled", dataIndex: "scheduled_at", render: (value) => <span className="text-white/55">{dt(value)}</span> },
  ];

  const sendReply = async () => {
    if (!selectedThreadId) return;
    const values = await replyForm.validateFields();
    setSubmitting(true);
    try {
      await communicationsApi.sendMessage({ thread: selectedThreadId, body: values.body, attachment_url: values.attachment_url ?? "", status: values.status });
      message.success("Message sent");
      replyForm.resetFields();
      replyForm.setFieldsValue({ status: "SENT" });
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const createThread = async () => {
    const values = await threadForm.validateFields();
    setSubmitting(true);
    try {
      const response = await communicationsApi.createThread({ subject: values.subject ?? "", is_group: values.is_group ?? false });
      const threadId = (response as { id: number }).id;
      for (const participantId of values.participant_ids ?? []) {
        await communicationsApi.addParticipant({ thread: threadId, user: participantId });
      }
      if (values.initial_message?.trim()) {
        await communicationsApi.sendMessage({ thread: threadId, body: values.initial_message.trim(), status: "SENT" });
      }
      message.success("Thread created");
      setThreadOpen(false);
      threadForm.resetFields();
      await loadAll();
      setSelectedThreadId(threadId);
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to create thread");
    } finally {
      setSubmitting(false);
    }
  };

  const createAnnouncement = async () => {
    const values = await announcementForm.validateFields();
    setSubmitting(true);
    try {
      await communicationsApi.createAnnouncement(values);
      message.success("Announcement published");
      setAnnouncementOpen(false);
      announcementForm.resetFields();
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const createParticipant = async () => {
    if (!selectedThreadId) return;
    const values = await participantForm.validateFields();
    setSubmitting(true);
    try {
      await communicationsApi.addParticipant({ thread: selectedThreadId, user: values.user });
      message.success("Participant added");
      setParticipantOpen(false);
      participantForm.resetFields();
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to add participant");
    } finally {
      setSubmitting(false);
    }
  };

  const createNotification = async () => {
    const values = await notificationForm.validateFields();
    setSubmitting(true);
    try {
      await communicationsApi.createNotification({
        user: values.user,
        title: values.title,
        body: values.body ?? "",
        channel: values.channel,
        status: values.status,
        scheduled_at: values.scheduled_at || null,
        payload: values.payload?.trim() ? JSON.parse(values.payload) : {},
      });
      message.success("Notification queued");
      setNotificationOpen(false);
      notificationForm.resetFields();
      notificationForm.setFieldsValue({ channel: "IN_APP", status: "PENDING", payload: "{}" });
      await loadAll();
    } catch (error: any) {
      const detail = error instanceof SyntaxError ? "Payload must be valid JSON" : error?.response?.data?.detail ?? "Failed to create notification";
      message.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Communications <span className="text-[var(--cv-accent)]">Workspace</span>
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Announcements, inbox threads, notifications, and replies mapped directly to the SMS communication APIs.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Tag color="blue">{role ?? "UNKNOWN"}</Tag>
          <Button
            className="!rounded-2xl"
            icon={<ReloadOutlined />}
            onClick={() => void Promise.all([loadAll(), refetchUsers()])}
            loading={loading || usersLoading}
          >
            Refresh
          </Button>
          {canThread ? (
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              icon={<MessageOutlined />}
              onClick={() => { threadForm.resetFields(); threadForm.setFieldsValue({ is_group: false }); setThreadOpen(true); }}
            >
              New Thread
            </Button>
          ) : null}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Unread</span>} value={unread.unread} prefix={<BellOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Announcements</span>} value={announcements.length} prefix={<PushpinOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Threads</span>} value={threads.length} prefix={<MessageOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Notifications</span>} value={notifications.length} prefix={<NotificationOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
      </Row>

      <Tabs
        activeKey={params.get("tab") || "inbox"}
        onChange={(key) => {
          const next = new URLSearchParams(params);
          next.set("tab", key);
          setParams(next, { replace: true });
        }}
        items={[
          {
            key: "inbox",
            label: "Inbox",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={9}>
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="text-white font-medium mb-3">Threads</div>
                    <div className="space-y-3">
                      {threadCards.length ? threadCards.map((thread) => (
                        <button key={thread.id} type="button" onClick={() => setSelectedThreadId(thread.id)} className={`w-full text-left rounded-2xl border p-4 transition ${selectedThreadId === thread.id ? "border-[var(--cv-accent)] bg-[var(--cv-accent)]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-white font-medium">{thread.subject || `Thread #${thread.id}`}</div>
                              <div className="text-white/50 text-xs mt-1">{thread.is_group ? "Group" : "Direct"}</div>
                            </div>
                            <Tag color="processing">{thread.count}</Tag>
                          </div>
                          <div className="text-white/60 text-sm mt-3">{thread.lastBody}</div>
                          <div className="text-white/40 text-xs mt-2">{dt(thread.lastAt)}</div>
                        </button>
                      )) : <Empty description={<span className="text-white/50">No threads yet</span>} />}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} xl={15}>
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    {selectedThread ? (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="text-white text-lg font-semibold">{selectedThread.subject || `Thread #${selectedThread.id}`}</div>
                            <div className="text-white/50 text-sm">Created {dt(selectedThread.created_at)}</div>
                          </div>
                          {canThread ? (
                            <Tooltip title="Add participant">
                              <Button
                                shape="circle"
                                icon={<UserAddOutlined />}
                                aria-label="Add participant"
                                onClick={() => { participantForm.resetFields(); setParticipantOpen(true); }}
                              />
                            </Tooltip>
                          ) : null}
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-white/75 text-sm mb-2">Participants</div>
                          <Space wrap>{threadParticipants.map((item) => <Tag key={item.id}>{userMap.get(item.user) ?? `User #${item.user}`}</Tag>)}</Space>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 max-h-[420px] overflow-auto">
                          {threadMessages.length ? threadMessages.map((record) => (
                            <div key={record.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="text-white/80 font-medium">{userMap.get(record.sender ?? -1) ?? "System / Unknown"}</div>
                                <Space size={8}><Tag color="blue">{record.status ?? "SENT"}</Tag><span className="text-white/40 text-xs">{dt(record.created_at)}</span></Space>
                              </div>
                              <div className="text-white/75 mt-2 whitespace-pre-wrap">{record.body}</div>
                            </div>
                          )) : <Empty description={<span className="text-white/50">No messages in this thread yet</span>} />}
                        </div>
                        {canThread ? (
                          <Form<ReplyForm> form={replyForm} layout="vertical" requiredMark={false} initialValues={{ status: "SENT" }} onFinish={() => void sendReply()}>
                            <Row gutter={12}>
                              <Col xs={24} lg={16}><Form.Item name="body" label="Reply" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item></Col>
                              <Col xs={24} lg={8}>
                                <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Sent", value: "SENT" }, { label: "Pending", value: "PENDING" }, { label: "Read", value: "READ" }, { label: "Failed", value: "FAILED" }]} /></Form.Item>
                                <Form.Item name="attachment_url" label="Attachment URL"><Input placeholder="https://..." /></Form.Item>
                              </Col>
                            </Row>
                            <Button htmlType="submit" type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" loading={submitting} icon={<SendOutlined />}>Send Reply</Button>
                          </Form>
                        ) : null}
                      </div>
                    ) : <Empty description={<span className="text-white/50">Choose a thread to view messages</span>} />}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "announcements",
            label: "Announcements",
            children: (
              <div className="space-y-4">
                <div className="flex justify-end">
                  {canAnnounce ? (
                    <Button
                      type="primary"
                      className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                      icon={<PushpinOutlined />}
                      onClick={() => { announcementForm.resetFields(); announcementForm.setFieldsValue({ is_pinned: false, target_roles: [] }); setAnnouncementOpen(true); }}
                    >
                      New Announcement
                    </Button>
                  ) : null}
                </div>
                <Row gutter={[16, 16]}>
                  {announcements.length ? announcements.map((item) => (
                    <Col xs={24} lg={12} key={item.id}>
                      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                        <div className="flex items-start justify-between gap-3">
                          <div><div className="text-white font-semibold">{item.title}</div><div className="text-white/50 text-xs mt-1">Created {dt(item.created_at)}</div></div>
                          {item.is_pinned ? <Tag color="gold">Pinned</Tag> : null}
                        </div>
                        <div className="text-white/75 mt-4 whitespace-pre-wrap">{item.body}</div>
                        <div className="mt-4 flex flex-wrap gap-2">{(item.target_roles ?? []).length ? item.target_roles?.map((value) => <Tag key={value}>{value}</Tag>) : <Tag>All roles</Tag>}</div>
                        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/60">Publish: {dt(item.publish_at)}</div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/60">Expire: {dt(item.expire_at)}</div>
                        </div>
                      </Card>
                    </Col>
                  )) : <Col span={24}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Empty description={<span className="text-white/50">No announcements available</span>} /></Card></Col>}
                </Row>
              </div>
            ),
          },
          {
            key: "campaigns",
            label: "Campaigns",
            children: <BulkCampaignCenter />,
          },
          {
            key: "notifications",
            label: "Notifications",
            children: (
              <div className="space-y-4">
                <Row gutter={[16, 16]}>
                  {unread.by_channel.map((item) => (
                    <Col xs={24} md={12} xl={6} key={item.channel}>
                      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">{item.channel}</span>} value={item.total} valueStyle={{ color: "#e5e7eb" }} /></Card>
                    </Col>
                  ))}
                </Row>
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div><div className="text-white font-medium">Notification Queue</div><div className="text-white/55 text-sm">Unread metrics and delivery status from the backend.</div></div>
                    {canNotify ? (
                      <Button
                        type="primary"
                        className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                        icon={<PlusOutlined />}
                        onClick={() => { notificationForm.resetFields(); notificationForm.setFieldsValue({ channel: "IN_APP", status: "PENDING", payload: "{}" }); setNotificationOpen(true); }}
                      >
                        New Notification
                      </Button>
                    ) : null}
                  </div>
                  <Table rowKey="id" loading={loading} dataSource={notifications} columns={notificationColumns} pagination={{ pageSize: 8 }} />
                </Card>
              </div>
            ),
          },
          {
            key: "preferences",
            label: "Preferences",
            children: <NotificationPreferencesPanel unreadByChannel={unread.by_channel} />,
          },
        ]}
      />

      <Modal title="Create Thread" open={threadOpen} onCancel={() => setThreadOpen(false)} onOk={() => void createThread()} confirmLoading={submitting}>
        <Form<ThreadForm> form={threadForm} layout="vertical" requiredMark={false}>
          <Form.Item name="subject" label="Subject"><Input /></Form.Item>
          <Form.Item name="participant_ids" label="Participants"><Select mode="multiple" showSearch optionFilterProp="label" options={userOptions} /></Form.Item>
          <Form.Item name="initial_message" label="Initial Message"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="is_group" label="Group Thread" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Create Announcement" open={announcementOpen} onCancel={() => setAnnouncementOpen(false)} onOk={() => void createAnnouncement()} confirmLoading={submitting}>
        <Form<AnnouncementForm> form={announcementForm} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}><Input.TextArea rows={5} /></Form.Item>
          <Form.Item name="target_roles" label="Target Roles"><Select mode="multiple" options={[{ label: "Super Admin", value: "SUPER_ADMIN" }, { label: "School Admin", value: "SCHOOL_ADMIN" }, { label: "Teacher", value: "TEACHER" }, { label: "Student", value: "STUDENT" }, { label: "Parent", value: "PARENT" }, { label: "Accountant", value: "ACCOUNTANT" }, { label: "HR Manager", value: "HR_MANAGER" }, { label: "Librarian", value: "LIBRARIAN" }, { label: "Transport Coordinator", value: "TRANSPORT_COORDINATOR" }]} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="publish_at" label="Publish At"><Input type="datetime-local" /></Form.Item></Col>
            <Col span={12}><Form.Item name="expire_at" label="Expire At"><Input type="datetime-local" /></Form.Item></Col>
          </Row>
          <Form.Item name="is_pinned" label="Pinned" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Add Participant" open={participantOpen} onCancel={() => setParticipantOpen(false)} onOk={() => void createParticipant()} confirmLoading={submitting}>
        <Form<ParticipantForm> form={participantForm} layout="vertical" requiredMark={false}>
          <Form.Item name="user" label="User" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={availableParticipants} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Create Notification" open={notificationOpen} onCancel={() => setNotificationOpen(false)} onOk={() => void createNotification()} confirmLoading={submitting}>
        <Form<NotificationForm> form={notificationForm} layout="vertical" requiredMark={false}>
          <Form.Item name="user" label="User" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={userOptions} /></Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="body" label="Body"><Input.TextArea rows={4} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="channel" label="Channel" rules={[{ required: true }]}><Select options={[{ label: "In App", value: "IN_APP" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }, { label: "Push", value: "PUSH" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Pending", value: "PENDING" }, { label: "Sent", value: "SENT" }, { label: "Failed", value: "FAILED" }, { label: "Read", value: "READ" }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="scheduled_at" label="Scheduled At"><Input type="datetime-local" /></Form.Item>
          <Form.Item name="payload" label="Payload JSON"><Input.TextArea rows={4} placeholder='{"source":"frontend"}' /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
