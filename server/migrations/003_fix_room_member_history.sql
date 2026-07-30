-- 玩家可以先后加入多个历史房间，成员唯一性只应限定在同一个房间内。
ALTER TABLE room_members DROP CONSTRAINT IF EXISTS room_members_principal_id_key;
