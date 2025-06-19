import { z } from "zod";
import chatEnums from "@/lib/chatEnums";

const contactInfoSchema = z.object({
    first_name: z.string(),
    last_name: z.string(),
    phone_number: z.string(),
});

const locationInfoSchema = z.union([
    z.literal("null"),
    z.object({
        latitude: z.number(),
        longitude: z.number(),
    })
]);

const invoiceInfoSchema = z.object({
    title: z.string(),
    description: z.string(),
    amount: z.string(),
    currency: z.string(),
    reciept_message_id: z.string(),
});

const giveawayInfoSchema = z.object({
    quantity: z.number(),
    months: z.number(),
    until_date: z.string(),
    channels: z.array(z.string()),
    countries: z.array(z.string()),
    additional_prize: z.string(),
    stars: z.number(),
    is_only_new_subscribers: z.string(),
});

const giveawayResultsSchema = z.object({
    channel: z.number(),
    winners: z.array(z.string()),
    additional_prize: z.string(),
    until_date: z.string(),
    launch_message_id: z.number(),
    additional_peers_count: z.number(),
    winners_count: z.number(),
    unclaimed_count: z.number(),
    months: z.number(),
    stars: z.number(),
    is_refunded: z.string(),
    is_only_new_subscribers: z.string(),
});

const answersSchema = z.object({
    text: z.string(),
    voters: z.number(),
    chosen: z.boolean(),
});

const pollSchema = z.object({
    question: z.string(),
    closed: z.boolean(),
    total_voters: z.number(),
    answers: z.array(answersSchema)
});

const textEntitySchema = z.object({
    type: chatEnums.chatEntity,
    text: z.string(),
    user_id: z.number().nullish(),
    document_id: z.string().nullish(),
    language: z.string().nullish(),
    href: z.string().nullish(),
    collapsed: z.boolean().nullish(),
    none: z.string().nullish(),
});

const inlineButtonSchema = z.object({
    type: z.string(),
    dataBase64: z.string().nullish(),
    data: z.string().nullish(),
    forward_text: z.string().nullish(),
    button_id: z.number().nullish(),
});

const recentReactionSchema = z.object({
    from: z.string().nullable(),
    from_id: z.string(),
    date: z.string(),
});

const reactionsSchema = z.object({
    type: z.string(),
    count: z.number(),
    emoji: z.string().nullish(),
    document_id: z.string().nullish(),
    recent: z.array(recentReactionSchema).nullish(),
});

const textSchema = z.union([
    z.string(),
    z.union([textEntitySchema, z.string()]).array(),
]);

const messageSchema = z.object({
    id: z.number(),
    type: chatEnums.messageType,
    date: z.string().nullish(),
    date_unixtime: z.string().nullish(),
    edited: z.string().nullish(),
    edited_unixtime: z.string().nullish(),
    from: z.string().nullish(),
    from_id: z.string().nullish(),
    reply_to_message_id: z.number().nullish(),
    reply_to_peer_id: z.number().nullish(),
    members: z.array(z.string().nullable()).nullish(),
    self_destruct_period_seconds: z.number().nullish(),
    photo: z.string().nullish(),
    photo_file_size: z.number().nullish(),
    width: z.number().nullish(),
    height: z.number().nullish(),
    media_spoiler: z.boolean().nullish(),
    action: chatEnums.actionType.nullish(),
    title: z.string().nullish(),
    inviter: z.string().nullish(),
    score: z.number().nullish(),
    amount: z.number().nullish(),
    currency: z.string().nullish(),
    recurring: chatEnums.recurringType.nullish(),
    duration_seconds: z.number().nullish(),
    discard_reason: chatEnums.discardReason.nullish(),
    information_text: z.string().nullish(),
    reason_app_id: z.number().nullish(),
    reason_app_name: z.string().nullish(),
    reason_domain: z.string().nullish(),
    values: z.array(chatEnums.secureValues).nullish(),
    to: z.string().nullish(),
    to_id: z.string().nullish(),
    distance: z.number().nullish(),
    duration: z.number().nullish(),
    period: z.number().nullish(),
    schedule_date: z.number().nullish(),
    emoticon: z.string().nullish(),
    text: textSchema,
    cost: z.string().nullish(),
    months: z.number().nullish(),
    new_title: z.string().nullish(),
    new_icon_emoji_id: z.number().nullish(),
    button_id: z.number().nullish(),
    peers: z.array(z.string()).nullish(),
    gift_code: z.string().nullish(),
    boost_peer_id: z.string().nullish(),
    unclaimed: z.string().nullish(),
    via_giveaway: z.string().nullish(),
    winners: z.number().nullish(),
    stars: z.string().nullish(),
    boosts: z.number().nullish(),
    peer_name: z.string().nullish(),
    peer_id: z.string().nullish(),
    charge_id: z.string().nullish(),
    boost_peer_name: z.string().nullish(),
    is_unclaimed: z.string().nullish(),
    giveaway_msg_id: z.number().nullish(),
    transaction_id: z.string().nullish(),
    gift_id: z.number().nullish(),
    is_limited: z.string().nullish(),
    is_anonymous: z.string().nullish(),
    gift_text: z.string().nullish(),
    messages_count: z.number().nullish(),
    stars_count: z.number().nullish(),
    price_stars: z.number().nullish(),
    author: z.string().nullish(),
    forwarded_from: z.string().nullish(),
    saved_from: z.string().nullish(),
    via_bot: z.string().nullish(),
    file_name: z.string().nullish(),
    file_size: z.number().nullish(),
    thumbnail_file_size: z.number().nullish(),
    media_type: chatEnums.mediaType.nullish(),
    sticker_emoji: z.string().nullish(),
    performer: z.string().nullish(),
    mime_type: z.string().nullish(),
    contact_information: contactInfoSchema.nullish(),
    contact_vcard: z.string().nullish(),
    contact_vcard_file_size: z.number().nullish(),
    location_information: locationInfoSchema.nullish(),
    live_location_period_seconds: z.number().nullish(),
    place_name: z.string().nullish(),
    address: z.string().nullish(),
    game_title: z.string().nullish(),
    game_description: z.string().nullish(),
    game_link: z.string().nullish(),
    invoice_information: invoiceInfoSchema.nullish(),
    poll: pollSchema.nullish(),
    giveaway_information: giveawayInfoSchema.nullish(),
    giveaway_results: giveawayResultsSchema.nullish(),
    paid_stars_amount: z.number().nullish(),
    text_entities: z.array(textEntitySchema),
    inline_bot_buttons: inlineButtonSchema.array().array().nullish(),
    reactions: z.array(reactionsSchema).nullish(),
});

const messagesSchema = z.array(messageSchema);

const chatSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  type: chatEnums.chatType,
  messages: messagesSchema,
});

type MessagesType = z.infer<typeof messagesSchema>;
type TextType = z.infer<typeof textSchema>;

export { chatSchema, messagesSchema};
export type { MessagesType, TextType };