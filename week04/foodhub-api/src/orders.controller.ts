import { Body, Controller, Headers, HttpCode, NotFoundException, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ArrayNotEmpty, IsInt, IsString } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { IDEMPOTENCY, ORDERS, RESTAURANTS } from './data.js';
 
export class CreateOrderDto {
  @IsInt() restaurantId: number;
  @ArrayNotEmpty() @IsString({ each: true }) items: string[];
}
 
@Controller('v1/orders')
export class OrdersController {
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateOrderDto,
         @Headers('idempotency-key') key: string | undefined,
         @Res({ passthrough: true }) res: Response) {
    if (key && IDEMPOTENCY.has(key)) {
      res.status(200);                         // same request again: return the first result
      return ORDERS.get(IDEMPOTENCY.get(key)!);
    }
    if (!RESTAURANTS.some(r => r.id === dto.restaurantId)) {
      throw new NotFoundException('restaurant not found');
    }
    const order = { id: randomUUID(), status: 'PLACED', ...dto };
    ORDERS.set(order.id, order);
    if (key) IDEMPOTENCY.set(key, order.id);
    return order;
  }
}
