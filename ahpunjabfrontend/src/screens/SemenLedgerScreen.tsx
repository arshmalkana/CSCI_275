import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ScreenHeader } from '../components/ScreenHeader'
import api from '../utils/api'

interface SemenReceipt {
  transaction_id: number
  transaction_date: string
  straws_issued: number
  batch_number: string | null
  expiry_date: string | null
  notes: string | null
  semen_name: string
  semen_code: string
  from_institute: string
}

interface SemenBalance {
  semen_type_id: number
  semen_name: string
  semen_code: string
  current_stock: number
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const r = res as { data?: T[] }
  return r.data ?? []
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SemenLedgerScreen() {
  const navigate = useNavigate()

  const { data: receipts = [], isLoading } = useQuery<SemenReceipt[]>({
    queryKey: ['mySemenReceipts'],
    queryFn: () => api.getMySemenReceipts().then(unwrap<SemenReceipt>),
  })

  const { data: balances = [] } = useQuery<SemenBalance[]>({
    queryKey: ['mySemenBalance'],
    queryFn: () => api.getMySemenStock().then(unwrap<SemenBalance>),
  })

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      <ScreenHeader title="Semen Ledger" onBack={() => navigate(-1)} />

      <div
        className="flex-1 overflow-y-auto px-4"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div className="pb-8 pt-4 space-y-4">
          {/* Current balance */}
          {balances.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 font-['Poppins']">Current Stock</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {balances.map(b => (
                  <div key={b.semen_type_id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-['Poppins']">{b.semen_name}</p>
                      <p className="text-xs text-gray-400 font-['Poppins']">{b.semen_code}</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900 font-['Poppins']">
                      {b.current_stock} <span className="text-sm font-normal text-gray-500">straws</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipt history */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 font-['Poppins'] mb-2 px-1">Receipt History</h3>

            {isLoading && (
              <div className="text-center py-8 text-gray-400 text-sm font-['Poppins']">Loading…</div>
            )}

            {!isLoading && receipts.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm font-['Poppins']">
                No semen receipts found.
              </div>
            )}

            <div className="space-y-3">
              {receipts.map(r => (
                <div key={r.transaction_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-gray-900 font-['Poppins']">{r.semen_name}</p>
                    <span className="text-lg font-bold text-green-700 font-['Poppins']">
                      +{r.straws_issued}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-['Poppins']">
                    {formatDate(r.transaction_date)} · from {r.from_institute}
                  </p>
                  {r.batch_number && (
                    <p className="text-xs text-gray-400 font-['Poppins'] mt-0.5">Batch: {r.batch_number}</p>
                  )}
                  {r.expiry_date && (
                    <p className="text-xs text-gray-400 font-['Poppins']">Expires: {formatDate(r.expiry_date)}</p>
                  )}
                  {r.notes && (
                    <p className="text-xs text-gray-400 font-['Poppins'] italic mt-1">{r.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
