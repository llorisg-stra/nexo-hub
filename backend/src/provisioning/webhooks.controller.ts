import {
    Controller,
    Post,
    Req,
    Headers,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../prisma';
import { ClientsService } from '../clients/clients.service';
import { ProvisioningService } from './provisioning.service';

@Controller('api/webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);
    private readonly stripe: Stripe | null;
    private readonly webhookSecret: string;

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
        private readonly clients: ClientsService,
        private readonly provisioning: ProvisioningService,
    ) {
        const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY', '');
        this.stripe = stripeKey ? new Stripe(stripeKey) : null;
        this.webhookSecret = this.config.get<string>(
            'STRIPE_WEBHOOK_SECRET',
            '',
        );
        if (!this.stripe) {
            this.logger.warn('Stripe not configured — webhooks disabled');
        }
    }

    /**
     * Handle Stripe webhook events.
     */
    @Post('stripe')
    async handleStripeWebhook(
        @Req() req: Request & { rawBody?: Buffer },
        @Headers('stripe-signature') signature: string,
    ) {
        if (!this.webhookSecret || !this.stripe) {
            throw new BadRequestException('Stripe webhook not configured');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(
                req.rawBody!,
                signature,
                this.webhookSecret,
            );
        } catch (err) {
            this.logger.error(`Stripe signature verification failed: ${err}`);
            throw new BadRequestException('Invalid Stripe signature');
        }

        this.logger.log(`Stripe event received: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(
                    event.data.object as Stripe.Checkout.Session,
                );
                break;

            case 'invoice.payment_failed':
                await this.handlePaymentFailed(
                    event.data.object as Stripe.Invoice,
                );
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(
                    event.data.object as Stripe.Subscription,
                );
                break;

            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const metadata = session.metadata || {};
        const email = session.customer_email || metadata['email'];
        const company = metadata['company'] || '';
        const slug = metadata['slug'] || '';
        const plan = metadata['plan'] || 'STARTER';

        if (!email || !slug) {
            this.logger.error(
                'Checkout session missing email or slug in metadata',
            );
            return;
        }

        this.logger.log(
            `Auto-provisioning matrix for ${email} (slug: ${slug})`,
        );

        // Create or find client
        let client = await this.prisma.client.findUnique({
            where: { email },
        });

        if (!client) {
            client = await this.clients.create({
                name: company || email.split('@')[0],
                email,
                company,
                plan: plan as 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE',
            });
        }

        // Update Stripe IDs
        await this.prisma.client.update({
            where: { id: client.id },
            data: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
            },
        });

        // Provision matrix (async — fire and forget, logs tracked in events)
        this.provisioning
            .provisionMatrix({ clientId: client.id, slug })
            .then((result) => {
                this.logger.log(
                    `Matrix ${slug} provisioned: ${result.status}`,
                );
            })
            .catch((error: Error) => {
                this.logger.error(
                    `Auto-provisioning failed for ${slug}: ${error.message}`,
                );
            });
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice) {
        const customerId = invoice.customer as string;
        const client = await this.clients.findByStripeCustomer(customerId);
        if (!client) return;

        const matrices = await this.prisma.matrixInstance.findMany({
            where: { clientId: client.id, status: 'ACTIVE' },
        });

        for (const matrix of matrices) {
            await this.provisioning.suspendMatrix(matrix.id);
            this.logger.warn(`Matrix ${matrix.slug} suspended due to payment failure`);
        }
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const client = await this.clients.findByStripeCustomer(customerId);
        if (!client) return;

        await this.prisma.client.update({
            where: { id: client.id },
            data: { status: 'CANCELLED' },
        });

        this.logger.warn(
            `Client ${client.name} subscription cancelled`,
        );
    }
}
