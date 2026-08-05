import type { DrizzleDB } from '../db'
import type { AnyTable, InferModel } from 'drizzle-orm'

export abstract class BaseRepository<TTable extends AnyTable> {
  protected db: DrizzleDB
  protected table: TTable

  constructor(db: DrizzleDB, table: TTable) {
    this.db = db
    this.table = table
  }

  // 通用查询示例
  async findAll() {
    return this.db.select().from(this.table)
  }

  async findById(id: string | number) {
    // @ts‑ignore
    return this.db.select().from(this.table).where(this.table.id.eq(id)).get()
  }

  async create(data: Partial<InferModel<TTable, 'insert'>>) {
    // @ts‑ignore
    return this.db.insert(this.table).values(data).returning().get()
  }

  async update(
    id: string | number,
    data: Partial<InferModel<TTable, 'insert'>>,
  ) {
    // @ts‑ignore
    return this.db
      .update(this.table)
      .set(data)
      .where(this.table.id.eq(id))
      .returning()
      .get()
  }

  async delete(id: string | number) {
    // @ts‑ignore
    return this.db.delete(this.table).where(this.table.id.eq(id)).run()
  }
}
