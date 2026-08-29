import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary:
      'Gửi tin nhắn - tạo mới nếu không có conversationId, tiếp tục nếu có',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', description: 'Nội dung tin nhắn' },
        conversationId: {
          type: 'string',
          nullable: true,
          description: 'ID conversation (bỏ trống nếu tạo mới)',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Ảnh đính kèm (tuỳ chọn)',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images'))
  sendMessage(
    @GetUser('sub') userId: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.chatService.sendMessage(userId, dto, images, req.chatbotCode);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy tất cả conversations của user' })
  getConversations(@GetUser('sub') userId: string) {
    return this.chatService.getConversationsByUser(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Lấy chi tiết conversation (messages) theo id' })
  getConversationDetail(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatService.getConversationDetail(id, userId);
  }

  @Patch('conversations/:id/rename')
  @ApiOperation({ summary: 'Đổi tên conversation' })
  renameConversation(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
    @Body() dto: RenameConversationDto,
  ) {
    return this.chatService.renameConversation(String(id), userId, dto);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Xóa conversation theo id' })
  deleteConversation(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.chatService.deleteConversation(String(id), userId);
  }
}
