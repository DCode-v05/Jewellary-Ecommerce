import { Request, Response } from 'express';
import { prisma } from "../utils/prisma";
import { createHeroBannerSchema, updateHeroBannerSchema, deleteHeroBannerSchema } from '../validators/default.validators';
import { createFlashSaleSchema, updateFlashSaleSchema, deleteFlashSaleSchema } from '../validators/default.validators';
import { createBannerSchema, updateBannerSchema, deleteBannerSchema } from '../validators/default.validators';
import { createTrendingNowSchema, updateTrendingNowSchema, deleteTrendingNowSchema } from '../validators/default.validators';
import { createShopImageSchema, updateShopImageSchema, deleteShopImageSchema } from '../validators/default.validators';
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
import { deleteFile, uploadFile } from '../utils/manageFile';

/**
 * @swagger
 * components:
 *   schemas:
 *     HeroBanner:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the hero banner
 *         bannerImage:
 *           type: string
 *           description: URL path to the banner image
 *         bannerHeading:
 *           type: string
 *           maxLength: 100
 *           description: Heading text for the banner
 *         bannerBody:
 *           type: string
 *           maxLength: 500
 *           description: Body text content for the banner
 *         altText:
 *           type: string
 *           maxLength: 100
 *           description: Alternative text for accessibility
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     FlashSaleImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the flash sale image
 *         flashSaleImage1:
 *           type: string
 *           description: URL path to the first flash sale image
 *         altText1:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Alternative text for the first image (accessibility)
 *         flashSaleImage2:
 *           type: string
 *           description: URL path to the second flash sale image
 *         altText2:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Alternative text for the second image (accessibility)
 *         flashSaleImage3:
 *           type: string
 *           description: URL path to the third flash sale image
 *         altText3:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Alternative text for the third image (accessibility)
 *         flashSaleImage4:
 *           type: string
 *           description: URL path to the fourth flash sale image
 *         altText4:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Alternative text for the fourth image (accessibility)
 *         body:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           description: Body text content for the flash sale
 *         discountPct:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           nullable: true
 *           description: Discount percentage for the flash sale
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     BannerImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the banner image
 *         imagesUrl:
 *           type: string
 *           description: URL path to the banner image
 *         altText:
 *           type: string
 *           maxLength: 100
 *           description: Alternative text for accessibility
 *         body:
 *           type: string
 *           maxLength: 500
 *           description: Body text content for the banner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     TrendingNowVideo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the trending now video
 *         videosUrl:
 *           type: string
 *           description: URL path to the trending now video
 *         altText:
 *           type: string
 *           maxLength: 100
 *           description: Alternative text for accessibility
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     ShopImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the shop image
 *         imagesUrl:
 *           type: string
 *           description: URL path to the shop image
 *         altText:
 *           type: string
 *           maxLength: 100
 *           description: Alternative text for accessibility
 *         heading:
 *           type: string
 *           maxLength: 100
 *           description: Heading text for the shop image
 *         body:
 *           type: string
 *           maxLength: 500
 *           description: Body text content for the shop image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     ValidationError:
 *       type: object
 *       properties:
 *         error:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               path:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *     
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 */

/**
 * @swagger
 * /api/default/hero-banner/create:
 *   post:
 *     tags:
 *       - Default Images & Videos
 *     summary: Create a new hero banner
 *     description: Upload and create a new hero banner image with optional heading, body text, and alt text. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Hero banner image file (JPG format recommended)
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *               bannerHeading:
 *                 type: string
 *                 maxLength: 100
 *                 description: Heading text for the banner
 *               bannerBody:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the banner
 *     responses:
 *       201:
 *         description: Hero banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hero banner created successfully"
 *                 heroBanner:
 *                   $ref: '#/components/schemas/HeroBanner'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createHeroBanner = async (req: Request, res: Response) => {
    try {
        const data = createHeroBannerSchema.parse(req.body);

        const key = `heroBannerImages/${uuidv4()}.jpg`;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['bannerImage'] && files['bannerImage'][0]) {
            await uploadFile(files['bannerImage'][0], key);
        }
        const heroBanner = await prisma.defaultHeroBannerImages.create({
            data: {
                id: uuidv4(),
                bannerImage: "/" + key,
                bannerHeading: data.bannerHeading || "",
                bannerBody: data.bannerBody || "",
                altText: data.altText || "",
            }
        });
        res.status(201).json({ message: 'Hero banner created successfully', heroBanner });
    } catch (error) {
        console.error('Error creating hero banner:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Creating Hero Banner' });
        }
    }
};

/**
 * @swagger
 * /api/default/hero-banner/get:
 *   get:
 *     tags:
 *       - Default Images & Videos
 *     summary: Get all hero banners
 *     description: Retrieve a list of all hero banner images. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Hero banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 heroBanners:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HeroBanner'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllHeroBanners = async (req: Request, res: Response) => {
    try {
        const heroBanners = await prisma.defaultHeroBannerImages.findMany();
        res.status(200).json({ heroBanners });
    } catch (error) {
        console.error('Error fetching hero banners:', error);
        res.status(500).json({ error: 'Error Fetching Hero Banners' });
    }
};

/**
 * @swagger
 * /api/default/hero-banner/update:
 *   put:
 *     tags:
 *       - Default Images & Videos
 *     summary: Update an existing hero banner
 *     description: Update hero banner image and/or its properties. If a new image is provided, the old image will be replaced. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: New hero banner image file (optional, JPG format recommended)
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the hero banner to update
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *               bannerHeading:
 *                 type: string
 *                 maxLength: 100
 *                 description: Heading text for the banner
 *               bannerBody:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the banner
 *     responses:
 *       200:
 *         description: Hero banner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hero banner updated successfully"
 *                 heroBanner:
 *                   $ref: '#/components/schemas/HeroBanner'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Hero banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateHeroBanner = async (req: Request, res: Response) => {
    try {
        const data = updateHeroBannerSchema.parse(req.body);
        const existingBanner = await prisma.defaultHeroBannerImages.findUnique({
            where: { id: data.id }
        });
        if (!existingBanner) {
            res.status(404).json({ error: 'Hero banner not found' });
            return;
        }
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (req.files && files['bannerImage'] && files['bannerImage'][0]) {
            if (existingBanner.bannerImage) {
                await deleteFile(existingBanner.bannerImage.replace("/", ""));
            }
        }
        const key = `heroBannerImages/${uuidv4()}.jpg`;
        if (req.files && files['bannerImage'] && files['bannerImage'][0]) {
            await uploadFile(files['bannerImage'][0], key);
        }
        const heroBanner = await prisma.defaultHeroBannerImages.update({
            where: { id: data.id },
            data: {
                bannerImage: files?.['bannerImage']?.[0] ? "/" + key : existingBanner.bannerImage,
                bannerHeading: data.bannerHeading || "",
                bannerBody: data.bannerBody || "",
                altText: data.altText || "",
            }
        });
        res.status(200).json({ message: 'Hero banner updated successfully', heroBanner });
    } catch (error) {
        console.error('Error updating hero banner:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Updating Hero Banner'});
        }
    }
};

/**
 * @swagger
 * /api/default/hero-banner/delete:
 *   delete:
 *     tags:
 *       - Default Images & Videos
 *     summary: Delete a hero banner
 *     description: Delete a hero banner and its associated image file from storage. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the hero banner to delete
 *     responses:
 *       200:
 *         description: Hero banner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Hero banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteHeroBanner = async (req: Request, res: Response) => {
    try {
        const data = deleteHeroBannerSchema.parse(req.body);
        const existingBanner = await prisma.defaultHeroBannerImages.findUnique({
            where: { id: data.id }
        });
        if (!existingBanner) {
            res.status(404).json({ error: 'Hero banner not found' });
            return;
        }
        if (existingBanner.bannerImage) {
            await deleteFile(existingBanner.bannerImage.replace("/", ""));
        }
        await prisma.defaultHeroBannerImages.delete({
            where: { id: data.id }
        });
        res.status(200).json({ message: 'Hero banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting hero banner:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Deleting Hero Banner' });
        }
    }
};

/**
 * @swagger
 * /api/default/flash-sale-image/create:
 *   post:
 *     tags:
 *       - Default Images & Videos
 *     summary: Create a new flash sale image
 *     description: Upload and create a new flash sale image with body text, discount percentage, and optional alt text. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - flashSaleImage1
 *               - flashSaleImage2
 *               - flashSaleImage3
 *               - flashSaleImage4
 *             properties:
 *               flashSaleImage1:
 *                 type: string
 *                 format: binary
 *                 description: First flash sale image file (JPG format recommended)
 *               altText1:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the first image (accessibility)
 *               flashSaleImage2:
 *                 type: string
 *                 format: binary
 *                 description: Second flash sale image file (JPG format recommended)
 *               altText2:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the second image (accessibility)
 *               flashSaleImage3:
 *                 type: string
 *                 format: binary
 *                 description: Third flash sale image file (JPG format recommended)
 *               altText3:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the third image (accessibility)
 *               flashSaleImage4:
 *                 type: string
 *                 format: binary
 *                 description: Fourth flash sale image file (JPG format recommended)
 *               altText4:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the fourth image (accessibility)
 *               body:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the flash sale (optional)
 *               discountPct:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage for the flash sale (optional)
 *     responses:
 *       201:
 *         description: Flash sale image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Flash sale image created successfully"
 *                 flashSaleImage:
 *                   $ref: '#/components/schemas/FlashSaleImage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createFlashSaleImage = async (req: Request, res: Response) => {
    try {
        const data = createFlashSaleSchema.parse(req.body);

        let key1 = null;
        let key2 = null;
        let key3 = null;
        let key4 = null;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['flashSaleImage1'] && files['flashSaleImage1'][0]) {
            key1 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage1'][0], key1);
        }

        if (files['flashSaleImage2'] && files['flashSaleImage2'][0]) {
            key2 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage2'][0], key2);
        }

        if (files['flashSaleImage3'] && files['flashSaleImage3'][0]) {
            key3 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage3'][0], key3);
        }

        if (files['flashSaleImage4'] && files['flashSaleImage4'][0]) {
            key4 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage4'][0], key4);
        }
        const flashSaleImage = await prisma.defaultFlashSaleImages.create({
            data: {
                id: uuidv4(),
                imagesUrl1: "/" + key1,
                imagesUrl2: "/" + key2,
                imagesUrl3: "/" + key3,
                imagesUrl4: "/" + key4,
                altText1: data.altText1 || "",
                altText2: data.altText2 || "",
                altText3: data.altText3 || "",
                altText4: data.altText4 || "",
                body: data.body,
                discountPct: Number(data.discountPct)
            }
        });
        res.status(201).json({ message: 'Flash sale image created successfully', flashSaleImage });
    } catch (error) {
        console.error('Error creating flash sale image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Creating Flash Sale Image', detail: error instanceof Error ? error.message : String(error) });
        }
    }
};

/**
 * @swagger
 * /api/default/flash-sale-image/get:
 *   get:
 *     tags:
 *       - Default Images & Videos
 *     summary: Get all flash sale images
 *     description: Retrieve a list of all flash sale images. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Flash sale images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flashSaleImages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FlashSaleImage'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllFlashSaleImages = async (req: Request, res: Response) => {
    try {
        const flashSaleImages = await prisma.defaultFlashSaleImages.findMany();
        res.status(200).json({ flashSaleImages });
    } catch (error) {
        console.error('Error fetching flash sale images:', error);
        res.status(500).json({ error: 'Error Fetching Flash Sale Images' });
    }
};

/**
 * @swagger
 * /api/default/flash-sale-image/update:
 *   put:
 *     tags:
 *       - Default Images & Videos
 *     summary: Update an existing flash sale image
 *     description: Update flash sale image and/or its properties including alt text, body text, and discount percentage. If a new image is provided, the old image will be replaced. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the flash sale image to update
 *               flashSaleImage1:
 *                 type: string
 *                 format: binary
 *                 description: New first flash sale image file (optional, JPG format recommended)
 *               altText1:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the first image (accessibility)
 *               flashSaleImage2:
 *                 type: string
 *                 format: binary
 *                 description: New second flash sale image file (optional, JPG format recommended)
 *               altText2:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the second image (accessibility)
 *               flashSaleImage3:
 *                 type: string
 *                 format: binary
 *                 description: New third flash sale image file (optional, JPG format recommended)
 *               altText3:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the third image (accessibility)
 *               flashSaleImage4:
 *                 type: string
 *                 format: binary
 *                 description: New fourth flash sale image file (optional, JPG format recommended)
 *               altText4:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for the fourth image (accessibility)
 *               body:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the flash sale
 *               discountPct:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage for the flash sale
 *     responses:
 *       200:
 *         description: Flash sale image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Flash sale image updated successfully"
 *                 flashSaleImage:
 *                   $ref: '#/components/schemas/FlashSaleImage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Flash sale image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateFlashSaleImage = async (req: Request, res: Response) => {
    try {
        const data = updateFlashSaleSchema.parse(req.body);
        const existingFlashSaleImage = await prisma.defaultFlashSaleImages.findUnique({
            where: { id: data.id }
        });
        if (!existingFlashSaleImage) {
            res.status(404).json({ error: 'Flash sale image not found' });
            return;
        }
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        if (req.files && files['flashSaleImage1'] && files['flashSaleImage1'][0]) {
            if (existingFlashSaleImage.imagesUrl1) {
                await deleteFile(existingFlashSaleImage.imagesUrl1.replace("/", ""));
            }
        }
        let key1 = null;
        if (req.files && files['flashSaleImage1'] && files['flashSaleImage1'][0]) {
            key1 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage1'][0], key1);
        }

        if (req.files && files['flashSaleImage2'] && files['flashSaleImage2'][0]) {
            if (existingFlashSaleImage.imagesUrl2) {
                await deleteFile(existingFlashSaleImage.imagesUrl2.replace("/", ""));
            }
        }
        let key2 = null;
        if (req.files && files['flashSaleImage2'] && files['flashSaleImage2'][0]) {
            key2 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage2'][0], key2);
        }

        if (req.files && files['flashSaleImage3'] && files['flashSaleImage3'][0]) {
            if (existingFlashSaleImage.imagesUrl3) {
                await deleteFile(existingFlashSaleImage.imagesUrl3.replace("/", ""));
            }
        }
        let key3 = null;
        if (req.files && files['flashSaleImage3'] && files['flashSaleImage3'][0]) {
            key3 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage3'][0], key3);
        }

        if (req.files && files['flashSaleImage4'] && files['flashSaleImage4'][0]) {
            if (existingFlashSaleImage.imagesUrl4) {
                await deleteFile(existingFlashSaleImage.imagesUrl4.replace("/", ""));
            }
        }
        let key4 = null;
        if (req.files && files['flashSaleImage4'] && files['flashSaleImage4'][0]) {
            key4 = `flashSaleImages/${uuidv4()}.jpg`;
            await uploadFile(files['flashSaleImage4'][0], key4);
        }
        const flashSaleImage = await prisma.defaultFlashSaleImages.update({
            where: { id: data.id },
            data: {
                imagesUrl1: files?.['flashSaleImage1']?.[0] ? "/" + key1 : existingFlashSaleImage.imagesUrl1,
                imagesUrl2: files?.['flashSaleImage2']?.[0] ? "/" + key2 : existingFlashSaleImage.imagesUrl2,
                imagesUrl3: files?.['flashSaleImage3']?.[0] ? "/" + key3 : existingFlashSaleImage.imagesUrl3,
                imagesUrl4: files?.['flashSaleImage4']?.[0] ? "/" + key4 : existingFlashSaleImage.imagesUrl4,
                altText1: data.altText1 || existingFlashSaleImage.altText1,
                altText2: data.altText2 || existingFlashSaleImage.altText2,
                altText3: data.altText3 || existingFlashSaleImage.altText3,
                altText4: data.altText4 || existingFlashSaleImage.altText4,
                body: data.body || existingFlashSaleImage.body,
                discountPct: Number(data.discountPct) || existingFlashSaleImage.discountPct,
            }
        });
        res.status(200).json({ message: 'Flash sale image updated successfully', flashSaleImage });
    } catch (error) {
        console.error('Error updating flash sale image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Updating Flash Sale Image', detail: error instanceof Error ? error.message : String(error) });
        }
    }
};

/**
 * @swagger
 * /api/default/flash-sale-image/delete:
 *   delete:
 *     tags:
 *       - Default Images & Videos
 *     summary: Delete a flash sale image
 *     description: Delete a flash sale image and its associated image file from storage. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the flash sale image to delete
 *     responses:
 *       200:
 *         description: Flash sale image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Flash sale image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteFlashSaleImage = async (req: Request, res: Response) => {
    try {
        const data = deleteFlashSaleSchema.parse(req.body);
        const existingFlashSaleImage = await prisma.defaultFlashSaleImages.findUnique({
            where: { id: data.id }
        });
        if (!existingFlashSaleImage) {
            res.status(404).json({ error: 'Flash sale image not found' });
            return;
        }
        if (existingFlashSaleImage && existingFlashSaleImage.imagesUrl1) {
            await deleteFile(existingFlashSaleImage.imagesUrl1.replace("/", ""));
        }
        if (existingFlashSaleImage && existingFlashSaleImage.imagesUrl2) {
            await deleteFile(existingFlashSaleImage.imagesUrl2.replace("/", ""));
        }
        if (existingFlashSaleImage && existingFlashSaleImage.imagesUrl3) {
            await deleteFile(existingFlashSaleImage.imagesUrl3.replace("/", ""));
        }
        if (existingFlashSaleImage && existingFlashSaleImage.imagesUrl4) {
            await deleteFile(existingFlashSaleImage.imagesUrl4.replace("/", ""));
        }
        await prisma.defaultFlashSaleImages.delete({
            where: { id: data.id }
        });
        res.status(200).json({ message: 'Flash sale image deleted successfully' });
    } catch (error) {
        console.error('Error deleting flash sale image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Deleting Flash Sale Image' });
        }
    }
};

/**
 * @swagger
 * /api/default/banner-image/create:
 *   post:
 *     tags:
 *       - Default Images & Videos
 *     summary: Create a new banner image
 *     description: Upload and create a new banner image with body text and optional alt text. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file (JPG format recommended)
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *               body:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the banner (required)
 *     responses:
 *       201:
 *         description: Banner image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banner image created successfully"
 *                 bannerImage:
 *                   $ref: '#/components/schemas/BannerImage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createBannerImage = async (req: Request, res: Response) => {
    try {
        const data = createBannerSchema.parse(req.body);

        const key = `bannerImages/${uuidv4()}.jpg`;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['bannerImage'] && files['bannerImage'][0]) {
            await uploadFile(files['bannerImage'][0], key);
        }
        const bannerImage = await prisma.defaultBannerImages.create({
            data: {
                id: uuidv4(),
                imagesUrl: "/" + key,
                altText: data.altText || "",
                body: data.body
            }
        });
        res.status(201).json({ message: 'Banner image created successfully', bannerImage });
    } catch (error) {
        console.error('Error creating banner image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Creating Banner Image' });
        }
    }
};

/**
 * @swagger
 * /api/default/banner-image/get:
 *   get:
 *     tags:
 *       - Default Images & Videos
 *     summary: Get all banner images
 *     description: Retrieve a list of all banner images. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Banner images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bannerImages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BannerImage'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllBannerImages = async (req: Request, res: Response) => {
    try {
        const bannerImages = await prisma.defaultBannerImages.findMany();
        res.status(200).json({ bannerImages });
    } catch (error) {
        console.error('Error fetching banner images:', error);
        res.status(500).json({ error: 'Error Fetching Banner Images' });
    }
};

/**
 * @swagger
 * /api/default/banner-image/update:
 *   put:
 *     tags:
 *       - Default Images & Videos
 *     summary: Update an existing banner image
 *     description: Update banner image and/or its properties including alt text and body text. If a new image is provided, the old image will be replaced. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: New banner image file (optional, JPG format recommended)
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the banner image to update
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *               body:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the banner
 *     responses:
 *       200:
 *         description: Banner image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banner image updated successfully"
 *                 updatedBannerImage:
 *                   $ref: '#/components/schemas/BannerImage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Banner image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateBannerImage = async (req: Request, res: Response) => {
    try {
        const data = updateBannerSchema.parse(req.body);
        const existingBannerImage = await prisma.defaultBannerImages.findUnique({
            where: { id: data.id }
        });
        if (!existingBannerImage) {
            res.status(404).json({ error: 'Banner image not found' });
            return;
        }
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (req.files && files['bannerImage'] && files['bannerImage'][0]) {
            if (existingBannerImage.imagesUrl) {
                await deleteFile(existingBannerImage.imagesUrl.replace("/", ""));
            }
        }
        const key = `bannerImages/${uuidv4()}.jpg`;
        if (req.files && files['bannerImage'] && files['bannerImage'][0]) {
            await uploadFile(files['bannerImage'][0], key);
        }
        const updatedBannerImage = await prisma.defaultBannerImages.update({
            where: { id: data.id },
            data: {
                imagesUrl: files?.['bannerImage']?.[0] ? "/" + key : existingBannerImage.imagesUrl,
                altText: data.altText || existingBannerImage.altText,
                body: data.body || existingBannerImage.body
            }
        });
        res.status(200).json({ message: 'Banner image updated successfully', updatedBannerImage });
    } catch (error) {
        console.error('Error updating banner image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Updating Banner Image' });
        }
    }
};

/**
 * @swagger
 * /api/default/banner-image/delete:
 *   delete:
 *     tags:
 *       - Default Images & Videos
 *     summary: Delete a banner image
 *     description: Delete a banner image and its associated image file from storage. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the banner image to delete
 *     responses:
 *       200:
 *         description: Banner image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Banner image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteBannerImage = async (req: Request, res: Response) => {
    try {
        const data = deleteBannerSchema.parse(req.body);
        const existingBannerImage = await prisma.defaultBannerImages.findUnique({
            where: { id: data.id }
        });
        if (!existingBannerImage) {
            res.status(404).json({ error: 'Banner image not found' });
            return;
        }
        if (existingBannerImage && existingBannerImage.imagesUrl) {
            await deleteFile(existingBannerImage.imagesUrl.replace("/", ""));
        }
        await prisma.defaultBannerImages.delete({
            where: { id: data.id }
        });
        res.status(200).json({ message: 'Banner image deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Deleting Banner Image' });
        }
    }
};

/**
 * @swagger
 * /api/default/trending-now-video/create:
 *   post:
 *     tags:
 *       - Default Images & Videos
 *     summary: Create a new trending now video
 *     description: Upload and create a new trending now video with optional alt text. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               trendingNowVideo:
 *                 type: string
 *                 format: binary
 *                 description: Trending now video file (MP4 format recommended)
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *     responses:
 *       201:
 *         description: Trending Now video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Trending Now video created successfully"
 *                 trendingNowVideo:
 *                   $ref: '#/components/schemas/TrendingNowVideo'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createTrendingNowVideo = async (req: Request, res: Response) => {
    try {
        const data = createTrendingNowSchema.parse(req.body);

        const key = `trendingNow/${uuidv4()}.mp4`;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['trendingNowVideo'] && files['trendingNowVideo'][0]) {
            await uploadFile(files['trendingNowVideo'][0], key);
        }
        const trendingNowVideo = await prisma.defaultTrendingNow.create({
            data: {
                id: uuidv4(),
                videosUrl: "/" + key,
                altText: data.altText || "",
            }
        });
        res.status(201).json({ message: 'Trending Now video created successfully', trendingNowVideo });
    } catch (error) {
        console.error('Error creating Trending Now video:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Creating Trending Now Video' });
        }
    }
};

/**
 * @swagger
 * /api/default/trending-now-video/get:
 *   get:
 *     tags:
 *       - Default Images & Videos
 *     summary: Get all trending now videos
 *     description: Retrieve a list of all trending now videos. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Trending Now videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trendingNowVideos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrendingNowVideo'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllTrendingNowVideos = async (req: Request, res: Response) => {
    try {
        const trendingNowVideos = await prisma.defaultTrendingNow.findMany();
        res.status(200).json({ trendingNowVideos });
    } catch (error) {
        console.error('Error fetching Trending Now videos:', error);
        res.status(500).json({ error: 'Error Fetching Trending Now Videos' });
    }
};

/**
 * @swagger
 * /api/default/trending-now-video/update:
 *   put:
 *     tags:
 *       - Default Images & Videos
 *     summary: Update an existing trending now video
 *     description: Update trending now video and/or its alt text. If a new video is provided, the old video will be replaced. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               trendingNowVideo:
 *                 type: string
 *                 format: binary
 *                 description: New trending now video file (optional, MP4 format recommended)
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the trending now video to update
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *     responses:
 *       200:
 *         description: Trending Now video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Trending Now video updated successfully"
 *                 trendingNowVideo:
 *                   $ref: '#/components/schemas/TrendingNowVideo'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateTrendingNowVideo = async (req: Request, res: Response) => {
    try {
        const data = updateTrendingNowSchema.parse(req.body);
        const existingVideo = await prisma.defaultTrendingNow.findUnique({
            where: { id: data.id }
        });
        if (!existingVideo) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (req.files && files['trendingNowVideo'] && files['trendingNowVideo'][0]) {
            if (existingVideo.videosUrl) {
                await deleteFile(existingVideo.videosUrl.replace("/", ""));
            }
        }
        const key = `trendingNow/${uuidv4()}.mp4`;
        if (req.files && files['trendingNowVideo'] && files['trendingNowVideo'][0]) {
            await uploadFile(files['trendingNowVideo'][0], key);
        }
        const trendingNowVideo = await prisma.defaultTrendingNow.update({
            where: { id: data.id },
            data: {
                videosUrl: files?.['trendingNowVideo']?.[0] ? "/" + key : existingVideo.videosUrl,
                altText: data.altText || existingVideo.altText,
            }
        });
        res.status(200).json({ message: 'Trending Now video updated successfully', trendingNowVideo });
    } catch (error) {
        console.error('Error updating Trending Now video:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Updating Trending Now Video' });
        }
    }
};

/**
 * @swagger
 * /api/default/trending-now-video/delete:
 *   delete:
 *     tags:
 *       - Default Images & Videos
 *     summary: Delete a trending now video
 *     description: Delete a trending now video and its associated video file from storage. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the trending now video to delete
 *     responses:
 *       200:
 *         description: Trending Now video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteTrendingNowVideo = async (req: Request, res: Response) => {
    try {
        const data = deleteTrendingNowSchema.parse(req.body);
        const existingVideo = await prisma.defaultTrendingNow.findUnique({
            where: { id: data.id }
        });
        if (!existingVideo) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        if (existingVideo.videosUrl) {
            await deleteFile(existingVideo.videosUrl.replace("/", ""));
        }
        await prisma.defaultTrendingNow.delete({
            where: { id: data.id }
        });
        res.status(200).json({ message: 'Trending Now video deleted successfully' });
    } catch (error) {
        console.error('Error deleting Trending Now video:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Deleting Trending Now Video' });
        }
    }
};

/**
 * @swagger
 * /api/default/shop-image/create:
 *   post:
 *     tags:
 *       - Default Images & Videos
 *     summary: Create a new shop image
 *     description: Upload and create a new shop image with optional alt text, heading, and body content. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               shopImage:
 *                 type: string
 *                 format: binary
 *                 description: Shop image file (JPG format recommended)
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *               heading:
 *                 type: string
 *                 maxLength: 100
 *                 description: Heading text for the shop image
 *               body:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the shop image
 *     responses:
 *       201:
 *         description: Shop image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Shop image created successfully"
 *                 shopImage:
 *                   $ref: '#/components/schemas/ShopImage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createShopImage = async (req: Request, res: Response) => {
    try {
        const data = createShopImageSchema.parse(req.body);

        const key = `shopImages/${uuidv4()}.jpg`;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['shopImage'] && files['shopImage'][0]) {
            await uploadFile(files['shopImage'][0], key);
        }
        const shopImage = await prisma.defaultShopImages.create({
            data: {
                id: uuidv4(),
                imagesUrl: "/" + key,
                altText: data.altText || "",
                heading: data.heading || "",
                body: data.body || "",
            }
        });
        res.status(201).json({ message: 'Shop image created successfully', shopImage });
    } catch (error) {
        console.error('Error creating Shop image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Creating Shop Image' });
        }
    }
};

/**
 * @swagger
 * /api/default/shop-image/get:
 *   get:
 *     tags:
 *       - Default Images & Videos
 *     summary: Get all shop images
 *     description: Retrieve a list of all shop images. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Shop images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shopImages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShopImage'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllShopImages = async (req: Request, res: Response) => {
    try {
        const shopImages = await prisma.defaultShopImages.findMany();
        res.status(200).json({ shopImages });
    } catch (error) {
        console.error('Error fetching Shop images:', error);
        res.status(500).json({ error: 'Error Fetching Shop Images' });
    }
};

/**
 * @swagger
 * /api/default/shop-image/update:
 *   put:
 *     tags:
 *       - Default Images & Videos
 *     summary: Update an existing shop image
 *     description: Update shop image and/or its properties including alt text, heading, and body content. If a new image is provided, the old image will be replaced. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               shopImage:
 *                 type: string
 *                 format: binary
 *                 description: New shop image file (optional, JPG format recommended)
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the shop image to update
 *               altText:
 *                 type: string
 *                 maxLength: 100
 *                 description: Alternative text for accessibility
 *               heading:
 *                 type: string
 *                 maxLength: 100
 *                 description: Heading text for the shop image
 *               body:
 *                 type: string
 *                 maxLength: 500
 *                 description: Body text content for the shop image
 *     responses:
 *       200:
 *         description: Shop image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Shop image updated successfully"
 *                 shopImage:
 *                   $ref: '#/components/schemas/ShopImage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateShopImage = async (req: Request, res: Response) => {
    try {
        const data = updateShopImageSchema.parse(req.body);
        const existingImage = await prisma.defaultShopImages.findUnique({
            where: { id: data.id }
        });
        if (!existingImage) {
            res.status(404).json({ error: 'Image not found' });
            return;
        }
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (req.files && files['shopImage'] && files['shopImage'][0]) {
            if (existingImage.imagesUrl) {
                await deleteFile(existingImage.imagesUrl.replace("/", ""));
            }
        }
        const key = `shopImages/${uuidv4()}.jpg`;
        if (req.files && files['shopImage'] && files['shopImage'][0]) {
            await uploadFile(files['shopImage'][0], key);
        }
        const shopImage = await prisma.defaultShopImages.update({
            where: { id: data.id },
            data: {
                imagesUrl: files?.['shopImage']?.[0] ? "/" + key : existingImage.imagesUrl,
                altText: data.altText || existingImage.altText,
                heading: data.heading || existingImage.heading,
                body: data.body || existingImage.body,
            }
        });
        res.status(200).json({ message: 'Shop image updated successfully', shopImage });
    } catch (error) {
        console.error('Error updating Shop image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Updating Shop Image' });
        }
    }
};

/**
 * @swagger
 * /api/default/shop-image/delete:
 *   delete:
 *     tags:
 *       - Default Images & Videos
 *     summary: Delete a shop image
 *     description: Delete a shop image and its associated image file from storage. Requires admin authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the shop image to delete
 *     responses:
 *       200:
 *         description: Shop image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Shop Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteShopImage = async (req: Request, res: Response) => {
    try {
        const data = deleteShopImageSchema.parse(req.body);
        const existingImage = await prisma.defaultShopImages.findUnique({
            where: { id: data.id }
        });
        if (!existingImage) {
            res.status(404).json({ error: 'Shop Image not found' });
            return;
        }
        if (existingImage.imagesUrl) {
            await deleteFile(existingImage.imagesUrl.replace("/", ""));
        }
        await prisma.defaultShopImages.delete({
            where: { id: data.id }
        });
        res.status(200).json({ message: 'Shop image deleted successfully' });
    } catch (error) {
        console.error('Error deleting Shop image:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        } else {
            res.status(500).json({ error: 'Error Deleting Shop Image' });
        }
    }
};
