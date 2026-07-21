import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('place', (table) => {
    table.string('media_url', 255).nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('place', (table) => {
    table.dropColumn('media_url');
  });
}

