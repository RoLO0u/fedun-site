import { z } from "zod";

const chatType = z.enum([
  "",
  "saved_messages",
  "replies",
  "verification_codes",
  "personal_chat",
  "bot_chat",
  "private_group",
  "private_supergroup",
  "public_supergroup",
  "private_channel",
  "public_channel",
]);

const messageType = z.enum([
    "message",
    "service",
    "unsupported",
]);

const actionType = z
  .enum([
    "create_group",
    "edit_group_title",
    "edit_group_photo",
    "delete_group_photo",
    "invite_members",
    "remove_members",
    "join_group_by_link",
    "create_channel",
    "migrate_to_supergroup",
    "migrate_from_group",
    "pin_message",
    "clear_history",
    "score_in_game",
    "send_payment",
    "phone_call",
    "take_screenshot",
    "attach_menu_bot_allowed",
    "web_app_bot_allowed",
    "allow_sending_messages",
    "send_passport_values",
    "joined_telegram",
    "proximity_reached",
    "requested_phone_number",
    "group_call",
    "invite_to_group_call",
    "set_message_ttl",
    "group_call_scheduled",
    "edit_chat_theme",
    "join_group_by_request",
    "send_webview_data",
    "send_premium_gift",
    "topic_created",
    "topic_edit",
    "suggest_profile_photo",
    "requested_peer",
    "gift_code_prize",
    "giveaway_launch",
    "giveaway_results",
    "set_same_chat_wallpaper",
    "set_chat_wallpaper",
    "boost_apply",
    "refunded_payment",
    "send_stars_gift",
    "stars_prize",
    "send_star_gift",
    "paid_messages_refund",
    "paid_messages_price_change",
    "set_messages_ttl"
  ]);

const recurringType = z.enum([
    "used",
    "init",
]);

const discardReason = z.enum([
    "busy",
    "disconnect",
    "hangup",
    "missed",
    "",
]);

const secureValues = z.enum([
    "personal_details",
    "passport",
    "driver_license",
    "identity_card",
    "internal_passport",
    "address_information",
    "utility_bill",
    "bank_statement",
    "rental_agreement",
    "passport_registration",
    "temporary_registration",
    "phone_number",
    "email",
    "",
]);

const mediaType = z.enum([
    "sticker",
    "video_message",
    "voice_message",
    "animation",
    "video_file",
    "audio_file",
]);

const chatEntity = z.enum([
    "unknown",
    "mention",
    "hashtag",
    "bot_command",
    "link",
    "email",
    "bold",
    "italic",
    "code",
    "pre",
    "plain",
    "text_link",
    "mention_name",
    "phone",
    "cashtag",
    "underline",
    "strikethrough",
    "blockquote",
    "bank_card",
    "spoiler",
    "custom_emoji",
]);

const chatEnums = {
  chatType,
  actionType,
  messageType,
  recurringType,
  discardReason,
  secureValues,
  mediaType,
  chatEntity,
};

export default chatEnums;
