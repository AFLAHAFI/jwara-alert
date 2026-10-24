"use client";

import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";

export default function TaskDoneButton({ id, done }: { id: string; done: boolean }) {
  const { t } = useI18n();
  const { busy, error, call } = useApi();
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => call(`/api/asha/tasks/${id}`, "PATCH", { done: !done })}
        className={done ? "btn-ghost btn-sm" : "btn-primary"}
      >
        {!done && <Icon name="check" className="h-6 w-6" />}
        {busy ? t.pleaseWait : done ? t.mark_not_done : t.mark_done}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
