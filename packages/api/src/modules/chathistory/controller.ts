import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { ChatHistory } from './service';

export class ChatHistoryController extends GenericCrudController<ChatHistory> {
  constructor(chatHistoryService: Repository<ChatHistory>) {
    super(chatHistoryService, 'ChatHistory', ['user_id', 'message', 'role', 'timestamp']);
  }
}
