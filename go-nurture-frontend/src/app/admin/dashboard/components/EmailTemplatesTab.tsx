"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import type { EmailQueueItem, EmailTemplate } from "@/types";

const DEFAULT_VARIABLES = '{"recipient_name":"Example User","organisation_name":"Example Organisation","invite_link":"https://example.test/set-password","reset_link":"https://example.test/reset","partner_name":"Example Partner","mother_name":"Example Mother","mother_phone":"07123456789","mother_email":"mother@example.com","due_date":"1 January 2027","program_name":"Favour Oloye Birth Confidence Program","language_requirement":null,"requires_interpreter":false,"additional_notes":"No additional notes","donor_name":"Example Donor","donor_email":"donor@example.com","amount":"25.00","currency":"GBP","message":"Thank you","sender_name":"Example Sender","sender_email":"sender@example.com","message_subject":"Example subject","is_clinic":false,"date_text":"Monday, 1 January 2027","schedule_lines":"Class 1: Monday, 1 January 2027","venue_line":"Venue: Example Venue","venue_block":"Where: Example Venue","cohort_name":"Example Cohort","venue_name":"Example Venue"}';

export default function EmailTemplatesTab({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const initialTemplate = initialTemplates.find((template) => template.is_active) ?? initialTemplates[0];
  const [selectedKey, setSelectedKey] = useState(initialTemplate?.template_key ?? "");
  const [subject, setSubject] = useState(initialTemplate?.subject ?? "");
  const [body, setBody] = useState(initialTemplate?.body ?? "");
  const [variables, setVariables] = useState(DEFAULT_VARIABLES);
  const [recipient, setRecipient] = useState("");
  const [queue, setQueue] = useState<EmailQueueItem[]>([]);
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [data, queueData] = await Promise.all([
      api.get<EmailTemplate[]>("/api/admin/email-templates"),
      api.get<EmailQueueItem[]>("/api/admin/email-queue?limit=20"),
    ]);
    setTemplates(data);
    setQueue(queueData);
    const active = data.find((template) => template.is_active) ?? data[0];
    if (active) selectTemplate(active, data);
  };

  const selectTemplate = (template: EmailTemplate, data = templates) => {
    const active = data.find((item) => item.template_key === template.template_key && item.is_active) ?? template;
    setSelectedKey(active.template_key);
    setSubject(active.subject);
    setBody(active.body);
    setPreview(null);
  };

  const parseVariables = () => {
    try {
      return JSON.parse(variables) as Record<string, unknown>;
    } catch {
      toast.error("Preview variables must be valid JSON.");
      return null;
    }
  };

  const handlePreview = async () => {
    const parsedVariables = parseVariables();
    if (!parsedVariables) return;
    const data = await api.post<{ subject: string; body: string }>(`/api/admin/email-templates/${selectedKey}/preview`, { variables: parsedVariables });
    setPreview(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/email-templates/${selectedKey}`, { name: templates.find((item) => item.template_key === selectedKey)?.name ?? selectedKey, subject, body });
      await load();
    } finally { setSaving(false); }
  };

  const handleTestSend = async () => {
    const parsedVariables = parseVariables();
    if (!parsedVariables) return;
    await api.post(`/api/admin/email-templates/${selectedKey}/test-send`, { recipient_email: recipient, variables: parsedVariables });
  };

  const handleQueue = async () => {
    const parsedVariables = parseVariables();
    if (!parsedVariables) return;
    await api.post(`/api/admin/email-templates/${selectedKey}/queue`, { recipient_email: recipient, variables: parsedVariables });
    await load();
  };

  const handleProcessQueue = async () => {
    await api.post("/api/admin/email-queue/process");
    await load();
  };

  const handleRetry = async (id: string) => {
    await api.post(`/api/admin/email-queue/${id}/retry`);
    await load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-(--color-border)">
        <h3 className="font-heading text-lg font-bold text-gray-900">Templates</h3>
        <div className="mt-3 space-y-1">
          {[...new Map(templates.map((template) => [template.template_key, template])).values()].map((template) => (
            <button key={template.template_key} type="button" onClick={() => selectTemplate(template)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selectedKey === template.template_key ? "bg-(--color-accent)/10 font-semibold text-(--color-accent)" : "text-(--color-text-muted) hover:bg-(--color-bg-sage)"}`}>
              {template.name}
            </button>
          ))}
        </div>
      </aside>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-(--color-border)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-heading text-xl font-bold text-gray-900">Edit template</h3><p className="text-sm text-(--color-text-muted)">Version {templates.filter((item) => item.template_key === selectedKey).sort((a, b) => b.version - a.version)[0]?.version ?? 1} will be preserved when saved.</p></div>
          <div className="flex gap-2"><button type="button" onClick={handlePreview} className="rounded-lg border border-(--color-border) px-4 py-2 text-sm">Preview</button><button type="button" disabled={saving} onClick={handleSave} className="rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? "Saving..." : "Save version"}</button></div>
        </div>
        <label className="mt-5 block text-sm font-medium text-gray-700">Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" /></label>
        <label className="mt-4 block text-sm font-medium text-gray-700">Plain-text body<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={12} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2 font-mono text-sm" /></label>
        <label className="mt-4 block text-sm font-medium text-gray-700">Preview variables (JSON)<textarea value={variables} onChange={(event) => setVariables(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2 font-mono text-sm" /></label>
        {preview && <div className="mt-5 rounded-lg border border-(--color-border) bg-(--color-bg-sage) p-4"><p className="font-semibold">{preview.subject}</p><pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{preview.body}</pre></div>}
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5"><label className="flex-1 text-sm font-medium text-gray-700">Test recipient<input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" /></label><button type="button" disabled={!recipient} onClick={handleQueue} className="rounded-lg border border-(--color-border) px-4 py-2 text-sm disabled:opacity-50">Queue email</button><button type="button" disabled={!recipient} onClick={handleTestSend} className="rounded-lg border border-(--color-accent) px-4 py-2 text-sm text-(--color-accent) disabled:opacity-50">Send test</button></div>
        <div className="mt-6 border-t border-gray-100 pt-5"><div className="flex items-center justify-between"><h4 className="font-semibold text-gray-900">Queue</h4><button type="button" onClick={handleProcessQueue} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white">Process due emails</button></div><div className="mt-3 space-y-2">{queue.length === 0 ? <p className="text-sm text-(--color-text-muted)">No queued emails.</p> : queue.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-border) p-3 text-sm"><span>{item.recipient_email} · {item.template_key}</span><span className="text-(--color-text-muted)">{item.status} ({item.attempts}/{item.max_attempts}) {item.status === "failed" && <button type="button" onClick={() => handleRetry(item.id)} className="ml-2 text-(--color-accent) underline">Retry</button>}</span></div>)}</div></div>
      </section>
    </div>
  );
}