import { AcceptRejectPaymentDTO } from '@/dto/accept-reject-payment.dto';
import { CheckoutTransactionDTO } from '@/dto/checkout-transaction.dto';
import { GetAllTransactionForActionDTO } from '@/dto/get-all-transaction-for-action.dto';
import { GetEventTransactionSummaryDTO } from '@/dto/get-event-transaction-summary.dto';
import { GetTransactionByUserIdDTO } from '@/dto/get-transaction-by-userid.dto';
import { UpdatePaymentProofDTO } from '@/dto/update-payment-proof.dto';
import { UpdateTransactionDTO } from '@/dto/update-transaction.dto';
import { FailedValidationError } from '@/errors/failed-validation.error';
import { ApiError } from '@/errors/interface';
import { InternalSeverError } from '@/errors/internal-server.error';
import { NotFoundError } from '@/errors/not-found.error';
import { formatErr } from '@/helpers/format-error';
import { prismaclient } from '@/prisma';
import {
  TRANSACTION_EXP_WAIT_CONFIRM_TOKEN,
  transactionWaitConfirmQueue,
} from '@/queues';
import { EventDetailService } from '@/services/event-detail.service';
import { TransactionService } from '@/services/transaction.service';
import { UserService } from '@/services/user.service';
import { TransactionStatus } from '@prisma/client';
import { Request, Response } from 'express';

export class TransactionControllers {
  private transactionService = new TransactionService();
  private eventDetailService = new EventDetailService();
  private userService = new UserService();

  checkout = async (req: Request, res: Response) => {
    const { data: dto, error } = CheckoutTransactionDTO.safeParse(req.body);
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const transaction = await this.transactionService.checkout(dto);
      if (transaction.priceAfterDiscount > 0) {
        res.status(200).json({ transaction, status: 'NEED_PAYMENT' });
        return;
      }

      // If reach this path this means ticket is free or payment covered full
      // by discount
      transaction.status = TransactionStatus.COMPLETED;
      transaction.expiredAt = null;
      transaction.isPayed = true;
      const updated = await this.transactionService.update(transaction);
      // TODO: send smptp mailer
      res.status(200).json({ transaction: updated, status: 'COMPLETED' });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };

  getByUserId = async (req: Request, res: Response) => {
    const { data: dto, error } = GetTransactionByUserIdDTO.safeParse({
      userId: req.params.userId,
      status: req.query.status,
    });
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const user = await this.userService.getById(dto.userId);
      if (!user) throw new NotFoundError();

      const transaction = await this.transactionService.getByUserId(dto);
      if (!transaction) throw new NotFoundError();
      res.status(200).json({ transaction });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };

  update = async (req: Request, res: Response) => {
    const { data: dto, error } = UpdateTransactionDTO.safeParse({
      transactionId: req.params.transactionId,
      ...req.body,
    });
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const transaction = await this.transactionService.getById(
        dto.transactionId,
      );
      if (!transaction) throw new NotFoundError();

      if (dto.isPayed) transaction.isPayed = dto.isPayed;

      const updated = await this.transactionService.update(transaction);
      res.status(200).json({ transaction: updated });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };

  updatePaymentProof = async (req: Request, res: Response) => {
    const { data: dto, error } = UpdatePaymentProofDTO.safeParse({
      transactionId: req.params.transactionId,
      ...req.body,
    });
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const transaction = await this.transactionService.getById(
        dto.transactionId,
      );
      if (!transaction) throw new NotFoundError();

      const tigaHariKedepan = new Date();
      tigaHariKedepan.setDate(tigaHariKedepan.getDate() + 3);

      transaction.paymentProof = dto.paymentProof;
      transaction.expiredAt = tigaHariKedepan; // create new expired at for waiting confirmation
      transaction.status = TransactionStatus.WAITING_CONFIRMATION;

      // spawn new worker
      await transactionWaitConfirmQueue.add(
        TRANSACTION_EXP_WAIT_CONFIRM_TOKEN,
        { transactionId: transaction.id, tickets: transaction.tickets },
        { delay: tigaHariKedepan.getTime() - Date.now() }, // set same as expiredAt
        // { delay: 2 * 60 * 1000 }, // 2 minutes
      );

      const updated = await this.transactionService.update(transaction);

      //TODO: SEND SMTP MAILER

      res.status(200).json({ transaction: updated });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };

  getAllForAction = async (req: Request, res: Response) => {
    const { data: dto, error } = GetAllTransactionForActionDTO.safeParse(
      req.params,
    );
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const event = await this.eventDetailService.getById({
        eventId: dto.eventId,
      });
      if (!event) throw new NotFoundError();

      const transactions = await this.transactionService.getAllForAction(
        event.id,
      );
      res.status(200).json({ transactions });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };

  acceptPayment = async (req: Request, res: Response) => {
    const { data: dto, error } = AcceptRejectPaymentDTO.safeParse({
      transactionId: req.params.transactionId,
    });
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const transaction = await this.transactionService.getById(
        dto.transactionId,
      );
      if (!transaction) throw new NotFoundError();

      transaction.expiredAt = null; // create new expired at for waiting confirmation
      transaction.status = TransactionStatus.COMPLETED;

      const updated = await this.transactionService.update(transaction);

      //TODO: SEND SMTP MAILER

      res.status(200).json({ transaction: updated });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };

  rejectPayment = async (req: Request, res: Response) => {
    const { data: dto, error } = AcceptRejectPaymentDTO.safeParse({
      transactionId: req.params.transactionId,
    });
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const transaction = await this.transactionService.getById(
        dto.transactionId,
      );
      if (!transaction) throw new NotFoundError();

      transaction.expiredAt = new Date(); // update to current date
      transaction.status = TransactionStatus.CANCELLED;

      const updated = await this.transactionService.update(transaction);

      if (transaction.voucherId) {
        await prismaclient.voucher.update({
          where: {
            id: transaction.voucherId,
          },
          data: {
            status: 'NOT_USE',
          },
        });
      }
      if (transaction.usedPoints) {
        await prismaclient.pointBalance.create({
          data: {
            point: transaction.usedPoints,
            type: 'EARN',
            userId: transaction.buyerId,
          },
        });
      }
      transaction.tickets.forEach(async (ticket) => {
        await prismaclient.ticket.update({
          where: {
            id: ticket.ticketId,
          },
          data: {
            amount: {
              increment: ticket.quantity,
            },
          },
        });
      });

      //TODO: SEND SMTP MAILER

      res.status(200).json({ transaction: updated });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };

  getEventTransactionSummary = async (req: Request, res: Response) => {
    const { data: dto, error } = GetEventTransactionSummaryDTO.safeParse(
      req.params,
    );
    if (error) {
      throw new FailedValidationError(formatErr(error));
    }

    try {
      const event = await this.eventDetailService.getById({
        eventId: dto.eventId,
      });
      if (!event) throw new NotFoundError();

      const summary = await this.transactionService.getEventTransactionSummary(
        event.id,
      );

      res.status(200).json({ summary });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const err = error as Error;
        throw new InternalSeverError(err.message);
      }
      throw error;
    }
  };
}
