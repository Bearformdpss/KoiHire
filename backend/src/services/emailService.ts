import nodemailer, { Transporter } from 'nodemailer';
import {
  orderPlacedFreelancerEmail,
  orderPlacedClientEmail,
  orderDeliveredClientEmail,
  orderCompletedFreelancerEmail,
  applicationReceivedClientEmail,
} from '../templates/emailTemplates';

/**
 * Email Service for sending transactional emails via AWS SES
 */
class EmailService {
  private transporter: Transporter;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    // Initialize SMTP transporter with AWS SES credentials
    this.transporter = nodemailer.createTransport({
      host: process.env.AWS_SES_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
      port: Number(process.env.AWS_SES_SMTP_PORT) || 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.AWS_SES_SMTP_USERNAME,
        pass: process.env.AWS_SES_SMTP_PASSWORD,
      },
    });

    this.fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@koihire.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'https://koihire.com';

    // Verify connection on startup
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service ready - AWS SES SMTP connection verified');
    } catch (error) {
      console.error('❌ Email service error - SMTP connection failed:', error);
    }
  }

  /**
   * Send email with error handling
   */
  private async sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
    try {
      const recipients = Array.isArray(to) ? to : [to];

      await this.transporter.sendMail({
        from: `KoiHire <${this.fromEmail}>`,
        to: recipients.join(', '),
        subject,
        html,
      });

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
