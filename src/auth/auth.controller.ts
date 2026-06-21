import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body): Promise<any> {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body): Promise<any> {
    return this.authService.login(body);
  }
}
