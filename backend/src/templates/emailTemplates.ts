/**
 * Email Template Helpers
 * Simple HTML email templates with inline CSS for maximum email client compatibility
 */

// KoiHire brand colors
const COLORS = {
  orange: '#FF6B35',
  teal: '#00A7A3',
  navy: '#1A3A52',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
};

// Base email wrapper
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KoiHire</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.lightGray};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.lightGray}; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #FF6B35 !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">KoiHire</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.lightGray}; padding: 30px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; color: ${COLORS.gray}; font-size: 14px;">
                © ${new Date().getFullYear()} KoiHire. All rights reserved.
              </p>
              <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">
                <a href="https://koihire.com" style="color: ${COLORS.orange}; text-decoration: none;">Visit KoiHire</a> |
                <a href="https://koihire.com/contact" style="color: ${COLORS.orange}; text-decoration: none;">Contact Us</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Button component
function button(text: string, url: string, isPrimary: boolean = true): string {
  const bgColor = isPrimary ? COLORS.orange : COLORS.white;
  const textColor = isPrimary ? COLORS.white : COLORS.orange;
  const border = isPrimary ? 'none' : `2px solid ${COLORS.orange}`;

  return `
    <a href="${url}" style="display: inline-block; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px; border: ${border}; margin: 10px 5px;">
      ${text}
    </a>
  `;
}

// Info box component
function infoBox(label: string, value: string): string {
  return `
    <div style="background-color: ${COLORS.lightGray}; padding: 15px; border-radius: 6px; margin: 10px 0;">
      <p style="margin: 0 0 5px 0; color: ${COLORS.gray}; font-size: 14px; font-weight: 600;">${label}</p>
      <p style="margin: 0; color: ${COLORS.navy}; font-size: 16px; font-weight: 500;">${value}</p>
    </div>
  `;
}

/**
 * EMAIL #1: Order Placed - Freelancer Notification
 */
export function orderPlacedFreelancerEmail(data: {
  orderNumber: string;
  clientName: string;
  serviceTitle: string;
  packageTier: string;
  totalAmount: number;
  requirements?: string;
  expectedDeliveryDate: string;
  orderUrl: string;
  acceptUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">🎉 New Order Received!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Congratulations! You've received a new order from <strong>${data.clientName}</strong>.
    </p>

    ${infoBox('Order Number', `#${data.orderNumber}`)}
    ${infoBox('Service', data.serviceTitle)}
    ${infoBox('Package', data.packageTier)}
    ${infoBox('Total Amount', `$${data.totalAmount.toFixed(2)}`)}
    ${infoBox('Expected Delivery', data.expectedDeliveryDate)}

    ${data.requirements ? `
      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 18px;">Requirements:</h3>
        <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6; background-color: ${COLORS.lightGray}; padding: 15px; border-radius: 6px;">
          ${data.requirements}
        </p>
      </div>
    ` : ''}

    <div style="margin: 30px 0; text-align: center;">
      ${button('Accept Order', data.acceptUrl)}
      ${button('View Details', data.orderUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Please accept this order and begin work as soon as possible. Good luck! 🚀
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #2: Order Placed - Client Confirmation
 */
export function orderPlacedClientEmail(data: {
  orderNumber: string;
  freelancerName: string;
  freelancerRating?: number;
  serviceTitle: string;
  packageTier: string;
  totalAmount: number;
  expectedDeliveryDate: string;
  requirements?: string;
  orderUrl: string;
  contactUrl: string;
}): string {
  const ratingStars = data.freelancerRating
    ? '⭐'.repeat(Math.round(data.freelancerRating))
    : '';

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">✅ Order Confirmation</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Thank you for your order! Your order has been sent to <strong>${data.freelancerName}</strong> ${ratingStars}.
    </p>

    ${infoBox('Order Number', `#${data.orderNumber}`)}
    ${infoBox('Service', data.serviceTitle)}
    ${infoBox('Package', data.packageTier)}
    ${infoBox('Total Paid', `$${data.totalAmount.toFixed(2)}`)}
    ${infoBox('Expected Delivery', data.expectedDeliveryDate)}

    ${data.requirements ? `
      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 18px;">Your Requirements:</h3>
        <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6; background-color: ${COLORS.lightGray}; padding: 15px; border-radius: 6px;">
          ${data.requirements}
        </p>
      </div>
    ` : ''}

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Order Status', data.orderUrl)}
      ${button('Contact Seller', data.contactUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      You'll receive notifications as your order progresses. Payment will be held securely until you approve the delivery.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #3: Order Delivered - Client Notification
 */
export function orderDeliveredClientEmail(data: {
  orderNumber: string;
  freelancerName: string;
  serviceTitle: string;
  deliveryTitle: string;
  deliveryDescription?: string;
  fileCount: number;
  revisionsRemaining: number;
  deliveryUrl: string;
  approveUrl: string;
  revisionUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">📦 Your Order Has Been Delivered!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Great news! <strong>${data.freelancerName}</strong> has completed your order and submitted the deliverables.
    </p>

    ${infoBox('Order Number', `#${data.orderNumber}`)}
    ${infoBox('Service', data.serviceTitle)}
    ${infoBox('Delivery', data.deliveryTitle)}
    ${infoBox('Files Delivered', `${data.fileCount} file${data.fileCount !== 1 ? 's' : ''}`)}
    ${infoBox('Revisions Remaining', data.revisionsRemaining.toString())}

    ${data.deliveryDescription ? `
      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 18px;">Delivery Notes:</h3>
        <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6; background-color: ${COLORS.lightGray}; padding: 15px; border-radius: 6px;">
          ${data.deliveryDescription}
        </p>
      </div>
    ` : ''}

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Delivery', data.deliveryUrl)}
      ${button('Approve Work', data.approveUrl, false)}
      ${data.revisionsRemaining > 0 ? button('Request Revision', data.revisionUrl, false) : ''}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Please review the delivery and either approve the work or request a revision within 7 days.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #4: Order Completed - Freelancer Notification (Payment Released)
 */
export function orderCompletedFreelancerEmail(data: {
  orderNumber: string;
  clientName: string;
  serviceTitle: string;
  paymentAmount: number;
  orderUrl: string;
  earningsUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">🎊 Order Completed - Payment Released!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Congratulations! <strong>${data.clientName}</strong> has approved your work and the payment has been released to your account.
    </p>

    ${infoBox('Order Number', `#${data.orderNumber}`)}
    ${infoBox('Service', data.serviceTitle)}
    ${infoBox('Payment Released', `$${data.paymentAmount.toFixed(2)}`)}

    <div style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: ${COLORS.white}; font-size: 18px; font-weight: 600;">
        💰 You've earned $${data.paymentAmount.toFixed(2)}!
      </p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Earnings', data.earningsUrl)}
      ${button('View Order', data.orderUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Great job! Keep up the excellent work and encourage your client to leave a review. 🌟
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #5: Application Submitted - Client Notification
 */
export function applicationReceivedClientEmail(data: {
  projectTitle: string;
  freelancerName: string;
  freelancerRating?: number;
  freelancerLocation?: string;
  proposedBudget: number;
  proposedTimeline: string;
  coverLetterExcerpt: string;
  totalApplications: number;
  proposalUrl: string;
  allProposalsUrl: string;
}): string {
  const ratingStars = data.freelancerRating
    ? '⭐'.repeat(Math.round(data.freelancerRating))
    : 'New freelancer';

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">📬 New Proposal Received!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      You've received a new proposal for your project: <strong>${data.projectTitle}</strong>
    </p>

    <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: ${COLORS.navy}; font-size: 18px;">
        ${data.freelancerName} ${ratingStars}
      </h3>
      ${data.freelancerLocation ? `<p style="margin: 0 0 10px 0; color: ${COLORS.gray}; font-size: 14px;">📍 ${data.freelancerLocation}</p>` : ''}

      ${infoBox('Proposed Budget', `$${data.proposedBudget.toFixed(2)}`)}
      ${infoBox('Proposed Timeline', data.proposedTimeline)}

      <div style="margin: 15px 0 0 0;">
        <p style="margin: 0 0 5px 0; color: ${COLORS.gray}; font-size: 14px; font-weight: 600;">Cover Letter Preview:</p>
        <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6; font-style: italic;">
          "${data.coverLetterExcerpt}..."
        </p>
      </div>
    </div>

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6;">
      You now have <strong>${data.totalApplications}</strong> proposal${data.totalApplications !== 1 ? 's' : ''} for this project.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Proposal', data.proposalUrl)}
      ${button('View All Proposals', data.allProposalsUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Review all proposals carefully and choose the freelancer that best fits your project needs.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #6: Password Reset Request
 */
export function passwordResetEmail(data: {
  firstName: string;
  resetToken: string;
  resetUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">🔐 Reset Your Password</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.firstName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password for your KoiHire account. Click the button below to create a new password:
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('Reset Password', data.resetUrl)}
    </div>

    <div style="background-color: ${COLORS.lightGray}; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${COLORS.orange};">
      <p style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 14px; font-weight: 600;">
        ⏰ This link expires in 1 hour
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 13px; line-height: 1.5;">
        For security reasons, this password reset link will only work once and expires in 1 hour.
      </p>
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin: 10px 0 20px 0; color: ${COLORS.teal}; font-size: 13px; word-break: break-all; background-color: ${COLORS.lightGray}; padding: 10px; border-radius: 4px;">
      ${data.resetUrl}
    </p>

    <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
        <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.
      </p>
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Need help? Contact our support team at <a href="mailto:support@koihire.com" style="color: ${COLORS.orange}; text-decoration: none;">support@koihire.com</a>
    </p>
  `;

  return emailWrapper(content);
}

// ==================== PHASE 1: CRITICAL EMAIL TEMPLATES ====================

/**
 * EMAIL #7: Application Accepted - Freelancer Notification
 */
export function applicationAcceptedFreelancerEmail(data: {
  freelancerName: string;
  projectTitle: string;
  clientName: string;
  agreedAmount: number;
  projectUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">🎉 Congratulations! You've Been Hired!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Great news! <strong>${data.clientName}</strong> has accepted your application for the project:
    </p>

    <div style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: ${COLORS.white}; font-size: 18px; font-weight: 600;">
        "${data.projectTitle}"
      </p>
    </div>

    ${infoBox('Agreed Budget', `$${data.agreedAmount.toFixed(2)}`)}

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      The client will now fund the escrow, and you'll be notified when funds are secured and you can begin work.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Project', data.projectUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Deliver excellent work to build your reputation on KoiHire. Good luck! 🚀
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #8: Application Rejected - Freelancer Notification
 */
export function applicationRejectedFreelancerEmail(data: {
  freelancerName: string;
  projectTitle: string;
  browseProjectsUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">Application Update</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      We wanted to let you know that the client has selected another freelancer for the project:
    </p>

    ${infoBox('Project', data.projectTitle)}

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Don't be discouraged! Competition is normal, and there are many other opportunities waiting for you.
    </p>

    <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 16px;">Tips for Your Next Application:</h3>
      <ul style="margin: 0; padding-left: 20px; color: ${COLORS.navy}; font-size: 14px; line-height: 1.8;">
        <li>Tailor your cover letter to each project</li>
        <li>Highlight relevant experience and portfolio pieces</li>
        <li>Be competitive with your proposed timeline and budget</li>
        <li>Respond quickly to new project postings</li>
      </ul>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      ${button('Browse New Projects', data.browseProjectsUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Keep applying - your perfect project is out there! 💪
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #9: Work Submitted for Review - Client Notification
 */
export function workSubmittedClientEmail(data: {
  clientName: string;
  projectTitle: string;
  freelancerName: string;
  submissionTitle: string;
  submissionNumber: number;
  projectUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">📬 Work Submitted for Your Review</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.clientName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      <strong>${data.freelancerName}</strong> has submitted work for your review on the project:
    </p>

    ${infoBox('Project', data.projectTitle)}
    ${infoBox('Submission', `#${data.submissionNumber}: ${data.submissionTitle}`)}

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Please review the submitted work and either approve it or request revisions if changes are needed.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('Review Submission', data.projectUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <div style="background-color: ${COLORS.lightGray}; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${COLORS.orange};">
      <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6;">
        <strong>Note:</strong> Once you approve the work, payment will be automatically released to the freelancer.
      </p>
    </div>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #10: Work Approved - Freelancer Notification
 */
export function workApprovedFreelancerEmail(data: {
  freelancerName: string;
  projectTitle: string;
  clientName: string;
  projectUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">✅ Your Work Has Been Approved!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Great news! <strong>${data.clientName}</strong> has approved your work on the project:
    </p>

    <div style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: ${COLORS.white}; font-size: 18px; font-weight: 600;">
        "${data.projectTitle}"
      </p>
    </div>

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Your payment is being processed and will be released to your account shortly. You'll receive a confirmation email once the transfer is complete.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Project', data.projectUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Excellent work! Consider asking the client for a review to boost your profile. 🌟
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #11: Project Payment Released - Freelancer Notification
 */
export function projectPaymentReleasedFreelancerEmail(data: {
  freelancerName: string;
  projectTitle: string;
  clientName: string;
  paymentAmount: number;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">💰 Payment Released!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Your payment for the completed project has been released to your account!
    </p>

    ${infoBox('Project', data.projectTitle)}
    ${infoBox('Client', data.clientName)}

    <div style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 5px 0; color: ${COLORS.white}; font-size: 14px;">Amount Earned</p>
      <p style="margin: 0; color: ${COLORS.white}; font-size: 28px; font-weight: 700;">
        $${data.paymentAmount.toFixed(2)}
      </p>
    </div>

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      The funds have been transferred to your connected Stripe account and will be available according to your Stripe payout schedule.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('Go to Dashboard', data.dashboardUrl)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Thank you for delivering great work on KoiHire! 🎊
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #12: Changes Requested - Freelancer Notification
 */
export function changesRequestedFreelancerEmail(data: {
  freelancerName: string;
  projectTitle: string;
  clientName: string;
  changeMessage: string;
  revisionsUsed: number;
  maxRevisions: number;
  projectUrl: string;
  dashboardUrl: string;
}): string {
  const revisionsRemaining = data.maxRevisions - data.revisionsUsed;

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">📝 Revision Requested</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      <strong>${data.clientName}</strong> has requested changes to your submission for the project:
    </p>

    ${infoBox('Project', data.projectTitle)}
    ${infoBox('Revisions Used', `${data.revisionsUsed} of ${data.maxRevisions}`)}

    <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 16px;">Client's Feedback:</h3>
      <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6; font-style: italic;">
        "${data.changeMessage}"
      </p>
    </div>

    ${revisionsRemaining > 0 ? `
      <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
        You have <strong>${revisionsRemaining} revision${revisionsRemaining !== 1 ? 's' : ''}</strong> remaining. Please review the feedback and submit your updated work.
      </p>
    ` : `
      <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
          <strong>Note:</strong> This is your final revision. Please ensure all client feedback is addressed.
        </p>
      </div>
    `}

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Feedback & Revise', data.projectUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #13: Service Order Accepted - Client Notification
 */
export function serviceOrderAcceptedClientEmail(data: {
  clientName: string;
  orderNumber: string;
  serviceTitle: string;
  freelancerName: string;
  expectedDeliveryDate: string;
  orderUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">✅ Order Accepted - Work Has Begun!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.clientName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Great news! <strong>${data.freelancerName}</strong> has accepted your order and started working on it.
    </p>

    ${infoBox('Order Number', `#${data.orderNumber}`)}
    ${infoBox('Service', data.serviceTitle)}
    ${infoBox('Expected Delivery', data.expectedDeliveryDate)}

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      You'll receive a notification when the freelancer delivers the completed work. Feel free to message them if you have any questions or additional details to share.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Order', data.orderUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Your payment is securely held in escrow until you approve the delivery.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #14: Revision Requested on Service Order - Freelancer Notification
 */
export function revisionRequestedFreelancerEmail(data: {
  freelancerName: string;
  orderNumber: string;
  serviceTitle: string;
  clientName: string;
  revisionNote: string;
  revisionsUsed: number;
  maxRevisions: number;
  orderUrl: string;
  dashboardUrl: string;
}): string {
  const revisionsRemaining = data.maxRevisions - data.revisionsUsed;

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">📝 Revision Requested on Your Order</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      <strong>${data.clientName}</strong> has requested a revision on their order:
    </p>

    ${infoBox('Order Number', `#${data.orderNumber}`)}
    ${infoBox('Service', data.serviceTitle)}
    ${infoBox('Revisions Used', `${data.revisionsUsed} of ${data.maxRevisions}`)}

    <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 16px;">Client's Feedback:</h3>
      <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6; font-style: italic;">
        "${data.revisionNote}"
      </p>
    </div>

    ${revisionsRemaining > 0 ? `
      <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
        You have <strong>${revisionsRemaining} revision${revisionsRemaining !== 1 ? 's' : ''}</strong> remaining for this order.
      </p>
    ` : `
      <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
          <strong>Note:</strong> This is the final revision for this order. Please ensure all client feedback is addressed.
        </p>
      </div>
    `}

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Order & Revise', data.orderUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>
  `;

  return emailWrapper(content);
}

// ==================== PHASE 2: IMPORTANT EMAIL TEMPLATES ====================

/**
 * EMAIL #15: Project Update Posted - Client Notification
 */
export function projectUpdatePostedClientEmail(data: {
  clientName: string;
  projectTitle: string;
  freelancerName: string;
  updateTitle: string;
  updateType: string;
  updateMessage: string;
  projectUrl: string;
  dashboardUrl: string;
}): string {
  const typeEmoji = {
    PROGRESS: '📊',
    MILESTONE: '🎯',
    DELIVERABLE: '📦',
    ISSUE: '⚠️',
    QUESTION: '❓'
  }[data.updateType] || '📝';

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">${typeEmoji} Project Update</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.clientName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      <strong>${data.freelancerName}</strong> has posted an update on your project:
    </p>

    ${infoBox('Project', data.projectTitle)}
    ${infoBox('Update Type', data.updateType.charAt(0) + data.updateType.slice(1).toLowerCase())}

    <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 16px;">${data.updateTitle}</h3>
      <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6;">
        ${data.updateMessage}
      </p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Project', data.projectUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #16: Escrow Funded - Freelancer Notification
 */
export function escrowFundedFreelancerEmail(data: {
  freelancerName: string;
  projectTitle: string;
  clientName: string;
  fundedAmount: number;
  projectUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">🔒 Escrow Funded - Ready to Start!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Great news! <strong>${data.clientName}</strong> has funded the escrow for your project. The payment is now secured and you can begin work.
    </p>

    ${infoBox('Project', data.projectTitle)}

    <div style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 5px 0; color: ${COLORS.white}; font-size: 14px;">Escrow Amount</p>
      <p style="margin: 0; color: ${COLORS.white}; font-size: 28px; font-weight: 700;">
        $${data.fundedAmount.toFixed(2)}
      </p>
    </div>

    <div style="background-color: ${COLORS.lightGray}; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${COLORS.teal};">
      <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6;">
        <strong>What's next?</strong> Start working on the project and keep the client updated on your progress. Once you complete the work, submit it for review.
      </p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      ${button('Start Working', data.projectUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      The payment is securely held in escrow and will be released when the client approves your work.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #17: Order Cancelled - Notification to Both Parties
 */
export function orderCancelledEmail(data: {
  recipientName: string;
  orderNumber: string;
  serviceTitle: string;
  cancelledByName: string;
  cancelledByRole: 'CLIENT' | 'FREELANCER';
  reason?: string;
  ordersUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">Order Cancelled</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.recipientName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      The following order has been cancelled by <strong>${data.cancelledByName}</strong>:
    </p>

    ${infoBox('Order Number', `#${data.orderNumber}`)}
    ${infoBox('Service', data.serviceTitle)}

    ${data.reason ? `
      <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 16px;">Reason:</h3>
        <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6;">
          "${data.reason}"
        </p>
      </div>
    ` : ''}

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      ${data.cancelledByRole === 'CLIENT'
        ? 'If payment was made, a refund will be processed within 5-10 business days.'
        : 'We apologize for any inconvenience. Feel free to browse other services on KoiHire.'}
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Orders', data.ordersUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #18: Welcome Email - New User Registration
 */
export function welcomeEmail(data: {
  firstName: string;
  role: 'CLIENT' | 'FREELANCER';
  dashboardUrl: string;
  settingsUrl: string;
}): string {
  const isClient = data.role === 'CLIENT';

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">🎉 Welcome to KoiHire!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.firstName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Thanks for joining KoiHire! We're excited to have you on board.
    </p>

    <div style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: ${COLORS.white}; font-size: 18px; font-weight: 600;">
        ${isClient ? 'Ready to find amazing talent?' : 'Ready to showcase your skills?'}
      </p>
    </div>

    <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: ${COLORS.navy}; font-size: 16px;">
        ${isClient ? 'Getting Started as a Client:' : 'Getting Started as a Freelancer:'}
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: ${COLORS.navy}; font-size: 14px; line-height: 1.8;">
        ${isClient ? `
          <li>Complete your profile to build trust with freelancers</li>
          <li>Post your first project and describe what you need</li>
          <li>Browse services from talented freelancers</li>
          <li>Review proposals and hire the perfect match</li>
        ` : `
          <li>Complete your profile with skills and portfolio</li>
          <li>Set up Stripe Connect to receive payments</li>
          <li>Create services to showcase your expertise</li>
          <li>Apply to projects that match your skills</li>
        `}
      </ul>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      ${button(isClient ? 'Post a Project' : 'Complete Your Profile', isClient ? `${data.dashboardUrl}/post-project` : data.settingsUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Questions? We're here to help! Contact us at <a href="mailto:support@koihire.com" style="color: ${COLORS.orange}; text-decoration: none;">support@koihire.com</a>
    </p>
  `;

  return emailWrapper(content);
}

// ==================== PHASE 3: NICE-TO-HAVE EMAIL TEMPLATES ====================

/**
 * EMAIL #19: Project Cancelled - Freelancer Notification
 * Only sent if freelancer was assigned to the project
 */
export function projectCancelledFreelancerEmail(data: {
  freelancerName: string;
  projectTitle: string;
  clientName: string;
  reason?: string;
  browseProjectsUrl: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">Project Cancelled</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      We're sorry to inform you that the following project has been cancelled by <strong>${data.clientName}</strong>:
    </p>

    ${infoBox('Project', data.projectTitle)}

    ${data.reason ? `
      <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 16px;">Reason for Cancellation:</h3>
        <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6;">
          "${data.reason}"
        </p>
      </div>
    ` : ''}

    <p style="margin: 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      If escrow was funded, any held funds will be refunded to the client. We apologize for any inconvenience this may cause.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      ${button('Browse New Projects', data.browseProjectsUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Don't let this discourage you! There are many more opportunities waiting on KoiHire.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #20: Service Review Received - Freelancer Notification
 */
export function serviceReviewReceivedFreelancerEmail(data: {
  freelancerName: string;
  serviceTitle: string;
  clientName: string;
  rating: number;
  comment?: string;
  servicesUrl: string;
  dashboardUrl: string;
}): string {
  // Create star rating display
  const fullStars = Math.floor(data.rating);
  const starDisplay = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">⭐ New Review Received!</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.freelancerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      <strong>${data.clientName}</strong> has left a review on your service:
    </p>

    ${infoBox('Service', data.serviceTitle)}

    <div style="background: linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.teal} 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: ${COLORS.white}; font-size: 32px; letter-spacing: 4px;">
        ${starDisplay}
      </p>
      <p style="margin: 5px 0 0 0; color: ${COLORS.white}; font-size: 18px; font-weight: 600;">
        ${data.rating.toFixed(1)} out of 5
      </p>
    </div>

    ${data.comment ? `
      <div style="background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: ${COLORS.navy}; font-size: 16px;">Client's Comment:</h3>
        <p style="margin: 0; color: ${COLORS.navy}; font-size: 14px; line-height: 1.6; font-style: italic;">
          "${data.comment}"
        </p>
      </div>
    ` : ''}

    <div style="margin: 30px 0; text-align: center;">
      ${button('View Your Services', data.servicesUrl)}
      ${button('Go to Dashboard', data.dashboardUrl, false)}
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Great reviews help build your reputation and attract more clients!
    </p>
  `;

  return emailWrapper(content);
}

/**
 * EMAIL #21: Password Changed Confirmation
 */
export function passwordChangedConfirmationEmail(data: {
  firstName: string;
  changedAt: string;
  loginUrl: string;
}): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 24px;">🔐 Password Changed Successfully</h2>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Hi <strong>${data.firstName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; color: ${COLORS.navy}; font-size: 16px; line-height: 1.6;">
      Your KoiHire password was successfully changed on <strong>${data.changedAt}</strong>.
    </p>

    <div style="background-color: #D1FAE5; border: 1px solid #10B981; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #065F46; font-size: 14px; line-height: 1.6;">
        ✅ Your password has been updated. You can now use your new password to log in.
      </p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      ${button('Login to KoiHire', data.loginUrl)}
    </div>

    <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
        <strong>⚠️ Didn't make this change?</strong> If you didn't change your password, your account may have been compromised. Please reset your password immediately and contact our support team.
      </p>
    </div>

    <p style="margin: 20px 0 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Need help? Contact us at <a href="mailto:support@koihire.com" style="color: ${COLORS.orange}; text-decoration: none;">support@koihire.com</a>
    </p>
  `;

  return emailWrapper(content);
}
