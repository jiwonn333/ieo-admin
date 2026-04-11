-- Sync member_verifications(profile_photo) with members.profile_image_urls.
--
-- When a member uploads profile images (INSERT or UPDATE that sets a non-empty
-- profile_image_urls), the verification record transitions from 'unverified'
-- to 'pending_review' so admins see it in the review queue.
--
-- Preserves admin decisions: existing 'approved', 'rejected', and 'pending_review'
-- records are never modified by this trigger.

create or replace function public.sync_profile_photo_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_photos      boolean;
  existing_status text;
begin
  -- 1. profile_image_urls 가 실제로 존재하는지 확인
  has_photos := new.profile_image_urls is not null
                and array_length(new.profile_image_urls, 1) is not null
                and array_length(new.profile_image_urls, 1) > 0;

  if not has_photos then
    return new;
  end if;

  -- 2. UPDATE 인데 배열 값이 변하지 않은 경우 no-op
  if tg_op = 'UPDATE'
     and old.profile_image_urls is not distinct from new.profile_image_urls then
    return new;
  end if;

  -- 3. 현재 profile_photo verification 상태 조회
  select status
    into existing_status
    from public.member_verifications
   where member_id = new.id
     and verification_type = 'profile_photo'
   limit 1;

  if existing_status is null then
    -- 3-a. 레코드 없음 → 신규 생성 (심사중)
    insert into public.member_verifications (
      member_id,
      verification_type,
      status,
      submitted_at,
      reviewed_at,
      rejection_reason
    ) values (
      new.id,
      'profile_photo',
      'pending_review',
      now(),
      null,
      null
    );

  elsif existing_status = 'unverified' then
    -- 3-b. 미제출 → 심사중 전환
    update public.member_verifications
       set status           = 'pending_review',
           submitted_at     = now(),
           reviewed_at      = null,
           rejection_reason = null,
           updated_at       = now()
     where member_id = new.id
       and verification_type = 'profile_photo';
  end if;

  -- 3-c. approved / rejected / pending_review → 변경 없음 (의도적)

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_photo_verification on public.members;

create trigger trg_sync_profile_photo_verification
  after insert or update of profile_image_urls on public.members
  for each row
  execute function public.sync_profile_photo_verification();
