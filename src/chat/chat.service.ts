import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import fetch from 'node-fetch';
import FormData from 'form-data';

const CHAT_DOMAIN =
  process.env.CHAT_DOMAIN || 'https://chatbot.freelancer-vp.io.vn';
const CHATBOT_URL = `${CHAT_DOMAIN}/chat`;
const CHATBOT_CONVERSATION_URL = `${CHAT_DOMAIN}/conversations`;
const CHATBOT_CODE = process.env.CHATBOT_CODE || 'customer-support';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(
    userId: string,
    dto: SendMessageDto,
    images?: Express.Multer.File[],
    chatbotCode?: string,
  ) {
    // Nếu có conversationId thì kiểm tra conversation thuộc về user
    if (dto.conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: { conversationId: dto.conversationId, userId },
      });
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    }

    // Gọi đến chatbot API
    const formData = new FormData();
    formData.append('chatbotCode', chatbotCode || CHATBOT_CODE);
    formData.append('message', dto.message);
    if (dto.conversationId) {
      formData.append('conversationId', dto.conversationId);
    }
    if (images && images.length > 0) {
      for (const image of images) {
        formData.append('images', image.buffer, {
          filename: image.originalname,
          contentType: image.mimetype,
        });
      }
    }

    const response = await fetch(CHATBOT_URL, {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestException(`Chatbot API error: ${errorText}`);
    }

    const data = (await response.json()) as any;

    // Nếu là conversation mới thì lưu vào DB
    if (!dto.conversationId && data?.conversationId) {
      await this.prisma.conversation.create({
        data: {
          conversationId: data.conversationId,
          userId,
          title: dto.message.slice(0, 50),
        },
      });
    }

    return data;
  }

  async getConversationsByUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversationDetail(id: string, userId: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new NotFoundException('Conversation not found');

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: numId, userId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const response = await fetch(
      `${CHATBOT_CONVERSATION_URL}/${conversation.conversationId}`,
      { method: 'GET', headers: { accept: 'application/json' } },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestException(`Chatbot API error: ${errorText}`);
    }

    return response.json();
  }

  async renameConversation(
    id: string,
    userId: string,
    dto: RenameConversationDto,
  ) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new NotFoundException('Conversation not found');
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: numId, userId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id: numId },
      data: { title: dto.title },
    });
  }

  async deleteConversation(id: string, userId: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new NotFoundException('Conversation not found');
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: numId, userId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversation.delete({ where: { id: numId } });
    return { message: 'Conversation deleted successfully' };
  }
}
