-- Idempotent: drop any existing copies first, then re-create

-- 1. reviews_recompute_trigger
DROP TRIGGER IF EXISTS trg_reviews_recompute ON public.reviews;
CREATE TRIGGER trg_reviews_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_recompute_trigger();

-- 2. project_stages_completion_trigger
DROP TRIGGER IF EXISTS trg_project_stages_completion ON public.project_stages;
CREATE TRIGGER trg_project_stages_completion
AFTER INSERT OR UPDATE ON public.project_stages
FOR EACH ROW EXECUTE FUNCTION public.project_stages_completion_trigger();

-- 3. trades_verified_recompute_trigger
DROP TRIGGER IF EXISTS trg_trades_verified_recompute ON public.trades;
CREATE TRIGGER trg_trades_verified_recompute
AFTER UPDATE OF verified ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.trades_verified_recompute_trigger();

-- 4. enforce_review_update_scope (BEFORE UPDATE)
DROP TRIGGER IF EXISTS trg_enforce_review_update_scope ON public.reviews;
CREATE TRIGGER trg_enforce_review_update_scope
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_update_scope();

-- 5. enforce_trade_update_scope (BEFORE UPDATE)
DROP TRIGGER IF EXISTS trg_enforce_trade_update_scope ON public.trades;
CREATE TRIGGER trg_enforce_trade_update_scope
BEFORE UPDATE ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.enforce_trade_update_scope();

-- 6. validate_review (BEFORE INSERT/UPDATE) — length + completed-job guard
DROP TRIGGER IF EXISTS trg_validate_review ON public.reviews;
CREATE TRIGGER trg_validate_review
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review();

-- 7. validate_review_followup (BEFORE INSERT/UPDATE)
DROP TRIGGER IF EXISTS trg_validate_review_followup ON public.review_followups;
CREATE TRIGGER trg_validate_review_followup
BEFORE INSERT OR UPDATE ON public.review_followups
FOR EACH ROW EXECUTE FUNCTION public.validate_review_followup();