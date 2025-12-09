import { Resend } from 'resend';
import {
  orderPlacedFreelancerEmail,
  orderPlacedClientEmail,
  orderDeliveredClientEmail,
  orderCompletedFreelancerEmail,
  applicationReceivedClientEmail,
  passwordResetEmail,
  // Phase 1 - Critical emails
  applicationAcceptedFreelancerEmail,
  applicationRejectedFreelancerEmail,
  workSubmittedClientEmail,
  workApprovedFreelancerEmail,
  projectPaymentReleasedFreelancerEmail,
  changesRequestedFreelancerEmail,
  serviceOrderAcceptedClientEmail,
  revisionRequestedFreelancerEmail,
  // Phase 2 - Important emails
  projectUpdatePostedClientEmail,
  escrowFundedFreelancerEmail,
  orderCancelledEmail,
  welcomeEmail,
  // Phase 3 - Nice-to-have emails
  projectCancelledFreelancerEmail,
  serviceReviewReceivedFreelancerEmail,
  passwordChangedConfirmationEmail,
} from '../templates/emailTemplates';

/**
 * Email Service for sending transactional emails via Resend
 * Simple, reliable, and developer-friendly email service
 */
class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;
  private isConfigured: boolean;

  constructor() {
    // Check if Resend is configured
    this.isConfigured = !!process.env.RESEND_API_KEY;

    if (this.isConfigured) {
      // Initialize Resend client
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('✅ Email service ready - Resend configured');
    } else {
      console.warn('⚠️  Email service not configured - emails will not be sent');
      // Create dummy client to prevent errors
      this.resend = new Resend('dummy-key');
    }

    this.fromEmail = process.env.FROM_EMAIL || 'noreply@koihire.com';
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

      const { data, error } = await this.resend.emails.send({
        from: `KoiHire <${this.fromEmail}>`,
        to: recipients,
        subject,
        html,
      });

      if (error) {
        throw error;
      }

      console.log(`✅ Email sent: "${subject}" to ${recipients.join(', ')} (ID: ${data?.id})`);
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

  /**
   * EMAIL #6: Password Reset Request
   */
  async sendPasswordResetEmail(data: {
    email: string;
    firstName: string;
    resetToken: string;
  }): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${data.resetToken}`;

    const html = passwordResetEmail({
      firstName: data.firstName,
      resetToken: data.resetToken,
      resetUrl,
    });

    await this.sendEmail(
      data.email,
      'Reset Your KoiHire Password',
      html
    );
  }

  // ==================== PHASE 1: CRITICAL EMAIL METHODS ====================

  /**
   * EMAIL #7: Application Accepted - Freelancer Notification
   */
  async sendApplicationAcceptedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string; lastName: string };
    client: { firstName: string; lastName: string };
    project: { id: string; title: string };
    agreedAmount: number;
  }): Promise<void> {
    const html = applicationAcceptedFreelancerEmail({
      freelancerName: `${data.freelancer.firstName}`,
      projectTitle: data.project.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      agreedAmount: data.agreedAmount,
      projectUrl: `${this.frontendUrl}/projects/${data.project.id}/workspace`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `🎉 You've Been Hired! - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #8: Application Rejected - Freelancer Notification
   */
  async sendApplicationRejectedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    project: { title: string };
  }): Promise<void> {
    const html = applicationRejectedFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      projectTitle: data.project.title,
      browseProjectsUrl: `${this.frontendUrl}/projects`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `Application Update - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #9: Work Submitted for Review - Client Notification
   */
  async sendWorkSubmittedClientEmail(data: {
    client: { email: string; firstName: string };
    freelancer: { firstName: string; lastName: string };
    project: { id: string; title: string };
    submission: { title: string; submissionNumber: number };
  }): Promise<void> {
    const html = workSubmittedClientEmail({
      clientName: data.client.firstName,
      projectTitle: data.project.title,
      freelancerName: `${data.freelancer.firstName} ${data.freelancer.lastName}`,
      submissionTitle: data.submission.title,
      submissionNumber: data.submission.submissionNumber,
      projectUrl: `${this.frontendUrl}/projects/${data.project.id}/workspace`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.client.email,
      `📬 Work Submitted for Review - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #10: Work Approved - Freelancer Notification
   */
  async sendWorkApprovedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    client: { firstName: string; lastName: string };
    project: { id: string; title: string };
  }): Promise<void> {
    const html = workApprovedFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      projectTitle: data.project.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      projectUrl: `${this.frontendUrl}/projects/${data.project.id}/workspace`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `✅ Your Work Has Been Approved! - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #11: Project Payment Released - Freelancer Notification
   */
  async sendProjectPaymentReleasedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    client: { firstName: string; lastName: string };
    project: { title: string };
    paymentAmount: number;
  }): Promise<void> {
    const html = projectPaymentReleasedFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      projectTitle: data.project.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      paymentAmount: data.paymentAmount,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `💰 Payment Released! - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #12: Changes Requested - Freelancer Notification
   */
  async sendChangesRequestedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    client: { firstName: string; lastName: string };
    project: { id: string; title: string };
    changeMessage: string;
    revisionsUsed: number;
    maxRevisions: number;
  }): Promise<void> {
    const html = changesRequestedFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      projectTitle: data.project.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      changeMessage: data.changeMessage,
      revisionsUsed: data.revisionsUsed,
      maxRevisions: data.maxRevisions,
      projectUrl: `${this.frontendUrl}/projects/${data.project.id}/workspace`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `📝 Revision Requested - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #13: Service Order Accepted - Client Notification
   */
  async sendServiceOrderAcceptedClientEmail(data: {
    client: { email: string; firstName: string };
    freelancer: { firstName: string; lastName: string };
    order: { id: string; orderNumber: string };
    service: { title: string };
    expectedDeliveryDate: string;
  }): Promise<void> {
    const html = serviceOrderAcceptedClientEmail({
      clientName: data.client.firstName,
      orderNumber: data.order.orderNumber,
      serviceTitle: data.service.title,
      freelancerName: `${data.freelancer.firstName} ${data.freelancer.lastName}`,
      expectedDeliveryDate: data.expectedDeliveryDate,
      orderUrl: `${this.frontendUrl}/orders/${data.order.id}`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.client.email,
      `✅ Order Accepted - ${data.service.title}`,
      html
    );
  }

  /**
   * EMAIL #14: Revision Requested on Service Order - Freelancer Notification
   */
  async sendRevisionRequestedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    client: { firstName: string; lastName: string };
    order: { id: string; orderNumber: string };
    service: { title: string };
    revisionNote: string;
    revisionsUsed: number;
    maxRevisions: number;
  }): Promise<void> {
    const html = revisionRequestedFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      orderNumber: data.order.orderNumber,
      serviceTitle: data.service.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      revisionNote: data.revisionNote,
      revisionsUsed: data.revisionsUsed,
      maxRevisions: data.maxRevisions,
      orderUrl: `${this.frontendUrl}/orders/${data.order.id}`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `📝 Revision Requested - ${data.service.title}`,
      html
    );
  }

  // ==================== PHASE 2: IMPORTANT EMAIL METHODS ====================

  /**
   * EMAIL #15: Project Update Posted - Client Notification
   */
  async sendProjectUpdatePostedClientEmail(data: {
    client: { email: string; firstName: string };
    freelancer: { firstName: string; lastName: string };
    project: { id: string; title: string };
    update: { title: string; type: string; message: string };
  }): Promise<void> {
    const html = projectUpdatePostedClientEmail({
      clientName: data.client.firstName,
      projectTitle: data.project.title,
      freelancerName: `${data.freelancer.firstName} ${data.freelancer.lastName}`,
      updateTitle: data.update.title,
      updateType: data.update.type,
      updateMessage: data.update.message,
      projectUrl: `${this.frontendUrl}/projects/${data.project.id}/workspace`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.client.email,
      `📊 Project Update - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #16: Escrow Funded - Freelancer Notification
   */
  async sendEscrowFundedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    client: { firstName: string; lastName: string };
    project: { id: string; title: string };
    fundedAmount: number;
  }): Promise<void> {
    const html = escrowFundedFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      projectTitle: data.project.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      fundedAmount: data.fundedAmount,
      projectUrl: `${this.frontendUrl}/projects/${data.project.id}/workspace`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `🔒 Escrow Funded - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #17: Order Cancelled - Notification to Both Parties
   */
  async sendOrderCancelledEmail(data: {
    recipient: { email: string; firstName: string; role: 'CLIENT' | 'FREELANCER' };
    cancelledBy: { firstName: string; lastName: string; role: 'CLIENT' | 'FREELANCER' };
    order: { orderNumber: string };
    service: { title: string };
    reason?: string;
  }): Promise<void> {
    const ordersUrl = data.recipient.role === 'CLIENT'
      ? `${this.frontendUrl}/client/orders`
      : `${this.frontendUrl}/freelancer/orders`;

    const html = orderCancelledEmail({
      recipientName: data.recipient.firstName,
      orderNumber: data.order.orderNumber,
      serviceTitle: data.service.title,
      cancelledByName: `${data.cancelledBy.firstName} ${data.cancelledBy.lastName}`,
      cancelledByRole: data.cancelledBy.role,
      reason: data.reason,
      ordersUrl,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.recipient.email,
      `Order Cancelled - ${data.service.title}`,
      html
    );
  }

  /**
   * EMAIL #18: Welcome Email - New User Registration
   */
  async sendWelcomeEmail(data: {
    email: string;
    firstName: string;
    role: 'CLIENT' | 'FREELANCER';
  }): Promise<void> {
    const html = welcomeEmail({
      firstName: data.firstName,
      role: data.role,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
      settingsUrl: `${this.frontendUrl}/settings`,
    });

    await this.sendEmail(
      data.email,
      `🎉 Welcome to KoiHire, ${data.firstName}!`,
      html
    );
  }

  // ==================== PHASE 3: NICE-TO-HAVE EMAIL METHODS ====================

  /**
   * EMAIL #19: Project Cancelled - Freelancer Notification
   * Only sent if freelancer was assigned to the project
   */
  async sendProjectCancelledFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    client: { firstName: string; lastName: string };
    project: { title: string };
    reason?: string;
  }): Promise<void> {
    const html = projectCancelledFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      projectTitle: data.project.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      reason: data.reason,
      browseProjectsUrl: `${this.frontendUrl}/projects`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `Project Cancelled - ${data.project.title}`,
      html
    );
  }

  /**
   * EMAIL #20: Service Review Received - Freelancer Notification
   */
  async sendServiceReviewReceivedFreelancerEmail(data: {
    freelancer: { email: string; firstName: string };
    client: { firstName: string; lastName: string };
    service: { title: string };
    review: { rating: number; comment?: string };
  }): Promise<void> {
    const html = serviceReviewReceivedFreelancerEmail({
      freelancerName: data.freelancer.firstName,
      serviceTitle: data.service.title,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      rating: data.review.rating,
      comment: data.review.comment,
      servicesUrl: `${this.frontendUrl}/freelancer/services`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });

    await this.sendEmail(
      data.freelancer.email,
      `⭐ New Review - ${data.service.title}`,
      html
    );
  }

  /**
   * EMAIL #21: Password Changed Confirmation
   */
  async sendPasswordChangedConfirmationEmail(data: {
    email: string;
    firstName: string;
  }): Promise<void> {
    const html = passwordChangedConfirmationEmail({
      firstName: data.firstName,
      changedAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      loginUrl: `${this.frontendUrl}/login`,
    });

    await this.sendEmail(
      data.email,
      '🔐 Password Changed - KoiHire',
      html
    );
  }
}

// Export singleton instance
export const emailService = new EmailService();
