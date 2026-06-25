import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private logger = new Logger('GEAMS');

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }
}
