import { getSupabase } from './supabaseClient.js';

export interface User {
  id: string;
  username: string;
  publicKey: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface Room {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[]; // user IDs
  isEncrypted: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  encryptedContent?: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system' | 'voice';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    data?: string;
    isImage?: boolean;
    duration?: number;
  };
}

export class Database {
  private supabase = getSupabase();

  // Users
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return data;
  }

  async createOrUpdateUser(user: User): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          username: user.username,
          public_key: user.publicKey,
          avatar: user.avatar,
          is_online: user.isOnline,
          last_seen: user.lastSeen.toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
    return data;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user status:', error);
    }
  }

  async updateUserProfile(userId: string, updates: { username?: string; avatar?: string }): Promise<User | null> {
    const updateData: any = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    return data;
  }

  // Rooms
  async getRoom(roomId: string): Promise<Room | null> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error fetching room:', error);
      return null;
    }

    if (data) {
      return {
        id: data.id,
        name: data.name,
        type: data.type,
        participants: data.participants,
        isEncrypted: data.is_encrypted,
        createdAt: new Date(data.created_at),
      };
    }

    return null;
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .contains('participants', [userId]);

    if (error) {
      console.error('Error fetching user rooms:', error);
      return [];
    }

    return (data || []).map((room: any) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      participants: room.participants,
      isEncrypted: room.is_encrypted,
      createdAt: new Date(room.created_at),
    }));
  }

  async createRoom(room: Room): Promise<Room> {
    const { data, error } = await this.supabase
      .from('rooms')
      .insert({
        id: room.id,
        name: room.name,
        type: room.type,
        participants: room.participants,
        is_encrypted: room.isEncrypted,
        created_at: room.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      participants: data.participants,
      isEncrypted: data.is_encrypted,
      createdAt: new Date(data.created_at),
    };
  }

  // Messages
  async getRoomMessages(roomId: string, limit = 100): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []).map((msg: any) => ({
      id: msg.id,
      roomId: msg.room_id,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      content: msg.content,
      encryptedContent: msg.encrypted_content,
      timestamp: new Date(msg.timestamp),
      type: msg.type,
      status: msg.status,
      fileInfo: msg.file_info,
    }));
  }

  async createMessage(message: Message): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        id: message.id,
        room_id: message.roomId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        content: message.content,
        encrypted_content: message.encryptedContent,
        timestamp: message.timestamp.toISOString(),
        type: message.type,
        status: message.status || 'sent',
        file_info: message.fileInfo,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw error;
    }

    return {
      id: data.id,
      roomId: data.room_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      content: data.content,
      encryptedContent: data.encrypted_content,
      timestamp: new Date(data.timestamp),
      type: data.type,
      status: data.status,
      fileInfo: data.file_info,
    };
  }

  async updateMessageStatus(messageId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .update({ status })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating message status:', error);
    }
  }
}
