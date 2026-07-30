-- 玩家可以先后加入多个历史房间，成员唯一性只应限定在同一个房间内。
-- 不同旧版本可能把该规则创建成 constraint 或 unique index，两者都处理。
ALTER TABLE room_members DROP CONSTRAINT IF EXISTS room_members_principal_id_key;
DROP INDEX IF EXISTS public.room_members_principal_id_key;
