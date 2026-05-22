import { ClipboardList, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { listAuditLogs, type AuditLog } from '../features/admin/adminApi'

const AUDIT_LOG_LIMIT = 10

export function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadAuditLogs = useCallback(async () => {
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await listAuditLogs()
      setAuditLogs(response.slice(0, AUDIT_LOG_LIMIT))
    } catch {
      setErrorMessage('Audit logs could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAuditLogs()
  }, [loadAuditLogs])

  return (
    <div className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Audit Logs</p>
        <h1>Operational audit trail</h1>
      </div>

      {errorMessage ? (
        <section className="inline-error" role="alert">
          <p>{errorMessage}</p>
          <button className="text-button" type="button" onClick={loadAuditLogs}>
            <RefreshCw size={15} aria-hidden />
            Try again
          </button>
        </section>
      ) : null}

      <section className="panel audit-panel">
        <div className="panel-title-row">
          <h2>Latest events</h2>
          <span className="status-badge status-active">
            Last {auditLogs.length}
          </span>
        </div>

        {isLoading ? (
          <div className="skeleton-list" aria-label="Loading audit logs">
            <span />
            <span />
            <span />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <ClipboardList size={21} aria-hidden />
            </span>
            <div>
              <strong>No audit events yet</strong>
              <p className="muted-text">
                Security and operations events will appear here as the system is used.
              </p>
            </div>
          </div>
        ) : (
          <div className="audit-list">
            {auditLogs.map((auditLog) => (
              <AuditLogRow auditLog={auditLog} key={auditLog.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AuditLogRow({ auditLog }: { auditLog: AuditLog }) {
  return (
    <article className="audit-row">
      <span className="empty-icon">
        <ClipboardList size={18} aria-hidden />
      </span>
      <div className="audit-main">
        <strong>{formatAction(auditLog.action)}</strong>
        <p className="muted-text">
          {auditLog.actorEmail} - {formatDateTime(auditLog.createdAt)}
        </p>
        {auditLog.details ? (
          <p className="audit-details">{auditLog.details}</p>
        ) : null}
      </div>
      <div className="audit-target">
        <span>{auditLog.targetType}</span>
        <strong>#{auditLog.targetId}</strong>
      </div>
    </article>
  )
}

function formatAction(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
