-- Unify support_inquiries.status: 'resolved' → 'answered'
--
-- 도메인 명칭 정리: '해결됨'(resolved)이 아니라 '답변완료'(answered)가
-- 1:1 문의의 의미에 맞다. 기존 row 를 일괄 변환한다.

update public.support_inquiries
   set status = 'answered'
 where status = 'resolved';
