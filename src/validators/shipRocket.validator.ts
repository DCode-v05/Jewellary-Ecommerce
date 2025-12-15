import { z } from 'zod';

export const createShipRocketOrderSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    weight: z.number().min(0, 'Weight must be a positive number'),
    length: z.number().min(0, 'Length must be a positive number'),
    breadth: z.number().min(0, 'Breadth must be a positive number'),
    height: z.number().min(0, 'Height must be a positive number')
});

export const getOrderByIdSchema =  z.object({
    orderId: z.string().min(1, 'Order ID is required')
});

export const checkCourierAvailabilitySchema = z.object({
    orderId: z.string().min(1, 'Order ID is required')
});

export const createAWBSchema = z.object({
    shipmentId: z.string().min(1, 'Shipment ID is required'),
    courierId: z.string().min(1, 'Courier ID is required').optional()
});

export const createShipmentSchema = z.object({
    shipmentId: z.string().min(1, 'Shipment ID is required'),
    pickUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid pick-up date format, expected YYYY-MM-DD').optional()
});

export const getShipmentByIdSchema = z.object({
    shipmentId: z.string().min(1, 'Shipment ID is required')
});

export const cancelShipmentSchema = z.object({
    trackingId: z.string().min(1, 'Tracking ID is required')
});

export const printManifestSchema = z.object({
    orderIds: z.array(z.string().min(1, 'Order ID is required'))
});

export const generateLabelSchema = z.object({
    trackingIds: z.array(z.string().min(1, 'Tracking ID is required'))
});

export const generateInvoiceSchema = z.object({
    orderIds: z.array(z.string().min(1, 'Order ID is required'))
});