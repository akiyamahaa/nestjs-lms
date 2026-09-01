import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import fetch from 'node-fetch';
import FormData = require('form-data');

const CHAT_DOMAIN =
  process.env.CHAT_DOMAIN || 'https://chatbot.freelancer-vp.io.vn';

const CHATBOT_URL = `${CHAT_DOMAIN}/chat`;

const CHATBOT_CONVERSATION_URL = `${CHAT_DOMAIN}/conversations`;

const CHATBOT_CODE = process.env.CHATBOT_CODE || 'customer-support';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send message to chatbot
   */
  async sendMessage(
    userId: string,
    dto: SendMessageDto,
    images?: Express.Multer.File[],
    chatbotCode?: string,
  ) {
    /**
     * Nếu client gửi conversationId
     * -> kiểm tra conversation này có thuộc user hiện tại không
     */
    if (dto.conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          conversationId: dto.conversationId,
          userId,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    }

    /**
     * Tạo multipart/form-data request
     */
    const formData = new FormData();

    formData.append('chatbotCode', chatbotCode || CHATBOT_CODE);

    formData.append('message', dto.message);

    /**
     * Conversation cũ
     */
    if (dto.conversationId) {
      formData.append('conversationId', dto.conversationId);
    }

    /**
     * Attach images
     */
    if (images?.length) {
      for (const image of images) {
        formData.append('images', image.buffer, {
          filename: image.originalname,
          contentType: image.mimetype,
        });
      }
    }

    /**
     * Call chatbot service
     */
    const response = await fetch(CHATBOT_URL, {
      method: 'POST',
      headers: formData.getHeaders(),
      body: formData as any,
    });

    /**
     * Handle chatbot error
     */
    if (!response.ok) {
      const errorText = await response.text();

      throw new BadRequestException(`Chatbot API error: ${errorText}`);
    }

    const data = (await response.json()) as any;

    /**
     * Nếu là conversation mới
     * -> lưu mapping conversation vào database LMS
     */
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

  /**
   * Get conversations của user
   */
  async getConversationsByUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Get conversation detail
   */
  async getConversationDetail(id: string, userId: string) {
    const numId = Number.parseInt(id, 10);

    if (Number.isNaN(numId)) {
      throw new NotFoundException('Conversation not found');
    }

    /**
     * Kiểm tra conversation thuộc user
     */
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: numId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    /**
     * Lấy conversation detail từ chatbot service
     */
    const response = await fetch(
      `${CHATBOT_CONVERSATION_URL}/${conversation.conversationId}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new BadRequestException(`Chatbot API error: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Rename conversation
   */
  async renameConversation(
    id: string,
    userId: string,
    dto: RenameConversationDto,
  ) {
    const numId = Number.parseInt(id, 10);

    if (Number.isNaN(numId)) {
      throw new NotFoundException('Conversation not found');
    }

    /**
     * Check ownership
     */
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: numId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: {
        id: numId,
      },
      data: {
        title: dto.title,
      },
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(id: string, userId: string) {
    const numId = Number.parseInt(id, 10);

    if (Number.isNaN(numId)) {
      throw new NotFoundException('Conversation not found');
    }

    /**
     * Check ownership
     */
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: numId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversation.delete({
      where: {
        id: numId,
      },
    });

    return {
      message: 'Conversation deleted successfully',
    };
  }
}
