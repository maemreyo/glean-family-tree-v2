CREATE OR REPLACE FUNCTION get_shared_tree_data(token_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  result json;
BEGIN
  -- Check if token exists and is active
  SELECT user_id INTO target_user_id
  FROM shared_links
  WHERE token = token_input AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());

  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch data
  SELECT json_build_object(
    'persons', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'name', p.name,
          'gender', p.gender,
          'date_of_birth', p.date_of_birth,
          'is_deceased', p.is_deceased,
          'date_of_death', p.date_of_death,
          'birth_place', p.birth_place,
          'death_place', p.death_place,
          'occupation', p.occupation,
          'biography', p.biography,
          'notes', p.notes,
          'position_x', p.position_x,
          'position_y', p.position_y,
          'family_id', p.family_id,
          'person_photos', (
            SELECT COALESCE(json_agg(ph), '[]'::json) FROM person_photos ph WHERE ph.person_id = p.id
          )
        )
      )
      FROM persons p
      WHERE p.user_id = target_user_id
    ), '[]'::json),
    'relationships', COALESCE((
      SELECT json_agg(r)
      FROM relationships r
      WHERE r.user_id = target_user_id
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;