-- These functions check auth.uid() internally and are safe for logged-in
-- users to call directly, but there is no reason for anonymous (logged-out)
-- callers to reach them at all.
REVOKE EXECUTE ON FUNCTION public.assign_expert(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_milestone(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.start_milestone(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_payout(INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.review_expert_application(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(UUID) FROM PUBLIC, anon;

-- This one should only ever run via the on_auth_user_created trigger,
-- never called directly by anyone.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
