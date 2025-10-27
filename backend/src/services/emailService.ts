import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  orderPlacedFreelancerEmail,
  orderPlacedClientEmail,
  orderDeliveredClientEmail,
  orderCompletedFreelancerEmail,
  applicationReceivedClientEmail,
} from '../templates/emailTemplates';

/**
 * Email Service for sending transactional emails via AWS SES
 * Uses AWS SDK for better compatibility with hosting platforms
 */
class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;
  private frontendUrl: string;
  private isConfigured: boolean;

  constructor() {
    // Check if AWS SES is configured
    this.isConfigured = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION
    );

    if (this.isConfigured) {
      // Initialize AWS SES client
      this.sesClient = new SESClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      console.log('✅ Email service ready - AWS SES configured');
    } else {
      console.warn('⚠️  Email service not configured - emails will not be sent');
      // Create dummy client to prevent errors
      this.sesClient = new SESClient({ region: 'us-east-1' });
    }

    this.fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@koihire.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'https://koihire.com';
  }

  /**
   * Send email with error handling
   */
  private async sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
    if (!this.isConfigured) {
      console.log(`📧 [DEV MODE] Would send email: "${subject}" to ${Array.isArray(to) ? to.join(', ') : to}`);
      return;
    }

    try {
      const recipients = Array.isArray(to) ? to : [to];

      const command = new SendEmailCommand({
        Source: `KoiHire <${this.fromEmail}>`,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await this.sesClient.send(command);
      console.log(`✅ Email sent: "${subject}" to ${recipients.join(', ')}`);
    } catch (error) {
      console.error(`❌ Failed to send email: "${subject}"`, error);
      // Don't throw - we don't want email failures to crash the API
    }
  }

  /**
   * EMAIL #1: Order Placed - Freelancer Notification
   */
  async sendOrderPlacedFreelancerEmail(data: {
    order: any; // ServiceOrder with relations
    freelancer: any; // User
    client: any; // User
  }): Promise<void> {
    const { order, freelancer, client } = data;

    const html = orderPlacedFreelancerEmail({
      orderNumber: order.orderNumber,
      clientName: `${client.firstName} ${client.lastName}`,
      serviceTitle: order.service?.title || 'Service',
      packageTier: order.package?.tier || 'BASIC',
      totalAmount: order.totalAmount,
      requirements: order.requirements,
      expectedDeliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'To be determined',
      orderUrl: `${this.frontendUrl}/dashboard/orders/${order.id}`,
      acceptUrl: `${this.frontendUrl}/dashboard/orders/${order.id}?action=accept`,
    });

    await this.sendEmail(
      freelancer.email,
      `🎉 New Order Received - ${order.service?.title || 'Service'}`,
      html
    );
  }

  /**
   * EMAIL #2: Order Placed - Client Confirmation
   */
  async sendOrderPlacedClientEmail(data: {
    order: any; // ServiceOrder with relations
    client: any; // User
    freelancer: any; // User
  }): Promise<void> {
    const { order, client, freelancer } = data;

    const html = orderPlacedClientEmail({
      orderNumber: order.orderNumber,
      freelancerName: `${freelancer.firstName} ${freelancer.lastName}`,
      freelancerRating: freelancer.rating,
      serviceTitle: order.service?.title || 'Service',
      packageTier: order.package?.tier || 'BASIC',
      totalAmount: order.totalAmount,
      expectedDeliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'To be determined',
      requirements: order.requirements,
      orderUrl: `${this.frontendUrl}/dashboard/orders/${order.id}`,
      contactUrl: `${this.frontendUrl}/messages?orderId=${order.id}`,
    });

    await this.sendEmail(
      client.email,
      `Order Confirmation - ${order.service?.title || 'Service'} #${order.orderNumber}`,
      html
    );
  }

  /**
   * EMAIL #3: Order Delivered - Client Notification
   */
  async sendOrderDeliveredClientEmail(data: {
    order: any; // ServiceOrder with relations
    client: any; // User
    freelancer: any; // User
    deliverable: any; // OrderDeliverable
  }): Promise<void> {
    const { order, client, freelancer, deliverable } = data;

    const html = orderDeliveredClientEmail({
      orderNumber: order.orderNumber,
      freelancerName: `${freelancer.firstName} ${freelancer.lastName}`,
      serviceTitle: order.service?.title || 'Service',
      deliveryTitle: deliverable.title,
      deliveryDescription: deliverable.description,
      fileCount: deliverable.files?.length || 0,
      revisionsRemaining: (order.package?.revisions || 0) - (order.revisionsUsed || 0),
      deliveryUrl: `${this.frontendUrl}/dashboard/orders/${order.id}`,
      approveUrl: `${this.frontendUrl}/dashboard/orders/${order.id}?action=approve`,
      revisionUrl: `${this.frontendUrl}/dashboard/orders/${order.id}?action=revision`,
    });

    await this.sendEmail(
      client.email,
      `📦 Your Order Has Been Delivered - ${order.service?.title || 'Service'}`,
      html
    );
  }

  /**
   * EMAIL #4: Order Completed - Freelancer Notification (Payment Released)
   */
  async sendOrderCompletedFreelancerEmail(data: {
    order: any; // ServiceOrder with relations
    freelancer: any; // User
    client: any; // User
  }): Promise<void> {
    const { order, freelancer, client } = data;

    const html = orderCompletedFreelancerEmail({
      orderNumber: order.orderNumber,
      clientName: `${client.firstName} ${client.lastName}`,
      serviceTitle: order.service?.title || 'Service',
      paymentAmount: order.totalAmount, // TODO: Calculate platform fee if needed
      orderUrl: `${this.frontendUrl}/dashboard/orders/${order.id}`,
      earningsUrl: `${this.frontendUrl}/dashboard/earnings`,
    });

    await this.sendEmail(
      freelancer.email,
      `🎊 Order Completed - Payment Released - ${order.service?.title || 'Service'}`,
      html
    );
  }

  /**
   * EMAIL #5: Application Submitted - Client Notification
   */
  async sendApplicationReceivedClientEmail(data: {
    application: any; // Application with relations
    client: any; // User
    freelancer: any; // User
    project: any; // Project
    totalApplications: number;
  }): Promise<void> {
    const { application, client, freelancer, project, totalApplications } = data;

    // Truncate cover letter to first 200 characters
    const coverLetterExcerpt = application.coverLetter
      ? application.coverLetter.substring(0, 200)
      : 'No cover letter provided';

    const html = applicationReceivedClientEmail({
      projectTitle: project.title,
      freelancerName: `${freelancer.firstName} ${freelancer.lastName}`,
      freelancerRating: freelancer.rating,
      freelancerLocation: freelancer.location,
      proposedBudget: application.proposedBudget,
      proposedTimeline: application.timeline || 'To be determined',
      coverLetterExcerpt,
      totalApplications,
      proposalUrl: `${this.frontendUrl}/dashboard/projects/${project.id}/applications/${application.id}`,
      allProposalsUrl: `${this.frontendUrl}/dashboard/projects/${project.id}/applications`,
    });

    await this.sendEmail(
      client.email,
      `📬 New Proposal Received - ${project.title}`,
      html
    );
  }
}

// Export singleton instance
export const emailService = new EmailService();
