import {type GeneratedAlways, Kysely, CamelCasePlugin} from 'kysely'
import {PostgresJSDialect} from 'kysely-postgres-js'
import {DB, kyselyIdentifierOverrides} from './schema'
import postgres from 'postgres'

// kysely's CamelCasePlugin can't recover a snake_case name that has an
// underscore directly before a digit (reminder_48h_sent -> reminder48hSent ->
// reminder48h_sent). The generated schema exports the exact spelling for such
// identifiers; everything else falls through to the default mapping.
class FlootCamelCasePlugin extends CamelCasePlugin {
  protected override snakeCase(str: string): string {
    return kyselyIdentifierOverrides[str] ?? super.snakeCase(str)
  }
}

// Serverless note: a function instance can be frozen between requests, and a
// pooled TCP connection that sat idle through a freeze may be silently dropped
// by the network. The next query on it then hangs until the function times out.
// So the API entry point calls closeDb() whenever the last in-flight request
// finishes, and the next request opens fresh connections. Nothing idle is ever
// carried across a freeze.
let client: ReturnType<typeof postgres> | null = null
let instance: Kysely<DB> | null = null

function getInstance(): Kysely<DB> {
  if (!instance) {
    client = postgres(process.env.DATABASE_URL as string, {
      prepare: false,
      idle_timeout: 5,
      max_lifetime: 120,
      connect_timeout: 10,
      max: 5,
    })
    instance = new Kysely<DB>({
      plugins: [new FlootCamelCasePlugin()],
      dialect: new PostgresJSDialect({ postgres: client }),
    })
  }
  return instance
}

/** Ends the pool (waiting briefly for in-flight queries). The next query reconnects. */
export async function closeDb(): Promise<void> {
  const current = client
  client = null
  instance = null
  if (current) {
    try {
      await current.end({ timeout: 3 })
    } catch {
      // Best effort: the connections are being discarded anyway.
    }
  }
}

export const db: Kysely<DB> = new Proxy({} as Kysely<DB>, {
  get(_target, prop) {
    const real = getInstance() as any
    const value = real[prop]
    return typeof value === 'function' ? value.bind(real) : value
  },
})
