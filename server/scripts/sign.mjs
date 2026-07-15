// Dev helper: prints a valid Telegram initData string signed with a token,
// so we can exercise the authenticated API locally.
//   node scripts/sign.mjs <bot_token> [telegram_id] [username]
import { createHmac } from 'node:crypto'

const token = process.argv[2] ?? 'test-token-123'
const id = process.argv[3] ?? '424242'
const username = process.argv[4] ?? 'tester'

const params = new URLSearchParams()
params.set('user', JSON.stringify({ id: Number(id), username, first_name: 'Test' }))
params.set('auth_date', String(Math.floor(Date.now() / 1000)))
params.set('query_id', 'AAF')

const dcs = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n')
const secret = createHmac('sha256', 'WebAppData').update(token).digest()
const hash = createHmac('sha256', secret).update(dcs).digest('hex')
params.set('hash', hash)

process.stdout.write(params.toString())
