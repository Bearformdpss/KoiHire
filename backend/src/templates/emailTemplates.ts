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
              <h1 style="margin: 0; color: ${COLORS.navy} !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">KoiHire</h1>
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
