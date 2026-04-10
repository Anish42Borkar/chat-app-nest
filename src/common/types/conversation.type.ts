export interface ConversationT {
  conversation_id: number;
  updated_at: Date;
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_time: Date;
}
