INSERT INTO public.tools (id, created_at, name, tool_schema_name, category, description, credit_cost, is_active, is_coming_soon, tool_type, tool_component_path, tool_url, updated_at)
VALUES (gen_random_uuid(), NOW(), 'Hello Hackathon', 'hello-hackathon', 'General', 'Analyze text word frequency — a starter tool for hackathon participants', 0, true, false, 'native', 'hello-hackathon', NULL, NOW());

INSERT INTO public.tool_configurations (id, created_at, tool_id, unlock_duration_hours, credit_cost, is_enabled, updated_at)
VALUES (gen_random_uuid(), NOW(), (SELECT id FROM public.tools WHERE tool_schema_name = 'hello-hackathon'), 24.0, 0, true, NOW());

INSERT INTO public.tool_feedback_config (id, tool_id, enabled, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM public.tools WHERE tool_schema_name = 'hello-hackathon'), true, true, NOW(), NOW());
