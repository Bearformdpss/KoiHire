import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Event type constants
export const PROJECT_EVENT_TYPES = {
  FREELANCER_HIRED: 'FREELANCER_HIRED',
  ESCROW_FUNDED: 'ESCROW_FUNDED',
  FILE_UPLOADED: 'FILE_UPLOADED',
  WORK_SUBMITTED: 'WORK_SUBMITTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  REVISION_SUBMITTED: 'REVISION_SUBMITTED',
  PROJECT_APPROVED: 'PROJECT_APPROVED',
  PAYMENT_RELEASED: 'PAYMENT_RELEASED',
  PROJECT_CANCELLED: 'PROJECT_CANCELLED',
} as const;

export const SERVICE_EVENT_TYPES = {
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  FILE_UPLOADED: 'FILE_UPLOADED',
  DELIVERY_MADE: 'DELIVERY_MADE',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  PAYMENT_RELEASED: 'PAYMENT_RELEASED',
} as const;

interface CreateProjectEventParams {
  projectId: string;
  eventType: string;
  actorId: string | null;
  actorName: string;
  metadata?: any;
}

interface CreateServiceEventParams {
  serviceOrderId: string;
  eventType: string;
  actorId: string | null;
  actorName: string;
  metadata?: any;
}

/**
 * Create a project event for timeline tracking
 * Wrapped in try-catch to prevent event creation failures from breaking main flow
 */
export async function createProjectEvent(params: CreateProjectEventParams): Promise<void> {
  try {
    await prisma.projectEvent.create({
      data: {
        projectId: params.projectId,
        eventType: params.eventType,
        actorId: params.actorId,
        actorName: params.actorName,
        metadata: params.metadata || null,
      },
    });
    console.log(`✅ [EventService] Created project event: ${params.eventType} for project ${params.projectId}`);
  } catch (error) {
    // Log error but don't throw - event creation should never break main functionality
    console.error(`❌ [EventService] Failed to create project event: ${params.eventType}`, error);
  }
}

/**
 * Create a service event for timeline tracking
 * Wrapped in try-catch to prevent event creation failures from breaking main flow
 */
export async function createServiceEvent(params: CreateServiceEventParams): Promise<void> {
  try {
    await prisma.serviceEvent.create({
      data: {
        serviceOrderId: params.serviceOrderId,
        eventType: params.eventType,
        actorId: params.actorId,
        actorName: params.actorName,
        metadata: params.metadata || null,
      },
    });
    console.log(`✅ [EventService] Created service event: ${params.eventType} for order ${params.serviceOrderId}`);
  } catch (error) {
    // Log error but don't throw - event creation should never break main functionality
    console.error(`❌ [EventService] Failed to create service event: ${params.eventType}`, error);
  }
}

/**
 * Get all events for a project in chronological order
 */
export async function getProjectEvents(projectId: string) {
  return await prisma.projectEvent.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get all events for a service order in chronological order
 */
export async function getServiceEvents(serviceOrderId: string) {
  return await prisma.serviceEvent.findMany({
    where: { serviceOrderId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Check if a project has any submission events (to detect revisions)
 */
export async function hasProjectSubmissions(projectId: string): Promise<boolean> {
  const count = await prisma.projectEvent.count({
    where: {
      projectId,
      eventType: {
        in: [PROJECT_EVENT_TYPES.WORK_SUBMITTED, PROJECT_EVENT_TYPES.REVISION_SUBMITTED],
      },
    },
  });
  return count > 0;
}
