import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GradeCard } from '@/components/assessment/GradeCard'
import { CriteriaBreakdown } from '@/components/assessment/CriteriaBreakdown'
import { TraitReport } from '@/components/assessment/TraitReport'
import { ObjectionReport } from '@/components/assessment/ObjectionReport'
import { TipsPanel } from '@/components/assessment/TipsPanel'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import {
  getHistory,
  getSessionDetail,
  getHistoryStats,
  type SessionSummary,
  type SessionDetail,
  type HistoryStats,
} from '@/lib/api'

const gradeColor: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
}

export function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [selected, setSelected] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getHistory(), getHistoryStats()])
      .then(([h, s]) => {
        setSessions(h.sessions)
        setStats(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (id: string) => {
    try {
      const detail = await getSessionDetail(id)
      setSelected(detail)
    } catch {
      // ignore
    }
  }

  // Detail view
  if (selected) {
    return (
      <>
        <PageHeader title="Session Detail" />
        <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{selected.customer_name}</Badge>
            <Badge variant="secondary" className="text-xs capitalize">{selected.difficulty}</Badge>
            <Badge variant="secondary" className="text-xs">{selected.turn_count} turns</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(selected.created_at).toLocaleDateString()}
            </span>
          </div>

          {selected.assessment ? (
            <>
              <GradeCard
                grade={selected.assessment.overall_grade}
                score={selected.assessment.overall_score}
                summary={selected.assessment.overall_summary}
              />
              <CriteriaBreakdown
                criteria={[
                  { label: 'Trait Detection', ...selected.assessment.trait_detection },
                  { label: 'Objection Handling', ...selected.assessment.objection_handling },
                  { label: 'Empathy', ...selected.assessment.empathy },
                  { label: 'Closing Skills', ...selected.assessment.closing_skills },
                  { label: 'Conversation Flow', ...selected.assessment.conversation_flow },
                ]}
              />
              <TraitReport
                traits={selected.assessment.trait_detection.detected}
                score={selected.assessment.trait_detection.score}
                feedback={selected.assessment.trait_detection.feedback}
              />
              <ObjectionReport
                objections={selected.assessment.objection_handling.per_objection}
                score={selected.assessment.objection_handling.score}
                feedback={selected.assessment.objection_handling.feedback}
              />
              <TipsPanel
                tips={selected.assessment.tips}
                highlight={selected.assessment.highlight_moment}
                biggestMiss={selected.assessment.biggest_miss}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No assessment available for this session.</p>
          )}

          {/* Transcript */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {selected.transcript
                  .filter((m) => !m.content.startsWith('('))
                  .map((m, i) => (
                    <p key={i} className="text-xs">
                      <span className={m.role === 'user' ? 'font-medium text-primary' : 'font-medium'}>
                        {m.role === 'user' ? 'You' : selected.customer_name}:
                      </span>{' '}
                      <span className="text-muted-foreground">{m.content}</span>
                    </p>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // List view
  return (
    <>
      <PageHeader title="History" />
      <div className="space-y-4 overflow-y-auto p-4 pb-24">
        {/* Stats */}
        {stats && stats.total_sessions > 0 && (
          <Card>
            <CardContent className="flex items-center gap-4 pt-4">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="text-2xl font-bold tabular-nums">{stats.total_sessions} sessions</p>
                {stats.avg_score && (
                  <p className="text-sm text-muted-foreground">
                    Avg score: {stats.avg_score}
                  </p>
                )}
              </div>
              {stats.grade_distribution && Object.keys(stats.grade_distribution).length > 0 && (
                <div className="flex gap-2">
                  {Object.entries(stats.grade_distribution)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([grade, count]) => (
                      <div key={grade} className="text-center">
                        <p className={`text-lg font-bold ${gradeColor[grade] ?? ''}`}>{count}</p>
                        <p className="text-xs text-muted-foreground">{grade}'s</p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Session list */}
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="pt-20 text-center">
            <p className="text-sm text-muted-foreground">No sessions yet. Go train!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer transition-colors hover:border-primary"
                onClick={() => handleSelect(s.id)}
              >
                <CardContent className="flex items-center gap-3 py-3">
                  {/* Grade */}
                  <div className={`text-2xl font-bold ${gradeColor[s.overall_grade ?? ''] ?? 'text-muted-foreground'}`}>
                    {s.overall_grade ?? '?'}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.customer_name}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">{s.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground">{s.turn_count} turns</span>
                    </div>
                  </div>
                  {/* Score + date */}
                  <div className="text-right">
                    {s.overall_score != null && (
                      <p className="text-sm font-medium tabular-nums">{s.overall_score}%</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
