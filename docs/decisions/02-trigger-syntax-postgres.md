# ADR 02 — Sintaxis de triggers PostgreSQL

## Contexto

La migración inicial usaba `EXECUTE PROCEDURE` en `CREATE TRIGGER`, válido en versiones antiguas.

## Decisión

- En `20260427100000_yacunaj_ops_phase1_catalog_auth.sql` se sustituyó por **`EXECUTE FUNCTION`**, recomendado en Postgres ≥ 11 y usado por Supabase (PG 15).
- La migración `20260428120000_phase2_menu_cms_audit_storage.sql` vuelve a crear los triggers con `EXECUTE FUNCTION` para proyectos que ya aplicaron la fase 1 con `PROCEDURE`.

## Consecuencias

Si un entorno legacy solo acepta `PROCEDURE`, aplicar solo la parte de triggers de la fase 2 manualmente o mantener `PROCEDURE` en ese entorno documentado aquí.
