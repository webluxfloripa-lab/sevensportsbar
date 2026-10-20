CREATE TABLE public.tour_admin_sessions (id uuid PRIMARY KEY, expires_at timestamptz NOT NULL);
GRANT ALL ON public.tour_admin_sessions TO service_role;
ALTER TABLE public.tour_admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tour_configuration (id text PRIMARY KEY CHECK (id IN ('draft','published')), scenes jsonb NOT NULL, revision uuid NOT NULL DEFAULT gen_random_uuid(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tour_configuration TO service_role;
GRANT SELECT ON public.tour_configuration TO anon;
ALTER TABLE public.tour_configuration ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_tour_read ON public.tour_configuration FOR SELECT TO anon USING (id = 'published');
CREATE TABLE public.tour_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scenes jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tour_versions TO service_role;
ALTER TABLE public.tour_versions ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.publish_seven_tour(expected_revision uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.tour_configuration; v uuid;
BEGIN
SELECT * INTO d FROM public.tour_configuration WHERE id='draft' FOR UPDATE;
IF d.revision IS DISTINCT FROM expected_revision THEN RAISE EXCEPTION 'Revision conflict'; END IF;
INSERT INTO public.tour_versions(scenes) VALUES(d.scenes) RETURNING id INTO v;
INSERT INTO public.tour_configuration(id,scenes) VALUES('published',d.scenes) ON CONFLICT(id) DO UPDATE SET scenes=excluded.scenes,revision=gen_random_uuid(),updated_at=now();
RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.publish_seven_tour(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_seven_tour(uuid) TO service_role;