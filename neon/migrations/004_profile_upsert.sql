-- PostgREST upsert assigns the conflict key as well as the changed columns.
-- RLS still prevents moving a row to a different user.
GRANT UPDATE (id) ON public.financial_profile TO authenticated;
