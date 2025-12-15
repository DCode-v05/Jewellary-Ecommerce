import { Router } from 'express';
import { getShiprocketToken, createShipRocketOrder, getShipRocketOrders, getOrders, getAllCouriers, checkCourierAvailability, createAWB, createShipment, getAllShipments, getShipmentById, cancelShipment, printManifest, generateLabel, generateInvoice, getOrderById  } from '../controllers/shipRocket.controller';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware';
const router = Router();

router.post('/token', verifyToken, getShiprocketToken);

router.post('/create-order', verifyToken, authorizeRoles("ADMIN"), createShipRocketOrder);

router.get('/get-shiprocket-orders', verifyToken, authorizeRoles("ADMIN"), getShipRocketOrders);

router.get('/orders', verifyToken, authorizeRoles("ADMIN"), getOrders);

router.get('/order/:orderId', verifyToken, authorizeRoles("ADMIN"), getOrderById);

router.get('/couriers', verifyToken, authorizeRoles("ADMIN"), getAllCouriers);

router.post('/check-courier-availability', verifyToken, authorizeRoles("ADMIN"), checkCourierAvailability);

router.post('/create-awb', verifyToken, authorizeRoles("ADMIN"), createAWB);

router.post('/create-shipment', verifyToken, authorizeRoles("ADMIN"), createShipment);

router.get('/get-all-shipments', verifyToken, authorizeRoles("ADMIN"), getAllShipments);

router.get('/get-shipment/:id', verifyToken, authorizeRoles("ADMIN"), getShipmentById);

router.post('/cancel-shipment', verifyToken, authorizeRoles("ADMIN"), cancelShipment);

router.post('/print-manifest', verifyToken, authorizeRoles("ADMIN"), printManifest);

router.post('/generate-label', verifyToken, authorizeRoles("ADMIN"), generateLabel);

router.post('/generate-label', verifyToken, authorizeRoles("ADMIN"), generateLabel);

router.post('/generate-invoice', verifyToken, generateInvoice);

export default router;